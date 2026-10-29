/* Test de bout en bout : démarre le serveur sur une base Postgres (DATABASE_URL) et vérifie
   comptes, droits, isolation entre clients et enregistrement de la progression. */
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT = 3911, BASE = `http://127.0.0.1:${PORT}`;
if (!process.env.DATABASE_URL) { console.error('Définissez DATABASE_URL pour lancer les tests.'); process.exit(1); }

const srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT), ADMIN_EMAIL: 'formateur@test.dz', ADMIN_PASSWORD: 'admin-secret-1', ADMIN_NAME: 'Formateur' }, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', d => log += d); srv.stderr.on('data', d => log += d);
const stop = () => srv.kill();

class Agent {
  constructor() { this.cookie = ''; }
  async req(method, path, body, headers = {}) {
    const h = { 'X-Requested-With': 'fetch', ...headers };
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (this.cookie) h.Cookie = this.cookie;
    const r = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
    const sc = r.headers.get('set-cookie'); if (sc) { const m = sc.match(/sid=([^;]*)/); if (m) this.cookie = m[1] ? 'sid=' + m[1] : ''; }
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text };
  }
  get(p) { return this.req('GET', p); } post(p, b = {}) { return this.req('POST', p, b); } patch(p, b) { return this.req('PATCH', p, b); }
  async login(email, password) { return this.post('/api/login', { email, password }); }
}

let n = 0; const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

async function waitUp() { for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE + '/healthz'); if (r.ok) return; } catch {} await new Promise(r => setTimeout(r, 250)); } throw new Error('Le serveur ne démarre pas :\n' + log); }

