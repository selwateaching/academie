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
| 1. Professeurs | Annuaire (matière, classes, contacts), fiches individuelles, emplois du temps jour/semaine/mois, absences et indisponibilités, remplacements avec suggestions automatiques |
| 2. Communication | Messagerie interne (personne, classe, niveau, tous), accusés et confirmations de lecture, réunions et convocations avec réponses, documents partagés |
| 3. Suivi des cours | Cours perturbés (annulé, salle indisponible, déplacé, remplacé), classes et professeurs principaux, tableau de bord quotidien, incidents |
| 4. Administratif | Tâches et échéances, alertes automatiques, rapports et statistiques (impression PDF, exports CSV pour Excel), historique des actions |
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

## Limites connues

- Planification : semaine du lundi au vendredi uniquement (pas encore de semaines Dim.–Jeu. ou avec samedi), pas d'alternance de semaines A/B, pas de gestion des
  salles spécialisées au-delà d'une salle imposée par besoin, pas de groupes d'élèves ni de cours partagés entre classes.

- L'« assistant intelligent » repose sur des règles locales (disponibilités, matière, charge) et non sur un modèle de langage.
- Pas d'envoi d'e-mails ni de notifications push : les alertes s'affichent dans l'application (l'envoi d'e-mails se branche par extension, voir `clients/exemple`).
- Exports : CSV (ouvrable dans Excel) et impression PDF depuis le navigateur ; pas de fichiers .xlsx/.pdf générés côté serveur.
- Pas d'API publique pour des intégrations tierces.
- Un enseignant intervenant dans plusieurs établissements a une fiche par établissement.
