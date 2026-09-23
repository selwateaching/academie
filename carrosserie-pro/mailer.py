"""Envoi d'emails transactionnels (module Courriers) via SMTP, configuré
par variables d'environnement. Dégrade proprement si le SMTP n'est pas
configuré : la lettre reste imprimable / copiable même sans envoi direct."""

import os
import smtplib
from email.message import EmailMessage


def smtp_configure():
    return bool(os.environ.get("SMTP_HOST"))


def envoyer_email(destinataire, objet, corps):
    """Retourne (succes: bool, message: str)."""
    if not smtp_configure():
        return False, "Aucun serveur SMTP n'est configuré (variables SMTP_HOST, SMTP_USER, SMTP_PASSWORD…)."

    host = os.environ.get("SMTP_HOST")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    expediteur = os.environ.get("SMTP_FROM", user)
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() != "false"

    msg = EmailMessage()
    msg["Subject"] = objet
    msg["From"] = expediteur
    msg["To"] = destinataire
    msg.set_content(corps)

    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            if use_tls:
                server.starttls()
            if user:
                server.login(user, password)
            server.send_message(msg)
        return True, "Email envoyé avec succès."
    except Exception as exc:
        return False, f"Échec de l'envoi : {exc}"
