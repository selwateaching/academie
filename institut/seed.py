"""Données initiales : prestations, diagnostics, règles, stocks, paramètres.

Tout est modifiable ensuite depuis l'espace professionnel.
"""

import random
from datetime import datetime, timedelta

from db import jdump, now_iso

YN = [{"value": "yes", "label": "Oui"}, {"value": "no", "label": "Non"}]


def opts(*pairs):
    return [{"value": v, "label": l} for v, l in pairs]


DEFAULT_SETTINGS = {
    "institute": {
        "name": "Rosée",
        "tagline": "Institut de beauté — cheveux, ongles & regard",
        "address": "12 rue des Camélias, 75000 Paris",
        "phone": "01 23 45 67 89",
        "email": "contact@rosee-institut.example",
        "siret": "000 000 000 00000",
        "legal": "Micro-entreprise — TVA non applicable, art. 293 B du CGI",
    },
    # 0 = lundi ... 6 = dimanche ; liste de plages [début, fin]
    "opening_hours": {
        "0": [], "1": [["09:30", "12:30"], ["13:30", "18:30"]], "2": [["09:30", "12:30"], ["13:30", "18:30"]],
        "3": [["09:30", "12:30"], ["13:30", "19:30"]], "4": [["09:30", "12:30"], ["13:30", "18:30"]],
        "5": [["09:00", "17:00"]], "6": [],
    },
    "booking": {
        "slot_step": 30,
        "min_notice_hours": 12,
        "max_days_ahead": 90,
        "auto_confirm": True,
        "cancel_hours": 24,
        "quote_validity_days": 30,
    },
    "loyalty": {"points_per_euro": 1, "reward_points": 100, "reward_value": 5},
    "reminders": {"confirmation": True, "h48": True, "h24": True, "thanks": True, "thanks_delay_hours": 3},
    "marketing": {"hero_image": "", "gallery": [], "category_images": {}},
}

SERVICES = [
    # slug, name, category, description, price, duration, prep, cleanup, deposit, conditions, diag_slug, diag_required
    ("lissage-bresilien", "Lissage brésilien", "Cheveux",
     "Un lissage lissant et disciplinant longue durée pour des cheveux souples, brillants et faciles à coiffer.",
     150, 180, 10, 15, 30, "Diagnostic obligatoire. Ne pas se laver les cheveux 48 h après la prestation.", "lissage", 1),
    ("lissage-tanin", "Lissage au tanin", "Cheveux",
     "Une alternative sans formol, idéale pour discipliner les frisottis tout en respectant la fibre.",
     140, 150, 10, 15, 30, "Diagnostic obligatoire.", "lissage", 1),
    ("soin-reparateur", "Soin réparateur", "Cheveux",
     "Soin profond à la kératine pour restructurer les cheveux cassants ou abîmés.",
     45, 45, 0, 10, 0, "", None, 0),
    ("soin-hydratant", "Soin hydratant", "Cheveux",
     "Masque hydratant intense pour assouplir et redonner de l'éclat aux longueurs sèches.",
     35, 40, 0, 10, 0, "", None, 0),
    ("soin-profond", "Soin profond détox & nutrition", "Cheveux",
     "Rituel complet : clarification du cuir chevelu, masque nutrition et brushing.",
     60, 60, 0, 10, 0, "", None, 0),
    ("diagnostic-institut", "Diagnostic complémentaire en institut", "Cheveux",
     "Analyse approfondie de votre chevelure avec la professionnelle, test de mèche si nécessaire.",
     15, 30, 0, 5, 0, "Le montant est déduit de la prestation réalisée ensuite.", None, 0),
    ("manucure-classique", "Manucure classique", "Ongles",
     "Limage, soin des cuticules, gommage et vernis classique.",
     35, 45, 0, 10, 0, "", "onglerie", 0),
    ("manucure-semi-permanent", "Manucure semi-permanent", "Ongles",
     "Préparation soignée et vernis semi-permanent tenue 2 à 3 semaines.",
     45, 60, 0, 10, 0, "", "onglerie", 1),
    ("pose-gel", "Pose gel / renfort", "Ongles",
     "Renforcement ou extension en gel, forme et finition sur mesure.",
     65, 90, 0, 10, 15, "Diagnostic obligatoire.", "onglerie", 1),
    ("depose-ongles", "Dépose", "Ongles",
     "Dépose douce du semi-permanent ou du gel, avec soin des ongles.",
     20, 30, 0, 5, 0, "", None, 0),
    ("soin-fortifiant-ongles", "Soin fortifiant des ongles", "Ongles",
     "Cure fortifiante et réparatrice pour ongles fragiles ou striés.",
     25, 30, 0, 5, 0, "", None, 0),
    ("pedicure-classique", "Pédicure beauté", "Pieds",
     "Bain, gommage, limage, soin des cuticules et vernis.",
     50, 60, 0, 10, 0, "", "pedicure", 1),
    ("pedicure-semi-permanent", "Pédicure semi-permanent", "Pieds",
     "Pédicure beauté complète avec pose de vernis semi-permanent.",
     60, 75, 0, 10, 0, "", "pedicure", 1),
    ("soin-callosites", "Soin pieds callosités", "Pieds",
     "Soin spécifique des peaux sèches et épaisses, hydratation intense.",
     55, 60, 0, 10, 0, "Soin de beauté — ne remplace pas une consultation podologique.", None, 0),
    ("rehaussement-cils", "Rehaussement de cils", "Cils",
     "Courbure naturelle et regard ouvert pendant 6 à 8 semaines, avec teinture.",
     60, 60, 5, 10, 15, "Diagnostic obligatoire. Retirer les lentilles avant la prestation.", "cils", 1),
    ("extensions-cils", "Extensions de cils cil à cil", "Cils",
     "Pose d'extensions cil à cil pour un regard sublimé sur mesure.",
     90, 120, 5, 10, 20, "Diagnostic obligatoire.", "cils", 1),
    ("soin-cils", "Soin nourrissant des cils", "Cils",
     "Cure réparatrice pour cils fragilisés avant une nouvelle prestation.",
     25, 30, 0, 5, 0, "", None, 0),
]

