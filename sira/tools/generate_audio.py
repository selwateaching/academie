# Génère audio/<id>/<n>.mp3 avec Kokoro-82M (voix ff_siwis). Usage : python generate_audio.py <fragment> <nb_fragments> <dossier_sortie>
# Prérequis : pip install kokoro-onnx soundfile ; modèle kokoro-v1.0.onnx et voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx, release model-files-v1.0) ; ffmpeg ; texts.json (voir prepare_texts.js).
import sys, json, os, subprocess, numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro
shard, nshards = int(sys.argv[1]), int(sys.argv[2])
out_root = sys.argv[3]
so = ort.SessionOptions(); so.intra_op_num_threads = 1; so.inter_op_num_threads = 1
sess = ort.InferenceSession("model/kokoro-v1.0.onnx", sess_options=so, providers=["CPUExecutionProvider"])
k = Kokoro.from_session(sess, "model/voices-v1.0.bin")
texts = json.load(open("texts.json"))
jobs = [(int(i), n, t) for i, ts in texts.items() for n, t in enumerate(ts)]
jobs = [j for idx, j in enumerate(sorted(jobs)) if idx % nshards == shard]
done = 0
for i, n, t in jobs:
    path = f"{out_root}/{i}/{n}.mp3"
    if os.path.exists(path) and os.path.getsize(path) > 2000: continue
    os.makedirs(os.path.dirname(path), exist_ok=True)
    audio, sr = k.create(t, voice="ff_siwis", speed=1.0, lang="fr-fr")
    audio = np.asarray(audio, dtype=np.float32)
    rms = float(np.sqrt(np.mean(audio**2))) or 1e-6
    audio = np.clip(audio * (0.12 / rms), -0.97, 0.97)
    p = subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(sr),"-ac","1","-i","-","-codec:a","libmp3lame","-b:a","40k","-ar","24000",path+".tmp.mp3"], input=audio.tobytes(), capture_output=True)
    if p.returncode != 0: print("ERREUR ffmpeg", i, n, p.stderr[:200]); continue
    os.replace(path+".tmp.mp3", path)
    done += 1
    print(f"[{shard}] {i}/{n} ok ({len(audio)/sr:.0f}s)", flush=True)
print(f"[{shard}] terminé : {done} fichiers", flush=True)
