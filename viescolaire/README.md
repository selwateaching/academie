# VieScolairePro

Logiciel web de gestion de la vie scolaire pour les CPE, la direction et les enseignants
(Flask + SQLite, aucune dépendance en plus de Flask).

## Lancer

```bash
pip install flask
# Démo avec données fictives (cpe@demo.fr / demo1234, direction@demo.fr, prof1@demo.fr … prof8@demo.fr)
flask --app viescolaire.app seed-demo
python -m viescolaire.app            # http://localhost:5001

# Production : créer son propre compte à la place de la démo
VSP_EMAIL=cpe@monecole.fr VSP_PASSWORD='un-mot-de-passe-long' VSP_NOM='Prénom Nom' VSP_ETAB='Mon collège' \
  flask --app viescolaire.app create-admin
```

Variables : `VSP_CONFIG` (fichier de configuration du client), `VSP_DATA` (dossier des données, défaut `viescolaire/data`), `VSP_SECRET_KEY`, `VSP_HTTPS=1` (cookies sécurisés derrière HTTPS), `PORT`.
En production, servez l'application derrière HTTPS avec un vrai serveur WSGI (gunicorn) et sauvegardez `VSP_DATA`.

Déploiement (Render, Docker…) : voir [DEPLOIEMENT.md](DEPLOIEMENT.md). Variable `VSP_DEMO=1` : charge la démo au premier démarrage.

## Fonctionnalités

