/* Exercices de physique et de chimie — Première (programme décrit par les cours p1-… et c1-…).
 * Générateurs pc1re_*, textes français et arabes, titres arabes et catalogue. */
(function (root) {
  'use strict';
  const GEN = root.MathsGen.GEN;

  /* ---------- outils ---------- */
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[R(0, a.length - 1)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const round = (x, k = 6) => Number(x.toFixed(k));
  const fmt = (x) => String(x).replace(/-/g, '−').replace('.', ',');
  const m = (s) => `<span class="m">${String(s).replace(/[؀-ۿ]+/g, '⁦$&⁩')}</span>`;
  const NB = '&nbsp;';
  const U = (x, unit) => m(fmt(x) + NB + unit);          // valeur avec unité
  const par = (x) => (x < 0 ? `(${fmt(x)})` : fmt(x));
  const box = '<span class="box">?</span>';
  function mc(correct, wrongs, labelf = (v) => m(v)) {
    const seen = new Set([String(correct)]), out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  }
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" direction="ltr" style="direction:ltr">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;
  const arrow = (x1, y1, x2, y2, c = '#dc2626') => {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 9, w = 0.4;
    const p = (s) => `${(x2 - L * Math.cos(a + s)).toFixed(1)},${(y2 - L * Math.sin(a + s)).toFixed(1)}`;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2.5"/><polygon points="${x2},${y2} ${p(w)} ${p(-w)}" fill="${c}"/>`;
  };

  /* formules affichées dans les textes (isolées pour l'arabe) */
  const SYM = {
    fN: m('ΣF = m × a'), fa: m('a = ΣF ÷ m'), fW: m('W = F × d × cos α'), fF: m('F = W ÷ (d × cos α)'),
    fEc: m('E<sub>c</sub> = ½ × m × v²'), fv: m('v² = 2 × E<sub>c</sub> ÷ m'), fEpp: m('E<sub>pp</sub> = m × g × z'),
    fEm: m('E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub>'), fcons: m('m × g × h = ½ × m × v²'), fv2: m('v² = 2 × g × h'),
    Ec: m('E<sub>c</sub>'), Epp: m('E<sub>pp</sub>'), Em: m('E<sub>m</sub>'), gv: m('g = 10 N/kg'),
    fL: m('λ = v × T'), fl2: m('λ = v ÷ f'), fv3: m('v = λ ÷ T'), fT: m('f = 1 ÷ T'), fT2: m('T = 1 ÷ f'), fl3: m('λ = c ÷ f'),
    fPh: m('E = h × c ÷ λ'), fl4: m('λ = h × c ÷ E'), hc: m('h = 6,63 × 10<sup>−34</sup> J·s ; c = 3,00 × 10<sup>8</sup> m/s'),
    ex: m('E = x × 10<sup>−19</sup> J'), fP: m('P = m × g'),
    fC: m('C × V = C<sub>t</sub> × V<sub>E</sub>'), fC2: m('C = C<sub>t</sub> × V<sub>E</sub> ÷ V'), fVE: m('V<sub>E</sub> = C × V ÷ C<sub>t</sub>'),
    VE: m('V<sub>E</sub>'), alk: m('C<sub>n</sub>H<sub>2n+2</sub>'),
    MM: m('M(C) = 12 g/mol ; M(H) = 1 g/mol'), MMO: m('M(C) = 12 g/mol ; M(H) = 1 g/mol ; M(O) = 16 g/mol'),
    CO2: m('CO<sub>2</sub>'), O2: m('O<sub>2</sub>'), MCO2: m('M(CO<sub>2</sub>) = 44 g/mol'),
  };
  const t = (k, v) => {
    const s = (root.STRINGS || {})[k];
    if (s === undefined) return '[[' + k + ']]';
    if (typeof s !== 'string') return s;
    const all = Object.assign({}, SYM, v);
    return s.replace(/\{(\w+)\}/g, (_, n) => (all[n] !== undefined ? all[n] : ''));
  };
  const N = (q, ans, exp, vis) => ({ q, vis, kind: 'num', ans: round(ans), exp });
  const CH = (q, ans, choices, exp, vis) => ({ q, vis, kind: 'choice', ans, choices, exp });

  /* ======================================================================= PHYSIQUE */

  /* Deuxième loi de Newton */
  GEN.pc1re_newton = (p) => {
    const k = pick(p.kinds);
    const mm = pick([2, 5, 10, 20, 50, 100, 500, 1000]), a = pick([0.5, 1, 2, 3, 4, 5]), F = round(mm * a);
    if (k === 'a') return N(t('pc.1re.newton.a.q', { mm: U(mm, 'kg'), F: U(F, 'N'), u: m('m/s²') }), a, t('pc.1re.newton.a.exp', { calc: m(`${fmt(F)} ÷ ${fmt(mm)} = ${fmt(a)} m/s²`) }));
    if (k === 'F') return N(t('pc.1re.newton.F.q', { mm: U(mm, 'kg'), a: U(a, 'm/s²'), u: m('N') }), F, t('pc.1re.newton.F.exp', { calc: m(`${fmt(mm)} × ${fmt(a)} = ${fmt(F)} N`) }));
    return N(t('pc.1re.newton.m.q', { F: U(F, 'N'), a: U(a, 'm/s²'), u: m('kg') }), mm, t('pc.1re.newton.m.exp', { calc: m(`${fmt(F)} ÷ ${fmt(a)} = ${fmt(mm)} kg`) }));
  };

  /* Travail d'une force constante */
  const COS = { 0: 1, 30: '√3/2', 45: '√2/2', 60: 0.5, 90: 0, 120: -0.5, 150: '−√3/2', 180: -1 };
  function visTravail(al) {
    const r = al * Math.PI / 180, cx = 110, cy = 82, L = 78;
    const ex = cx + L * Math.cos(r), ey = cy - L * Math.sin(r);
    let s = `<line x1="20" y1="100" x2="250" y2="100" stroke="#94a3b8" stroke-width="2"/><rect x="82" y="64" width="56" height="36" rx="4" fill="#e2e8f0" stroke="#334155" stroke-width="1.5"/>`;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + 100}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4 3"/>`;
    s += arrow(cx, cy, ex, ey) + txt(ex + (Math.cos(r) >= 0 ? 12 : -12), ey - 4, 'F', { c: '#dc2626', s: 16 });
    s += arrow(70, 118, 190, 118, '#2563eb') + txt(130, 133, 'd', { c: '#2563eb', s: 15 });
    if (al > 0 && al < 180) s += `<path d="M ${cx + 34} ${cy} A 34 34 0 0 0 ${(cx + 34 * Math.cos(r)).toFixed(1)} ${(cy - 34 * Math.sin(r)).toFixed(1)}" fill="none" stroke="#475569"/>` + txt(cx + 46 * Math.cos(r / 2), cy - 46 * Math.sin(r / 2) + 5, 'α', { s: 14 });
    return svg(260, 140, s);
  }
  GEN.pc1re_travail = (p) => {
    const k = pick(p.kinds);
    if (k === 'sign') {
      const al = pick([0, 30, 45, 60, 90, 120, 150, 180]);
      const r = al < 90 ? 'motor' : al === 90 ? 'null' : 'resist';
      const lab = (v) => t('pc.1re.travail.' + v);
      return CH(t('pc.1re.travail.sign.q', { al: m(al + '°') }), r, mc(r, ['motor', 'resist', 'null'], lab), t('pc.1re.travail.sign.exp', { al: m(al + '°'), r: lab(r) }), visTravail(al));
    }
    const F = pick([10, 20, 40, 50, 100, 200]), d = pick([2, 3, 4, 5, 10, 20]);
    if (k === 'W') {
      const al = pick([0, 60, 90, 120, 180]), c = COS[al], W = round(F * d * c);
      return N(t('pc.1re.travail.W.q', { F: U(F, 'N'), d: U(d, 'm'), al: m(al + '°'), u: m('J') }), W,
        t('pc.1re.travail.W.exp', { calc: m(`W = ${fmt(F)} × ${fmt(d)} × ${par(c)} = ${fmt(W)} J`) }), visTravail(al));
    }
    const al = pick([0, 60, 120, 180]), c = COS[al], W = round(F * d * c);
    return N(t('pc.1re.travail.F.q', { w: U(W, 'J'), d: U(d, 'm'), al: m(al + '°'), c: m(fmt(c)), u: m('N') }), F,
      t('pc.1re.travail.F.exp', { calc: m(`${fmt(W)} ÷ (${fmt(d)} × ${par(c)}) = ${fmt(F)} N`) }), visTravail(al));
  };

  /* Énergie cinétique */
  GEN.pc1re_ec = (p) => {
    const k = pick(p.kinds);
    if (k === 'Ec') {
      const mm = pick([2, 4, 5, 10, 20, 50, 100]), v = pick([2, 4, 5, 10, 20, 30]), ec = round(0.5 * mm * v * v);
      return N(t('pc.1re.ec.Ec.q', { mm: U(mm, 'kg'), v: U(v, 'm/s'), u: m('J') }), ec, t('pc.1re.ec.Ec.exp', { calc: m(`½ × ${fmt(mm)} × ${fmt(v)}² = ${fmt(ec)} J`) }));
    }
    if (k === 'v') {
      const mm = pick([2, 4, 8, 10, 50, 100]), v = pick([2, 3, 4, 5, 6, 10, 12, 20]), ec = round(0.5 * mm * v * v);
      return N(t('pc.1re.ec.v.q', { mm: U(mm, 'kg'), ec: U(ec, 'J'), u: m('m/s') }), v,
        t('pc.1re.ec.v.exp', { calc: m(`2 × ${fmt(ec)} ÷ ${fmt(mm)} = ${fmt(v * v)}`), vv: U(v, 'm/s') }));
    }
    if (k === 'kmh') {
      const mm = pick([800, 1000, 1200, 1500]), kmh = pick([36, 54, 72, 90, 108]), v = round(kmh / 3.6), ec = round(0.5 * mm * v * v);
      return N(t('pc.1re.ec.kmh.q', { mm: U(mm, 'kg'), kmh: U(kmh, 'km/h'), u: m('J') }), ec,
        t('pc.1re.ec.kmh.exp', { kmh: U(kmh, 'km/h'), v: U(v, 'm/s'), calc: m(`½ × ${fmt(mm)} × ${fmt(v)}² = ${fmt(ec)} J`) }));
    }
    const kk = pick([2, 3, 4, 5]);
    return N(t('pc.1re.ec.fact.q', { k: m(kk) }), kk * kk, t('pc.1re.ec.fact.exp', { k: m(kk), k2: m(kk * kk) }));
  };

  /* Énergie potentielle et mécanique (g = 10 N/kg) */
  const FALL = [[1.25, 5], [1.8, 6], [3.2, 8], [5, 10], [7.2, 12], [11.25, 15], [20, 20], [45, 30], [80, 40]];
  GEN.pc1re_em = (p) => {
    const k = pick(p.kinds);
    if (k === 'epp') {
      const mm = pick([1, 2, 5, 10, 20, 50]), z = pick([2, 3, 5, 10, 20, 50]), e = mm * 10 * z;
      return N(t('pc.1re.em.epp.q', { mm: U(mm, 'kg'), z: U(z, 'm'), u: m('J') }), e, t('pc.1re.em.epp.exp', { calc: m(`${fmt(mm)} × 10 × ${fmt(z)} = ${fmt(e)} J`) }));
    }
    if (k === 'v') {
      const [h, v] = pick(FALL);
      return N(t('pc.1re.em.v.q', { h: U(h, 'm'), u: m('m/s') }), v,
        t('pc.1re.em.v.exp', { calc: m(`2 × 10 × ${fmt(h)} = ${fmt(v * v)}`), vv: U(v, 'm/s') }));
    }
    if (k === 'em') {
      const mm = pick([1, 2, 4, 5, 10]), v = pick([2, 4, 5, 6, 10]), z = pick([2, 3, 5, 10]);
      const ec = round(0.5 * mm * v * v), ep = mm * 10 * z, e = ec + ep;
      return N(t('pc.1re.em.em.q', { mm: U(mm, 'kg'), z: U(z, 'm'), v: U(v, 'm/s'), u: m('J') }), e,
        t('pc.1re.em.em.exp', { ec: U(ec, 'J'), epp: U(ep, 'J'), calc: m(`${fmt(ec)} + ${fmt(ep)} = ${fmt(e)} J`) }));
    }
    const mm = pick([1, 2, 4, 5, 10]), h = pick([5, 10, 20, 45]), e0 = mm * 10 * h;
    if (k === 'ec') {
      const z = pick([1, 2, 3, 4].map((x) => x * h / 5).filter((x) => x < h && Number.isInteger(x)));
      const e1 = mm * 10 * z;
      return N(t('pc.1re.em.ec.q', { mm: U(mm, 'kg'), h: U(h, 'm'), z: U(z, 'm'), u: m('J') }), e0 - e1,
        t('pc.1re.em.ec.exp', { z: U(z, 'm'), e0: U(e0, 'J'), e1: U(e1, 'J'), calc: m(`${fmt(e0)} − ${fmt(e1)} = ${fmt(e0 - e1)} J`) }));
    }
    const ec = round(e0 * pick([0.5, 0.6, 0.8, 0.9]));
    return N(t('pc.1re.em.frot.q', { mm: U(mm, 'kg'), h: U(h, 'm'), ec: U(ec, 'J'), u: m('J') }), e0 - ec,
      t('pc.1re.em.frot.exp', { e0: U(e0, 'J'), ec: U(ec, 'J'), calc: m(`${fmt(e0)} − ${fmt(ec)} = ${fmt(round(e0 - ec))} J`) }));
  };

  /* Période, fréquence, longueur d'onde */
  GEN.pc1re_onde = (p) => {
    const k = pick(p.kinds);
    if (k === 'lambda') {
      const f = pick([34, 68, 85, 170, 340, 680, 1700]), l = round(340 / f);
      return N(t('pc.1re.onde.lambda.q', { f: U(f, 'Hz'), v: U(340, 'm/s'), u: m('m') }), l, t('pc.1re.onde.lambda.exp', { calc: m(`340 ÷ ${fmt(f)} = ${fmt(l)} m`) }));
    }
    if (k === 'v') {
      const v = pick([1, 2, 3, 4, 5]), T = pick([0.5, 1, 2, 4]), l = round(v * T);
      return N(t('pc.1re.onde.v.q', { l: U(l, 'm'), T: U(T, 's'), u: m('m/s') }), v, t('pc.1re.onde.v.exp', { calc: m(`${fmt(l)} ÷ ${fmt(T)} = ${fmt(v)} m/s`) }));
    }
    if (k === 'f') {
      const T = pick([0.5, 0.25, 0.2, 0.1, 0.05, 0.04, 0.02, 0.01, 0.008]), f = round(1 / T);
      return N(t('pc.1re.onde.f.q', { T: U(T, 's'), u: m('Hz') }), f, t('pc.1re.onde.f.exp', { calc: m(`1 ÷ ${fmt(T)} = ${fmt(f)} Hz`) }));
    }
    if (k === 'T') {
      const f = pick([50, 100, 200, 250, 500, 1000]), s = round(1 / f), ms = round(1000 / f);
      return N(t('pc.1re.onde.T.q', { f: U(f, 'Hz'), u: m('ms') }), ms, t('pc.1re.onde.T.exp', { calc: m(`1 ÷ ${fmt(f)} = ${fmt(s)} s = ${fmt(ms)} ms`) }));
    }
    const f = pick([4, 5, 6, 7.5]), l = round(3000 / f);
    return N(t('pc.1re.onde.light.q', { f: m(`${fmt(f)} × 10<sup>14</sup> Hz`), c: m('3,00 × 10<sup>8</sup> m/s'), u: m('nm') }), l,
      t('pc.1re.onde.light.exp', { calc: m(`3,00 × 10<sup>8</sup> ÷ (${fmt(f)} × 10<sup>14</sup>) = ${fmt(l)} × 10<sup>−9</sup> m = ${fmt(l)} nm`) }));
  };

  /* Diffraction et interférences */
  GEN.pc1re_interf = (p) => {
    const k = pick(p.kinds);
    if (k === 'diff') {
      const l = pick([2, 3, 4, 5, 6]), lab = (v) => m(fmt(v) + NB + 'mm');
      return CH(t('pc.1re.interf.diff.q', { l: lab(l) }), l, mc(l, [l * 50, l * 100, l * 200], lab), t('pc.1re.interf.diff.exp', { l: lab(l) }));
    }
    if (k === 'interf') {
      const a1 = R(2, 8), a2 = R(1, 7), inph = Math.random() < 0.5;
      const a = inph ? a1 + a2 : Math.abs(a1 - a2);
      const calc = inph ? `A = ${a1} + ${a2} = ${a} mm` : `A = |${a1} − ${a2}| = ${a} mm`;
      return N(t('pc.1re.interf.interf.q', { a1: U(a1, 'mm'), a2: U(a2, 'mm'), ph: t(inph ? 'pc.1re.interf.inph' : 'pc.1re.interf.opp'), u: m('mm') }), a,
        t(inph ? 'pc.1re.interf.interf.exp.in' : 'pc.1re.interf.interf.exp.opp', { calc: m(calc) }));
    }
    const cases = [['c1', 'cons'], ['c2', 'dest'], ['c3', 'cons'], ['c4', 'dest']], [c, r] = pick(cases);
    const lab = (v) => t('pc.1re.interf.' + v);
    return CH(t('pc.1re.interf.type.q', { cond: t('pc.1re.interf.' + c) }), r, mc(r, ['cons', 'dest', 'none'], lab), t('pc.1re.interf.type.exp.' + r));
  };

  /* Photons et niveaux d'énergie */
  const LV = { 1: -13.6, 2: -3.4, 3: -1.51, 4: -0.85 };
  const LVS = m('E<sub>1</sub> = −13,6 eV ; E<sub>2</sub> = −3,4 eV ; E<sub>3</sub> = −1,51 eV ; E<sub>4</sub> = −0,85 eV');
  function visNiveaux(i, f) {
    const y = { 1: 150, 2: 85, 3: 55, 4: 30 };
    let s = '';
    for (const n of [1, 2, 3, 4]) s += `<line x1="60" y1="${y[n]}" x2="200" y2="${y[n]}" stroke="#334155" stroke-width="2"/>` + txt(52, y[n] + 5, `E<tspan font-size="10" dy="3">${n}</tspan>`, { a: 'end' }) + txt(206, y[n] + 5, `${fmt(LV[n])} eV`, { a: 'start', s: 12, c: '#64748b' });
    if (i) s += arrow(130, y[i], 130, y[f] + 1) + txt(150, (y[i] + y[f]) / 2 + 4, 'hν', { c: '#dc2626', s: 14, a: 'start' });
    return svg(280, 170, s);
  }
  GEN.pc1re_photon = (p) => {
    const k = pick(p.kinds);
    if (k === 'E') {
      const E = pick([1.5, 3, 4.5, 6, 9]), l = round(1989 / E);
      return N(t('pc.1re.photon.E.q', { l: U(l, 'nm') }), E,
        t('pc.1re.photon.E.exp', { calc: m(`6,63 × 10<sup>−34</sup> × 3,00 × 10<sup>8</sup> ÷ (${fmt(l)} × 10<sup>−9</sup>) = ${fmt(E)} × 10<sup>−19</sup> J`) }));
    }
    if (k === 'lambda') {
      const E = pick([1.5, 3, 4.5, 6, 9]), l = round(1989 / E);
      return N(t('pc.1re.photon.lambda.q', { E: m(`${fmt(E)} × 10<sup>−19</sup> J`), u: m('nm') }), l,
        t('pc.1re.photon.lambda.exp', { calc: m(`6,63 × 10<sup>−34</sup> × 3,00 × 10<sup>8</sup> ÷ (${fmt(E)} × 10<sup>−19</sup>) = ${fmt(l)} × 10<sup>−9</sup> m = ${fmt(l)} nm`) }));
    }
    if (k === 'dE') {
      const i = R(2, 4), f = R(1, i - 1), de = round(LV[i] - LV[f], 2);
      const sub = (n) => `E<sub>${n}</sub>`;
      return N(t('pc.1re.photon.dE.q', { lv: LVS, ni: m(sub(i)), nf: m(sub(f)), u: m('eV') }), de,
        t('pc.1re.photon.dE.exp', { calc: m(`${sub(i)} − ${sub(f)} = ${par(LV[i])} − ${par(LV[f])} = ${fmt(de)} eV`) }), visNiveaux(i, f));
    }
    if (k === 'eV') {
      const e = pick([1.5, 2, 2.5, 3, 4, 5, 10]), x = round(e * 1.6);
      return N(t('pc.1re.photon.eV.q', { e: U(e, 'eV') }), x, t('pc.1re.photon.eV.exp', { calc: m(`${fmt(e)} × 1,6 × 10<sup>−19</sup> J = ${fmt(x)} × 10<sup>−19</sup> J`) }));
    }
    const opts = [[10.2, 2], [12.09, 3], [12.75, 4], [11, 0], [5, 0]], [e, n] = pick(opts);
    const ans = n ? 'E' + n : 'none';
    const lab = (v) => (v === 'none' ? t('pc.1re.photon.none') : t('pc.1re.photon.goto', { n: m('E<sub>' + v[1] + '</sub>') }));
    const exp = n
      ? t('pc.1re.photon.abs.exp.yes', { calc: m(`E<sub>${n}</sub> − E<sub>1</sub> = ${par(LV[n])} − (−13,6) = ${fmt(e)} eV`), n: m('E<sub>' + n + '</sub>') })
      : t('pc.1re.photon.abs.exp.no', { e: U(e, 'eV') });
    return CH(t('pc.1re.photon.abs.q', { lv: m('E<sub>2</sub> = −3,4 eV ; E<sub>3</sub> = −1,51 eV ; E<sub>4</sub> = −0,85 eV'), e: U(e, 'eV') }), ans, mc(ans, ['E2', 'E3', 'E4', 'none'], lab), exp, visNiveaux(0, 0));
  };

  /* Gravitation, poids, force électrique */
  GEN.pc1re_champs = (p) => {
    const k = pick(p.kinds);
    if (k === 'dist') {
      const kk = pick([2, 3, 4]), div = Math.random() < 0.3, law = pick(['grav', 'elec']);
      const F0 = div ? pick([3, 5, 9, 10, 15]) : kk * kk * pick([1, 2, 3, 5]);
      const F1 = div ? F0 * 4 : F0 / (kk * kk);
      return N(t('pc.1re.champs.law.' + law, { F0: U(F0, 'N') }) + ' ' + (div ? t('pc.1re.champs.act.div') : t('pc.1re.champs.act.mul', { k: m(kk) })) + ' ' + t('pc.1re.champs.dist.q', { u: m('N') }), F1,
        t('pc.1re.champs.dist.exp', { calc: m(div ? `${fmt(F0)} × 2² = ${fmt(F1)} N` : `${fmt(F0)} ÷ ${kk}² = ${fmt(F1)} N`) }));
    }
    if (k === 'mass') {
      const kk = pick([2, 3, 4, 5]), F0 = pick([2, 3, 5, 10, 12]), F1 = F0 * kk;
      return N(t('pc.1re.champs.mass.q', { F0: U(F0, 'N'), k: m(kk), u: m('N') }), F1, t('pc.1re.champs.mass.exp', { k: m(kk), calc: m(`${fmt(F0)} × ${kk} = ${fmt(F1)} N`) }));
    }
    if (k === 'poids') {
      const [lieu, g] = pick([['terre', 9.8], ['lune', 1.6], ['mars', 3.7]]), mm = pick([5, 10, 20, 50]), P = round(mm * g);
      return N(t('pc.1re.champs.poids.q', { mm: U(mm, 'kg'), lieu: t('pc.1re.champs.' + lieu), g: U(g, 'N/kg'), u: m('N') }), P,
        t('pc.1re.champs.poids.exp', { calc: m(`${fmt(mm)} × ${fmt(g)} = ${fmt(P)} N`) }));
    }
    const s1 = pick(['pos', 'neg']), s2 = pick(['pos', 'neg']), r = s1 === s2 ? 'rep' : 'att';
    const lab = (v) => t('pc.1re.champs.' + v);
    return CH(t('pc.1re.champs.sign.q', { c1: t('pc.1re.champs.' + s1), c2: t('pc.1re.champs.' + s2) }), r, mc(r, ['att', 'rep', 'zero'], lab), t('pc.1re.champs.sign.exp'));
  };

  /* ========================================================================= CHIMIE */

  /* Demi-équations : nombre d'électrons */
  const COUPLES = [
    ['Cu<sup>2+</sup>', 'Cu', 2, 0], ['Zn<sup>2+</sup>', 'Zn', 2, 0], ['Fe<sup>2+</sup>', 'Fe', 2, 0], ['Fe<sup>3+</sup>', 'Fe<sup>2+</sup>', 3, 2],
    ['Ag<sup>+</sup>', 'Ag', 1, 0], ['Al<sup>3+</sup>', 'Al', 3, 0], ['Na<sup>+</sup>', 'Na', 1, 0], ['Mg<sup>2+</sup>', 'Mg', 2, 0],
    ['Pb<sup>2+</sup>', 'Pb', 2, 0], ['Fe<sup>3+</sup>', 'Fe', 3, 0], ['2 H<sup>+</sup>', 'H<sub>2</sub>', 2, 0], ['Cl<sub>2</sub>', '2 Cl<sup>−</sup>', 0, -2],
  ];
  GEN.pc1re_redox_ne = (p) => {
    const k = pick(p.kinds), [ox, red, ql, qr] = pick(COUPLES), n = ql - qr;
    if (k === 'capt') return N(t('pc.1re.redox_ne.capt.q', { eq: m(`${ox} + n e<sup>−</sup> = ${red}`) }), n, t('pc.1re.redox_ne.capt.exp', { ql: m(fmt(ql)), qr: m(fmt(qr)), n: m(n) }));
    return N(t('pc.1re.redox_ne.cede.q', { eq: m(`${red} = ${ox} + n e<sup>−</sup>`) }), n, t('pc.1re.redox_ne.cede.exp', { ql: m(fmt(ql)), qr: m(fmt(qr)), n: m(n) }));
  };

  /* Oxydant, réducteur, pile */
  const RX = [
    { eq: 'Zn + Cu<sup>2+</sup> → Zn<sup>2+</sup> + Cu', sp: ['Zn', 'Cu<sup>2+</sup>', 'Zn<sup>2+</sup>', 'Cu'], h1: 'Zn = Zn<sup>2+</sup> + 2 e<sup>−</sup>', h2: 'Cu<sup>2+</sup> + 2 e<sup>−</sup> = Cu', metal: 1 },
    { eq: 'Fe + Cu<sup>2+</sup> → Fe<sup>2+</sup> + Cu', sp: ['Fe', 'Cu<sup>2+</sup>', 'Fe<sup>2+</sup>', 'Cu'], h1: 'Fe = Fe<sup>2+</sup> + 2 e<sup>−</sup>', h2: 'Cu<sup>2+</sup> + 2 e<sup>−</sup> = Cu', metal: 1 },
    { eq: 'Zn + 2 Ag<sup>+</sup> → Zn<sup>2+</sup> + 2 Ag', sp: ['Zn', 'Ag<sup>+</sup>', 'Zn<sup>2+</sup>', 'Ag'], h1: 'Zn = Zn<sup>2+</sup> + 2 e<sup>−</sup>', h2: 'Ag<sup>+</sup> + e<sup>−</sup> = Ag', metal: 1 },
    { eq: '2 Al + 3 Cu<sup>2+</sup> → 2 Al<sup>3+</sup> + 3 Cu', sp: ['Al', 'Cu<sup>2+</sup>', 'Al<sup>3+</sup>', 'Cu'], h1: 'Al = Al<sup>3+</sup> + 3 e<sup>−</sup>', h2: 'Cu<sup>2+</sup> + 2 e<sup>−</sup> = Cu', metal: 1 },
    { eq: 'Mg + 2 H<sup>+</sup> → Mg<sup>2+</sup> + H<sub>2</sub>', sp: ['Mg', 'H<sup>+</sup>', 'Mg<sup>2+</sup>', 'H<sub>2</sub>'], h1: 'Mg = Mg<sup>2+</sup> + 2 e<sup>−</sup>', h2: '2 H<sup>+</sup> + 2 e<sup>−</sup> = H<sub>2</sub>' },
    { eq: 'Fe + 2 H<sup>+</sup> → Fe<sup>2+</sup> + H<sub>2</sub>', sp: ['Fe', 'H<sup>+</sup>', 'Fe<sup>2+</sup>', 'H<sub>2</sub>'], h1: 'Fe = Fe<sup>2+</sup> + 2 e<sup>−</sup>', h2: '2 H<sup>+</sup> + 2 e<sup>−</sup> = H<sub>2</sub>' },
  ];
  GEN.pc1re_redox_role = (p) => {
    const k = pick(p.kinds);
    if (k === 'pile') {
      const r = pick(RX.filter((x) => x.metal)), A = r.sp[0], B = r.sp[3], q = pick(['el', 'neg', 'ox']);
      const e = (s) => t('pc.1re.redox_role.elec', { s: m(s) });
      let ans, ch;
      if (q === 'el') { ans = 'AB'; ch = mc('AB', ['BA', 'none'], (v) => t('pc.1re.redox_role.el.' + v, { A: m(A), B: m(B) })); }
      else { ans = 'A'; ch = mc('A', ['B', 'none'], (v) => (v === 'none' ? t('pc.1re.redox_role.none') : e(v === 'A' ? A : B))); }
      return CH(t('pc.1re.redox_role.pile.' + q, { A: m(A), B: m(B), eq: m(r.eq) }), ans, ch, t('pc.1re.redox_role.pile.exp', { A: m(A), B: m(B) }));
    }
    const r = pick(RX), q = pick(['oxid', 'red', 'reducer', 'oxidant']);
    const idx = { oxid: 0, red: 1, reducer: 0, oxidant: 1 }[q], sp = r.sp[idx];
    const exp = idx === 0 ? t('pc.1re.redox_role.exp.red', { sp: m(sp), h: m(r.h1) }) : t('pc.1re.redox_role.exp.ox', { sp: m(sp), h: m(r.h2) });
    return CH(t('pc.1re.redox_role.' + q, { eq: m(r.eq) }), sp, mc(sp, r.sp.filter((s) => s !== sp), (v) => m(v)), exp);
  };

  /* Dosage par titrage */
  const TIT = [
    { A: 'H<sub>2</sub>SO<sub>4</sub>', B: 'HO<sup>−</sup>', a: 1, b: 2, eq: 'H<sub>2</sub>SO<sub>4</sub> + 2 HO<sup>−</sup> → SO<sub>4</sub><sup>2−</sup> + 2 H<sub>2</sub>O' },
    { A: 'Fe<sup>2+</sup>', B: 'MnO<sub>4</sub><sup>−</sup>', a: 5, b: 1, eq: '5 Fe<sup>2+</sup> + MnO<sub>4</sub><sup>−</sup> + 8 H<sup>+</sup> → 5 Fe<sup>3+</sup> + Mn<sup>2+</sup> + 4 H<sub>2</sub>O' },
    { A: 'I<sub>2</sub>', B: 'S<sub>2</sub>O<sub>3</sub><sup>2−</sup>', a: 1, b: 2, eq: 'I<sub>2</sub> + 2 S<sub>2</sub>O<sub>3</sub><sup>2−</sup> → 2 I<sup>−</sup> + S<sub>4</sub>O<sub>6</sub><sup>2−</sup>' },
  ];
  GEN.pc1re_titrage = (p) => {
    const k = pick(p.kinds);
    const V = pick([10, 20, 25]), Ct = pick([0.1, 0.2, 0.05, 0.5]), VE = pick([5, 8, 10, 12, 15, 16, 20, 24]);
    if (k === 'C') {
      const C = round(Ct * VE / V);
      return N(t('pc.1re.titrage.C.q', { V: U(V, 'mL'), Ct: U(Ct, 'mol/L'), VEv: U(VE, 'mL'), u: m('mol/L') }), C,
        t('pc.1re.titrage.C.exp', { calc: m(`${fmt(Ct)} × ${fmt(VE)} ÷ ${fmt(V)} = ${fmt(C)} mol/L`) }));
    }
    if (k === 'VE') {
      const C = round(Ct * VE / V);
      return N(t('pc.1re.titrage.VE.q', { V: U(V, 'mL'), C: U(C, 'mol/L'), Ct: U(Ct, 'mol/L'), u: m('mL') }), VE,
        t('pc.1re.titrage.VE.exp', { calc: m(`${fmt(C)} × ${fmt(V)} ÷ ${fmt(Ct)} = ${fmt(VE)} mL`) }));
    }
    const r = pick(TIT), C = round(r.a * Ct * VE / (r.b * V));
    return N(t('pc.1re.titrage.coef.q', { V: U(V, 'mL'), A: m(r.A), B: m(r.B), Ct: U(Ct, 'mol/L'), eq: m(r.eq), VEv: U(VE, 'mL'), u: m('mol/L') }), C,
      t('pc.1re.titrage.coef.exp', { A: m(r.A), B: m(r.B), a: m(r.a), b: m(r.b), calc: m(`${r.a} × ${fmt(Ct)} × ${fmt(VE)} ÷ (${r.b} × ${fmt(V)}) = ${fmt(C)} mol/L`) }));
  };

  /* Alcanes et alcools */
  const sub = (s) => String(s).replace(/(\d+)/g, '<sub>$1</sub>');
  const fAlcane = (n) => (n === 1 ? 'CH<sub>4</sub>' : `C${n === 1 ? '' : '<sub>' + n + '</sub>'}H<sub>${2 * n + 2}</sub>`);
  const fAlcool = (n) => (n === 1 ? 'CH<sub>3</sub>OH' : `C<sub>${n}</sub>H<sub>${2 * n + 1}</sub>OH`);
  const ALCOOL_M = (n) => 14 * n + 18;
  GEN.pc1re_alcane = (p) => {
    const k = pick(p.kinds);
    if (k === 'H') {
      const n = R(2, 10);
      return N(t('pc.1re.alcane.H.q', { n: m(n) }), 2 * n + 2, t('pc.1re.alcane.H.exp', { n: m(n), calc: m(`2 × ${n} + 2 = ${2 * n + 2}`) }));
    }
    if (k === 'C') {
      const n = R(2, 10), h = 2 * n + 2;
      return N(t('pc.1re.alcane.C.q', { h: m(h) }), n, t('pc.1re.alcane.C.exp', { h: m(h), calc: m(`(${h} − 2) ÷ 2 = ${n}`) }));
    }
    if (k === 'nom') {
      const n = R(1, 6), lab = (v) => t('pc.1re.alcane.n' + v);
      return CH(t('pc.1re.alcane.nom.q', { f: m(fAlcane(n)) }), n, mc(n, [1, 2, 3, 4, 5, 6].filter((x) => x !== n), lab), t('pc.1re.alcane.nom.exp', { n: m(n), nm: lab(n) }));
    }
    if (k === 'id') {
      const good = pick(['CH<sub>3</sub>–OH', 'CH<sub>3</sub>–CH<sub>2</sub>–OH', 'CH<sub>3</sub>–CH<sub>2</sub>–CH<sub>2</sub>–OH']);
      const bad = ['CH<sub>3</sub>–CH<sub>3</sub>', 'CH<sub>3</sub>–CH<sub>2</sub>–CH<sub>3</sub>', 'CH<sub>3</sub>–COOH', 'CH<sub>4</sub>', 'CH<sub>3</sub>–CH<sub>2</sub>–CH<sub>2</sub>–CH<sub>3</sub>'];
      return CH(t('pc.1re.alcane.id.q'), good, mc(good, bad), t('pc.1re.alcane.id.exp', { f: m(good) }));
    }
    if (k === 'M') {
      if (Math.random() < 0.5) {
        const n = R(1, 8), M = 14 * n + 2;
        return N(t('pc.1re.alcane.M.q', { f: m(fAlcane(n)), mm: SYM.MM, u: m('g/mol') }), M, t('pc.1re.alcane.M.exp', { calc: m(`${n} × 12 + ${2 * n + 2} × 1 = ${M} g/mol`) }));
      }
      const n = R(1, 6), M = ALCOOL_M(n);
      return N(t('pc.1re.alcane.M.q', { f: m(fAlcool(n)), mm: SYM.MMO, u: m('g/mol') }), M, t('pc.1re.alcane.M.exp', { calc: m(`${n} × 12 + ${2 * n + 2} × 1 + 16 = ${M} g/mol`) }));
    }
    const n = pick([1, 2, 3, 4]), M = ALCOOL_M(n), f = m(fAlcool(n));
    if (k === 'n') {
      const x = pick([0.1, 0.25, 0.5, 1, 2, 3, 4]), mass = round(x * M);
      return N(t('pc.1re.alcane.n.q', { f, M: U(M, 'g/mol'), mass: U(mass, 'g'), u: m('mol') }), x, t('pc.1re.alcane.n.exp', { calc: m(`${fmt(mass)} ÷ ${M} = ${fmt(x)} mol`) }));
    }
    const x = pick([0.1, 0.25, 0.5, 1, 2, 3]), mass = round(x * M);
    return N(t('pc.1re.alcane.mass.q', { f, M: U(M, 'g/mol'), n: U(x, 'mol'), u: m('g') }), mass, t('pc.1re.alcane.mass.exp', { calc: m(`${fmt(x)} × ${M} = ${fmt(mass)} g`) }));
  };

  /* Combustions */
  const AT = { CH4: { C: 1, H: 4, O: 0 }, C2H6: { C: 2, H: 6, O: 0 }, C3H8: { C: 3, H: 8, O: 0 }, C4H10: { C: 4, H: 10, O: 0 }, C5H12: { C: 5, H: 12, O: 0 }, C6H14: { C: 6, H: 14, O: 0 }, C2H5OH: { C: 2, H: 6, O: 1 }, CH3OH: { C: 1, H: 4, O: 1 }, O2: { C: 0, H: 0, O: 2 }, CO2: { C: 1, H: 0, O: 2 }, H2O: { C: 0, H: 2, O: 1 } };
  const FM = { CH4: 'CH<sub>4</sub>', C2H6: 'C<sub>2</sub>H<sub>6</sub>', C3H8: 'C<sub>3</sub>H<sub>8</sub>', C4H10: 'C<sub>4</sub>H<sub>10</sub>', C5H12: 'C<sub>5</sub>H<sub>12</sub>', C6H14: 'C<sub>6</sub>H<sub>14</sub>', C2H5OH: 'C<sub>2</sub>H<sub>5</sub>OH', CH3OH: 'CH<sub>3</sub>OH', O2: 'O<sub>2</sub>', CO2: 'CO<sub>2</sub>', H2O: 'H<sub>2</sub>O' };
  const COMB = [
    [[1, 'CH4'], [2, 'O2']], [[2, 'C2H6'], [7, 'O2']], [[1, 'C3H8'], [5, 'O2']], [[2, 'C4H10'], [13, 'O2']], [[1, 'C5H12'], [8, 'O2']], [[2, 'C6H14'], [19, 'O2']], [[1, 'C2H5OH'], [3, 'O2']], [[2, 'CH3OH'], [3, 'O2']],
  ];
  const PROD = { CH4: [1, 2], C2H6: [4, 6], C3H8: [3, 4], C4H10: [8, 10], C5H12: [5, 6], C6H14: [12, 14], C2H5OH: [2, 3], CH3OH: [2, 4] };
  const ALKM = [['CH4', 16, 1], ['C2H6', 30, 2], ['C3H8', 44, 3], ['C4H10', 58, 4]];
  const ALKN = { CH4: 'n1', C2H6: 'n2', C3H8: 'n3', C4H10: 'n4' };
  GEN.pc1re_combustion = (p) => {
    const k = pick(p.kinds);
    if (k === 'eq') {
      const r = pick(COMB), f = r[0][1], pr = PROD[f];
      const sp = [r[0], r[1], [pr[0], 'CO2'], [pr[1], 'H2O']];
      const h = R(0, 3), left = h < 2;
      const show = (e, i) => (i === h ? box + ' ' : (e[0] === 1 ? '' : e[0] + ' ')) + FM[e[1]];
      const eq = `${show(sp[0], 0)} + ${show(sp[1], 1)} → ${show(sp[2], 2)} + ${show(sp[3], 3)}`;
      const side = left ? sp.slice(2) : sp.slice(0, 2), tot = { C: 0, H: 0, O: 0 };
      side.forEach(([c, s]) => ['C', 'H', 'O'].forEach((a) => { tot[a] += c * AT[s][a]; }));
      const bil = m(`C : ${tot.C} ; H : ${tot.H} ; O : ${tot.O}`);
      return N(t('pc.1re.combustion.eq.q', { eq: m(eq) }), sp[h][0], t('pc.1re.combustion.eq.exp', { side: t(left ? 'pc.1re.combustion.right' : 'pc.1re.combustion.left'), bil, a: m(sp[h][0]) }));
    }
    if (k === 'masse') {
      const [f, M, n] = pick(ALKM), x = pick([0.25, 0.5, 1, 2, 3]), mass = round(x * M), mC = round(x * n * 44);
      return N(t('pc.1re.combustion.masse.q', { mass: U(mass, 'g'), f: m(FM[f]), M: U(M, 'g/mol'), n: m(n), u: m('g') }), mC,
        t('pc.1re.combustion.masse.exp', { nA: U(x, 'mol'), nC: U(round(x * n), 'mol'), n: m(n), mC: U(mC, 'g'), calc: m(`${fmt(mass)} ÷ ${M} = ${fmt(x)} mol`), calc2: m(`${fmt(round(x * n))} × 44 = ${fmt(mC)} g`) }));
    }
    const POOL = [['inc', ['co', 'co2', 'h2'], 'inc.exp'], ['comp', ['co2h2o', 'coc', 'n2'], 'comp.exp'], ['cond', ['manque', 'exces', 'froid'], 'cond.exp'], ['ing', ['trois', 'deux', 'un'], 'ing.exp']];
    const [q, ch, e] = pick(POOL), lab = (v) => t('pc.1re.combustion.c.' + v);
    return CH(t('pc.1re.combustion.' + q), ch[0], mc(ch[0], ch.slice(1), lab), t('pc.1re.combustion.' + e));
  };

  /* Énergie des réactions */
  const MOLE = [['ch4', 'CH<sub>4</sub>', 890], ['c3h8', 'C<sub>3</sub>H<sub>8</sub>', 2220], ['etoh', 'C<sub>2</sub>H<sub>5</sub>OH', 1370], ['h2', 'H<sub>2</sub>', 286]];
  const PCAL = [['essence', 45], ['bois', 15], ['h2', 120], ['gaz', 50]];
  GEN.pc1re_energie = (p) => {
    const k = pick(p.kinds);
    if (k === 'mol' || k === 'nmol') {
      const [key, f, Em] = pick(MOLE), n = pick([0.5, 2, 3, 4, 0.1]), E = round(n * Em);
      const c = t('pc.1re.en.m.' + key, { f: m(f) });
      if (k === 'mol') return N(t('pc.1re.en.mol.q', { c, Em: U(Em, 'kJ/mol'), n: U(n, 'mol'), u: m('kJ') }), E, t('pc.1re.en.mol.exp', { calc: m(`${fmt(n)} × ${fmt(Em)} = ${fmt(E)} kJ`) }));
      return N(t('pc.1re.en.nmol.q', { c, Em: U(Em, 'kJ/mol'), E: U(E, 'kJ'), u: m('mol') }), n, t('pc.1re.en.nmol.exp', { calc: m(`${fmt(E)} ÷ ${fmt(Em)} = ${fmt(n)} mol`) }));
    }
    if (k === 'pc' || k === 'mass') {
      const [key, pcv] = pick(PCAL), x = pick([0.5, 2, 4, 5, 10]), E = round(x * pcv), c = t('pc.1re.en.c.' + key);
      if (k === 'pc') return N(t('pc.1re.en.pc.q', { c, pc: U(pcv, 'MJ/kg'), x: U(x, 'kg'), u: m('MJ') }), E, t('pc.1re.en.pc.exp', { calc: m(`${fmt(x)} × ${fmt(pcv)} = ${fmt(E)} MJ`) }));
      return N(t('pc.1re.en.mass.q', { c, pc: U(pcv, 'MJ/kg'), E: U(E, 'MJ'), u: m('kg') }), x, t('pc.1re.en.mass.exp', { calc: m(`${fmt(E)} ÷ ${fmt(pcv)} = ${fmt(x)} kg`) }));
    }
    const POOL = [['q1', ['exo', 'endo', 'athe'], 'exp1'], ['q2', ['endo', 'exo', 'athe'], 'exp2'], ['q3', ['libere', 'absorbe', 'rien'], 'exp3'], ['q4', ['monte', 'baisse', 'const'], 'exp4']];
    const [q, ch, e] = pick(POOL), lab = (v) => t('pc.1re.en.c.' + v);
    return CH(t('pc.1re.en.' + q), ch[0], mc(ch[0], ch.slice(1), lab), t('pc.1re.en.' + e));
  };

  /* ========================================================================= TEXTES */
  const FR = {}, AR = {};
  const D = (k, fr, ar) => { FR['pc.1re.' + k] = fr; AR['pc.1re.' + k] = ar; };

  /* --- Newton --- */
  D('newton.a.q', 'Un objet de masse {mm} est soumis à une force résultante de valeur {F}. Calculer son accélération, en {u}.', 'جسم كتلته {mm} يخضع لقوة محصّلة شدّتها {F}. احسب تسارعه بالوحدة {u}.');
  D('newton.a.exp', 'D’après la deuxième loi de Newton {fN}, donc {fa} : {calc}.', 'حسب القانون الثاني لنيوتن {fN}، إذن {fa} : {calc}.');
  D('newton.F.q', 'Un objet de masse {mm} subit une accélération de {a}. Calculer la valeur de la force résultante qui s’exerce sur lui, en {u}.', 'جسم كتلته {mm} يخضع لتسارع قدره {a}. احسب شدّة القوة المحصّلة المطبّقة عليه بالوحدة {u}.');
  D('newton.F.exp', 'On applique {fN} : {calc}.', 'نطبّق {fN} : {calc}.');
  D('newton.m.q', 'Une force résultante de {F} donne à un objet une accélération de {a}. Calculer la masse de l’objet, en {u}.', 'قوة محصّلة شدّتها {F} تكسب جسما تسارعا قدره {a}. احسب كتلة الجسم بالوحدة {u}.');
  D('newton.m.exp', 'De {fN} on tire m = ΣF ÷ a : {calc}.', 'من {fN} نستنتج m = ΣF ÷ a : {calc}.');

  /* --- Travail --- */
  D('travail.W.q', 'Une force constante de valeur {F} pousse un chariot sur une distance de {d}. L’angle entre la force et le déplacement est α = {al}. Calculer le travail de cette force, en {u}.', 'قوة ثابتة شدّتها {F} تدفع عربة على مسافة {d}. الزاوية بين القوة والانتقال هي α = {al}. احسب شغل هذه القوة بالوحدة {u}.');
  D('travail.W.exp', 'On applique {fW} : {calc}.', 'نطبّق العلاقة {fW} : {calc}.');
  D('travail.F.q', 'Le travail d’une force constante vaut W = {w} pour un déplacement de {d}, l’angle entre la force et le déplacement étant α = {al} (cos α = {c}). Calculer la valeur de la force, en {u}.', 'شغل قوة ثابتة يساوي W = {w} خلال انتقال طوله {d}، والزاوية بين القوة والانتقال هي α = {al} (cos α = {c}). احسب شدّة القوة بالوحدة {u}.');
  D('travail.F.exp', 'De {fW} on tire {fF} : {calc}.', 'من {fW} نستنتج {fF} : {calc}.');
  D('travail.sign.q', 'Une force constante fait un angle α = {al} avec le déplacement de son point d’application. Son travail est :', 'قوة ثابتة تصنع زاوية α = {al} مع انتقال نقطة تأثيرها. شغلها :');
  D('travail.sign.exp', 'Le travail est moteur si α &lt; 90°, nul si α = 90° et résistant si α &gt; 90°. Ici α = {al} : le travail est {r}.', 'يكون الشغل محرّكا إذا كانت α &lt; 90°، ومنعدما إذا كانت α = 90°، ومقاوما إذا كانت α &gt; 90°. هنا α = {al} : الشغل {r}.');
  D('travail.motor', 'moteur', 'محرّك');
  D('travail.resist', 'résistant', 'مقاوم');
  D('travail.null', 'nul', 'منعدم');

  /* --- Énergie cinétique --- */
  D('ec.Ec.q', 'Un objet de masse {mm} se déplace à la vitesse de {v}. Calculer son énergie cinétique, en {u}.', 'جسم كتلته {mm} يتحرّك بسرعة {v}. احسب طاقته الحركية بالوحدة {u}.');
  D('ec.Ec.exp', '{fEc} : {calc}.', '{fEc} : {calc}.');
  D('ec.v.q', 'Un objet de masse {mm} possède une énergie cinétique de {ec}. Calculer sa vitesse, en {u}.', 'جسم كتلته {mm} له طاقة حركية قدرها {ec}. احسب سرعته بالوحدة {u}.');
  D('ec.v.exp', 'De {fEc} on tire {fv} : {calc}. La vitesse est donc {vv}.', 'من {fEc} نستنتج {fv} : {calc}. إذن السرعة هي {vv}.');
  D('ec.kmh.q', 'Une voiture de masse {mm} roule à {kmh} (on rappelle que 1 m/s = 3,6 km/h). Calculer son énergie cinétique, en {u}.', 'سيارة كتلتها {mm} تسير بسرعة {kmh} (نذكّر بأنّ 1 m/s = 3,6 km/h). احسب طاقتها الحركية بالوحدة {u}.');
  D('ec.kmh.exp', 'On convertit d’abord la vitesse : {kmh} ÷ 3,6 = {v}. Puis {fEc} : {calc}.', 'نحوّل السرعة أولا : {kmh} ÷ 3,6 = {v}. ثم {fEc} : {calc}.');
  D('ec.fact.q', 'La vitesse d’un véhicule est multipliée par {k}. Par quel nombre son énergie cinétique est-elle multipliée ?', 'تُضرب سرعة مركبة في {k}. في أي عدد تُضرب طاقتها الحركية ؟');
  D('ec.fact.exp', 'Comme {fEc}, l’énergie cinétique est proportionnelle à v² : elle est multipliée par {k}² = {k2}.', 'بما أنّ {fEc}، فالطاقة الحركية متناسبة مع v² : تُضرب في {k}² = {k2}.');

  /* --- Énergie potentielle et mécanique --- */
  D('em.epp.q', 'Un objet de masse {mm} est à {z} au-dessus du sol ({gv} ; l’énergie potentielle est nulle au sol). Calculer son énergie potentielle de pesanteur, en {u}.', 'جسم كتلته {mm} على ارتفاع {z} فوق سطح الأرض ({gv} ؛ طاقة الوضع منعدمة عند سطح الأرض). احسب طاقة وضعه الثقالية بالوحدة {u}.');
  D('em.epp.exp', '{fEpp} : {calc}.', '{fEpp} : {calc}.');
  D('em.v.q', 'On lâche sans vitesse initiale un objet d’une hauteur de {h} ({gv} ; frottements négligeables). Calculer sa vitesse en arrivant au sol, en {u}.', 'نترك جسما يسقط بدون سرعة ابتدائية من ارتفاع {h} ({gv} ؛ الاحتكاكات مهملة). احسب سرعته لحظة وصوله إلى سطح الأرض بالوحدة {u}.');
  D('em.v.exp', 'L’énergie mécanique se conserve : {fcons}, donc {fv2} = {calc}. Ainsi v = {vv}.', 'تنحفظ الطاقة الميكانيكية : {fcons}، إذن {fv2} = {calc}. وبالتالي v = {vv}.');
  D('em.em.q', 'Un objet de masse {mm} se trouve à {z} du sol et se déplace à la vitesse de {v} ({gv}). Calculer son énergie mécanique, en {u}.', 'جسم كتلته {mm} يوجد على ارتفاع {z} من سطح الأرض ويتحرّك بسرعة {v} ({gv}). احسب طاقته الميكانيكية بالوحدة {u}.');
  D('em.em.exp', '{Ec} = {ec} et {Epp} = {epp}, donc {fEm} : {calc}.', '{Ec} = {ec} و{Epp} = {epp}، إذن {fEm} : {calc}.');
  D('em.ec.q', 'Un objet de masse {mm} est lâché sans vitesse initiale d’une hauteur de {h} ({gv} ; pas de frottements). Calculer son énergie cinétique lorsqu’il est à {z} du sol, en {u}.', 'جسم كتلته {mm} يُترك بدون سرعة ابتدائية من ارتفاع {h} ({gv} ؛ لا احتكاكات). احسب طاقته الحركية عندما يكون على ارتفاع {z} من سطح الأرض بالوحدة {u}.');
  D('em.ec.exp', 'Au départ {Ec} = 0, donc {Em} = {Epp} = {e0} et elle se conserve. À la hauteur {z} : {Epp} = {e1}, donc {Ec} = {Em} − {Epp} : {calc}.', 'عند الانطلاق {Ec} = 0، إذن {Em} = {Epp} = {e0} وهي تنحفظ. عند الارتفاع {z} : {Epp} = {e1}، إذن {Ec} = {Em} − {Epp} : {calc}.');
  D('em.frot.q', 'Un objet de masse {mm} est lâché sans vitesse initiale d’une hauteur de {h} ({gv}). Il arrive au sol avec une énergie cinétique de {ec}. Quelle énergie a été dissipée par les frottements, en {u} ?', 'جسم كتلته {mm} يُترك بدون سرعة ابتدائية من ارتفاع {h} ({gv}). يصل إلى سطح الأرض بطاقة حركية قدرها {ec}. ما الطاقة التي ضاعت بسبب الاحتكاكات بالوحدة {u} ؟');
  D('em.frot.exp', 'Au départ {Em} = m × g × h = {e0}. Au sol, {Em} = {Ec} = {ec}. L’énergie perdue vaut : {calc}.', 'عند الانطلاق {Em} = m × g × h = {e0}. عند سطح الأرض {Em} = {Ec} = {ec}. الطاقة الضائعة : {calc}.');

  /* --- Ondes --- */
  D('onde.lambda.q', 'Un son de fréquence {f} se propage dans l’air à la vitesse de {v}. Calculer sa longueur d’onde, en {u}.', 'صوت تردده {f} ينتشر في الهواء بسرعة {v}. احسب طول موجته بالوحدة {u}.');
  D('onde.lambda.exp', 'Comme {fL} et T = 1 ÷ f, on a {fl2} : {calc}.', 'بما أنّ {fL} و T = 1 ÷ f، فإنّ {fl2} : {calc}.');
  D('onde.v.q', 'À la surface d’un lac, la distance entre deux crêtes successives est de {l} et la période des vagues est de {T}. Calculer leur célérité, en {u}.', 'على سطح بحيرة، المسافة بين قمّتين متتاليتين هي {l} ودور الأمواج هو {T}. احسب سرعة انتشارها بالوحدة {u}.');
  D('onde.v.exp', 'De {fL} on tire {fv3} : {calc}.', 'من {fL} نستنتج {fv3} : {calc}.');
  D('onde.f.q', 'Une onde a une période de {T}. Calculer sa fréquence, en {u}.', 'موجة دورها {T}. احسب ترددها بالوحدة {u}.');
  D('onde.f.exp', '{fT} : {calc}.', '{fT} : {calc}.');
  D('onde.T.q', 'Une onde a une fréquence de {f}. Calculer sa période, en {u}.', 'موجة ترددها {f}. احسب دورها بالوحدة {u}.');
  D('onde.T.exp', '{fT2} : {calc}.', '{fT2} : {calc}.');
  D('onde.light.q', 'Une lumière monochromatique a pour fréquence {f} (célérité dans le vide c = {c}). Calculer sa longueur d’onde dans le vide, en {u}.', 'ضوء أحادي اللون تردده {f} (سرعته في الفراغ c = {c}). احسب طول موجته في الفراغ بالوحدة {u}.');
  D('onde.light.exp', '{fl3} : {calc}.', '{fl3} : {calc}.');

  /* --- Diffraction et interférences --- */
  D('interf.diff.q', 'Des vagues de longueur d’onde {l} arrivent sur une fente d’un obstacle. Quelle largeur de fente donne une diffraction bien marquée ?', 'أمواج طول موجتها {l} تصل إلى شقّ في حاجز. ما عرض الشقّ الذي يعطي حيودا واضحا ؟');
  D('interf.diff.exp', 'La diffraction est bien marquée quand la taille de l’ouverture est comparable à la longueur d’onde : ici {l}.', 'يكون الحيود واضحا عندما يكون حجم الفتحة قريبا من طول الموجة : هنا {l}.');
  D('interf.interf.q', 'Deux ondes de même fréquence, d’amplitudes {a1} et {a2}, se rencontrent en un point où elles sont {ph}. Quelle est l’amplitude de l’onde résultante, en {u} ?', 'موجتان لهما نفس التردد، سعتاهما {a1} و{a2}، تلتقيان عند نقطة تكونان فيها {ph}. ما سعة الموجة الناتجة بالوحدة {u} ؟');
  D('interf.inph', 'en phase', 'على توافق في الطور');
  D('interf.opp', 'en opposition de phase', 'على تعاكس في الطور');
  D('interf.interf.exp.in', 'Ondes en phase : les amplitudes s’ajoutent. {calc}.', 'موجتان على توافق في الطور : تُجمع السعتان. {calc}.');
  D('interf.interf.exp.opp', 'Ondes en opposition de phase : les amplitudes se retranchent. {calc}.', 'موجتان على تعاكس في الطور : تُطرح السعتان. {calc}.');
  D('interf.type.q', 'Deux ondes de même fréquence et de même amplitude se rencontrent {cond}. Les interférences sont :', 'موجتان لهما نفس التردد ونفس السعة تلتقيان {cond}. التداخل :');
  D('interf.c1', 'en phase', 'وهما على توافق في الطور');
  D('interf.c2', 'en opposition de phase', 'وهما على تعاكس في الطور');
  D('interf.c3', 'avec un décalage d’une période entière', 'بتأخّر يساوي دورا كاملا');
  D('interf.c4', 'avec un décalage d’une demi-période', 'بتأخّر يساوي نصف دور');
  D('interf.cons', 'constructives (amplitude plus grande)', 'بنّاء (سعة أكبر)');
  D('interf.dest', 'destructives (amplitude nulle)', 'هدّام (سعة منعدمة)');
  D('interf.none', 'inexistantes : les ondes ne s’additionnent pas', 'غير موجود : الموجتان لا تتجمعان');
  D('interf.type.exp.cons', 'Des ondes en phase (ou décalées d’un nombre entier de périodes) s’ajoutent : les interférences sont constructives.', 'الموجتان المتوافقتان في الطور (أو المتأخّرة بعدد صحيح من الأدوار) تتجمعان : التداخل بنّاء.');
  D('interf.type.exp.dest', 'Des ondes en opposition de phase (ou décalées d’une demi-période) se compensent : les interférences sont destructives.', 'الموجتان المتعاكستان في الطور (أو المتأخّرة بنصف دور) تلغي إحداهما الأخرى : التداخل هدّام.');

  /* --- Photons --- */
  D('photon.E.q', 'Un photon a pour longueur d’onde {l} ({hc}). Calculer son énergie E ; donner le nombre x tel que {ex}.', 'فوتون طول موجته {l} ({hc}). احسب طاقته E ؛ أعط العدد x بحيث {ex}.');
  D('photon.E.exp', '{fPh} : {calc}.', '{fPh} : {calc}.');
  D('photon.lambda.q', 'Un photon a une énergie E = {E} ({hc}). Calculer sa longueur d’onde, en {u}.', 'فوتون طاقته E = {E} ({hc}). احسب طول موجته بالوحدة {u}.');
  D('photon.lambda.exp', 'De {fPh} on tire {fl4} : {calc}.', 'من {fPh} نستنتج {fl4} : {calc}.');
  D('photon.dE.q', 'Les niveaux d’énergie de l’atome d’hydrogène sont : {lv}. Lors de la transition du niveau {ni} au niveau {nf}, l’atome émet un photon. Calculer l’énergie de ce photon, en {u}.', 'مستويات طاقة ذرة الهيدروجين هي : {lv}. عند الانتقال من المستوى {ni} إلى المستوى {nf}، تُصدر الذرة فوتونا. احسب طاقة هذا الفوتون بالوحدة {u}.');
  D('photon.dE.exp', 'Le photon emporte la différence d’énergie entre les deux niveaux : {calc}.', 'يحمل الفوتون فرق الطاقة بين المستويين : {calc}.');
  D('photon.eV.q', 'Un photon a une énergie de {e} (1 eV = 1,6 × 10<sup>−19</sup> J). Donner le nombre x tel que {ex}.', 'فوتون طاقته {e} (1 eV = 1,6 × 10<sup>−19</sup> J). أعط العدد x بحيث {ex}.');
  D('photon.eV.exp', 'On multiplie par 1,6 × 10<sup>−19</sup> J : {calc}.', 'نضرب في 1,6 × 10<sup>−19</sup> J : {calc}.');
  D('photon.abs.q', 'Un atome d’hydrogène est dans son état fondamental E<sub>1</sub> = −13,6 eV. Ses niveaux suivants sont : {lv}. Il reçoit un photon d’énergie {e}. Que se passe-t-il ?', 'ذرة هيدروجين في حالتها الأساسية E<sub>1</sub> = −13,6 eV. مستوياتها التالية هي : {lv}. تتلقّى فوتونا طاقته {e}. ماذا يحدث ؟');
  D('photon.goto', 'l’atome absorbe le photon et passe au niveau {n}', 'تمتصّ الذرة الفوتون وتنتقل إلى المستوى {n}');
  D('photon.none', 'le photon n’est pas absorbé', 'لا يُمتصّ الفوتون');
  D('photon.abs.exp.yes', 'L’écart d’énergie vaut {calc} : il est égal à l’énergie du photon, donc l’atome passe au niveau {n}.', 'فرق الطاقة يساوي {calc} : وهو مساو لطاقة الفوتون، إذن تنتقل الذرة إلى المستوى {n}.');
  D('photon.abs.exp.no', 'Un atome n’absorbe un photon que si son énergie est exactement un écart entre deux niveaux (10,2 eV, 12,09 eV ou 12,75 eV depuis E<sub>1</sub>). {e} n’en est pas un : le photon n’est pas absorbé.', 'لا تمتصّ الذرة فوتونا إلا إذا كانت طاقته تساوي بالضبط فرقا بين مستويين (10,2 eV أو 12,09 eV أو 12,75 eV انطلاقا من E<sub>1</sub>). {e} ليست كذلك : لا يُمتصّ الفوتون.');

  /* --- Champs --- */
  D('champs.law.grav', 'Deux corps s’attirent avec une force gravitationnelle de {F0}.', 'جسمان يتجاذبان بقوة تجاذب كتلي شدّتها {F0}.');
  D('champs.law.elec', 'Deux charges ponctuelles de signes contraires s’attirent avec une force électrique de {F0}.', 'شحنتان نقطيتان مختلفتان في الإشارة تتجاذبان بقوة كهربائية شدّتها {F0}.');
  D('champs.act.mul', 'On multiplie par {k} la distance qui les sépare.', 'نضرب المسافة الفاصلة بينهما في {k}.');
  D('champs.act.div', 'On divise par 2 la distance qui les sépare.', 'نقسم المسافة الفاصلة بينهما على 2.');
  D('champs.dist.q', 'Quelle est la nouvelle valeur de la force, en {u} ?', 'ما القيمة الجديدة للقوة بالوحدة {u} ؟');
  D('champs.dist.exp', 'La force est inversement proportionnelle au carré de la distance d : {calc}.', 'القوة تتناسب عكسيا مع مربّع المسافة d : {calc}.');
  D('champs.mass.q', 'Deux corps s’attirent avec une force gravitationnelle de {F0}. On multiplie la masse de l’un d’eux par {k} sans changer la distance. Quelle est la nouvelle valeur de la force, en {u} ?', 'جسمان يتجاذبان بقوة تجاذب كتلي شدّتها {F0}. نضرب كتلة أحدهما في {k} دون تغيير المسافة. ما القيمة الجديدة للقوة بالوحدة {u} ؟');
  D('champs.mass.exp', 'La force est proportionnelle au produit des masses : elle est multipliée par {k}. {calc}.', 'القوة متناسبة مع جداء الكتلتين : تُضرب في {k}. {calc}.');
  D('champs.poids.q', 'Un objet de masse {mm} se trouve {lieu}, où le champ de pesanteur vaut g = {g}. Calculer son poids, en {u}.', 'جسم كتلته {mm} يوجد {lieu}، حيث حقل الثقالة g = {g}. احسب وزنه بالوحدة {u}.');
  D('champs.poids.exp', '{fP} : {calc}.', '{fP} : {calc}.');
  D('champs.terre', 'sur la Terre', 'على سطح الأرض');
  D('champs.lune', 'sur la Lune', 'على سطح القمر');
  D('champs.mars', 'sur Mars', 'على سطح المريخ');
  D('champs.sign.q', 'On place côte à côte {c1} et {c2}. La force électrique entre ces deux charges est :', 'نضع {c1} و{c2} قرب بعضهما. القوة الكهربائية بين هاتين الشحنتين :');
  D('champs.pos', 'une charge positive', 'شحنة موجبة');
  D('champs.neg', 'une charge négative', 'شحنة سالبة');
  D('champs.att', 'attractive', 'تجاذبية');
  D('champs.rep', 'répulsive', 'تنافرية');
  D('champs.zero', 'nulle', 'منعدمة');
  D('champs.sign.exp', 'Des charges de même signe se repoussent, des charges de signes contraires s’attirent.', 'الشحنتان المتماثلتان في الإشارة تتنافران، والمختلفتان تتجاذبان.');

  /* --- Demi-équations --- */
  D('redox_ne.capt.q', 'Dans la demi-équation {eq}, quelle est la valeur de n (nombre d’électrons captés) ?', 'في المعادلة النصفية {eq}، ما قيمة n (عدد الإلكترونات المكتسبة) ؟');
  D('redox_ne.capt.exp', 'La charge électrique se conserve : {ql} − n = {qr}, donc n = {n}.', 'تنحفظ الشحنة الكهربائية : {ql} − n = {qr}، إذن n = {n}.');
  D('redox_ne.cede.q', 'Dans la transformation {eq}, quelle est la valeur de n (nombre d’électrons cédés) ?', 'في التحوّل {eq}، ما قيمة n (عدد الإلكترونات المفقودة) ؟');
  D('redox_ne.cede.exp', 'La charge électrique se conserve : {qr} = {ql} − n, donc n = {n}.', 'تنحفظ الشحنة الكهربائية : {qr} = {ql} − n، إذن n = {n}.');

  /* --- Oxydant, réducteur, pile --- */
  D('redox_role.oxid', 'Dans la réaction {eq}, quelle espèce est oxydée ?', 'في التفاعل {eq}، ما هو النوع الكيميائي الذي يتأكسد ؟');
  D('redox_role.red', 'Dans la réaction {eq}, quelle espèce est réduite ?', 'في التفاعل {eq}، ما هو النوع الكيميائي الذي يُختزل ؟');
  D('redox_role.reducer', 'Dans la réaction {eq}, quelle espèce joue le rôle de réducteur ?', 'في التفاعل {eq}، ما هو النوع الكيميائي الذي يلعب دور المرجِع ؟');
  D('redox_role.oxidant', 'Dans la réaction {eq}, quelle espèce joue le rôle d’oxydant ?', 'في التفاعل {eq}، ما هو النوع الكيميائي الذي يلعب دور المؤكسِد ؟');
  D('redox_role.exp.red', '{sp} cède des électrons ({h}) : c’est le réducteur, et il est oxydé.', '{sp} يفقد إلكترونات ({h}) : فهو المرجِع، ويتأكسد.');
  D('redox_role.exp.ox', '{sp} capte des électrons ({h}) : c’est l’oxydant, et il est réduit.', '{sp} يكتسب إلكترونات ({h}) : فهو المؤكسِد، ويُختزل.');
  D('redox_role.elec', 'l’électrode de {s}', 'مسرى {s}');
  D('redox_role.none', 'aucune des deux', 'لا واحد منهما');
  D('redox_role.el.AB', 'de l’électrode de {A} vers l’électrode de {B}', 'من مسرى {A} نحو مسرى {B}');
  D('redox_role.el.BA', 'de l’électrode de {B} vers l’électrode de {A}', 'من مسرى {B} نحو مسرى {A}');
  D('redox_role.el.none', 'il n’y a aucun passage d’électrons dans le fil', 'لا تمرّ أي إلكترونات في السلك');
  D('redox_role.pile.el', 'Une pile est formée d’une électrode de {A} et d’une électrode de {B}. Sa réaction spontanée est {eq}. Dans le fil extérieur, les électrons circulent :', 'تتكوّن عمود من مسرى {A} ومسرى {B}. تفاعلها التلقائي هو {eq}. في السلك الخارجي تنتقل الإلكترونات :');
  D('redox_role.pile.neg', 'Une pile est formée d’une électrode de {A} et d’une électrode de {B}. Sa réaction spontanée est {eq}. Quelle électrode est la borne négative ?', 'يتكوّن عمود من مسرى {A} ومسرى {B}. تفاعله التلقائي هو {eq}. أيّ مسرى هو القطب السالب ؟');
  D('redox_role.pile.ox', 'Une pile est formée d’une électrode de {A} et d’une électrode de {B}. Sa réaction spontanée est {eq}. À quelle électrode a lieu l’oxydation ?', 'يتكوّن عمود من مسرى {A} ومسرى {B}. تفاعله التلقائي هو {eq}. عند أيّ مسرى تحدث الأكسدة ؟');
  D('redox_role.pile.exp', '{A} cède des électrons : l’oxydation a lieu à son électrode, qui est la borne négative. Les électrons circulent dans le fil de l’électrode de {A} vers celle de {B}, où a lieu la réduction.', '{A} يفقد إلكترونات : تحدث الأكسدة عند مسراه، وهو القطب السالب. تنتقل الإلكترونات في السلك من مسرى {A} نحو مسرى {B} حيث يحدث الاختزال.');

  /* --- Titrage --- */
  D('titrage.C.q', 'On dose {V} d’une solution d’acide éthanoïque par une solution d’hydroxyde de sodium (soude) de concentration {Ct}. L’équivalence est atteinte pour un volume versé {VE} = {VEv} (réaction 1 : 1). Calculer la concentration de la solution d’acide, en {u}.', 'نعايِر {V} من محلول حمض الإيثانويك بمحلول هيدروكسيد الصوديوم (الصودا) تركيزه {Ct}. يتحقّق التكافؤ عند الحجم المصبوب {VE} = {VEv} (تفاعل 1 : 1). احسب تركيز محلول الحمض بالوحدة {u}.');
  D('titrage.C.exp', 'À l’équivalence (1 : 1), {fC}, donc {fC2} : {calc}.', 'عند التكافؤ (1 : 1)، {fC}، إذن {fC2} : {calc}.');
  D('titrage.VE.q', 'On dose {V} d’une solution d’acide éthanoïque de concentration {C} par une solution d’hydroxyde de sodium de concentration {Ct} (réaction 1 : 1). Quel volume de soude faut-il verser pour atteindre l’équivalence, en {u} ?', 'نعايِر {V} من محلول حمض الإيثانويك تركيزه {C} بمحلول هيدروكسيد الصوديوم تركيزه {Ct} (تفاعل 1 : 1). ما حجم الصودا الواجب صبّه للوصول إلى التكافؤ بالوحدة {u} ؟');
  D('titrage.VE.exp', 'À l’équivalence, {fC}, donc {fVE} : {calc}.', 'عند التكافؤ، {fC}، إذن {fVE} : {calc}.');
  D('titrage.coef.q', 'On dose {V} d’une solution contenant {A} par une solution titrante contenant {B} de concentration {Ct}. Équation de la réaction de titrage : {eq}. L’équivalence est atteinte pour {VE} = {VEv}. Calculer la concentration de {A} dans la solution dosée, en {u}.', 'نعايِر {V} من محلول يحتوي على {A} بمحلول معايِر يحتوي على {B} تركيزه {Ct}. معادلة تفاعل المعايرة : {eq}. يتحقّق التكافؤ عند {VE} = {VEv}. احسب تركيز {A} في المحلول المعايَر بالوحدة {u}.');
  D('titrage.coef.exp', 'À l’équivalence, n({A}) ÷ {a} = n({B}) ÷ {b}, c’est-à-dire C × V ÷ {a} = C<sub>t</sub> × V<sub>E</sub> ÷ {b}. Donc C = {calc}.', 'عند التكافؤ، n({A}) ÷ {a} = n({B}) ÷ {b}، أي C × V ÷ {a} = C<sub>t</sub> × V<sub>E</sub> ÷ {b}. إذن C = {calc}.');

  /* --- Alcanes et alcools --- */
  D('alcane.H.q', 'Un alcane de formule {alk} possède {n} atomes de carbone. Combien d’atomes d’hydrogène contient sa molécule ?', 'ألكان صيغته {alk} يحتوي على {n} ذرات كربون. كم ذرة هيدروجين يحتوي جزيئه ؟');
  D('alcane.H.exp', 'Pour n = {n}, le nombre d’atomes d’hydrogène est 2n + 2 : {calc}.', 'من أجل n = {n}، عدد ذرات الهيدروجين هو 2n + 2 : {calc}.');
  D('alcane.C.q', 'La molécule d’un alcane de formule {alk} contient {h} atomes d’hydrogène. Combien d’atomes de carbone contient-elle ?', 'جزيء ألكان صيغته {alk} يحتوي على {h} ذرة هيدروجين. كم ذرة كربون يحتوي ؟');
  D('alcane.C.exp', '2n + 2 = {h}, donc n = (2n + 2 − 2) ÷ 2 : {calc}.', '2n + 2 = {h}، إذن n = (2n + 2 − 2) ÷ 2 : {calc}.');
  D('alcane.nom.q', 'Quel est le nom de l’alcane de formule {f} ?', 'ما اسم الألكان الذي صيغته {f} ؟');
  D('alcane.nom.exp', 'Le nombre n d’atomes de carbone de la chaîne vaut {n} : la molécule s’appelle {nm}.', 'عدد ذرات الكربون في السلسلة n = {n} : اسم الجزيء {nm}.');
  D('alcane.n1', 'méthane', 'ميثان');
  D('alcane.n2', 'éthane', 'إيثان');
  D('alcane.n3', 'propane', 'بروبان');
  D('alcane.n4', 'butane', 'بوتان');
  D('alcane.n5', 'pentane', 'بنتان');
  D('alcane.n6', 'hexane', 'هكسان');
  D('alcane.id.q', 'Parmi ces molécules, laquelle est un alcool ?', 'من بين هذه الجزيئات، أيّها كحول ؟');
  D('alcane.id.exp', 'Un alcool possède le groupe hydroxyle –OH lié à un atome de carbone : {f}.', 'يحتوي الكحول على المجموعة الهيدروكسيلية –OH المرتبطة بذرة كربون : {f}.');
  D('alcane.M.q', 'Calculer la masse molaire de la molécule {f} ({mm}), en {u}.', 'احسب الكتلة المولية للجزيء {f} ({mm}) بالوحدة {u}.');
  D('alcane.M.exp', 'On additionne les masses molaires atomiques : {calc}.', 'نجمع الكتل المولية الذرية : {calc}.');
  D('alcane.n.q', 'On dispose de {mass} de {f} (masse molaire M = {M}). Quelle quantité de matière cela représente-t-il, en {u} ?', 'لدينا {mass} من {f} (الكتلة المولية M = {M}). ما كمية المادة المقابلة بالوحدة {u} ؟');
  D('alcane.n.exp', 'n = m ÷ M : {calc}.', 'n = m ÷ M : {calc}.');
  D('alcane.mass.q', 'Quelle masse de {f} (masse molaire M = {M}) faut-il prélever pour obtenir {n}, en {u} ?', 'ما كتلة {f} (الكتلة المولية M = {M}) الواجب أخذها للحصول على {n} بالوحدة {u} ؟');
  D('alcane.mass.exp', 'm = n × M : {calc}.', 'm = n × M : {calc}.');

  /* --- Combustions --- */
  D('combustion.eq.q', 'L’équation d’une combustion complète est écrite avec les plus petits nombres entiers : {eq}. Quel nombre faut-il écrire à la place de {box} pour qu’elle soit équilibrée ?'.replace('{box}', box), 'معادلة احتراق تام مكتوبة بأصغر الأعداد الصحيحة : {eq}. ما العدد الواجب كتابته مكان {box} لتصبح المعادلة موزونة ؟'.replace('{box}', box));
  D('combustion.eq.exp', 'Les atomes se conservent. Du côté {side}, on compte {bil} ; le nombre cherché est donc {a}.', 'تنحفظ الذرات. في الطرف {side} نحصي {bil} ؛ إذن العدد المطلوب هو {a}.');
  D('combustion.left', 'gauche', 'الأيسر');
  D('combustion.right', 'droit', 'الأيمن');
  D('combustion.masse.q', 'On brûle complètement {mass} de {f} (masse molaire M = {M}) dans le dioxygène. Chaque mole de {f} fournit {n} mol de dioxyde de carbone ({MCO2}). Quelle masse de dioxyde de carbone se forme, en {u} ?', 'نحرق احتراقا تاما {mass} من {f} (الكتلة المولية M = {M}) في ثنائي الأكسجين. كل مول من {f} يعطي {n} مول من ثنائي أكسيد الكربون ({MCO2}). ما كتلة ثنائي أكسيد الكربون المتكوّنة بالوحدة {u} ؟');
  D('combustion.masse.exp', 'Quantité de combustible : {calc}. La quantité de CO<sub>2</sub> formée est {n} × la quantité de combustible : {nC}. Masse : {calc2}.', 'كمية الوقود : {calc}. كمية CO<sub>2</sub> المتكوّنة تساوي {n} × كمية الوقود : {nC}. الكتلة : {calc2}.');
  D('combustion.inc', 'Quel gaz toxique et inodore se forme lors d’une combustion incomplète ?', 'ما الغاز السام عديم الرائحة الذي يتكوّن أثناء احتراق غير تام ؟');
  D('combustion.c.co', 'le monoxyde de carbone CO', 'أحادي أكسيد الكربون CO');
  D('combustion.c.co2', 'le dioxyde de carbone CO<sub>2</sub>', 'ثنائي أكسيد الكربون CO<sub>2</sub>');
  D('combustion.c.h2', 'le dihydrogène H<sub>2</sub>', 'ثنائي الهيدروجين H<sub>2</sub>');
  D('combustion.inc.exp', 'Avec trop peu de dioxygène, il se forme du monoxyde de carbone CO, gaz toxique et inodore, et de la suie.', 'عند نقص ثنائي الأكسجين يتكوّن أحادي أكسيد الكربون CO، وهو غاز سام عديم الرائحة، وكذلك السناج.');
  D('combustion.comp', 'Quels sont les produits de la combustion complète d’un hydrocarbure ?', 'ما هي نواتج الاحتراق التام لهيدروكربور ؟');
  D('combustion.c.co2h2o', 'du dioxyde de carbone et de l’eau', 'ثنائي أكسيد الكربون والماء');
  D('combustion.c.coc', 'du monoxyde de carbone et de la suie', 'أحادي أكسيد الكربون والسناج');
  D('combustion.c.n2', 'du diazote et du dihydrogène', 'ثنائي الآزوت وثنائي الهيدروجين');
  D('combustion.comp.exp', 'Avec assez de dioxygène, un hydrocarbure donne du dioxyde de carbone et de l’eau.', 'بوجود كمية كافية من ثنائي الأكسجين يعطي الهيدروكربور ثنائي أكسيد الكربون والماء.');
  D('combustion.cond', 'Dans quelle situation une combustion est-elle incomplète ?', 'في أي حالة يكون الاحتراق غير تام ؟');
  D('combustion.c.manque', 'quand il manque du dioxygène', 'عندما ينقص ثنائي الأكسجين');
  D('combustion.c.exces', 'quand il y a un excès de dioxygène', 'عندما يوجد فائض من ثنائي الأكسجين');
  D('combustion.c.froid', 'quand le combustible est trop froid', 'عندما يكون الوقود باردا جدا');
  D('combustion.cond.exp', 'Une combustion est incomplète quand le dioxygène est en quantité insuffisante (chauffage mal ventilé, par exemple).', 'يكون الاحتراق غير تام عندما تكون كمية ثنائي الأكسجين غير كافية (مثل مدفأة سيئة التهوية).');
  D('combustion.ing', 'Combien d’ingrédients faut-il pour qu’une combustion ait lieu ?', 'كم عنصرا يلزم لحدوث احتراق ؟');
  D('combustion.c.trois', 'trois : un combustible, un comburant (le dioxygène) et une énergie d’activation', 'ثلاثة : وقود ومؤكسِد (ثنائي الأكسجين) وطاقة تنشيط');
  D('combustion.c.deux', 'deux : un combustible et de l’eau', 'اثنان : وقود وماء');
  D('combustion.c.un', 'un seul : le combustible', 'واحد فقط : الوقود');
  D('combustion.ing.exp', 'Il faut un combustible, un comburant (le dioxygène) et une énergie d’activation (étincelle, flamme).', 'يلزم وقود ومؤكسِد (ثنائي الأكسجين) وطاقة تنشيط (شرارة أو لهب).');

  /* --- Énergie des réactions --- */
  D('en.m.ch4', 'méthane {f}', 'الميثان {f}');
  D('en.m.c3h8', 'propane {f}', 'البروبان {f}');
  D('en.m.etoh', 'éthanol {f}', 'الإيثانول {f}');
  D('en.m.h2', 'dihydrogène {f}', 'ثنائي الهيدروجين {f}');
  D('en.mol.q', 'La combustion d’une mole de {c} libère {Em}. Quelle énergie libère la combustion de {n} de ce combustible, en {u} ?', 'احتراق مول واحد من {c} يحرّر {Em}. ما الطاقة التي يحرّرها احتراق {n} من هذا الوقود بالوحدة {u} ؟');
  D('en.mol.exp', 'E = n × énergie molaire : {calc}.', 'E = n × الطاقة المولية : {calc}.');
  D('en.nmol.q', 'La combustion d’une mole de {c} libère {Em}. Combien de moles faut-il brûler pour libérer {E}, en {u} ?', 'احتراق مول واحد من {c} يحرّر {Em}. كم مولا يجب حرقه لتحرير {E} بالوحدة {u} ؟');
  D('en.nmol.exp', 'n = E ÷ énergie molaire : {calc}.', 'n = E ÷ الطاقة المولية : {calc}.');
  D('en.c.essence', 'essence', 'البنزين');
  D('en.c.bois', 'bois sec', 'الخشب الجاف');
  D('en.c.h2', 'dihydrogène', 'ثنائي الهيدروجين');
  D('en.c.gaz', 'gaz naturel', 'الغاز الطبيعي');
  D('en.pc.q', 'Le pouvoir calorifique de ce combustible ({c}) est de {pc}. Quelle énergie libère la combustion de {x} de ce combustible, en {u} ?', 'القدرة الحرارية لهذا الوقود ({c}) تساوي {pc}. ما الطاقة التي يحرّرها احتراق {x} من هذا الوقود بالوحدة {u} ؟');
  D('en.pc.exp', 'E = masse × pouvoir calorifique : {calc}.', 'E = الكتلة × القدرة الحرارية : {calc}.');
  D('en.mass.q', 'Le pouvoir calorifique de ce combustible ({c}) est de {pc}. Quelle masse de ce combustible faut-il brûler pour libérer {E}, en {u} ?', 'القدرة الحرارية لهذا الوقود ({c}) تساوي {pc}. ما كتلة هذا الوقود الواجب حرقها لتحرير {E} بالوحدة {u} ؟');
  D('en.mass.exp', 'masse = E ÷ pouvoir calorifique : {calc}.', 'الكتلة = E ÷ القدرة الحرارية : {calc}.');
  D('en.c.exo', 'exothermique', 'ناشرة للحرارة');
  D('en.c.endo', 'endothermique', 'ماصّة للحرارة');
  D('en.c.athe', 'sans aucun échange d’énergie', 'دون أي تبادل للطاقة');
  D('en.c.libere', 'en libère', 'تحرّر طاقة');
  D('en.c.absorbe', 'en demande aussi', 'تتطلّب طاقة أيضا');
  D('en.c.rien', 'ne change rien au bilan d’énergie', 'لا تغيّر شيئا في الحصيلة الطاقية');
  D('en.c.monte', 'augmente', 'ترتفع');
  D('en.c.baisse', 'diminue', 'تنخفض');
  D('en.c.const', 'reste constante', 'تبقى ثابتة');
  D('en.q1', 'La combustion d’un carburant libère de la chaleur. Cette réaction est :', 'احتراق وقود يحرّر حرارة. هذا التفاعل :');
  D('en.exp1', 'Une réaction qui libère de l’énergie sous forme de chaleur est exothermique.', 'التفاعل الذي يحرّر طاقة على شكل حرارة يكون ناشرا للحرارة.');
  D('en.q2', 'Une poche de froid instantané se refroidit quand on la déclenche. La réaction qui s’y produit est :', 'كيس البرودة الفورية يبرد عند تشغيله. التفاعل الذي يحدث فيه :');
  D('en.exp2', 'La réaction absorbe de l’énergie du milieu, qui se refroidit : elle est endothermique.', 'يمتصّ التفاعل طاقة من الوسط فيبرد : التفاعل ماصّ للحرارة.');
  D('en.q3', 'Casser des liaisons chimiques demande de l’énergie. Former des liaisons :', 'كسر الروابط الكيميائية يتطلّب طاقة. أمّا تشكّل الروابط فإنه :');
  D('en.exp3', 'Casser une liaison coûte de l’énergie ; en former une en libère.', 'كسر رابطة يستهلك طاقة، وتشكيل رابطة يحرّر طاقة.');
  D('en.q4', 'Dans une réaction exothermique, la température du milieu réactionnel :', 'في تفاعل ناشر للحرارة، درجة حرارة الوسط التفاعلي :');
  D('en.exp4', 'La réaction libère de la chaleur : le milieu se réchauffe.', 'يحرّر التفاعل حرارة : فيسخن الوسط.');

  Object.assign(root.STRINGS, FR);
  Object.assign(root.STRINGS_AR, AR);

  /* ---------- titres arabes du catalogue ---------- */
  Object.assign(root.AR_CATALOG, {
    'Physique': 'الفيزياء', 'Chimie': 'الكيمياء',
    'Forces et travail': 'القوى والشغل', 'Énergie cinétique et mécanique': 'الطاقة الحركية والميكانيكية', 'Ondes, photons et champs': 'الأمواج والفوتونات والحقول',
    'Oxydoréduction et piles': 'الأكسدة والاختزال والأعمدة', 'Dosage par titrage': 'المعايرة', 'Molécules organiques': 'الجزيئات العضوية', 'Combustions et énergie': 'الاحتراق والطاقة',
    'Deuxième loi de Newton': 'القانون الثاني لنيوتن', 'Travail d’une force constante': 'شغل قوة ثابتة',
    'Énergie cinétique': 'الطاقة الحركية', 'Énergie potentielle et mécanique': 'طاقة الوضع والطاقة الميكانيكية',
    'Période, fréquence et longueur d’onde': 'الدور والتردد وطول الموجة', 'Diffraction et interférences': 'الحيود والتداخل',
    'Photons et niveaux d’énergie': 'الفوتونات ومستويات الطاقة', 'Gravitation, poids et force électrique': 'التجاذب والوزن والقوة الكهربائية',
    'Électrons d’une demi-équation': 'إلكترونات المعادلة النصفية', 'Oxydant, réducteur et pile': 'المؤكسِد والمرجِع والعمود',
    'Calculer une concentration par titrage': 'حساب تركيز بالمعايرة', 'Alcanes et alcools': 'الألكانات والكحولات',
    'Équilibrer une combustion': 'وزن معادلة احتراق', 'Énergie libérée par une réaction': 'الطاقة المحرَّرة في تفاعل',
  });

  /* ---------- catalogue ---------- */
  const lv = (root.CATALOG_EXTRA || []).find((l) => l.id === '1re');
  lv.domains.push(
    { name: 'Physique', cats: [
      { name: 'Forces et travail', skills: [['Deuxième loi de Newton', 'pc1re_newton', { kinds: ['a', 'F', 'm'] }], ['Travail d’une force constante', 'pc1re_travail', { kinds: ['W', 'F', 'sign'] }]] },
      { name: 'Énergie cinétique et mécanique', skills: [['Énergie cinétique', 'pc1re_ec', { kinds: ['Ec', 'v', 'kmh', 'fact'] }], ['Énergie potentielle et mécanique', 'pc1re_em', { kinds: ['epp', 'v', 'em', 'ec', 'frot'] }]] },
      { name: 'Ondes, photons et champs', skills: [['Période, fréquence et longueur d’onde', 'pc1re_onde', { kinds: ['lambda', 'v', 'f', 'T', 'light'] }], ['Diffraction et interférences', 'pc1re_interf', { kinds: ['diff', 'interf', 'type'] }], ['Photons et niveaux d’énergie', 'pc1re_photon', { kinds: ['E', 'lambda', 'dE', 'eV', 'abs'] }], ['Gravitation, poids et force électrique', 'pc1re_champs', { kinds: ['dist', 'mass', 'poids', 'sign'] }]] },
    ] },
    { name: 'Chimie', cats: [
      { name: 'Oxydoréduction et piles', skills: [['Électrons d’une demi-équation', 'pc1re_redox_ne', { kinds: ['capt', 'cede'] }], ['Oxydant, réducteur et pile', 'pc1re_redox_role', { kinds: ['oxid', 'red', 'pile'] }]] },
      { name: 'Dosage par titrage', skills: [['Calculer une concentration par titrage', 'pc1re_titrage', { kinds: ['C', 'VE', 'coef'] }]] },
      { name: 'Molécules organiques', skills: [['Alcanes et alcools', 'pc1re_alcane', { kinds: ['H', 'C', 'nom', 'id', 'M', 'n', 'mass'] }]] },
      { name: 'Combustions et énergie', skills: [['Équilibrer une combustion', 'pc1re_combustion', { kinds: ['eq', 'masse', 'cond'] }], ['Énergie libérée par une réaction', 'pc1re_energie', { kinds: ['mol', 'nmol', 'pc', 'mass', 'exo'] }]] },
    ] }
  );
}(typeof window !== 'undefined' ? window : globalThis));
