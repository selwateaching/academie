# Académie IA

Plateforme pédagogique web (Django) pour établissements scolaires, avec un **agent IA pédagogique** (Claude d'Anthropic) intégré nativement.

Trois espaces : **Administrateur**, **Professeur** et **Élève**. Les professeurs créent des classes, y déposent des documents, génèrent des cours et des contrôles avec l'IA, et corrigent automatiquement les copies de leurs élèves — avec validation humaine systématique avant toute note définitive.

---

## Fonctionnalités

### Espace Professeur
- Création de classes avec code d'accès unique à partager aux élèves
- Dépôt de documents / ressources pédagogiques
- **Génération de cours par l'IA** : un sujet suffit, l'agent rédige un cours structuré (introduction, sections, points clés, conclusion), modifiable avant publication
- **Génération de contrôles/QCM par l'IA** : nombre de questions et difficulté paramétrables, correction automatique, explications pédagogiques par question
- **Correction automatique des copies** : l'IA note et commente chaque copie (points forts, points à améliorer, correction détaillée) ; le professeur relit et valide toujours la note avant qu'elle soit transmise à l'élève
- Création manuelle de cours, contrôles et devoirs (l'IA est une assistance, pas une obligation)

### Espace Élève
- Rejoindre une classe avec un code d'accès
- Consulter les cours et documents publiés
- Passer les contrôles en ligne, avec correction et score immédiats
- Rendre les devoirs (texte ou fichier)
- Consulter ses notes et le feedback détaillé une fois validés par le professeur

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
├── config/          # Réglages Django, URLs racine
├── accounts/        # Utilisateur personnalisé (rôles admin/professeur/élève), auth
├── academics/        # Classes, inscription par code d'accès
├── courses/          # Cours (manuels ou générés par IA), documents
├── quizzes/           # Contrôles / QCM, passage et correction automatique
├── homework/          # Devoirs, copies, correction IA + validation professeur
├── ai_agent/          # Service d'appel à Claude (génération + correction)
├── core/              # Landing page, tableaux de bord par rôle
├── templates/         # Gabarits HTML (Bootstrap 5)
└── static/            # CSS
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
