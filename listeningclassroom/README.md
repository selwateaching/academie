# ListeningClassroom

Générateur d'audio en anglais (texte arabe ou français → anglais A1–B2) et labo de langue en ligne (exercices d'écoute corrigés automatiquement).

## Pages

| URL | Rôle |
|---|---|
| `/` | Accueil |
| `/generator/` | Audio une voix, dialogue, et mode « AR / FR → EN » par niveau |
| `/lab/` | Labo : le prof crée et publie un exercice (`/lab/?id=…` pour l'apprenant, `/lab/?id=…#key=…` pour les résultats) |
| `/privacy.html` | Confidentialité |

## API

- `POST /api/adapt`: traduction et adaptation au niveau CECRL (Claude).
- `/api/lab?action=draft|publish|audio|get|submit|results|delete`: labo. La correction se fait côté serveur, et les résultats sont protégés par une clé propre à chaque exercice.

## Variables d'environnement (Render → Environment)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | oui | Traduction et génération des questions |
| `DATABASE_URL` | oui en production | Postgres (stockage du labo). Sans elle, stockage en fichiers dans `./data` (dev local uniquement) |
| `ANTHROPIC_MODEL` | non | Défaut `claude-haiku-5-5` ; `claude-sonnet-5-5` pour une meilleure qualité |
| `ALLOWED_ORIGINS` | non | Autres domaines autorisés à appeler l'API, séparés par des virgules |
| `RATE_LIMIT_PER_HOUR` | non | Appels IA par adresse IP et par heure (défaut 60) |

## Développement

```bash
npm install
npm start            # http://localhost:3000
npm test             # test de bout en bout (Claude simulé)
```

La synthèse vocale (Kokoro, `public/vendor/kokoro/`) et l'encodage MP3 (lamejs, `public/vendor/lamejs/`) tournent dans le navigateur.
