"""Séquences — créateur de séquences de leçons avec Claude.

Étapes côté page : sujet → réglages → plan modifiable → génération leçon par leçon.
La clé API reste sur le serveur.

Variables d'environnement :
  ANTHROPIC_API_KEY  clé API Anthropic (obligatoire pour générer)
  SEQ_ACCESS_CODE    facultatif : code demandé avant de générer
  SEQ_MODEL          facultatif : modèle Claude (défaut claude-sonnet-5-5)
  SEQ_PER_HOUR       facultatif : appels IA max par heure et par IP (défaut 60)
  PAYMENT_MODE       demo (défaut : passer à Pro/Max sans payer, pour tester) | off (abonnements fermés)
  DATABASE_URL       facultatif : base PostgreSQL (comptes, plans, séquences). Sans elle : fichier JSON, effacé à chaque redémarrage sur Render gratuit
  SEQ_DATA_FILE      facultatif : fichier JSON utilisé sans DATABASE_URL (défaut data.json)
  SEQ_ADMIN_CODE     facultatif : code pour lire les messages du formulaire « Écoles » (/api/contact?code=…)
"""

import hashlib
import hmac
import json
import os
import re
import secrets
import tempfile
import threading
import time
from collections import defaultdict, deque
import xml.etree.ElementTree as ET