PRODUCTS = [
    # name, brand, category, sku, unit, cost, sale, sellable, stock, min, supplier, expiry
    ("Shampooing clarifiant professionnel", "Maison Kera", "Cheveux", "SH-CLA-1L", "L", 14, 0, 0, 3.5, 1.5, "Pro Beauté Distribution", ""),
    ("Masque réparateur kératine", "Maison Kera", "Cheveux", "MA-KER-500", "pot 500 ml", 22, 0, 0, 4, 2, "Pro Beauté Distribution", ""),
    ("Masque hydratant intense", "Maison Kera", "Cheveux", "MA-HYD-500", "pot 500 ml", 19, 0, 0, 3, 2, "Pro Beauté Distribution", ""),
    ("Produit lissage brésilien", "Alisha Pro", "Cheveux", "LI-BRE-1L", "L", 85, 0, 0, 2.2, 1, "Alisha Pro France", "2027-03-01"),
    ("Produit lissage tanin", "Alisha Pro", "Cheveux", "LI-TAN-1L", "L", 78, 0, 0, 1.0, 1, "Alisha Pro France", "2026-12-15"),
    ("Sérum thermo-protecteur", "Maison Kera", "Cheveux", "SE-THE-100", "flacon 100 ml", 9, 24, 1, 12, 4, "Pro Beauté Distribution", ""),
    ("Huile nourrissante argan", "Maison Kera", "Cheveux", "HU-ARG-50", "flacon 50 ml", 8, 21, 1, 3, 4, "Pro Beauté Distribution", ""),
    ("Vernis semi-permanent (collection)", "Nuance", "Ongles", "VS-COL-15", "flacon 15 ml", 5.5, 0, 0, 40, 15, "Nuance Pro", ""),
    ("Base & top coat", "Nuance", "Ongles", "BT-15", "flacon 15 ml", 7, 0, 0, 8, 4, "Nuance Pro", ""),
    ("Gel builder", "Nuance", "Ongles", "GB-30", "pot 30 g", 12, 0, 0, 6, 3, "Nuance Pro", ""),
    ("Dissolvant professionnel", "Nuance", "Ongles", "DI-500", "flacon 500 ml", 6, 0, 0, 5, 2, "Nuance Pro", ""),
    ("Limes jetables", "Nuance", "Ongles", "LI-J-50", "pièce", 0.2, 0, 0, 120, 50, "Nuance Pro", ""),
    ("Huile cuticules", "Nuance", "Ongles", "HC-15", "flacon 15 ml", 3, 12, 1, 14, 5, "Nuance Pro", ""),
    ("Crème pieds hydratante", "Douce Plante", "Pieds", "CP-200", "tube 200 ml", 6, 18, 1, 9, 4, "Douce Plante", ""),
    ("Gommage pieds", "Douce Plante", "Pieds", "GP-500", "pot 500 ml", 11, 0, 0, 2, 1, "Douce Plante", ""),
    ("Kit rehaussement de cils", "Lashup", "Cils", "RC-KIT", "dose", 3.5, 0, 0, 18, 10, "Lashup Pro", "2026-11-20"),
    ("Colle extensions cils", "Lashup", "Cils", "CO-5", "flacon 5 ml", 14, 0, 0, 2, 2, "Lashup Pro", "2026-12-01"),
    ("Extensions cils (barrette)", "Lashup", "Cils", "EX-C", "barrette", 4, 0, 0, 25, 10, "Lashup Pro", ""),
    ("Sérum cils nourrissant", "Lashup", "Cils", "SC-5", "flacon 5 ml", 7, 28, 1, 6, 3, "Lashup Pro", ""),
    ("Gants nitrile (boîte)", "Hygiène", "Consommables", "GN-100", "boîte", 7, 0, 0, 5, 2, "Pro Beauté Distribution", ""),
    ("Serviettes jetables", "Hygiène", "Consommables", "SJ-100", "lot de 100", 9, 0, 0, 3, 2, "Pro Beauté Distribution", ""),
]

