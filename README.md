# BTP Manager

Application de gestion pour entreprises du BTP : clients, prospects, devis,
factures, chantiers, équipes, planning, stock, documents, courrier,
trésorerie et rentabilité — le tout dans une seule application.

**Technologies :** HTML + CSS + JavaScript (aucun framework, aucun bundler)
et [Supabase](https://supabase.com) (authentification, base de données
PostgreSQL, stockage de fichiers, sécurité).

Ce document explique comment installer et tester la version actuelle
(Étapes 2 et 3 du plan de développement : base de données sécurisée,
authentification, entreprise, utilisateurs, et le premier module métier
**Clients**). Les autres modules du menu affichent "à venir" en attendant
d'être développés — c'est normal, pas une erreur.

## 1. Créer ton projet Supabase

1. Va sur [supabase.com](https://supabase.com), crée un compte puis un
   nouveau projet (choisis une région proche de la France, ex. Europe).
2. Note le mot de passe de la base de données que tu choisis à la création
   (tu n'en auras pas besoin au quotidien, mais garde-le en lieu sûr).
3. Une fois le projet créé, va dans **Project Settings → API**. Tu y
   trouveras :
   - **Project URL**
   - **anon public key**

   Ces deux valeurs sont publiques par conception (elles sont visibles dans
   le navigateur de tes utilisateurs) : la sécurité réelle vient des règles
   RLS (voir plus bas), jamais de cette clé.

## 2. Exécuter les scripts SQL

Dans Supabase, ouvre **SQL Editor → New query**, puis copie-colle et exécute
(bouton "Run") **dans l'ordre** les fichiers du dossier `sql/` :

1. `sql/001_schema.sql` — crée les tables (entreprises, utilisateurs,
   clients, prospects, invitations, historique des modifications).
2. `sql/002_functions.sql` — crée les fonctions et déclencheurs
   (création automatique d'entreprise, gestion des invitations, audit).
3. `sql/003_rls.sql` — active la sécurité "Row Level Security" : chaque
   utilisateur ne peut voir/modifier que les données de sa propre
   entreprise, selon son rôle.
4. `sql/004_projects_quotes.sql` — ajoute les chantiers (version de base)
   et les devis (avec leurs lignes et leur numérotation automatique).
5. `sql/005_invoices.sql` — ajoute les factures (tous types), leurs
   lignes et le suivi des paiements.

Chaque script n'affecte que ses propres tables : les données déjà
créées (clients, devis, utilisateurs...) ne sont jamais modifiées ni
supprimées par les scripts suivants.

Si tu dois relancer ces scripts plus tard (par exemple après une mise à
jour), c'est normal et sans danger : ils sont écrits pour ne pas dupliquer
ce qui existe déjà (`create table if not exists`, `drop policy if exists`
avant chaque `create policy`, etc.). **Ils ne suppriment jamais de données
existantes.**

### Paramètres d'authentification recommandés (pour bien débuter)

Dans **Authentication → Providers → Email**, l'option "Confirm email" est
activée par défaut : un nouvel utilisateur doit cliquer sur un lien reçu
par email avant de pouvoir se connecter. Pour tes premiers tests, tu peux
soit :

- garder cette option activée et consulter tes emails (recommandé pour la
  mise en production, plus sûr) ;
- ou la désactiver temporairement dans **Authentication → Providers →
  Email → "Confirm email"** pour tester plus vite en local.

Pense aussi à renseigner **Authentication → URL Configuration → Site URL**
avec l'adresse à laquelle tourne ton application (voir étape 4) pour que
les liens de confirmation par email fonctionnent correctement.

## 3. Configurer l'application avec tes clés

1. Copie `js/config.example.js` vers `js/config.js` (ce dernier fichier est
   volontairement ignoré par Git — chaque installation garde ses propres
   clés).
2. Ouvre `js/config.js` et remplace `SUPABASE_URL` et `SUPABASE_ANON_KEY`
   par les valeurs récupérées à l'étape 1.

## 4. Lancer l'application en local

Le navigateur doit charger les fichiers via un petit serveur web (pas en
ouvrant directement le fichier HTML), car les modules JavaScript modernes
l'exigent. Depuis le dossier du projet :

```bash
python3 -m http.server 8000
```

puis ouvre `http://localhost:8000` dans ton navigateur.
(Alternative si tu as Node.js installé : `npx serve .`)

## 5. Premier test

1. Va sur `http://localhost:8000/signup.html`.
2. Laisse le mode "Je crée mon entreprise" sélectionné, remplis le
   formulaire (ton prénom, nom, la raison sociale de ton entreprise, ton
   email et un mot de passe), puis valide.
3. Si tu as activé la confirmation par email : va confirmer ton compte via
   le lien reçu, puis connecte-toi sur `login.html`. L'application termine
   alors automatiquement la création de ton entreprise.
4. Tu arrives sur le **tableau de bord**. Va dans **Paramètres** pour
   compléter les informations de ton entreprise (SIRET, IBAN, TVA...).
5. Va dans **Clients**, clique sur **"+ Nouveau client"**, remplis la fiche
   et clique sur **Enregistrer**. Le client apparaît dans la liste avec des
   boutons **Modifier** et **Supprimer**.
6. Va dans **Chantiers**, crée-en un (associe-le éventuellement à ton
   client), avec ses boutons Modifier/Supprimer.
7. Va dans **Devis**, clique sur **"+ Nouveau devis"**, choisis un client,
   ajoute une ou plusieurs lignes (désignation, quantité, prix, TVA), puis
   **Enregistrer**. Le devis reçoit un numéro automatique (ex. `DEV-2026-0001`).
   Clique sur le bouton **PDF** de la liste pour télécharger le devis en PDF.
   Le menu déroulant "Statut" de chaque ligne permet de faire évoluer le
   devis (brouillon → envoyé → accepté...).
8. Va dans **Factures**, crée une facture "Classique" pour ton client
   (mêmes principes que le devis : lignes, calcul automatique). Une fois
   enregistrée, rouvre-la avec **"Modifier"** : une section **"Paiements
   enregistrés"** apparaît en bas, permettant d'ajouter un règlement
   (montant, date, moyen de paiement). Le statut passe automatiquement à
   "Partiellement payée" ou "Payée" selon le montant réglé.
9. Astuce : dans **Devis**, passe le statut d'un devis à **"Accepté"** —
   un bouton **"Facturer"** apparaît alors sur sa ligne. Il crée une
   facture pré-remplie avec les mêmes lignes que le devis, prête à être
   ajustée puis enregistrée.
10. Pour tester les rôles : dans **Paramètres → Inviter un utilisateur**,
   invite une deuxième adresse email avec le rôle "Salarié", puis crée un
   compte avec cette adresse via `signup.html` en choisissant "J'ai été
   invité(e)". Connecte-toi avec ce second compte : tu verras que les
   boutons Modifier/Supprimer sur les clients ont disparu (le rôle Salarié
   n'a pas ces droits).

### Ce qui est normal

- Les indicateurs grisés du tableau de bord (CA, devis, factures...) : ils
  s'activeront quand les modules correspondants seront développés.
- Les entrées de menu ouvrant une page "à venir".
- Devoir confirmer son email avant la première connexion (si l'option est
  activée côté Supabase).

### Ce qui serait une erreur

- Un message "Erreur de chargement" persistant sur la liste des clients
  → vérifie `js/config.js` (clés Supabase) et que les 3 scripts SQL ont
  bien été exécutés sans erreur.
- Voir les clients d'une autre entreprise → ne devrait **jamais** arriver ;
  si c'est le cas, préviens-moi immédiatement, c'est un problème de
  sécurité à corriger en priorité.

## Structure du projet

```
index.html            redirection automatique login/dashboard
login.html             connexion
signup.html             création de compte (entreprise ou invitation)
onboarding.html          finalisation après confirmation email
dashboard.html            tableau de bord
pages/clients.html          module Clients
pages/chantiers.html          module Chantiers
pages/devis.html                 module Devis (+ PDF)
pages/factures.html                module Factures + paiements (+ PDF)
pages/parametres.html      entreprise + utilisateurs + invitations
pages/a-venir.html            modules pas encore développés
css/style.css                 styles partagés (responsive)
js/supabaseClient.js            connexion à Supabase
js/config.js (à créer)             tes clés Supabase (non versionné)
js/auth.js                    authentification, profil, permissions
js/ui.js                        menu latéral, notifications, confirmations
js/clients.js                     logique du module Clients
js/chantiers.js                     logique du module Chantiers
js/devis.js                           logique du module Devis
js/factures.js                          logique du module Factures
js/pdf.js                               génération des PDF (devis, factures)
js/parametres.js                    logique du module Paramètres
sql/001_schema.sql                    tables
sql/002_functions.sql                   fonctions et déclencheurs
sql/003_rls.sql                           sécurité (Row Level Security)
sql/004_projects_quotes.sql                 chantiers + devis
sql/005_invoices.sql                          factures + paiements
```

## Sécurité — ce qu'il faut savoir

- **Isolation entre entreprises** : chaque table sensible a une colonne
  `company_id` et une règle RLS qui interdit toute lecture/écriture en
  dehors de l'entreprise de l'utilisateur connecté. C'est appliqué au
  niveau de la base de données elle-même, pas seulement dans l'interface.
- **Permissions par rôle** : en plus de l'isolation par entreprise, chaque
  action (créer, modifier, supprimer) vérifie le rôle de l'utilisateur
  (voir `sql/003_rls.sql`).
- **Historique** : les créations, modifications et suppressions de clients
  et prospects sont enregistrées dans `audit_logs` (qui, quoi, quand,
  ancienne/nouvelle valeur).
- **Aucun secret dans le frontend** : la clé "anon" est publique par
  conception. Aucune autre clé (IA, Gmail...) ne doit jamais être ajoutée
  dans les fichiers `js/` — ce sera toujours géré via une Edge Function
  Supabase le moment venu.

## Suite du développement

Prochaines étapes prévues (voir l'échange initial pour le détail) :
Prospects (pipeline), Devis + PDF, Factures + paiements, Chantiers,
Planning + tâches, Fournisseurs/Achats/Stock, Documents + Courrier,
Dashboard complet + Rapports, IA (optionnelle).

Chaque étape ajoute des tables et des colonnes ; **aucune donnée existante
n'est jamais supprimée** lors de ces évolutions.
