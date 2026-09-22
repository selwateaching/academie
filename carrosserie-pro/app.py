import os
from datetime import date

from flask import Flask, render_template, redirect, url_for
from flask_login import login_required, current_user
from dotenv import load_dotenv

load_dotenv()

from config import Config
from extensions import db, login_manager, csrf
from models import (
    User,
    Entreprise,
    Client,
    Vehicule,
    Dossier,
    Devis,
    Facture,
    STATUTS_DOSSIER,
)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    from blueprints.auth import auth_bp
    from blueprints.clients import clients_bp
    from blueprints.vehicules import vehicules_bp
    from blueprints.assureurs import assureurs_bp
    from blueprints.catalogue import catalogue_bp
    from blueprints.dossiers import dossiers_bp
    from blueprints.devis import devis_bp
    from blueprints.factures import factures_bp
    from blueprints.settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(vehicules_bp)
    app.register_blueprint(assureurs_bp)
    app.register_blueprint(catalogue_bp)
    app.register_blueprint(dossiers_bp)
    app.register_blueprint(devis_bp)
    app.register_blueprint(factures_bp)
    app.register_blueprint(settings_bp)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    @app.context_processor
    def inject_globals():
        return {"today": date.today()}

    with app.app_context():
        db.create_all()
        _bootstrap()

    @app.route("/")
    @login_required
    def index():
        return redirect(url_for("main.dashboard"))

    from blueprints.main import main_bp

    app.register_blueprint(main_bp)

    return app


def _bootstrap():
    """Crée l'entreprise par défaut et le compte administrateur au premier lancement."""
    Entreprise.current()

    if User.query.count() == 0:
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@macarrosserie.fr").strip().lower()
        admin_password = os.environ.get("ADMIN_PASSWORD", "change-moi-1234").strip()
        admin_name = os.environ.get("ADMIN_NAME", "Administrateur")
        admin = User(email=admin_email, name=admin_name, role="admin")
        admin.set_password(admin_password)
        db.session.add(admin)
        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_ENV") == "development", port=5050)
