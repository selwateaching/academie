"""Génère des données de démonstration : compagnies d'assurance, catalogue,
clients, véhicules, un dossier assurance et un dossier hors assurance avec
devis et facture. Exécuter avec : python seed.py
"""

from datetime import date, timedelta

from app import app
from extensions import db
from models import (
    Entreprise,
    Assureur,
    CatalogueItem,
    Client,
    Vehicule,
    Dossier,
    Devis,
    DevisLigne,
    Facture,
    FactureLigne,
    Counter,
)


def run():
    with app.app_context():
        entreprise = Entreprise.current()
        if not entreprise.siret:
            entreprise.nom = "Carrosserie du Centre"
            entreprise.forme_juridique = "SARL"
            entreprise.adresse = "12 rue des Artisans"
            entreprise.code_postal = "69003"
            entreprise.ville = "Lyon"
            entreprise.telephone = "04 78 00 00 00"
            entreprise.email = "contact@carrosserie-du-centre.fr"
            entreprise.siret = "812 345 678 00019"
            entreprise.rcs_ville = "Lyon"
            entreprise.tva_intracom = "FR12812345678"
            entreprise.capital_social = "10 000 €"
            entreprise.code_ape = "4520A"
            entreprise.assurance_rc_pro = "MAAF Pro — contrat n° 998877"
            entreprise.assurance_decennale = "MAAF Pro — contrat n° 998877-D"
            entreprise.agrement_qualirepar = True
            entreprise.agrements_assureurs = "Réseau AXA, réseau MAAF, réseau Allianz"
            entreprise.iban = "FR76 3000 4000 0500 0012 3456 789"
            entreprise.bic = "BNPAFRPPXXX"
            db.session.commit()

        if Assureur.query.count() == 0:
            assureurs = [
                Assureur(nom="AXA Assurances", ville="Lyon", telephone="04 72 00 00 00",
                          email_gestion_sinistres="sinistres@axa-demo.fr", reseau_agree=True),
                Assureur(nom="MAAF Assurances", ville="Niort", telephone="05 49 00 00 00",
                          email_gestion_sinistres="sinistres@maaf-demo.fr", reseau_agree=True),
                Assureur(nom="MAIF", ville="Niort", telephone="05 49 11 11 11",
                          email_gestion_sinistres="sinistres@maif-demo.fr", reseau_agree=False),
            ]
            db.session.add_all(assureurs)
            db.session.commit()

        if CatalogueItem.query.count() == 0:
            items = [
                CatalogueItem(reference="MO-CARR", designation="Main d'œuvre carrosserie", type_ligne="main_oeuvre", unite="h", prix_unitaire_ht=60, taux_tva=20),
                CatalogueItem(reference="MO-PEINT", designation="Main d'œuvre peinture", type_ligne="peinture", unite="h", prix_unitaire_ht=65, taux_tva=20),
                CatalogueItem(reference="FORF-PB", designation="Forfait peinture élément (pare-chocs)", type_ligne="forfait", unite="forfait", prix_unitaire_ht=180, taux_tva=20),
                CatalogueItem(reference="PC-AV", designation="Pare-chocs avant (pièce)", type_ligne="piece", unite="u", prix_unitaire_ht=320, taux_tva=20),
                CatalogueItem(reference="PB-GLACE", designation="Pare-brise (remplacement)", type_ligne="piece", unite="u", prix_unitaire_ht=450, taux_tva=20),
                CatalogueItem(reference="FOURN", designation="Petites fournitures / consommables", type_ligne="fourniture", unite="forfait", prix_unitaire_ht=35, taux_tva=20),
                CatalogueItem(reference="DIAG", designation="Diagnostic électronique / calibrage ADAS", type_ligne="divers", unite="forfait", prix_unitaire_ht=90, taux_tva=20),
            ]
            db.session.add_all(items)
            db.session.commit()

        if Client.query.count() == 0:
            client1 = Client(
                type_client="particulier", civilite="M.", nom="Dupont", prenom="Julien",
                adresse="5 avenue Jean Jaurès", code_postal="69007", ville="Lyon",
                telephone="06 12 34 56 78", email="julien.dupont@example.fr",
            )
            client2 = Client(
                type_client="professionnel", nom="Transports Moreau", raison_sociale="Transports Moreau SARL",
                siret="789 456 123 00027", adresse="18 rue de l'Industrie", code_postal="69100", ville="Villeurbanne",
                telephone="04 78 11 22 33", email="contact@transports-moreau.fr",
            )
            db.session.add_all([client1, client2])
            db.session.flush()

            v1 = Vehicule(client_id=client1.id, immatriculation="AB-123-CD", marque="Peugeot", modele="308",
                           vin="VF3LBHZXYK1234567", couleur="Gris", energie="Diesel",
                           date_mise_circulation=date(2019, 5, 12), kilometrage=68000)
            v2 = Vehicule(client_id=client2.id, immatriculation="EF-456-GH", marque="Renault", modele="Master",
                           vin="VF1MAHZXYK7654321", couleur="Blanc", energie="Diesel",
                           date_mise_circulation=date(2021, 2, 3), kilometrage=42000)
            db.session.add_all([v1, v2])
            db.session.commit()

            axa = Assureur.query.filter_by(nom="AXA Assurances").first()

            # Dossier avec assurance
            dossier1 = Dossier(
                client_id=client1.id, vehicule_id=v1.id, statut="en_reparation",
                type_sinistre="collision", date_sinistre=date.today() - timedelta(days=10),
                description="Choc arrière lors d'un freinage d'urgence : pare-chocs et feu arrière droit endommagés.",
                assureur_id=axa.id, numero_sinistre="SIN-2026-00841", numero_police="POL-556677",
                franchise_montant=150.0, cession_de_creance=True,
                expert_nom="Marc Legrand", expert_cabinet="Cabinet Expertise Rhône",
                date_expertise=date.today() - timedelta(days=6),
                vehicule_pret=True, date_entree_atelier=date.today() - timedelta(days=3),
                date_sortie_prevue=date.today() + timedelta(days=4),
            )
            dossier1.reference = Counter.next_number("dossier", "OR")
            db.session.add(dossier1)
            db.session.flush()

            devis1 = Devis(dossier_id=dossier1.id, statut="accepte", date_emission=date.today() - timedelta(days=8))
            devis1.numero = Counter.next_number("devis", "DEV")
            devis1.lignes.append(DevisLigne(ordre=0, reference="PC-AV", designation="Remplacement pare-chocs arrière", type_ligne="piece", unite="u", quantite=1, prix_unitaire_ht=320, taux_tva=20))
            devis1.lignes.append(DevisLigne(ordre=1, reference="MO-CARR", designation="Main d'œuvre dépose/pose + réglages", type_ligne="main_oeuvre", unite="h", quantite=3, prix_unitaire_ht=60, taux_tva=20))
            devis1.lignes.append(DevisLigne(ordre=2, reference="FORF-PB", designation="Peinture pare-chocs (raccord)", type_ligne="peinture", unite="forfait", quantite=1, prix_unitaire_ht=180, taux_tva=20))
            db.session.add(devis1)
            db.session.commit()

            # Dossier hors assurance (facturé)
            dossier2 = Dossier(
                client_id=client2.id, vehicule_id=v2.id, statut="termine",
                type_sinistre="hors_assurance",
                description="Rayures profondes sur porte latérale gauche à reprendre en peinture.",
                date_entree_atelier=date.today() - timedelta(days=5),
                date_sortie_reelle=date.today() - timedelta(days=1),
            )
            dossier2.reference = Counter.next_number("dossier", "OR")
            db.session.add(dossier2)
            db.session.flush()

            facture2 = Facture(dossier_id=dossier2.id, statut="emise", destinataire_type="client",
                                date_emission=date.today() - timedelta(days=1))
            facture2.numero = Counter.next_number("facture", "FAC")
            facture2.date_echeance = facture2.date_emission + timedelta(days=entreprise.delai_paiement_jours or 30)
            facture2.lignes.append(FactureLigne(ordre=0, reference="MO-PEINT", designation="Ponçage et préparation porte avant gauche", type_ligne="peinture", unite="h", quantite=2, prix_unitaire_ht=65, taux_tva=20))
            facture2.lignes.append(FactureLigne(ordre=1, reference="FOURN", designation="Peinture et vernis", type_ligne="fourniture", unite="forfait", quantite=1, prix_unitaire_ht=95, taux_tva=20))
            db.session.add(facture2)
            dossier2.statut = "facture"
            db.session.commit()

        print("Données de démonstration créées avec succès.")


if __name__ == "__main__":
    run()
