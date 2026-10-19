// Request guards shared by the API routes: allowed origins and a simple per-IP rate limit.

export function originAllowed(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin GET, curl, server-to-server
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  if (host === req.headers.get('host')) return true; // same site (Render forwards the public Host)
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://listeningclassroom.com,https://www.listeningclassroom.com')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (process.env.RENDER_EXTERNAL_URL) allowed.push(process.env.RENDER_EXTERNAL_URL.replace(/\/$/, ''));
  return allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

// In-memory sliding window. Enough for one instance; it protects the Anthropic budget from abuse.
const hits = new Map();
export function rateLimited(req, bucket, limit, windowMs = 60 * 60 * 1000) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (list.length >= limit) { hits.set(key, list); return true; }
  list.push(now); hits.set(key, list);
  if (hits.size > 20000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return false;
}
