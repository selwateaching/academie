import os

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


@app.get("/debug-key")
def debug_key():
    raw = os.environ.get("ANTHROPIC_API_KEY", "")
    return jsonify(
        {
            "length": len(raw),
            "prefix": raw[:15],
            "suffix": raw[-6:] if len(raw) >= 6 else raw,
            "has_leading_or_trailing_space": raw != raw.strip(),
            "has_newline": "\n" in raw or "\r" in raw,
        }
    )


@app.get("/debug-workspaces")
def debug_workspaces():
    import urllib.error
    import urllib.request

    raw = os.environ.get("ANTHROPIC_API_KEY", "")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/organizations/workspaces?limit=20",
        headers={"x-api-key": raw, "anthropic-version": "2023-06-01"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return jsonify({"status": resp.status, "body": resp.read().decode()})
    except urllib.error.HTTPError as exc:
        return jsonify({"status": exc.code, "body": exc.read().decode()})
    except Exception as exc:  # noqa: BLE001 - diagnostic only
        return jsonify({"error": str(exc)})


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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
