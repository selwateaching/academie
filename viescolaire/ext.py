"""Points d'extension : permet d'ajouter des fonctions propres à un client sans modifier le socle."""
import importlib
import logging
import sys

journal = logging.getLogger("viescolaire")

HOOKS = {}      # événement -> [fonctions]
NAV = []        # entrées de menu ajoutées par les extensions
WIDGETS = []    # blocs du tableau de bord
SCHEMAS = []    # SQL supplémentaire (tables propres à l'extension)

EVENEMENTS = {
    "connexion": "user_id",
    "professeur.cree": "prof_id, nom",
    "absence.creee": "absence_id, prof_id, type, date_debut, date_fin, nb_remplacements",
    "remplacement.assigne": "remplacement_id, remplacant_id, date",
    "message.envoye": "message_id, sujet, corps, expediteur, emails",
    "reunion.creee": "reunion_id, titre, date, heure, lieu, emails",
    "tache.creee": "tache_id, titre, echeance",
    "incident.cree": "incident_id, classe, description",
    "utilisateur.cree": "user_id, email, nom, role",
    "emploi_du_temps.applique": "proposition_id, nb_creneaux",
    "document.genere": "document_id, modele, eleve_id, auteur",
    "soin.programme": "soin_id, eleve_id, intitule",
    "passage.enregistre": "passage_id, eleve_id, motif",
    "planning_personnel.genere": "nb_affectations, couverture",
}


def emit(evenement, **donnees):
    """Appelle les extensions abonnées. Une extension en erreur ne doit jamais bloquer le socle."""
    for fn in HOOKS.get(evenement, []):
        try:
            fn(**donnees)
        except Exception:
            journal.exception("Extension en erreur sur l'événement %s", evenement)


class API:
    """Objet transmis à register(api) dans chaque extension."""

    def __init__(self, app, nom, reglages, outils):
        self.app, self.nom, self.reglages = app, nom, reglages
        self.q, self.one, self.run, self.audit = outils["q"], outils["one"], outils["run"], outils["log"]
        self.staff_only = outils["staff_only"]
        self.exports = outils["exports"]
        self.csrf = outils["csrf"]

    def on(self, evenement):
        if evenement not in EVENEMENTS:
            raise ValueError(f"Événement inconnu : {evenement}. Disponibles : {', '.join(EVENEMENTS)}")

        def deco(fn):
            HOOKS.setdefault(evenement, []).append(fn)
            return fn
        return deco

    def ajouter_menu(self, libelle, cible, roles=("admin", "direction", "cpe")):
        """cible : nom d'endpoint Flask ou chemin commençant par '/'."""
        NAV.append({"libelle": libelle, "cible": cible, "roles": tuple(roles)})

    def ajouter_widget(self, titre, fn):
        """fn() -> HTML (déjà échappé) affiché sur le tableau de bord du personnel."""
        WIDGETS.append({"titre": titre, "fn": fn})

    def ajouter_schema(self, sql):
        """SQL idempotent (CREATE TABLE IF NOT EXISTS …) exécuté au démarrage."""
        SCHEMAS.append(sql)

    def ajouter_export(self, nom, sql):
        """Ajoute un export CSV /export/<nom>.csv ; la requête reçoit l'établissement courant (?)."""
        self.exports[nom] = sql


def charger_extensions(app, cfg, outils):
    if cfg["extensions_dir"] and cfg["extensions_dir"] not in sys.path:
        sys.path.insert(0, cfg["extensions_dir"])
    for nom in cfg["extensions"]:
        module = importlib.import_module(nom)
        if not hasattr(module, "register"):
            raise ImportError(f"L'extension {nom} doit définir register(api)")
        module.register(API(app, nom, cfg["extensions_config"].get(nom, {}), outils))
        journal.info("Extension chargée : %s", nom)
