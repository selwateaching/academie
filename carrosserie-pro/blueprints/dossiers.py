from datetime import datetime, date

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required
from sqlalchemy import or_

from extensions import db
from models import (
    Dossier,
    Client,
    Vehicule,
    Assureur,
    Expert,
    Technicien,
    PointageTemps,
    Fournisseur,
    CommandePiece,
    FicheTeinte,
    Counter,
    STATUTS_DOSSIER,
    TYPES_SINISTRE,
    STATUTS_COMMANDE,
)
import historique

dossiers_bp = Blueprint("dossiers", __name__, url_prefix="/dossiers")


def search_dossiers(q):
    """Utilisé par les pickers de dossier des modules Devis et Factures."""
    query = Dossier.query.join(Client).join(Vehicule)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Dossier.reference.ilike(like),
                Client.nom.ilike(like),
                Client.prenom.ilike(like),
                Client.raison_sociale.ilike(like),
                Vehicule.immatriculation.ilike(like),
                Vehicule.marque.ilike(like),
                Vehicule.modele.ilike(like),
            )
        )
    return query.order_by(Dossier.created_at.desc()).limit(100).all()


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _parse_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _fill_dossier_from_form(dossier, form):
    dossier.type_sinistre = form.get("type_sinistre", "hors_assurance")
    dossier.date_sinistre = _parse_date(form.get("date_sinistre"))
    dossier.description = form.get("description", "").strip()

    if dossier.type_sinistre == "hors_assurance":
        dossier.assureur_id = None
        dossier.numero_sinistre = ""
        dossier.numero_police = ""
        dossier.nom_assure = ""
        dossier.franchise_montant = 0.0
        dossier.cession_de_creance = False
        dossier.expert_nom = ""
        dossier.expert_cabinet = ""
        dossier.expert_telephone = ""
        dossier.expert_email = ""
        dossier.date_expertise = None
        dossier.rapport_expertise_reference = ""
    else:
        dossier.assureur_id = form.get("assureur_id", type=int) or None
        dossier.numero_sinistre = form.get("numero_sinistre", "").strip()
        dossier.numero_police = form.get("numero_police", "").strip()
        dossier.nom_assure = form.get("nom_assure", "").strip()
        dossier.franchise_montant = _parse_float(form.get("franchise_montant"), 0.0)
        dossier.cession_de_creance = form.get("cession_de_creance") == "on"
        dossier.expert_nom = form.get("expert_nom", "").strip()
        dossier.expert_cabinet = form.get("expert_cabinet", "").strip()
        dossier.expert_telephone = form.get("expert_telephone", "").strip()
        dossier.expert_email = form.get("expert_email", "").strip()
        dossier.date_expertise = _parse_date(form.get("date_expertise"))
        dossier.rapport_expertise_reference = form.get("rapport_expertise_reference", "").strip()

    dossier.vehicule_pret = form.get("vehicule_pret") == "on"
    dossier.date_entree_atelier = _parse_date(form.get("date_entree_atelier"))
    dossier.date_sortie_prevue = _parse_date(form.get("date_sortie_prevue"))
    dossier.date_sortie_reelle = _parse_date(form.get("date_sortie_reelle"))
    dossier.technicien_id = form.get("technicien_id", type=int) or None
    dossier.notes = form.get("notes", "").strip()


@dossiers_bp.route("/")
@login_required
def list_dossiers():
    statut = request.args.get("statut", "")
    query = Dossier.query
    if statut:
        query = query.filter_by(statut=statut)
    dossiers = query.order_by(Dossier.created_at.desc()).all()
    return render_template("dossiers/list.html", dossiers=dossiers, statuts=STATUTS_DOSSIER, statut_filtre=statut)