# service slug -> [(produit, quantité)]
CONSUMPTION = {
    "lissage-bresilien": [("Shampooing clarifiant professionnel", 0.1), ("Masque réparateur kératine", 0.1), ("Produit lissage brésilien", 0.15)],
    "lissage-tanin": [("Shampooing clarifiant professionnel", 0.1), ("Produit lissage tanin", 0.15)],
    "soin-reparateur": [("Masque réparateur kératine", 0.08)],
    "soin-hydratant": [("Masque hydratant intense", 0.08)],
    "soin-profond": [("Shampooing clarifiant professionnel", 0.05), ("Masque hydratant intense", 0.1)],
    "manucure-classique": [("Limes jetables", 1), ("Huile cuticules", 0.05)],
    "manucure-semi-permanent": [("Vernis semi-permanent (collection)", 0.1), ("Base & top coat", 0.1), ("Limes jetables", 1), ("Dissolvant professionnel", 0.02)],
    "pose-gel": [("Gel builder", 0.15), ("Base & top coat", 0.1), ("Limes jetables", 2)],
    "depose-ongles": [("Dissolvant professionnel", 0.05), ("Limes jetables", 1)],
    "pedicure-classique": [("Gommage pieds", 0.05), ("Crème pieds hydratante", 0.1), ("Limes jetables", 1)],
    "pedicure-semi-permanent": [("Gommage pieds", 0.05), ("Vernis semi-permanent (collection)", 0.1), ("Base & top coat", 0.1), ("Limes jetables", 1)],
    "soin-callosites": [("Gommage pieds", 0.08), ("Crème pieds hydratante", 0.15)],
    "rehaussement-cils": [("Kit rehaussement de cils", 1), ("Gants nitrile (boîte)", 0.01)],
    "extensions-cils": [("Colle extensions cils", 0.1), ("Extensions cils (barrette)", 1)],
    "soin-cils": [("Sérum cils nourrissant", 0.05)],
}


def _q(id, label, type="single", options=None, required=True, show_if=None, help=""):
    d = {"id": id, "label": label, "type": type, "required": required}
    if options is not None:
        d["options"] = options
    if show_if:
        d["show_if"] = show_if
    if help:
        d["help"] = help
    return d


SCALE = lambda: opts(("1", "1 — pas du tout"), ("2", "2"), ("3", "3 — moyennement"), ("4", "4"), ("5", "5 — extrêmement"))


