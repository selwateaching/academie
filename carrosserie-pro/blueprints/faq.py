from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_required

from extensions import db
from models import FAQ, CATEGORIES_FAQ
from faq_search import rechercher
import historique

faq_bp = Blueprint("faq", __name__, url_prefix="/aide")


@faq_bp.route("/")
@login_required
def list_faq():
    faqs = FAQ.query.order_by(FAQ.categorie, FAQ.question).all()
    return render_template("faq/list.html", faqs=faqs, categories=CATEGORIES_FAQ)


@faq_bp.route("/nouvelle", methods=["GET", "POST"])
@login_required
def new_faq():
    if request.method == "POST":
        entry = FAQ(
            question=request.form.get("question", "").strip(),
            reponse=request.form.get("reponse", "").strip(),
            mots_cles=request.form.get("mots_cles", "").strip(),
            categorie=request.form.get("categorie") if request.form.get("categorie") in dict(CATEGORIES_FAQ) else "autre",
        )
        if not entry.question or not entry.reponse:
            flash("La question et la réponse sont obligatoires.", "danger")
            return render_template("faq/form.html", faq=None, categories=CATEGORIES_FAQ)
        db.session.add(entry)
        db.session.flush()
        historique.log("faq", entry.id, "Création", f"Question ajoutée : {entry.question}")
        db.session.commit()
        flash("Question ajoutée à l'aide.", "success")
        return redirect(url_for("faq.list_faq"))
    return render_template("faq/form.html", faq=None, categories=CATEGORIES_FAQ)


@faq_bp.route("/<int:faq_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_faq(faq_id):
    entry = FAQ.query.get_or_404(faq_id)
    if request.method == "POST":
        entry.question = request.form.get("question", "").strip()
        entry.reponse = request.form.get("reponse", "").strip()
        entry.mots_cles = request.form.get("mots_cles", "").strip()
        entry.categorie = request.form.get("categorie") if request.form.get("categorie") in dict(CATEGORIES_FAQ) else "autre"
        historique.log("faq", entry.id, "Modification", f"Question mise à jour : {entry.question}")
        db.session.commit()
        flash("Question mise à jour.", "success")
        return redirect(url_for("faq.list_faq"))
    return render_template(
        "faq/form.html", faq=entry, categories=CATEGORIES_FAQ,
        historique=historique.for_entity("faq", entry.id),
    )


@faq_bp.route("/<int:faq_id>/supprimer", methods=["POST"])
@login_required
def delete_faq(faq_id):
    entry = FAQ.query.get_or_404(faq_id)
    question = entry.question
    db.session.delete(entry)
    db.session.commit()
    flash(f"Question « {question} » supprimée.", "info")
    return redirect(url_for("faq.list_faq"))


@faq_bp.route("/rechercher")
@login_required
def rechercher_faq():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"resultats": []})
    faqs = FAQ.query.all()
    meilleures = rechercher(q, faqs, limite=3)
    return jsonify({
        "resultats": [
            {"id": f.id, "question": f.question, "reponse": f.reponse, "categorie": f.categorie_libelle}
            for f in meilleures
        ]
    })
