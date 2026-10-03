import os

import requests
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder=None)

MODEL_ID = os.environ.get("TADRISSDZ_AI_MODEL", "claude-sonnet-5")

_client = None


def get_client():
    global _client
    if _client is None:
        import anthropic

        _client = anthropic.Anthropic()
    return _client


@app.get("/")
def index():
    return send_from_directory(os.path.dirname(__file__), "index.html")


@app.get("/index.html")
def index_html():
    return send_from_directory(os.path.dirname(__file__), "index.html")


@app.get("/labolangues.html")
def labolangues():
    return send_from_directory(os.path.dirname(__file__), "labolangues.html")


@app.get("/admin.html")
def admin():
    return send_from_directory(os.path.dirname(__file__), "admin.html")


@app.get("/inscription.html")
def inscription():
    return send_from_directory(os.path.dirname(__file__), "inscription.html")


@app.get("/labo-prof.png")
def labo_prof_png():
    return send_from_directory(os.path.dirname(__file__), "labo-prof.png")


@app.get("/labo-eleve.png")
def labo_eleve_png():
    return send_from_directory(os.path.dirname(__file__), "labo-eleve.png")


@app.get("/labo-globe.png")
def labo_globe_png():
    return send_from_directory(os.path.dirname(__file__), "labo-globe.png")


@app.get("/guides/<path:filename>")
def guides(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), "guides"), filename)


@app.get("/openmoji/<path:filename>")
def openmoji(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), "openmoji"), filename)


@app.post("/.netlify/functions/generate")
def generate():
    body = request.get_json(silent=True) or {}
    prompt = body.get("prompt") or ""
    max_tokens = body.get("max_tokens") or 2000
    model = body.get("model") or MODEL_ID

    try:
        client = get_client()
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        text = next((b.text for b in response.content if b.type == "text"), "")
        return jsonify({"content": [{"type": "text", "text": text}]})
    except Exception as exc:  # noqa: BLE001 - renvoie l'erreur au frontend au lieu de planter
        return jsonify({"error": {"message": str(exc), "type": "api_error"}})


STABILITY_ENGINE_ID = "stable-diffusion-xl-1024-v1-0"  # le modèle le moins cher de Stability AI


@app.post("/.netlify/functions/generate-image")
def generate_image():
    api_key_raw = os.environ.get("STABILITY_API_KEY")
    api_key = (api_key_raw or "").strip()  # retire espaces/retours à la ligne accidentels copiés depuis Render
    if not api_key:
        return jsonify({"error": {"message": "Génération d'images non configurée (clé Stability AI manquante).", "type": "config_error"}})

    body = request.get_json(silent=True) or {}
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": {"message": "Prompt manquant.", "type": "bad_request"}})

    try:
        r = requests.post(
            f"https://api.stability.ai/v1/generation/{STABILITY_ENGINE_ID}/text-to-image",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "text_prompts": [{"text": prompt}],
                "cfg_scale": 7,
                "height": 1024,
                "width": 1024,
                "samples": 1,
                "steps": 30,
            },
            timeout=60,
        )
        if not r.ok:
            diag = f" [diagnostic : clé reçue de {len(api_key_raw or '')} caractères, {len(api_key)} après nettoyage des espaces]"
            return jsonify({"error": {"message": f"Stability AI a renvoyé une erreur ({r.status_code}) : {r.text[:300]}{diag}", "type": "api_error"}})
        data = r.json()
        artifacts = data.get("artifacts") or []
        if not artifacts or not artifacts[0].get("base64"):
            return jsonify({"error": {"message": "Aucune image renvoyée par Stability AI.", "type": "api_error"}})
        return jsonify({"base64": artifacts[0]["base64"]})
    except Exception as exc:  # noqa: BLE001 - renvoie l'erreur au frontend au lieu de planter
        return jsonify({"error": {"message": str(exc), "type": "api_error"}})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
