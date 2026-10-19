// Kokoro TTS in a Web Worker so the page stays responsive.
// Messages in:  {type:'loadModel', modelId}
//               {type:'generate', modelId, text, voice, speed}
//               {type:'generate_dialogue', modelId, turns:[{text, voice}], speed}
// Messages out: {type:'loaded'} | {type:'progress', index, total} | {type:'result', pcm, sr} | {type:'error', message}

import { KokoroTTS } from '/vendor/kokoro/kokoro.web.js';

let modelPromise = null;
function loadModel(modelId) {
  if (!modelPromise) {
    modelPromise = KokoroTTS.from_pretrained(modelId || 'onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'wasm' })
      .catch(err => { modelPromise = null; throw err; });
  }
  return modelPromise;
}

const PAUSE_SECONDS = 0.22;

self.onmessage = async (event) => {
  const msg = event.data || {};
  try {
    if (msg.type === 'loadModel') {
      await loadModel(msg.modelId);
      self.postMessage({ type: 'loaded' });
      return;
    }

    if (msg.type === 'generate') {
      const tts = await loadModel(msg.modelId);
      const out = await tts.generate(msg.text, { voice: msg.voice, speed: msg.speed || 1 });
      const pcm = new Float32Array(out.audio);
      self.postMessage({ type: 'result', pcm: pcm.buffer, sr: out.sampling_rate }, [pcm.buffer]);
      return;
    }

    if (msg.type === 'generate_dialogue') {
      const tts = await loadModel(msg.modelId);
      const turns = msg.turns || [];
      const pieces = [];
      let sr = 24000;
      for (let i = 0; i < turns.length; i++) {
        self.postMessage({ type: 'progress', index: i, total: turns.length });
        const out = await tts.generate(turns[i].text, { voice: turns[i].voice, speed: msg.speed || 1 });
        sr = out.sampling_rate;
        pieces.push(out.audio, new Float32Array(Math.round(sr * PAUSE_SECONDS)));
      }
      const total = pieces.reduce((n, p) => n + p.length, 0);
      const pcm = new Float32Array(total);
      let offset = 0;
      for (const p of pieces) { pcm.set(p, offset); offset += p.length; }
      self.postMessage({ type: 'result', pcm: pcm.buffer, sr }, [pcm.buffer]);
      return;
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
