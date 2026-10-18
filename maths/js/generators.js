/* Générateurs de questions : contenu original, tirage aléatoire.
 * Chaque générateur renvoie :
 *   { q, expr?, vis?, kind: 'num' | 'choice', ans, choices?: [{v,label}], exp }
 * Tous les textes passent par t() (voir lang/fr.js), pour pouvoir traduire.
 */
(function (root) {
  'use strict';

  const STR = () => root.STRINGS || {};
  function t(k, v) {
    const s = STR()[k];
    if (s === undefined) return '[[' + k + ']]';
    if (typeof s !== 'string') return s;
    return s.replace(/\{(\w+)\}/g, (_, n) => (v && v[n] !== undefined ? v[n] : ''));
  }

  /* ---------- outils ---------- */
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[R(0, a.length - 1)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const round = (x, k = 6) => Number(x.toFixed(k));
  const fmt = (x) => String(x).replace(/-/g, '−').replace('.', ',');
  const fmtBig = (x) => {
    const [i, d] = String(x).split('.');
    const g = i.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (i[0] === '-' ? '−' : '') + g + (d ? ',' + d : '');
  };
  const m = (s) => `<span class="m">${s}</span>`;
  const frac = (n, d) => `<span class="frac"><span>${fmt(n)}</span><span>${fmt(d)}</span></span>`;
  const box = '<span class="box">?</span>';
  const sup = (d) => (d === 1 ? '' : `<sup>${d}</sup>`);
  const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  function numChoices(correct, spread = 3, lo = -Infinity) {
    const set = new Set([correct]);
    let guard = 0;
    while (set.size < 4 && guard++ < 300) {
      const c = round(correct + R(-spread, spread));
      if (c >= lo) set.add(c);
    }
    return shuf([...set]).map((v) => ({ v, label: m(fmt(v)) }));
  }
  function valChoices(correct, wrongs, labelf) {
    const seen = new Set([String(correct)]);
    const out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  }
  const symChoices = () => ['<', '=', '>'].map((s) => ({ v: s, label: m(s) }));
  const yesNo = () => [{ v: 'y', label: t('yes') }, { v: 'n', label: t('no') }];
  const fracLabel = (s) => frac(...s.split('/'));

  /* ---------- schémas SVG ---------- */
  const COL = '#2563eb';
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;
  function bar(x, y, w, h, d, n, col = COL) {
    let s = '';
    const cw = w / d;
    for (let i = 0; i < d; i++) s += `<rect x="${x + i * cw}" y="${y}" width="${cw}" height="${h}" fill="${i < n ? col : '#fff'}" stroke="#1e293b" stroke-width="1.5"/>`;
    return s;
  }
  function pie(cx, cy, r, d, n, col = COL) {
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#1e293b" stroke-width="1.5"/>`;
    for (let i = 0; i < d; i++) {
      const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const path = `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`;
      s += `<path d="${path}" fill="${i < n ? col : 'none'}" stroke="#1e293b" stroke-width="1.5"/>`;
    }
    return s;
  }
  const regular = (n, cx, cy, r, fill, stroke) => `<polygon points="${[...Array(n)].map((_, i) => (cx + r * Math.sin((i * 2 * Math.PI) / n)).toFixed(1) + ',' + (cy - r * Math.cos((i * 2 * Math.PI) / n)).toFixed(1)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;

  /* ---------- données ---------- */
  const EMO = ['🍎', '⭐', '🐟', '🚗', '🌸', '🎈', '🐥', '⚽', '🍓', '🦋'];
  const SHAPES = {
    circle: () => '<circle cx="60" cy="60" r="45" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="3"/>',
    square: () => '<rect x="20" y="20" width="80" height="80" fill="#fde68a" stroke="#92400e" stroke-width="3"/>',
    rect: () => '<rect x="8" y="30" width="104" height="60" fill="#bbf7d0" stroke="#166534" stroke-width="3"/>',
    tri: () => '<polygon points="60,10 110,100 10,100" fill="#fecaca" stroke="#991b1b" stroke-width="3"/>',
    penta: () => regular(5, 60, 62, 48, '#ddd6fe', '#5b21b6'),
    hexa: () => regular(6, 60, 60, 48, '#fbcfe8', '#9d174d'),
    octa: () => regular(8, 60, 60, 48, '#fed7aa', '#9a3412'),
  };
  const SIDES = { tri: 3, square: 4, rect: 4, penta: 5, hexa: 6, octa: 8 };
  const SOLIDS = {
    cube: () => '<polygon points="25,45 85,45 85,105 25,105" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="2.5"/><polygon points="25,45 50,25 110,25 85,45" fill="#dbeafe" stroke="#1e3a8a" stroke-width="2.5"/><polygon points="85,45 110,25 110,85 85,105" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2.5"/>',
    pave: () => '<polygon points="10,55 85,55 85,105 10,105" fill="#bbf7d0" stroke="#166534" stroke-width="2.5"/><polygon points="10,55 35,35 110,35 85,55" fill="#dcfce7" stroke="#166534" stroke-width="2.5"/><polygon points="85,55 110,35 110,85 85,105" fill="#86efac" stroke="#166534" stroke-width="2.5"/>',
    cylinder: () => '<path d="M30,35 L30,95 A30,12 0 0 0 90,95 L90,35" fill="#fde68a" stroke="#92400e" stroke-width="2.5"/><ellipse cx="60" cy="35" rx="30" ry="12" fill="#fef3c7" stroke="#92400e" stroke-width="2.5"/>',
    sphere: () => '<circle cx="60" cy="62" r="45" fill="#fecaca" stroke="#991b1b" stroke-width="2.5"/><ellipse cx="45" cy="44" rx="12" ry="8" fill="#fff" opacity=".6"/>',
    cone: () => '<path d="M60,12 L90,92 A30,12 0 0 1 30,92 Z" fill="#ddd6fe" stroke="#5b21b6" stroke-width="2.5"/>',
    pyramid: () => '<polygon points="60,12 105,92 20,92" fill="#fed7aa" stroke="#9a3412" stroke-width="2.5"/><polygon points="60,12 105,92 85,105" fill="#fdba74" stroke="#9a3412" stroke-width="2.5"/><polygon points="20,92 105,92 85,105 40,105" fill="#ffedd5" stroke="#9a3412" stroke-width="2.5"/>',
  };

  const GEN = {};

  /* ===== Premiers nombres et figures ===== */
  GEN.count = (p) => {
    const n = R(p.min || 1, p.max), e = pick(EMO);
    return { q: t('count.q'), vis: `<div class="emojis">${Array(n).fill(e).join(' ')}</div>`, kind: 'choice', ans: n, choices: numChoices(n, 2, 0), exp: t('count.exp', { n: m(n) }) };
  };
  GEN.compareGroups = (p) => {
    let a = R(1, p.max), b = R(1, p.max); while (a === b) b = R(1, p.max);
    const [e1, e2] = shuf(EMO).slice(0, 2), more = pick([true, false]);
    const ans = more ? (a > b ? 1 : 2) : (a < b ? 1 : 2);
    return { q: t(more ? 'groups.more' : 'groups.less'), vis: `<div class="emojis">${Array(a).fill(e1).join(' ')}</div><div class="emojis">${Array(b).fill(e2).join(' ')}</div>`, kind: 'choice', ans, choices: [{ v: 1, label: t('groups.first') }, { v: 2, label: t('groups.second') }], exp: t('groups.exp', { a: m(a), b: m(b) }) };
  };
  GEN.patternNext = () => {
    const pt = pick([[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]]), es = shuf(EMO).slice(0, 3);
    const seq = []; for (let r = 0; r < 4; r++) pt.forEach((i) => seq.push(es[i]));
    const total = pt.length * 2 + R(1, pt.length);
    const ans = seq[total - 1];
    return { q: t('pattern.q'), vis: `<div class="emojis">${seq.slice(0, total - 1).join(' ')} ❓</div>`, kind: 'choice', ans, choices: shuf(es).map((e) => ({ v: e, label: `<span class="emo">${e}</span>` })), exp: t('pattern.exp') };
  };
  GEN.shapes = (p) => {
    const id = pick(p.set), ch = shuf(p.set).slice(0, 4);
    if (!ch.includes(id)) ch[0] = id;
    return { q: t('shapes.q'), vis: svg(120, 120, SHAPES[id]()), kind: 'choice', ans: id, choices: shuf(ch).map((v) => ({ v, label: t('shapeName.' + v) })), exp: t('shapes.exp', { name: t('shape.' + id) }) };
  };
  GEN.sides = (p) => {
    const id = pick(p.set || Object.keys(SIDES));
    return { q: t('sides.q'), vis: svg(120, 120, SHAPES[id]()), kind: 'num', ans: SIDES[id], exp: t('sides.exp', { n: m(SIDES[id]) }) };
  };
  GEN.symmetry = () => {
    const f = pick([['square', 4, () => SHAPES.square()], ['rect', 2, () => SHAPES.rect()], ['tri3', 3, () => regular(3, 60, 68, 52, '#fecaca', '#991b1b')], ['penta', 5, () => SHAPES.penta()], ['hexa', 6, () => SHAPES.hexa()]]);
    return { q: t('sym.q'), vis: svg(120, 120, f[2]()), kind: 'num', ans: f[1], exp: t('sym.exp', { n: m(f[1]) }) };
  };
  GEN.solids = (p) => {
    const id = pick(p.set), ch = shuf(p.set).slice(0, 4);
    if (!ch.includes(id)) ch[0] = id;
    return { q: t('solid.q'), vis: svg(120, 120, SOLIDS[id]()), kind: 'choice', ans: id, choices: shuf(ch).map((v) => ({ v, label: t('solidName.' + v) })), exp: t('solid.exp', { name: t('solid.' + id) }) };
  };
  GEN.solidFaces = () => {
    const S = [[0, 6, 12, 8], [1, 6, 12, 8], [2, 5, 8, 5], [3, 5, 9, 6]], s = pick(S), part = pick(['f', 'e', 'v']), idx = { f: 1, e: 2, v: 3 }[part];
    return { q: t('faces.q', { part: t('faces.' + part), solid: t('faces.s' + s[0]) }), kind: 'num', ans: s[idx], exp: t('faces.exp', { n: m(s[idx]), what: t('faces.w' + part) }) };
  };
  GEN.ruler = (p) => {
    const max = p.max || 10, n = R(p.min || 2, max);
    let s = `<rect x="10" y="62" width="${max * 28 + 20}" height="34" fill="#fef9c3" stroke="#a16207" stroke-width="2"/>`;
    for (let i = 0; i <= max; i++) s += `<line x1="${20 + i * 28}" y1="62" x2="${20 + i * 28}" y2="${i % 5 === 0 ? 82 : 76}" stroke="#a16207" stroke-width="2"/>` + txt(20 + i * 28, 92, i, { s: 11 });
    s += `<rect x="20" y="30" width="${n * 28}" height="20" rx="4" fill="#fb923c" stroke="#9a3412" stroke-width="2"/>`;
    return { q: t('ruler.q'), vis: svg(max * 28 + 40, 105, s), kind: 'num', ans: n, exp: t('ruler.exp', { n: m(n) }) };
  };
  GEN.thermo = () => {
    const T = R(1, 19) * 2;
    let s = '<rect x="40" y="8" width="26" height="150" rx="13" fill="#fff" stroke="#1e293b" stroke-width="2.5"/><circle cx="53" cy="170" r="16" fill="#ef4444" stroke="#1e293b" stroke-width="2.5"/>';
    const y = (v) => 158 - (v / 40) * 140;
    s += `<rect x="49" y="${y(T)}" width="8" height="${170 - y(T)}" fill="#ef4444"/>`;
    for (let v = 0; v <= 40; v += 2) s += `<line x1="66" y1="${y(v)}" x2="${v % 10 === 0 ? 82 : 74}" y2="${y(v)}" stroke="#1e293b" stroke-width="1.5"/>` + (v % 10 === 0 ? txt(96, y(v) + 4, v, { s: 12 }) : '');
    return { q: t('thermo.q'), vis: svg(120, 190, s), kind: 'num', ans: T, exp: t('thermo.exp', { n: m(T) }) };
  };
  GEN.gridPos = () => {
    const cols = 'ABCDE', c = R(0, 4), r = R(1, 5);
    let s = '';
    for (let i = 0; i <= 5; i++) s += `<line x1="${30 + i * 36}" y1="10" x2="${30 + i * 36}" y2="190" stroke="#94a3b8"/><line x1="30" y1="${10 + i * 36}" x2="210" y2="${10 + i * 36}" stroke="#94a3b8"/>`;
    for (let i = 0; i < 5; i++) s += txt(48 + i * 36, 206, cols[i], { s: 13 }) + txt(16, 33 + i * 36, 5 - i, { s: 13 });
    s += `<circle cx="${48 + c * 36}" cy="${28 + (5 - r) * 36}" r="10" fill="#dc2626"/>`;
    const ans = cols[c] + r, wr = [cols[(c + 1) % 5] + r, cols[c] + (r % 5 + 1), r + cols[c], cols[(c + 4) % 5] + ((r + 1) % 5 + 1)];
    return { q: t('grid.q'), vis: svg(230, 214, s), kind: 'choice', ans, choices: valChoices(ans, wr, (v) => m(v)), exp: t('grid.exp', { c: m(cols[c]), r: m(r) }) };
  };
  GEN.money = (p) => {
    const vals = [1, 2, 5, 10, 20], k = R(2, p.pieces || 4); let items, sum;
    do { items = Array.from({ length: k }, () => pick(vals)); sum = items.reduce((a, b) => a + b, 0); } while (sum > p.max);
    return { q: t('money.q'), vis: `<div class="coins">${items.map((v) => `<span class="coin c${v}">${v} €</span>`).join('')}</div>`, kind: 'num', ans: sum, exp: t('money.exp', { sum: m(sum) }) };
  };

  /* ===== Nombres ===== */
  GEN.seq = (p) => {
    if (p.nb) {
      const n = R(p.min, p.max), after = pick([true, false]), r = after ? n + 1 : n - 1;
      return { q: t(after ? 'seq.nbAfter' : 'seq.nbBefore'), expr: m(fmtBig(n)), kind: 'num', ans: r, exp: t(after ? 'seq.after.exp' : 'seq.before.exp', { n: m(n), r: m(r) }) };
    }
    const step = pick(p.steps), len = p.len || 4, dir = p.dir === 'down' ? -1 : 1;
    const start = dir === 1 ? R(p.min, p.max) : R(p.min, p.max) + step * len;
    const a = []; for (let i = 0; i <= len; i++) a.push(start + dir * step * i);
    return { q: t('seq.q'), expr: m(a.slice(0, len).map(fmtBig).join(' ; ') + ' ; ' + box), kind: 'num', ans: a[len], exp: t(dir === 1 ? 'seq.up.exp' : 'seq.down.exp', { step: m(step), ans: m(a[len]) }) };
  };
  GEN.line = (p) => {
    const step = pick(p.steps), start = pick(p.starts || [0]), k = R(1, 9), W = 320, x0 = 20;
    const val = (i) => round(start + i * step, 2);
    let s = `<line x1="${x0}" y1="40" x2="${x0 + W}" y2="40" stroke="#1e293b" stroke-width="2"/>`;
    for (let i = 0; i <= 10; i++) s += `<line x1="${x0 + (W * i) / 10}" y1="31" x2="${x0 + (W * i) / 10}" y2="49" stroke="#1e293b" stroke-width="2"/>`;
    s += txt(x0, 68, fmt(val(0))) + txt(x0 + W, 68, fmt(val(10))) + `<circle cx="${x0 + (W * k) / 10}" cy="40" r="7" fill="#dc2626"/>`;
    return { q: t('line.q'), vis: svg(W + 50, 80, s), kind: 'num', ans: val(k), exp: t('line.exp', { step: m(fmt(step)), ans: m(fmt(val(k))) }) };
  };
  GEN.compare = (p) => {
    let a, b;
    if (p.dec) { a = R(0, p.max * 10) / 10; b = R(0, p.max * 10) / 10; } else { a = R(p.min || 0, p.max); b = R(p.min || 0, p.max); }
    if (Math.random() < 0.12) b = a;
    const ans = a < b ? '<' : a > b ? '>' : '=', k = ans === '<' ? 'lt' : ans === '>' ? 'gt' : 'eq';
    return { q: t('compare.q'), expr: m(`${fmtBig(a)} &nbsp;◯&nbsp; ${fmtBig(b)}`), kind: 'choice', ans, choices: symChoices(), exp: t('compare.' + k, { a: m(fmtBig(a)), b: m(fmtBig(b)) }) };
  };
  GEN.order = (p) => {
    const set = new Set(); while (set.size < 4) set.add(p.dec ? R(0, p.max * 10) / 10 : R(p.min || 0, p.max));
    const arr = [...set], big = pick([true, false]), ans = big ? Math.max(...arr) : Math.min(...arr);
    return { q: t(big ? 'order.big' : 'order.small'), kind: 'choice', ans, choices: arr.map((v) => ({ v, label: m(fmtBig(v)) })), exp: t('order.exp', { n: m(fmtBig(ans)), w: t(big ? 'order.wbig' : 'order.wsmall') }) };
  };
  GEN.place = (p) => {
    const len = R(p.d[0], p.d[1]); let ip = String(R(1, 9)); for (let i = 1; i < len; i++) ip += R(0, 9);
    let dp = ''; for (let i = 0; i < (p.dec || 0); i++) dp += R(1, 9);
    const IP = t('places.int'), DP = t('places.dec'), opts = [];
    for (let i = 0; i < len; i++) opts.push({ n: IP[i], dig: ip[len - 1 - i] });
    for (let j = 0; j < dp.length; j++) opts.push({ n: DP[j], dig: dp[j] });
    const o = pick(opts);
    return { q: t('place.q', { place: o.n }), expr: m(fmtBig(ip) + (dp ? ',' + dp : '')), kind: 'num', ans: Number(o.dig), exp: t('place.exp', { place: o.n, d: m(o.dig) }) };
  };
  GEN.round = (p) => {
    if (p.dec) {
      let n; do { n = R(11, 999); } while (n % 10 === 5);
      const x = n / 10, ans = Math.round(x);
      return { q: t('round.qDec'), expr: m(fmt(x)), kind: 'num', ans, exp: t(n % 10 > 5 ? 'round.exp.up' : 'round.exp.down', { d: m(n % 10), ans: m(ans) }) };
    }
    const to = pick(p.to); let n; do { n = R(p.min || 11, p.max); } while (n % to === to / 2);
    const ans = Math.round(n / to) * to;
    return { q: t('round.q', { to: t('round.n.' + to) }), expr: m(fmtBig(n)), kind: 'num', ans, exp: t('round.exp', { to: m(to), ans: m(fmtBig(ans)) }) };
  };
  GEN.decomp = (p) => {
    const mode = pick(p.modes);
    if (mode === 'tu') { const d = R(1, p.maxT || 9), u = R(0, 9), n = d * 10 + u; return { q: t('decomp.tu', { d: m(d), u: m(u) }), kind: 'num', ans: n, exp: t('decomp.exp.tu', { d: m(d), t: m(d * 10), u: m(u), n: m(n) }) }; }
    if (mode === 'tuRev') { const n = R(10, p.max || 99); return { q: t('decomp.tuRev'), expr: m(n), kind: 'num', ans: Math.floor(n / 10), exp: t('decomp.exp.rev', { n: m(n), d: m(Math.floor(n / 10)) }) }; }
    if (mode === 'hdu') { const h = R(1, 9), d = R(0, 9), u = R(0, 9), n = h * 100 + d * 10 + u; return { q: t('decomp.hdu', { h: m(h), d: m(d), u: m(u) }), kind: 'num', ans: n, exp: t('decomp.exp.hdu', { h: m(h), a: m(h * 100), d: m(d), b: m(d * 10), u: m(u), n: m(n) }) }; }
    const n = R(11, p.max || 99), tt = Math.floor(n / 10) * 10, u = n - tt;
    return { q: t('decomp.expand'), expr: m(`${n} = ${tt} + ${box}`), kind: 'num', ans: u, exp: t('decomp.exp.expand', { n: m(n), t: m(tt), u: m(u) }) };
  };
  GEN.decExpand = () => {
    const a = R(1, 9), b = R(1, 9), c = R(1, 9), askB = pick([true, false]);
    return { q: t('decExp.q'), expr: m(`${a},${b}${c} = ${a} + `) + frac(askB ? box : b, 10) + m(' + ') + frac(askB ? c : box, 100), kind: 'num', ans: askB ? b : c, exp: t('decExp.exp', { w: t(askB ? 'decExp.w1' : 'decExp.w2'), d: m(askB ? b : c) }) };
  };

  /* ===== Opérations ===== */
  GEN.arith = (p) => {
    const op = p.op || pick(p.ops), f = p.big ? fmtBig : fmt;
    let a, b, ans;
    if (op === '+' && p.target) { const c = p.target; a = R(0, c); b = c - a; return { q: t('arith.missing'), expr: m(`${a} + ${box} = ${c}`), kind: 'num', ans: b, exp: t('arith.missing.exp', { r: m(`${c} − ${a} = ${b}`) }) }; }
    if (op === '/') { b = p.tab ? pick(p.tab) : R(...p.b); const q = R(...(p.q || [2, 10])); a = b * q; ans = q; }
    else if (op === '*') { a = p.tab ? pick(p.tab) : R(...p.a); b = R(...p.b); if (p.tab && Math.random() < 0.5) { ans = a * b; [a, b] = [b, a]; } else ans = a * b; }
    else {
      let guard = 0;
      do {
        a = R(...p.a); b = R(...p.b); if (op === '-' && b > a) [a, b] = [b, a];
        ans = op === '+' ? a + b : a - b;
      } while (guard++ < 400 && ((p.max !== undefined && ans > p.max) || (p.carry !== undefined && (op === '+' ? a % 10 + b % 10 >= 10 : a % 10 < b % 10) !== p.carry)));
      if (p.scale) { a *= p.scale; b *= p.scale; ans *= p.scale; }
    }
    if (p.miss) {
      const hideFirst = op === '+' || op === '*' ? pick([true, false]) : op === '-' ? false : false;
      const hidden = hideFirst ? a : (op === '/' ? b : b);
      const left = hideFirst ? box : f(a), right = hideFirst ? f(b) : box;
      const res = op === '/' ? f(a / b) : f(ans);
      if (op === '/') return { q: t('arith.missing'), expr: m(`${f(a)} ÷ ${box} = ${f(a / b)}`), kind: 'num', ans: b, exp: t('arith.missing.exp', { r: m(`${f(a)} ÷ ${f(a / b)} = ${f(b)}`) }) };
      return { q: t('arith.missing'), expr: m(`${left} ${SYM[op]} ${right} = ${res}`), kind: 'num', ans: hidden, exp: t('arith.missing.exp', { r: m(`${hidden}`) }) };
    }
    return { q: t('arith.q'), expr: m(`${f(a)} ${SYM[op]} ${f(b)} = ${box}`), kind: 'num', ans, exp: m(`${f(a)} ${SYM[op]} ${f(b)} = ${f(ans)}`) };
  };
  GEN.remDiv = (p) => {
    const b = R(...p.b), q = R(...p.q), r = R(1, b - 1), a = b * q + r, ask = pick(['q', 'r']);
    return { q: t(ask === 'q' ? 'remdiv.q' : 'remdiv.r'), expr: m(`${fmtBig(a)} ÷ ${b}`), kind: 'num', ans: ask === 'q' ? q : r, exp: t('remdiv.exp', { eq: m(`${fmtBig(a)} = ${b} × ${q} + ${r}.`), q: m(q), r: m(r) }) };
  };
  GEN.priority = (p) => {
    const k = pick(p.t || [0, 1, 2]);
    let e, ans, v;
    if (k === 0) { const a = R(2, 20), b = R(2, 9), c = R(2, 9); e = `${a} + ${b} × ${c}`; ans = a + b * c; v = { a, b, c, bc: b * c, ans }; }
    else if (k === 1) { const a = R(2, 9), b = R(2, 9), c = R(2, 9); e = `${a} × (${b} + ${c})`; ans = a * (b + c); v = { a, b, c, bc: b + c, ans }; }
    else { const b = R(2, 9), c = R(2, 9), a = b * c + R(1, 20); e = `${a} − ${b} × ${c}`; ans = a - b * c; v = { a, b, c, bc: b * c, ans }; }
    return { q: t('priority.q'), expr: m(`${e} = ${box}`), kind: 'num', ans, exp: t('priority.e' + k, v) };
  };
  GEN.decAdd = (p) => {
    const op = pick(p.ops); let A = R(11, p.max || 999), B = R(11, p.max || 999);
    if (op === '-' && B > A) [A, B] = [B, A];
    const ans = round((op === '+' ? A + B : A - B) / 10, 1);
    return { q: t('dec.q'), expr: m(`${fmt(A / 10)} ${SYM[op]} ${fmt(B / 10)} = ${box}`), kind: 'num', ans, exp: t('dec.add.exp', { ans: m(fmt(ans)) }) };
  };
  GEN.decMul = (p) => {
    const mode = pick(p.modes);
    if (mode === 'pow10') { const A = R(11, 999) / 10, k = pick([10, 100, 1000]); return { q: t('dec.q'), expr: m(`${fmt(A)} × ${k} = ${box}`), kind: 'num', ans: round(A * k, 4), exp: t('dec.pow10.exp', { k: m(k), n: String(k).length - 1 }) }; }
    if (mode === 'int') { const A = R(11, 99), b = R(2, 9), ans = round((A * b) / 10, 1); return { q: t('dec.q'), expr: m(`${fmt(A / 10)} × ${b} = ${box}`), kind: 'num', ans, exp: t('dec.int.exp', { A: m(A), b: m(b), P: m(A * b), ans: m(fmt(ans)) }) }; }
    const A = R(11, 39), B = R(2, 9), ans = round((A * B) / 100, 2);
    return { q: t('dec.q'), expr: m(`${fmt(A / 10)} × ${fmt(B / 10)} = ${box}`), kind: 'num', ans, exp: t('dec.dec.exp', { A: m(A), B: m(B), P: m(A * B), ans: m(fmt(ans)) }) };
  };
  GEN.numprop = (p) => {
    const k = pick(p.kinds);
    if (k === 'parity') { const n = R(p.min || 1, p.max), ev = n % 2 === 0; return { q: t('prop.parity'), expr: m(n), kind: 'choice', ans: ev ? 'e' : 'o', choices: [{ v: 'e', label: t('prop.even') }, { v: 'o', label: t('prop.odd') }], exp: t('prop.parity.exp', { d: m(n % 10), w: t(ev ? 'prop.even' : 'prop.odd') }) }; }
    if (k === 'mult') { const d = pick([2, 3, 4, 5, 6, 9, 10]), n = Math.random() < 0.5 ? d * R(2, 40) : R(10, 400), yes = n % d === 0; return { q: t('prop.mult', { n: m(n), d: m(d) }), kind: 'choice', ans: yes ? 'y' : 'n', choices: yesNo(), exp: t(yes ? 'prop.mult.yes' : 'prop.mult.no', { n: m(n), d: m(d) }) }; }
    if (k === 'div') { const d = R(2, 9), q = R(3, 12), n = d * q; const wr = []; for (let x = 2; x < 14; x++) if (n % x !== 0) wr.push(x); return { q: t('prop.div', { n: m(n) }), kind: 'choice', ans: d, choices: valChoices(d, wr, (v) => m(v)), exp: t('prop.div.exp', { n: m(n), d: m(d), q: m(q) }) }; }
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    const n = Math.random() < 0.5 ? pick(primes) : R(4, 99), yes = primes.includes(n);
    return { q: t('prop.prime'), expr: m(n), kind: 'choice', ans: yes ? 'y' : 'n', choices: yesNo(), exp: t(yes ? 'prop.prime.yes' : 'prop.prime.no', { n: m(n) }) };
  };
  GEN.power = (p) => {
    const k = pick(p.kinds);
    if (k === 'sq') { const a = R(2, 12); return { q: t('power.q'), expr: m(`${a}² = ${box}`), kind: 'num', ans: a * a, exp: t('power.sq.exp', { a: m(a), r: m(a * a) }) }; }
    if (k === 'p10') { const n = R(2, 6); return { q: t('power.q'), expr: m(`10<sup>${n}</sup> = ${box}`), kind: 'num', ans: Math.pow(10, n), exp: t('power.p10.exp', { n: m(n) }) }; }
    const a = R(2, 5), b = R(2, 6), c = R(2, 6);
    return { q: t('power.rule'), expr: m(`${a}<sup>${b}</sup> × ${a}<sup>${c}</sup> = ${a}<sup>${box}</sup>`), kind: 'num', ans: b + c, exp: t('power.rule.exp', { b: m(b), c: m(c), r: m(b + c) }) };
  };

  /* ===== Fractions ===== */
  GEN.fracRead = (p) => {
    const d = R(p.d[0], p.d[1]), n = R(1, d - 1), useBar = p.shape === 'bar' || (p.shape !== 'pie' && Math.random() < 0.5);
    const vis = useBar ? svg(300, 50, bar(5, 7, 290, 36, d, n)) : svg(130, 130, pie(65, 65, 58, d, n));
    if (p.num || Math.random() < 0.35) return { q: t('frac.readN', { d: m(d) }), vis, kind: 'num', ans: n, exp: t('frac.readN.exp', { n: m(n), d: m(d) }) };
    const wr = [[d - n, d], [n, d - n], [d, n], [n + 1, d]].filter(([a, b]) => b > 0 && a * d !== n * b);
    return { q: t('frac.readF'), vis, kind: 'choice', ans: `${n}/${d}`, choices: valChoices(`${n}/${d}`, wr.map(([a, b]) => `${a}/${b}`), fracLabel), exp: t('frac.readF.exp', { n: m(n), d: m(d) }) };
  };
  GEN.fracEq = (p) => {
    const mode = pick(p.modes), d = R(2, 6), n = R(1, d - 1), k = R(2, 5), D = d * k, W = 300, H = 108;
    const two = (bn) => svg(W + 10, H, bar(5, 8, W, 34, d, n) + bar(5, 62, W, 34, D, bn));
    const eq = (bot) => `${frac(n, d)} <span class="m">=</span> ${bot}`;
    if (mode === 'A') return { q: t('fe.A'), vis: two(0), expr: eq(frac(box, D)), kind: 'num', ans: n * k, exp: t('fe.A.exp', { k: m(k), n: m(n), r: m(n * k) }) };
    if (mode === 'B') return { q: t('fe.B'), vis: two(n * k), expr: eq(frac(box, D)), kind: 'num', ans: n * k, exp: t('fe.B.exp', { r: m(n * k), k: m(k) }) };
    if (mode === 'C') {
      const right = `${n * k}/${D}`, wr = [`${n + k}/${d + k}`, `${n * k}/${d}`, `${n}/${D}`, `${n + 1}/${D}`, `${d}/${D}`].filter((s) => { const [a, b] = s.split('/').map(Number); return a * d !== n * b; });
      return { q: t('fe.C'), vis: svg(W + 10, 50, bar(5, 7, W, 36, d, n)), kind: 'choice', ans: right, choices: valChoices(right, wr, fracLabel), exp: t('fe.C.exp', { k: m(k), n: m(n), r: m(n * k), d: m(d), D: m(D) }) };
    }
    if (mode === 'D') {
      const good = Math.random() < 0.5; let bn = n * k; if (!good) bn = bn + 1 <= D ? bn + pick([-1, 1]) : bn - 1; if (bn < 0) bn = 1;
      const same = bn * d === n * D;
      return { q: t('fe.D'), vis: two(bn), expr: `${frac(n, d)} <span class="m">&nbsp;et&nbsp;</span> ${frac(bn, D)}`, kind: 'choice', ans: same ? 'y' : 'n', choices: [{ v: 'y', label: t('fe.D.yes') }, { v: 'n', label: t('fe.D.no') }], exp: same ? t('fe.D.exp.yes', { n: m(n), k: m(k), bn: m(bn), d: m(d), D: m(D) }) : t('fe.D.exp.no', { n: m(n), k: m(k), r: m(n * k), bn: m(bn) }) };
    }
    if (mode === 'N') return { q: t('fe.N'), expr: eq(frac(box, D)), kind: 'num', ans: n * k, exp: t('fe.N.exp', { d: m(d), k: m(k), D: m(D), n: m(n), r: m(n * k) }) };
    if (mode === 'N2') return { q: t('fe.N'), expr: eq(frac(n * k, box)), kind: 'num', ans: D, exp: t('fe.N2.exp', { n: m(n), k: m(k), r: m(n * k), d: m(d), D: m(D) }) };
    return { q: t('fe.S'), expr: `${frac(n * k, D)} <span class="m">=</span> ${frac(box, d)}`, kind: 'num', ans: n, exp: t('fe.S.exp', { k: m(k) }) };
  };
  GEN.fracCompare = (p) => {
    const mode = pick(p.modes); let a, b, c, d;
    if (mode === 'sameDen') { d = R(3, 12); a = R(1, d - 1); c = R(1, d - 1); b = d; }
    else if (mode === 'sameNum') { a = R(1, 6); c = a; b = R(a + 1, 12); d = R(a + 1, 12); }
    else { b = pick([2, 3, 4, 5, 6, 8, 10]); d = pick([2, 3, 4, 5, 6, 8, 10]); a = R(1, b - 1); c = R(1, d - 1); }
    const l = a * d, r = c * b, ans = l < r ? '<' : l > r ? '>' : '=';
    return { q: t('fc.q'), expr: `${frac(a, b)} <span class="m">&nbsp;◯&nbsp;</span> ${frac(c, d)}`, kind: 'choice', ans, choices: symChoices(), exp: t('fc.' + mode, { x: frac(a * d, b * d), y: frac(c * b, b * d) }) };
  };
  GEN.fracLine = (p) => {
    const d = R(p.d[0], p.d[1]), n = R(1, d - 1), W = 300, x0 = 20;
    let s = `<line x1="${x0}" y1="40" x2="${x0 + W}" y2="40" stroke="#1e293b" stroke-width="2"/>`;
    for (let i = 0; i <= d; i++) s += `<line x1="${x0 + (W * i) / d}" y1="31" x2="${x0 + (W * i) / d}" y2="49" stroke="#1e293b" stroke-width="2"/>`;
    s += txt(x0, 68, '0') + txt(x0 + W, 68, '1') + `<circle cx="${x0 + (W * n) / d}" cy="40" r="7" fill="#dc2626"/>`;
    return { q: t('fline.q', { d: m(d) }), vis: svg(W + 40, 80, s), kind: 'num', ans: n, exp: t('fline.exp', { n: m(n), f: frac(n, d) }) };
  };
  GEN.fracWhole = () => { const d = R(2, 8), n = d * R(1, 5) + R(1, d - 1); return { q: t('fwhole.q'), expr: frac(n, d), kind: 'num', ans: Math.floor(n / d), exp: t('fwhole.exp', { n: m(n), d: m(d), q: m(Math.floor(n / d)), r: m(n % d) }) }; };
  GEN.fracSimplify = () => { let a, b; do { b = R(2, 9); a = R(1, b - 1); } while (gcd(a, b) !== 1); const k = R(2, 6); return { q: t('fsimp.q'), expr: `${frac(a * k, b * k)} <span class="m">=</span> ${frac(box, b)}`, kind: 'num', ans: a, exp: t('fsimp.exp', { k: m(k), f: frac(a, b) }) }; };
  GEN.fracAdd = (p) => {
    const mode = pick(p.modes), sub = p.sub && Math.random() < 0.5; let n1, n2, d1, d2, D, ans;
    if (mode === 'same') { d1 = d2 = D = R(3, 12); n1 = R(1, D - 1); n2 = R(1, D - 1); if (sub && n1 < n2) [n1, n2] = [n2, n1]; ans = sub ? n1 - n2 : n1 + n2; if (ans === 0) { n1 = 2; n2 = 1; ans = 1; } }
    else if (mode === 'multiple') { d1 = R(2, 6); const k = R(2, 4); d2 = D = d1 * k; n1 = R(1, d1 - 1); n2 = R(1, d2 - 1); const a1 = n1 * k; if (sub) { if (a1 <= 1) { n1 = d1 - 1; } const A = n1 * k; n2 = R(1, A - 1); ans = A - n2; } else ans = a1 + n2; }
    else { do { d1 = R(2, 7); d2 = R(2, 7); } while (d1 === d2 || gcd(d1, d2) !== 1); D = d1 * d2; n1 = R(1, d1 - 1); n2 = R(1, d2 - 1); if (sub && n1 * d2 < n2 * d1) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; } ans = sub ? n1 * d2 - n2 * d1 : n1 * d2 + n2 * d1; }
    return { q: t('fadd.q'), expr: `${frac(n1, d1)} <span class="m">${sub ? '−' : '+'}</span> ${frac(n2, d2)} <span class="m">=</span> ${frac(box, D)}`, kind: 'num', ans, exp: t(mode === 'same' ? 'fadd.same' : 'fadd.other', { D: m(D) }) };
  };
  GEN.fracMul = (p) => {
    const d1 = R(2, 7), d2 = R(2, 7), n1 = R(1, d1 + 2), n2 = R(1, d2 + 2);
    if (p.div) return { q: t('fmul.q'), expr: `${frac(n1, d1)} <span class="m">÷</span> ${frac(n2, d2)} <span class="m">=</span> ${frac(box, d1 * n2)}`, kind: 'num', ans: n1 * d2, exp: t('fmul.div') };
    return { q: t('fmul.q'), expr: `${frac(n1, d1)} <span class="m">×</span> ${frac(n2, d2)} <span class="m">=</span> ${frac(box, d1 * d2)}`, kind: 'num', ans: n1 * n2, exp: t('fmul.mul') };
  };
  GEN.fracOfQty = () => { const d = pick([2, 3, 4, 5, 6, 8, 10]), n = R(1, d - 1), N = d * R(2, 12); return { q: t('fqty.q'), expr: t('fqty.of', { f: frac(n, d), N: m(N) }), kind: 'num', ans: (N / d) * n, exp: t('fqty.exp', { N: m(N), d: m(d), u: m(N / d), n: m(n), r: m((N / d) * n) }) }; };
  GEN.fracDec = (p) => {
    const d = pick(p.dens), n = R(1, d - 1), ans = round(n / d, 3);
    return { q: t('fdec.q'), expr: frac(n, d), kind: 'num', ans, exp: d === 10 || d === 100 ? t('fdec.exp10', { d: m(d), w: t('fdec.w' + d), ans: m(fmt(ans)) }) : t('fdec.exp', { n: m(n), d: m(d), ans: m(fmt(ans)) }) };
  };

  /* ===== Proportionnalité, pourcentages, unités ===== */
  GEN.percent = (p) => {
    const k = pick(p.kinds), pc = pick([10, 20, 25, 50, 75, 5, 30, 40]), step = 100 / gcd(pc, 100);
    const N = step * R(1, 8) * (step < 10 ? 5 : 1);
    if (k === 'of') return { q: t('pc.q'), expr: t('pc.of', { p: m(pc), N: m(N) }), kind: 'num', ans: (N * pc) / 100, exp: t('pc.of.exp', { p: m(pc), N: m(N), r: m((N * pc) / 100) }) };
    if (k === 'inc' || k === 'dec') { const v = (N * pc) / 100, ans = k === 'inc' ? N + v : N - v; return { q: t('pc.' + k, { N: m(N), p: m(pc) }), kind: 'num', ans, exp: t('pc.change.exp', { v: m(v), r: m(ans) }) }; }
    const b = pick([20, 25, 50, 100, 200, 10, 4, 5]); let a; do { a = R(1, b - 1); } while ((a * 100) % b !== 0);
    return { q: t('pc.find', { a: m(a), b: m(b) }), kind: 'num', ans: (a * 100) / b, exp: t('pc.find.exp', { a: m(a), b: m(b), r: m((a * 100) / b) }) };
  };
  GEN.propor = () => {
    const th = pick(t('prop.things')), u = R(2, 9), a = R(2, 6), b = R(7, 12);
    return { q: t('prop.q', { a: m(a), t: th, tot: m(a * u), b: m(b) }), kind: 'num', ans: b * u, exp: t('prop.exp', { tot: m(a * u), a: m(a), u: m(u), b: m(b), r: m(b * u) }) };
  };
  const UNITS = {
    len: [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10]],
    mass: [['kg', 'g', 1000], ['t', 'kg', 1000]],
    cap: [['L', 'mL', 1000], ['L', 'dL', 10]],
    time: [['h', 'min', 60], ['min', 's', 60]],
    area: [['m²', 'cm²', 10000], ['cm²', 'mm²', 100]],
  };
  GEN.unit = (p) => {
    const [big, small, f] = pick(UNITS[pick(p.sets)]), down = pick([true, false]), v = R(2, 25);
    if (down) return { q: t('unit.q'), expr: m(`${v} ${big} = ${box} ${small}`), kind: 'num', ans: v * f, exp: t('unit.down.exp', { big, small, f: m(f) }) };
    return { q: t('unit.q'), expr: m(`${v * f} ${small} = ${box} ${big}`), kind: 'num', ans: v, exp: t('unit.up.exp', { big, small, f: m(f) }) };
  };
  GEN.wordprob = (p) => {
    const k = pick(p.kinds), [name, g] = pick(t('wp.people')).split('|'), il = t(g === 'f' ? 'wp.elle' : 'wp.il'), Il = il[0].toUpperCase() + il.slice(1);
    const v = { P: name, il, Il };
    if (k === 'add') { const a = R(...p.r), b = R(...p.r); return { q: t('wp.add', { ...v, a: m(a), b: m(b) }), kind: 'num', ans: a + b, exp: m(`${a} + ${b} = ${a + b}`) }; }
    if (k === 'sub') { let a = R(...p.r), b = R(...p.r); if (b > a) [a, b] = [b, a]; return { q: t('wp.sub', { ...v, a: m(a), b: m(b) }), kind: 'num', ans: a - b, exp: m(`${a} − ${b} = ${a - b}`) }; }
    if (k === 'mul') { const a = R(2, 9), b = R(2, 9 + (p.big ? 10 : 0)); return { q: t('wp.mul', { a: m(a), b: m(b) }), kind: 'num', ans: a * b, exp: m(`${a} × ${b} = ${a * b}`) }; }
    if (k === 'div') { const b = R(2, 9), q = R(2, 12); return { q: t('wp.div', { N: m(b * q), b: m(b) }), kind: 'num', ans: q, exp: m(`${b * q} ÷ ${b} = ${q}`) }; }
    const pr = R(2, 9), n = R(2, 8), pay = pr * n + R(1, 9);
    return { q: t('wp.buy', { ...v, n: m(n), pr: m(pr), pay: m(pay) }), kind: 'num', ans: pay - pr * n, exp: t('wp.buy.exp', { n: m(n), pr: m(pr), c: m(n * pr), pay: m(pay), r: m(pay - pr * n) }) };
  };

  /* ===== Mesures et géométrie ===== */
  GEN.clock = (p) => {
    const h = R(1, 12), mi = pick(p.mins), hA = (((h % 12) * 30 + mi * 0.5) * Math.PI) / 180, mA = (mi * 6 * Math.PI) / 180;
    let s = '<circle cx="80" cy="80" r="72" fill="#fff" stroke="#1e293b" stroke-width="3"/>';
    for (let i = 1; i <= 12; i++) { const a = (i * 30 * Math.PI) / 180; s += txt(80 + 58 * Math.sin(a), 85 - 58 * Math.cos(a), i); }
    s += `<line x1="80" y1="80" x2="${80 + 38 * Math.sin(hA)}" y2="${80 - 38 * Math.cos(hA)}" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/><line x1="80" y1="80" x2="${80 + 58 * Math.sin(mA)}" y2="${80 - 58 * Math.cos(mA)}" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/><circle cx="80" cy="80" r="4" fill="#1e293b"/>`;
    const lab = (hh, mm) => `${hh} h ${String(mm).padStart(2, '0')}`, ans = lab(h, mi);
    const wr = [lab(h, (mi + 30) % 60), lab((h % 12) + 1, mi), lab(h, (mi + 15) % 60), lab(((h + 10) % 12) + 1, mi), lab(mi / 5 || 12, (h * 5) % 60)];
    return { q: t('clock.q'), vis: svg(160, 160, s), kind: 'choice', ans, choices: valChoices(ans, wr, (v) => m(v)), exp: t('clock.exp', { h: m(h), mi: m(mi) }) };
  };
  GEN.elapsed = () => {
    const h1 = R(1, 10), m1 = pick([0, 5, 10, 15, 20, 30, 40, 45, 50]), dur = pick([15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90]);
    const tot = h1 * 60 + m1 + dur, h2 = Math.floor(tot / 60), m2 = tot % 60, L = (h, mm) => `${h} h ${String(mm).padStart(2, '0')}`;
    return { q: t('elapsed.q', { s: m(L(h1, m1)), e: m(L(h2, m2)) }), kind: 'num', ans: dur, exp: t('elapsed.exp', { s: m(L(h1, m1)), e: m(L(h2, m2)), r: m(dur) }) };
  };
  GEN.measure = (p) => {
    const k = pick(p.kinds), u = p.u || 'cm';
    if (k === 'rectP' || k === 'rectA') {
      const a = R(p.r[0], p.r[1]), b = R(p.r[0], p.r[1]), vis = svg(220, 130, `<rect x="30" y="25" width="150" height="75" fill="#dbeafe" stroke="#1e3a8a" stroke-width="2.5"/>` + txt(105, 18, a + ' ' + u) + txt(205, 66, b + ' ' + u));
      return k === 'rectP' ? { q: t('ms.rectP'), vis, kind: 'num', ans: 2 * (a + b), exp: t('ms.rectP.exp', { a: m(a), b: m(b), r: m(2 * (a + b)), u }) } : { q: t('ms.rectA'), vis, kind: 'num', ans: a * b, exp: t('ms.rectA.exp', { a: m(a), b: m(b), r: m(a * b) }) };
    }
    if (k === 'sqP' || k === 'sqA') {
      const a = R(p.r[0], p.r[1]), vis = svg(160, 130, `<rect x="40" y="20" width="85" height="85" fill="#dbeafe" stroke="#1e3a8a" stroke-width="2.5"/>` + txt(82, 14, a + ' ' + u));
      return k === 'sqP' ? { q: t('ms.sqP'), vis, kind: 'num', ans: 4 * a, exp: t('ms.sqP.exp', { a: m(a), r: m(4 * a) }) } : { q: t('ms.sqA'), vis, kind: 'num', ans: a * a, exp: t('ms.sqA.exp', { a: m(a), r: m(a * a) }) };
    }
    if (k === 'triA') {
      let b = R(p.r[0], p.r[1]), h = R(p.r[0], p.r[1]); if (b % 2 && h % 2) b++;
      const vis = svg(220, 130, `<polygon points="20,105 180,105 120,20" fill="#fde68a" stroke="#92400e" stroke-width="2.5"/><line x1="120" y1="20" x2="120" y2="105" stroke="#92400e" stroke-dasharray="4"/>` + txt(100, 124, `${t('ms.base')} ${b} ${u}`) + txt(160, 66, `${t('ms.height')} ${h}`, { s: 12 }));
      return { q: t('ms.triA'), vis, kind: 'num', ans: (b * h) / 2, exp: t('ms.triA.exp', { b: m(b), h: m(h), r: m((b * h) / 2) }) };
    }
    if (k === 'circC' || k === 'circA') {
      const r = R(2, 10), vis = svg(160, 140, `<circle cx="80" cy="70" r="55" fill="#bbf7d0" stroke="#166534" stroke-width="2.5"/><line x1="80" y1="70" x2="135" y2="70" stroke="#166534" stroke-width="2"/>` + txt(108, 62, 'r = ' + r));
      const ans = k === 'circC' ? round(2 * 3.14 * r, 2) : round(3.14 * r * r, 2);
      return { q: t('ms.' + k), vis, kind: 'num', ans, exp: t('ms.' + k + '.exp', { r: m(r), ans: m(fmt(ans)) }) };
    }
    const a = R(2, 9), b = R(2, 9), c = R(2, 9);
    return { q: t('ms.vol'), expr: m(`${a} × ${b} × ${c}`), kind: 'num', ans: a * b * c, exp: t('ms.vol.exp', { r: m(a * b * c) }) };
  };
  GEN.angleType = () => {
    const types = [['aigu', () => R(20, 80)], ['droit', () => 90], ['obtus', () => R(100, 170)], ['plat', () => 180]], ty = pick(types), deg = ty[1](), a = (deg * Math.PI) / 180;
    const x2 = 90 + 80 * Math.cos(a), y2 = 110 - 80 * Math.sin(a);
    const vis = svg(200, 130, `<line x1="90" y1="110" x2="175" y2="110" stroke="#1e293b" stroke-width="3"/><line x1="90" y1="110" x2="${x2}" y2="${y2}" stroke="#2563eb" stroke-width="3"/>` + (deg === 90 ? '<rect x="90" y="92" width="18" height="18" fill="none" stroke="#1e293b"/>' : `<path d="M${115},110 A25,25 0 0 0 ${90 + 25 * Math.cos(a)},${110 - 25 * Math.sin(a)}" fill="none" stroke="#dc2626" stroke-width="2"/>`));
    return { q: t('angle.q'), vis, kind: 'choice', ans: ty[0], choices: ['aigu', 'droit', 'obtus', 'plat'].map((v) => ({ v, label: t('angle.' + v) })), exp: t('angle.exp') };
  };
  GEN.triAngle = () => { const a = R(30, 80), b = R(30, 80); return { q: t('tri.q', { a: m(a), b: m(b) }), kind: 'num', ans: 180 - a - b, exp: t('tri.exp', { a: m(a), b: m(b), r: m(180 - a - b) }) }; };

  /* ===== Statistiques et probabilités ===== */
  GEN.stat = (p) => {
    const k = pick(p.kinds);
    if (k === 'mean') { const mu = R(5, 20), dev = [R(-4, 4), R(-4, 4), R(-4, 4)]; dev.push(-dev.reduce((a, b) => a + b, 0)); const arr = dev.map((d) => mu + d); return { q: t('stat.mean'), expr: m(shuf(arr).join(' ; ')), kind: 'num', ans: mu, exp: t('stat.mean.exp', { s: m(arr.reduce((a, b) => a + b, 0)), r: m(mu) }) }; }
    if (k === 'median') { const arr = Array.from({ length: 5 }, () => R(1, 30)), s = arr.slice().sort((a, b) => a - b); return { q: t('stat.median'), expr: m(arr.join(' ; ')), kind: 'num', ans: s[2], exp: t('stat.median.exp', { s: m(s.join(' ; ')), r: m(s[2]) }) }; }
    const arr = Array.from({ length: 5 }, () => R(1, 40)), M = Math.max(...arr), mn = Math.min(...arr);
    return { q: t('stat.range'), expr: m(arr.join(' ; ')), kind: 'num', ans: M - mn, exp: t('stat.range.exp', { M: m(M), m: m(mn), r: m(M - mn) }) };
  };
  GEN.proba = () => {
    const r = R(1, 6), b = R(1, 6), g = R(0, 4), T = r + b + g, names = t('proba.cols'), cols = [[names[0], r], [names[1], b], [names[2], g]].filter((c) => c[1] > 0), c = pick(cols);
    const vis = `<div class="emojis">${'🔴'.repeat(r)}${'🔵'.repeat(b)}${'🟢'.repeat(g)}</div>`;
    const ans = `${c[1]}/${T}`, wr = [`${T - c[1]}/${T}`, `${c[1]}/${T - c[1]}`, `${T}/${c[1]}`, `1/${T}`, `${c[1] + 1}/${T}`].filter((s) => { const [a, bb] = s.split('/').map(Number); return a * T !== c[1] * bb; });
    return { q: t('proba.q', { c: c[0] }), vis, kind: 'choice', ans, choices: valChoices(ans, wr, fracLabel), exp: t('proba.exp', { n: m(c[1]), c: c[0], T: m(T) }) };
  };

  const api = { GEN, t };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MathsGen = api;
}(typeof window !== 'undefined' ? window : globalThis));
