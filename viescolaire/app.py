"""VieScolairePro : logiciel de gestion de la vie scolaire (CPE, enseignants, direction)."""
import base64
import re
import zipfile
from xml.sax.saxutils import escape as xml_escape
import csv
import hashlib
import hmac
import io
import sqlite3
import json
import os
import secrets
import struct
import time
from datetime import date, datetime, timedelta
from functools import wraps

from markupsafe import Markup
from flask import (Flask, Response, abort, flash, g, redirect, render_template, request,
                   send_from_directory, session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from . import db as database
from . import ext
from . import planning
from . import planning_personnel as planpers
from .modeles_defaut import VARIABLES, installer as installer_modeles
from .config import CFG, MODULES

app = Flask(__name__)
os.makedirs(database.DATA_DIR, exist_ok=True)
UPLOAD_DIR = os.path.join(database.DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

_key_file = os.path.join(database.DATA_DIR, "secret_key")
if not os.path.exists(_key_file):
    with open(_key_file, "w") as f:
        f.write(secrets.token_hex(32))
    os.chmod(_key_file, 0o600)
app.secret_key = os.environ.get("VSP_SECRET_KEY") or open(_key_file).read().strip()
app.config.update(
    MAX_CONTENT_LENGTH=8 * 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("VSP_HTTPS") == "1",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=CFG["session_heures"]),
)
app.config["MAX_CONTENT_LENGTH"] = CFG["upload_max_mo"] * 1024 * 1024
if CFG["templates_dir"]:  # gabarits du client prioritaires sur ceux du socle
    from jinja2 import ChoiceLoader, FileSystemLoader
    app.jinja_loader = ChoiceLoader([FileSystemLoader(CFG["templates_dir"]), app.jinja_loader])

STAFF = ("admin", "direction", "cpe")
JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]
FICHIERS_AUTORISES = {e.lower() for e in CFG["fichiers_autorises"]}

# Quels endpoints appartiennent à quel module (un module désactivé répond 404).
MODULE_DES_ENDPOINTS = {
    "professeurs": ["professeurs", "professeur", "professeur_supprimer", "creneau_ajouter", "creneau_supprimer"],
    "emplois_du_temps": ["emploi_du_temps"], "absences": ["absences", "absence_action"],
    "remplacements": ["remplacements", "remplacement_action", "remplacements_auto"], "cours": ["cours", "cours_csv", "perturbation_supprimer"],
    "classes": ["classes", "classe_pp", "classe_renommer", "classe_supprimer", "niveaux_nombre", "niveaux_ajouter", "niveau_modifier", "niveau_supprimer"], "incidents": ["incidents", "incident_action"],
    "messagerie": ["messages", "message_nouveau", "message", "message_confirmer"],
    "reunions": ["reunions", "reunion_repondre", "reunion_supprimer", "reunion_detail", "reunion_convocations_parents"],
    "documents": ["documents", "document_telecharger", "document_supprimer"],
    "taches": ["taches", "tache_action"], "rapports": ["rapports"], "assistant": ["assistant"], "import": ["importer"],
    "utilisateurs": ["utilisateurs", "utilisateur_action", "professeur_compte"], "sauvegarde": ["sauvegarde"],
    "heures": ["heures", "heures_services", "heures_csv"],
    "trombinoscope": ["trombinoscope", "photo", "photo_enregistrer"],
    "personnel": ["pers_liste", "pers_fiche", "pers_supprimer", "pers_dispo_ajouter", "pers_dispo_supprimer", "pers_postes", "pers_poste_modifier",
                  "pers_poste_supprimer", "pers_besoin_ajouter", "pers_besoin_supprimer"],
    "planning_personnel": ["pers_planning", "pers_affectation_creer", "pers_affectation_modifier", "pers_affectation_supprimer", "pers_affectation_copier",
                           "pers_generer", "pers_annuler", "pers_planning_csv"],
    "eleves": ["eleves", "eleves_completer", "eleve_supprimer", "eleve_fiche", "eleve_modifier", "pyramide", "pyramide_csv"],
    "infirmerie": ["infirmerie", "infirmerie_prevenir", "infirmerie_prevenir_jour", "infirmerie_realise", "infirmerie_soins", "infirmerie_soin_action", "infirmerie_passages",
                   "infirmerie_passage_supprimer", "infirmerie_passages_csv", "infirmerie_eleves", "infirmerie_fiche"],
    "redaction": ["documents_parametres", "logo_entete", "document_nouveau", "document_genere", "document_genere_docx", "document_genere_modifier", "document_genere_supprimer",
                  "modeles_documents", "modele_edit", "modele_supprimer", "type_incident_ajouter", "type_incident_modifier", "type_incident_supprimer"],
    "planification": ["planification", "volumes", "planification_parametres", "besoins", "besoin_supprimer", "besoins_depuis_edt", "voeux", "mes_voeux",
                      "generer_edt", "proposition", "proposition_appliquer", "proposition_supprimer"],
}
ENDPOINT_VERS_MODULE = {ep: m for m, eps in MODULE_DES_ENDPOINTS.items() for ep in eps}
EXPORT_VERS_MODULE = {"absences": "absences", "remplacements": "remplacements", "taches": "taches",
                      "incidents": "incidents", "professeurs": "professeurs"}


def module_actif(nom):
    return CFG["modules"].get(nom, True)


def roles_infirmerie():
    """Rôles ayant accès aux données de santé. En démonstration, le CPE y accède aussi pour faciliter la visite."""
    return set(CFG["infirmerie_roles"]) | ({"cpe"} if DEMO else set())


def infirmerie_only(f):
    @wraps(f)
    def wrapper(*a, **kw):
        if g.user["role"] not in roles_infirmerie():
            abort(403)
        return f(*a, **kw)
    return wrapper
TYPES_PERTURBATION = {"annule": "Cours annulé", "salle_indisponible": "Salle indisponible",
                      "deplace": "Cours déplacé", "remplace": "Cours remplacé"}


# ───────────────────────── Base de données & utilitaires ─────────────────────────
def db():
    if "db" not in g:
        g.db = database.connect()
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    con = g.pop("db", None)
    if con:
        con.close()


def q(sql, args=()):
    try:
        return db().execute(sql, args).fetchall()
    except OverflowError:   # entier saisi trop grand pour SQLite : aucun enregistrement ne peut correspondre
        return []


def one(sql, args=()):
    try:
        return db().execute(sql, args).fetchone()
    except OverflowError:
        return None


def run(sql, args=()):
    cur = db().execute(sql, args)
    db().commit()
    return cur.lastrowid


def log(action, detail=""):
    user = getattr(g, "user", None)
    run("INSERT INTO audit(etab_id,user_id,user_nom,action,detail,created_at) VALUES (?,?,?,?,?,?)",
        (getattr(g, "etab_id", None), user["id"] if user else None, user["nom"] if user else "",
         action, detail[:500], datetime.now().isoformat(timespec="seconds")))


def parse_date(s, default=None):
    try:
        return date.fromisoformat(s)
    except (TypeError, ValueError):
        return default or date.today()


def jours_ouvres(d1, d2):
    d = d1
    while d <= d2:
        if d.weekday() < 5:
            yield d
        d += timedelta(days=1)


def fr_date(s):
    try:
        d = date.fromisoformat(s)
        return f"{JOURS[d.weekday()][:3]}. {d.strftime('%d/%m/%Y')}" if d.weekday() < 5 else d.strftime("%d/%m/%Y")
    except (TypeError, ValueError):
        return s or ""


app.jinja_env.filters["fr_date"] = fr_date
app.jinja_env.filters["age"] = lambda iso: age_au(iso, date.today()) if iso else ""


# ───────────────────────── Sécurité : session, CSRF, rôles, MFA ─────────────────────────
def csrf_token():
    if "csrf" not in session:
        session["csrf"] = secrets.token_hex(16)
    return session["csrf"]


app.jinja_env.globals["csrf_token"] = csrf_token


