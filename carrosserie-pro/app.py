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
    Assureur,
    CatalogueItem,
    ModeleCourrier,
    STATUTS_DOSSIER,
)

# Grandes compagnies d'assurance françaises pré-remplies au premier lancement
# (nom uniquement — coordonnées à compléter par l'atelier selon ses propres
# contacts, pour éviter d'afficher des informations inventées).
COMPAGNIES_ASSURANCE_PAR_DEFAUT = [
    "AXA France",
    "Allianz France",
    "MAAF Assurances",
    "MAIF",
    "MACIF",
    "Groupama",
    "GMF",
    "MATMUT",
    "Generali France",
    "MMA",
    "Direct Assurance",
    "Pacifica (Crédit Agricole Assurances)",
    "Sogessur (Société Générale Assurances)",
    "La Banque Postale Assurances IARD",
    "April",
    "Thelem Assurances",
    "SMACL Assurances",
    "Abeille Assurances (ex-Aviva)",
    "Euro Assurance",
    "L'olivier Assurance",
]

# Catalogue de pièces / main d'œuvre / peinture courantes en carrosserie,
# pré-rempli au premier lancement. Prix indicatifs modifiables à tout moment
# depuis l'écran Catalogue.
CATALOGUE_PAR_DEFAUT = [
    # (référence, désignation, type_ligne, unité, prix unitaire HT, taux TVA)
    ("MO-CARR", "Main d'œuvre carrosserie", "main_oeuvre", "h", 60.0, 20),
    ("MO-PEINT", "Main d'œuvre peinture", "peinture", "h", 65.0, 20),
    ("MO-MECA", "Main d'œuvre mécanique", "main_oeuvre", "h", 55.0, 20),
    ("DIAG-ADAS", "Diagnostic électronique / calibrage ADAS", "divers", "forfait", 90.0, 20),
    ("PC-AV", "Pare-chocs avant", "piece", "u", 320.0, 20),
    ("PC-AR", "Pare-chocs arrière", "piece", "u", 300.0, 20),
    ("AILE-AVG", "Aile avant gauche", "piece", "u", 180.0, 20),
    ("AILE-AVD", "Aile avant droite", "piece", "u", 180.0, 20),
    ("AILE-ARG", "Aile arrière gauche", "piece", "u", 200.0, 20),
    ("AILE-ARD", "Aile arrière droite", "piece", "u", 200.0, 20),
    ("PORTE-AVG", "Portière avant gauche", "piece", "u", 450.0, 20),
    ("PORTE-AVD", "Portière avant droite", "piece", "u", 450.0, 20),
    ("PORTE-ARG", "Portière arrière gauche", "piece", "u", 420.0, 20),
    ("PORTE-ARD", "Portière arrière droite", "piece", "u", 420.0, 20),
    ("CAPOT", "Capot moteur", "piece", "u", 380.0, 20),
    ("HAYON", "Hayon / coffre arrière", "piece", "u", 400.0, 20),
    ("OPTIQUE-AV", "Optique de phare avant", "piece", "u", 250.0, 20),
    ("FEU-AR", "Feu arrière", "piece", "u", 150.0, 20),
    ("RETRO", "Rétroviseur extérieur", "piece", "u", 120.0, 20),
    ("PB-GLACE", "Pare-brise (remplacement)", "piece", "u", 450.0, 20),
    ("VITRE-LAT", "Vitre latérale", "piece", "u", 180.0, 20),
    ("CALANDRE", "Calandre / grille de calandre", "piece", "u", 90.0, 20),
    ("RADIATEUR", "Radiateur", "piece", "u", 220.0, 20),
    ("FORF-PEINT-EL", "Peinture élément (forfait)", "peinture", "forfait", 180.0, 20),
    ("VERNIS", "Vernis / finition", "peinture", "forfait", 60.0, 20),
    ("DEBOS-SP", "Débosselage sans peinture", "forfait", "forfait", 120.0, 20),
    ("FOURN", "Petites fournitures / consommables", "fourniture", "forfait", 35.0, 20),
]

