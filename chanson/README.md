# Ma Chanson

Page de vente bilingue (français / arabe) + création de chansons par IA.

Parcours : le client raconte son histoire → **Claude** écrit les paroles →
**ElevenLabs Music** compose et chante → lecture et téléchargement sur la page.

## Lancer en local

    pip install -r requirements.txt
    python server.py        # http://localhost:5000

Sans clé API, le serveur tourne en **mode démo** (paroles factices + mélodie de test),
pratique pour vérifier le parcours.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | paroles (Claude) |
| `ELEVENLABS_API_KEY` | musique + voix chantée (plan payant ElevenLabs requis pour l'API et l'usage commercial) |
| `CHANSON_ACCESS_CODE` | facultatif : code demandé avant de générer |
| `CHANSON_PER_DAY` | chansons max / jour / IP (défaut 3) |
| `CHANSON_SECONDS` | durée visée (défaut 100 s) |
| `CHANSON_MODEL` | modèle Claude (défaut `claude-sonnet-5-5`) |

## À savoir

- Le stockage des chansons est le disque du serveur : sur Render gratuit il est effacé à chaque
  redéploiement. Ajoutez un disque persistant ou un stockage externe avant de vendre.
- L'appel ElevenLabs (`/v1/music`) est écrit de mémoire d'après l'API publique et n'a pas pu être
  testé avec une vraie clé : un premier essai réel est nécessaire.
- Pas encore de paiement ni d'envoi par email.