| Module | Contenu |
|---|---|
| 1. Professeurs | Annuaire (matière, classes, contacts), fiches individuelles, emplois du temps jour/semaine/mois, absences et indisponibilités (**motifs en liste déroulante + saisie libre**), remplacements avec suggestions et **pourvoi automatique**. Absences, remplacements et cours perturbés sont reliés : une absence crée ses remplacements, chaque désignation prévient le remplaçant par message automatique, une absence déclarée par un enseignant prévient la vie scolaire |
| 2. Communication | Messagerie interne (personne, classe, niveau, tous), accusés et confirmations de lecture, réunions et convocations (professeurs par classe ou à la main, **élèves par classe** avec « toute la classe », recherche et décompte ; convocations aux parents rédigées en un clic) avec réponses, documents partagés |
| 3. Suivi des cours | **Analyse des cours perturbés** (toutes causes : absences, indisponibilités, salle, déplacement) par classe, cause, motif, professeur absent, matière et remplaçants, avec heures perdues et taux de couverture ; export CSV ; Cours perturbés (annulé, salle indisponible, déplacé, remplacé), classes et niveaux de classe gérés (6e, 2nde, Terminale… au choix de l'établissement) et professeurs principaux, tableau de bord quotidien, incidents |
| 4. Administratif | Tâches et échéances, alertes automatiques, rapports et statistiques (impression PDF, exports CSV pour Excel), historique des actions |
| Rédaction de documents | **Saisie automatique** : choisir un modèle (rapport d'incident, convocation des parents, avertissement, compte rendu d'entretien, signalement d'absences) et un élève → classe, professeur principal, équipe pédagogique, matière et responsable légal sont remplis ; liste déroulante de types d'incident avec texte proposé ; texte entièrement modifiable ; enregistrement dans *Documents*, impression/PDF, export Word. Modèles et types modifiables par l'établissement. Fichier des élèves avec fiche détaillée (professeur principal, équipe pédagogique, incidents, documents) (saisie ou import CSV ; la démo en contient 193 au collège et 24 au lycée, avec date de naissance et sexe) |
| Statistiques élèves | **Pyramide des âges et des sexes** (par niveau ou par classe, âge calculé à une date au choix), tableau des effectifs et export CSV |
| Infirmerie | **Planning des soins** (jour/semaine, soins ponctuels ou récurrents, suivi fait/absent/annulé), passages à l'infirmerie (registre, export), fiches santé (PAI, allergies, traitements). Rôle « infirmier » ; accès limité aux rôles de la clé `infirmerie_roles` (infirmier, direction, administrateur ; le CPE y a accès uniquement en mode démonstration) ; consultation des fiches journalisée. **Liens soins ↔ élèves** : le planning montre le cours de l'élève pendant le soin (et le remplaçant s'il y en a un) et prévient le professeur par message automatique sans information médicale ; une rentrée à domicile ou un appel des secours prévient la vie scolaire et le professeur principal ; la fiche élève affiche les rendez-vous à l'infirmerie (détails médicaux réservés aux personnes habilitées) |
| 5. Avancé | **Génération automatique de l'emploi du temps** (besoins horaires + vœux des professeurs → proposition à relire puis appliquer), assistant (résumé du jour, suggestions), import CSV (professeurs, créneaux), interface adaptée au mobile et installable (PWA) |
| 6. Sécurité | Gestion des comptes (création, mot de passe temporaire à changer, réinitialisation, désactivation), sauvegarde téléchargeable, rôles (CPE, direction, enseignant), MFA (TOTP), verrouillage après tentatives, CSRF, en-têtes de sécurité, journal d'audit, export et suppression des données (RGPD), plusieurs établissements cloisonnés |

## Un socle commun, une configuration par client

Chaque client a un fichier `config.json` (nom, logo, couleur, modules activés, règles de sécurité, extensions)
et, au besoin, ses propres extensions Python et gabarits, sans toucher au socle.
Exemple complet : `viescolaire/clients/exemple/`. Guide : [EVOLUTION.md](EVOLUTION.md).

```bash
VSP_CONFIG=viescolaire/clients/exemple/config.json python -m viescolaire.app
```

## Génération automatique de l'emploi du temps

Menu *Planification* : 1) saisir les **besoins** (classe × matière × professeur × heures, séances d'1 h ou de 2 h consécutives ; reprise possible depuis
l'emploi du temps actuel ou import CSV), 2) recueillir les **vœux** (indisponibilité impérative ou souhait par demi-journée, maximum d'heures par jour ;
les enseignants peuvent saisir les leurs via « Mes vœux »), 3) **générer** : le moteur (`planning.py`) propose un emploi du temps sans conflit
(professeur, classe, salle), respecte les vœux impératifs, minimise les souhaits non respectés et les trous, et explique les séances impossibles à placer.
La proposition se relit par classe ou par professeur avant d'être appliquée (avec confirmation).

**Rien n'est supposé par défaut** : les demi-journées sans cours (ex. mercredi après-midi), les horaires des créneaux et le maximum d'heures par classe
se règlent par établissement dans *Planification → Réglages de l'établissement*.

## Personnel (assistants pédagogiques / surveillants)

Menu *Personnel* : **annuaire** (poste(s) tenus par chaque agent, contrat hebdomadaire, maximum par jour, indisponibilités et souhaits), **postes** colorés
(Service, Étude, Foyer, Cour, Portail, Self, Bureau, Renfort… modifiables) avec leurs **besoins** par jour et plage horaire, et un **planning** visuel
(agents × axe horaire, pas de 15 min) avec solde hebdomadaire (contrat − planifié). Le moteur (`planning_personnel.py`) couvre les besoins en respectant
rôles, indisponibilités, maxima journaliers et contrats ; il explique les créneaux non couverts. Modes : *auto* (conserve les plages saisies à la main),
*compléter*, *tout régénérer*, avec annulation. Clic sur une plage = modifier / supprimer / copier vers d'autres jours ou un autre agent.
Export CSV. Accès réservé au personnel ; modules `personnel` et `planning_personnel` désactivables par client.

## Comptage des heures

Menu *Personnel → Comptage des heures* : heures hebdomadaires de chaque **professeur** (avec service dû saisissable, écart, nombre de cours et de classes,
heures remplacées / effectuées en remplacement sur une période), de chaque **classe** (avec détail par matière) et du **personnel de vie scolaire**
(contrat, heures planifiées, solde, détail par poste). Export CSV et impression. Module `heures`, désactivable par client.

## Trombinoscope

Menu *Vie scolaire → Trombinoscope* (et *Mon espace* pour les enseignants) : élèves par classe (avec le professeur principal), professeurs (matière, classes dont ils sont
professeur principal) et personnel de vie scolaire (postes). Photos envoyées par le personnel de vie scolaire (JPEG/PNG/WebP, réduites à 400 px dans le navigateur,
400 Ko maximum, stockées en base) ; sans photo, des initiales s'affichent. Impression par classe. Module `trombinoscope`, désactivable par client.
Les photos d'élèves sont des données personnelles : recueillir le consentement des familles.

## Limites connues

- Planification : semaine du lundi au vendredi uniquement (pas encore de semaines Dim.–Jeu. ou avec samedi), pas d'alternance de semaines A/B, pas de gestion des
  salles spécialisées au-delà d'une salle imposée par besoin, pas de groupes d'élèves ni de cours partagés entre classes.

- L'« assistant intelligent » repose sur des règles locales (disponibilités, matière, charge) et non sur un modèle de langage.
- Pas d'envoi d'e-mails ni de notifications push : les alertes s'affichent dans l'application (l'envoi d'e-mails se branche par extension, voir `clients/exemple`).
- Exports : CSV (ouvrable dans Excel) et impression PDF depuis le navigateur ; pas de fichiers .xlsx/.pdf générés côté serveur.
- Pas d'API publique pour des intégrations tierces.
- Un enseignant intervenant dans plusieurs établissements a une fiche par établissement.
