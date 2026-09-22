from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required

from extensions import db
from models import Assureur

assureurs_bp = Blueprint("assureurs", __name__, url_prefix="/assureurs")


def _fill(assureur, form):
    assureur.nom = form.get("nom", "").strip()
    assureur.adresse = form.get("adresse", "").strip()
    assureur.code_postal = form.get("code_postal", "").strip()
    assureur.ville = form.get("ville", "").strip()
    assureur.telephone = form.get("telephone", "").strip()
    assureur.email = form.get("email", "").strip()
    assureur.email_gestion_sinistres = form.get("email_gestion_sinistres", "").strip()
    assureur.reseau_agree = form.get("reseau_agree") == "on"
    assureur.notes = form.get("notes", "").strip()


@assureurs_bp.route("/")
@login_required
def list_assureurs():
    assureurs = Assureur.query.order_by(Assureur.nom).all()
    return render_template("assureurs/list.html", assureurs=assureurs)


@assureurs_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_assureur():
    if request.method == "POST":
        assureur = Assureur()
        _fill(assureur, request.form)
        if not assureur.nom:
            flash("Le nom de la compagnie est obligatoire.", "danger")
            return render_template("assureurs/form.html", assureur=assureur)
        db.session.add(assureur)
        db.session.commit()
        flash("Compagnie d'assurance ajoutée.", "success")
        return redirect(url_for("assureurs.list_assureurs"))
    return render_template("assureurs/form.html", assureur=None)


@assureurs_bp.route("/<int:assureur_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_assureur(assureur_id):
    assureur = Assureur.query.get_or_404(assureur_id)
    if request.method == "POST":
        _fill(assureur, request.form)
        db.session.commit()
        flash("Compagnie mise à jour.", "success")
        return redirect(url_for("assureurs.list_assureurs"))
    return render_template("assureurs/form.html", assureur=assureur)


@assureurs_bp.route("/<int:assureur_id>/supprimer", methods=["POST"])
@login_required
def delete_assureur(assureur_id):
    assureur = Assureur.query.get_or_404(assureur_id)
    if assureur.dossiers:
        flash("Impossible de supprimer : des dossiers référencent cette compagnie.", "danger")
        return redirect(url_for("assureurs.list_assureurs"))
    db.session.delete(assureur)
    db.session.commit()
    flash("Compagnie supprimée.", "info")
    return redirect(url_for("assureurs.list_assureurs"))