import anthropic
from werkzeug.security import check_password_hash, generate_password_hash
from flask import Flask, Response, g, jsonify, request, send_from_directory

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
MODEL = os.environ.get("SEQ_MODEL", "claude-sonnet-5-5")
ACCESS_CODE = os.environ.get("SEQ_ACCESS_CODE", "").strip()
PER_HOUR = int(os.environ.get("SEQ_PER_HOUR", "60"))
PAYMENT_MODE = os.environ.get("PAYMENT_MODE", "demo").strip().lower()
ADMIN_CODE = os.environ.get("SEQ_ADMIN_CODE", "").strip()
DATA_FILE = os.environ.get("SEQ_DATA_FILE", os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json"))

DAY = 86400
# Plans : ressources = leçons générées. Gratuit : par semaine glissante ; payants : par mois glissant.
PLANS = {
    "free": {"limit": 5, "days": 7, "series": 5, "slides": 12, "curriculum": False, "youtube": False,
             "no_badge": False, "custom_themes": False},
    "pro": {"limit": 200, "days": 30, "series": 12, "slides": 25, "curriculum": True, "youtube": True,
            "no_badge": True, "custom_themes": False},
    "max": {"limit": 400, "days": 30, "series": 25, "slides": 35, "curriculum": True, "youtube": True,
            "no_badge": True, "custom_themes": True},
}
PRICES = {  # € par mois
    "pro": {"monthly": 9.99, "annual": 6.65},
    "max": {"monthly": 18.99, "annual": 12.49},
}

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024

SYSTEM = (
    "Tu es un concepteur pédagogique expert. Tu écris en français clair (ou dans la langue demandée), "
    "adapté à l'âge des élèves, avec des contenus exacts et concrets. "
    "Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour."
)

FRAMEWORKS = {
    "standard": "modélisation explicite, pratique guidée, vérifications régulières de la compréhension",
    "jfn": "Je fais / Nous faisons / Tu fais",
    "5e": "5E : Engager, Explorer, Expliquer, Élaborer, Évaluer",
    "rosenshine": "principes de Rosenshine : révision, petites étapes, questions, modèles, pratique guidée",
    "imr": "Introduction / Activité principale / Bilan",
}

_log = defaultdict(deque)
_lock = threading.Lock()
_client = None


def error(code, message, status):
    return jsonify({"code": code, "error": message}), status


def client_ip():
    fwd = request.headers.get("X-Forwarded-For", "")
    return fwd.split(",")[0].strip() if fwd else (request.remote_addr or "?")


def rate_ok(ip):
    now = time.time()
    with _lock:
        q = _log[ip]
        while q and now - q[0] > 3600:
            q.popleft()
        if len(q) >= PER_HOUR:
            return False
        q.append(now)
        return True


def parse_json(text):
    text = text.strip()
    candidates = [text]
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fence:
        candidates.append(fence.group(1).strip())
    a, b = text.find("{"), text.rfind("}")
    if a != -1 and b > a:
        candidates.append(text[a:b + 1])
    for c in candidates:
        try:
            return json.loads(c)
        except ValueError:
            continue
    return None


def s(value, limit):
    return str(value or "").strip()[:limit]


def ask(prompt, max_tokens):
    """Appelle Claude et renvoie (dict, None) ou (None, réponse d'erreur)."""
    global _client
    if ACCESS_CODE and not hmac.compare_digest(
        request.headers.get("X-Seq-Code", "").encode(), ACCESS_CODE.encode()
    ):
        return None, error("access", "Code d'accès requis.", 401)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None, error("no_key", "ANTHROPIC_API_KEY n'est pas configurée sur le serveur.", 503)
    if not rate_ok(client_ip()):
        return None, error("rate_limited", "Trop de générations. Réessayez plus tard.", 429)
    if _client is None:
        _client = anthropic.Anthropic(timeout=600.0)
    try:
        with _client.messages.stream(
            model=MODEL, max_tokens=max_tokens, system=SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            msg = stream.get_final_message()
    except anthropic.AuthenticationError:
        return None, error("no_key", "Clé API invalide.", 503)
    except anthropic.RateLimitError:
        return None, error("rate_limited", "Limite de l'API Anthropic atteinte.", 429)
    except anthropic.APIStatusError as e:
        app.logger.warning("API %s: %s", e.status_code, e.message)
        return None, error("upstream_error", "Erreur du service Claude.", 502)
    except anthropic.APIConnectionError:
        return None, error("upstream_error", "Connexion à Claude impossible.", 502)
    if msg.stop_reason == "refusal":
        return None, error("refused", "Claude a refusé cette demande.", 422)
    data = parse_json("".join(b.text for b in msg.content if b.type == "text"))
    if not isinstance(data, dict):
        return None, error("invalid_json", "Réponse illisible, réessayez.", 422)
    return data, None


def brief(b):
    """Résumé de la demande, commun au plan et aux leçons."""
    lines = [
        f"Sujet de la séquence : {s(b.get('topic'), 300)}",
        f"Niveau : {s(b.get('level'), 80)}",
        f"Langue des contenus : {s(b.get('language'), 40) or 'français'}",
    ]
    if b.get("curriculum") and getattr(g, "ukey", None) and plan_of(g.ukey)[1]["curriculum"]:
        lines.append(f"Alignement sur le programme scolaire : {s(b['curriculum'], 200)}. "
                     "Rattache chaque leçon aux attendus de ce programme et à son vocabulaire.")
    if b.get("instructions"):
        lines.append(f"Consignes de l'enseignant : {s(b['instructions'], 3000)}")
    return "\n".join(lines)


# ---------------------------------------------------------------- stockage (fichier JSON ou PostgreSQL)
# Tout est gardé en mémoire (un seul processus) et écrit à chaque modification :
#   - dans DATABASE_URL (PostgreSQL) si elle est définie, sinon dans un fichier JSON (effacé à chaque
#     redémarrage sur l'offre gratuite de Render : utilisez une base pour garder les comptes).

NS = ("users", "acct", "sess", "series", "contacts")
DB = {ns: {} for ns in NS}
_ulock = threading.RLock()
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
_pg = None


def pg_conn():
    return _pg.connect(DATABASE_URL)


def load_store():
    global _pg
    if DATABASE_URL:
        try:
            import psycopg2 as _pg_mod
            _pg = _pg_mod
            with pg_conn() as c, c.cursor() as cur:
                cur.execute("CREATE TABLE IF NOT EXISTS kv (ns text, k text, v jsonb, PRIMARY KEY (ns, k))")
                cur.execute("SELECT ns, k, v FROM kv")
                for ns, k, v in cur.fetchall():
                    DB.setdefault(ns, {})[k] = v
            return
        except Exception as e:  # base injoignable : on retombe sur le fichier plutôt que de planter
            _pg = None
            app.logger.error("PostgreSQL indisponible (%s), stockage dans un fichier.", e)
    try:
        with open(DATA_FILE, encoding="utf-8") as f:
            saved = json.load(f)
    except (OSError, ValueError):
        return
    for ns in NS:
        if isinstance(saved.get(ns), dict):
            DB[ns].update(saved[ns])
    if isinstance(saved.get("contacts"), list):  # ancien format
        DB["contacts"] = {f"{i:08d}": c for i, c in enumerate(saved["contacts"])}
    DB["users"] = {(k if ":" in k else "dev:" + k): v for k, v in DB["users"].items()}


def persist(ns, key, value=None, delete=False):
    """Appelé avec _ulock tenu après chaque modification."""
    if delete:
        DB[ns].pop(key, None)
    else:
        DB[ns][key] = value
    try:
        if _pg:
            with pg_conn() as c, c.cursor() as cur:
                if delete:
                    cur.execute("DELETE FROM kv WHERE ns=%s AND k=%s", (ns, key))
                else:
                    cur.execute("INSERT INTO kv VALUES (%s,%s,%s) ON CONFLICT (ns,k) DO UPDATE SET v=EXCLUDED.v",
                                (ns, key, json.dumps(value)))
        else:
            fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(DATA_FILE)), suffix=".tmp")
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(DB, f, ensure_ascii=False)
            os.replace(tmp, DATA_FILE)
    except Exception as e:
        app.logger.warning("Sauvegarde impossible : %s", e)


