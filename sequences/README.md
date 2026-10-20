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

## Plans et quotas (comme la page Tarifs)

| | Gratuit | Pro | Max |
|---|---|---|---|
| Ressources (1 leçon générée = 1 ressource) | 5 / 7 jours | 200 / 30 jours | 400 / 30 jours |
| Leçons par séquence | 5 | 12 | 25 |
| Diapositives par leçon | 12 | 25 | 35 |
| Alignement sur les programmes, vidéos YouTube, sans badge | – | oui | oui |
| Thèmes et polices personnalisés | – | – | oui |

Prix : Pro 9,99 €/mois (6,65 €/mois en annuel), Max 18,99 €/mois (12,49 €/mois en annuel). Export PowerPoint (compatible Google Slides) pour tous.
Les plafonds sont des constantes `PLANS` et `PRICES` dans `server.py`.

**Limites actuelles à connaître**
- Pas de compte : chaque navigateur reçoit un identifiant et le serveur retient son plan et son compteur. Vider les données du navigateur remet le compteur à zéro.
- Pas de vrai paiement : avec `PAYMENT_MODE=demo` (défaut) n'importe qui peut activer Pro ou Max gratuitement ; `PAYMENT_MODE=off` ferme les abonnements.
- Quotas, plafonds de leçons et de diapositives sont appliqués côté serveur. Les verrous Pro/Max (vidéos, thèmes, badge, programme) ne le sont que dans la page.
- Plans et compteurs sont dans `data.json` : sur l'offre gratuite de Render, le disque est effacé à chaque redémarrage.
- Le formulaire « Écoles » enregistre les messages ; `SEQ_ADMIN_CODE` permet de les lire via `/api/contact?code=…`.
