from datetime import date, datetime, timedelta

from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from flask_login import login_required

from extensions import db
from models import Dossier, STATUTS_DOSSIER, Creneau, Technicien
import historique

planning_bp = Blueprint("planning", __name__, url_prefix="/planning")

STATUTS_TERMINES = ("facture", "solde", "annule")


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _parse_heure(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError:
        return None


def _dossiers_planifiables():
    return Dossier.query.filter(Dossier.statut.notin_(STATUTS_TERMINES)).order_by(Dossier.reference.desc()).all()


def _lire_creneau_form(form):
    dossier = Dossier.query.get(form.get("dossier_id", type=int))
    technicien_id = form.get("technicien_id", type=int)
    jour = _parse_date(form.get("date"))
    heure_debut = _parse_heure(form.get("heure_debut"))
    heure_fin = _parse_heure(form.get("heure_fin"))
    notes = form.get("notes", "").strip()

    erreur = None
    if not dossier or not jour or not heure_debut or not heure_fin:
        erreur = "Merci de renseigner le dossier, la date et les horaires."
    elif heure_fin <= heure_debut:
        erreur = "L'heure de fin doit être après l'heure de début."
    return dossier, technicien_id, jour, heure_debut, heure_fin, notes, erreur


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


@planning_bp.route("/calendrier")
@login_required
def calendrier():
    jour_ref = _parse_date(request.args.get("semaine")) or date.today()
    lundi = jour_ref - timedelta(days=jour_ref.weekday())
    jours = [lundi + timedelta(days=i) for i in range(6)]  # Lundi à Samedi

    techniciens = Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all()
    creneaux = Creneau.query.filter(Creneau.date >= jours[0], Creneau.date <= jours[-1]).order_by(Creneau.heure_debut).all()

    grille = {t.id: {j: [] for j in jours} for t in techniciens}
    non_assignes = {j: [] for j in jours}
    for c in creneaux:
        if c.technicien_id and c.technicien_id in grille:
            grille[c.technicien_id][c.date].append(c)
        else:
            non_assignes[c.date].append(c)

    return render_template(
        "planning/calendrier.html",
        techniciens=techniciens, jours=jours, grille=grille, non_assignes=non_assignes,
        semaine_precedente=(lundi - timedelta(days=7)).isoformat(),
        semaine_suivante=(lundi + timedelta(days=7)).isoformat(),
        semaine_actuelle=lundi.isoformat(), aujourdhui=date.today(), lundi=lundi,
    )


@planning_bp.route("/creneau/nouveau", methods=["GET", "POST"])
@login_required
def new_creneau():
    if request.method == "POST":
        dossier, technicien_id, jour, heure_debut, heure_fin, notes, erreur = _lire_creneau_form(request.form)
        if erreur:
            flash(erreur, "danger")
            return render_template(
                "planning/creneau_form.html", creneau=None, dossiers=_dossiers_planifiables(),
                techniciens=Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all(),
                selected_dossier_id=dossier.id if dossier else request.form.get("dossier_id", type=int),
                selected_technicien_id=technicien_id, selected_date=request.form.get("date"),
                selected_heure_debut=request.form.get("heure_debut"), selected_heure_fin=request.form.get("heure_fin"),
                selected_notes=notes,
            )

        creneau = Creneau(
            dossier_id=dossier.id, technicien_id=technicien_id or None, date=jour,
            heure_debut=heure_debut, heure_fin=heure_fin, notes=notes,
        )
        db.session.add(creneau)
        db.session.flush()
        historique.log("dossier", dossier.id, "Créneau planifié", f"{jour.strftime('%d/%m/%Y')} {creneau.horaire}")
        db.session.commit()
        flash("Créneau planifié.", "success")
        return redirect(url_for("planning.calendrier", semaine=jour.isoformat()))

    dossier_id = request.args.get("dossier_id", type=int)
    return render_template(
        "planning/creneau_form.html", creneau=None, dossiers=_dossiers_planifiables(),
        techniciens=Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all(),
        selected_dossier_id=dossier_id, selected_technicien_id=request.args.get("technicien_id", type=int),
        selected_date=request.args.get("date", ""), selected_heure_debut="08:00", selected_heure_fin="17:00",
        selected_notes="",
    )


@planning_bp.route("/creneau/<int:creneau_id>/modifier", methods=["GET", "POST"])
@login_required
def edit_creneau(creneau_id):
    creneau = Creneau.query.get_or_404(creneau_id)
    dossiers = _dossiers_planifiables()
    if creneau.dossier not in dossiers:
        dossiers = [creneau.dossier] + dossiers
    techniciens = Technicien.query.filter_by(actif=True).order_by(Technicien.nom).all()

    if request.method == "POST":
        dossier, technicien_id, jour, heure_debut, heure_fin, notes, erreur = _lire_creneau_form(request.form)
        if erreur:
            flash(erreur, "danger")
            return render_template(
                "planning/creneau_form.html", creneau=creneau, dossiers=dossiers, techniciens=techniciens,
                selected_dossier_id=dossier.id if dossier else creneau.dossier_id,
                selected_technicien_id=technicien_id, selected_date=request.form.get("date"),
                selected_heure_debut=request.form.get("heure_debut"), selected_heure_fin=request.form.get("heure_fin"),
                selected_notes=notes,
            )

        creneau.dossier_id = dossier.id
        creneau.technicien_id = technicien_id or None
        creneau.date = jour
        creneau.heure_debut = heure_debut
        creneau.heure_fin = heure_fin
        creneau.notes = notes
        historique.log("dossier", dossier.id, "Créneau modifié", f"{jour.strftime('%d/%m/%Y')} {creneau.horaire}")
        db.session.commit()
        flash("Créneau mis à jour.", "success")
        return redirect(url_for("planning.calendrier", semaine=jour.isoformat()))

    return render_template(
        "planning/creneau_form.html", creneau=creneau, dossiers=dossiers, techniciens=techniciens,
        selected_dossier_id=creneau.dossier_id, selected_technicien_id=creneau.technicien_id,
        selected_date=creneau.date.isoformat(), selected_heure_debut=creneau.heure_debut.strftime("%H:%M"),
        selected_heure_fin=creneau.heure_fin.strftime("%H:%M"), selected_notes=creneau.notes,
    )


@planning_bp.route("/creneau/<int:creneau_id>/supprimer", methods=["POST"])
@login_required
def delete_creneau(creneau_id):
    creneau = Creneau.query.get_or_404(creneau_id)
    semaine = creneau.date.isoformat()
    dossier_id = creneau.dossier_id
    historique.log("dossier", dossier_id, "Créneau supprimé", f"{creneau.date.strftime('%d/%m/%Y')} {creneau.horaire}")
    db.session.delete(creneau)
    db.session.commit()
    flash("Créneau supprimé.", "info")
    if request.form.get("retour") == "dossier":
        return redirect(url_for("dossiers.view_dossier", dossier_id=dossier_id))
    return redirect(url_for("planning.calendrier", semaine=semaine))
