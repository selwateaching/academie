from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required

from extensions import db
from models import CatalogueItem, TYPES_LIGNE

catalogue_bp = Blueprint("catalogue", __name__, url_prefix="/catalogue")


def _fill(item, form):
    item.reference = form.get("reference", "").strip()
    item.designation = form.get("designation", "").strip()
    item.type_ligne = form.get("type_ligne", "piece")
    item.unite = form.get("unite", "u").strip() or "u"
    try:
        item.prix_unitaire_ht = float(form.get("prix_unitaire_ht") or 0)
    except ValueError:
        item.prix_unitaire_ht = 0
    try:
        item.taux_tva = float(form.get("taux_tva") or 20)
    except ValueError:
        item.taux_tva = 20
    item.actif = form.get("actif") == "on"


@catalogue_bp.route("/")
@login_required
def list_catalogue():
    items = CatalogueItem.query.order_by(CatalogueItem.type_ligne, CatalogueItem.designation).all()
    return render_template("catalogue/list.html", items=items, types_ligne=TYPES_LIGNE)


@catalogue_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_item():
    if request.method == "POST":
        item = CatalogueItem(actif=True)
        _fill(item, request.form)
        if not item.designation:
            flash("La désignation est obligatoire.", "danger")
            return render_template("catalogue/form.html", item=item, types_ligne=TYPES_LIGNE)
        db.session.add(item)
        db.session.commit()
        flash("Article ajouté au catalogue.", "success")
        return redirect(url_for("catalogue.list_catalogue"))
    return render_template("catalogue/form.html", item=None, types_ligne=TYPES_LIGNE)


@catalogue_bp.route("/<int:item_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_item(item_id):
    item = CatalogueItem.query.get_or_404(item_id)
    if request.method == "POST":
        _fill(item, request.form)
        db.session.commit()
        flash("Article mis à jour.", "success")
        return redirect(url_for("catalogue.list_catalogue"))
    return render_template("catalogue/form.html", item=item, types_ligne=TYPES_LIGNE)


@catalogue_bp.route("/<int:item_id>/supprimer", methods=["POST"])
@login_required
def delete_item(item_id):
    item = CatalogueItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash("Article supprimé.", "info")
    return redirect(url_for("catalogue.list_catalogue"))


@catalogue_bp.route("/api/items")
@login_required
def api_items():
    items = CatalogueItem.query.filter_by(actif=True).order_by(CatalogueItem.designation).all()
    return {
        "items": [
            {
                "id": i.id,
                "reference": i.reference,
                "designation": i.designation,
                "type_ligne": i.type_ligne,
                "unite": i.unite,
                "prix_unitaire_ht": i.prix_unitaire_ht,
                "taux_tva": i.taux_tva,
            }
            for i in items
        ]
    }
