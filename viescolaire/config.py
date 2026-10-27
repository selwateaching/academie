"""Configuration du socle VieScolairePro.

Un client = un fichier JSON (variable VSP_CONFIG). Tout ce qui n'y figure pas prend la valeur par défaut.
Les chemins relatifs du fichier sont résolus depuis son dossier.
"""
import json
import os

MODULES = ["professeurs", "emplois_du_temps", "absences", "remplacements", "cours", "classes", "incidents",
           "messagerie", "reunions", "documents", "taches", "rapports", "assistant", "import", "utilisateurs", "sauvegarde", "planification"]

DEFAUTS = {
    "produit": "VieScolairePro",
    "slogan": "La vie scolaire, mieux organisée.",
    "couleur": "#2563eb",
    "logo": "",                       # nom d'un fichier de static_dir (ex. "logo.svg")
    "css": "",                        # feuille de style additionnelle de static_dir
    "modules": {m: True for m in MODULES},
    "extensions": [],                 # modules Python à charger (ex. ["notifications_email"])
    "extensions_config": {},          # réglages propres à chaque extension : {"nom": {...}}
    "extensions_dir": "",             # dossier contenant les extensions du client
    "templates_dir": "",              # gabarits qui remplacent ceux du socle (même nom de fichier)
    "static_dir": "",                 # fichiers statiques du client (logo, css), servis sur /client-static/
    "data_dir": "",                   # base de données et fichiers déposés
    "mdp_min": 10,
    "session_heures": 8,
    "upload_max_mo": 8,
    "fichiers_autorises": ["pdf", "doc", "docx", "xls", "xlsx", "csv", "odt", "ods", "png", "jpg", "jpeg", "txt", "pptx"],
    "creneaux": [],                   # grille horaire proposée à la saisie, ex. ["08:00-09:00", "09:00-10:00"]
}


def charger():
    cfg = json.loads(json.dumps(DEFAUTS))
    chemin = os.environ.get("VSP_CONFIG", "")
    if chemin:
        base = os.path.dirname(os.path.abspath(chemin))
        with open(chemin, encoding="utf-8") as f:
            perso = json.load(f)
        inconnues = set(perso) - set(DEFAUTS)
        if inconnues:
            raise ValueError(f"Clés inconnues dans {chemin} : {', '.join(sorted(inconnues))}")
        mods = perso.pop("modules", {})
        mauvais = set(mods) - set(MODULES)
        if mauvais:
            raise ValueError(f"Modules inconnus : {', '.join(sorted(mauvais))}")
        cfg.update(perso)
        cfg["modules"] = {**DEFAUTS["modules"], **mods}
        for cle in ("extensions_dir", "templates_dir", "static_dir", "data_dir"):
            if cfg[cle] and not os.path.isabs(cfg[cle]):
                cfg[cle] = os.path.join(base, cfg[cle])
    return cfg


CFG = charger()
