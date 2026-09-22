from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required

from extensions import db
from models import Expert
import historique

experts_bp = Blueprint("experts", __name__, url_prefix="/experts")


def _fill(expert, form):
    expert.nom = form.get("nom", "").strip()
    expert.cabinet = form.get("cabinet", "").strip()
    expert.telephone = form.get("telephone", "").strip()
    expert.email = form.get("email", "").strip()
    expert.notes = form.get("notes", "").strip()


@experts_bp.route("/")
@login_required
def list_experts():
    experts = Expert.query.order_by(Expert.nom).all()
    return render_template("experts/list.html", experts=experts)


@experts_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_expert():
    if request.method == "POST":
        expert = Expert()
        _fill(expert, request.form)
        if not expert.nom:
            flash("Le nom de l'expert est obligatoire.", "danger")
            return render_template("experts/form.html", expert=expert)
        db.session.add(expert)
        db.session.flush()
        historique.log("expert", expert.id, "Création", f"Expert ajouté : {expert.nom}")
        db.session.commit()
        flash("Expert ajouté.", "success")
        return redirect(url_for("experts.list_experts"))
    return render_template("experts/form.html", expert=None)


@experts_bp.route("/<int:expert_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_expert(expert_id):
    expert = Expert.query.get_or_404(expert_id)
    if request.method == "POST":
        _fill(expert, request.form)
        historique.log("expert", expert.id, "Modification", "Informations de l'expert mises à jour")
        db.session.commit()
        flash("Expert mis à jour.", "success")
        return redirect(url_for("experts.list_experts"))
    return render_template(
        "experts/form.html", expert=expert, historique=historique.for_entity("expert", expert_id)
    )


@experts_bp.route("/<int:expert_id>/supprimer", methods=["POST"])
@login_required
def delete_expert(expert_id):
    expert = Expert.query.get_or_404(expert_id)
    historique.log("expert", expert.id, "Suppression", f"Expert supprimé : {expert.nom}")
    db.session.delete(expert)
    db.session.commit()
    flash("Expert supprimé.", "info")
    return redirect(url_for("experts.list_experts"))


@experts_bp.route("/api/experts")
@login_required
def api_experts():
    experts = Expert.query.order_by(Expert.nom).all()
    return {
        "experts": [
            {
                "id": e.id,
                "nom": e.nom,
                "cabinet": e.cabinet,
                "telephone": e.telephone,
                "email": e.email,
            }
            for e in experts
        ]
    }