# ---------------------------------------------------------------- comptes, sessions, plans, quotas
# Sans compte : le navigateur a un identifiant aléatoire (en-tête X-Seq-Device) et le serveur retient
# son plan et ses générations. Avec un compte (e-mail + mot de passe) : jeton de session (Authorization:
# Bearer), plan et séquences rattachés au compte, accessibles depuis tous les appareils.

DEVICE = re.compile(r"^[A-Za-z0-9-]{16,64}$")
EMAIL = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,200}\.[^@\s]{2,}$")
SERIES_ID = re.compile(r"^[A-Za-z0-9_-]{4,40}$")
SESSION_DAYS = 90
MAX_SERIES = 50
MAX_SERIES_BYTES = 2_000_000
_DUMMY_HASH = generate_password_hash("not-a-real-password")


def new_rec():
    return {"plan": "free", "billing": "monthly", "until": 0, "cancelled": False, "usage": []}


def user_rec(ukey):
    return DB["users"].setdefault(ukey, new_rec())


def effective_plan(u, now):
    return u["plan"] if u["plan"] in PLANS and u["plan"] != "free" and u["until"] > now else "free"


def usage_info(u, now):
    plan = effective_plan(u, now)
    cfg = PLANS[plan]
    window = cfg["days"] * DAY
    u["usage"] = [x for x in u["usage"] if now - x < window]
    used = len(u["usage"])
    resets = (min(u["usage"]) + window) if u["usage"] else None
    return plan, cfg, used, resets


def plan_of(ukey):
    with _ulock:
        plan = effective_plan(user_rec(ukey), time.time())
    return plan, PLANS[plan]


def plan_json(ukey):
    now = time.time()
    with _ulock:
        u = user_rec(ukey)
        plan, cfg, used, resets = usage_info(u, now)
        return {
            "plan": plan, "billing": u["billing"], "until": u["until"] if plan != "free" else 0,
            "cancelled": u["cancelled"] and plan != "free", "used": used, "limit": cfg["limit"],
            "days": cfg["days"], "resets": resets,
            "caps": {k: cfg[k] for k in ("series", "slides", "curriculum", "youtube", "no_badge", "custom_themes")},
            "payment": PAYMENT_MODE, "prices": PRICES,
        }


def sha(x):
    return hashlib.sha256(x.encode()).hexdigest()


def session_email(token):
    with _ulock:
        sess = DB["sess"].get(sha(token))
        if sess and sess["exp"] > time.time():
            return sess["email"]
    return None


def open_session(email):
    token = secrets.token_urlsafe(32)
    with _ulock:
        now = time.time()
        for k in [k for k, v in DB["sess"].items() if v["exp"] < now][:50]:
            persist("sess", k, delete=True)
        persist("sess", sha(token), {"email": email, "exp": now + SESSION_DAYS * DAY})
    return token


PUBLIC_API = {"/api/outline", "/api/lesson", "/api/slide", "/api/plan", "/api/plan/subscribe", "/api/plan/cancel"}


@app.before_request
def identify():
    path = request.path
    if not (path in PUBLIC_API or path.startswith(("/api/auth/", "/api/series", "/api/me"))):
        return None
    auth = request.headers.get("Authorization", "")
    g.acct = session_email(auth[7:]) if auth.startswith("Bearer ") else None
    dev = request.headers.get("X-Seq-Device", "")
    g.dev = dev if DEVICE.match(dev) else None
    if g.acct:
        g.ukey = "acct:" + g.acct
    elif g.dev:
        g.ukey = "dev:" + g.dev
    elif path in PUBLIC_API:
        return error("device", "Identifiant du navigateur manquant. Rechargez la page.", 400)
    else:
        g.ukey = None
    if path.startswith(("/api/series", "/api/me")) and not g.acct:
        return error("auth", "Connexion requise.", 401)
    return None


