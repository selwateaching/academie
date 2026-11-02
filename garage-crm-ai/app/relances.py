"""Prospects à relancer : contactés, sans suite depuis RELANCE_DAYS jours, 2 relances maximum."""
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
