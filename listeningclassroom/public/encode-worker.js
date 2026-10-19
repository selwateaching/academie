// MP3 encoding in a Web Worker (lamejs, mono, 128 kbps).
// In:  {pcm: ArrayBuffer (Float32), sr}
// Out: {type:'mp3', mp3: ArrayBuffer} | {type:'error', message}

importScripts('/vendor/lamejs/lame.min.js');

self.onmessage = (event) => {
  try {
    const { pcm, sr } = event.data;
    const samples = new Float32Array(pcm);
    const enc = new lamejs.Mp3Encoder(1, sr, 128);
    const parts = [];
    const block = 1152;
    const int16 = new Int16Array(block);
    for (let i = 0; i < samples.length; i += block) {
      const n = Math.min(block, samples.length - i);
      for (let j = 0; j < n; j++) {
        const s = Math.max(-1, Math.min(1, samples[i + j]));
        int16[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const buf = enc.encodeBuffer(n === block ? int16 : int16.subarray(0, n));
      if (buf.length) parts.push(new Uint8Array(buf));
    }
    const end = enc.flush();
    if (end.length) parts.push(new Uint8Array(end));
    const total = parts.reduce((n, p) => n + p.length, 0);
    const mp3 = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) { mp3.set(p, offset); offset += p.length; }
    self.postMessage({ type: 'mp3', mp3: mp3.buffer }, [mp3.buffer]);
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
