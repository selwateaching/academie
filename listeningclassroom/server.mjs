// ListeningClassroom — Render web service
// Serves the static pages (generator, lab) and the API (/api/adapt, /api/lab).

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import adapt from './lib/adapt.mjs';
import lab from './lib/lab.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Basic security headers. Cross-origin isolation is not required by the Kokoro WASM build.
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  next();
});

app.get('/healthz', (req, res) => res.type('text').send('ok'));

// Bridge Express → the Fetch-API handlers (Request in, Response out).
function fetchRoute(handler, { maxBody = 6 * 1024 * 1024 } = {}) {
  return async (req, res) => {
    try {
      const chunks = [];
      let size = 0;
      if (!['GET', 'HEAD'].includes(req.method)) {
        for await (const c of req) {
          size += c.length;
          if (size > maxBody) return res.status(413).json({ error: 'Request too large.' });
          chunks.push(c);
        }
      }
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const request = new Request(url, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
      const response = await handler(request);
      res.status(response.status);
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: 'Server error.' });
    }
  };
}

app.all('/api/adapt', fetchRoute(adapt, { maxBody: 64 * 1024 }));
app.all('/api/lab', fetchRoute(lab));

// Static files. The Kokoro bundle is large and versioned with the code: cache it for a day.
const pub = path.join(__dirname, 'public');
app.use('/vendor', express.static(path.join(pub, 'vendor'), { maxAge: '1d', immutable: false }));
app.use(express.static(pub, { extensions: ['html'], maxAge: '5m' }));

app.use((req, res) => res.status(404).sendFile(path.join(pub, '404.html')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`ListeningClassroom on :${port} — storage: ${process.env.DATABASE_URL ? 'Postgres' : 'local files'}${process.env.ANTHROPIC_API_KEY ? '' : ' — WARNING: ANTHROPIC_API_KEY not set'}`);
});
