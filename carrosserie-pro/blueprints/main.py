from datetime import date, timedelta

from flask import Blueprint, render_template
from flask_login import login_required
from sqlalchemy import func, extract

from extensions import db
from models import Client, Vehicule, Dossier, Devis, Facture, STATUTS_DOSSIER

main_bp = Blueprint("main", __name__)


@main_bp.route("/dashboard")
@login_required
def dashboard():
    today = date.today()

    total_clients = Client.query.count()
    total_vehicules = Vehicule.query.count()

    dossiers_ouverts = Dossier.query.filter(
        Dossier.statut.notin_(["termine", "facture", "solde", "annule"])
    ).count()

    devis_en_attente = Devis.query.filter_by(statut="envoye").count()
    devis_brouillon = Devis.query.filter_by(statut="brouillon").count()

    factures_impayees = Facture.query.filter(
        Facture.statut.in_(["emise", "envoyee", "partiellement_payee", "en_retard"]),
        Facture.est_avoir.is_(False),
    ).all()
    montant_impaye = round(sum(f.reste_a_payer for f in factures_impayees), 2)

    factures_mois = Facture.query.filter(
        extract("year", Facture.date_emission) == today.year,
        extract("month", Facture.date_emission) == today.month,
        Facture.est_avoir.is_(False),
    ).all()
    ca_mois = round(sum(f.totaux[2] for f in factures_mois), 2)

    dossiers_recents = Dossier.query.order_by(Dossier.created_at.desc()).limit(8).all()
    devis_recents = Devis.query.order_by(Devis.created_at.desc()).limit(6).all()
    factures_recentes = Facture.query.filter_by(est_avoir=False).order_by(Facture.created_at.desc()).limit(6).all()

    relances = [f for f in factures_impayees if f.date_echeance and f.date_echeance < today]

    par_statut = {}
    for code, label in STATUTS_DOSSIER:
        par_statut[code] = {"label": label, "count": Dossier.query.filter_by(statut=code).count()}

    return render_template(
        "dashboard.html",
        total_clients=total_clients,
        total_vehicules=total_vehicules,
        dossiers_ouverts=dossiers_ouverts,
        devis_en_attente=devis_en_attente,
        devis_brouillon=devis_brouillon,
        montant_impaye=montant_impaye,
        nb_factures_impayees=len(factures_impayees),
        ca_mois=ca_mois,
        dossiers_recents=dossiers_recents,
        devis_recents=devis_recents,
        factures_recentes=factures_recentes,
        relances=relances,
        par_statut=par_statut,
    )
