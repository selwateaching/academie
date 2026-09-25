# English for Life in Dubai

Une application à part (distincte d'InglisIA, qui reste dédiée aux enfants) : l'anglais
pour les adultes francophones et arabophones qui s'installent à Dubaï pour vivre,
travailler ou investir.

Nom de travail provisoire, à remplacer quand l'identité sera choisie.

## Contenu actuel

Parcours 1 — **Arrive in Dubai** (A1), 8 étapes :

| # | Étape | Type |
|---|---|---|
| 1 | À l'aéroport | vocabulaire |
| 2 | Passer le contrôle des passeports | expressions + dialogue |
| 3 | Prendre un taxi | expressions + dialogue |
| 4 | Carte SIM et Internet | mots, expressions + dialogue |
| 5 | Changer de l'argent | mots, expressions + dialogue |
| 6 | Comprendre les panneaux | vocabulaire + dialogue |
| 7 | Se présenter | expressions + dialogue |
| 🎯 | Mission 01 — Arrive in Dubai | mission (4 scènes enchaînées) |

Les 9 autres parcours et les modules transversaux (Phone Calls, Appointments,
Ask the Price, accents, urgences) sont affichés « Bientôt ».

## Fonctionnement

- Chaque mot / expression existe en **anglais → français → arabe**, avec audio.
  Un sélecteur en haut de page choisit la langue d'appui : français, arabe ou les deux.
- Même moteur que les leçons InglisIA (traduction, écoute, reconstitution), plus une
  nouvelle étape **dialogue** : l'interlocuteur (agent, chauffeur, vendeur…) parle,
  l'apprenant choisit sa réponse ; indice en cas d'erreur, traduction à la demande.
- Les interlocuteurs utilisent, si le navigateur en propose, une autre voix anglaise
  (britannique, indienne…) que celle de l'apprenant.
- Progression en pourcentage de réponses justes du premier coup
  (« Maîtrisé » à partir de 80 %), enregistrée dans le navigateur (`localStorage`).

Tout est dans un seul fichier, `index.html`, sans serveur ni clé API.

## Ajouter une leçon

Dans `index.html`, tableau `PATHS` : chaque leçon a une liste `words`
(`[anglais, français, arabe, emoji]`) et, en option, un `dialogue`
(voir le commentaire en tête du tableau). Pour ouvrir un nouveau parcours,
il suffit de lui donner une liste `lessons`.

## Mise en ligne (Render, gratuit)

**New → Static Site**, dépôt `academie`, puis :
- Root Directory : `dubai`
- Build Command : *(vide)*
- Publish Directory : `.`
