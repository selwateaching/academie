from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user

from extensions import db
from models import Entreprise, User

settings_bp = Blueprint("settings", __name__, url_prefix="/parametres")


def _to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@settings_bp.route("/", methods=["GET", "POST"])
@login_required
def entreprise_settings():
    entreprise = Entreprise.current()

    if request.method == "POST":
        form = request.form
        entreprise.nom = form.get("nom", "").strip()
        entreprise.forme_juridique = form.get("forme_juridique", "").strip()
        entreprise.adresse = form.get("adresse", "").strip()
        entreprise.code_postal = form.get("code_postal", "").strip()
        entreprise.ville = form.get("ville", "").strip()
        entreprise.telephone = form.get("telephone", "").strip()
        entreprise.email = form.get("email", "").strip()
        entreprise.site_web = form.get("site_web", "").strip()

        entreprise.siret = form.get("siret", "").strip()
        entreprise.rcs_ville = form.get("rcs_ville", "").strip()
        entreprise.tva_intracom = form.get("tva_intracom", "").strip()
        entreprise.capital_social = form.get("capital_social", "").strip()
        entreprise.code_ape = form.get("code_ape", "").strip()
        entreprise.franchise_en_base_tva = form.get("franchise_en_base_tva") == "on"

        entreprise.assurance_rc_pro = form.get("assurance_rc_pro", "").strip()
        entreprise.assurance_decennale = form.get("assurance_decennale", "").strip()
        entreprise.agrement_qualirepar = form.get("agrement_qualirepar") == "on"
        entreprise.agrements_assureurs = form.get("agrements_assureurs", "").strip()

        entreprise.iban = form.get("iban", "").strip()
        entreprise.bic = form.get("bic", "").strip()

        entreprise.taux_horaire_mo = _to_float(form.get("taux_horaire_mo"), 60.0)
        entreprise.taux_tva_defaut = _to_float(form.get("taux_tva_defaut"), 20.0)
        entreprise.delai_paiement_jours = _to_int(form.get("delai_paiement_jours"), 30)
        entreprise.validite_devis_jours = _to_int(form.get("validite_devis_jours"), 30)
        entreprise.taux_penalite_retard = _to_float(form.get("taux_penalite_retard"), 10.0)
        entreprise.indemnite_recouvrement = _to_float(form.get("indemnite_recouvrement"), 40.0)

        entreprise.mentions_devis = form.get("mentions_devis", "").strip()
        entreprise.mentions_facture = form.get("mentions_facture", "").strip()
        entreprise.conditions_generales = form.get("conditions_generales", "").strip()

        db.session.commit()
        flash("Paramètres de l'entreprise mis à jour.", "success")
        return redirect(url_for("settings.entreprise_settings"))

    return render_template("settings.html", entreprise=entreprise, users=User.query.order_by(User.name).all())


@settings_bp.route("/utilisateurs/nouveau", methods=["POST"])
@login_required
def new_user():
    email = request.form.get("email", "").strip().lower()
    name = request.form.get("name", "").strip()
    password = request.form.get("password", "")
    role = request.form.get("role", "atelier")

    if not email or not name or len(password) < 6:
        flash("Email, nom et mot de passe (6 caractères min.) sont requis.", "danger")
        return redirect(url_for("settings.entreprise_settings"))

    if User.query.filter_by(email=email).first():
        flash("Un utilisateur avec cet email existe déjà.", "danger")
        return redirect(url_for("settings.entreprise_settings"))

    user = User(email=email, name=name, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    flash(f"Utilisateur {name} créé.", "success")
    return redirect(url_for("settings.entreprise_settings"))


@settings_bp.route("/utilisateurs/<int:user_id>/desactiver", methods=["POST"])
@login_required
def toggle_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash("Vous ne pouvez pas désactiver votre propre compte.", "danger")
        return redirect(url_for("settings.entreprise_settings"))
    user.active = not user.active
    db.session.commit()
    flash("Statut utilisateur mis à jour.", "info")
    return redirect(url_for("settings.entreprise_settings"))
