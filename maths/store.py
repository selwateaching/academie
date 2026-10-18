"""Base de données de Tadriss-Maths (SQLAlchemy Core).

PostgreSQL sur Render (variable DATABASE_URL), SQLite en local si elle est absente.
"""
import os
from datetime import datetime, timedelta

from sqlalchemy import (Column, DateTime, ForeignKey, Integer, MetaData, String, Table,
                        UniqueConstraint, create_engine, select)

LEVELS = ["gs", "cp", "ce1", "ce2", "cm1", "cm2", "6e"]
# Prix mensuels en dinars algériens (DA), par niveau.
PRICES = {"gs": 200, "cp": 200, "ce1": 200, "ce2": 200, "cm1": 200, "cm2": 200, "6e": 400}
PLAN_DAYS = 30
# Compétences gratuites (essai) : la 1re compétence des catégories A, B et C de chaque niveau.
FREE_CODES = ("A1", "B1", "C1")

metadata = MetaData()
users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("email", String(254), nullable=False, unique=True),
    Column("pw_hash", String(300), nullable=False),
    Column("created_at", DateTime, nullable=False),
)
profiles = Table(
    "profiles", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("name", String(40), nullable=False),
    Column("level", String(4), nullable=False),
    Column("created_at", DateTime, nullable=False),
)
progress = Table(
    "progress", metadata,
    Column("profile_id", Integer, ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", String(16), primary_key=True),
    Column("score", Integer, nullable=False, default=0),
    Column("answered", Integer, nullable=False, default=0),
    Column("correct", Integer, nullable=False, default=0),
    Column("secs", Integer, nullable=False, default=0),
    Column("last_ts", Integer, nullable=False, default=0),
)
daily = Table(
    "daily", metadata,
    Column("profile_id", Integer, ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("day", String(10), primary_key=True),
    Column("n", Integer, nullable=False, default=0),
    Column("ok", Integer, nullable=False, default=0),
    Column("secs", Integer, nullable=False, default=0),
)
subscriptions = Table(
    "subscriptions", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("level", String(4), nullable=False),
    Column("expires_at", DateTime, nullable=False),
    UniqueConstraint("user_id", "level", name="uq_sub_user_level"),
)
payments = Table(
    "payments", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("level", String(4), nullable=False),
    Column("amount", Integer, nullable=False),
    Column("currency", String(3), nullable=False, default="dzd"),
    Column("provider", String(16), nullable=False),
    Column("checkout_id", String(80), unique=True),
    Column("status", String(12), nullable=False, default="pending"),  # pending | paid | failed
    Column("created_at", DateTime, nullable=False),
    Column("paid_at", DateTime),
)


def make_engine(url=None):
    url = url or os.environ.get("DATABASE_URL") or "sqlite:///tadriss.db"
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    engine = create_engine(url, pool_pre_ping=True, future=True)
    metadata.create_all(engine)
    return engine


def now():
    return datetime.utcnow()


def active_subscriptions(conn, user_id):
    """{niveau: date d'expiration} pour les abonnements encore valides."""
    rows = conn.execute(select(subscriptions.c.level, subscriptions.c.expires_at)
                        .where(subscriptions.c.user_id == user_id)).all()
    t = now()
    return {lv: exp for lv, exp in rows if exp > t}


def activate_payment(conn, payment_id):
    """Marque un paiement comme payé et prolonge l'abonnement de 30 jours.

    Idempotent : un paiement déjà payé ne prolonge rien une seconde fois.
    Renvoie True si l'abonnement vient d'être activé ou prolongé.
    """
    p = conn.execute(select(payments).where(payments.c.id == payment_id)).mappings().first()
    if p is None or p["status"] == "paid":
        return False
    t = now()
    conn.execute(payments.update().where(payments.c.id == payment_id).values(status="paid", paid_at=t))
    sub = conn.execute(select(subscriptions).where(
        (subscriptions.c.user_id == p["user_id"]) & (subscriptions.c.level == p["level"]))).mappings().first()
    if sub is None:
        conn.execute(subscriptions.insert().values(user_id=p["user_id"], level=p["level"],
                                                   expires_at=t + timedelta(days=PLAN_DAYS)))
    else:
        start = max(t, sub["expires_at"])
        conn.execute(subscriptions.update().where(subscriptions.c.id == sub["id"])
                     .values(expires_at=start + timedelta(days=PLAN_DAYS)))
    return True
