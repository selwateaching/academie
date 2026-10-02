"""Traducteur Association — serveur (Render ou autre).

  /               la page (static/index.html)
  /api/translate  traduit un texte avec Claude (clé gardée côté serveur)
  /api/room/...   salles : relie deux téléphones (bénévole / personne accueillie)
  /api/document   traduit la photo d'un document (courrier, formulaire…)
  /api/transcribe transcrit un fichier audio reçu (WhatsApp, etc.) avec Whisper

Variables d'environnement :
  ANTHROPIC_API_KEY   obligatoire pour traduire
  OPENAI_API_KEY      facultatif : seulement pour importer des fichiers audio
  TRAD_ACCESS_CODE    facultatif : code d'accès demandé dans la page
  TRAD_MODEL          facultatif : modèle Claude (défaut claude-sonnet-5-5)
  TRAD_PER_HOUR       facultatif : requêtes max par heure et par IP (défaut 600)
"""
import base64
import hmac
import os
import secrets
import threading
import time
from collections import defaultdict, deque

import anthropic
import requests
from flask import Flask, Response, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

MODEL = os.environ.get("TRAD_MODEL", "claude-sonnet-5-5")
ACCESS_CODE = os.environ.get("TRAD_ACCESS_CODE", "").strip()
PER_HOUR = int(os.environ.get("TRAD_PER_HOUR", "600"))
MAX_TEXT = 4000

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # limite Whisper

_log = defaultdict(deque)
_lock = threading.Lock()
_client = None


def get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(timeout=60.0)
    return _client


def error(message, status):
    return jsonify({"error": message}), status


def check_access():
    """Renvoie une réponse d'erreur, ou None si la requête est autorisée."""
    if ACCESS_CODE:
        given = request.headers.get("X-Access-Code", "")
        if not hmac.compare_digest(given.encode(), ACCESS_CODE.encode()):
            return error("Code d'accès incorrect.", 401)
    fwd = request.headers.get("X-Forwarded-For", "")
    ip = fwd.split(",")[0].strip() if fwd else (request.remote_addr or "?")
    now = time.time()
    with _lock:
        q = _log[ip]
        while q and now - q[0] > 3600:
            q.popleft()
        if len(q) >= PER_HOUR:
            return error("Trop de requêtes, réessayez plus tard.", 429)
        q.append(now)
    return None


@app.get("/")
def index():
    with open(os.path.join(STATIC_DIR, "index.html"), encoding="utf-8") as f:
        html = f.read()
    html = html.replace("__NEEDS_CODE__", "true" if ACCESS_CODE else "false")
    return Response(html, mimetype="text/html", headers={"Cache-Control": "no-cache"})


@app.get("/healthz")
def healthz():
    return {
        "ok": True,
        "translate": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "transcribe": bool(os.environ.get("OPENAI_API_KEY")),
    }


def translate_text(text, src, dst, context=""):
    """Traduit avec Claude. Lève anthropic.APIError en cas de problème."""
    system = (
        "Tu es un interprète professionnel dans une association qui aide des personnes étrangères "
        "(démarches administratives, santé, logement, école, vie quotidienne). "
        f"Traduis fidèlement le message de l'utilisateur {'depuis : ' + src + ' ' if src else ''}"
        f"vers : {dst}. Le texte vient d'une reconnaissance vocale et peut contenir des erreurs "
        "ou des hésitations : corrige-les avec bon sens sans rien inventer. "
        "Garde le ton et le niveau de langue, avec des mots simples. "
        "Pour l'arabe algérien, tunisien ou marocain (darija) : le texte reçu mélange souvent darija "
        "et mots français, écrits en lettres arabes ou latines (arabizi) ; comprends-les, et traduis vers "
        "le français naturel. Quand la cible est une darija, écris en lettres arabes, dans le dialecte "
        "demandé (pas en arabe littéraire), avec des mots simples et courants, en gardant tels quels "
        "les termes administratifs français usuels (CAF, préfecture, rendez-vous…). "
        "Réponds UNIQUEMENT par la traduction, sans commentaire, sans guillemets. "
        "Si le message est incompréhensible, réponds exactement : [incompréhensible]"
    )
    if context:
        system += f"\n\nDébut de la conversation, pour le contexte :\n{context}"
    msg = get_client().messages.create(
        model=MODEL,
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": text}],
    )
    return "".join(b.text for b in msg.content if b.type == "text").strip()


@app.post("/api/translate")
def translate():
    denied = check_access()
    if denied:
        return denied
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return error("Le serveur n'a pas encore de clé API Anthropic.", 503)
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()[:MAX_TEXT]
    src = str(data.get("from", "")).strip()[:40]
    dst = str(data.get("to", "")).strip()[:40]
    if not text or not dst:
        return error("Texte ou langue manquants.", 400)
    context = str(data.get("context", "")).strip()[:1500]
    try:
        return jsonify({"translation": translate_text(text, src, dst, context)})
    except anthropic.APIError as e:
        return error(f"Erreur de traduction : {getattr(e, 'message', e)}", 502)


# ------------------------------------------------------------ salles (2 téléphones)
# Une salle relie le téléphone du bénévole (français) et celui de la personne
# (sa langue). Gardées en mémoire (1 seul worker gunicorn) et effacées après 3 h.
ROOM_TTL = 3 * 3600
ROOM_MAX_MSGS = 400
ROOM_MAX_ROOMS = 200
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
rooms = {}
rooms_lock = threading.Lock()


