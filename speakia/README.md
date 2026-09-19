# SpeakIA — Cours interactifs

Application Flask autonome (indépendante de l'app d'analyse auto à la racine
du dépôt) qui propose des **cours d'anglais interactifs, écrits et oraux**,
pour des enfants arabophones, sous forme de jeu, afin que l'enfant puisse
apprendre en autonomie.

## Contenu pédagogique

- **4 niveaux** (Débutant → Avancé), **2 leçons par niveau** (8 leçons au
  total) : animaux, couleurs, famille, nombres, routine quotidienne,
  nourriture, émotions, passé simple.
- Chaque leçon combine, dans l'ordre :
  1. **Vocabulaire** — carte mot + emoji + traduction arabe, avec
     synthèse vocale (🔊) et reconnaissance vocale (🎤) pour s'entraîner à la
     prononciation.
  2. **QCM** — question posée en arabe, choix en anglais (ou l'inverse).
  3. **Écoute** — Néo prononce une phrase, l'enfant pointe la bonne image.
  4. **Phrase à trous** — compléter une phrase anglaise avec le bon mot.
  5. **Prononciation** — répéter une phrase complète à voix haute, avec
     retour immédiat via la reconnaissance vocale du navigateur.
  6. **Défi final (recap)** — question type "boss" mêlant tous les
     exercices de la leçon.
- Pédagogie socratique : Néo ne donne jamais la traduction directement. En
  cas d'erreur, il donne un indice en arabe puis laisse l'enfant réessayer.
- Gamification : étoiles par leçon, total d'étoiles, série de jours (streak),
  niveaux débloqués progressivement.

## Lancer l'application

```bash
cd speakia
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
```

L'application est accessible sur [http://localhost:5050](http://localhost:5050).

Aucune clé API n'est nécessaire : la synthèse vocale (Web Speech API,
`speechSynthesis`) et la reconnaissance vocale (`SpeechRecognition` /
`webkitSpeechRecognition`) sont fournies nativement par le navigateur
(Chrome/Edge recommandés). Si le navigateur ne supporte pas la
reconnaissance vocale, les exercices de prononciation restent utilisables
en mode écoute/répétition libre, sans bloquer la progression.

## Structure

```
speakia/
├── app.py            # Routes Flask (profils, carte des niveaux, leçon, espace parent)
├── models.py          # Student, LessonProgress (SQLAlchemy)
├── content.py          # Curriculum : 4 niveaux, 8 leçons, tous les exercices
├── templates/
│   ├── base.html
│   ├── home.html        # Sélection / création de profil enfant
│   ├── world.html        # Carte des niveaux et leçons, étoiles, verrouillage
│   ├── lesson.html        # Lecteur de leçon interactif
│   └── parent.html        # Espace parent : suivi des progrès, sans notes ni classement
└── static/
    ├── css/style.css
    └── js/lesson-engine.js  # Moteur d'exercices interactifs (TTS + reconnaissance vocale)
```

## Progression et déblocage

- Un niveau est débloqué quand toutes ses leçons ont été terminées au moins
  une fois (≥ 1 étoile) dans le niveau précédent.
- Les étoiles (1 à 3) dépendent du score obtenu sur les exercices notés
  (QCM, écoute, phrase à trous, défi final) — le vocabulaire et la
  prononciation libre ne sont pas pénalisants, ce sont des exercices
  d'entraînement.
