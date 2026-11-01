"""Cibles commerciales d'un garage / carrosserie / mécanique.

Ce sont des clients professionnels qui génèrent un flux régulier de réparations :
flottes, loueurs, concessionnaires, assureurs/experts, taxis/VTC, artisans, etc.
"""

# clé -> (libellé, requête de recherche, poids de base pour le score, argument d'accroche)
CATEGORIES = {
    "location": ("Agences de location", "agence de location de véhicules", 20,
                 "forte rotation des véhicules, besoin de remises en état rapides (carrosserie, jantes, pare-chocs)"),
    "concession": ("Concessionnaires", "concessionnaire automobile", 18,
                   "surcharge d'atelier, besoin de sous-traiter carrosserie et peinture"),
    "vo": ("Marchands de véhicules d'occasion", "vente de véhicules d'occasion", 20,
           "remise en état avant vente (débosselage, peinture, mécanique) à coûts maîtrisés"),
    "flotte": ("Entreprises à flotte", "entreprise avec flotte de véhicules utilitaires", 22,
               "immobilisation à limiter : entretien, mécanique et carrosserie avec délais courts"),
    "assurance": ("Assurances et experts", "expert automobile assurance", 15,
                  "réseau de réparateurs agréés, devis et délais de prise en charge"),
    "taxi": ("Taxis / VTC / ambulances", "société de taxi VTC ambulance", 18,
             "véhicules très sollicités : entretien régulier et réparations sans longue immobilisation"),
    "btp": ("Artisans / BTP", "entreprise de BTP plomberie électricité", 12,
            "utilitaires de chantier exposés aux chocs, contrat d'entretien"),
    "transport": ("Transporteurs / livraison", "société de transport livraison", 20,
                  "camionnettes en circulation permanente, mécanique et carrosserie rapides"),
    "autoecole": ("Auto-écoles", "auto-école", 12,
                  "véhicules à double commande, entretien régulier et petits dégâts de carrosserie"),
    "garage": ("Garages sans carrosserie", "garage automobile mécanique", 10,
               "partenariat : sous-traitance de carrosserie et peinture"),
}


def label(key: str) -> str:
    return CATEGORIES.get(key, (key,))[0]
