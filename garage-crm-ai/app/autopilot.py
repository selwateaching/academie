"""Pilote automatique : envoie des emails de prospection sans intervention, avec garde-fous.

Garde-fous : désactivé par défaut · exige l'envoi SMTP configuré · jamais en dehors des horaires ·
plafond quotidien · écart minimum entre deux envois · jamais à un prospect en opposition ·
note minimale · arrêt automatique après 3 échecs d'envoi.
"""
import logging
import os
import threading
import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .agent import mailer, writer
from .db import SessionLocal
from .relances import aware, due_companies

log = logging.getLogger("garage.autopilot")
TZ = ZoneInfo("Europe/Paris")
AUTO = "pilote automatique"
MIN_GAP = timedelta(minutes=8)
MAX_FAILS = 3
DEFAULTS = {"enabled": "0", "daily_cap": "10", "min_score": "60", "hour_start": "9", "hour_end": "17",
            "weekdays_only": "1", "auto_relances": "0", "failures": "0", "last_error": ""}
BOOLS = {"enabled", "weekdays_only", "auto_relances"}
INTS = {"daily_cap", "min_score", "hour_start", "hour_end", "failures"}


def get_cfg(db: Session) -> dict:
    raw = DEFAULTS | {s.key: s.value for s in db.scalars(select(models.AppSetting))}
    return {k: (raw[k] == "1" if k in BOOLS else int(raw[k]) if k in INTS else raw[k]) for k in DEFAULTS}


def set_cfg(db: Session, **changes) -> None:
    for k, v in changes.items():
        if k not in DEFAULTS:
            continue
        val = ("1" if v else "0") if k in BOOLS else str(v)
        row = db.get(models.AppSetting, k)
        if row:
            row.value = val
        else:
            db.add(models.AppSetting(key=k, value=val))
    db.commit()


def _recent_sent(db: Session) -> list[models.Message]:
    msgs = db.scalars(select(models.Message).where(models.Message.status == "envoye",
                                                   models.Message.sent_at.is_not(None))
                      .order_by(models.Message.sent_at.desc()).limit(300))
    return list(msgs)


def sent_today(db: Session, now: datetime) -> int:
    day0 = now.astimezone(TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    return sum(1 for m in _recent_sent(db) if aware(m.sent_at) >= day0)


def candidates(db: Session, cfg: dict, limit: int = 5) -> list[tuple[models.Company, str]]:
    """Prochains envois prévus : relances d'abord (si activées), puis nouveaux prospects les mieux notés."""
    out: list[tuple[models.Company, str]] = []
    if cfg["auto_relances"]:
        out += [(c, "relance") for c, _d, _s in due_companies(db) if c.email]
    first = db.scalars(select(models.Company).where(
        models.Company.status == "a_contacter", models.Company.do_not_contact.is_(False),
        models.Company.email != "", models.Company.score >= cfg["min_score"]).order_by(models.Company.score.desc()))
    for c in first:
        if not any(m.kind == "email" for m in c.messages):      # jamais deux premiers emails
            out.append((c, "email"))
    return out[:limit]


def tick(db: Session, now: datetime | None = None, send=None) -> dict:
    """Un passage du pilote : au plus UN envoi. Retourne {'sent': id|None, 'reason': str}."""
    now = now or datetime.now(timezone.utc)
    cfg = get_cfg(db)
    if not cfg["enabled"]:
        return {"sent": None, "reason": "pilote désactivé"}
    if send is None:
        if not mailer.smtp_configured():
            return {"sent": None, "reason": "envoi SMTP non configuré"}
        send = mailer.send_email
    local = now.astimezone(TZ)
    if cfg["weekdays_only"] and local.weekday() >= 5:
        return {"sent": None, "reason": "week-end"}
    if not (cfg["hour_start"] <= local.hour < cfg["hour_end"]):
        return {"sent": None, "reason": "hors des horaires d'envoi"}
    if sent_today(db, now) >= cfg["daily_cap"]:
        return {"sent": None, "reason": "plafond quotidien atteint"}
    recent = _recent_sent(db)
    if recent and now - aware(recent[0].sent_at) < MIN_GAP:
        return {"sent": None, "reason": "délai minimum entre deux envois"}
    todo = candidates(db, cfg, 1)
    if not todo:
        return {"sent": None, "reason": "aucun prospect à contacter"}
    c, kind = todo[0]
    subject, body = writer.draft(c, kind)
    m = models.Message(company_id=c.id, kind=kind, subject=subject, body=body, status="valide", approved_by=AUTO)
    db.add(m)
    db.flush()
    try:
        send(c.email, subject, body)
    except Exception as e:
        m.status, m.approved_by = "brouillon", ""
        fails = cfg["failures"] + 1
        set_cfg(db, failures=fails, last_error=f"{type(e).__name__}: {e}"[:250], **({"enabled": False} if fails >= MAX_FAILS else {}))
        log.warning("Pilote : échec d'envoi à %s : %s", c.email, e)
        return {"sent": None, "reason": "échec d'envoi" + (" – pilote arrêté" if fails >= MAX_FAILS else "")}
    m.status, m.sent_at = "envoye", now
    c.last_contact = now
    if c.status == "a_contacter":
        c.status = "contacte"
    db.commit()
    set_cfg(db, failures=0, last_error="")
    return {"sent": m.id, "reason": f"{kind} envoyé à {c.name}"}


def weekly_report_job(db: Session, now: datetime | None = None, send=None) -> dict:
    """Chaque lundi à partir de 8 h : génère l'analyse (agent 5) et l'envoie par email si REPORT_EMAIL est configuré."""
    from .agent import manager
    from .config import get_settings
    now = now or datetime.now(timezone.utc)
    local = now.astimezone(TZ)
    if local.weekday() != 0 or local.hour < 8:
        return {"done": False, "reason": "pas le moment"}
    row = db.get(models.AppSetting, "last_report")
    if row and now - datetime.fromisoformat(row.value) < timedelta(days=5):
        return {"done": False, "reason": "déjà fait cette semaine"}
    a = manager.analyse(db, 7)
    set_cfg_raw(db, "last_report", now.isoformat())
    s = get_settings()
    emailed = False
    send = send or (mailer.send_email if mailer.smtp_configured() else None)
    if s.report_email and send:
        try:
            subject, body = manager.email_text(a, s.garage_name)
            send(s.report_email, subject, body)
            emailed = True
        except Exception as e:
            log.warning("Rapport hebdomadaire non envoyé : %s", e)
    return {"done": True, "emailed": emailed}


def set_cfg_raw(db: Session, key: str, value: str) -> None:
    row = db.get(models.AppSetting, key)
    if row:
        row.value = value
    else:
        db.add(models.AppSetting(key=key, value=value))
    db.commit()


def start_scheduler(interval: int = 600) -> None:
    """Lance la boucle de fond (un passage toutes les 10 minutes). Désactivable avec NO_SCHEDULER=1."""
    if os.environ.get("NO_SCHEDULER"):
        return

    def loop():
        while True:
            time.sleep(interval)
            try:
                with SessionLocal() as db:
                    from . import replies
                    replies.check_inbox(db)          # les STOP sont pris en compte avant tout nouvel envoi
                    weekly_report_job(db)
                    r = tick(db)
                    if r["sent"]:
                        log.info("Pilote : %s", r["reason"])
            except Exception:
                log.exception("Pilote : erreur inattendue")

    threading.Thread(target=loop, daemon=True, name="autopilot").start()
