from datetime import datetime, date

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


# ──────────────────────────────────────────────────────────────────────────
# Utilisateurs
# ──────────────────────────────────────────────────────────────────────────
class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), default="admin")  # admin, atelier, compta
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_active(self):
        return self.active


# ──────────────────────────────────────────────────────────────────────────
# Réglages de l'entreprise (fiche unique — informations légales carrossier)
# ──────────────────────────────────────────────────────────────────────────
class Entreprise(db.Model):
    __tablename__ = "entreprise"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), default="Ma Carrosserie")
    forme_juridique = db.Column(db.String(100), default="SARL")
    adresse = db.Column(db.String(255), default="")
    code_postal = db.Column(db.String(10), default="")
    ville = db.Column(db.String(100), default="")
    telephone = db.Column(db.String(30), default="")
    email = db.Column(db.String(255), default="")
    site_web = db.Column(db.String(255), default="")

    siret = db.Column(db.String(20), default="")
    rcs_ville = db.Column(db.String(100), default="")
    tva_intracom = db.Column(db.String(30), default="")
    capital_social = db.Column(db.String(50), default="")
    code_ape = db.Column(db.String(10), default="")

    # Régime de TVA — impacte la mention légale à afficher sur les devis/factures
    franchise_en_base_tva = db.Column(db.Boolean, default=False)

    # Agréments professionnels carrosserie (affichés en pied de document)
    assurance_rc_pro = db.Column(db.String(255), default="")
    assurance_decennale = db.Column(db.String(255), default="")
    agrement_qualirepar = db.Column(db.Boolean, default=False)
    agrements_assureurs = db.Column(db.Text, default="")  # ex: liste des réseaux agréés

    # Coordonnées bancaires (RIB affiché sur les factures)
    iban = db.Column(db.String(50), default="")
    bic = db.Column(db.String(20), default="")

    # Paramètres par défaut de facturation
    taux_horaire_mo = db.Column(db.Float, default=60.0)      # €/h main d'œuvre
    taux_tva_defaut = db.Column(db.Float, default=20.0)
    delai_paiement_jours = db.Column(db.Integer, default=30)
    validite_devis_jours = db.Column(db.Integer, default=30)
    taux_penalite_retard = db.Column(db.Float, default=10.0)  # % annuel, min. légal = 3x taux BCE
    indemnite_recouvrement = db.Column(db.Float, default=40.0)  # € — forfait légal art. L441-10 C.com

    mentions_devis = db.Column(db.Text, default="")
    mentions_facture = db.Column(db.Text, default="")
    conditions_generales = db.Column(db.Text, default="")

    logo_filename = db.Column(db.String(255), default="")

    @classmethod
    def current(cls):
        entreprise = cls.query.first()
        if entreprise is None:
            entreprise = cls()
            db.session.add(entreprise)
            db.session.commit()
        return entreprise


# ──────────────────────────────────────────────────────────────────────────
# Compteur de numérotation légale (séquentielle, sans trou, par exercice)
# ──────────────────────────────────────────────────────────────────────────
class Counter(db.Model):
    __tablename__ = "counters"

    id = db.Column(db.Integer, primary_key=True)
    kind = db.Column(db.String(30), nullable=False)   # devis, facture, avoir
    year = db.Column(db.Integer, nullable=False)
    last_value = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint("kind", "year", name="uq_counter_kind_year"),)

    @classmethod
    def next_number(cls, kind, prefix, year=None):
        year = year or date.today().year
        counter = cls.query.filter_by(kind=kind, year=year).with_for_update(read=False).first()
        if counter is None:
            counter = cls(kind=kind, year=year, last_value=0)
            db.session.add(counter)
            db.session.flush()
        counter.last_value += 1
        db.session.flush()
        return f"{prefix}-{year}-{counter.last_value:04d}"


