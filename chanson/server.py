"""Ma chanson en cadeau — serveur : page + écriture des paroles par Claude.

Variables d'environnement :
  ANTHROPIC_API_KEY   clé API Anthropic (à saisir dans Render, jamais dans le code)
  ELEVENLABS_API_KEY  clé ElevenLabs pour créer la musique avec chant (service payant)
  CHANSON_ACCESS_CODE facultatif : code demandé avant d'écrire (évite l'usage par des inconnus)
"""
import hmac
import os
import time
from collections import defaultdict, deque

import requests
import anthropic
from flask import Flask, Response, jsonify, request, send_from_directory

HERE = os.path.dirname(os.path.abspath(__file__))
ACCESS_CODE = os.environ.get("CHANSON_ACCESS_CODE", "").strip()
MODEL = "claude-sonnet-5-5"
MAX_PROMPT = 4000
MUSIC_URL = os.environ.get("ELEVENLABS_URL", "https://api.elevenlabs.io/v1/music")
LIMIT, WINDOW = 10, 3600  # 10 chansons par heure et par visiteur

app = Flask(__name__)
_client = None
_hits = defaultdict(deque)


def get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(timeout=120.0)
    return _client


def rate_ok(ip):
    now, q = time.time(), _hits[ip]
    while q and now - q[0] > WINDOW:
        q.popleft()
    if len(q) >= LIMIT:
        return False
    q.append(now)
    return True


@app.get("/")
def index():
    return send_from_directory(HERE, "index.html")


@app.get("/healthz")
def healthz():
    return "ok"


@app.get("/api/config")
def config():
    return jsonify(ready=bool(os.environ.get("ANTHROPIC_API_KEY")), music=bool(os.environ.get("ELEVENLABS_API_KEY")), needs_code=bool(ACCESS_CODE))


@app.post("/api/ecrire")
def ecrire():
    if ACCESS_CODE and not hmac.compare_digest(
        request.headers.get("X-Chanson-Code", "").encode(), ACCESS_CODE.encode()
    ):
        return jsonify(error="Code d'accès incorrect."), 403
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return jsonify(error="Écriture par l'IA non configurée."), 503
    ip = (request.headers.get("X-Forwarded-For") or request.remote_addr or "").split(",")[0].strip()
    if not rate_ok(ip):
        return jsonify(error="Trop de demandes, réessayez plus tard."), 429
    prompt = str((request.get_json(silent=True) or {}).get("prompt", "")).strip()
    if not prompt or len(prompt) > MAX_PROMPT:
        return jsonify(error="Demande invalide."), 400
    try:
        r = get_client().messages.create(
            model=MODEL, max_tokens=1500, messages=[{"role": "user", "content": prompt}]
        )
    except anthropic.APIError:
        return jsonify(error="L'IA n'a pas répondu."), 502
    return jsonify(text="".join(b.text for b in r.content if b.type == "text").strip())


@app.post("/api/musique")
def musique():
    if ACCESS_CODE and not hmac.compare_digest(
        request.headers.get("X-Chanson-Code", "").encode(), ACCESS_CODE.encode()
    ):
        return jsonify(error="Code d'accès incorrect."), 403
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        return jsonify(error="Création de la musique non configurée sur ce serveur."), 503
    ip = (request.headers.get("X-Forwarded-For") or request.remote_addr or "").split(",")[0].strip()
    if not rate_ok("m" + ip):
        return jsonify(error="Trop de demandes, réessayez plus tard."), 429
    body = request.get_json(silent=True) or {}
    prompt = str(body.get("prompt", "")).strip()
    try:
        secondes = max(10, min(240, int(body.get("secondes", 90))))
    except (TypeError, ValueError):
        secondes = 90
    if not prompt or len(prompt) > 4000:
        return jsonify(error="Demande invalide."), 400
    try:
        r = requests.post(
            MUSIC_URL,
            headers={"xi-api-key": key, "content-type": "application/json"},
            json={"prompt": prompt, "music_length_ms": secondes * 1000},
            timeout=280,
        )
    except requests.RequestException:
        return jsonify(error="Le service de musique n'a pas répondu."), 502
    if r.status_code != 200:
        return jsonify(error=f"Le service de musique a refusé la demande (code {r.status_code})."), 502
    return Response(r.content, mimetype=r.headers.get("content-type", "audio/mpeg"))


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 5000)))
