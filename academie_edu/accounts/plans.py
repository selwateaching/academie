"""
Définition des offres d'abonnement (plans SaaS) proposées aux professeurs.

`max_classes` et `max_generations_ia_mois` valent `None` pour une limite illimitée.
Les prix sont indicatifs (en dinars algériens) et modifiables ici sans toucher au reste
de l'application.
"""

PLANS = {
    "gratuit": {
        "label": "Découverte",
        "prix_mensuel_da": 0,
        "max_classes": 1,
        "max_generations_ia_mois": 5,
        "description": "Pour découvrir la plateforme avec une classe et quelques générations IA.",
    },
    "standard": {
        "label": "Standard",
        "prix_mensuel_da": 2500,
        "max_classes": 5,
        "max_generations_ia_mois": 50,
        "description": "Pour un professeur avec plusieurs classes et un usage régulier de l'IA.",
    },
    "premium": {
        "label": "Premium",
        "prix_mensuel_da": 5000,
        "max_classes": None,
        "max_generations_ia_mois": None,
        "description": "Classes et générations IA illimitées.",
    },
}


def info(plan_code):
    return PLANS.get(plan_code, PLANS["gratuit"])


def limite_affichee(valeur):
    return "Illimité" if valeur is None else str(valeur)
