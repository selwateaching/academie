"""Ludika — serveur d'hébergement (Render ou autre).

Rôles :
  1. Servir la page Ludika (static/index.html).
  2. /api/generate : appeler Claude avec la clé API gardée côté serveur
     (variable d'environnement ANTHROPIC_API_KEY, jamais dans la page).
  3. /api/db/... : petite base partagée pour le mode classe en ligne
     (parties et scores des élèves).

Variables d'environnement :
  ANTHROPIC_API_KEY    clé API Anthropic (obligatoire pour la génération)
  LUDIKA_ACCESS_CODE   facultatif : code demandé aux enseignants avant de générer
  LUDIKA_MODEL         facultatif : modèle Claude (défaut claude-opus-5)
  LUDIKA_EFFORT        facultatif : low | medium | high (défaut : celui du modèle)
  LUDIKA_GEN_PER_HOUR  facultatif : générations max par heure et par adresse IP (défaut 20)
  LUDIKA_DATA_FILE     facultatif : fichier de sauvegarde de la base (défaut data.json)
"""

import copy
import hmac
import json
import os
import re
import secrets
import tempfile
import threading
import time
from collections import defaultdict, deque

import anthropic
from flask import Flask, Response, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

MODEL = os.environ.get("LUDIKA_MODEL", "claude-opus-5")
EFFORT = os.environ.get("LUDIKA_EFFORT", "").strip()
ACCESS_CODE = os.environ.get("LUDIKA_ACCESS_CODE", "").strip()
GEN_PER_HOUR = int(os.environ.get("LUDIKA_GEN_PER_HOUR", "20"))
DATA_FILE = os.environ.get("LUDIKA_DATA_FILE", os.path.join(BASE_DIR, "data.json"))

MAX_PROMPT_CHARS = 70_000
MAX_IMAGE_B64 = 7_000_000  # ~5 Mo d'image
IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_DOC_BYTES = 256 * 1024
MAX_DOCS = 5000
SESSION_TTL = 60 * 86400  # les parties sont effacées après 60 jours

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

CONFIG_SNIPPET = (
    '<script>window.LUDIKA_API_URL="/api/generate";'
    'window.LUDIKA_CLOUD_URL="/api/db";</script>\n</head>'
)


def client_ip():
    fwd = request.headers.get("X-Forwarded-For", "")
    return fwd.split(",")[0].strip() if fwd else (request.remote_addr or "?")


def error(code, message, status):
    return jsonify({"code": code, "error": message}), status


# ---------------------------------------------------------------- page

@app.get("/")
def index():
    with open(os.path.join(STATIC_DIR, "index.html"), encoding="utf-8") as f:
        html = f.read()
    html = html.replace("</head>", CONFIG_SNIPPET, 1)
    return Response(html, mimetype="text/html", headers={"Cache-Control": "no-cache"})


@app.get("/healthz")
def healthz():
    return {"ok": True, "ai": bool(os.environ.get("ANTHROPIC_API_KEY"))}


@app.get("/<path:name>")
def static_files(name):
    return send_from_directory(STATIC_DIR, name)


# ---------------------------------------------------------------- IA

_gen_log = defaultdict(deque)
_gen_lock = threading.Lock()
_client = None


def get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(timeout=600.0)
    return _client


def rate_ok(ip):
    now = time.time()
    with _gen_lock:
        q = _gen_log[ip]
        while q and now - q[0] > 3600:
            q.popleft()
        if len(q) >= GEN_PER_HOUR:
            return False
        q.append(now)
        return True


def parse_json(text):
    text = text.strip()
    candidates = [text]
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fence:
        candidates.append(fence.group(1).strip())
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        candidates.append(text[start:end + 1])
    for c in candidates:
        try:
            return json.loads(c)
        except ValueError:
            continue
    return None


