from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required
from sqlalchemy import or_

from extensions import db
from models import Client
import historique

clients_bp = Blueprint("clients", __name__, url_prefix="/clients")


@clients_bp.route("/")
@login_required
def list_clients():
    q = request.args.get("q", "").strip()
    query = Client.query
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Client.nom.ilike(like),
                Client.prenom.ilike(like),
                Client.raison_sociale.ilike(like),
                Client.telephone.ilike(like),
                Client.email.ilike(like),
            )
        )
    clients = query.order_by(Client.nom.asc()).all()
    return render_template("clients/list.html", clients=clients, q=q)


def _fill_client_from_form(client, form):
    client.type_client = form.get("type_client", "particulier")
    client.civilite = form.get("civilite", "")
    client.nom = form.get("nom", "").strip()
    client.prenom = form.get("prenom", "").strip()
    client.raison_sociale = form.get("raison_sociale", "").strip()
    client.siret = form.get("siret", "").strip()
    client.adresse = form.get("adresse", "").strip()
    client.code_postal = form.get("code_postal", "").strip()
    client.ville = form.get("ville", "").strip()
    client.telephone = form.get("telephone", "").strip()
    client.email = form.get("email", "").strip()
    client.notes = form.get("notes", "").strip()


@clients_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_client():
    if request.method == "POST":
        client = Client()
        _fill_client_from_form(client, request.form)
        if not client.nom:
            flash("Le nom du client est obligatoire.", "danger")
            return render_template("clients/form.html", client=client)
        db.session.add(client)
        db.session.flush()
        historique.log("client", client.id, "Création", f"Fiche client créée : {client.nom_affichage}")
        db.session.commit()
        flash("Client créé avec succès.", "success")
        return redirect(url_for("clients.view_client", client_id=client.id))
    return render_template("clients/form.html", client=None)


@clients_bp.route("/<int:client_id>")
@login_required
def view_client(client_id):
    client = Client.query.get_or_404(client_id)
    return render_template("clients/detail.html", client=client, historique=historique.for_entity("client", client_id))


@clients_bp.route("/<int:client_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_client(client_id):
    client = Client.query.get_or_404(client_id)
    if request.method == "POST":
        _fill_client_from_form(client, request.form)
        historique.log("client", client.id, "Modification", "Coordonnées ou informations client mises à jour")
        db.session.commit()
        flash("Client mis à jour.", "success")
        return redirect(url_for("clients.view_client", client_id=client.id))
    return render_template("clients/form.html", client=client)


@clients_bp.route("/<int:client_id>/supprimer", methods=["POST"])
@login_required
def delete_client(client_id):
    client = Client.query.get_or_404(client_id)
    if client.dossiers:
        flash("Impossible de supprimer ce client : des dossiers y sont rattachés.", "danger")
        return redirect(url_for("clients.view_client", client_id=client.id))
    historique.log("client", client.id, "Suppression", f"Fiche client supprimée : {client.nom_affichage}")
    db.session.delete(client)
    db.session.commit()
    flash("Client supprimé.", "info")
    return redirect(url_for("clients.list_clients"))
