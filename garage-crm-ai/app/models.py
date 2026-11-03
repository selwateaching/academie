from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def now():
    return datetime.now(timezone.utc)


ROLES = ("admin", "manager", "commercial")
STATUSES = ("a_contacter", "contacte", "repondu", "rdv", "partenaire", "refuse", "ecarte", "archive")


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    role: Mapped[str] = mapped_column(String(20), default="commercial")
    password_hash: Mapped[str] = mapped_column(String(300))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Company(Base):
    __tablename__ = "companies"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(300), index=True)
    category: Mapped[str] = mapped_column(String(100), default="")
    city: Mapped[str] = mapped_column(String(150), default="")
    address: Mapped[str] = mapped_column(String(400), default="")
    phone: Mapped[str] = mapped_column(String(60), default="")
    website: Mapped[str] = mapped_column(String(400), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    contact_name: Mapped[str] = mapped_column(String(200), default="")
    # Traçabilité de la source (RGPD) : d'où vient la donnée
    source: Mapped[str] = mapped_column(String(100), default="manuel")
    source_ref: Mapped[str | None] = mapped_column(String(200), unique=True, nullable=True)
    rating: Mapped[float | None] = mapped_column(nullable=True)
    rating_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_reason: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="a_contacter", index=True)
    next_action: Mapped[str] = mapped_column(String(300), default="")
    last_contact: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    # Opposition à la prospection : un prospect marqué ainsi n'est jamais contacté
    do_not_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    messages: Mapped[list["Message"]] = relationship(back_populates="company", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    kind: Mapped[str] = mapped_column(String(30), default="email")  # email | relance | script_appel
    subject: Mapped[str] = mapped_column(String(300), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    # brouillon -> valide (humain) -> envoye | rejete
    status: Mapped[str] = mapped_column(String(20), default="brouillon", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    approved_by: Mapped[str] = mapped_column(String(200), default="")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    company: Mapped[Company] = relationship(back_populates="messages")


class AppSetting(Base):
    """Réglages modifiables depuis l'interface (pilote automatique)."""
    __tablename__ = "app_settings"
    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value: Mapped[str] = mapped_column(String(300), default="")


class InboxEvent(Base):
    """Réponses de prospects déjà traitées (évite de les traiter deux fois)."""
    __tablename__ = "inbox_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    message_id: Mapped[str] = mapped_column(String(300), unique=True, index=True)
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(20))          # stop | refus | reponse | auto
    summary: Mapped[str] = mapped_column(String(300), default="")
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class WeeklyAnalysis(Base):
    """Analyse du « responsable commercial IA » (agent 5), conservée pour l'historique."""
    __tablename__ = "weekly_analyses"
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    days: Mapped[int] = mapped_column(Integer, default=7)
    source: Mapped[str] = mapped_column(String(20), default="regles")     # ia | regles
    content: Mapped[str] = mapped_column(Text, default="{}")              # JSON : summary, recommendations, alerts, facts
