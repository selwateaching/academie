# Séquences

Créateur de séquences de leçons avec Claude, en 4 étapes : **sujet → réglages → plan modifiable → génération leçon par leçon**.
Chaque leçon contient des diapositives mises en page (texte et image, liste, chronologie, étapes, citation, vocabulaire, activité Question/Réponse), avec 8 thèmes, des illustrations SVG dessinées par Claude et des notes de l'enseignant.
Un éditeur permet de modifier le texte en place, de réordonner, dupliquer, ajouter ou supprimer des diapositives, de changer de mise en page, et de demander à Claude de réécrire une diapositive. Mode « Enseigner » plein écran, impression / PDF. Les séquences sont enregistrées dans le navigateur.
Les illustrations sont filtrées côté serveur (liste blanche de balises SVG, rien d'externe).

```bash
cd sequences
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python server.py        # http://127.0.0.1:5000
```

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | clé API (obligatoire pour générer) |
| `SEQ_ACCESS_CODE` | code demandé avant de générer (évite que des inconnus consomment votre crédit) |
| `SEQ_MODEL` | modèle Claude (défaut `claude-sonnet-5-5`) |
| `SEQ_PER_HOUR` | appels IA max par heure et par IP (défaut 60) |

Déploiement Render : service `sequences` déjà décrit dans `../render.yaml`.