def account_json(email):
    a = DB["acct"][email]
    return {"email": email, "name": a.get("name", "")}


@app.post("/api/auth/register")
def register():
    b = request.get_json(silent=True) or {}
    email, pw = s(b.get("email"), 254).lower(), str(b.get("password") or "")
    if not EMAIL.match(email):
        return error("invalid_request", "Adresse e-mail invalide.", 400)
    if not 8 <= len(pw) <= 200:
        return error("invalid_request", "Le mot de passe doit faire au moins 8 caractères.", 400)
    if not rate_ok("auth:" + client_ip()):
        return error("rate_limited", "Trop de tentatives. Réessayez plus tard.", 429)
    with _ulock:
        if email in DB["acct"]:
            return error("exists", "Un compte existe déjà avec cette adresse. Connectez-vous.", 409)
        persist("acct", email, {"hash": generate_password_hash(pw), "name": s(b.get("name"), 80), "created": int(time.time())})
        old = DB["users"].get("dev:" + g.dev) if g.dev else None  # le plan et l'usage du navigateur suivent le compte
        persist("users", "acct:" + email, json.loads(json.dumps(old)) if old else new_rec())
    return jsonify({"token": open_session(email), "account": account_json(email)})


@app.post("/api/auth/login")
def login():
    b = request.get_json(silent=True) or {}
    email, pw = s(b.get("email"), 254).lower(), str(b.get("password") or "")[:200]
    if not rate_ok("login:" + client_ip()):
        return error("rate_limited", "Trop de tentatives. Réessayez plus tard.", 429)
    a = DB["acct"].get(email)
    ok = check_password_hash(a["hash"] if a else _DUMMY_HASH, pw)
    if not (a and ok):
        return error("auth", "E-mail ou mot de passe incorrect.", 401)
    return jsonify({"token": open_session(email), "account": account_json(email)})


@app.post("/api/auth/logout")
def logout():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        with _ulock:
            persist("sess", sha(auth[7:]), delete=True)
    return jsonify({"ok": True})


@app.get("/api/me")
def me():
    return jsonify(account_json(g.acct))


@app.get("/api/series")
def series_list():
    pre = g.acct + "|"
    with _ulock:
        return jsonify([v for k, v in DB["series"].items() if k.startswith(pre)])


@app.put("/api/series/<sid>")
def series_put(sid):
    if not SERIES_ID.match(sid):
        return error("invalid_request", "Identifiant invalide.", 400)
    raw = request.get_data()
    if len(raw) > MAX_SERIES_BYTES:
        return error("too_large", "Séquence trop volumineuse.", 413)
    doc = request.get_json(silent=True)
    if not isinstance(doc, dict) or doc.get("id") != sid:
        return error("invalid_request", "Document invalide.", 400)
    key = f"{g.acct}|{sid}"
    with _ulock:
        if key not in DB["series"] and sum(1 for k in DB["series"] if k.startswith(g.acct + "|")) >= MAX_SERIES:
            return error("quota", f"Limite de {MAX_SERIES} séquences atteinte.", 409)
        persist("series", key, doc)
    return jsonify({"ok": True})


@app.delete("/api/series/<sid>")
def series_delete(sid):
    with _ulock:
        persist("series", f"{g.acct}|{sid}", delete=True)
    return jsonify({"ok": True})


@app.get("/api/plan")
def get_plan():
    return jsonify(plan_json(g.ukey))


@app.post("/api/plan/subscribe")
def subscribe():
    if PAYMENT_MODE != "demo":
        return error("payment_off", "Les abonnements ne sont pas encore ouverts. Écrivez-nous depuis la page Tarifs.", 503)
    if not g.acct:
        return error("auth", "Créez un compte ou connectez-vous pour activer un plan.", 401)
    b = request.get_json(silent=True) or {}
    plan, billing = b.get("plan"), b.get("billing")
    if plan not in ("pro", "max") or billing not in ("monthly", "annual"):
        return error("invalid_request", "Plan invalide.", 400)
    with _ulock:
        u = user_rec(g.ukey)
        u.update(plan=plan, billing=billing, cancelled=False,
                 until=time.time() + (365 if billing == "annual" else 30) * DAY)
        persist("users", g.ukey, u)
    return jsonify(plan_json(g.ukey))


