from datetime import datetime, timedelta

from flask import Blueprint, render_template, redirect, url_for, request, flash, send_file
from flask_login import login_required

from extensions import db
from models import (
    Facture,
    FactureLigne,
    Dossier,
    Counter,
    Entreprise,
    Paiement,
    STATUTS_FACTURE,
    DESTINATAIRES_FACTURE,
    MODES_PAIEMENT,
    CatalogueItem,
    TYPES_LIGNE,
)
from pdf import generate_pdf

factures_bp = Blueprint("factures", __name__, url_prefix="/factures")


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


@factures_bp.route("/")
@login_required
def list_factures():
    statut = request.args.get("statut", "")
    query = Facture.query.filter_by(est_avoir=False)
    if statut:
        query = query.filter_by(statut=statut)
    factures = query.order_by(Facture.created_at.desc()).all()
    return render_template("factures/list.html", factures=factures, statuts=STATUTS_FACTURE, statut_filtre=statut)


@factures_bp.route("/nouvelle", methods=["GET", "POST"])
@login_required
def new_facture():
    dossier_id = request.args.get("dossier_id", type=int) or request.form.get("dossier_id", type=int)
    dossier = Dossier.query.get(dossier_id) if dossier_id else None
    entreprise = Entreprise.current()

    if request.method == "POST":
        if not dossier:
            flash("Dossier introuvable.", "danger")
            return redirect(url_for("dossiers.list_dossiers"))

        facture = Facture(dossier_id=dossier.id, statut="emise")
        facture.numero = Counter.next_number("facture", "FAC")
        facture.date_emission = _parse_date(request.form.get("date_emission")) or datetime.utcnow().date()
        facture.date_echeance = facture.date_emission + timedelta(
            days=request.form.get("delai_paiement_jours", type=int) or entreprise.delai_paiement_jours or 30
        )
        facture.destinataire_type = request.form.get("destinataire_type", "client")
        facture.montant_franchise_client = float(request.form.get("montant_franchise_client") or 0)
        facture.mode_reglement = request.form.get("mode_reglement", "").strip()
        facture.notes = request.form.get("notes", "").strip()
        facture.conditions = request.form.get("conditions", "").strip()

        for l in _build_lignes_from_form(request.form):
            facture.lignes.append(FactureLigne(**l))

        dossier.statut = "facture"

        db.session.add(facture)
        db.session.commit()
        flash(f"Facture {facture.numero} créée.", "success")
        return redirect(url_for("factures.view_facture", facture_id=facture.id))

    catalogue_items = CatalogueItem.query.filter_by(actif=True).order_by(CatalogueItem.designation).all()
    return render_template(
        "factures/form.html",
        facture=None,
        dossier=dossier,
        entreprise=entreprise,
        destinataires=DESTINATAIRES_FACTURE,
        catalogue_items=catalogue_items,
        types_ligne=TYPES_LIGNE,
    )


