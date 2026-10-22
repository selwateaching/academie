# Le Monde de la Sirah

Version française, inspirée de SirahBooks, de la vie du Prophète Mouhammed ﷺ : 25 chapitres, de l'Arabie préislamique à sa mort, puis 30 portraits de compagnons 16 fiches sur la famille du Prophète, son caractère et la vie à Médine, 14 fiches sur les rites (dont les ablutions et la prière pas à pas) et les fêtes, et une carte schématique des lieux, rédigés en français. Chaque chapitre et chaque portrait a un quiz de 5 questions (points, étoiles, niveaux, badges) et une lecture audio.

Site statique, sans serveur ni dépendance. Fonctions : accueil, liste filtrable par période, recherche plein texte, chronologie, lecteur avec barre de progression, taille du texte réglable et suivi des chapitres lus (stocké dans le navigateur).

## Lancer

    cd sira && python3 -m http.server 8000

Puis ouvrir http://localhost:8000.

## Contenu

Les chapitres sont dans `js/data.js`, les portraits et leurs quiz dans `js/companions.js` et `js/companions2.js`, les fiches « Famille et thèmes » et leurs quiz dans `js/themes.js`, les fiches « Rites et fêtes » dans `js/rites.js`, la carte et ses lieux dans `js/places.js`, les quiz des chapitres dans `js/quiz.js`. Les sources classiques sont citées en pied de page ; les dates avant l'Hégire sont approximatives.

## Lecture audio

Deux modes, au choix dans le lecteur (menu « Voix ») :

- **Voix enregistrée** (par défaut) : fichiers `audio/<id>/<n>.mp3` générés avec Kokoro-82M (licence Apache 2.0), voix française `ff_siwis` (corpus SIWIS, CC BY 4.0). Un fichier par paragraphe, lu en continu avec surlignage.
- **Voix de l'appareil** : synthèse vocale du navigateur, phrase par phrase. Le menu classe les voix : les voix « Natural » (Microsoft Edge), « Enhanced » (Apple) ou Google passent en premier.

La prononciation des noms arabes est réglée par un lexique (`js/speech.js`, objet `LEX`) qui réécrit les noms avant la lecture, pour les deux modes (« Sa'd » devient « Saad », « Ja'far » devient « Djaafar »…). L'affichage n'est pas modifié. Pour corriger un nom, ajouter une entrée au lexique puis régénérer les fichiers audio.

### Régénérer les fichiers audio

    node tools/prepare_texts.js > texts.json
    python tools/generate_audio.py 0 4 audio   # à lancer pour 0, 1, 2, 3 en parallèle
    node tools/make_audio_manifest.js          # met à jour js/audio-manifest.js

Prérequis : `pip install kokoro-onnx soundfile`, ffmpeg, et les fichiers du modèle `kokoro-v1.0.onnx` et `voices-v1.0.bin` (non versionnés).

## Illustrations

Chaque page a une illustration d'en-tête et une illustration par paragraphe (`js/art.js`), dessinées en vectoriel : paysages, lieux et objets (désert, Kaaba, mosquée de palmes, caravanes, grotte, bateau, étendards…). **Le Prophète ﷺ, les compagnons et les autres prophètes ne sont jamais représentés** : aucune image ne montre de personnage ni de visage.

Les illustrations de paragraphes sont composées d'après les mots-clés du texte (moment de la journée, décor, objets). Les décors d'en-tête sont choisis à la main dans le tableau `HERO`. Pour changer l'illustration d'une page, modifier son entrée dans `HERO` (`f` = objets, `t` = moment, `m` = décor).

## Lexique

`js/lexique-data.js` contient 151 entrées (termes religieux, personnes et tribus, lieux, événements, vie quotidienne, compagnons) : terme, écriture arabe, définition courte, lien « en savoir plus » et formes repérées dans les textes. Dans les chapitres et les fiches, la première apparition de chaque mot est soulignée ; un appui ouvre une fenêtre avec la définition, la prononciation et un bouton « Écouter » (fichiers `audio/lexique/<mot>.mp3`). La page `#/lexique` permet de chercher, de filtrer par catégorie et de parcourir l'index alphabétique.

Pour ajouter un mot : une ligne `E(...)` dans `lexique-data.js`, puis régénérer l'audio du lexique : `python tools/generate_audio.py 0 1 audio lexique` et `node tools/make_audio_manifest.js`.

## English version

The whole site is bilingual (French by default). The **EN / FR** button in the header switches language (stored in the browser; `?lang=en` also works).

- `js/i18n.js` (loaded first) defines `window.LANG` and `T()`, which translates interface strings (dictionary `js/en/ui.js`, keyed by the French text). In English it also loads `js/en/*.js`.
- `js/en/content-1..3.js`: English texts of the 79 pages; `js/en/quiz-1..3.js`: English quizzes; `js/en/lex.js`: glossary, map labels, categories and the English pronunciation lexicon (`speechLex`).
- `js/i18n-apply.js` replaces the French data in place and keeps the original in `it.fr` (illustrations use the French keywords).
- English recorded voice: `audio/en/` (Kokoro-82M, voice `af_heart`), listed in `js/en/audio-manifest.js`. To regenerate:

      node tools/prepare_texts.js en > texts.json
      VOICE=af_heart LANG_CODE=en-us python tools/generate_audio.py 0 4 audio/en   # shards 0..3
      node tools/make_audio_manifest.js en
