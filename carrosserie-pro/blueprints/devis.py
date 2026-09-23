import secrets
from datetime import datetime

from flask import Blueprint, render_template, redirect, url_for, request, flash, send_file, abort
from flask_login import login_required

from extensions import db
from models import Devis, DevisLigne, Dossier, Counter, Entreprise, Facture, FactureLigne, STATUTS_DEVIS, CatalogueItem, TYPES_LIGNE
from blueprints.dossiers import search_dossiers
from pdf import generate_pdf
import historique

devis_bp = Blueprint("devis", __name__, url_prefix="/devis")


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _build_lignes_from_form(form):
    designations = form.getlist("designation[]")
    references = form.getlist("reference[]")
    types = form.getlist("type_ligne[]")
    unites = form.getlist("unite[]")
    quantites = form.getlist("quantite[]")
    prix = form.getlist("prix_unitaire_ht[]")
    remises = form.getlist("remise_pourcentage[]")
    tvas = form.getlist("taux_tva[]")

    lignes = []
    for i, designation in enumerate(designations):
        designation = designation.strip()
        if not designation:
            continue
        try:
            quantite = float(quantites[i] or 0)
        except (ValueError, IndexError):
            quantite = 0
        try:
            prix_u = float(prix[i] or 0)
        except (ValueError, IndexError):
            prix_u = 0
        try:
            remise = float(remises[i] or 0)
        except (ValueError, IndexError):
            remise = 0
        try:
            tva = float(tvas[i] or 0)
        except (ValueError, IndexError):
            tva = 0
        lignes.append(
            dict(
                ordre=i,
                designation=designation,
                reference=(references[i] if i < len(references) else "").strip(),
                type_ligne=(types[i] if i < len(types) else "piece"),
                unite=(unites[i] if i < len(unites) else "u") or "u",
                quantite=quantite,
                prix_unitaire_ht=prix_u,
                remise_pourcentage=remise,
                taux_tva=tva,
            )
        )
    return lignes


@devis_bp.route("/")
@login_required
def list_devis():
    statut = request.args.get("statut", "")
    query = Devis.query
    if statut:
        query = query.filter_by(statut=statut)
    devis_list = query.order_by(Devis.created_at.desc()).all()
    return render_template("devis/list.html", devis_list=devis_list, statuts=STATUTS_DEVIS, statut_filtre=statut)


@devis_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_devis():
    dossier_id = request.args.get("dossier_id", type=int) or request.form.get("dossier_id", type=int)
    dossier = Dossier.query.get(dossier_id) if dossier_id else None
    entreprise = Entreprise.current()

    if not dossier:
        if request.method == "POST":
            flash("Dossier introuvable.", "danger")
            return redirect(url_for("dossiers.list_dossiers"))
        q = request.args.get("q", "").strip()
        return render_template(
            "_choisir_dossier.html",
            dossiers=search_dossiers(q),
            q=q,
            titre="Nouveau devis — choisir un dossier",
            cible_endpoint="devis.new_devis",
        )

    if request.method == "POST":
        devis = Devis(dossier_id=dossier.id, statut="brouillon")
        devis.numero = Counter.next_number("devis", "DEV")
        devis.date_emission = _parse_date(request.form.get("date_emission")) or datetime.utcnow().date()
        devis.validite_jours = request.form.get("validite_jours", type=int) or entreprise.validite_devis_jours
        devis.remise_globale_pourcentage = float(request.form.get("remise_globale_pourcentage") or 0)
        devis.notes = request.form.get("notes", "").strip()
        devis.conditions = request.form.get("conditions", "").strip()

        for l in _build_lignes_from_form(request.form):
            devis.lignes.append(DevisLigne(**l))

        db.session.add(devis)
        db.session.flush()
        historique.log("devis", devis.id, "Création", f"Devis {devis.numero} créé")
        historique.log("dossier", dossier.id, "Devis créé", f"Devis {devis.numero}")
        db.session.commit()
        flash(f"Devis {devis.numero} créé.", "success")
        return redirect(url_for("devis.view_devis", devis_id=devis.id))

    catalogue_items = CatalogueItem.query.filter_by(actif=True).order_by(CatalogueItem.designation).all()
    return render_template(
        "devis/form.html", devis=None, dossier=dossier, entreprise=entreprise,
        catalogue_items=catalogue_items, types_ligne=TYPES_LIGNE,
    )