@factures_bp.route("/<int:facture_id>")
@login_required
def view_facture(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    return render_template("factures/detail.html", facture=facture, modes_paiement=MODES_PAIEMENT)


@factures_bp.route("/<int:facture_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_facture(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    entreprise = Entreprise.current()

    if facture.est_avoir:
        flash("Un avoir ne peut pas être modifié.", "danger")
        return redirect(url_for("factures.view_facture", facture_id=facture.id))

    if facture.paiements:
        flash("Cette facture a déjà des règlements enregistrés : elle ne peut plus être modifiée. Émettez un avoir si besoin.", "warning")
        return redirect(url_for("factures.view_facture", facture_id=facture.id))

    if request.method == "POST":
        facture.date_emission = _parse_date(request.form.get("date_emission")) or facture.date_emission
        facture.date_echeance = _parse_date(request.form.get("date_echeance")) or facture.date_echeance
        facture.destinataire_type = request.form.get("destinataire_type", "client")
        facture.montant_franchise_client = float(request.form.get("montant_franchise_client") or 0)
        facture.mode_reglement = request.form.get("mode_reglement", "").strip()
        facture.notes = request.form.get("notes", "").strip()
        facture.conditions = request.form.get("conditions", "").strip()

        facture.lignes.clear()
        for l in _build_lignes_from_form(request.form):
            facture.lignes.append(FactureLigne(**l))

        db.session.commit()
        flash("Facture mise à jour.", "success")
        return redirect(url_for("factures.view_facture", facture_id=facture.id))

    catalogue_items = CatalogueItem.query.filter_by(actif=True).order_by(CatalogueItem.designation).all()
    return render_template(
        "factures/form.html",
        facture=facture,
        dossier=facture.dossier,
        entreprise=entreprise,
        destinataires=DESTINATAIRES_FACTURE,
        catalogue_items=catalogue_items,
        types_ligne=TYPES_LIGNE,
    )


@factures_bp.route("/<int:facture_id>/statut", methods=["POST"])
@login_required
def change_statut(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    statut = request.form.get("statut")
    if statut in dict(STATUTS_FACTURE):
        facture.statut = statut
        db.session.commit()
        flash("Statut de la facture mis à jour.", "success")
    return redirect(url_for("factures.view_facture", facture_id=facture.id))


@factures_bp.route("/<int:facture_id>/paiement", methods=["POST"])
@login_required
def add_paiement(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    try:
        montant = float(request.form.get("montant") or 0)
    except ValueError:
        montant = 0

    if montant <= 0:
        flash("Le montant du règlement doit être positif.", "danger")
        return redirect(url_for("factures.view_facture", facture_id=facture.id))

    paiement = Paiement(
        facture_id=facture.id,
        date_paiement=_parse_date(request.form.get("date_paiement")) or datetime.utcnow().date(),
        montant=montant,
        mode=request.form.get("mode", "virement"),
        reference=request.form.get("reference", "").strip(),
        origine=request.form.get("origine", "client"),
        notes=request.form.get("notes", "").strip(),
    )
    db.session.add(paiement)
    db.session.flush()

    if facture.reste_a_payer <= 0.01:
        facture.statut = "payee"
    else:
        facture.statut = "partiellement_payee"

    db.session.commit()
    flash("Règlement enregistré.", "success")
    return redirect(url_for("factures.view_facture", facture_id=facture.id))


@factures_bp.route("/paiement/<int:paiement_id>/supprimer", methods=["POST"])
@login_required
def delete_paiement(paiement_id):
    paiement = Paiement.query.get_or_404(paiement_id)
    facture = paiement.facture
    db.session.delete(paiement)
    db.session.flush()
    facture.statut = "payee" if facture.reste_a_payer <= 0.01 and facture.total_paye > 0 else (
        "partiellement_payee" if facture.total_paye > 0 else "emise"
    )
    db.session.commit()
    flash("Règlement supprimé.", "info")
    return redirect(url_for("factures.view_facture", facture_id=facture.id))


@factures_bp.route("/<int:facture_id>/avoir", methods=["POST"])
@login_required
def creer_avoir(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    if facture.est_avoir:
        flash("Impossible de créer un avoir sur un avoir.", "danger")
        return redirect(url_for("factures.view_facture", facture_id=facture.id))

    avoir = Facture(
        dossier_id=facture.dossier_id,
        devis_id=facture.devis_id,
        statut="emise",
        est_avoir=True,
        facture_origine_id=facture.id,
        destinataire_type=facture.destinataire_type,
        montant_franchise_client=facture.montant_franchise_client,
        notes=request.form.get("motif", "").strip() or "Annulation de la facture d'origine.",
    )
    avoir.numero = Counter.next_number("avoir", "AV")

    for l in facture.lignes:
        avoir.lignes.append(
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

    facture.statut = "annulee"

    db.session.add(avoir)
    db.session.commit()
    flash(f"Avoir {avoir.numero} émis pour la facture {facture.numero}.", "success")
    return redirect(url_for("factures.view_facture", facture_id=avoir.id))


@factures_bp.route("/<int:facture_id>/pdf")
@login_required
def pdf_facture(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    entreprise = Entreprise.current()
    buffer = generate_pdf("facture", facture, entreprise)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=f"{facture.numero}.pdf",
    )
