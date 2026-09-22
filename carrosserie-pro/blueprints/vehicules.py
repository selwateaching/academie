from datetime import datetime

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required

from extensions import db
from models import Vehicule, Client
import historique

vehicules_bp = Blueprint("vehicules", __name__, url_prefix="/vehicules")


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _fill_vehicule_from_form(vehicule, form):
    vehicule.immatriculation = form.get("immatriculation", "").strip().upper()
    vehicule.marque = form.get("marque", "").strip()
    vehicule.modele = form.get("modele", "").strip()
    vehicule.vin = form.get("vin", "").strip().upper()
    vehicule.couleur = form.get("couleur", "").strip()
    vehicule.energie = form.get("energie", "").strip()
    vehicule.date_mise_circulation = _parse_date(form.get("date_mise_circulation"))
    try:
        vehicule.kilometrage = int(form.get("kilometrage") or 0)
    except ValueError:
        vehicule.kilometrage = 0
    vehicule.notes = form.get("notes", "").strip()


@vehicules_bp.route("/")
@login_required
def list_vehicules():
    q = request.args.get("q", "").strip()
    query = Vehicule.query
    if q:
        like = f"%{q}%"
        query = query.filter(
            db.or_(Vehicule.immatriculation.ilike(like), Vehicule.marque.ilike(like), Vehicule.modele.ilike(like), Vehicule.vin.ilike(like))
        )
    vehicules = query.order_by(Vehicule.created_at.desc()).all()
    return render_template("vehicules/list.html", vehicules=vehicules, q=q)


@vehicules_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_vehicule():
    client_id = request.args.get("client_id", type=int) or request.form.get("client_id", type=int)
    if request.method == "POST":
        vehicule = Vehicule(client_id=request.form.get("client_id", type=int))
        _fill_vehicule_from_form(vehicule, request.form)
        if not vehicule.client_id or not vehicule.immatriculation:
            flash("Le client et l'immatriculation sont obligatoires.", "danger")
            clients = Client.query.order_by(Client.nom).all()
            return render_template("vehicules/form.html", vehicule=vehicule, clients=clients)
        db.session.add(vehicule)
        db.session.flush()
        historique.log("vehicule", vehicule.id, "Création", f"Véhicule ajouté : {vehicule.designation}")
        db.session.commit()
        flash("Véhicule ajouté.", "success")
        return redirect(url_for("clients.view_client", client_id=vehicule.client_id))
    clients = Client.query.order_by(Client.nom).all()
    vehicule = Vehicule(client_id=client_id)
    return render_template("vehicules/form.html", vehicule=vehicule, clients=clients)


@vehicules_bp.route("/<int:vehicule_id>")
@login_required
def view_vehicule(vehicule_id):
    vehicule = Vehicule.query.get_or_404(vehicule_id)
    return render_template(
        "vehicules/detail.html", vehicule=vehicule, historique=historique.for_entity("vehicule", vehicule_id)
    )


@vehicules_bp.route("/<int:vehicule_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_vehicule(vehicule_id):
    vehicule = Vehicule.query.get_or_404(vehicule_id)
    if request.method == "POST":
        _fill_vehicule_from_form(vehicule, request.form)
        historique.log("vehicule", vehicule.id, "Modification", "Informations du véhicule mises à jour")
        db.session.commit()
        flash("Véhicule mis à jour.", "success")
        return redirect(url_for("vehicules.view_vehicule", vehicule_id=vehicule.id))
    clients = Client.query.order_by(Client.nom).all()
    return render_template("vehicules/form.html", vehicule=vehicule, clients=clients)


@vehicules_bp.route("/<int:vehicule_id>/supprimer", methods=["POST"])
@login_required
def delete_vehicule(vehicule_id):
    vehicule = Vehicule.query.get_or_404(vehicule_id)
    client_id = vehicule.client_id
    if vehicule.dossiers:
        flash("Impossible de supprimer ce véhicule : des dossiers y sont rattachés.", "danger")
        return redirect(url_for("vehicules.view_vehicule", vehicule_id=vehicule.id))
    historique.log("vehicule", vehicule.id, "Suppression", f"Véhicule supprimé : {vehicule.designation}")
    db.session.delete(vehicule)
    db.session.commit()
    flash("Véhicule supprimé.", "info")
    return redirect(url_for("clients.view_client", client_id=client_id))
