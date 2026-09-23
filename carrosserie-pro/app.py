import os
from datetime import date

from flask import Flask, render_template, redirect, url_for
from flask_login import login_required, current_user
from dotenv import load_dotenv
from sqlalchemy import inspect, text

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
    FAQ,
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

# Base de connaissances de l'assistant d'aide, pré-remplie au premier
# lancement. Modifiable et complétable depuis l'écran Aide & FAQ.
FAQ_PAR_DEFAUT = [
    (
        "prise_en_main",
        "Dans quel ordre faut-il créer les choses ?",
        "L'ordre logique est : Client → Véhicule (rattaché à ce client) → Dossier "
        "(rattaché au client et à son véhicule). Une fois le dossier créé, tout le "
        "reste (devis, factures, photos, pointages, pièces, fiches peinture, "
        "planning) se fait depuis la fiche du dossier.",
        "ordre etapes debuter demarrer commencer",
    ),
    (
        "dossiers",
        "Comment créer un dossier ?",
        "Menu « Dossiers » → « Nouveau dossier ». Choisissez le client, puis son "
        "véhicule (le menu véhicule ne se remplit qu'après avoir choisi le client, "
        "patientez une seconde), renseignez le type de sinistre/intervention et "
        "une description, puis « Enregistrer ». Le dossier apparaît immédiatement "
        "dans le Planning atelier, même sans devis.",
        "creer dossier nouveau",
    ),
    (
        "dossiers",
        "Pourquoi mon dossier ne se crée pas ?",
        "La cause la plus fréquente : le véhicule sélectionné n'appartient pas au "
        "client choisi, ou le menu « Véhicule » n'a pas eu le temps de se charger "
        "après avoir choisi le client (il affiche alors « Sélectionnez d'abord un "
        "client »). Attendez que le nom du véhicule apparaisse dans ce menu avant "
        "de cliquer sur Enregistrer. Si un message orange/rouge apparaît en haut "
        "de la page après avoir cliqué sur Enregistrer, lisez-le : il indique "
        "précisément ce qui manque.",
        "probleme bug erreur ne fonctionne pas rien",
    ),
    (
        "planning",
        "Comment fonctionne le Planning atelier ?",
        "Le Planning atelier a deux vues, accessibles par les onglets en haut de "
        "la page. « Tableau (statuts) » est une vue automatique de tous les "
        "dossiers, organisés en colonnes selon leur statut (Nouveau, Devis "
        "envoyé, Attente accord assurance, Accepté, En réparation, Terminé, "
        "Facturé, Soldé, Annulé) : faites glisser une carte vers une autre "
        "colonne pour changer son statut. « Calendrier (carrossiers) » est un "
        "vrai planning hebdomadaire avec les jours en colonnes et un carrossier "
        "par ligne, pour planifier des créneaux horaires précis — voir la "
        "question suivante.",
        "kanban glisser deposer deplacer statut colonne carte",
    ),
    (
        "planning",
        "Comment planifier un créneau avec un carrossier (jour/heure) ?",
        "Allez dans « Planning atelier » → onglet « Calendrier (carrossiers) ». "
        "Cliquez sur le « + » dans la case du carrossier et du jour souhaités "
        "(ou sur « Planifier un créneau » en haut, ou depuis la fiche d'un "
        "dossier, bouton « Planifier »). Choisissez le dossier, le carrossier, "
        "la date et les heures de début/fin, puis « Enregistrer ». Le créneau "
        "apparaît alors dans la case correspondante du calendrier et sur la "
        "fiche du dossier ; cliquez dessus pour le modifier ou le supprimer.",
        "creneau carrossier calendrier horaire jour heure assigner planifier",
    ),
    (
        "devis_factures",
        "Le devis est-il adressé au client ou à l'expert ?",
        "Le devis (PDF) est toujours établi au nom du client, propriétaire du "
        "véhicule. Pour le transmettre à l'expert ou à l'assureur pour validation, "
        "utilisez le bouton « Envoyer à l'expert » sur la fiche devis, ou le "
        "sélecteur « Destinataire » (Client / Expert / Assureur) dans le module "
        "Courriers — l'email correspondant doit être renseigné sur le dossier.",
        "expert assureur destinataire envoyer qui",
    ),
    (
        "devis_factures",
        "Comment transformer un devis en facture ?",
        "Depuis la fiche du devis, cliquez sur « Transformer en facture ». La "
        "facture reprend automatiquement toutes les lignes du devis, et répartit "
        "le montant entre client et assureur si une franchise est renseignée sur "
        "le dossier.",
        "facturer generer facture",
    ),
    (
        "signature",
        "Comment faire signer un devis électroniquement ?",
        "Sur la fiche du devis, cliquez sur « Générer un lien de signature ». "
        "Copiez le lien et envoyez-le au client (par email, SMS...). Il pourra "
        "consulter le devis et signer avec le doigt ou la souris, sans avoir "
        "besoin de compte. Une fois signé, le devis passe automatiquement au "
        "statut « Accepté » et la signature apparaît sur la fiche devis et le PDF.",
        "signer electronique lien",
    ),
    (
        "courriers",
        "Comment envoyer un courrier (email) depuis un dossier ?",
        "Depuis la fiche du dossier, cliquez sur « Courrier ». Choisissez le "
        "destinataire (Client/Expert/Assureur), éventuellement un modèle de "
        "lettre prêt à l'emploi, puis « Envoyer par email ». Si l'envoi direct "
        "n'est pas configuré sur le serveur, utilisez « Ouvrir dans ma messagerie » "
        "ou « Copier le texte ».",
        "email lettre modele envoyer",
    ),
    (
        "atelier",
        "Comment assigner un technicien et pointer son temps ?",
        "Ajoutez d'abord vos techniciens dans le menu « Techniciens ». Sur la "
        "fiche d'un dossier, choisissez le technicien assigné (dans le formulaire "
        "du dossier), puis utilisez la section « Pointages du temps » de la fiche "
        "dossier pour enregistrer les heures passées par intervention.",
        "technicien pointage heures temps assigner",
    ),
    (
        "atelier",
        "Comment suivre les commandes de pièces ?",
        "Ajoutez vos fournisseurs dans le menu « Fournisseurs ». Sur la fiche "
        "d'un dossier, section « Commandes de pièces », ajoutez chaque pièce "
        "nécessaire avec son fournisseur et son prix. Changez son statut (à "
        "commander / commandée / reçue) au fur et à mesure — une alerte apparaît "
        "sur le dossier et sur sa carte du planning tant que des pièces manquent.",
        "piece fournisseur commande stock",
    ),
    (
        "atelier",
        "Comment relier une commande passée sur le site d'un fournisseur ?",
        "Sur la fiche du dossier, section « Commandes de pièces », chaque pièce a "
        "un champ « N° ou lien de la commande » : collez-y le numéro de commande "
        "ou le lien de confirmation du site du fournisseur, puis cliquez sur ✓ "
        "pour l'enregistrer. Si c'est un lien, un bouton permet de l'ouvrir "
        "directement ; cette référence est aussi visible depuis la fiche du "
        "fournisseur. Il ne s'agit pas d'une synchronisation automatique — sans "
        "accès API fourni par le site, il n'existe aucun moyen fiable de "
        "récupérer les commandes toutes seules ; ce champ sert à garder le lien "
        "manuellement, en quelques secondes.",
        "site web fournisseur commander synchronisation lien numero api",
    ),
    (
        "atelier",
        "Comment enregistrer une fiche peinture ?",
        "Renseignez d'abord la teinte d'origine du véhicule (code constructeur, "
        "nom de couleur) sur sa fiche véhicule. Puis, sur la fiche du dossier, "
        "section « Fiches peinture », ajoutez la formule de mélange utilisée pour "
        "cette réparation (fabricant, éléments peints, quantité).",
        "peinture teinte formule couleur",
    ),
    (
        "photos",
        "Comment ajouter des photos à un dossier ?",
        "Sur la fiche du dossier, section « Photos », choisissez un fichier "
        "(JPG, PNG, WEBP ou GIF, 15 Mo max), indiquez si c'est une photo « avant » "
        "ou « après » réparation, ajoutez une légende décrivant la zone/le "
        "dommage, puis « Ajouter ».",
        "photo image upload avant apres",
    ),
    (
        "dashboard",
        "Que signifient les couleurs du tableau de bord ?",
        "Vert = bon signe (CA positif, délai court, taux d'acceptation élevé). "
        "Orange = à surveiller. Rouge = alerte (factures impayées, dossiers en "
        "retard, taux d'acceptation faible). Les chiffres se mettent à jour en "
        "temps réel selon vos dossiers, devis et factures.",
        "couleur kpi indicateur statistique",
    ),
    (
        "clients_vehicules",
        "Comment ajouter un client professionnel avec SIRET ?",
        "Menu « Clients » → « Nouveau client », choisissez le type « Professionnel » "
        "pour faire apparaître les champs Raison sociale et SIRET.",
        "professionnel entreprise siret",
    ),
]


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    os.makedirs(app.config["UPLOAD_DIR"], exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    from blueprints.auth import auth_bp
    from blueprints.clients import clients_bp
    from blueprints.vehicules import vehicules_bp
    from blueprints.assureurs import assureurs_bp
    from blueprints.experts import experts_bp
    from blueprints.techniciens import techniciens_bp
    from blueprints.fournisseurs import fournisseurs_bp
    from blueprints.catalogue import catalogue_bp
    from blueprints.dossiers import dossiers_bp
    from blueprints.devis import devis_bp
    from blueprints.factures import factures_bp
    from blueprints.courriers import courriers_bp
    from blueprints.planning import planning_bp
    from blueprints.faq import faq_bp
    from blueprints.settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(vehicules_bp)
    app.register_blueprint(assureurs_bp)
    app.register_blueprint(experts_bp)
    app.register_blueprint(techniciens_bp)
    app.register_blueprint(fournisseurs_bp)
    app.register_blueprint(catalogue_bp)
    app.register_blueprint(dossiers_bp)
    app.register_blueprint(devis_bp)
    app.register_blueprint(factures_bp)
    app.register_blueprint(courriers_bp)
    app.register_blueprint(planning_bp)
    app.register_blueprint(faq_bp)
    app.register_blueprint(settings_bp)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    @app.context_processor
    def inject_globals():
        return {"today": date.today()}

    with app.app_context():
        db.create_all()
        _sync_schema()
        _bootstrap()

    @app.route("/")
    @login_required
    def index():
        return redirect(url_for("main.dashboard"))

    from blueprints.main import main_bp

    app.register_blueprint(main_bp)

    return app


def _sync_schema():
    """Ajoute les colonnes manquantes aux tables déjà existantes.

    db.create_all() crée uniquement les tables absentes : quand un champ est
    ajouté à un modèle dont la table existe déjà en base (cas courant en
    production, sans outil de migration), la colonne manque et toute requête
    sur cette table plante. On la rattrape ici avec un ALTER TABLE ciblé."""
    inspector = inspect(db.engine)
    table_names = set(inspector.get_table_names())
    for table in db.metadata.sorted_tables:
        if table.name not in table_names:
            continue
        colonnes_existantes = {c["name"] for c in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in colonnes_existantes:
                continue
            ddl = f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {column.type.compile(dialect=db.engine.dialect)}'
            default = column.default
            if default is not None and not callable(default.arg) and isinstance(default.arg, (str, int, float, bool)):
                valeur = default.arg
                if isinstance(valeur, bool):
                    ddl += f" DEFAULT {str(valeur).upper()}"
                elif isinstance(valeur, str):
                    ddl += f" DEFAULT '{valeur}'"
                else:
                    ddl += f" DEFAULT {valeur}"
            with db.engine.connect() as conn:
                conn.execute(text(ddl))
                conn.commit()


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

    if FAQ.query.count() == 0:
        for categorie, question, reponse, mots_cles in FAQ_PAR_DEFAUT:
            db.session.add(FAQ(categorie=categorie, question=question, reponse=reponse, mots_cles=mots_cles))

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
