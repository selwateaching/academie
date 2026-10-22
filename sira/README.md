# Le Monde de la Sira

Version française, inspirée de SirahBooks, de la vie du Prophète Mouhammed ﷺ : 25 chapitres, de l'Arabie préislamique à sa mort, puis 30 portraits de compagnons 16 fiches sur la famille du Prophète, son caractère et la vie à Médine, 8 fiches sur les rites et les fêtes, et une carte schématique des lieux, rédigés en français. Chaque chapitre et chaque portrait a un quiz de 5 questions (points, étoiles, niveaux, badges) et une lecture audio.

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