@app.post("/api/plan/cancel")
def cancel():
    with _ulock:
        u = user_rec(g.ukey)
        u["cancelled"] = True  # le plan reste actif jusqu'à la fin de la période, sans renouvellement
        persist("users", g.ukey, u)
    return jsonify(plan_json(g.ukey))


@app.post("/api/contact")
def contact():
    b = request.get_json(silent=True) or {}
    msg = {k: s(b.get(k), 2000 if k == "message" else 200)
           for k in ("name", "email", "school", "role", "licenses", "message")}
    if not msg["name"] or not EMAIL.match(msg["email"]) or not msg["school"]:
        return error("invalid_request", "Nom, e-mail valide et établissement requis.", 400)
    if not rate_ok("contact:" + client_ip()):
        return error("rate_limited", "Trop de demandes. Réessayez plus tard.", 429)
    msg["at"] = int(time.time())
    with _ulock:
        persist("contacts", f"{msg['at']}-{secrets.token_hex(3)}", msg)
    app.logger.info("Demande école : %s", json.dumps(msg, ensure_ascii=False))
    return jsonify({"ok": True})


@app.get("/api/contact")
def list_contacts():
    if not ADMIN_CODE or not hmac.compare_digest(request.args.get("code", "").encode(), ADMIN_CODE.encode()):
        return error("access", "Code administrateur requis.", 401)
    return jsonify(sorted(DB["contacts"].values(), key=lambda m: m.get("at", 0)))


# ---------------------------------------------------------------- nettoyage des diapositives

LAYOUTS = {"title", "text_image", "list", "timeline", "steps", "quote", "vocab", "activity", "video"}
YT = re.compile(r"(?:youtu\.be/|youtube(?:-nocookie)?\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/))([A-Za-z0-9_-]{11})")
SVG_TAGS = {"svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon",
            "text", "tspan", "defs", "lineargradient", "radialgradient", "stop"}
SVG_ATTRS = {"viewbox", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width",
             "height", "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
             "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "transform", "offset",
             "stop-color", "stop-opacity", "id", "font-size", "font-weight", "text-anchor",
             "font-family", "fx", "fy", "gradientunits", "dominant-baseline"}
SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)


def clean_svg(raw):
    """N'accepte qu'un SVG simple : liste blanche de balises et d'attributs, rien d'externe."""
    raw = str(raw or "").strip()
    if not raw.lower().startswith("<svg") or len(raw) > 9000 or "<!" in raw or "url(" in raw.lower().replace("url(#", ""):
        return ""
    if "xmlns" not in raw[:200]:
        raw = raw.replace("<svg", f'<svg xmlns="{SVG_NS}"', 1)
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return ""

    def walk(el):
        el.tag = el.tag.split("}")[-1]
        if el.tag.lower() not in SVG_TAGS:
            return False
        for k in list(el.attrib):
            if k.split("}")[-1].lower() not in SVG_ATTRS or "javascript" in el.attrib[k].lower():
                del el.attrib[k]
        el.tail = None
        for child in list(el):
            if not walk(child):
                el.remove(child)
        return True

    if not walk(root) or root.tag.lower() != "svg":
        return ""
    root.attrib.pop("width", None)
    root.attrib.pop("height", None)
    if "viewBox" not in root.attrib and "viewbox" not in root.attrib:
        root.set("viewBox", "0 0 400 300")
    return ET.tostring(root, encoding="unicode")


