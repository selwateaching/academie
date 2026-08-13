"""
Référentiel du programme scolaire national algérien.

Structure indicative des cycles, années, filières et matières du système éducatif
algérien (Ministère de l'Éducation Nationale). Cette structure sert à guider le
choix de classe des professeurs et à orienter l'agent IA ; elle peut être ajustée
si un établissement suit une organisation légèrement différente.
"""

CYCLE_PRIMAIRE = "primaire"
CYCLE_MOYEN = "moyen"
CYCLE_SECONDAIRE = "secondaire"

CYCLES = [
    (CYCLE_PRIMAIRE, "Primaire"),
    (CYCLE_MOYEN, "Moyen (CEM)"),
    (CYCLE_SECONDAIRE, "Secondaire (Lycée)"),
]

MATIERES_PRIMAIRE = [
    "Langue arabe", "Mathématiques", "Éducation islamique", "Éducation civique",
    "Sciences et technologie", "Histoire-Géographie", "Éducation artistique",
    "Éducation physique et sportive", "Langue amazighe", "Langue française", "Langue anglaise",
]

MATIERES_MOYEN = [
    "Langue arabe", "Langue française", "Langue anglaise", "Mathématiques",
    "Sciences de la nature et de la vie", "Sciences physiques et technologie",
    "Histoire-Géographie", "Éducation islamique", "Éducation civique",
    "Informatique", "Éducation artistique", "Éducation physique et sportive", "Langue amazighe",
]

MATIERES_TRONC_COMMUN = [
    "Langue arabe et littérature", "Langue française", "Langue anglaise", "Mathématiques",
    "Sciences physiques", "Sciences naturelles et vie", "Histoire-Géographie",
    "Éducation islamique", "Éducation civique", "Informatique",
    "Éducation physique et sportive", "Langue amazighe/étrangère (LV3)",
]

MATIERES_SCIENCES_EXPERIMENTALES = [
    "Mathématiques", "Sciences naturelles et vie", "Sciences physiques", "Langue arabe et littérature",
    "Langue française", "Langue anglaise", "Histoire-Géographie", "Philosophie",
    "Éducation islamique", "Informatique", "Éducation physique et sportive",
]

MATIERES_MATHEMATIQUES = [
    "Mathématiques", "Sciences physiques", "Sciences naturelles et vie", "Langue arabe et littérature",
    "Langue française", "Langue anglaise", "Histoire-Géographie", "Philosophie",
    "Éducation islamique", "Informatique", "Éducation physique et sportive",
]

MATIERES_TECHNIQUES_MATHEMATIQUES = [
    "Mathématiques", "Sciences physiques", "Technologie (génie mécanique/électrique/civil/procédés)",
    "Langue arabe et littérature", "Langue française", "Langue anglaise",
    "Histoire-Géographie", "Éducation islamique", "Informatique", "Éducation physique et sportive",
]

MATIERES_GESTION_ECONOMIE = [
    "Économie et gestion des entreprises", "Comptabilité et gestion financière", "Droit",
    "Mathématiques", "Langue arabe et littérature", "Langue française", "Langue anglaise",
    "Histoire-Géographie", "Philosophie", "Éducation islamique", "Informatique",
]

MATIERES_LETTRES_PHILOSOPHIE = [
    "Langue arabe et littérature", "Philosophie", "Histoire-Géographie",
    "Langue française", "Langue anglaise", "Éducation islamique", "Mathématiques", "Informatique",
]

MATIERES_LETTRES_LANGUES = [
    "Langue arabe et littérature", "Langue française", "Langue anglaise",
    "Langue étrangère 3 (Allemand/Espagnol/Italien)", "Philosophie", "Histoire-Géographie",
    "Éducation islamique", "Informatique",
]

FILIERE_TC_SCIENCES = "tc_sciences"
FILIERE_TC_LETTRES = "tc_lettres"
FILIERE_SCIENCES_EXP = "sciences_exp"
FILIERE_MATHEMATIQUES = "mathematiques"
FILIERE_TECHNIQUES_MATH = "techniques_math"
FILIERE_GESTION_ECO = "gestion_eco"
FILIERE_LETTRES_PHILO = "lettres_philo"
FILIERE_LETTRES_LANGUES = "lettres_langues"

FILIERES_CHOICES = [
    (FILIERE_TC_SCIENCES, "Tronc commun Sciences"),
    (FILIERE_TC_LETTRES, "Tronc commun Lettres"),
    (FILIERE_SCIENCES_EXP, "Sciences expérimentales"),
    (FILIERE_MATHEMATIQUES, "Mathématiques"),
    (FILIERE_TECHNIQUES_MATH, "Techniques mathématiques"),
    (FILIERE_GESTION_ECO, "Gestion et économie"),
    (FILIERE_LETTRES_PHILO, "Lettres et philosophie"),
    (FILIERE_LETTRES_LANGUES, "Lettres et langues étrangères"),
]