def diagnostics():
    """Retourne la liste des diagnostics fournis avec leurs règles."""
    out = []

    # ---------------------------------------------------------------- LISSAGE
    out.append({
        "slug": "lissage", "name": "Diagnostic lissage", "category": "Cheveux",
        "intro": "Ce questionnaire nous permet d'évaluer l'état de votre chevelure afin de vous proposer la solution la plus adaptée et la plus sûre. Il ne prend que quelques minutes.",
        "questions": [
            _q("hair_type", "Quel est votre type de cheveux ?", "single", opts(("raides", "Raides"), ("ondules", "Ondulés"), ("boucles", "Bouclés"), ("crepus", "Frisés / crépus"))),
            _q("hair_state", "Vos cheveux sont-ils…", "single", opts(("naturels", "Naturels"), ("colores", "Colorés"), ("decolores", "Décolorés"), ("meches", "Méchés"))),
            _q("recent_color", "Avez-vous fait une coloration récemment (moins de 6 semaines) ?", "yesno", YN),
            _q("bleached", "Vos cheveux ont-ils déjà subi une décoloration ?", "yesno", YN),
            _q("past_smoothing", "Avez-vous déjà réalisé un lissage ?", "yesno", YN),
            _q("smoothing_type", "Quel type de lissage avez-vous réalisé ?", "single",
               opts(("bresilien", "Lissage brésilien"), ("keratine", "Kératine"), ("tanin", "Tanin"), ("japonais", "Lissage japonais"), ("autre", "Autre / je ne sais pas")),
               show_if={"q": "past_smoothing", "op": "eq", "v": "yes"}),
            _q("smoothing_when", "Il y a combien de temps ?", "single",
               opts(("lt3", "Moins de 3 mois"), ("3_6", "3 à 6 mois"), ("6_12", "6 à 12 mois"), ("gt12", "Plus d'un an")),
               show_if={"q": "past_smoothing", "op": "eq", "v": "yes"}),
            _q("dryness", "Vos cheveux sont-ils secs ?", "scale", SCALE()),
            _q("breakage", "Vos cheveux sont-ils cassants ?", "yesno", YN),
            _q("split_ends", "Avez-vous beaucoup de fourches ?", "single", opts(("peu", "Peu"), ("moyen", "Quelques-unes"), ("beaucoup", "Beaucoup"))),
            _q("porosity", "Vos cheveux sont-ils très poreux ?", "single", opts(("faible", "Non, peu poreux"), ("moyenne", "Moyennement"), ("forte", "Oui, très poreux"), ("nsp", "Je ne sais pas")),
               help="Un cheveu poreux absorbe vite l'eau mais la retient mal, et sèche très vite."),
            _q("dryer", "Utilisez-vous régulièrement un sèche-cheveux ?", "single", opts(("jamais", "Rarement"), ("parfois", "Parfois"), ("regulier", "Régulièrement"))),
            _q("flat_iron", "Utilisez-vous régulièrement un lisseur ?", "single", opts(("jamais", "Rarement"), ("parfois", "Parfois"), ("regulier", "Régulièrement"))),
            _q("chemical", "Avez-vous actuellement un traitement chimique en cours (défrisage, permanente…) ?", "yesno", YN),
            _q("pregnant", "Êtes-vous enceinte ou allaitante ?", "single", opts(("no", "Non"), ("yes", "Oui"), ("talk", "Je préfère en parler à la professionnelle"))),
            _q("allergy", "Avez-vous une allergie connue aux produits capillaires (kératine, aldéhydes…) ?", "yesno", YN),
            _q("allergy_detail", "Précisez votre allergie", "text", required=False, show_if={"q": "allergy", "op": "eq", "v": "yes"}),
            _q("goal", "Quel est votre objectif ?", "multi",
               opts(("frisottis", "Réduire les frisottis"), ("temps", "Gagner du temps au coiffage"), ("lisse", "Obtenir un cheveu très lisse"), ("brillance", "Plus de brillance"), ("volume", "Discipliner le volume"))),
            _q("comment", "Souhaitez-vous ajouter quelque chose ?", "text", required=False),
        ],
        "photo_slots": [
            {"id": "face", "label": "Vue de face", "required": False},
            {"id": "back", "label": "Vue arrière", "required": False},
            {"id": "side", "label": "Profil", "required": False},
            {"id": "lengths", "label": "Gros plan des longueurs", "required": False},
        ],
        "rules": [
            ("Cheveux très abîmés → préparation", 10,
             {"all": [{"q": "dryness", "op": "gte", "v": 4}, {"q": "breakage", "op": "eq", "v": "yes"}, {"q": "porosity", "op": "eq", "v": "forte"}]},
             {"verdict": "prepare", "recommend": ["soin-reparateur", "soin-hydratant", "diagnostic-institut"],
              "message": "Votre chevelure semble nécessiter une phase de préparation et de réparation.",
              "note": "Cheveux secs + cassants + très poreux."}),
            ("Cheveux décolorés → soin réparateur", 20,
             {"any": [{"q": "hair_state", "op": "eq", "v": "decolores"}, {"q": "bleached", "op": "eq", "v": "yes"}]},
             {"verdict": "caution", "recommend": ["soin-reparateur"],
              "alert": "Les cheveux décolorés sont plus fragiles : un test de mèche pourra être réalisé avant le lissage.",
              "note": "Décoloration déclarée."}),
            ("Cheveux décolorés et cassants → préparation", 15,
             {"all": [{"any": [{"q": "hair_state", "op": "eq", "v": "decolores"}, {"q": "bleached", "op": "eq", "v": "yes"}]}, {"q": "breakage", "op": "eq", "v": "yes"}]},
             {"verdict": "prepare", "recommend": ["soin-reparateur", "soin-hydratant"]}),
            ("Cheveux extrêmement abîmés → déconseillé", 5,
             {"all": [{"q": "dryness", "op": "gte", "v": 5}, {"q": "breakage", "op": "eq", "v": "yes"}, {"q": "split_ends", "op": "eq", "v": "beaucoup"}]},
             {"verdict": "not_now", "validation": True, "recommend": ["diagnostic-institut"],
              "message": "Le lissage est déconseillé tant que l'état de vos cheveux ne s'est pas amélioré."}),
            ("Fort usage de la chaleur → hydratation", 40,
             {"any": [{"q": "flat_iron", "op": "eq", "v": "regulier"}, {"q": "dryer", "op": "eq", "v": "regulier"}]},
             {"verdict": "caution", "recommend": ["soin-hydratant"]}),
            ("Cliente enceinte ou allaitante → validation", 1,
             {"q": "pregnant", "op": "in", "v": ["yes", "talk"]},
             {"verdict": "caution", "validation": True,
              "alert": "Grossesse / allaitement : certains produits de lissage ne sont pas recommandés. Votre rendez-vous sera soumis à la validation de la professionnelle, selon les règles de l'institut.",
              "note": "Grossesse ou allaitement déclaré — validation requise."}),
            ("Lissage récent → validation", 30,
             {"all": [{"q": "past_smoothing", "op": "eq", "v": "yes"}, {"q": "smoothing_when", "op": "eq", "v": "lt3"}]},
             {"verdict": "caution", "validation": True,
              "alert": "Un lissage de moins de 3 mois : la professionnelle vérifiera la compatibilité avant de confirmer."}),
            ("Traitement chimique en cours → validation", 25,
             {"q": "chemical", "op": "eq", "v": "yes"},
             {"verdict": "caution", "validation": True,
              "alert": "Un traitement chimique en cours nécessite l'avis de la professionnelle avant le lissage."}),
            ("Allergie déclarée → validation", 3,
             {"q": "allergy", "op": "eq", "v": "yes"},
             {"verdict": "caution", "validation": True,
              "alert": "Allergie déclarée : un test cutané et l'accord de la professionnelle seront nécessaires."}),
            ("Coloration récente → attendre", 35,
             {"q": "recent_color", "op": "eq", "v": "yes"},
             {"verdict": "caution",
              "alert": "Une coloration très récente peut fragiliser la fibre : nous pourrons vous conseiller d'attendre quelques semaines."}),
        ],
    })

    # -------------------------------------------------------------- ONGLERIE
    out.append({
        "slug": "onglerie", "name": "Diagnostic onglerie", "category": "Ongles",
        "intro": "Quelques questions sur l'état de vos ongles pour préparer au mieux votre prestation.",
        "questions": [
            _q("nail_state", "Quel est l'état général de vos ongles ?", "single", opts(("sains", "Sains"), ("fragiles", "Fragiles, cassants ou dédoublés"), ("stries", "Striés ou irréguliers"), ("abimes", "Abîmés (après pose précédente)"))),
            _q("current", "Que portez-vous actuellement ?", "single", opts(("naturels", "Ongles naturels"), ("semi", "Vernis semi-permanent"), ("gel", "Gel / résine"), ("capsules", "Capsules / extensions"))),
            _q("removal", "La dépose de votre pose actuelle est-elle nécessaire ?", "yesno", YN, show_if={"q": "current", "op": "in", "v": ["semi", "gel", "capsules"]}),
            _q("fragile", "Vos ongles sont-ils fragiles ?", "yesno", YN),
            _q("biting", "Vous rongez-vous les ongles ?", "yesno", YN),
            _q("skin_issue", "Constatez-vous une inflammation, une infection, une lésion ou une décoloration inhabituelle sur ou autour des ongles ?", "yesno", YN,
               help="Par sécurité, nous ne réalisons pas de prestation sur une zone infectée ou irritée."),
            _q("allergy", "Avez-vous des allergies connues (résines, acrylates, vernis…) ?", "yesno", YN),
            _q("allergy_detail", "Précisez", "text", required=False, show_if={"q": "allergy", "op": "eq", "v": "yes"}),
            _q("wanted", "Quelle prestation souhaitez-vous ?", "single", opts(("classique", "Manucure classique"), ("semi", "Semi-permanent"), ("gel", "Pose gel / renfort"), ("depose", "Dépose uniquement"))),
            _q("comment", "Forme, longueur, couleur : une envie particulière ?", "text", required=False),
        ],
        "photo_slots": [
            {"id": "hands", "label": "Vos mains (dessus)", "required": False},
            {"id": "closeup", "label": "Gros plan des ongles", "required": False},
        ],
        "rules": [
            ("Atteinte cutanée → déconseillé", 1, {"q": "skin_issue", "op": "eq", "v": "yes"},
             {"verdict": "not_now", "validation": True, "recommend": [],
              "alert": "Par sécurité, la prestation ne peut pas être réalisée sur une zone irritée ou infectée. Nous vous invitons à consulter un professionnel de santé.",
              "message": "Un avis de la professionnelle est nécessaire avant toute réservation."}),
            ("Allergie → validation", 5, {"q": "allergy", "op": "eq", "v": "yes"},
             {"verdict": "caution", "validation": True, "alert": "Allergie déclarée : la professionnelle validera les produits utilisés avant de confirmer."}),
            ("Pose existante → dépose", 20, {"q": "removal", "op": "eq", "v": "yes"},
             {"verdict": "caution", "recommend": ["depose-ongles"], "alert": "Une dépose est nécessaire avant la nouvelle prestation (20 € — 30 min)."}),
            ("Ongles fragiles → soin fortifiant", 30,
             {"any": [{"q": "fragile", "op": "eq", "v": "yes"}, {"q": "nail_state", "op": "in", "v": ["fragiles", "abimes"]}]},
             {"verdict": "caution", "recommend": ["soin-fortifiant-ongles"]}),
            ("Ongles abîmés + gel → préparation", 15,
             {"all": [{"q": "nail_state", "op": "eq", "v": "abimes"}, {"q": "wanted", "op": "eq", "v": "gel"}]},
             {"verdict": "prepare", "recommend": ["soin-fortifiant-ongles"],
              "message": "Vos ongles semblent avoir besoin d'une phase de renforcement avant une pose."}),
        ],
    })

    # -------------------------------------------------------------- PÉDICURE
    out.append({
        "slug": "pedicure", "name": "Diagnostic pédicure", "category": "Pieds",
        "intro": "Pour des soins adaptés et en toute sécurité, merci de répondre à ces quelques questions.",
        "questions": [
            _q("feet_state", "Quel est l'état général de vos pieds ?", "single", opts(("bon", "Bon état"), ("secs", "Peau sèche"), ("callosites", "Callosités importantes"), ("crevasses", "Crevasses / talons fendus"))),
            _q("callus", "Intensité des callosités", "scale", SCALE()),
            _q("toenails", "Comment sont vos ongles de pieds ?", "single", opts(("sains", "Sains"), ("epais", "Épais ou abîmés"), ("incarnes", "Souvent incarnés"), ("decolores", "Décolorés / aspect inhabituel"))),
            _q("wanted", "Quelle prestation souhaitez-vous ?", "single", opts(("classique", "Pédicure beauté"), ("semi", "Avec semi-permanent"), ("callosites", "Soin callosités"))),
            _q("sensitive", "Avez-vous des sensibilités particulières ?", "multi", opts(("chatouilles", "Pieds très chatouilleux"), ("fine", "Peau très fine / sensible"), ("douleur", "Douleurs fréquentes"), ("aucune", "Aucune")), help="Plusieurs réponses possibles."),
            _q("health", "Avez-vous un diabète, des troubles de la circulation ou de la cicatrisation ?", "yesno", YN),
            _q("wound", "Avez-vous une plaie, une verrue, une mycose ou une infection actuellement ?", "yesno", YN),
            _q("allergy", "Avez-vous des allergies connues (produits, vernis…) ?", "yesno", YN),
            _q("comment", "Autre précision ?", "text", required=False),
        ],
        "photo_slots": [
            {"id": "feet", "label": "Vos pieds (dessus)", "required": False},
            {"id": "heels", "label": "Gros plan des talons", "required": False},
        ],
        "rules": [
            ("Plaie / infection → déconseillé", 1, {"q": "wound", "op": "eq", "v": "yes"},
             {"verdict": "not_now", "validation": True,
              "alert": "Par sécurité, nous ne réalisons pas de soin sur une plaie ou une infection. Nous vous invitons à consulter un professionnel de santé."}),
            ("Diabète / circulation → validation", 2, {"q": "health", "op": "eq", "v": "yes"},
             {"verdict": "caution", "validation": True,
              "alert": "Diabète ou troubles circulatoires : un avis médical peut être nécessaire. La professionnelle validera votre rendez-vous et adaptera le soin."}),
            ("Ongles à aspect inhabituel → validation", 3, {"q": "toenails", "op": "in", "v": ["decolores", "incarnes"]},
             {"verdict": "caution", "validation": True,
              "alert": "Un ongle décoloré ou souvent incarné peut nécessiter l'avis d'un professionnel de santé (podologue)."}),
            ("Callosités importantes → soin dédié", 20,
             {"any": [{"q": "callus", "op": "gte", "v": 4}, {"q": "feet_state", "op": "in", "v": ["callosites", "crevasses"]}]},
             {"verdict": "caution", "recommend": ["soin-callosites"]}),
            ("Allergie → validation", 10, {"q": "allergy", "op": "eq", "v": "yes"},
             {"verdict": "caution", "validation": True, "alert": "Allergie déclarée : les produits utilisés seront validés avec vous."}),
        ],
    })

    # ------------------------------------------------------------------ CILS
    out.append({
        "slug": "cils", "name": "Diagnostic cils", "category": "Cils",
        "intro": "Le regard est une zone sensible : ces questions nous permettent de vous recevoir en toute sécurité.",
        "questions": [
            _q("lenses", "Portez-vous des lentilles de contact ?", "yesno", YN),
            _q("sensitivity", "Vos yeux sont-ils sensibles ?", "single", opts(("non", "Non"), ("legere", "Légèrement (larmoiement, irritation parfois)"), ("forte", "Oui, très sensibles / yeux secs"))),
            _q("eye_issue", "Avez-vous actuellement une conjonctivite, un orgelet ou une infection / irritation des yeux ?", "yesno", YN),
            _q("surgery", "Avez-vous eu une opération ou un laser des yeux récemment ?", "yesno", YN),
            _q("allergy", "Avez-vous des allergies connues (colle, kératine, teinture…) ?", "yesno", YN),
            _q("previous", "Avez-vous déjà réalisé un rehaussement ou des extensions de cils ?", "yesno", YN),
            _q("last", "Quand a eu lieu la dernière prestation ?", "single", opts(("lt6", "Moins de 6 semaines"), ("6_12", "Entre 6 et 12 semaines"), ("gt12", "Plus de 12 semaines")),
               show_if={"q": "previous", "op": "eq", "v": "yes"}),
            _q("lash_state", "Quel est l'état de vos cils ?", "single", opts(("sains", "Sains et denses"), ("clairsemes", "Clairsemés / fins"), ("abimes", "Fragilisés ou abîmés"), ("courts", "Très courts"))),
            _q("pregnant", "Êtes-vous enceinte ou allaitante ?", "single", opts(("no", "Non"), ("yes", "Oui"), ("talk", "Je préfère en parler"))),
            _q("goal", "Quel est l'objectif recherché ?", "multi", opts(("courbe", "Courbure naturelle"), ("ouvert", "Regard plus ouvert"), ("volume", "Plus de volume"), ("pratique", "Gagner du temps le matin"))),
        ],
        "photo_slots": [
            {"id": "open", "label": "Yeux ouverts, de face", "required": False},
            {"id": "closeup", "label": "Gros plan des cils", "required": False},
        ],
        "rules": [
            ("Infection oculaire → déconseillé", 1, {"q": "eye_issue", "op": "eq", "v": "yes"},
             {"verdict": "not_now", "validation": True,
              "alert": "Par sécurité, aucune prestation sur les cils en cas d'infection ou d'irritation oculaire. Consultez un professionnel de santé."}),
            ("Chirurgie / laser récent → déconseillé", 2, {"q": "surgery", "op": "eq", "v": "yes"},
             {"verdict": "not_now", "validation": True, "alert": "Après une opération des yeux, l'accord de votre médecin est nécessaire."}),
            ("Allergie → validation", 5, {"q": "allergy", "op": "eq", "v": "yes"},
             {"verdict": "caution", "validation": True, "alert": "Allergie déclarée : un test préalable et l'accord de la professionnelle seront nécessaires."}),
            ("Grossesse → validation", 6, {"q": "pregnant", "op": "in", "v": ["yes", "talk"]},
             {"verdict": "caution", "validation": True, "alert": "Grossesse / allaitement : votre rendez-vous sera soumis à validation de la professionnelle."}),
            ("Yeux très sensibles → validation", 7, {"q": "sensitivity", "op": "eq", "v": "forte"},
             {"verdict": "caution", "validation": True, "alert": "Yeux très sensibles : la professionnelle vérifiera la compatibilité avant de confirmer."}),
            ("Lentilles → précaution", 30, {"q": "lenses", "op": "eq", "v": "yes"},
             {"verdict": "caution", "alert": "Pensez à retirer vos lentilles avant la prestation et à vous munir de votre étui."}),
            ("Prestation récente / cils abîmés → soin", 20,
             {"any": [{"q": "last", "op": "eq", "v": "lt6"}, {"q": "lash_state", "op": "eq", "v": "abimes"}]},
             {"verdict": "prepare", "recommend": ["soin-cils"],
              "message": "Vos cils ont besoin de récupérer avant une nouvelle prestation : nous recommandons une cure nourrissante."}),
        ],
    })
    return out


