'use strict';
/*
 * Formation dessalement : serveur de la plateforme.
 * Rôles : admin (le formateur), manager (responsable d'un client), learner (apprenant).
 * Données : PostgreSQL (DATABASE_URL). Sessions par cookie httpOnly.
 */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquante : ajoutez l\'URL interne de la base Postgres dans les variables d\'environnement.');
  process.exit(1);
}
/* L'URL interne de Render (hôte sans point, ex. dpg-xxxx-a) se passe de SSL ; l'URL externe l'exige. */
function needsSsl(url) {
  if (process.env.PGSSL === 'off') return false;
  try { const h = new URL(url).hostname; return h.includes('.') && h !== '127.0.0.1'; } catch { return false; }
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false
});
const q = (text, params) => pool.query(text, params);

/* Leçons connues : l'identifiant doit être dans cette liste. */
const LESSONS = ['bases', 'contexte', 'eau-de-mer', 'osmose', 'pretraitement', 'entartrage'];

/* ------------------------------------------------------------ Base de données */
async function migrate() {
  await q(`
    CREATE TABLE IF NOT EXISTS orgs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      org_id INTEGER REFERENCES orgs(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('admin','manager','learner')),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      must_change BOOLEAN NOT NULL DEFAULT TRUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_login TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS progress (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL,
      scenes_seen INTEGER[] NOT NULL DEFAULT '{}',
      scene_total INTEGER NOT NULL DEFAULT 0,
      quiz_first_score INTEGER,
      quiz_total INTEGER,
      quiz_missed INTEGER[] NOT NULL DEFAULT '{}',
      quiz_attempts INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ,
      time_sec INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, lesson_id)
    );
    CREATE INDEX IF NOT EXISTS users_org_idx ON users(org_id);
  `);
}

async function bootstrapAdmin() {
  const { rows } = await q(`SELECT 1 FROM users WHERE role='admin' LIMIT 1`);
  if (rows.length) return;
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const pass = process.env.ADMIN_PASSWORD || '';
  if (!email || pass.length < 8) {
    console.warn('Aucun compte administrateur : définissez ADMIN_EMAIL et ADMIN_PASSWORD (8 caractères minimum), puis redémarrez.');
    return;
  }
  await q(`INSERT INTO users (role,name,email,password_hash,must_change) VALUES ('admin',$1,$2,$3,FALSE)`,
    [process.env.ADMIN_NAME || 'Administrateur', email, await bcrypt.hash(pass, 10)]);
  console.log('Compte administrateur créé pour ' + email);
}

/* ------------------------------------------------------------ Outils */
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const ALPH = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
function tempPassword() { const b = crypto.randomBytes(10); let s = ''; for (const x of b) s += ALPH[x % ALPH.length]; return s; }
const isEmail = e => typeof e === 'string' && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const clean = (s, max = 120) => (typeof s === 'string' ? s.trim().slice(0, max) : '');
function parseCookies(h) { const o = {}; (h || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
const userView = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, org_id: u.org_id, org_name: u.org_name || null, must_change: u.must_change });

/* Limite les tentatives de connexion : 10 par quart d'heure et par adresse IP. */
const attempts = new Map();
function tooMany(key) {
  const now = Date.now(), win = 15 * 60 * 1000;
  const a = (attempts.get(key) || []).filter(t => now - t < win);
  attempts.set(key, a);
  return a.length >= 10;
}
function noteAttempt(key) { const a = attempts.get(key) || []; a.push(Date.now()); attempts.set(key, a); }

/* ------------------------------------------------------------ Application */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'DENY');
  next();
});

/* Les requêtes qui modifient des données doivent venir de nos pages (protection CSRF). */
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ error: 'Requête refusée.' });
  next();
});

