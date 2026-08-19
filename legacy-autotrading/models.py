from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()


class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True)
    source = db.Column(db.String(50), nullable=False, default='Particulier')
    email_id = db.Column(db.String(255), unique=True, nullable=True)
    subject = db.Column(db.String(500), nullable=True)
    received_at = db.Column(db.DateTime, nullable=True)
    brand = db.Column(db.String(100), nullable=True)
    model = db.Column(db.String(100), nullable=True)
    motorization = db.Column(db.String(50), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    km = db.Column(db.Integer, nullable=True)
    price_asked = db.Column(db.Float, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    raw_text = db.Column(db.Text, nullable=True)
    analyzed_at = db.Column(db.DateTime, nullable=True)

    analyses = db.relationship('Analysis', backref='vehicle', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'source': self.source,
            'email_id': self.email_id,
            'subject': self.subject,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'brand': self.brand,
            'model': self.model,
            'motorization': self.motorization,
            'year': self.year,
            'km': self.km,
            'price_asked': self.price_asked,
            'location': self.location,
            'analyzed_at': self.analyzed_at.isoformat() if self.analyzed_at else None,
        }


class Analysis(db.Model):
    __tablename__ = 'analyses'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    decision = db.Column(db.String(20), nullable=False)  # ACHETER / À ÉTUDIER / REFUSER
    score = db.Column(db.Integer, nullable=False, default=0)
    buy_price = db.Column(db.Float, nullable=True)
    resell_price = db.Column(db.Float, nullable=True)
    estimated_fees = db.Column(db.Float, nullable=True)
    net_margin = db.Column(db.Float, nullable=True)
    risk_level = db.Column(db.String(20), nullable=True)  # Faible / Moyen / Élevé
    _strengths = db.Column('strengths', db.Text, nullable=True)
    _weaknesses = db.Column('weaknesses', db.Text, nullable=True)
    summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def strengths(self):
        if self._strengths:
            try:
                return json.loads(self._strengths)
            except Exception:
                return []
        return []

    @strengths.setter
    def strengths(self, value):
        self._strengths = json.dumps(value) if value is not None else None

    @property
    def weaknesses(self):
        if self._weaknesses:
            try:
                return json.loads(self._weaknesses)
            except Exception:
                return []
        return []

    @weaknesses.setter
    def weaknesses(self, value):
        self._weaknesses = json.dumps(value) if value is not None else None

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'decision': self.decision,
            'score': self.score,
            'buy_price': self.buy_price,
            'resell_price': self.resell_price,
            'estimated_fees': self.estimated_fees,
            'net_margin': self.net_margin,
            'risk_level': self.risk_level,
            'strengths': self.strengths,
            'weaknesses': self.weaknesses,
            'summary': self.summary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class OAuthToken(db.Model):
    __tablename__ = 'oauth_tokens'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    access_token = db.Column(db.Text, nullable=False)
    refresh_token = db.Column(db.Text, nullable=True)
    token_expiry = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def is_expired(self):
        if not self.token_expiry:
            return True
        return datetime.utcnow() >= self.token_expiry
