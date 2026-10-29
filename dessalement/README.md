# Formation dessalement

Plateforme de formation au dessalement de l'eau de mer, en français et en arabe.

- **Administrateur** (le formateur) : crée les clients et leurs responsables, voit tout.
- **Responsable** d'un client : crée ses apprenants, réinitialise leurs mots de passe, suit leurs résultats, exporte un tableau (CSV pour Excel).
- **Apprenant** : suit les leçons (vidéo en scènes avec voix, mots clés, quiz). Sa progression est enregistrée : scènes vues, score au premier essai, questions ratées, leçons terminées, temps passé.

Les comptes sont créés avec un mot de passe provisoire, à changer à la première connexion.

## Lancer

```
npm install
DATABASE_URL=postgres://… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm start
```

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Base PostgreSQL (sur Render : l'URL interne de la base) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Compte administrateur créé au premier démarrage (8 caractères minimum) |
| `ADMIN_NAME` | Nom affiché de l'administrateur (facultatif) |
| `NODE_ENV=production` | Cookies sécurisés (HTTPS) |

Pages : `/connexion`, `/formation` (apprenant), `/tableau-de-bord` (administrateur et responsable).

## Ajouter une leçon

1. Écrire la leçon dans `course-src/` (voir `m5.js` comme modèle) et l'ajouter à `PARTS` dans `tools/build_course.py`.
2. La déclarer dans `LESSONS` et `PROGRAM` (`course-src/core_tail.js`) et dans la liste `LESSONS` de `server.js`.
3. Lancer `python3 tools/build_course.py`.

## Tests

`DATABASE_URL=postgres://… npm test` : connexion, droits, isolation entre clients, progression, export, désactivations.
