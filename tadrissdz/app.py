import base64
import hashlib
import hmac
import json
import logging
import os
import smtplib
import time
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder=None)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024  # 12 Mo par requête (message + pièces jointes)

MODEL_ID = os.environ.get("TADRISSDZ_AI_MODEL", "claude-sonnet-5")

_client = None


def get_client():
    global _client
    if _client is None:
        import anthropic

        _client = anthropic.Anthropic()
    return _client


# ===== Accès réservé aux comptes Pro pour l'outil externe "Assistant pédagogique"
# (tadriss-fiches.onrender.com, dépôt séparé) =====
# Vérifie côté serveur (Firebase Admin, jamais le client) le statut Pro du prof, puis délivre un
# jeton signé de courte durée que ce second service vérifie avant de générer quoi que ce soit — un
# simple bouton caché dans l'interface ne suffirait pas, un lien direct resterait utilisable par
# n'importe qui.
FICHES_ACCESS_SECRET = os.environ.get("FICHES_ACCESS_SECRET", "")
FICHES_TOKEN_TTL_SECONDS = 4 * 60 * 60  # 4h : le temps d'une session de travail, pas juste d'ouvrir l'onglet

_firebase_app = None


def get_firebase_app():
    global _firebase_app
    if _firebase_app is None:
        import firebase_admin
        from firebase_admin import credentials

        service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if not service_account_json:
            raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON manquant côté serveur.")
        cred = credentials.Certificate(json.loads(service_account_json))
        _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def _sign_fiches_token(uid, exp):
    payload = f"{uid}:{exp}"
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    sig = hmac.new(FICHES_ACCESS_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


@app.post("/api/fiches-access")
def fiches_access():
    """Vérifie que le prof connecté (jeton Firebase envoyé par le frontend) est sur le forfait Pro,
    et renvoie un jeton signé de courte durée à transmettre à tadriss-fiches.onrender.com."""
    if not FICHES_ACCESS_SECRET:
        return jsonify({"error": {"message": "Accès à l'Assistant pédagogique non configuré côté serveur."}}), 500
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": {"message": "Connexion requise."}}), 401
    id_token = auth_header[len("Bearer "):]
    try:
        from firebase_admin import auth as fb_auth, firestore

        get_firebase_app()
        decoded = fb_auth.verify_id_token(id_token)
        uid = decoded["uid"]
        db = firestore.client()
        snap = db.collection("profs").document(uid).get()
        plan = (snap.to_dict() or {}).get("plan") if snap.exists else None
        # Même règle de repli que côté client (authApplyProfile) : un compte validé avant l'ajout
        # des forfaits, sans champ "plan" du tout, reste considéré Pro.
        plan = (plan or "pro").strip().lower()
        if plan != "pro":
            return jsonify({"error": {"message": "L'Assistant pédagogique est réservé aux comptes Pro."}}), 403
        exp = int(time.time()) + FICHES_TOKEN_TTL_SECONDS
        return jsonify({"token": _sign_fiches_token(uid, exp), "exp": exp})
    except Exception as exc:  # noqa: BLE001 - message générique, jamais de détail d'auth au client
        logger.exception("Erreur de vérification d'accès Assistant pédagogique")
        return jsonify({"error": {"message": "Impossible de vérifier ton accès pour le moment. Réessaie."}}), 401


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
    # Logue le début ET la fin du prompt (les rappels les plus importants, comme le nombre de
    # projets exigé, sont placés en fin de prompt) ainsi qu'un extrait de la réponse, pour vérifier
    # si un écart entre ce qui est demandé et ce qui est généré vient du frontend ou de l'IA.
    logger.info("generate() prompt[:300] = %r", prompt[:300])
    logger.info("generate() prompt[-500:] = %r", prompt[-500:])

    try:
        client = get_client()
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        text = next((b.text for b in response.content if b.type == "text"), "")
        logger.info(
            "generate() stop_reason=%s text_len=%d text[:400]=%r",
            getattr(response, "stop_reason", None), len(text), text[:400],
        )
        return jsonify({"content": [{"type": "text", "text": text}]})
    except Exception as exc:  # noqa: BLE001 - renvoie l'erreur au frontend au lieu de planter
        logger.exception("Erreur lors de l'appel à l'IA (/.netlify/functions/generate)")
        message = str(exc) or exc.__class__.__name__ or "Erreur inconnue côté serveur"
        return jsonify({"error": {"message": message, "type": "api_error"}})


STABILITY_ENGINE_ID = "stable-diffusion-xl-1024-v1-0"  # le modèle le moins cher de Stability AI


@app.post("/.netlify/functions/generate-image")
def generate_image():
    api_key_raw = os.environ.get("STABILITY_API_KEY")
    api_key = (api_key_raw or "").strip()  # retire espaces/retours à la ligne accidentels copiés depuis Render
    if not api_key:
        return jsonify({"error": {"message": "Génération d'images non configurée (clé Stability AI manquante).", "type": "config_error"}})

    body = request.get_json(silent=True) or {}
    prompt = (body.get("prompt") or "").strip()
    negative_prompt = (body.get("negative_prompt") or "").strip()
    if not prompt:
        return jsonify({"error": {"message": "Prompt manquant.", "type": "bad_request"}})

    text_prompts = [{"text": prompt, "weight": 1}]
    if negative_prompt:
        text_prompts.append({"text": negative_prompt, "weight": -1})

    try:
        r = requests.post(
            f"https://api.stability.ai/v1/generation/{STABILITY_ENGINE_ID}/text-to-image",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "text_prompts": text_prompts,
                "cfg_scale": 7,
                "height": 1024,
                "width": 1024,
                "samples": 1,
                "steps": 30,
            },
            timeout=60,
        )
        if not r.ok:
            diag = f"[diagnostic : clé de {len(api_key_raw or '')} caractères reçue ({len(api_key)} après nettoyage), préfixe \"{api_key[:7]}\"] "
            return jsonify({"error": {"message": f"{diag}Stability AI a renvoyé une erreur ({r.status_code}) : {r.text[:250]}", "type": "api_error"}})
        data = r.json()
        artifacts = data.get("artifacts") or []
        if not artifacts or not artifacts[0].get("base64"):
            return jsonify({"error": {"message": "Aucune image renvoyée par Stability AI.", "type": "api_error"}})
        return jsonify({"base64": artifacts[0]["base64"]})
    except Exception as exc:  # noqa: BLE001 - renvoie l'erreur au frontend au lieu de planter
        return jsonify({"error": {"message": str(exc), "type": "api_error"}})


