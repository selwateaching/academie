/* Générateurs de questions pour le collège (5e à 3e) et le lycée (2nde à Terminale).
 * Même contrat que generators.js : { q, expr?, vis?, kind: 'num' | 'choice', ans, choices?, exp }.
 * Les textes passent par t() ; ils sont dans lang/fr2.js et lang/ar2.js.
 * Chargé après generators.js : il ajoute ses générateurs à MathsGen.GEN.
 */
(function (root) {
  'use strict';

  const GEN = root.MathsGen.GEN;
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
  const m = (s) => `<span class="m">${String(s).replace(/[؀-ۿ]+/g, '⁦$&⁩')}</span>`;
  const frac = (n, d) => `<span class="frac"><span>${fmt(n)}</span><span>${fmt(d)}</span></span>`;
  const box = '<span class="box">?</span>';
  const sgn = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));        // nombre relatif entre parenthèses si négatif
  const plus = (n) => (n < 0 ? `− ${fmt(-n)}` : `+ ${fmt(n)}`); // « + 5 » ou « − 5 »
  const trm = (c, v = 'x') => `${c < 0 ? '−' : '+'} ${Math.abs(c) === 1 ? '' : fmt(Math.abs(c))}${v}`;
  const nz = (lo, hi) => { let x; do { x = R(lo, hi); } while (x === 0); return x; };
  const SUP = { 2: '²', 3: '³' };
  // polynôme à partir des coefficients (degré décroissant) : P([3, -2, 5]) = « 3x² − 2x + 5 »
  const P = (cs, v = 'x') => {
    const n = cs.length - 1; let out = '';
    cs.forEach((c, i) => {
      if (c === 0) return;
      const d = n - i, a = Math.abs(c);
      const body = d === 0 ? fmt(a) : (a === 1 ? '' : fmt(a)) + v + (d > 1 ? SUP[d] || `^${d}` : '');
      out += out === '' ? (c < 0 ? '−' : '') + body : (c < 0 ? ' − ' : ' + ') + body;
    });
    return out || '0';
  };
  const fracStr = (n, d) => { const g = gcd(n, d) || 1; return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
  const fracLabel = (s) => { const [a, b] = String(s).split('/'); return b === undefined ? m(fmt(a)) : frac(a, b); };
  // choix multiples : la bonne réponse + des fausses (distinctes), au plus 4 au total
  function mc(correct, wrongs, labelf = (v) => m(v)) {
    const seen = new Set([String(correct)]), out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  }
  const symChoices = () => ['<', '=', '>'].map((s) => ({ v: s, label: m(s) }));
  const yesNo = () => [{ v: 'y', label: t('yes') }, { v: 'n', label: t('no') }];
  const pair = (a, b) => `(${fmt(a)} ; ${fmt(b)})`;
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;
  const num = (q, expr, ans, exp, vis) => ({ q, expr, vis, kind: 'num', ans, exp });

  /* ===================================================================== 5e */

  /* Nombres relatifs : addition, soustraction, multiplication, division, comparaison */
  GEN.relNum = (p) => {
    const k = pick(p.kinds);
    if (k === 'cmp') {
      let a = R(-15, 15), b = R(-15, 15); while (a === b) b = R(-15, 15);
      const s = a < b ? '<' : '>';
      return { q: t('x.cmp.q'), expr: m(`${fmt(a)} ${box} ${fmt(b)}`), kind: 'choice', ans: s, choices: symChoices(), exp: t('x.rel.cmp.exp', { a: m(fmt(a)), b: m(fmt(b)), s: m(s) }) };
    }
    if (k === 'add') {
      let a, b; do { a = nz(-15, 15); b = nz(-15, 15); } while (a + b === 0);
      const r = a + b, same = (a > 0) === (b > 0);
      const exp = same
        ? t('x.rel.add.same', { da: m(Math.abs(a)), db: m(Math.abs(b)), dr: m(Math.abs(r)), r: m(fmt(r)) })
        : t('x.rel.add.diff', { big: m(Math.max(Math.abs(a), Math.abs(b))), small: m(Math.min(Math.abs(a), Math.abs(b))), dr: m(Math.abs(r)), r: m(fmt(r)) });
      return num(t('x.calc'), m(`${sgn(a)} + ${sgn(b)} = ${box}`), r, exp);
    }
    if (k === 'sub') {
      const a = nz(-15, 15), b = nz(-15, 15), r = a - b;
      return num(t('x.calc'), m(`${sgn(a)} − ${sgn(b)} = ${box}`), r, t('x.rel.sub.exp', { a: m(fmt(a)), b: m(sgn(b)), ob: m(sgn(-b)), r: m(fmt(r)) }));
    }
    let a, b, r;
    if (k === 'mul') { a = nz(-9, 9); b = nz(-9, 9); r = a * b; } else { b = nz(-9, 9); r = nz(-9, 9); a = b * r; }
    const same = (a > 0) === (b > 0), op = k === 'mul' ? '×' : '÷', x = k === 'mul' ? Math.abs(a) * Math.abs(b) : Math.abs(r);
    return num(t('x.calc'), m(`${sgn(a)} ${op} ${sgn(b)} = ${box}`), r, t(k === 'mul' ? 'x.rel.mul.exp' : 'x.rel.div.exp', {
      da: m(Math.abs(a)), db: m(Math.abs(b)), dr: m(x), same: t(same ? 'x.rel.same' : 'x.rel.diff'), sr: t(r > 0 ? 'x.rel.pos' : 'x.rel.neg'), r: m(fmt(r)),
    }));
  };

  /* Lire un nombre relatif sur une droite graduée */
  GEN.relLine = () => {
    const v = pick([-8, -7, -6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6, 7, 8]), x0 = 200, u = 20;
    let s = `<line x1="10" y1="60" x2="390" y2="60" stroke="#334155" stroke-width="2"/><polygon points="390,60 380,55 380,65" fill="#334155"/>`;
    for (let i = -9; i <= 9; i++) s += `<line x1="${x0 + i * u}" y1="54" x2="${x0 + i * u}" y2="66" stroke="#334155" stroke-width="${i === 0 || i === 1 ? 2.5 : 1.5}"/>`;
    s += txt(x0, 85, '0', { s: 15 }) + txt(x0 + u, 85, '1', { s: 15 });
    s += `<circle cx="${x0 + v * u}" cy="60" r="6" fill="#dc2626"/>` + txt(x0 + v * u, 38, 'A', { s: 16, c: '#dc2626' });
    return { q: t('x.relLine.q'), vis: svg(400, 100, s), kind: 'choice', ans: String(v), choices: mc(String(v), [String(-v), String(v + 1), String(v - 1), String(-v + 1), String(v + 2)], (x) => m(fmt(x))), exp: t('x.relLine.exp', { v: m(fmt(v)) }) };
  };

  /* Division de fractions : on multiplie par l'inverse */
  GEN.fracDiv = () => {
    let a, b, c, d, n, e, g;
    do { a = R(1, 7); b = R(2, 9); c = R(1, 7); d = R(2, 9); n = a * d; e = b * c; g = gcd(n, e); } while (e / g === 1 || a >= b || c >= d || n === e);
    const ans = fracStr(n, e), eq = (s) => { const [x, y] = s.split('/').map(Number); return x * e === n * (y || 1); };
    const wr = [fracStr(a * c, b * d), fracStr(b * c, a * d), fracStr(a * d, b * d), fracStr(a + d, b + c), fracStr(n + 1, e)].filter((s) => !eq(s));
    return { q: t('x.fracDiv.q'), expr: `${frac(a, b)} ÷ ${frac(c, d)} = ${box}`, kind: 'choice', ans, choices: mc(ans, wr, fracLabel), exp: t('x.fracDiv.exp', { a: frac(a, b), c: frac(c, d), inv: frac(d, c), r: fracLabel(ans) }) };
  };

  /* Expressions littérales : calculer pour une valeur, réduire, développer */
  GEN.litEval = (p) => {
    const quad = p && p.quad;
    let a = nz(-6, 6), b = nz(-9, 9), c = quad ? nz(-5, 5) : 0, x = nz(-5, 5);
    if (quad) { a = nz(-3, 3); const e = P([a, b, c]); const r = a * x * x + b * x + c; return num(t('x.litEval.q', { x: m(fmt(x)) }), m(e), r, t('x.litEval.exp', { x: m(fmt(x)), sub: m(`${fmt(a)} × ${sgn(x)}² ${plus(b)} × ${sgn(x)} ${plus(c)}`), r: m(fmt(r)) })); }
    const r = a * x + b;
    return num(t('x.litEval.q', { x: m(fmt(x)) }), m(P([a, b])), r, t('x.litEval.exp', { x: m(fmt(x)), sub: m(`${fmt(a)} × ${sgn(x)} ${plus(b)}`), r: m(fmt(r)) }));
  };
  GEN.litReduce = () => {
    let a, b, c, d; do { a = nz(-9, 9); b = nz(-9, 9); c = nz(-9, 9); d = nz(-9, 9); } while (a + c === 0 || b + d === 0 || b === 0);
    const e = `${P([a, b])} ${trm(c)} ${plus(d)}`;
    const ans = P([a + c, b + d]);
    const wr = [P([a + c, b - d]), P([a - c, b + d]), P([a + c + b + d, 0]), P([a * c, b + d]), P([a + c, 0]), P([a + c, b * d])];
    return { q: t('x.litReduce.q'), expr: m(e), kind: 'choice', ans, choices: mc(ans, wr), exp: t('x.litReduce.exp', { sx: m(`${sgn(a)} + ${sgn(c)} = ${fmt(a + c)}`), sn: m(`${sgn(b)} + ${sgn(d)} = ${fmt(b + d)}`), r: m(ans) }) };
  };
  GEN.litDev = (p) => {
    const k = pick(p.kinds);
    if (k === 'simple') {
      const kk = R(2, 9), a = nz(-9, 9), e = `${kk}(x ${plus(a)})`, ans = P([kk, kk * a]);
      return { q: t('x.dev.q'), expr: m(e), kind: 'choice', ans, choices: mc(ans, [P([kk, a]), P([kk, -kk * a]), P([1, kk * a]), P([kk + a, 0]), P([kk, kk + a])]), exp: t('x.dev.exp', { k: m(kk), r: m(ans) }) };
    }
    if (k === 'lin') {
      const kk = nz(-6, 6), a = nz(-6, 6), b = nz(-9, 9), e = `${fmt(kk)}(${P([a, b])})`, ans = P([kk * a, kk * b]);
      return { q: t('x.dev.q'), expr: m(e), kind: 'choice', ans, choices: mc(ans, [P([kk * a, b]), P([kk * a, -kk * b]), P([a, kk * b]), P([kk + a, kk + b]), P([-kk * a, kk * b])]), exp: t('x.dev.exp', { k: m(fmt(kk)), r: m(ans) }) };
    }
    const a = nz(-6, 6), b = nz(-6, 6), e = `(x ${plus(a)})(x ${plus(b)})`, ans = P([1, a + b, a * b]);
    return { q: t('x.dev.q'), expr: m(e), kind: 'choice', ans, choices: mc(ans, [P([1, a + b, a + b]), P([1, a * b, a + b]), P([1, a + b, -a * b]), P([1, a - b, a * b]), P([1, 0, a * b])]), exp: t('x.dev2.exp', { s: m(fmt(a + b)), p: m(fmt(a * b)), r: m(ans) }) };
  };

  /* Une égalité est-elle vraie pour une valeur donnée ? */
  GEN.eqTest = () => {
    const a = R(2, 6), b = nz(-8, 8), x = R(-4, 6), good = pick([true, false]), l = a * x + b, c = good ? l : l + pick([-2, -1, 1, 2, 3]);
    return { q: t('x.eqTest.q', { x: m(fmt(x)) }), expr: m(`${P([a, b])} = ${fmt(c)}`), kind: 'choice', ans: good ? 'y' : 'n', choices: yesNo(), exp: t(good ? 'x.eqTest.y' : 'x.eqTest.n', { x: m(fmt(x)), l: m(fmt(l)), c: m(fmt(c)) }) };
  };

  /* Équations du premier degré */
  GEN.eq1 = (p) => {
    const k = pick(p.kinds), x = nz(-9, 12);
    if (k === 'add') {
      const a = R(1, 15), neg = pick([true, false]);
      return neg ? num(t('x.solve'), m(`x − ${a} = ${fmt(x - a)}`), x, t('x.eq.sub.exp', { a: m(a), b: m(fmt(x - a)), r: m(fmt(x)) }))
        : num(t('x.solve'), m(`x + ${a} = ${fmt(x + a)}`), x, t('x.eq.add.exp', { a: m(a), b: m(fmt(x + a)), r: m(fmt(x)) }));
    }
    if (k === 'mul') { const a = R(2, 9); return num(t('x.solve'), m(`${a}x = ${fmt(a * x)}`), x, t('x.eq.mul.exp', { a: m(a), b: m(fmt(a * x)), r: m(fmt(x)) })); }
    if (k === 'lin') {
      const a = nz(-9, 9), b = nz(-12, 12), c = a * x + b;
      return num(t('x.solve'), m(`${P([a, b])} = ${fmt(c)}`), x, t('x.eq.lin.exp', { a: m(fmt(a)), b: m(sgn(b)), c: m(fmt(c)), d: m(fmt(c - b)), r: m(fmt(x)) }));
    }
    let a, c; do { a = R(2, 9); c = R(1, 8); } while (a === c);
    const b = nz(-12, 12), d = a * x + b - c * x;
    return num(t('x.solve'), m(`${P([a, b])} = ${P([c, d])}`), x, t('x.eq.both.exp', { a: m(a), c: m(c), b: m(sgn(b)), d: m(sgn(d)), n: m(fmt(a - c)), mm: m(fmt(d - b)), r: m(fmt(x)) }));
  };

  /* Proportionnalité : échelle, coefficient */
  GEN.scale = (p) => {
    const s = pick([100, 200, 500, 1000, 2000, 5000]), c = R(2, 12), k = pick(p.kinds);
    if (k === 'real') return num(t('x.scale.real', { s: m(s), c: m(c) }), '', (c * s) / 100, t('x.scale.real.exp', { c: m(c), s: m(s), rcm: m(c * s), rm: m(fmt((c * s) / 100)) }));
    const real = (c * s) / 100;
    return num(t('x.scale.plan', { s: m(s), m: m(fmt(real)) }), '', c, t('x.scale.plan.exp', { m: m(fmt(real)), cm: m(fmt(real * 100)), s: m(s), c: m(c) }));
  };
  GEN.propCoef = (p) => {
    const k = pick(p.kinds), a = R(2, 9), coef = pick([2, 3, 4, 5, 6, 7, 10, 1.5, 2.5]), b = round(a * coef);
    if (k === 'coef') return num(t('x.coef.q', { a: m(fmt(a)), b: m(fmt(b)) }), '', coef, t('x.coef.exp', { a: m(fmt(a)), b: m(fmt(b)), r: m(fmt(coef)) }));
    const c = R(10, 20);
    return num(t('x.coef.miss', { a: m(fmt(a)), b: m(fmt(b)), c: m(fmt(c)) }), '', round(c * coef), t('x.coef.miss.exp', { a: m(fmt(a)), b: m(fmt(b)), k: m(fmt(coef)), c: m(fmt(c)), r: m(fmt(round(c * coef))) }));
  };

  /* Angles */
  GEN.angleRel = (p) => {
    const k = pick(p.kinds);
    if (k === 'comp') { const a = R(10, 80); return num(t('x.ang.comp', { a: m(a) }), '', 90 - a, t('x.ang.comp.exp', { a: m(a), r: m(90 - a) })); }
    if (k === 'supp') { const a = R(20, 160); return num(t('x.ang.supp', { a: m(a) }), '', 180 - a, t('x.ang.supp.exp', { a: m(a), r: m(180 - a) })); }
    if (k === 'iso') { const s = pick([20, 30, 40, 50, 80, 100, 120, 140]); return num(t('x.ang.iso', { a: m(s) }), '', (180 - s) / 2, t('x.ang.iso.exp', { a: m(s), d: m(180 - s), r: m((180 - s) / 2) })); }
    const a = R(40, 130); return num(t('x.ang.par', { a: m(a) }), '', 180 - a, t('x.ang.par.exp', { a: m(a), r: m(180 - a) }));
  };

  /* Aires et volumes */
  GEN.area2 = (p) => {
    const k = pick(p.kinds);
    if (k === 'para') {
      const b = R(4, 15), h = R(3, 10);
      const f = svg(280, 130, `<polygon points="30,105 190,105 250,25 90,25" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="2.5"/><line x1="90" y1="25" x2="90" y2="105" stroke="#dc2626" stroke-dasharray="5 4" stroke-width="2"/><rect x="90" y="93" width="12" height="12" fill="none" stroke="#dc2626"/>${txt(110, 124, `${b} cm`)}${txt(97, 70, `${h} cm`, { a: 'start' })}`);
      return { q: t('x.area.para.q'), vis: f, kind: 'num', ans: b * h, exp: t('x.area.para.exp', { b: m(b), h: m(h), r: m(b * h) }) };
    }
    const B = R(8, 16), b = R(3, B - 2), h = R(2, 10) * 2;
    const f = svg(280, 130, `<polygon points="30,105 250,105 200,25 80,25" fill="#bbf7d0" stroke="#166534" stroke-width="2.5"/><line x1="200" y1="25" x2="200" y2="105" stroke="#dc2626" stroke-dasharray="5 4" stroke-width="2"/>${txt(140, 124, `B = ${B} cm`)}${txt(140, 17, `b = ${b} cm`)}${txt(196, 70, `h = ${h} cm`, { a: 'end' })}`);
    return { q: t('x.area.trap.q'), vis: f, kind: 'num', ans: ((B + b) * h) / 2, exp: t('x.area.trap.exp', { B: m(B), b: m(b), h: m(h), s: m(B + b), r: m(((B + b) * h) / 2) }) };
  };
  GEN.vol2 = (p) => {
    const k = pick(p.kinds);
    if (k === 'prism') { const A = R(5, 40), h = R(3, 12); return num(t('x.vol.prism', { A: m(A), h: m(h) }), '', A * h, t('x.vol.prism.exp', { A: m(A), h: m(h), r: m(A * h) })); }
    if (k === 'cyl') { const r = R(2, 8), h = R(3, 12), v = round(3.14 * r * r * h, 2); return num(t('x.vol.cyl', { r: m(r), h: m(h) }), '', v, t('x.vol.cyl.exp', { r: m(r), h: m(h), r2: m(r * r), r3: m(fmt(v)) })); }
    const r = R(2, 4) * 3, h = R(2, 9) * 3, v = round((3.14 * r * r * h) / 3, 2);
    return num(t('x.vol.cone', { r: m(r), h: m(h) }), '', v, t('x.vol.cone.exp', { r: m(r), h: m(h), r3: m(fmt(v)) }));
  };

  /* Statistiques : fréquence */
  GEN.freq = () => {
    const n = pick([4, 5, 8, 10, 20, 25, 40, 50]), k = R(1, n - 1), pc = (k * 100) / n;
    if (!Number.isInteger(pc)) return GEN.freq();
    return num(t('x.freq.q', { k: m(k), n: m(n) }), '', pc, t('x.freq.exp', { k: m(k), n: m(n), r: m(pc) }));
  };

  /* Symétrie centrale et axiales dans un repère */
  GEN.symPt = (p) => {
    const k = pick(p.kinds), a = nz(-7, 7), b = nz(-7, 7);
    const target = { O: [-a, -b], x: [a, -b], y: [-a, b] }[k], ans = pair(...target);
    return { q: t('x.sym.q.' + k, { p: m(pair(a, b)) }), kind: 'choice', ans, choices: mc(ans, [pair(a, -b), pair(-a, b), pair(-a, -b), pair(b, a), pair(-b, -a)].filter((s) => s !== pair(a, b)), (x) => m(x)), exp: t('x.sym.exp.' + k, { r: m(ans) }) };
  };

  /* Inégalité triangulaire */
  GEN.triIneq = () => {
    const good = pick([true, false]), a = R(3, 9), b = R(3, 9);
    const c = good ? R(Math.abs(a - b) + 1, a + b - 1) : a + b + R(0, 4);
    const [x, y, z] = shuf([a, b, c]), big = Math.max(a, b, c), s = a + b + c - big;
    return { q: t('x.tri.q'), expr: m(`${x} cm ; ${y} cm ; ${z} cm`), kind: 'choice', ans: big < s ? 'y' : 'n', choices: yesNo(), exp: t(big < s ? 'x.tri.y' : 'x.tri.n', { big: m(big), s: m(s) }) };
  };

  root.MathsGen2 = { t };
}(typeof window !== 'undefined' ? window : globalThis));
