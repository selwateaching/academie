# Interprète — traduire les appels et messages vocaux

Application web pour l'association : discuter avec une personne qui ne parle pas français.

- **🎤 Ils parlent** : l'appli écoute (appel sur haut-parleur près du micro), transcrit la langue de la personne et affiche la traduction **en français**.
- **🎤 Je réponds** (ou saisie au clavier) : votre réponse en français est traduite et **lue à voix haute** dans sa langue.
- **📎 Importer un message vocal** reçu (WhatsApp `.opus`, `.m4a`, `.mp3`…) : transcription + traduction.
- Darija **algérienne, tunisienne, marocaine** en tête de liste (comprend le mélange darija/français), puis 21 autres langues (arabe standard, anglais, espagnol, russe, ukrainien, turc, chinois, persan, ourdou, hindi, bengali, somali, amharique…).

La voix en direct utilise la reconnaissance du navigateur : **Chrome ou Edge** recommandés (ordinateur ou Android).
Les clés restent sur le serveur, jamais dans la page.

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