@dossiers_bp.route("/nouveau", methods=["GET", "POST"])
@login_required
def new_dossier():
    client_id = request.args.get("client_id", type=int)

    if request.method == "POST":
        client_id = request.form.get("client_id", type=int)
        vehicule_id = request.form.get("vehicule_id", type=int)
        client = Client.query.get(client_id) if client_id else None
        vehicule = Vehicule.query.get(vehicule_id) if vehicule_id else None

        if not client or not vehicule or vehicule.client_id != client.id:
            flash("Merci de sélectionner un client et l'un de ses véhicules.", "danger")
            clients = Client.query.order_by(Client.nom).all()
            assureurs = Assureur.query.order_by(Assureur.nom).all()
            experts = Expert.query.order_by(Expert.nom).all()
            techniciens = Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all()
            return render_template(
                "dossiers/form.html",
                dossier=None,
                clients=clients,
                assureurs=assureurs,
                experts=experts,
                techniciens=techniciens,
                types_sinistre=TYPES_SINISTRE,
                selected_client_id=client_id,
            )

        dossier = Dossier(client_id=client.id, vehicule_id=vehicule.id, statut="nouveau")
        dossier.reference = Counter.next_number("dossier", "OR")
        _fill_dossier_from_form(dossier, request.form)
        db.session.add(dossier)
        db.session.flush()
        historique.log("dossier", dossier.id, "Création", f"Dossier {dossier.reference} créé")
        db.session.commit()
        flash(f"Dossier {dossier.reference} créé.", "success")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))

    clients = Client.query.order_by(Client.nom).all()
    assureurs = Assureur.query.order_by(Assureur.nom).all()
    experts = Expert.query.order_by(Expert.nom).all()
    techniciens = Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all()
    return render_template(
        "dossiers/form.html",
        dossier=None,
        clients=clients,
        assureurs=assureurs,
        experts=experts,
        techniciens=techniciens,
        types_sinistre=TYPES_SINISTRE,
        selected_client_id=client_id,
    )


@dossiers_bp.route("/<int:dossier_id>")
@login_required
def view_dossier(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    techniciens = Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all()
    fournisseurs = Fournisseur.query.order_by(Fournisseur.nom).all()
    return render_template(
        "dossiers/detail.html", dossier=dossier, statuts=STATUTS_DOSSIER, techniciens=techniciens,
        fournisseurs=fournisseurs, statuts_commande=STATUTS_COMMANDE,
        historique=historique.for_entity("dossier", dossier_id),
    )


@dossiers_bp.route("/<int:dossier_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_dossier(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    if request.method == "POST":
        _fill_dossier_from_form(dossier, request.form)
        historique.log("dossier", dossier.id, "Modification", "Informations du dossier mises à jour")
        db.session.commit()
        flash("Dossier mis à jour.", "success")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))
    clients = Client.query.order_by(Client.nom).all()
    assureurs = Assureur.query.order_by(Assureur.nom).all()
    experts = Expert.query.order_by(Expert.nom).all()
    techniciens = Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all()
    return render_template(
        "dossiers/form.html",
        dossier=dossier,
        clients=clients,
        assureurs=assureurs,
        experts=experts,
        techniciens=techniciens,
        types_sinistre=TYPES_SINISTRE,
        selected_client_id=dossier.client_id,
    )


@dossiers_bp.route("/<int:dossier_id>/statut", methods=["POST"])
@login_required
def change_statut(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    statut = request.form.get("statut")
    if statut in dict(STATUTS_DOSSIER):
        ancien_libelle = dossier.statut_libelle
        dossier.statut = statut
        historique.log("dossier", dossier.id, "Changement de statut", f"{ancien_libelle} → {dossier.statut_libelle}")
        db.session.commit()
        flash("Statut du dossier mis à jour.", "success")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))


@dossiers_bp.route("/<int:dossier_id>/supprimer", methods=["POST"])
@login_required
def delete_dossier(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    if dossier.factures:
        flash("Impossible de supprimer un dossier facturé. Utilisez plutôt un avoir.", "danger")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))
    historique.log("dossier", dossier.id, "Suppression", f"Dossier {dossier.reference} supprimé")
    db.session.delete(dossier)
    db.session.commit()
    flash("Dossier supprimé.", "info")
    return redirect(url_for("dossiers.list_dossiers"))


@dossiers_bp.route("/api/vehicules/<int:client_id>")
@login_required
def api_vehicules_client(client_id):
    vehicules = Vehicule.query.filter_by(client_id=client_id).all()
    return {"vehicules": [{"id": v.id, "designation": v.designation} for v in vehicules]}


@dossiers_bp.route("/<int:dossier_id>/pointages/nouveau", methods=["POST"])
@login_required
def new_pointage(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    technicien_id = request.form.get("technicien_id", type=int)
    duree_heures = _parse_float(request.form.get("duree_heures"), 0.0)
    technicien = Technicien.query.get(technicien_id) if technicien_id else None

    if not technicien or duree_heures <= 0:
        flash("Merci de sélectionner un technicien et une durée valide.", "danger")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))

    pointage = PointageTemps(
        dossier_id=dossier.id,
        technicien_id=technicien.id,
        date_intervention=_parse_date(request.form.get("date_intervention")) or date.today(),
        duree_heures=duree_heures,
        description=request.form.get("description", "").strip(),
    )
    db.session.add(pointage)
    db.session.flush()
    historique.log("dossier", dossier.id, "Pointage ajouté", f"{technicien.nom} — {duree_heures:g} h")
    db.session.commit()
    flash("Pointage enregistré.", "success")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))