# Modèles de courriers prêts à l'emploi, pré-remplis au premier lancement.
# Librement modifiables depuis l'écran Courriers. Les jetons {{variable}}
# sont remplacés automatiquement par les informations du dossier choisi.
MODELES_COURRIER_PAR_DEFAUT = [
    (
        "Envoi de devis",
        "Votre devis {{devis_numero}} — {{entreprise_nom}}",
        "{{client_nom}},\n\n"
        "Veuillez trouver ci-joint notre devis {{devis_numero}} d'un montant de "
        "{{devis_total_ttc}} concernant la réparation de votre véhicule "
        "{{vehicule_designation}}.\n\n"
        "N'hésitez pas à nous contacter pour toute question.\n\n"
        "Cordialement,\n{{entreprise_nom}}\n{{entreprise_telephone}}",
    ),
    (
        "Relance de paiement",
        "Relance — Facture {{facture_numero}} impayée",
        "{{client_nom}},\n\n"
        "Sauf erreur de notre part, la facture {{facture_numero}} d'un montant de "
        "{{facture_total_ttc}} (reste dû : {{facture_reste_a_payer}}) demeure impayée à ce jour.\n\n"
        "Nous vous remercions de bien vouloir procéder à son règlement dans les meilleurs délais.\n\n"
        "Cordialement,\n{{entreprise_nom}}",
    ),
    (
        "Convocation à l'expertise",
        "Convocation expertise — dossier {{dossier_reference}}",
        "{{client_nom}},\n\n"
        "Votre véhicule {{vehicule_designation}} sera examiné par l'expert {{expert_nom}} "
        "({{expert_cabinet}}) dans le cadre du dossier {{dossier_reference}} "
        "(sinistre n° {{dossier_numero_sinistre}}).\n\n"
        "Merci de vous assurer que le véhicule est disponible pour cette expertise.\n\n"
        "Cordialement,\n{{entreprise_nom}}",
    ),
    (
        "Véhicule prêt — fin de réparation",
        "Votre véhicule est prêt — dossier {{dossier_reference}}",
        "{{client_nom}},\n\n"
        "Nous avons le plaisir de vous informer que votre véhicule {{vehicule_designation}} "
        "est prêt. Vous pouvez venir le récupérer à l'atelier aux horaires habituels.\n\n"
        "Cordialement,\n{{entreprise_nom}}\n{{entreprise_telephone}}",
    ),
    (
        "Demande de pièces complémentaires (assurance)",
        "Pièces complémentaires — sinistre {{dossier_numero_sinistre}}",
        "{{assureur_nom}},\n\n"
        "Dans le cadre du dossier {{dossier_reference}} (sinistre n° {{dossier_numero_sinistre}}, "
        "police n° {{dossier_numero_police}}) concernant le véhicule {{vehicule_designation}} "
        "de {{client_nom}}, merci de bien vouloir nous transmettre les pièces complémentaires "
        "nécessaires au traitement du dossier.\n\n"
        "Cordialement,\n{{entreprise_nom}}",
    ),
]


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
    from blueprints.experts import experts_bp
    from blueprints.catalogue import catalogue_bp
    from blueprints.dossiers import dossiers_bp
    from blueprints.devis import devis_bp
    from blueprints.factures import factures_bp
    from blueprints.courriers import courriers_bp
    from blueprints.planning import planning_bp
    from blueprints.settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(vehicules_bp)
    app.register_blueprint(assureurs_bp)
    app.register_blueprint(experts_bp)
    app.register_blueprint(catalogue_bp)
    app.register_blueprint(dossiers_bp)
    app.register_blueprint(devis_bp)
    app.register_blueprint(factures_bp)
    app.register_blueprint(courriers_bp)
    app.register_blueprint(planning_bp)
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
    """Crée l'entreprise par défaut. Synchronise le compte administrateur avec
    ADMIN_EMAIL/ADMIN_PASSWORD à CHAQUE démarrage (pas seulement au premier),
    pour que changer ces variables d'environnement fonctionne toujours, même
    si un compte existait déjà avec d'anciennes valeurs."""
    Entreprise.current()

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@macarrosserie.fr").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "change-moi-1234").strip()
    admin_name = os.environ.get("ADMIN_NAME", "Administrateur").strip()

    from sqlalchemy import func

    admin = User.query.filter(func.lower(User.email) == admin_email).first()
    if admin is None:
        admin = User(email=admin_email, role="admin")
        db.session.add(admin)
    admin.name = admin_name
    admin.role = "admin"
    admin.active = True
    admin.set_password(admin_password)

    if Assureur.query.count() == 0:
        for nom in COMPAGNIES_ASSURANCE_PAR_DEFAUT:
            db.session.add(Assureur(nom=nom))

    if ModeleCourrier.query.count() == 0:
        for nom, objet, corps in MODELES_COURRIER_PAR_DEFAUT:
            db.session.add(ModeleCourrier(nom=nom, objet=objet, corps=corps))

    if CatalogueItem.query.count() == 0:
        for ref, designation, type_ligne, unite, prix, tva in CATALOGUE_PAR_DEFAUT:
            db.session.add(
                CatalogueItem(
                    reference=ref,
                    designation=designation,
                    type_ligne=type_ligne,
                    unite=unite,
                    prix_unitaire_ht=prix,
                    taux_tva=tva,
                    actif=True,
                )
            )

    db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_ENV") == "development", port=5050)
