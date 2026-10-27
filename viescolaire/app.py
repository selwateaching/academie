"""VieScolairePro : logiciel de gestion de la vie scolaire (CPE, enseignants, direction)."""
import base64
import re
import zipfile
from xml.sax.saxutils import escape as xml_escape
import csv
import hashlib
import hmac
import io
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
    "remplacements": ["remplacements", "remplacement_action"], "cours": ["cours", "perturbation_supprimer"],
    "classes": ["classes", "classe_pp", "niveaux_ajouter", "niveau_modifier", "niveau_supprimer"], "incidents": ["incidents", "incident_action"],
    "messagerie": ["messages", "message_nouveau", "message", "message_confirmer"],
    "reunions": ["reunions", "reunion_repondre", "reunion_supprimer", "reunion_detail", "reunion_convocations_parents"],
    "documents": ["documents", "document_telecharger", "document_supprimer"],
    "taches": ["taches", "tache_action"], "rapports": ["rapports"], "assistant": ["assistant"], "import": ["importer"],
    "utilisateurs": ["utilisateurs", "utilisateur_action", "professeur_compte"], "sauvegarde": ["sauvegarde"],
    "eleves": ["eleves", "eleve_supprimer", "eleve_fiche", "eleve_modifier"],
    "redaction": ["document_nouveau", "document_genere", "document_genere_docx", "document_genere_modifier", "document_genere_supprimer",
                  "modeles_documents", "modele_edit", "modele_supprimer", "type_incident_ajouter", "type_incident_modifier", "type_incident_supprimer"],
    "planification": ["planification", "planification_parametres", "besoins", "besoin_supprimer", "besoins_depuis_edt", "voeux", "mes_voeux",
                      "generer_edt", "proposition", "proposition_appliquer", "proposition_supprimer"],
}
ENDPOINT_VERS_MODULE = {ep: m for m, eps in MODULE_DES_ENDPOINTS.items() for ep in eps}
EXPORT_VERS_MODULE = {"absences": "absences", "remplacements": "remplacements", "taches": "taches",
                      "incidents": "incidents", "professeurs": "professeurs"}


def module_actif(nom):
    return CFG["modules"].get(nom, True)
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
    return db().execute(sql, args).fetchall()


