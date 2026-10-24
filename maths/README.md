# Tadriss-Maths

Site d'exercices de maths interactifs (GS → 6e), avec comptes, abonnements mensuels et suivi des progrès.

- Tarifs : **200 DA / mois par niveau, de la GS à la Terminale** (un compte), **600 DA / mois pour le forfait Famille** (tous les niveaux, jusqu’à 5 profils). Abonnement de 30 jours par niveau, sans reconduction automatique.
- 3 compétences gratuites par niveau (codes A.1, B.1, C.1).
- Compte parent, jusqu'à 5 profils d'élèves, progression enregistrée côté serveur.
- Paiement CIB / Edahabia via Chargily Pay (mode test par défaut).

## Lancer en local

```bash
cd maths
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
PAYMENT_MODE=demo python server.py      # http://127.0.0.1:8000
python -m unittest discover tests       # tests du serveur
```

Sans `DATABASE_URL`, une base SQLite `tadriss.db` est créée. Sans serveur (fichier `index.html` ouvert seul), tout est accessible et la progression reste dans le navigateur.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `SECRET_KEY` | clé des sessions (générée par Render) |
| `DATABASE_URL` | base PostgreSQL (fournie par Render) |
| `BASE_URL` | adresse publique du site, ex. `https://tadriss-maths.onrender.com` |
| `PAYMENT_MODE` | `demo` (paiement simulé) ou `chargily` |
| `CHARGILY_SECRET_KEY` | clé secrète Chargily (test, puis live) |
| `CHARGILY_MODE` | `test` (faux paiements) ou `live` |

## Déploiement sur Render

`render.yaml` (à la racine du dépôt) décrit le service web `tadriss-maths` et la base `tadriss-db`. Après création : renseigner `BASE_URL` et `CHARGILY_SECRET_KEY`, puis passer `PAYMENT_MODE` à `chargily`. Dans Chargily, déclarer le webhook `BASE_URL/api/webhook/chargily`.

## Accorder un abonnement à la main

```bash
python manage.py grant parent@exemple.com cm1 30
python manage.py list
```

## Limites connues

- Les exercices sont générés dans le navigateur : le blocage des niveaux payants empêche l'enregistrement de la progression et masque l'accès, mais ne protège pas le code JavaScript lui-même.
- Le client Chargily a été écrit sans accès à leur documentation en ligne : à tester avec une clé de test avant tout lancement. Le serveur revérifie chaque paiement auprès de Chargily avant d'activer l'abonnement.
- Pas de confirmation d'e-mail ni de mot de passe oublié, pas d'écran d'administration.
- Les conditions d'utilisation sont un brouillon à faire relire.
- La limitation du nombre d'essais de connexion est en mémoire (un seul worker).
- Interface en français ; l'arabe (RTL) viendra après validation du français.