def totp_code(secret, t=None, step=30):
    key = base64.b32decode(secret + "=" * (-len(secret) % 8), casefold=True)
    counter = int((t or time.time()) // step)
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    off = digest[-1] & 0x0F
    return f"{(struct.unpack('>I', digest[off:off + 4])[0] & 0x7FFFFFFF) % 1000000:06d}"


def totp_ok(secret, code):
    code = (code or "").strip().replace(" ", "")
    now = time.time()
    return any(hmac.compare_digest(totp_code(secret, now + d * 30), code) for d in (-1, 0, 1))


_tentatives = {}


def trop_de_tentatives(cle):
    now = time.time()
    essais = [t for t in _tentatives.get(cle, []) if now - t < 900]
    _tentatives[cle] = essais
    return len(essais) >= 8


PALETTES = ("actuel", "ardoise", "petrole")


@app.before_request
def choix_palette():
    """?palette=sapin essaie une palette (mémorisée dans la session) ; ?palette=actuel revient à la palette d'origine."""
    p = request.args.get("palette")
    if p in PALETTES:
        session["palette"] = p
    elif p in ("sapin", "defaut"):   # retour à la palette par défaut
        session["palette"] = ""


@app.before_request
def charger_contexte():
    if request.method == "POST":
        if not hmac.compare_digest(request.form.get("_csrf", ""), session.get("csrf", "x")):
            abort(400, "Jeton de sécurité invalide, rechargez la page.")
    g.user = g.etab_id = g.etab = g.prof = None
    if request.endpoint in ("static", "client_static", "healthz", "login", "mfa", "manifest", "logout") or request.endpoint is None:
        return
    uid = session.get("uid")
    user = one("SELECT * FROM users WHERE id=? AND actif=1", (uid,)) if uid else None
    if not user:
        return redirect(url_for("login"))
    g.user = user
    etabs = q("SELECT e.* FROM etablissements e JOIN user_etabs ue ON ue.etab_id=e.id WHERE ue.user_id=? ORDER BY e.nom",
              (user["id"],))
    if not etabs:
        abort(403)
    g.etabs = etabs
    g.etab = next((e for e in etabs if e["id"] == session.get("etab_id")), etabs[0])
    g.etab_id = g.etab["id"]
    g.prof = one("SELECT * FROM professeurs WHERE user_id=? AND etab_id=?", (user["id"], g.etab_id))
    if user["must_change"] and request.endpoint not in ("compte", "logout"):
        flash("Choisissez un nouveau mot de passe pour continuer.", "err")
        return redirect(url_for("compte"))
    mod = ENDPOINT_VERS_MODULE.get(request.endpoint)
    if mod and not module_actif(mod):
        abort(404)


def staff_only(f):
    @wraps(f)
    def wrapper(*a, **kw):
        if g.user["role"] not in STAFF:
            abort(403)
        return f(*a, **kw)
    return wrapper


@app.after_request
def entetes(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "same-origin"
    resp.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:"
    if g.get("user"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


# ───────────────────────── Menu : une seule définition pour la barre latérale ET les cartes de l'accueil ─────────────────────────
# Pages de détail ou de suite : elles marquent comme active la page du menu dont elles dépendent
PAGE_PARENTE = {"proposition": "planification", "professeur": "professeurs", "eleve_fiche": "eleves", "reunion_detail": "reunions",
                "document_genere": "documents", "modele_edit": "modeles_documents", "message": "messages", "message_nouveau": "messages",
                "pers_fiche": "pers_liste", "infirmerie_fiche": "infirmerie_eleves", "document_telecharger": "documents", "pers_planning_csv": "pers_planning"}


def menu_sections():
    """Rubriques du menu (barre latérale et cartes de l'accueil) selon le rôle et les modules actifs : titre, pages, compteurs."""
    u, ma = g.user, module_actif
    staff = u["role"] in STAFF
    today = date.today()
    nb = {"messages": one("SELECT COUNT(*) c FROM message_dest md JOIN messages m ON m.id=md.message_id WHERE md.user_id=? AND m.etab_id=? AND md.lu_at IS NULL",
                          (u["id"], g.etab_id))["c"]}
    if staff:
        nb["remplacements"] = one("SELECT COUNT(*) c FROM remplacements WHERE etab_id=? AND statut='a_pourvoir' AND date>=?", (g.etab_id, today.isoformat()))["c"]
        nb["incidents"] = one("SELECT COUNT(*) c FROM incidents WHERE etab_id=? AND statut='ouvert'", (g.etab_id,))["c"]
        nb["taches"] = one("SELECT COUNT(*) c FROM taches WHERE etab_id=? AND statut<>'faite'", (g.etab_id,))["c"]
        nb["absences"] = one("SELECT COUNT(*) c FROM absences WHERE etab_id=? AND type='absence' AND date_debut<=? AND date_fin>=?",
                             (g.etab_id, today.isoformat(), today.isoformat()))["c"]
    infirmerie_ok = u["role"] in roles_infirmerie() and ma("infirmerie")

    def item(ep, label, ico, desc="", mod=None, badge=None, **kw):
        if mod and not ma(mod):
            return None
        on = request.endpoint == ep or PAGE_PARENTE.get(request.endpoint) == ep
        return {"label": label, "ico": ico, "desc": desc, "url": url_for(ep, **kw), "badge": badge or None, "on": on}

    def section(titre, items, ouvert=True):
        items = [i for i in items if i]
        return {"titre": titre, "pages": items, "ouvert": ouvert} if items else None

    compte = [item("compte", "Sécurité", "securite", "Mot de passe, double authentification"), item("rgpd", "RGPD", "rgpd", "Mes données personnelles")]
    sortie = item("logout", "Déconnexion", "sortie")
    if staff:
        sections = [
            section("1. Élèves et vie scolaire", [
                item("eleves", "Liste des élèves", "eleve", "Fiches, responsables, import", "eleves"),
                item("pyramide", "Pyramide des âges", "barres", "Répartition par âge et par sexe", "eleves"),
                item("classes", "Classes et niveaux", "classes", "Professeur principal, niveaux", "classes"),
                item("trombinoscope", "Trombinoscope", "photo", "Photos par classe", "trombinoscope"),
                item("absences", "Absences", "absence", "Déclarer et suivre les absences", "absences", nb["absences"]),
                item("remplacements", "Remplacements", "remplace", "Désigner les remplaçants", "remplacements", nb["remplacements"], statut="a_pourvoir"),
                item("cours", "Cours perturbés", "alerte", "Analyse des cours touchés", "cours"),
                item("incidents", "Incidents", "incident", "Signaler et rédiger les documents", "incidents", nb["incidents"]),
                item("infirmerie", "Infirmerie", "sante", "Tableau de bord du jour") if infirmerie_ok else None,
                item("infirmerie_soins", "Planning des soins", "calendrier", "Soins programmés") if infirmerie_ok else None,
                item("infirmerie_passages", "Passages à l'infirmerie", "sante", "Registre des passages") if infirmerie_ok else None,
                item("infirmerie_eleves", "Fiches santé", "dossier", "Allergies, PAI, traitements") if infirmerie_ok else None,
                item("messages", "Messagerie", "message", "Messages internes", "messagerie", nb["messages"])]),
            section("2. Personnel", [
                item("professeurs", "Annuaire des professeurs", "profs", "Coordonnées, cours, comptes", "professeurs"),
                item("pers_liste", "Annuaire du personnel de vie scolaire", "personnel", "Assistants et rôles", "personnel"),
                item("emploi_du_temps", "Emplois du temps", "calendrier", "Jour, semaine, mois", "emplois_du_temps"),
                item("pers_planning", "Planning du personnel", "horloge", "Planning automatique", "planning_personnel"),
                item("heures", "Comptage des heures", "barres", "Heures par professeur, classe, agent", "heures"),
                item("pers_postes", "Postes et besoins", "postes", "Rôles, couleurs, besoins", "personnel")]),
            section("3. Planification et suivi", [
                item("volumes", "Volumes horaires par niveau", "calendrier", "Heures par matière et par niveau", "planification"),
                item("planification", "Génération des emplois du temps", "generer", "Lancer le calcul et relire la proposition", "planification"),
                item("besoins", "Besoins en heures", "postes", "Classe × matière × professeur", "planification"),
                item("voeux", "Vœux des professeurs", "voeux", "Indisponibilités et souhaits", "planification"),
                item("planification_parametres", "Réglages de l'établissement", "generer", "Horaires, demi-journées sans cours", "planification"),
                item("taches", "Tâches", "taches", "À faire", "taches", nb["taches"]),
                item("rapports", "Rapports", "rapports", "Chiffres sur une période", "rapports"),
                item("assistant", "Assistant", "assistant", "Conseils automatiques", "assistant"),
                item("importer", "Import CSV", "import", "Professeurs, élèves, cours", "import"),
                item("historique", "Historique", "historique", "Journal des actions")]),
            section("4. Documents et réunions", [
                item("reunions", "Réunions", "reunion", "Convocations, réponses", "reunions"),
                item("document_nouveau", "Rédiger un document", "redaction", "Rapports, convocations…", "redaction"),
                item("documents", "Documents", "dossier", "Partagés et rédigés", "documents"),
                item("modeles_documents", "Modèles et types d'incident", "redaction", "Textes types des documents", "redaction"),
                item("documents_parametres", "En-tête et signataires", "dossier", "Commun à tous les documents", "redaction")]),
            section("5. Administration", [
                item("utilisateurs", "Utilisateurs", "utilisateurs", "Comptes et droits", "utilisateurs"),
                item("etablissements", "Établissements", "etablissement", "Ajouter ou supprimer") if u["role"] == "admin" else None,
                item("sauvegarde", "Sauvegarde", "sauvegarde", "Copie des données", "sauvegarde") if u["role"] in ("admin", "direction") else None] + compte),
            section("6. Mon compte", [sortie]),
        ]
    elif g.prof:
        sections = [
            section("Mon espace", [
                item("emploi_du_temps", "Mon emploi du temps", "calendrier", "Mes cours", "emplois_du_temps"),
                item("absences", "Mes absences", "absence", "Déclarer une absence", "absences"),
                item("mes_voeux", "Mes vœux", "voeux", "Disponibilités pour l'emploi du temps", "planification"),
                item("messages", "Messagerie", "message", "Messages internes", "messagerie", nb["messages"])], True),
            section("Classes et documents", [
                item("trombinoscope", "Trombinoscope", "photo", "Photos par classe", "trombinoscope"),
                item("document_nouveau", "Rédiger un document", "redaction", "Rapport d'incident…", "redaction"),
                item("reunions", "Réunions", "reunion", "Convocations", "reunions"),
                item("documents", "Documents", "dossier", "Partagés et rédigés", "documents")]),
            section("Mon compte", compte + [sortie]),
        ]
    else:
        sections = [
            section("Au quotidien", [
                item("messages", "Messagerie", "message", "Messages internes", "messagerie", nb["messages"]),
                item("infirmerie", "Infirmerie", "sante", "Soins, passages, fiches santé") if infirmerie_ok else None,
                item("reunions", "Réunions", "reunion", "Convocations", "reunions"),
                item("documents", "Documents", "dossier", "Partagés", "documents")], True),
            section("Mon compte", compte + [sortie]),
        ]
    return [x for x in sections if x]


@app.context_processor
def contexte():
    pal = session.get("palette") if "palette" in session else CFG.get("palette", "")
    ctx = {"palette": pal if pal in PALETTES else "", "STAFF": STAFF, "JOURS": JOURS, "today": date.today().isoformat(), "TYPES_PERTURBATION": TYPES_PERTURBATION,
           "cfg": CFG, "demo": DEMO, "module_actif": module_actif, "ext_nav": [], "ext_widgets": [],
           "infirmerie_ok": bool(g.get("user")) and g.user["role"] in roles_infirmerie()}
    if g.get("user"):
        for item in ext.NAV:
            if g.user["role"] in item["roles"]:
                cible = item["cible"]
                try:
                    url = cible if cible.startswith("/") else url_for(cible)
                except Exception:
                    continue
                ctx["ext_nav"].append({"libelle": item["libelle"], "url": url})
        if request.endpoint == "dashboard" and g.user["role"] in STAFF:
            for w in ext.WIDGETS:
                try:
                    ctx["ext_widgets"].append({"titre": w["titre"], "html": Markup(w["fn"]())})
                except Exception:
                    ext.journal.exception("Widget %s en erreur", w["titre"])
    if g.get("user") and g.get("etab_id"):
        ctx["menu"] = menu_sections()
        ctx["role_libelle"] = ROLES.get(g.user["role"], g.user["role"])
        ctx["non_lus"] = one("SELECT COUNT(*) c FROM message_dest md JOIN messages m ON m.id=md.message_id "
                             "WHERE md.user_id=? AND m.etab_id=? AND md.lu_at IS NULL", (g.user["id"], g.etab_id))["c"]
    return ctx


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        cle = (request.remote_addr, email)
        if trop_de_tentatives(cle):
            flash("Trop de tentatives, réessayez dans 15 minutes.", "err")
            return render_template("login.html"), 429
        user = one("SELECT * FROM users WHERE email=? AND actif=1", (email,))
        if user and check_password_hash(user["pwd_hash"], request.form.get("password", "")):
            session.clear()
            if user["totp_secret"]:
                session["pending_uid"] = user["id"]
                return redirect(url_for("mfa"))
            session.permanent = True
            session["uid"] = user["id"]
            g.user = user
            log("connexion", email)
            ext.emit("connexion", user_id=user["id"])
            return redirect(url_for("dashboard"))
        _tentatives.setdefault(cle, []).append(time.time())
        flash("Identifiants incorrects.", "err")
    return render_template("login.html")


@app.route("/mfa", methods=["GET", "POST"])
def mfa():
    uid = session.get("pending_uid")
    user = one("SELECT * FROM users WHERE id=?", (uid,)) if uid else None
    if not user:
        return redirect(url_for("login"))
    if request.method == "POST":
        cle = (request.remote_addr, user["email"])
        if trop_de_tentatives(cle):
            flash("Trop de tentatives, réessayez plus tard.", "err")
        elif totp_ok(user["totp_secret"], request.form.get("code")):
            session.clear()
            session.permanent = True
            session["uid"] = user["id"]
            g.user = user
            log("connexion (MFA)", user["email"])
            ext.emit("connexion", user_id=user["id"])
            return redirect(url_for("dashboard"))
        else:
            _tentatives.setdefault(cle, []).append(time.time())
            flash("Code invalide.", "err")
    return render_template("mfa.html")


@app.route("/logout", methods=["POST", "GET"])
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/etablissement", methods=["POST"])
def changer_etab():
    eid = request.form.get("etab", type=int)
    if any(e["id"] == eid for e in g.etabs):
        session["etab_id"] = eid
    return redirect(request.referrer or url_for("dashboard"))


@app.route("/healthz")
def healthz():
    return "ok"


@app.route("/client-static/<path:chemin>")
def client_static(chemin):
    if not CFG["static_dir"]:
        abort(404)
    return send_from_directory(CFG["static_dir"], chemin)


@app.route("/manifest.webmanifest")
def manifest():
    return Response(json.dumps({
        "name": CFG["produit"], "short_name": CFG["produit"][:12], "start_url": "/", "display": "standalone",
        "background_color": "#F4EBD7", "theme_color": CFG["couleur"], "lang": "fr",
        "icons": [{"src": "/static/icon.svg", "sizes": "any", "type": "image/svg+xml"}]}),
        mimetype="application/manifest+json")


# ───────────────────────── Cours, absences, remplacements (cœur métier) ─────────────────────────
def prof_absent(prof_id, jour_iso):
    return one("SELECT * FROM absences WHERE prof_id=? AND type='absence' AND date_debut<=? AND date_fin>=?",
               (prof_id, jour_iso, jour_iso))


def indisponible(prof_id, jour_iso):
    return one("SELECT * FROM absences WHERE prof_id=? AND date_debut<=? AND date_fin>=?",
               (prof_id, jour_iso, jour_iso))


def cours_du_jour(jour, prof_id=None, classe=None):
    """Cours d'une journée avec leur état (normal, absent, remplacé, annulé, salle indisponible...)."""
    iso = jour.isoformat()
    if jour.weekday() > 4:
        return []
    sql = ("SELECT c.*, p.nom pnom, p.prenom pprenom FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
           "WHERE c.etab_id=? AND c.jour=?")
    args = [g.etab_id, jour.weekday()]
    if prof_id:
        sql += " AND c.prof_id=?"
        args.append(prof_id)
    if classe:
        sql += " AND c.classe=?"
        args.append(classe)
    out = []
    for c in q(sql + " ORDER BY c.debut", args):
        d = dict(c)
        d["etat"], d["info"], d["remp_id"] = "normal", "", None
        r = one("SELECT r.*, p.nom, p.prenom FROM remplacements r LEFT JOIN professeurs p ON p.id=r.remplacant_id "
                "WHERE r.creneau_id=? AND r.date=?", (c["id"], iso))
        if r:
            d["remp_id"] = r["id"]
            if r["statut"] == "annule":
                d["etat"], d["info"] = "annule", "Cours annulé"
            elif r["remplacant_id"]:
                d["etat"], d["info"] = "remplace", f"Remplacé par {r['prenom']} {r['nom']}"
            else:
                d["etat"], d["info"] = "a_pourvoir", "Professeur absent : remplacement à prévoir"
        elif indisponible(c["prof_id"], iso):
            d["etat"], d["info"] = "indispo", "Professeur indisponible"
        p = one("SELECT * FROM perturbations WHERE creneau_id=? AND date=?", (c["id"], iso))
        if p:
            d["etat"] = d["etat"] if d["etat"] in ("annule", "a_pourvoir") else "perturbe"
            d["info"] = (d["info"] + " · " if d["info"] else "") + TYPES_PERTURBATION.get(p["type"], p["type"]) + \
                (f" ({p['detail']})" if p["detail"] else "")
        out.append(d)
    return out


def generer_remplacements(absence_id, depuis=None):
    a = one("SELECT * FROM absences WHERE id=?", (absence_id,))
    if not a or a["type"] != "absence":
        return 0
    n = 0
    d1, d2 = parse_date(a["date_debut"]), parse_date(a["date_fin"])
    if depuis:
        d1 = max(d1, depuis)
    for jour in jours_ouvres(d1, min(d2, d1 + timedelta(days=120))):
        for c in q("SELECT id FROM creneaux WHERE prof_id=? AND jour=?", (a["prof_id"], jour.weekday())):
            if not one("SELECT 1 FROM remplacements WHERE creneau_id=? AND date=?", (c["id"], jour.isoformat())):
                db().execute("INSERT INTO remplacements(etab_id,absence_id,creneau_id,date) VALUES (?,?,?,?)",
                             (a["etab_id"], absence_id, c["id"], jour.isoformat()))
                n += 1
    db().commit()
    return n


def chevauche(d1, f1, d2, f2):
    return d1 < f2 and d2 < f1


def conflit_remplacant(prof_id, c, date_iso, sauf_rid=0):
    """Raison pour laquelle le professeur ne peut pas assurer le créneau c à cette date ('' s'il est libre)."""
    if prof_id == c["prof_id"]:
        return "c'est le professeur absent"
    a = indisponible(prof_id, date_iso)
    if a:
        return f"absent ce jour-là ({a['motif'] or 'motif non précisé'})"
    jour = parse_date(date_iso)
    for x in q("SELECT classe,debut,fin FROM creneaux WHERE prof_id=? AND jour=?", (prof_id, jour.weekday())):
        if chevauche(c["debut"], c["fin"], x["debut"], x["fin"]):
            return f"a cours avec la {x['classe']} de {x['debut']} à {x['fin']}"
    for x in q("SELECT cr.classe,cr.debut,cr.fin FROM remplacements rp JOIN creneaux cr ON cr.id=rp.creneau_id "
               "WHERE rp.remplacant_id=? AND rp.date=? AND rp.statut<>'annule' AND rp.id<>?", (prof_id, date_iso, sauf_rid)):
        if chevauche(c["debut"], c["fin"], x["debut"], x["fin"]):
            return f"remplace déjà la {x['classe']} de {x['debut']} à {x['fin']}"
    return ""


def suggerer_remplacants(r, limite=5):
    """Professeurs libres sur le créneau, classés (même matière d'abord, puis moins sollicités)."""
    c = one("SELECT * FROM creneaux WHERE id=?", (r["creneau_id"],))
    jour = parse_date(r["date"])
    depuis = (jour - timedelta(days=30)).isoformat()
    res = []
    for p in q("SELECT * FROM professeurs WHERE etab_id=? AND id<>?", (g.etab_id, c["prof_id"])):
        if conflit_remplacant(p["id"], c, r["date"]):
            continue
        charge = one("SELECT COUNT(*) c FROM remplacements WHERE remplacant_id=? AND date>=?", (p["id"], depuis))["c"]
        meme = p["matiere"].strip().lower() == c["matiere"].strip().lower()
        res.append((0 if meme else 1, charge, p, meme, charge))
    res.sort(key=lambda x: (x[0], x[1], x[2]["nom"]))
    return [{"prof": x[2], "meme_matiere": x[3], "charge": x[4]} for x in res[:limite]]


# ───────────────────────── Tableau de bord ─────────────────────────
def alertes():
    """Alertes et rappels automatiques."""
    a, today = [], date.today()
    nb = one("SELECT COUNT(*) c FROM remplacements WHERE etab_id=? AND statut='a_pourvoir' AND date BETWEEN ? AND ?",
             (g.etab_id, today.isoformat(), (today + timedelta(days=2)).isoformat()))["c"]
    if nb:
        a.append(("err", f"{nb} remplacement(s) à pourvoir dans les 48 h", url_for("remplacements", statut="a_pourvoir")))
    for t in q("SELECT * FROM taches WHERE etab_id=? AND statut<>'faite' AND echeance IS NOT NULL AND echeance<=? "
               "ORDER BY echeance LIMIT 5", (g.etab_id, (today + timedelta(days=2)).isoformat())):
        retard = t["echeance"] < today.isoformat()
        a.append(("err" if retard else "warn", f"Tâche {'en retard' if retard else 'à échéance proche'} : {t['titre']} ({fr_date(t['echeance'])})",
                  url_for("taches")))
    for r in q("SELECT * FROM reunions WHERE etab_id=? AND date BETWEEN ? AND ? ORDER BY date,heure",
               (g.etab_id, today.isoformat(), (today + timedelta(days=1)).isoformat())):
        a.append(("info", f"Réunion {'aujourd’hui' if r['date'] == today.isoformat() else 'demain'} : {r['titre']} {r['heure']}",
                  url_for("reunions")))
    ouverts = one("SELECT COUNT(*) c FROM incidents WHERE etab_id=? AND statut='ouvert'", (g.etab_id,))["c"]
    if ouverts:
        a.append(("warn", f"{ouverts} incident(s) en attente de suite", url_for("incidents")))
    return a


@app.route("/")
def dashboard():
    if g.user["role"] == "infirmier" and module_actif("infirmerie"):
        return redirect(url_for("infirmerie"))
    today = date.today()
    iso = today.isoformat()
    if g.user["role"] not in STAFF:
        mes_cours = cours_du_jour(today, prof_id=g.prof["id"]) if g.prof else []
        reunions_ = q("SELECT * FROM reunions WHERE etab_id=? AND date>=? ORDER BY date LIMIT 5", (g.etab_id, iso))
        return render_template("dashboard_prof.html", cours=mes_cours, reunions=reunions_)
    stats = {
        "profs": one("SELECT COUNT(*) c FROM professeurs WHERE etab_id=?", (g.etab_id,))["c"],
        "absents": one("SELECT COUNT(DISTINCT prof_id) c FROM absences WHERE etab_id=? AND type='absence' "
                       "AND date_debut<=? AND date_fin>=?", (g.etab_id, iso, iso))["c"],
        "remplacements": one("SELECT COUNT(*) c FROM remplacements WHERE etab_id=? AND date=? AND statut='a_pourvoir'",
                             (g.etab_id, iso))["c"],
        "messages": one("SELECT COUNT(*) c FROM message_dest md JOIN messages m ON m.id=md.message_id "
                        "WHERE md.user_id=? AND m.etab_id=? AND md.lu_at IS NULL", (g.user["id"], g.etab_id))["c"],
        "reunions": one("SELECT COUNT(*) c FROM reunions WHERE etab_id=? AND date>=?", (g.etab_id, iso))["c"],
        "taches": one("SELECT COUNT(*) c FROM taches WHERE etab_id=? AND statut<>'faite'", (g.etab_id,))["c"],
    }
    absents = q("SELECT a.*, p.nom, p.prenom FROM absences a JOIN professeurs p ON p.id=a.prof_id "
                "WHERE a.etab_id=? AND a.date_debut<=? AND a.date_fin>=? ORDER BY p.nom", (g.etab_id, iso, iso))
    cours = [c for c in cours_du_jour(today) if c["etat"] != "normal"]
    reunions_ = q("SELECT * FROM reunions WHERE etab_id=? AND date>=? ORDER BY date,heure LIMIT 5", (g.etab_id, iso))
    taches_ = q("SELECT * FROM taches WHERE etab_id=? AND statut<>'faite' ORDER BY echeance IS NULL, echeance LIMIT 5",
                (g.etab_id,))
    return render_template("dashboard.html", stats=stats, absents=absents, cours=cours, reunions=reunions_,
                           taches=taches_, alertes=alertes())


# ───────────────────────── 1. Gestion des professeurs ─────────────────────────
@app.route("/professeurs", methods=["GET", "POST"])
@staff_only
def professeurs():
    if request.method == "POST":
        f = request.form
        if not f.get("nom", "").strip():
            flash("Le nom est obligatoire.", "err")
        else:
            pid = run("INSERT INTO professeurs(etab_id,nom,prenom,matiere,email,telephone) VALUES (?,?,?,?,?,?)",
                      (g.etab_id, f["nom"].strip(), f.get("prenom", "").strip(), f.get("matiere", "").strip(),
                       f.get("email", "").strip(), f.get("telephone", "").strip()))
            log("professeur créé", f"{f['nom']} {f.get('prenom', '')}")
            ext.emit("professeur.cree", prof_id=pid, nom=f["nom"].strip())
            return redirect(url_for("professeur", pid=pid))
    terme = request.args.get("q", "").strip()
    like = f"%{terme}%"
    rows = q("SELECT * FROM professeurs WHERE etab_id=? AND (nom LIKE ? OR prenom LIKE ? OR matiere LIKE ? OR email LIKE ?) "
             "ORDER BY nom, prenom", (g.etab_id, like, like, like, like))
    classes_par_prof = {}
    for c in q("SELECT DISTINCT prof_id, classe FROM creneaux WHERE etab_id=? ORDER BY classe", (g.etab_id,)):
        classes_par_prof.setdefault(c["prof_id"], []).append(c["classe"])
    return render_template("professeurs.html", profs=rows, terme=terme, classes_par_prof=classes_par_prof)


def get_prof(pid):
    p = one("SELECT * FROM professeurs WHERE id=? AND etab_id=?", (pid, g.etab_id))
    if not p:
        abort(404)
    return p


@app.route("/professeurs/<int:pid>", methods=["GET", "POST"])
@staff_only
def professeur(pid):
    p = get_prof(pid)
    if request.method == "POST":
        f = request.form
        run("UPDATE professeurs SET nom=?,prenom=?,matiere=?,email=?,telephone=?,notes=? WHERE id=?",
            (f["nom"].strip(), f.get("prenom", "").strip(), f.get("matiere", "").strip(), f.get("email", "").strip(),
             f.get("telephone", "").strip(), f.get("notes", "").strip(), pid))
        log("fiche professeur modifiée", f"{f['nom']}")
        flash("Fiche enregistrée.", "ok")
        return redirect(url_for("professeur", pid=pid))
    creneaux = q("SELECT * FROM creneaux WHERE prof_id=? ORDER BY jour, debut", (pid,))
    absences_ = q("SELECT * FROM absences WHERE prof_id=? ORDER BY date_debut DESC LIMIT 20", (pid,))
    remps = q("SELECT r.*, c.classe, c.debut, c.fin FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id "
              "WHERE r.remplacant_id=? ORDER BY r.date DESC LIMIT 10", (pid,))
    pp = q("SELECT nom FROM classes WHERE prof_principal_id=?", (pid,))
    return render_template("professeur.html", p=p, creneaux=creneaux, absences=absences_, remps=remps, pp=pp)


@app.route("/professeurs/<int:pid>/supprimer", methods=["POST"])
@staff_only
def professeur_supprimer(pid):
    p = get_prof(pid)
    run("DELETE FROM professeurs WHERE id=?", (pid,))
    log("professeur supprimé", f"{p['nom']} {p['prenom']}")
    flash("Professeur supprimé (ainsi que ses créneaux et absences).", "ok")
    return redirect(url_for("professeurs"))


@app.route("/professeurs/<int:pid>/creneaux", methods=["POST"])
@staff_only
def creneau_ajouter(pid):
    p = get_prof(pid)
    f = request.form
    try:
        jour = int(f["jour"])
        debut, fin = heure_norm(f["debut"]), heure_norm(f["fin"])
        assert 0 <= jour <= 4 and debut and fin and debut < fin and f["classe"].strip()
    except (KeyError, ValueError, AssertionError):
        flash("Créneau invalide (jour, heures au format HH:MM, début avant la fin, et classe requis).", "err")
        return redirect(url_for("professeur", pid=pid))
    run("INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
        (g.etab_id, pid, f["classe"].strip(), f.get("matiere") or p["matiere"], jour, debut, fin, f.get("salle", "").strip()))
    for x in q("SELECT classe,debut,fin FROM creneaux WHERE prof_id=? AND jour=? AND NOT (debut=? AND fin=? AND classe=?)", (pid, jour, debut, fin, f["classe"].strip())):
        if chevauche(debut, fin, x["debut"], x["fin"]):
            flash(f"Attention : {nom_complet(p)} a déjà cours avec la {x['classe']} de {x['debut']} à {x['fin']} ce jour-là.", "err")
    for x in q("SELECT c.debut,c.fin,p.nom FROM creneaux c JOIN professeurs p ON p.id=c.prof_id WHERE c.etab_id=? AND c.classe=? AND c.jour=? AND c.prof_id<>?",
               (g.etab_id, f["classe"].strip(), jour, pid)):
        if chevauche(debut, fin, x["debut"], x["fin"]):
            flash(f"Attention : la classe {f['classe'].strip()} a déjà cours avec {x['nom']} de {x['debut']} à {x['fin']}.", "err")
    log("créneau ajouté", f"{p['nom']} {JOURS[jour]} {debut}")
    return redirect(url_for("professeur", pid=pid))


@app.route("/creneaux/<int:cid>/supprimer", methods=["POST"])
@staff_only
def creneau_supprimer(cid):
    c = one("SELECT * FROM creneaux WHERE id=? AND etab_id=?", (cid, g.etab_id))
    if not c:
        abort(404)
    run("DELETE FROM creneaux WHERE id=?", (cid,))
    log("créneau supprimé", f"{c['classe']} {JOURS[c['jour']]} {c['debut']}")
    return redirect(url_for("professeur", pid=c["prof_id"]))


@app.route("/emploi-du-temps")
def emploi_du_temps():
    vue = request.args.get("vue", "semaine")
    jour = parse_date(request.args.get("date"))
    prof_id = request.args.get("prof", type=int)
    classe = request.args.get("classe") or None
    if g.user["role"] not in STAFF:  # un enseignant ne voit que son emploi du temps
        if not g.prof:
            abort(403)
        prof_id, classe = g.prof["id"], None
    profs = q("SELECT id,nom,prenom FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    ctx = dict(vue=vue, jour=jour, prof_id=prof_id, classe=classe, profs=profs, classes=classes_)
    if vue == "jour":
        return render_template("edt.html", cours=cours_du_jour(jour, prof_id, classe), **ctx)
    if vue == "mois":
        debut = jour.replace(day=1)
        fin = (debut + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        compte = {}
        for j in jours_ouvres(debut, fin):
            compte[j.isoformat()] = {
                "absences": one("SELECT COUNT(*) c FROM absences WHERE etab_id=? AND date_debut<=? AND date_fin>=?"
                                + (" AND prof_id=?" if prof_id else ""),
                                (g.etab_id, j.isoformat(), j.isoformat()) + ((prof_id,) if prof_id else ()))["c"],
                "pert": one("SELECT COUNT(*) c FROM perturbations WHERE etab_id=? AND date=?", (g.etab_id, j.isoformat()))["c"],
            }
        semaines = []
        d = debut - timedelta(days=debut.weekday())
        while d <= fin:
            semaines.append([d + timedelta(days=i) for i in range(5)])
            d += timedelta(days=7)
        return render_template("edt.html", debut=debut, compte=compte, semaines=semaines, **ctx)
    lundi = jour - timedelta(days=jour.weekday())
    semaine = [lundi + timedelta(days=i) for i in range(5)]
    grille = {j.isoformat(): cours_du_jour(j, prof_id, classe) for j in semaine}
    matieres_vues = sorted({c["matiere"] for cs in grille.values() for c in cs if c["matiere"]})
    return render_template("edt.html", semaine=semaine, grille=grille, lundi=lundi, matieres_vues=matieres_vues, **ctx)


# ───────────────────────── Absences, indisponibilités, remplacements ─────────────────────────
def utilisateurs_personnel():
    return [r["id"] for r in q("SELECT u.id FROM users u JOIN user_etabs ue ON ue.user_id=u.id WHERE ue.etab_id=? AND u.actif=1 "
                               "AND u.role IN ('admin','direction','cpe')", (g.etab_id,))]


def notifier(destinataires, sujet, corps):
    """Message interne automatique (ex. remplacement confié) : arrive dans la messagerie des destinataires, jamais à l'expéditeur lui-même."""
    dest = sorted({u for u in destinataires if u and u != g.user["id"]})
    if not dest:
        return 0
    mid = run("INSERT INTO messages(etab_id,sender_id,sujet,corps,cible_type,cible,created_at) VALUES (?,?,?,?,?,?,?)",
              (g.etab_id, g.user["id"], sujet, corps, "auto", "", datetime.now().isoformat(timespec="minutes")))
    for u in dest:
        db().execute("INSERT INTO message_dest(message_id,user_id) VALUES (?,?)", (mid, u))
    db().commit()
    return len(dest)


def detail_remplacement(rid):
    return one("SELECT r.*, c.classe, c.matiere, c.debut, c.fin, c.salle, p.nom pnom, p.prenom pprenom, a.motif, a.date_debut adebut, a.date_fin afin "
               "FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id JOIN professeurs p ON p.id=c.prof_id "
               "LEFT JOIN absences a ON a.id=r.absence_id WHERE r.id=?", (rid,))


def texte_cours(r):
    return f"{r['classe']} ({r['matiere']}), {date_longue(r['date'])}, {r['debut']}–{r['fin']}" + (f", salle {r['salle']}" if r["salle"] else "")


def user_du_prof(pid):
    r = one("SELECT user_id FROM professeurs WHERE id=?", (pid,)) if pid else None
    return r["user_id"] if r else None


def motif_depuis_formulaire(f):
    """Motif choisi dans la liste, avec saisie libre : « Autre » prend le texte saisi, sinon il le complète."""
    choix, libre = f.get("motif_choix", "").strip(), f.get("motif_libre", "").strip()
    if not choix or choix.startswith("Autre"):
        return (libre or "Autre")[:200]
    return (f"{choix} — {libre}" if libre else choix)[:200]


@app.route("/absences", methods=["GET", "POST"])
def absences():
    staff = g.user["role"] in STAFF
    if request.method == "POST":
        f = request.form
        pid = request.form.get("prof_id", type=int) if staff else (g.prof["id"] if g.prof else None)
        p = one("SELECT * FROM professeurs WHERE id=? AND etab_id=?", (pid, g.etab_id)) if pid else None
        d1, d2 = parse_date(f.get("date_debut")), parse_date(f.get("date_fin"), parse_date(f.get("date_debut")))
        if not p or d2 < d1:
            flash("Professeur ou dates invalides.", "err")
        else:
            typ = f.get("type") if f.get("type") in ("absence", "indisponibilite") else "absence"
            aid = run("INSERT INTO absences(etab_id,prof_id,type,date_debut,date_fin,motif,statut) VALUES (?,?,?,?,?,?,?)",
                      (g.etab_id, p["id"], typ, d1.isoformat(), d2.isoformat(), motif_depuis_formulaire(f),
                       "validee" if staff else "declaree"))
            n = generer_remplacements(aid)
            log("absence enregistrée", f"{p['nom']} {d1} → {d2} ({typ})")
            ext.emit("absence.creee", absence_id=aid, prof_id=p["id"], type=typ, date_debut=d1.isoformat(),
                     date_fin=d2.isoformat(), nb_remplacements=n)
            if not staff:   # un enseignant déclare sa propre absence : le personnel est prévenu
                notifier(utilisateurs_personnel(), f"Absence déclarée : {nom_complet(p)}",
                         f"{nom_complet(p)} déclare une {'absence' if typ == 'absence' else 'indisponibilité'} du {d1.strftime('%d/%m/%Y')} au {d2.strftime('%d/%m/%Y')} "
                         f"({motif_depuis_formulaire(f)}).\n{n} cours à remplacer : voir l'onglet Remplacements.")
            if staff and n:
                flash(f"Enregistré : {n} cours à remplacer. Désignez les remplaçants ci-dessous ou utilisez « Pourvoir automatiquement ».", "ok")
                return redirect(url_for("remplacements", absence=aid))
            flash(f"Enregistré. {n} cours à remplacer." if n else "Enregistré.", "ok")
            return redirect(url_for("absences"))
    sql = ("SELECT a.*, p.nom, p.prenom, "
           "(SELECT COUNT(*) FROM remplacements r WHERE r.absence_id=a.id) nb_total, "
           "(SELECT COUNT(*) FROM remplacements r WHERE r.absence_id=a.id AND r.statut IN ('assigne','effectue')) nb_pourvus, "
           "(SELECT COUNT(*) FROM remplacements r WHERE r.absence_id=a.id AND r.statut='annule') nb_annules, "
           "(SELECT COUNT(*) FROM remplacements r WHERE r.absence_id=a.id AND r.statut='a_pourvoir') restants "
           "FROM absences a JOIN professeurs p ON p.id=a.prof_id WHERE a.etab_id=?")
    args = [g.etab_id]
    if not staff:
        sql += " AND a.prof_id=?"
        args.append(g.prof["id"] if g.prof else -1)
    rows = q(sql + " ORDER BY a.date_debut DESC LIMIT 200", args)
    profs = q("SELECT id,nom,prenom FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,)) if staff else []
    return render_template("absences.html", absences=rows, profs=profs, motifs_absence=CFG["motifs_absence"], motifs_indispo=CFG["motifs_indisponibilite"])


@app.route("/absences/<int:aid>/<action>", methods=["POST"])
@staff_only
def absence_action(aid, action):
    a = one("SELECT * FROM absences WHERE id=? AND etab_id=?", (aid, g.etab_id))
    if not a:
        abort(404)
    if action == "valider":
        run("UPDATE absences SET statut='validee' WHERE id=?", (aid,))
        notifier([user_du_prof(a["prof_id"])], "Votre absence a été validée",
                 f"Votre {'absence' if a['type'] == 'absence' else 'indisponibilité'} du {fr_date(a['date_debut'])} au {fr_date(a['date_fin'])} est validée par la vie scolaire.")
    elif action == "supprimer":
        # les remplaçants déjà désignés sur cette absence sont prévenus que leur remplacement tombe
        par_user = {}
        for r in q("SELECT r.id FROM remplacements r WHERE r.absence_id=? AND r.remplacant_id IS NOT NULL AND r.statut='assigne' AND r.date>=?",
                   (aid, date.today().isoformat())):
            d = detail_remplacement(r["id"])
            u = user_du_prof(d["remplacant_id"])
            if u:
                par_user.setdefault(u, []).append(texte_cours(d))
        for u, cours_ in par_user.items():
            notifier([u], "Remplacement annulé", "L'absence est annulée : vous n'avez plus à assurer ce(s) cours :\n- " + "\n- ".join(cours_))
        run("DELETE FROM absences WHERE id=?", (aid,))
    else:
        abort(404)
    log(f"absence {action}", f"prof {a['prof_id']} {a['date_debut']}")
    return redirect(url_for("absences"))


@app.route("/remplacements")
@staff_only
def remplacements():
    statut = request.args.get("statut", "")
    absence_id = request.args.get("absence", type=int)
    sql = ("SELECT r.*, c.classe, c.matiere, c.debut, c.fin, c.salle, p.nom pnom, p.prenom pprenom, "
           "rp.nom rnom, rp.prenom rprenom, a.motif, a.type atype, a.date_debut adebut, a.date_fin afin "
           "FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id "
           "JOIN professeurs p ON p.id=c.prof_id LEFT JOIN professeurs rp ON rp.id=r.remplacant_id LEFT JOIN absences a ON a.id=r.absence_id "
           "WHERE r.etab_id=?")
    args = [g.etab_id]
    absence = None
    if absence_id:
        absence = one("SELECT a.*, p.nom, p.prenom FROM absences a JOIN professeurs p ON p.id=a.prof_id WHERE a.id=? AND a.etab_id=?", (absence_id, g.etab_id))
        if not absence:   # lien d'un autre établissement ou absence supprimée : on revient à la liste au lieu d'une page d'erreur
            flash("Cette absence n'existe pas dans l'établissement affiché (changez d'établissement en haut du menu, ou elle a été supprimée).", "err")
            return redirect(url_for("remplacements"))
        sql += " AND r.absence_id=?"
        args.append(absence_id)
    else:
        sql += " AND r.date>=?"
        args.append((date.today() - timedelta(days=7)).isoformat())
    if statut:
        sql += " AND r.statut=?"
        args.append(statut)
    rows = []
    for r in q(sql + " ORDER BY r.date, c.debut LIMIT 300", args):
        d = dict(r)
        d["suggestions"] = suggerer_remplacants(r, 4) if r["statut"] == "a_pourvoir" else []
        d["semaine"] = parse_date(r["date"]).isocalendar()[1]
        if r["statut"] == "a_pourvoir":   # tous les professeurs avec leur disponibilité, pour un choix éclairé
            c = one("SELECT * FROM creneaux WHERE id=?", (r["creneau_id"],))
            d["autres"] = sorted(((p, conflit_remplacant(p["id"], c, r["date"], r["id"])) for p in
                                  q("SELECT id,nom,prenom,matiere FROM professeurs WHERE etab_id=? AND id<>?", (g.etab_id, c["prof_id"]))),
                                 key=lambda x: (bool(x[1]), x[0]["nom"]))
        rows.append(d)
    nb_attente = sum(1 for r in rows if r["statut"] == "a_pourvoir" and r["date"] >= date.today().isoformat())
    # effectifs par statut sur le même périmètre (sans le filtre de statut), pour les boutons et le message de page vide
    sql_n, args_n = "SELECT statut, COUNT(*) n FROM remplacements WHERE etab_id=?", [g.etab_id]
    if absence_id:
        sql_n += " AND absence_id=?"
        args_n.append(absence_id)
    else:
        sql_n += " AND date>=?"
        args_n.append((date.today() - timedelta(days=7)).isoformat())
    effectifs = {r["statut"]: r["n"] for r in q(sql_n + " GROUP BY statut", args_n)}
    effectifs[""] = sum(effectifs.values())
    return render_template("remplacements.html", rows=rows, statut=statut, absence=absence, nb_attente=nb_attente, effectifs=effectifs)


@app.route("/remplacements/<int:rid>/<action>", methods=["POST"])
@staff_only
def remplacement_action(rid, action):
    r = one("SELECT * FROM remplacements WHERE id=? AND etab_id=?", (rid, g.etab_id))
    if not r:
        abort(404)
    ancien = user_du_prof(r["remplacant_id"]) if r["statut"] == "assigne" else None
    d = detail_remplacement(rid)
    absent = f"{d['pprenom']} {d['pnom']}"
    if action == "assigner":
        pid = request.form.get("prof_id", type=int)
        if not one("SELECT 1 FROM professeurs WHERE id=? AND etab_id=?", (pid, g.etab_id)):
            abort(400)
        creneau = one("SELECT * FROM creneaux WHERE id=?", (r["creneau_id"],))
        conflit = conflit_remplacant(pid, creneau, r["date"], rid)
        if conflit and not request.form.get("forcer"):
            nom = one("SELECT prenom,nom FROM professeurs WHERE id=?", (pid,))
            flash(f"Non assigné : {nom['prenom']} {nom['nom']} {conflit}. Choisissez un professeur libre, ou cochez « malgré le conflit » pour forcer.", "err")
            return redirect(request.referrer or url_for("remplacements"))
        run("UPDATE remplacements SET remplacant_id=?, statut='assigne' WHERE id=?", (pid, rid))
        p_ = one("SELECT prenom,nom FROM professeurs WHERE id=?", (pid,))
        flash(f"{p_['prenom']} {p_['nom']} remplacera {d['classe']} le {fr_date(r['date'])}, {d['debut']}–{d['fin']} "
              f"(semaine {parse_date(r['date']).isocalendar()[1]}){' — en conflit : ' + conflit if conflit else ''}.", "err" if conflit else "ok")
        log("remplacement assigné", f"{r['date']} créneau {r['creneau_id']} → prof {pid}")
        ext.emit("remplacement.assigne", remplacement_id=rid, remplacant_id=pid, date=r["date"])
        nouveau = user_du_prof(pid)
        if ancien and ancien != nouveau:
            notifier([ancien], "Remplacement retiré", f"Vous n'assurez plus ce cours : {texte_cours(d)} (remplacement de {absent}).")
        notifier([nouveau], f"Remplacement : {d['classe']} le {fr_date(r['date'])} à {d['debut']}",
                 f"Vous êtes désigné(e) pour remplacer {absent}.\n\nCours : {texte_cours(d)}\n\nMessage automatique de la vie scolaire.")
    elif action == "annuler-cours":
        run("UPDATE remplacements SET remplacant_id=NULL, statut='annule' WHERE id=?", (rid,))
        log("cours annulé", f"{r['date']} créneau {r['creneau_id']}")
        notifier([ancien], "Remplacement retiré", f"Le cours est annulé : {texte_cours(d)}. Vous n'avez plus à le remplacer.")
    elif action == "reouvrir":
        run("UPDATE remplacements SET remplacant_id=NULL, statut='a_pourvoir' WHERE id=?", (rid,))
        notifier([ancien], "Remplacement retiré", f"Vous n'assurez plus ce cours : {texte_cours(d)} (remplacement de {absent}).")
    elif action == "effectue":
        run("UPDATE remplacements SET statut='effectue' WHERE id=?", (rid,))
    else:
        abort(404)
    return redirect(request.referrer or url_for("remplacements"))


@app.route("/remplacements/auto", methods=["POST"])
@staff_only
def remplacements_auto():
    """Désigne automatiquement, pour chaque cours à pourvoir (à venir), le meilleur remplaçant disponible ; chaque remplaçant reçoit un message récapitulatif."""
    absence_id = request.form.get("absence", type=int)
    sql = ("SELECT r.* FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id WHERE r.etab_id=? AND r.statut='a_pourvoir' AND r.date>=?")
    args = [g.etab_id, date.today().isoformat()]
    if absence_id:
        sql += " AND r.absence_id=?"
        args.append(absence_id)
    total, pourvus, par_user = 0, 0, {}
    for r in q(sql + " ORDER BY r.date, c.debut", args):
        total += 1
        sug = suggerer_remplacants(r, 1)
        if not sug:
            continue
        run("UPDATE remplacements SET remplacant_id=?, statut='assigne' WHERE id=?", (sug[0]["prof"]["id"], r["id"]))
        d = detail_remplacement(r["id"])
        pourvus += 1
        u = user_du_prof(sug[0]["prof"]["id"])
        if u:
            par_user.setdefault(u, []).append(f"{texte_cours(d)} (pour {d['pprenom']} {d['pnom']})")
        ext.emit("remplacement.assigne", remplacement_id=r["id"], remplacant_id=sug[0]["prof"]["id"], date=r["date"])
    for u, cours_ in par_user.items():
        notifier([u], f"Remplacement(s) : {len(cours_)} cours vous sont confiés", "Vous êtes désigné(e) pour :\n- " + "\n- ".join(cours_) + "\n\nMessage automatique de la vie scolaire.")
    log("remplacements pourvus automatiquement", f"{pourvus}/{total}")
    if not total:
        flash("Aucun remplacement à pourvoir.", "ok")
    elif pourvus == total:
        flash(f"{pourvus} remplacement(s) pourvu(s) automatiquement ; les remplaçants ont été prévenus par message.", "ok")
    else:
        flash(f"{pourvus} remplacement(s) sur {total} pourvu(s) ; {total - pourvus} sans professeur libre (à annuler ou réorganiser).", "err" if not pourvus else "ok")
    return redirect(url_for("remplacements", statut="assigne" if pourvus else "", absence=absence_id))


# ───────────────────────── 3. Suivi des cours et coordination ─────────────────────────
def minutes_cours(debut, fin):
    (h1, m1), (h2, m2) = (int(x) for x in debut.split(":")), (int(x) for x in fin.split(":"))
    return (h2 * 60 + m2) - (h1 * 60 + m1)


ETATS_COURS = {"remplace": "Remplacé", "annule": "Annulé", "a_pourvoir": "À pourvoir", "perturbe": "Perturbé (maintenu)", "non_assure": "Non assuré"}


def cours_perturbes(du, au):
    """Tous les cours perturbés d'une période, toutes causes confondues : absences de professeurs (via les remplacements),
    indisponibilités et perturbations signalées (salle, déplacement…). Chaque ligne renvoie vers l'absence et le remplacement."""
    lignes = {}
    for r in q("SELECT r.id rid, r.creneau_id, r.date, r.statut, r.remplacant_id, r.absence_id, c.classe, c.matiere, c.debut, c.fin, c.salle, "
               "p.nom pnom, p.prenom pprenom, a.motif, rp.nom rnom, rp.prenom rprenom "
               "FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id JOIN professeurs p ON p.id=c.prof_id "
               "LEFT JOIN absences a ON a.id=r.absence_id LEFT JOIN professeurs rp ON rp.id=r.remplacant_id "
               "WHERE r.etab_id=? AND r.date BETWEEN ? AND ?", (g.etab_id, du.isoformat(), au.isoformat())):
        etat = {"annule": "annule", "effectue": "remplace", "assigne": "remplace", "a_pourvoir": "a_pourvoir"}[r["statut"]]
        lignes[(r["creneau_id"], r["date"])] = {
            "date": r["date"], "debut": r["debut"], "fin": r["fin"], "classe": r["classe"], "matiere": r["matiere"], "salle": r["salle"],
            "prof": f"{r['pprenom']} {r['pnom']}", "causes": [("absence", r["motif"] or "")], "etat": etat,
            "remplacant": f"{r['rprenom']} {r['rnom']}" if r["remplacant_id"] else "", "aid": r["absence_id"], "rid": r["rid"], "pid": None}
    for pt in q("SELECT pt.*, c.classe cclasse, c.matiere, c.debut, c.fin, c.salle, p.nom pnom, p.prenom pprenom FROM perturbations pt "
                "LEFT JOIN creneaux c ON c.id=pt.creneau_id LEFT JOIN professeurs p ON p.id=c.prof_id "
                "WHERE pt.etab_id=? AND pt.date BETWEEN ? AND ?", (g.etab_id, du.isoformat(), au.isoformat())):
        cle = (pt["creneau_id"], pt["date"]) if pt["creneau_id"] else ("p", pt["id"])
        if cle in lignes:
            lignes[cle]["causes"].append((pt["type"], pt["detail"]))
            lignes[cle]["pid"] = pt["id"]
            if pt["type"] == "annule":
                lignes[cle]["etat"] = "annule"
        else:
            lignes[cle] = {"date": pt["date"], "debut": pt["debut"] or "", "fin": pt["fin"] or "", "classe": pt["cclasse"] or pt["classe"], "matiere": pt["matiere"] or "",
                           "salle": pt["salle"] or "", "prof": f"{pt['pprenom']} {pt['pnom']}" if pt["pnom"] else "", "causes": [(pt["type"], pt["detail"])],
                           "etat": "annule" if pt["type"] == "annule" else "perturbe", "remplacant": "", "aid": None, "rid": None, "pid": pt["id"]}
    for a in q("SELECT a.*, p.nom, p.prenom FROM absences a JOIN professeurs p ON p.id=a.prof_id "
               "WHERE a.etab_id=? AND a.type='indisponibilite' AND a.date_debut<=? AND a.date_fin>=?", (g.etab_id, au.isoformat(), du.isoformat())):
        for jour in jours_ouvres(max(du, parse_date(a["date_debut"])), min(au, parse_date(a["date_fin"]))):
            for c in q("SELECT * FROM creneaux WHERE prof_id=? AND jour=?", (a["prof_id"], jour.weekday())):
                cle = (c["id"], jour.isoformat())
                if cle not in lignes:
                    lignes[cle] = {"date": jour.isoformat(), "debut": c["debut"], "fin": c["fin"], "classe": c["classe"], "matiere": c["matiere"], "salle": c["salle"],
                                   "prof": f"{a['prenom']} {a['nom']}", "causes": [("indisponibilite", a["motif"])], "etat": "non_assure",
                                   "remplacant": "", "aid": a["id"], "rid": None, "pid": None}
    out = sorted(lignes.values(), key=lambda l: (l["date"], l["debut"], l["classe"]))
    for l in out:
        l["minutes"] = minutes_cours(l["debut"], l["fin"]) if l["debut"] and l["fin"] else 0
    return out


LIBELLE_CAUSE = dict(TYPES_PERTURBATION, absence="Absence du professeur", indisponibilite="Professeur indisponible")
app.jinja_env.globals["LIBELLE_CAUSE"] = LIBELLE_CAUSE
app.jinja_env.globals["ETATS_COURS"] = ETATS_COURS


def analyser_perturbations(lignes):
    """Chiffres clés et ventilations (classe, cause, professeur, matière, remplaçants) d'une liste de cours perturbés."""
    kpi = {k: 0 for k in ETATS_COURS}
    kpi["total"], kpi["minutes_perdues"] = len(lignes), 0
    par_classe, par_cause, par_prof, par_matiere, remplacants, par_motif = {}, {}, {}, {}, {}, {}
    for l in lignes:
        kpi[l["etat"]] += 1
        if l["etat"] in ("annule", "non_assure"):
            kpi["minutes_perdues"] += l["minutes"]
        c = par_classe.setdefault(l["classe"] or "—", {"total": 0, "remplace": 0, "annule": 0, "a_pourvoir": 0, "autres": 0, "minutes": 0})
        c["total"] += 1
        c[l["etat"] if l["etat"] in ("remplace", "annule", "a_pourvoir") else "autres"] += 1
        if l["etat"] in ("annule", "non_assure"):
            c["minutes"] += l["minutes"]
        for cause, detail in l["causes"]:
            par_cause[cause] = par_cause.get(cause, 0) + 1
            if cause == "absence":
                par_motif[detail or "Non précisé"] = par_motif.get(detail or "Non précisé", 0) + 1
        if any(cs == "absence" for cs, _ in l["causes"]):
            p = par_prof.setdefault(l["prof"], {"total": 0, "remplace": 0, "annule": 0, "a_pourvoir": 0})
            p["total"] += 1
            if l["etat"] in p:
                p[l["etat"]] += 1
        if l["matiere"]:
            par_matiere[l["matiere"]] = par_matiere.get(l["matiere"], 0) + 1
        if l["remplacant"]:
            remplacants[l["remplacant"]] = remplacants.get(l["remplacant"], 0) + 1
    absences_ = kpi["remplace"] + kpi["annule"] + kpi["a_pourvoir"]
    couverts = sum(1 for l in lignes if l["etat"] == "remplace")
    kpi["taux_couverture"] = round(100 * couverts / absences_) if absences_ else None
    tri = lambda d, n=6: sorted(d.items(), key=lambda kv: -(kv[1]["total"] if isinstance(kv[1], dict) else kv[1]))[:n]
    return {"kpi": kpi, "par_classe": tri(par_classe, 12), "par_cause": tri(par_cause), "par_prof": tri(par_prof), "par_matiere": tri(par_matiere),
            "remplacants": tri(remplacants), "par_motif": tri(par_motif)}


def periode_perturbations():
    aujourdhui = date.today()
    du, au = parse_date(request.args.get("du"), aujourdhui - timedelta(days=21)), parse_date(request.args.get("au"), aujourdhui + timedelta(days=14))
    if au < du:
        du, au = au, du
    return du, min(au, du + timedelta(days=180))


@app.route("/cours", methods=["GET", "POST"])
@staff_only
def cours():
    if request.method == "POST":
        f = request.form
        typ = f.get("type")
        if typ not in TYPES_PERTURBATION:
            abort(400)
        cid = f.get("creneau_id", type=int)
        c = one("SELECT * FROM creneaux WHERE id=? AND etab_id=?", (cid, g.etab_id)) if cid else None
        run("INSERT INTO perturbations(etab_id,date,creneau_id,classe,type,detail) VALUES (?,?,?,?,?,?)",
            (g.etab_id, parse_date(f.get("date")).isoformat(), c["id"] if c else None,
             c["classe"] if c else f.get("classe", "").strip(), typ, f.get("detail", "").strip()))
        log("perturbation enregistrée", f"{typ} {f.get('date')}")
        return redirect(url_for("cours"))
    jour = parse_date(request.args.get("date"))
    du, au = periode_perturbations()
    lignes = cours_perturbes(du, au)
    perts = q("SELECT pt.*, c.debut, c.fin, c.salle, p.nom pnom FROM perturbations pt LEFT JOIN creneaux c ON c.id=pt.creneau_id "
              "LEFT JOIN professeurs p ON p.id=c.prof_id WHERE pt.etab_id=? AND pt.date>=? ORDER BY pt.date, c.debut LIMIT 100",
              (g.etab_id, (date.today() - timedelta(days=3)).isoformat()))
    creneaux = q("SELECT c.id, c.classe, c.debut, c.fin, p.nom FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
                 "WHERE c.etab_id=? AND c.jour=? ORDER BY c.debut", (g.etab_id, jour.weekday() if jour.weekday() < 5 else 0))
    return render_template("cours.html", perts=perts, creneaux=creneaux, jour=jour, du_jour=cours_du_jour(jour), lignes=lignes, du=du, au=au,
                           analyse=analyser_perturbations(lignes), aujourdhui=date.today(),
                           lundi=date.today() - timedelta(days=date.today().weekday()))


@app.route("/cours.csv")
@staff_only
def cours_csv():
    du, au = periode_perturbations()
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(["date", "debut", "fin", "classe", "matiere", "professeur", "cause", "etat", "remplacant", "minutes"])
    for l in cours_perturbes(du, au):
        w.writerow([cellule_csv(v) for v in (l["date"], l["debut"], l["fin"], l["classe"], l["matiere"], l["prof"],
                                             " + ".join(LIBELLE_CAUSE.get(c, c) + (f" ({d})" if d else "") for c, d in l["causes"]),
                                             ETATS_COURS[l["etat"]], l["remplacant"], l["minutes"])])
    log("export", "cours perturbés")
    return Response("\ufeff" + buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename=cours_perturbes_{date.today()}.csv"})


@app.route("/perturbations/<int:pid>/supprimer", methods=["POST"])
@staff_only
def perturbation_supprimer(pid):
    run("DELETE FROM perturbations WHERE id=? AND etab_id=?", (pid, g.etab_id))
    return redirect(url_for("cours"))


def assurer_niveau(nom):
    """Enregistre un niveau s'il est nouveau (ex. saisi à la création d'une classe) et retourne son nom nettoyé."""
    nom = " ".join((nom or "").split())[:40]
    if nom and not one("SELECT 1 FROM niveaux WHERE etab_id=? AND nom=?", (g.etab_id, nom)):
        ordre = one("SELECT COALESCE(MAX(ordre), 0) + 1 o FROM niveaux WHERE etab_id=?", (g.etab_id,))["o"]
        run("INSERT INTO niveaux(etab_id,nom,ordre) VALUES (?,?,?)", (g.etab_id, nom, ordre))
        log("niveau créé", nom)
    return nom


@app.route("/classes", methods=["GET", "POST"])
@staff_only
def classes():
    if request.method == "POST":
        f = request.form
        nom = f.get("nom", "").strip()
        if nom:
            if one("SELECT 1 FROM classes WHERE etab_id=? AND nom=?", (g.etab_id, nom)):
                flash("Cette classe existe déjà.", "err")
            else:
                pp = f.get("prof_principal_id", type=int)
                if pp and not one("SELECT 1 FROM professeurs WHERE id=? AND etab_id=?", (pp, g.etab_id)):
                    pp = None
                niveau = assurer_niveau(f.get("niveau", ""))
                run("INSERT INTO classes(etab_id,nom,niveau,prof_principal_id) VALUES (?,?,?,?)", (g.etab_id, nom, niveau, pp))
                log("classe créée", nom)
        return redirect(url_for("classes"))
    rows = q("SELECT c.*, p.nom pnom, p.prenom pprenom FROM classes c LEFT JOIN professeurs p ON p.id=c.prof_principal_id "
             "WHERE c.etab_id=? ORDER BY c.nom", (g.etab_id,))
    equipe = {}
    for r in q("SELECT DISTINCT c.classe, p.id, p.nom, p.prenom, p.matiere FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
               "WHERE c.etab_id=? ORDER BY p.nom", (g.etab_id,)):
        equipe.setdefault(r["classe"], []).append(r)
    profs = q("SELECT id,nom,prenom FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    niveaux_ = q("SELECT n.*, (SELECT COUNT(*) FROM classes c WHERE c.etab_id=n.etab_id AND c.niveau=n.nom) nb FROM niveaux n "
                 "WHERE n.etab_id=? ORDER BY n.ordre, n.nom", (g.etab_id,))
    groupes = [(n["nom"], [c for c in rows if c["niveau"] == n["nom"]]) for n in niveaux_]
    connus = {n["nom"] for n in niveaux_}
    sans = [c for c in rows if c["niveau"] not in connus]
    if sans:
        groupes.append(("Sans niveau", sans))
    nb_eleves = {r["classe"]: r["n"] for r in q("SELECT classe, COUNT(*) n FROM eleves WHERE etab_id=? GROUP BY classe", (g.etab_id,))}
    return render_template("classes.html", groupes=[g_ for g_ in groupes if g_[1]], equipe=equipe, profs=profs, niveaux=niveaux_, nb_eleves=nb_eleves)


def prochain_nom_classe(niveau, existants):
    """Nom suivant d'une classe du niveau, dans le style des classes déjà créées (6A, 6B… / 2nde1, 2nde2… / 1ère S, 1ère T…)."""
    noms = [n for n in existants]
    modele = re.match(r"^(.*?)([A-Za-z])$", noms[-1]) if noms else None
    if modele and noms[-1][-1].isalpha() and (modele.group(1) == "" or not modele.group(1)[-1].isalpha() or modele.group(1)[-1] == " "):
        prefixe, lettres = modele.group(1), "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        for l in lettres:
            if prefixe + l not in noms:
                return prefixe + l
    chiffre = re.match(r"^(.*?)(\d+)$", noms[-1]) if noms else None
    if chiffre:
        i = 1
        while f"{chiffre.group(1)}{i}" in noms:
            i += 1
        return f"{chiffre.group(1)}{i}"
    if not noms and niveau[:1].isdigit():
        base = re.match(r"^\d+", niveau).group(0)
        for l in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
            if base + l not in noms:
                return base + l
    i = 1
    while f"{niveau} {i}" in noms:
        i += 1
    return f"{niveau} {i}"


@app.route("/niveaux/nombre-de-classes", methods=["POST"])
@staff_only
def niveaux_nombre():
    """Ajuste le nombre de classes de chaque niveau : crée les classes manquantes ; en supprime en trop seulement si elles sont vides."""
    ajoutees, retirees, bloquees = 0, 0, []
    for n in q("SELECT * FROM niveaux WHERE etab_id=?", (g.etab_id,)):
        cible = request.form.get(f"nb_{n['id']}", type=int)
        if cible is None or not 0 <= cible <= 30:
            continue
        classes_ = [r["nom"] for r in q("SELECT nom FROM classes WHERE etab_id=? AND niveau=? ORDER BY nom", (g.etab_id, n["nom"]))]
        while len(classes_) < cible:
            nom = prochain_nom_classe(n["nom"], classes_)
            while one("SELECT 1 FROM classes WHERE etab_id=? AND nom=?", (g.etab_id, nom)):   # nom pris par un autre niveau
                nom += "'"
            run("INSERT INTO classes(etab_id,nom,niveau) VALUES (?,?,?)", (g.etab_id, nom, n["nom"]))
            classes_.append(nom)
            ajoutees += 1
        for nom in sorted(classes_, reverse=True):
            if len(classes_) <= cible:
                break
            vide = not any(one(f"SELECT 1 FROM {t} WHERE etab_id=? AND classe=?", (g.etab_id, nom)) for t in ("eleves", "creneaux", "besoins"))
            if vide:
                run("DELETE FROM choix_professeurs WHERE etab_id=? AND classe=?", (g.etab_id, nom))
                run("DELETE FROM classes WHERE etab_id=? AND nom=?", (g.etab_id, nom))
                classes_.remove(nom)
                retirees += 1
            elif nom not in bloquees:
                bloquees.append(nom)
    log("nombre de classes ajusté", f"+{ajoutees} -{retirees}")
    if bloquees and len(bloquees):
        flash(f"{ajoutees} classe(s) créée(s), {retirees} supprimée(s). Non supprimées car elles contiennent des élèves, des cours ou des besoins : {', '.join(bloquees)}.", "err")
    else:
        flash(f"{ajoutees} classe(s) créée(s), {retirees} supprimée(s).", "ok")
    return redirect(url_for("classes"))


@app.route("/classes/<int:cid>/renommer", methods=["POST"])
@staff_only
def classe_renommer(cid):
    """Renomme une classe partout où son nom est utilisé (élèves, cours, besoins, incidents, passages, choix, messages)."""
    c = one("SELECT * FROM classes WHERE id=? AND etab_id=?", (cid, g.etab_id))
    if not c:
        abort(404)
    nouveau = request.form.get("nom", "").strip()[:60]
    if not nouveau or nouveau == c["nom"]:
        flash("Indiquez un nouveau nom différent.", "err")
    elif one("SELECT 1 FROM classes WHERE etab_id=? AND nom=?", (g.etab_id, nouveau)):
        flash("Une classe porte déjà ce nom.", "err")
    else:
        con = db()
        try:
            con.execute("UPDATE classes SET nom=? WHERE id=?", (nouveau, cid))
            for t in ("eleves", "creneaux", "besoins", "incidents", "passages", "perturbations", "choix_professeurs"):
                con.execute(f"UPDATE {t} SET classe=? WHERE etab_id=? AND classe=?", (nouveau, g.etab_id, c["nom"]))
            con.execute("UPDATE messages SET cible=? WHERE etab_id=? AND cible_type='classe' AND cible=?", (nouveau, g.etab_id, c["nom"]))
            con.commit()
        except Exception as ex:
            con.rollback()
            flash(f"Renommage annulé ({ex}).", "err")
            return redirect(url_for("classes"))
        log("classe renommée", f"{c['nom']} -> {nouveau}")
        flash(f"Classe « {c['nom']} » renommée en « {nouveau} » : élèves, emplois du temps et besoins suivent. Les propositions d'emploi du temps déjà calculées gardent l'ancien nom (à regénérer).", "ok")
    return redirect(url_for("classes"))


@app.route("/classes/<int:cid>/supprimer", methods=["POST"])
@staff_only
def classe_supprimer(cid):
    c = one("SELECT * FROM classes WHERE id=? AND etab_id=?", (cid, g.etab_id))
    if not c:
        abort(404)
    n_el = one("SELECT COUNT(*) c FROM eleves WHERE etab_id=? AND classe=?", (g.etab_id, c["nom"]))["c"]
    n_cr = one("SELECT COUNT(*) c FROM creneaux WHERE etab_id=? AND classe=?", (g.etab_id, c["nom"]))["c"]
    n_be = one("SELECT COUNT(*) c FROM besoins WHERE etab_id=? AND classe=?", (g.etab_id, c["nom"]))["c"]
    if n_el or n_cr or n_be:
        flash(f"La classe {c['nom']} n'est pas vide ({n_el} élève(s), {n_cr} cours, {n_be} besoin(s)) : déplacez-les ou supprimez-les d'abord.", "err")
    else:
        run("DELETE FROM choix_professeurs WHERE etab_id=? AND classe=?", (g.etab_id, c["nom"]))
        run("DELETE FROM classes WHERE id=?", (cid,))
        log("classe supprimée", c["nom"])
        flash(f"Classe {c['nom']} supprimée.", "ok")
    return redirect(url_for("classes"))


@app.route("/classes/<int:cid>/prof-principal", methods=["POST"])
@staff_only
def classe_pp(cid):
    pp = request.form.get("prof_principal_id", type=int)
    if pp and not one("SELECT 1 FROM professeurs WHERE id=? AND etab_id=?", (pp, g.etab_id)):
        abort(400)
    niveau = assurer_niveau(request.form.get("niveau", "")) if "niveau" in request.form else None
    if niveau is None:
        run("UPDATE classes SET prof_principal_id=? WHERE id=? AND etab_id=?", (pp or None, cid, g.etab_id))
    else:
        run("UPDATE classes SET prof_principal_id=?, niveau=? WHERE id=? AND etab_id=?", (pp or None, niveau, cid, g.etab_id))
    log("classe modifiée", f"classe {cid} niveau {niveau or '-'}")
    return redirect(url_for("classes"))


@app.route("/niveaux", methods=["POST"])
@staff_only
def niveaux_ajouter():
    n = 0
    for ligne in request.form.get("niveaux", "").replace(",", "\n").splitlines():
        if ligne.strip() and not one("SELECT 1 FROM niveaux WHERE etab_id=? AND nom=?", (g.etab_id, " ".join(ligne.split())[:40])):
            assurer_niveau(ligne)
            n += 1
    flash(f"{n} niveau(x) ajouté(s)." if n else "Aucun nouveau niveau (déjà présents ou vides).", "ok" if n else "err")
    return redirect(url_for("classes"))


@app.route("/niveaux/<int:nid>", methods=["POST"])
@staff_only
def niveau_modifier(nid):
    n = one("SELECT * FROM niveaux WHERE id=? AND etab_id=?", (nid, g.etab_id))
    if not n:
        abort(404)
    nom = " ".join(request.form.get("nom", "").split())[:40]
    ordre = request.form.get("ordre", type=int)
    if not nom:
        flash("Le nom du niveau est obligatoire.", "err")
    elif nom != n["nom"] and one("SELECT 1 FROM niveaux WHERE etab_id=? AND nom=?", (g.etab_id, nom)):
        flash("Ce niveau existe déjà.", "err")
    else:
        run("UPDATE niveaux SET nom=?, ordre=? WHERE id=?", (nom, ordre if ordre is not None else n["ordre"], nid))
        if nom != n["nom"]:
            run("UPDATE classes SET niveau=? WHERE etab_id=? AND niveau=?", (nom, g.etab_id, n["nom"]))
        log("niveau modifié", f"{n['nom']} → {nom}")
    return redirect(url_for("classes"))


@app.route("/niveaux/<int:nid>/supprimer", methods=["POST"])
@staff_only
def niveau_supprimer(nid):
    n = one("SELECT * FROM niveaux WHERE id=? AND etab_id=?", (nid, g.etab_id))
    if not n:
        abort(404)
    if one("SELECT 1 FROM classes WHERE etab_id=? AND niveau=?", (g.etab_id, n["nom"])):
        flash("Ce niveau est utilisé par des classes : changez d'abord leur niveau.", "err")
    else:
        run("DELETE FROM niveaux WHERE id=?", (nid,))
        log("niveau supprimé", n["nom"])
    return redirect(url_for("classes"))


@app.route("/incidents", methods=["GET", "POST"])
@staff_only
def incidents():
    if request.method == "POST":
        f = request.form
        if f.get("description", "").strip():
            el = one("SELECT * FROM eleves WHERE id=? AND etab_id=?", (f.get("eleve_id", type=int), g.etab_id)) if f.get("eleve_id") else None
            iid = run("INSERT INTO incidents(etab_id,date,classe,eleve,description,suite,eleve_id) VALUES (?,?,?,?,?,?,?)",
                (g.etab_id, parse_date(f.get("date")).isoformat(), (f.get("classe", "").strip() or (el["classe"] if el else "")),
                 (f"{el['prenom']} {el['nom']}" if el else f.get("eleve", "").strip()),
                 f["description"].strip(), f.get("suite", "").strip(), el["id"] if el else None))
            log("incident enregistré", f.get("classe", ""))
            ext.emit("incident.cree", incident_id=iid, classe=f.get("classe", ""), description=f["description"].strip())
            if f.get("rediger"):   # enchaîne directement sur la rédaction du document, pré-rempli depuis cet incident
                return redirect(url_for("document_nouveau", incident=iid))
        return redirect(url_for("incidents"))
    rows = q("SELECT * FROM incidents WHERE etab_id=? ORDER BY statut='clos', date DESC LIMIT 200", (g.etab_id,))
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    eleves_ = q("SELECT id, nom, prenom, classe FROM eleves WHERE etab_id=? ORDER BY classe, nom, prenom", (g.etab_id,))
    docs = {}
    for d in q("SELECT id, titre, incident_id FROM documents_generes WHERE etab_id=? AND incident_id IS NOT NULL ORDER BY id", (g.etab_id,)):
        docs.setdefault(d["incident_id"], []).append(d)
    return render_template("incidents.html", incidents=rows, classes=classes_, eleves=eleves_, docs=docs)


@app.route("/incidents/<int:iid>/<action>", methods=["POST"])
@staff_only
def incident_action(iid, action):
    if action == "cloturer":
        suite = request.form.get("suite", "").strip()
        run("UPDATE incidents SET statut='clos', suite=CASE WHEN ?<>'' THEN ? ELSE suite END WHERE id=? AND etab_id=?",
            (suite, suite, iid, g.etab_id))
    elif action == "rouvrir":
        run("UPDATE incidents SET statut='ouvert' WHERE id=? AND etab_id=?", (iid, g.etab_id))
    else:
        abort(404)
    log(f"incident {action}", str(iid))
    return redirect(url_for("incidents"))


# ───────────────────────── 2. Communication ─────────────────────────
def destinataires(cible_type, cible):
    """Utilisateurs de l'établissement visés par un envoi."""
    if cible_type == "individuel":
        sql, args = "SELECT u.id FROM users u JOIN user_etabs ue ON ue.user_id=u.id WHERE ue.etab_id=? AND u.id=? AND u.actif=1", (g.etab_id, int(cible or 0))
    elif cible_type == "classe":
        sql = ("SELECT DISTINCT p.user_id id FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
               "WHERE c.etab_id=? AND c.classe=? AND p.user_id IS NOT NULL")
        args = (g.etab_id, cible)
    elif cible_type == "matiere":
        sql = ("SELECT DISTINCT user_id id FROM professeurs WHERE etab_id=? AND matiere=? AND user_id IS NOT NULL")
        args = (g.etab_id, cible)
    elif cible_type == "niveau":
        sql = ("SELECT DISTINCT p.user_id id FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
               "JOIN classes cl ON cl.etab_id=c.etab_id AND cl.nom=c.classe "
               "WHERE c.etab_id=? AND cl.niveau=? AND p.user_id IS NOT NULL")
        args = (g.etab_id, cible)
    else:
        sql, args = "SELECT u.id FROM users u JOIN user_etabs ue ON ue.user_id=u.id WHERE ue.etab_id=? AND u.actif=1", (g.etab_id,)
    return [r["id"] for r in q(sql, args) if r["id"] != g.user["id"]]


@app.route("/messages")
def messages():
    boite = request.args.get("boite", "recus")
    if boite == "envoyes":
        rows = q("SELECT m.*, (SELECT COUNT(*) FROM message_dest WHERE message_id=m.id) nb, "
                 "(SELECT COUNT(*) FROM message_dest WHERE message_id=m.id AND lu_at IS NOT NULL) lus, "
                 "(SELECT COUNT(*) FROM message_dest WHERE message_id=m.id AND confirme_at IS NOT NULL) confirmes "
                 "FROM messages m WHERE m.sender_id=? AND m.etab_id=? ORDER BY m.created_at DESC LIMIT 100",
                 (g.user["id"], g.etab_id))
    else:
        rows = q("SELECT m.*, u.nom expediteur, md.lu_at, md.confirme_at FROM message_dest md JOIN messages m ON m.id=md.message_id "
                 "JOIN users u ON u.id=m.sender_id WHERE md.user_id=? AND m.etab_id=? ORDER BY m.created_at DESC LIMIT 100",
                 (g.user["id"], g.etab_id))
    return render_template("messages.html", rows=rows, boite=boite)


@app.route("/messages/nouveau", methods=["GET", "POST"])
def message_nouveau():
    staff = g.user["role"] in STAFF
    if request.method == "POST":
        f = request.form
        typ = f.get("cible_type", "individuel")
        if typ not in ("individuel", "classe", "niveau", "matiere", "tous") or (typ != "individuel" and not staff):
            abort(403)
        cible = {"individuel": f.get("cible", ""), "classe": f.get("cible_classe", ""),
                 "niveau": f.get("cible_niveau", ""), "matiere": f.get("cible_matiere", ""), "tous": ""}[typ]
        dest = destinataires(typ, cible) if (typ != "individuel" or cible.isdigit()) else []
        if not f.get("sujet", "").strip() or not f.get("corps", "").strip():
            flash("Sujet et message obligatoires.", "err")
        elif not dest:
            flash("Aucun destinataire trouvé pour cette sélection.", "err")
        else:
            mid = run("INSERT INTO messages(etab_id,sender_id,sujet,corps,cible_type,cible,created_at) VALUES (?,?,?,?,?,?,?)",
                      (g.etab_id, g.user["id"], f["sujet"].strip(), f["corps"].strip(), typ, cible,
                       datetime.now().isoformat(timespec="minutes")))
            for uid in dest:
                db().execute("INSERT INTO message_dest(message_id,user_id) VALUES (?,?)", (mid, uid))
            db().commit()
            log("message envoyé", f"{typ} {cible} ({len(dest)} destinataires)")
            ext.emit("message.envoye", message_id=mid, sujet=f["sujet"].strip(), corps=f["corps"].strip(),
                     expediteur=g.user["nom"],
                     emails=[r["email"] for r in q("SELECT email FROM users WHERE id IN (%s)" % ",".join("?" * len(dest)), dest)])
            flash(f"Message envoyé à {len(dest)} personne(s).", "ok")
            return redirect(url_for("messages", boite="envoyes"))
    users = q("SELECT u.id,u.nom FROM users u JOIN user_etabs ue ON ue.user_id=u.id WHERE ue.etab_id=? AND u.actif=1 AND u.id<>? "
              "ORDER BY u.nom", (g.etab_id, g.user["id"]))
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    niveaux = [n["nom"] for n in q("SELECT nom FROM niveaux n WHERE etab_id=? AND EXISTS "
                                   "(SELECT 1 FROM classes c WHERE c.etab_id=n.etab_id AND c.niveau=n.nom) ORDER BY ordre, nom", (g.etab_id,))]
    matieres = [r["matiere"] for r in q("SELECT DISTINCT matiere FROM professeurs WHERE etab_id=? AND matiere<>'' ORDER BY matiere", (g.etab_id,))]
    return render_template("message_nouveau.html", users=users, classes=classes_, niveaux=niveaux, matieres=matieres,
                           repondre=request.args.get("a", ""), sujet=request.args.get("sujet", ""))


@app.route("/messages/<int:mid>")
def message(mid):
    m = one("SELECT m.*, u.nom expediteur FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=? AND m.etab_id=?",
            (mid, g.etab_id))
    if not m:
        abort(404)
    mon = one("SELECT * FROM message_dest WHERE message_id=? AND user_id=?", (mid, g.user["id"]))
    if m["sender_id"] != g.user["id"] and not mon:
        abort(403)
    if mon and not mon["lu_at"]:
        run("UPDATE message_dest SET lu_at=? WHERE message_id=? AND user_id=?",
            (datetime.now().isoformat(timespec="minutes"), mid, g.user["id"]))
        mon = one("SELECT * FROM message_dest WHERE message_id=? AND user_id=?", (mid, g.user["id"]))
    suivi = q("SELECT u.nom, md.lu_at, md.confirme_at FROM message_dest md JOIN users u ON u.id=md.user_id "
              "WHERE md.message_id=? ORDER BY u.nom", (mid,)) if m["sender_id"] == g.user["id"] else []
    return render_template("message.html", m=m, mon=mon, suivi=suivi)


@app.route("/messages/<int:mid>/confirmer", methods=["POST"])
def message_confirmer(mid):
    run("UPDATE message_dest SET confirme_at=? WHERE message_id=? AND user_id=? AND confirme_at IS NULL",
        (datetime.now().isoformat(timespec="minutes"), mid, g.user["id"]))
    return redirect(url_for("message", mid=mid))


@app.route("/reunions", methods=["GET", "POST"])
def reunions():
    if request.method == "POST":
        if g.user["role"] not in STAFF:
            abort(403)
        f = request.form
        if not f.get("titre", "").strip():
            flash("Titre obligatoire.", "err")
        else:
            rid = run("INSERT INTO reunions(etab_id,titre,date,heure,lieu,ordre_du_jour,organisateur_id) VALUES (?,?,?,?,?,?,?)",
                      (g.etab_id, f["titre"].strip(), parse_date(f.get("date")).isoformat(), f.get("heure", ""),
                       f.get("lieu", "").strip(), f.get("ordre_du_jour", "").strip(), g.user["id"]))
            ids = set()
            for pid in request.form.getlist("profs", type=int):
                ids.add(pid)
            for cl in request.form.getlist("classes"):
                ids.update(r["prof_id"] for r in q("SELECT DISTINCT prof_id FROM creneaux WHERE etab_id=? AND classe=?", (g.etab_id, cl)))
            if f.get("tous"):
                ids.update(r["id"] for r in q("SELECT id FROM professeurs WHERE etab_id=?", (g.etab_id,)))
            valides = {r["id"] for r in q("SELECT id FROM professeurs WHERE etab_id=?", (g.etab_id,))}
            for pid in ids & valides:
                db().execute("INSERT INTO reunion_convoques(reunion_id,prof_id) VALUES (?,?)", (rid, pid))
            eleves_ok = {r["id"] for r in q("SELECT id FROM eleves WHERE etab_id=?", (g.etab_id,))}
            choisis = set(request.form.getlist("eleves", type=int)) & eleves_ok
            for eid in choisis:
                db().execute("INSERT INTO reunion_eleves(reunion_id,eleve_id) VALUES (?,?)", (rid, eid))
            db().commit()
            log("réunion créée", f"{f['titre']} ({len(ids & valides)} convoqués)")
            convoques = list(ids & valides)
            ext.emit("reunion.creee", reunion_id=rid, titre=f["titre"].strip(), date=parse_date(f.get("date")).isoformat(),
                     heure=f.get("heure", ""), lieu=f.get("lieu", "").strip(),
                     emails=[r["email"] for r in q("SELECT email FROM professeurs WHERE email<>'' AND id IN (%s)"
                                                   % ",".join("?" * len(convoques)), convoques)] if convoques else [])
            flash(f"Réunion créée : {len(ids & valides)} professeur(s)" + (f" et {len(choisis)} élève(s)" if choisis else "") + " convoqué(s).", "ok")
            return redirect(url_for("reunions"))
    if g.user["role"] in STAFF:
        rows = q("SELECT r.*, (SELECT COUNT(*) FROM reunion_convoques WHERE reunion_id=r.id) nb, "
                 "(SELECT COUNT(*) FROM reunion_convoques WHERE reunion_id=r.id AND reponse='oui') oui, "
                 "(SELECT COUNT(*) FROM reunion_convoques WHERE reunion_id=r.id AND reponse='non') non, "
                 "(SELECT COUNT(*) FROM reunion_eleves WHERE reunion_id=r.id) nb_eleves "
                 "FROM reunions r WHERE r.etab_id=? ORDER BY r.date DESC, r.heure LIMIT 100", (g.etab_id,))
    else:
        rows = q("SELECT r.*, rc.reponse FROM reunions r JOIN reunion_convoques rc ON rc.reunion_id=r.id "
                 "WHERE r.etab_id=? AND rc.prof_id=? ORDER BY r.date DESC", (g.etab_id, g.prof["id"] if g.prof else -1))
    profs = q("SELECT id,nom,prenom FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,)) if g.user["role"] in STAFF else []
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    classes_par_prof = {}
    for c in q("SELECT DISTINCT prof_id, classe FROM creneaux WHERE etab_id=? ORDER BY classe", (g.etab_id,)):
        classes_par_prof.setdefault(c["prof_id"], []).append(c["classe"])
    eleves_par_classe = {}
    if g.user["role"] in STAFF:
        for e in q("SELECT id, nom, prenom, classe FROM eleves WHERE etab_id=? ORDER BY classe, nom, prenom", (g.etab_id,)):
            eleves_par_classe.setdefault(e["classe"] or "Sans classe", []).append(e)
    return render_template("reunions.html", rows=rows, profs=profs, classes=classes_, classes_par_prof=classes_par_prof,
                           eleves_par_classe=eleves_par_classe)


@app.route("/reunions/<int:rid>")
@staff_only
def reunion_detail(rid):
    r = one("SELECT * FROM reunions WHERE id=? AND etab_id=?", (rid, g.etab_id))
    if not r:
        abort(404)
    profs = q("SELECT p.nom, p.prenom, p.matiere, rc.reponse FROM reunion_convoques rc JOIN professeurs p ON p.id=rc.prof_id "
              "WHERE rc.reunion_id=? ORDER BY p.nom", (rid,))
    eleves_ = q("SELECT e.* FROM reunion_eleves re JOIN eleves e ON e.id=re.eleve_id WHERE re.reunion_id=? ORDER BY e.classe, e.nom, e.prenom", (rid,))
    deja = {d["eleve_id"] for d in q("SELECT eleve_id FROM documents_generes WHERE etab_id=? AND titre LIKE ?", (g.etab_id, f"% — {r['titre']} (réunion {rid})"))}
    return render_template("reunion_detail.html", r=r, profs=profs, eleves=eleves_, deja=deja)


@app.route("/reunions/<int:rid>/convocations-parents", methods=["POST"])
@staff_only
def reunion_convocations_parents(rid):
    """Rédige une convocation aux parents par élève convoqué, à partir du modèle « Convocation des parents »."""
    r = one("SELECT * FROM reunions WHERE id=? AND etab_id=?", (rid, g.etab_id))
    if not r:
        abort(404)
    installer_modeles(db(), g.etab_id)
    m = one("SELECT * FROM modeles_documents WHERE etab_id=? AND code='convocation_parents'", (g.etab_id,)) \
        or one("SELECT * FROM modeles_documents WHERE etab_id=? AND titre LIKE '%onvocation%' ORDER BY id LIMIT 1", (g.etab_id,))
    if not m:
        flash("Aucun modèle de convocation : créez-en un dans « Modèles et types d'incident ».", "err")
        return redirect(url_for("reunion_detail", rid=rid))
    n = 0
    for e in q("SELECT e.* FROM reunion_eleves re JOIN eleves e ON e.id=re.eleve_id WHERE re.reunion_id=?", (rid,)):
        titre = f"Convocation des parents — {nom_complet(e)} — {r['titre']} (réunion {rid})"
        if one("SELECT 1 FROM documents_generes WHERE etab_id=? AND eleve_id=? AND titre=?", (g.etab_id, e["id"], titre)):
            continue
        ctx = construire_ctx(e, date_iso=r["date"], heure=r["heure"], lieu=r["lieu"] or "la vie scolaire de l'établissement",
                             libelle=r["titre"], description=r["ordre_du_jour"])
        run("INSERT INTO documents_generes(etab_id,modele_id,type,titre,eleve_id,eleve_nom,contenu,auteur_id,auteur,created_at,signataires) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (g.etab_id, m["id"], m["titre"], titre, e["id"], nom_complet(e), remplir(m["corps"], ctx), g.user["id"], g.user["nom"],
             datetime.now().isoformat(timespec="minutes"), signataires_choisis()))
        n += 1
    log("convocations aux parents rédigées", f"réunion {rid} : {n}")
    flash(f"{n} convocation(s) aux parents rédigée(s) : retrouvez-les dans Documents (modifiables, imprimables, export Word)." if n
          else "Toutes les convocations de cette réunion ont déjà été rédigées.", "ok")
    return redirect(url_for("documents" if n else "reunion_detail", **({} if n else {"rid": rid})))


@app.route("/reunions/<int:rid>/repondre", methods=["POST"])
def reunion_repondre(rid):
    rep = request.form.get("reponse")
    if rep not in ("oui", "non") or not g.prof:
        abort(400)
    run("UPDATE reunion_convoques SET reponse=? WHERE reunion_id=? AND prof_id=?", (rep, rid, g.prof["id"]))
    return redirect(url_for("reunions"))


@app.route("/reunions/<int:rid>/supprimer", methods=["POST"])
@staff_only
def reunion_supprimer(rid):
    run("DELETE FROM reunions WHERE id=? AND etab_id=?", (rid, g.etab_id))
    log("réunion supprimée", str(rid))
    return redirect(url_for("reunions"))


@app.route("/documents", methods=["GET", "POST"])
def documents():
    if request.method == "POST":
        if g.user["role"] not in STAFF:
            abort(403)
        fichier = request.files.get("fichier")
        nom = secure_filename(fichier.filename) if fichier and fichier.filename else ""
        if not nom or nom.rsplit(".", 1)[-1].lower() not in FICHIERS_AUTORISES:
            flash("Fichier absent ou type non autorisé.", "err")
        else:
            stored = secrets.token_hex(12) + "_" + nom
            fichier.save(os.path.join(UPLOAD_DIR, stored))
            run("INSERT INTO documents(etab_id,titre,filename,stored,uploaded_by,created_at) VALUES (?,?,?,?,?,?)",
                (g.etab_id, request.form.get("titre", "").strip() or nom, nom, stored, g.user["id"],
                 datetime.now().isoformat(timespec="minutes")))
            log("document partagé", nom)
            flash("Document partagé.", "ok")
        return redirect(url_for("documents"))
    rows = q("SELECT d.*, u.nom auteur FROM documents d LEFT JOIN users u ON u.id=d.uploaded_by WHERE d.etab_id=? "
             "ORDER BY d.created_at DESC", (g.etab_id,))
    sql, args = "SELECT * FROM documents_generes WHERE etab_id=?", [g.etab_id]
    if g.user["role"] not in STAFF:
        sql += " AND auteur_id=?"
        args.append(g.user["id"])
    generes = q(sql + " ORDER BY id DESC LIMIT 200", args)
    return render_template("documents.html", docs=rows, generes=generes)


@app.route("/documents/<int:did>/telecharger")
def document_telecharger(did):
    d = one("SELECT * FROM documents WHERE id=? AND etab_id=?", (did, g.etab_id))
    if not d:
        abort(404)
    return send_from_directory(UPLOAD_DIR, d["stored"], as_attachment=True, download_name=d["filename"])


@app.route("/documents/<int:did>/supprimer", methods=["POST"])
@staff_only
def document_supprimer(did):
    d = one("SELECT * FROM documents WHERE id=? AND etab_id=?", (did, g.etab_id))
    if d:
        run("DELETE FROM documents WHERE id=?", (did,))
        try:
            os.remove(os.path.join(UPLOAD_DIR, d["stored"]))
        except OSError:
            pass
        log("document supprimé", d["filename"])
    return redirect(url_for("documents"))


# ───────────────────────── 4. Tâches, rapports, historique ─────────────────────────
@app.route("/taches", methods=["GET", "POST"])
@staff_only
def taches():
    if request.method == "POST":
        f = request.form
        if f.get("titre", "").strip():
            ech = f.get("echeance") or None
            if ech:
                ech = parse_date(ech).isoformat()
            ass = f.get("assigne_id", type=int)
            if ass and not one("SELECT 1 FROM user_etabs WHERE user_id=? AND etab_id=?", (ass, g.etab_id)):
                ass = None
            tid = run("INSERT INTO taches(etab_id,titre,description,echeance,priorite,assigne_id) VALUES (?,?,?,?,?,?)",
                (g.etab_id, f["titre"].strip(), f.get("description", "").strip(), ech,
                 f.get("priorite") if f.get("priorite") in ("basse", "normale", "haute") else "normale", ass or g.user["id"]))
            log("tâche créée", f["titre"])
            ext.emit("tache.creee", tache_id=tid, titre=f["titre"].strip(), echeance=ech)
        return redirect(url_for("taches"))
    rows = q("SELECT t.*, u.nom assigne FROM taches t LEFT JOIN users u ON u.id=t.assigne_id WHERE t.etab_id=? "
             "ORDER BY t.statut='faite', t.echeance IS NULL, t.echeance", (g.etab_id,))
    users = q("SELECT u.id,u.nom FROM users u JOIN user_etabs ue ON ue.user_id=u.id WHERE ue.etab_id=? AND u.role IN ('admin','direction','cpe')",
              (g.etab_id,))
    return render_template("taches.html", taches=rows, users=users)


@app.route("/taches/<int:tid>/<action>", methods=["POST"])
@staff_only
def tache_action(tid, action):
    if action == "faite":
        run("UPDATE taches SET statut='faite' WHERE id=? AND etab_id=?", (tid, g.etab_id))
    elif action == "rouvrir":
        run("UPDATE taches SET statut='a_faire' WHERE id=? AND etab_id=?", (tid, g.etab_id))
    elif action == "supprimer":
        run("DELETE FROM taches WHERE id=? AND etab_id=?", (tid, g.etab_id))
    else:
        abort(404)
    log(f"tâche {action}", str(tid))
    return redirect(url_for("taches"))


EXPORTS = {
    "absences": ("SELECT p.nom, p.prenom, a.type, a.date_debut, a.date_fin, a.motif, a.statut FROM absences a "
                 "JOIN professeurs p ON p.id=a.prof_id WHERE a.etab_id=? ORDER BY a.date_debut DESC"),
    "remplacements": ("SELECT r.date, c.classe, c.debut, c.fin, p.nom absent, rp.nom remplacant, r.statut FROM remplacements r "
                      "JOIN creneaux c ON c.id=r.creneau_id JOIN professeurs p ON p.id=c.prof_id "
                      "LEFT JOIN professeurs rp ON rp.id=r.remplacant_id WHERE r.etab_id=? ORDER BY r.date"),
    "taches": "SELECT titre, description, echeance, priorite, statut FROM taches WHERE etab_id=? ORDER BY echeance",
    "incidents": "SELECT date, classe, eleve, description, suite, statut FROM incidents WHERE etab_id=? ORDER BY date DESC",
    "professeurs": "SELECT nom, prenom, matiere, email, telephone FROM professeurs WHERE etab_id=? ORDER BY nom",
}


def cellule_csv(v):
    # neutralise l'injection de formules à l'ouverture dans Excel
    s = "" if v is None else str(v)
    return "'" + s if s[:1] in "=+-@\t\r" else s


@app.route("/export/<nom>.csv")
@staff_only
def export_csv(nom):
    if nom not in EXPORTS or not module_actif(EXPORT_VERS_MODULE.get(nom, "rapports")):
        abort(404)
    cur = db().execute(EXPORTS[nom], (g.etab_id,))
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow([c[0] for c in cur.description])
    for r in cur.fetchall():
        w.writerow([cellule_csv(v) for v in r])
    log("export", nom)
    return Response("﻿" + buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={nom}_{date.today()}.csv"})


@app.route("/rapports")
@staff_only
def rapports():
    debut = parse_date(request.args.get("debut"), date.today().replace(day=1)).isoformat()
    fin = parse_date(request.args.get("fin"), date.today()).isoformat()
    s = {
        "absences": one("SELECT COUNT(*) c FROM absences WHERE etab_id=? AND type='absence' AND date_debut<=? AND date_fin>=?", (g.etab_id, fin, debut))["c"],
        "indispos": one("SELECT COUNT(*) c FROM absences WHERE etab_id=? AND type='indisponibilite' AND date_debut<=? AND date_fin>=?", (g.etab_id, fin, debut))["c"],
        "remp_total": one("SELECT COUNT(*) c FROM remplacements WHERE etab_id=? AND date BETWEEN ? AND ?", (g.etab_id, debut, fin))["c"],
        "remp_ok": one("SELECT COUNT(*) c FROM remplacements WHERE etab_id=? AND date BETWEEN ? AND ? AND statut IN ('assigne','effectue')", (g.etab_id, debut, fin))["c"],
        "annules": one("SELECT COUNT(*) c FROM remplacements WHERE etab_id=? AND date BETWEEN ? AND ? AND statut='annule'", (g.etab_id, debut, fin))["c"],
        "incidents": one("SELECT COUNT(*) c FROM incidents WHERE etab_id=? AND date BETWEEN ? AND ?", (g.etab_id, debut, fin))["c"],
        "taches_faites": one("SELECT COUNT(*) c FROM taches WHERE etab_id=? AND statut='faite'", (g.etab_id,))["c"],
        "taches_ouvertes": one("SELECT COUNT(*) c FROM taches WHERE etab_id=? AND statut<>'faite'", (g.etab_id,))["c"],
    }
    top_abs = q("SELECT p.nom, p.prenom, COUNT(*) n FROM absences a JOIN professeurs p ON p.id=a.prof_id WHERE a.etab_id=? "
                "AND a.type='absence' AND a.date_debut<=? AND a.date_fin>=? GROUP BY p.id ORDER BY n DESC LIMIT 5", (g.etab_id, fin, debut))
    top_remp = q("SELECT p.nom, p.prenom, COUNT(*) n FROM remplacements r JOIN professeurs p ON p.id=r.remplacant_id WHERE r.etab_id=? "
                 "AND r.date BETWEEN ? AND ? GROUP BY p.id ORDER BY n DESC LIMIT 5", (g.etab_id, debut, fin))
    return render_template("rapports.html", s=s, top_abs=top_abs, top_remp=top_remp, debut=debut, fin=fin,
                           exports=[e for e in EXPORTS if module_actif(EXPORT_VERS_MODULE.get(e, "rapports"))])


@app.route("/historique")
@staff_only
def historique():
    rows = q("SELECT * FROM audit WHERE etab_id=? OR etab_id IS NULL ORDER BY id DESC LIMIT 300", (g.etab_id,))
    return render_template("historique.html", rows=rows)


# ───────────────────────── Élèves ─────────────────────────
def parse_naissance(texte):
    """Accepte AAAA-MM-JJ ou JJ/MM/AAAA ; retourne la date ISO si elle est plausible pour un élève (2 à 30 ans), sinon ''."""
    t = (texte or "").strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            d = datetime.strptime(t, fmt).date()
        except ValueError:
            continue
        age = (date.today() - d).days / 365.25
        return d.isoformat() if 2 <= age <= 30 else ""
    return ""


def norm_sexe(texte):
    t = (texte or "").strip().lower()
    if t in ("f", "fille", "féminin", "feminin", "femme", "girl"):
        return "F"
    if t in ("m", "g", "garçon", "garcon", "masculin", "homme", "boy"):
        return "M"
    return ""


def age_au(naissance_iso, ref):
    d = date.fromisoformat(naissance_iso)
    return ref.year - d.year - ((ref.month, ref.day) < (d.month, d.day))


@app.route("/eleves", methods=["GET", "POST"])
@staff_only
def eleves():
    if request.method == "POST":
        f = request.form
        if not f.get("nom", "").strip():
            flash("Le nom est obligatoire.", "err")
        else:
            run("INSERT INTO eleves(etab_id,nom,prenom,classe,responsable,contact,date_naissance,sexe) VALUES (?,?,?,?,?,?,?,?)",
                (g.etab_id, f["nom"].strip(), f.get("prenom", "").strip(), f.get("classe", "").strip(),
                 f.get("responsable", "").strip(), f.get("contact", "").strip(), parse_naissance(f.get("date_naissance")), norm_sexe(f.get("sexe"))))
            log("élève ajouté", f"{f['nom']} {f.get('classe', '')}")
        return redirect(url_for("eleves"))
    terme, classe, niveau = request.args.get("q", "").strip(), request.args.get("classe", ""), request.args.get("niveau", "")
    like = f"%{terme}%"
    sql = "SELECT * FROM eleves WHERE etab_id=? AND (nom LIKE ? OR prenom LIKE ? OR responsable LIKE ?)"
    args = [g.etab_id, like, like, like]
    if classe:
        sql += " AND classe=?"
        args.append(classe)
    if niveau:
        sql += " AND classe IN (SELECT nom FROM classes WHERE etab_id=? AND niveau=?)"
        args += [g.etab_id, niveau]
    rows = q(sql + " ORDER BY classe, nom, prenom LIMIT 500", args)
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    total = one("SELECT COUNT(*) c FROM eleves WHERE etab_id=?", (g.etab_id,))["c"]
    # professeur principal et équipe de chaque classe affichée (calculés une fois par classe)
    infos = {}
    for c in {e["classe"] for e in rows if e["classe"]}:
        equipe, pp = equipe_et_pp(c)
        infos[c] = {"pp": pp, "profs": sorted({e["nom"] for e in equipe})}
    soins_jour = {}
    if module_actif("infirmerie"):
        for o in occurrences_soins(date.today()):
            if o["statut"] == "a_faire":
                soins_jour.setdefault(o["eleve_id"], []).append(o["heure"])
    return render_template("eleves.html", rows=rows, terme=terme, classe=classe, classes=classes_, total=total, infos=infos, soins_jour=soins_jour,
                           niveau=niveau, niveaux=q("SELECT nom FROM niveaux WHERE etab_id=? ORDER BY ordre, nom", (g.etab_id,)))


def donnees_pyramide(niveau, classe, ref):
    """Effectifs par âge révolu à la date de référence et par sexe."""
    sql = "SELECT sexe, date_naissance FROM eleves WHERE etab_id=?"
    args = [g.etab_id]
    if classe:
        sql += " AND classe=?"
        args.append(classe)
    if niveau:
        sql += " AND classe IN (SELECT nom FROM classes WHERE etab_id=? AND niveau=?)"
        args += [g.etab_id, niveau]
    compte, sans_naissance = {}, 0
    for r in q(sql, args):
        if not r["date_naissance"]:
            sans_naissance += 1
            continue
        a = age_au(r["date_naissance"], ref)
        ligne = compte.setdefault(a, {"M": 0, "F": 0, "?": 0})
        ligne[r["sexe"] if r["sexe"] in ("M", "F") else "?"] += 1
    lignes = []
    if compte:
        for a in range(max(compte), min(compte) - 1, -1):   # du plus âgé (en haut) au plus jeune
            c = compte.get(a, {"M": 0, "F": 0, "?": 0})
            lignes.append({"age": a, "m": c["M"], "f": c["F"], "nr": c["?"], "total": c["M"] + c["F"] + c["?"]})
    tot = {"m": sum(l["m"] for l in lignes), "f": sum(l["f"] for l in lignes), "nr": sum(l["nr"] for l in lignes)}
    tot["total"] = tot["m"] + tot["f"] + tot["nr"]
    tot["age_moyen"] = round(sum(l["age"] * l["total"] for l in lignes) / tot["total"], 1) if tot["total"] else None
    return lignes, tot, sans_naissance


def geometrie_pyramide(lignes):
    """Calcule le dessin SVG : barres dos à dos (garçons à gauche, filles à droite), échelle commune aux deux côtés."""
    W, MARGE, CENTRE, PAS, EPAISSEUR, HAUT = 760, 18, 64, 30, 22, 8
    cote = (W - 2 * MARGE - CENTRE) / 2
    cl, cr = MARGE + cote, MARGE + cote + CENTRE
    maxi = max([max(l["m"], l["f"]) for l in lignes] + [1])
    paliers = [4, 8, 12, 16, 20, 28, 40, 60, 80, 100, 120, 160, 200, 300, 400, 600, 800, 1000]
    echelle = next((p for p in paliers if p >= maxi * 1.12), paliers[-1])
    px = cote / echelle

    def barre(x0, longueur, y, sens):  # arrondi de 4 px côté valeur, angle droit côté axe
        r = min(4, longueur / 2)
        if longueur <= 0:
            return ""
        if sens < 0:
            x1 = x0 - longueur
            return f"M{x0:.1f},{y} L{x1 + r:.1f},{y} Q{x1:.1f},{y} {x1:.1f},{y + r} L{x1:.1f},{y + EPAISSEUR - r} Q{x1:.1f},{y + EPAISSEUR} {x1 + r:.1f},{y + EPAISSEUR} L{x0:.1f},{y + EPAISSEUR} Z"
        x1 = x0 + longueur
        return f"M{x0:.1f},{y} L{x1 - r:.1f},{y} Q{x1:.1f},{y} {x1:.1f},{y + r} L{x1:.1f},{y + EPAISSEUR - r} Q{x1:.1f},{y + EPAISSEUR} {x1 - r:.1f},{y + EPAISSEUR} L{x0:.1f},{y + EPAISSEUR} Z"

    max_m, max_f = max(l["m"] for l in lignes), max(l["f"] for l in lignes)
    rangs = []
    for i, l in enumerate(lignes):
        y_bande = HAUT + i * PAS
        y = y_bande + (PAS - EPAISSEUR) / 2
        rangs.append({**l, "y_bande": y_bande, "pas": PAS, "yc": y + EPAISSEUR / 2 + 4,
                      "chemin_m": barre(cl, l["m"] * px, y, -1), "chemin_f": barre(cr, l["f"] * px, y, 1),
                      "etiq_m": l["m"] == max_m and l["m"] > 0, "etiq_f": l["f"] == max_f and l["f"] > 0,
                      "x_m": cl - l["m"] * px - 6, "x_f": cr + l["f"] * px + 6})
    h_plot = HAUT + len(lignes) * PAS
    pas_tick = echelle // 4
    ticks = [{"v": v, "x_g": cl - v * px, "x_d": cr + v * px} for v in range(0, echelle + 1, pas_tick)]
    return {"W": W, "H": h_plot + 40, "cl": cl, "cr": cr, "rangs": rangs, "ticks": ticks, "y_axe": h_plot + 4, "h_plot": h_plot,
            "x_centre": (cl + cr) / 2, "y_titre": h_plot + 34, "x_g_titre": cl - cote / 2, "x_d_titre": cr + cote / 2}


@app.route("/eleves/pyramide")
@staff_only
def pyramide():
    niveau, classe = request.args.get("niveau", ""), request.args.get("classe", "")
    ref = parse_date(request.args.get("date"))
    lignes, tot, sans_naissance = donnees_pyramide(niveau, classe, ref)
    geo = geometrie_pyramide(lignes) if lignes else None
    sans_sexe_total = tot["nr"]
    return render_template("pyramide.html", lignes=lignes, tot=tot, geo=geo, sans_naissance=sans_naissance, ref=ref, niveau=niveau, classe=classe,
                           niveaux=q("SELECT nom FROM niveaux WHERE etab_id=? ORDER BY ordre, nom", (g.etab_id,)),
                           classes=q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,)), sans_sexe=sans_sexe_total)


@app.route("/eleves/pyramide.csv")
@staff_only
def pyramide_csv():
    lignes, tot, _ = donnees_pyramide(request.args.get("niveau", ""), request.args.get("classe", ""), parse_date(request.args.get("date")))
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(["age", "garcons", "filles", "sexe_non_renseigne", "total"])
    for l in reversed(lignes):
        w.writerow([l["age"], l["m"], l["f"], l["nr"], l["total"]])
    w.writerow(["total", tot["m"], tot["f"], tot["nr"], tot["total"]])
    log("export", "pyramide des âges")
    return Response("\ufeff" + buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename=pyramide_{date.today()}.csv"})


def infos_infirmerie(eid):
    """Ce que le personnel voit de l'infirmerie sur la fiche d'un élève. Habilité : PAI, allergies, soins et passages détaillés ;
    sinon uniquement les rendez-vous à venir (date, heure, durée), sans nature du soin ni motif."""
    if not module_actif("infirmerie"):
        return None
    habilite = g.user["role"] in roles_infirmerie()
    aujourdhui = date.today()
    soins_ = q("SELECT * FROM soins WHERE etab_id=? AND eleve_id=? AND actif=1", (g.etab_id, eid))
    rdv = []
    for k in range(0, 15):
        jour = aujourdhui + timedelta(days=k)
        for s in soins_:
            if soin_a_lieu(s, jour):
                rdv.append({"date": jour.isoformat(), "heure": s["heure"], "duree": s["duree"], "intitule": s["intitule"] if habilite else ""})
    rdv.sort(key=lambda r: (r["date"], r["heure"]))
    info = {"habilite": habilite, "rdv": rdv[:5], "rdv_plus": max(0, len(rdv) - 5),
            "nb_passages_30j": one("SELECT COUNT(*) c FROM passages WHERE eleve_id=? AND date>=?", (eid, (aujourdhui - timedelta(days=30)).isoformat()))["c"]}
    if habilite:
        info["fiche"] = one("SELECT * FROM fiches_sante WHERE eleve_id=?", (eid,))
        info["passages"] = q("SELECT date, heure, motif, decision FROM passages WHERE eleve_id=? ORDER BY date DESC, heure DESC LIMIT 5", (eid,))
    return info


@app.route("/eleves/<int:eid>")
@staff_only
def eleve_fiche(eid):
    e = one("SELECT * FROM eleves WHERE id=? AND etab_id=?", (eid, g.etab_id))
    if not e:
        abort(404)
    equipe, pp = equipe_et_pp(e["classe"]) if e["classe"] else ([], None)
    profs = {}
    for m in equipe + ([pp] if pp else []):
        p = profs.setdefault(m["prof_id"], {"prof_id": m["prof_id"], "nom": m["nom"], "matieres": [], "principal": False})
        if m["matiere"] and m["matiere"] not in p["matieres"]:
            p["matieres"].append(m["matiere"])
        if pp and m["prof_id"] == pp["prof_id"]:
            p["principal"] = True
    for pid, p in profs.items():
        fiche = one("SELECT email, telephone FROM professeurs WHERE id=?", (pid,))
        p["email"], p["telephone"] = fiche["email"], fiche["telephone"]
        p["cours"] = [f"{JOURS[c['jour']][:3]}. {c['debut']}–{c['fin']}" for c in
                      q("SELECT jour, debut, fin FROM creneaux WHERE prof_id=? AND classe=? ORDER BY jour, debut", (pid, e["classe"]))]
    equipe_liste = sorted(profs.values(), key=lambda p: (not p["principal"], p["nom"]))
    incidents_ = q("SELECT * FROM incidents WHERE etab_id=? AND eleve_id=? ORDER BY date DESC", (g.etab_id, eid))
    documents_ = q("SELECT id, titre, created_at FROM documents_generes WHERE etab_id=? AND eleve_id=? ORDER BY id DESC", (g.etab_id, eid))
    reunions_ = q("SELECT r.id, r.titre, r.date, r.heure FROM reunion_eleves re JOIN reunions r ON r.id=re.reunion_id WHERE re.eleve_id=? ORDER BY r.date DESC", (eid,))
    return render_template("eleve.html", e=e, pp=pp, equipe=equipe_liste, incidents=incidents_, documents=documents_, reunions=reunions_,
                           inf=infos_infirmerie(eid))


@app.route("/eleves/completer", methods=["GET", "POST"])
@staff_only
def eleves_completer():
    """Saisie rapide : un tableau par classe pour compléter date de naissance, sexe, adresse, téléphone et e-mail de plusieurs élèves d'un coup."""
    classe = request.values.get("classe", "")
    if request.method == "POST":
        n = 0
        for e in q("SELECT id FROM eleves WHERE etab_id=?", (g.etab_id,)):
            i = e["id"]
            if f"date_naissance_{i}" not in request.form:
                continue
            f = request.form
            run("UPDATE eleves SET date_naissance=?, sexe=?, adresse=?, code_postal=?, ville=?, telephone=?, contact=?, responsable=? WHERE id=?",
                (parse_naissance(f.get(f"date_naissance_{i}")), norm_sexe(f.get(f"sexe_{i}")), f.get(f"adresse_{i}", "").strip()[:200], f.get(f"code_postal_{i}", "").strip()[:10],
                 f.get(f"ville_{i}", "").strip()[:80], f.get(f"telephone_{i}", "").strip()[:30], f.get(f"contact_{i}", "").strip(), f.get(f"responsable_{i}", "").strip(), i))
            n += 1
        log("fiches élèves complétées", f"{n} élève(s), classe {classe}")
        flash(f"{n} fiche(s) enregistrée(s).", "ok")
        return redirect(url_for("eleves_completer", classe=classe))
    rows = q("SELECT * FROM eleves WHERE etab_id=? " + ("AND classe=? " if classe else "") + "ORDER BY classe, nom, prenom LIMIT 80",
             (g.etab_id, classe) if classe else (g.etab_id,))
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    incomplets = one("SELECT COUNT(*) c FROM eleves WHERE etab_id=? AND (date_naissance='' OR adresse='' OR sexe='')", (g.etab_id,))["c"]
    return render_template("eleves_completer.html", rows=rows, classes=classes_, classe=classe, incomplets=incomplets)


@app.route("/eleves/<int:eid>/modifier", methods=["POST"])
@staff_only
def eleve_modifier(eid):
    f = request.form
    if f.get("nom", "").strip() and one("SELECT 1 FROM eleves WHERE id=? AND etab_id=?", (eid, g.etab_id)):
        run("UPDATE eleves SET nom=?, prenom=?, classe=?, responsable=?, contact=?, date_naissance=?, sexe=?, adresse=?, code_postal=?, ville=?, telephone=? WHERE id=?",
            (f["nom"].strip(), f.get("prenom", "").strip(), f.get("classe", "").strip(), f.get("responsable", "").strip(), f.get("contact", "").strip(),
             parse_naissance(f.get("date_naissance")), norm_sexe(f.get("sexe")), f.get("adresse", "").strip()[:200], f.get("code_postal", "").strip()[:10],
             f.get("ville", "").strip()[:80], f.get("telephone", "").strip()[:30], eid))
        log("fiche élève modifiée", f"{f['nom']} {f.get('prenom', '')}")
        flash("Fiche enregistrée.", "ok")
    return redirect(url_for("eleve_fiche", eid=eid))


@app.route("/eleves/<int:eid>/supprimer", methods=["POST"])
@staff_only
def eleve_supprimer(eid):
    e = one("SELECT * FROM eleves WHERE id=? AND etab_id=?", (eid, g.etab_id))
    if e:
        run("DELETE FROM eleves WHERE id=?", (eid,))
        log("élève supprimé", f"{e['nom']} {e['prenom']}")
    return redirect(url_for("eleves"))


# ───────────────────────── Rédaction assistée de documents ─────────────────────────
MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
JOURS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


def date_longue(iso):
    """'2026-10-27' -> 'mardi 27 octobre 2026' (même rendu que le formulaire côté navigateur)."""
    try:
        d = date.fromisoformat(iso)
    except (TypeError, ValueError):
        return iso or ""
    return f"{JOURS_FR[d.weekday()]} {'1er' if d.day == 1 else d.day} {MOIS_FR[d.month - 1]} {d.year}"


def remplir(texte, ctx):
    """Remplace {{variable}} par sa valeur ; une variable inconnue reste telle quelle."""
    return re.sub(r"\{\{\s*(\w+)\s*\}\}", lambda m: str(ctx.get(m.group(1), m.group(0))), texte or "")


def nom_complet(p):
    return f"{p['prenom']} {p['nom']}".strip()


def classes_enseignees():
    """Classes où intervient l'enseignant connecté (pour limiter ses choix)."""
    if not g.prof:
        return set()
    return {r["classe"] for r in q("SELECT DISTINCT classe FROM creneaux WHERE prof_id=?", (g.prof["id"],))}


def equipe_et_pp(classe):
    equipe = [{"prof_id": r["prof_id"], "nom": f"{r['prenom']} {r['nom']}".strip(), "matiere": r["matiere"]} for r in
              q("SELECT DISTINCT c.prof_id, p.nom, p.prenom, c.matiere FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
                "WHERE c.etab_id=? AND c.classe=? ORDER BY c.matiere, p.nom", (g.etab_id, classe))]
    cl = one("SELECT c.*, p.nom pnom, p.prenom pprenom, p.matiere pmat FROM classes c LEFT JOIN professeurs p ON p.id=c.prof_principal_id "
             "WHERE c.etab_id=? AND c.nom=?", (g.etab_id, classe))
    pp = None
    if cl and cl["prof_principal_id"]:
        mat = next((e["matiere"] for e in equipe if e["prof_id"] == cl["prof_principal_id"]), cl["pmat"])
        pp = {"prof_id": cl["prof_principal_id"], "nom": f"{cl['pprenom']} {cl['pnom']}".strip(), "matiere": mat}
    return equipe, pp


def donnees_redaction():
    installer_modeles(db(), g.etab_id)
    staff = g.user["role"] in STAFF
    autorisees = None if staff else classes_enseignees()
    modeles_ = [dict(id=m["id"], titre=m["titre"], corps=m["corps"], avec_incident=bool(m["avec_incident"]))
                for m in q("SELECT * FROM modeles_documents WHERE etab_id=? ORDER BY id", (g.etab_id,))
                if staff or m["ouvert_enseignants"]]
    types = [dict(id=t["id"], libelle=t["libelle"], texte=t["texte"])
             for t in q("SELECT * FROM types_incident WHERE etab_id=? ORDER BY id", (g.etab_id,))]
    eleves_ = [dict(id=e["id"], nom=f"{e['prenom']} {e['nom']}".strip(), classe=e["classe"], responsable=e["responsable"])
               for e in q("SELECT * FROM eleves WHERE etab_id=? ORDER BY classe, nom, prenom", (g.etab_id,))
               if autorisees is None or e["classe"] in autorisees]
    classes_ = {}
    for c in sorted({e["classe"] for e in eleves_}):
        equipe, pp = equipe_et_pp(c)
        classes_[c] = {"equipe": equipe, "pp": pp}
    return {"modeles": modeles_, "types": types, "eleves": eleves_, "classes": classes_, "etablissement": g.etab["nom"],
            "auteur": g.user["nom"], "today": date.today().isoformat(), "variables": VARIABLES}


def contexte_document(f, eleve):
    libelle = f.get("type_libelle", "").strip()
    if libelle.startswith("Autre") and f.get("type_autre", "").strip():
        libelle = f["type_autre"].strip()
    return construire_ctx(eleve, f.get("prof_id", type=int) if f.get("prof_id") else None, f.get("matiere", ""), f.get("date", ""),
                          f.get("heure", ""), f.get("lieu", ""), libelle, f.get("description", ""), f.get("suite", ""))


def construire_ctx(eleve, prof_id=None, matiere="", date_iso="", heure="", lieu="", libelle="", description="", suite=""):
    classe = eleve["classe"] if eleve else ""
    _, pp = equipe_et_pp(classe) if classe else ([], None)
    prof = one("SELECT * FROM professeurs WHERE id=? AND etab_id=?", (prof_id, g.etab_id)) if prof_id else None
    ctx = {
        "eleve": nom_complet(eleve) if eleve else "", "prenom": eleve["prenom"] if eleve else "", "nom": eleve["nom"] if eleve else "",
        "classe": classe, "responsable": (eleve["responsable"] if eleve and eleve["responsable"] else "Madame, Monsieur"),
        "professeur": nom_complet(prof) if prof else "", "matiere": matiere.strip() or (prof["matiere"] if prof else ""),
        "prof_principal": pp["nom"] if pp else "", "date": date_longue(date_iso), "heure": heure.strip(),
        "lieu": lieu.strip(), "type_incident": libelle, "auteur": g.user["nom"],
        "date_du_jour": date_longue(date.today().isoformat()), "etablissement": g.etab["nom"],
    }
    ctx["description"] = remplir(description.strip(), ctx)
    ctx["suite"] = remplir(suite.strip(), ctx)
    return ctx


def dimensions_image(data):
    """(largeur, hauteur) d'un PNG ou JPEG, sinon None."""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if data[:3] == b"\xff\xd8\xff":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marq = data[i + 1]
            if marq in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    return None


def fabriquer_docx(titre, contenu, etablissement, entete=None, signes=(), logo=None, fait_le=""):
    """Document Word (.docx) : logo et en-tête de l'établissement, titre, texte, « Fait à… le… », signataires, pied de page."""
    entete = entete or {}

    def para(texte, gras=False, centre=False, taille=None, droite=False, italique=False):
        jc = "center" if centre else ("right" if droite else "")
        ppr = f'<w:pPr><w:spacing w:after="40"/>{f"<w:jc w:val={chr(34)}{jc}{chr(34)}/>" if jc else ""}</w:pPr>'
        rpr = ("<w:rPr>" + ("<w:b/>" if gras else "") + ("<w:i/>" if italique else "") + (f'<w:sz w:val="{taille}"/>' if taille else "") + "</w:rPr>") \
            if (gras or taille or italique) else ""
        return f'<w:p>{ppr}<w:r>{rpr}<w:t xml:space="preserve">{xml_escape(texte)}</w:t></w:r></w:p>'

    corps = []
    dim = dimensions_image(logo[1]) if logo else None
    if logo and dim:
        cx = int(2.6 * 360000)
        cy = int(cx * dim[1] / dim[0])
        corps.append('<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="%d" cy="%d"/><wp:docPr id="1" name="Logo"/>'
                     '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="logo"/><pic:cNvPicPr/></pic:nvPicPr>'
                     '<pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
                     '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="%d" cy="%d"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>'
                     '</wp:inline></w:drawing></w:r></w:p>' % (cx, cy, cx, cy))
    if entete.get("ligne_haut"):
        corps.append(para(entete["ligne_haut"], taille=18, italique=True))
    corps.append(para(entete.get("nom_affiche") or etablissement, gras=True, taille=28))
    for l in (entete.get("adresse"), entete.get("contact")):
        if l:
            corps.append(para(l, taille=18))
    corps += [para(""), para(titre, gras=True, centre=True, taille=32), para("")]
    corps += [para(l) for l in contenu.replace("\r\n", "\n").split("\n")]
    if signes or fait_le:
        corps += [para(""), para(fait_le, droite=True) if fait_le else para("")]
    if signes:
        cell = lambda nom, fonction: ('<w:tc><w:tcPr><w:tcW w:w="%d" w:type="dxa"/></w:tcPr>%s%s%s</w:tc>' % (
            9000 // len(signes), para(fonction, gras=True, centre=True), para("", centre=True) * 3, para(nom, centre=True)))
        corps.append('<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/></w:tblPr><w:tr>' + "".join(cell(n, f) for n, f in signes) + "</w:tr></w:tbl>")
    if entete.get("pied"):
        corps += [para(""), para(entete["pied"], centre=True, taille=16, italique=True)]
    ns = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
          'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
          'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"')
    xml = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' f'<w:document {ns}><w:body>'
           + "".join(corps) + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" '
           'w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>')
    ext_logo = "png" if logo and logo[0] == "image/png" else "jpeg"
    avec_logo = bool(logo and dim)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   + (f'<Default Extension="{ext_logo}" ContentType="image/{ext_logo}"/>' if avec_logo else "") +
                   '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        if avec_logo:
            z.writestr("word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                       '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                       f'<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.{ext_logo}"/></Relationships>')
            z.writestr(f"word/media/logo.{ext_logo}", logo[1])
        z.writestr("word/document.xml", xml)
    return buf.getvalue()



# ───────────────────────── En-tête commun et signataires des documents ─────────────────────────
def entete_documents():
    """En-tête de l'établissement courant (jamais None : valeurs vides si rien n'est saisi)."""
    r = one("SELECT etab_id,ligne_haut,nom_affiche,adresse,telephone,email,site,pied,ville,logo_mime,(logo IS NOT NULL AND length(logo)>0) a_logo "
            "FROM entete_documents WHERE etab_id=?", (g.etab_id,))
    d = dict(r) if r else {k: "" for k in ("ligne_haut", "nom_affiche", "adresse", "telephone", "email", "site", "pied", "ville", "logo_mime")}
    d["nom_affiche"] = d.get("nom_affiche") or g.etab["nom"]
    d["a_logo"] = bool(d.get("a_logo"))
    d["contact"] = " · ".join(x for x in (d.get("telephone"), d.get("email"), d.get("site")) if x)
    return d


def signataires_actifs():
    return q("SELECT * FROM signataires WHERE etab_id=? AND actif=1 ORDER BY ordre,id", (g.etab_id,))


def signataires_choisis(form=None):
    """Copie figée [[nom, fonction], ...] : ceux cochés dans le formulaire, sinon ceux marqués « par défaut »."""
    liste = signataires_actifs()
    if form is not None and form.get("signataires_envoyes"):
        ids = {int(x) for x in form.getlist("signataire") if x.isdigit()}
        choisis = [s for s in liste if s["id"] in ids]
    else:
        choisis = [s for s in liste if s["par_defaut"]]
    return json.dumps([[s["nom"], s["fonction"]] for s in choisis], ensure_ascii=False)


def lire_signataires(d):
    try:
        return [tuple(x) for x in json.loads(d["signataires"] or "[]")]
    except (ValueError, TypeError, KeyError):
        return []


@app.route("/documents/entete")
def logo_entete():
    r = one("SELECT logo_mime, logo FROM entete_documents WHERE etab_id=?", (g.etab_id,))
    if not r or not r["logo"]:
        abort(404)
    resp = Response(r["logo"], mimetype=r["logo_mime"])
    resp.headers["Cache-Control"] = "private, no-cache"
    return resp


@app.route("/documents/parametres", methods=["GET", "POST"])
@staff_only
def documents_parametres():
    """Un seul endroit pour l'en-tête, le pied de page, le logo et les signataires de TOUS les documents de l'établissement."""
    if request.method == "POST":
        f, action = request.form, request.form.get("action", "entete")
        if action == "entete":
            champs = {k: f.get(k, "").strip()[:300] for k in ("ligne_haut", "nom_affiche", "adresse", "telephone", "email", "site", "pied", "ville")}
            run("INSERT OR IGNORE INTO entete_documents(etab_id) VALUES (?)", (g.etab_id,))
            run("UPDATE entete_documents SET ligne_haut=?,nom_affiche=?,adresse=?,telephone=?,email=?,site=?,pied=?,ville=? WHERE etab_id=?",
                (*[champs[k] for k in ("ligne_haut", "nom_affiche", "adresse", "telephone", "email", "site", "pied", "ville")], g.etab_id))
            fl = request.files.get("logo")
            if f.get("supprimer_logo"):
                run("UPDATE entete_documents SET logo=NULL, logo_mime='' WHERE etab_id=?", (g.etab_id,))
            elif fl and fl.filename:
                data = fl.read(PHOTO_MAX + 1)
                if len(data) > PHOTO_MAX or type_image(data) not in ("image/jpeg", "image/png"):
                    flash("Logo non enregistré : image JPEG ou PNG de 400 Ko maximum.", "err")
                else:
                    run("UPDATE entete_documents SET logo=?, logo_mime=? WHERE etab_id=?", (data, type_image(data), g.etab_id))
            log("en-tête des documents modifié", g.etab["nom"])
            flash("En-tête enregistré : il s'applique à tous les documents.", "ok")
        elif action == "ajouter" and f.get("nom", "").strip():
            n = one("SELECT COALESCE(MAX(ordre),-1)+1 n FROM signataires WHERE etab_id=?", (g.etab_id,))["n"]
            run("INSERT INTO signataires(etab_id,nom,fonction,ordre,par_defaut) VALUES (?,?,?,?,?)",
                (g.etab_id, f["nom"].strip()[:120], f.get("fonction", "").strip()[:120], n, 1 if f.get("par_defaut") else 0))
            flash("Signataire ajouté.", "ok")
        elif action in ("modifier", "supprimer", "monter", "descendre"):
            sid = f.get("id", type=int)
            s_ = one("SELECT * FROM signataires WHERE id=? AND etab_id=?", (sid, g.etab_id))
            if not s_:
                abort(404)
            if action == "supprimer":
                run("DELETE FROM signataires WHERE id=?", (sid,))
            elif action == "modifier":
                run("UPDATE signataires SET nom=?,fonction=?,par_defaut=?,actif=? WHERE id=?",
                    (f.get("nom", "").strip()[:120] or s_["nom"], f.get("fonction", "").strip()[:120], 1 if f.get("par_defaut") else 0,
                     1 if f.get("actif") else 0, sid))
                flash("Signataire modifié.", "ok")
            else:
                autre = one("SELECT * FROM signataires WHERE etab_id=? AND " + ("ordre<? ORDER BY ordre DESC" if action == "monter" else "ordre>? ORDER BY ordre")
                            + " LIMIT 1", (g.etab_id, s_["ordre"]))
                if autre:
                    run("UPDATE signataires SET ordre=? WHERE id=?", (autre["ordre"], sid))
                    run("UPDATE signataires SET ordre=? WHERE id=?", (s_["ordre"], autre["id"]))
            log("signataires des documents", action)
        return redirect(url_for("documents_parametres"))
    liste = q("SELECT * FROM signataires WHERE etab_id=? ORDER BY ordre,id", (g.etab_id,))
    return render_template("documents_parametres.html", e=entete_documents(), signataires=liste)


@app.route("/documents/nouveau", methods=["GET", "POST"])
def document_nouveau():
    staff = g.user["role"] in STAFF
    if not staff and not g.prof:
        abort(403)
    donnees = donnees_redaction()
    if request.method == "POST":
        f = request.form
        modele = next((m for m in donnees["modeles"] if m["id"] == f.get("modele_id", type=int)), None)
        eleve = one("SELECT * FROM eleves WHERE id=? AND etab_id=?", (f.get("eleve_id", type=int), g.etab_id)) if f.get("eleve_id") else None
        if not modele or (eleve and eleve["id"] not in {e["id"] for e in donnees["eleves"]}):
            abort(403)
        if not f.get("contenu", "").strip():
            flash("Le document est vide.", "err")
            return redirect(url_for("document_nouveau"))
        ctx = contexte_document(f, eleve)
        contenu = remplir(f["contenu"].strip(), ctx)
        titre = (f.get("titre", "").strip() or modele["titre"] + (f" — {ctx['eleve']}" if ctx["eleve"] else ""))[:200]
        incident_id = None
        ref = one("SELECT id FROM incidents WHERE id=? AND etab_id=?", (f.get("incident_ref", type=int), g.etab_id)) if staff and f.get("incident_ref") else None
        if ref:   # document rédigé à partir d'un incident déjà enregistré : on le relie, on n'en crée pas un second
            incident_id = ref["id"]
        elif staff and f.get("creer_incident") and eleve and modele["avec_incident"]:
            incident_id = run("INSERT INTO incidents(etab_id,date,classe,eleve,description,suite,eleve_id) VALUES (?,?,?,?,?,?,?)",
                              (g.etab_id, parse_date(f.get("date")).isoformat(), eleve["classe"], ctx["eleve"],
                               (ctx["type_incident"] + " — " if ctx["type_incident"] else "") + ctx["description"], ctx["suite"], eleve["id"]))
        did = run("INSERT INTO documents_generes(etab_id,modele_id,type,titre,eleve_id,eleve_nom,prof_id,contenu,auteur_id,auteur,created_at,incident_id,signataires) "
                  "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                  (g.etab_id, modele["id"], modele["titre"], titre, eleve["id"] if eleve else None, ctx["eleve"], f.get("prof_id", type=int),
                   contenu, g.user["id"], g.user["nom"], datetime.now().isoformat(timespec="minutes"), incident_id, signataires_choisis(f)))
        log("document rédigé", f"{modele['titre']} — {ctx['eleve']}")
        ext.emit("document.genere", document_id=did, modele=modele["titre"], eleve_id=eleve["id"] if eleve else None, auteur=g.user["nom"])
        flash("Document enregistré." + (" Un incident a aussi été créé." if incident_id else ""), "ok")
        return redirect(url_for("document_genere", did=did))
    inc = one("SELECT * FROM incidents WHERE id=? AND etab_id=?", (request.args.get("incident", type=int), g.etab_id)) if staff and request.args.get("incident") else None
    prefill = None
    if inc:
        prefill = {"id": inc["id"], "date": inc["date"], "description": inc["description"], "suite": inc["suite"] or ""}
    return render_template("document_nouveau.html", signataires=signataires_actifs(), donnees=donnees, staff=staff, aucun_eleve=not donnees["eleves"],
                           eleve_initial=(inc["eleve_id"] if inc and inc["eleve_id"] else request.args.get("eleve", type=int)) or "", incident=prefill)


def get_document(did):
    d = one("SELECT * FROM documents_generes WHERE id=? AND etab_id=?", (did, g.etab_id))
    if not d or (g.user["role"] not in STAFF and d["auteur_id"] != g.user["id"]):
        abort(404)
    return d


@app.route("/documents/generes/<int:did>")
def document_genere(did):
    d = get_document(did)
    return render_template("document_genere.html", d=d, e=entete_documents(), signes=lire_signataires(d), tous_signataires=signataires_actifs())


@app.route("/documents/generes/<int:did>.docx")
def document_genere_docx(did):
    d = get_document(did)
    nom = re.sub(r"[^\w-]+", "_", d["titre"]).strip("_")[:60] or "document"
    log("document exporté (Word)", d["titre"])
    ent = entete_documents()
    lg = one("SELECT logo_mime, logo FROM entete_documents WHERE etab_id=?", (g.etab_id,))
    logo = (lg["logo_mime"], lg["logo"]) if lg and lg["logo"] else None
    ville = ent["ville"]
    fait_le = (f"Fait à {ville}, le " if ville else "Fait le ") + date_longue(d["created_at"][:10]) if lire_signataires(d) else ""
    return Response(fabriquer_docx(d["titre"], d["contenu"], g.etab["nom"], ent, lire_signataires(d), logo, fait_le),
                    mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    headers={"Content-Disposition": f"attachment; filename={nom}.docx"})


@app.route("/documents/generes/<int:did>/modifier", methods=["POST"])
def document_genere_modifier(did):
    d = get_document(did)
    if not request.form.get("contenu", "").strip():
        flash("Le document ne peut pas être vide.", "err")
    else:
        run("UPDATE documents_generes SET titre=?, contenu=?, signataires=? WHERE id=?",
            (request.form.get("titre", "").strip()[:200] or d["titre"], request.form["contenu"].strip(),
             signataires_choisis(request.form) if request.form.get("signataires_envoyes") else d["signataires"], did))
        log("document modifié", d["titre"])
        flash("Modifications enregistrées.", "ok")
    return redirect(url_for("document_genere", did=did))


@app.route("/documents/generes/<int:did>/supprimer", methods=["POST"])
def document_genere_supprimer(did):
    d = get_document(did)
    run("DELETE FROM documents_generes WHERE id=?", (did,))
    log("document supprimé", d["titre"])
    return redirect(url_for("documents"))


@app.route("/documents/modeles", methods=["GET", "POST"])
@staff_only
def modeles_documents():
    installer_modeles(db(), g.etab_id)
    if request.method == "POST":
        f = request.form
        if f.get("titre", "").strip() and f.get("corps", "").strip():
            run("INSERT INTO modeles_documents(etab_id,code,titre,corps,ouvert_enseignants,avec_incident) VALUES (?,?,?,?,?,?)",
                (g.etab_id, "", f["titre"].strip(), f["corps"].strip(), 1 if f.get("ouvert_enseignants") else 0, 1 if f.get("avec_incident") else 0))
            log("modèle créé", f["titre"])
        else:
            flash("Titre et texte obligatoires.", "err")
        return redirect(url_for("modeles_documents"))
    return render_template("modeles_documents.html", variables=VARIABLES,
                           modeles=q("SELECT * FROM modeles_documents WHERE etab_id=? ORDER BY id", (g.etab_id,)),
                           types=q("SELECT * FROM types_incident WHERE etab_id=? ORDER BY id", (g.etab_id,)))


@app.route("/documents/modeles/<int:mid>", methods=["GET", "POST"])
@staff_only
def modele_edit(mid):
    m = one("SELECT * FROM modeles_documents WHERE id=? AND etab_id=?", (mid, g.etab_id))
    if not m:
        abort(404)
    if request.method == "POST":
        f = request.form
        if f.get("titre", "").strip() and f.get("corps", "").strip():
            run("UPDATE modeles_documents SET titre=?, corps=?, ouvert_enseignants=?, avec_incident=? WHERE id=?",
                (f["titre"].strip(), f["corps"].strip(), 1 if f.get("ouvert_enseignants") else 0, 1 if f.get("avec_incident") else 0, mid))
            log("modèle modifié", f["titre"])
            flash("Modèle enregistré.", "ok")
            return redirect(url_for("modeles_documents"))
        flash("Titre et texte obligatoires.", "err")
    return render_template("modele_edit.html", m=m, variables=VARIABLES)


@app.route("/documents/modeles/<int:mid>/supprimer", methods=["POST"])
@staff_only
def modele_supprimer(mid):
    run("DELETE FROM modeles_documents WHERE id=? AND etab_id=?", (mid, g.etab_id))
    return redirect(url_for("modeles_documents"))


@app.route("/documents/types", methods=["POST"])
@staff_only
def type_incident_ajouter():
    f = request.form
    if f.get("libelle", "").strip():
        run("INSERT INTO types_incident(etab_id,libelle,texte,gravite) VALUES (?,?,?,?)",
            (g.etab_id, f["libelle"].strip(), f.get("texte", "").strip(), f.get("gravite") if f.get("gravite") in ("mineur", "moyen", "grave") else "mineur"))
        log("type d'incident ajouté", f["libelle"])
    return redirect(url_for("modeles_documents"))


@app.route("/documents/types/<int:tid>", methods=["POST"])
@staff_only
def type_incident_modifier(tid):
    f = request.form
    if f.get("libelle", "").strip():
        run("UPDATE types_incident SET libelle=?, texte=?, gravite=? WHERE id=? AND etab_id=?",
            (f["libelle"].strip(), f.get("texte", "").strip(), f.get("gravite") if f.get("gravite") in ("mineur", "moyen", "grave") else "mineur", tid, g.etab_id))
    return redirect(url_for("modeles_documents"))


@app.route("/documents/types/<int:tid>/supprimer", methods=["POST"])
@staff_only
def type_incident_supprimer(tid):
    run("DELETE FROM types_incident WHERE id=? AND etab_id=?", (tid, g.etab_id))
    return redirect(url_for("modeles_documents"))


# ───────────────────────── Infirmerie : planning des soins, passages, fiches santé ─────────────────────────
# Données de santé : accès limité aux rôles de roles_infirmerie() ; la consultation d'une fiche santé est journalisée.
MOTIFS_PASSAGE = ["Mal de tête", "Mal au ventre", "Nausées", "Fièvre", "Chute / blessure", "Choc à la tête", "Malaise", "Saignement de nez",
                  "Crise d'asthme", "Allergie", "Stress / angoisse", "Délivrance d'un médicament (PAI)", "Autre"]
DECISIONS_PASSAGE = ["Retour en classe", "Repos à l'infirmerie", "Rentrée à domicile", "Appel des secours", "Orientation vers un médecin"]
TYPES_SOINS = ["Pansement", "Contrôle de glycémie", "Administration d'un traitement", "Prise de température", "Contrôle après blessure",
               "Injection", "Vaccination", "Surveillance", "Soin des yeux", "Bilan infirmier"]
STATUTS_SOIN = {"fait": "Fait", "absent": "Élève absent", "annule": "Annulé"}


def soin_a_lieu(s, jour):
    """Un soin ponctuel a lieu à sa date ; un soin récurrent chaque jour de la semaine coché, entre ses dates de début et de fin."""
    iso = jour.isoformat()
    if not s["actif"] or s["date_debut"] > iso or (s["date_fin"] and s["date_fin"] < iso):
        return False
    if not s["jours"]:
        return s["date_debut"] == iso
    return str(jour.weekday()) in s["jours"].split(",")


def occurrences_soins(jour):
    iso, maintenant = jour.isoformat(), datetime.now()
    lignes = q("SELECT s.*, e.nom enom, e.prenom eprenom, e.classe, fs.pai, fs.allergies, sr.statut rstatut, sr.note rnote, sr.par_nom rpar "
               "FROM soins s JOIN eleves e ON e.id=s.eleve_id LEFT JOIN fiches_sante fs ON fs.eleve_id=e.id "
               "LEFT JOIN soins_realises sr ON sr.soin_id=s.id AND sr.date=? "
               "WHERE s.etab_id=? AND s.actif=1 AND s.date_debut<=? AND (s.date_fin='' OR s.date_fin>=?) ORDER BY s.heure, e.nom",
               (iso, g.etab_id, iso, iso))
    out = []
    for s in lignes:
        if not soin_a_lieu(s, jour):
            continue
        d = dict(s)
        d["statut"] = s["rstatut"] or "a_faire"
        fin = datetime.strptime(f"{iso} {s['heure']}", "%Y-%m-%d %H:%M") + timedelta(minutes=s["duree"])
        d["en_retard"] = d["statut"] == "a_faire" and fin < maintenant
        d["cours"] = cours_pendant_soin(s, jour, fin.strftime("%H:%M"))
        d["prevenu"] = bool(one("SELECT 1 FROM soins_prevenus WHERE soin_id=? AND date=?", (s["id"], iso)))
        out.append(d)
    return out


def cours_pendant_soin(s, jour, fin_soin):
    """Cours de la classe de l'élève pendant le soin : professeur en charge (le remplaçant s'il y en a un), ou cours annulé."""
    res = []
    for c in q("SELECT c.id, c.matiere, c.debut, c.fin, c.salle, p.id pid, p.nom, p.prenom, p.user_id FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
               "WHERE c.etab_id=? AND c.classe=? AND c.jour=? AND c.debut<? AND c.fin>?", (g.etab_id, s["classe"], jour.weekday(), fin_soin, s["heure"])):
        item = {"matiere": c["matiere"], "salle": c["salle"], "debut": c["debut"], "fin": c["fin"], "nom": f"{c['prenom']} {c['nom']}", "user_id": c["user_id"],
                "annule": False, "remplacant": False}
        r = one("SELECT r.statut, r.remplacant_id FROM remplacements r WHERE r.creneau_id=? AND r.date=?", (c["id"], jour.isoformat()))
        if r and r["statut"] == "annule":
            item["annule"] = True
        elif r and r["remplacant_id"]:
            rp = one("SELECT nom, prenom, user_id FROM professeurs WHERE id=?", (r["remplacant_id"],))
            item.update(nom=f"{rp['prenom']} {rp['nom']}", user_id=rp["user_id"], remplacant=True)
        elif r:   # professeur absent, remplacement à pourvoir : personne à prévenir pour l'instant
            item.update(nom="remplaçant à désigner", user_id=None)
        res.append(item)
    return res


def prevenir_professeurs(sid, jour):
    """Prévient le(s) professeur(s) en charge qu'un élève quitte leur cours pour l'infirmerie (aucune information médicale)."""
    s = one("SELECT s.*, e.nom enom, e.prenom eprenom, e.classe FROM soins s JOIN eleves e ON e.id=s.eleve_id WHERE s.id=? AND s.etab_id=?", (sid, g.etab_id))
    if not s or not soin_a_lieu(s, jour):
        return None
    fin = (datetime.strptime(s["heure"], "%H:%M") + timedelta(minutes=s["duree"])).strftime("%H:%M")
    n = 0
    for c in cours_pendant_soin(s, jour, fin):
        if c["annule"] or not c["user_id"]:
            continue
        n += notifier([c["user_id"]], f"Infirmerie : {s['eprenom']} {s['enom']} à {s['heure']}",
                      f"L'élève {s['eprenom']} {s['enom']} ({s['classe']}) doit se rendre à l'infirmerie le {date_longue(jour.isoformat())} à {s['heure']} "
                      f"(environ {s['duree']} min), pendant le cours de {c['matiere']}. Merci de l'autoriser à sortir.\n\nMessage automatique de l'infirmerie.")
    run("INSERT OR REPLACE INTO soins_prevenus(soin_id,date,at) VALUES (?,?,?)", (sid, jour.isoformat(), datetime.now().isoformat(timespec="minutes")))
    return n


@app.route("/infirmerie/prevenir/<int:sid>/<jour>", methods=["POST"])
@infirmerie_only
def infirmerie_prevenir(sid, jour):
    d = parse_date(jour)
    n = prevenir_professeurs(sid, d)
    if n is None:
        abort(404)
    log("professeur prévenu (soin)", f"soin {sid} le {d}")
    flash(f"{n} professeur(s) prévenu(s) par message." if n else "Aucun professeur à prévenir (hors cours, cours annulé ou remplaçant pas encore désigné).", "ok")
    return redirect(url_for("infirmerie", date=d.isoformat()))


@app.route("/infirmerie/prevenir-jour/<jour>", methods=["POST"])
@infirmerie_only
def infirmerie_prevenir_jour(jour):
    d = parse_date(jour)
    total = 0
    for o in occurrences_soins(d):
        if o["statut"] == "a_faire" and not o["prevenu"] and any(c["user_id"] and not c["annule"] for c in o["cours"]):
            total += prevenir_professeurs(o["id"], d) or 0
    log("professeurs prévenus (soins du jour)", f"{d}: {total}")
    flash(f"{total} message(s) envoyé(s) aux professeurs concernés." if total else "Tous les professeurs concernés sont déjà prévenus.", "ok")
    return redirect(url_for("infirmerie", date=d.isoformat()))


def resume_recurrence(s):
    if not s["jours"]:
        return f"Le {fr_date(s['date_debut'])} à {s['heure']}"
    noms = [JOURS[int(j)] + "s" for j in s["jours"].split(",") if j.strip().isdigit() and int(j) < 5]
    texte = f"Chaque {', '.join(n.lower() for n in noms)} à {s['heure']}" if noms else f"À {s['heure']}"
    return texte + f" · du {fr_date(s['date_debut'])}" + (f" au {fr_date(s['date_fin'])}" if s["date_fin"] else " (sans fin)")


app.jinja_env.globals["resume_recurrence"] = resume_recurrence


@app.route("/infirmerie")
@infirmerie_only
def infirmerie():
    jour = parse_date(request.args.get("date"))
    vue = "semaine" if request.args.get("vue") == "semaine" else "jour"
    ctx = {"jour": jour, "vue": vue, "veille": (jour - timedelta(days=1)).isoformat(), "lendemain": (jour + timedelta(days=1)).isoformat()}
    if vue == "jour":
        occ = occurrences_soins(jour)
        ctx.update(occ=occ, nb_faits=sum(1 for o in occ if o["statut"] == "fait"), nb_attente=sum(1 for o in occ if o["statut"] == "a_faire"),
                   nb_passages=one("SELECT COUNT(*) c FROM passages WHERE etab_id=? AND date=?", (g.etab_id, jour.isoformat()))["c"])
    else:
        lundi = jour - timedelta(days=jour.weekday())
        jours_ = [lundi + timedelta(days=i) for i in range(5)]
        ctx.update(semaine=jours_, grille={d.isoformat(): occurrences_soins(d) for d in jours_}, lundi=lundi,
                   veille=(lundi - timedelta(days=7)).isoformat(), lendemain=(lundi + timedelta(days=7)).isoformat())
    return render_template("infirmerie.html", **ctx)


@app.route("/infirmerie/realise/<int:sid>/<jour>/<statut>", methods=["POST"])
@infirmerie_only
def infirmerie_realise(sid, jour, statut):
    s = one("SELECT * FROM soins WHERE id=? AND etab_id=?", (sid, g.etab_id))
    d = parse_date(jour)
    if not s or statut not in ("fait", "absent", "annule", "reset") or not soin_a_lieu(s, d):
        abort(404)
    if statut == "reset":
        run("DELETE FROM soins_realises WHERE soin_id=? AND date=?", (sid, d.isoformat()))
    else:
        run("INSERT INTO soins_realises(soin_id,date,statut,note,par_nom,at) VALUES (?,?,?,?,?,?) "
            "ON CONFLICT(soin_id,date) DO UPDATE SET statut=excluded.statut, note=excluded.note, par_nom=excluded.par_nom, at=excluded.at",
            (sid, d.isoformat(), statut, request.form.get("note", "").strip()[:300], g.user["nom"], datetime.now().isoformat(timespec="minutes")))
    log("soin " + statut, f"soin {sid} le {d}")
    return redirect(url_for("infirmerie", date=d.isoformat(), vue=request.form.get("vue") or None))


@app.route("/infirmerie/soins", methods=["GET", "POST"])
@infirmerie_only
def infirmerie_soins():
    if request.method == "POST":
        f = request.form
        eleve = one("SELECT * FROM eleves WHERE id=? AND etab_id=?", (f.get("eleve_id", type=int), g.etab_id)) if f.get("eleve_id") else None
        jours_ = ",".join(str(j) for j in range(5) if f.get(f"jour_{j}")) if f.get("mode") == "recurrent" else ""
        debut = parse_date(f.get("date_debut")).isoformat()
        fin = parse_date(f.get("date_fin")).isoformat() if f.get("date_fin") and jours_ else ""
        duree = f.get("duree", type=int) or 15
        erreur = None
        if not eleve:
            erreur = "Choisissez un élève."
        elif not f.get("intitule", "").strip():
            erreur = "Indiquez le soin à réaliser."
        elif not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", f.get("heure", "")):
            erreur = "Indiquez l'heure du soin."
        elif f.get("mode") == "recurrent" and not jours_:
            erreur = "Cochez au moins un jour pour un soin récurrent."
        elif fin and fin < debut:
            erreur = "La date de fin précède la date de début."
        elif not 5 <= duree <= 180:
            erreur = "La durée doit être comprise entre 5 et 180 minutes."
        if erreur:
            flash(erreur, "err")
        else:
            sid = run("INSERT INTO soins(etab_id,eleve_id,intitule,details,heure,duree,date_debut,date_fin,jours,cree_par) VALUES (?,?,?,?,?,?,?,?,?,?)",
                      (g.etab_id, eleve["id"], f["intitule"].strip()[:120], f.get("details", "").strip()[:500], f["heure"], duree, debut, fin, jours_, g.user["nom"]))
            log("soin programmé", f"{nom_complet(eleve)} — {f['intitule'].strip()}")
            ext.emit("soin.programme", soin_id=sid, eleve_id=eleve["id"], intitule=f["intitule"].strip())
            flash("Soin programmé.", "ok")
        return redirect(url_for("infirmerie_soins"))
    soins_ = q("SELECT s.*, e.nom enom, e.prenom eprenom, e.classe FROM soins s JOIN eleves e ON e.id=s.eleve_id WHERE s.etab_id=? "
               "ORDER BY s.actif DESC, (s.date_fin<>'' AND s.date_fin<?), e.nom, s.heure", (g.etab_id, date.today().isoformat()))
    eleves_ = q("SELECT id, nom, prenom, classe FROM eleves WHERE etab_id=? ORDER BY classe, nom, prenom", (g.etab_id,))
    return render_template("infirmerie_soins.html", soins=soins_, eleves=eleves_, types=TYPES_SOINS, aujourdhui=date.today().isoformat())


@app.route("/infirmerie/soins/<int:sid>/<action>", methods=["POST"])
@infirmerie_only
def infirmerie_soin_action(sid, action):
    if not one("SELECT 1 FROM soins WHERE id=? AND etab_id=?", (sid, g.etab_id)):
        abort(404)
    if action == "suspendre":
        run("UPDATE soins SET actif=0 WHERE id=?", (sid,))
    elif action == "reprendre":
        run("UPDATE soins SET actif=1 WHERE id=?", (sid,))
    elif action == "supprimer":
        run("DELETE FROM soins WHERE id=?", (sid,))
    else:
        abort(404)
    log("soin " + action, f"soin {sid}")
    return redirect(url_for("infirmerie_soins"))


def filtre_passages():
    fin = parse_date(request.args.get("au"))
    debut = parse_date(request.args.get("du"), fin - timedelta(days=30))
    return debut, fin


@app.route("/infirmerie/passages", methods=["GET", "POST"])
@infirmerie_only
def infirmerie_passages():
    if request.method == "POST":
        f = request.form
        eleve = one("SELECT * FROM eleves WHERE id=? AND etab_id=?", (f.get("eleve_id", type=int), g.etab_id)) if f.get("eleve_id") else None
        nom = nom_complet(eleve) if eleve else f.get("eleve_nom", "").strip()
        if not nom or not f.get("motif", "").strip():
            flash("Indiquez l'élève et le motif du passage.", "err")
        else:
            heure = f.get("heure", "") if re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", f.get("heure", "")) else datetime.now().strftime("%H:%M")
            pid = run("INSERT INTO passages(etab_id,eleve_id,eleve_nom,classe,date,heure,motif,soins,decision,parents_prevenus,note,par_nom) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                      (g.etab_id, eleve["id"] if eleve else None, nom, eleve["classe"] if eleve else "", parse_date(f.get("date")).isoformat(), heure,
                       f["motif"].strip()[:120], f.get("soins", "").strip()[:300], f.get("decision", "").strip()[:80], 1 if f.get("parents_prevenus") else 0,
                       f.get("note", "").strip()[:500], g.user["nom"]))
            log("passage enregistré", nom)
            ext.emit("passage.enregistre", passage_id=pid, eleve_id=eleve["id"] if eleve else None, motif=f["motif"].strip())
            decision = f.get("decision", "").strip()
            if eleve and ("domicile" in decision.lower() or "secours" in decision.lower()):
                # la vie scolaire doit enregistrer l'absence : elle est prévenue, ainsi que le professeur principal (sans le motif médical)
                _, pp = equipe_et_pp(eleve["classe"]) if eleve["classe"] else ([], None)
                dest = utilisateurs_personnel() + ([user_du_prof(pp["prof_id"])] if pp else [])
                action = "est rentré(e) à son domicile" if "domicile" in decision.lower() else "a été pris(e) en charge par les secours"
                nb = notifier(dest, f"Infirmerie : {nom_complet(eleve)} ({eleve['classe']}) {('rentre à domicile' if 'domicile' in decision.lower() else 'secours appelés')}",
                              f"{nom_complet(eleve)} ({eleve['classe']}) {action} à {heure}.\nParents prévenus : {'oui' if f.get('parents_prevenus') else 'non'}.\n"
                              "Merci d'enregistrer l'absence.\n\nMessage automatique de l'infirmerie (aucune information médicale).")
                flash(f"Passage enregistré. La vie scolaire et le professeur principal ont été prévenus ({nb} personne(s)).", "ok")
            else:
                flash("Passage enregistré.", "ok")
        return redirect(url_for("infirmerie_passages"))
    debut, fin = filtre_passages()
    rows = q("SELECT * FROM passages WHERE etab_id=? AND date BETWEEN ? AND ? ORDER BY date DESC, heure DESC LIMIT 500",
             (g.etab_id, debut.isoformat(), fin.isoformat()))
    motifs = q("SELECT motif, COUNT(*) n FROM passages WHERE etab_id=? AND date BETWEEN ? AND ? GROUP BY motif ORDER BY n DESC LIMIT 5",
               (g.etab_id, debut.isoformat(), fin.isoformat()))
    eleves_ = q("SELECT id, nom, prenom, classe FROM eleves WHERE etab_id=? ORDER BY classe, nom, prenom", (g.etab_id,))
    return render_template("infirmerie_passages.html", rows=rows, motifs=motifs, eleves=eleves_, debut=debut, fin=fin, motifs_liste=MOTIFS_PASSAGE,
                           decisions=DECISIONS_PASSAGE, maintenant=datetime.now().strftime("%H:%M"), aujourdhui=date.today().isoformat(),
                           domicile=sum(1 for r in rows if "domicile" in r["decision"]))


@app.route("/infirmerie/passages/<int:pid>/supprimer", methods=["POST"])
@infirmerie_only
def infirmerie_passage_supprimer(pid):
    run("DELETE FROM passages WHERE id=? AND etab_id=?", (pid, g.etab_id))
    log("passage supprimé", str(pid))
    return redirect(url_for("infirmerie_passages"))


@app.route("/infirmerie/passages.csv")
@infirmerie_only
def infirmerie_passages_csv():
    debut, fin = filtre_passages()
    cur = db().execute("SELECT date, heure, eleve_nom, classe, motif, soins, decision, parents_prevenus, note, par_nom FROM passages "
                       "WHERE etab_id=? AND date BETWEEN ? AND ? ORDER BY date, heure", (g.etab_id, debut.isoformat(), fin.isoformat()))
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow([c[0] for c in cur.description])
    for r in cur.fetchall():
        w.writerow([cellule_csv(v) for v in r])
    log("export", "passages infirmerie")
    return Response("\ufeff" + buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename=passages_{date.today()}.csv"})


@app.route("/infirmerie/eleves")
@infirmerie_only
def infirmerie_eleves():
    terme, classe = request.args.get("q", "").strip(), request.args.get("classe", "")
    like = f"%{terme}%"
    sql = ("SELECT e.id, e.nom, e.prenom, e.classe, fs.pai, fs.allergies, fs.traitements, "
           "(SELECT COUNT(*) FROM passages p WHERE p.eleve_id=e.id) passages FROM eleves e LEFT JOIN fiches_sante fs ON fs.eleve_id=e.id "
           "WHERE e.etab_id=? AND (e.nom LIKE ? OR e.prenom LIKE ?)")
    args = [g.etab_id, like, like]
    if classe:
        sql += " AND e.classe=?"
        args.append(classe)
    if request.args.get("seulement"):
        sql += " AND (fs.pai=1 OR fs.allergies<>'' OR fs.traitements<>'')"
    rows = q(sql + " ORDER BY e.classe, e.nom, e.prenom LIMIT 300", args)
    return render_template("infirmerie_eleves.html", rows=rows, terme=terme, classe=classe, seulement=bool(request.args.get("seulement")),
                           classes=q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,)))


@app.route("/infirmerie/eleves/<int:eid>", methods=["GET", "POST"])
@infirmerie_only
def infirmerie_fiche(eid):
    e = one("SELECT * FROM eleves WHERE id=? AND etab_id=?", (eid, g.etab_id))
    if not e:
        abort(404)
    if request.method == "POST":
        f = request.form
        run("INSERT INTO fiches_sante(eleve_id,pai,allergies,traitements,contact_urgence,observations,maj_at) VALUES (?,?,?,?,?,?,?) "
            "ON CONFLICT(eleve_id) DO UPDATE SET pai=excluded.pai, allergies=excluded.allergies, traitements=excluded.traitements, "
            "contact_urgence=excluded.contact_urgence, observations=excluded.observations, maj_at=excluded.maj_at",
            (eid, 1 if f.get("pai") else 0, f.get("allergies", "").strip()[:300], f.get("traitements", "").strip()[:300],
             f.get("contact_urgence", "").strip()[:200], f.get("observations", "").strip()[:1000], datetime.now().isoformat(timespec="minutes")))
        log("fiche santé modifiée", nom_complet(e))
        flash("Fiche santé enregistrée.", "ok")
        return redirect(url_for("infirmerie_fiche", eid=eid))
    log("fiche santé consultée", nom_complet(e))
    fiche = one("SELECT * FROM fiches_sante WHERE eleve_id=?", (eid,))
    passages_ = q("SELECT * FROM passages WHERE eleve_id=? ORDER BY date DESC, heure DESC LIMIT 30", (eid,))
    soins_ = q("SELECT * FROM soins WHERE eleve_id=? ORDER BY actif DESC, date_debut DESC", (eid,))
    equipe, pp = equipe_et_pp(e["classe"]) if e["classe"] else ([], None)
    pp_info = None
    if pp:
        pr = one("SELECT email, telephone, user_id FROM professeurs WHERE id=?", (pp["prof_id"],))
        pp_info = dict(pp, email=pr["email"], telephone=pr["telephone"], user_id=pr["user_id"])
    return render_template("infirmerie_fiche.html", e=e, fiche=fiche, passages=passages_, soins=soins_, pp=pp_info, equipe=equipe)


# ───────────────────────── Personnel : assistants pédagogiques, postes (rôles) et planning intelligent ─────────────────────────
def hm(m, signe=False):
    """Minutes -> 'H:MM' (avec signe + ou - si demandé)."""
    m = int(m or 0)
    neg, m = m < 0, abs(m)
    return ("-" if neg else ("+" if signe and m else "")) + f"{m // 60}:{m % 60:02d}"


app.jinja_env.filters["sans_role"] = lambda n: re.sub(r"\s*\([^)]*\)\s*$", "", n or "")
app.jinja_env.filters["hm"] = hm
app.jinja_env.filters["hm_signe"] = lambda m: hm(m, True)


def teinte_matiere(matiere):
    """Teinte (0-359) stable pour une matière : un même cours garde la même couleur d'une semaine à l'autre."""
    import zlib
    cle = (matiere or "").strip().lower()
    return (zlib.crc32(cle.encode()) * 137) % 360 if cle else 220


app.jinja_env.filters["teinte"] = teinte_matiere


def couleur_texte(hexa):
    """Noir ou blanc selon la luminance du fond, pour que le texte reste lisible sur la couleur du poste."""
    try:
        r, g_, b = (int(hexa.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    except (ValueError, IndexError):
        return "#1a1a1a"
    lum = 0.2126 * (r / 255) ** 2.2 + 0.7152 * (g_ / 255) ** 2.2 + 0.0722 * (b / 255) ** 2.2
    return "#1a1a1a" if lum > 0.28 else "#ffffff"


app.jinja_env.filters["couleur_texte"] = couleur_texte


def hhmm_vers_min(texte):
    m = re.fullmatch(r"([01]?\d|2[0-3]):([0-5]\d)", (texte or "").strip())
    return int(m.group(1)) * 60 + int(m.group(2)) if m else None


def heure_norm(texte):
    """« 8:30 » ou « 08:30 » -> « 08:30 » ; None si ce n'est pas une heure valide (les heures sont comparées comme du texte)."""
    m = hhmm_vers_min(texte)
    return None if m is None else f"{m // 60:02d}:{m % 60:02d}"


def min_vers_hhmm(m):
    return f"{m // 60:02d}:{m % 60:02d}"


def duree_affectation(a):
    return hhmm_vers_min(a["fin"]) - hhmm_vers_min(a["debut"])


def couleur_valide(texte, defaut="#D4D4D8"):
    return texte if re.fullmatch(r"#[0-9a-fA-F]{6}", texte or "") else defaut


def agents_planifies():
    return q("SELECT * FROM personnel WHERE etab_id=? AND planifie=1 AND actif=1 ORDER BY nom, prenom", (g.etab_id,))


def agents_moteur():
    """Agents au format attendu par le moteur d'affectation."""
    postes_agent, dispos = {}, {}
    for r in q("SELECT pp.personnel_id, pp.poste_id FROM personnel_postes pp JOIN personnel p ON p.id=pp.personnel_id WHERE p.etab_id=?", (g.etab_id,)):
        postes_agent.setdefault(r["personnel_id"], set()).add(r["poste_id"])
    for r in q("SELECT d.* FROM personnel_dispos d JOIN personnel p ON p.id=d.personnel_id WHERE p.etab_id=?", (g.etab_id,)):
        dispos.setdefault(r["personnel_id"], []).append((r["jour"], hhmm_vers_min(r["debut"]), hhmm_vers_min(r["fin"]), r["niveau"]))
    return {a["id"]: {"nom": f"{a['prenom']} {a['nom']}".strip(), "contrat": a["contrat_min"], "max_jour": a["max_jour_min"],
                      "postes": postes_agent.get(a["id"], set()), "dispos": dispos.get(a["id"], [])} for a in agents_planifies()}


def besoins_moteur():
    return [{"id": b["id"], "poste_id": b["poste_id"], "jour": b["jour"], "debut": hhmm_vers_min(b["debut"]), "fin": hhmm_vers_min(b["fin"]), "effectif": b["effectif"]}
            for b in q("SELECT b.* FROM besoins_postes b JOIN postes p ON p.id=b.poste_id WHERE b.etab_id=? AND p.actif=1", (g.etab_id,))]


def affectations_moteur(source=None):
    sql, args = "SELECT * FROM affectations WHERE etab_id=?", [g.etab_id]
    if source:
        sql += " AND source=?"
        args.append(source)
    return [{"id": a["id"], "personnel_id": a["personnel_id"], "poste_id": a["poste_id"], "jour": a["jour"], "debut": hhmm_vers_min(a["debut"]),
             "fin": hhmm_vers_min(a["fin"]), "source": a["source"]} for a in q(sql, args)]


def minutes_par_agent():
    tot = {}
    for a in q("SELECT personnel_id, debut, fin FROM affectations WHERE etab_id=?", (g.etab_id,)):
        tot[a["personnel_id"]] = tot.get(a["personnel_id"], 0) + duree_affectation(a)
    return tot


# ── Annuaire du personnel ──
@app.route("/personnel", methods=["GET", "POST"])
@staff_only
def pers_liste():
    if request.method == "POST":
        f = request.form
        if not f.get("nom", "").strip():
            flash("Le nom est obligatoire.", "err")
            return redirect(url_for("pers_liste"))
        try:
            contrat = round(float(f.get("contrat", "0").replace(",", ".")) * 60)
        except ValueError:
            contrat = 0
        cat = f.get("categorie", "").strip() or CFG["categories_personnel"][0]
        pid = run("INSERT INTO personnel(etab_id,nom,prenom,categorie,fonction,email,telephone,contrat_min,planifie) VALUES (?,?,?,?,?,?,?,?,?)",
                  (g.etab_id, f["nom"].strip(), f.get("prenom", "").strip(), cat, f.get("fonction", "").strip(), f.get("email", "").strip(),
                   f.get("telephone", "").strip(), max(0, min(contrat, 60 * 60)), 1 if f.get("planifie") else 0))
        log("personnel ajouté", f"{f['nom']} ({cat})")
        flash("Fiche créée : indiquez maintenant ses rôles (postes) et ses indisponibilités.", "ok")
        return redirect(url_for("pers_fiche", pid=pid))
    terme, cat = request.args.get("q", "").strip(), request.args.get("categorie", "")
    like = f"%{terme}%"
    sql = "SELECT * FROM personnel WHERE etab_id=? AND (nom LIKE ? OR prenom LIKE ? OR fonction LIKE ?)"
    args = [g.etab_id, like, like, like]
    if cat:
        sql += " AND categorie=?"
        args.append(cat)
    rows = q(sql + " ORDER BY actif DESC, categorie, nom, prenom", args)
    roles = {}
    for r in q("SELECT pp.personnel_id, po.nom, po.couleur FROM personnel_postes pp JOIN postes po ON po.id=pp.poste_id WHERE po.etab_id=? ORDER BY po.ordre", (g.etab_id,)):
        roles.setdefault(r["personnel_id"], []).append(r)
    return render_template("personnel.html", rows=rows, roles=roles, tot=minutes_par_agent(), terme=terme, categorie=cat, categories=CFG["categories_personnel"])


@app.route("/personnel/<int:pid>", methods=["GET", "POST"])
@staff_only
def pers_fiche(pid):
    a = one("SELECT * FROM personnel WHERE id=? AND etab_id=?", (pid, g.etab_id))
    if not a:
        abort(404)
    postes = q("SELECT * FROM postes WHERE etab_id=? ORDER BY ordre, nom", (g.etab_id,))
    if request.method == "POST":
        f = request.form
        if not f.get("nom", "").strip():
            flash("Le nom est obligatoire.", "err")
            return redirect(url_for("pers_fiche", pid=pid))
        try:
            contrat = round(float(f.get("contrat", "0").replace(",", ".")) * 60)
            max_jour = round(float(f.get("max_jour", "8").replace(",", ".")) * 60)
        except ValueError:
            contrat, max_jour = a["contrat_min"], a["max_jour_min"]
        run("UPDATE personnel SET nom=?, prenom=?, categorie=?, fonction=?, email=?, telephone=?, contrat_min=?, max_jour_min=?, planifie=?, actif=?, notes=? WHERE id=?",
            (f["nom"].strip(), f.get("prenom", "").strip(), f.get("categorie", "").strip() or a["categorie"], f.get("fonction", "").strip(), f.get("email", "").strip(),
             f.get("telephone", "").strip(), max(0, min(contrat, 60 * 60)), max(60, min(max_jour, 14 * 60)), 1 if f.get("planifie") else 0,
             1 if f.get("actif") else 0, f.get("notes", "").strip()[:1000], pid))
        db().execute("DELETE FROM personnel_postes WHERE personnel_id=?", (pid,))
        for p in postes:
            if f.get(f"poste_{p['id']}"):
                db().execute("INSERT INTO personnel_postes VALUES (?,?)", (pid, p["id"]))
        db().commit()
        log("fiche personnel modifiée", f"{f['nom']}")
        flash("Fiche enregistrée.", "ok")
        return redirect(url_for("pers_fiche", pid=pid))
    mes_postes = {r["poste_id"] for r in q("SELECT poste_id FROM personnel_postes WHERE personnel_id=?", (pid,))}
    dispos = q("SELECT * FROM personnel_dispos WHERE personnel_id=? ORDER BY jour, debut", (pid,))
    affect = q("SELECT af.*, po.nom pnom, po.couleur FROM affectations af JOIN postes po ON po.id=af.poste_id WHERE af.personnel_id=? ORDER BY af.jour, af.debut", (pid,))
    return render_template("personnel_fiche.html", a=a, postes=postes, mes_postes=mes_postes, dispos=dispos, affect=affect,
                           total=sum(duree_affectation(x) for x in affect), categories=CFG["categories_personnel"])


@app.route("/personnel/<int:pid>/supprimer", methods=["POST"])
@staff_only
def pers_supprimer(pid):
    a = one("SELECT * FROM personnel WHERE id=? AND etab_id=?", (pid, g.etab_id))
    if a:
        run("DELETE FROM personnel WHERE id=?", (pid,))
        log("fiche personnel supprimée", f"{a['nom']} {a['prenom']}")
        flash("Fiche supprimée (ainsi que ses indisponibilités et ses affectations).", "ok")
    return redirect(url_for("pers_liste"))


@app.route("/personnel/<int:pid>/dispos", methods=["POST"])
@staff_only
def pers_dispo_ajouter(pid):
    if not one("SELECT 1 FROM personnel WHERE id=? AND etab_id=?", (pid, g.etab_id)):
        abort(404)
    f = request.form
    d, fin = hhmm_vers_min(f.get("debut", "")), hhmm_vers_min(f.get("fin", ""))
    jours = [j for j in range(5) if f.get(f"jour_{j}")] or ([f.get("jour", type=int)] if f.get("jour", type=int) in range(5) else [])
    if d is None or fin is None or d >= fin or not jours:
        flash("Indiquez au moins un jour et une plage horaire valide (début avant fin).", "err")
    else:
        niveau = "souhait" if f.get("niveau") == "souhait" else "non"
        for j in jours:
            db().execute("INSERT INTO personnel_dispos(personnel_id,jour,debut,fin,niveau,motif) VALUES (?,?,?,?,?,?)",
                         (pid, j, min_vers_hhmm(d), min_vers_hhmm(fin), niveau, f.get("motif", "").strip()[:120]))
        db().commit()
        log("indisponibilité ajoutée", f"personnel {pid}")
    return redirect(url_for("pers_fiche", pid=pid))


@app.route("/personnel/dispos/<int:did>/supprimer", methods=["POST"])
@staff_only
def pers_dispo_supprimer(did):
    d = one("SELECT d.* FROM personnel_dispos d JOIN personnel p ON p.id=d.personnel_id WHERE d.id=? AND p.etab_id=?", (did, g.etab_id))
    if d:
        run("DELETE FROM personnel_dispos WHERE id=?", (did,))
        return redirect(url_for("pers_fiche", pid=d["personnel_id"]))
    abort(404)


# ── Postes (rôles) et besoins ──
@app.route("/personnel/postes", methods=["GET", "POST"])
@staff_only
def pers_postes():
    if request.method == "POST":
        f = request.form
        nom = f.get("nom", "").strip()
        if not nom:
            flash("Le nom du poste est obligatoire.", "err")
        elif one("SELECT 1 FROM postes WHERE etab_id=? AND nom=?", (g.etab_id, nom)):
            flash("Ce poste existe déjà.", "err")
        else:
            ordre = one("SELECT COALESCE(MAX(ordre),0)+1 o FROM postes WHERE etab_id=?", (g.etab_id,))["o"]
            run("INSERT INTO postes(etab_id,nom,couleur,description,ordre) VALUES (?,?,?,?,?)",
                (g.etab_id, nom[:40], couleur_valide(f.get("couleur")), f.get("description", "").strip()[:200], ordre))
            log("poste créé", nom)
        return redirect(url_for("pers_postes"))
    postes = q("SELECT po.*, (SELECT COUNT(*) FROM personnel_postes pp WHERE pp.poste_id=po.id) nb_agents FROM postes po WHERE po.etab_id=? ORDER BY po.ordre, po.nom", (g.etab_id,))
    groupes = {}
    for b in q("SELECT b.*, po.nom pnom, po.couleur FROM besoins_postes b JOIN postes po ON po.id=b.poste_id WHERE b.etab_id=? ORDER BY po.ordre, b.debut, b.jour", (g.etab_id,)):
        cle = (b["poste_id"], b["debut"], b["fin"], b["effectif"])
        gr = groupes.setdefault(cle, {"poste": b["pnom"], "couleur": b["couleur"], "debut": b["debut"], "fin": b["fin"], "effectif": b["effectif"], "jours": [], "ids": []})
        gr["jours"].append(b["jour"])
        gr["ids"].append(str(b["id"]))
    return render_template("postes.html", postes=postes, groupes=list(groupes.values()))


@app.route("/personnel/postes/<int:pid>", methods=["POST"])
@staff_only
def pers_poste_modifier(pid):
    p = one("SELECT * FROM postes WHERE id=? AND etab_id=?", (pid, g.etab_id))
    if not p:
        abort(404)
    f = request.form
    nom = f.get("nom", "").strip()[:40] or p["nom"]
    if nom != p["nom"] and one("SELECT 1 FROM postes WHERE etab_id=? AND nom=?", (g.etab_id, nom)):
        flash("Un poste porte déjà ce nom.", "err")
    else:
        run("UPDATE postes SET nom=?, couleur=?, description=?, ordre=?, actif=? WHERE id=?",
            (nom, couleur_valide(f.get("couleur"), p["couleur"]), f.get("description", "").strip()[:200], f.get("ordre", type=int) or p["ordre"], 1 if f.get("actif") else 0, pid))
        log("poste modifié", nom)
    return redirect(url_for("pers_postes"))


@app.route("/personnel/postes/<int:pid>/supprimer", methods=["POST"])
@staff_only
def pers_poste_supprimer(pid):
    p = one("SELECT * FROM postes WHERE id=? AND etab_id=?", (pid, g.etab_id))
    if p:
        run("DELETE FROM postes WHERE id=?", (pid,))
        log("poste supprimé", p["nom"])
        flash(f"Poste « {p['nom']} » supprimé, avec ses besoins et ses affectations.", "ok")
    return redirect(url_for("pers_postes"))


@app.route("/personnel/besoins", methods=["POST"])
@staff_only
def pers_besoin_ajouter():
    f = request.form
    poste = one("SELECT * FROM postes WHERE id=? AND etab_id=?", (f.get("poste_id", type=int), g.etab_id))
    d, fin = hhmm_vers_min(f.get("debut", "")), hhmm_vers_min(f.get("fin", ""))
    jours = [j for j in range(5) if f.get(f"jour_{j}")]
    eff = f.get("effectif", type=int) or 1
    if not poste or d is None or fin is None or d >= fin or not jours or not 1 <= eff <= 20:
        flash("Choisissez un poste, au moins un jour, une plage horaire valide et un effectif de 1 à 20.", "err")
    else:
        d, fin = d // 15 * 15, -(-fin // 15) * 15
        for j in jours:
            db().execute("INSERT INTO besoins_postes(etab_id,poste_id,jour,debut,fin,effectif) VALUES (?,?,?,?,?,?)", (g.etab_id, poste["id"], j, min_vers_hhmm(d), min_vers_hhmm(fin), eff))
        db().commit()
        log("besoin ajouté", f"{poste['nom']} {min_vers_hhmm(d)}-{min_vers_hhmm(fin)} ×{eff}")
        flash("Besoin ajouté.", "ok")
    return redirect(url_for("pers_postes"))


@app.route("/personnel/besoins/supprimer", methods=["POST"])
@staff_only
def pers_besoin_supprimer():
    ids = [int(x) for x in request.form.get("ids", "").split(",") if x.strip().isdigit()]
    for i in ids:
        db().execute("DELETE FROM besoins_postes WHERE id=? AND etab_id=?", (i, g.etab_id))
    db().commit()
    return redirect(url_for("pers_postes"))


# ── Planning visuel ──
def bornes_axe(jour_affect, besoins_jour):
    debut_cfg, fin_cfg = (hhmm_vers_min(x) for x in CFG["grille_personnel"])
    debuts = [debut_cfg] + [hhmm_vers_min(a["debut"]) for a in jour_affect] + [b["debut"] for b in besoins_jour]
    fins = [fin_cfg] + [hhmm_vers_min(a["fin"]) for a in jour_affect] + [b["fin"] for b in besoins_jour]
    return min(debuts) // 60 * 60, -(-max(fins) // 60) * 60


def couverture_postes(besoins, affect, jour, debut_axe, fin_axe, postes_nom):
    """Par poste et par tranche de 15 min : besoin vs agents présents -> segments ok / manque / surplus ; et plages manquantes."""
    n = (fin_axe - debut_axe) // 15
    besoin, present = {}, {}
    for b in besoins:
        if b["jour"] == jour:
            tab = besoin.setdefault(b["poste_id"], [0] * n)
            for s in range((b["debut"] - debut_axe) // 15, (b["fin"] - debut_axe) // 15):
                if 0 <= s < n:
                    tab[s] += b["effectif"]
    for a in affect:
        if a["jour"] == jour:
            tab = present.setdefault(a["poste_id"], [0] * n)
            for s in range((hhmm_vers_min(a["debut"]) - debut_axe) // 15, (hhmm_vers_min(a["fin"]) - debut_axe) // 15):
                if 0 <= s < n:
                    tab[s] += 1
    out, lacunes = [], []
    for poste, tab in besoin.items():
        have = present.get(poste, [0] * n)
        etat = lambda i: "manque" if have[i] < tab[i] else ("surplus" if have[i] > tab[i] else "ok")
        segs, s = [], 0
        while s < n:
            if tab[s] == 0 and have[s] == 0:
                s += 1
                continue
            statut = etat(s)
            e = s
            while e < n and not (tab[e] == 0 and have[e] == 0) and etat(e) == statut:
                e += 1
            segs.append({"left": 100 * s / n, "width": 100 * (e - s) / n, "statut": statut, "debut": min_vers_hhmm(debut_axe + s * 15), "fin": min_vers_hhmm(debut_axe + e * 15),
                         "besoin": max(tab[s:e]), "present": min(have[s:e])})
            if statut == "manque":
                lacunes.append({"poste_id": poste, "poste": postes_nom.get(poste, "?"), "jour": jour, "debut": min_vers_hhmm(debut_axe + s * 15),
                                "fin": min_vers_hhmm(debut_axe + e * 15), "manque": max(tab[i] - have[i] for i in range(s, e))})
            s = e
        out.append({"poste_id": poste, "nom": postes_nom.get(poste, "?"), "segments": segs})
    return out, lacunes


@app.route("/personnel/planning")
@staff_only
def pers_planning():
    aujourdhui = date.today()
    vue = request.args.get("jour", "")
    jour = int(vue) if vue in ("0", "1", "2", "3", "4") else (aujourdhui.weekday() if aujourdhui.weekday() < 5 and vue != "semaine" else 0)
    semaine = vue == "semaine"
    postes = q("SELECT * FROM postes WHERE etab_id=? ORDER BY ordre, nom", (g.etab_id,))
    postes_nom = {p["id"]: p["nom"] for p in postes}
    postes_par_id = {p["id"]: p for p in postes}
    agents = agents_planifies()
    affect = q("SELECT * FROM affectations WHERE etab_id=? ORDER BY jour, debut", (g.etab_id,))
    besoins = besoins_moteur()
    tot = minutes_par_agent()
    # lacunes de toute la semaine (alerte) et couverture du jour affiché
    lacunes, couv_jour, axe_jour = [], [], None
    for j in range(5):
        d_ax, f_ax = bornes_axe([a for a in affect if a["jour"] == j], [b for b in besoins if b["jour"] == j])
        cv, lc = couverture_postes(besoins, affect, j, d_ax, f_ax, postes_nom)
        lacunes += lc
        if j == jour:
            couv_jour, axe_jour = cv, (d_ax, f_ax)
    besoin_total = sum((b["fin"] - b["debut"]) * b["effectif"] for b in besoins)
    manque_total = sum(l_["manque"] * (hhmm_vers_min(l_["fin"]) - hhmm_vers_min(l_["debut"])) for l_ in lacunes)
    kpi = {"besoin": besoin_total, "couvert": besoin_total - manque_total, "taux": round(100 * (besoin_total - manque_total) / besoin_total) if besoin_total else None,
           "affecte": sum(tot.get(a["id"], 0) for a in agents), "contrat": sum(a["contrat_min"] for a in agents)}
    lignes = []
    for a in agents:
        solde = a["contrat_min"] - tot.get(a["id"], 0)
        ligne = {"id": a["id"], "nom": a["nom"], "prenom": a["prenom"], "contrat": a["contrat_min"], "affecte": tot.get(a["id"], 0), "solde": solde,
                 "etat": "zero" if solde == 0 else ("reste" if solde > 0 else "depasse"), "jours": {j: [] for j in range(5)}}
        for af in affect:
            if af["personnel_id"] == a["id"]:
                p = postes_par_id.get(af["poste_id"])
                ligne["jours"][af["jour"]].append({"id": af["id"], "poste_id": af["poste_id"], "poste": p["nom"] if p else "?", "couleur": p["couleur"] if p else "#D4D4D8",
                                                    "debut": af["debut"], "fin": af["fin"], "source": af["source"], "minutes": duree_affectation(af)})
        if not semaine:
            d_ax, f_ax = axe_jour
            span = f_ax - d_ax
            for b in ligne["jours"][jour]:
                b["left"] = 100 * (hhmm_vers_min(b["debut"]) - d_ax) / span
                b["width"] = 100 * (hhmm_vers_min(b["fin"]) - hhmm_vers_min(b["debut"])) / span
            ligne["minutes_jour"] = sum(b["minutes"] for b in ligne["jours"][jour])
        lignes.append(ligne)
    heures = []
    if axe_jour and not semaine:
        d_ax, f_ax = axe_jour
        heures = [{"label": f"{h_ // 60}h", "left": 100 * (h_ - d_ax) / (f_ax - d_ax)} for h_ in range(d_ax, f_ax, 60)]
    sauvegardes = one("SELECT COUNT(*) c FROM planning_personnel_sauvegardes WHERE etab_id=?", (g.etab_id,))["c"]
    return render_template("planning_personnel.html", jour=jour, semaine=semaine, lignes=lignes, postes=postes, couv=couv_jour, heures=heures, axe=axe_jour,
                           nb_heures=((axe_jour[1] - axe_jour[0]) / 60) if axe_jour else 0, lacunes=lacunes, kpi=kpi, sauvegardes=sauvegardes,
                           pas_postes=not postes, pas_agents=not agents, nb_besoins=len(besoins))


def valider_affectation(personnel_id, poste_id, jour, debut, fin, ignorer_id=None):
    """Retourne (erreur ou None, avertissements, (début, fin en minutes))."""
    agent = one("SELECT * FROM personnel WHERE id=? AND etab_id=?", (personnel_id, g.etab_id))
    poste = one("SELECT * FROM postes WHERE id=? AND etab_id=?", (poste_id, g.etab_id))
    if not agent or not poste:
        return "Agent ou poste introuvable.", [], None
    if jour not in range(5):
        return "Jour invalide.", [], None
    d, f = hhmm_vers_min(debut), hhmm_vers_min(fin)
    if d is None or f is None or d >= f:
        return "Plage horaire invalide : le début doit précéder la fin.", [], None
    d, f = d // 15 * 15, -(-f // 15) * 15
    if d < 5 * 60 or f > 23 * 60:
        return "Plage hors de la journée de travail (05:00–23:00).", [], None
    for a in q("SELECT * FROM affectations WHERE etab_id=? AND personnel_id=? AND jour=?", (g.etab_id, personnel_id, jour)):
        if a["id"] != ignorer_id and d < hhmm_vers_min(a["fin"]) and hhmm_vers_min(a["debut"]) < f:
            nom_p = one("SELECT nom FROM postes WHERE id=?", (a["poste_id"],))["nom"]
            return f"{agent['prenom']} {agent['nom']} est déjà affecté(e) à « {nom_p} » de {a['debut']} à {a['fin']} ce jour-là.", [], None
    avert = []
    if not one("SELECT 1 FROM personnel_postes WHERE personnel_id=? AND poste_id=?", (personnel_id, poste_id)):
        avert.append(f"{agent['prenom']} n'a pas le rôle « {poste['nom']} »")
    for dsp in q("SELECT * FROM personnel_dispos WHERE personnel_id=? AND jour=? AND niveau='non'", (personnel_id, jour)):
        if d < hhmm_vers_min(dsp["fin"]) and hhmm_vers_min(dsp["debut"]) < f:
            avert.append(f"indisponible de {dsp['debut']} à {dsp['fin']}" + (f" ({dsp['motif']})" if dsp["motif"] else ""))
    autres = sum(duree_affectation(a) for a in q("SELECT * FROM affectations WHERE etab_id=? AND personnel_id=? AND id<>?", (g.etab_id, personnel_id, ignorer_id or 0)))
    if autres + (f - d) > agent["contrat_min"]:
        avert.append(f"dépasse son contrat ({hm(autres + f - d)} pour {hm(agent['contrat_min'])})")
    jour_tot = sum(duree_affectation(a) for a in q("SELECT * FROM affectations WHERE etab_id=? AND personnel_id=? AND jour=? AND id<>?", (g.etab_id, personnel_id, jour, ignorer_id or 0)))
    if jour_tot + (f - d) > agent["max_jour_min"]:
        avert.append(f"dépasse {hm(agent['max_jour_min'])} de travail ce jour-là")
    return None, avert, (d, f)


def retour_planning(jour=None):
    return redirect(url_for("pers_planning", jour=jour if jour is not None else request.form.get("retour_jour", "")))


@app.route("/personnel/affectations", methods=["POST"])
@staff_only
def pers_affectation_creer():
    f = request.form
    jour = f.get("jour", type=int)
    erreur, avert, plage = valider_affectation(f.get("personnel_id", type=int), f.get("poste_id", type=int), jour, f.get("debut", ""), f.get("fin", ""))
    if erreur:
        flash(erreur, "err")
        return retour_planning(jour)
    run("INSERT INTO affectations(etab_id,personnel_id,poste_id,jour,debut,fin,source) VALUES (?,?,?,?,?,?,'manuel')",
        (g.etab_id, f.get("personnel_id", type=int), f.get("poste_id", type=int), jour, min_vers_hhmm(plage[0]), min_vers_hhmm(plage[1])))
    log("affectation ajoutée", f"personnel {f.get('personnel_id')} jour {jour}")
    flash("Plage ajoutée." + (" Attention : " + " ; ".join(avert) + "." if avert else ""), "err" if avert else "ok")
    return retour_planning(jour)


@app.route("/personnel/affectations/<int:aid>", methods=["POST"])
@staff_only
def pers_affectation_modifier(aid):
    a = one("SELECT * FROM affectations WHERE id=? AND etab_id=?", (aid, g.etab_id))
    if not a:
        abort(404)
    f = request.form
    pers, poste, jour = f.get("personnel_id", type=int), f.get("poste_id", type=int), f.get("jour", type=int)
    erreur, avert, plage = valider_affectation(pers, poste, jour, f.get("debut", ""), f.get("fin", ""), ignorer_id=aid)
    if erreur:
        flash(erreur, "err")
        return retour_planning(a["jour"])
    run("UPDATE affectations SET personnel_id=?, poste_id=?, jour=?, debut=?, fin=?, source='manuel' WHERE id=?",
        (pers, poste, jour, min_vers_hhmm(plage[0]), min_vers_hhmm(plage[1]), aid))
    log("affectation modifiée", f"{aid}")
    flash("Plage modifiée." + (" Attention : " + " ; ".join(avert) + "." if avert else ""), "err" if avert else "ok")
    return retour_planning(jour)


@app.route("/personnel/affectations/<int:aid>/supprimer", methods=["POST"])
@staff_only
def pers_affectation_supprimer(aid):
    a = one("SELECT * FROM affectations WHERE id=? AND etab_id=?", (aid, g.etab_id))
    if not a:
        abort(404)
    run("DELETE FROM affectations WHERE id=?", (aid,))
    log("affectation supprimée", f"{aid}")
    return retour_planning(a["jour"])


@app.route("/personnel/affectations/<int:aid>/copier", methods=["POST"])
@staff_only
def pers_affectation_copier(aid):
    """Copie une plage sur d'autres jours et/ou pour un autre agent (équivalent de « copier sur d'autres jours »)."""
    a = one("SELECT * FROM affectations WHERE id=? AND etab_id=?", (aid, g.etab_id))
    if not a:
        abort(404)
    f = request.form
    jours = [j for j in range(5) if f.get(f"copie_jour_{j}")] or [a["jour"]]
    cible = f.get("vers_agent", type=int) or a["personnel_id"]
    faits, refus = 0, []
    for j in jours:
        if j == a["jour"] and cible == a["personnel_id"]:
            continue
        erreur, _, plage = valider_affectation(cible, a["poste_id"], j, a["debut"], a["fin"])
        if erreur:
            refus.append(f"{JOURS[j]} : {erreur}")
            continue
        db().execute("INSERT INTO affectations(etab_id,personnel_id,poste_id,jour,debut,fin,source) VALUES (?,?,?,?,?,?,'manuel')",
                     (g.etab_id, cible, a["poste_id"], j, min_vers_hhmm(plage[0]), min_vers_hhmm(plage[1])))
        faits += 1
    db().commit()
    log("affectation copiée", f"{aid} → {faits} copie(s)")
    flash(f"{faits} copie(s) créée(s)." + (" Non copié : " + " | ".join(refus) if refus else ""), "ok" if faits else "err")
    return retour_planning(a["jour"])


def sauvegarder_planning(motif):
    contenu = json.dumps([{k: a[k] for k in ("personnel_id", "poste_id", "jour", "debut", "fin", "source")}
                          for a in q("SELECT * FROM affectations WHERE etab_id=?", (g.etab_id,))])
    run("INSERT INTO planning_personnel_sauvegardes(etab_id,created_at,auteur,motif,contenu) VALUES (?,?,?,?,?)",
        (g.etab_id, datetime.now().isoformat(timespec="seconds"), g.user["nom"], motif, contenu))
    db().execute("DELETE FROM planning_personnel_sauvegardes WHERE etab_id=? AND id NOT IN (SELECT id FROM planning_personnel_sauvegardes WHERE etab_id=? ORDER BY id DESC LIMIT 10)",
                 (g.etab_id, g.etab_id))
    db().commit()


@app.route("/personnel/planning/generer", methods=["POST"])
@staff_only
def pers_generer():
    f = request.form
    mode = f.get("mode") if f.get("mode") in ("auto", "completer", "tout") else "auto"
    bloc_max = min(max(f.get("bloc_max", type=int) or 180, 60), 360)
    marge = min(max(f.get("marge", type=int) or 0, 0), 180)
    agents, besoins = agents_moteur(), besoins_moteur()
    if not agents or not besoins:
        flash("Il faut au moins un agent planifié et un besoin (onglet Postes et besoins) pour générer le planning.", "err")
        return redirect(url_for("pers_planning"))
    sauvegarder_planning({"auto": "avant régénération automatique", "completer": "avant complément", "tout": "avant recalcul complet"}[mode])
    if mode == "tout":
        run("DELETE FROM affectations WHERE etab_id=?", (g.etab_id,))
    elif mode == "auto":
        run("DELETE FROM affectations WHERE etab_id=? AND source='auto'", (g.etab_id,))
    fixes = affectations_moteur()
    res = planpers.generer(besoins, agents, fixes, {"bloc_max": bloc_max, "marge": marge}, temps_max=6)
    for a in res["affectations"]:
        db().execute("INSERT INTO affectations(etab_id,personnel_id,poste_id,jour,debut,fin,source) VALUES (?,?,?,?,?,?,'auto')",
                     (g.etab_id, a["personnel_id"], a["poste_id"], a["jour"], min_vers_hhmm(a["debut"]), min_vers_hhmm(a["fin"])))
    db().commit()
    st = res["stats"]
    log("planning du personnel généré", f"{len(res['affectations'])} plages, couverture {st['couverture']} %")
    ext.emit("planning_personnel.genere", nb_affectations=len(res["affectations"]), couverture=st["couverture"])
    if res["non_couverts"]:
        flash(f"Planning généré : {st['couverture']} % des besoins couverts, {len(res['non_couverts'])} plage(s) sans agent disponible "
              f"({hm(sum(n['fin'] - n['debut'] for n in res['non_couverts']))} h). Voir l'alerte sous le planning. Vous pouvez annuler cette génération.", "err")
    else:
        flash(f"Planning généré : 100 % des besoins couverts ({len(res['affectations'])} plages). Vous pouvez annuler cette génération.", "ok")
    return redirect(url_for("pers_planning", jour=request.form.get("retour_jour", "")))


@app.route("/personnel/planning/annuler", methods=["POST"])
@staff_only
def pers_annuler():
    sv = one("SELECT * FROM planning_personnel_sauvegardes WHERE etab_id=? ORDER BY id DESC LIMIT 1", (g.etab_id,))
    if not sv:
        flash("Rien à annuler.", "err")
        return redirect(url_for("pers_planning"))
    run("DELETE FROM affectations WHERE etab_id=?", (g.etab_id,))
    n = 0
    for a in json.loads(sv["contenu"]):
        if one("SELECT 1 FROM personnel WHERE id=? AND etab_id=?", (a["personnel_id"], g.etab_id)) and one("SELECT 1 FROM postes WHERE id=? AND etab_id=?", (a["poste_id"], g.etab_id)):
            db().execute("INSERT INTO affectations(etab_id,personnel_id,poste_id,jour,debut,fin,source) VALUES (?,?,?,?,?,?,?)",
                         (g.etab_id, a["personnel_id"], a["poste_id"], a["jour"], a["debut"], a["fin"], a["source"]))
            n += 1
    db().execute("DELETE FROM planning_personnel_sauvegardes WHERE id=?", (sv["id"],))
    db().commit()
    log("génération du planning du personnel annulée", f"{n} plages restaurées")
    flash(f"Planning restauré ({n} plages) : {sv['motif']}.", "ok")
    return redirect(url_for("pers_planning"))


# ───────────────────────── Trombinoscope ─────────────────────────
PHOTO_TABLES = {"eleve": "eleves", "prof": "professeurs", "perso": "personnel"}
PHOTO_MAX = 400 * 1024


def type_image(data):
    """Type MIME d'après les premiers octets (on ne se fie pas au nom ni au type annoncé)."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def personne_photo(kind, rid):
    t = PHOTO_TABLES.get(kind)
    return one(f"SELECT * FROM {t} WHERE id=? AND etab_id=?", (rid, g.etab_id)) if t else None


def avatar_svg(prenom, nom):
    """Avatar à initiales quand il n'y a pas de photo (teinte stable selon le nom)."""
    ini = ((prenom or " ")[:1] + (nom or " ")[:1]).upper().strip() or "?"
    teinte = teinte_matiere(f"{prenom} {nom}")
    ini = ini.replace("&", "").replace("<", "")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><rect width="120" height="150" fill="hsl({teinte} 45% 82%)"/>'
            f'<text x="60" y="88" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="600" fill="hsl({teinte} 45% 28%)">{ini}</text></svg>')


def peut_voir_trombinoscope():
    return g.user["role"] in STAFF or bool(g.prof)


@app.route("/photo/<kind>/<int:rid>")
def photo(kind, rid):
    if not peut_voir_trombinoscope() or (kind == "perso" and g.user["role"] not in STAFF):
        abort(403)
    p = personne_photo(kind, rid)
    if not p:
        abort(404)
    ph = one("SELECT mime,data FROM photos WHERE kind=? AND ref_id=? AND etab_id=?", (kind, rid, g.etab_id))
    if ph:
        resp = Response(ph["data"], mimetype=ph["mime"])
    else:
        resp = Response(avatar_svg(p["prenom"], p["nom"]), mimetype="image/svg+xml")
    resp.headers["Cache-Control"] = "private, no-cache"   # la page ajoute ?v=<date d'envoi> : une nouvelle photo s'affiche tout de suite
    return resp


@app.route("/trombinoscope")
def trombinoscope():
    if not peut_voir_trombinoscope():
        abort(403)
    staff = g.user["role"] in STAFF
    vue = request.args.get("vue", "eleves")
    if vue not in ("eleves", "profs", "personnel") or (vue == "personnel" and not staff):
        vue = "eleves"
    classe = request.args.get("classe", "")
    terme = request.args.get("q", "").strip()[:60]
    tri = request.args.get("tri", "nom")
    ordre = "prenom, nom" if tri == "prenom" else "nom, prenom"
    like = f"%{terme}%"
    classes_ = q("SELECT c.nom, p.nom pnom, p.prenom pprenom FROM classes c LEFT JOIN professeurs p ON p.id=c.prof_principal_id WHERE c.etab_id=? ORDER BY c.nom", (g.etab_id,))
    avec_photo = {(r["kind"], r["ref_id"]): r["at"] for r in q("SELECT kind,ref_id,at FROM photos WHERE etab_id=?", (g.etab_id,))}
    groupes = []   # [(titre, sous-titre, [personnes])]
    if vue == "eleves":
        pp = {c["nom"]: (f"{c['pprenom']} {c['pnom']}" if c["pnom"] else "") for c in classes_}
        sql, args = "SELECT id,nom,prenom,classe FROM eleves WHERE etab_id=?", [g.etab_id]
        if classe:
            sql += " AND classe=?"
            args.append(classe)
        if terme:
            sql += " AND (nom LIKE ? OR prenom LIKE ? OR (prenom||' '||nom) LIKE ? OR (nom||' '||prenom) LIKE ?)"
            args += [like] * 4
        par = {}
        for e in q(sql + f" ORDER BY classe, {ordre}", args):
            par.setdefault(e["classe"] or "Sans classe", []).append({"kind": "eleve", "id": e["id"], "nom": e["nom"], "prenom": e["prenom"], "ligne": ""})
        groupes = [(c, f"Prof principal : {pp[c]}" if pp.get(c) else "", l) for c, l in par.items()]
    elif vue == "profs":
        pp_de = {}
        for c in classes_:
            if c["pnom"]:
                pp_de.setdefault(f"{c['pprenom']} {c['pnom']}", []).append(c["nom"])
        sql, args = "SELECT id,nom,prenom,matiere FROM professeurs WHERE etab_id=?", [g.etab_id]
        if terme:
            sql += " AND (nom LIKE ? OR prenom LIKE ? OR (prenom||' '||nom) LIKE ? OR matiere LIKE ?)"
            args += [like] * 4
        lst = []
        for p in q(sql + f" ORDER BY {ordre}", args):
            pp = pp_de.get(f"{p['prenom']} {p['nom']}", [])
            lst.append({"kind": "prof", "id": p["id"], "nom": p["nom"], "prenom": p["prenom"],
                        "ligne": p["matiere"] + (f" · PP {', '.join(pp)}" if pp else "")})
        groupes = [("Professeurs", "", lst)] if lst or not terme else []
    else:
        roles = {}
        for r in q("SELECT pp.personnel_id, po.nom, po.couleur FROM personnel_postes pp JOIN postes po ON po.id=pp.poste_id WHERE po.etab_id=? ORDER BY po.ordre", (g.etab_id,)):
            roles.setdefault(r["personnel_id"], []).append((r["nom"], r["couleur"]))
        sql, args = "SELECT id,nom,prenom,categorie,fonction FROM personnel WHERE etab_id=? AND actif=1", [g.etab_id]
        if terme:
            sql += " AND (nom LIKE ? OR prenom LIKE ? OR (prenom||' '||nom) LIKE ? OR fonction LIKE ?)"
            args += [like] * 4
        par = {}
        for p in q(sql + f" ORDER BY categorie, {ordre}", args):
            par.setdefault(p["categorie"], []).append({"kind": "perso", "id": p["id"], "nom": p["nom"], "prenom": p["prenom"],
                                                       "ligne": p["fonction"], "roles": roles.get(p["id"], [])})
        groupes = [(c, "", l) for c, l in par.items()]
    for _, _, lst in groupes:
        for x in lst:
            x["photo"] = avec_photo.get((x["kind"], x["id"]), "")
    return render_template("trombinoscope.html", vue=vue, classe=classe, classes=classes_, groupes=groupes, staff=staff, terme=terme,
                           tri=tri if tri in ("nom", "prenom") else "nom", total=sum(len(l) for _, _, l in groupes))


@app.route("/trombinoscope/photo/<kind>/<int:rid>", methods=["POST"])
@staff_only
def photo_enregistrer(kind, rid):
    p = personne_photo(kind, rid)
    if not p:
        abort(404)
    retour = redirect(request.referrer or url_for("trombinoscope"))
    if request.form.get("action") == "supprimer":
        run("DELETE FROM photos WHERE kind=? AND ref_id=? AND etab_id=?", (kind, rid, g.etab_id))
        log("photo supprimée", f"{kind} {rid}")
        flash("Photo supprimée.", "ok")
        return retour
    f = request.files.get("photo")
    data = f.read(PHOTO_MAX + 1) if f else b""
    if not data:
        flash("Choisissez une image.", "err")
    elif len(data) > PHOTO_MAX:
        flash("Image trop lourde (400 Ko maximum) : réduisez-la ou utilisez un format plus léger.", "err")
    elif not type_image(data):
        flash("Format non reconnu : utilisez une image JPEG, PNG ou WebP.", "err")
    else:
        run("INSERT OR REPLACE INTO photos(kind,ref_id,etab_id,mime,data,at) VALUES (?,?,?,?,?,?)",
            (kind, rid, g.etab_id, type_image(data), data, datetime.now().isoformat(timespec="seconds")))
        log("photo enregistrée", f"{kind} {rid}")
        flash(f"Photo de {p['prenom']} {p['nom']} enregistrée.", "ok")
    return retour


DUREE_SQL = ("((CAST(substr({t}fin,1,2) AS INTEGER)*60+CAST(substr({t}fin,4,2) AS INTEGER))"
             "-(CAST(substr({t}debut,1,2) AS INTEGER)*60+CAST(substr({t}debut,4,2) AS INTEGER)))")


def comptage_heures(debut, fin):
    """Volumes horaires (en minutes) : professeurs, classes et personnel de vie scolaire. Hebdomadaires, sauf les remplacements (sur la période)."""
    d = DUREE_SQL.format(t="c.")
    profs = {p["id"]: dict(p, minutes=0, cours=0, classes=0, remplace=0, remplacant=0, nb_remplace=0, nb_remplacant=0)
             for p in q("SELECT id,nom,prenom,matiere,service_min FROM professeurs WHERE etab_id=? ORDER BY nom,prenom", (g.etab_id,))}
    for r in q(f"SELECT c.prof_id, SUM({d}) m, COUNT(*) n, COUNT(DISTINCT c.classe) k FROM creneaux c WHERE c.etab_id=? GROUP BY c.prof_id", (g.etab_id,)):
        if r["prof_id"] in profs:
            profs[r["prof_id"]].update(minutes=r["m"], cours=r["n"], classes=r["k"])
    for r in q(f"SELECT c.prof_id, r.remplacant_id, r.statut, SUM({d}) m, COUNT(*) n FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id "
               "WHERE r.etab_id=? AND r.date BETWEEN ? AND ? AND r.statut IN ('assigne','effectue') GROUP BY c.prof_id, r.remplacant_id", (g.etab_id, debut, fin)):
        if r["prof_id"] in profs:
            profs[r["prof_id"]]["remplace"] += r["m"]; profs[r["prof_id"]]["nb_remplace"] += r["n"]
        if r["remplacant_id"] in profs:
            profs[r["remplacant_id"]]["remplacant"] += r["m"]; profs[r["remplacant_id"]]["nb_remplacant"] += r["n"]
    classes = {c["nom"]: {"nom": c["nom"], "minutes": 0, "cours": 0, "profs": 0, "matieres": {}} for c in
               q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))}
    for r in q(f"SELECT c.classe, c.matiere, SUM({d}) m, COUNT(*) n, COUNT(DISTINCT c.prof_id) k FROM creneaux c WHERE c.etab_id=? GROUP BY c.classe, c.matiere", (g.etab_id,)):
        cl = classes.setdefault(r["classe"], {"nom": r["classe"], "minutes": 0, "cours": 0, "profs": 0, "matieres": {}})
        cl["minutes"] += r["m"]; cl["cours"] += r["n"]; cl["matieres"][r["matiere"] or "—"] = r["m"]
    for r in q("SELECT classe, COUNT(DISTINCT prof_id) k FROM creneaux WHERE etab_id=? GROUP BY classe", (g.etab_id,)):
        classes[r["classe"]]["profs"] = r["k"]
    for cl in classes.values():
        cl["matieres"] = sorted(cl["matieres"].items(), key=lambda x: -x[1])
    da = DUREE_SQL.format(t="a.")
    agents = {p["id"]: dict(p, planifie_min=0, postes={}) for p in
              q("SELECT id,nom,prenom,categorie,contrat_min,max_jour_min FROM personnel WHERE etab_id=? AND actif=1 ORDER BY nom,prenom", (g.etab_id,))}
    for r in q(f"SELECT a.personnel_id, po.nom poste, po.couleur, SUM({da}) m FROM affectations a JOIN postes po ON po.id=a.poste_id "
               "WHERE a.etab_id=? GROUP BY a.personnel_id, a.poste_id ORDER BY po.ordre", (g.etab_id,)):
        if r["personnel_id"] in agents:
            agents[r["personnel_id"]]["planifie_min"] += r["m"]
            agents[r["personnel_id"]]["postes"][r["poste"]] = (r["m"], r["couleur"])
    return list(profs.values()), list(classes.values()), list(agents.values())


@app.route("/heures")
@staff_only
def heures():
    debut = parse_date(request.args.get("debut"), date.today().replace(day=1)).isoformat()
    fin = parse_date(request.args.get("fin"), date.today()).isoformat()
    profs, classes, agents = comptage_heures(debut, fin)
    vue = request.args.get("vue", "profs")
    tot = {"profs": sum(p["minutes"] for p in profs), "classes": sum(c["minutes"] for c in classes),
           "agents": sum(a["planifie_min"] for a in agents), "contrats": sum(a["contrat_min"] for a in agents)}
    return render_template("heures.html", profs=profs, classes=classes, agents=agents, vue=vue if vue in ("profs", "classes", "personnel") else "profs",
                           debut=debut, fin=fin, tot=tot)


@app.route("/heures/services", methods=["POST"])
@staff_only
def heures_services():
    """Enregistre le service hebdomadaire dû de chaque professeur (heures, décimales acceptées : 18 ou 18,5)."""
    n = 0
    for p in q("SELECT id FROM professeurs WHERE etab_id=?", (g.etab_id,)):
        brut = request.form.get(f"service_{p['id']}")
        if brut is None:
            continue
        try:
            minutes = max(0, min(round(float(brut.replace(",", ".") or 0) * 60), 60 * 60))
        except ValueError:
            continue
        run("UPDATE professeurs SET service_min=? WHERE id=?", (minutes, p["id"]))
        n += 1
    log("services horaires enregistrés", f"{n} professeur(s)")
    flash("Services enregistrés.", "ok")
    return redirect(url_for("heures", vue="profs", debut=request.form.get("debut", ""), fin=request.form.get("fin", "")))


@app.route("/heures.csv")
@staff_only
def heures_csv():
    debut = parse_date(request.args.get("debut"), date.today().replace(day=1)).isoformat()
    fin = parse_date(request.args.get("fin"), date.today()).isoformat()
    profs, classes, agents = comptage_heures(debut, fin)
    vue = request.args.get("vue", "profs")
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    h = lambda m: f"{(m or 0) / 60:.2f}".replace(".", ",")
    if vue == "classes":
        w.writerow(["classe", "heures_hebdo", "nb_cours", "nb_professeurs", "detail_matieres"])
        for c in classes:
            w.writerow([cellule_csv(c["nom"]), h(c["minutes"]), c["cours"], c["profs"], cellule_csv("; ".join(f"{m} {h(x)}" for m, x in c["matieres"]))])
    elif vue == "personnel":
        w.writerow(["agent", "categorie", "contrat_h", "planifie_h", "solde_h", "detail_postes"])
        for a in agents:
            w.writerow([cellule_csv(f"{a['prenom']} {a['nom']}".strip()), cellule_csv(a["categorie"]), h(a["contrat_min"]), h(a["planifie_min"]),
                        h(a["contrat_min"] - a["planifie_min"]), cellule_csv("; ".join(f"{k} {h(v[0])}" for k, v in a["postes"].items()))])
    else:
        vue = "profs"
        w.writerow(["professeur", "matiere", "service_du_h", "heures_hebdo", "ecart_h", "nb_cours", "nb_classes", f"remplace_h_{debut}_{fin}", f"remplacant_h_{debut}_{fin}"])
        for p in profs:
            w.writerow([cellule_csv(f"{p['prenom']} {p['nom']}".strip()), cellule_csv(p["matiere"]), h(p["service_min"]), h(p["minutes"]),
                        h(p["minutes"] - p["service_min"]) if p["service_min"] else "", p["cours"], p["classes"], h(p["remplace"]), h(p["remplacant"])])
    log("export", f"heures {vue}")
    return Response("﻿" + buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename=heures_{vue}_{date.today()}.csv"})


@app.route("/personnel/planning.csv")
@staff_only
def pers_planning_csv():
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(["agent", "jour", "debut", "fin", "duree_h", "poste", "origine"])
    for a in q("SELECT af.*, p.nom pnom, p.prenom, po.nom poste FROM affectations af JOIN personnel p ON p.id=af.personnel_id JOIN postes po ON po.id=af.poste_id "
               "WHERE af.etab_id=? ORDER BY p.nom, af.jour, af.debut", (g.etab_id,)):
        w.writerow([cellule_csv(f"{a['prenom']} {a['pnom']}".strip()), JOURS[a["jour"]], a["debut"], a["fin"], f"{duree_affectation(a) / 60:.2f}".replace(".", ","),
                    cellule_csv(a["poste"]), "automatique" if a["source"] == "auto" else "saisi à la main"])
    log("export", "planning du personnel")
    return Response("﻿" + buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename=planning_personnel_{date.today()}.csv"})


# ───────────────────────── Établissements (administrateur) ─────────────────────────
ETABS_DEMO_PROTEGES = ("Lycée Jean Moulin", "Collège Victor Hugo")


def admin_only(f):
    @wraps(f)
    def wrapper(*a, **kw):
        if g.user["role"] != "admin":
            abort(403)
        return f(*a, **kw)
    return wrapper


def purger_etablissement(con, eid):
    """Supprime l'établissement et TOUT ce qui en dépend (tables à etab_id et leurs tables liées par clé étrangère)."""
    tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
    enfants = {}   # parent -> [(table enfant, colonne enfant, colonne parent)]
    for t in tables:
        for fk in con.execute(f'PRAGMA foreign_key_list("{t}")').fetchall():
            enfants.setdefault(fk["table"], []).append((t, fk["from"], fk["to"] or "id"))

    def supprimer(table, where, args, profondeur=0):
        if profondeur > 6:
            return
        for enfant, col, col_parent in enfants.get(table, []):
            if enfant != table:
                supprimer(enfant, f'"{col}" IN (SELECT "{col_parent}" FROM "{table}" WHERE {where})', args, profondeur + 1)
        con.execute(f'DELETE FROM "{table}" WHERE {where}', args)

    for t in tables:
        if t != "etablissements" and any(c["name"] == "etab_id" for c in con.execute(f'PRAGMA table_info("{t}")')):
            supprimer(t, "etab_id=?", (eid,))
    con.execute("DELETE FROM etablissements WHERE id=?", (eid,))


@app.route("/etablissements", methods=["GET", "POST"])
@admin_only
def etablissements():
    from .db import installer_postes
    from .modeles_defaut import installer
    if request.method == "POST":
        f, action = request.form, request.form.get("action")
        if action == "ajouter":
            nom = f.get("nom", "").strip()[:120]
            if not nom:
                flash("Indiquez le nom de l'établissement.", "err")
            elif one("SELECT 1 FROM etablissements WHERE lower(nom)=lower(?)", (nom,)):
                flash("Un établissement porte déjà ce nom.", "err")
            else:
                eid = run("INSERT INTO etablissements(nom) VALUES (?)", (nom,))
                run("INSERT OR IGNORE INTO user_etabs VALUES (?,?)", (g.user["id"], eid))
                installer(db(), eid)
                installer_postes(db(), eid)
                log("établissement créé", nom)
                session["etab_id"] = eid
                flash(f"Établissement « {nom} » créé et sélectionné : modèles de documents, postes et en-tête par défaut installés. "
                      "Complétez l'en-tête (Documents), les niveaux (Classes), puis ajoutez professeurs et élèves.", "ok")
                return redirect(url_for("dashboard"))
        elif action == "renommer":
            e = one("SELECT * FROM etablissements WHERE id=?", (f.get("id", type=int),))
            nom = f.get("nom", "").strip()[:120]
            if e and nom and not one("SELECT 1 FROM etablissements WHERE lower(nom)=lower(?) AND id<>?", (nom, e["id"])):
                run("UPDATE etablissements SET nom=? WHERE id=?", (nom, e["id"]))
                log("établissement renommé", f"{e['nom']} -> {nom}")
                flash("Établissement renommé.", "ok")
            else:
                flash("Nom invalide ou déjà utilisé.", "err")
        elif action == "rattacher":
            e = one("SELECT * FROM etablissements WHERE id=?", (f.get("id", type=int),))
            if not e:
                abort(404)
            run("INSERT OR IGNORE INTO user_etabs VALUES (?,?)", (g.user["id"], e["id"]))
            log("rattachement à un établissement", e["nom"])
            flash(f"Vous avez maintenant accès à « {e['nom']} » (menu de sélection en haut à gauche).", "ok")
        elif action == "supprimer":
            e = one("SELECT * FROM etablissements WHERE id=?", (f.get("id", type=int),))
            if not e:
                abort(404)
            if DEMO and e["nom"] in ETABS_DEMO_PROTEGES:
                flash("Les deux établissements d'origine de la démonstration sont protégés ; vous pouvez supprimer ceux que vous avez créés.", "err")
            elif one("SELECT COUNT(*) c FROM etablissements", ())["c"] <= 1:
                flash("Impossible de supprimer le dernier établissement.", "err")
            elif not one("SELECT 1 FROM user_etabs WHERE user_id=? AND etab_id<>?", (g.user["id"], e["id"])):
                flash("Rattachez-vous d'abord à un autre établissement (bouton « Me rattacher »), sinon vous n'auriez plus accès à rien.", "err")
            elif f.get("confirmation", "").strip() != e["nom"]:
                flash("Confirmation incorrecte : recopiez exactement le nom de l'établissement.", "err")
            elif not check_password_hash(g.user["pwd_hash"], f.get("password", "")):
                flash("Mot de passe incorrect.", "err")
            else:
                con = db()
                try:
                    con.execute("BEGIN")
                    purger_etablissement(con, e["id"])
                    orphelins = con.execute("SELECT id FROM users WHERE actif=1 AND id<>? AND NOT EXISTS (SELECT 1 FROM user_etabs ue WHERE ue.user_id=users.id)",
                                            (g.user["id"],)).fetchall()
                    for o in orphelins:
                        con.execute("UPDATE users SET actif=0 WHERE id=?", (o["id"],))
                    if con.execute("PRAGMA foreign_key_check").fetchall():
                        raise sqlite3.IntegrityError("références restantes")
                    con.commit()
                except Exception as ex:   # rien n'est supprimé en cas de problème
                    con.rollback()
                    flash(f"Suppression annulée, rien n'a été effacé ({ex}).", "err")
                    return redirect(url_for("etablissements"))
                log("établissement supprimé", e["nom"])
                restants = q("SELECT e.id FROM etablissements e JOIN user_etabs ue ON ue.etab_id=e.id WHERE ue.user_id=? ORDER BY e.nom", (g.user["id"],))
                session["etab_id"] = restants[0]["id"] if restants else None
                flash(f"Établissement « {e['nom']} » supprimé avec toutes ses données."
                      + (f" {len(orphelins)} compte(s) rattaché(s) à lui seul ont été désactivés." if orphelins else ""), "ok")
        return redirect(url_for("etablissements"))
    rows = []
    for e in q("SELECT * FROM etablissements ORDER BY nom"):
        n = lambda sql: one(sql, (e["id"],))["c"]
        rows.append(dict(e, eleves=n("SELECT COUNT(*) c FROM eleves WHERE etab_id=?"), profs=n("SELECT COUNT(*) c FROM professeurs WHERE etab_id=?"),
                         classes=n("SELECT COUNT(*) c FROM classes WHERE etab_id=?"), comptes=n("SELECT COUNT(*) c FROM user_etabs WHERE etab_id=?"),
                         protege=bool(DEMO and e["nom"] in ETABS_DEMO_PROTEGES), a_acces=bool(one("SELECT 1 FROM user_etabs WHERE user_id=? AND etab_id=?", (g.user["id"], e["id"])))))
    return render_template("etablissements.html", rows=rows, nb=len(rows))


# ───────────────────────── Gestion des comptes utilisateurs ─────────────────────────
ROLES = {"enseignant": "Enseignant", "cpe": "CPE", "infirmier": "Infirmier(ère)", "direction": "Direction", "admin": "Administrateur"}


def peut_gerer(cible_role):
    """Le personnel gère les enseignants ; direction/admin gèrent aussi le personnel."""
    return cible_role == "enseignant" or g.user["role"] in ("admin", "direction")


def mot_de_passe_temporaire():
    return secrets.token_urlsafe(9)


def creer_compte(nom, email, role, prof_id=None):
    """Crée (ou rattache à cet établissement) un compte. Retourne (user_id, mot_de_passe_temporaire ou None)."""
    email = email.strip().lower()
    existant = one("SELECT * FROM users WHERE email=?", (email,))
    if existant:
        if one("SELECT 1 FROM user_etabs WHERE user_id=? AND etab_id=?", (existant["id"], g.etab_id)):
            raise ValueError("Ce compte existe déjà dans cet établissement.")
        if existant["role"] != role and role != "enseignant":
            raise ValueError("Cette adresse existe déjà avec un autre rôle.")
        run("INSERT INTO user_etabs VALUES (?,?)", (existant["id"], g.etab_id))
        uid, mdp = existant["id"], None
    else:
        mdp = mot_de_passe_temporaire()
        uid = run("INSERT INTO users(nom,email,pwd_hash,role,must_change) VALUES (?,?,?,?,?)",
                  (nom.strip(), email, generate_password_hash(mdp), role, 0 if DEMO else 1))
        run("INSERT INTO user_etabs VALUES (?,?)", (uid, g.etab_id))
    if prof_id:
        run("UPDATE professeurs SET user_id=? WHERE id=? AND etab_id=? AND user_id IS NULL", (uid, prof_id, g.etab_id))
    log("compte créé", f"{email} ({role})")
    ext.emit("utilisateur.cree", user_id=uid, email=email, nom=nom.strip(), role=role)
    return uid, mdp


@app.route("/utilisateurs", methods=["GET", "POST"])
@staff_only
def utilisateurs():
    if request.method == "POST":
        f = request.form
        role = f.get("role", "enseignant")
        email = f.get("email", "").strip()
        if role not in ROLES or not peut_gerer(role):
            abort(403)
        if not f.get("nom", "").strip() or "@" not in email:
            flash("Nom et adresse e-mail valide obligatoires.", "err")
        else:
            try:
                _, mdp = creer_compte(f["nom"], email, role, f.get("prof_id", type=int))
                flash(f"Compte créé pour {email}. Mot de passe temporaire (à transmettre, affiché une seule fois) : {mdp}"
                      if mdp else f"{email} a déjà un compte : il a été rattaché à cet établissement.", "ok")
            except ValueError as e:
                flash(str(e), "err")
        return redirect(url_for("utilisateurs"))
    rows = q("SELECT u.*, (SELECT COUNT(*) FROM user_etabs WHERE user_id=u.id) nb_etabs, "
             "(SELECT nom || ' ' || prenom FROM professeurs WHERE user_id=u.id AND etab_id=?) fiche "
             "FROM users u JOIN user_etabs ue ON ue.user_id=u.id WHERE ue.etab_id=? ORDER BY u.actif DESC, u.nom",
             (g.etab_id, g.etab_id))
    sans_compte = q("SELECT id,nom,prenom,email FROM professeurs WHERE etab_id=? AND user_id IS NULL ORDER BY nom", (g.etab_id,))
    return render_template("utilisateurs.html", rows=rows, roles=ROLES, sans_compte=sans_compte, peut_gerer=peut_gerer)


@app.route("/utilisateurs/<int:uid>/<action>", methods=["POST"])
@staff_only
def utilisateur_action(uid, action):
    u = one("SELECT u.* FROM users u JOIN user_etabs ue ON ue.user_id=u.id WHERE u.id=? AND ue.etab_id=?", (uid, g.etab_id))
    if not u or not peut_gerer(u["role"]):
        abort(404 if not u else 403)
    if uid == g.user["id"]:
        flash("Vous ne pouvez pas modifier votre propre compte ici (utilisez Sécurité).", "err")
        return redirect(url_for("utilisateurs"))
    nb_etabs = one("SELECT COUNT(*) c FROM user_etabs WHERE user_id=?", (uid,))["c"]
    if action == "reinitialiser" and nb_etabs == 1:
        mdp = mot_de_passe_temporaire()
        run("UPDATE users SET pwd_hash=?, must_change=?, totp_secret=NULL WHERE id=?",
            (generate_password_hash(mdp), 0 if DEMO else 1, uid))
        log("mot de passe réinitialisé", u["email"])
        flash(f"Nouveau mot de passe temporaire pour {u['email']} (affiché une seule fois) : {mdp}", "ok")
    elif action in ("desactiver", "activer") and nb_etabs == 1:
        run("UPDATE users SET actif=? WHERE id=?", (1 if action == "activer" else 0, uid))
        log(f"compte {action}", u["email"])
    elif action == "retirer":
        run("DELETE FROM user_etabs WHERE user_id=? AND etab_id=?", (uid, g.etab_id))
        run("UPDATE professeurs SET user_id=NULL WHERE user_id=? AND etab_id=?", (uid, g.etab_id))
        log("compte retiré de l'établissement", u["email"])
    else:
        flash("Action impossible : ce compte est partagé avec d'autres établissements (utilisez « Retirer »).", "err")
    return redirect(url_for("utilisateurs"))


@app.route("/professeurs/<int:pid>/compte", methods=["POST"])
@staff_only
def professeur_compte(pid):
    p = get_prof(pid)
    if p["user_id"] or "@" not in p["email"]:
        flash("Cette fiche a déjà un compte ou n'a pas d'adresse e-mail.", "err")
    else:
        try:
            _, mdp = creer_compte(f"{p['prenom']} {p['nom']}".strip(), p["email"], "enseignant", pid)
            flash(f"Compte créé pour {p['email']}. Mot de passe temporaire (affiché une seule fois) : {mdp}"
                  if mdp else f"{p['email']} rattaché à cet établissement.", "ok")
        except ValueError as e:
            flash(str(e), "err")
    return redirect(request.referrer or url_for("professeurs"))


# ───────────────────────── Sauvegarde ─────────────────────────
@app.route("/sauvegarde", methods=["GET", "POST"])
@staff_only
def sauvegarde():
    if g.user["role"] not in ("admin", "direction"):
        abort(403)
    if request.method == "POST":
        import sqlite3
        import tempfile
        import zipfile
        buf = io.BytesIO()
        with tempfile.TemporaryDirectory() as tmp:
            copie = os.path.join(tmp, "viescolaire.db")
            dest = sqlite3.connect(copie)
            db().backup(dest)  # copie cohérente même pendant l'utilisation
            dest.close()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
                z.write(copie, "viescolaire.db")
                for nom in os.listdir(UPLOAD_DIR):
                    z.write(os.path.join(UPLOAD_DIR, nom), f"uploads/{nom}")
        log("sauvegarde téléchargée")
        return Response(buf.getvalue(), mimetype="application/zip", headers={
            "Content-Disposition": f"attachment; filename=sauvegarde_{datetime.now():%Y%m%d_%H%M}.zip"})
    return render_template("sauvegarde.html")


# ───────────────────────── Génération automatique de l'emploi du temps ─────────────────────────
DEMIS = (("matin", "Matin"), ("apres_midi", "Après-midi"))


def reglages_planning():
    """Réglages du générateur propres à l'établissement courant (aucune demi-journée fermée par défaut)."""
    r = one("SELECT * FROM reglages_planning WHERE etab_id=?", (g.etab_id,))
    fermee, maxc, grille = set(), 7, None
    if r:
        fermee = {(int(x.split(":")[0]), x.split(":")[1]) for x in json.loads(r["classe_fermee"])}
        maxc = r["max_classe_jour"]
        grille = [l.strip() for l in r["grille"].splitlines() if l.strip()] or None
    return {"classe_fermee": fermee, "max_classe_jour": maxc, "grille": grille or CFG["creneaux"] or None}


def charger_planification():
    reg = reglages_planning()
    grille = planning.construire_grille(reg["grille"])
    profs = {p["id"]: {"nom": f"{p['prenom']} {p['nom']}".strip(), "max_jour": p["max_heures_jour"], "voeux": {}, "matiere": p["matiere"]}
             for p in q("SELECT * FROM professeurs WHERE etab_id=?", (g.etab_id,))}
    for v in q("SELECT v.* FROM voeux v JOIN professeurs p ON p.id=v.prof_id WHERE p.etab_id=?", (g.etab_id,)):
        profs[v["prof_id"]]["voeux"][(v["jour"], v["demi"])] = v["niveau"]
    besoins = [dict(b) for b in q("SELECT * FROM besoins WHERE etab_id=? ORDER BY id", (g.etab_id,))]
    return grille, profs, besoins


def temps_depuis_formulaire(f):
    try:
        return min(max(float(f.get("temps_max", 8)), 2), 25)
    except ValueError:
        return 8


@app.route("/planification/parametres", methods=["GET", "POST"])
@staff_only
def planification_parametres():
    reg = reglages_planning()
    if request.method == "POST":
        f = request.form
        fermee = [f"{j}:{d}" for j in range(5) for d, _ in DEMIS if f.get(f"ferme_{j}_{d}")]
        maxc = f.get("max_classe_jour", type=int) or 7
        lignes = [l.strip() for l in f.get("grille", "").splitlines() if l.strip()]
        try:
            assert 3 <= maxc <= 10, "Le maximum d'heures par jour et par classe doit être compris entre 3 et 10."
            if lignes:
                import re as _re
                assert 3 <= len(lignes) <= 14, "La grille doit comporter entre 3 et 14 plages."
                assert all(_re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d", l) for l in lignes), \
                    "Chaque plage doit s'écrire HH:MM-HH:MM (ex. 08:00-09:00)."
                plages = [tuple(l.split("-")) for l in lignes]
                assert all(d < fi for d, fi in plages) and all(plages[k][1] <= plages[k + 1][0] for k in range(len(plages) - 1)), \
                    "Les plages doivent être dans l'ordre, sans chevauchement."
        except AssertionError as e:
            flash(str(e), "err")
            return redirect(url_for("planification_parametres"))
        run("INSERT INTO reglages_planning(etab_id,classe_fermee,max_classe_jour,grille) VALUES (?,?,?,?) "
            "ON CONFLICT(etab_id) DO UPDATE SET classe_fermee=excluded.classe_fermee, max_classe_jour=excluded.max_classe_jour, grille=excluded.grille",
            (g.etab_id, json.dumps(fermee), maxc, "\n".join(lignes)))
        log("réglages de planification modifiés", f"fermées: {fermee or 'aucune'}")
        flash("Réglages enregistrés.", "ok")
        return redirect(url_for("planification"))
    grille_txt = "\n".join(reg["grille"] or planning.GRILLE_PAR_DEFAUT)
    return render_template("planification_parametres.html", reg=reg, demis=DEMIS, grille_txt=grille_txt)


@app.route("/planification")
@staff_only
def planification():
    grille, profs, besoins = charger_planification()
    opt = reglages_planning()
    diag = planning.diagnostic(grille, besoins, profs, opt)
    stats = {
        "besoins": len(besoins), "heures": sum(b["heures"] for b in besoins),
        "classes": len({b["classe"] for b in besoins}),
        "voeux": one("SELECT COUNT(*) c FROM voeux v JOIN professeurs p ON p.id=v.prof_id WHERE p.etab_id=?", (g.etab_id,))["c"],
        "profs_avec_voeux": one("SELECT COUNT(DISTINCT v.prof_id) c FROM voeux v JOIN professeurs p ON p.id=v.prof_id WHERE p.etab_id=?", (g.etab_id,))["c"],
        "profs": len(profs),
    }
    props = q("SELECT id, created_at, auteur, resultat, statut FROM propositions WHERE etab_id=? ORDER BY id DESC LIMIT 10", (g.etab_id,))
    props = [dict(p, res=json.loads(p["resultat"])["stats"]) for p in props]
    return render_template("planification.html", stats=stats, diag=diag, props=props, grille=grille, reg=opt, demis=DEMIS)


@app.route("/planification/besoins", methods=["GET", "POST"])
@staff_only
def besoins():
    if request.method == "POST":
        f = request.form
        pid = f.get("prof_id", type=int)
        h = f.get("heures", type=int) or 0
        if not f.get("classe", "").strip() or not f.get("matiere", "").strip() or not 1 <= h <= 30 \
                or not one("SELECT 1 FROM professeurs WHERE id=? AND etab_id=?", (pid, g.etab_id)):
            flash("Classe, matière, professeur et un volume horaire de 1 à 30 h sont obligatoires.", "err")
        else:
            run("INSERT INTO besoins(etab_id,classe,matiere,prof_id,heures,bloc,salle) VALUES (?,?,?,?,?,?,?)",
                (g.etab_id, f["classe"].strip(), f["matiere"].strip(), pid, h, 2 if f.get("bloc") == "2" else 1, f.get("salle", "").strip()))
            log("besoin ajouté", f"{f['classe']} {f['matiere']} {h} h")
        return redirect(url_for("besoins"))
    rows = q("SELECT b.*, p.nom pnom, p.prenom pprenom FROM besoins b JOIN professeurs p ON p.id=b.prof_id WHERE b.etab_id=? "
             "ORDER BY b.classe, b.matiere", (g.etab_id,))
    par_prof = q("SELECT p.id, p.nom, p.prenom, p.max_heures_jour, COALESCE(SUM(b.heures),0) h FROM professeurs p "
                 "LEFT JOIN besoins b ON b.prof_id=p.id WHERE p.etab_id=? GROUP BY p.id ORDER BY p.nom", (g.etab_id,))
    par_classe = q("SELECT classe, SUM(heures) h FROM besoins WHERE etab_id=? GROUP BY classe ORDER BY classe", (g.etab_id,))
    profs = q("SELECT id,nom,prenom,matiere FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    return render_template("besoins.html", rows=rows, par_prof=par_prof, par_classe=par_classe, profs=profs, classes=classes_)


@app.route("/planification/besoins/<int:bid>/supprimer", methods=["POST"])
@staff_only
def besoin_supprimer(bid):
    run("DELETE FROM besoins WHERE id=? AND etab_id=?", (bid, g.etab_id))
    return redirect(url_for("besoins"))


@app.route("/planification/besoins/depuis-edt", methods=["POST"])
@staff_only
def besoins_depuis_edt():
    """Remplace les besoins par ceux déduits de l'emploi du temps actuel (une heure par créneau, durée convertie en heures)."""
    grille = planning.construire_grille(reglages_planning()["grille"])
    agreg = {}
    for c in q("SELECT prof_id, classe, matiere, salle, debut, fin FROM creneaux WHERE etab_id=?", (g.etab_id,)):
        nb = max(1, sum(1 for x in grille if x["debut"] >= c["debut"] and x["fin"] <= c["fin"]))
        a = agreg.setdefault((c["prof_id"], c["classe"], c["matiere"]), {"h": 0, "tous_doubles": True})
        a["h"] += nb
        a["tous_doubles"] = a["tous_doubles"] and nb == 2
    run("DELETE FROM besoins WHERE etab_id=?", (g.etab_id,))
    for (pid, classe, matiere), a in agreg.items():
        db().execute("INSERT INTO besoins(etab_id,classe,matiere,prof_id,heures,bloc) VALUES (?,?,?,?,?,?)",
                     (g.etab_id, classe, matiere, pid, a["h"], 2 if a["tous_doubles"] and a["h"] % 2 == 0 else 1))
    db().commit()
    lignes = agreg
    log("besoins repris de l'emploi du temps", f"{len(lignes)} lignes")
    flash(f"{len(lignes)} besoin(s) repris de l'emploi du temps actuel.", "ok")
    return redirect(url_for("besoins"))


def enregistrer_voeux(prof_ids, f):
    for pid in prof_ids:
        db().execute("DELETE FROM voeux WHERE prof_id=?", (pid,))
        for j in range(5):
            for demi, _ in DEMIS:
                niveau = f.get(f"v_{pid}_{j}_{demi}", "")
                if niveau in ("non", "souhait"):
                    db().execute("INSERT INTO voeux VALUES (?,?,?,?)", (pid, j, demi, niveau))
        m = f.get(f"max_{pid}", type=int)
        if m and 2 <= m <= 10:
            db().execute("UPDATE professeurs SET max_heures_jour=? WHERE id=?", (m, pid))
    db().commit()


def voeux_par_prof(prof_ids):
    out = {pid: {} for pid in prof_ids}
    for v in q("SELECT * FROM voeux WHERE prof_id IN (%s)" % ",".join("?" * len(prof_ids)), list(prof_ids)) if prof_ids else []:
        out[v["prof_id"]][(v["jour"], v["demi"])] = v["niveau"]
    return out


@app.route("/planification/voeux", methods=["GET", "POST"])
@staff_only
def voeux():
    profs = q("SELECT id,nom,prenom,matiere,max_heures_jour FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    if request.method == "POST":
        enregistrer_voeux([p["id"] for p in profs], request.form)
        log("vœux enregistrés", f"{len(profs)} professeurs")
        flash("Vœux enregistrés.", "ok")
        return redirect(url_for("voeux"))
    return render_template("voeux.html", profs=profs, voeux=voeux_par_prof([p["id"] for p in profs]), demis=DEMIS,
                           action=url_for("voeux"), titre="Disponibilités et vœux des professeurs")


@app.route("/mes-voeux", methods=["GET", "POST"])
def mes_voeux():
    if not g.prof:
        abort(403)
    p = one("SELECT id,nom,prenom,matiere,max_heures_jour FROM professeurs WHERE id=?", (g.prof["id"],))
    if request.method == "POST":
        enregistrer_voeux([p["id"]], request.form)
        log("vœux enregistrés (enseignant)", p["nom"])
        flash("Vos vœux ont été enregistrés. Ils seront pris en compte lors de la prochaine génération.", "ok")
        return redirect(url_for("mes_voeux"))
    return render_template("voeux.html", profs=[p], voeux=voeux_par_prof([p["id"]]), demis=DEMIS, action=url_for("mes_voeux"),
                           titre="Mes disponibilités et vœux")


def produire_proposition(temps, forcer=False):
    """Calcule une proposition d'emploi du temps à partir des besoins et des vœux ; retourne son identifiant (None si impossible, avec message)."""
    grille, profs, besoins_ = charger_planification()
    if not besoins_:
        flash("Aucun besoin saisi : ajoutez d'abord les classes, matières, professeurs et volumes horaires.", "err")
        return None
    opt = reglages_planning()
    erreurs = [m for k, m in planning.diagnostic(grille, besoins_, profs, opt) if k == "err"]
    if erreurs and not forcer:
        flash("Génération impossible en l'état : " + " ".join(erreurs[:3]), "err")
        return None
    res = planning.generer(grille, besoins_, {k: v for k, v in profs.items()}, opt, temps_max=temps)
    pid = run("INSERT INTO propositions(etab_id,created_at,auteur,options,resultat) VALUES (?,?,?,?,?)",
              (g.etab_id, datetime.now().isoformat(timespec="minutes"), g.user["nom"],
               json.dumps({"classe_fermee": sorted(f"{j}:{d}" for j, d in opt["classe_fermee"]), "max_classe_jour": opt["max_classe_jour"],
                           "grille": opt["grille"] or planning.GRILLE_PAR_DEFAUT}),
               json.dumps(res)))
    log("emploi du temps généré", f"{res['stats']['placees']}/{res['stats']['seances']} séances")
    return pid


@app.route("/planification/generer", methods=["POST"])
@staff_only
def generer_edt():
    pid = produire_proposition(temps_depuis_formulaire(request.form), bool(request.form.get("forcer")))
    return redirect(url_for("proposition", pid=pid) if pid else url_for("planification"))


# ───────────── Volumes horaires par niveau -> besoins -> professeurs (selon matières, charge et vœux) -> emploi du temps ─────────────
CAPACITE_DEFAUT_H = 18      # service hebdomadaire supposé quand le « service dû » du professeur n'est pas renseigné
TAUX_REMPLISSAGE = 0.85     # un professeur ne peut pas occuper 100 % de ses créneaux possibles : on garde une marge pour le placement


def cle_matiere(t):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", (t or "").strip().lower()) if unicodedata.category(c) != "Mn")


def creneaux_possibles(prof_voeux, grille, reg):
    """Nombre de créneaux hebdomadaires où le professeur peut enseigner : ni demi-journée fermée aux classes, ni indisponibilité impérative."""
    n = 0
    for j in range(5):
        for c in grille:
            if (j, c["demi"]) in reg["classe_fermee"] or prof_voeux.get((j, c["demi"])) == "non":
                continue
            n += 1
    return n


def affecter_volumes(volumes, classes, ordre_niveaux, profs, charge_initiale, grille, reg, deja_couverts=(), imposes=None):
    """Répartit les cours (classe × matière) issus des volumes horaires entre les professeurs de la matière.
    Règles : même matière ; capacité = min(service dû, 85 % des créneaux possibles d'après les vœux) ; un même professeur garde
    d'abord toutes les classes d'un niveau (continuité) puis on équilibre la charge. Retourne (affectations, non affectées, charges)."""
    par_matiere = {}
    for pid, p in profs.items():
        par_matiere.setdefault(cle_matiere(p["matiere"]), []).append(pid)
    capacite = {}
    for pid, p in profs.items():
        service = (p.get("service_min") or 0) / 60 or CAPACITE_DEFAUT_H
        capacite[pid] = int(min(service, TAUX_REMPLISSAGE * creneaux_possibles(p["voeux"], grille, reg)))
    charge = dict(charge_initiale)
    taches = []
    for niv in sorted({v["niveau"] for v in volumes}, key=lambda n: ordre_niveaux.get(n, 99)):
        cl = [c["nom"] for c in classes if c["niveau"] == niv]
        for v in sorted((x for x in volumes if x["niveau"] == niv and x["heures"] > 0), key=lambda x: cle_matiere(x["matiere"])):
            for c in cl:
                if (c, cle_matiere(v["matiere"])) in deja_couverts:
                    continue   # cours déjà couvert par un besoin saisi à la main : on ne le double pas
                taches.append({"classe": c, "niveau": niv, "matiere": v["matiere"], "heures": v["heures"], "bloc": v["bloc"]})
    taches.sort(key=lambda t: (cle_matiere(t["matiere"]), ordre_niveaux.get(t["niveau"], 99), t["classe"]))
    affectations, non_affectes, deja = [], [], {}
    imposes = imposes or {}
    restantes = []
    for t in taches:   # choix manuels d'abord : ils comptent dans la charge avant la répartition automatique
        pid = imposes.get((t["classe"], cle_matiere(t["matiere"])))
        if pid in profs:
            charge[pid] = charge.get(pid, 0) + t["heures"]
            affectations.append(dict(t, prof_id=pid, impose=True))
            deja.setdefault((cle_matiere(t["matiere"]), t["niveau"]), pid)
        else:
            restantes.append(t)
    for t in restantes:
        cands = par_matiere.get(cle_matiere(t["matiere"]), [])
        if not cands:
            non_affectes.append(dict(t, raison="aucun professeur de cette matière"))
            continue
        ok = [pid for pid in cands if charge.get(pid, 0) + t["heures"] <= capacite[pid]]
        if not ok:
            non_affectes.append(dict(t, raison="capacité des professeurs de la matière atteinte (service dû ou vœux)"))
            continue
        cle_niv = (cle_matiere(t["matiere"]), t["niveau"])
        choisi = min(ok, key=lambda pid: (0 if deja.get(cle_niv) == pid else 1, charge.get(pid, 0) / max(capacite[pid], 1), pid))
        deja.setdefault(cle_niv, choisi)
        charge[choisi] = charge.get(choisi, 0) + t["heures"]
        affectations.append(dict(t, prof_id=choisi))
    return affectations, non_affectes, charge, capacite


def contexte_volumes():
    """Données communes à la page et à l'application des volumes."""
    grille, profs, _ = charger_planification()
    reg = reglages_planning()
    for r in q("SELECT id, service_min FROM professeurs WHERE etab_id=?", (g.etab_id,)):
        profs[r["id"]]["service_min"] = r["service_min"]
    niveaux_ = q("SELECT nom FROM niveaux WHERE etab_id=? ORDER BY ordre, nom", (g.etab_id,))
    ordre = {n["nom"]: i for i, n in enumerate(niveaux_)}
    classes_ = [dict(c) for c in q("SELECT nom, niveau FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))]
    volumes = [dict(v) for v in q("SELECT * FROM volumes_horaires WHERE etab_id=? ORDER BY matiere", (g.etab_id,))]
    return grille, profs, reg, niveaux_, ordre, classes_, volumes


def besoins_manuels_couverts():
    return {(b["classe"], cle_matiere(b["matiere"])) for b in q("SELECT classe, matiere FROM besoins WHERE etab_id=? AND source='manuel'", (g.etab_id,))}


def choix_imposes():
    return {(r["classe"], cle_matiere(r["matiere"])): r["prof_id"] for r in q("SELECT classe, matiere, prof_id FROM choix_professeurs WHERE etab_id=?", (g.etab_id,))}


def charge_manuelle():
    return {r["prof_id"]: r["h"] for r in q("SELECT prof_id, SUM(heures) h FROM besoins WHERE etab_id=? AND source='manuel' GROUP BY prof_id", (g.etab_id,))}


@app.route("/planification/volumes", methods=["GET", "POST"])
@staff_only
def volumes():
    grille, profs, reg, niveaux_, ordre, classes_, vols = contexte_volumes()
    if request.method == "POST":
        f, action = request.form, request.form.get("action")
        if action == "enregistrer":
            noms = [n["nom"] for n in niveaux_]
            matieres = sorted({v["matiere"] for v in vols} | {x.strip() for x in f.getlist("matiere") if x.strip()}, key=cle_matiere)
            run("DELETE FROM volumes_horaires WHERE etab_id=?", (g.etab_id,))
            for i, m in enumerate(f.getlist("matiere")):
                m = m.strip()
                if not m:
                    continue
                bloc = 2 if f.get(f"bloc_{i}") else 1
                for j, niv in enumerate(noms):
                    try:
                        h = int(f.get(f"h_{i}_{j}", "0") or 0)
                    except ValueError:
                        h = 0
                    if 0 < h <= 30:
                        db().execute("INSERT OR REPLACE INTO volumes_horaires(etab_id,niveau,matiere,heures,bloc) VALUES (?,?,?,?,?)", (g.etab_id, niv, m[:80], h, bloc))
            db().commit()
            log("volumes horaires enregistrés")
            flash("Volumes horaires enregistrés.", "ok")
        elif action == "choix":
            run("DELETE FROM choix_professeurs WHERE etab_id=?", (g.etab_id,))
            n = 0
            for cle, val in f.items():
                if not cle.startswith("c::") or not val.isdigit():
                    continue
                _, classe, matiere = cle.split("::", 2)
                if one("SELECT 1 FROM professeurs WHERE id=? AND etab_id=?", (int(val), g.etab_id)) and one("SELECT 1 FROM classes WHERE nom=? AND etab_id=?", (classe, g.etab_id)):
                    db().execute("INSERT OR REPLACE INTO choix_professeurs(etab_id,classe,matiere,prof_id) VALUES (?,?,?,?)", (g.etab_id, classe, matiere, int(val)))
                    n += 1
            db().commit()
            log("professeurs imposés par classe", f"{n} choix")
            flash(f"{n} choix de professeur enregistré(s) : ils seront respectés à la prochaine génération des besoins.", "ok")
        elif action == "appliquer":
            affect, non_aff, charge, cap = affecter_volumes(vols, classes_, ordre, profs, {} if f.get("tout") else charge_manuelle(), grille, reg,
                                                            () if f.get("tout") else besoins_manuels_couverts(), choix_imposes())
            if f.get("tout"):
                run("DELETE FROM besoins WHERE etab_id=?", (g.etab_id,))
            else:
                run("DELETE FROM besoins WHERE etab_id=? AND source='volumes'", (g.etab_id,))
            existants = {(b["classe"], cle_matiere(b["matiere"])) for b in q("SELECT classe, matiere FROM besoins WHERE etab_id=?", (g.etab_id,))}
            n = 0
            for a in affect:
                if (a["classe"], cle_matiere(a["matiere"])) in existants:
                    continue   # un besoin saisi à la main pour cette classe et cette matière est conservé
                db().execute("INSERT INTO besoins(etab_id,classe,matiere,prof_id,heures,bloc,salle,source) VALUES (?,?,?,?,?,?,?,'volumes')",
                             (g.etab_id, a["classe"], a["matiere"], a["prof_id"], a["heures"], a["bloc"], ""))
                n += 1
            db().commit()
            log("besoins générés depuis les volumes horaires", f"{n} besoins, {len(non_aff)} sans professeur")
            if f.get("enchainer"):
                flash(f"{n} besoins créés" + (f" ({len(non_aff)} cours sans professeur disponible, voir ci-dessous)" if non_aff else "") + ".", "ok" if not non_aff else "err")
                pid = produire_proposition(temps_depuis_formulaire(f), True)
                if pid:
                    return redirect(url_for("proposition", pid=pid))
            else:
                flash(f"{n} besoins créés à partir des volumes horaires" + (f" ; {len(non_aff)} cours restent sans professeur." if non_aff else "."), "ok" if not non_aff else "err")
        return redirect(url_for("volumes"))
    # aperçu non destructif de l'affectation
    affect, non_aff, charge, cap = affecter_volumes(vols, classes_, ordre, profs, charge_manuelle(), grille, reg, besoins_manuels_couverts(), choix_imposes())
    matieres = sorted({v["matiere"] for v in vols}, key=cle_matiere)
    cell = {(v["matiere"], v["niveau"]): v["heures"] for v in vols}
    bloc = {v["matiere"]: v["bloc"] for v in vols}
    nb_classes = {n["nom"]: sum(1 for c in classes_ if c["niveau"] == n["nom"]) for n in niveaux_}
    total_niveau = {n["nom"]: sum(v["heures"] for v in vols if v["niveau"] == n["nom"]) for n in niveaux_}
    max_hebdo = reg["max_classe_jour"] * (5 - len({j for j, _ in reg["classe_fermee"]})) if reg["max_classe_jour"] else 0
    lignes_profs = sorted(({"nom": profs[pid]["nom"], "matiere": profs[pid]["matiere"], "heures": charge.get(pid, 0), "cap": cap[pid],
                            "possibles": creneaux_possibles(profs[pid]["voeux"], grille, reg), "nb_voeux_non": sum(1 for v in profs[pid]["voeux"].values() if v == "non")}
                           for pid in profs), key=lambda x: (cle_matiere(x["matiere"]), x["nom"]))
    imp = choix_imposes()
    par_mat = {}
    for pid, p_ in profs.items():
        par_mat.setdefault(cle_matiere(p_["matiere"]), []).append((pid, p_["nom"]))
    blocs = []
    for n in niveaux_:
        cls = [c["nom"] for c in classes_ if c["niveau"] == n["nom"]]
        mats = sorted({v["matiere"] for v in vols if v["niveau"] == n["nom"] and v["heures"] > 0}, key=cle_matiere)
        if cls and mats:
            blocs.append({"niveau": n["nom"], "classes": cls, "lignes": [{"matiere": m, "bons": sorted(par_mat.get(cle_matiere(m), []), key=lambda x: x[1]),
                          "autres": sorted([(pid, p_["nom"]) for pid, p_ in profs.items() if cle_matiere(p_["matiere"]) != cle_matiere(m)], key=lambda x: x[1]),
                          "cases": [imp.get((c, cle_matiere(m))) for c in cls]} for m in mats]})
    return render_template("volumes.html", blocs=blocs, nb_imposes=len(imp), niveaux=niveaux_, matieres=matieres, cell=cell, bloc=bloc, nb_classes=nb_classes, total_niveau=total_niveau,
                           non_aff=non_aff, profs_lignes=lignes_profs, nb_affect=len(affect), nb_besoins_manuels=one("SELECT COUNT(*) c FROM besoins WHERE etab_id=? AND source='manuel'", (g.etab_id,))["c"],
                           nb_besoins_volumes=one("SELECT COUNT(*) c FROM besoins WHERE etab_id=? AND source='volumes'", (g.etab_id,))["c"])


def get_proposition(pid):
    p = one("SELECT * FROM propositions WHERE id=? AND etab_id=?", (pid, g.etab_id))
    if not p:
        abort(404)
    return p


@app.route("/planification/propositions/<int:pid>")
@staff_only
def proposition(pid):
    p = get_proposition(pid)
    res = json.loads(p["resultat"])
    _, profs, _ = charger_planification()
    grille = planning.construire_grille(json.loads(p["options"]).get("grille"))  # la grille utilisée lors de la génération
    vue = "prof" if request.args.get("vue") == "prof" else "classe"
    classes_ = sorted({x["classe"] for x in res["placements"]})
    profs_tries = sorted(profs, key=lambda i: profs[i]["nom"])
    cible = request.args.get("cible") or (str(profs_tries[0]) if vue == "prof" and profs_tries else (classes_[0] if classes_ else ""))
    cases = {}
    for x in res["placements"]:
        if (vue == "classe" and x["classe"] != cible) or (vue == "prof" and str(x["prof_id"]) != cible):
            continue
        texte = f"{x['matiere']} · {profs.get(x['prof_id'], {}).get('nom', '?')}" if vue == "classe" else f"{x['classe']} · {x['matiere']}"
        for k in range(x["longueur"]):
            cases[(x["jour"], x["debut_idx"] + k)] = (texte + (f" ({x['salle']})" if x["salle"] else ""), x["matiere"])
    non_places = [dict(n, prof=profs.get(n["prof_id"], {}).get("nom", "?")) for n in res["non_places"]]
    impact = {
        "creneaux": one("SELECT COUNT(*) c FROM creneaux WHERE etab_id=?", (g.etab_id,))["c"],
        "remplacements": one("SELECT COUNT(*) c FROM remplacements WHERE etab_id=? AND date>=?", (g.etab_id, date.today().isoformat()))["c"],
        "perturbations": one("SELECT COUNT(*) c FROM perturbations WHERE etab_id=? AND date>=?", (g.etab_id, date.today().isoformat()))["c"],
    }
    return render_template("proposition.html", p=p, res=res, grille=grille, cases=cases, vue=vue, cible=cible,
                           classes=classes_, profs=sorted(profs.items(), key=lambda kv: kv[1]["nom"]), non_places=non_places, impact=impact)


@app.route("/planification/propositions/<int:pid>/appliquer", methods=["POST"])
@staff_only
def proposition_appliquer(pid):
    p = get_proposition(pid)
    if not request.form.get("confirmer"):
        flash("Cochez la case de confirmation pour remplacer l'emploi du temps.", "err")
        return redirect(url_for("proposition", pid=pid))
    res = json.loads(p["resultat"])
    grille = planning.construire_grille(json.loads(p["options"]).get("grille"))
    con = db()
    con.execute("DELETE FROM creneaux WHERE etab_id=?", (g.etab_id,))  # les remplacements/perturbations liés sont supprimés (cascade)
    for x in res["placements"]:
        fin_idx = x["debut_idx"] + x["longueur"] - 1
        con.execute("INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
                    (g.etab_id, x["prof_id"], x["classe"], x["matiere"], x["jour"], grille[x["debut_idx"]]["debut"],
                     grille[fin_idx]["fin"], x["salle"]))
    con.execute("UPDATE propositions SET statut='appliquee' WHERE id=?", (pid,))
    con.commit()
    for a in q("SELECT id FROM absences WHERE etab_id=? AND type='absence' AND date_fin>=?", (g.etab_id, date.today().isoformat())):
        generer_remplacements(a["id"], depuis=date.today())
    log("emploi du temps appliqué", f"proposition {pid}, {len(res['placements'])} créneaux")
    ext.emit("emploi_du_temps.applique", proposition_id=pid, nb_creneaux=len(res["placements"]))
    flash(f"Emploi du temps appliqué ({len(res['placements'])} créneaux). Les remplacements à venir ont été recalculés.", "ok")
    return redirect(url_for("emploi_du_temps"))


@app.route("/planification/propositions/<int:pid>/supprimer", methods=["POST"])
@staff_only
def proposition_supprimer(pid):
    get_proposition(pid)
    run("DELETE FROM propositions WHERE id=?", (pid,))
    return redirect(url_for("planification"))


# ───────────────────────── 5. Fonctionnalités avancées ─────────────────────────
@app.route("/assistant")
@staff_only
def assistant():
    """Assistant intelligent : résumé de la journée et suggestions d'actions (règles métier locales)."""
    today = date.today()
    iso = today.isoformat()
    cours_ = cours_du_jour(today)
    a_pourvoir = [c for c in cours_ if c["etat"] == "a_pourvoir"]
    remplaces = [c for c in cours_ if c["etat"] == "remplace"]
    annules = [c for c in cours_ if c["etat"] == "annule"]
    absents = q("SELECT p.nom, p.prenom, a.motif FROM absences a JOIN professeurs p ON p.id=a.prof_id "
                "WHERE a.etab_id=? AND a.type='absence' AND a.date_debut<=? AND a.date_fin>=?", (g.etab_id, iso, iso))
    resume = [f"{today.strftime('%d/%m/%Y')} : {len(absents)} professeur(s) absent(s)"
              + (" (" + ", ".join(f"{a['prenom']} {a['nom']}" for a in absents) + ")" if absents else "") + "."]
    if cours_:
        resume.append(f"{len(cours_)} cours au programme : {len(remplaces)} remplacé(s), {len(annules)} annulé(s), "
                      f"{len(a_pourvoir)} sans solution.")
    reunions_ = q("SELECT * FROM reunions WHERE etab_id=? AND date=?", (g.etab_id, iso))
    if reunions_:
        resume.append("Réunions du jour : " + ", ".join(f"{r['titre']} ({r['heure']})" for r in reunions_) + ".")
    suggestions = []
    for r in q("SELECT r.*, c.classe, c.debut, c.fin, p.nom pnom FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id "
               "JOIN professeurs p ON p.id=c.prof_id WHERE r.etab_id=? AND r.statut='a_pourvoir' AND r.date>=? ORDER BY r.date, c.debut LIMIT 10",
               (g.etab_id, iso)):
        sug = suggerer_remplacants(r, 1)
        suggestions.append({"r": r, "sug": sug[0] if sug else None})
    non_lus = q("SELECT COUNT(*) c FROM message_dest md JOIN messages m ON m.id=md.message_id WHERE m.sender_id=? AND m.etab_id=? "
                "AND md.confirme_at IS NULL AND m.created_at<?", (g.user["id"], g.etab_id, (today - timedelta(days=2)).isoformat()))[0]["c"]
    return render_template("assistant.html", resume=resume, suggestions=suggestions, relances=non_lus, alertes=alertes())


@app.route("/import", methods=["GET", "POST"])
@staff_only
def importer():
    if request.method == "POST":
        fichier = request.files.get("fichier")
        kind = request.form.get("kind")
        if not fichier or kind not in ("professeurs", "creneaux", "besoins", "eleves"):
            flash("Fichier ou type manquant.", "err")
            return redirect(url_for("importer"))
        try:
            texte = fichier.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            fichier.seek(0)
            texte = fichier.read().decode("latin-1")
        delim = ";" if texte.split("\n", 1)[0].count(";") >= texte.split("\n", 1)[0].count(",") else ","
        rows = list(csv.DictReader(io.StringIO(texte), delimiter=delim))
        ok, ignores, maj_n = 0, 0, 0
        for r in rows:
            r = {(k or "").strip().lower(): (v or "").strip() for k, v in r.items()}
            if kind == "professeurs":
                if not r.get("nom"):
                    ignores += 1
                    continue
                if r.get("email") and one("SELECT 1 FROM professeurs WHERE etab_id=? AND email=?", (g.etab_id, r["email"])):
                    ignores += 1
                    continue
                db().execute("INSERT INTO professeurs(etab_id,nom,prenom,matiere,email,telephone) VALUES (?,?,?,?,?,?)",
                             (g.etab_id, r["nom"], r.get("prenom", ""), r.get("matiere", ""), r.get("email", ""), r.get("telephone", "")))
                ok += 1
            elif kind == "eleves":
                if not r.get("nom"):
                    ignores += 1
                    continue
                champs = {"responsable": r.get("responsable", ""), "contact": r.get("contact", ""), "date_naissance": parse_naissance(r.get("date_naissance", "")),
                          "sexe": norm_sexe(r.get("sexe", "")), "adresse": r.get("adresse", "")[:200], "code_postal": r.get("code_postal", "")[:10],
                          "ville": r.get("ville", "")[:80], "telephone": r.get("telephone", "")[:30]}
                deja = one("SELECT id FROM eleves WHERE etab_id=? AND lower(nom)=lower(?) AND lower(prenom)=lower(?) AND lower(classe)=lower(?)",
                           (g.etab_id, r["nom"], r.get("prenom", ""), r.get("classe", ""))) if request.form.get("maj") else None
                if deja:   # mise à jour : seules les colonnes renseignées dans le fichier remplacent les valeurs existantes
                    for k, v in champs.items():
                        if v:
                            db().execute(f"UPDATE eleves SET {k}=? WHERE id=?", (v, deja["id"]))
                    maj_n += 1
                    continue
                db().execute("INSERT INTO eleves(etab_id,nom,prenom,classe,responsable,contact,date_naissance,sexe,adresse,code_postal,ville,telephone) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                             (g.etab_id, r["nom"], r.get("prenom", ""), r.get("classe", ""), champs["responsable"], champs["contact"], champs["date_naissance"],
                              champs["sexe"], champs["adresse"], champs["code_postal"], champs["ville"], champs["telephone"]))
                ok += 1
            elif kind == "besoins":
                p = one("SELECT * FROM professeurs WHERE etab_id=? AND (email=? OR (nom=? AND prenom=?))",
                        (g.etab_id, r.get("email", "~"), r.get("nom", "~"), r.get("prenom", "")))
                try:
                    h = int(r.get("heures", ""))
                except ValueError:
                    h = 0
                if not p or not r.get("classe") or not r.get("matiere") or not 1 <= h <= 30:
                    ignores += 1
                    continue
                db().execute("INSERT INTO besoins(etab_id,classe,matiere,prof_id,heures,bloc,salle) VALUES (?,?,?,?,?,?,?)",
                             (g.etab_id, r["classe"], r["matiere"], p["id"], h, 2 if r.get("bloc") == "2" else 1, r.get("salle", "")))
                ok += 1
            else:
                p = one("SELECT * FROM professeurs WHERE etab_id=? AND (email=? OR (nom=? AND prenom=?))",
                        (g.etab_id, r.get("email", "~"), r.get("nom", "~"), r.get("prenom", "")))
                jour = [j.lower() for j in JOURS].index(r["jour"].lower()) if r.get("jour", "").lower() in [j.lower() for j in JOURS] else -1
                d_, f_ = heure_norm(r.get("debut", "")), heure_norm(r.get("fin", ""))
                if not p or jour < 0 or not r.get("classe") or not d_ or not f_ or d_ >= f_:
                    ignores += 1
                    continue
                db().execute("INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
                             (g.etab_id, p["id"], r["classe"], r.get("matiere") or p["matiere"], jour, d_, f_, r.get("salle", "")))
                ok += 1
        db().commit()
        log("import CSV", f"{kind}: {ok} importés, {ignores} ignorés")
        flash(f"Import terminé : {ok} ligne(s) importée(s)" + (f", {maj_n} fiche(s) mise(s) à jour" if maj_n else "") + f", {ignores} ignorée(s).", "ok" if (ok or maj_n) else "err")
        return redirect(url_for("importer"))
    return render_template("import.html")


# ───────────────────────── 6. Compte, MFA, RGPD ─────────────────────────
@app.route("/compte", methods=["GET", "POST"])
def compte():
    nouveau = session.get("totp_pending")
    if request.method == "POST" and DEMO:
        flash("Désactivé en mode démonstration (les comptes de démo sont partagés).", "err")
        return redirect(url_for("compte"))
    if request.method == "POST":
        action = request.form.get("action")
        if action == "mdp":
            if not check_password_hash(g.user["pwd_hash"], request.form.get("actuel", "")):
                flash("Mot de passe actuel incorrect.", "err")
            elif len(request.form.get("nouveau", "")) < CFG["mdp_min"]:
                flash(f"Le nouveau mot de passe doit contenir au moins {CFG['mdp_min']} caractères.", "err")
            else:
                run("UPDATE users SET pwd_hash=?, must_change=0 WHERE id=?", (generate_password_hash(request.form["nouveau"]), g.user["id"]))
                log("mot de passe modifié")
                flash("Mot de passe modifié.", "ok")
        elif action == "mfa_init":
            session["totp_pending"] = base64.b32encode(secrets.token_bytes(10)).decode()
        elif action == "mfa_valider" and nouveau and totp_ok(nouveau, request.form.get("code")):
            run("UPDATE users SET totp_secret=? WHERE id=?", (nouveau, g.user["id"]))
            session.pop("totp_pending", None)
            log("MFA activée")
            flash("Double authentification activée.", "ok")
        elif action == "mfa_valider":
            flash("Code invalide.", "err")
        elif action == "mfa_off":
            if check_password_hash(g.user["pwd_hash"], request.form.get("actuel", "")):
                run("UPDATE users SET totp_secret=NULL WHERE id=?", (g.user["id"],))
                log("MFA désactivée")
                flash("Double authentification désactivée.", "ok")
            else:
                flash("Mot de passe incorrect.", "err")
        return redirect(url_for("compte"))
    user = one("SELECT * FROM users WHERE id=?", (g.user["id"],))
    return render_template("compte.html", u=user, nouveau=nouveau, email=g.user["email"])


@app.route("/rgpd")
def rgpd():
    return render_template("rgpd.html")


@app.route("/rgpd/export")
def rgpd_export():
    u = g.user
    data = {
        "compte": {"nom": u["nom"], "email": u["email"], "role": u["role"]},
        "messages_envoyes": [dict(r) for r in q("SELECT sujet,corps,created_at FROM messages WHERE sender_id=?", (u["id"],))],
        "messages_recus": [dict(r) for r in q("SELECT m.sujet,m.created_at,md.lu_at,md.confirme_at FROM message_dest md "
                                              "JOIN messages m ON m.id=md.message_id WHERE md.user_id=?", (u["id"],))],
        "actions": [dict(r) for r in q("SELECT action,detail,created_at FROM audit WHERE user_id=?", (u["id"],))],
        "fiches_professeur": [dict(r) for r in q("SELECT nom,prenom,matiere,email,telephone FROM professeurs WHERE user_id=?", (u["id"],))],
    }
    log("export RGPD")
    return Response(json.dumps(data, ensure_ascii=False, indent=2), mimetype="application/json",
                    headers={"Content-Disposition": "attachment; filename=mes_donnees.json"})


@app.route("/rgpd/supprimer-compte", methods=["POST"])
def rgpd_supprimer():
    if DEMO:
        flash("Désactivé en mode démonstration.", "err")
        return redirect(url_for("rgpd"))
    if not check_password_hash(g.user["pwd_hash"], request.form.get("password", "")):
        flash("Mot de passe incorrect.", "err")
        return redirect(url_for("rgpd"))
    uid = g.user["id"]
    if g.user["role"] in STAFF and one("SELECT COUNT(*) c FROM users WHERE role IN ('admin','direction','cpe') AND actif=1")["c"] <= 1:
        flash("Impossible : vous êtes le dernier compte de gestion.", "err")
        return redirect(url_for("rgpd"))
    log("compte supprimé (RGPD)", g.user["email"])
    # anonymisation : les messages envoyés sont conservés sans lien nominatif
    run("UPDATE users SET nom='Compte supprimé', email=?, actif=0, totp_secret=NULL, pwd_hash='!' WHERE id=?",
        (f"supprime-{uid}@invalide.local", uid))
    run("UPDATE professeurs SET user_id=NULL WHERE user_id=?", (uid,))
    run("UPDATE audit SET user_nom='Compte supprimé' WHERE user_id=?", (uid,))
    session.clear()
    return redirect(url_for("login"))


# ───────────────────────── Extensions du client ─────────────────────────
ext.charger_extensions(app, CFG, {"q": q, "one": one, "run": run, "log": log, "staff_only": staff_only,
                                  "exports": EXPORTS, "csrf": csrf_token})
database.init_db(ext.SCHEMAS)
DEMO = os.environ.get("VSP_DEMO") == "1"
if DEMO:
    database.demo_si_vide()


# ───────────────────────── Commandes CLI ─────────────────────────
@app.cli.command("create-admin")
def cli_create_admin():
    """Crée un établissement et un compte CPE (variables VSP_EMAIL, VSP_PASSWORD, VSP_NOM, VSP_ETAB)."""
    import click
    email, pwd = os.environ.get("VSP_EMAIL"), os.environ.get("VSP_PASSWORD")
    if not email or not pwd or len(pwd) < CFG["mdp_min"]:
        raise click.UsageError(f"Définissez VSP_EMAIL et VSP_PASSWORD ({CFG['mdp_min']} caractères minimum).")
    database.create_admin(email, pwd, os.environ.get("VSP_NOM", "CPE"), os.environ.get("VSP_ETAB", "Mon établissement"))
    click.echo("Compte créé.")


@app.cli.command("seed-demo")
def cli_seed_demo():
    """Charge des données fictives de démonstration (mot de passe : demo1234)."""
    import click
    database.seed_demo()
    click.echo("Démo prête : cpe@demo.fr / demo1234")


if __name__ == "__main__":
    app.run(debug=False, port=int(os.environ.get("PORT", 5001)))
