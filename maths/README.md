# Académie Maths

Site d'exercices de maths interactifs, de la GS à la 6ᵉ, inspiré de la structure d'IXL
(niveaux, compétences codées A.1, B.2…, score, récompenses, suivi des progrès).
Tout le contenu (titres, exercices, schémas, explications) est original.

## Lancer

```
python3 server.py        # http://localhost:8000
```

Aucune dépendance : site statique (HTML, CSS, JavaScript) et un petit serveur Python
de la bibliothèque standard. La progression est enregistrée dans le navigateur (`localStorage`).

## Contenu

- 7 niveaux : GS, CP, CE1, CE2, CM1, CM2, 6ᵉ — 374 compétences listées, 360 avec exercices.
  Les autres sont affichées « bientôt ».
- 48 types d'exercices générés au hasard (`js/generators.js`) : comptage, opérations, fractions
  (bandes, disques, droites graduées, fractions égales), décimaux, mesures, horloge, thermomètre,
  règle, solides, symétrie, statistiques, probabilités…
- Pages : Maths (niveaux et arbre des compétences), exercice avec score sur 100,
  Récompenses (un plateau à cases cachées par niveau), Suivi des progrès, présentation.

## Organisation

| Fichier | Rôle |
|---|---|
| `js/catalog.js` | Niveaux, domaines, catégories et compétences (titres en français, codes automatiques) |
| `js/generators.js` | Générateurs de questions (maths, schémas SVG) |
| `js/lang/fr.js` | Tous les textes des exercices : à copier en `ar.js` pour l'arabe |
| `js/app.js` | Pages, score, récompenses, suivi (textes d'interface dans l'objet `UI`) |

## Arabe (prévu, pas encore fait)

Les textes des exercices sont isolés dans `js/lang/fr.js`. Pour l'arabe : traduire un `ar.js`,
traduire les titres de `catalog.js` (par code de compétence), les textes de l'objet `UI`,
et passer `<html>` en `lang="ar" dir="rtl"`. Les expressions mathématiques sont déjà dans des
éléments `.m` / `.frac` à garder en `direction: ltr`.
