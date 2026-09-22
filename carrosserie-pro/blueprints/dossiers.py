from datetime import datetime, date

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required

from extensions import db
from models import (
    Dossier,
    Client,
    Vehicule,
    Assureur,
    Counter,
    STATUTS_DOSSIER,
    TYPES_SINISTRE,
)

dossiers_bp = Blueprint("dossiers", __name__, url_prefix="/dossiers")


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _parse_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _fill_dossier_from_form(dossier, form):
    dossier.type_sinistre = form.get("type_sinistre", "hors_assurance")
    dossier.date_sinistre = _parse_date(form.get("date_sinistre"))
    dossier.description = form.get("description", "").strip()

    if dossier.type_sinistre == "hors_assurance":
        dossier.assureur_id = None
        dossier.numero_sinistre = ""
        dossier.numero_police = ""
        dossier.nom_assure = ""
        dossier.franchise_montant = 0.0
        dossier.cession_de_creance = False
        dossier.expert_nom = ""
        dossier.expert_cabinet = ""
        dossier.expert_telephone = ""
        dossier.expert_email = ""
        dossier.date_expertise = None
        dossier.rapport_expertise_reference = ""
    else:
        dossier.assureur_id = form.get("assureur_id", type=int) or None
        dossier.numero_sinistre = form.get("numero_sinistre", "").strip()
        dossier.numero_police = form.get("numero_police", "").strip()
        dossier.nom_assure = form.get("nom_assure", "").strip()
        dossier.franchise_montant = _parse_float(form.get("franchise_montant"), 0.0)
        dossier.cession_de_creance = form.get("cession_de_creance") == "on"
        dossier.expert_nom = form.get("expert_nom", "").strip()
        dossier.expert_cabinet = form.get("expert_cabinet", "").strip()
        dossier.expert_telephone = form.get("expert_telephone", "").strip()
        dossier.expert_email = form.get("expert_email", "").strip()
        dossier.date_expertise = _parse_date(form.get("date_expertise"))
        dossier.rapport_expertise_reference = form.get("rapport_expertise_reference", "").strip()

    dossier.vehicule_pret = form.get("vehicule_pret") == "on"
    dossier.date_entree_atelier = _parse_date(form.get("date_entree_atelier"))
    dossier.date_sortie_prevue = _parse_date(form.get("date_sortie_prevue"))
    dossier.date_sortie_reelle = _parse_date(form.get("date_sortie_reelle"))
    dossier.notes = form.get("notes", "").strip()


@dossiers_bp.route("/")
@login_required
def list_dossiers():
    statut = request.args.get("statut", "")
    query = Dossier.query
    if statut:
        query = query.filter_by(statut=statut)
    dossiers = query.order_by(Dossier.created_at.desc()).all()
    return render_template("dossiers/list.html", dossiers=dossiers, statuts=STATUTS_DOSSIER, statut_filtre=statut)


@dossiers_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_dossier():
    client_id = request.args.get("client_id", type=int)

    if request.method == "POST":
        client_id = request.form.get("client_id", type=int)
        vehicule_id = request.form.get("vehicule_id", type=int)
        client = Client.query.get(client_id) if client_id else None
        vehicule = Vehicule.query.get(vehicule_id) if vehicule_id else None

        if not client or not vehicule or vehicule.client_id != client.id:
            flash("Merci de sélectionner un client et l'un de ses véhicules.", "danger")
            clients = Client.query.order_by(Client.nom).all()
            assureurs = Assureur.query.order_by(Assureur.nom).all()
            return render_template(
                "dossiers/form.html",
                dossier=None,
                clients=clients,
                assureurs=assureurs,
                types_sinistre=TYPES_SINISTRE,
                selected_client_id=client_id,
            )

        dossier = Dossier(client_id=client.id, vehicule_id=vehicule.id, statut="nouveau")
        dossier.reference = Counter.next_number("dossier", "OR")
        _fill_dossier_from_form(dossier, request.form)
        db.session.add(dossier)
        db.session.commit()
        flash(f"Dossier {dossier.reference} créé.", "success")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))

    clients = Client.query.order_by(Client.nom).all()
    assureurs = Assureur.query.order_by(Assureur.nom).all()
    return render_template(
        "dossiers/form.html",
        dossier=None,
        clients=clients,
        assureurs=assureurs,
        types_sinistre=TYPES_SINISTRE,
        selected_client_id=client_id,
    )


@dossiers_bp.route("/<int:dossier_id>")
@login_required
def view_dossier(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    return render_template("dossiers/detail.html", dossier=dossier, statuts=STATUTS_DOSSIER)


@dossiers_bp.route("/<int:dossier_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_dossier(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    if request.method == "POST":
        _fill_dossier_from_form(dossier, request.form)
        db.session.commit()
        flash("Dossier mis à jour.", "success")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))
    clients = Client.query.order_by(Client.nom).all()
    assureurs = Assureur.query.order_by(Assureur.nom).all()
    return render_template(
        "dossiers/form.html",
        dossier=dossier,
        clients=clients,
        assureurs=assureurs,
        types_sinistre=TYPES_SINISTRE,
        selected_client_id=dossier.client_id,
    )


@dossiers_bp.route("/<int:dossier_id>/statut", methods=["POST"])
@login_required
def change_statut(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    statut = request.form.get("statut")
    if statut in dict(STATUTS_DOSSIER):
        dossier.statut = statut
        db.session.commit()
        flash("Statut du dossier mis à jour.", "success")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))


@dossiers_bp.route("/<int:dossier_id>/supprimer", methods=["POST"])
@login_required
def delete_dossier(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    if dossier.factures:
        flash("Impossible de supprimer un dossier facturé. Utilisez plutôt un avoir.", "danger")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))
    db.session.delete(dossier)
    db.session.commit()
    flash("Dossier supprimé.", "info")
    return redirect(url_for("dossiers.list_dossiers"))


@dossiers_bp.route("/api/vehicules/<int:client_id>")
@login_required
def api_vehicules_client(client_id):
    vehicules = Vehicule.query.filter_by(client_id=client_id).all()
    return {"vehicules": [{"id": v.id, "designation": v.designation} for v in vehicules]}
