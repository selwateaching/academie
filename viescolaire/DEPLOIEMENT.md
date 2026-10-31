# Déployer VieScolairePro

L'application est un serveur Python (Flask + gunicorn) avec une base SQLite. Elle se déploie sur tout hébergeur
qui sait lancer une application Python ou un conteneur Docker.

## Render (le plus simple)

Le fichier `render.yaml` à la racine du dépôt déclare déjà le service **viescolaire-pro** (mode démonstration).

1. Sur render.com : **New → Blueprint**, choisir ce dépôt et la branche, valider. Le service `viescolaire-pro` est créé
   (les autres services du fichier le sont aussi : désélectionnez-les si vous n'en voulez pas).
2. Attendre la fin du build (2–3 min), puis ouvrir l'adresse `https://viescolaire-pro-xxxx.onrender.com`.
3. Se connecter avec `cpe@demo.fr` / `demo1234` (les identifiants sont rappelés sur la page de connexion).

Sans blueprint : **New → Web Service**, *Root Directory* `viescolaire`, *Build* `pip install -r requirements.txt`,
*Start* `gunicorn server:app --workers 1 --threads 8 --bind 0.0.0.0:$PORT`, *Health check* `/healthz`,
et les variables ci-dessous.

| Variable | Valeur | Rôle |
|---|---|---|
| `VSP_DEMO` | `1` | Charge les données de démonstration au premier démarrage et verrouille les comptes de démo |
| `VSP_HTTPS` | `1` | Cookies de session sécurisés (à mettre dès que le site est en HTTPS) |
| `VSP_SECRET_KEY` | chaîne aléatoire | Clé de signature des sessions |
| `VSP_DATA` | ex. `/data` | Dossier de la base et des fichiers (monter un disque persistant dessus) |
| `VSP_CONFIG` | chemin du `config.json` | Configuration d'un client (voir EVOLUTION.md) |
| `VSP_STT_API_KEY` | clé du service de transcription | Module *Réunions intelligentes* : transcription audio → texte (facultatif, payant à l'usage) |
| `VSP_IA_API_KEY` | clé du service de rédaction | Module *Réunions intelligentes* : compte rendu par IA (facultatif, payant à l'usage) |

**Le plan gratuit de Render efface les fichiers à chaque redéploiement et met le service en veille** : parfait pour une
démo (elle se recharge toute seule), pas pour de vraies données. Pour un client, prenez un plan payant avec un *disque
persistant* monté sur `VSP_DATA`.

## Passer de la démo à la production

1. Retirer `VSP_DEMO` (ou le mettre à `0`).
2. Monter un disque persistant et définir `VSP_DATA`.
3. Créer le premier compte, depuis le *Shell* du service :
   `VSP_EMAIL=cpe@monecole.fr VSP_PASSWORD='mot-de-passe-long' VSP_NOM='Prénom Nom' VSP_ETAB='Mon collège' flask --app viescolaire.app create-admin`
   (lancé depuis la racine du dépôt). Les comptes enseignants se créent ensuite avec les fonctions de l'application / un import.
4. Activer l'authentification à deux facteurs sur les comptes de gestion (menu *Sécurité*).
5. Sauvegarder régulièrement le dossier `VSP_DATA` (fichier `viescolaire.db` et dossier `uploads/`).

## Docker (Railway, Fly.io, Scaleway, serveur perso…)

```bash
docker build -f viescolaire/Dockerfile -t viescolairepro .
docker run -p 8000:8000 -e VSP_DEMO=1 -v vsp-data:/data viescolairepro     # démo sur http://localhost:8000
```

## Autres hébergeurs Python (Heroku, Railway sans Docker…)

Le dossier `viescolaire/` contient `requirements.txt` et un `Procfile` (`gunicorn server:app`) : définir le dossier racine
sur `viescolaire`, ou lancer `gunicorn viescolaire.app:app` depuis la racine du dépôt.

## Remarques

- Gardez **un seul processus gunicorn** (`--workers 1`) : SQLite et le verrouillage des tentatives de connexion sont locaux au processus.
  Pour plusieurs instances, il faudrait migrer vers PostgreSQL.
- Ne mettez jamais de vraies données dans une instance en mode démonstration.