# ──────────────────────────────────────────────────────────────────────────
# Compagnies d'assurance (référentiel)
# ──────────────────────────────────────────────────────────────────────────
class Assureur(db.Model):
    __tablename__ = "assureurs"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), nullable=False)
    adresse = db.Column(db.String(255), default="")
    code_postal = db.Column(db.String(10), default="")
    ville = db.Column(db.String(100), default="")
    telephone = db.Column(db.String(30), default="")
    email = db.Column(db.String(255), default="")
    email_gestion_sinistres = db.Column(db.String(255), default="")
    reseau_agree = db.Column(db.Boolean, default=False)  # carrossier agréé par ce réseau
    notes = db.Column(db.Text, default="")

    dossiers = db.relationship("Dossier", back_populates="assureur")

    def __repr__(self):
        return self.nom


# ──────────────────────────────────────────────────────────────────────────
# Experts (cabinets d'expertise automobile) — référentiel réutilisable pour
# pré-remplir rapidement les informations expert d'un dossier.
# ──────────────────────────────────────────────────────────────────────────
class Expert(db.Model):
    __tablename__ = "experts"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), nullable=False)
    cabinet = db.Column(db.String(255), default="")
    telephone = db.Column(db.String(30), default="")
    email = db.Column(db.String(255), default="")
    notes = db.Column(db.Text, default="")

    def __repr__(self):
        return self.nom


class Technicien(db.Model):
    __tablename__ = "techniciens"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), nullable=False)
    specialite = db.Column(db.String(100), default="")  # carrosserie, peinture, mécanique...
    telephone = db.Column(db.String(30), default="")
    email = db.Column(db.String(255), default="")
    actif = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return self.nom


class PointageTemps(db.Model):
    __tablename__ = "pointages_temps"

    id = db.Column(db.Integer, primary_key=True)
    dossier_id = db.Column(db.Integer, db.ForeignKey("dossiers.id"), nullable=False)
    technicien_id = db.Column(db.Integer, db.ForeignKey("techniciens.id"), nullable=False)
    date_intervention = db.Column(db.Date, default=date.today)
    duree_heures = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    dossier = db.relationship("Dossier", backref=db.backref("pointages", cascade="all, delete-orphan", order_by="PointageTemps.date_intervention.desc()"))
    technicien = db.relationship("Technicien", backref=db.backref("pointages", cascade="all, delete-orphan"))


class Fournisseur(db.Model):
    __tablename__ = "fournisseurs"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), nullable=False)
    adresse = db.Column(db.String(255), default="")
    code_postal = db.Column(db.String(10), default="")
    ville = db.Column(db.String(100), default="")
    telephone = db.Column(db.String(30), default="")
    email = db.Column(db.String(255), default="")
    notes = db.Column(db.Text, default="")

    def __repr__(self):
        return self.nom


STATUTS_COMMANDE = [
    ("a_commander", "À commander"),
    ("commandee", "Commandée"),
    ("recue", "Reçue"),
    ("annulee", "Annulée"),
]


class CommandePiece(db.Model):
    __tablename__ = "commandes_pieces"

    id = db.Column(db.Integer, primary_key=True)
    dossier_id = db.Column(db.Integer, db.ForeignKey("dossiers.id"), nullable=False)
    fournisseur_id = db.Column(db.Integer, db.ForeignKey("fournisseurs.id"), nullable=True)

    designation = db.Column(db.String(255), nullable=False)
    reference = db.Column(db.String(100), default="")
    quantite = db.Column(db.Float, default=1.0)
    prix_unitaire_ht = db.Column(db.Float, default=0.0)

    statut = db.Column(db.String(20), default="a_commander")
    date_commande = db.Column(db.Date, nullable=True)
    date_reception_prevue = db.Column(db.Date, nullable=True)
    date_reception_reelle = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    dossier = db.relationship("Dossier", backref=db.backref("commandes_pieces", cascade="all, delete-orphan", order_by="CommandePiece.created_at.desc()"))
    fournisseur = db.relationship("Fournisseur", backref="commandes")

    @property
    def statut_libelle(self):
        return dict(STATUTS_COMMANDE).get(self.statut, self.statut)

    @property
    def total_ht(self):
        return (self.quantite or 0) * (self.prix_unitaire_ht or 0)


