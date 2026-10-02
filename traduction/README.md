# Tarjam — interprète pour l'association (appels, messages vocaux, documents)

**Tarjam** (ترجمة, « traduction ») : application web pour les permanences : la personne n'a rien à apprendre. Écran d'accueil avec 5 gros boutons,
après avoir choisi la langue de la personne :

1. **🇫🇷 Français → langue** : vous parlez ou écrivez, la traduction s'affiche en gros et est lue à voix haute.
2. **🌍 Langue → français** : la personne parle, la traduction française s'affiche.
3. **📷 Document** : photo, image, **PDF** ou texte collé, avec 3 modes : **Traduire** (+ « En bref »), **Simplifier** (langage très simple : de quoi il s'agit, quoi faire, avant quand, que risque-t-on) et **Formulaire** (explique chaque case et ce qu'il faut y écrire, avec un exemple). Des pictogrammes (📅 💶 📄 📍 ⚠️ ✍️) aident à comprendre. Vers le français ou vers la langue de la personne.
4. **📱 Deux téléphones** : le bénévole ouvre une session, la personne scanne le QR code (ou ouvre le lien), choisit sa langue. Chacun parle ou écrit dans sa langue sur son propre téléphone : le message de l'un s'affiche traduit sur l'écran de l'autre (et peut être lu à voix haute). Un bouton **📺 Mode écran** ouvre une page en grand texte (français + langue de la personne) pour une télé ou un grand écran en salle d'accueil.
5. **🎤 Conversation** : les deux sens en direct. On peut aussi y importer un message vocal reçu (WhatsApp `.opus`, `.m4a`…).

Langues : darija algérienne, tunisienne et marocaine (comprend le mélange darija/français), arabe standard, anglais, dari, pashto, turc, espagnol, portugais, russe, ukrainien, bengali, et 14 autres.

La voix en direct utilise la reconnaissance du navigateur : **Chrome ou Edge** recommandés. Le pashto et le dari sont peu ou pas reconnus à la voix : dans ce cas, utilisez le message vocal importé ou le clavier. Les clés restent sur le serveur.

## Dossiers et courriers standards

Carte **Dossiers et courriers** : suivi des personnes accompagnées.
- **Dossier** : prénom, nom, langue, téléphone (facultatif), statut (En cours / En attente / Clos), échéance (en rouge si dépassée), remarques.
- **Journal de suivi** : rendez-vous, appels, démarches, courriers, notes, datés et signés du prénom du bénévole.
- **Traduire avec cette personne** : ouvre la conversation dans sa langue.
- **Courrier standard** : 6 modèles (attestation d'accompagnement, attestation de présence, demande de rendez-vous, transmission de pièces, demande de réexamen, rappel de rendez-vous) pré-remplis avec les données du dossier et l'en-tête de l'association, à imprimer ou enregistrer en PDF, avec une version traduite pour la personne. Chaque courrier généré est noté dans le journal.
- **Courriers modifiables** : les textes sont dans `letters.json` (un seul fichier, identique pour tous les bénévoles).

**Protection des données** (à activer, sinon les dossiers restent désactivés) :
| Variable | Rôle |
|---|---|
| `DOSSIER_KEY` | **obligatoire pour les dossiers** : phrase secrète longue qui chiffre les dossiers sur le disque. Ne la perdez pas : sans elle, les dossiers sont illisibles. |
| `TRAD_ACCESS_CODE` | **obligatoire pour les dossiers** : sans lui, l'accès est refusé. 10 mauvais codes bloquent l'adresse 15 minutes. |
| `ASSO_NAME`, `ASSO_ADDRESS`, `ASSO_CONTACT`, `ASSO_CITY` | en-tête des courriers |
| `DOSSIER_RETENTION_MONTHS` | suppression automatique des dossiers inactifs (défaut 24) |
| `DATA_DIR` | dossier de stockage (défaut `/var/data` s'il existe) |

⚠️ **Il faut un disque persistant.** Sur Render, l'offre gratuite efface les fichiers à chaque redémarrage : les dossiers disparaîtraient. Il faut une offre payante (Starter) avec un **Disk** monté sur `/var/data` (1 Go suffit).
⚠️ **RGPD** : vous devenez responsable de données de personnes vulnérables. Informez les personnes, ne notez que le nécessaire, inscrivez ce traitement dans le registre de l'association, et supprimez les dossiers sur demande (bouton 🗑). Les textes envoyés à la traduction partent chez Anthropic.

## Phrases utiles (hors connexion)

18 phrases d'accueil courantes (« Avez-vous un rendez-vous ? », « Signez ici », « Apportez vos papiers »…) traduites dans la langue choisie, avec lecture à voix haute. Elles sont téléchargées automatiquement quand il y a du réseau et **gardées sur l'appareil** : on peut ensuite les utiliser sans Internet. Pensez à ouvrir l'appli une fois avec du réseau pour chaque langue que vous utilisez.

## Confidentialité et accueil

- **🧹 Nouvelle personne** (en haut de chaque écran) efface tout : conversation, document, photo, session partagée. À presser entre deux personnes accueillies.
- Effacement automatique après **10 minutes sans activité**.
- Le serveur ne stocke ni documents ni photos ; les conversations « deux téléphones » restent en mémoire max. 3 h et sont supprimées par « Nouvelle personne ». Rien n'est écrit sur disque.
- Les textes et documents sont envoyés à Anthropic (traduction) et, pour les fichiers audio importés, à OpenAI : à mentionner dans votre information aux usagers.
- Un avertissement « traduction automatique, à faire vérifier » est affiché sur chaque écran.

## Installation sur le téléphone / hors connexion

La page peut être « ajoutée à l'écran d'accueil » (application installable) et s'ouvre même sans réseau. **La traduction elle-même demande Internet** : hors connexion, un bandeau rouge l'indique. Une traduction 100 % hors ligne n'est pas prévue pour l'instant.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | obligatoire : traduction (Claude) |
| `OPENAI_API_KEY` | facultatif : uniquement pour importer des fichiers audio (Whisper) |
| `TRAD_ACCESS_CODE` | conseillé : code à saisir dans la page, pour éviter que des inconnus consomment votre crédit |
| `TRAD_MODEL` | modèle Claude (défaut `claude-sonnet-5-5`) |
| `TRAD_PER_HOUR` | requêtes max / heure / IP (défaut 600) |

## Lancer en local

```bash
cd traduction
pip install -r requirements.txt
ANTHROPIC_API_KEY=sk-ant-... python server.py     # http://localhost:5000
```

## Mise en ligne

Render → New → Blueprint (le `render.yaml` crée le service `interprete`) ou Web Service avec
Root Directory `traduction`, Build `pip install -r requirements.txt`,
Start `gunicorn server:app --workers 1 --threads 8 --bind 0.0.0.0:$PORT`.
Le micro du navigateur exige HTTPS (fourni par Render).

## Limites à connaître

- Le code d'accès est partagé : tout bénévole qui le connaît voit tous les dossiers. Changez-le quand un bénévole part.
- Les sessions « deux téléphones » sont gardées en mémoire du serveur et effacées après 3 h (ou au redémarrage). Gardez `--workers 1`.
- Seule la personne qui a le code/lien de session peut y participer ; ne le diffusez pas.

- Une traduction automatique peut se tromper : pour les situations sensibles (santé, justice), à faire confirmer.
- Les dialectes arabes sont compris de façon variable par la reconnaissance vocale.
- Un appel téléphonique n'est pas capté directement par le navigateur : haut-parleur + micro de l'appareil.