def one(sql, args=()):
    return db().execute(sql, args).fetchone()


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
    resp.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    if g.get("user"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


@app.context_processor
def contexte():
    ctx = {"STAFF": STAFF, "JOURS": JOURS, "today": date.today().isoformat(), "TYPES_PERTURBATION": TYPES_PERTURBATION,
           "cfg": CFG, "demo": DEMO, "module_actif": module_actif, "ext_nav": [], "ext_widgets": []}
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


def suggerer_remplacants(r, limite=5):
    """Professeurs libres sur le créneau, classés (même matière d'abord, puis moins sollicités)."""
    c = one("SELECT * FROM creneaux WHERE id=?", (r["creneau_id"],))
    jour = parse_date(r["date"])
    depuis = (jour - timedelta(days=30)).isoformat()
    res = []
    for p in q("SELECT * FROM professeurs WHERE etab_id=? AND id<>?", (g.etab_id, c["prof_id"])):
        if indisponible(p["id"], r["date"]):
            continue
        if any(chevauche(c["debut"], c["fin"], x["debut"], x["fin"]) for x in
               q("SELECT debut,fin FROM creneaux WHERE prof_id=? AND jour=?", (p["id"], jour.weekday()))):
            continue
        if any(chevauche(c["debut"], c["fin"], x["debut"], x["fin"]) for x in
               q("SELECT cr.debut,cr.fin FROM remplacements rp JOIN creneaux cr ON cr.id=rp.creneau_id "
                 "WHERE rp.remplacant_id=? AND rp.date=? AND rp.statut<>'annule'", (p["id"], r["date"]))):
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
        assert 0 <= jour <= 4 and f["debut"] < f["fin"] and f["classe"].strip()
    except (KeyError, ValueError, AssertionError):
        flash("Créneau invalide (jour, heures et classe requis).", "err")
        return redirect(url_for("professeur", pid=pid))
    run("INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
        (g.etab_id, pid, f["classe"].strip(), f.get("matiere") or p["matiere"], jour, f["debut"], f["fin"], f.get("salle", "").strip()))
    log("créneau ajouté", f"{p['nom']} {JOURS[jour]} {f['debut']}")
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
    return render_template("edt.html", semaine=semaine, grille=grille, lundi=lundi, **ctx)


# ───────────────────────── Absences, indisponibilités, remplacements ─────────────────────────
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
                      (g.etab_id, p["id"], typ, d1.isoformat(), d2.isoformat(), f.get("motif", "").strip(),
                       "validee" if staff else "declaree"))
            n = generer_remplacements(aid)
            log("absence enregistrée", f"{p['nom']} {d1} → {d2} ({typ})")
            ext.emit("absence.creee", absence_id=aid, prof_id=p["id"], type=typ, date_debut=d1.isoformat(),
                     date_fin=d2.isoformat(), nb_remplacements=n)
            flash(f"Enregistré. {n} cours à remplacer ou réorganiser." if n else "Enregistré.", "ok")
            return redirect(url_for("absences"))
    sql = ("SELECT a.*, p.nom, p.prenom, (SELECT COUNT(*) FROM remplacements r WHERE r.absence_id=a.id "
           "AND r.statut='a_pourvoir') restants FROM absences a JOIN professeurs p ON p.id=a.prof_id WHERE a.etab_id=?")
    args = [g.etab_id]
    if not staff:
        sql += " AND a.prof_id=?"
        args.append(g.prof["id"] if g.prof else -1)
    rows = q(sql + " ORDER BY a.date_debut DESC LIMIT 200", args)
    profs = q("SELECT id,nom,prenom FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,)) if staff else []
    return render_template("absences.html", absences=rows, profs=profs)


@app.route("/absences/<int:aid>/<action>", methods=["POST"])
@staff_only
def absence_action(aid, action):
    a = one("SELECT * FROM absences WHERE id=? AND etab_id=?", (aid, g.etab_id))
    if not a:
        abort(404)
    if action == "valider":
        run("UPDATE absences SET statut='validee' WHERE id=?", (aid,))
    elif action == "supprimer":
        run("DELETE FROM absences WHERE id=?", (aid,))
    else:
        abort(404)
    log(f"absence {action}", f"prof {a['prof_id']} {a['date_debut']}")
    return redirect(url_for("absences"))


@app.route("/remplacements")
@staff_only
def remplacements():
    statut = request.args.get("statut", "")
    sql = ("SELECT r.*, c.classe, c.matiere, c.debut, c.fin, c.salle, p.nom pnom, p.prenom pprenom, "
           "rp.nom rnom, rp.prenom rprenom FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id "
           "JOIN professeurs p ON p.id=c.prof_id LEFT JOIN professeurs rp ON rp.id=r.remplacant_id "
           "WHERE r.etab_id=? AND r.date>=?")
    args = [g.etab_id, (date.today() - timedelta(days=7)).isoformat()]
    if statut:
        sql += " AND r.statut=?"
        args.append(statut)
    rows = []
    for r in q(sql + " ORDER BY r.date, c.debut LIMIT 300", args):
        d = dict(r)
        d["suggestions"] = suggerer_remplacants(r, 4) if r["statut"] == "a_pourvoir" else []
        rows.append(d)
    return render_template("remplacements.html", rows=rows, statut=statut)


@app.route("/remplacements/<int:rid>/<action>", methods=["POST"])
@staff_only
def remplacement_action(rid, action):
    r = one("SELECT * FROM remplacements WHERE id=? AND etab_id=?", (rid, g.etab_id))
    if not r:
        abort(404)
    if action == "assigner":
        pid = request.form.get("prof_id", type=int)
        if not one("SELECT 1 FROM professeurs WHERE id=? AND etab_id=?", (pid, g.etab_id)):
            abort(400)
        run("UPDATE remplacements SET remplacant_id=?, statut='assigne' WHERE id=?", (pid, rid))
        log("remplacement assigné", f"{r['date']} créneau {r['creneau_id']} → prof {pid}")
        ext.emit("remplacement.assigne", remplacement_id=rid, remplacant_id=pid, date=r["date"])
    elif action == "annuler-cours":
        run("UPDATE remplacements SET remplacant_id=NULL, statut='annule' WHERE id=?", (rid,))
        log("cours annulé", f"{r['date']} créneau {r['creneau_id']}")
    elif action == "reouvrir":
        run("UPDATE remplacements SET remplacant_id=NULL, statut='a_pourvoir' WHERE id=?", (rid,))
    elif action == "effectue":
        run("UPDATE remplacements SET statut='effectue' WHERE id=?", (rid,))
    else:
        abort(404)
    return redirect(request.referrer or url_for("remplacements"))


# ───────────────────────── 3. Suivi des cours et coordination ─────────────────────────
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
    perts = q("SELECT pt.*, c.debut, c.fin, c.salle, p.nom pnom FROM perturbations pt LEFT JOIN creneaux c ON c.id=pt.creneau_id "
              "LEFT JOIN professeurs p ON p.id=c.prof_id WHERE pt.etab_id=? AND pt.date>=? ORDER BY pt.date, c.debut LIMIT 100",
              (g.etab_id, (date.today() - timedelta(days=3)).isoformat()))
    creneaux = q("SELECT c.id, c.classe, c.debut, c.fin, p.nom FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
                 "WHERE c.etab_id=? AND c.jour=? ORDER BY c.debut", (g.etab_id, jour.weekday() if jour.weekday() < 5 else 0))
    return render_template("cours.html", perts=perts, creneaux=creneaux, jour=jour, du_jour=cours_du_jour(jour))


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
    return render_template("classes.html", groupes=[g_ for g_ in groupes if g_[1]], equipe=equipe, profs=profs, niveaux=niveaux_)


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
        return redirect(url_for("incidents"))
    rows = q("SELECT * FROM incidents WHERE etab_id=? ORDER BY statut='clos', date DESC LIMIT 200", (g.etab_id,))
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    eleves_ = q("SELECT id, nom, prenom, classe FROM eleves WHERE etab_id=? ORDER BY classe, nom, prenom", (g.etab_id,))
    return render_template("incidents.html", incidents=rows, classes=classes_, eleves=eleves_)


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
        run("INSERT INTO documents_generes(etab_id,modele_id,type,titre,eleve_id,eleve_nom,contenu,auteur_id,auteur,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (g.etab_id, m["id"], m["titre"], titre, e["id"], nom_complet(e), remplir(m["corps"], ctx), g.user["id"], g.user["nom"],
             datetime.now().isoformat(timespec="minutes")))
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
@app.route("/eleves", methods=["GET", "POST"])
@staff_only
def eleves():
    if request.method == "POST":
        f = request.form
        if not f.get("nom", "").strip():
            flash("Le nom est obligatoire.", "err")
        else:
            run("INSERT INTO eleves(etab_id,nom,prenom,classe,responsable,contact) VALUES (?,?,?,?,?,?)",
                (g.etab_id, f["nom"].strip(), f.get("prenom", "").strip(), f.get("classe", "").strip(),
                 f.get("responsable", "").strip(), f.get("contact", "").strip()))
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
    return render_template("eleves.html", rows=rows, terme=terme, classe=classe, classes=classes_, total=total, infos=infos,
                           niveau=niveau, niveaux=q("SELECT nom FROM niveaux WHERE etab_id=? ORDER BY ordre, nom", (g.etab_id,)))


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
    return render_template("eleve.html", e=e, pp=pp, equipe=equipe_liste, incidents=incidents_, documents=documents_, reunions=reunions_)