def get_room(code):
    now = time.time()
    with rooms_lock:
        for c in [c for c, r in rooms.items() if now - r["created"] > ROOM_TTL]:
            del rooms[c]
        return rooms.get(str(code).upper())


@app.post("/api/room")
def room_create():
    denied = check_access()
    if denied:
        return denied
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return error("Le serveur n'a pas encore de clé API Anthropic.", 503)
    get_room("")  # nettoie les salles expirées
    with rooms_lock:
        if len(rooms) >= ROOM_MAX_ROOMS:
            return error("Trop de sessions ouvertes, réessayez plus tard.", 429)
        code = "".join(secrets.choice(ALPHABET) for _ in range(6))
        rooms[code] = {"created": time.time(), "guest_code": "", "guest_name": "", "msgs": []}
    return jsonify({"code": code})


@app.post("/api/room/<code>/join")
def room_join(code):
    r = get_room(code)
    if not r:
        return error("Session introuvable ou expirée.", 404)
    d = request.get_json(silent=True) or {}
    r["guest_code"] = str(d.get("lang_code", ""))[:12]
    r["guest_name"] = str(d.get("lang_name", ""))[:60]
    if not r["guest_name"]:
        return error("Langue manquante.", 400)
    return jsonify({"ok": True})


@app.post("/api/room/<code>/say")
def room_say(code):
    r = get_room(code)
    if not r:
        return error("Session introuvable ou expirée.", 404)
    d = request.get_json(silent=True) or {}
    side = d.get("side")
    text = str(d.get("text", "")).strip()[:MAX_TEXT]
    if side not in ("host", "guest") or not text:
        return error("Message invalide.", 400)
    if not r["guest_name"]:
        return error("La personne n'a pas encore rejoint la session.", 409)
    if len(r["msgs"]) >= ROOM_MAX_MSGS:
        return error("Session pleine : créez-en une nouvelle.", 429)
    fr, other = "français", r["guest_name"]
    src, dst = (fr, other) if side == "host" else (other, fr)
    context = "\n".join(
        f"{'Association' if m['side'] == 'host' else 'Personne'}: {m['text']}" for m in r["msgs"][-6:]
    )
    try:
        tr = translate_text(text, src, dst, context)
    except anthropic.APIError as e:
        return error(f"Erreur de traduction : {getattr(e, 'message', e)}", 502)
    with rooms_lock:
        mid = (r["msgs"][-1]["id"] + 1) if r["msgs"] else 1
        r["msgs"].append({"id": mid, "side": side, "text": text, "tr": tr})
    return jsonify({"id": mid})


@app.get("/api/room/<code>")
def room_poll(code):
    r = get_room(code)
    if not r:
        return error("Session introuvable ou expirée.", 404)
    since = request.args.get("since", 0, type=int)
    return jsonify({
        "guest_code": r["guest_code"],
        "guest_name": r["guest_name"],
        "msgs": [m for m in r["msgs"] if m["id"] > since],
    })


@app.post("/api/document")
def document():
    denied = check_access()
    if denied:
        return denied
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return error("Le serveur n'a pas encore de clé API Anthropic.", 503)
    f = request.files.get("image")
    dst = request.form.get("to", "").strip()[:60]
    if not f or not dst:
        return error("Photo ou langue manquante.", 400)
    mime = f.mimetype if f.mimetype in ("image/jpeg", "image/png", "image/webp", "image/gif") else "image/jpeg"
    b64 = base64.standard_b64encode(f.read()).decode()
    system = (
        "Tu es un traducteur dans une association qui aide des personnes étrangères. "
        f"On te donne la photo d'un document (courrier, formulaire, ordonnance, facture…). "
        f"1) Traduis fidèlement tout le texte lisible vers : {dst}, en gardant la structure (titres, listes, montants, dates). "
        "Mets entre [crochets] ce qui est illisible. "
        f"2) Termine par une ligne « ➜ En bref : » suivie de 1 à 3 phrases très simples, en {dst}, "
        "qui disent de quoi il s'agit et ce que la personne doit faire (et avant quelle date, s'il y en a une). "
        "Si le document est dans une darija, écris en lettres arabes, dans le dialecte demandé. "
        "Ne rajoute aucun autre commentaire."
    )
    try:
        msg = get_client().messages.create(
            model=MODEL,
            max_tokens=4000,
            system=system,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": mime, "data": b64}},
                {"type": "text", "text": "Traduis ce document."},
            ]}],
        )
    except anthropic.APIError as e:
        return error(f"Erreur de traduction : {getattr(e, 'message', e)}", 502)
    out = "".join(b.text for b in msg.content if b.type == "text").strip()
    return jsonify({"translation": out})


@app.post("/api/transcribe")
def transcribe():
    denied = check_access()
    if denied:
        return denied
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return error("L'import de fichiers audio demande une clé OPENAI_API_KEY sur le serveur.", 503)
    f = request.files.get("audio")
    if not f:
        return error("Aucun fichier reçu.", 400)
    name = f.filename or "audio.ogg"
    if name.lower().endswith(".opus"):  # WhatsApp : même format qu'un .ogg
        name = name[:-5] + ".ogg"
    try:
        r = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {key}"},
            data={"model": "whisper-1", "response_format": "verbose_json"},
            files={"file": (name, f.stream, f.mimetype or "application/octet-stream")},
            timeout=300,
        )
    except requests.RequestException as e:
        return error(f"Transcription impossible : {e}", 502)
    if r.status_code != 200:
        return error(f"Transcription refusée ({r.status_code}).", 502)
    j = r.json()
    return jsonify({"text": (j.get("text") or "").strip(), "language": j.get("language", "")})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
