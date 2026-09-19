"""
Construit la banque audio de SpeakIA : un clip par mot de vocabulaire,
consigne d'écoute et phrase à répéter, sous la forme d'un JSON
{ texte anglais: "data:audio/...;base64,..." } prêt à être embarqué dans
la démo HTML (aucun accès réseau requis côté navigateur, aucune dépendance
à la synthèse vocale du navigateur).

Pour chaque texte, un vrai fichier audio (voix humaine) déposé dans
UPLOADS_DIR est TOUJOURS préféré à la voix synthétique. Voir
static/audio/README.md pour les noms de fichiers attendus. Les textes sans
fichier fourni utilisent automatiquement la voix de secours (espeak-ng),
donc un dépôt partiel de fichiers fonctionne déjà.

Usage :
    python3 gen_audio.py [dossier_de_sortie]
"""
import audioop
import base64
import json
import mimetypes
import subprocess
import sys
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from content import audio_slug_map  # noqa: E402

BASE_DIR = Path(__file__).parent
UPLOADS_DIR = BASE_DIR / "static" / "audio"
OUT_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE_DIR / "audio_map.json"

UPLOAD_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a"]


def find_uploaded_file(slug):
    for ext in UPLOAD_EXTENSIONS:
        candidate = UPLOADS_DIR / f"{slug}{ext}"
        if candidate.exists():
            return candidate
    return None


def synthesize(text, tmp_wav):
    subprocess.run(
        [
            "espeak-ng",
            "-v", "en-us",
            "-s", "100",   # vitesse (mots/minute) — rythme d'initiation, bien plus lent que la parole naturelle (~160)
            "-p", "45",    # hauteur naturelle et posée
            "-a", "100",   # amplitude par défaut — évite toute distorsion
            "-g", "15",    # pause nette entre les mots, pour une diction pédagogique bien articulée
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

    # 8 bits plutôt que 16 : réduit la taille de moitié sans toucher à la
    # fréquence d'échantillonnage (donc sans repliement de spectre), juste un
    # léger bruit de quantification, inaudible pour de la voix parlée.
    if width == 2:
        frames = audioop.lin2lin(frames, 2, 1)
        frames = audioop.bias(frames, 1, 128)  # PCM 8 bits WAV = non signé
        width = 1

    out_buf = tmp_wav.with_suffix(".out.wav")
    with wave.open(str(out_buf), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(width)
        wf.setframerate(rate)
        wf.writeframes(frames)

    return out_buf.read_bytes(), "audio/wav"


def main():
    slugs = audio_slug_map()
    audio_map = {}
    tmp_wav = Path("/tmp/_speakia_tts.wav")

    n_uploaded = 0
    n_synth = 0

    for i, (text, slug) in enumerate(slugs.items()):
        uploaded = find_uploaded_file(slug)
        if uploaded:
            raw = uploaded.read_bytes()
            mime = mimetypes.guess_type(uploaded.name)[0] or "audio/mpeg"
            n_uploaded += 1
        else:
            raw, mime = synthesize(text, tmp_wav)
            n_synth += 1

        b64 = base64.b64encode(raw).decode("ascii")
        audio_map[text] = f"data:{mime};base64,{b64}"

        if (i + 1) % 20 == 0 or i == len(slugs) - 1:
            print(f"{i + 1}/{len(slugs)} generated", file=sys.stderr)

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(audio_map, f)

    total_kb = sum(len(v) for v in audio_map.values()) / 1024
    print(
        f"Wrote {len(audio_map)} clips ({n_uploaded} real recordings, "
        f"{n_synth} synthesized) — ~{total_kb:.0f} KB of base64 to {OUT_FILE}"
    )


if __name__ == "__main__":
    main()
