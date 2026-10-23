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
  const fracStr = (n, d) => { const g = gcd(n, d) || 1; let N = n / g, D = d / g; if (D < 0) { N = -N; D = -D; } return D === 1 ? String(N) : `${N}/${D}`; };
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
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" direction="ltr" style="direction:ltr">${inner}</svg>`;
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
    if (k === 'pyr') { const A = R(4, 30), h = R(2, 8) * 3; return num(t('x.vol.pyr', { A: m(A), h: m(h) }), '', (A * h) / 3, t('x.vol.pyr.exp', { A: m(A), h: m(h), r: m((A * h) / 3) })); }
    if (k === 'sph') { const r = R(1, 3) * 3, v = round((4 * 3.14 * r * r * r) / 3, 2); return num(t('x.vol.sph', { r: m(r) }), '', v, t('x.vol.sph.exp', { r: m(r), r3: m(r * r * r), v: m(fmt(v)) })); }
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

  /* ===================================================================== 4e */
  const sup = (a, n) => `${a}<sup>${n}</sup>`;
  const base = (a) => (a < 0 ? `(${fmt(a)})` : fmt(a));
  const spaced = (s) => { const [i, d] = String(s).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : ''); };
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [15, 20, 25], [20, 21, 29], [10, 24, 26]];

  /* Priorités avec des nombres relatifs */
  GEN.relExpr = () => {
    const k = R(0, 2), a = nz(-9, 9), b = nz(-9, 9), c = nz(-9, 9);
    if (k === 0) { const r = a + b * c; return num(t('x.calc'), m(`${sgn(a)} + ${sgn(b)} × ${sgn(c)} = ${box}`), r, t('x.relExpr.e0', { b: m(sgn(b)), c: m(sgn(c)), p: m(fmt(b * c)), a: m(sgn(a)), r: m(fmt(r)) })); }
    if (k === 1) { const r = a - b * c; return num(t('x.calc'), m(`${sgn(a)} − ${sgn(b)} × ${sgn(c)} = ${box}`), r, t('x.relExpr.e1', { b: m(sgn(b)), c: m(sgn(c)), p: m(fmt(b * c)), a: m(sgn(a)), r: m(fmt(r)) })); }
    const r = (a + b) * c; return num(t('x.calc'), m(`(${fmt(a)} + ${sgn(b)}) × ${sgn(c)} = ${box}`), r, t('x.relExpr.e2', { a: m(fmt(a)), b: m(sgn(b)), s: m(fmt(a + b)), c: m(sgn(c)), r: m(fmt(r)) }));
  };

  /* Puissances */
  GEN.powInt = (p) => {
    const k = pick(p.kinds);
    if (k === 'neg10') { const n = R(1, 6), v = round(Math.pow(10, -n), 8); return num(t('x.pow.neg10'), m(`${sup('10', '−' + n)} = ${box}`), v, t('x.pow.neg10.exp', { n: m(n), r: m(fmt(v)) })); }
    if (k === 'rule') { const a = R(2, 9), x = R(2, 9), y = R(2, 9); return num(t('x.pow.rule'), m(`${sup(a, x)} × ${sup(a, y)} = ${sup(a, box)}`), x + y, t('x.pow.rule.exp', { x: m(x), y: m(y), r: m(x + y) })); }
    if (k === 'div') { const a = R(2, 9), y = R(2, 6), x = y + R(1, 7); return num(t('x.pow.rule'), m(`${sup(a, x)} ÷ ${sup(a, y)} = ${sup(a, box)}`), x - y, t('x.pow.div.exp', { x: m(x), y: m(y), r: m(x - y) })); }
    const a = pick([-5, -4, -3, -2, 2, 3, 4, 5, 10]), n = R(2, 4), v = Math.pow(a, n);
    return num(t('x.pow.calc'), m(`${sup(base(a), n)} = ${box}`), v, t('x.pow.calc.exp', { e: m(Array(n).fill(base(a)).join(' × ')), r: m(fmt(v)) }));
  };
  GEN.sci = () => {
    const mant = R(11, 99) / 10, e = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), v = String(round(mant * Math.pow(10, e), 12));
    const label = (x) => m(x), L = (mm, ee) => `${fmt(mm)} × ${sup('10', ee)}`;
    const ans = L(mant, e), wr = [L(mant, e + 1), L(mant, e - 1), L(mant * 10, e - 1), L(mant, -e), L(round(mant / 10, 2), e + 1)];
    return { q: t('x.sci.q'), expr: m(e > 0 ? spaced(v) : fmt(v)), kind: 'choice', ans, choices: mc(ans, wr, label), exp: t('x.sci.exp', { r: m(ans) }) };
  };
  GEN.sqrtQ = (p) => {
    const k = pick(p.kinds);
    if (k === 'perfect') { const n = R(2, 20); return num(t('x.calc'), m(`√${n * n} = ${box}`), n, t('x.sqrt.perfect.exp', { n: m(n), s: m(n * n) })); }
    if (k === 'between') {
      let n; do { n = R(2, 150); } while (Number.isInteger(Math.sqrt(n)));
      const a = Math.floor(Math.sqrt(n)), L = (x) => `${x} ${t('x.and')} ${x + 1}`, ans = L(a);
      return { q: t('x.sqrt.between.q'), expr: m(`√${n}`), kind: 'choice', ans, choices: mc(ans, [L(a - 1), L(a + 1), L(a + 2), L(Math.max(1, Math.floor(n / 10)))], (x) => m(x)), exp: t('x.sqrt.between.exp', { a: m(a), a2: m(a * a), b: m(a + 1), b2: m((a + 1) * (a + 1)), n: m(n) }) };
    }
    const kk = R(2, 7), b = pick([2, 3, 5, 6, 7]), n = kk * kk * b, L = (x, y) => `${x}√${y}`, ans = L(kk, b);
    return { q: t('x.sqrt.simp.q'), expr: m(`√${n}`), kind: 'choice', ans, choices: mc(ans, [L(kk + 1, b), L(b, kk), L(kk, b + 1), L(kk * kk, b), L(1, n)].filter((x) => x !== L(1, n) || b === 1), (x) => m(x)), exp: t('x.sqrt.simp.exp', { n: m(n), k2: m(kk * kk), b: m(b), k: m(kk), r: m(ans) }) };
  };

  /* Factoriser */
  GEN.litFact = () => {
    const k = R(2, 9), a = R(1, 5), b = nz(-9, 9), e = P([k * a, k * b]), ans = `${k}(${P([a, b])})`;
    return { q: t('x.fact.q'), expr: m(e), kind: 'choice', ans, choices: mc(ans, [`${k}(${P([a, k * b])})`, `${k}(${P([a, -b])})`, `${k}(${P([k * a, b])})`, `${k}(${P([a, b + k])})`], (x) => m(x)), exp: t('x.fact.exp', { k: m(k), r: m(ans) }) };
  };

  /* Théorème de Pythagore */
  const triFig = (lab, o = {}) => svg(280, 140, `<polygon points="50,115 50,22 240,115" fill="#e0e7ff" stroke="#3730a3" stroke-width="2.5"/><rect x="50" y="103" width="12" height="12" fill="none" stroke="#3730a3"/>${txt(36, 125, 'A', { a: 'end' })}${txt(36, 22, 'B', { a: 'end' })}${txt(250, 126, 'C', { a: 'start' })}${txt(42, 72, lab.AB, { a: 'end', c: lab.AB === '?' ? '#dc2626' : '#334155' })}${txt(145, 134, lab.AC, { c: lab.AC === '?' ? '#dc2626' : '#334155' })}${txt(158, 60, lab.BC, { a: 'start', c: lab.BC === '?' ? '#dc2626' : '#334155' })}`);
  GEN.pyth = (p) => {
    const k = pick(p.kinds), [x, y, z] = pick(TRIPLES), legs = shuf([x, y]), [ab, ac] = legs;
    if (k === 'hyp') return { q: t('x.pyth.hyp.q'), vis: triFig({ AB: ab + ' cm', AC: ac + ' cm', BC: '?' }), kind: 'num', ans: z, exp: t('x.pyth.hyp.exp', { a: m(ab), b: m(ac), s: m(ab * ab + ac * ac), r: m(z) }) };
    return { q: t('x.pyth.side.q'), vis: triFig({ AB: ab + ' cm', AC: '?', BC: z + ' cm' }), kind: 'num', ans: ac, exp: t('x.pyth.side.exp', { c: m(z), a: m(ab), d: m(z * z - ab * ab), r: m(ac) }) };
  };
  GEN.pythRecip = () => {
    const [x, y, z] = pick(TRIPLES), good = pick([true, false]), zz = good ? z : z + pick([-1, 1]), sq = x * x + y * y;
    return { q: t('x.recip.q', { a: m(x), b: m(y), c: m(zz) }), kind: 'choice', ans: zz * zz === sq ? 'y' : 'n', choices: yesNo(), exp: t(zz * zz === sq ? 'x.recip.y' : 'x.recip.n', { c: m(zz), c2: m(zz * zz), a: m(x), b: m(y), s: m(sq) }) };
  };

  /* Théorème de Thalès */
  GEN.thales = (p) => {
    const k = pick(p.kinds), pr = pick([[2, 3], [3, 5], [2, 5], [3, 4], [1, 3], [4, 5], [2, 7]]), s = R(1, 4), u = R(1, 4), [a, b] = pr;
    const AM = a * s, AB = b * s, AN = a * u, AC = b * u, MN = a * R(2, 5), BC = (b * MN) / a;
    const f = svg(280, 140, `<polygon points="140,12 40,125 250,125" fill="#fef9c3" stroke="#854d0e" stroke-width="2.5"/><line x1="${140 - 100 * a / b}" y1="${12 + 113 * a / b}" x2="${140 + 110 * a / b}" y2="${12 + 113 * a / b}" stroke="#854d0e" stroke-width="2.5"/>${txt(140, 8, 'A')}${txt(30, 135, 'B')}${txt(262, 135, 'C')}${txt(140 - 100 * a / b - 10, 12 + 113 * a / b + 4, 'M')}${txt(140 + 110 * a / b + 12, 12 + 113 * a / b + 4, 'N')}`);
    if (k === 'ac') return { q: t('x.thales.ac', { AM: m('AM = ' + AM), AB: m('AB = ' + AB), AN: m('AN = ' + AN) }), vis: f, kind: 'num', ans: AC, exp: t('x.thales.ac.exp', { AM: m(AM), AB: m(AB), AN: m(AN), r: m(AC) }) };
    return { q: t('x.thales.mn', { AM: m('AM = ' + AM), AB: m('AB = ' + AB), BC: m('BC = ' + BC) }), vis: f, kind: 'num', ans: MN, exp: t('x.thales.mn.exp', { AM: m(AM), AB: m(AB), BC: m(BC), r: m(MN) }) };
  };

  /* Trigonométrie dans le triangle rectangle */
  GEN.trigo = (p) => {
    const k = pick(p.kinds), [x, y, z] = pick(TRIPLES.slice(0, 7)), [ab, ac] = shuf([x, y]);
    const f = (lab) => triFig(lab);
    if (k === 'cos' || k === 'sin' || k === 'tan') {
      const nu = { cos: ab, sin: ac, tan: ac }[k], de = { cos: z, sin: z, tan: ab }[k], ans = fracStr(nu, de), eqf = (q) => { const [n1, d1] = String(q).split('/').map(Number); return n1 * de === nu * (d1 || 1); };
      const cand = [fracStr(ac, z), fracStr(ab, z), fracStr(ac, ab), fracStr(ab, ac), fracStr(z, ab), fracStr(z, ac)].filter((q) => !eqf(q));
      return { q: t('x.trig.q.' + k), vis: f({ AB: ab + ' cm', AC: ac + ' cm', BC: z + ' cm' }), kind: 'choice', ans, choices: mc(ans, cand, fracLabel), exp: t('x.trig.exp.' + k, { r: fracLabel(ans) }) };
    }
    if (k === 'angle') { const o = pick([['cos', '0,5', 60], ['sin', '0,5', 30], ['tan', '1', 45]]); return num(t('x.trig.angle.q', { f: o[0], v: m(o[1]) }), '', o[2], t('x.trig.angle.exp', { f: o[0], v: m(o[1]), a: m(o[2]) })); }
    // calculer un côté à partir d'un rapport décimal exact
    const s = R(2, 6), [x1, y1, z1] = [3 * s, 4 * s, 5 * s], kind = pick(['cos', 'sin']);
    const ratio = kind === 'cos' ? 0.8 : 0.6, ans = kind === 'cos' ? y1 : x1;
    return num(t('x.trig.side.' + kind, { c: m(z1), r: m(fmt(ratio)) }), '', ans, t('x.trig.side.exp.' + kind, { c: m(z1), r: m(fmt(ratio)), a: m(ans) }));
  };

  /* Vitesse, distance, durée */
  GEN.speed = (p) => {
    const k = pick(p.kinds), v = pick([30, 40, 45, 50, 60, 72, 80, 90, 100, 120]), tt = pick([0.5, 1, 1.5, 2, 2.5, 3, 4]), d = round(v * tt);
    if (k === 'v') return num(t('x.speed.v', { d: m(fmt(d)), t: m(fmt(tt)) }), '', v, t('x.speed.v.exp', { d: m(fmt(d)), t: m(fmt(tt)), r: m(v) }));
    if (k === 'd') return num(t('x.speed.d', { v: m(v), t: m(fmt(tt)) }), '', d, t('x.speed.d.exp', { v: m(v), t: m(fmt(tt)), r: m(fmt(d)) }));
    return num(t('x.speed.t', { v: m(v), d: m(fmt(d)) }), '', tt, t('x.speed.t.exp', { v: m(v), d: m(fmt(d)), r: m(fmt(tt)) }));
  };

  /* Moyenne pondérée */
  GEN.wmean = () => {
    for (let g = 0; g < 500; g++) {
      const vals = shuf([6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18]).slice(0, 3).sort((a, b) => a - b), eff = [R(1, 6), R(1, 6), R(1, 6)];
      const tot = eff[0] + eff[1] + eff[2], sum = vals.reduce((a, v, i) => a + v * eff[i], 0), mean = sum / tot;
      if (!Number.isInteger(mean * 10)) continue;
      const cell = 'style="border:1px solid #cbd5e1;padding:4px 12px"', row = (a) => `<tr>${a.map((c, i) => `<td ${cell}>${i === 0 ? '<b>' + c + '</b>' : c}</td>`).join('')}</tr>`;
      const vis = `<table style="border-collapse:collapse;margin:6px 0">${row([t('x.wmean.note'), ...vals])}${row([t('x.wmean.eff'), ...eff])}</table>`;
      return { q: t('x.wmean.q'), vis, kind: 'num', ans: mean, exp: t('x.wmean.exp', { s: m(vals.map((v, i) => `${v} × ${eff[i]}`).join(' + ')), sum: m(sum), tot: m(tot), r: m(fmt(mean)) }) };
    }
  };
  GEN.probaCompl = () => { const pc = R(1, 19) * 5; return num(t('x.compl.q', { p: m(pc) }), '', 100 - pc, t('x.compl.exp', { p: m(pc), r: m(100 - pc) })); };

  /* ===================================================================== 3e */
  const gcdSteps = (a, b) => { const out = []; while (b) { out.push(`${a} = ${b} × ${Math.floor(a / b)} + ${a % b}`); [a, b] = [b, a % b]; } return out.join(' ; '); };

  GEN.gcdQ = () => {
    let g, p, q; do { g = R(2, 12); p = R(2, 12); q = R(2, 12); } while (p === q || gcd(p, q) !== 1);
    const a = g * Math.max(p, q), b = g * Math.min(p, q);
    return num(t('x.gcd.q', { a: m(a), b: m(b) }), '', g, t('x.gcd.exp', { steps: m(gcdSteps(a, b)), r: m(g) }));
  };
  GEN.primeFact = () => {
    const PR = [2, 3, 5, 7]; let f, n;
    do { f = PR.map((pp) => (R(0, 2) === 0 ? 0 : R(1, pp === 2 ? 3 : 2))); n = PR.reduce((a, pp, i) => a * Math.pow(pp, f[i]), 1); } while (n < 12 || n > 500 || f.filter((x) => x).length < 2);
    const lab = (ff) => PR.map((pp, i) => (ff[i] ? (ff[i] > 1 ? sup(pp, ff[i]) : String(pp)) : null)).filter(Boolean).join(' × ');
    const wr = [], tweak = (i, d) => { const g2 = f.slice(); g2[i] = Math.max(0, g2[i] + d); return g2; };
    f.forEach((x, i) => { if (x) { wr.push(lab(tweak(i, 1)), lab(tweak(i, -1))); } });
    const ans = lab(f);
    return { q: t('x.pf.q', { n: m(n) }), kind: 'choice', ans, choices: mc(ans, wr.filter((w) => w && w !== ans), (x) => m(x)), exp: t('x.pf.exp', { n: m(n), r: m(ans) }) };
  };
  GEN.idRem = (p) => {
    const k = pick(p.kinds), a = R(2, 9), A = a * a;
    if (k === 'sq+') { const ans = P([1, 2 * a, A]); return { q: t('x.dev.q'), expr: m(`(x + ${a})²`), kind: 'choice', ans, choices: mc(ans, [P([1, 0, A]), P([1, a, A]), P([1, 2 * a, 2 * a]), P([1, 2 * a, -A])], (x) => m(x)), exp: t('x.id.sqp.exp', { a: m(a), r: m(ans) }) }; }
    if (k === 'sq-') { const ans = P([1, -2 * a, A]); return { q: t('x.dev.q'), expr: m(`(x − ${a})²`), kind: 'choice', ans, choices: mc(ans, [P([1, 0, A]), P([1, 2 * a, A]), P([1, -2 * a, -A]), P([1, -a, A])], (x) => m(x)), exp: t('x.id.sqm.exp', { a: m(a), r: m(ans) }) }; }
    if (k === 'prod') { const ans = P([1, 0, -A]); return { q: t('x.dev.q'), expr: m(`(x + ${a})(x − ${a})`), kind: 'choice', ans, choices: mc(ans, [P([1, 0, A]), P([1, -2 * a, -A]), P([1, 2 * a, -A]), P([1, a, -a])], (x) => m(x)), exp: t('x.id.prod.exp', { a: m(a), a2: m(A), r: m(ans) }) }; }
    if (k === 'fsq') { const ans = `(x + ${a})²`; return { q: t('x.fact.q'), expr: m(P([1, 2 * a, A])), kind: 'choice', ans, choices: mc(ans, [`(x − ${a})²`, `(x + ${2 * a})²`, `(x + ${a})(x − ${a})`, `(x + ${A})²`], (x) => m(x)), exp: t('x.id.fsq.exp', { a: m(a), r: m(ans) }) }; }
    const ans = `(x − ${a})(x + ${a})`; return { q: t('x.fact.q'), expr: m(P([1, 0, -A])), kind: 'choice', ans, choices: mc(ans, [`(x − ${a})²`, `(x + ${a})²`, `(x − ${A})(x + ${A})`, `(x − ${a})(x − ${a})`], (x) => m(x)), exp: t('x.id.fdiff.exp', { a: m(a), a2: m(A), r: m(ans) }) };
  };
  GEN.prodNul = () => {
    let a, b; do { a = nz(-9, 9); b = nz(-9, 9); } while (a === b);
    const s1 = -a, s2 = -b, r = Math.min(s1, s2);
    return num(t('x.prodNul.q'), m(`(x ${plus(a)})(x ${plus(b)}) = 0`), r, t('x.prodNul.exp', { a: m(plus(a)), b: m(plus(b)), s1: m(fmt(s1)), s2: m(fmt(s2)), r: m(fmt(r)) }));
  };
  GEN.sys2 = () => {
    const x = nz(-6, 9), y = nz(-6, 9), ask = pick(['x', 'y']), type = R(1, 2);
    let e1, e2, exp;
    if (type === 1) { const s = x + y, d = x - y; e1 = `x + y = ${fmt(s)}`; e2 = `x − y = ${fmt(d)}`; exp = t('x.sys.exp1', { s: m(fmt(s)), d: m(fmt(d)), t2: m(fmt(s + d)), x: m(fmt(x)), y: m(fmt(y)) }); }
    else { const A = 2 * x + y, B = x + y; e1 = `2x + y = ${fmt(A)}`; e2 = `x + y = ${fmt(B)}`; exp = t('x.sys.exp2', { A: m(fmt(A)), B: m(fmt(B)), x: m(fmt(x)), y: m(fmt(y)) }); }
    return { q: t('x.sys.q.' + ask), expr: `<div>${m(e1)}</div><div>${m(e2)}</div>`, kind: 'num', ans: ask === 'x' ? x : y, exp };
  };
  GEN.fnImage = (p) => {
    const k = pick(p.kinds), a = nz(-6, 6), b = nz(-9, 9), x = nz(-6, 6);
    if (k === 'image') return num(t('x.fn.image', { f: m(P([a, b])), x: m(fmt(x)) }), '', a * x + b, t('x.fn.image.exp', { x: m(fmt(x)), sub: m(`${fmt(a)} × ${sgn(x)} ${plus(b)}`), r: m(fmt(a * x + b)) }));
    if (k === 'quad') { const a2 = nz(-3, 3), x2 = nz(-5, 5); return num(t('x.fn.image', { f: m(P([a2, 0, b])), x: m(fmt(x2)) }), '', a2 * x2 * x2 + b, t('x.fn.image.exp', { x: m(fmt(x2)), sub: m(`${fmt(a2)} × ${sgn(x2)}² ${plus(b)}`), r: m(fmt(a2 * x2 * x2 + b)) })); }
    const c = a * x + b;
    return num(t('x.fn.ante', { f: m(P([a, b])), c: m(fmt(c)) }), '', x, t('x.fn.ante.exp', { f: m(P([a, b])), c: m(fmt(c)), b: m(sgn(b)), a: m(fmt(a)), r: m(fmt(x)) }));
  };
  GEN.fnAff = (p) => {
    const k = pick(p.kinds), a = nz(-6, 6), x1 = R(1, 5), dx = R(1, 4), x2 = x1 + dx, b = nz(-9, 9);
    if (k === 'coef') return num(t('x.aff.coef', { x: m(x1), y: m(fmt(a * x1)) }), '', a, t('x.aff.coef.exp', { x: m(x1), y: m(fmt(a * x1)), r: m(fmt(a)) }));
    const y1 = a * x1 + b, y2 = a * x2 + b;
    if (k === 'slope') return num(t('x.aff.slope', { A: m(pair(x1, y1)), B: m(pair(x2, y2)) }), '', a, t('x.aff.slope.exp', { dy: m(`${fmt(y2)} − ${sgn(y1)} = ${fmt(y2 - y1)}`), dx: m(`${x2} − ${x1} = ${dx}`), r: m(fmt(a)) }));
    return num(t('x.aff.interc', { a: m(fmt(a)), A: m(pair(x1, y1)) }), '', b, t('x.aff.interc.exp', { y: m(fmt(y1)), a: m(fmt(a)), x: m(x1), r: m(fmt(b)) }));
  };
  GEN.ineq = () => {
    const a = nz(-7, 7), b = nz(-9, 9), x0 = nz(-6, 8), c = a * x0 + b, op = pick(['<', '≤', '>', '≥']);
    const flip = { '<': '>', '≤': '≥', '>': '<', '≥': '≤' }, op2 = a > 0 ? op : flip[op], upper = op2 === '<' || op2 === '≤';
    const r = op2 === '<' ? x0 - 1 : op2 === '>' ? x0 + 1 : x0;
    return num(t(upper ? 'x.ineq.max' : 'x.ineq.min'), m(`${P([a, b])} ${op} ${fmt(c)}`), r, t('x.ineq.exp', { d: m(`${fmt(a)}x ${op} ${fmt(c - b)}`), a: m(fmt(a)), fl: t(a > 0 ? 'x.ineq.same' : 'x.ineq.flip'), s: m(`x ${op2} ${fmt(x0)}`), r: m(fmt(r)) }));
  };
  GEN.homothety = (p) => {
    const k = pick(p.kinds), f = pick([2, 3, 4, 5, 0.5]);
    if (k === 'area') { const A = R(2, 30), r = round(A * f * f, 4); return num(t('x.homo.area', { k: m(fmt(f)), A: m(A) }), '', r, t('x.homo.area.exp', { k: m(fmt(f)), A: m(A), k2: m(fmt(round(f * f, 4))), r: m(fmt(r)) })); }
    const V = R(2, 20), r = round(V * f * f * f, 4); return num(t('x.homo.vol', { k: m(fmt(f)), V: m(V) }), '', r, t('x.homo.vol.exp', { k: m(fmt(f)), V: m(V), k3: m(fmt(round(f * f * f, 4))), r: m(fmt(r)) }));
  };
  GEN.quart = (p) => {
    const k = pick(p.kinds), n = R(7, 11), arr = shuf(Array.from({ length: 30 }, (_, i) => i + 1)).slice(0, n), s = arr.slice().sort((a, b) => a - b);
    const rank = k === 'q1' ? Math.ceil(n / 4) : Math.ceil((3 * n) / 4), val = s[rank - 1];
    return num(t('x.quart.q.' + k), m(arr.join(' ; ')), val, t('x.quart.exp.' + k, { s: m(s.join(' ; ')), n: m(n), x: m(fmt(k === 'q1' ? n / 4 : (3 * n) / 4)), k: m(rank), r: m(val) }));
  };
  GEN.probaTwo = () => {
    const r = R(1, 4), b = R(1, 4), n = r + b, ans = fracStr(r * r, n * n), eqf = (q) => { const [x, y] = String(q).split('/').map(Number); return x * n * n === r * r * (y || 1); };
    const wr = [fracStr(r, n), fracStr(2 * r, n), fracStr(r * r, n), fracStr(2 * r * b, n * n), fracStr(r * b, n * n)].filter((q) => !eqf(q));
    const vis = `<div class="emojis">${'🔴'.repeat(r)}${'🔵'.repeat(b)}</div>`;
    return { q: t('x.two.q'), vis, kind: 'choice', ans, choices: mc(ans, wr, fracLabel), exp: t('x.two.exp', { r: m(r), n: m(n), a: fracLabel(ans) }) };
  };
  GEN.polyAngle = (p) => {
    const k = pick(p.kinds), n = pick([5, 6, 8, 9, 10, 12]), c = 360 / n;
    if (k === 'central') return num(t('x.poly.central', { n: m(n) }), '', c, t('x.poly.central.exp', { n: m(n), r: m(c) }));
    return num(t('x.poly.inner', { n: m(n) }), '', 180 - c, t('x.poly.inner.exp', { n: m(n), c: m(c), r: m(180 - c) }));
  };

  /* ===================================================================== 2nde */
  const iv = (a, b, lo, hi) => `${lo ? '[' : ']'}${fmt(a)} ; ${fmt(b)}${hi ? ']' : '['}`;

  GEN.interval = (p) => {
    const k = pick(p.kinds), a = R(-6, 4), b = a + R(2, 7), lo = pick([true, false]), hi = pick([true, false]);
    const ineq = `${fmt(a)} ${lo ? '≤' : '<'} x ${hi ? '≤' : '<'} ${fmt(b)}`;
    if (k === 'write') {
      const ans = iv(a, b, lo, hi);
      return { q: t('x.int.write.q'), expr: m(ineq), kind: 'choice', ans, choices: mc(ans, [iv(a, b, !lo, hi), iv(a, b, lo, !hi), iv(a, b, !lo, !hi)], (x) => m(x)), exp: t('x.int.write.exp', { r: m(ans) }) };
    }
    const v = pick([a, b, a + 1, b + 1, a - 1, round((a + b) / 2 + 0.5, 1)]), ok = (v > a || (lo && v === a)) && (v < b || (hi && v === b));
    return { q: t('x.int.in.q', { v: m(fmt(v)) }), expr: m(iv(a, b, lo, hi)), kind: 'choice', ans: ok ? 'y' : 'n', choices: yesNo(), exp: t(ok ? 'x.int.y' : 'x.int.n', { I: m(iv(a, b, lo, hi)), c: m(ineq), v: m(fmt(v)) }) };
  };
  GEN.absVal = (p) => {
    const k = pick(p.kinds);
    if (k === 'val') { const a = nz(-9, 9), b = R(-9, 9), r = Math.abs(a - b); return num(t('x.calc'), m(`|${fmt(a)} − ${sgn(b)}| = ${box}`), r, t('x.abs.val.exp', { d: m(fmt(a - b)), r: m(r) })); }
    const a = nz(-8, 8), r = R(1, 7); return num(t('x.abs.eq.q'), m(`|x ${plus(-a)}| = ${r}`), a + r, t('x.abs.eq.exp', { a: m(fmt(a)), r: m(r), s1: m(fmt(a - r)), s2: m(fmt(a + r)) }));
  };
  GEN.sqEq = () => { const k = R(2, 15); return num(t('x.sqEq.q'), m(`x² = ${k * k}`), k, t('x.sqEq.exp', { n: m(k * k), k: m(k) })); };
  GEN.pcSucc = () => {
    const p1 = pick([10, 20, 25, 50]), p2 = pick([10, 20, 25, 50]), up = pick([true, false]), P0 = pick([100, 200, 400, 80, 50]);
    const c1 = round(1 + p1 / 100, 3), c2 = up ? round(1 + p2 / 100, 3) : round(1 - p2 / 100, 3), c = round(c1 * c2, 5), r = round(P0 * c, 4);
    return num(t(up ? 'x.succ.up' : 'x.succ.down', { P: m(P0), p1: m(p1), p2: m(p2) }), '', r, t('x.succ.exp', { c1: m(fmt(c1)), c2: m(fmt(c2)), c: m(fmt(c)), P: m(P0), r: m(fmt(r)) }));
  };
  GEN.seqTerm = (p) => {
    const k = pick(p.kinds), U = (n) => `u<sub>${n}</sub>`;
    if (k === 'explicit') {
      const a = nz(-5, 6), b = nz(-8, 9), n = R(3, 9), r = a * n + b;
      return num(t('x.seq.exp.q', { n: m(n) }), m(`${U('n')} = ${P([a, b], 'n')}`), r, t('x.seq.exp.exp', { n: m(n), sub: m(`${fmt(a)} × ${n} ${plus(b)}`), r: m(fmt(r)) }));
    }
    const a = pick([2, 3, -1, -2, 2]), b = nz(-5, 7), u0 = nz(-4, 6), n = R(2, 4);
    let u = u0; const steps = [];
    for (let i = 1; i <= n; i++) { const nx = a * u + b; steps.push(`${U(i)} = ${fmt(a)} × ${sgn(u)} ${plus(b)} = ${fmt(nx)}`); u = nx; }
    return num(t('x.seq.rec.q', { n: m(n) }), m(`${U(0)} = ${fmt(u0)}   ;   ${U('n+1')} = ${fmt(a)}${U('n')} ${plus(b)}`), u, t('x.seq.rec.exp', { steps: m(steps.join(' ; ')) }));
  };
  GEN.affSens = () => {
    const a = nz(-7, 7), b = nz(-9, 9), ans = a > 0 ? 'inc' : 'dec';
    return { q: t('x.sens.q'), expr: m(`f(x) = ${P([a, b])}`), kind: 'choice', ans, choices: [{ v: 'inc', label: t('x.inc') }, { v: 'dec', label: t('x.dec') }, { v: 'const', label: t('x.const') }], exp: t('x.sens.exp', { a: m(fmt(a)), r: t(a > 0 ? 'x.inc' : 'x.dec') }) };
  };
  const pt = (p, q) => `${p}${q}`;
  GEN.midpoint = (p) => {
    const k = pick(p.kinds), a = R(-8, 8), b = R(-8, 8), c = a + 2 * R(-5, 5), d = b + 2 * R(-5, 5);
    const A = m(pair(a, b)), B = m(pair(c, d));
    if (k === 'x') return num(t('x.mid.q.x', { A, B }), '', (a + c) / 2, t('x.mid.exp.x', { a: m(fmt(a)), c: m(sgn(c)), r: m(fmt((a + c) / 2)) }));
    return num(t('x.mid.q.y', { A, B }), '', (b + d) / 2, t('x.mid.exp.y', { b: m(fmt(b)), d: m(sgn(d)), r: m(fmt((b + d) / 2)) }));
  };
  GEN.dist = () => {
    const [x, y, z] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]), a = R(-6, 6), b = R(-6, 6), sx = pick([-1, 1]), sy = pick([-1, 1]);
    const c = a + sx * x, d = b + sy * y;
    return num(t('x.dist.q', { A: m(pair(a, b)), B: m(pair(c, d)) }), '', z, t('x.dist.exp', { dx: m(fmt(c - a)), dy: m(fmt(d - b)), s: m(x * x + y * y), r: m(z) }));
  };
  GEN.vecCoord = () => {
    let a, b, c, d; do { a = R(-6, 6); b = R(-6, 6); c = R(-6, 6); d = R(-6, 6); } while (a === c && b === d);
    const ans = pair(c - a, d - b), wr = [pair(a - c, b - d), pair(a + c, b + d), pair(c - a, b - d), pair(d - b, c - a), pair(c - a, d + b)].filter((s) => s !== ans);
    return { q: t('x.vec.q', { A: m(pair(a, b)), B: m(pair(c, d)) }), kind: 'choice', ans, choices: mc(ans, wr, (x) => m(x)), exp: t('x.vec.exp', { dx: m(`${fmt(c)} − ${sgn(a)} = ${fmt(c - a)}`), dy: m(`${fmt(d)} − ${sgn(b)} = ${fmt(d - b)}`), r: m(ans) }) };
  };
  GEN.vecNorm = () => {
    const [x, y, z] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]), a = pick([-1, 1]) * x, b = pick([-1, 1]) * y;
    return num(t('x.norm.q', { u: m(`u${pair(a, b)}`) }), '', z, t('x.norm.exp', { a: m(fmt(a)), b: m(fmt(b)), s: m(x * x + y * y), r: m(z) }));
  };
  GEN.collinear = () => {
    const a = nz(-5, 5), b = nz(-5, 5), k = pick([-3, -2, 2, 3]), good = pick([true, false]);
    const c = a * k, d = good ? b * k : b * k + pick([-2, -1, 1, 2]), det = a * d - b * c;
    return { q: t('x.col.q', { u: m(`u${pair(a, b)}`), v: m(`v${pair(c, d)}`) }), kind: 'choice', ans: det === 0 ? 'y' : 'n', choices: yesNo(), exp: t(det === 0 ? 'x.col.y' : 'x.col.n', { p: m(`${fmt(a)} × ${sgn(d)}`), q: m(`${fmt(b)} × ${sgn(c)}`), r: m(fmt(det)) }) };
  };
  GEN.parallelogram = () => {
    const a = R(-5, 5), b = R(-5, 5), c = R(-5, 5), d = R(-5, 5), e = R(-5, 5), f = R(-5, 5), ans = pair(a + e - c, b + f - d);
    const wr = [pair(a + c - e, b + d - f), pair(c + e - a, d + f - b), pair(a + c + e, b + d + f), pair(a - c + e, b - d - f)].filter((s) => s !== ans);
    return { q: t('x.para.q', { A: m(pair(a, b)), B: m(pair(c, d)), C: m(pair(e, f)) }), kind: 'choice', ans, choices: mc(ans, wr, (x) => m(x)), exp: t('x.para.exp', { r: m(ans) }) };
  };
  GEN.lineEq = () => {
    const a = nz(-4, 4), b = nz(-6, 6), x1 = R(-3, 2), x2 = x1 + R(1, 3), y1 = a * x1 + b, y2 = a * x2 + b, L = (aa, bb) => `y = ${P([aa, bb])}`, ans = L(a, b);
    return { q: t('x.line.q', { A: m(pair(x1, y1)), B: m(pair(x2, y2)) }), kind: 'choice', ans, choices: mc(ans, [L(a, -b), L(-a, b), L(b, a), L(a, y1), L(-a, -b)], (x) => m(x)), exp: t('x.line.exp', { a: m(`(${fmt(y2)} − ${sgn(y1)}) ÷ (${x2} − ${sgn(x1)}) = ${fmt(a)}`), b: m(`${fmt(y1)} − ${fmt(a)} × ${sgn(x1)} = ${fmt(b)}`), r: m(ans) }) };
  };
  GEN.probaUnion = () => {
    const pa = R(3, 7) / 10, pb = R(3, 7) / 10, pi = R(1, Math.floor(Math.min(pa, pb) * 10) - 1) / 10, r = round(pa + pb - pi, 2);
    return num(t('x.union.q', { a: m(fmt(pa)), b: m(fmt(pb)), i: m(fmt(pi)) }), '', r, t('x.union.exp', { a: m(fmt(pa)), b: m(fmt(pb)), i: m(fmt(pi)), r: m(fmt(r)) }));
  };

  /* ===================================================================== 1re */
  GEN.quad = (p) => {
    const k = pick(p.kinds);
    if (k === 'disc') {
      const a = nz(-4, 4), b = nz(-8, 8), c = nz(-6, 6), D = b * b - 4 * a * c;
      return num(t('x.disc.q'), m(`${P([a, b, c])} = 0`), D, t('x.disc.exp', { sub: m(`${sgn(b)}² − 4 × ${sgn(a)} × ${sgn(c)}`), r: m(fmt(D)) }));
    }
    if (k === 'roots') {
      let p1, q1; do { p1 = R(-6, 6); q1 = R(-6, 6); } while (p1 === q1);
      const a = pick([1, 1, 2, -1, 3]), b = -a * (p1 + q1), c = a * p1 * q1, D = b * b - 4 * a * c, lo = Math.min(p1, q1), hi = Math.max(p1, q1);
      return num(t('x.qr.q'), m(`${P([a, b, c])} = 0`), lo, t('x.qr.exp', { D: m(fmt(D)), s: m(Math.sqrt(D)), x1: m(fmt(lo)), x2: m(fmt(hi)), r: m(fmt(lo)) }));
    }
    const a = nz(-3, 3), x0 = nz(-4, 4), b = -2 * a * x0, c = nz(-6, 6);
    return num(t('x.qv.q'), m(`f(x) = ${P([a, b, c])}`), x0, t('x.qv.exp', { b: m(sgn(b)), a: m(sgn(a)), r: m(fmt(x0)) }));
  };
  const polyF = () => { const a = nz(-3, 3), b = nz(-5, 5), c = nz(-6, 6), d = nz(-6, 6); return [a, b, c, d]; };
  GEN.deriv = (p) => {
    const k = pick(p.kinds), [a, b, c, d] = polyF(), f = P([a, b, c, d]);
    if (k === 'poly') {
      const ans = P([3 * a, 2 * b, c]);
      return { q: t('x.deriv.q'), expr: m(`f(x) = ${f}`), kind: 'choice', ans, choices: mc(ans, [P([3 * a, b, c]), P([a, b, c]), P([3 * a, 2 * b, c + d]), P([3 * a, 2 * b, c, d]), P([3 * a, 2 * b, 0])], (x) => m(x)), exp: t('x.deriv.exp', { r: m(ans) }) };
    }
    if (k === 'at') {
      const x = nz(-3, 3), r = 3 * a * x * x + 2 * b * x + c;
      return num(t('x.dat.q', { x: m(fmt(x)) }), m(`f(x) = ${f}`), r, t('x.dat.exp', { d: m(P([3 * a, 2 * b, c])), x: m(fmt(x)), sub: m(`${fmt(3 * a)} × ${sgn(x)}² ${plus(2 * b)} × ${sgn(x)} ${plus(c)}`), r: m(fmt(r)) }));
    }
    // tangente en x = k de f(x) = ax² + bx + c
    const a2 = nz(-3, 3), b2 = nz(-5, 5), c2 = nz(-6, 6), x = nz(-3, 3), mm = 2 * a2 * x + b2, y0 = a2 * x * x + b2 * x + c2, pp = y0 - mm * x, L = (u, v) => `y = ${P([u, v])}`, ans = L(mm, pp);
    const wr = [L(mm, y0), L(-mm, pp), L(mm, -pp), L(y0, mm), L(mm, pp + mm), L(mm + 1, pp), L(mm, pp + 1), L(mm - 1, pp - 1)].filter((z) => z !== ans);
    return { q: t('x.tan.q', { x: m(fmt(x)) }), expr: m(`f(x) = ${P([a2, b2, c2])}`), kind: 'choice', ans, choices: mc(ans, wr, (z) => m(z)), exp: t('x.tan.exp', { y0: m(fmt(y0)), m: m(fmt(mm)), x: m(fmt(x)), xm: m(x < 0 ? `x + ${fmt(-x)}` : `x − ${x}`), r: m(ans) }) };
  };
  GEN.derivZero = (p) => {
    const a = nz(-3, 3), x0 = nz(-4, 4), b = -2 * a * x0, c = nz(-6, 6);
    if (p && p.sens) {
      const right = pick([true, false]), lo = right ? x0 + R(1, 2) : x0 - R(3, 4), hi = lo + R(1, 2), pos = right ? a > 0 : a < 0;
      return { q: t('x.dsens.q', { lo: m(fmt(lo)), hi: m(fmt(hi)) }), expr: m(`f(x) = ${P([a, b, c])}`), kind: 'choice', ans: pos ? 'inc' : 'dec', choices: [{ v: 'inc', label: t('x.inc') }, { v: 'dec', label: t('x.dec') }], exp: t(pos ? 'x.dsens.pos' : 'x.dsens.neg', { d: m(P([2 * a, b])), x0: m(fmt(x0)), lo: m(fmt(lo)), hi: m(fmt(hi)) }) };
    }
    return num(t('x.dz.q'), m(`f(x) = ${P([a, b, c])}`), x0, t('x.dz.exp', { d: m(P([2 * a, b])), b: m(sgn(b)), a: m(fmt(2 * a)), r: m(fmt(x0)) }));
  };
  GEN.seqSpec = (p) => {
    const k = pick(p.kinds), U = (n) => `u<sub>${n}</sub>`;
    if (k === 'arith') { const u0 = nz(-8, 10), r = nz(-5, 7), n = R(5, 15), v = u0 + n * r; return num(t('x.sq.arith', { u0: m(fmt(u0)), r: m(fmt(r)), U: m(U(n)) }), '', v, t('x.sq.arith.exp', { n: m(n), sub: m(`${fmt(u0)} + ${n} × ${sgn(r)}`), r: m(fmt(v)) })); }
    if (k === 'geo') { const u0 = nz(-4, 5), q = pick([2, 3, -2, 5, -3]), n = R(2, 5), v = u0 * Math.pow(q, n); return num(t('x.sq.geo', { u0: m(fmt(u0)), q: m(fmt(q)), U: m(U(n)) }), '', v, t('x.sq.geo.exp', { n: m(n), sub: m(`${fmt(u0)} × ${sgn(q)}<sup>${n}</sup>`), r: m(fmt(v)) })); }
    if (k === 'raison') { const r = nz(-6, 8), i = R(2, 6), x = nz(-10, 20), j = i + 2; return num(t('x.sq.raison', { Ui: m(U(i)), x: m(fmt(x)), Uj: m(U(j)), y: m(fmt(x + 2 * r)) }), '', r, t('x.sq.raison.exp', { Ui: m(U(i)), Uj: m(U(j)), y: m(fmt(x + 2 * r)), x: m(sgn(x)), r: m(fmt(r)) })); }
    const u0 = nz(-5, 8), r = nz(-4, 6), n = R(3, 12), tot = ((n + 1) * (2 * u0 + n * r)) / 2, un = u0 + n * r;
    return num(t('x.sq.sum', { u0: m(fmt(u0)), r: m(fmt(r)), U: m(U(n)) }), '', tot, t('x.sq.sum.exp', { n1: m(n + 1), un: m(fmt(un)), u0: m(fmt(u0)), r: m(fmt(tot)) }));
  };
  const ANG = [[0, 0], [1, 6], [1, 4], [1, 3], [1, 2]]; // k·π/d
  const angLab = (nn, d) => (nn === 0 ? '0' : d === 1 ? (nn === 1 ? 'π' : `${nn}π`) : frac(nn === 1 ? 'π' : `${nn}π`, d));
  GEN.radDeg = (p) => {
    const k = pick(p.kinds);
    if (k === 'toRad') {
      const degs = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330], deg = pick(degs), lab = (dg) => { const g = gcd(dg, 180); return angLab(dg / g, 180 / g); };
      return { q: t('x.rad.q1', { d: m(deg) }), kind: 'choice', ans: deg, choices: mc(deg, shuf(degs).filter((z) => z !== deg).slice(0, 5), lab), exp: t('x.rad.exp1', { d: m(deg), r: lab(deg) }) };
    }
    const dens = [[1, 6, 30], [1, 4, 45], [1, 3, 60], [1, 2, 90], [2, 3, 120], [3, 4, 135], [5, 6, 150], [1, 1, 180], [3, 2, 270]], [nn, d, deg] = pick(dens);
    return num(t('x.rad.q2', { a: angLab(nn, d) }), '', deg, t('x.rad.exp2', { a: angLab(nn, d), r: m(deg) }));
  };
  GEN.trigVal = (p) => {
    const k = pick(p.kinds), i = R(0, 4), VAL = { cos: [['1'], ['√3', 2], ['√2', 2], ['1', 2], ['0']], sin: [['0'], ['1', 2], ['√2', 2], ['√3', 2], ['1']] };
    const lab = (v) => (v.length === 1 ? m(v[0]) : frac(v[0], v[1])), key = (v) => v.join('/'), ans = key(VAL[k][i]);
    const pool = [['0'], ['1'], ['1', 2], ['√2', 2], ['√3', 2]];
    return { q: t('x.tv.q.' + k, { a: angLab(...ANG[i]) }), kind: 'choice', ans, choices: mc(ans, pool.map(key).filter((z) => z !== ans), (z) => lab(z.split('/').map((x, j) => (j ? Number(x) : x)))), exp: t('x.tv.exp', { f: k, a: angLab(...ANG[i]), r: lab(VAL[k][i]) }) };
  };
  GEN.condProba = (p) => {
    const k = pick(p.kinds);
    if (k === 'cond') { const pa = R(2, 8) / 10, c = R(1, 9) / 10, pi = round(pa * c, 2); return num(t('x.cond.q', { a: m(fmt(pa)), i: m(fmt(pi)) }), '', c, t('x.cond.exp', { i: m(fmt(pi)), a: m(fmt(pa)), r: m(fmt(c)) })); }
    const pa = R(2, 8) / 10, b1 = R(1, 9) / 10, b2 = R(1, 9) / 10, r = round(pa * b1 + (1 - pa) * b2, 2);
    return num(t('x.total.q', { a: m(fmt(pa)), b1: m(fmt(b1)), b2: m(fmt(b2)) }), '', r, t('x.total.exp', { a: m(fmt(pa)), na: m(fmt(round(1 - pa, 2))), b1: m(fmt(b1)), b2: m(fmt(b2)), r: m(fmt(r)) }));
  };
  GEN.expect = () => {
    const vals = shuf([-4, -2, 0, 1, 2, 3, 5, 8, 10]).slice(0, 3).sort((a, b) => a - b), p1 = R(1, 6), p2 = R(1, 8 - p1), pr = [p1, p2, 10 - p1 - p2].map((z) => z / 10);
    const E = round(vals.reduce((a, v, i) => a + v * pr[i], 0), 3), cell = 'style="border:1px solid #cbd5e1;padding:4px 12px"', row = (a) => `<tr>${a.map((c, i) => `<td ${cell}>${i === 0 ? '<b>' + c + '</b>' : c}</td>`).join('')}</tr>`;
    const vis = `<table style="border-collapse:collapse;margin:6px 0">${row([t('x.expect.x'), ...vals.map(fmt)])}${row([t('x.expect.p'), ...pr.map(fmt)])}</table>`;
    return { q: t('x.expect.q'), vis, kind: 'num', ans: E, exp: t('x.expect.exp', { s: m(vals.map((v, i) => `${sgn(v)} × ${fmt(pr[i])}`).join(' + ')), r: m(fmt(E)) }) };
  };
  GEN.dot = (p) => {
    const k = pick(p.kinds), a = nz(-5, 5), b = nz(-5, 5);
    if (k === 'prod') { const c = nz(-5, 5), d = nz(-5, 5), r = a * c + b * d; return num(t('x.dot.q', { u: m(`u${pair(a, b)}`), v: m(`v${pair(c, d)}`) }), '', r, t('x.dot.exp', { sub: m(`${fmt(a)} × ${sgn(c)} + ${sgn(b)} × ${sgn(d)}`), r: m(fmt(r)) })); }
    const kk = pick([-2, -1, 1, 2, 3]), good = pick([true, false]), c = b * kk, d = good ? -a * kk : -a * kk + pick([-2, -1, 1, 2]), r = a * c + b * d;
    return { q: t('x.ortho.q', { u: m(`u${pair(a, b)}`), v: m(`v${pair(c, d)}`) }), kind: 'choice', ans: r === 0 ? 'y' : 'n', choices: yesNo(), exp: t(r === 0 ? 'x.ortho.y' : 'x.ortho.n', { sub: m(`${fmt(a)} × ${sgn(c)} + ${sgn(b)} × ${sgn(d)}`), r: m(fmt(r)) }) };
  };
  GEN.expPow = (p) => {
    const k = pick(p.kinds), a = R(-5, 7), b = R(2, 6), e = (x) => sup('e', fmt(x));
    if (k === 'prod') return num(t('x.pow.rule'), m(`${e(a)} × ${e(b)} = ${sup('e', box)}`), a + b, t('x.expo.prod', { a: m(fmt(a)), b: m(fmt(b)), r: m(fmt(a + b)) }));
    if (k === 'quot') return num(t('x.pow.rule'), m(`${e(a)} ÷ ${e(b)} = ${sup('e', box)}`), a - b, t('x.expo.quot', { a: m(fmt(a)), b: m(fmt(b)), r: m(fmt(a - b)) }));
    const a2 = R(2, 5), b2 = R(2, 4); return num(t('x.pow.rule'), m(`(${e(a2)})<sup>${b2}</sup> = ${sup('e', box)}`), a2 * b2, t('x.expo.pow', { a: m(a2), b: m(b2), r: m(a2 * b2) }));
  };

  /* ===================================================================== Terminale */
  const INF = '+∞', NINF = '−∞';
  GEN.limit = (p) => {
    const k = pick(p.kinds);
    if (k === 'rat') {
      const a = nz(-6, 6), b = nz(-6, 6), c = nz(-6, 6), d = R(1, 5), e = nz(-6, 6), f = nz(-6, 6), ans = fracStr(a, d);
      const eqf = (z) => { const [x, y] = String(z).split('/').map(Number); return x * d === a * (y || 1); };
      const wr = [fracStr(b, e), String(a), fracStr(d, a), '0', fracStr(a + b, d + e), 'INF'].filter((z) => !eqf(z));
      return { q: t('x.lim.rat.q'), expr: m(`f(x) = (${P([a, b, c])}) ÷ (${P([d, e, f])})`), kind: 'choice', ans, choices: mc(ans, wr, (z) => (z === 'INF' ? m(INF) : fracLabel(z))), exp: t('x.lim.rat.exp', { a: m(fmt(a)), d: m(fmt(d)), r: fracLabel(ans) }) };
    }
    if (k === 'poly') {
      const n = pick([2, 3]), a = nz(-4, 4), cs = [a, nz(-5, 5), nz(-5, 5), nz(-5, 5)].slice(0, n + 1), ans = a > 0 ? INF : NINF;
      return { q: t('x.lim.poly.q'), expr: m(`f(x) = ${P(cs)}`), kind: 'choice', ans, choices: mc(ans, [a > 0 ? NINF : INF, '0', String(a)], (z) => m(z.replace('-', '−'))), exp: t('x.lim.poly.exp', { t: m(P([a, ...Array(n).fill(0)])), r: m(ans) }) };
    }
    const q = pick([0.5, 0.8, 0.25, -0.5, 2, 3, 1.5]), ans = Math.abs(q) < 1 ? '0' : INF;
    return { q: t('x.lim.geo.q'), expr: m(`u<sub>n</sub> = ${fmt(q)}<sup>n</sup>`), kind: 'choice', ans, choices: mc(ans, ['0', '1', INF, NINF], (z) => m(z)), exp: t(Math.abs(q) < 1 ? 'x.lim.geo.exp0' : 'x.lim.geo.expinf', { q: m(fmt(q)) }) };
  };
  GEN.deriv2 = (p) => {
    const k = pick(p.kinds);
    if (k === 'pow') {
      const n = R(2, 4), a = nz(-3, 3), b = nz(-5, 5), base = P([a, b]), L = (c, e) => `${fmt(c)}(${base})${e === 1 ? '' : `<sup>${e}</sup>`}`, ans = L(n * a, n - 1);
      return { q: t('x.d2.q'), expr: m(`f(x) = (${base})<sup>${n}</sup>`), kind: 'choice', ans, choices: mc(ans, [L(n, n - 1), L(n * a, n), L(a, n - 1), L(n * a, n + 1)], (z) => m(z)), exp: t('x.d2.pow.exp', { n: m(n), a: m(fmt(a)), r: m(ans) }) };
    }
    if (k === 'exp') {
      const a = nz(-4, 4), b = nz(-5, 5), ex = P([a, b]), E = (c) => `${c === 1 ? '' : fmt(c)}e<sup>${ex}</sup>`, ans = E(a);
      return { q: t('x.d2.q'), expr: m(`f(x) = e<sup>${ex}</sup>`), kind: 'choice', ans, choices: mc(ans, [E(1), E(-a), `${ex}e<sup>${ex}</sup>`, E(a * a)], (z) => m(z)), exp: t('x.d2.exp.exp', { a: m(fmt(a)), r: m(ans) }) };
    }
    const a = nz(-4, 4), b = nz(-5, 5), ax = P([a, b]), key = (nn, dd) => `${nn}|${dd}`, lab = (z) => { const [x, y] = z.split('|'); return frac(x, y); }, ans = key(a, ax);
    return { q: t('x.d2.q'), expr: m(`f(x) = ln(${ax})`), kind: 'choice', ans, choices: mc(ans, [key(1, ax), key(ax, a), key(a, 'x'), key(-a, ax)], lab), exp: t('x.d2.ln.exp', { a: m(fmt(a)), ax: m(ax) }) };
  };
  GEN.primit = (p) => {
    const kk = nz(-3, 3), j = nz(-4, 4), c = nz(-6, 6), a = 3 * kk, b = 2 * j;
    if (p && p.integral) {
      const lo = R(0, 2), hi = lo + R(1, 3), F = (x) => kk * x ** 3 + j * x ** 2 + c * x, r = F(hi) - F(lo);
      return num(t('x.integ.q'), m(`∫<sub>${lo}</sub><sup>${hi}</sup> (${P([a, b, c])}) dx`), r, t('x.integ.exp', { F: m(`${P([kk, j, c, 0])}`), hi: m(hi), lo: m(lo), Fh: m(fmt(F(hi))), Fl: m(fmt(F(lo))), r: m(fmt(r)) }));
    }
    const ans = P([kk, j, c, 0]);
    return { q: t('x.prim.q'), expr: m(`f(x) = ${P([a, b, c])}`), kind: 'choice', ans, choices: mc(ans, [P([a, b, c, 0]), P([kk, b, c, 0]), P([a, j, c, 0]), P([kk, j, 0, 0]), P([kk, j, c, c])], (z) => m(z)), exp: t('x.prim.exp', { r: m(ans) }) };
  };
  GEN.lnRule = (p) => {
    const k = pick(p.kinds);
    if (k === 'sum') { const a = R(2, 9), b = R(2, 9); return num(t('x.ln.q'), m(`ln ${a} + ln ${b} = ln(${box})`), a * b, t('x.ln.sum.exp', { a: m(a), b: m(b), r: m(a * b) })); }
    if (k === 'diff') { const b = R(2, 5), q = R(2, 6); return num(t('x.ln.q'), m(`ln ${b * q} − ln ${b} = ln(${box})`), q, t('x.ln.diff.exp', { a: m(b * q), b: m(b), r: m(q) })); }
    if (k === 'pow') { const a = R(2, 5), n = R(2, 3); return num(t('x.ln.q'), m(`${n} ln ${a} = ln(${box})`), a ** n, t('x.ln.pow.exp', { n: m(n), a: m(a), r: m(a ** n) })); }
    const kk = nz(-5, 8); return num(t('x.ln.q2'), m(`ln(e<sup>${fmt(kk)}</sup>) = ${box}`), kk, t('x.ln.exp.exp', { k: m(fmt(kk)) }));
  };
  GEN.expEq = (p) => {
    const k = pick(p.kinds);
    if (k === 'exp') { const a = nz(-4, 4), b = nz(-6, 6), x = nz(-4, 5), c = a * x + b; return num(t('x.solve'), m(`e<sup>${P([a, b])}</sup> = e<sup>${fmt(c)}</sup>`), x, t('x.eqexp.exp', { l: m(P([a, b])), c: m(fmt(c)), b: m(sgn(b)), a: m(fmt(a)), r: m(fmt(x)) })); }
    let a, b, x, c; do { a = R(1, 4); b = nz(-6, 6); x = nz(-3, 6); c = a * x + b; } while (c <= 0 || a * x + b <= 0);
    return num(t('x.solve'), m(`ln(${P([a, b])}) = ln(${c})`), x, t('x.eqln.exp', { l: m(P([a, b])), c: m(c), b: m(sgn(b)), a: m(a), r: m(fmt(x)) }));
  };
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
  GEN.comb = (p) => {
    const k = pick(p.kinds);
    if (k === 'fact') { const n = R(3, 7); return num(t('x.comb.fact', { n: m(n) }), '', fact(n), t('x.comb.fact.exp', { n: m(n), e: m(Array.from({ length: n }, (_, i) => n - i).join(' × ')), r: m(fact(n)) })); }
    if (k === 'arr') { const n = R(4, 8), kk = R(2, 3), r = fact(n) / fact(n - kk); return num(t('x.comb.arr', { n: m(n), k: m(kk) }), '', r, t('x.comb.arr.exp', { e: m(Array.from({ length: kk }, (_, i) => n - i).join(' × ')), r: m(r) })); }
    if (k === 'binom') { const n = R(4, 9), kk = R(2, 3), r = fact(n) / (fact(kk) * fact(n - kk)); return num(t('x.comb.binom', { n: m(n), k: m(kk) }), '', r, t('x.comb.binom.exp', { n: m(n), k: m(kk), e: m(Array.from({ length: kk }, (_, i) => n - i).join(' × ')), kf: m(fact(kk)), r: m(r) })); }
    const n = R(2, 5), kk = R(2, 4); return num(t('x.comb.list', { n: m(n), k: m(kk) }), '', n ** kk, t('x.comb.list.exp', { e: m(Array(kk).fill(n).join(' × ')), r: m(n ** kk) }));
  };
  GEN.binomLaw = (p) => {
    const k = pick(p.kinds);
    if (k === 'p') { const n = R(2, 4), kk = R(0, n), r = round(fact(n) / (fact(kk) * fact(n - kk)) / 2 ** n, 4); return num(t('x.bin.p', { n: m(n), k: m(kk) }), '', r, t('x.bin.p.exp', { n: m(n), k: m(kk), c: m(fact(n) / (fact(kk) * fact(n - kk))), d: m(2 ** n), r: m(fmt(r)) })); }
    const n = pick([10, 20, 40, 50]), pp = pick([0.1, 0.2, 0.25, 0.5]), r = round(n * pp, 3); return num(t('x.bin.e', { n: m(n), p: m(fmt(pp)) }), '', r, t('x.bin.e.exp', { n: m(n), p: m(fmt(pp)), r: m(fmt(r)) }));
  };
  GEN.space = (p) => {
    const k = pick(p.kinds);
    if (k === 'dot') { const v = () => [nz(-4, 4), nz(-4, 4), nz(-4, 4)], u = v(), w = v(), r = u[0] * w[0] + u[1] * w[1] + u[2] * w[2]; return num(t('x.dot.q', { u: m(`u(${u.map(fmt).join(' ; ')})`), v: m(`v(${w.map(fmt).join(' ; ')})`) }), '', r, t('x.dot3.exp', { sub: m(`${fmt(u[0])} × ${sgn(w[0])} + ${sgn(u[1])} × ${sgn(w[1])} + ${sgn(u[2])} × ${sgn(w[2])}`), r: m(fmt(r)) })); }
    const [x, y, z, nn] = pick([[1, 2, 2, 3], [2, 3, 6, 7], [2, 6, 9, 11], [4, 4, 7, 9], [1, 4, 8, 9]]), sg = () => pick([-1, 1]), u = [sg() * x, sg() * y, sg() * z];
    return num(t('x.norm.q', { u: m(`u(${u.map(fmt).join(' ; ')})`) }), '', nn, t('x.norm3.exp', { s: m(x * x + y * y + z * z), r: m(nn) }));
  };

  /* ===================================================================== GS et CP : les compétences qui n'avaient pas d'exercice */
  const EMO = ['🍎', '⭐', '🐟', '🚗', '🌸', '🎈', '🐥', '⚽', '🍓', '🦋'];
  function numChoices(correct, spread = 3, lo = -Infinity) {
    const set = new Set([correct]); let guard = 0;
    while (set.size < 4 && guard++ < 300) { const c = round(correct + R(-spread, spread)); if (c >= lo) set.add(c); }
    return shuf([...set]).map((v) => ({ v, label: m(fmt(v)) }));
  }
  GEN.boxFill = () => {
    const n = R(1, 9), e = pick(EMO), slots = Array.from({ length: 10 }, (_, i) => (i < n ? e : '⬜')).join(' ');
    return { q: t('x.box.q'), vis: `<div class="emojis">${slots}</div>`, kind: 'choice', ans: 10 - n, choices: numChoices(10 - n, 2, 0), exp: t('x.box.exp', { n: m(n), r: m(10 - n) }) };
  };
  GEN.lenCompare = (p) => {
    let a = R(2, 14), b = R(2, 14); while (a === b) b = R(2, 14);
    const first = a > b ? 1 : 2, choices = [{ v: 1, label: t('x.first') }, { v: 2, label: t('x.second') }];
    if (p && p.mode === 'num') return { q: t('x.len.num', { a: m(a), b: m(b) }), kind: 'choice', ans: first, choices, exp: t('x.len.num.exp', { M: m(Math.max(a, b)), s: m(Math.min(a, b)) }) };
    const bar = (y, w, col) => `<rect x="10" y="${y}" width="${w * 20}" height="22" rx="5" fill="${col}" stroke="#1e293b" stroke-width="2"/>`;
    return { q: t('x.len.q'), vis: svg(320, 80, bar(8, a, '#93c5fd') + bar(46, b, '#fca5a5')), kind: 'choice', ans: first, choices, exp: t('x.len.exp') };
  };
  GEN.daysAfter = () => {
    const D = t('x.days'), i = R(0, 6), after = pick([true, false]), j = (i + (after ? 1 : 6)) % 7;
    return { q: t(after ? 'x.day.after' : 'x.day.before', { d: D[i] }), kind: 'choice', ans: D[j], choices: mc(D[j], D.filter((_, k) => k !== j && k !== i), (x) => x), exp: t(after ? 'x.day.after.exp' : 'x.day.before.exp', { d: D[i], r: D[j] }) };
  };
  GEN.place = () => {
    const k = pick(['above', 'below', 'front', 'behind']);
    const box = '<rect x="70" y="60" width="90" height="60" fill="#fde68a" stroke="#92400e" stroke-width="3"/>';
    const ball = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="22" fill="#f87171" stroke="#991b1b" stroke-width="3"/>`;
    const inner = { above: box + ball(115, 36), below: box + ball(115, 144), front: box + ball(115, 90), behind: ball(115, 90) + box }[k];
    return { q: t('x.place.q'), vis: svg(230, 170, inner), kind: 'choice', ans: k, choices: ['above', 'below', 'front', 'behind'].map((v) => ({ v, label: t('x.place.' + v) })), exp: t('x.place.exp.' + k) };
  };
  GEN.estimate = (p) => {
    const kind = pick(p.kinds), a = kind === 'add' ? R(11, 79) : R(31, 79), b = kind === 'add' ? R(11, 79) : R(11, a - 10), r10 = (x) => Math.round(x / 10) * 10;
    const op = kind === 'add' ? '+' : '−', ans = kind === 'add' ? r10(a) + r10(b) : r10(a) - r10(b);
    const ch = shuf([ans, ans + 10, ans - 10, ans + 20].filter((x) => x >= 0)).map((v) => ({ v, label: m(v) }));
    return { q: t('x.est.q'), expr: m(`${a} ${op} ${b}`), kind: 'choice', ans, choices: ch, exp: t('x.est.exp', { a: m(a), a10: m(r10(a)), b: m(b), b10: m(r10(b)), op: m(op), r: m(ans) }) };
  };
  GEN.repeatAdd = () => {
    const n = R(2, 5), k = R(2, 6), e = Array(n).fill(k).join(' + ');
    return num(t('x.rep.q'), m(`${e} = ${box}`), n * k, t('x.rep.exp', { n: m(n), k: m(k), r: m(n * k) }));
  };
  GEN.groupsMul = () => {
    const n = R(2, 5), k = R(2, 5), em = pick(EMO), vis = Array.from({ length: n }, () => `<span class="grp" style="display:inline-block;margin:4px 10px;padding:4px 8px;border:2px dashed #94a3b8;border-radius:12px">${Array(k).fill(em).join(' ')}</span>`).join('');
    return { q: t('x.mulq.q', { n: m(n), k: m(k) }), vis: `<div class="emojis">${vis}</div>`, kind: 'num', ans: n * k, exp: t('x.mulq.exp', { n: m(n), k: m(k), e: m(Array(n).fill(k).join(' + ')), r: m(n * k) }) };
  };
  GEN.timeUnits = () => {
    const P2 = [['h', 'min', 60], ['min', 's', 60], ['day', 'h', 24], ['week', 'day', 7], ['year', 'month', 12]], [big, small, n] = pick(P2);
    const ch = mc(n, [n + 10, n - 10, n * 2, 10, 100, 30, 12].filter((x) => x !== n && x > 0), (x) => m(x));
    return { q: t('x.tu.q', { big: t('x.u.' + big + '.one'), small: t('x.u.' + small + '.many') }), kind: 'choice', ans: n, choices: ch, exp: t('x.tu.exp', { big: t('x.u.' + big + '.one'), small: t('x.u.' + small + '.many'), n: m(n) }) };
  };
  GEN.spaceRow = () => {
    const es = shuf(EMO).slice(0, 3), k = pick(['left', 'right', 'between']), vis = `<div class="emojis" style="font-size:2.4rem">${es.join(' ')}</div>`;
    const target = k === 'left' ? es[1] : k === 'right' ? es[1] : es[0], ans = k === 'left' ? es[0] : k === 'right' ? es[2] : es[1];
    if (k === 'between') return { q: t('x.row.between', { a: es[0], c: es[2] }), vis, kind: 'choice', ans, choices: shuf(es).map((e) => ({ v: e, label: `<span class="emo">${e}</span>` })), exp: t('x.row.between.exp', { r: ans }) };
    return { q: t('x.row.' + k, { t: target }), vis, kind: 'choice', ans, choices: shuf(es).map((e) => ({ v: e, label: `<span class="emo">${e}</span>` })), exp: t('x.row.' + k + '.exp', { t: target, r: ans }) };
  };
  GEN.objSolid = () => {
    const O = [['⚽', 'sphere'], ['🎲', 'cube'], ['🥫', 'cylinder'], ['📦', 'pave'], ['🍦', 'cone'], ['⛺', 'pyramid']], [em, id] = pick(O), ch = shuf(O.map((o) => o[1])).slice(0, 4);
    if (!ch.includes(id)) ch[0] = id;
    return { q: t('x.obj.q'), vis: `<div class="emojis" style="font-size:3rem">${em}</div>`, kind: 'choice', ans: id, choices: shuf(ch).map((v) => ({ v, label: t('solidName.' + v) })), exp: t('x.obj.exp', { name: t('solid.' + id) }) };
  };
  GEN.axisYN = () => {
    const C = '#1e3a8a', f = (shape, line) => svg(160, 130, `${shape}<line x1="${line[0]}" y1="${line[1]}" x2="${line[2]}" y2="${line[3]}" stroke="#dc2626" stroke-width="3" stroke-dasharray="7 5"/>`);
    const rect = `<rect x="30" y="30" width="100" height="70" fill="#bfdbfe" stroke="${C}" stroke-width="3"/>`, tri = `<polygon points="80,15 135,110 25,110" fill="#fecaca" stroke="#991b1b" stroke-width="3"/>`;
    const O = [[rect, [80, 15, 80, 115], true], [rect, [20, 65, 140, 65], true], [rect, [30, 30, 130, 100], false], [tri, [80, 10, 80, 118], true], [tri, [60, 10, 60, 118], false], [tri, [20, 110, 140, 110], false]], [shape, line, ok] = pick(O);
    return { q: t('x.axis.q'), vis: f(shape, line), kind: 'choice', ans: ok ? 'y' : 'n', choices: yesNo(), exp: t(ok ? 'x.axis.y' : 'x.axis.n') };
  };

  root.MathsGen2 = { t };
}(typeof window !== 'undefined' ? window : globalThis));
