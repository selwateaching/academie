# Le Monde de la Sira

Version française, inspirée de SirahBooks, de la vie du Prophète Mouhammed ﷺ : 25 chapitres, de l'Arabie préislamique à sa mort, puis 30 portraits de compagnons 16 fiches sur la famille du Prophète, son caractère et la vie à Médine, 8 fiches sur les rites et les fêtes, et une carte schématique des lieux, rédigés en français. Chaque chapitre et chaque portrait a un quiz de 5 questions (points, étoiles, niveaux, badges) et une lecture audio.

Site statique, sans serveur ni dépendance. Fonctions : accueil, liste filtrable par période, recherche plein texte, chronologie, lecteur avec barre de progression, taille du texte réglable et suivi des chapitres lus (stocké dans le navigateur).

## Lancer

    cd sira && python3 -m http.server 8000

Puis ouvrir http://localhost:8000.

## Contenu

Les chapitres sont dans `js/data.js`, les portraits et leurs quiz dans `js/companions.js` et `js/companions2.js`, les fiches « Famille et thèmes » et leurs quiz dans `js/themes.js`, les fiches « Rites et fêtes » dans `js/rites.js`, la carte et ses lieux dans `js/places.js`, les quiz des chapitres dans `js/quiz.js`. Les sources classiques sont citées en pied de page ; les dates avant l'Hégire sont approximatives.