@dossiers_bp.route("/<int:dossier_id>/pointages/<int:pointage_id>/supprimer", methods=["POST"])
@login_required
def delete_pointage(dossier_id, pointage_id):
    pointage = PointageTemps.query.filter_by(id=pointage_id, dossier_id=dossier_id).first_or_404()
    historique.log("dossier", dossier_id, "Pointage supprimé", f"{pointage.technicien.nom} — {pointage.duree_heures:g} h")
    db.session.delete(pointage)
    db.session.commit()
    flash("Pointage supprimé.", "info")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier_id))


@dossiers_bp.route("/<int:dossier_id>/pieces/nouvelle", methods=["POST"])
@login_required
def new_commande_piece(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    designation = request.form.get("designation", "").strip()
    if not designation:
        flash("La désignation de la pièce est obligatoire.", "danger")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))

    commande = CommandePiece(
        dossier_id=dossier.id,
        fournisseur_id=request.form.get("fournisseur_id", type=int) or None,
        designation=designation,
        reference=request.form.get("reference", "").strip(),
        quantite=_parse_float(request.form.get("quantite"), 1.0) or 1.0,
        prix_unitaire_ht=_parse_float(request.form.get("prix_unitaire_ht"), 0.0),
        statut="a_commander",
        date_reception_prevue=_parse_date(request.form.get("date_reception_prevue")),
    )
    db.session.add(commande)
    db.session.flush()
    historique.log("dossier", dossier.id, "Pièce ajoutée à la commande", designation)
    db.session.commit()
    flash("Pièce ajoutée.", "success")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))


@dossiers_bp.route("/<int:dossier_id>/pieces/<int:commande_id>/statut", methods=["POST"])
@login_required
def change_statut_commande(dossier_id, commande_id):
    commande = CommandePiece.query.filter_by(id=commande_id, dossier_id=dossier_id).first_or_404()
    statut = request.form.get("statut")
    if statut in dict(STATUTS_COMMANDE):
        ancien_libelle = commande.statut_libelle
        commande.statut = statut
        if statut == "commandee" and not commande.date_commande:
            commande.date_commande = date.today()
        if statut == "recue" and not commande.date_reception_reelle:
            commande.date_reception_reelle = date.today()
        historique.log("dossier", dossier_id, "Statut pièce modifié", f"{commande.designation} : {ancien_libelle} → {commande.statut_libelle}")
        db.session.commit()
        flash("Statut de la pièce mis à jour.", "success")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier_id))


@dossiers_bp.route("/<int:dossier_id>/pieces/<int:commande_id>/supprimer", methods=["POST"])
@login_required
def delete_commande_piece(dossier_id, commande_id):
    commande = CommandePiece.query.filter_by(id=commande_id, dossier_id=dossier_id).first_or_404()
    historique.log("dossier", dossier_id, "Pièce supprimée", commande.designation)
    db.session.delete(commande)
    db.session.commit()
    flash("Pièce supprimée.", "info")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier_id))


@dossiers_bp.route("/<int:dossier_id>/teinte/nouvelle", methods=["POST"])
@login_required
def new_fiche_teinte(dossier_id):
    dossier = Dossier.query.get_or_404(dossier_id)
    formule = request.form.get("formule", "").strip()
    if not formule:
        flash("La formule de mélange est obligatoire.", "danger")
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))

    fiche = FicheTeinte(
        dossier_id=dossier.id,
        fabricant_peinture=request.form.get("fabricant_peinture", "").strip(),
        formule=formule,
        elements_peints=request.form.get("elements_peints", "").strip(),
        quantite_g=_parse_float(request.form.get("quantite_g"), None),
        notes=request.form.get("notes", "").strip(),
    )
    db.session.add(fiche)
    db.session.flush()
    historique.log("dossier", dossier.id, "Fiche teinte ajoutée", fiche.elements_peints or fiche.fabricant_peinture)
    db.session.commit()
    flash("Fiche teinte enregistrée.", "success")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier.id))


@dossiers_bp.route("/<int:dossier_id>/teinte/<int:fiche_id>/supprimer", methods=["POST"])
@login_required
def delete_fiche_teinte(dossier_id, fiche_id):
    fiche = FicheTeinte.query.filter_by(id=fiche_id, dossier_id=dossier_id).first_or_404()
    historique.log("dossier", dossier_id, "Fiche teinte supprimée", fiche.elements_peints or fiche.fabricant_peinture)
    db.session.delete(fiche)
    db.session.commit()
    flash("Fiche teinte supprimée.", "info")
    return redirect(url_for("dossiers.view_dossier", dossier_id=dossier_id))
