# Carrosserie Pro

Logiciel de gestion pour carrossiers automobiles : clients, véhicules, dossiers
de réparation (sinistres assurance ou hors assurance), devis et factures
professionnels avec génération PDF, conformes aux usages français
(numérotation légale séquentielle, mentions obligatoires, gestion des
franchises et de la cession de créance avec les compagnies d'assurance).

---

## Fonctionnalités

- **Clients** (particuliers / professionnels) et **véhicules** associés.
- **Compagnies d'assurance** (référentiel) et **catalogue** de pièces / main
  d'œuvre / forfaits réutilisables dans les devis et factures.
- **Dossiers de réparation** : suivi du statut (nouveau → devis envoyé →
  attente accord assurance → en réparation → terminé → facturé → soldé),
  informations sinistre (n° de sinistre, n° de police, franchise, cession de
  créance), informations expert (nom, cabinet, date d'expertise), logistique
  atelier (véhicule de prêt, dates d'entrée/sortie).
- **Devis** : lignes détaillées (référence, désignation, quantité, prix
  unitaire HT, remise, taux de TVA), calcul automatique des totaux par taux
  de TVA, statuts (brouillon / envoyé / accepté / refusé / expiré), export
  PDF, transformation en facture en un clic.
- **Factures** : numérotation légale séquentielle et immuable
  (`FAC-AAAA-0001`), destinataire du règlement (client / assurance / mixte
  avec répartition franchise), suivi des règlements (partiels, multi-modes),
  **avoirs** (annulation propre avec numérotation dédiée), export PDF.
- **PDF professionnels** générés côté serveur (ReportLab) : en-tête société,
  bloc client, bloc véhicule, bloc assurance/sinistre (compagnie, n° de
  sinistre, n° de police, expert, franchise), tableau des lignes, récapitulatif
  de TVA par taux, mentions légales (pénalités de retard, indemnité
  forfaitaire de recouvrement de 40 €, TVA non applicable le cas échéant,
  RIB), bloc « bon pour accord » sur les devis.
- **Tableau de bord** : chiffre d'affaires du mois, encours impayé, dossiers
  en cours, devis en attente, dossiers/devis/factures récents.
- **Paramètres entreprise** : identité légale (SIRET, RCS, TVA
  intracommunautaire, capital social), agréments professionnels (RC Pro,
  garantie décennale, label QualiRépar, réseaux d'agréments assureurs),
  coordonnées bancaires, taux et délais par défaut.
- **Authentification** multi-utilisateurs (admin / atelier / comptabilité).

---

## Prérequis

- Python 3.9 ou supérieur

---

## Installation

```bash
cd carrosserie-pro
python3 -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Modifiez `.env` si besoin (secret Flask, identifiants du compte administrateur
créé automatiquement au premier lancement).

---

## Lancement

```bash
python app.py
```

L'application est accessible sur [http://localhost:5050](http://localhost:5050).

Au premier lancement, la base de données est créée automatiquement ainsi
qu'un compte administrateur (identifiants définis dans `.env`, valeurs par
défaut : `admin@macarrosserie.fr` / `change-moi-1234` — **à changer**).

### Charger des données de démonstration (optionnel)

```bash
python seed.py
```

Crée des compagnies d'assurance, un catalogue de pièces/prestations, deux
clients avec véhicules, un dossier sinistre assurance (avec devis) et un
dossier hors assurance déjà facturé.

---

## Premiers pas

1. Connectez-vous, puis renseignez les **Paramètres** de votre entreprise
   (SIRET, TVA, RIB, assurances professionnelles...) — ces informations
   apparaissent sur tous les devis et factures.
2. Ajoutez vos **compagnies d'assurance** habituelles et votre **catalogue**
   de pièces et de main d'œuvre.
3. Créez un **client**, un **véhicule**, puis un **dossier** de réparation en
   précisant s'il s'agit d'un sinistre assurance (avec n° de sinistre,
   franchise, expert...) ou d'une intervention hors assurance.
4. Depuis le dossier, créez un **devis**, ajoutez les lignes (avec le
   catalogue en un clic), téléchargez le PDF, envoyez-le au client. Une fois
   accepté, transformez-le en **facture** en un clic.
5. Suivez les **règlements** (client et/ou assurance) et émettez un **avoir**
   en cas d'erreur de facturation.

---

## Architecture

```
carrosserie-pro/
├── app.py                 # Application factory, enregistrement des blueprints
├── config.py               # Configuration Flask
├── extensions.py           # Instances SQLAlchemy / Flask-Login / CSRF
├── models.py                # Modèles de données (Client, Vehicule, Dossier, Devis, Facture...)
├── pdf.py                   # Génération des PDF (devis / factures / avoirs) avec ReportLab
├── seed.py                  # Données de démonstration
├── blueprints/
│   ├── auth.py               # Connexion / déconnexion
│   ├── main.py                # Tableau de bord
│   ├── clients.py             # CRUD clients
│   ├── vehicules.py           # CRUD véhicules
│   ├── assureurs.py           # CRUD compagnies d'assurance
│   ├── catalogue.py           # CRUD catalogue pièces / prestations
│   ├── dossiers.py            # CRUD dossiers de réparation
│   ├── devis.py                # CRUD devis + transformation en facture
│   ├── factures.py            # CRUD factures + règlements + avoirs
│   └── settings.py            # Paramètres entreprise + utilisateurs
├── templates/                # Templates Jinja2 (Bootstrap 5)
└── static/                   # CSS / JS
```

### Numérotation légale

Les numéros de devis (`DEV-AAAA-NNNN`), factures (`FAC-AAAA-NNNN`) et avoirs
(`AV-AAAA-NNNN`) sont générés de façon séquentielle et sans trou par exercice
via un compteur transactionnel (`models.Counter`). Une facture émise ne doit
jamais être supprimée ni renumérotée : toute correction se fait par
l'émission d'un avoir, conformément aux exigences françaises de facturation
(article 242 nonies A du CGI).

---

## Déploiement sur Render (mise en ligne)

Ce dépôt inclut un fichier `render.yaml` à sa racine (Blueprint Render) qui
configure automatiquement le service.

1. Créez un compte sur [render.com](https://render.com) et connectez votre
   compte GitHub.
2. Dans le tableau de bord Render : **New +** → **Blueprint**, puis
   sélectionnez ce dépôt (`selwateaching/academie`) et la branche à déployer.
3. Render détecte `render.yaml` et propose de créer le service
   `carrosserie-pro` **ainsi qu'une base PostgreSQL gratuite**
   (`carrosserie-pro-db`), reliée automatiquement via la variable
   `DATABASE_URL`. Renseignez les variables demandées (`ADMIN_EMAIL`,
   `ADMIN_PASSWORD`) puis validez.
4. Au premier déploiement, Render exécute `pip install -r requirements.txt`
   puis démarre l'application avec `gunicorn`. Une fois le déploiement
   terminé, l'URL fournie par Render (`https://carrosserie-pro-xxxx.onrender.com`)
   ouvre l'application.

**Si le service existe déjà** (créé avant l'ajout de la base PostgreSQL à
`render.yaml`) : allez dans l'onglet **Blueprints** du tableau de bord
Render et lancez une **synchronisation manuelle** pour que la base soit
créée et reliée au service existant — sinon il continuera d'utiliser
SQLite sur disque éphémère.

**⚠️ Les photos uploadées** (module Photos) restent sur le disque éphémère
du service web, même avec PostgreSQL, et sont donc perdues à chaque
déploiement/redémarrage. Un disque persistant Render (plan payant) ou un
stockage externe (S3 compatible) serait nécessaire pour les conserver.

Pour déployer manuellement (sans Blueprint) sur Render ou un service
équivalent (Railway, Fly.io...) : répertoire racine `carrosserie-pro/`,
commande de build `pip install -r requirements.txt`, commande de démarrage
`gunicorn app:app`, et pensez à définir `DATABASE_URL` vers une base
PostgreSQL managée.

---

## Base de données

PostgreSQL en production via la variable d'environnement `DATABASE_URL`
(provisionnée automatiquement par `render.yaml`, ex. :
`postgresql://user:password@host/dbname`). SQLite (`carrosserie.db`) reste
utilisé par défaut en local si `DATABASE_URL` n'est pas définie — pratique
pour développer, mais à éviter en production (disque éphémère).

---

## Licence

Usage personnel et professionnel libre.
