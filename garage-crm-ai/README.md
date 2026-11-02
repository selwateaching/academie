# GARAGE CRM AI – agent de prospection pour carrosserie / mécanique

CRM privé (3 à 5 utilisateurs) avec un agent IA qui trouve, qualifie et prépare le contact de clients professionnels :
loueurs, concessionnaires, marchands VO, flottes d'entreprise, assureurs/experts, taxis/VTC, transporteurs, BTP, auto-écoles, garages partenaires.

## Ce que fait l'agent
1. **Prospecteur** – recherche via Google Places API (ou import CSV) ; source et identifiant conservés ; doublons ignorés.
2. **Qualificateur** – score 0-100 + raison + prochaine action (OpenAI, sinon règles de repli).
3. **Commercial** – brouillons d'email, de relance, de script d'appel. **Rien ne part sans validation humaine.**
4. Suivi : statuts (À contacter → Contacté → RDV → Partenaire), opposition à la prospection, tableau de bord.

Rôles : `admin` (utilisateurs), `manager` (lance l'agent, valide et envoie), `commercial` (fiches, brouillons).

## Relances et rapport
- Onglet **Relances** : prospects « Contactés » sans suite depuis `RELANCE_DAYS` jours (5 par défaut), 2 relances maximum chacun. Le bouton prépare des **brouillons**, validés ensuite dans Messages. Les prospects en opposition sont exclus.
- Onglet **Rapport** : synthèse sur 7, 14 ou 30 jours (nouveaux prospects, messages et relances envoyés, rendez-vous, partenaires, 5 meilleurs prospects à contacter), imprimable en PDF.

## Pilote automatique (onglet « Pilote auto »)
Désactivé par défaut. Il exige l'envoi SMTP configuré (adresse du garage dans `.env`). Une fois activé par l'administrateur, il envoie le premier email aux prospects « À contacter » ayant un email et une note suffisante :
1 envoi toutes les ~10 min au plus, plafond quotidien, horaires et jours réglables, jamais en « opposition », arrêt automatique après 3 échecs d'envoi.
Les relances automatiques sont une option à part : **les réponses ne sont pas encore détectées**, il faut surveiller la boîte mail.
L'application doit tourner en continu (PC allumé ou serveur en ligne).

## Réponses des prospects, STOP et archivage
- Si l'envoi SMTP est configuré, l'application **lit la boîte mail du garage** (IMAP, lecture seule) toutes les 10 minutes.
- **STOP / désinscription** : opposition enregistrée, prospect **archivé** (retiré de la liste en cours, visible via le filtre « Archivé »), messages en attente annulés, **message de confirmation** envoyé une fois (modèle : `app/modeles/confirmation_stop.txt`).
- **Refus** : statut « Refusé ». **Autre réponse** : statut « A répondu ». Dans les deux cas, plus de relance. Les réponses automatiques (absence…) sont ignorées.
- Sans lecture de la boîte mail : bouton **« a dit STOP »** sur la fiche du prospect, même effet.

## Lancer
**Sans Docker (Windows)** : double-cliquer `demarrer.bat`, puis éditer `.env` (SECRET_KEY, ADMIN_PASSWORD…) et relancer.

**Avec Docker** : `cp .env.example .env` puis `docker compose up --build` → http://localhost:8000

**Linux/Mac** : `pip install -r requirements.txt && cp .env.example .env && uvicorn app.main:app`

Connexion : `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`. Tests : `pytest`.

## Clés (toutes facultatives pour démarrer)
- `GOOGLE_PLACES_API_KEY` : recherche automatique (sans elle : import CSV ou saisie manuelle).
- `OPENAI_API_KEY` : scoring et rédaction par IA (sans elle : règles et modèles simples).
- `SMTP_*` : envoi direct (sans eux : copier le message validé, puis « Marquer comme envoyé »).

## Conformité (à valider avec le client)
Prospection B2B par email : adresses professionnelles, message pertinent pour l'activité du destinataire, identité de l'expéditeur claire,
désinscription simple (incluse), respect immédiat des oppositions (case « opposition »). Les appels sont à vérifier avec Bloctel (téléphones de particuliers).

## Avant mise en production
HTTPS (reverse proxy), `SECRET_KEY` aléatoire, sauvegardes PostgreSQL, limitation des tentatives de connexion (non incluse), journalisation.

## Prochaines étapes
Relances programmées (WF05), rapport hebdomadaire, appels sortants/dialer, agenda de rendez-vous, interface React si souhaitée.
