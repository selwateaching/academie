"""Fusion de variables pour le module Courriers : remplace les jetons
{{variable}} d'un modèle de lettre par les informations réelles d'un
dossier (client, véhicule, assurance, devis/facture éventuels)."""

from datetime import date


def variables_disponibles():
    """Liste (clé, description) affichée à l'utilisateur comme aide-mémoire."""
    return [
        ("entreprise_nom", "Nom de l'atelier"),
        ("entreprise_adresse", "Adresse de l'atelier"),
        ("entreprise_telephone", "Téléphone de l'atelier"),
        ("entreprise_email", "Email de l'atelier"),
        ("client_nom", "Nom complet du client"),
        ("client_adresse", "Adresse du client"),
        ("client_telephone", "Téléphone du client"),
        ("client_email", "Email du client"),
        ("vehicule_designation", "Marque, modèle et immatriculation"),
        ("vehicule_immatriculation", "Immatriculation seule"),
        ("vehicule_vin", "Numéro de série (VIN)"),
        ("dossier_reference", "Référence du dossier atelier"),
        ("dossier_type_sinistre", "Type de sinistre / intervention"),
        ("dossier_numero_sinistre", "N° de sinistre"),
        ("dossier_numero_police", "N° de police d'assurance"),
        ("assureur_nom", "Compagnie d'assurance"),
        ("expert_nom", "Nom de l'expert"),
        ("expert_cabinet", "Cabinet d'expertise"),
        ("devis_numero", "Numéro du devis"),
        ("devis_total_ttc", "Montant TTC du devis"),
        ("facture_numero", "Numéro de la facture"),
        ("facture_total_ttc", "Montant TTC de la facture"),
        ("facture_reste_a_payer", "Reste dû sur la facture"),
        ("date_jour", "Date du jour"),
    ]


def build_context(dossier, entreprise, devis=None, facture=None):
    client = dossier.client
    vehicule = dossier.vehicule

    ctx = {
        "entreprise_nom": entreprise.nom or "",
        "entreprise_adresse": f"{entreprise.adresse or ''} {entreprise.code_postal or ''} {entreprise.ville or ''}".strip(),
        "entreprise_telephone": entreprise.telephone or "",
        "entreprise_email": entreprise.email or "",
        "client_nom": client.nom_affichage,
        "client_adresse": client.adresse_complete,
        "client_telephone": client.telephone or "",
        "client_email": client.email or "",
        "vehicule_designation": vehicule.designation,
        "vehicule_immatriculation": vehicule.immatriculation,
        "vehicule_vin": vehicule.vin or "",
        "dossier_reference": dossier.reference or "",
        "dossier_type_sinistre": dossier.type_sinistre_libelle,
        "dossier_numero_sinistre": dossier.numero_sinistre or "",
        "dossier_numero_police": dossier.numero_police or "",
        "assureur_nom": dossier.assureur.nom if dossier.assureur else "",
        "expert_nom": dossier.expert_nom or "",
        "expert_cabinet": dossier.expert_cabinet or "",
        "devis_numero": devis.numero if devis else "",
        "devis_total_ttc": f"{devis.total_ttc:.2f} €" if devis else "",
        "facture_numero": facture.numero if facture else "",
        "facture_total_ttc": f"{facture.total_ttc:.2f} €" if facture else "",
        "facture_reste_a_payer": f"{facture.reste_a_payer:.2f} €" if facture else "",
        "date_jour": date.today().strftime("%d/%m/%Y"),
    }
    return ctx


def fusionner(texte, contexte):
    if not texte:
        return ""
    for cle, valeur in contexte.items():
        texte = texte.replace("{{" + cle + "}}", str(valeur))
    return texte
