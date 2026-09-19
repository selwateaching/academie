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

TARGET_RATE = 8000  # Hz — suffisant pour la voix, garde les fichiers légers.

with open(TEXTS_FILE, encoding="utf-8") as f:
    texts = json.load(f)

audio_map = {}
tmp_wav = Path("/tmp/_speakia_tts.wav")

for i, text in enumerate(texts):
    subprocess.run(
        [
            "espeak-ng",
            "-v", "en-us",
            "-s", "150",   # vitesse (mots/minute) — un peu plus lent pour des enfants
            "-p", "55",    # hauteur légèrement plus haute, plus amicale
            "-a", "180",   # amplitude
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

    if rate != TARGET_RATE:
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
