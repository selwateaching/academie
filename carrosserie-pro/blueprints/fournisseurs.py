from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required

from extensions import db
from models import Fournisseur
import historique

fournisseurs_bp = Blueprint("fournisseurs", __name__, url_prefix="/fournisseurs")


def _fill(fournisseur, form):
    fournisseur.nom = form.get("nom", "").strip()
    fournisseur.adresse = form.get("adresse", "").strip()
    fournisseur.code_postal = form.get("code_postal", "").strip()
    fournisseur.ville = form.get("ville", "").strip()
    fournisseur.telephone = form.get("telephone", "").strip()
    fournisseur.email = form.get("email", "").strip()
    fournisseur.site_web = form.get("site_web", "").strip()
    fournisseur.notes = form.get("notes", "").strip()


@fournisseurs_bp.route("/")
@login_required
def list_fournisseurs():
    fournisseurs = Fournisseur.query.order_by(Fournisseur.nom).all()
    return render_template("fournisseurs/list.html", fournisseurs=fournisseurs)


@fournisseurs_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_fournisseur():
    if request.method == "POST":
        fournisseur = Fournisseur()
        _fill(fournisseur, request.form)
        if not fournisseur.nom:
            flash("Le nom du fournisseur est obligatoire.", "danger")
            return render_template("fournisseurs/form.html", fournisseur=fournisseur)
        db.session.add(fournisseur)
        db.session.flush()
        historique.log("fournisseur", fournisseur.id, "Création", f"Fournisseur ajouté : {fournisseur.nom}")
        db.session.commit()
        flash("Fournisseur ajouté.", "success")
        return redirect(url_for("fournisseurs.list_fournisseurs"))
    return render_template("fournisseurs/form.html", fournisseur=None)


@fournisseurs_bp.route("/<int:fournisseur_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_fournisseur(fournisseur_id):
    fournisseur = Fournisseur.query.get_or_404(fournisseur_id)
    if request.method == "POST":
        _fill(fournisseur, request.form)
        historique.log("fournisseur", fournisseur.id, "Modification", "Informations du fournisseur mises à jour")
        db.session.commit()
        flash("Fournisseur mis à jour.", "success")
        return redirect(url_for("fournisseurs.list_fournisseurs"))
    ordre_statut = {"a_commander": 0, "commandee": 1, "recue": 2, "annulee": 3}
    commandes = sorted(fournisseur.commandes, key=lambda c: (ordre_statut.get(c.statut, 9), -(c.created_at.timestamp() if c.created_at else 0)))
    return render_template(
        "fournisseurs/form.html", fournisseur=fournisseur, commandes=commandes,
        historique=historique.for_entity("fournisseur", fournisseur_id),
    )


@fournisseurs_bp.route("/<int:fournisseur_id>/supprimer", methods=["POST"])
@login_required
def delete_fournisseur(fournisseur_id):
    fournisseur = Fournisseur.query.get_or_404(fournisseur_id)
    if fournisseur.commandes:
        flash("Impossible de supprimer : des commandes référencent ce fournisseur.", "danger")
        return redirect(url_for("fournisseurs.list_fournisseurs"))
    historique.log("fournisseur", fournisseur.id, "Suppression", f"Fournisseur supprimé : {fournisseur.nom}")
    db.session.delete(fournisseur)
    db.session.commit()
    flash("Fournisseur supprimé.", "info")
    return redirect(url_for("fournisseurs.list_fournisseurs"))