@app.post("/api/generate")
def generate():
    if ACCESS_CODE and not hmac.compare_digest(
        request.headers.get("X-Ludika-Code", "").encode(), ACCESS_CODE.encode()
    ):
        return error("access", "Code d'accès enseignant requis.", 401)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return error("no_key", "ANTHROPIC_API_KEY n'est pas configurée sur le serveur.", 503)

    body = request.get_json(silent=True) or {}
    prompt = body.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        return error("invalid_request", "prompt manquant.", 400)
    if len(prompt) > MAX_PROMPT_CHARS:
        return error("prompt_too_large", "Demande trop longue.", 413)

    content = []
    image = body.get("image")
    if image:
        media_type = image.get("media_type") if isinstance(image, dict) else None
        data = image.get("data") if isinstance(image, dict) else None
        if media_type not in IMAGE_TYPES or not isinstance(data, str) or len(data) > MAX_IMAGE_B64:
            return error("image_rejected", "Image refusée (JPEG, PNG, GIF ou WebP, 5 Mo max).", 400)
        content.append({"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}})
    content.append({"type": "text", "text": prompt})

    if not rate_ok(client_ip()):
        return error("rate_limited", "Trop de générations. Réessayez plus tard.", 429)

    params = dict(
        model=MODEL,
        max_tokens=64000,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": content}],
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    )
    if EFFORT:
        params["output_config"] = {"effort": EFFORT}

    try:
        with get_client().beta.messages.stream(**params) as stream:
            message = stream.get_final_message()
    except anthropic.AuthenticationError:
        return error("no_key", "Clé API invalide.", 503)
    except anthropic.PermissionDeniedError:
        return error("no_key", "La clé API n'a pas accès à ce modèle.", 503)
    except anthropic.RateLimitError:
        return error("rate_limited", "Limite de l'API Anthropic atteinte.", 429)
    except anthropic.BadRequestError as e:
        app.logger.warning("Bad request: %s", e.message)
        return error("invalid_request", "Requête refusée par l'API.", 400)
    except anthropic.APIStatusError as e:
        app.logger.warning("API error %s: %s", e.status_code, e.message)
        return error("upstream_error", "Erreur du service Claude.", 502)
    except anthropic.APIConnectionError:
        return error("upstream_error", "Connexion à Claude impossible.", 502)

    if message.stop_reason == "refusal":
        return error("refused", "Claude a refusé cette demande.", 422)
    if message.stop_reason == "max_tokens":
        return error("invalid_json", "Réponse trop longue.", 422)
    text = "".join(b.text for b in message.content if b.type == "text")
    data = parse_json(text)
    if data is None:
        return error("invalid_json", "Réponse illisible.", 422)
    return jsonify(data)


# ---------------------------------------------------------------- base partagée (mode classe)

SEGMENT = re.compile(r"^[A-Za-z0-9_\-.~:@+]{1,200}$")
_db_lock = threading.Lock()
_docs = {}    # chemin du document -> données
_owners = {}  # chemin du document de partie -> jeton enseignant


def load_db():
    try:
        with open(DATA_FILE, encoding="utf-8") as f:
            saved = json.load(f)
    except (OSError, ValueError):
        return
    cutoff = (time.time() - SESSION_TTL) * 1000
    old = {p for p, d in saved.get("docs", {}).items()
           if p.count("/") == 1 and (d.get("createdAt") or 0) < cutoff}
    for p, d in saved.get("docs", {}).items():
        if not any(p == o or p.startswith(o + "/") for o in old):
            _docs[p] = d
    _owners.update({p: t for p, t in saved.get("owners", {}).items() if p in _docs})


def save_db():
    tmp_fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(DATA_FILE)), suffix=".tmp")
    with os.fdopen(tmp_fd, "w", encoding="utf-8") as f:
        json.dump({"docs": _docs, "owners": _owners}, f, ensure_ascii=False)
    os.replace(tmp, DATA_FILE)


def split_path(path):
    segs = path.split("/")
    if not segs or segs[0] != "sessions" or len(segs) > 6:
        return None
    if not all(SEGMENT.match(s) and s not in (".", "..") for s in segs):
        return None
    return segs


def merge(dst, src):
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            merge(dst[k], v)
        else:
            dst[k] = v


def owner_ok(path):
    """Seul l'enseignant qui a créé une partie peut modifier le document de la partie."""
    token = _owners.get(path)
    return token is None or hmac.compare_digest(
        request.headers.get("X-Ludika-Owner", "").encode(), token.encode()
    )


@app.route("/api/db/<path:path>", methods=["GET", "PUT", "PATCH"])
def db(path):
    segs = split_path(path)
    if segs is None:
        return error("invalid_argument", "Chemin invalide.", 400)
    is_doc = len(segs) % 2 == 0

    if request.method == "GET":
        with _db_lock:
            if is_doc:
                d = _docs.get(path)
                return jsonify({"exists": d is not None, "data": d})
            prefix = path + "/"
            docs = [{"id": p[len(prefix):], "data": d} for p, d in _docs.items()
                    if p.startswith(prefix) and "/" not in p[len(prefix):]]
            docs.sort(key=lambda x: x["id"])
            return jsonify({"docs": docs})

    if not is_doc:
        return error("invalid_argument", "Écriture sur une collection impossible.", 400)
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return error("invalid_argument", "Corps JSON attendu.", 400)
    if len(json.dumps(body)) > MAX_DOC_BYTES:
        return error("invalid_argument", "Document trop volumineux.", 400)

    reply = {"ok": True}
    with _db_lock:
        exists = path in _docs
        is_session = len(segs) == 2
        if exists and is_session and not owner_ok(path):
            return error("invalid_argument", "Seul l'enseignant peut modifier cette partie.", 403)
        if len(segs) > 2 and "/".join(segs[:2]) not in _docs:
            return error("invalid_argument", "Partie introuvable.", 404)
        if request.method == "PATCH":
            if not exists:
                return error("invalid_argument", "Document introuvable.", 404)
            merged = copy.deepcopy(_docs[path])
            merge(merged, body)
            _docs[path] = merged
        else:
            if not exists and len(_docs) >= MAX_DOCS:
                return error("quota_exceeded", "Base pleine.", 507)
            _docs[path] = body
            if is_session and not exists:
                _owners[path] = reply["owner"] = secrets.token_urlsafe(24)
        try:
            save_db()
        except OSError as e:
            app.logger.warning("Sauvegarde impossible : %s", e)
    return jsonify(reply)


load_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