_MATIERES_PAR_FILIERE = {
    FILIERE_TC_SCIENCES: MATIERES_TRONC_COMMUN,
    FILIERE_TC_LETTRES: MATIERES_TRONC_COMMUN,
    FILIERE_SCIENCES_EXP: MATIERES_SCIENCES_EXPERIMENTALES,
    FILIERE_MATHEMATIQUES: MATIERES_MATHEMATIQUES,
    FILIERE_TECHNIQUES_MATH: MATIERES_TECHNIQUES_MATHEMATIQUES,
    FILIERE_GESTION_ECO: MATIERES_GESTION_ECONOMIE,
    FILIERE_LETTRES_PHILO: MATIERES_LETTRES_PHILOSOPHIE,
    FILIERE_LETTRES_LANGUES: MATIERES_LETTRES_LANGUES,
}

# Structure imbriquée complète : cycle -> année -> {label, filieres: {code: {label, matieres}} | None, matieres si pas de filière}
PROGRAMME = {
    CYCLE_PRIMAIRE: {
        "label": "Primaire",
        "annees": {
            "1AP": {"label": "1ère année primaire", "filieres": {}, "matieres": MATIERES_PRIMAIRE},
            "2AP": {"label": "2ème année primaire", "filieres": {}, "matieres": MATIERES_PRIMAIRE},
            "3AP": {"label": "3ème année primaire", "filieres": {}, "matieres": MATIERES_PRIMAIRE},
            "4AP": {"label": "4ème année primaire", "filieres": {}, "matieres": MATIERES_PRIMAIRE},
            "5AP": {"label": "5ème année primaire", "filieres": {}, "matieres": MATIERES_PRIMAIRE},
        },
    },
    CYCLE_MOYEN: {
        "label": "Moyen (CEM)",
        "annees": {
            "1AM": {"label": "1ère année moyenne", "filieres": {}, "matieres": MATIERES_MOYEN},
            "2AM": {"label": "2ème année moyenne", "filieres": {}, "matieres": MATIERES_MOYEN},
            "3AM": {"label": "3ème année moyenne", "filieres": {}, "matieres": MATIERES_MOYEN},
            "4AM": {"label": "4ème année moyenne (BEM)", "filieres": {}, "matieres": MATIERES_MOYEN},
        },
    },
    CYCLE_SECONDAIRE: {
        "label": "Secondaire (Lycée)",
        "annees": {
            "1AS": {
                "label": "1ère année secondaire",
                "filieres": {
                    FILIERE_TC_SCIENCES: {"label": "Tronc commun Sciences", "matieres": MATIERES_TRONC_COMMUN},
                    FILIERE_TC_LETTRES: {"label": "Tronc commun Lettres", "matieres": MATIERES_TRONC_COMMUN},
                },
            },
            "2AS": {
                "label": "2ème année secondaire",
                "filieres": {
                    code: {"label": label, "matieres": _MATIERES_PAR_FILIERE[code]}
                    for code, label in FILIERES_CHOICES
                    if code not in (FILIERE_TC_SCIENCES, FILIERE_TC_LETTRES)
                },
            },
            "3AS": {
                "label": "3ème année secondaire (Baccalauréat)",
                "filieres": {
                    code: {"label": label, "matieres": _MATIERES_PAR_FILIERE[code]}
                    for code, label in FILIERES_CHOICES
                    if code not in (FILIERE_TC_SCIENCES, FILIERE_TC_LETTRES)
                },
            },
        },
    },
}


def annees_choices():
    choix = []
    for cycle_data in PROGRAMME.values():
        for code, annee in cycle_data["annees"].items():
            choix.append((code, annee["label"]))
    return choix


def filieres_choices():
    return FILIERES_CHOICES


def get_cycle_de_annee(annee_code):
    for cycle_code, cycle_data in PROGRAMME.items():
        if annee_code in cycle_data["annees"]:
            return cycle_code
    return None


def get_filieres_de_annee(annee_code):
    cycle_code = get_cycle_de_annee(annee_code)
    if not cycle_code:
        return {}
    return PROGRAMME[cycle_code]["annees"][annee_code]["filieres"]


def get_matieres(annee_code, filiere_code=""):
    cycle_code = get_cycle_de_annee(annee_code)
    if not cycle_code:
        return []
    annee_data = PROGRAMME[cycle_code]["annees"][annee_code]
    filieres = annee_data["filieres"]
    if filieres:
        filiere_data = filieres.get(filiere_code)
        return filiere_data["matieres"] if filiere_data else []
    return annee_data["matieres"]


def get_annee_label(annee_code):
    cycle_code = get_cycle_de_annee(annee_code)
    if not cycle_code:
        return annee_code
    return PROGRAMME[cycle_code]["annees"][annee_code]["label"]


def catalogue_json():
    """Structure compacte destinée au JavaScript de sélection en cascade."""
    return {
        cycle_code: {
            "label": cycle_data["label"],
            "annees": {
                annee_code: {
                    "label": annee_data["label"],
                    "filieres": {
                        f_code: {"label": f_data["label"], "matieres": f_data["matieres"]}
                        for f_code, f_data in annee_data["filieres"].items()
                    },
                    "matieres": annee_data["matieres"] if not annee_data["filieres"] else [],
                }
                for annee_code, annee_data in cycle_data["annees"].items()
            },
        }
        for cycle_code, cycle_data in PROGRAMME.items()
    }
