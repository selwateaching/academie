"""Prospects à relancer : contactés, sans suite depuis RELANCE_DAYS jours, 2 relances maximum."""
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .config import get_settings

MAX_RELANCES = 2


def aware(dt):
    return dt.replace(tzinfo=timezone.utc) if dt is not None and dt.tzinfo is None else dt


def due_companies(db: Session) -> list[tuple[models.Company, int, int]]:
    """Retourne [(prospect, jours depuis le dernier contact, relances déjà envoyées)], les plus anciens d'abord."""
    now = datetime.now(timezone.utc)
    limit = now - timedelta(days=get_settings().relance_days)
    out = []
    for c in db.scalars(select(models.Company).where(models.Company.status == "contacte")):
        last = aware(c.last_contact)
        if c.do_not_contact or not last or last > limit:
            continue
        relances = [m for m in c.messages if m.kind == "relance"]
        if any(m.status in ("brouillon", "valide") for m in relances):
            continue
        sent = sum(1 for m in relances if m.status == "envoye")
        if sent >= MAX_RELANCES:
            continue
        out.append((c, (now - last).days, sent))
    return sorted(out, key=lambda t: -t[1])


def _note(c: models.Company, text: str) -> None:
    c.notes = (c.notes + "\n" if c.notes else "") + text


def no_answer_streak(notes: str) -> int:
    """Nombre d'appels « Pas de réponse » consécutifs. Un autre résultat d'appel ou une reprise remet à zéro ;
    un message WhatsApp est neutre."""
    streak = 0
    for line in (notes or "").split("\n"):
        if "Repris en prospection" in line:
            streak = 0
        elif line.startswith("Appel du ") and ") : " in line:
            out = line.split(") : ", 1)[1].strip()
            if out.startswith("Pas de réponse"):
                streak += 1
            elif not out.startswith("Message WhatsApp"):
                streak = 0
    return streak


def close_company(c: models.Company, reason: str) -> None:
    c.status, c.next_action = "sans_suite", ""
    _note(c, f"Sans suite le {datetime.now(timezone.utc):%d/%m/%Y} : {reason}")


def close_stale(db: Session) -> int:
    """2 relances envoyées et aucune réaction depuis SANS_SUITE_DAYS jours -> « Sans suite »."""
    limit = datetime.now(timezone.utc) - timedelta(days=get_settings().sans_suite_days)
    closed = 0
    for c in db.scalars(select(models.Company).where(models.Company.status == "contacte")):
        last = aware(c.last_contact)
        sent = sum(1 for m in c.messages if m.kind == "relance" and m.status == "envoye")
        if not c.do_not_contact and sent >= MAX_RELANCES and last and last <= limit:
            close_company(c, f"{MAX_RELANCES} relances restées sans réponse")
            closed += 1
    if closed:
        db.commit()
    return closed