try {
  await waitUp();
  /* Pages */
  for (const p of ['/connexion', '/mot-de-passe', '/formation', '/tableau-de-bord', '/js/course.js', '/js/app.js', '/css/course.css']) {
    const r = await fetch(BASE + p); ok(r.status === 200, 'page ' + p);
  }
  const anon = new Agent();
  ok((await anon.get('/api/me')).status === 401, 'anonyme refusé');

  /* Administrateur */
  const admin = new Agent();
  ok((await admin.login('formateur@test.dz', 'mauvais')).status === 401, 'mauvais mot de passe refusé');
  let r = await admin.login('FORMATEUR@test.dz', 'admin-secret-1'); ok(r.status === 200 && r.json.user.role === 'admin', 'connexion admin');
  ok((await admin.req('POST', '/api/admin/orgs', { name: 'X' }, { 'X-Requested-With': '' })).status === 403, 'protection CSRF');

  r = await admin.post('/api/admin/orgs', { name: 'Station Fouka', manager_name: 'Karim', manager_email: 'karim@fouka.dz' });
  ok(r.status === 200 && r.json.credentials.password.length === 10, 'client A créé');
  const orgA = r.json.org.id, karimPw = r.json.credentials.password;
  r = await admin.post('/api/admin/orgs', { name: 'Centre Oran', manager_name: 'Nadia', manager_email: 'nadia@oran.dz' });
  const orgB = r.json.org.id, nadiaPw = r.json.credentials.password;
  ok((await admin.post('/api/admin/orgs', { name: 'Doublon', manager_name: 'X', manager_email: 'karim@fouka.dz' })).status === 409, 'e-mail en double refusé');

  /* Responsable A : mot de passe provisoire obligatoire à changer */
  const karim = new Agent();
  r = await karim.login('karim@fouka.dz', karimPw); ok(r.json.user.must_change === true, 'mot de passe provisoire signalé');
  ok((await karim.get('/api/orgs/' + orgA)).status === 403, 'accès bloqué avant changement');
  ok((await karim.post('/api/password', { current: karimPw, new: 'court' })).status === 400, 'mot de passe trop court refusé');
  ok((await karim.post('/api/password', { current: karimPw, new: 'karim-nouveau-1' })).status === 200, 'mot de passe changé');
  ok((await karim.get('/api/orgs/' + orgA)).status === 200, 'responsable voit son client');
  ok((await karim.get('/api/orgs/' + orgB)).status === 403, 'responsable ne voit pas un autre client');
  ok((await karim.get('/api/admin/orgs')).status === 403, 'responsable sans accès admin');
  ok((await karim.post(`/api/orgs/${orgA}/managers`, { name: 'Y', email: 'y@y.dz' })).status === 403, 'responsable ne crée pas de responsable');
  ok((await karim.post(`/api/orgs/${orgB}/learners`, { name: 'Intrus', email: 'intrus@x.dz' })).status === 403, 'pas d\'apprenant chez un autre client');

  r = await karim.post(`/api/orgs/${orgA}/learners`, { name: 'Amina B.', email: 'amina@fouka.dz' });
  ok(r.status === 200, 'apprenant créé'); const aminaId = r.json.user.id, aminaPw = r.json.credentials.password;

  /* Apprenante */
  const amina = new Agent();
  await amina.login('amina@fouka.dz', aminaPw);
  ok((await amina.post('/api/progress', { lesson: 'osmose', type: 'scene', index: 0, total: 7 })).status === 403, 'progression bloquée avant changement de mot de passe');
  await amina.post('/api/password', { current: aminaPw, new: 'amina-secret-9' });
  ok((await amina.get('/api/orgs/' + orgA)).status === 403, 'apprenante sans accès au tableau de bord');
  ok((await amina.post('/api/progress', { lesson: 'inconnue', type: 'scene', index: 0, total: 3 })).status === 400, 'leçon inconnue refusée');
  ok((await amina.post('/api/progress', { lesson: 'osmose', type: 'scene', index: 9, total: 7 })).status === 400, 'scène hors limites refusée');
  for (const i of [0, 1, 1, 2]) await amina.post('/api/progress', { lesson: 'osmose', type: 'scene', index: i, total: 7 });
  r = await amina.post('/api/progress', { lesson: 'osmose', type: 'quiz', score: 3, total: 5, missed: [1, 4], mastered: false });
  ok(r.json.progress.quiz_first_score === 3 && r.json.progress.completed_at === null, 'premier essai enregistré');
  r = await amina.post('/api/progress', { lesson: 'osmose', type: 'quiz', score: 5, total: 5, missed: [], mastered: true });
  const p = r.json.progress;
  ok(p.quiz_first_score === 3 && p.quiz_attempts === 2 && p.completed_at && p.quiz_missed.join() === '1,4', 'premier score conservé, leçon terminée');
  ok(p.scenes_seen.sort().join() === '0,1,2' && p.scene_total === 7, 'scènes vues sans doublon');
  await amina.post('/api/progress', { lesson: 'osmose', type: 'time', seconds: 60 });
  r = await amina.get('/api/progress'); ok(r.json.progress.length === 1 && r.json.progress[0].time_sec === 60, 'temps enregistré');

  /* Le responsable voit la progression, l'autre client non */
  r = await karim.get('/api/orgs/' + orgA);
  ok(r.json.progress.some(x => x.user_id === aminaId && x.lesson_id === 'osmose'), 'responsable voit la progression');
  const csv = await karim.get(`/api/orgs/${orgA}/export.csv`); ok(csv.status === 200 && csv.text.includes('Amina B.') && csv.text.includes('3/5'), 'export CSV');
  const nadia = new Agent(); await nadia.login('nadia@oran.dz', nadiaPw); await nadia.post('/api/password', { current: nadiaPw, new: 'nadia-secret-2' });
  ok((await nadia.post(`/api/users/${aminaId}/reset`)).status === 404, 'réinitialisation impossible depuis un autre client');
  ok((await nadia.get(`/api/orgs/${orgA}/export.csv`)).status === 403, 'export d\'un autre client refusé');

  /* Réinitialisation : l'ancienne session tombe */
  r = await karim.post(`/api/users/${aminaId}/reset`); ok(r.status === 200, 'mot de passe réinitialisé');
  ok((await amina.get('/api/me')).status === 401, 'ancienne session fermée');
  ok((await new Agent().login('amina@fouka.dz', 'amina-secret-9')).status === 401, 'ancien mot de passe refusé');

  /* Désactivations */
  ok((await karim.patch(`/api/users/${aminaId}`, { active: false })).status === 200, 'apprenante désactivée');
  ok((await new Agent().login('amina@fouka.dz', r.json.credentials.password)).status === 403, 'compte désactivé bloqué');
  ok((await admin.patch('/api/admin/orgs/' + orgB, { active: false })).status === 200, 'client B désactivé');
  ok((await nadia.get('/api/me')).status === 401, 'sessions du client B fermées');
  ok((await new Agent().login('nadia@oran.dz', 'nadia-secret-2')).status === 403, 'connexion client désactivé bloquée');
  r = await admin.get('/api/admin/orgs'); ok(r.json.orgs.length === 2 && r.json.orgs.find(o => o.id === orgA).completed === 1, 'liste des clients');

  /* Limitation des tentatives */
  const brute = new Agent(); let last;
  for (let i = 0; i < 11; i++) last = await brute.login('karim@fouka.dz', 'faux' + i);
  ok(last.status === 429, 'trop de tentatives bloquées');

  console.log(`OK : ${n} vérifications réussies.`);
  stop(); process.exit(0);
} catch (e) {
  console.error('ÉCHEC :', e.message, '\n--- journal serveur ---\n' + log);
  stop(); process.exit(1);
}
