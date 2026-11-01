# GARAGE CRM AI – agent de prospection pour carrosserie / mécanique

CRM privé (3 à 5 utilisateurs) avec un agent IA qui trouve, qualifie et prépare le contact de clients professionnels :
loueurs, concessionnaires, marchands VO, flottes d'entreprise, assureurs/experts, taxis/VTC, transporteurs, BTP, auto-écoles, garages partenaires.

## Ce que fait l'agent
1. **Prospecteur** – recherche via Google Places API (ou import CSV) ; source et identifiant conservés ; doublons ignorés.
2. **Qualificateur** – score 0-100 + raison + prochaine action (OpenAI, sinon règles de repli).
3. **Commercial** – brouillons d'email, de relance, de script d'appel. **Rien ne part sans validation humaine.**
4. Suivi : statuts (À contacter → Contacté → RDV → Partenaire), opposition à la prospection, tableau de bord.

Rôles : `admin` (utilisateurs), `manager` (lance l'agent, valide et envoie), `commercial` (fiches, brouillons).

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
