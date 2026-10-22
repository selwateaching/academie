# Le Monde de la Sira

Version française, inspirée de SirahBooks, de la vie du Prophète Muhammad ﷺ : 25 chapitres, de l'Arabie préislamique à sa mort, rédigés en français.

Site statique, sans serveur ni dépendance. Fonctions : accueil, liste filtrable par période, recherche plein texte, chronologie, lecteur avec barre de progression, taille du texte réglable et suivi des chapitres lus (stocké dans le navigateur).

## Lancer

    cd sira && python3 -m http.server 8000

Puis ouvrir http://localhost:8000.

## Contenu

Les textes sont dans `js/data.js` (un objet par chapitre). Les sources classiques sont citées en pied de page ; les dates avant l'Hégire sont approximatives.
