"""VieScolairePro : logiciel de gestion de la vie scolaire (CPE, enseignants, direction)."""
import base64
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
    "classes": ["classes", "classe_pp"], "incidents": ["incidents", "incident_action"],
    "messagerie": ["messages", "message_nouveau", "message", "message_confirmer"],
    "reunions": ["reunions", "reunion_repondre", "reunion_supprimer"],
    "documents": ["documents", "document_telecharger", "document_supprimer"],
    "taches": ["taches", "tache_action"], "rapports": ["rapports"], "assistant": ["assistant"], "import": ["importer"],
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
    if request.endpoint in ("static", "client_static", "login", "mfa", "manifest", "logout") or request.endpoint is None:
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
           "cfg": CFG, "module_actif": module_actif, "ext_nav": [], "ext_widgets": []}
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


@app.route("/client-static/<path:chemin>")
def client_static(chemin):
    if not CFG["static_dir"]:
        abort(404)
    return send_from_directory(CFG["static_dir"], chemin)


@app.route("/manifest.webmanifest")
def manifest():
    return Response(json.dumps({
        "name": CFG["produit"], "short_name": CFG["produit"][:12], "start_url": "/", "display": "standalone",
        "background_color": "#f4f6fb", "theme_color": CFG["couleur"], "lang": "fr",
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


def generer_remplacements(absence_id):
    a = one("SELECT * FROM absences WHERE id=?", (absence_id,))
    if not a or a["type"] != "absence":
        return 0
    n = 0
    d1, d2 = parse_date(a["date_debut"]), parse_date(a["date_fin"])
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
                run("INSERT INTO classes(etab_id,nom,niveau,prof_principal_id) VALUES (?,?,?,?)",
                    (g.etab_id, nom, f.get("niveau", "").strip(), pp))
                log("classe créée", nom)
        return redirect(url_for("classes"))
    rows = q("SELECT c.*, p.nom pnom, p.prenom pprenom FROM classes c LEFT JOIN professeurs p ON p.id=c.prof_principal_id "
             "WHERE c.etab_id=? ORDER BY c.nom", (g.etab_id,))
    equipe = {}
    for r in q("SELECT DISTINCT c.classe, p.id, p.nom, p.prenom, p.matiere FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
               "WHERE c.etab_id=? ORDER BY p.nom", (g.etab_id,)):
        equipe.setdefault(r["classe"], []).append(r)
    profs = q("SELECT id,nom,prenom FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    return render_template("classes.html", classes=rows, equipe=equipe, profs=profs)


@app.route("/classes/<int:cid>/prof-principal", methods=["POST"])
@staff_only
def classe_pp(cid):
    pp = request.form.get("prof_principal_id", type=int)
    if pp and not one("SELECT 1 FROM professeurs WHERE id=? AND etab_id=?", (pp, g.etab_id)):
        abort(400)
    run("UPDATE classes SET prof_principal_id=? WHERE id=? AND etab_id=?", (pp or None, cid, g.etab_id))
    log("professeur principal modifié", f"classe {cid}")
    return redirect(url_for("classes"))


@app.route("/incidents", methods=["GET", "POST"])
@staff_only
def incidents():
    if request.method == "POST":
        f = request.form
        if f.get("description", "").strip():
            iid = run("INSERT INTO incidents(etab_id,date,classe,eleve,description,suite) VALUES (?,?,?,?,?,?)",
                (g.etab_id, parse_date(f.get("date")).isoformat(), f.get("classe", "").strip(), f.get("eleve", "").strip(),
                 f["description"].strip(), f.get("suite", "").strip()))
            log("incident enregistré", f.get("classe", ""))
            ext.emit("incident.cree", incident_id=iid, classe=f.get("classe", ""), description=f["description"].strip())
        return redirect(url_for("incidents"))
    rows = q("SELECT * FROM incidents WHERE etab_id=? ORDER BY statut='clos', date DESC LIMIT 200", (g.etab_id,))
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    return render_template("incidents.html", incidents=rows, classes=classes_)


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
    elif cible_type == "niveau":
        sql = ("SELECT DISTINCT p.user_id id FROM creneaux c JOIN professeurs p ON p.id=c.prof_id "
               "WHERE c.etab_id=? AND c.classe LIKE ? AND p.user_id IS NOT NULL")
        args = (g.etab_id, f"{cible}%")
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
        if typ not in ("individuel", "classe", "niveau", "tous") or (typ != "individuel" and not staff):
            abort(403)
        cible = {"individuel": f.get("cible", ""), "classe": f.get("cible_classe", ""),
                 "niveau": f.get("cible_niveau", ""), "tous": ""}[typ]
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
    niveaux = sorted({c["nom"][:1] for c in classes_ if c["nom"]})
    return render_template("message_nouveau.html", users=users, classes=classes_, niveaux=niveaux,
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
            db().commit()
            log("réunion créée", f"{f['titre']} ({len(ids & valides)} convoqués)")
            convoques = list(ids & valides)
            ext.emit("reunion.creee", reunion_id=rid, titre=f["titre"].strip(), date=parse_date(f.get("date")).isoformat(),
                     heure=f.get("heure", ""), lieu=f.get("lieu", "").strip(),
                     emails=[r["email"] for r in q("SELECT email FROM professeurs WHERE email<>'' AND id IN (%s)"
                                                   % ",".join("?" * len(convoques)), convoques)] if convoques else [])
            flash(f"Réunion créée, {len(ids & valides)} convocation(s).", "ok")
            return redirect(url_for("reunions"))
    if g.user["role"] in STAFF:
        rows = q("SELECT r.*, (SELECT COUNT(*) FROM reunion_convoques WHERE reunion_id=r.id) nb, "
                 "(SELECT COUNT(*) FROM reunion_convoques WHERE reunion_id=r.id AND reponse='oui') oui, "
                 "(SELECT COUNT(*) FROM reunion_convoques WHERE reunion_id=r.id AND reponse='non') non "
                 "FROM reunions r WHERE r.etab_id=? ORDER BY r.date DESC, r.heure LIMIT 100", (g.etab_id,))
    else:
        rows = q("SELECT r.*, rc.reponse FROM reunions r JOIN reunion_convoques rc ON rc.reunion_id=r.id "
                 "WHERE r.etab_id=? AND rc.prof_id=? ORDER BY r.date DESC", (g.etab_id, g.prof["id"] if g.prof else -1))
    profs = q("SELECT id,nom,prenom FROM professeurs WHERE etab_id=? ORDER BY nom", (g.etab_id,)) if g.user["role"] in STAFF else []
    classes_ = q("SELECT nom FROM classes WHERE etab_id=? ORDER BY nom", (g.etab_id,))
    return render_template("reunions.html", rows=rows, profs=profs, classes=classes_)


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
    return render_template("documents.html", docs=rows)


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
        if not fichier or kind not in ("professeurs", "creneaux"):
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
    if request.method == "POST":
        action = request.form.get("action")
        if action == "mdp":
            if not check_password_hash(g.user["pwd_hash"], request.form.get("actuel", "")):
                flash("Mot de passe actuel incorrect.", "err")
            elif len(request.form.get("nouveau", "")) < CFG["mdp_min"]:
                flash(f"Le nouveau mot de passe doit contenir au moins {CFG['mdp_min']} caractères.", "err")
            else:
                run("UPDATE users SET pwd_hash=? WHERE id=?", (generate_password_hash(request.form["nouveau"]), g.user["id"]))
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
    with app.test_request_context():
        g.db = database.connect()
        for a in g.db.execute("SELECT id FROM absences").fetchall():
            generer_remplacements(a["id"])
    click.echo("Démo prête : cpe@demo.fr / demo1234")


if __name__ == "__main__":
    app.run(debug=False, port=int(os.environ.get("PORT", 5001)))
