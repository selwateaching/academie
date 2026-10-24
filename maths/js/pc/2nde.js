/* Physique-chimie, niveau 2nde : générateurs, textes français et arabes, catalogue.
 * Ajoute deux domaines (Physique, Chimie) à la fin du niveau 2nde du catalogue.
 */
(function (root) {
  'use strict';

  const GEN = root.MathsGen.GEN;
  const STR = () => root.STRINGS || {};
  function t(k, v) {
    const s = STR()[k];
    if (s === undefined) return '[[' + k + ']]';
    if (typeof s !== 'string') return s;
    // la correction montre déjà la formule dans le texte : on n’en répète pas le début dans le calcul
    if (v && typeof v.c === 'string') v = Object.assign({}, v, { c: v.c.replace(/^(<span class="m">)[^=<]+ = [^=\d<]+ = /, '$1') });
    return s.replace(/\{(\w+)\}/g, (_, n) => (v && v[n] !== undefined ? v[n] : ''));
  }

  /* ---------- outils ---------- */
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[R(0, a.length - 1)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const round = (x, k = 6) => Number(x.toFixed(k));
  const fmt = (x) => String(x).replace(/-/g, '−').replace('.', ',');
  const m = (s) => `<span class="m">${String(s).replace(/[؀-ۿ]+/g, '⁦$&⁩')}</span>`;
  function mc(correct, wrongs, labelf = (v) => m(v)) {
    const seen = new Set([String(correct)]), out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  }
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" direction="ltr" style="direction:ltr">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;
  const line = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || '#334155'}" stroke-width="${o.w || 2}"${o.d ? ` stroke-dasharray="${o.d}"` : ''}/>`;
  const arrow = (x1, y1, x2, y2, c = '#2563eb') => {
    const a = Math.atan2(y2 - y1, x2 - x1), s = 8;
    const p = [[x2, y2], [x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4)], [x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4)]];
    return line(x1, y1, x2, y2, { c }) + `<polygon points="${p.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')}" fill="${c}"/>`;
  };
  const dec = (x, k = 3) => Math.abs(x - round(x, k)) < 1e-9;
  const U = (v, unit) => m(fmt(round(v)) + ' ' + unit);   // valeur + unité, isolée du texte
  const NA = 6.02;                                        // constante d’Avogadro en 10²³ mol⁻¹

  /* masses molaires atomiques (g/mol) */
  const AM = { H: 1, C: 12, N: 14, O: 16, Na: 23, S: 32, Cl: 35.5, Ca: 40, Fe: 56, Cu: 63.5 };
  const zw = (f) => f.replace(/([a-z])(?=[A-Z])/g, '$1\u200b');   // espace de largeur nulle entre symboles
  const sub = (f) => zw(f.replace(/(\d+)/g, '<sub>$1</sub>'));

  /* ===================================================================== PHYSIQUE */

  /* ---------- vitesse ---------- */
  GEN.pc2nde_vitesse = (p) => {
    const k = pick(p.kinds), T = [2, 4, 5, 8, 10, 20, 25, 40, 50, 60];
    if (k === 'v') {
      const v = R(2, 30), s = pick(T), d = v * s;
      return { q: t('pc.2nde.vit.v.q', { d: U(d, 'm'), t: U(s, 's'), u: m('m/s') }), kind: 'num', ans: v, exp: t('pc.2nde.vit.v.exp', { c: m(`v = d ÷ Δt = ${fmt(d)} ÷ ${fmt(s)} = ${fmt(v)} m/s`) }) };
    }
    if (k === 'd') {
      const v = R(2, 30), s = R(2, 60), d = v * s;
      return { q: t('pc.2nde.vit.d.q', { v: U(v, 'm/s'), t: U(s, 's'), u: m('m') }), kind: 'num', ans: d, exp: t('pc.2nde.vit.d.exp', { c: m(`d = v × Δt = ${fmt(v)} × ${fmt(s)} = ${fmt(d)} m`) }) };
    }
    if (k === 't') {
      const v = R(2, 30), s = pick(T), d = v * s;
      return { q: t('pc.2nde.vit.t.q', { v: U(v, 'm/s'), d: U(d, 'm'), u: m('s') }), kind: 'num', ans: s, exp: t('pc.2nde.vit.t.exp', { c: m(`Δt = d ÷ v = ${fmt(d)} ÷ ${fmt(v)} = ${fmt(s)} s`) }) };
    }
    if (k === 'kmh') {
      const v = R(2, 40), r = round(v * 3.6, 1);
      return { q: t('pc.2nde.vit.kmh.q', { v: U(v, 'm/s'), u: m('km/h') }), kind: 'num', ans: r, exp: t('pc.2nde.vit.kmh.exp', { c: m(`${fmt(v)} × 3,6 = ${fmt(r)} km/h`) }) };
    }
    const v = R(1, 12) * 5, kmh = round(v * 3.6, 1);
    return { q: t('pc.2nde.vit.ms.q', { v: U(kmh, 'km/h'), u: m('m/s') }), kind: 'num', ans: v, exp: t('pc.2nde.vit.ms.exp', { c: m(`${fmt(kmh)} ÷ 3,6 = ${fmt(v)} m/s`) }) };
  };

  /* ---------- poids et inertie ---------- */
  const PL = [['T', 10], ['L', 1.6], ['M', 3.7], ['J', 24.8]];
  const SIT = [['s1', 'y'], ['s2', 'y'], ['s3', 'n'], ['s4', 'n'], ['s5', 'y'], ['s6', 'n']];
  GEN.pc2nde_poids = (p) => {
    const k = pick(p.kinds);
    if (k === 'P') {
      const [pl, g] = pick(PL), mm = R(2, 80), P = round(mm * g, 2);
      return { q: t('pc.2nde.poids.P.q', { pl: t('pc.2nde.pl.' + pl), g: U(g, 'N/kg'), m: U(mm, 'kg'), u: m('N') }), kind: 'num', ans: P, exp: t('pc.2nde.poids.P.exp', { c: m(`P = m × g = ${fmt(mm)} × ${fmt(g)} = ${fmt(P)} N`) }) };
    }
    if (k === 'm') {
      const [pl, g] = pick(PL), mm = R(2, 80), P = round(mm * g, 2);
      return { q: t('pc.2nde.poids.m.q', { pl: t('pc.2nde.pl.' + pl), g: U(g, 'N/kg'), P: U(P, 'N'), u: m('kg') }), kind: 'num', ans: mm, exp: t('pc.2nde.poids.m.exp', { c: m(`m = P ÷ g = ${fmt(P)} ÷ ${fmt(g)} = ${fmt(mm)} kg`) }) };
    }
    if (k === 'g') {
      const g = pick([1.6, 3.7, 10, 24.8]), mm = R(2, 20), P = round(mm * g, 2);
      return { q: t('pc.2nde.poids.g.q', { m: U(mm, 'kg'), P: U(P, 'N'), u: m('N/kg') }), kind: 'num', ans: g, exp: t('pc.2nde.poids.g.exp', { c: m(`g = P ÷ m = ${fmt(P)} ÷ ${fmt(mm)} = ${fmt(g)} N/kg`) }) };
    }
    if (k === 'inertia') {
      const [s, a] = pick(SIT);
      return { q: t('pc.2nde.in.q', { s: t('pc.2nde.in.' + s) }), kind: 'choice', ans: a, choices: mc(a, [a === 'y' ? 'n' : 'y'], (v) => t('pc.2nde.in.' + (v === 'y' ? 'yes' : 'no'))), exp: t(a === 'y' ? 'pc.2nde.in.exp.y' : 'pc.2nde.in.exp.n') };
    }
    return { q: t('pc.2nde.in.motion.q'), kind: 'choice', ans: 'm1', choices: mc('m1', ['m2', 'm3', 'm4'], (v) => t('pc.2nde.in.' + v)), exp: t('pc.2nde.in.motion.exp') };
  };

  /* ---------- période, fréquence, écho ---------- */
  const waveSvg = () => {
    let d = '';
    for (let i = 0; i <= 240; i++) d += (i ? 'L' : 'M') + (30 + i * 1.5).toFixed(1) + ' ' + (55 - 35 * Math.sin(2 * Math.PI * i / 120)).toFixed(1);
    return svg(400, 125, line(20, 55, 390, 55, { c: '#94a3b8', w: 1 }) + `<path d="${d}" fill="none" stroke="#2563eb" stroke-width="2.5"/>`
      + line(30, 104, 210, 104, { c: '#dc2626' }) + line(30, 98, 30, 110, { c: '#dc2626' }) + line(210, 98, 210, 110, { c: '#dc2626' }) + txt(120, 122, 'T', { s: 15, c: '#dc2626' }));
  };
  GEN.pc2nde_signal = (p) => {
    const k = pick(p.kinds);
    if (k === 'f') {
      const T = pick([20, 10, 8, 5, 4, 2, 1, 0.5, 0.25]), f = round(1000 / T, 3), Ts = round(T / 1000, 6);
      return { q: t('pc.2nde.sig.f.q', { T: U(T, 'ms'), u: m('Hz') }), vis: waveSvg(), kind: 'num', ans: f, exp: t('pc.2nde.sig.f.exp', { c: m(`f = 1 ÷ T = 1 ÷ ${fmt(Ts)} s = ${fmt(f)} Hz`) }) };
    }
    if (k === 'T') {
      const f = pick([50, 100, 125, 200, 250, 500, 1000, 2000, 4000]), T = round(1000 / f, 3), Ts = round(1 / f, 6);
      return { q: t('pc.2nde.sig.T.q', { f: U(f, 'Hz'), u: m('ms') }), kind: 'num', ans: T, exp: t('pc.2nde.sig.T.exp', { c: m(`T = 1 ÷ f = 1 ÷ ${fmt(f)} = ${fmt(Ts)} s = ${fmt(T)} ms`) }) };
    }
    if (k === 'echo') {
      const s = pick([0.2, 0.4, 0.5, 1, 1.5, 2, 3]), d = round(170 * s, 2);
      return { q: t('pc.2nde.sig.echo.q', { t: U(s, 's'), u: m('m') }), kind: 'num', ans: d, exp: t('pc.2nde.sig.echo.exp', { c: m(`d = v × Δt ÷ 2 = 340 × ${fmt(s)} ÷ 2 = ${fmt(d)} m`) }) };
    }
    if (k === 'pitch') {
      const fs = shuf([100, 200, 440, 880, 1000, 2000, 5000]).slice(0, 2), big = Math.max(...fs), small = Math.min(...fs);
      return { q: t('pc.2nde.sig.pitch.q', { a: U(fs[0], 'Hz'), b: U(fs[1], 'Hz') }), kind: 'choice', ans: String(big), choices: mc(String(big), [String(small), 'eq'], (v) => (v === 'eq' ? t('pc.2nde.sig.same') : m(fmt(v) + ' Hz'))), exp: t('pc.2nde.sig.pitch.exp', { big: U(big, 'Hz'), small: U(small, 'Hz') }) };
    }
    const f = pick([3, 10, 15, 50, 440, 2000, 15000, 25000, 40000, 100000]);
    const a = f < 20 ? 'inf' : f > 20000 ? 'ult' : 'aud';
    return { q: t('pc.2nde.sig.range.q', { f: U(f, 'Hz') }), kind: 'choice', ans: a, choices: mc(a, ['inf', 'ult', 'aud'], (v) => t('pc.2nde.sig.r.' + v)), exp: t('pc.2nde.sig.range.exp', { f: U(f, 'Hz'), r: t('pc.2nde.sig.r.' + a) }) };
  };

  /* ---------- réfraction ---------- */
  const NV = [[1.5, 2], [2, 1.5], [1.2, 2.5], [1.25, 2.4], [2.5, 1.2], [3, 1]];
  const NN = [[1, 2], [1, 1.25], [1.5, 2], [1.5, 3], [2, 1.6], [1.6, 1], [1.5, 1], [1.2, 1], [2, 1.25]];
  const MED = { a: ['air', 1], v: ['verre', 1.5], e: ['eau', 1.33] };
  const rayFig = (n1, n2, s2) => {
    const a2 = Math.asin(Math.min(1, s2)), x0 = 130, y0 = 75, L = 62;
    const ix = x0 - L * 0.5, iy = y0 - L * Math.cos(Math.PI / 6), rx = x0 + L * Math.sin(a2), ry = y0 + L * Math.cos(a2);
    return svg(260, 160, line(10, y0, 250, y0, { c: '#64748b' }) + line(x0, 8, x0, 152, { c: '#94a3b8', w: 1.5, d: '5 4' })
      + arrow(ix, iy, x0, y0, '#d97706') + arrow(x0, y0, rx, ry, '#2563eb')
      + txt(30, 30, 'n₁', { s: 15 }) + txt(30, 125, 'n₂', { s: 15 }) + txt(x0 - 38, y0 - 20, 'i₁', { s: 14, c: '#d97706' }) + txt(x0 + 24, y0 + 38, 'i₂', { s: 14, c: '#2563eb' }));
  };
  GEN.pc2nde_refraction = (p) => {
    const k = pick(p.kinds), c8 = m('3,00 × 10<sup>8</sup> m/s');
    if (k === 'n') {
      const [n, v] = pick(NV);
      return { q: t('pc.2nde.ref.n.q', { v: m(`${fmt(v)} × 10<sup>8</sup> m/s`), c: c8 }), kind: 'num', ans: n, exp: t('pc.2nde.ref.n.exp', { c: m(`n = c ÷ v = 3,00 ÷ ${fmt(v)} = ${fmt(n)}`) }) };
    }
    if (k === 'v') {
      const [n, v] = pick(NV);
      return { q: t('pc.2nde.ref.v.q', { n: m(fmt(n)), u: m('10<sup>8</sup> m/s'), c: c8 }), kind: 'num', ans: v, exp: t('pc.2nde.ref.v.exp', { c: m(`v = c ÷ n = 3,00 ÷ ${fmt(n)} = ${fmt(v)} × 10<sup>8</sup> m/s`) }) };
    }
    if (k === 'sin') {
      const [n1, n2] = pick(NN), s2 = round(0.5 * n1 / n2, 4);
      return { q: t('pc.2nde.ref.sin.q', { n1: m(fmt(n1)), n2: m(fmt(n2)) }), vis: rayFig(n1, n2, s2), kind: 'num', ans: s2, exp: t('pc.2nde.ref.sin.exp', { c: m(`sin i₂ = ${fmt(n1)} × 0,5 ÷ ${fmt(n2)} = ${fmt(s2)}`) }) };
    }
    const pairs = ['av', 'ae', 'ea', 'va', 'ev', 've'], pr = pick(pairs);
    const n1 = MED[pr[0]][1], n2 = MED[pr[1]][1], a = n1 < n2 ? 'near' : 'far';
    return { q: t('pc.2nde.ref.dir.q', { a: t('pc.2nde.ref.' + pr) }), kind: 'choice', ans: a, choices: mc(a, ['near', 'far', 'none'], (v) => t('pc.2nde.ref.d.' + v)), exp: t('pc.2nde.ref.dir.exp', { n1: m(fmt(n1)), n2: m(fmt(n2)), d: t('pc.2nde.ref.d.' + a) }) };
  };

  /* ---------- spectres ---------- */
  const SPEC = [['a', 'cont'], ['b', 'cont'], ['c', 'emi'], ['d', 'emi'], ['e', 'abs']];
  const LINES = { H: [410, 434, 486, 656], Na: [498, 568, 589], Hg: [405, 436, 546, 578] };
  GEN.pc2nde_spectre = (p) => {
    const k = pick(p.kinds);
    if (k === 'dom') {
      const d = pick(['uv', 'vis', 'vis', 'ir']);
      const l = d === 'uv' ? R(10, 38) * 10 : d === 'vis' ? R(41, 79) * 10 : R(9, 15) * 100;
      return { q: t('pc.2nde.sp.dom.q', { l: U(l, 'nm') }), kind: 'choice', ans: d, choices: mc(d, ['uv', 'vis', 'ir'], (v) => t('pc.2nde.sp.d.' + v)), exp: t('pc.2nde.sp.dom.exp.' + d, { l: U(l, 'nm') }) };
    }
    if (k === 'type') {
      const [s, a] = pick(SPEC);
      return { q: t('pc.2nde.sp.type.q', { s: t('pc.2nde.sp.s.' + s) }), kind: 'choice', ans: a, choices: mc(a, ['cont', 'emi', 'abs'], (v) => t('pc.2nde.sp.t.' + v)), exp: t('pc.2nde.sp.type.exp.' + a) };
    }
    if (k === 'hot') {
      return { q: t('pc.2nde.sp.hot.q'), kind: 'choice', ans: 'blue', choices: mc('blue', ['red', 'green'], (v) => t('pc.2nde.sp.c.' + v)), exp: t('pc.2nde.sp.hot.exp') };
    }
    const el = pick(['H', 'Na', 'Hg']), obs = shuf(LINES[el]).slice(0, 2).sort((x, y) => x - y);
    const lst = (e) => m(LINES[e].map(fmt).join(' ; ') + ' nm');
    return { q: t('pc.2nde.sp.elem.q', { l: m(obs.map(fmt).join(' ; ') + ' nm'), h: lst('H'), s: lst('Na'), g: lst('Hg') }), kind: 'choice', ans: el, choices: mc(el, ['H', 'Na', 'Hg'].filter((e) => e !== el), (v) => t('pc.2nde.el.' + v)), exp: t('pc.2nde.sp.elem.exp', { el: t('pc.2nde.el.' + el) }) };
  };

  /* ---------- loi d’Ohm ---------- */
  const circuitFig = () => svg(240, 120,
    line(40, 30, 95, 30) + `<rect x="95" y="20" width="50" height="20" fill="#fff" stroke="#334155" stroke-width="2"/>` + line(145, 30, 200, 30)
    + line(40, 30, 40, 100) + line(200, 30, 200, 100) + line(40, 100, 200, 100)
    + txt(120, 35, 'R', { s: 14 }) + arrow(100, 60, 140, 60, '#dc2626') + txt(120, 78, 'U', { s: 15, c: '#dc2626' })
    + arrow(40, 70, 40, 52, '#2563eb').replace('x2="40" y2="52"', 'x2="40" y2="52"') + txt(24, 62, 'I', { s: 15, c: '#2563eb' }));
  GEN.pc2nde_ohm = (p) => {
    const k = pick(p.kinds);
    const Rs = [10, 20, 25, 40, 50, 100, 200, 220], Is = [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2];
    if (k === 'U' || k === 'I' || k === 'R') {
      const Rr = pick(Rs), I = pick(Is), Uu = round(Rr * I, 3);
      if (k === 'U') return { q: t('pc.2nde.ohm.U.q', { R: U(Rr, 'Ω'), I: U(I, 'A'), u: m('V') }), vis: circuitFig(), kind: 'num', ans: Uu, exp: t('pc.2nde.ohm.U.exp', { c: m(`U = R × I = ${fmt(Rr)} × ${fmt(I)} = ${fmt(Uu)} V`) }) };
      if (k === 'I') return { q: t('pc.2nde.ohm.I.q', { R: U(Rr, 'Ω'), U: U(Uu, 'V'), u: m('A') }), vis: circuitFig(), kind: 'num', ans: I, exp: t('pc.2nde.ohm.I.exp', { c: m(`I = U ÷ R = ${fmt(Uu)} ÷ ${fmt(Rr)} = ${fmt(I)} A`) }) };
      return { q: t('pc.2nde.ohm.R.q', { U: U(Uu, 'V'), I: U(I, 'A'), u: m('Ω') }), vis: circuitFig(), kind: 'num', ans: Rr, exp: t('pc.2nde.ohm.R.exp', { c: m(`R = U ÷ I = ${fmt(Uu)} ÷ ${fmt(I)} = ${fmt(Rr)} Ω`) }) };
    }
    const Rr = pick([100, 200, 250, 500, 1000]), Im = pick([5, 10, 20, 25, 40, 50, 100]), Uu = round(Rr * Im / 1000, 3);
    if (k === 'mA') return { q: t('pc.2nde.ohm.mA.q', { R: U(Rr, 'Ω'), I: U(Im, 'mA'), u: m('V') }), kind: 'num', ans: Uu, exp: t('pc.2nde.ohm.mA.exp', { c: m(`U = R × I = ${fmt(Rr)} × ${fmt(round(Im / 1000, 4))} = ${fmt(Uu)} V`) }) };
    return { q: t('pc.2nde.ohm.imA.q', { R: U(Rr, 'Ω'), U: U(Uu, 'V'), u: m('mA') }), kind: 'num', ans: Im, exp: t('pc.2nde.ohm.imA.exp', { c: m(`I = U ÷ R = ${fmt(Uu)} ÷ ${fmt(Rr)} = ${fmt(round(Im / 1000, 4))} A = ${fmt(Im)} mA`) }) };
  };

  /* ---------- nœuds, mailles, associations ---------- */
  const nodeFig = () => svg(260, 130,
    line(20, 65, 110, 65) + arrow(40, 65, 75, 65, '#2563eb') + line(110, 65, 220, 25) + line(110, 65, 220, 105)
    + arrow(150, 49, 190, 33, '#2563eb') + arrow(150, 81, 190, 97, '#2563eb') + `<circle cx="110" cy="65" r="5" fill="#334155"/>`
    + txt(55, 52, 'I', { s: 15, c: '#2563eb' }) + txt(185, 20, 'I₁', { s: 15, c: '#2563eb' }) + txt(185, 122, 'I₂', { s: 15, c: '#2563eb' }));
  const PARA = [[20, 30, 12], [30, 60, 20], [12, 24, 8], [10, 40, 8], [15, 60, 12], [20, 60, 15], [40, 60, 24], [60, 60, 30], [100, 100, 50], [30, 30, 15], [6, 12, 4], [10, 15, 6], [20, 5, 4], [25, 100, 20], [50, 75, 30]];
  GEN.pc2nde_circuit = (p) => {
    const k = pick(p.kinds);
    if (k === 'node') {
      const I1 = R(1, 5) / 10, I2 = R(1, 5) / 10, I = round(I1 + I2, 2);
      if (Math.random() < 0.5) return { q: t('pc.2nde.ci.node.sum.q', { I1: U(I1, 'A'), I2: U(I2, 'A'), u: m('A') }), vis: nodeFig(), kind: 'num', ans: I, exp: t('pc.2nde.ci.node.sum.exp', { c: m(`I = I₁ + I₂ = ${fmt(I1)} + ${fmt(I2)} = ${fmt(I)} A`) }) };
      return { q: t('pc.2nde.ci.node.diff.q', { I: U(I, 'A'), I1: U(I1, 'A'), u: m('A') }), vis: nodeFig(), kind: 'num', ans: I2, exp: t('pc.2nde.ci.node.diff.exp', { c: m(`I₂ = I − I₁ = ${fmt(I)} − ${fmt(I1)} = ${fmt(I2)} A`) }) };
    }
    if (k === 'mesh') {
      const U1 = R(2, 9), U2 = R(2, 9), E = U1 + U2;
      if (Math.random() < 0.5) return { q: t('pc.2nde.ci.mesh.E.q', { U1: U(U1, 'V'), U2: U(U2, 'V'), u: m('V') }), kind: 'num', ans: E, exp: t('pc.2nde.ci.mesh.E.exp', { c: m(`E = U₁ + U₂ = ${U1} + ${U2} = ${E} V`) }) };
      return { q: t('pc.2nde.ci.mesh.U.q', { E: U(E, 'V'), U1: U(U1, 'V'), u: m('V') }), kind: 'num', ans: U2, exp: t('pc.2nde.ci.mesh.U.exp', { c: m(`U₂ = E − U₁ = ${E} − ${U1} = ${U2} V`) }) };
    }
    if (k === 'serie') {
      const Rs = [10, 22, 33, 47, 100, 150, 220];
      if (Math.random() < 0.5) { const a = pick(Rs), b = pick(Rs); return { q: t('pc.2nde.ci.serie2.q', { R1: U(a, 'Ω'), R2: U(b, 'Ω'), u: m('Ω') }), kind: 'num', ans: a + b, exp: t('pc.2nde.ci.serie.exp', { c: m(`R = ${a} + ${b} = ${a + b} Ω`) }) }; }
      const a = pick(Rs), b = pick(Rs), c = pick(Rs);
      return { q: t('pc.2nde.ci.serie3.q', { R1: U(a, 'Ω'), R2: U(b, 'Ω'), R3: U(c, 'Ω'), u: m('Ω') }), kind: 'num', ans: a + b + c, exp: t('pc.2nde.ci.serie.exp', { c: m(`R = ${a} + ${b} + ${c} = ${a + b + c} Ω`) }) };
    }
    if (k === 'deriv') {
      const [a, b, r] = pick(PARA);
      return { q: t('pc.2nde.ci.deriv.q', { R1: U(a, 'Ω'), R2: U(b, 'Ω'), u: m('Ω') }), kind: 'num', ans: r, exp: t('pc.2nde.ci.deriv.exp', { c: m(`R = (${a} × ${b}) ÷ (${a} + ${b}) = ${a * b} ÷ ${a + b} = ${r} Ω`) }) };
    }
    const a = pick([20, 30, 40, 50, 60]), b = pick([20, 30, 40, 50, 60]), I = pick([0.1, 0.2, 0.25, 0.5]), E = round((a + b) * I, 3);
    return { q: t('pc.2nde.ci.serieI.q', { E: U(E, 'V'), R1: U(a, 'Ω'), R2: U(b, 'Ω'), u: m('A') }), kind: 'num', ans: I, exp: t('pc.2nde.ci.serieI.exp', { c: m(`R = ${a} + ${b} = ${a + b} Ω ; I = E ÷ R = ${fmt(E)} ÷ ${a + b} = ${fmt(I)} A`) }) };
  };

  /* ===================================================================== CHIMIE */

  /* ---------- quantité de matière ---------- */
  const SP = [
    ['H2O', [['H', 2], ['O', 1]]], ['CO2', [['C', 1], ['O', 2]]], ['NaCl', [['Na', 1], ['Cl', 1]]], ['CaCO3', [['Ca', 1], ['C', 1], ['O', 3]]],
    ['NH3', [['N', 1], ['H', 3]]], ['H2SO4', [['H', 2], ['S', 1], ['O', 4]]], ['C6H12O6', [['C', 6], ['H', 12], ['O', 6]]], ['CH4', [['C', 1], ['H', 4]]],
    ['NaOH', [['Na', 1], ['O', 1], ['H', 1]]], ['HCl', [['H', 1], ['Cl', 1]]], ['CuSO4', [['Cu', 1], ['S', 1], ['O', 4]]], ['Fe2O3', [['Fe', 2], ['O', 3]]],
  ];
  const spInfo = (s) => ({ f: sub(s[0]), parts: s[1], M: round(s[1].reduce((a, [e, c]) => a + AM[e] * c, 0), 2) });
  const dataM = (parts) => m(parts.map(([e]) => `M(${e}) = ${fmt(AM[e])} g/mol`).join(' ; '));
  GEN.pc2nde_mole = (p) => {
    const k = pick(p.kinds), sp = spInfo(pick(SP)), F = m(sp.f);
    if (k === 'M') {
      const calc = sp.parts.map(([e, c]) => (c === 1 ? fmt(AM[e]) : `${c} × ${fmt(AM[e])}`)).join(' + ');
      return { q: t('pc.2nde.mo.M.q', { f: F, data: dataM(sp.parts), u: m('g/mol') }), kind: 'num', ans: sp.M, exp: t('pc.2nde.mo.M.exp', { f: F, c: m(`${calc} = ${fmt(sp.M)} g/mol`) }) };
    }
    const n = pick([0.05, 0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 3, 5]), mm = round(n * sp.M, 3);
    if (k === 'n') return { q: t('pc.2nde.mo.n.q', { f: F, m: U(mm, 'g'), M: U(sp.M, 'g/mol'), u: m('mol') }), kind: 'num', ans: n, exp: t('pc.2nde.mo.n.exp', { c: m(`n = m ÷ M = ${fmt(mm)} ÷ ${fmt(sp.M)} = ${fmt(n)} mol`) }) };
    if (k === 'm') return { q: t('pc.2nde.mo.m.q', { f: F, n: U(n, 'mol'), M: U(sp.M, 'g/mol'), u: m('g') }), kind: 'num', ans: mm, exp: t('pc.2nde.mo.m.exp', { c: m(`m = n × M = ${fmt(n)} × ${fmt(sp.M)} = ${fmt(mm)} g`) }) };
    const N = round(n * NA, 3);
    return { q: t('pc.2nde.mo.N.q', { f: F, n: U(n, 'mol'), na: m('6,02 × 10<sup>23</sup> mol<sup>−1</sup>') }), kind: 'num', ans: N, exp: t('pc.2nde.mo.N.exp', { c: m(`N = n × Nₐ = ${fmt(n)} × 6,02 × 10<sup>23</sup> = ${fmt(N)} × 10<sup>23</sup>`) }) };
  };

  /* ---------- concentration ---------- */
  const SOL = [['NaCl', 58.5], ['NaOH', 40], ['C6H12O6', 180], ['CuSO4', 159.5]];
  GEN.pc2nde_conc = (p) => {
    const k = pick(p.kinds), Cs = [0.05, 0.1, 0.2, 0.5, 1, 2];
    if (k === 'C') {
      const C = pick(Cs), V = pick([0.1, 0.25, 0.5, 1, 2]), n = round(C * V, 4);
      return { q: t('pc.2nde.co.C.q', { n: U(n, 'mol'), V: U(V, 'L'), u: m('mol/L') }), kind: 'num', ans: C, exp: t('pc.2nde.co.C.exp', { c: m(`C = n ÷ V = ${fmt(n)} ÷ ${fmt(V)} = ${fmt(C)} mol/L`) }) };
    }
    if (k === 'n') {
      const C = pick(Cs), V = pick([100, 200, 250, 500, 1000]), n = round(C * V / 1000, 5);
      return { q: t('pc.2nde.co.n.q', { V: U(V, 'mL'), C: U(C, 'mol/L'), u: m('mol') }), kind: 'num', ans: n, exp: t('pc.2nde.co.n.exp', { c: m(`n = C × V = ${fmt(C)} × ${fmt(round(V / 1000, 3))} = ${fmt(n)} mol`) }) };
    }
    if (k === 'V') {
      const C = pick(Cs), V = pick([100, 200, 250, 500]), n = round(C * V / 1000, 5);
      return { q: t('pc.2nde.co.V.q', { n: U(n, 'mol'), C: U(C, 'mol/L'), u: m('mL') }), kind: 'num', ans: V, exp: t('pc.2nde.co.V.exp', { c: m(`V = n ÷ C = ${fmt(n)} ÷ ${fmt(C)} = ${fmt(round(V / 1000, 3))} L = ${fmt(V)} mL`) }) };
    }
    const [fo, M] = pick(SOL), F = m(sub(fo));
    if (k === 'Cm') {
      const C = pick([0.1, 0.2, 0.5, 1, 2]), Cm = round(C * M, 3);
      return { q: t('pc.2nde.co.Cm.q', { f: F, M: U(M, 'g/mol'), C: U(C, 'mol/L'), u: m('g/L') }), kind: 'num', ans: Cm, exp: t('pc.2nde.co.Cm.exp', { c: m(`Cm = C × M = ${fmt(C)} × ${fmt(M)} = ${fmt(Cm)} g/L`) }) };
    }
    if (k === 'C2') {
      const C = pick([0.1, 0.2, 0.5, 1, 2]), Cm = round(C * M, 3);
      return { q: t('pc.2nde.co.C2.q', { f: F, M: U(M, 'g/mol'), Cm: U(Cm, 'g/L'), u: m('mol/L') }), kind: 'num', ans: C, exp: t('pc.2nde.co.C2.exp', { c: m(`C = Cm ÷ M = ${fmt(Cm)} ÷ ${fmt(M)} = ${fmt(C)} mol/L`) }) };
    }
    let C, V, mm;
    do { C = pick([0.1, 0.2, 0.5, 1]); V = pick([100, 200, 250, 500]); mm = round(C * V / 1000 * M, 4); } while (!dec(mm, 3));
    const n = round(C * V / 1000, 5);
    return { q: t('pc.2nde.co.mass.q', { V: U(V, 'mL'), f: F, C: U(C, 'mol/L'), M: U(M, 'g/mol'), u: m('g') }), kind: 'num', ans: mm, exp: t('pc.2nde.co.mass.exp', { c: m(`n = C × V = ${fmt(C)} × ${fmt(round(V / 1000, 3))} = ${fmt(n)} mol ; m = n × M = ${fmt(n)} × ${fmt(M)} = ${fmt(mm)} g`) }) };
  };

  /* ---------- dilution ---------- */
  GEN.pc2nde_dilution = (p) => {
    const k = pick(p.kinds);
    let F, C1, C2, V2, V1;
    do { F = pick([2, 4, 5, 10]); C1 = pick([0.2, 0.4, 0.5, 1, 2, 5]); V2 = pick([50, 100, 200, 250, 500]); C2 = round(C1 / F, 4); V1 = V2 / F; } while (V2 % F !== 0 || !dec(C2, 3));
    if (k === 'V1') return { q: t('pc.2nde.di.V1.q', { C1: U(C1, 'mol/L'), V2: U(V2, 'mL'), C2: U(C2, 'mol/L'), u: m('mL') }), kind: 'num', ans: V1, exp: t('pc.2nde.di.V1.exp', { c: m(`V₁ = C₂ × V₂ ÷ C₁ = ${fmt(C2)} × ${fmt(V2)} ÷ ${fmt(C1)} = ${fmt(V1)} mL`) }) };
    if (k === 'C2') return { q: t('pc.2nde.di.C2.q', { V1: U(V1, 'mL'), C1: U(C1, 'mol/L'), V2: U(V2, 'mL'), u: m('mol/L') }), kind: 'num', ans: C2, exp: t('pc.2nde.di.C2.exp', { c: m(`C₂ = C₁ × V₁ ÷ V₂ = ${fmt(C1)} × ${fmt(V1)} ÷ ${fmt(V2)} = ${fmt(C2)} mol/L`) }) };
    if (k === 'F') return { q: t('pc.2nde.di.F.q', { C1: U(C1, 'mol/L'), C2: U(C2, 'mol/L') }), kind: 'num', ans: F, exp: t('pc.2nde.di.F.exp', { c: m(`F = C₁ ÷ C₂ = ${fmt(C1)} ÷ ${fmt(C2)} = ${fmt(F)}`) }) };
    const w = V2 - V1;
    return { q: t('pc.2nde.di.eau.q', { V2: U(V2, 'mL'), C2: U(C2, 'mol/L'), C1: U(C1, 'mol/L'), u: m('mL') }), kind: 'num', ans: w, exp: t('pc.2nde.di.eau.exp', { c: m(`V₁ = ${fmt(C2)} × ${fmt(V2)} ÷ ${fmt(C1)} = ${fmt(V1)} mL ; ${fmt(V2)} − ${fmt(V1)} = ${fmt(w)} mL`) }) };
  };

  /* ---------- atomes, couches, ions ---------- */
  const EL = [[3, 'Li', [2, 1]], [6, 'C', [2, 4]], [7, 'N', [2, 5]], [8, 'O', [2, 6]], [9, 'F', [2, 7]], [10, 'Ne', [2, 8]], [11, 'Na', [2, 8, 1]], [12, 'Mg', [2, 8, 2]],
    [13, 'Al', [2, 8, 3]], [16, 'S', [2, 8, 6]], [17, 'Cl', [2, 8, 7]], [18, 'Ar', [2, 8, 8]]];
  const IONQ = { Li: 1, Na: 1, Mg: 2, Al: 3, O: -2, F: -1, S: -2, Cl: -1 };
  const cfg = (sh) => sh.map((n, i) => `(${'KLMN'[i]})<sup>${n}</sup>`).join(' ');
  const ionF = (s, q) => `${s}<sup>${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '−'}</sup>`;
  function badCfgs(sh, Z) {
    const out = new Set(), key = (a) => a.join(',');
    const add = (a) => { if (a.every((x) => x > 0) && key(a) !== key(sh)) out.add(key(a)); };
    sh.forEach((n, i) => {
      if (n > 1) { const a = sh.slice(); a[i]--; if (i + 1 < a.length) a[i + 1]++; else a.push(1); add(a); }
      if (i > 0) { const a = sh.slice(); a[i]--; a[i - 1]++; add(a); }
    });
    [1, -1].forEach((d) => { const a = sh.slice(); a[a.length - 1] += d; add(a); });
    add([Z]);
    return [...out];
  }
  GEN.pc2nde_atome = (p) => {
    const k = pick(p.kinds);
    if (k === 'ion' || k === 'elec') {
      const [Z, s, sh] = pick(EL.filter((e) => IONQ[e[1]] !== undefined)), q = IONQ[s];
      const ion = m(ionF(s, q)), act = t(q > 0 ? 'pc.2nde.at.lose' : 'pc.2nde.at.gain');
      if (k === 'ion') {
        const qs = ['1', '2', '3', '-1', '-2'], ok = String(q);
        return { q: t('pc.2nde.at.ion.q', { el: t('pc.2nde.el.' + s), sym: m(s), cfg: m(cfg(sh)) }), kind: 'choice', ans: ok, choices: mc(ok, qs.filter((x) => x !== ok), (v) => m(ionF(s, Number(v)))), exp: t('pc.2nde.at.ion.exp', { act, k: m(Math.abs(q)), ion }) };
      }
      const n = Z - q;
      return { q: t('pc.2nde.at.elec.q', { ion, sym: m(s), Z: m(Z) }), kind: 'num', ans: n, exp: t('pc.2nde.at.elec.exp', { Z: m(Z), act, k: m(Math.abs(q)), c: m(`${Z} ${q > 0 ? '−' : '+'} ${Math.abs(q)} = ${n}`) }) };
    }
    const [Z, s, sh] = pick(EL), el = t('pc.2nde.el.' + s);
    if (k === 'valence') {
      const v = sh[sh.length - 1], ws = [1, 2, 3, 4, 5, 6, 7, 8].filter((x) => x !== v);
      return { q: t('pc.2nde.at.val.q', { el, sym: m(s), Z: m(Z) }), kind: 'choice', ans: String(v), choices: mc(String(v), ws.map(String), (x) => m(x)), exp: t('pc.2nde.at.val.exp', { cfg: m(cfg(sh)), v: m(v) }) };
    }
    const ok = sh.join(',');
    return { q: t('pc.2nde.at.cfg.q', { el, sym: m(s), Z: m(Z) }), kind: 'choice', ans: ok, choices: mc(ok, badCfgs(sh, Z), (v) => m(cfg(v.split(',').map(Number)))), exp: t('pc.2nde.at.cfg.exp', { Z: m(Z), cfg: m(cfg(sh)) }) };
  };

  /* ---------- liaisons covalentes ---------- */
  const LA = [['H', 1, 1, 2], ['C', 6, 4, 8], ['N', 7, 5, 8], ['O', 8, 6, 8], ['F', 9, 7, 8], ['Cl', 17, 7, 8]];
  const ML = [
    ['H2O', '2 × 1 + 6', 8, 2, 2, 'cou'], ['NH3', '5 + 3 × 1', 8, 3, 1], ['CH4', '4 + 4 × 1', 8, 4, 0, 'tet'], ['HCl', '1 + 7', 8, 1, 3],
    ['CO2', '4 + 2 × 6', 16, 4, 4, 'lin'], ['Cl2', '2 × 7', 14, 1, 6], ['N2', '2 × 5', 10, 3, 2], ['O2', '2 × 6', 12, 2, 4], ['H2', '2 × 1', 2, 1, 0],
  ];
  GEN.pc2nde_liaison = (p) => {
    const k = pick(p.kinds);
    if (k === 'nb') {
      const [s, Z, outer, goal] = pick(LA), n = goal - outer, sh = Z === 1 ? [1] : Z === 17 ? [2, 8, 7] : [2, outer];
      return { q: t('pc.2nde.li.nb.q', { el: t('pc.2nde.el.' + s), sym: m(s), Z: m(Z) }), kind: 'choice', ans: String(n), choices: mc(String(n), ['1', '2', '3', '4'].filter((x) => x !== String(n)), (v) => m(v)), exp: t('pc.2nde.li.nb.exp', { cfg: m(cfg(sh)), k: m(n), rule: t(goal === 2 ? 'pc.2nde.li.duet' : 'pc.2nde.li.octet') }) };
    }
    if (k === 'geom') {
      const [fo, , , , , g] = pick(ML.filter((x) => x[5])), F = m(sub(fo));
      return { q: t('pc.2nde.li.geom.q', { f: F }), kind: 'choice', ans: g, choices: mc(g, ['lin', 'cou', 'tet'].filter((x) => x !== g), (v) => t('pc.2nde.li.g.' + v)), exp: t('pc.2nde.li.geom.exp', { f: F, g: t('pc.2nde.li.g.' + g) }) };
    }
    const [fo, vs, ve, l, nl] = pick(ML), F = m(sub(fo));
    return { q: t(k === 'liants' ? 'pc.2nde.li.l.q' : 'pc.2nde.li.nl.q', { f: F }), kind: 'num', ans: k === 'liants' ? l : nl, exp: t('pc.2nde.li.exp', { f: F, c: m(`${vs} = ${ve}`), dt: m(ve / 2), l: m(l), nl: m(nl) }) };
  };

  /* ---------- avancement et réactif limitant ---------- */
  const H2 = 'H<sub>2</sub>', O2 = 'O<sub>2</sub>', CO2 = 'CO<sub>2</sub>', H2O = 'H<sub>2</sub>O';
  const RX = [
    { eq: `2 ${H2} + ${O2} → 2 ${H2O}`, r: [[H2, 2], [O2, 1]], pr: [[H2O, 2]] },
    { eq: `C + ${O2} → ${CO2}`, r: [['C', 1], [O2, 1]], pr: [[CO2, 1]] },
    { eq: `N<sub>2</sub> + 3 ${H2} → 2 NH<sub>3</sub>`, r: [['N<sub>2</sub>', 1], [H2, 3]], pr: [['NH<sub>3</sub>', 2]] },
    { eq: `CH<sub>4</sub> + 2 ${O2} → ${CO2} + 2 ${H2O}`, r: [['CH<sub>4</sub>', 1], [O2, 2]], pr: [[CO2, 1], [H2O, 2]] },
    { eq: `2 Na + Cl<sub>2</sub> → 2 NaCl`, r: [['Na', 2], ['Cl<sub>2</sub>', 1]], pr: [['NaCl', 2]] },
    { eq: `4 Fe + 3 ${O2} → 2 Fe<sub>2</sub>O<sub>3</sub>`, r: [['Fe', 4], [O2, 3]], pr: [['Fe<sub>2</sub>O<sub>3</sub>', 2]] },
    { eq: `C<sub>3</sub>H<sub>8</sub> + 5 ${O2} → 3 ${CO2} + 4 ${H2O}`, r: [['C<sub>3</sub>H<sub>8</sub>', 1], [O2, 5]], pr: [[CO2, 3], [H2O, 4]] },
  ];
  GEN.pc2nde_avancement = (p) => {
    const k = pick(p.kinds), rx = pick(RX), L = R(0, 1), O = 1 - L;
    const X = pick([0.5, 1, 1.5, 2, 2.5, 3, 4]);
    const stoich = k === 'lim' && Math.random() < 0.2;
    const extra = stoich ? 0 : pick([0.5, 1, 2]);
    const n = []; n[L] = round(rx.r[L][1] * X, 3); n[O] = round(rx.r[O][1] * (X + extra), 3);
    const [A, a] = rx.r[0], [B, b] = rx.r[1], xa = round(n[0] / a, 3), xb = round(n[1] / b, 3);
    const base = { eq: m(zw(rx.eq)), A: m(A), B: m(B), nA: U(n[0], 'mol'), nB: U(n[1], 'mol') };
    const lim = `${m(A)} : ${m(`${fmt(n[0])} ÷ ${a} = ${fmt(xa)}`)} ; ${m(B)} : ${m(`${fmt(n[1])} ÷ ${b} = ${fmt(xb)}`)}`;
    if (k === 'xmax') return { q: t('pc.2nde.av.xmax.q', { ...base, u: m('mol') }), kind: 'num', ans: X, exp: t('pc.2nde.av.xmax.exp', { lim, x: U(X, 'mol') }) };
    if (k === 'lim') {
      const ans = stoich ? 'both' : L === 0 ? 'A' : 'B';
      return { q: t('pc.2nde.av.lim.q', base), kind: 'choice', ans, choices: mc(ans, ['A', 'B', 'both'], (v) => (v === 'both' ? t('pc.2nde.av.both') : m(v === 'A' ? A : B))), exp: t(stoich ? 'pc.2nde.av.lim.exp.both' : 'pc.2nde.av.lim.exp', { lim, r: m(L === 0 ? A : B) }) };
    }
    if (k === 'prod') {
      const [P, pc] = pick(rx.pr).map((x, i) => (i ? x : zw(x))), np = round(pc * X, 3);
      return { q: t('pc.2nde.av.prod.q', { ...base, P: m(P), u: m('mol') }), kind: 'num', ans: np, exp: t('pc.2nde.av.prod.exp', { lim, x: U(X, 'mol'), c: m(`n(${P}) = ${pc} × ${fmt(X)} = ${fmt(np)} mol`) }) };
    }
    const rest = round(n[O] - rx.r[O][1] * X, 3);
    return { q: t('pc.2nde.av.rest.q', { ...base, E: m(rx.r[O][0]), u: m('mol') }), kind: 'num', ans: rest, exp: t('pc.2nde.av.rest.exp', { lim, x: U(X, 'mol'), c: m(`${fmt(n[O])} − ${rx.r[O][1]} × ${fmt(X)} = ${fmt(rest)} mol`) }) };
  };

  /* ---------- identifier une espèce ---------- */
  const LIQ = [['eau', 1], ['eth', 0.79], ['hui', 0.92], ['gly', 1.26]];
  GEN.pc2nde_identif = (p) => {
    const k = pick(p.kinds);
    if (k === 'rf' || k === 'dist') {
      const [H, d] = pick([[10, R(1, 9)], [8, pick([2, 4, 6])], [5, R(1, 4)], [4, R(1, 3)]]), rf = round(d / H, 3);
      if (k === 'rf') return { q: t('pc.2nde.id.rf.q', { H: U(H, 'cm'), d: U(d, 'cm') }), kind: 'num', ans: rf, exp: t('pc.2nde.id.rf.exp', { c: m(`Rf = ${fmt(d)} ÷ ${fmt(H)} = ${fmt(rf)}`) }) };
      return { q: t('pc.2nde.id.d.q', { rf: m(fmt(rf)), H: U(H, 'cm'), u: m('cm') }), kind: 'num', ans: d, exp: t('pc.2nde.id.d.exp', { c: m(`d = Rf × ${fmt(H)} = ${fmt(rf)} × ${fmt(H)} = ${fmt(d)} cm`) }) };
    }
    if (k === 'ident') {
      const rs = shuf([0.15, 0.25, 0.4, 0.55, 0.7, 0.85]).slice(0, 3), i = R(0, 2), ans = 'ABC'[i];
      return { q: t('pc.2nde.id.ident.q', { r: m(fmt(rs[i])), ra: m(fmt(rs[0])), rb: m(fmt(rs[1])), rc: m(fmt(rs[2])) }), kind: 'choice', ans, choices: mc(ans, ['A', 'B', 'C'].filter((x) => x !== ans), (v) => m(v)), exp: t('pc.2nde.id.ident.exp', { x: m(ans) }) };
    }
    if (k === 'A' || k === 'C') {
      let kk, C, A;
      do { kk = pick([100, 200, 250, 400, 500]); C = pick([0.001, 0.002, 0.004, 0.005, 0.0025, 0.01]); A = round(kk * C, 4); } while (A > 2 || A < 0.1);
      if (k === 'A') return { q: t('pc.2nde.id.A.q', { C: U(C, 'mol/L'), k: U(kk, 'L/mol') }), kind: 'num', ans: A, exp: t('pc.2nde.id.A.exp', { c: m(`A = k × C = ${fmt(kk)} × ${fmt(C)} = ${fmt(A)}`) }) };
      return { q: t('pc.2nde.id.C.q', { A: m(fmt(A)), k: U(kk, 'L/mol'), u: m('mol/L') }), kind: 'num', ans: C, exp: t('pc.2nde.id.C.exp', { c: m(`C = A ÷ k = ${fmt(A)} ÷ ${fmt(kk)} = ${fmt(C)} mol/L`) }) };
    }
    const three = shuf(LIQ).slice(0, 3), [nm, rho] = pick(three), V = pick([20, 25, 40, 50, 100]), mm = round(rho * V, 3);
    const data = m(three.map(([n2, r2]) => `ρ(${t('pc.2nde.liq.' + n2)}) = ${fmt(r2)} g/mL`).join(' ; '));
    return { q: t('pc.2nde.id.rho.q', { V: U(V, 'mL'), m: U(mm, 'g'), data }), kind: 'choice', ans: nm, choices: mc(nm, three.map((x) => x[0]).filter((x) => x !== nm), (v) => t('pc.2nde.liq.' + v)), exp: t('pc.2nde.id.rho.exp', { c: m(`ρ = m ÷ V = ${fmt(mm)} ÷ ${fmt(V)} = ${fmt(rho)} g/mL`), x: t('pc.2nde.liq.' + nm) }) };
  };

  /* ===================================================================== TEXTES */
  const S = {
    /* --- éléments --- */
    'pc.2nde.el.H': ['hydrogène', 'الهيدروجين'], 'pc.2nde.el.Li': ['lithium', 'الليثيوم'], 'pc.2nde.el.C': ['carbone', 'الكربون'], 'pc.2nde.el.N': ['azote', 'الآزوت'],
    'pc.2nde.el.O': ['oxygène', 'الأكسجين'], 'pc.2nde.el.F': ['fluor', 'الفلور'], 'pc.2nde.el.Ne': ['néon', 'النيون'], 'pc.2nde.el.Na': ['sodium', 'الصوديوم'],
    'pc.2nde.el.Mg': ['magnésium', 'المغنيزيوم'], 'pc.2nde.el.Al': ['aluminium', 'الألمنيوم'], 'pc.2nde.el.S': ['soufre', 'الكبريت'], 'pc.2nde.el.Cl': ['chlore', 'الكلور'],
    'pc.2nde.el.Ar': ['argon', 'الأرغون'], 'pc.2nde.el.Hg': ['mercure', 'الزئبق'],

    /* --- vitesse --- */
    'pc.2nde.vit.v.q': ['Un cycliste parcourt {d} en {t}, à vitesse constante. Calculer sa vitesse en {u}.', 'يقطع دراج مسافة {d} خلال {t} بسرعة ثابتة. احسب سرعته بالوحدة {u}.'],
    'pc.2nde.vit.v.exp': ['La vitesse est v = d ÷ Δt : {c}.', 'السرعة v = d ÷ Δt : {c}.'],
    'pc.2nde.vit.d.q': ['Un coureur se déplace à la vitesse constante de {v}. Quelle distance parcourt-il en {t} ? Répondre en {u}.', 'يجري عدّاء بسرعة ثابتة قدرها {v}. ما المسافة التي يقطعها خلال {t} ؟ أجب بالوحدة {u}.'],
    'pc.2nde.vit.d.exp': ['La distance est d = v × Δt : {c}.', 'المسافة d = v × Δt : {c}.'],
    'pc.2nde.vit.t.q': ['Un scooter roule à {v} sur une route droite. Combien de temps met-il pour parcourir {d} ? Répondre en {u}.', 'تسير دراجة نارية بسرعة {v} على طريق مستقيم. كم من الوقت تستغرق لتقطع {d} ؟ أجب بالوحدة {u}.'],
    'pc.2nde.vit.t.exp': ['La durée est Δt = d ÷ v : {c}.', 'المدة Δt = d ÷ v : {c}.'],
    'pc.2nde.vit.kmh.q': ['Un train roule à {v}. Exprimer cette vitesse en {u}.', 'يسير قطار بسرعة {v}. عبّر عن هذه السرعة بالوحدة {u}.'],
    'pc.2nde.vit.kmh.exp': ['Pour passer de m/s à km/h, on multiplie par 3,6 : {c}.', 'للانتقال من m/s إلى km/h نضرب في 3,6 : {c}.'],
    'pc.2nde.vit.ms.q': ['Une voiture roule à {v}. Exprimer cette vitesse en {u}.', 'تسير سيارة بسرعة {v}. عبّر عن هذه السرعة بالوحدة {u}.'],
    'pc.2nde.vit.ms.exp': ['Pour passer de km/h à m/s, on divise par 3,6 : {c}.', 'للانتقال من km/h إلى m/s نقسم على 3,6 : {c}.'],

    /* --- poids et inertie --- */
    'pc.2nde.pl.T': ['la Terre', 'الأرض'], 'pc.2nde.pl.L': ['la Lune', 'القمر'], 'pc.2nde.pl.M': ['Mars', 'المريخ'], 'pc.2nde.pl.J': ['Jupiter', 'المشتري'],
    'pc.2nde.poids.P.q': ['Sur {pl}, l’intensité de la pesanteur est g = {g}. Calculer le poids d’un objet de masse m = {m}, en {u}.', 'على {pl} شدة الجاذبية g = {g}. احسب وزن جسم كتلته m = {m} بالوحدة {u}.'],
    'pc.2nde.poids.P.exp': ['Le poids est P = m × g : {c}.', 'الوزن P = m × g : {c}.'],
    'pc.2nde.poids.m.q': ['Sur {pl}, où g = {g}, un objet a un poids P = {P}. Calculer sa masse, en {u}.', 'على {pl} حيث g = {g}، وزن جسم P = {P}. احسب كتلته بالوحدة {u}.'],
    'pc.2nde.poids.m.exp': ['La masse est m = P ÷ g : {c}.', 'الكتلة m = P ÷ g : {c}.'],
    'pc.2nde.poids.g.q': ['Un objet de masse {m} a un poids de {P} sur un astre. Calculer l’intensité de la pesanteur g sur cet astre, en {u}.', 'جسم كتلته {m} وزنه {P} على كوكب ما. احسب شدة الجاذبية g على هذا الكوكب بالوحدة {u}.'],
    'pc.2nde.poids.g.exp': ['L’intensité de la pesanteur est g = P ÷ m : {c}.', 'شدة الجاذبية g = P ÷ m : {c}.'],
    'pc.2nde.in.q': ['Dans le référentiel terrestre : {s}. Les forces qui s’exercent sur cet objet…', 'في المرجع الأرضي : {s}. القوى المؤثّرة على هذا الجسم …'],
    'pc.2nde.in.s1': ['un livre est immobile sur une table horizontale', 'كتاب ساكن على طاولة أفقية'],
    'pc.2nde.in.s2': ['un palet glisse en ligne droite, à vitesse constante, sur une table à coussin d’air', 'قرص ينزلق في خط مستقيم بسرعة ثابتة على طاولة هوائية'],
    'pc.2nde.in.s3': ['une voiture accélère sur une route droite', 'سيارة تتسارع على طريق مستقيم'],
    'pc.2nde.in.s4': ['une pierre attachée à un fil tourne en cercle à vitesse constante', 'حجر مربوط بخيط يدور في مسار دائري بسرعة ثابتة'],
    'pc.2nde.in.s5': ['un parachutiste descend en ligne droite à vitesse constante', 'مظلّي ينزل في خط مستقيم بسرعة ثابتة'],
    'pc.2nde.in.s6': ['une bille tombe de plus en plus vite', 'كرة تسقط بسرعة تتزايد باستمرار'],
    'pc.2nde.in.yes': ['se compensent', 'متكافئة'], 'pc.2nde.in.no': ['ne se compensent pas', 'غير متكافئة'],
    'pc.2nde.in.exp.y': ['L’objet est immobile ou en mouvement rectiligne uniforme : d’après le principe d’inertie, les forces se compensent.', 'الجسم ساكن أو في حركة مستقيمة منتظمة : حسب مبدأ العطالة القوى متكافئة.'],
    'pc.2nde.in.exp.n': ['La vitesse change (en valeur ou en direction) : les forces ne se compensent pas.', 'السرعة تتغيّر (في القيمة أو في الاتجاه) : القوى غير متكافئة.'],
    'pc.2nde.in.motion.q': ['Un objet est soumis à des forces qui se compensent. Quel mouvement peut-il avoir ?', 'جسم خاضع لقوى متكافئة. ما الحركة الممكنة له ؟'],
    'pc.2nde.in.m1': ['immobile, ou rectiligne uniforme', 'ساكن، أو حركة مستقيمة منتظمة'], 'pc.2nde.in.m2': ['rectiligne accéléré', 'حركة مستقيمة متسارعة'],
    'pc.2nde.in.m3': ['circulaire uniforme', 'حركة دائرية منتظمة'], 'pc.2nde.in.m4': ['rectiligne ralenti', 'حركة مستقيمة متباطئة'],
    'pc.2nde.in.motion.exp': ['Si les forces se compensent, la vitesse ne change pas : l’objet est immobile ou en mouvement rectiligne uniforme.', 'إذا تكافأت القوى فإن السرعة لا تتغيّر : الجسم ساكن أو في حركة مستقيمة منتظمة.'],

    /* --- signaux sonores --- */
    'pc.2nde.sig.f.q': ['L’oscillogramme d’un son périodique donne une période T = {T}. Calculer la fréquence f du son, en {u}.', 'يعطي راسم الإهتزاز لصوت دوري دورا T = {T}. احسب تواتر الصوت f بالوحدة {u}.'],
    'pc.2nde.sig.f.exp': ['La fréquence est f = 1 ÷ T : {c}.', 'التواتر f = 1 ÷ T : {c}.'],
    'pc.2nde.sig.T.q': ['Un diapason émet un son de fréquence f = {f}. Calculer sa période T, en {u}.', 'تصدر شوكة رنانة صوتا تواتره f = {f}. احسب دوره T بالوحدة {u}.'],
    'pc.2nde.sig.T.exp': ['La période est T = 1 ÷ f : {c}.', 'الدور T = 1 ÷ f : {c}.'],
    'pc.2nde.sig.echo.q': ['Un sonar émet un son qui revient après réflexion sur un obstacle au bout de {t}. La vitesse du son dans l’air est 340 m/s. À quelle distance de l’obstacle se trouve le sonar ? Répondre en {u}.', 'يصدر مسبار صوتيا صوتا يعود بعد انعكاسه على حاجز بعد {t}. سرعة الصوت في الهواء 340 m/s. على أي مسافة من الحاجز يوجد المسبار ؟ أجب بالوحدة {u}.'],
    'pc.2nde.sig.echo.exp': ['Le son fait un aller-retour, donc la distance est la moitié de v × Δt : {c}.', 'يقطع الصوت ذهابا وإيابا، إذن المسافة نصف v × Δt : {c}.'],
    'pc.2nde.sig.pitch.q': ['Deux sons ont pour fréquences {a} et {b}. Lequel est le plus aigu ?', 'صوتان تواترهما {a} و {b}. أيّهما أحدّ ؟'],
    'pc.2nde.sig.same': ['Ils ont la même hauteur', 'لهما نفس الحدّة'],
    'pc.2nde.sig.pitch.exp': ['Plus la fréquence est grande, plus le son est aigu : {big} > {small}.', 'كلما كبر التواتر كان الصوت أحدّ : {big} > {small}.'],
    'pc.2nde.sig.range.q': ['Un son a pour fréquence {f}. L’oreille humaine perçoit les sons de 20 Hz à 20 000 Hz. Ce son est…', 'تواتر صوت ما {f}. تسمع الأذن البشرية الأصوات من 20 Hz إلى 20 000 Hz. هذا الصوت …'],
    'pc.2nde.sig.r.inf': ['un infrason (non audible)', 'صوت تحت سمعي (غير مسموع)'], 'pc.2nde.sig.r.ult': ['un ultrason (non audible)', 'موجة فوق صوتية (غير مسموعة)'], 'pc.2nde.sig.r.aud': ['un son audible', 'صوت مسموع'],
    'pc.2nde.sig.range.exp': ['{f} est en dehors ou à l’intérieur de l’intervalle de 20 Hz à 20 000 Hz : c’est {r}.', 'نقارن {f} بالمجال من 20 Hz إلى 20 000 Hz : إنه {r}.'],

    /* --- réfraction --- */
    'pc.2nde.ref.n.q': ['Dans un milieu transparent, la lumière se propage à la vitesse v = {v}. Sachant que c = {c} dans le vide, calculer l’indice de réfraction n du milieu.', 'ينتشر الضوء في وسط شفاف بسرعة v = {v}. علما أن c = {c} في الفراغ، احسب قرينة انكسار الوسط n.'],
    'pc.2nde.ref.n.exp': ['L’indice est n = c ÷ v : {c}.', 'القرينة n = c ÷ v : {c}.'],
    'pc.2nde.ref.v.q': ['Un milieu transparent a pour indice de réfraction n = {n}. Calculer la vitesse v de la lumière dans ce milieu, exprimée en {u} (c = {c}).', 'قرينة انكسار وسط شفاف n = {n}. احسب سرعة الضوء v في هذا الوسط بالوحدة {u} (c = {c}).'],
    'pc.2nde.ref.v.exp': ['La vitesse est v = c ÷ n : {c}.', 'السرعة v = c ÷ n : {c}.'],
    'pc.2nde.ref.sin.q': ['Un rayon lumineux passe d’un milieu d’indice n₁ = {n1} à un milieu d’indice n₂ = {n2}. L’angle d’incidence est i₁ = 30° (sin 30° = 0,5). Calculer sin i₂.', 'ينتقل شعاع ضوئي من وسط قرينته n₁ = {n1} إلى وسط قرينته n₂ = {n2}. زاوية الورود i₁ = 30° (sin 30° = 0,5). احسب sin i₂.'],
    'pc.2nde.ref.sin.exp': ['D’après la loi de Snell-Descartes, n₁ sin i₁ = n₂ sin i₂, donc sin i₂ = n₁ sin i₁ ÷ n₂ : {c}.', 'حسب قانون سنيل-ديكارت n₁ sin i₁ = n₂ sin i₂ ومنه sin i₂ = n₁ sin i₁ ÷ n₂ : {c}.'],
    'pc.2nde.ref.dir.q': ['Un rayon lumineux passe {a} sous une incidence oblique. Indices : air 1, eau 1,33, verre 1,5. Le rayon réfracté…', 'ينتقل شعاع ضوئي {a} بورود مائل. القرائن : الهواء 1، الماء 1,33، الزجاج 1,5. الشعاع المنكسر …'],
    'pc.2nde.ref.av': ['de l’air vers le verre', 'من الهواء إلى الزجاج'], 'pc.2nde.ref.ae': ['de l’air vers l’eau', 'من الهواء إلى الماء'],
    'pc.2nde.ref.ea': ['de l’eau vers l’air', 'من الماء إلى الهواء'], 'pc.2nde.ref.va': ['du verre vers l’air', 'من الزجاج إلى الهواء'],
    'pc.2nde.ref.ev': ['de l’eau vers le verre', 'من الماء إلى الزجاج'], 'pc.2nde.ref.ve': ['du verre vers l’eau', 'من الزجاج إلى الماء'],
    'pc.2nde.ref.d.near': ['se rapproche de la normale', 'يقترب من الناظم'], 'pc.2nde.ref.d.far': ['s’éloigne de la normale', 'يبتعد عن الناظم'], 'pc.2nde.ref.d.none': ['n’est pas dévié', 'لا ينحرف'],
    'pc.2nde.ref.dir.exp': ['On compare n₁ = {n1} et n₂ = {n2} : dans un milieu d’indice plus grand le rayon se rapproche de la normale, dans un milieu d’indice plus petit il s’en éloigne. Ici, le rayon {d}.', 'نقارن n₁ = {n1} و n₂ = {n2} : في وسط قرينته أكبر يقترب الشعاع من الناظم، وفي وسط قرينته أصغر يبتعد عنه. هنا الشعاع {d}.'],

    /* --- spectres --- */
    'pc.2nde.sp.dom.q': ['Une radiation lumineuse a pour longueur d’onde λ = {l}. Le domaine visible s’étend de 400 nm à 800 nm. De quel domaine s’agit-il ?', 'لإشعاع ضوئي طول موجة λ = {l}. المجال المرئي يمتد من 400 nm إلى 800 nm. إلى أي مجال ينتمي ؟'],
    'pc.2nde.sp.d.uv': ['ultraviolet', 'فوق البنفسجي'], 'pc.2nde.sp.d.vis': ['visible', 'المرئي'], 'pc.2nde.sp.d.ir': ['infrarouge', 'تحت الأحمر'],
    'pc.2nde.sp.dom.exp.uv': ['λ = {l} est inférieure à 400 nm : c’est un ultraviolet.', 'λ = {l} أصغر من 400 nm : إنه فوق بنفسجي.'],
    'pc.2nde.sp.dom.exp.vis': ['λ = {l} est comprise entre 400 nm et 800 nm : c’est une radiation visible.', 'λ = {l} محصورة بين 400 nm و 800 nm : إنه إشعاع مرئي.'],
    'pc.2nde.sp.dom.exp.ir': ['λ = {l} est supérieure à 800 nm : c’est un infrarouge.', 'λ = {l} أكبر من 800 nm : إنه تحت أحمر.'],
    'pc.2nde.sp.type.q': ['Quel type de spectre observe-t-on avec {s} ?', 'ما نوع الطيف الذي نلاحظه مع {s} ؟'],
    'pc.2nde.sp.s.a': ['la lumière d’une lampe à incandescence', 'ضوء مصباح متوهّج'], 'pc.2nde.sp.s.b': ['la lumière d’un morceau de fer chauffé au rouge', 'ضوء قطعة حديد محمّاة إلى الاحمرار'],
    'pc.2nde.sp.s.c': ['une lampe à vapeur de sodium (gaz chaud sous faible pression)', 'مصباح بخار الصوديوم (غاز ساخن تحت ضغط منخفض)'],
    'pc.2nde.sp.s.d': ['un tube contenant du néon, excité par une décharge électrique', 'أنبوب يحتوي على النيون، تثيره شرارة كهربائية'],
    'pc.2nde.sp.s.e': ['la lumière blanche après la traversée d’un gaz froid', 'الضوء الأبيض بعد عبوره غازا باردا'],
    'pc.2nde.sp.t.cont': ['un spectre continu', 'طيف مستمر'], 'pc.2nde.sp.t.emi': ['un spectre de raies d’émission', 'طيف خطوط الإصدار'], 'pc.2nde.sp.t.abs': ['un spectre de raies d’absorption', 'طيف خطوط الامتصاص'],
    'pc.2nde.sp.type.exp.cont': ['Un corps très chaud émet toutes les couleurs : spectre continu.', 'الجسم الساخن جدا يصدر كل الألوان : طيف مستمر.'],
    'pc.2nde.sp.type.exp.emi': ['Un gaz chaud sous faible pression émet quelques raies colorées sur fond noir : spectre de raies d’émission.', 'الغاز الساخن تحت ضغط منخفض يصدر بعض الخطوط الملونة على خلفية سوداء : طيف خطوط الإصدار.'],
    'pc.2nde.sp.type.exp.abs': ['Le gaz absorbe certaines longueurs d’onde de la lumière blanche : on voit des raies noires, c’est un spectre de raies d’absorption.', 'يمتص الغاز بعض أطوال موجات الضوء الأبيض : نرى خطوطا سوداء، إنه طيف خطوط الامتصاص.'],
    'pc.2nde.sp.hot.q': ['Quand la température d’un corps chaud augmente, la lumière qu’il émet tire de plus en plus vers…', 'عندما ترتفع درجة حرارة جسم ساخن، يميل الضوء الذي يصدره أكثر فأكثر نحو اللون …'],
    'pc.2nde.sp.c.blue': ['le bleu', 'الأزرق'], 'pc.2nde.sp.c.red': ['le rouge', 'الأحمر'], 'pc.2nde.sp.c.green': ['le vert', 'الأخضر'],
    'pc.2nde.sp.hot.exp': ['Plus un objet est chaud, plus sa lumière tire vers le bleu.', 'كلما كان الجسم أسخن مال ضوءه إلى الأزرق.'],
    'pc.2nde.sp.elem.q': ['Le spectre d’absorption d’une étoile présente des raies noires à {l}. Raies d’émission de référence : hydrogène {h} ; sodium {s} ; mercure {g}. Quel élément cette étoile contient-elle ?', 'يظهر في طيف الامتصاص لنجم خطوط سوداء عند {l}. خطوط الإصدار المرجعية : الهيدروجين {h} ; الصوديوم {s} ; الزئبق {g}. أي عنصر يحتويه هذا النجم ؟'],
    'pc.2nde.sp.elem.exp': ['Les raies noires coïncident avec les raies de l’élément {el} : chaque élément a ses raies propres, comme une empreinte.', 'الخطوط السوداء تنطبق على خطوط العنصر {el} : لكل عنصر خطوطه الخاصة كالبصمة.'],

    /* --- loi d’Ohm --- */
    'pc.2nde.ohm.U.q': ['Un conducteur ohmique de résistance R = {R} est parcouru par un courant d’intensité I = {I}. Calculer la tension U à ses bornes, en {u}.', 'ناقل أومي مقاومته R = {R} يجتازه تيار شدته I = {I}. احسب التوتر U بين مربطيه بالوحدة {u}.'],
    'pc.2nde.ohm.U.exp': ['D’après la loi d’Ohm, U = R × I : {c}.', 'حسب قانون أوم U = R × I : {c}.'],
    'pc.2nde.ohm.I.q': ['La tension aux bornes d’un conducteur ohmique de résistance R = {R} est U = {U}. Calculer l’intensité I du courant, en {u}.', 'التوتر بين مربطي ناقل أومي مقاومته R = {R} هو U = {U}. احسب شدة التيار I بالوحدة {u}.'],
    'pc.2nde.ohm.I.exp': ['D’après la loi d’Ohm, I = U ÷ R : {c}.', 'حسب قانون أوم I = U ÷ R : {c}.'],
    'pc.2nde.ohm.R.q': ['Un conducteur ohmique soumis à la tension U = {U} est traversé par un courant d’intensité I = {I}. Calculer sa résistance R, en {u}.', 'ناقل أومي مطبّق عليه التوتر U = {U} يجتازه تيار شدته I = {I}. احسب مقاومته R بالوحدة {u}.'],
    'pc.2nde.ohm.R.exp': ['D’après la loi d’Ohm, R = U ÷ I : {c}.', 'حسب قانون أوم R = U ÷ I : {c}.'],
    'pc.2nde.ohm.mA.q': ['Une résistance R = {R} est traversée par un courant d’intensité I = {I}. Calculer la tension U à ses bornes, en {u}. (1 mA = 0,001 A)', 'مقاومة R = {R} يجتازها تيار شدته I = {I}. احسب التوتر U بين مربطيها بالوحدة {u}. (1 mA = 0,001 A)'],
    'pc.2nde.ohm.mA.exp': ['On convertit I en ampères, puis U = R × I : {c}.', 'نحوّل I إلى الأمبير ثم U = R × I : {c}.'],
    'pc.2nde.ohm.imA.q': ['Une résistance R = {R} est soumise à la tension U = {U}. Calculer l’intensité du courant qui la traverse, en {u}.', 'مقاومة R = {R} مطبّق عليها التوتر U = {U}. احسب شدة التيار المار فيها بالوحدة {u}.'],
    'pc.2nde.ohm.imA.exp': ['I = U ÷ R en ampères, puis on convertit en milliampères : {c}.', 'I = U ÷ R بالأمبير ثم نحوّل إلى ميلي أمبير : {c}.'],

    /* --- circuits --- */
    'pc.2nde.ci.node.sum.q': ['Un courant se partage en deux branches en dérivation : I₁ = {I1} dans la première et I₂ = {I2} dans la seconde. Calculer l’intensité I dans la branche principale, en {u}.', 'ينقسم تيار إلى فرعين على التفرع : I₁ = {I1} في الأول و I₂ = {I2} في الثاني. احسب شدة التيار I في الفرع الرئيسي بالوحدة {u}.'],
    'pc.2nde.ci.node.sum.exp': ['Loi des nœuds : I = I₁ + I₂ : {c}.', 'قانون العقد : I = I₁ + I₂ : {c}.'],
    'pc.2nde.ci.node.diff.q': ['Un courant d’intensité I = {I} arrive à un nœud et se partage en deux branches. Dans la première, I₁ = {I1}. Calculer l’intensité I₂ dans la seconde, en {u}.', 'يصل تيار شدته I = {I} إلى عقدة وينقسم إلى فرعين. في الأول I₁ = {I1}. احسب الشدة I₂ في الثاني بالوحدة {u}.'],
    'pc.2nde.ci.node.diff.exp': ['Loi des nœuds : I = I₁ + I₂, donc I₂ = I − I₁ : {c}.', 'قانون العقد : I = I₁ + I₂ ومنه I₂ = I − I₁ : {c}.'],
    'pc.2nde.ci.mesh.E.q': ['Un générateur alimente en série deux dipôles dont les tensions sont U₁ = {U1} et U₂ = {U2}. Calculer la tension E du générateur, en {u}.', 'مولّد يغذّي على التسلسل ثنائيي قطب توتراهما U₁ = {U1} و U₂ = {U2}. احسب توتر المولّد E بالوحدة {u}.'],
    'pc.2nde.ci.mesh.E.exp': ['Loi des mailles : E = U₁ + U₂ : {c}.', 'قانون العُرى : E = U₁ + U₂ : {c}.'],
    'pc.2nde.ci.mesh.U.q': ['Un générateur de tension E = {E} alimente en série deux dipôles. La tension aux bornes du premier est U₁ = {U1}. Calculer U₂, en {u}.', 'مولّد توتره E = {E} يغذّي على التسلسل ثنائيي قطب. التوتر بين مربطي الأول U₁ = {U1}. احسب U₂ بالوحدة {u}.'],
    'pc.2nde.ci.mesh.U.exp': ['Loi des mailles : E = U₁ + U₂, donc U₂ = E − U₁ : {c}.', 'قانون العُرى : E = U₁ + U₂ ومنه U₂ = E − U₁ : {c}.'],
    'pc.2nde.ci.serie2.q': ['Deux conducteurs ohmiques de résistances R₁ = {R1} et R₂ = {R2} sont associés en série. Calculer la résistance équivalente, en {u}.', 'ناقلان أوميان مقاومتاهما R₁ = {R1} و R₂ = {R2} مركّبان على التسلسل. احسب المقاومة المكافئة بالوحدة {u}.'],
    'pc.2nde.ci.serie3.q': ['Trois conducteurs ohmiques de résistances R₁ = {R1}, R₂ = {R2} et R₃ = {R3} sont associés en série. Calculer la résistance équivalente, en {u}.', 'ثلاثة نواقل أومية مقاوماتها R₁ = {R1} و R₂ = {R2} و R₃ = {R3} مركّبة على التسلسل. احسب المقاومة المكافئة بالوحدة {u}.'],
    'pc.2nde.ci.serie.exp': ['En série, les résistances s’ajoutent : {c}.', 'على التسلسل تُجمع المقاومات : {c}.'],
    'pc.2nde.ci.deriv.q': ['Deux conducteurs ohmiques de résistances R₁ = {R1} et R₂ = {R2} sont associés en dérivation. Calculer la résistance équivalente R, en {u}.', 'ناقلان أوميان مقاومتاهما R₁ = {R1} و R₂ = {R2} مركّبان على التفرع. احسب المقاومة المكافئة R بالوحدة {u}.'],
    'pc.2nde.ci.deriv.exp': ['En dérivation, 1/R = 1/R₁ + 1/R₂, donc R = R₁R₂ ÷ (R₁ + R₂) : {c}.', 'على التفرع 1/R = 1/R₁ + 1/R₂ ومنه R = R₁R₂ ÷ (R₁ + R₂) : {c}.'],
    'pc.2nde.ci.serieI.q': ['Un générateur de tension E = {E} alimente deux conducteurs ohmiques de résistances {R1} et {R2} montés en série. Calculer l’intensité du courant dans le circuit, en {u}.', 'مولّد توتره E = {E} يغذّي ناقلين أوميين مقاومتاهما {R1} و {R2} مركّبين على التسلسل. احسب شدة التيار في الدارة بالوحدة {u}.'],
    'pc.2nde.ci.serieI.exp': ['On calcule la résistance totale, puis on applique la loi d’Ohm : {c}.', 'نحسب المقاومة الكلية ثم نطبّق قانون أوم : {c}.'],

    /* --- quantité de matière --- */
    'pc.2nde.mo.M.q': ['Calculer la masse molaire de {f}, en {u}. Données : {data}.', 'احسب الكتلة المولية لـ {f} بالوحدة {u}. معطيات : {data}.'],
    'pc.2nde.mo.M.exp': ['On additionne les masses molaires atomiques : M({f}) = {c}.', 'نجمع الكتل المولية الذرية : M({f}) = {c}.'],
    'pc.2nde.mo.n.q': ['Un échantillon de {f} a pour masse m = {m}. Sa masse molaire est M = {M}. Calculer la quantité de matière n de l’échantillon, en {u}.', 'عيّنة من {f} كتلتها m = {m} وكتلتها المولية M = {M}. احسب كمية المادة n في العيّنة بالوحدة {u}.'],
    'pc.2nde.mo.n.exp': ['La quantité de matière est n = m ÷ M : {c}.', 'كمية المادة n = m ÷ M : {c}.'],
    'pc.2nde.mo.m.q': ['On dispose de n = {n} de {f}, de masse molaire M = {M}. Calculer la masse m de l’échantillon, en {u}.', 'لدينا n = {n} من {f} كتلته المولية M = {M}. احسب كتلة العيّنة m بالوحدة {u}.'],
    'pc.2nde.mo.m.exp': ['La masse est m = n × M : {c}.', 'الكتلة m = n × M : {c}.'],
    'pc.2nde.mo.N.q': ['Un échantillon contient n = {n} de {f}. Sachant que Nₐ = {na}, calculer le nombre N d’entités chimiques. Écrire N sous la forme N = x × 10<sup>23</sup> et répondre par la valeur de x.', 'عيّنة تحتوي على n = {n} من {f}. علما أن Nₐ = {na}، احسب عدد الأفراد الكيميائية N. اكتب N على الشكل N = x × 10<sup>23</sup> وأجب بقيمة x.'],
    'pc.2nde.mo.N.exp': ['Le nombre d’entités est N = n × Nₐ : {c}.', 'عدد الأفراد الكيميائية N = n × Nₐ : {c}.'],

    /* --- concentration --- */
    'pc.2nde.co.C.q': ['On dissout {n} de soluté dans de l’eau pour obtenir {V} de solution. Calculer la concentration C de la solution, en {u}.', 'نذيب {n} من المذاب في الماء للحصول على {V} من المحلول. احسب تركيز المحلول C بالوحدة {u}.'],
    'pc.2nde.co.C.exp': ['La concentration est C = n ÷ V : {c}.', 'التركيز C = n ÷ V : {c}.'],
    'pc.2nde.co.n.q': ['Une solution de volume {V} a pour concentration C = {C}. Calculer la quantité de matière de soluté qu’elle contient, en {u}.', 'محلول حجمه {V} وتركيزه C = {C}. احسب كمية مادة المذاب فيه بالوحدة {u}.'],
    'pc.2nde.co.n.exp': ['Avec V en litres, n = C × V : {c}.', 'مع V باللتر n = C × V : {c}.'],
    'pc.2nde.co.V.q': ['On veut prélever une quantité de soluté n = {n} dans une solution de concentration C = {C}. Quel volume de solution faut-il prélever ? Répondre en {u}.', 'نريد أخذ كمية من المذاب n = {n} من محلول تركيزه C = {C}. ما حجم المحلول الواجب أخذه ؟ أجب بالوحدة {u}.'],
    'pc.2nde.co.V.exp': ['Le volume est V = n ÷ C : {c}.', 'الحجم V = n ÷ C : {c}.'],
    'pc.2nde.co.Cm.q': ['Une solution de {f} (M = {M}) a pour concentration C = {C}. Calculer sa concentration massique Cm, en {u}.', 'محلول لـ {f} (M = {M}) تركيزه المولي C = {C}. احسب تركيزه الكتلي Cm بالوحدة {u}.'],
    'pc.2nde.co.Cm.exp': ['Cm = C × M : {c}.', 'Cm = C × M : {c}.'],
    'pc.2nde.co.C2.q': ['Une solution de {f} (M = {M}) a pour concentration massique Cm = {Cm}. Calculer sa concentration C, en {u}.', 'محلول لـ {f} (M = {M}) تركيزه الكتلي Cm = {Cm}. احسب تركيزه المولي C بالوحدة {u}.'],
    'pc.2nde.co.C2.exp': ['C = Cm ÷ M : {c}.', 'C = Cm ÷ M : {c}.'],
    'pc.2nde.co.mass.q': ['On veut préparer {V} de solution de {f} de concentration C = {C} (M = {M}). Quelle masse de soluté faut-il peser ? Répondre en {u}.', 'نريد تحضير {V} من محلول {f} تركيزه C = {C} (M = {M}). ما كتلة المذاب الواجب وزنها ؟ أجب بالوحدة {u}.'],
    'pc.2nde.co.mass.exp': ['n = C × V, puis m = n × M : {c}.', 'n = C × V ثم m = n × M : {c}.'],

    /* --- dilution --- */
    'pc.2nde.di.V1.q': ['On dispose d’une solution mère de concentration C₁ = {C1}. On veut préparer {V2} de solution fille de concentration C₂ = {C2}. Quel volume V₁ de solution mère faut-il prélever ? Répondre en {u}.', 'لدينا محلول أم تركيزه C₁ = {C1}. نريد تحضير {V2} من محلول ابن تركيزه C₂ = {C2}. ما الحجم V₁ من المحلول الأم الواجب أخذه ؟ أجب بالوحدة {u}.'],
    'pc.2nde.di.V1.exp': ['La quantité de matière de soluté se conserve : C₁V₁ = C₂V₂, donc V₁ = C₂ × V₂ ÷ C₁ : {c}.', 'تبقى كمية مادة المذاب ثابتة : C₁V₁ = C₂V₂ ومنه V₁ = C₂ × V₂ ÷ C₁ : {c}.'],
    'pc.2nde.di.C2.q': ['On prélève {V1} d’une solution de concentration C₁ = {C1}, puis on complète avec de l’eau distillée jusqu’à {V2}. Calculer la concentration C₂ de la solution obtenue, en {u}.', 'نأخذ {V1} من محلول تركيزه C₁ = {C1} ثم نكمّل بالماء المقطر حتى {V2}. احسب تركيز المحلول الناتج C₂ بالوحدة {u}.'],
    'pc.2nde.di.C2.exp': ['C₁V₁ = C₂V₂, donc C₂ = C₁ × V₁ ÷ V₂ : {c}.', 'C₁V₁ = C₂V₂ ومنه C₂ = C₁ × V₁ ÷ V₂ : {c}.'],
    'pc.2nde.di.F.q': ['On dilue une solution de concentration C₁ = {C1} pour obtenir une solution de concentration C₂ = {C2}. Calculer le facteur de dilution F = C₁ ÷ C₂.', 'نخفّف محلولا تركيزه C₁ = {C1} للحصول على محلول تركيزه C₂ = {C2}. احسب عامل التخفيف F = C₁ ÷ C₂.'],
    'pc.2nde.di.F.exp': ['Le facteur de dilution est F = C₁ ÷ C₂ : {c}.', 'عامل التخفيف F = C₁ ÷ C₂ : {c}.'],
    'pc.2nde.di.eau.q': ['Pour préparer {V2} de solution de concentration C₂ = {C2} à partir d’une solution mère de concentration C₁ = {C1}, on prélève un volume V₁ de solution mère puis on complète avec de l’eau distillée. Quel volume d’eau distillée ajoute-t-on au prélèvement ? Répondre en {u}.', 'لتحضير {V2} من محلول تركيزه C₂ = {C2} انطلاقا من محلول أم تركيزه C₁ = {C1}، نأخذ حجما V₁ من المحلول الأم ثم نكمّل بالماء المقطر. ما حجم الماء المقطر المضاف إلى العيّنة المأخوذة ؟ أجب بالوحدة {u}.'],
    'pc.2nde.di.eau.exp': ['On calcule V₁ avec C₁V₁ = C₂V₂, puis on retranche : {c}.', 'نحسب V₁ بالعلاقة C₁V₁ = C₂V₂ ثم نطرح : {c}.'],

    /* --- atomes et ions --- */
    'pc.2nde.at.lose': ['perd', 'تفقد'], 'pc.2nde.at.gain': ['gagne', 'تكتسب'],
    'pc.2nde.at.val.q': ['L’élément {el} (symbole {sym}) a pour numéro atomique Z = {Z}. Combien d’électrons de valence possède son atome ?', 'العنصر {el} (الرمز {sym}) عدده الذري Z = {Z}. كم إلكترونا تكافؤيا تملك ذرته ؟'],
    'pc.2nde.at.val.exp': ['Structure électronique : {cfg}. La dernière couche contient {v} électrons : ce sont les électrons de valence.', 'البنية الإلكترونية : {cfg}. تحتوي الطبقة الأخيرة على {v} إلكترونات : هي الإلكترونات التكافؤية.'],
    'pc.2nde.at.cfg.q': ['L’élément {el} (symbole {sym}) a pour numéro atomique Z = {Z}. Quelle est la structure électronique de son atome ?', 'العنصر {el} (الرمز {sym}) عدده الذري Z = {Z}. ما البنية الإلكترونية لذرته ؟'],
    'pc.2nde.at.cfg.exp': ['L’atome est neutre : il a {Z} électrons. On remplit la couche K (2 au maximum), puis L (8 au maximum), puis M : {cfg}.', 'الذرة معتدلة : لها {Z} إلكترونا. نملأ الطبقة K (2 على الأكثر) ثم L (8 على الأكثر) ثم M : {cfg}.'],
    'pc.2nde.at.ion.q': ['L’atome de l’élément {el} (symbole {sym}) a pour structure électronique {cfg}. Quel ion monoatomique stable forme-t-il ?', 'ذرة العنصر {el} (الرمز {sym}) بنيتها الإلكترونية {cfg}. ما الشاردة وحيدة الذرة المستقرة التي تتشكل منها ؟'],
    'pc.2nde.at.ion.exp': ['Pour avoir une couche externe saturée comme un gaz noble, l’atome {act} {k} électron(s) : on obtient l’ion {ion}.', 'للحصول على طبقة خارجية مشبعة مثل الغاز النبيل، الذرة {act} {k} إلكترون : نحصل على الشاردة {ion}.'],
    'pc.2nde.at.elec.q': ['Combien d’électrons possède l’ion {ion}, sachant que l’élément {sym} a pour numéro atomique Z = {Z} ?', 'كم إلكترونا تملك الشاردة {ion} علما أن العدد الذري للعنصر {sym} هو Z = {Z} ؟'],
    'pc.2nde.at.elec.exp': ['L’atome neutre a {Z} électrons ; pour former l’ion, il {act} {k} électron(s) : {c}.', 'الذرة المعتدلة لها {Z} إلكترونا ; ولتشكيل الشاردة {act} {k} إلكترون : {c}.'],

    /* --- liaisons --- */
    'pc.2nde.li.duet': ['la règle du duet (2 électrons)', 'قاعدة الثنائية (إلكترونان)'], 'pc.2nde.li.octet': ['la règle de l’octet (8 électrons)', 'قاعدة الثمانية (8 إلكترونات)'],
    'pc.2nde.li.nb.q': ['Combien de liaisons covalentes l’atome de l’élément {el} (symbole {sym}, Z = {Z}) forme-t-il pour saturer sa couche externe ?', 'كم رابطة تساهمية تشكّلها ذرة العنصر {el} (الرمز {sym}، Z = {Z}) لتشبع طبقتها الخارجية ؟'],
    'pc.2nde.li.nb.exp': ['Structure électronique : {cfg}. Pour respecter {rule}, il manque {k} électron(s) : l’atome forme {k} liaison(s).', 'البنية الإلكترونية : {cfg}. لتحقيق {rule} ينقصها {k} إلكترون : تشكّل الذرة {k} رابطة.'],
    'pc.2nde.li.l.q': ['Dans la molécule {f}, combien y a-t-il de doublets liants ? (Une liaison double compte pour deux doublets liants.)', 'كم زوجا رابطا في الجزيء {f} ؟ (الرابطة المضاعفة تحتسب زوجين رابطين.)'],
    'pc.2nde.li.nl.q': ['Dans la molécule {f}, combien y a-t-il de doublets non liants au total ?', 'كم زوجا غير رابط في المجموع في الجزيء {f} ؟'],
    'pc.2nde.li.exp': ['Électrons de valence de {f} : {c}, soit {dt} doublet(s). Il y a {l} doublet(s) liant(s) et {nl} doublet(s) non liant(s).', 'الإلكترونات التكافؤية في {f} : {c}، أي {dt} أزواج. فيه {l} أزواج رابطة و {nl} أزواج غير رابطة.'],
    'pc.2nde.li.geom.q': ['Quelle est la géométrie de la molécule {f} ?', 'ما الشكل الهندسي للجزيء {f} ؟'],
    'pc.2nde.li.g.lin': ['linéaire', 'خطي'], 'pc.2nde.li.g.cou': ['coudée', 'منحنٍ'], 'pc.2nde.li.g.tet': ['tétraédrique', 'رباعي الأوجه'],
    'pc.2nde.li.geom.exp': ['La molécule {f} est {g}.', 'الجزيء {f} {g}.'],

    /* --- avancement --- */
    'pc.2nde.av.xmax.q': ['On réalise la transformation d’équation {eq}. À l’état initial : n({A}) = {nA} et n({B}) = {nB}. Calculer l’avancement maximal x<sub>max</sub>, en {u}.', 'ننجز التحول الذي معادلته {eq}. في الحالة الابتدائية : n({A}) = {nA} و n({B}) = {nB}. احسب التقدم الأقصى x<sub>ma​x</sub> بالوحدة {u}.'],
    'pc.2nde.av.xmax.exp': ['On divise chaque quantité par son nombre stœchiométrique : {lim}. Le plus petit résultat donne x<sub>max</sub> = {x}.', 'نقسم كل كمية على معاملها الستوكيومتري : {lim}. أصغر نتيجة تعطي x<sub>max</sub> = {x}.'],
    'pc.2nde.av.lim.q': ['On réalise la transformation d’équation {eq}. À l’état initial : n({A}) = {nA} et n({B}) = {nB}. Quel est le réactif limitant ?', 'ننجز التحول الذي معادلته {eq}. في الحالة الابتدائية : n({A}) = {nA} و n({B}) = {nB}. ما المتفاعل المحدّ ؟'],
    'pc.2nde.av.both': ['Aucun : mélange stœchiométrique', 'لا أحد : مزيج ستوكيومتري'],
    'pc.2nde.av.lim.exp': ['On divise chaque quantité par son nombre stœchiométrique : {lim}. Le plus petit résultat correspond au réactif limitant : {r}.', 'نقسم كل كمية على معاملها الستوكيومتري : {lim}. أصغر نتيجة توافق المتفاعل المحدّ : {r}.'],
    'pc.2nde.av.lim.exp.both': ['On divise chaque quantité par son nombre stœchiométrique : {lim}. Les deux résultats sont égaux : les deux réactifs sont consommés entièrement (mélange stœchiométrique).', 'نقسم كل كمية على معاملها الستوكيومتري : {lim}. النتيجتان متساويتان : يُستهلك المتفاعلان كليا (مزيج ستوكيومتري).'],
    'pc.2nde.av.prod.q': ['On réalise la transformation d’équation {eq}. À l’état initial : n({A}) = {nA} et n({B}) = {nB}. Quelle quantité de {P} est formée à l’état final ? Répondre en {u}.', 'ننجز التحول الذي معادلته {eq}. في الحالة الابتدائية : n({A}) = {nA} و n({B}) = {nB}. ما كمية {P} المتكوّنة في الحالة النهائية ؟ أجب بالوحدة {u}.'],
    'pc.2nde.av.prod.exp': ['{lim}. Donc x<sub>max</sub> = {x}, puis {c}.', '{lim}. إذن x<sub>max</sub> = {x} ثم {c}.'],
    'pc.2nde.av.rest.q': ['On réalise la transformation d’équation {eq}. À l’état initial : n({A}) = {nA} et n({B}) = {nB}. Quelle quantité de {E} reste-t-il à l’état final ? Répondre en {u}.', 'ننجز التحول الذي معادلته {eq}. في الحالة الابتدائية : n({A}) = {nA} و n({B}) = {nB}. ما كمية {E} المتبقية في الحالة النهائية ؟ أجب بالوحدة {u}.'],
    'pc.2nde.av.rest.exp': ['{lim}. Donc x<sub>max</sub> = {x}. Quantité restante = quantité initiale − coefficient × x<sub>max</sub> : {c}.', '{lim}. إذن x<sub>max</sub> = {x}. الكمية المتبقية = الكمية الابتدائية − المعامل × x<sub>max</sub> : {c}.'],

    /* --- identification --- */
    'pc.2nde.id.rf.q': ['Sur un chromatogramme, l’éluant a parcouru {H} depuis la ligne de dépôt et une tache a parcouru {d}. Calculer le rapport frontal Rf de l’espèce.', 'في كروماتوغرام، قطع المذيب {H} انطلاقا من خط الإيداع وقطعت بقعة {d}. احسب نسبة الجبهة Rf للنوع الكيميائي.'],
    'pc.2nde.id.rf.exp': ['Rf = distance parcourue par l’espèce ÷ distance parcourue par l’éluant : {c}.', 'Rf = المسافة التي قطعها النوع ÷ المسافة التي قطعها المذيب : {c}.'],
    'pc.2nde.id.d.q': ['Une espèce a un rapport frontal Rf = {rf}. L’éluant a parcouru {H} depuis la ligne de dépôt. Quelle distance l’espèce a-t-elle parcourue ? Répondre en {u}.', 'نسبة الجبهة لنوع كيميائي Rf = {rf}. قطع المذيب {H} انطلاقا من خط الإيداع. ما المسافة التي قطعها النوع ؟ أجب بالوحدة {u}.'],
    'pc.2nde.id.d.exp': ['La distance est d = Rf × distance de l’éluant : {c}.', 'المسافة d = Rf × مسافة المذيب : {c}.'],
    'pc.2nde.id.ident.q': ['Une espèce inconnue a pour rapport frontal Rf = {r}. Dans les mêmes conditions, les espèces de référence ont pour rapports frontaux : A : {ra} ; B : {rb} ; C : {rc}. Quelle espèce de référence est présente ?', 'نسبة الجبهة لنوع مجهول Rf = {r}. في نفس الظروف نسب الجبهة للأنواع المرجعية : A : {ra} ; B : {rb} ; C : {rc}. أي نوع مرجعي موجود ؟'],
    'pc.2nde.id.ident.exp': ['Même rapport frontal, même espèce : l’espèce inconnue est {x}.', 'نفس نسبة الجبهة تعني نفس النوع : النوع المجهول هو {x}.'],
    'pc.2nde.id.A.q': ['Une solution colorée de concentration C = {C} est étudiée par spectrophotométrie. Son absorbance vérifie A = k × C avec k = {k}. Calculer l’absorbance A (sans unité).', 'نُدرس محلولا ملونا تركيزه C = {C} بقياس الامتصاصية. تحقق امتصاصيته A = k × C مع k = {k}. احسب الامتصاصية A (بدون وحدة).'],
    'pc.2nde.id.A.exp': ['Loi de Beer-Lambert : A = k × C : {c}.', 'قانون بير-لامبير : A = k × C : {c}.'],
    'pc.2nde.id.C.q': ['L’absorbance d’une solution colorée vaut A = {A}. Sachant que A = k × C avec k = {k}, calculer la concentration C de la solution, en {u}.', 'امتصاصية محلول ملون A = {A}. علما أن A = k × C مع k = {k}، احسب تركيز المحلول C بالوحدة {u}.'],
    'pc.2nde.id.C.exp': ['C = A ÷ k : {c}.', 'C = A ÷ k : {c}.'],
    'pc.2nde.liq.eau': ['l’eau', 'الماء'], 'pc.2nde.liq.eth': ['l’éthanol', 'الإيثانول'], 'pc.2nde.liq.hui': ['l’huile d’olive', 'زيت الزيتون'], 'pc.2nde.liq.gly': ['le glycérol', 'الغليسيرول'],
    'pc.2nde.id.rho.q': ['Un liquide incolore de volume V = {V} a pour masse m = {m}. Données : {data}. De quel liquide s’agit-il ?', 'سائل عديم اللون حجمه V = {V} وكتلته m = {m}. معطيات : {data}. ما هذا السائل ؟'],
    'pc.2nde.id.rho.exp': ['Masse volumique ρ = m ÷ V : {c}. C’est {x}.', 'الكتلة الحجمية ρ = m ÷ V : {c}. إنه {x}.'],
  };
  const FR = {}, AR = {};
  Object.keys(S).forEach((k) => { FR[k] = S[k][0]; AR[k] = S[k][1]; });
  Object.assign(root.STRINGS, FR);
  Object.assign(root.STRINGS_AR, AR);

  /* ===================================================================== CATALOGUE */
  Object.assign(root.AR_CATALOG, {
    'Mouvement et forces': 'الحركة والقوى',
    'Ondes et lumière': 'الأمواج والضوء',
    'Circuits électriques': 'الدارات الكهربائية',
    'Mole et solutions': 'المول والمحاليل',
    'Atomes et molécules': 'الذرات والجزيئات',
    'Transformations et analyses': 'التحولات والتحاليل',
    'Vitesse moyenne et conversions': 'السرعة المتوسطة والتحويلات',
    'Poids et principe d’inertie': 'الوزن ومبدأ العطالة',
    'Période, fréquence et écho': 'الدور والتواتر والصدى',
    'Indice de réfraction et loi de Snell-Descartes': 'قرينة الانكسار وقانون سنيل-ديكارت',
    'Spectres et longueurs d’onde': 'الأطياف وأطوال الموجات',
    'Loi d’Ohm': 'قانون أوم',
    'Lois des nœuds et des mailles, résistances': 'قانونا العقد والعُرى والمقاومات',
    'Masse molaire et quantité de matière': 'الكتلة المولية وكمية المادة',
    'Concentration d’une solution': 'تركيز محلول',
    'Dilution d’une solution': 'تخفيف محلول',
    'Atomes, couches électroniques et ions': 'الذرات والطبقات الإلكترونية والشوارد',
    'Liaisons covalentes et molécules': 'الروابط التساهمية والجزيئات',
    'Avancement et réactif limitant': 'التقدم والمتفاعل المحدّ',
    'Identifier une espèce chimique': 'التعرّف على نوع كيميائي',
  });

  const lv = (root.CATALOG_EXTRA || []).find((l) => l.id === '2nde');
  lv.domains.push(
    { name: 'Physique', cats: [
      { name: 'Mouvement et forces', skills: [
        ['Vitesse moyenne et conversions', 'pc2nde_vitesse', { kinds: ['v', 'd', 't', 'kmh', 'ms'] }],
        ['Poids et principe d’inertie', 'pc2nde_poids', { kinds: ['P', 'm', 'g', 'inertia', 'motion'] }],
      ] },
      { name: 'Ondes et lumière', skills: [
        ['Période, fréquence et écho', 'pc2nde_signal', { kinds: ['f', 'T', 'echo', 'pitch', 'range'] }],
        ['Indice de réfraction et loi de Snell-Descartes', 'pc2nde_refraction', { kinds: ['n', 'v', 'sin', 'dir'] }],
        ['Spectres et longueurs d’onde', 'pc2nde_spectre', { kinds: ['dom', 'type', 'hot', 'elem'] }],
      ] },
      { name: 'Circuits électriques', skills: [
        ['Loi d’Ohm', 'pc2nde_ohm', { kinds: ['U', 'I', 'R', 'mA', 'imA'] }],
        ['Lois des nœuds et des mailles, résistances', 'pc2nde_circuit', { kinds: ['node', 'mesh', 'serie', 'deriv', 'serieI'] }],
      ] },
    ] },
    { name: 'Chimie', cats: [
      { name: 'Mole et solutions', skills: [
        ['Masse molaire et quantité de matière', 'pc2nde_mole', { kinds: ['M', 'n', 'm', 'N'] }],
        ['Concentration d’une solution', 'pc2nde_conc', { kinds: ['C', 'n', 'V', 'Cm', 'C2', 'mass'] }],
        ['Dilution d’une solution', 'pc2nde_dilution', { kinds: ['V1', 'C2', 'F', 'eau'] }],
      ] },
      { name: 'Atomes et molécules', skills: [
        ['Atomes, couches électroniques et ions', 'pc2nde_atome', { kinds: ['valence', 'cfg', 'ion', 'elec'] }],
        ['Liaisons covalentes et molécules', 'pc2nde_liaison', { kinds: ['nb', 'liants', 'nonliants', 'geom'] }],
      ] },
      { name: 'Transformations et analyses', skills: [
        ['Avancement et réactif limitant', 'pc2nde_avancement', { kinds: ['xmax', 'lim', 'prod', 'rest'] }],
        ['Identifier une espèce chimique', 'pc2nde_identif', { kinds: ['rf', 'dist', 'ident', 'A', 'C', 'rho'] }],
      ] },
    ] }
  );
}(typeof window !== 'undefined' ? window : globalThis));