class FicheTeinte(db.Model):
    """Fiche peinture d'une intervention : formule de mélange utilisée pour
    cette réparation. Le code teinte constructeur du véhicule est stocké
    sur Vehicule (référence stable) ; ici on consigne la formule et les
    éléments effectivement peints pour cette intervention précise."""

    __tablename__ = "fiches_teinte"

    id = db.Column(db.Integer, primary_key=True)
    dossier_id = db.Column(db.Integer, db.ForeignKey("dossiers.id"), nullable=False)

    fabricant_peinture = db.Column(db.String(100), default="")  # Glasurit, Standox, PPG, Sikkens...
    formule = db.Column(db.Text, default="")  # formule de mélange (issue du logiciel teinte)
    elements_peints = db.Column(db.String(255), default="")  # ex: aile AVG, portière AVG
    quantite_g = db.Column(db.Float, nullable=True)
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    dossier = db.relationship("Dossier", backref=db.backref("fiches_teinte", cascade="all, delete-orphan", order_by="FicheTeinte.created_at.desc()"))


TYPES_PHOTO = [
    ("avant", "Avant réparation"),
    ("apres", "Après réparation"),
    ("autre", "Autre"),
]


class Photo(db.Model):
    __tablename__ = "photos"

    id = db.Column(db.Integer, primary_key=True)
    dossier_id = db.Column(db.Integer, db.ForeignKey("dossiers.id"), nullable=False)

    filename = db.Column(db.String(255), nullable=False)  # nom de fichier stocké sur disque
    nom_original = db.Column(db.String(255), default="")
    type_photo = db.Column(db.String(20), default="avant")
    legende = db.Column(db.Text, default="")  # annotation / description de la photo
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    dossier = db.relationship("Dossier", backref=db.backref("photos", cascade="all, delete-orphan", order_by="Photo.created_at.desc()"))

    @property
    def type_photo_libelle(self):
        return dict(TYPES_PHOTO).get(self.type_photo, self.type_photo)


# ──────────────────────────────────────────────────────────────────────────
# Clients
# ──────────────────────────────────────────────────────────────────────────
class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True)
    type_client = db.Column(db.String(20), default="particulier")  # particulier | professionnel
    civilite = db.Column(db.String(10), default="")  # M. / Mme
    nom = db.Column(db.String(255), nullable=False)
    prenom = db.Column(db.String(255), default="")
    raison_sociale = db.Column(db.String(255), default="")
    siret = db.Column(db.String(20), default="")

    adresse = db.Column(db.String(255), default="")
    code_postal = db.Column(db.String(10), default="")
    ville = db.Column(db.String(100), default="")

    telephone = db.Column(db.String(30), default="")
    email = db.Column(db.String(255), default="")
    notes = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicules = db.relationship("Vehicule", back_populates="client", cascade="all, delete-orphan")
    dossiers = db.relationship("Dossier", back_populates="client")

    @property
    def nom_affichage(self):
        if self.type_client == "professionnel" and self.raison_sociale:
            return self.raison_sociale
        civ = f"{self.civilite} " if self.civilite else ""
        return f"{civ}{self.prenom} {self.nom}".strip()

    @property
    def adresse_complete(self):
        return ", ".join(p for p in [self.adresse, f"{self.code_postal} {self.ville}".strip()] if p.strip())


# ──────────────────────────────────────────────────────────────────────────
# Véhicules
# ──────────────────────────────────────────────────────────────────────────
COULEURS_VEHICULE = [
    "Blanc", "Noir", "Gris", "Argent", "Rouge", "Bleu", "Vert", "Jaune",
    "Orange", "Marron", "Beige", "Violet", "Rose", "Doré", "Bronze",
    "Cuivre", "Autre",
]

FINITIONS_VEHICULE = [
    "Unie", "Métallisée", "Nacrée", "Mate", "Brillante", "Satinée",
    "Bi-ton", "Personnalisée",
]