@app.route("/eleves/<int:eid>/modifier", methods=["POST"])
@staff_only
def eleve_modifier(eid):
    f = request.form
    if f.get("nom", "").strip() and one("SELECT 1 FROM eleves WHERE id=? AND etab_id=?", (eid, g.etab_id)):
        run("UPDATE eleves SET nom=?, prenom=?, classe=?, responsable=?, contact=? WHERE id=?",
            (f["nom"].strip(), f.get("prenom", "").strip(), f.get("classe", "").strip(), f.get("responsable", "").strip(), f.get("contact", "").strip(), eid))
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


def fabriquer_docx(titre, contenu, etablissement):
    """Document Word minimal (.docx) : en-tête, titre centré, puis le texte ligne par ligne."""
    def para(texte, gras=False, centre=False, taille=None):
        ppr = "<w:pPr><w:jc w:val=\"center\"/></w:pPr>" if centre else ""
        rpr = ("<w:rPr>" + ("<w:b/>" if gras else "") + (f"<w:sz w:val=\"{taille}\"/>" if taille else "") + "</w:rPr>") if (gras or taille) else ""
        return f"<w:p>{ppr}<w:r>{rpr}<w:t xml:space=\"preserve\">{xml_escape(texte)}</w:t></w:r></w:p>"
    corps = [para(etablissement, gras=True), para(""), para(titre, gras=True, centre=True, taille=32), para("")]
    corps += [para(l) for l in contenu.replace("\r\n", "\n").split("\n")]
    xml = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
           + "".join(corps) + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" '
           'w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>')
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr("word/document.xml", xml)
    return buf.getvalue()


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
        if staff and f.get("creer_incident") and eleve and modele["avec_incident"]:
            incident_id = run("INSERT INTO incidents(etab_id,date,classe,eleve,description,suite,eleve_id) VALUES (?,?,?,?,?,?,?)",
                              (g.etab_id, parse_date(f.get("date")).isoformat(), eleve["classe"], ctx["eleve"],
                               (ctx["type_incident"] + " — " if ctx["type_incident"] else "") + ctx["description"], ctx["suite"], eleve["id"]))
        did = run("INSERT INTO documents_generes(etab_id,modele_id,type,titre,eleve_id,eleve_nom,prof_id,contenu,auteur_id,auteur,created_at,incident_id) "
                  "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                  (g.etab_id, modele["id"], modele["titre"], titre, eleve["id"] if eleve else None, ctx["eleve"], f.get("prof_id", type=int),
                   contenu, g.user["id"], g.user["nom"], datetime.now().isoformat(timespec="minutes"), incident_id))
        log("document rédigé", f"{modele['titre']} — {ctx['eleve']}")
        ext.emit("document.genere", document_id=did, modele=modele["titre"], eleve_id=eleve["id"] if eleve else None, auteur=g.user["nom"])
        flash("Document enregistré." + (" Un incident a aussi été créé." if incident_id else ""), "ok")
        return redirect(url_for("document_genere", did=did))
    return render_template("document_nouveau.html", donnees=donnees, staff=staff, aucun_eleve=not donnees["eleves"],
                           eleve_initial=request.args.get("eleve", type=int) or "")


