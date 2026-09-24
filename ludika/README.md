# Ludika — mise en ligne sur Render

Ce dossier contient tout ce qu'il faut pour héberger Ludika :

| Fichier | Rôle |
|---|---|
| `static/index.html` | l'application (la même page que l'artefact Claude) |
| `server.py` | petit serveur Flask : sert la page, appelle Claude avec **votre** clé API, et fait tourner le mode classe en ligne |
| `requirements.txt` | dépendances Python |
| `../render.yaml` | configuration Render (à la racine du dépôt) |

La clé API reste sur le serveur : elle n'apparaît jamais dans la page.

## Déployer (une seule fois)

1. Sur [render.com](https://render.com), connectez-vous avec votre compte GitHub.
2. **New → Blueprint**, choisissez le dépôt `academie` et la branche qui contient ce dossier.
   Render lit `render.yaml` et crée le service `ludika` (dossier racine `ludika`).
3. Render demande les variables :
   - `ANTHROPIC_API_KEY` : votre clé (console.anthropic.com → API Keys). Vous pouvez la laisser vide pour l'instant :
     le site fonctionne, seule la génération IA affiche « le serveur n'a pas encore de clé API ».
   - `LUDIKA_ACCESS_CODE` : conseillé. Un mot de passe que les enseignants saisissent avant de générer,
     pour que des inconnus ne consomment pas votre crédit API. Laissez vide pour désactiver.
4. **Apply**. Après quelques minutes, le site est en ligne sur `https://ludika-xxxx.onrender.com`.

Sans Blueprint : **New → Web Service**, même dépôt, puis
- Root Directory : `ludika`
- Build Command : `pip install -r requirements.txt`
- Start Command : `gunicorn server:app --workers 1 --threads 8 --timeout 600 --bind 0.0.0.0:$PORT`

## Ajouter la clé plus tard

Render → service `ludika` → **Environment** → `ANTHROPIC_API_KEY` → Save. Le service redémarre tout seul.

## Réglages facultatifs (Environment)

| Variable | Défaut | Effet |
|---|---|---|
| `LUDIKA_MODEL` | `claude-opus-5` | modèle Claude utilisé |
| `LUDIKA_EFFORT` | (celui du modèle) | `low` / `medium` / `high` : plus bas = plus rapide et moins cher |
| `LUDIKA_GEN_PER_HOUR` | `20` | générations max par heure et par adresse IP |

## Bon à savoir

- **Élèves** : ils ouvrent la même adresse, touchent « Je suis élève » et tapent le code de la partie.
  Lien direct : `https://…onrender.com/#eleve`.
- **Offre gratuite Render** : le site s'endort après 15 minutes sans visite (le premier chargement prend ~1 minute),
  et le disque est effacé à chaque redémarrage : les parties en cours sont alors perdues.
  Les gamifications, classes et résultats des enseignants restent enregistrés dans leur navigateur.
  Pour garder les parties, prenez une offre payante avec un disque (Disks), montez-le par exemple sur `/data`
  et ajoutez `LUDIKA_DATA_FILE=/data/ludika.json`.
- Un seul processus (`--workers 1`) : la base du mode classe est en mémoire, n'augmentez pas ce nombre.
- Coût : chaque génération d'activité est facturée sur votre compte Anthropic (avec `claude-opus-5`, compter environ 0,10 à 0,50 $ selon le nombre de questions ; `LUDIKA_EFFORT=medium` réduit ce coût).

## Tester sur votre ordinateur

```bash
cd ludika
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # facultatif
python server.py                      # puis ouvrez http://localhost:5000
```