def clean_slide(x):
    if not isinstance(x, dict):
        return None
    layout = x.get("layout") if x.get("layout") in LAYOUTS else "text_image"
    out = {
        "layout": layout,
        "title": s(x.get("title"), 160),
        "bullets": [s(t, 400) for t in x.get("bullets") or [] if t][:8],
        "items": [{"t": s(i.get("t"), 140), "x": s(i.get("x"), 300)}
                  for i in x.get("items") or [] if isinstance(i, dict) and (i.get("t") or i.get("x"))][:6],
        "quote": s(x.get("quote"), 500),
        "author": s(x.get("author"), 120),
        "emoji": s(x.get("emoji"), 8),
        "svg": clean_svg(x.get("svg")) if x.get("svg") else "",
        "notes": s(x.get("notes"), 1500),
    }
    if layout == "video":
        m = YT.search(str(x.get("url") or ""))
        out["url"] = f"https://www.youtube.com/watch?v={m.group(1)}" if m else ""
    if layout == "vocab":
        out["vocab"] = [{"term": s(v.get("term"), 80), "definition": s(v.get("definition"), 300)}
                        for v in x.get("vocab") or [] if isinstance(v, dict) and v.get("term")][:8]
    if layout == "activity":
        q = x.get("q") if isinstance(x.get("q"), dict) else {}
        ch = [s(c, 200) for c in q.get("choices") or []][:6]
        ans = q.get("answer")
        out["q"] = {"q": s(q.get("q"), 400), "choices": ch,
                    "answer": ans if isinstance(ans, int) and 0 <= ans < len(ch) else 0,
                    "why": s(q.get("why"), 500)}
    return out


SLIDE_FORMAT = (
    '{"layout": "text_image | list | timeline | steps | quote", "title": "...", '
    '"bullets": ["3 à 4 phrases courtes"] (text_image), "items": [{"t": "titre court", "x": "une phrase"}] (list, timeline, steps : 3 à 5), '
    '"quote": "..." et "author": "..." (quote), "emoji": "un emoji", "svg": "illustration SVG" (facultatif, text_image seulement), '
    '"notes": "notes pour l\'enseignant : points clés, erreurs fréquentes, réponses"}'
)
SVG_RULES = (
    "Illustration \"svg\" : un schéma ou dessin plat et simple qui explique la diapositive, "
    'commençant par <svg viewBox="0 0 400 300">, formes basiques (rect, circle, path, line, polygon, text), '
    "3 à 5 couleurs, 1800 caractères maximum, aucun script ni image externe, textes très courts."
)


@app.post("/api/outline")
def outline():
    b = request.get_json(silent=True) or {}
    if not s(b.get("topic"), 300):
        return error("invalid_request", "Sujet manquant.", 400)
    cap = plan_of(g.ukey)[1]["series"]
    n = max(1, min(cap, int(b.get("count") or 5)))
    data, err = ask(
        f"{brief(b)}\n\nPropose le plan d'une séquence de {n} leçons, progressives et cohérentes "
        "(chaque leçon s'appuie sur la précédente).\n"
        'Format : {"title": "titre de la séquence", "lessons": [{"title": "...", "summary": "2 phrases : ce que couvre la leçon"}]}',
        6000,
    )
    if err:
        return err
    lessons = [
        {"title": s(l.get("title"), 160), "summary": s(l.get("summary"), 600)}
        for l in data.get("lessons", []) if isinstance(l, dict) and l.get("title")
    ][:cap]
    if not lessons:
        return error("invalid_json", "Plan vide, réessayez.", 422)
    return jsonify({"title": s(data.get("title"), 160) or s(b.get("topic"), 160), "lessons": lessons})


