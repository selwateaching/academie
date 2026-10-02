"""Traducteur Association — serveur (Render ou autre).

  /               la page (static/index.html)
  /api/translate  traduit un texte avec Claude (clé gardée côté serveur)
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
    try:
        msg = get_client().messages.create(
            model=MODEL,
            max_tokens=1500,
            system=system,
            messages=[{"role": "user", "content": text}],
        )
    except anthropic.APIError as e:
        return error(f"Erreur de traduction : {getattr(e, 'message', e)}", 502)
    out = "".join(b.text for b in msg.content if b.type == "text").strip()
    return jsonify({"translation": out})


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
