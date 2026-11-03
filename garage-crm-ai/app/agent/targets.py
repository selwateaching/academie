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


import re

# Entreprises dont le nom annonce de la carrosserie / peinture : ce sont des CONCURRENTS, pas des prospects.
COMPETITOR_RE = re.compile(r"carrosseri|carrossier|d[ée]bosselage|body\s?shop|peinture\s+auto|smart\s?repair|t[ôo]lerie|redressage|collision", re.I)


def is_competitor(name: str) -> bool:
    return bool(COMPETITOR_RE.search(name or ""))


import unicodedata


def normalize_name(s: str) -> str:
    """« Méca-Pulse Garage » -> « mecapulsegarage » (sans accents, espaces ni ponctuation)."""
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", s)


def own_names() -> list[str]:
    """Noms de VOS établissements (garage + EXCLUDE_NAMES) : jamais proposés comme prospects."""
    from ..config import get_settings
    s = get_settings()
    names = [s.garage_name] + [x for x in s.exclude_names.split(",")]
    return [n for n in (normalize_name(x) for x in names) if len(n) >= 5]


def is_own_business(name: str) -> bool:
    n = normalize_name(name)
    return bool(n) and any(o in n or (len(n) >= 8 and n in o) for o in own_names())


def label(key: str) -> str:
    return CATEGORIES.get(key, (key,))[0]
