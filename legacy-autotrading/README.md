# AutoTrading Pro

Application web Flask pour l'analyse professionnelle d'achat/revente de véhicules automobiles.
L'application connecte votre boîte Gmail, détecte automatiquement les annonces de véhicules et génère des analyses IA complètes (décision d'achat, marge estimée, niveau de risque) via Claude d'Anthropic.

---

## Prérequis

- Python 3.9 ou supérieur
- Un compte Google (pour l'intégration Gmail)
- Une clé API Anthropic (pour les analyses IA)
- Un projet Google Cloud avec l'API Gmail activée

---

## 1. Mise en place Google Cloud OAuth

### 1.1 Créer un projet Google Cloud

1. Rendez-vous sur [console.cloud.google.com](https://console.cloud.google.com)
2. Cliquez sur **Sélectionner un projet** → **Nouveau projet**
3. Nommez votre projet (ex. : `autotrading-pro`) et cliquez **Créer**

### 1.2 Activer l'API Gmail

1. Dans le menu de gauche, allez dans **APIs et services** → **Bibliothèque**
2. Recherchez **Gmail API** et cliquez dessus
3. Cliquez **Activer**

### 1.3 Configurer l'écran de consentement OAuth

1. **APIs et services** → **Écran de consentement OAuth**
2. Sélectionnez le type **Externe** puis cliquez **Créer**
3. Remplissez les champs obligatoires (nom de l'application, email de support)
4. Dans **Utilisateurs test**, ajoutez votre adresse Gmail
5. Sauvegardez

### 1.4 Créer les identifiants OAuth 2.0

1. **APIs et services** → **Identifiants** → **Créer des identifiants** → **ID client OAuth 2.0**
2. Type d'application : **Application Web**
3. Nom : `AutoTrading Pro`
4. **URI de redirection autorisés** — ajoutez :
   ```
   http://localhost:5000/auth/gmail/callback
   ```
5. Cliquez **Créer**
6. Notez le **Client ID** et le **Client Secret** affichés

---

## 2. Installation

### 2.1 Cloner le dépôt

```bash
git clone <url-du-repo>
cd autotrading-pro
```

### 2.2 Créer et activer l'environnement virtuel

```bash
python3 -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows
```

### 2.3 Installer les dépendances

```bash
pip install -r requirements.txt
```

### 2.4 Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvrez `.env` et renseignez vos valeurs :

```env
ANTHROPIC_API_KEY=sk-ant-...          # Votre clé Anthropic
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
SECRET_KEY=un_secret_aleatoire_long   # python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 3. Lancer l'application

```bash
flask run
# ou directement :
python app.py
```

L'application est accessible sur [http://localhost:5000](http://localhost:5000).

---

## 4. Guide d'utilisation

### 4.1 Première ouverture

Au premier lancement, l'application génère automatiquement **6 véhicules de démonstration** pour vous permettre de découvrir l'interface sans avoir à synchroniser vos emails.

### 4.2 Connecter Gmail

1. Cliquez sur **Connecter avec Google** (barre supérieure ou page Paramètres)
2. Autorisez l'accès en lecture à vos emails Gmail
3. Vous êtes redirigé vers la page Paramètres — le statut passe à **Connecté**

### 4.3 Synchroniser les emails

1. Sur le tableau de bord, cliquez sur **Synchroniser emails**
2. L'application récupère vos emails non lus, détecte les annonces automobiles et lance l'analyse IA pour chaque nouveau véhicule
3. Les nouveaux véhicules apparaissent dans la grille ; les opportunités avec score ≥ 80 déclenchent une notification

### 4.4 Lire les analyses

Chaque carte de véhicule affiche :
- **Décision** : ACHETER (vert) / À ÉTUDIER (jaune) / REFUSER (rouge)
- **Score** : 0-100 (opportunité globale)
- **Marge nette estimée**
- **Niveau de risque**

Cliquez sur une carte pour accéder au **détail complet** : tableau financier, forces et faiblesses, résumé IA.

### 4.5 Filtrer et trier

Utilisez la barre de filtres pour :
- Filtrer par décision (ACHETER / À ÉTUDIER / REFUSER)
- Filtrer par source (BCA, AUTO1, LeBonCoin, Particulier)
- Trier par date, score ou marge

---

## 5. Architecture

```
autotrading-pro/
├── app.py              # Application Flask principale, routes
├── models.py           # Modèles SQLAlchemy (Vehicle, Analysis, OAuthToken)
├── gmail_service.py    # Service Gmail OAuth2 (fetch emails, token management)
├── email_parser.py     # Détection de source, extraction données véhicule
├── analyzer.py         # Analyse IA via Claude (Anthropic SDK)
├── templates/
│   ├── base.html           # Layout principal (sidebar, topbar, toasts)
│   ├── dashboard.html      # Grille de véhicules + filtres + stats
│   ├── analysis_detail.html # Page détail véhicule
│   └── settings.html       # Configuration OAuth + clés API
├── static/
│   ├── css/style.css       # Thème sombre personnalisé
│   └── js/dashboard.js     # Notifications, sync AJAX, filtres
├── .env.example        # Template des variables d'environnement
├── requirements.txt    # Dépendances Python
└── README.md           # Ce fichier
```

### Flux de données

```
Gmail API
   ↓
gmail_service.fetch_emails()
   ↓
email_parser.is_vehicle_announcement()   ← filtre les emails non pertinents
   ↓
email_parser.extract_vehicle_data()      ← extraction regex (marque, km, prix…)
   ↓
analyzer.analyze_vehicle()               ← prompt Claude → JSON structuré
   ↓
SQLite (Vehicle + Analysis)
   ↓
Dashboard Flask / Templates Jinja2
```

### Sources supportées

| Source | Détection |
|--------|-----------|
| **BCA Auction** | Domaine `bca-auction.fr` |
| **AUTO1** | Domaine `auto1.com` |
| **LeBonCoin** | Domaine `leboncoin.fr` |
| **Particulier** | Tout autre expéditeur |

---

## 6. Développement

### Désactiver HTTPS pour OAuth en local

Sur certaines configurations, Google peut refuser les redirections HTTP. Si besoin, ajoutez dans `.env` :

```env
OAUTHLIB_INSECURE_TRANSPORT=1
```

Et dans votre shell avant de lancer Flask :

```bash
export OAUTHLIB_INSECURE_TRANSPORT=1
flask run
```

### Réinitialiser la base de données

```bash
rm auto_trading.db
flask run   # recrée la DB + les données de démo au prochain chargement
```

---

## Licence

Usage personnel et professionnel libre.
