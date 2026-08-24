from datetime import datetime, timedelta

from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()

TRIAL_DAYS = 14
SUBSCRIPTION_DAYS = 30


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), default="")
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
    "students": [],
    "docs": [],
    "progress": [],
    "schedule": [],
    "saved": None,
}
