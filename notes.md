# Notes de continuité — projet `selwateaching/academie`

Ce fichier est relu au début de chaque nouvelle session pour retrouver le
contexte sans dépendre de l'historique de conversation (qui n'est pas
conservé d'une conversation à l'autre). Le code, lui, est toujours à jour
sur GitHub : c'est la source de vérité.

## ⚠️ Point important à clarifier

Le dépôt `selwateaching/academie` contient actuellement une application
**"AutoTrading Pro"** (voir section suivante) — un outil d'analyse d'achat/
revente de véhicules. Il n'y a **aucune trace** dans le code ou l'historique
Git d'un site "Sel Wa Teaching" déployé sur Render à l'adresse `tadriss.fr`.

Si le site tadriss.fr existe bien et est déployé automatiquement depuis
GitHub, il se trouve donc **dans un autre dépôt** que celui-ci — à vérifier
et préciser lors d'une prochaine session pour éviter de continuer à
travailler sur le mauvais projet.

Compte Gmail mentionné comme connecté : `hemma.bourdin@gmail.com` (à
confirmer à quoi il correspond exactement — probablement le compte Gmail
utilisé pour l'intégration OAuth de AutoTrading Pro, mais non vérifié dans
le code).

## État actuel du dépôt `academie`

**Projet réel : AutoTrading Pro** — application Flask qui :
- Se connecte à une boîte Gmail (OAuth2 Google) pour détecter les emails
  contenant des annonces de véhicules (BCA Auction, AUTO1, LeBonCoin,
  particuliers).
- Extrait les données du véhicule par regex (`email_parser.py`).
- Génère une analyse IA (décision ACHETER / À ÉTUDIER / REFUSER, marge
  estimée, niveau de risque) via l'API Anthropic (`analyzer.py`).
- Stocke tout en SQLite via SQLAlchemy (`models.py` : Vehicle, Analysis,
  OAuthToken).
- Affiche un tableau de bord Flask/Jinja2 (`templates/`, `static/`).

### Fichiers clés
- `app.py` — routes Flask, génère 6 véhicules de démo au premier lancement.
- `models.py`, `gmail_service.py`, `email_parser.py`, `analyzer.py`.
- `templates/` (dashboard, détail analyse, paramètres) + `static/css/js`.
- `README.md` — guide d'installation complet (OAuth Google Cloud, .env,
  lancement local).
- `.env.example` — variables requises : `ANTHROPIC_API_KEY`,
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `SECRET_KEY`, `DATABASE_URL`.

### Historique Git
4 commits au total, tous initiaux (création de l'app le 10 juin 2026) :
mise en place des modules Python, puis app Flask + templates + assets,
puis `.gitignore`. Aucun commit lié à un déploiement Render ou à un
domaine `tadriss.fr`.

## Prochaines étapes suggérées
1. Confirmer quel dépôt GitHub héberge réellement le site tadriss.fr —
   si ce n'est pas `academie`, mettre à jour ce fichier ou le déplacer
   dans le bon dépôt.
2. Si `academie` / AutoTrading Pro est bien le projet à continuer, ignorer
   les mentions de tadriss.fr et me dire simplement ce qu'il faut faire
   ensuite dessus (nouvelles fonctionnalités, corrections, déploiement...).
