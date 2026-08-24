import secrets
from datetime import datetime, timedelta

from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()

TRIAL_DAYS = 14
SUBSCRIPTION_DAYS = 30
MENTIONS = [
    (16, "Très bien"),
    (14, "Bien"),
    (12, "Assez bien"),
    (10, "Passable"),
    (0, "Insuffisant"),
]


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), default="")
    phone = db.Column(db.String(40), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_until = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)

    state = db.relationship(
        "UserState", backref="user", uselist=False, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def trial_end(self):
        return self.created_at + timedelta(days=TRIAL_DAYS)

    @property
    def is_trial_active(self):
        return datetime.utcnow() < self.trial_end

    @property
    def is_paid_active(self):
        return self.paid_until is not None and datetime.utcnow() < self.paid_until

    @property
    def is_active_subscriber(self):
        return self.is_admin or self.is_trial_active or self.is_paid_active

    @property
    def days_left_trial(self):
        delta = self.trial_end - datetime.utcnow()
        return max(0, delta.days)

    @property
    def subscription_status(self):
        if self.is_admin:
            return "admin"
        if self.is_paid_active:
            return "paid"
        if self.is_trial_active:
            return "trial"
        return "expired"

    def mark_paid(self, days=SUBSCRIPTION_DAYS):
        base = (
            self.paid_until
            if (self.paid_until and self.paid_until > datetime.utcnow())
            else datetime.utcnow()
        )
        self.paid_until = base + timedelta(days=days)


class UserState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True)
    data = db.Column(db.Text, nullable=False, default="{}")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


DEFAULT_STATE = {
    "page": "dashboard",
    "lang": "auto",
    "year": "2026 / 2027",
    "wilaya": "Alger",
    "cycle": "Moyen",
    "level": "4AM",
    "subject": "الرياضيات — Mathématiques",
    "docs": [],
    "progress": [],
    "schedule": [],
    "saved": None,
}


def generate_access_code():
    return secrets.token_hex(4)


class Classe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    nom = db.Column(db.String(120), nullable=False)
    matiere = db.Column(db.String(120), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    eleves = db.relationship(
        "Eleve", backref="classe", cascade="all, delete-orphan", order_by="Eleve.nom"
    )
    evaluations = db.relationship(
        "Evaluation", backref="classe", cascade="all, delete-orphan", order_by="Evaluation.date"
    )
    presences = db.relationship("Presence", backref="classe", cascade="all, delete-orphan")


class Eleve(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classe_id = db.Column(db.Integer, db.ForeignKey("classe.id"), nullable=False, index=True)
    prenom = db.Column(db.String(120), nullable=False)
    nom = db.Column(db.String(120), nullable=False)
    date_naissance = db.Column(db.String(20), default="")
    responsable_nom = db.Column(db.String(160), default="")
    responsable_lien = db.Column(db.String(60), default="")
    responsable_tel = db.Column(db.String(40), default="")
    responsable_email = db.Column(db.String(160), default="")
    observations = db.Column(db.Text, default="")
    access_code = db.Column(db.String(16), unique=True, nullable=False, default=generate_access_code)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    notes = db.relationship("Note", backref="eleve", cascade="all, delete-orphan")
    presences = db.relationship("Presence", backref="eleve", cascade="all, delete-orphan")

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}".strip()


class Evaluation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classe_id = db.Column(db.Integer, db.ForeignKey("classe.id"), nullable=False, index=True)
    intitule = db.Column(db.String(160), nullable=False)
    type = db.Column(db.String(60), default="Contrôle")
    date = db.Column(db.String(20), default="")
    coefficient = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    notes = db.relationship("Note", backref="evaluation", cascade="all, delete-orphan")


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    evaluation_id = db.Column(db.Integer, db.ForeignKey("evaluation.id"), nullable=False, index=True)
    eleve_id = db.Column(db.Integer, db.ForeignKey("eleve.id"), nullable=False, index=True)
    valeur = db.Column(db.Float, nullable=True)

    __table_args__ = (db.UniqueConstraint("evaluation_id", "eleve_id", name="uq_note_eval_eleve"),)


class Presence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classe_id = db.Column(db.Integer, db.ForeignKey("classe.id"), nullable=False, index=True)
    eleve_id = db.Column(db.Integer, db.ForeignKey("eleve.id"), nullable=False, index=True)
    date = db.Column(db.String(20), nullable=False)
    statut = db.Column(db.String(1), default="P")  # P=présent A=absent R=retard

    __table_args__ = (db.UniqueConstraint("eleve_id", "date", name="uq_presence_eleve_date"),)


def mention_for(moyenne):
    if moyenne is None:
        return None
    for seuil, label in MENTIONS:
        if moyenne >= seuil:
            return label
    return MENTIONS[-1][1]


def moyenne_eleve(eleve):
    total_pts = 0.0
    total_coef = 0.0
    for note in eleve.notes:
        if note.valeur is None:
            continue
        coef = note.evaluation.coefficient or 1
        total_pts += note.valeur * coef
        total_coef += coef
    return round(total_pts / total_coef, 2) if total_coef else None
