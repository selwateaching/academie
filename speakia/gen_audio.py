"""
Génère un clip audio (voix anglaise, espeak-ng) pour chaque texte utilisé
dans les leçons, puis produit un fichier JSON { texte: "data:audio/wav;base64,..." }
prêt à être embarqué dans la démo HTML autonome (pas d'accès réseau requis
côté navigateur, pas de dépendance à la synthèse vocale du navigateur).
"""
import audioop
import base64
import json
import subprocess
import sys
import wave
from pathlib import Path

TEXTS_FILE = sys.argv[1] if len(sys.argv) > 1 else "/tmp/speakia_audio_texts.json"
OUT_FILE = sys.argv[2] if len(sys.argv) > 2 else "/tmp/speakia_audio_map.json"

# Pas de sous-échantillonnage : un ratecv naïf (sans filtre passe-bas) crée du
# repliement de spectre (aliasing) qui rend la voix confuse. On garde la
# fréquence native d'espeak-ng (22050 Hz) — le budget de taille le permet
# largement (~5-6 Mo au total pour ~80 clips, bien sous la limite de 16 Mo).
TARGET_RATE = None

with open(TEXTS_FILE, encoding="utf-8") as f:
    texts = json.load(f)

audio_map = {}
tmp_wav = Path("/tmp/_speakia_tts.wav")

for i, text in enumerate(texts):
    subprocess.run(
        [
            "espeak-ng",
            "-v", "en-us",
            "-s", "125",   # vitesse (mots/minute) — nettement plus lent, articulé pour des enfants
            "-p", "48",    # hauteur proche du défaut — plus naturelle, moins criarde
            "-a", "100",   # amplitude par défaut — évite toute distorsion
            "-g", "12",    # petite pause entre les mots, pour une diction plus claire
            "-w", str(tmp_wav),
            text,
        ],
        check=True,
        capture_output=True,
    )

    with wave.open(str(tmp_wav), "rb") as wf:
        channels = wf.getnchannels()
        width = wf.getsampwidth()
        rate = wf.getframerate()
        frames = wf.readframes(wf.getnframes())

    if channels == 2:
        frames = audioop.tomono(frames, width, 0.5, 0.5)

    if TARGET_RATE and rate != TARGET_RATE:
        frames, _ = audioop.ratecv(frames, width, 1, rate, TARGET_RATE, None)
        rate = TARGET_RATE

    out_buf = Path(f"/tmp/_speakia_tts_out.wav")
    with wave.open(str(out_buf), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(width)
        wf.setframerate(rate)
        wf.writeframes(frames)

    raw = out_buf.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    audio_map[text] = "data:audio/wav;base64," + b64

    if (i + 1) % 10 == 0 or i == len(texts) - 1:
        print(f"{i + 1}/{len(texts)} generated", file=sys.stderr)

with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(audio_map, f)

total_bytes = sum(len(v) for v in audio_map.values())
print(f"Wrote {len(audio_map)} clips, ~{total_bytes / 1024:.0f} KB of base64 to {OUT_FILE}")