async function loadSession(req, res, next) {
  const tok = parseCookies(req.headers.cookie).sid;
  req.user = null;
  if (tok) {
    const { rows } = await q(`SELECT u.*, o.name AS org_name, o.active AS org_active FROM sessions s
      JOIN users u ON u.id=s.user_id LEFT JOIN orgs o ON o.id=u.org_id
      WHERE s.token_hash=$1 AND s.expires_at>now()`, [sha(tok)]);
    const u = rows[0];
    if (u && u.active && (u.role === 'admin' || u.org_active)) req.user = u;
  }
  next();
}
app.use('/api', (req, res, next) => loadSession(req, res, next).catch(next));

const need = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Connexion requise.' });
  if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé.' });
  const p = req.path.replace(/^\/api/, '');
  if (req.user.must_change && !['/password', '/me', '/logout'].includes(p))
    return res.status(403).json({ error: 'Changez d\'abord votre mot de passe provisoire.', must_change: true });
  next();
};
const canOrg = (u, orgId) => u.role === 'admin' || (u.role === 'manager' && u.org_id === orgId);
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

function setSession(res, token) {
  res.set('Set-Cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${PROD ? '; Secure' : ''}`);
}

/* ---------- Connexion */
app.post('/api/login', wrap(async (req, res) => {
  const email = clean(req.body.email, 200).toLowerCase(), pass = typeof req.body.password === 'string' ? req.body.password : '';
  const key = req.ip;
  if (tooMany(key)) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
  const { rows } = await q(`SELECT u.*, o.active AS org_active FROM users u LEFT JOIN orgs o ON o.id=u.org_id WHERE u.email=$1`, [email]);
  const u = rows[0];
  const ok = u && await bcrypt.compare(pass, u.password_hash);
  if (!ok) { noteAttempt(key); return res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' }); }
  if (!u.active || (u.role !== 'admin' && !u.org_active)) return res.status(403).json({ error: 'Ce compte est désactivé. Contactez votre responsable de formation.' });
  const token = crypto.randomBytes(32).toString('hex');
  await q(`INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '30 days')`, [sha(token), u.id]);
  await q(`UPDATE users SET last_login=now() WHERE id=$1`, [u.id]);
  await q(`DELETE FROM sessions WHERE expires_at<now()`);
  setSession(res, token);
  res.json({ user: userView(u) });
}));

app.post('/api/logout', wrap(async (req, res) => {
  const tok = parseCookies(req.headers.cookie).sid;
  if (tok) await q(`DELETE FROM sessions WHERE token_hash=$1`, [sha(tok)]);
  res.set('Set-Cookie', 'sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
}));

app.get('/api/me', need(), (req, res) => res.json({ user: userView(req.user) }));

app.post('/api/password', need(), wrap(async (req, res) => {
  const cur = req.body.current || '', nw = req.body.new || '';
  if (typeof nw !== 'string' || nw.length < 8 || nw.length > 200) return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
  if (!await bcrypt.compare(String(cur), req.user.password_hash)) return res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
  if (await bcrypt.compare(nw, req.user.password_hash)) return res.status(400).json({ error: 'Choisissez un mot de passe différent de l\'actuel.' });
  await q(`UPDATE users SET password_hash=$1, must_change=FALSE WHERE id=$2`, [await bcrypt.hash(nw, 10), req.user.id]);
  const tok = parseCookies(req.headers.cookie).sid;
  await q(`DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2`, [req.user.id, sha(tok || '')]);
  res.json({ ok: true });
}));

/* ---------- Progression de l'apprenant */
const progCols = `lesson_id, scenes_seen, scene_total, quiz_first_score, quiz_total, quiz_missed, quiz_attempts, completed_at, time_sec, started_at, updated_at`;
app.get('/api/progress', need('learner', 'manager', 'admin'), wrap(async (req, res) => {
  const { rows } = await q(`SELECT ${progCols} FROM progress WHERE user_id=$1`, [req.user.id]);
  res.json({ progress: rows });
}));

app.post('/api/progress', need('learner', 'manager', 'admin'), wrap(async (req, res) => {
  const b = req.body || {}, lesson = b.lesson;
  if (!LESSONS.includes(lesson)) return res.status(400).json({ error: 'Leçon inconnue.' });
  const int = (v, max) => Number.isInteger(v) && v >= 0 && v <= max ? v : null;
  await q(`INSERT INTO progress (user_id, lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.user.id, lesson]);
  if (b.type === 'scene') {
    const i = int(b.index, 50), t = int(b.total, 50);
    if (i === null || t === null || i >= t) return res.status(400).json({ error: 'Scène invalide.' });
    await q(`UPDATE progress SET scenes_seen = CASE WHEN $3 = ANY(scenes_seen) THEN scenes_seen ELSE array_append(scenes_seen,$3) END,
      scene_total=$4, updated_at=now() WHERE user_id=$1 AND lesson_id=$2`, [req.user.id, lesson, i, t]);
  } else if (b.type === 'quiz') {
    const score = int(b.score, 50), total = int(b.total, 50);
    const missed = Array.isArray(b.missed) ? b.missed.filter(x => Number.isInteger(x) && x >= 0 && x < 50).slice(0, 50) : [];
    if (score === null || !total || score > total) return res.status(400).json({ error: 'Score invalide.' });
    /* Le premier essai complet est gardé ; les suivants ne font qu'augmenter le compteur. */
    await q(`UPDATE progress SET quiz_attempts = quiz_attempts + 1,
      quiz_first_score = COALESCE(quiz_first_score, $3), quiz_total = COALESCE(quiz_total, $4),
      quiz_missed = CASE WHEN quiz_first_score IS NULL THEN $5::int[] ELSE quiz_missed END,
      completed_at = CASE WHEN $6 AND completed_at IS NULL THEN now() ELSE completed_at END,
      updated_at=now() WHERE user_id=$1 AND lesson_id=$2`, [req.user.id, lesson, score, total, missed, b.mastered === true]);
  } else if (b.type === 'time') {
    const s = int(b.seconds, 120);
    if (s === null) return res.status(400).json({ error: 'Durée invalide.' });
    await q(`UPDATE progress SET time_sec = time_sec + $3, updated_at=now() WHERE user_id=$1 AND lesson_id=$2`, [req.user.id, lesson, s]);
  } else return res.status(400).json({ error: 'Évènement inconnu.' });
  const { rows } = await q(`SELECT ${progCols} FROM progress WHERE user_id=$1 AND lesson_id=$2`, [req.user.id, lesson]);
  res.json({ progress: rows[0] });
}));

/* ---------- Administration : clients */
app.get('/api/admin/orgs', need('admin'), wrap(async (req, res) => {
  const { rows } = await q(`SELECT o.id, o.name, o.active, o.created_at,
      (SELECT count(*) FROM users u WHERE u.org_id=o.id AND u.role='learner')::int AS learners,
      (SELECT count(*) FROM users u WHERE u.org_id=o.id AND u.role='manager')::int AS managers,
      (SELECT count(*) FROM progress p JOIN users u ON u.id=p.user_id WHERE u.org_id=o.id AND u.role='learner' AND p.completed_at IS NOT NULL)::int AS completed,
      (SELECT max(p.updated_at) FROM progress p JOIN users u ON u.id=p.user_id WHERE u.org_id=o.id) AS last_activity
    FROM orgs o ORDER BY o.created_at DESC`);
  res.json({ orgs: rows, lessons: LESSONS.length });
}));

app.post('/api/admin/orgs', need('admin'), wrap(async (req, res) => {
  const name = clean(req.body.name), mname = clean(req.body.manager_name), memail = clean(req.body.manager_email, 200).toLowerCase();
  if (!name) return res.status(400).json({ error: 'Indiquez le nom du client.' });
  if (!mname || !isEmail(memail)) return res.status(400).json({ error: 'Indiquez le nom et un e-mail valide pour le responsable.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dup = await client.query(`SELECT 1 FROM users WHERE email=$1`, [memail]);
    if (dup.rows.length) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Cet e-mail est déjà utilisé.' }); }
    const o = await client.query(`INSERT INTO orgs (name) VALUES ($1) RETURNING id, name, active, created_at`, [name]);
    const pw = tempPassword();
    await client.query(`INSERT INTO users (org_id,role,name,email,password_hash) VALUES ($1,'manager',$2,$3,$4)`, [o.rows[0].id, mname, memail, await bcrypt.hash(pw, 10)]);
    await client.query('COMMIT');
    res.json({ org: o.rows[0], credentials: { name: mname, email: memail, password: pw } });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));

app.patch('/api/admin/orgs/:id', need('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id), sets = [], vals = [id];
  if (typeof req.body.active === 'boolean') { vals.push(req.body.active); sets.push(`active=$${vals.length}`); }
  if (clean(req.body.name)) { vals.push(clean(req.body.name)); sets.push(`name=$${vals.length}`); }
  if (!sets.length) return res.status(400).json({ error: 'Rien à modifier.' });
  const { rows } = await q(`UPDATE orgs SET ${sets.join(',')} WHERE id=$1 RETURNING id,name,active`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Client introuvable.' });
  if (req.body.active === false) await q(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE org_id=$1)`, [id]);
  res.json({ org: rows[0] });
}));

/* ---------- Un client : ses responsables et apprenants */
app.get('/api/orgs/:id', need('admin', 'manager'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!canOrg(req.user, id)) return res.status(403).json({ error: 'Accès refusé.' });
  const o = await q(`SELECT id,name,active,created_at FROM orgs WHERE id=$1`, [id]);
  if (!o.rows.length) return res.status(404).json({ error: 'Client introuvable.' });
  const users = await q(`SELECT id,role,name,email,active,must_change,created_at,last_login FROM users WHERE org_id=$1 ORDER BY role, name`, [id]);
  const prog = await q(`SELECT p.user_id, ${progCols} FROM progress p JOIN users u ON u.id=p.user_id WHERE u.org_id=$1`, [id]);
  res.json({ org: o.rows[0], users: users.rows, progress: prog.rows, lessons: LESSONS });
}));

async function addUser(req, res, role) {
  const id = Number(req.params.id);
  if (!canOrg(req.user, id)) return res.status(403).json({ error: 'Accès refusé.' });
  const name = clean(req.body.name), email = clean(req.body.email, 200).toLowerCase();
  if (!name || !isEmail(email)) return res.status(400).json({ error: 'Indiquez un nom et un e-mail valide.' });
  const o = await q(`SELECT id FROM orgs WHERE id=$1`, [id]);
  if (!o.rows.length) return res.status(404).json({ error: 'Client introuvable.' });
  const pw = tempPassword();
  try {
    const { rows } = await q(`INSERT INTO users (org_id,role,name,email,password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id,role,name,email,active,must_change,created_at,last_login`,
      [id, role, name, email, await bcrypt.hash(pw, 10)]);
    res.json({ user: rows[0], credentials: { name, email, password: pw } });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Cet e-mail est déjà utilisé.' });
    throw e;
  }
}
app.post('/api/orgs/:id/learners', need('admin', 'manager'), wrap((req, res) => addUser(req, res, 'learner')));
app.post('/api/orgs/:id/managers', need('admin'), wrap((req, res) => addUser(req, res, 'manager')));

async function targetUser(req, res) {
  const { rows } = await q(`SELECT id, org_id, role, name, email FROM users WHERE id=$1`, [Number(req.params.uid)]);
  const t = rows[0];
  if (!t || t.role === 'admin' || !canOrg(req.user, t.org_id)) { res.status(404).json({ error: 'Utilisateur introuvable.' }); return null; }
  if (req.user.role === 'manager' && t.role !== 'learner') { res.status(403).json({ error: 'Seul l\'administrateur peut modifier un responsable.' }); return null; }
  return t;
}
app.post('/api/users/:uid/reset', need('admin', 'manager'), wrap(async (req, res) => {
  const t = await targetUser(req, res); if (!t) return;
  const pw = tempPassword();
  await q(`UPDATE users SET password_hash=$1, must_change=TRUE WHERE id=$2`, [await bcrypt.hash(pw, 10), t.id]);
  await q(`DELETE FROM sessions WHERE user_id=$1`, [t.id]);
  res.json({ credentials: { name: t.name, email: t.email, password: pw } });
}));
app.patch('/api/users/:uid', need('admin', 'manager'), wrap(async (req, res) => {
  const t = await targetUser(req, res); if (!t) return;
  if (typeof req.body.active !== 'boolean') return res.status(400).json({ error: 'Rien à modifier.' });
  await q(`UPDATE users SET active=$1 WHERE id=$2`, [req.body.active, t.id]);
  if (!req.body.active) await q(`DELETE FROM sessions WHERE user_id=$1`, [t.id]);
  res.json({ ok: true });
}));

/* ---------- Export CSV d'un client */
app.get('/api/orgs/:id/export.csv', need('admin', 'manager'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!canOrg(req.user, id)) return res.status(403).json({ error: 'Accès refusé.' });
  const users = await q(`SELECT id,name,email,active,last_login FROM users WHERE org_id=$1 AND role='learner' ORDER BY name`, [id]);
  const prog = await q(`SELECT p.* FROM progress p JOIN users u ON u.id=p.user_id WHERE u.org_id=$1`, [id]);
  const by = {}; prog.rows.forEach(p => { (by[p.user_id] = by[p.user_id] || {})[p.lesson_id] = p; });
  const esc = v => { const s = v === null || v === undefined ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const head = ['Nom', 'E-mail', 'Actif', 'Dernière connexion', 'Leçons terminées'];
  LESSONS.forEach(l => head.push(`${l} : vidéo`, `${l} : quiz 1er essai`, `${l} : terminée le`));
  const lines = [head.map(esc).join(';')];
  for (const u of users.rows) {
    const p = by[u.id] || {};
    const row = [u.name, u.email, u.active ? 'oui' : 'non', u.last_login ? new Date(u.last_login).toISOString().slice(0, 10) : '', LESSONS.filter(l => p[l] && p[l].completed_at).length + '/' + LESSONS.length];
    LESSONS.forEach(l => { const x = p[l];
      row.push(x && x.scene_total ? `${x.scenes_seen.length}/${x.scene_total}` : '', x && x.quiz_first_score !== null ? `${x.quiz_first_score}/${x.quiz_total}` : '', x && x.completed_at ? new Date(x.completed_at).toISOString().slice(0, 10) : ''); });
    lines.push(row.map(esc).join(';'));
  }
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="suivi-client-${id}.csv"`);
  res.send('﻿' + lines.join('\r\n'));
}));

/* ------------------------------------------------------------ Pages */
app.get('/healthz', (req, res) => res.send('ok'));
const pub = path.join(__dirname, 'public');
const page = f => (req, res) => res.sendFile(path.join(pub, f));
app.get('/', page('index.html'));
app.get('/connexion', page('login.html'));
app.get('/mot-de-passe', page('password.html'));
app.get('/formation', page('app.html'));
app.get('/tableau-de-bord', page('dashboard.html'));
app.use(express.static(pub, { index: false, maxAge: PROD ? '1h' : 0 }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Introuvable.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Erreur du serveur. Réessayez dans un instant.' }); });

if (require.main === module) {
  migrate().then(bootstrapAdmin).then(() => app.listen(PORT, () => console.log('Formation dessalement en ligne sur le port ' + PORT)))
    .catch(e => { console.error('Démarrage impossible :', e.message); process.exit(1); });
}
module.exports = { app, migrate, bootstrapAdmin, pool };
