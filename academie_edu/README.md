# Académie IA

Plateforme pédagogique web (Django) pour établissements scolaires, avec un **agent IA pédagogique** (Claude d'Anthropic) intégré nativement.

Quatre espaces : **Administrateur**, **Professeur**, **Élève** et **Parent**. Les professeurs créent des classes, y déposent des documents, génèrent des cours et des contrôles avec l'IA, et corrigent automatiquement les copies de leurs élèves — avec validation humaine systématique avant toute note définitive.

L'application est calée sur le **programme scolaire national algérien** (Ministère de l'Éducation Nationale) : primaire, moyen (CEM) et secondaire (lycée, toutes filières). Chaque classe est rattachée à un cycle, une année et — au secondaire — une filière officiels, avec la liste réelle des matières correspondantes, et l'agent IA génère et corrige en respectant ce niveau précis.

---

## Fonctionnalités

### Programme national algérien
- Catalogue structuré (`academics/programme_national.py`) : 3 cycles, 12 années (1AP à 3AS), 8 filières du secondaire (tronc commun 1AS, puis Sciences expérimentales, Mathématiques, Techniques mathématiques, Gestion et économie, Lettres et philosophie, Lettres et langues étrangères) et leurs matières officielles respectives
- À la création d'une classe, le professeur choisit son cycle puis son année puis, si besoin, sa filière — la liste des matières proposées correspond exactement à ce niveau (sélecteurs en cascade)
- Ce catalogue est indicatif et peut être ajusté (`programme_national.py`) si un établissement suit une organisation différente

