# Rosée — logiciel de gestion pour institut de beauté

Application web complète (Flask + SQLite, sans dépendance front) pour un institut : lissage, soins capillaires,
onglerie, pédicure, cils, et toute prestation ajoutée ensuite. **Le nom, les coordonnées, les horaires, les tarifs,
les textes, les images et les règles de diagnostic sont entièrement modifiables depuis l'administration** : le produit
est conçu pour être livré à une cliente sans toucher au code.

| Espace | URL | Public |
|---|---|---|
| Site vitrine | `/` | tout le monde |
| Réservation + espace cliente | `/reserver`, `/compte` | clientes (mobile-first) |
| Espace professionnel | `/admin` | la professionnelle |
| Devis en ligne (lien par email) | `/devis/<jeton>` | la cliente destinataire |

## Démarrage

```bash
cd institut
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python app.py                       # http://localhost:5050
```

Au premier lancement, la base est créée avec des prestations, 4 diagnostics (lissage, onglerie, pédicure, cils), des
stocks et des **données de démonstration** ; le mot de passe du compte professionnel (`pro@institut.local`) est affiché
dans la console. Comptes de démo des clientes : mot de passe `demo-cliente-2026`.

**Pour la mise en production**, définir avant le premier lancement :

| Variable | Rôle |
|---|---|
| `INSTITUT_ADMIN_EMAIL`, `INSTITUT_ADMIN_PASSWORD` | compte professionnel |
| `INSTITUT_SEED_DEMO=0` | ne pas créer de clientes/rendez-vous fictifs |
| `INSTITUT_SECRET` | clé de signature des sessions (sinon générée dans `instance/`) |
| `INSTITUT_HTTPS=1` | cookies `Secure` derrière HTTPS |
| `INSTITUT_INSTANCE` | dossier de la base et des photos (à sauvegarder !) |
| `INSTITUT_SMTP_HOST/PORT/USER/PASSWORD/FROM` | envoi réel des emails |

```bash
gunicorn wsgi:app --workers 1 --threads 8 --bind 0.0.0.0:$PORT   # 1 seul worker : il envoie les rappels
```

## Fonctionnalités

- **Diagnostic intelligent** : questions conditionnelles, photos (face / arrière / profil / gros plan), analyse par
  **règles configurables** (SI … ALORS : verdict, prestations à proposer, alerte, validation professionnelle), simulateur
  de règles, création/duplication de nouveaux diagnostics. Verdicts : possible · précautions · préparation recommandée ·
  déconseillé. Mention « pas un diagnostic médical » systématique.
- **Devis automatique** après diagnostic : consultable, PDF, imprimable, envoi par email, accepté/refusé, converti en
  rendez-vous, avec durée de validité.
- **Réservation en ligne** : prestation → diagnostic → recommandations → date → heure → compte → récapitulatif → acompte
  → confirmation. Disponibilités calculées (horaires, congés, blocages, durée + préparation + nettoyage).
- **Planning** jour / semaine / mois, glisser-déposer, 8 statuts, ajout manuel, blocages, congés, horaires exceptionnels.
- **Fiche cliente** : coordonnées, consentements, chronologie, diagnostics, photos avant/après (consentement marketing
  vérifié), produits utilisés/achetés, devis, factures, paiements, notes privées.
- **Prestations**, **produits**, **stocks** (entrées, pertes, inventaire, seuils, péremption, autonomie estimée,
  consommation automatique à la fin d'une prestation, liste de réapprovisionnement), **factures** PDF, encaissements,
  **fidélité**, **statistiques**, **communications** (confirmation, rappels 48 h / 24 h, message après visite).
- **RGPD** : consentements, export JSON, suppression de compte (données personnelles et photos effacées).

## Limites connues / à brancher avant mise en ligne

- **Paiement de l'acompte** : mode démonstration (aucun prélèvement). Brancher un prestataire (Stripe, SumUp…) dans
  `client_api.py` (`c_booking`).
- **Emails** : sans `INSTITUT_SMTP_*`, les messages sont enregistrés et visibles dans l'espace cliente, mais non envoyés.
- **Images** : le site affiche des visuels illustrés par défaut. Les photos réelles se téléversent dans
  *Paramètres → Visuels du site* (n'utiliser que des images dont les droits sont détenus).
- **Mono-praticienne** (un seul créneau à la fois) ; fuseau horaire = celui du serveur ; pas de réinitialisation de mot
  de passe en libre-service (la professionnelle génère un mot de passe temporaire).
- Les règles de sécurité (grossesse, allergies, infections…) fournies sont des exemples à faire valider par la
  professionnelle selon ses protocoles.

## Tests

```bash
pip install pytest && python -m pytest -q
```