class Vehicule(db.Model):
    __tablename__ = "vehicules"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=False)

    immatriculation = db.Column(db.String(20), nullable=False)
    marque = db.Column(db.String(100), default="")
    modele = db.Column(db.String(100), default="")
    vin = db.Column(db.String(50), default="")  # numéro de série / châssis
    couleur = db.Column(db.String(50), default="")
    energie = db.Column(db.String(30), default="")  # essence, diesel, électrique, hybride...
    date_mise_circulation = db.Column(db.Date, nullable=True)
    kilometrage = db.Column(db.Integer, default=0)

    # Peinture d'origine (constructeur) — sert de référence pour toute fiche teinte future
    code_teinte = db.Column(db.String(50), default="")  # code peinture constructeur
    teinte_nom = db.Column(db.String(100), default="")  # nom commercial de la couleur
    type_finition = db.Column(db.String(30), default="")  # unie, métallisée, nacrée, mate

    notes = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    client = db.relationship("Client", back_populates="vehicules")
    dossiers = db.relationship("Dossier", back_populates="vehicule")

    @property
    def designation(self):
        return f"{self.marque} {self.modele} — {self.immatriculation}".strip()


# ──────────────────────────────────────────────────────────────────────────
# Dossier de réparation (sinistre ou intervention hors assurance)
# ──────────────────────────────────────────────────────────────────────────
STATUTS_DOSSIER = [
    ("nouveau", "Nouveau"),
    ("devis_envoye", "Devis envoyé"),
    ("attente_accord_assurance", "Attente accord assurance"),
    ("accepte", "Accepté / à planifier"),
    ("en_reparation", "En réparation"),
    ("termine", "Travaux terminés"),
    ("facture", "Facturé"),
    ("solde", "Soldé"),
    ("annule", "Annulé"),
]

TYPES_SINISTRE = [
    ("hors_assurance", "Hors assurance (client direct)"),
    ("collision", "Collision / accident"),
    ("bris_de_glace", "Bris de glace"),
    ("vol", "Vol / tentative de vol"),
    ("incendie", "Incendie"),
    ("catastrophe_naturelle", "Catastrophe naturelle"),
    ("vandalisme", "Vandalisme"),
    ("autre", "Autre"),
]


class Dossier(db.Model):
    __tablename__ = "dossiers"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(30), unique=True)  # ex: OR-2026-0001

    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=False)
    vehicule_id = db.Column(db.Integer, db.ForeignKey("vehicules.id"), nullable=False)

    statut = db.Column(db.String(40), default="nouveau")
    type_sinistre = db.Column(db.String(30), default="hors_assurance")
    date_ouverture = db.Column(db.Date, default=date.today)
    date_sinistre = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, default="")

    # Bloc assurance
    assureur_id = db.Column(db.Integer, db.ForeignKey("assureurs.id"), nullable=True)
    numero_sinistre = db.Column(db.String(50), default="")
    numero_police = db.Column(db.String(50), default="")
    nom_assure = db.Column(db.String(255), default="")  # si différent du client (ex: tiers)
    franchise_montant = db.Column(db.Float, default=0.0)
    cession_de_creance = db.Column(db.Boolean, default=False)  # assureur règle directement le garage

    # Expert
    expert_nom = db.Column(db.String(255), default="")
    expert_cabinet = db.Column(db.String(255), default="")
    expert_telephone = db.Column(db.String(30), default="")
    expert_email = db.Column(db.String(255), default="")
    date_expertise = db.Column(db.Date, nullable=True)
    rapport_expertise_reference = db.Column(db.String(100), default="")

    # Logistique atelier
    vehicule_pret = db.Column(db.Boolean, default=False)
    date_entree_atelier = db.Column(db.Date, nullable=True)
    date_sortie_prevue = db.Column(db.Date, nullable=True)
    date_sortie_reelle = db.Column(db.Date, nullable=True)
    technicien_id = db.Column(db.Integer, db.ForeignKey("techniciens.id"), nullable=True)

    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = db.relationship("Client", back_populates="dossiers")
    vehicule = db.relationship("Vehicule", back_populates="dossiers")
    assureur = db.relationship("Assureur", back_populates="dossiers")
    technicien = db.relationship("Technicien", foreign_keys=[technicien_id], backref="dossiers_assignes")
    devis = db.relationship("Devis", back_populates="dossier", cascade="all, delete-orphan")
    factures = db.relationship("Facture", back_populates="dossier", cascade="all, delete-orphan")

    @property
    def statut_libelle(self):
        return dict(STATUTS_DOSSIER).get(self.statut, self.statut)

    @property
    def type_sinistre_libelle(self):
        return dict(TYPES_SINISTRE).get(self.type_sinistre, self.type_sinistre)

    @property
    def est_assurance(self):
        return self.type_sinistre != "hors_assurance"


