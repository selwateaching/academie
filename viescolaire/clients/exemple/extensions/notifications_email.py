"""Extension d'exemple : envoie par e-mail les messages et convocations.

Désactivée tant que "actif" n'est pas à true dans la config du client.
Identifiants SMTP lus dans des variables d'environnement (jamais dans le fichier de config).
"""
import os
import smtplib
from email.message import EmailMessage


def register(api):
    cfg = api.reglages
    if not cfg.get("actif"):
        return

    def envoyer(destinataires, sujet, corps):
        if not destinataires:
            return
        msg = EmailMessage()
        msg["From"], msg["To"], msg["Subject"] = cfg["expediteur"], cfg["expediteur"], sujet
        msg["Bcc"] = ", ".join(destinataires)
        msg.set_content(corps)
        with smtplib.SMTP(cfg["smtp_host"], cfg.get("smtp_port", 587), timeout=15) as s:
            s.starttls()
            s.login(os.environ[cfg["smtp_user_env"]], os.environ[cfg["smtp_password_env"]])
            s.send_message(msg)

    @api.on("message.envoye")
    def _message(sujet, corps, expediteur, emails, **_):
        envoyer(emails, f"[Vie scolaire] {sujet}", f"De : {expediteur}\n\n{corps}")

    @api.on("reunion.creee")
    def _reunion(titre, date, heure, lieu, emails, **_):
        envoyer(emails, f"Convocation : {titre}", f"Vous êtes convoqué(e) le {date} {heure} – {lieu}.")
