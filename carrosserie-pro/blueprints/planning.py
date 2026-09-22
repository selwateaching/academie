from datetime import date

from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required

from extensions import db
from models import Dossier, STATUTS_DOSSIER
import historique

planning_bp = Blueprint("planning", __name__, url_prefix="/planning")


@planning_bp.route("/")
@login_required
def board():
    dossiers = Dossier.query.order_by(Dossier.date_sortie_prevue.asc().nulls_last(), Dossier.created_at.desc()).all()
    colonnes = []
    for code, label in STATUTS_DOSSIER:
        colonnes.append({"code": code, "label": label, "dossiers": [d for d in dossiers if d.statut == code]})
    return render_template("planning/board.html", colonnes=colonnes, today=date.today())


@planning_bp.route("/deplacer/<int:dossier_id>", methods=["POST"])
@login_required
def deplacer(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    statut = request.form.get("statut")
    if statut not in dict(STATUTS_DOSSIER):
        return jsonify({"ok": False, "erreur": "Statut invalide."}), 400
    ancien_libelle = dossier.statut_libelle
    dossier.statut = statut
    historique.log("dossier", dossier.id, "Changement de statut", f"{ancien_libelle} → {dossier.statut_libelle} (planning)")
    db.session.commit()
    return jsonify({"ok": True, "statut_libelle": dossier.statut_libelle})
