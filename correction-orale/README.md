# Correction orale

Application **autonome** pour corriger des copies **à voix haute**, quelle que soit la matière et le niveau (école, collège, lycée, université, formation). Elle ne dépend d'aucun site ni d'aucun compte : une page web (`index.html`) qui s'installe comme une application et fonctionne hors ligne.

## Ce que fait l'application

1. **Décrire la copie** : élève, matière, classe ou niveau, devoir, note (tout est libre).
2. **Photographier la copie** (facultatif) : la photo est réduite puis rangée avec la correction.
3. **Enregistrer** au micro (pause / reprise possibles, 30 minutes maximum) ou **importer** un audio déjà enregistré (mémo vocal du téléphone).
4. **Écouter** la correction avec la copie à l'écran, **télécharger** l'audio, **partager** (WhatsApp, e-mail… via le menu de partage du téléphone), ou tout **télécharger en .zip**.

Matière, classe et devoir sont conservés après chaque sauvegarde pour enchaîner les copies d'une même série. Recherche par nom ou mot-clé et filtre par matière. Interface en français et en arabe (de droite à gauche).

## Fichiers produits

- Nom automatique : `Matiere_Classe_Eleve_Devoir_AAAA-MM-JJ.m4a` (accents retirés pour que le fichier s'ouvre partout ; les lettres arabes sont conservées).
- Format d'enregistrement : **M4A (AAC)** quand le navigateur le permet (Safari, Chrome récent), sinon WebM/Opus ou OGG.
- Bouton **WAV (lisible partout)** : convertit à la demande en WAV mono 22 kHz, que n'importe quel lecteur ou téléphone ouvre.
- Le `.zip` contient l'audio et la photo de chaque copie affichée (selon la recherche / le filtre en cours).

## Utiliser

- **En ligne** : publier ce dossier tel quel sur un hébergement statique (GitHub Pages, Netlify, Cloudflare Pages, n'importe quel serveur web). Le micro exige **HTTPS** (ou `localhost`).
- **Essai local** : `python3 -m http.server 8000` dans ce dossier, puis http://localhost:8000.
- **Installer** : dans Chrome / Edge « Installer l'application », dans Safari « Sur l'écran d'accueil ». Après la première visite, tout fonctionne sans connexion.

## Vie privée et limites

- Aucun envoi sur Internet : audio et photos sont gardés dans le navigateur de l'appareil (IndexedDB). Rien n'est synchronisé entre appareils.
- Vider les données du site ou changer de navigateur supprime les corrections : **téléchargez le .zip** pour garder une sauvegarde.
- L'application demande au navigateur de ne pas effacer les données automatiquement, mais certains navigateurs peuvent refuser.
- Pas de lecture de PDF : la copie se joint en photo (JPEG/PNG/HEIC selon l'appareil).
- Testé avec Chromium (enregistrement, photo, sauvegarde, rechargement, téléchargements audio / WAV / ZIP, recherche, suppression, arabe). Safari / iPhone et le partage natif n'ont pas été testés.
