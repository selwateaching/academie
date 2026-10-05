"""Communications : file d'envoi (outbox) et envoi SMTP optionnel.

Sans configuration SMTP (INSTITUT_SMTP_HOST), les messages sont marqués « simulated » :
ils restent consultables dans l'espace professionnel et dans les notifications de la cliente.
"""

import os
import smtplib
import ssl
from datetime import datetime, timedelta
from email.message import EmailMessage

from db import jdump, jload, now_iso, row

SMTP_HOST = os.environ.get("INSTITUT_SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("INSTITUT_SMTP_PORT", "587"))
SMTP_USER = os.environ.get("INSTITUT_SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("INSTITUT_SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("INSTITUT_SMTP_FROM", SMTP_USER)

MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


def fr_date(dt):
    return f"{DAYS[dt.weekday()]} {dt.day} {MONTHS[dt.month - 1]} {dt.year}"


def get_setting(conn, key, default=None):
    r = row(conn, "SELECT value FROM settings WHERE key=?", (key,))
    return jload(r["value"], default) if r else default


TEMPLATES = {
    "confirmation": ("Votre rendez-vous du {date} à {time}",
                     "Bonjour {first_name},\n\nVotre rendez-vous « {service} » est {status_txt} le {date} à {time} ({duration} min).\n{deposit_txt}\nPour annuler ou déplacer votre rendez-vous, rendez-vous dans votre espace cliente au plus tard {cancel_hours} h avant.\n\nÀ très vite,\n{institute}\n{address} — {phone}"),
    "reminder_48h": ("Rappel : rendez-vous dans 2 jours",
                     "Bonjour {first_name},\n\nUn petit rappel : votre rendez-vous « {service} » a lieu le {date} à {time}.\n\n{institute}\n{address} — {phone}"),
    "reminder_24h": ("Rappel : rendez-vous demain à {time}",
                     "Bonjour {first_name},\n\nNous vous attendons demain à {time} pour « {service} ».\nEn cas d'empêchement, merci de nous prévenir au plus vite.\n\n{institute}\n{address} — {phone}"),
    "thanks": ("Merci de votre visite",
               "Bonjour {first_name},\n\nMerci d'être venue chez {institute} ! Nous espérons que votre prestation « {service} » vous a plu.\nVos conseils d'entretien et vos points fidélité sont disponibles dans votre espace cliente.\n\nÀ bientôt,\n{institute}"),
}


def _ctx(conn, appt):
    inst = get_setting(conn, "institute", {})
    cl = row(conn, "SELECT * FROM users WHERE id=?", (appt["client_id"],))
    svc = row(conn, "SELECT * FROM services WHERE id=?", (appt["service_id"],))
    start = datetime.fromisoformat(appt["start"])
    st = appt["status"]
    status_txt = {"confirme": "confirmé", "demande": "enregistré, en attente de validation par la professionnelle",
                  "en_attente": "enregistré, en attente de confirmation"}.get(st, st)
    dep = ""
    if appt.get("deposit", 0) > 0:
        dep = f"Acompte de {appt['deposit']:.0f} € {'réglé' if appt.get('deposit_paid') else 'à régler'}.\n"
    bk = get_setting(conn, "booking", {})
    return {
        "first_name": cl["first_name"], "service": svc["name"], "date": fr_date(start), "time": start.strftime("%H:%M"),
        "duration": svc["duration"], "status_txt": status_txt, "deposit_txt": dep,
        "cancel_hours": bk.get("cancel_hours", 24), "institute": inst.get("name", ""),
        "address": inst.get("address", ""), "phone": inst.get("phone", ""),
    }


def queue(conn, client_id, kind, subject, body, send_at=None, appointment_id=None):
    cl = row(conn, "SELECT email FROM users WHERE id=?", (client_id,))
    conn.execute(
        "INSERT INTO outbox(client_id,appointment_id,kind,to_addr,subject,body,send_at) VALUES (?,?,?,?,?,?,?)",
        (client_id, appointment_id, kind, cl["email"] if cl else "", subject, body, send_at or now_iso()))


def schedule_for_appointment(conn, appt_id):
    """(Re)programme confirmation, rappels 48 h / 24 h et message de remerciement."""
    conn.execute("UPDATE outbox SET status='cancelled' WHERE appointment_id=? AND status='pending'", (appt_id,))
    appt = row(conn, "SELECT * FROM appointments WHERE id=?", (appt_id,))
    if not appt or appt["status"] in ("annule", "no_show", "termine"):
        return
    cfg = get_setting(conn, "reminders", {})
    ctx = _ctx(conn, appt)
    start, end = datetime.fromisoformat(appt["start"]), datetime.fromisoformat(appt["end"])
    now = datetime.now()
    plan = []
    if cfg.get("confirmation", True):
        plan.append(("confirmation", now))
    if cfg.get("h48", True) and start - timedelta(hours=48) > now:
        plan.append(("reminder_48h", start - timedelta(hours=48)))
    if cfg.get("h24", True) and start - timedelta(hours=24) > now:
        plan.append(("reminder_24h", start - timedelta(hours=24)))
    if cfg.get("thanks", True):
        plan.append(("thanks", end + timedelta(hours=cfg.get("thanks_delay_hours", 3))))
    for kind, when in plan:
        subj, body = TEMPLATES[kind]
        queue(conn, appt["client_id"], kind, subj.format(**ctx), body.format(**ctx),
              when.replace(microsecond=0).isoformat(), appt_id)


def cancel_for_appointment(conn, appt_id):
    conn.execute("UPDATE outbox SET status='cancelled' WHERE appointment_id=? AND status='pending'", (appt_id,))


def _smtp_send(to, subject, body, inst_name):
    msg = EmailMessage()
    msg["From"] = f"{inst_name} <{SMTP_FROM}>" if inst_name else SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as s:
        s.starttls(context=ssl.create_default_context())
        if SMTP_USER:
            s.login(SMTP_USER, SMTP_PASSWORD)
        s.send_message(msg)


def process_outbox(conn):
    """Envoie les messages arrivés à échéance. Retourne le nombre traité."""
    inst_name = get_setting(conn, "institute", {}).get("name", "")
    due = conn.execute("SELECT * FROM outbox WHERE status='pending' AND send_at<=? ORDER BY send_at LIMIT 50",
                       (now_iso(),)).fetchall()
    for m in due:
        if not SMTP_HOST or not m["to_addr"]:
            conn.execute("UPDATE outbox SET status='simulated', sent_at=? WHERE id=?", (now_iso(), m["id"]))
            continue
        try:
            _smtp_send(m["to_addr"], m["subject"], m["body"], inst_name)
            conn.execute("UPDATE outbox SET status='sent', sent_at=? WHERE id=?", (now_iso(), m["id"]))
        except Exception as exc:  # noqa: BLE001 - on conserve l'erreur pour l'affichage
            conn.execute("UPDATE outbox SET status='failed', error=? WHERE id=?", (str(exc)[:300], m["id"]))
    conn.commit()
    return len(due)