# ──────────────────────────────────────────────────────────────────────────
# Catalogue (pièces, main d'œuvre, forfaits, peinture...)
# ──────────────────────────────────────────────────────────────────────────
TYPES_LIGNE = [
    ("piece", "Pièce détachée"),
    ("main_oeuvre", "Main d'œuvre"),
    ("peinture", "Peinture / carrosserie"),
    ("fourniture", "Fourniture / petit matériel"),
    ("forfait", "Forfait"),
    ("divers", "Divers"),
]


class CatalogueItem(db.Model):
    __tablename__ = "catalogue_items"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(50), default="")
    designation = db.Column(db.String(255), nullable=False)
    type_ligne = db.Column(db.String(20), default="piece")
    unite = db.Column(db.String(20), default="u")  # u, h, forfait
    prix_unitaire_ht = db.Column(db.Float, default=0.0)
    taux_tva = db.Column(db.Float, default=20.0)
    actif = db.Column(db.Boolean, default=True)

    @property
    def type_ligne_libelle(self):
        return dict(TYPES_LIGNE).get(self.type_ligne, self.type_ligne)


class ModeleCourrier(db.Model):
    __tablename__ = "modeles_courrier"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), nullable=False)
    objet = db.Column(db.String(255), default="")
    corps = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


CATEGORIES_FAQ = [
    ("prise_en_main", "Prise en main"),
    ("clients_vehicules", "Clients & véhicules"),
    ("dossiers", "Dossiers"),
    ("planning", "Planning atelier"),
    ("devis_factures", "Devis & factures"),
    ("signature", "Signature électronique"),
    ("courriers", "Courriers"),
    ("atelier", "Techniciens, pièces & peinture"),
    ("photos", "Photos"),
    ("dashboard", "Tableau de bord"),
    ("autre", "Autre"),
]


class FAQ(db.Model):
    """Base de connaissances de l'assistant d'aide intégré (chat flottant).
    La recherche se fait par correspondance de mots-clés simple, sans
    dépendance externe (pas d'IA/API tierce)."""

    __tablename__ = "faq"

    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(255), nullable=False)
    reponse = db.Column(db.Text, nullable=False)
    mots_cles = db.Column(db.String(500), default="")  # mots supplémentaires pour la recherche
    categorie = db.Column(db.String(30), default="autre")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def categorie_libelle(self):
        return dict(CATEGORIES_FAQ).get(self.categorie, self.categorie)


# ──────────────────────────────────────────────────────────────────────────
# Lignes communes (utilisées par Devis et Facture)
# ──────────────────────────────────────────────────────────────────────────
class LigneMixin:
    ordre = db.Column(db.Integer, default=0)
    reference = db.Column(db.String(50), default="")
    designation = db.Column(db.String(255), nullable=False)
    type_ligne = db.Column(db.String(20), default="piece")
    unite = db.Column(db.String(20), default="u")
    quantite = db.Column(db.Float, default=1.0)
    prix_unitaire_ht = db.Column(db.Float, default=0.0)
    remise_pourcentage = db.Column(db.Float, default=0.0)
    taux_tva = db.Column(db.Float, default=20.0)

    @property
    def total_ht(self):
        return round(self.quantite * self.prix_unitaire_ht * (1 - (self.remise_pourcentage or 0) / 100), 2)

    @property
    def total_tva(self):
        return round(self.total_ht * (self.taux_tva or 0) / 100, 2)

    @property
    def total_ttc(self):
        return round(self.total_ht + self.total_tva, 2)


