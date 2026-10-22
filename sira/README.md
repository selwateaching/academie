# Le Monde de la Sira

Version française, inspirée de SirahBooks, de la vie du Prophète Muhammad ﷺ : 25 chapitres, de l'Arabie préislamique à sa mort, puis 15 portraits de compagnons, rédigés en français. Chaque chapitre et chaque portrait a un quiz de 5 questions (points, étoiles, niveaux, badges) et une lecture audio.

Site statique, sans serveur ni dépendance. Fonctions : accueil, liste filtrable par période, recherche plein texte, chronologie, lecteur avec barre de progression, taille du texte réglable et suivi des chapitres lus (stocké dans le navigateur).

## Lancer

    cd sira && python3 -m http.server 8000

Puis ouvrir http://localhost:8000.

## Contenu

Les chapitres sont dans `js/data.js`, les portraits et leurs quiz dans `js/companions.js`, les quiz des chapitres dans `js/quiz.js`. Les sources classiques sont citées en pied de page ; les dates avant l'Hégire sont approximatives.
