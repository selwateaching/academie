# Faire évoluer VieScolairePro

Le **socle** (`viescolaire/`) reste identique pour tous les clients. Tout ce qui est propre à un client
vit dans **son dossier** (par exemple `viescolaire/clients/<client>/`, ou un dépôt séparé) et se branche par
configuration. Le dossier `clients/exemple/` montre chaque mécanisme.

```
clients/<client>/
├── config.json        # nom, couleur, modules, extensions, réglages
├── extensions/        # code Python propre au client
├── templates/         # gabarits qui remplacent ceux du socle (même nom)
└── static/            # logo, css
```
Lancer un client : `VSP_CONFIG=viescolaire/clients/<client>/config.json python -m viescolaire.app`

## Quel niveau de changement pour quelle demande ?

| Demande du client | Où | Effort |
|---|---|---|
| Nom, logo, couleur principale, slogan | `config.json` (`produit`, `logo`, `couleur`, `slogan`, `css`) | minutes |
| Charte graphique complète (toutes les couleurs) | variables CSS en tête de `static/style.css` (palette actuelle : « gaya cocoon »), ou feuille `css` du client qui les redéfinit | minutes |
| Retirer une fonction (ex. pas d'incidents) | `config.json` → `"modules": {"incidents": false}` | minutes |
| Règles (mot de passe, durée de session, taille/type de fichiers) | `config.json` | minutes |
| Motifs d'absence proposés dans la liste | `config.json` → `motifs_absence`, `motifs_indisponibilite` | minutes |
| Qui accède aux données de santé de l'infirmerie | `config.json` → `infirmerie_roles` | minutes |
| Changer un texte ou une page | copier le gabarit du socle dans `templates/` du client et le modifier | heures |
| Réagir à un événement (e-mail, SMS, webhook…) | extension avec `@api.on("événement")` | heures |
| Nouvelle page, table, export, bloc de tableau de bord | extension (`ajouter_menu`, `ajouter_widget`, `ajouter_export`, `ajouter_schema`) | heures–jours |
| Fonction utile à **tous** les clients | modifier le socle (voir plus bas) | jours |

## Réglages du module « Réunions intelligentes »

La clé `reunions_ia` du `config.json` règle les rôles autorisés, les durées de conservation (audio, réunion), la taille maximale d'audio et les services de transcription et de rédaction (adresse, modèle, fournisseur). Les clés d'accès restent dans les variables d'environnement `VSP_STT_API_KEY` et `VSP_IA_API_KEY`. Voir README, section « Réunions intelligentes ». Pour brancher un autre fournisseur, modifier uniquement `viescolaire/reunions_ia.py` (fonctions `transcrire_fichier` et `rediger`).

## Écrire une extension

Un fichier Python dans `extensions/`, listé dans `config.json` (`"extensions": ["mon_extension"]`) :

```python
def register(api):
    reglages = api.reglages            # config.json -> extensions_config -> "mon_extension"

    @api.on("absence.creee")           # voir la liste des événements ci-dessous
    def prevenir(absence_id, prof_id, nb_remplacements, **_):
        ...

    api.ajouter_schema("CREATE TABLE IF NOT EXISTS x_mes_donnees (...);")   # préfixer les tables par x_
    api.ajouter_menu("Ma page", "mon_endpoint")                              # endpoint Flask ou chemin
    api.ajouter_widget("Titre", lambda: "<p>HTML déjà échappé</p>")
    api.ajouter_export("mon_export", "SELECT ... WHERE etab_id=?")           # /export/mon_export.csv
    @api.app.route("/x/page", endpoint="mon_endpoint")                       # routes Flask classiques
    def page(): ...
```
Outils fournis : `api.q`, `api.one`, `api.run` (SQL), `api.audit` (journal), `api.staff_only`, `api.app`.
Dans une route, `g.user`, `g.etab_id` donnent l'utilisateur et l'établissement courants : **filtrez toujours
vos requêtes par `etab_id`** pour garder le cloisonnement, et protégez vos pages par rôle.

Événements disponibles (les paramètres sont passés en arguments nommés ; terminez par `**_` pour rester compatible
avec d'éventuels ajouts) :

| Événement | Paramètres |
|---|---|
| `connexion` | user_id |
| `professeur.cree` | prof_id, nom |
| `absence.creee` | absence_id, prof_id, type, date_debut, date_fin, nb_remplacements |
| `remplacement.assigne` | remplacement_id, remplacant_id, date |
| `message.envoye` | message_id, sujet, corps, expediteur, emails |
| `reunion.creee` | reunion_id, titre, date, heure, lieu, emails |
| `tache.creee` | tache_id, titre, echeance |
| `incident.cree` | incident_id, classe, description |
| `utilisateur.cree` | user_id, email, nom, role |
| `document.genere` | document_id, modele, eleve_id, auteur |
| `soin.programme` | soin_id, eleve_id, intitule |
| `passage.enregistre` | passage_id, eleve_id, motif |

Une extension qui plante est journalisée et **ne bloque jamais** l'action de l'utilisateur.
Les secrets (mots de passe SMTP…) vont dans des variables d'environnement, pas dans `config.json`.

## Modifier le socle

1. **Base de données** : ne jamais éditer `SCHEMA`. Ajouter une migration à `MIGRATIONS` dans `db.py`
   (numéro suivant, SQL idempotent si possible). Elle est appliquée une seule fois à chaque base, y compris
   celles des clients déjà en production.
2. **Nouveau module** : ajouter son nom dans `MODULES` (`config.py`), ses endpoints dans `MODULE_DES_ENDPOINTS`
   (`app.py`) et protéger les entrées de menu par `module_actif('nom')`.
3. **Nouvel événement** : l'ajouter dans `EVENEMENTS` (`ext.py`) puis `ext.emit(...)` à l'endroit voulu ; documenter ici.
   Événement émis par le planning du personnel : `planning_personnel.genere` (`nb_affectations`, `couverture`).
   Réglages par client : `categories_personnel`, `grille_personnel` (axe horaire du planning), `creneaux`.
   Le moteur du planning du personnel (`planning_personnel.py`) est autonome : `generer(besoins, agents, fixes, options)`.
4. Garder les valeurs par défaut identiques au comportement actuel : un client existant ne doit rien remarquer.
5. Avant livraison : relancer les tests (parcours complet, rôles, cloisonnement) sur le socle **et** sur `clients/exemple`.

## Bonnes pratiques de versionnement

- Le socle porte un numéro de version ; chaque client note celui qu'il utilise.
- Les extensions et gabarits d'un client ne dépendent que de l'API documentée ci-dessus : c'est ce qui permet de
  mettre à jour le socle sans casser les clients. Un gabarit surchargé est une copie : après une mise à jour du
  socle, comparer avec le nouvel original.
- Les données de chaque client restent dans son propre dossier de données (`data_dir`), sauvegardé séparément.