### Espace Professeur
- Création de classes (cycle/année/filière/matière du programme algérien) avec code d'accès unique à partager aux élèves
- Dépôt de documents / ressources pédagogiques
- **Génération de cours par l'IA** : un sujet suffit, l'agent rédige un cours structuré (introduction, sections, points clés, conclusion) conforme au programme algérien du niveau de la classe, modifiable avant publication
- **Génération de contrôles/QCM par l'IA** : nombre de questions et difficulté paramétrables, adaptés au niveau exact de la classe, correction automatique, explications pédagogiques par question
- **Correction automatique des copies** : l'IA note et commente chaque copie selon les attendus du programme algérien du niveau concerné (points forts, points à améliorer, correction détaillée) ; le professeur relit et valide toujours la note avant qu'elle soit transmise à l'élève
- Création manuelle de cours, contrôles et devoirs (l'IA est une assistance, pas une obligation)
- **Carnet de notes** : évaluations (DS, devoir maison, interrogation, projet) avec coefficient, saisie des notes /20 élève par élève, moyennes de classe calculées automatiquement
- **Calendrier / agenda** : vue mensuelle des évaluations, réunions et échéances de devoirs, navigation mois par mois
- **Ajout d'élève manuel** : en plus du code d'accès self-service, le professeur peut créer directement un compte élève (prénom/nom) depuis la page de la classe — identifiant et mot de passe générés automatiquement, utile si l'élève n'a pas d'email

### Espace Élève
- Rejoindre une classe avec un code d'accès
- Consulter les cours et documents publiés
- Passer les contrôles en ligne, avec correction et score immédiats
- Rendre les devoirs (texte ou fichier)
- Consulter ses notes, son bulletin et le feedback détaillé une fois validés par le professeur
- Consulter son agenda (échéances de devoirs, contrôles) en lecture seule
- Échanger par messagerie avec ses professeurs et envoyer des pièces jointes
- Stocker ses propres documents dans des dossiers personnalisés

### Espace Parent
- Se lier à un ou plusieurs enfants via leur **code famille** (visible sur la page de profil de l'élève)
- Consulter le bulletin de chaque enfant, par classe
- Échanger par messagerie avec les professeurs de ses enfants

### Messagerie
- Conversations directes avec pièce jointe (PDF, Word, image — 20 Mo max)
- Professeur ↔ collègues professeurs, professeur ↔ élèves de ses classes, professeur ↔ parents de ses élèves
- Élève ↔ professeurs de ses classes ; Parent ↔ professeurs de ses enfants
- Boîte de réception avec compteur de messages non lus (visible dans la barre de navigation)

### Documents personnels
- Chaque professeur et chaque élève dispose de son propre espace de stockage (« Mes documents »)
- Organisation libre en dossiers personnalisés et colorés (8 couleurs au choix), dépôt/suppression de fichiers de tout type (PDF, Word, Excel, images, vidéos, archives...), icône adaptée à chaque type de fichier
- **Cartable numérique auto-organisé** : côté élève, un dossier est automatiquement créé pour chaque matière suivie, quel que soit le nombre de professeurs différents — l'espace reste organisé même en changeant de classe ou de prof en cours d'année

### Bulletins
- Génération automatique à partir des évaluations du carnet de notes (pondérées par coefficient), des notes de devoirs (validées par le professeur) et des scores de contrôles d'une classe
- Moyenne générale sur 20, calculée au prorata des coefficients, page imprimable / exportable en PDF depuis le navigateur (bouton Imprimer)
- Accessible au professeur (génération, depuis la liste des élèves d'une classe), à l'élève et à son parent (consultation)

### Contact avec le lycée
- Le professeur peut envoyer un email à l'administration du lycée directement depuis son tableau de bord
- Par défaut les emails s'affichent dans les logs (aucune configuration requise) ; une vraie boîte SMTP (Gmail, etc.) peut être branchée via `.env`

### SaaS : offres, quotas et gestion des clients
- Trois offres d'abonnement (`accounts/plans.py`) : **Découverte** (gratuite, 1 classe, 5 générations IA/mois), **Standard** (2 500 DA/mois, 5 classes, 50 générations IA/mois), **Premium** (5 000 DA/mois, illimité) — prix et quotas modifiables dans ce seul fichier
- Les quotas sont appliqués automatiquement : création de classe et génération IA sont bloquées avec un message explicite dès qu'une limite est atteinte ou que l'abonnement est expiré/désactivé
- **Page d'administration des clients** (`/gestion/clients/`, réservée au rôle Administrateur) : ajouter un nouveau client (compte professeur + mot de passe + offre), rechercher/filtrer par offre ou statut, changer l'offre d'un client, activer/désactiver son abonnement, définir une date d'expiration, suivre son usage (classes créées, générations IA du mois)
- Chaque professeur voit son offre et sa consommation directement sur son tableau de bord
- La page d'accueil affiche les trois offres publiquement

> La gestion des abonnements est actuellement **manuelle** (l'administrateur active/désactive depuis sa page de gestion). Aucun paiement en ligne n'est intégré : brancher une passerelle de paiement (CIB/EDAHABIA, Stripe...) est une évolution possible qui nécessite un compte marchand propre à l'établissement.

### Administration
- Interface d'administration Django complète (`/admin/`) : gestion des comptes, rôles, abonnements et classes

---

## Stack technique

- **Django 5** — framework principal (auth, ORM, panneau admin)
- **SQLite** par défaut (compatible PostgreSQL via `DATABASE_URL`)
- **Anthropic Claude** — génération de cours/contrôles et correction de copies
- **Bootstrap 5** — interface

---

## Installation

### 1. Environnement virtuel

```bash
cd academie_edu
python3 -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Renseignez au minimum :

```env
SECRET_KEY=...                          # python -c "import secrets; print(secrets.token_hex(32))"
ANTHROPIC_API_KEY=sk-ant-...            # https://console.anthropic.com
```

Sans clé Anthropic, l'application fonctionne normalement (création manuelle de cours/contrôles/devoirs), seules les fonctions de génération et correction par IA affichent un message explicite.

### 3. Base de données

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 4. Lancer l'application

```bash
python manage.py runserver
```

Accessible sur [http://localhost:8000](http://localhost:8000).

---

## Déploiement en ligne (Render, gratuit)

Un fichier `render.yaml` à la racine du dépôt permet un déploiement en un clic sur [Render](https://render.com) (offre gratuite, sans carte bancaire) :

1. Créez un compte sur [render.com](https://render.com) (connexion possible directement avec GitHub)
2. Cliquez sur **New +** → **Blueprint**
3. Connectez le dépôt GitHub du projet et sélectionnez la branche à déployer
4. Render détecte automatiquement `render.yaml` et propose de créer le service web **academie-ia** ainsi qu'une base de données PostgreSQL gratuite associée
5. Avant de valider, renseignez la variable **ANTHROPIC_API_KEY** (obtenue sur [console.anthropic.com](https://console.anthropic.com)) — c'est la seule information à saisir manuellement
6. Cliquez sur **Apply** / **Create** : le premier déploiement prend quelques minutes
7. Une fois terminé, Render fournit une adresse du type `https://academie-ia-xxxx.onrender.com` — c'est le lien à utiliser pour accéder à l'application

> Sur l'offre gratuite, le service se met en veille après une période d'inactivité : la première requête après une pause peut prendre 30 à 60 secondes. Le stockage des fichiers déposés (documents, pièces jointes, avatars) est local au service et non garanti à long terme sur l'offre gratuite ; pour un usage réel en production, prévoir un stockage externe (ex. S3).

---

## Parcours de démonstration

1. Créer un compte **Professeur**, créer une classe → un code d'accès à 6 caractères est généré
2. Créer un compte **Élève** (navigation privée ou autre navigateur), rejoindre la classe avec le code
3. Depuis l'espace professeur : générer un cours et un contrôle avec l'IA sur le sujet de votre choix
4. Depuis l'espace élève : consulter le cours, passer le contrôle → correction immédiate
5. Le professeur crée un devoir ; l'élève le rend ; le professeur lance la correction IA puis la valide

---

## Architecture

```
academie_edu/
├── config/            # Réglages Django, URLs racine
├── accounts/          # Utilisateur personnalisé (rôles admin/professeur/élève/parent), auth, offres
├── academics/         # Classes, inscription par code d'accès
├── courses/           # Cours (manuels ou générés par IA), documents de classe
├── quizzes/            # Contrôles / QCM, passage et correction automatique
├── homework/           # Devoirs, copies, correction IA + validation professeur
├── ai_agent/           # Service d'appel à Claude (génération + correction)
├── gestion/             # Page d'administration des clients et abonnements
├── messagerie/          # Conversations et pièces jointes entre utilisateurs
├── documents_perso/     # Espace de stockage personnel (dossiers + fichiers)
├── bulletins/            # Génération des bulletins scolaires
├── presence/             # Appel, absences et retards
├── evaluations/          # Carnet de notes (évaluations pondérées par coefficient)
├── calendrier/           # Agenda mensuel professeur / élève
├── core/                # Landing page, tableaux de bord par rôle, contact lycée
├── templates/            # Gabarits HTML (Bootstrap 5)
└── static/               # CSS
```

### Rôle de l'agent IA (`ai_agent/services.py`)

Trois fonctions, chacune avec un prompt système dédié « expert en pédagogie » et une réponse structurée en JSON :

- `generer_cours(sujet, matiere, niveau, objectifs)` → cours structuré
- `generer_quiz(sujet, matiere, niveau, nb_questions, difficulte)` → QCM avec réponses et explications
- `corriger_copie(enonce, bareme_points, reponse_eleve)` → note, appréciation, points forts/faibles, correction détaillée

Le contenu généré par l'IA est systématiquement présenté au professeur pour relecture/validation avant d'être définitif (cours publiable ou non, note ajustable) — l'IA assiste, elle ne remplace pas la décision pédagogique.

---

## Licence

Usage personnel et professionnel libre.
