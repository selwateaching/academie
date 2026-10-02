# Traducteur Association — appels, messages vocaux et documents

Application web pour les permanences : la personne n'a rien à apprendre. Écran d'accueil avec 4 gros boutons,
après avoir choisi la langue de la personne :

1. **🇫🇷 Français → langue** : vous parlez ou écrivez, la traduction s'affiche en gros et est lue à voix haute.
2. **🌍 Langue → français** : la personne parle, la traduction française s'affiche.
3. **📷 Traduire un document** : photo d'un courrier, formulaire, ordonnance… → traduction complète + « En bref » (de quoi il s'agit, ce qu'il faut faire). Vers le français ou vers la langue de la personne.
4. **🎤 Conversation** : les deux sens en direct. On peut aussi y importer un message vocal reçu (WhatsApp `.opus`, `.m4a`…).

Langues : darija algérienne, tunisienne et marocaine (comprend le mélange darija/français), arabe standard, anglais, dari, pashto, turc, espagnol, portugais, russe, ukrainien, bengali, et 14 autres.

La voix en direct utilise la reconnaissance du navigateur : **Chrome ou Edge** recommandés. Le pashto et le dari sont peu ou pas reconnus à la voix : dans ce cas, utilisez le message vocal importé ou le clavier. Les clés restent sur le serveur.

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

- Une traduction automatique peut se tromper : pour les situations sensibles (santé, justice), à faire confirmer.
- Les dialectes arabes sont compris de façon variable par la reconnaissance vocale.
- Un appel téléphonique n'est pas capté directement par le navigateur : haut-parleur + micro de l'appareil.
