from datetime import date, timedelta

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required
from sqlalchemy import func

from extensions import db
from models import Technicien, PointageTemps
import historique

techniciens_bp = Blueprint("techniciens", __name__, url_prefix="/techniciens")

STATUTS_DOSSIER_ACTIFS = ("nouveau", "devis_envoye", "attente_accord_assurance", "accepte", "en_reparation")


@techniciens_bp.route("/")
@login_required
def list_techniciens():
    techniciens = Technicien.query.order_by(Technicien.actif.desc(), Technicien.nom).all()
    debut_mois = date.today().replace(day=1)
    charges = []
    for t in techniciens:
        dossiers_actifs = [d for d in t.dossiers_assignes if d.statut in STATUTS_DOSSIER_ACTIFS]
        heures_mois = (
            db.session.query(func.coalesce(func.sum(PointageTemps.duree_heures), 0.0))
            .filter(PointageTemps.technicien_id == t.id, PointageTemps.date_intervention >= debut_mois)
            .scalar()
        )
        charges.append({"technicien": t, "dossiers_actifs": len(dossiers_actifs), "heures_mois": heures_mois})
    return render_template("techniciens/list.html", charges=charges)


@techniciens_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_technicien():
    if request.method == "POST":
        technicien = Technicien(
            nom=request.form.get("nom", "").strip(),
            specialite=request.form.get("specialite", "").strip(),
            telephone=request.form.get("telephone", "").strip(),
            email=request.form.get("email", "").strip(),
            actif=request.form.get("actif") == "on",
        )
        if not technicien.nom:
            flash("Le nom du technicien est obligatoire.", "danger")
            return render_template("techniciens/form.html", technicien=None)
        db.session.add(technicien)
        db.session.flush()
        historique.log("technicien", technicien.id, "Création", f"Technicien {technicien.nom} ajouté")
        db.session.commit()
        flash("Technicien ajouté.", "success")
        return redirect(url_for("techniciens.list_techniciens"))
    return render_template("techniciens/form.html", technicien=None)


@techniciens_bp.route("/<int:technicien_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_technicien(technicien_id):
    technicien = Technicien.query.get_or_404(technicien_id)
    if request.method == "POST":
        technicien.nom = request.form.get("nom", "").strip()
        technicien.specialite = request.form.get("specialite", "").strip()
        technicien.telephone = request.form.get("telephone", "").strip()
        technicien.email = request.form.get("email", "").strip()
        technicien.actif = request.form.get("actif") == "on"
        historique.log("technicien", technicien.id, "Modification", f"Technicien {technicien.nom} mis à jour")
        db.session.commit()
        flash("Technicien mis à jour.", "success")
        return redirect(url_for("techniciens.list_techniciens"))
    return render_template(
        "techniciens/form.html", technicien=technicien,
        historique=historique.for_entity("technicien", technicien.id),
    )


@techniciens_bp.route("/<int:technicien_id>/supprimer", methods=["POST"])
@login_required
def delete_technicien(technicien_id):
    technicien = Technicien.query.get_or_404(technicien_id)
    nom = technicien.nom
    db.session.delete(technicien)
    db.session.commit()
    flash(f"Technicien « {nom} » supprimé.", "info")
    return redirect(url_for("techniciens.list_techniciens"))