@app.post("/api/lesson")
def lesson():
    b = request.get_json(silent=True) or {}
    plan = b.get("lessons")
    try:
        idx = int(b.get("index"))
    except (TypeError, ValueError):
        idx = -1
    pname, cfg = plan_of(g.ukey)
    if not isinstance(plan, list) or not 0 <= idx < len(plan) or len(plan) > cfg["series"]:
        return error("invalid_request", f"Plan invalide ou trop long pour votre formule ({cfg['series']} leçons maximum).", 400)
    now = time.time()
    with _ulock:
        _, _, used, resets = usage_info(user_rec(g.ukey), now)
    if used >= cfg["limit"]:
        when = time.strftime("%d/%m", time.localtime(resets)) if resets else "bientôt"
        msg = ("Vous avez créé toutes vos ressources gratuites pour cette semaine."
               if pname == "free" else "Vous avez atteint votre limite mensuelle de ressources.")
        return error("limit", f"{msg} Votre quota se réinitialise vers le {when}.", 429)
    opt = b.get("options") if isinstance(b.get("options"), dict) else {}
    slides = max(6, min(cfg["slides"], int(opt.get("slides") or 10)))
    outline_txt = "\n".join(
        f"{i + 1}. {s(l.get('title'), 160)} — {s(l.get('summary'), 600)}" for i, l in enumerate(plan)
    )
    cur = plan[idx]
    extras = []
    if opt.get("objectives", True):
        extras.append('"objectives": ["2 à 4 objectifs d\'apprentissage"]')
    if opt.get("vocabulary", True):
        extras.append('"vocabulary": [{"term": "...", "definition": "..."}] (4 à 8 mots clés)')
    if opt.get("quiz", True):
        extras.append('"quiz": [{"q": "...", "choices": ["A","B","C","D"], "answer": 0, "why": "explication courte"}] (4 questions, "answer" = indice de la bonne réponse)')
    images = opt.get("images", True)
    data, err = ask(
        f"{brief(b)}\nCadre de leçon : {FRAMEWORKS.get(b.get('framework'), FRAMEWORKS['standard'])}\n\n"
        f"Titre de la séquence : {s(b.get('title'), 160)}\nPlan complet :\n{outline_txt}\n\n"
        f"Écris maintenant la leçon {idx + 1} : « {s(cur.get('title'), 160)} » ({s(cur.get('summary'), 600)}). "
        "Ne répète pas le contenu des autres leçons.\n"
        f"Format : {{\"title\": \"...\", \"slides\": [{SLIDE_FORMAT}], {', '.join(extras)}}}\n"
        f"Exactement {slides} diapositives, de l'accroche au bilan. Varie les mises en page "
        "(au moins une chronologie ou des étapes si le sujet s'y prête, une liste, et une citation si pertinent). "
        + (SVG_RULES + " Mets une illustration sur la plupart des diapositives text_image." if images
           else 'N\'inclus pas de champ "svg".'),
        64000,
    )
    if err:
        return err
    with _ulock:
        u = user_rec(g.ukey)
        u["usage"].append(time.time())
        persist("users", g.ukey, u)
    out = {
        "title": s(data.get("title"), 160) or s(cur.get("title"), 160),
        "slides": [c for c in (clean_slide(x) for x in data.get("slides", [])) if c and c["layout"] not in ("activity", "vocab", "title", "video")][:24],
        "objectives": [s(t, 300) for t in data.get("objectives", []) if t][:6],
        "vocabulary": [
            {"term": s(v.get("term"), 80), "definition": s(v.get("definition"), 300)}
            for v in data.get("vocabulary", []) if isinstance(v, dict) and v.get("term")
        ][:12],
        "quiz": [],
    }
    for q in data.get("quiz", []):
        if isinstance(q, dict) and isinstance(q.get("choices"), list) and isinstance(q.get("answer"), int):
            ch = [s(c, 200) for c in q["choices"]][:6]
            if 0 <= q["answer"] < len(ch):
                out["quiz"].append({"q": s(q.get("q"), 400), "choices": ch, "answer": q["answer"], "why": s(q.get("why"), 500)})
    if not out["slides"]:
        return error("invalid_json", "Leçon vide, réessayez.", 422)
    return jsonify(out)


@app.post("/api/slide")
def slide():
    """« Demander à Claude » : réécrit une diapositive selon une consigne."""
    b = request.get_json(silent=True) or {}
    cur, instr = b.get("slide"), s(b.get("instruction"), 1000)
    if not isinstance(cur, dict) or not instr:
        return error("invalid_request", "Diapositive ou consigne manquante.", 400)
    cur = {k: v for k, v in cur.items() if k != "svg"}
    data, err = ask(
        f"{brief(b)}\nLeçon : {s(b.get('lesson'), 160)}\n\nDiapositive actuelle (JSON) :\n{json.dumps(cur, ensure_ascii=False)[:6000]}\n\n"
        f"Consigne de l'enseignant : {instr}\n\n"
        "Renvoie la diapositive modifiée, au même format JSON que la diapositive actuelle (mêmes champs, "
        f"« layout » parmi title, text_image, list, timeline, steps, quote, vocab, activity). Pour text_image, tu peux ajouter une illustration. {SVG_RULES}",
        6000,
    )
    if err:
        return err
    out = clean_slide(data)
    if not out:
        return error("invalid_json", "Diapositive illisible, réessayez.", 422)
    return jsonify(out)


@app.get("/")
def index():
    with open(os.path.join(STATIC_DIR, "index.html"), encoding="utf-8") as f:
        return Response(f.read(), mimetype="text/html", headers={"Cache-Control": "no-cache"})


@app.get("/healthz")
def healthz():
    return {"ok": True, "ai": bool(os.environ.get("ANTHROPIC_API_KEY"))}


@app.get("/<path:name>")
def static_files(name):
    return send_from_directory(STATIC_DIR, name)


load_store()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
