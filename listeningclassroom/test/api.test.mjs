// End-to-end test: starts the real server (with Anthropic mocked) and runs the full teacher → learner → results flow.
// Usage: npm test            (local file storage)
//        DATABASE_URL=... npm test   (Postgres)

import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '../lib/lab-core.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = 3900 + Math.floor(Math.random() * 90);
const base = `http://127.0.0.1:${port}`;
const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-test-'));

/* ── unit tests (grading) ── */
assert.deepEqual(core.buildGap('Water falls back to Earth.', 'falls'), { before: 'Water ', answer: 'falls', after: ' back to Earth.' });
assert.equal(core.buildGap('Hello there', 'xyz'), null);
assert.deepEqual(core.splitSentences('Speaker 1: Hi! How are you?\nSpeaker 2: Fine. Thanks'), ['Hi!', 'How are you?', 'Fine.', 'Thanks']);
assert.equal(core.normalizeAnswer(' Don’t! '), "don't");
const a = core.alignWords('I am going to the park.', 'i am go to park');
assert.equal(a.errors, 2); assert.equal(a.score, 0.67);
assert.equal(core.alignWords('Hello world.', 'Hello, world').score, 1);

/* ── server ── */
const server = spawn(process.execPath, ['--import', path.join(here, 'mock-anthropic.mjs'), path.join(here, '..', 'server.mjs')], {
  env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, ANTHROPIC_API_KEY: 'test-key' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve, reject) => {
  server.stdout.on('data', d => { if (String(d).includes('ListeningClassroom on')) resolve(); });
  server.on('exit', c => reject(new Error('server exited ' + c)));
  setTimeout(() => reject(new Error('server start timeout')), 15000);
});

const call = async (method, p, body, headers = {}) => {
  const init = { method, headers: { origin: base, ...headers } };
  if (body instanceof Uint8Array) init.body = body;
  else if (body !== undefined) { init.body = JSON.stringify(body); init.headers['content-type'] = 'application/json'; }
  const r = await fetch(base + p, init);
  const ct = r.headers.get('content-type') || '';
  return { status: r.status, ct, data: ct.includes('json') ? await r.json() : await r.arrayBuffer() };
};

try {
  // Pages
  for (const p of ['/', '/generator/', '/lab/', '/privacy.html', '/kokoro-worker.js', '/encode-worker.js', '/vendor/kokoro/kokoro.web.js', '/vendor/lamejs/lame.min.js', '/favicon.svg', '/healthz']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
  }
  assert.equal((await fetch(base + '/nope')).status, 404);

  // Translation
  let r = await call('POST', '/api/adapt', { text: 'Bonjour, j’aime les pommes.', level: 'A1', sourceLang: 'fr' });
  assert.equal(r.status, 200); assert.equal(r.data.level, 'A1'); assert.ok(r.data.text.length > 0);
  r = await call('POST', '/api/adapt', { text: 'x', level: 'C2' }); assert.equal(r.status, 400);
  r = await call('POST', '/api/adapt', { text: 'x', level: 'A1' }, { origin: 'https://evil.example' }); assert.equal(r.status, 403);

  // Lab: draft → publish → audio → learner → results → delete
  const transcript = 'Speaker 1: Good morning! Where are you going today?\nSpeaker 2: I am going to the market to buy some fresh fruit.\nSpeaker 1: Can I come with you?';
  r = await call('POST', '/api/lab?action=draft', { text: transcript, level: 'A2' });
  assert.equal(r.status, 200); assert.equal(r.data.gaps.length, 1); assert.equal(r.data.gaps[0].answer, 'fresh');
  const d = r.data;

  r = await call('POST', '/api/lab?action=publish', { exercise: { title: 'At the market', level: 'A2', text: transcript, mcq: d.mcq, tf: d.tf, gaps: d.gaps,
    dictation: ['I am going to the market to buy some fresh fruit.', 'Where are you going today?'], settings: { maxPlays: 2 } } });
  assert.equal(r.status, 201);
  const { id, key } = r.data;

  const mp3 = new Uint8Array([0xff, 0xfb, 0x90, 0x00, 1, 2, 3]);
  r = await call('PUT', `/api/lab?action=audio&id=${id}`, mp3, { 'content-type': 'audio/mpeg', 'x-teacher-key': 'x'.repeat(28) }); assert.equal(r.status, 403);
  r = await call('PUT', `/api/lab?action=audio&id=${id}`, mp3, { 'content-type': 'audio/mpeg', 'x-teacher-key': key }); assert.equal(r.status, 200);
  r = await call('GET', `/api/lab?action=audio&id=${id}`); assert.equal(r.status, 200); assert.equal(r.ct, 'audio/mpeg'); assert.equal(r.data.byteLength, mp3.length);

  r = await call('GET', `/api/lab?action=get&id=${id}`);
  const pub = JSON.stringify(r.data);
  assert.ok(!pub.includes('"answer"') && !pub.includes('fresh') && !pub.includes('going today'), 'no answer leaks');
  assert.equal(r.data.dictation.length, 1); assert.equal(r.data.dictation[0].start, 'Where are');

  r = await call('POST', `/api/lab?action=submit&id=${id}`, { name: 'Amina', group: '3B', answers: { mcq: [1], tf: [false], gaps: ['Fresh'], dictation: ['where are you going to day'] }, plays: 2, seconds: 95 });
  assert.equal(r.status, 200); assert.equal(r.data.points, 3.6); assert.equal(r.data.percent, 90); assert.ok(r.data.transcript);
  r = await call('POST', `/api/lab?action=submit&id=${id}`, { name: '', answers: {} }); assert.equal(r.status, 400);
  r = await call('POST', `/api/lab?action=submit&id=${id}`, { name: 'Yanis', answers: {} }); assert.equal(r.data.percent, 0);

  r = await call('GET', `/api/lab?action=results&id=${id}`, undefined, { 'x-teacher-key': 'nope' }); assert.equal(r.status, 403);
  r = await call('GET', `/api/lab?action=results&id=${id}`, undefined, { 'x-teacher-key': key });
  assert.equal(r.status, 200); assert.equal(r.data.submissions.length, 2); assert.ok(!('keyHash' in r.data.exercise));
  assert.equal(r.data.exercise.submissions, 2);

  r = await call('POST', `/api/lab?action=delete&id=${id}`, undefined, { 'x-teacher-key': key }); assert.equal(r.status, 200);
  r = await call('GET', `/api/lab?action=get&id=${id}`); assert.equal(r.status, 404);
  r = await call('GET', `/api/lab?action=audio&id=${id}`); assert.equal(r.status, 404);

  console.log(`ALL TESTS PASSED (${process.env.DATABASE_URL ? 'Postgres' : 'file storage'})`);
} finally {
  server.kill();
  await fs.rm(dataDir, { recursive: true, force: true });
}