CONTACT_EMAIL = "contact@veloraia.fr"
MAX_ATTACHMENTS_SIZE = 8 * 1024 * 1024  # 8 Mo au total, raisonnable pour un envoi par email


@app.post("/api/contact")
def contact():
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    if not smtp_user or not smtp_password:
        return jsonify({"error": {"message": "Envoi de messages non configuré (identifiants email manquants côté serveur)."}})

    nom = (request.form.get("nom") or "").strip()
    email = (request.form.get("email") or "").strip()
    message = (request.form.get("message") or "").strip()
    if not message:
        return jsonify({"error": {"message": "Message manquant."}})

    files = request.files.getlist("fichiers")
    total_size = sum(len(f.read()) for f in files if f and f.filename)
    for f in files:
        if f and f.filename:
            f.seek(0)
    if total_size > MAX_ATTACHMENTS_SIZE:
        return jsonify({"error": {"message": "Fichiers joints trop volumineux (8 Mo maximum au total)."}})

    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = CONTACT_EMAIL
    msg["Subject"] = f"[Tadriss DZ] Signalement de {nom or 'un enseignant'}"
    if email:
        msg["Reply-To"] = email

    body = f"Nom : {nom or '(non renseigné)'}\nEmail : {email or '(non renseigné)'}\n\n{message}"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    for f in files:
        if not f or not f.filename:
            continue
        data = f.read()
        part = MIMEApplication(data, Name=f.filename)
        part["Content-Disposition"] = f'attachment; filename="{f.filename}"'
        msg.attach(part)

    try:
        smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "465"))
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [CONTACT_EMAIL], msg.as_string())
        return jsonify({"ok": True})
    except Exception as exc:  # noqa: BLE001 - renvoie l'erreur au frontend au lieu de planter
        return jsonify({"error": {"message": str(exc)}})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