@devis_bp.route("/<int:devis_id>")
@login_required
def view_devis(devis_id):
    devis = Devis.query.get_or_404(devis_id)
    return render_template("devis/detail.html", devis=devis, historique=historique.for_entity("devis", devis_id))


@devis_bp.route("/<int:devis_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_devis(devis_id):
    devis = Devis.query.get_or_404(devis_id)
    entreprise = Entreprise.current()

    if devis.statut == "facture":
        flash("Ce devis a déjà été transformé en facture et ne peut plus être modifié.", "warning")
        return redirect(url_for("devis.view_devis", devis_id=devis.id))

    if request.method == "POST":
        devis.date_emission = _parse_date(request.form.get("date_emission")) or devis.date_emission
        devis.validite_jours = request.form.get("validite_jours", type=int) or devis.validite_jours
        devis.remise_globale_pourcentage = float(request.form.get("remise_globale_pourcentage") or 0)
        devis.notes = request.form.get("notes", "").strip()
        devis.conditions = request.form.get("conditions", "").strip()

        devis.lignes.clear()
        for l in _build_lignes_from_form(request.form):
            devis.lignes.append(DevisLigne(**l))

        historique.log("devis", devis.id, "Modification", f"Devis {devis.numero} mis à jour")
        db.session.commit()
        flash("Devis mis à jour.", "success")
        return redirect(url_for("devis.view_devis", devis_id=devis.id))

    catalogue_items = CatalogueItem.query.filter_by(actif=True).order_by(CatalogueItem.designation).all()
    return render_template(
        "devis/form.html", devis=devis, dossier=devis.dossier, entreprise=entreprise,
        catalogue_items=catalogue_items, types_ligne=TYPES_LIGNE,
    )


@devis_bp.route("/<int:devis_id>/statut", methods=["POST"])
@login_required
def change_statut(devis_id):
    devis = Devis.query.get_or_404(devis_id)
    statut = request.form.get("statut")
    if statut in dict(STATUTS_DEVIS):
        ancien_libelle = devis.statut_libelle
        devis.statut = statut
        historique.log("devis", devis.id, "Changement de statut", f"{ancien_libelle} → {devis.statut_libelle}")
        db.session.commit()
        flash("Statut du devis mis à jour.", "success")
    return redirect(url_for("devis.view_devis", devis_id=devis.id))


@devis_bp.route("/<int:devis_id>/lien-signature", methods=["POST"])
@login_required
def creer_lien_signature(devis_id):
    devis = Devis.query.get_or_404(devis_id)
    if not devis.signature_token:
        devis.signature_token = secrets.token_urlsafe(24)
        historique.log("devis", devis.id, "Lien de signature créé", "")
        db.session.commit()
        flash("Lien de signature généré.", "success")
    return redirect(url_for("devis.view_devis", devis_id=devis.id))


@devis_bp.route("/signer/<token>", methods=["GET", "POST"])
def signer_devis(token):
    devis = Devis.query.filter_by(signature_token=token).first()
    if not devis:
        abort(404)
    entreprise = Entreprise.current()

    if request.method == "POST":
        if devis.est_signe:
            flash("Ce devis a déjà été signé.", "warning")
            return redirect(url_for("devis.signer_devis", token=token))
        signature_data = request.form.get("signature_data", "").strip()
        nom = request.form.get("signature_nom", "").strip()
        if not signature_data or not nom:
            flash("Veuillez indiquer votre nom et apposer votre signature.", "danger")
            return render_template("devis/signer.html", devis=devis, entreprise=entreprise)
        devis.signature_data = signature_data
        devis.signature_nom = nom
        devis.signature_date = datetime.utcnow()
        devis.signature_ip = request.remote_addr or ""
        devis.statut = "accepte"
        historique.log("devis", devis.id, "Signature électronique", f"Signé par {nom}")
        db.session.commit()
        flash("Merci, le devis a été signé avec succès.", "success")
        return redirect(url_for("devis.signer_devis", token=token))

    return render_template("devis/signer.html", devis=devis, entreprise=entreprise)


@devis_bp.route("/signer/<token>/pdf")
def pdf_devis_public(token):
    """PDF accessible sans connexion via le lien de signature — pour que le
    client ou l'expert puisse le consulter sans compte sur le logiciel."""
    devis = Devis.query.filter_by(signature_token=token).first()
    if not devis:
        abort(404)
    entreprise = Entreprise.current()
    buffer = generate_pdf("devis", devis, entreprise)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=f"{devis.numero}.pdf",
    )


