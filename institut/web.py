"""Outils web partagés : base de données par requête, authentification, médias."""

import base64
import os
import re
import secrets
import time
from collections import defaultdict, deque
from functools import wraps

from flask import abort, g, jsonify, request, session

import db

MAX_IMAGE_BYTES = 6 * 1024 * 1024
_MAGIC = [(b"\xff\xd8\xff", "jpg"), (b"\x89PNG\r\n\x1a\n", "png"), (b"RIFF", "webp")]


def get_db():
    if "db" not in g:
        g.db = db.connect()
    return g.db


def close_db(_exc=None):
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def current_user():
    if "user" not in g:
        g.user = None
        uid = session.get("uid")
        if uid:
            g.user = db.row(get_db(), "SELECT * FROM users WHERE id=? AND deleted=0", (uid,))
    return g.user


def login_required(fn):
    @wraps(fn)
    def wrapper(*a, **kw):
        if not current_user():
            return jsonify(error="Veuillez vous connecter."), 401
        return fn(*a, **kw)
    return wrapper


def pro_required(fn):
    @wraps(fn)
    def wrapper(*a, **kw):
        u = current_user()
        if not u:
            return jsonify(error="Veuillez vous connecter."), 401
        if u["role"] != "pro":
            return jsonify(error="Accès réservé à la professionnelle."), 403
        return fn(*a, **kw)
    return wrapper


def public_user(u):
    if not u:
        return None
    keys = ["id", "role", "email", "first_name", "last_name", "phone", "birth_date", "address", "preferences",
            "consent_data", "consent_marketing", "consent_photos", "loyalty_points", "created_at"]
    return {k: u[k] for k in keys}


def body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        abort(400, "Requête invalide.")
    return data


def need(data, *keys):
    for k in keys:
        if data.get(k) in (None, ""):
            abort(400, f"Champ obligatoire manquant : {k}")


def clean(s, maxlen=2000):
    return (s or "").strip()[:maxlen] if isinstance(s, str) else ""


_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def valid_email(s):
    return bool(_EMAIL.match(s or "")) and len(s) <= 200


# ---- limitation de tentatives (en mémoire, suffisante pour une instance unique)
_attempts = defaultdict(deque)


def throttle(key, limit=8, window=600):
    now = time.time()
    q = _attempts[key]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        abort(429, "Trop de tentatives, réessayez dans quelques minutes.")
    q.append(now)


# ------------------------------------------------------------------- images
def decode_image(data_url):
    """Décode une data-URL image, vérifie le type réel (signature) et la taille."""
    if not isinstance(data_url, str) or "," not in data_url:
        abort(400, "Image invalide.")
    try:
        raw = base64.b64decode(data_url.split(",", 1)[1], validate=False)
    except Exception:  # noqa: BLE001
        abort(400, "Image invalide.")
    if len(raw) > MAX_IMAGE_BYTES:
        abort(413, "Image trop volumineuse (6 Mo maximum).")
    for magic, ext in _MAGIC:
        if raw.startswith(magic) and (ext != "webp" or raw[8:12] == b"WEBP"):
            return raw, ext
    abort(400, "Format d'image non pris en charge (JPEG, PNG ou WebP).")


def save_image(data_url, private=True):
    raw, ext = decode_image(data_url)
    sub = "private" if private else "public"
    folder = os.path.join(db.UPLOAD_DIR, sub)
    os.makedirs(folder, exist_ok=True)
    name = f"{secrets.token_hex(12)}.{ext}"
    with open(os.path.join(folder, name), "wb") as fh:
        fh.write(raw)
    return name