def get_document(did):
    d = one("SELECT * FROM documents_generes WHERE id=? AND etab_id=?", (did, g.etab_id))
    if not d or (g.user["role"] not in STAFF and d["auteur_id"] != g.user["id"]):
        abort(404)
    return d


@app.route("/documents/generes/<int:did>")
def document_genere(did):
    return render_template("document_genere.html", d=get_document(did))


@app.route("/documents/generes/<int:did>.docx")
def document_genere_docx(did):
    d = get_document(did)
    nom = re.sub(r"[^\w-]+", "_", d["titre"]).strip("_")[:60] or "document"
    log("document exporté (Word)", d["titre"])
    return Response(fabriquer_docx(d["titre"], d["contenu"], g.etab["nom"]),
                    mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    headers={"Content-Disposition": f"attachment; filename={nom}.docx"})


@app.route("/documents/generes/<int:did>/modifier", methods=["POST"])
def document_genere_modifier(did):
    d = get_document(did)
    if not request.form.get("contenu", "").strip():
        flash("Le document ne peut pas être vide.", "err")
    else:
        run("UPDATE documents_generes SET titre=?, contenu=? WHERE id=?",
            (request.form.get("titre", "").strip()[:200] or d["titre"], request.form["contenu"].strip(), did))
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


# ───────────────────────── Gestion des comptes utilisateurs ─────────────────────────
ROLES = {"enseignant": "Enseignant", "cpe": "CPE", "direction": "Direction", "admin": "Administrateur"}


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


@app.route("/planification/generer", methods=["POST"])
@staff_only
def generer_edt():
    grille, profs, besoins_ = charger_planification()
    if not besoins_:
        flash("Aucun besoin saisi : ajoutez d'abord les classes, matières, professeurs et volumes horaires.", "err")
        return redirect(url_for("planification"))
    opt, temps = reglages_planning(), temps_depuis_formulaire(request.form)
    erreurs = [m for k, m in planning.diagnostic(grille, besoins_, profs, opt) if k == "err"]
    if erreurs and not request.form.get("forcer"):
        flash("Génération impossible en l'état : " + " ".join(erreurs[:3]), "err")
        return redirect(url_for("planification"))
    res = planning.generer(grille, besoins_, {k: v for k, v in profs.items()}, opt, temps_max=temps)
    pid = run("INSERT INTO propositions(etab_id,created_at,auteur,options,resultat) VALUES (?,?,?,?,?)",
              (g.etab_id, datetime.now().isoformat(timespec="minutes"), g.user["nom"],
               json.dumps({"classe_fermee": sorted(f"{j}:{d}" for j, d in opt["classe_fermee"]), "max_classe_jour": opt["max_classe_jour"],
                           "grille": opt["grille"] or planning.GRILLE_PAR_DEFAUT}),
               json.dumps(res)))
    log("emploi du temps généré", f"{res['stats']['placees']}/{res['stats']['seances']} séances")
    return redirect(url_for("proposition", pid=pid))


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
            cases[(x["jour"], x["debut_idx"] + k)] = texte + (f" ({x['salle']})" if x["salle"] else "")
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
        ok, ignores = 0, 0
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
                db().execute("INSERT INTO eleves(etab_id,nom,prenom,classe,responsable,contact) VALUES (?,?,?,?,?,?)",
                             (g.etab_id, r["nom"], r.get("prenom", ""), r.get("classe", ""), r.get("responsable", ""), r.get("contact", "")))
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
                if not p or jour < 0 or not r.get("classe") or not r.get("debut") or not r.get("fin") or r["debut"] >= r["fin"]:
                    ignores += 1
                    continue
                db().execute("INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
                             (g.etab_id, p["id"], r["classe"], r.get("matiere") or p["matiere"], jour, r["debut"], r["fin"], r.get("salle", "")))
                ok += 1
        db().commit()
        log("import CSV", f"{kind}: {ok} importés, {ignores} ignorés")
        flash(f"Import terminé : {ok} ligne(s) importée(s), {ignores} ignorée(s).", "ok" if ok else "err")
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
