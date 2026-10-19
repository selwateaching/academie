// Pure logic for the language lab: validation, sentence splitting, grading.
// No I/O here, so it can be unit-tested with plain Node.

export const LEVELS = ['A1', 'A2', 'B1', 'B2'];
export const LIMITS = {
  textChars: 4000,
  title: 120,
  mcq: 10, tf: 10, gaps: 15, dictation: 5,
  optionChars: 200, questionChars: 300,
  name: 60, group: 40,
  audioBytes: 5 * 1024 * 1024,
  submissionsPerExercise: 1000,
};

const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/* ── Text helpers ─────────────────────────────────────────── */

// Removes "Speaker 1:" prefixes so dictation/gap sentences are plain English.
export function stripSpeakers(text) {
  return String(text).split('\n')
    .map(l => l.replace(/^\s*(?:speaker|orador)\s*[12]\s*:\s*/i, '').trim())
    .filter(Boolean).join('\n');
}

export function splitSentences(text) {
  const plain = stripSpeakers(text);
  const out = [];
  for (const line of plain.split('\n')) {
    const parts = line.match(/[^.!?]+(?:[.!?]+["'”’)]*|$)/g) || [];
    for (const p of parts) { const s = p.trim(); if (s) out.push(s); }
  }
  return out;
}

export function normalizeAnswer(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\p{L}\p{N}' -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeWords(s) {
  const n = normalizeAnswer(s).replace(/-/g, ' ');
  return n ? n.split(' ').map(w => w.replace(/^'+|'+$/g, '')).filter(Boolean) : [];
}

/* ── Gap building ─────────────────────────────────────────── */

// Turns {sentence, word} into {before, answer, after} using the first whole-word match.
export function buildGap(sentence, word) {
  const s = clip(sentence, 400), w = clip(word, 40);
  if (!s || !w) return null;
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(^|[^\\p{L}\\p{N}'])(${esc})(?=$|[^\\p{L}\\p{N}'])`, 'iu').exec(s);
  if (!m) return null;
  const start = m.index + m[1].length;
  return { before: s.slice(0, start), answer: s.slice(start, start + m[2].length), after: s.slice(start + m[2].length) };
}

/* ── Sanitize an exercise coming from the teacher ─────────── */

export function sanitizeExercise(input) {
  const e = input && typeof input === 'object' ? input : {};
  const text = String(e.text ?? '').slice(0, LIMITS.textChars).trim();
  if (!text) throw new Error('The exercise has no transcript.');
  const level = LEVELS.includes(e.level) ? e.level : null;

  const mcq = (Array.isArray(e.mcq) ? e.mcq : []).slice(0, LIMITS.mcq).map(q => {
    const options = (Array.isArray(q.options) ? q.options : []).map(o => clip(o, LIMITS.optionChars)).filter(Boolean).slice(0, 5);
    const answer = Number.isInteger(q.answer) ? q.answer : -1;
    const question = clip(q.q, LIMITS.questionChars);
    return question && options.length >= 2 && answer >= 0 && answer < options.length ? { q: question, options, answer } : null;
  }).filter(Boolean);

  const tf = (Array.isArray(e.tf) ? e.tf : []).slice(0, LIMITS.tf).map(t => {
    const s = clip(t.s, LIMITS.questionChars);
    return s && typeof t.answer === 'boolean' ? { s, answer: t.answer } : null;
  }).filter(Boolean);

  const gaps = (Array.isArray(e.gaps) ? e.gaps : []).slice(0, LIMITS.gaps).map(g => {
    const answer = clip(g.answer, 40);
    if (!answer) return null;
    const alts = (Array.isArray(g.alts) ? g.alts : []).map(a => clip(a, 40)).filter(Boolean).slice(0, 5);
    const keepSpaces = (x) => String(x ?? '').replace(/\s+/g, ' ').slice(0, 300);
    return { before: keepSpaces(g.before).trimStart(), answer, after: keepSpaces(g.after).trimEnd(), alts };
  }).filter(Boolean);
  // A gap sentence is shown to learners, so it cannot also be a dictation sentence.
  const gapSentences = new Set(gaps.map(g => normalizeAnswer(g.before + g.answer + g.after)));

  const dictation = (Array.isArray(e.dictation) ? e.dictation : []).slice(0, LIMITS.dictation)
    .map(d => clip(typeof d === 'string' ? d : d?.sentence, 300))
    .filter(s => tokenizeWords(s).length >= 2 && !gapSentences.has(normalizeAnswer(s)));

  if (!mcq.length && !tf.length && !gaps.length && !dictation.length) {
    throw new Error('Add at least one question.');
  }

  const s = e.settings || {};
  const settings = {
    maxPlays: Math.max(0, Math.min(10, parseInt(s.maxPlays, 10) || 0)),        // 0 = unlimited
    showTranscriptAfter: s.showTranscriptAfter !== false,
    allowSpeed: s.allowSpeed !== false,
    instructions: clip(s.instructions, 400),
  };

  return { title: clip(e.title, LIMITS.title) || 'Listening exercise', level, text, mcq, tf, gaps, dictation, settings };
}

// What the learner receives before answering: no answers, no transcript.
export function publicView(ex) {
  return {
    title: ex.title, level: ex.level, settings: ex.settings, hasAudio: !!ex.hasAudio,
    mcq: ex.mcq.map(q => ({ q: q.q, options: q.options })),
    tf: ex.tf.map(t => ({ s: t.s })),
    gaps: ex.gaps.map(g => ({ before: g.before, after: g.after, len: g.answer.length })),
    // Hint so the learner knows which sentence to write: its first two words + length.
    dictation: ex.dictation.map(s => ({ start: s.split(/\s+/).slice(0, 2).join(' '), words: tokenizeWords(s).length })),
    createdAt: ex.createdAt,
  };
}

/* ── Grading ──────────────────────────────────────────────── */

// Word-level alignment of a dictation answer against the reference sentence.
export function alignWords(refStr, hypStr) {
  const ref = tokenizeWords(refStr), hyp = tokenizeWords(hypStr);
  const n = ref.length, m = hyp.length;
  const d = Array.from({ length: n + 1 }, (_, i) => { const r = new Array(m + 1).fill(0); r[0] = i; return r; });
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
  }
  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)) {
      ops.push(ref[i - 1] === hyp[j - 1] ? { t: 'ok', w: ref[i - 1] } : { t: 'wrong', w: hyp[j - 1], expected: ref[i - 1] });
      i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ t: 'missing', expected: ref[i - 1] }); i--;
    } else {
      ops.push({ t: 'extra', w: hyp[j - 1] }); j--;
    }
  }
  ops.reverse();
  const errors = n ? d[n][m] : m;
  const score = n ? Math.max(0, 1 - errors / n) : 0;
  return { ops, score: Math.round(score * 100) / 100, errors };
}

export function grade(ex, answers) {
  const a = answers && typeof answers === 'object' ? answers : {};
  const sections = { mcq: [], tf: [], gaps: [], dictation: [] };
  let points = 0, max = 0;

  ex.mcq.forEach((q, i) => {
    const given = Number.isInteger(a.mcq?.[i]) ? a.mcq[i] : null;
    const ok = given === q.answer;
    sections.mcq.push({ given, correct: q.answer, ok });
    points += ok ? 1 : 0; max += 1;
  });

  ex.tf.forEach((t, i) => {
    const given = typeof a.tf?.[i] === 'boolean' ? a.tf[i] : null;
    const ok = given === t.answer;
    sections.tf.push({ given, correct: t.answer, ok });
    points += ok ? 1 : 0; max += 1;
  });

  ex.gaps.forEach((g, i) => {
    const given = clip(a.gaps?.[i], 60);
    const accepted = [g.answer, ...(g.alts || [])].map(normalizeAnswer);
    const ok = !!given && accepted.includes(normalizeAnswer(given));
    sections.gaps.push({ given, correct: g.answer, ok });
    points += ok ? 1 : 0; max += 1;
  });

  ex.dictation.forEach((sentence, i) => {
    const given = clip(a.dictation?.[i], 400);
    const r = alignWords(sentence, given);
    sections.dictation.push({ given, correct: sentence, score: r.score, ops: r.ops, ok: r.errors === 0 });
    points += r.score; max += 1;
  });

  points = Math.round(points * 100) / 100;
  return { points, max, percent: max ? Math.round((points / max) * 100) : 0, sections };
}
