# Espace élève : code + mot de passe

Le code à 6 chiffres devient un **identifiant** (il peut figurer sur la copie de l'élève). Le secret est
le **mot de passe**, vérifié côté serveur.

## Fonctionnement
- Enseignant : page « Espace élève » → **🔑 Générer les mots de passe** (mots courts + 2 chiffres, ex.
  `soleil47`), puis **🖨 Imprimer la liste**. Les mots de passe sont enregistrés via `POST /api/eleve-passwords`
  (jeton Firebase du professeur) ; seul un hachage salé (scrypt) est conservé, dans la collection `eleveAuth`.
- Élève : code + mot de passe → `POST /api/eleve-login`. Même message d'erreur pour un code inconnu et un
  mauvais mot de passe ; blocage après 5 essais faux (15 min, doublé à chaque série, plafond 24 h).
- Le mot de passe n'est jamais publié dans `eleveAcces` (supprimé dans `buildEleveAccesPayload`, et filtré
  une seconde fois par le serveur).

## Mise en service (dans cet ordre)
1. Déployer ce code. Tant que `ELEVE_PASSWORD_REQUIRED` est vide, les élèves sans mot de passe entrent encore
   avec leur code seul.
2. Chaque professeur clique sur « Générer les mots de passe » et distribue la liste.
3. Mettre `ELEVE_PASSWORD_REQUIRED=1` sur le serveur : le code seul ne suffit plus.
4. **Règles Firestore (console Firebase)** : interdire la lecture publique de `eleveAcces` (`allow read: if false;`
   — le serveur y accède avec Firebase Admin, qui ignore les règles) et ne pas déclarer `eleveAuth`
   (refusé par défaut). Sans cette étape, le document de l'élève reste lisible directement par son code.
5. Après « Régénérer les codes », cliquer de nouveau sur « Générer les mots de passe ».
