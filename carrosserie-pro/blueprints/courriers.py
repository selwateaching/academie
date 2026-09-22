from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required

from extensions import db
from models import ModeleCourrier, Dossier, Devis, Facture, Entreprise
from blueprints.dossiers import search_dossiers
from courrier_merge import build_context, fusionner, variables_disponibles
from mailer import envoyer_email, smtp_configure
import historique

courriers_bp = Blueprint("courriers", __name__, url_prefix="/courriers")


@courriers_bp.route("/")
@login_required
def list_courriers():
    modeles = ModeleCourrier.query.order_by(ModeleCourrier.nom).all()
    return render_template("courriers/list.html", modeles=modeles, smtp_configure=smtp_configure())


@courriers_bp.route("/modeles/nouveau", methods=["GET", "POST"])
@login_required
def new_modele():
    if request.method == "POST":
        modele = ModeleCourrier(
            nom=request.form.get("nom", "").strip(),
            objet=request.form.get("objet", "").strip(),
            corps=request.form.get("corps", "").strip(),
        )
        if not modele.nom:
            flash("Le nom du modèle est obligatoire.", "danger")
            return render_template("courriers/form.html", modele=None, variables=variables_disponibles())
        db.session.add(modele)
        db.session.flush()
        historique.log("courrier", modele.id, "Création", f"Modèle « {modele.nom} » créé")
        db.session.commit()
        flash("Modèle de courrier créé.", "success")
        return redirect(url_for("courriers.list_courriers"))
    return render_template("courriers/form.html", modele=None, variables=variables_disponibles())


@courriers_bp.route("/modeles/<int:modele_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_modele(modele_id):
    modele = ModeleCourrier.query.get_or_404(modele_id)
    if request.method == "POST":
        modele.nom = request.form.get("nom", "").strip()
        modele.objet = request.form.get("objet", "").strip()
        modele.corps = request.form.get("corps", "").strip()
        historique.log("courrier", modele.id, "Modification", f"Modèle « {modele.nom} » mis à jour")
        db.session.commit()
        flash("Modèle mis à jour.", "success")
        return redirect(url_for("courriers.list_courriers"))
    return render_template(
        "courriers/form.html", modele=modele, variables=variables_disponibles(),
        historique=historique.for_entity("courrier", modele.id),
    )


@courriers_bp.route("/modeles/<int:modele_id>/supprimer", methods=["POST"])
@login_required
def delete_modele(modele_id):
    modele = ModeleCourrier.query.get_or_404(modele_id)
    nom = modele.nom
    db.session.delete(modele)
    db.session.commit()
    flash(f"Modèle « {nom} » supprimé.", "info")
    return redirect(url_for("courriers.list_courriers"))


@courriers_bp.route("/rediger")
@login_required
def choisir_dossier():
    dossier_id = request.args.get("dossier_id", type=int)
    if dossier_id:
        return redirect(url_for("courriers.rediger", dossier_id=dossier_id))
    q = request.args.get("q", "").strip()
    return render_template(
        "_choisir_dossier.html",
        dossiers=search_dossiers(q),
        q=q,
        titre="Nouveau courrier — choisir un dossier",
        cible_endpoint="courriers.rediger",
    )


@courriers_bp.route("/rediger/<int:dossier_id>")
@login_required
def rediger(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    entreprise = Entreprise.current()
    modeles = ModeleCourrier.query.order_by(ModeleCourrier.nom).all()

    modele_id = request.args.get("modele_id", type=int)
    devis_id = request.args.get("devis_id", type=int)
    facture_id = request.args.get("facture_id", type=int)

    devis = Devis.query.get(devis_id) if devis_id else None
    facture = Facture.query.get(facture_id) if facture_id else None
    contexte = build_context(dossier, entreprise, devis=devis, facture=facture)

    objet, corps = "", ""
    modele_actif = None
    if modele_id:
        modele_actif = ModeleCourrier.query.get(modele_id)
        if modele_actif:
            objet = fusionner(modele_actif.objet, contexte)
            corps = fusionner(modele_actif.corps, contexte)

    return render_template(
        "courriers/rediger.html",
        dossier=dossier,
        modeles=modeles,
        modele_actif=modele_actif,
        devis=devis,
        facture=facture,
        objet=objet,
        corps=corps,
        destinataire=dossier.client.email or "",
        smtp_configure=smtp_configure(),
    )


@courriers_bp.route("/rediger/<int:dossier_id>/envoyer", methods=["POST"])
@login_required
def envoyer(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    destinataire = request.form.get("destinataire", "").strip()
    objet = request.form.get("objet", "").strip()
    corps = request.form.get("corps", "").strip()

    if not destinataire or not objet or not corps:
        flash("Destinataire, objet et corps du message sont obligatoires.", "danger")
        return redirect(url_for("courriers.rediger", dossier_id=dossier.id))

    succes, message = envoyer_email(destinataire, objet, corps)
    historique.log(
        "dossier", dossier.id,
        "Courrier envoyé" if succes else "Échec envoi courrier",
        f"À {destinataire} — {objet}" if succes else f"À {destinataire} — {message}",
    )
    db.session.commit()
    flash(message, "success" if succes else "danger")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))