def _totaux(lignes):
    """Retourne (total_ht, total_tva, total_ttc, repartition_par_taux) pour une liste de lignes."""
    total_ht = round(sum(l.total_ht for l in lignes), 2)
    total_tva = round(sum(l.total_tva for l in lignes), 2)
    total_ttc = round(total_ht + total_tva, 2)
    par_taux = {}
    for l in lignes:
        taux = l.taux_tva or 0
        d = par_taux.setdefault(taux, {"base_ht": 0.0, "tva": 0.0})
        d["base_ht"] += l.total_ht
        d["tva"] += l.total_tva
    for taux in par_taux:
        par_taux[taux]["base_ht"] = round(par_taux[taux]["base_ht"], 2)
        par_taux[taux]["tva"] = round(par_taux[taux]["tva"], 2)
    return total_ht, total_tva, total_ttc, par_taux


# ──────────────────────────────────────────────────────────────────────────
# Devis
# ──────────────────────────────────────────────────────────────────────────
STATUTS_DEVIS = [
    ("brouillon", "Brouillon"),
    ("envoye", "Envoyé"),
    ("accepte", "Accepté"),
    ("refuse", "Refusé"),
    ("expire", "Expiré"),
    ("facture", "Facturé"),
]


class Devis(db.Model):
    __tablename__ = "devis"

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(30), unique=True, nullable=False)
    dossier_id = db.Column(db.Integer, db.ForeignKey("dossiers.id"), nullable=False)

    statut = db.Column(db.String(20), default="brouillon")
    date_emission = db.Column(db.Date, default=date.today)
    validite_jours = db.Column(db.Integer, default=30)

    remise_globale_pourcentage = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text, default="")
    conditions = db.Column(db.Text, default="")

    # Signature électronique
    signature_token = db.Column(db.String(64), unique=True, nullable=True)
    signature_data = db.Column(db.Text, nullable=True)  # image PNG encodée en base64 (data URL)
    signature_nom = db.Column(db.String(255), default="")
    signature_date = db.Column(db.DateTime, nullable=True)
    signature_ip = db.Column(db.String(64), default="")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dossier = db.relationship("Dossier", back_populates="devis")
    lignes = db.relationship(
        "DevisLigne", back_populates="devis", cascade="all, delete-orphan", order_by="DevisLigne.ordre"
    )
    factures = db.relationship("Facture", back_populates="devis")

    @property
    def statut_libelle(self):
        return dict(STATUTS_DEVIS).get(self.statut, self.statut)

    @property
    def totaux(self):
        return _totaux(self.lignes)

    @property
    def total_ttc(self):
        return self.totaux[2]

    @property
    def date_limite_validite(self):
        if not self.date_emission:
            return None
        from datetime import timedelta

        return self.date_emission + timedelta(days=self.validite_jours or 30)

    @property
    def est_signe(self):
        return bool(self.signature_data)


class DevisLigne(db.Model, LigneMixin):
    __tablename__ = "devis_lignes"

    id = db.Column(db.Integer, primary_key=True)
    devis_id = db.Column(db.Integer, db.ForeignKey("devis.id"), nullable=False)
    devis = db.relationship("Devis", back_populates="lignes")


# ──────────────────────────────────────────────────────────────────────────
# Factures
# ──────────────────────────────────────────────────────────────────────────
STATUTS_FACTURE = [
    ("emise", "Émise"),
    ("envoyee", "Envoyée"),
    ("partiellement_payee", "Partiellement payée"),
    ("payee", "Payée"),
    ("en_retard", "En retard"),
    ("annulee", "Annulée (avoir émis)"),
]

DESTINATAIRES_FACTURE = [
    ("client", "Client (paiement intégral par le client)"),
    ("assureur", "Compagnie d'assurance (cession de créance)"),
    ("mixte", "Mixte — part assurance + part client (franchise)"),
]


