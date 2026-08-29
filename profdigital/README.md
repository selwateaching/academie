# ProfDigital — version SaaS (comptes, essai 14 jours, IA réelle)

Application web pour enseignants français (primaire, collège, lycée) : préparation
de séances, contrôles, cahier journal, avec assistant IA (Claude) et export PDF/Word.

Chaque abonné a son propre compte (email + mot de passe) et ses propres données.
À l'inscription, un essai gratuit de 14 jours démarre automatiquement. Le
paiement se fait par virement bancaire (pas de paiement en ligne pour
l'instant) ; l'administratrice active manuellement le compte pour 30 jours de
plus depuis la page `/admin`.

---

## 1. Lancer en local (pour tester avant de mettre en ligne)

```bash
cd profdigital
python3 -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Ouvrez `.env` et renseignez au minimum :
- `SECRET_KEY` (générez-en une avec `python -c "import secrets; print(secrets.token_hex(32))"`)
- `ADMIN_EMAIL` (votre email — vous deviendrez automatiquement administratrice)
- `ANTHROPIC_API_KEY` (pour l'IA réelle — voir section 3)

Puis lancez :

```bash
python app.py
```

Ouvrez [http://127.0.0.1:8000](http://127.0.0.1:8000), créez votre compte
(avec l'email mis dans `ADMIN_EMAIL`), et vous accédez directement à l'espace
enseignant. La page `/admin` liste les abonnés.

---

## 2. Mettre ProfDigital en ligne pour vos abonnés

Le plus simple pour démarrer est un hébergeur gratuit, par exemple **Render** :

1. Créez un compte sur [render.com](https://render.com) (gratuit).
2. "New +" → "Web Service" → connectez ce dépôt GitHub, dossier `profdigital/`.
3. Render détecte `Procfile` automatiquement. Renseignez :
   - Build command : `pip install -r requirements.txt`
   - Start command : `gunicorn app:app`
4. Dans "Environment", ajoutez les mêmes variables que dans `.env` :
   `SECRET_KEY`, `ADMIN_EMAIL`, `ANTHROPIC_API_KEY`, `BANK_HOLDER`,
   `BANK_NAME`, `BANK_RIB`.
5. Déployez. Render vous donne une adresse temporaire du type
   `https://profdigital-xxxx.onrender.com` — c'est cette adresse que vous
   partagerez à vos abonnés pour tester, en attendant de brancher un vrai
   nom de domaine.

**Important — stockage des données** : par défaut, ProfDigital utilise un fichier
SQLite (`profdigital.db`). Sur la plupart des hébergeurs gratuits, ce fichier est
effacé à chaque redéploiement. Pour un vrai lancement avec des abonnés,
ajoutez une base de données persistante (ex. Postgres gratuit sur Render) et
renseignez `DATABASE_URL` dans les variables d'environnement — l'application
la détecte automatiquement, aucun changement de code nécessaire.

---

## 3. Activer l'IA réelle (Claude)

1. Créez une clé sur [console.anthropic.com](https://console.anthropic.com).
2. Mettez-la dans `ANTHROPIC_API_KEY` (en local dans `.env`, en ligne dans les
   variables d'environnement de l'hébergeur).
3. C'est tout : l'assistant IA de ProfDigital (fiches, contrôles, cours, cahier
   journal...) utilise désormais Claude pour générer un contenu réellement
   personnalisé. Si l'IA est indisponible un instant, l'application bascule
   automatiquement sur un modèle de secours pour ne jamais bloquer un
   enseignant en pleine préparation de cours.

Le modèle utilisé par défaut est `claude-opus-5` (le plus capable). Vous
pouvez passer à un modèle moins coûteux avec `PROFDIGITAL_AI_MODEL=claude-sonnet-5`
dans les variables d'environnement si le volume d'utilisation devient
important.

---

## 4. Gérer les abonnements (essai + virement)

- Un nouvel abonné a 14 jours d'accès complet gratuit dès son inscription.
- Passé ce délai sans paiement, son compte passe automatiquement en lecture
  seule : il voit la page `/billing` avec vos coordonnées bancaires
  (renseignées via `BANK_HOLDER`, `BANK_NAME`, `BANK_RIB`).
- Dès que vous recevez son virement, connectez-vous avec votre compte
  administrateur et allez sur `/admin` : cliquez sur "Virement reçu (+30j)"
  en face de son email. Son accès est immédiatement réactivé pour 30 jours.

---

## 5. Architecture

```
profdigital/
├── app.py             # Routes Flask : auth, état abonné, IA, export, admin
├── models.py           # User (compte, essai, paiement), UserState (données)
├── ai.py                # Appel Claude pour générer les documents pédagogiques
├── templates/           # login, signup, billing (virement), admin, app shell
├── static/
│   ├── app.js            # Interface ProfDigital (connectée au backend)
│   ├── styles.css         # Thème de l'application
│   └── auth.css            # Thème des pages login/signup/billing/admin
├── requirements.txt
├── Procfile             # Commande de démarrage en production (gunicorn)
└── .env.example
```

Chaque abonné ne voit que ses propres données (élèves, séances, documents)
et ses propres fichiers PDF/Word générés — tout est cloisonné par compte.

## Licence

Usage personnel et professionnel libre.
