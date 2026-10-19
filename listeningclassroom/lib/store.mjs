// Key/value storage for the language lab.
// - With DATABASE_URL (Render Postgres): one table, durable.
// - Without it (local development): files under ./data.
// Same small interface as Netlify Blobs: get / getWithMetadata / set / setJSON / list / delete.

import fs from 'node:fs/promises';
import path from 'node:path';

let storePromise = null;
export function getStore() {
  if (!storePromise) storePromise = process.env.DATABASE_URL ? pgStore() : fileStore();
  return lazy(storePromise);
}

// Lets callers write `getStore().get(...)` without awaiting the store first.
function lazy(promise) {
  const methods = ['get', 'getWithMetadata', 'set', 'setJSON', 'list', 'delete'];
  return Object.fromEntries(methods.map(m => [m, async (...args) => (await promise)[m](...args)]));
}

function decode(buf, type) {
  if (buf == null) return null;
  if (type === 'json') return JSON.parse(Buffer.from(buf).toString('utf8'));
  if (type === 'text') return Buffer.from(buf).toString('utf8');
  if (type === 'arrayBuffer') { const b = Buffer.from(buf); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); }
  return Buffer.from(buf);
}
const toBuffer = d => Buffer.isBuffer(d) ? d : d instanceof ArrayBuffer ? Buffer.from(d) : ArrayBuffer.isView(d) ? Buffer.from(d.buffer, d.byteOffset, d.byteLength) : Buffer.from(String(d));

async function pgStore() {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // Render's internal URL needs no TLS; the external one does.
    ssl: /\.render\.com/.test(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
  await pool.query(`CREATE TABLE IF NOT EXISTS lab_blobs (
    key TEXT PRIMARY KEY,
    data BYTEA NOT NULL,
    meta JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const getRow = async key => (await pool.query('SELECT data, meta FROM lab_blobs WHERE key = $1', [key])).rows[0];
  const put = (key, buf, meta) => pool.query(
    `INSERT INTO lab_blobs (key, data, meta, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, meta = EXCLUDED.meta, updated_at = now()`,
    [key, buf, meta ? JSON.stringify(meta) : null]);
  return {
    async get(key, opts) { const r = await getRow(key); return r ? decode(r.data, opts?.type) : null; },
    async getWithMetadata(key, opts) { const r = await getRow(key); return r ? { data: decode(r.data, opts?.type), metadata: r.meta || {} } : null; },
    async set(key, data, opts) { await put(key, toBuffer(data), opts?.metadata); },
    async setJSON(key, value) { await put(key, Buffer.from(JSON.stringify(value)), null); },
    async list({ prefix = '' } = {}) {
      const like = prefix.replace(/[\\%_]/g, m => '\\' + m) + '%';
      const { rows } = await pool.query('SELECT key FROM lab_blobs WHERE key LIKE $1 ORDER BY key', [like]);
      return { blobs: rows.map(r => ({ key: r.key })) };
    },
    async delete(key) { await pool.query('DELETE FROM lab_blobs WHERE key = $1', [key]); },
  };
}

async function fileStore() {
  const root = path.resolve(process.env.DATA_DIR || 'data');
  await fs.mkdir(root, { recursive: true });
  const file = key => path.join(root, encodeURIComponent(key));
  const readMeta = async key => { try { return JSON.parse(await fs.readFile(file(key) + '.meta', 'utf8')); } catch { return {}; } };
  const readData = async key => { try { return await fs.readFile(file(key)); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  return {
    async get(key, opts) { return decode(await readData(key), opts?.type); },
    async getWithMetadata(key, opts) { const d = await readData(key); return d == null ? null : { data: decode(d, opts?.type), metadata: await readMeta(key) }; },
    async set(key, data, opts) {
      await fs.writeFile(file(key), toBuffer(data));
      if (opts?.metadata) await fs.writeFile(file(key) + '.meta', JSON.stringify(opts.metadata));
    },
    async setJSON(key, value) { await fs.writeFile(file(key), JSON.stringify(value)); },
    async list({ prefix = '' } = {}) {
      const names = (await fs.readdir(root)).filter(n => !n.endsWith('.meta')).map(decodeURIComponent);
      return { blobs: names.filter(k => k.startsWith(prefix)).sort().map(key => ({ key })) };
    },
    async delete(key) { await fs.rm(file(key), { force: true }); await fs.rm(file(key) + '.meta', { force: true }); },
  };
}
