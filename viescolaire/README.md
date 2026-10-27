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

Variables : `VSP_DATA` (dossier des données, défaut `viescolaire/data`), `VSP_SECRET_KEY`, `VSP_HTTPS=1` (cookies sécurisés derrière HTTPS), `PORT`.
En production, servez l'application derrière HTTPS avec un vrai serveur WSGI (gunicorn) et sauvegardez `VSP_DATA`.

## Fonctionnalités

| Module | Contenu |
|---|---|
| 1. Professeurs | Annuaire (matière, classes, contacts), fiches individuelles, emplois du temps jour/semaine/mois, absences et indisponibilités, remplacements avec suggestions automatiques |
| 2. Communication | Messagerie interne (personne, classe, niveau, tous), accusés et confirmations de lecture, réunions et convocations avec réponses, documents partagés |
| 3. Suivi des cours | Cours perturbés (annulé, salle indisponible, déplacé, remplacé), classes et professeurs principaux, tableau de bord quotidien, incidents |
| 4. Administratif | Tâches et échéances, alertes automatiques, rapports et statistiques (impression PDF, exports CSV pour Excel), historique des actions |
| 5. Avancé | Assistant (résumé du jour, suggestions), import CSV (professeurs, créneaux), interface adaptée au mobile et installable (PWA) |
| 6. Sécurité | Rôles (CPE, direction, enseignant), MFA (TOTP), verrouillage après tentatives, CSRF, en-têtes de sécurité, journal d'audit, export et suppression des données (RGPD), plusieurs établissements cloisonnés |

## Limites connues

- L'« assistant intelligent » repose sur des règles locales (disponibilités, matière, charge) et non sur un modèle de langage.
- Pas d'envoi d'e-mails ni de notifications push : les alertes s'affichent dans l'application.
- Un enseignant intervenant dans plusieurs établissements a une fiche par établissement.