class Facture(db.Model):
    __tablename__ = "factures"

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(30), unique=True, nullable=False)
    dossier_id = db.Column(db.Integer, db.ForeignKey("dossiers.id"), nullable=False)
    devis_id = db.Column(db.Integer, db.ForeignKey("devis.id"), nullable=True)

    statut = db.Column(db.String(30), default="emise")
    est_avoir = db.Column(db.Boolean, default=False)
    facture_origine_id = db.Column(db.Integer, db.ForeignKey("factures.id"), nullable=True)

    date_emission = db.Column(db.Date, default=date.today)
    date_echeance = db.Column(db.Date, nullable=True)

    destinataire_type = db.Column(db.String(20), default="client")
    montant_franchise_client = db.Column(db.Float, default=0.0)

    mode_reglement = db.Column(db.String(50), default="")
    notes = db.Column(db.Text, default="")
    conditions = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dossier = db.relationship("Dossier", back_populates="factures")
    devis = db.relationship("Devis", back_populates="factures")
    lignes = db.relationship(
        "FactureLigne", back_populates="facture", cascade="all, delete-orphan", order_by="FactureLigne.ordre"
    )
    paiements = db.relationship("Paiement", back_populates="facture", cascade="all, delete-orphan")
    avoirs = db.relationship("Facture", backref=db.backref("origine", remote_side=[id]))

    @property
    def statut_libelle(self):
        return dict(STATUTS_FACTURE).get(self.statut, self.statut)

    @property
    def destinataire_libelle(self):
        return dict(DESTINATAIRES_FACTURE).get(self.destinataire_type, self.destinataire_type)

    @property
    def totaux(self):
        return _totaux(self.lignes)

    @property
    def total_ttc(self):
        signe = -1 if self.est_avoir else 1
        return round(self.totaux[2] * signe, 2)

    @property
    def total_paye(self):
        return round(sum(p.montant for p in self.paiements), 2)

    @property
    def reste_a_payer(self):
        return round(self.total_ttc - self.total_paye, 2)

    @property
    def montant_part_assurance(self):
        if self.destinataire_type == "client":
            return 0.0
        return round(self.total_ttc - (self.montant_franchise_client or 0), 2)

    @property
    def montant_part_client(self):
        if self.destinataire_type == "assureur":
            return 0.0
        if self.destinataire_type == "mixte":
            return round(self.montant_franchise_client or 0, 2)
        return self.total_ttc


class FactureLigne(db.Model, LigneMixin):
    __tablename__ = "facture_lignes"

    id = db.Column(db.Integer, primary_key=True)
    facture_id = db.Column(db.Integer, db.ForeignKey("factures.id"), nullable=False)
    facture = db.relationship("Facture", back_populates="lignes")


# ──────────────────────────────────────────────────────────────────────────
# Paiements
# ──────────────────────────────────────────────────────────────────────────
MODES_PAIEMENT = [
    ("virement", "Virement bancaire"),
    ("cb", "Carte bancaire"),
    ("cheque", "Chèque"),
    ("especes", "Espèces"),
    ("prelevement", "Prélèvement assurance"),
]


class Paiement(db.Model):
    __tablename__ = "paiements"

    id = db.Column(db.Integer, primary_key=True)
    facture_id = db.Column(db.Integer, db.ForeignKey("factures.id"), nullable=False)
    date_paiement = db.Column(db.Date, default=date.today)
    montant = db.Column(db.Float, nullable=False)
    mode = db.Column(db.String(30), default="virement")
    reference = db.Column(db.String(100), default="")
    origine = db.Column(db.String(20), default="client")  # client | assureur
    notes = db.Column(db.Text, default="")

    facture = db.relationship("Facture", back_populates="paiements")

    @property
    def mode_libelle(self):
        return dict(MODES_PAIEMENT).get(self.mode, self.mode)


# ──────────────────────────────────────────────────────────────────────────
# Historique (journal d'audit) — tracé générique par type d'entité + id,
# sans clé étrangère stricte pour rester valide même après suppression de
# l'enregistrement concerné.
# ──────────────────────────────────────────────────────────────────────────
class Historique(db.Model):
    __tablename__ = "historique"

    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(30), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    user_name = db.Column(db.String(255), default="")
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.Index("ix_historique_entity", "entity_type", "entity_id"),
    )
