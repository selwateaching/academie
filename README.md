# BTP Manager

Application web complète de gestion d'entreprise du BTP (maçonnerie, rénovation, plomberie, électricité, couverture, peinture, menuiserie…) : un seul outil pour piloter clients, prospects, devis, factures, chantiers, planning, équipes, matériaux, documents, messagerie et finances.

Construite avec **Next.js 14 (App Router) + TypeScript + Prisma + SQLite + NextAuth**, entièrement responsive (ordinateur, tablette, mobile).

## Démarrage rapide

```bash
npm install
cp .env.example .env          # ajustez NEXTAUTH_SECRET en production
npm run db:reset              # crée la base SQLite + données de démonstration
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

**Compte de démonstration (patron) :** `patron@btpmanager.fr` / `demo1234`
Autres comptes internes : `conducteur@`, `chef@`, `julien@`, `nadia@`, `compta@btpmanager.fr` (même mot de passe).

**Portail client :** [http://localhost:3000/portail/login](http://localhost:3000/portail/login) — ex. `pierre.lambert@gmail.com` / `demo1234`.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` / `npm run start` — build et serveur de production
- `npm run db:push` — synchronise le schéma Prisma avec la base
- `npm run db:seed` — recharge les données de démonstration
- `npm run db:reset` — réinitialise la base et reseed

## Architecture

```
prisma/schema.prisma     Modèle de données (35+ modèles : entreprise, utilisateurs,
                          clients, prospects, chantiers, devis, factures, salariés,
                          matériaux, fournisseurs, documents, messagerie, calendrier,
                          signatures électroniques, journal d'audit…)
prisma/seed.ts            Données de démonstration réalistes
src/lib/                  Logique métier partagée (calculs devis/factures, auth,
                          PDF, export, IA, email, permissions par rôle)
src/app/(app)/            Application interne (protégée par NextAuth) — tous les
                          modules du menu principal
src/app/portail/          Portail client (auth séparée par cookie JWT)
src/app/api/               Endpoints (fichiers, recherche, notifications, export,
                          messagerie, assistant IA, PDF)
```

### Rôles et permissions

Administrateur (patron), Conducteur de travaux, Chef de chantier, Salarié, Comptabilité — chaque rôle voit un menu et des actions adaptés (`src/lib/enums.ts`).

### Points notables

- **Devis → Chantier → Facture** : l'acceptation d'un devis (par le patron ou par signature électronique du client) crée automatiquement le chantier, une tâche de préparation et, si un acompte est prévu, la facture d'acompte.
- **Signature électronique** : capture au doigt/souris dans le portail client, image + historique conservés, statut du devis mis à jour automatiquement.
- **PDF** générés à la volée (devis, factures) via `@react-pdf/renderer`, incluant logo, mentions légales et coordonnées bancaires de l'entreprise.
- **Assistant IA** (`/assistant`) : utilise l'API Anthropic avec des outils connectés à la base (chantiers, factures impayées, rentabilité, tâches) — inactif tant que `ANTHROPIC_API_KEY` n'est pas renseignée.
- **Export** CSV/Excel pour factures, devis, chantiers, heures et clients (utile pour transmission à un expert-comptable).
- **Emails** (envoi de devis/factures, relances, confirmations de RDV) : simulés (journalisés) si aucun SMTP n'est configuré, sinon envoyés réellement via `nodemailer`.

## Limites connues / prochaines étapes possibles

Ce projet livre une application réellement fonctionnelle (base de données, auth, PDF, messagerie quasi temps réel par sondage, etc.), mais certains points listés dans le cahier des charges restent volontairement simplifiés pour rester réalistes en une seule itération :

- Il s'agit d'une **web app responsive** (installable comme PWA basique), pas d'application mobile native iOS/Android distincte.
- La **messagerie** utilise un rafraîchissement périodique (5 s) plutôt qu'un websocket temps réel.
- La **signature électronique** est fonctionnelle (image + horodatage + historique) mais n'a pas la valeur d'un prestataire de signature qualifiée (type DocuSign/Yousign) au sens juridique strict.
- L'**authentification à deux facteurs** est prévue dans le modèle de données (`twoFactorEnabled`) mais pas encore appliquée au flux de connexion.
- Le module **Finances** est une aide au pilotage ; il ne remplace pas une comptabilité officielle (export CSV/Excel prévu à cet effet).

## Ancien contenu du dépôt

Le dépôt contenait initialement une application Flask sans rapport ("AutoTrading Pro"), déplacée dans `legacy-autotrading/` pour ne pas la perdre.