@devis_bp.route("/<int:devis_id>/pdf")
@login_required
def pdf_devis(devis_id):
    devis = Devis.query.get_or_404(devis_id)
    entreprise = Entreprise.current()
    buffer = generate_pdf("devis", devis, entreprise)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=f"{devis.numero}.pdf",
    )


@devis_bp.route("/<int:devis_id>/transformer-facture", methods=["POST"])
@login_required
def transformer_facture(devis_id):
    devis = Devis.query.get_or_404(devis_id)
    entreprise = Entreprise.current()

    if devis.statut == "facture":
        flash("Ce devis a déjà été transformé en facture.", "warning")
        return redirect(url_for("devis.view_devis", devis_id=devis.id))

    if not devis.lignes:
        flash("Impossible de facturer un devis sans lignes.", "danger")
        return redirect(url_for("devis.view_devis", devis_id=devis.id))

    from datetime import date as _date, timedelta

    facture = Facture(
        dossier_id=devis.dossier_id,
        devis_id=devis.id,
        statut="emise",
        date_emission=_date.today(),
    )
    facture.numero = Counter.next_number("facture", "FAC")
    facture.date_echeance = facture.date_emission + timedelta(days=entreprise.delai_paiement_jours or 30)

    dossier = devis.dossier
    if dossier.est_assurance:
        facture.destinataire_type = "mixte" if dossier.franchise_montant else "assureur"
        facture.montant_franchise_client = dossier.franchise_montant or 0
    else:
        facture.destinataire_type = "client"

    for l in devis.lignes:
        facture.lignes.append(
            FactureLigne(
                ordre=l.ordre,
                reference=l.reference,
                designation=l.designation,
                type_ligne=l.type_ligne,
                unite=l.unite,
                quantite=l.quantite,
                prix_unitaire_ht=l.prix_unitaire_ht,
                remise_pourcentage=l.remise_pourcentage,
                taux_tva=l.taux_tva,
            )
        )

    devis.statut = "facture"
    dossier.statut = "facture"

    db.session.add(facture)
    db.session.flush()
    historique.log("devis", devis.id, "Transformé en facture", f"Facture {facture.numero}")
    historique.log("facture", facture.id, "Création", f"Facture {facture.numero} générée depuis le devis {devis.numero}")
    historique.log("dossier", dossier.id, "Facture créée", f"Facture {facture.numero}")
    db.session.commit()
    flash(f"Facture {facture.numero} générée à partir du devis {devis.numero}.", "success")
    return redirect(url_for("factures.view_facture", facture_id=facture.id))


@devis_bp.route("/<int:devis_id>/supprimer", methods=["POST"])
@login_required
def delete_devis(devis_id):
    devis = Devis.query.get_or_404(devis_id)
    dossier_id = devis.dossier_id
    if devis.statut == "facture":
        flash("Impossible de supprimer un devis déjà facturé.", "danger")
        return redirect(url_for("devis.view_devis", devis_id=devis.id))
    historique.log("dossier", dossier_id, "Devis supprimé", f"Devis {devis.numero}")
    db.session.delete(devis)
    db.session.commit()
    flash("Devis supprimé.", "info")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier_id))