def seed_all(conn, admin_email, admin_password_hash):
    from werkzeug.security import generate_password_hash  # noqa: F401  (utilisé par app)

    for key, value in DEFAULT_SETTINGS.items():
        conn.execute("INSERT OR IGNORE INTO settings(key,value) VALUES (?,?)", (key, jdump(value)))

    diag_ids = {}
    for d in diagnostics():
        cur = conn.execute(
            "INSERT INTO diagnostics(slug,name,category,intro,questions,photo_slots,verdict_texts) VALUES (?,?,?,?,?,?,?)",
            (d["slug"], d["name"], d["category"], d["intro"], jdump(d["questions"]), jdump(d["photo_slots"]), jdump({})))
        diag_ids[d["slug"]] = cur.lastrowid
        for name, prio, cond, act in d["rules"]:
            conn.execute("INSERT INTO diagnostic_rules(diagnostic_id,name,condition,action,priority) VALUES (?,?,?,?,?)",
                         (cur.lastrowid, name, jdump(cond), jdump(act), prio))

    svc_ids = {}
    for pos, s in enumerate(SERVICES):
        slug, name, cat, desc, price, dur, prep, clean, dep, cond, dslug, dreq = s
        cur = conn.execute(
            "INSERT INTO services(slug,name,category,description,price,duration,prep_time,cleanup_time,deposit,conditions,diagnostic_id,diagnostic_required,position) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (slug, name, cat, desc, price, dur, prep, clean, dep, cond, diag_ids.get(dslug), dreq, pos))
        svc_ids[slug] = cur.lastrowid

    prod_ids = {}
    for p in PRODUCTS:
        name, brand, cat, sku, unit, cost, sale, sellable, stock, mn, sup, exp = p
        cur = conn.execute(
            "INSERT INTO products(name,brand,category,sku,unit,cost_price,sale_price,sellable,stock,min_stock,supplier,expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (name, brand, cat, sku, unit, cost, sale, sellable, stock, mn, sup, exp))
        prod_ids[name] = cur.lastrowid
        if stock:
            conn.execute("INSERT INTO stock_movements(product_id,delta,reason,note,unit_cost,created_at) VALUES (?,?,?,?,?,?)",
                         (cur.lastrowid, stock, "inventory", "Stock initial", cost, now_iso()))
    for slug, items in CONSUMPTION.items():
        for pname, qty in items:
            conn.execute("INSERT INTO service_products(service_id,product_id,qty) VALUES (?,?,?)", (svc_ids[slug], prod_ids[pname], qty))

    conn.execute("INSERT INTO users(role,email,pw_hash,first_name,last_name,consent_data,created_at) VALUES ('pro',?,?,?,?,1,?)",
                 (admin_email, admin_password_hash, "Professionnelle", "Rosée", now_iso()))
    conn.commit()


def iso_end(d):
    return d.replace(microsecond=0).isoformat()


def seed_demo(conn):
    """Clientes et activité de démonstration (désactivable avec INSTITUT_SEED_DEMO=0)."""
    import core
    from werkzeug.security import generate_password_hash

    rnd = random.Random(7)
    pw = generate_password_hash("demo-cliente-2026")
    people = [
        ("Marie", "Dupont", "marie.dupont@example.com", "06 11 22 33 44", 1),
        ("Sofia", "Benali", "sofia.benali@example.com", "06 22 33 44 55", 1),
        ("Camille", "Martin", "camille.martin@example.com", "06 33 44 55 66", 0),
        ("Inès", "Lefèvre", "ines.lefevre@example.com", "06 44 55 66 77", 1),
        ("Léa", "Moreau", "lea.moreau@example.com", "06 55 66 77 88", 0),
        ("Nadia", "Haddad", "nadia.haddad@example.com", "06 66 77 88 99", 1),
    ]
    ids = []
    for fn, ln, em, ph, photo in people:
        cur = conn.execute(
            "INSERT INTO users(role,email,pw_hash,first_name,last_name,phone,consent_data,consent_marketing,consent_photos,created_at) VALUES ('client',?,?,?,?,?,1,1,?,?)",
            (em, pw, fn, ln, ph, photo, now_iso()))
        ids.append(cur.lastrowid)
    svcs = [r["id"] for r in conn.execute("SELECT id FROM services WHERE diagnostic_required=0 OR slug LIKE 'manucure%' OR slug LIKE 'pedicure%'")]
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    for offset in range(-70, 14):
        day = today + timedelta(days=offset)
        if day.weekday() in (0, 6):
            continue
        t = day.replace(hour=9, minute=30)
        for _ in range(rnd.choice([1, 2, 2, 3])):
            sid = rnd.choice(svcs)
            svc = conn.execute("SELECT * FROM services WHERE id=?", (sid,)).fetchone()
            start = t + timedelta(minutes=svc["prep_time"])
            if start.hour >= 17:
                break
            end = start + timedelta(minutes=svc["duration"])
            status = "termine" if offset < 0 else rnd.choice(["confirme", "confirme", "en_attente"])
            if offset < 0 and rnd.random() < 0.07:
                status = rnd.choice(["no_show", "annule"])
            cid = rnd.choice(ids)
            cur = conn.execute(
                "INSERT INTO appointments(client_id,service_id,start,end,prep,cleanup,status,price,source,created_at) VALUES (?,?,?,?,?,?,'confirme',?,'online',?)",
                (cid, sid, start.isoformat(timespec="minutes"), end.isoformat(timespec="minutes"), svc["prep_time"], svc["cleanup_time"], svc["price"], now_iso()))
            if status != "confirme":
                core.set_status(conn, cur.lastrowid, status, send=False)
            if status == "termine":  # prestation passée : facture réglée à la date du rendez-vous
                inv = conn.execute("SELECT id FROM invoices WHERE appointment_id=?", (cur.lastrowid,)).fetchone()
                pid = core.record_payment(conn, cid, svc["price"], rnd.choice(["carte", "espèces", "carte"]), "payment", invoice_id=inv["id"], appointment_id=cur.lastrowid)
                conn.execute("UPDATE payments SET created_at=? WHERE id=?", (iso_end(end), pid))
                conn.execute("UPDATE invoices SET created_at=? WHERE id=?", (iso_end(end), inv["id"]))
            t = end + timedelta(minutes=svc["cleanup_time"] + 15)
    conn.commit()


def seed_demo_diagnostic(conn):
    """Un dossier de diagnostic en attente + un devis, pour une démonstration réaliste."""
    import core
    from engine import missing_required  # noqa: F401
    marie = conn.execute("SELECT id FROM users WHERE email='marie.dupont@example.com'").fetchone()["id"]
    answers = {"hair_type": "ondules", "hair_state": "decolores", "recent_color": "no", "bleached": "yes", "past_smoothing": "no", "dryness": "4",
               "breakage": "yes", "split_ends": "moyen", "porosity": "forte", "dryer": "regulier", "flat_iron": "regulier", "chemical": "no",
               "pregnant": "no", "allergy": "no", "goal": ["frisottis", "brillance"]}
    diag = core.load_diagnostic(conn, slug="lissage")
    svc = dict(conn.execute("SELECT * FROM services WHERE slug='lissage-bresilien'").fetchone())
    result = core.run_diagnostic(conn, diag, answers, svc)
    sub = conn.execute("INSERT INTO submissions(client_id,diagnostic_id,service_id,answers,photos,result,validation,created_at) VALUES (?,?,?,?,?,?,?,?)",
                       (marie, diag["id"], svc["id"], jdump(answers), "[]", jdump(result), "pending" if result["needs_validation"] else "none", now_iso())).lastrowid
    items = [{"label": r["name"], "price": r["price"], "qty": 1, "service_id": r["id"]} for r in result["recommended"]]
    core.create_quote(conn, marie, items, result["steps"], sub, status="sent")
    sofia = conn.execute("SELECT id FROM users WHERE email='sofia.benali@example.com'").fetchone()["id"]
    cils = dict(conn.execute("SELECT * FROM services WHERE slug='rehaussement-cils'").fetchone())
    start = (datetime.now() + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
    while start.weekday() in (0, 6):
        start += timedelta(days=1)
    core.create_appointment(conn, sofia, cils, start, status="demande", source="online", check=False)
    conn.commit()
