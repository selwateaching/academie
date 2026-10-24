/* Physique-chimie, Terminale : exercices générés (FR + AR).
 * Ajoute des domaines « Physique » et « Chimie » au niveau term (catalog2.js).
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
  const u = (v, unit) => m(`${fmt(v)} ${unit}`);          // valeur + unité
  const M = (s) => `<span class="m">${s}</span>`;           // formule figée dans les textes
  const sup = (x) => `<sup>${String(x).replace(/-/g, '−')}</sup>`;
  function mc(correct, wrongs, labelf = (v) => m(v)) {
    const seen = new Set([String(correct)]), out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  }
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" direction="ltr" style="direction:ltr">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;
  const G10 = () => m('g = 10 m/s²');
  const numQ = (key, v, ans, vis) => ({ q: t(key + '.q', v), kind: 'num', ans: round(ans), exp: t(key + '.exp', v), vis });
  const lab = (pre) => (v) => t(pre + v);
  const nuc = (A, Z, X) => m(`<sup>${A}</sup><sub>${Z}</sub>${X}`);

  /* ====================================================================
   *  PHYSIQUE
   * ==================================================================== */

  /* ---------- Chute et projectile ---------- */
  GEN.pcterm_proj = (p) => {
    const k = pick(p.kinds);
    const g = G10();
    if (k === 'fall') {
      const tt = R(1, 4), h = 5 * tt * tt;
      return numQ('pc.term.proj.fall', { h: u(h, 'm'), g, c: m(`√(2 × ${h} ÷ 10)`), r: u(tt, 's'), f: M('h = ½ g t²') + ' → ' + M('t = √(2h ÷ g)') }, tt);
    }
    if (k === 'range') {
      const tt = R(1, 3), h = 5 * tt * tt, v = 5 * R(1, 6), x = v * tt;
      return numQ('pc.term.proj.range', { h: u(h, 'm'), v: u(v, 'm/s'), g, t: u(tt, 's'), c: m(`${v} × ${tt}`), r: u(x, 'm') }, x);
    }
    if (k === 'apex') {
      const v = 10 * R(1, 4), h = v * v / 20;
      return numQ('pc.term.proj.apex', { v: u(v, 'm/s'), g, c: m(`${v}² ÷ (2 × 10)`), r: u(h, 'm'), f: M('v² = 2 g h') }, h);
    }
    const v = 10 * R(2, 4), tt = pick([1, 2, 3, 5]), r = v - 10 * tt;
    return numQ('pc.term.proj.vy', { v: u(v, 'm/s'), t: u(tt, 's'), g, c: m(`${v} − 10 × ${tt}`), r: u(r, 'm/s'), f: M('v<sub>y</sub> = v<sub>0y</sub> − g t') }, r);
  };

  /* ---------- Satellites et lois de Kepler ---------- */
  GEN.pcterm_kepler = (p) => {
    const k = pick(p.kinds);
    if (k === 'ratio') {
      const f = pick([4, 9, 16]), T1 = pick([2, 3, 5]), r = Math.round(f * Math.sqrt(f)), T2 = T1 * r;
      return numQ('pc.term.kep.ratio', { T1: u(T1, 'h'), f: m(f), c: m(`${T1} × √(${f}³) = ${T1} × ${r}`), r: u(T2, 'h'), l: M('T² ÷ r³ = ' + t('pc.term.cst')) }, T2);
    }
    const lb = lab('pc.term.l.');
    if (k === 'v') return { q: t('pc.term.kep.v.q'), kind: 'choice', ans: 'dec', choices: mc('dec', ['inc', 'same'], lb), exp: t('pc.term.kep.v.exp', { f: M('v = √(G M ÷ r)') }) };
    if (k === 'T') return { q: t('pc.term.kep.T.q'), kind: 'choice', ans: 'inc', choices: mc('inc', ['dec', 'same'], lb), exp: t('pc.term.kep.T.exp', { f: M('T² ÷ r³ = ' + t('pc.term.cst')) }) };
    return { q: t('pc.term.kep.geo.q'), kind: 'choice', ans: '24 h', choices: mc('24 h', ['90 min', '12 h', '365 d'], (v) => m(v.replace('d', t('pc.term.u.jshort')))), exp: t('pc.term.kep.geo.exp') };
  };

  /* ---------- Circuit RC ---------- */
  const rcFig = () => svg(250, 130,
    '<g stroke="#334155" stroke-width="2" fill="none">'
    + '<path d="M30 25 H90 M150 25 H210 V55 M210 75 V105 H30 V75 M30 55 V25"/>'
    + '<rect x="90" y="17" width="60" height="16"/>'
    + '<path d="M18 55 H42 M25 75 H35"/><path d="M198 55 H222 M198 75 H222"/></g>'
    + txt(10, 70, 'E', { a: 'end', s: 15 }) + txt(120, 12, 'R', { s: 15 }) + txt(232, 70, 'C', { a: 'start', s: 15 }));
  GEN.pcterm_rc = (p) => {
    const k = pick(p.kinds), vis = rcFig();
    const Rk = pick([1, 2, 5, 10, 20, 50]), C = pick([1, 2, 5, 10, 20, 100]), tau = Rk * C;
    if (k === 'tau') return numQ('pc.term.rc.tau', { R: u(Rk, 'kΩ'), C: u(C, 'µF'), c: m(`${Rk} × ${C}`), r: u(tau, 'ms'), f: M('τ = R C') }, tau, vis);
    if (k === 'five') return numQ('pc.term.rc.five', { R: u(Rk, 'kΩ'), C: u(C, 'µF'), c: m(`5 × ${Rk} × ${C}`), r: u(5 * tau, 'ms'), f: M('τ = R C') }, 5 * tau, vis);
    if (k === 'C') return numQ('pc.term.rc.C', { R: u(Rk, 'kΩ'), tau: u(tau, 'ms'), c: m(`${tau} ÷ ${Rk}`), r: u(C, 'µF'), f: M('τ = R C') }, C, vis);
    if (k === 'q') {
      const U = pick([2, 3, 5, 6, 9, 12]), q = C * U;
      return numQ('pc.term.rc.q', { C: u(C, 'µF'), U: u(U, 'V'), c: m(`${C} × ${U}`), r: u(q, 'µC'), f: M('q = C u') }, q, vis);
    }
    const Ce = pick([2, 4, 10, 20, 100]), U = pick([2, 3, 5, 6, 10, 12]), E = Ce * U * U / 2;
    return numQ('pc.term.rc.E', { C: u(Ce, 'µF'), U: u(U, 'V'), c: m(`½ × ${Ce} × ${U}²`), r: u(E, 'µJ'), f: M('E = ½ C u²') }, E, vis);
  };

  /* ---------- Effet Doppler ---------- */
  GEN.pcterm_doppler = (p) => {
    const k = pick(p.kinds);
    if (k === 'qual') {
      const ap = pick([true, false]);
      return { q: t(ap ? 'pc.term.dop.qual.ap.q' : 'pc.term.dop.qual.aw.q'), kind: 'choice', ans: ap ? 'high' : 'low', choices: mc(ap ? 'high' : 'low', ['low', 'high'].filter((x) => x !== (ap ? 'high' : 'low')).concat(['same']), lab('pc.term.l.')), exp: t(ap ? 'pc.term.dop.qual.ap.exp' : 'pc.term.dop.qual.aw.exp') };
    }
    const ap = k === 'ap', vs = pick([20, 40, 60]), den = ap ? 340 - vs : 340 + vs, step = den / gcd(340, den);
    let f0; do { f0 = step * R(1, 80); } while (f0 < 300 || f0 > 1200);
    const f = f0 * 340 / den;
    return numQ(ap ? 'pc.term.dop.ap' : 'pc.term.dop.aw', { f0: u(f0, 'Hz'), vs: u(vs, 'm/s'), c: m(`${f0} × 340 ÷ ${den}`), r: u(f, 'Hz'), f: M(ap ? 'f = f<sub>0</sub> × v ÷ (v − v<sub>s</sub>)' : 'f = f<sub>0</sub> × v ÷ (v + v<sub>s</sub>)') }, f);
  };

  /* ---------- Décroissance radioactive ---------- */
  const NUCS = [
    { s: '<sup>131</sup>I', T: 8, un: 'j' }, { s: '<sup>60</sup>Co', T: 5, un: 'an' },
    { s: '<sup>99m</sup>Tc', T: 6, un: 'h' }, { s: '<sup>14</sup>C', T: 5730, un: 'an' },
  ];
  GEN.pcterm_decay = (p) => {
    const k = pick(p.kinds), nu = pick(NUCS), n = R(1, 4), N0 = Math.pow(2, n) * pick([1, 2, 3, 5]) * (nu.T > 1000 ? 1 : 10);
    const unit = t('pc.term.u.' + nu.un), Nf = N0 / Math.pow(2, n), dur = n * nu.T;
    const base = { X: m(nu.s), T: '', un: unit, N0: u(N0, 'mg'), n: m(n), f: M('N = N<sub>0</sub> ÷ 2<sup>n</sup>') };
    base.T = m(`${fmt(nu.T)}`) + ' ' + unit;
    if (k === 'left') return numQ('pc.term.dec.left', Object.assign(base, { d: m(fmt(dur)) + ' ' + unit, c: m(`${N0} ÷ 2<sup>${n}</sup> = ${N0} ÷ ${Math.pow(2, n)}`), r: u(Nf, 'mg') }), Nf);
    if (k === 'time') return numQ('pc.term.dec.time', Object.assign(base, { Nf: u(Nf, 'mg'), c: m(`${N0} ÷ ${Nf} = ${Math.pow(2, n)} = 2<sup>${n}</sup>`), r: m(fmt(dur)) + ' ' + unit, cc: m(`${n} × ${fmt(nu.T)}`) }), dur);
    return numQ('pc.term.dec.half', Object.assign(base, { d: m(fmt(dur)) + ' ' + unit, Nf: u(Nf, 'mg'), c: m(`${N0} ÷ ${Nf} = 2<sup>${n}</sup>`), cc: m(`${fmt(dur)} ÷ ${n}`), r: m(fmt(nu.T)) + ' ' + unit }), nu.T);
  };

  /* ---------- Équations de désintégration ---------- */
  const DES = [
    { t: 'a', A: 238, Z: 92, X: 'U', Y: 'Th' }, { t: 'a', A: 226, Z: 88, X: 'Ra', Y: 'Rn' }, { t: 'a', A: 210, Z: 84, X: 'Po', Y: 'Pb' },
    { t: 'b-', A: 14, Z: 6, X: 'C', Y: 'N' }, { t: 'b-', A: 60, Z: 27, X: 'Co', Y: 'Ni' }, { t: 'b-', A: 131, Z: 53, X: 'I', Y: 'Xe' },
    { t: 'b+', A: 22, Z: 11, X: 'Na', Y: 'Ne' }, { t: 'b+', A: 18, Z: 9, X: 'F', Y: 'O' }, { t: 'b+', A: 30, Z: 15, X: 'P', Y: 'Si' },
  ];
  const TYPE_SYM = { a: 'α', 'b-': 'β<sup>−</sup>', 'b+': 'β<sup>+</sup>' };
  GEN.pcterm_desint = (p) => {
    const k = pick(p.kinds), d = pick(DES);
    const A2 = d.t === 'a' ? d.A - 4 : d.A, Z2 = d.t === 'a' ? d.Z - 2 : d.t === 'b-' ? d.Z + 1 : d.Z - 1;
    const ty = m(TYPE_SYM[d.t]), father = nuc(d.A, d.Z, d.X);
    const rule = t('pc.term.des.rule.' + d.t);
    if (k === 'type') {
      const wr = ['a', 'b-', 'b+'].filter((x) => x !== d.t);
      return { q: t('pc.term.des.type.q', { X: father, Y: nuc(A2, Z2, d.Y) }), kind: 'choice', ans: d.t, choices: mc(d.t, wr, (v) => m(TYPE_SYM[v])), exp: t('pc.term.des.type.exp', { dA: m(d.A - A2), dZ: m(fmt(Z2 - d.Z)), rule, ty }) };
    }
    if (k === 'A') return numQ('pc.term.des.A', { X: father, ty, rule, r: m(A2), Y: m(d.Y) }, A2);
    return numQ('pc.term.des.Z', { X: father, ty, rule, r: m(Z2), Y: m(d.Y) }, Z2);
  };

  /* ---------- Chaleur et flux thermique ---------- */
  GEN.pcterm_therm = (p) => {
    const k = pick(p.kinds), c = m('c = 4 180 J/(kg·°C)');
    if (k === 'Q') {
      const mm = pick([0.5, 1, 2, 3, 5]), dT = pick([5, 10, 20, 30]), Q = round(mm * 4180 * dT);
      return numQ('pc.term.th.Q', { c, m: u(mm, 'kg'), dT: u(dT, '°C'), cc: m(`${fmt(mm)} × 4180 × ${dT}`), r: u(Q, 'J'), f: M('Q = m c ΔT') }, Q);
    }
    if (k === 'dT') {
      const mm = pick([1, 2, 5]), dT = pick([2, 5, 10, 20]), Q = mm * 4180 * dT;
      return numQ('pc.term.th.dT', { c, m: u(mm, 'kg'), Q: u(Q, 'J'), cc: m(`${Q} ÷ (${mm} × 4180)`), r: u(dT, '°C'), f: M('Q = m c ΔT') }, dT);
    }
    if (k === 'flux') {
      const P = pick([20, 50, 100, 200]), dt = pick([60, 120, 300]), Q = P * dt;
      return numQ('pc.term.th.flux', { Q: u(Q, 'J'), dt: u(dt, 's'), cc: m(`${Q} ÷ ${dt}`), r: u(P, 'W'), f: M('Φ = Q ÷ Δt') }, P);
    }
    const Rt = pick([0.1, 0.2, 0.5, 2]), P = pick([20, 50, 100, 200]);
    if (Rt === 2 && P % 2) return GEN.pcterm_therm(p);
    const dT = round(P * Rt, 3);
    return numQ('pc.term.th.rth', { dT: u(dT, '°C'), Rt: u(Rt, '°C/W'), cc: m(`${fmt(dT)} ÷ ${fmt(Rt)}`), r: u(P, 'W'), f: M('Φ = ΔT ÷ R<sub>th</sub>') }, P);
  };

  /* ====================================================================
   *  CHIMIE
   * ==================================================================== */

  /* ---------- Vitesse et avancement ---------- */
  GEN.pcterm_vit = (p) => {
    const k = pick(p.kinds);
    if (k === 'half') {
      const xf = round(pick([2, 4, 6, 8, 10, 12, 16, 20]) / 100, 2), x = round(xf / 2, 3);
      return numQ('pc.term.vit.half', { xf: u(xf, 'mol'), c: m(`${fmt(xf)} ÷ 2`), r: u(x, 'mol') }, x);
    }
    const v = pick([0.01, 0.02, 0.05, 0.1]), dt = pick([2, 5, 10, 20]);
    let A0 = round(pick([0.5, 0.6, 0.8, 1, 1.2, 2]), 2); const dA = round(v * dt, 4), A1 = round(A0 - dA, 4);
    if (A1 <= 0) return GEN.pcterm_vit(p);
    const un = m('mol/L/min');
    if (k === 'v') return numQ('pc.term.vit.v', { A0: u(A0, 'mol/L'), A1: u(A1, 'mol/L'), dt: u(dt, 'min'), c: m(`(${fmt(A0)} − ${fmt(A1)}) ÷ ${dt}`), r: u(v, 'mol/L/min'), un, f: M('v = −Δ[A] ÷ Δt') }, v);
    return numQ('pc.term.vit.rest', { A0: u(A0, 'mol/L'), v: u(v, 'mol/L/min'), dt: u(dt, 'min'), c: m(`${fmt(A0)} − ${fmt(v)} × ${dt}`), r: u(A1, 'mol/L') }, A1);
  };

  /* ---------- Quotient de réaction, équilibre, taux d’avancement ---------- */
  GEN.pcterm_equi = (p) => {
    const k = pick(p.kinds);
    if (k === 'tau') {
      const xmax = pick([0.2, 0.4, 0.5, 0.8, 1]), pc = pick([20, 25, 40, 50, 60, 75, 80]), xf = round(xmax * pc / 100, 3);
      return numQ('pc.term.eq.tau', { xmax: u(xmax, 'mol'), xf: u(xf, 'mol'), c: m(`${fmt(xf)} ÷ ${fmt(xmax)} × 100`), r: m(pc + ' %'), f: M('τ = x<sub>f</sub> ÷ x<sub>max</sub>') }, pc);
    }
    const x = pick([0.1, 0.2, 0.5]), k1 = R(1, 5), k2 = R(1, 5);
    const A = x, B = x, Cc = round(x * k1, 3), D = round(x * k2, 3), Q = k1 * k2;
    const eq = m('A + B ⇌ C + D');
    if (k === 'qr') return numQ('pc.term.eq.qr', { eq, A: u(A, 'mol/L'), B: u(B, 'mol/L'), C: u(Cc, 'mol/L'), D: u(D, 'mol/L'), c: m(`(${fmt(Cc)} × ${fmt(D)}) ÷ (${fmt(A)} × ${fmt(B)})`), r: m(Q), f: M('Q<sub>r</sub> = [C][D] ÷ ([A][B])') }, Q);
    const K = pick([2, 5, 10, 20, 50]), kind = pick(['dir', 'inv', 'eq']);
    const Qv = kind === 'eq' ? K : kind === 'dir' ? pick([0.1, 0.5, 1, 2]) * K / 10 : K * pick([2, 3, 5]);
    const qs = round(Qv, 3), lb = lab('pc.term.l.');
    return { q: t('pc.term.eq.sens.q', { eq, Q: m(`Q<sub>r</sub> = ${fmt(qs)}`), K: m(`K = ${fmt(K)}`) }), kind: 'choice', ans: kind, choices: mc(kind, ['dir', 'inv', 'eq'].filter((x) => x !== kind), lb), exp: t('pc.term.eq.sens.exp', { Q: m(fmt(qs)), K: m(fmt(K)), s: m(kind === 'eq' ? '=' : kind === 'dir' ? '&lt;' : '&gt;'), res: t('pc.term.l.' + kind) }) };
  };

  /* ---------- pH d’un acide fort ---------- */
  GEN.pcterm_phfort = (p) => {
    const k = pick(p.kinds), n = R(1, 5), C = m(`10${sup(-n)} mol/L`);
    if (k === 'ph') return numQ('pc.term.ph.ph', { C, c: m(`−log(10${sup(-n)})`), r: m(n), f: M('pH = −log C') }, n);
    if (k === 'conc') {
      const pH = R(1, 4), c = round(Math.pow(10, 3 - pH), 3);
      return numQ('pc.term.ph.conc', { pH: m(pH), c: m(`10${sup(-pH)} mol/L`), r: u(c, 'mmol/L'), f: M('C = 10<sup>−pH</sup>') }, c);
    }
    if (k === 'dil') {
      const e = R(1, 3), n2 = R(1, 3), f = Math.pow(10, e);
      return numQ('pc.term.ph.dil', { C: m(`10${sup(-n2)} mol/L`), f: m(f), r: m(n2 + e), c: m(`10${sup(-n2)} ÷ ${f} = 10${sup(-(n2 + e))}`) }, n2 + e);
    }
    const lb = lab('pc.term.l.');
    return { q: t('pc.term.ph.weak.q', { C }), kind: 'choice', ans: 'gt', choices: mc('gt', ['lt', 'eqn'], lb), exp: t('pc.term.ph.weak.exp', { n: m(n) }) };
  };

  /* ---------- pKa et prédominance ---------- */
  const COUPLES = [
    { a: 'CH<sub>3</sub>–COOH', b: 'CH<sub>3</sub>–COO<sup>−</sup>', pk: 4.8 }, { a: 'NH<sub>4</sub><sup>+</sup>', b: 'NH<sub>3</sub>', pk: 9.2 },
    { a: 'HCOOH', b: 'HCOO<sup>−</sup>', pk: 3.8 }, { a: 'HF', b: 'F<sup>−</sup>', pk: 3.2 },
    { a: 'C<sub>6</sub>H<sub>5</sub>OH', b: 'C<sub>6</sub>H<sub>5</sub>O<sup>−</sup>', pk: 10 }, { a: 'C<sub>6</sub>H<sub>5</sub>–COOH', b: 'C<sub>6</sub>H<sub>5</sub>–COO<sup>−</sup>', pk: 4.2 },
  ];
  const pkaFig = (cp, pH) => {
    const x0 = 200, sc = 24, xp = Math.max(25, Math.min(375, x0 + (pH - cp.pk) * sc));
    return svg(400, 90,
      `<line x1="10" y1="45" x2="390" y2="45" stroke="#334155" stroke-width="2"/><polygon points="390,45 380,40 380,50" fill="#334155"/>`
      + `<line x1="${x0}" y1="35" x2="${x0}" y2="55" stroke="#334155" stroke-width="2"/>`
      + txt(x0, 75, 'pKa', { s: 13 }) + txt(100, 30, M(cp.a), { s: 14 }).replace('<text', '<text') + txt(300, 30, M(cp.b), { s: 14 })
      + `<circle cx="${xp}" cy="45" r="6" fill="#dc2626"/>` + txt(xp, 75, 'pH', { s: 13, c: '#dc2626' }));
  };
  GEN.pcterm_pka = (p) => {
    const k = pick(p.kinds), cp = pick(COUPLES), A = M(cp.a), B = M(cp.b);
    const d = pick([-2, -1, 1, 2]), pk = cp.pk, pH = round(pk + d, 1);
    if (k === 'ph') {
      const ratio = round(Math.pow(10, d), 2);
      return numQ('pc.term.pka.ph', { A, B, pk: m(`pKa = ${fmt(pk)}`), ratio: m(fmt(ratio)), c: m(`${fmt(pk)} + log(${fmt(ratio)})`), r: m(`${fmt(pH)}`), f: M('pH = pKa + log([A<sup>−</sup>] ÷ [AH])') }, pH);
    }
    if (k === 'ratio') {
      const ratio = round(Math.pow(10, d), 2);
      return numQ('pc.term.pka.ratio', { A, B, pk: m(`pKa = ${fmt(pk)}`), pH: m(`pH = ${fmt(pH)}`), c: m(`10<sup>${fmt(pH)} − ${fmt(pk)}</sup> = 10${sup(d)}`), r: m(fmt(ratio)), f: M('[A<sup>−</sup>] ÷ [AH] = 10<sup>pH − pKa</sup>') }, ratio);
    }
    const sit = pick(['lt', 'gt', 'eq']), pH2 = sit === 'eq' ? pk : sit === 'lt' ? round(pk - R(1, 3) / 2 - 0.5, 1) : round(pk + R(1, 3) / 2 + 0.5, 1);
    const ans = sit === 'lt' ? 'acid' : sit === 'gt' ? 'base' : 'both';
    return { q: t('pc.term.pka.pred.q', { A, B, pk: m(`pKa = ${fmt(pk)}`), pH: m(`pH = ${fmt(pH2)}`) }), vis: pkaFig(cp, pH2), kind: 'choice', ans, choices: mc(ans, ['acid', 'base', 'both'].filter((x) => x !== ans), (v) => v === 'acid' ? A : v === 'base' ? B : t('pc.term.l.both')), exp: t('pc.term.pka.pred.exp', { pH: m(fmt(pH2)), pk: m(fmt(pk)), s: m(sit === 'lt' ? '&lt;' : sit === 'gt' ? '&gt;' : '='), res: ans === 'acid' ? A : ans === 'base' ? B : t('pc.term.l.both') }) };
  };

  /* ---------- Estérification : rendement ---------- */
  GEN.pcterm_ester = (p) => {
    const k = pick(p.kinds), n0 = pick([0.1, 0.2, 0.5, 1, 2]), r = pick([50, 60, 67, 70, 75, 80]);
    const Mm = m('M = 88 g/mol'), base = { n0: u(n0, 'mol'), M: Mm };
    if (k === 'improve') {
      const lb = lab('pc.term.l.');
      return { q: t('pc.term.est.imp.q'), kind: 'choice', ans: 'excess', choices: mc('excess', ['addw', 'cold', 'less'], lb), exp: t('pc.term.est.imp.exp') };
    }
    if (k === 'rend') {
      const ne = round(n0 * r / 100, 4), rr = round(ne / n0 * 100, 3);
      return numQ('pc.term.est.rend', Object.assign(base, { ne: u(ne, 'mol'), c: m(`${fmt(ne)} ÷ ${fmt(n0)} × 100`), r: m(fmt(rr) + ' %'), f: M('ρ = n<sub>exp</sub> ÷ n<sub>max</sub>') }), rr);
    }
    if (k === 'nester') {
      const ne = round(n0 * r / 100, 4);
      return numQ('pc.term.est.n', Object.assign(base, { rho: m(r + ' %'), c: m(`${fmt(n0)} × ${r} ÷ 100`), r: u(ne, 'mol') }), ne);
    }
    const ne = round(n0 * r / 100, 4), ms = round(ne * 88, 3);
    return numQ('pc.term.est.m', Object.assign(base, { rho: m(r + ' %'), c: m(`${fmt(ne)} × 88`), nn: u(ne, 'mol'), r: u(ms, 'g') }), ms);
  };

  /* ---------- Spectres infrarouges ---------- */
  GEN.pcterm_ir = (p) => {
    const k = pick(p.kinds);
    if (k === 'sigma') {
      const lam = pick([2, 2.5, 4, 5, 8, 10, 20]), s = round(10000 / lam, 1);
      return numQ('pc.term.ir.sigma', { lam: u(lam, 'µm'), c: m(`10 000 ÷ ${fmt(lam)}`), r: u(s, 'cm<sup>−1</sup>'), f: M('σ = 1 ÷ λ') }, s);
    }
    const lb = lab('pc.term.g.');
    if (k === 'band') {
      const T = pick([
        { s: '1 715', d: 'fine', a: 'CO' }, { s: '3 350', d: 'large', a: 'OH' }, { s: '2 920', d: 'fine', a: 'CH' },
      ]);
      return { q: t('pc.term.ir.band.q', { s: m(T.s + ' cm<sup>−1</sup>'), d: t('pc.term.ir.d.' + T.d) }), kind: 'choice', ans: T.a, choices: mc(T.a, ['CO', 'OH', 'CH'].filter((x) => x !== T.a), (v) => m({ CO: 'C=O', OH: 'O–H', CH: 'C–H' }[v])), exp: t('pc.term.ir.band.exp', { s: m(T.s), r: m({ CO: 'C=O', OH: 'O–H', CH: 'C–H' }[T.a]) }) };
    }
    const T = pick([{ a: 'alc', k: 'oh' }, { a: 'cet', k: 'co' }, { a: 'acid', k: 'both' }]);
    return { q: t('pc.term.ir.grp.' + T.k + '.q'), kind: 'choice', ans: T.a, choices: mc(T.a, ['alc', 'cet', 'acid'].filter((x) => x !== T.a), lb), exp: t('pc.term.ir.grp.' + T.k + '.exp') };
  };

  /* ---------- Pile, électrolyse, Faraday ---------- */
  GEN.pcterm_elec = (p) => {
    const k = pick(p.kinds), F = m('F = 96 500 C/mol');
    if (k === 'Q') {
      const I = pick([0.5, 2, 5, 10]), dt = pick([60, 120, 300, 600, 1000]), Q = round(I * dt, 3);
      return numQ('pc.term.el.Q', { I: u(I, 'A'), dt: u(dt, 's'), c: m(`${fmt(I)} × ${dt}`), r: u(Q, 'C'), f: M('Q = I × Δt') }, Q);
    }
    if (k === 'electrode') {
      const K = pick(['pile-ox', 'elec-plus', 'pile-e']), lb = lab('pc.term.l.');
      const ans = K === 'pile-e' ? 'a2c' : 'anode';
      return { q: t('pc.term.el.' + K + '.q'), kind: 'choice', ans, choices: K === 'pile-e' ? mc('a2c', ['c2a', 'none'], lb) : mc('anode', ['cath', 'neither'], lb), exp: t('pc.term.el.' + K + '.exp') };
    }
    const kk = R(1, 5), Qt = 1930 * kk, I = pick([0.5, 1, 2, 5, 10]), dt = Qt / I, ne = 20 * kk;
    const base = { F, I: u(I, 'A'), dt: u(dt, 's'), Q: u(Qt, 'C'), c1: m(`${fmt(I)} × ${dt} = ${Qt}`) };
    if (k === 'ne') return numQ('pc.term.el.ne', Object.assign(base, { c: m(`${Qt} ÷ 96 500`), r: u(ne, 'mmol'), nmol: u(round(ne / 1000, 3), 'mol'), f: M('n(e<sup>−</sup>) = Q ÷ F') }), ne);
    const MET = [{ x: 'Cu', M: 63.5, z: 2, eq: 'Cu<sup>2+</sup> + 2 e<sup>−</sup> → Cu' }, { x: 'Ag', M: 108, z: 1, eq: 'Ag<sup>+</sup> + e<sup>−</sup> → Ag' }, { x: 'Zn', M: 65, z: 2, eq: 'Zn<sup>2+</sup> + 2 e<sup>−</sup> → Zn' }];
    const me = pick(MET), nn = round(0.02 * kk / me.z, 4), mass = round(nn * me.M, 3);
    return numQ('pc.term.el.mass', Object.assign(base, { eq: m(me.eq), X: m(me.x), Mm: u(me.M, 'g/mol'), c: m(`${fmt(round(0.02 * kk, 3))} ÷ ${me.z} × ${fmt(me.M)}`), n: u(round(0.02 * kk, 3), 'mol'), r: u(mass, 'g') }), mass);
  };

  /* ====================================================================
   *  TEXTES
   * ==================================================================== */
  const FR = {}, AR = {};
  const S = (k, fr, ar) => { FR['pc.term.' + k] = fr; AR['pc.term.' + k] = ar; };

  /* mots communs */
  S('cst', 'constante', 'ثابت');
  S('u.j', 'jours', 'أيام'); S('u.h', 'heures', 'ساعات'); S('u.an', 'ans', 'سنوات'); S('u.jshort', 'j', 'يوم');
  S('l.dec', 'Elle diminue', 'تنقص');
  S('l.inc', 'Elle augmente', 'تزداد');
  S('l.same', 'Elle reste la même', 'تبقى ثابتة');
  S('l.high', 'Plus aigu', 'أحدّ (أعلى تردّدًا)');
  S('l.low', 'Plus grave', 'أغلظ (أخفض تردّدًا)');
  S('l.dir', 'Dans le sens direct', 'في المنحى المباشر');
  S('l.inv', 'Dans le sens inverse', 'في المنحى المعاكس');
  S('l.eq', 'Elle est à l’équilibre (aucune évolution)', 'المجموعة في حالة توازن (لا تتطوّر)');
  S('l.gt', 'Supérieur à −log C', 'أكبر من −log C');
  S('l.lt', 'Inférieur à −log C', 'أصغر من −log C');
  S('l.eqn', 'Égal à −log C', 'يساوي −log C');
  S('l.both', 'Les deux en même concentration', 'الفردان بنفس التركيز');
  S('l.excess', 'Utiliser un des réactifs en excès', 'استعمال أحد المتفاعلات بزيادة');
  S('l.addw', 'Ajouter de l’eau au mélange', 'إضافة الماء إلى الخليط');
  S('l.cold', 'Refroidir fortement le mélange', 'تبريد الخليط بشدّة');
  S('l.less', 'Utiliser moins de catalyseur', 'استعمال كمية أقلّ من الوسيط');
  S('l.anode', 'L’anode', 'المصعد (الأنود)');
  S('l.cath', 'La cathode', 'المهبط (الكاثود)');
  S('l.neither', 'Aucune des deux', 'لا هذا ولا ذاك');
  S('l.a2c', 'De l’anode vers la cathode', 'من المصعد نحو المهبط');
  S('l.c2a', 'De la cathode vers l’anode', 'من المهبط نحو المصعد');
  S('l.none', 'Ils ne circulent pas dans le fil', 'لا تسري في السلك');
  S('g.alc', 'Un alcool', 'كحول');
  S('g.cet', 'Une cétone ou un aldéhyde', 'كيتون أو ألدهيد');
  S('g.acid', 'Un acide carboxylique', 'حمض كربوكسيلي');

  /* projectile */
  S('proj.fall.q', 'Une bille est lâchée sans vitesse initiale d’une hauteur de {h}. On néglige les frottements et on prend {g}. Calcule la durée de la chute, en secondes.',
    'تُترك كرة دون سرعة ابتدائية من ارتفاع {h}. نهمل الاحتكاكات ونأخذ {g}. احسب مدة السقوط بالثواني.');
  S('proj.fall.exp', 'Chute libre : {f}, soit t = {c} = {r}.', 'سقوط حرّ: {f}، أي t = {c} = {r}.');
  S('proj.range.q', 'Du bord d’un toit situé à {h} du sol, on lance horizontalement une balle à {v}. Frottements négligés, {g}. À quelle distance horizontale du pied du mur la balle touche-t-elle le sol, en mètres ?',
    'من حافة سطح يرتفع {h} عن الأرض تُقذف كرة أفقيًا بسرعة {v}. نهمل الاحتكاكات ونأخذ {g}. على أيّ بعد أفقي من أسفل الجدار تصل الكرة إلى الأرض؟ (بالمتر)');
  S('proj.range.exp', 'La durée de chute est t = {t} (h = ½ g t²). Horizontalement le mouvement est uniforme : x = v × t = {c} = {r}.',
    'مدة السقوط هي t = {t} (h = ½ g t²). الحركة أفقيًا منتظمة: x = v × t = {c} = {r}.');
  S('proj.apex.q', 'Un ballon est lancé verticalement vers le haut à {v}. On néglige les frottements ; {g}. Quelle hauteur maximale atteint-il au-dessus du point de lancer, en mètres ?',
    'تُقذف كرة شاقوليًا نحو الأعلى بسرعة {v}. نهمل الاحتكاكات ونأخذ {g}. ما أقصى ارتفاع تبلغه فوق نقطة القذف؟ (بالمتر)');
  S('proj.apex.exp', 'Au sommet la vitesse est nulle : {f}, donc h = v² ÷ (2g) = {c} = {r}.', 'في القمّة تنعدم السرعة: {f}، ومنه h = v² ÷ (2g) = {c} = {r}.');
  S('proj.vy.q', 'Un projectile est lancé avec une composante verticale de vitesse de {v} vers le haut (sens positif vers le haut). On néglige les frottements ; {g}. Quelle est la composante verticale de sa vitesse {t} après le lancement, en m/s ?',
    'يُقذف جسم بمركّبة سرعة شاقولية قدرها {v} نحو الأعلى (المنحى الموجب نحو الأعلى). نهمل الاحتكاكات ونأخذ {g}. ما المركّبة الشاقولية لسرعته بعد {t} من القذف؟ (بـ m/s)');
  S('proj.vy.exp', 'On a {f} = {c} = {r}.', 'لدينا {f} = {c} = {r}.');

  /* Kepler */
  S('kep.ratio.q', 'Un satellite tourne autour de la Terre avec une période de {T1}. Un second satellite est sur une orbite circulaire de rayon {f} fois plus grand. Avec la troisième loi de Kepler, calcule sa période, en heures.',
    'يدور قمر اصطناعي حول الأرض بدور قدره {T1}. قمر ثانٍ على مدار دائري نصف قطره أكبر {f} مرّة. باستعمال القانون الثالث لكبلر احسب دوره بالساعات.');
  S('kep.ratio.exp', 'Comme {l}, T₂ = T₁ × √(k³) = {c} = {r}.', 'بما أنّ {l}، فإنّ T₂ = T₁ × √(k³) = {c} = {r}.');
  S('kep.v.q', 'Un satellite passe sur une orbite circulaire plus haute autour de la Terre. Comment évolue sa vitesse ?', 'ينتقل قمر اصطناعي إلى مدار دائري أعلى حول الأرض. كيف تتغيّر سرعته؟');
  S('kep.v.exp', 'On a {f} : quand r augmente, la vitesse diminue.', 'لدينا {f}: كلّما زاد r نقصت السرعة.');
  S('kep.T.q', 'Un satellite passe sur une orbite circulaire plus haute autour de la Terre. Comment évolue sa période de révolution ?', 'ينتقل قمر اصطناعي إلى مدار دائري أعلى حول الأرض. كيف يتغيّر دور حركته؟');
  S('kep.T.exp', 'Avec {f}, la période croît avec le rayon de l’orbite.', 'من {f}: يزداد الدور بزيادة نصف قطر المدار.');
  S('kep.geo.q', 'Quelle est (environ) la période de révolution d’un satellite géostationnaire ?', 'ما الدور التقريبي لقمر اصطناعي مستقرّ بالنسبة للأرض (جيوستاسيوني)؟');
  S('kep.geo.exp', 'Il reste au-dessus du même point de l’équateur : sa période est celle de la rotation de la Terre, environ 24 h.', 'يبقى فوق النقطة نفسها من خطّ الاستواء، فدوره يساوي دور دوران الأرض، أي حوالي 24 h.');

  /* circuit RC */
  S('rc.tau.q', 'Dans un circuit RC, la résistance vaut {R} et la capacité {C}. Calcule la constante de temps τ, en millisecondes.', 'في دارة RC، مقاومة الناقل الأومي {R} وسعة المكثّفة {C}. احسب ثابت الزمن τ بالميلي ثانية.');
  S('rc.tau.exp', '{f} = {c} = {r} (kΩ × µF donne des ms).', '{f} = {c} = {r} (kΩ × µF يعطي ms).');
  S('rc.five.q', 'Dans un circuit RC, R = {R} et C = {C}. Le condensateur est considéré chargé après une durée de 5τ. Calcule cette durée, en millisecondes.', 'في دارة RC لدينا R = {R} وC = {C}. تُعتبر المكثّفة مشحونة بعد مدّة 5τ. احسب هذه المدّة بالميلي ثانية.');
  S('rc.five.exp', 'Avec {f} : 5τ = {c} = {r}.', 'مع {f}: 5τ = {c} = {r}.');
  S('rc.C.q', 'Un circuit RC a une résistance R = {R} et une constante de temps τ = {tau}. Calcule la capacité C du condensateur, en microfarads.', 'لدارة RC مقاومة R = {R} وثابت زمن τ = {tau}. احسب سعة المكثّفة C بالميكروفاراد.');
  S('rc.C.exp', 'De {f} : C = τ ÷ R = {c} = {r}.', 'من {f}: C = τ ÷ R = {c} = {r}.');
  S('rc.q.q', 'Un condensateur de capacité {C} est soumis à une tension de {U}. Quelle charge porte son armature positive, en microcoulombs ?', 'مكثّفة سعتها {C} موصولة بتوتّر {U}. ما شحنة لبوسها الموجب بالميكروكولوم؟');
  S('rc.q.exp', '{f} = {c} = {r} (µF × V donne des µC).', '{f} = {c} = {r} (µF × V يعطي µC).');
  S('rc.E.q', 'Un condensateur de capacité {C} est chargé sous {U}. Quelle énergie stocke-t-il, en microjoules ?', 'شُحنت مكثّفة سعتها {C} تحت توتّر {U}. ما الطاقة التي تخزّنها بالميكروجول؟');
  S('rc.E.exp', '{f} = {c} = {r} (µF × V² donne des µJ).', '{f} = {c} = {r} (µF × V² يعطي µJ).');

  /* Doppler */
  S('dop.ap.q', 'Une sirène émet un son de fréquence {f0} et se rapproche d’un observateur immobile à {vs}. La vitesse du son est 340 m/s. Calcule la fréquence perçue, en hertz.',
    'تُصدر صفارة صوتًا تردّده {f0} وتقترب من مراقب ساكن بسرعة {vs}. سرعة الصوت 340 m/s. احسب التردّد المسموع بالهرتز.');
  S('dop.ap.exp', '{f}, soit f = {c} = {r}.', '{f}، أي f = {c} = {r}.');
  S('dop.aw.q', 'Une sirène émet un son de fréquence {f0} et s’éloigne d’un observateur immobile à {vs}. La vitesse du son est 340 m/s. Calcule la fréquence perçue, en hertz.',
    'تُصدر صفارة صوتًا تردّده {f0} وتبتعد عن مراقب ساكن بسرعة {vs}. سرعة الصوت 340 m/s. احسب التردّد المسموع بالهرتز.');
  S('dop.aw.exp', '{f}, soit f = {c} = {r}.', '{f}، أي f = {c} = {r}.');
  S('dop.qual.ap.q', 'Une ambulance qui s’approche de toi fait sonner sa sirène. Le son que tu perçois est, par rapport au son émis :', 'تقترب منك سيارة إسعاف وهي تطلق صفّارتها. الصوت الذي تسمعه مقارنةً بالصوت المُصدَر:');
  S('dop.qual.ap.exp', 'En rapprochement, la fréquence perçue est plus grande que celle émise : le son est plus aigu.', 'عند الاقتراب يكون التردّد المسموع أكبر من التردّد المُصدَر، فالصوت أحدّ.');
  S('dop.qual.aw.q', 'Une ambulance qui s’éloigne de toi fait sonner sa sirène. Le son que tu perçois est, par rapport au son émis :', 'تبتعد عنك سيارة إسعاف وهي تطلق صفّارتها. الصوت الذي تسمعه مقارنةً بالصوت المُصدَر:');
  S('dop.qual.aw.exp', 'En éloignement, la fréquence perçue est plus petite que celle émise : le son est plus grave.', 'عند الابتعاد يكون التردّد المسموع أصغر من التردّد المُصدَر، فالصوت أغلظ.');

  /* décroissance */
  S('dec.left.q', 'Un échantillon contient {N0} de {X} (demi-vie : {T}). Quelle masse de ce noyau reste-t-il après {d}, en milligrammes ?',
    'تحتوي عيّنة على {N0} من النواة {X} (نصف العمر: {T}). ما كتلة هذه النواة المتبقّية بعد {d}؟ (بالميليغرام)');
  S('dec.left.exp', 'La durée correspond à {n} demi-vies : {f} = {c} = {r}.', 'المدّة تساوي n = {n} من أنصاف العمر: {f} = {c} = {r}.');
  S('dec.time.q', 'Un échantillon contient {N0} de {X} (demi-vie : {T}). Au bout d’un certain temps, il n’en reste que {Nf}. Quelle durée s’est écoulée, en {un} ?',
    'تحتوي عيّنة على {N0} من النواة {X} (نصف العمر: {T}). بعد مدّة معيّنة لم يبقَ منها سوى {Nf}. كم مضى من الزمن؟ (الجواب بوحدة: {un})');
  S('dec.time.exp', 'On a {c}, donc {n} demi-vies : durée = {cc} = {r}.', 'لدينا {c}، أي n = {n} من أنصاف العمر: المدّة = {cc} = {r}.');
  S('dec.half.q', 'Un échantillon de {X} contient {N0}. Après {d}, il n’en reste que {Nf}. Quelle est la demi-vie de ce noyau, en {un} ?',
    'تحتوي عيّنة من {X} على {N0}. بعد {d} لم يبقَ منها سوى {Nf}. ما نصف عمر هذه النواة؟ (الجواب بوحدة: {un})');
  S('dec.half.exp', 'On a {c}, donc {n} demi-vies : t½ = {cc} = {r}.', 'لدينا {c}، أي n = {n} من أنصاف العمر: t½ = {cc} = {r}.');

  /* désintégrations */
  S('des.rule.a', 'Une désintégration α émet un noyau d’hélium : A diminue de 4 et Z de 2.', 'التفتّت α يُصدر نواة هيليوم: ينقص A بمقدار 4 وZ بمقدار 2.');
  S('des.rule.b-', 'Une désintégration β⁻ conserve A et augmente Z de 1.', 'التفتّت β⁻ يحافظ على A ويزيد Z بمقدار 1.');
  S('des.rule.b+', 'Une désintégration β⁺ conserve A et diminue Z de 1.', 'التفتّت β⁺ يحافظ على A وينقص Z بمقدار 1.');
  S('des.A.q', 'Le noyau {X} subit une désintégration {ty}. Quel est le nombre de nucléons A du noyau fils ?', 'تخضع النواة {X} لتفتّت {ty}. ما عدد النويّات A للنواة الابن؟');
  S('des.A.exp', '{rule} Le noyau fils {Y} a donc A = {r}.', '{rule} إذن للنواة الابن {Y} العدد A = {r}.');
  S('des.Z.q', 'Le noyau {X} subit une désintégration {ty}. Quel est le numéro atomique Z du noyau fils ?', 'تخضع النواة {X} لتفتّت {ty}. ما العدد الشحني Z للنواة الابن؟');
  S('des.Z.exp', '{rule} Le noyau fils {Y} a donc Z = {r}.', '{rule} إذن للنواة الابن {Y} العدد Z = {r}.');
  S('des.type.q', 'Le noyau {X} se transforme en noyau {Y}. De quel type de désintégration s’agit-il ?', 'تتحوّل النواة {X} إلى النواة {Y}. ما نوع هذا التفتّت؟');
  S('des.type.exp', 'A varie de {dA} et Z de {dZ} : {rule} C’est donc {ty}.', 'يتغيّر A بمقدار {dA} ويتغيّر Z بمقدار {dZ}: {rule} إذن هو تفتّت {ty}.');

  /* thermique */
  S('th.Q.q', 'On chauffe {m} d’eau, de capacité thermique massique {c}, en élevant sa température de {dT}. Quelle énergie faut-il lui transférer, en joules ?',
    'نسخّن {m} من الماء، السعة الحرارية الكتلية له {c}، فترتفع درجة حرارته بمقدار {dT}. ما الطاقة اللازم تحويلها إليه بالجول؟');
  S('th.Q.exp', '{f} = {cc} = {r}.', '{f} = {cc} = {r}.');
  S('th.dT.q', 'On transfère {Q} à {m} d’eau ({c}). De combien de degrés Celsius sa température s’élève-t-elle ?',
    'نحوّل {Q} إلى {m} من الماء ({c}). بكم درجة سيليزية ترتفع درجة حرارته؟');
  S('th.dT.exp', 'De {f} : ΔT = Q ÷ (m c) = {cc} = {r}.', 'من {f}: ΔT = Q ÷ (m c) = {cc} = {r}.');
  S('th.flux.q', 'Un radiateur transfère {Q} à une pièce pendant {dt}. Quel est le flux thermique, en watts ?', 'تنقل مدفأة {Q} إلى غرفة خلال {dt}. ما قيمة التدفّق الحراري بالواط؟');
  S('th.flux.exp', '{f} = {cc} = {r}.', '{f} = {cc} = {r}.');
  S('th.rth.q', 'Une paroi a une résistance thermique de {Rt}. L’écart de température entre ses deux faces est de {dT}. Quel flux thermique la traverse, en watts ?',
    'المقاومة الحرارية لجدار {Rt}. فرق درجة الحرارة بين وجهيه {dT}. ما قيمة التدفّق الحراري الذي يعبره بالواط؟');
  S('th.rth.exp', '{f} = {cc} = {r}.', '{f} = {cc} = {r}.');

  /* vitesse */
  S('vit.v.q', 'La concentration d’un réactif A passe de {A0} à {A1} en {dt}. Calcule la vitesse volumique moyenne de disparition de A, en {un}.', 'يتناقص تركيز متفاعل A من {A0} إلى {A1} خلال {dt}. احسب السرعة الحجمية المتوسّطة لاختفاء A بـ {un}.');
  S('vit.v.exp', '{f} = {c} = {r}.', '{f} = {c} = {r}.');
  S('vit.rest.q', 'Un réactif A a une concentration initiale de {A0}. Sa vitesse de disparition est constante et vaut {v}. Quelle est sa concentration après {dt}, en mol/L ?', 'تركيز متفاعل A الابتدائي {A0}. سرعة اختفائه ثابتة وتساوي {v}. ما تركيزه بعد {dt}؟ (بـ mol/L)');
  S('vit.rest.exp', '[A] = [A]₀ − v × Δt = {c} = {r}.', '[A] = [A]₀ − v × Δt = {c} = {r}.');
  S('vit.half.q', 'L’avancement final d’une réaction vaut {xf}. Quel est l’avancement à l’instant du temps de demi-réaction, en mol ?', 'التقدّم النهائي لتفاعل يساوي {xf}. ما قيمة التقدّم عند لحظة زمن نصف التفاعل؟ (بـ mol)');
  S('vit.half.exp', 'À t½, l’avancement vaut la moitié de sa valeur finale : x = {c} = {r}.', 'عند t½ يساوي التقدّم نصف قيمته النهائية: x = {c} = {r}.');

  /* équilibre */
  S('eq.qr.q', 'Pour la réaction {eq}, les concentrations à un instant donné sont [A] = {A}, [B] = {B}, [C] = {C} et [D] = {D}. Calcule le quotient de réaction Q<sub>r</sub>.', 'بالنسبة للتفاعل {eq}، تراكيز الأفراد في لحظة معيّنة هي [A] = {A} و[B] = {B} و[C] = {C} و[D] = {D}. احسب خارج التفاعل Q<sub>r</sub>.');
  S('eq.qr.exp', '{f} = {c} = {r}.', '{f} = {c} = {r}.');
  S('eq.tau.q', 'Une réaction dont l’avancement maximal est {xmax} atteint un avancement final de {xf}. Calcule le taux d’avancement final τ, en pourcentage.', 'تفاعل تقدّمه الأقصى {xmax} يبلغ تقدّمه النهائي {xf}. احسب نسبة التقدّم النهائي τ بالنسبة المئوية.');
  S('eq.tau.exp', '{f} : τ = {c} = {r}.', '{f}: τ = {c} = {r}.');
  S('eq.sens.q', 'Pour la réaction {eq}, on a {Q} et {K}. Comment évolue spontanément le système ?', 'بالنسبة للتفاعل {eq} لدينا {Q} و{K}. كيف تتطوّر المجموعة تلقائيًا؟');
  S('eq.sens.exp', 'On compare {Q} et {K} : Q<sub>r</sub> {s} K, donc : {res}.', 'نقارن {Q} و{K}: Q<sub>r</sub> {s} K، إذن: {res}.');

  /* pH acide fort */
  S('ph.ph.q', 'Quel est le pH d’une solution d’acide fort de concentration {C} ?', 'ما قيمة pH محلول حمض قويّ تركيزه {C}؟');
  S('ph.ph.exp', '{f} = {c} = {r}.', '{f} = {c} = {r}.');
  S('ph.conc.q', 'Une solution d’acide fort a un pH égal à {pH}. Quelle est sa concentration en acide, en mmol/L ?', 'محلول حمض قويّ قيمة pH له {pH}. ما تركيز الحمض فيه بالميلي مول لكل لتر؟');
  S('ph.conc.exp', '{f} = {c} = {r}.', '{f} = {c} = {r}.');
  S('ph.dil.q', 'On dilue {f} fois une solution d’acide fort de concentration {C}. Quel est le pH de la solution obtenue ?', 'نمدّد {f} مرّة محلول حمض قويّ تركيزه {C}. ما قيمة pH المحلول الناتج؟');
  S('ph.dil.exp', 'La concentration devient {c}, donc pH = {r}.', 'يصبح التركيز {c}، إذن pH = {r}.');
  S('ph.weak.q', 'Le pH d’une solution d’acide faible de concentration {C} est, par rapport à −log C :', 'قيمة pH محلول حمض ضعيف تركيزه {C} هي، بالمقارنة مع −log C:');
  S('ph.weak.exp', 'Un acide faible réagit partiellement avec l’eau : [H<sub>3</sub>O<sup>+</sup>] est inférieure à C, donc le pH est supérieur à −log C = {n}.', 'الحمض الضعيف يتفاعل جزئيًا مع الماء: [H<sub>3</sub>O<sup>+</sup>] أصغر من C، إذن pH أكبر من −log C = {n}.');

  /* pKa */
  S('pka.ph.q', 'Dans une solution du couple {A} / {B} ({pk}), le rapport [base] ÷ [acide] vaut {ratio}. Calcule le pH.', 'في محلول للمزدوجة {A} / {B} ({pk}) تكون النسبة [القاعدة] ÷ [الحمض] تساوي {ratio}. احسب pH.');
  S('pka.ph.exp', '{f} = {c} = {r}.', '{f} = {c} = {r}.');
  S('pka.ratio.q', 'Dans une solution du couple {A} / {B} ({pk}), on mesure {pH}. Calcule le rapport [base] ÷ [acide].', 'في محلول للمزدوجة {A} / {B} ({pk}) نقيس {pH}. احسب النسبة [القاعدة] ÷ [الحمض].');
  S('pka.ratio.exp', '{f} : {c} = {r}.', '{f}: {c} = {r}.');
  S('pka.pred.q', 'Pour le couple {A} / {B} ({pk}), la solution a {pH}. Quelle espèce prédomine ?', 'بالنسبة للمزدوجة {A} / {B} ({pk}) للمحلول {pH}. ما الفرد الغالب؟');
  S('pka.pred.exp', 'On compare {pH} et {pk} : pH {s} pKa, donc prédomine : {res}.', 'نقارن {pH} و{pk}: pH {s} pKa، إذن الغالب: {res}.');

  /* estérification */
  S('est.rend.q', 'On mélange {n0} d’acide éthanoïque et {n0} d’éthanol. On obtient {ne} d’éthanoate d’éthyle. Calcule le rendement de la synthèse, en pourcentage.', 'نمزج {n0} من حمض الإيثانويك و{n0} من الإيثانول. نحصل على {ne} من إيثانوات الإيثيل. احسب مردود التفاعل بالنسبة المئوية.');
  S('est.rend.exp', 'Les réactifs sont dans les proportions stœchiométriques : n<sub>max</sub> = {n0}. {f} = {c} = {r}.', 'المتفاعلان بنسبتهما الستوكيومترية: n<sub>max</sub> = {n0}. {f} = {c} = {r}.');
  S('est.n.q', 'On mélange {n0} d’acide éthanoïque et {n0} d’éthanol. Le rendement de la synthèse est de {rho}. Quelle quantité d’éthanoate d’éthyle obtient-on, en mol ?', 'نمزج {n0} من حمض الإيثانويك و{n0} من الإيثانول. مردود التفاعل {rho}. ما كمّية إيثانوات الإيثيل المحصّل عليها بـ mol؟');
  S('est.n.exp', 'n<sub>exp</sub> = n<sub>max</sub> × ρ = {c} = {r}.', 'n<sub>exp</sub> = n<sub>max</sub> × ρ = {c} = {r}.');
  S('est.m.q', 'On mélange {n0} d’acide éthanoïque et {n0} d’éthanol. Le rendement est de {rho}. Quelle masse d’éthanoate d’éthyle ({M}) obtient-on, en grammes ?', 'نمزج {n0} من حمض الإيثانويك و{n0} من الإيثانول. المردود {rho}. ما كتلة إيثانوات الإيثيل ({M}) المحصّل عليها بالغرام؟');
  S('est.m.exp', 'n<sub>exp</sub> = {nn} ; m = n × M = {c} = {r}.', 'n<sub>exp</sub> = {nn}؛ m = n × M = {c} = {r}.');
  S('est.imp.q', 'Parmi ces propositions, laquelle permet d’améliorer le rendement d’une estérification ?', 'أيّ اقتراح من الاقتراحات التالية يسمح بتحسين مردود تفاعل الأسترة؟');
  S('est.imp.exp', 'La réaction est limitée : un réactif en excès (ou l’élimination de l’eau formée) déplace l’équilibre vers l’ester. Ajouter de l’eau ou refroidir ne convient pas.', 'التفاعل محدود: استعمال متفاعل بزيادة (أو إزالة الماء المتكوّن) يزيح التوازن نحو الأستر. أمّا إضافة الماء أو التبريد فلا يفيدان.');

  /* IR */
  S('ir.sigma.q', 'Une radiation infrarouge a une longueur d’onde de {lam}. Calcule son nombre d’onde σ, en cm⁻¹ (σ = 1 ÷ λ, avec λ en cm).', 'إشعاع تحت أحمر طوله الموجي {lam}. احسب عدده الموجي σ بـ cm⁻¹ (σ = 1 ÷ λ مع λ بـ cm).');
  S('ir.sigma.exp', '{f}, avec λ en µm : σ = {c} = {r} (1 µm = 10⁻⁴ cm).', '{f} مع λ بـ µm: σ = {c} = {r} (1 µm = 10⁻⁴ cm).');
  S('ir.d.fine', 'fine', 'رفيعة'); S('ir.d.large', 'large', 'عريضة');
  S('ir.band.q', 'Sur un spectre infrarouge, une bande {d} et intense apparaît vers {s}. À quelle liaison correspond-elle ?', 'في الطيف تحت الأحمر تظهر حزمة {d} وشديدة عند {s} تقريبًا. لأيّ رابطة تعود؟');
  S('ir.band.exp', 'Vers {s}, on trouve la liaison {r} (O–H : 3 200 à 3 600 cm⁻¹, bande large ; C=O : 1 700 cm⁻¹ ; C–H : 2 900 cm⁻¹).', 'عند {s} نجد الرابطة {r} (O–H: من 3 200 إلى 3 600 cm⁻¹ حزمة عريضة؛ C=O: 1 700 cm⁻¹؛ C–H: 2 900 cm⁻¹).');
  S('ir.grp.oh.q', 'Un spectre infrarouge présente une bande large vers 3 300 cm⁻¹ et aucune bande vers 1 700 cm⁻¹. Quel groupe caractéristique la molécule possède-t-elle ?', 'يُظهر طيف تحت أحمر حزمة عريضة عند 3 300 cm⁻¹ ولا توجد أيّ حزمة عند 1 700 cm⁻¹. ما المجموعة المميّزة للجزيء؟');
  S('ir.grp.oh.exp', 'La bande large vers 3 300 cm⁻¹ est celle de O–H, et l’absence de C=O exclut un acide : c’est un alcool.', 'الحزمة العريضة عند 3 300 cm⁻¹ هي حزمة الرابطة O–H، وغياب C=O يستبعد الحمض: الجزيء كحول.');
  S('ir.grp.co.q', 'Un spectre infrarouge présente une bande fine et intense vers 1 710 cm⁻¹ et aucune bande large O–H. Quel groupe caractéristique la molécule possède-t-elle ?', 'يُظهر طيف تحت أحمر حزمة رفيعة وشديدة عند 1 710 cm⁻¹ ولا توجد حزمة عريضة للرابطة O–H. ما المجموعة المميّزة للجزيء؟');
  S('ir.grp.co.exp', 'La bande vers 1 710 cm⁻¹ est celle de C=O ; sans bande O–H, c’est une cétone ou un aldéhyde.', 'الحزمة عند 1 710 cm⁻¹ هي حزمة C=O؛ وبدون حزمة O–H يكون الجزيء كيتونًا أو ألدهيدًا.');
  S('ir.grp.both.q', 'Un spectre infrarouge présente une bande fine et intense vers 1 710 cm⁻¹ et une bande O–H très large entre 2 500 et 3 300 cm⁻¹. Quel groupe caractéristique la molécule possède-t-elle ?', 'يُظهر طيف تحت أحمر حزمة رفيعة وشديدة عند 1 710 cm⁻¹ وحزمة O–H عريضة جدًا بين 2 500 و3 300 cm⁻¹. ما المجموعة المميّزة للجزيء؟');
  S('ir.grp.both.exp', 'C=O (1 710 cm⁻¹) et O–H très large : ces deux bandes ensemble caractérisent un acide carboxylique.', 'وجود C=O (عند 1 710 cm⁻¹) مع O–H عريضة جدًا يميّز الحمض الكربوكسيلي.');

  /* électrochimie */
  S('el.Q.q', 'Un électrolyseur est parcouru par un courant constant de {I} pendant {dt}. Quelle quantité d’électricité a-t-il reçue, en coulombs ?', 'يجتاز تيّار ثابت شدّته {I} مُحلّلة كهربائية خلال {dt}. ما كمّية الكهرباء التي استقبلتها بالكولوم؟');
  S('el.Q.exp', '{f} = {c} = {r}.', '{f} = {c} = {r}.');
  S('el.ne.q', 'Un courant constant de {I} traverse un électrolyseur pendant {dt}. Avec {F}, quelle quantité d’électrons a circulé, en millimoles ?', 'يجتاز تيّار ثابت شدّته {I} مُحلّلة كهربائية خلال {dt}. بأخذ {F}، ما كمّية الإلكترونات التي سرت بالميلي مول؟');
  S('el.ne.exp', 'Q = {c1} C ; {f} = {c} = {nmol}, soit {r}.', 'Q = {c1} C؛ {f} = {c} = {nmol}، أي {r}.');
  S('el.mass.q', 'Un courant constant de {I} circule pendant {dt} dans un électrolyseur. Le métal se dépose à la cathode selon {eq}. Avec {F} et M({X}) = {Mm}, quelle masse de métal se dépose, en grammes ?', 'يسري تيّار ثابت شدّته {I} خلال {dt} في مُحلّلة كهربائية. يترسّب الفلز على المهبط وفق المعادلة {eq}. بأخذ {F} وM({X}) = {Mm}، ما كتلة الفلز المترسّبة بالغرام؟');
  S('el.mass.exp', 'Q = {c1} C ; n(e<sup>−</sup>) = {n}. D’après l’équation, n({X}) = n(e<sup>−</sup>) ÷ nombre d’électrons, et m = n × M = {c} = {r}.', 'Q = {c1} C؛ n(e<sup>−</sup>) = {n}. حسب المعادلة n({X}) = n(e<sup>−</sup>) ÷ عدد الإلكترونات، وm = n × M = {c} = {r}.');
  S('el.pile-ox.q', 'Dans une pile, comment s’appelle l’électrode où a lieu l’oxydation ?', 'في عمود كهربائي، ماذا تسمّى الإلكترود التي تحدث عندها الأكسدة؟');
  S('el.pile-ox.exp', 'Par définition, l’oxydation a lieu à l’anode, et la réduction à la cathode.', 'حسب التعريف تحدث الأكسدة عند المصعد (الأنود) والارجاع عند المهبط (الكاثود).');
  S('el.elec-plus.q', 'Dans un électrolyseur, comment s’appelle l’électrode reliée à la borne + du générateur ?', 'في مُحلّلة كهربائية، ماذا يسمّى الإلكترود الموصول بالقطب + للمولّد؟');
  S('el.elec-plus.exp', 'L’électrode reliée au pôle + est le siège de l’oxydation : c’est l’anode.', 'الإلكترود الموصول بالقطب + هو مقرّ الأكسدة: إنّه المصعد (الأنود).');
  S('el.pile-e.q', 'Dans le fil extérieur d’une pile qui débite, dans quel sens circulent les électrons ?', 'في السلك الخارجي لعمود كهربائي يعمل، في أيّ منحى تسري الإلكترونات؟');
  S('el.pile-e.exp', 'Les électrons libérés par l’oxydation à l’anode circulent dans le fil vers la cathode, où ils sont captés par la réduction.', 'الإلكترونات المتحرّرة من الأكسدة عند المصعد تسري في السلك نحو المهبط حيث تُستهلك في الارجاع.');

  Object.assign(root.STRINGS, FR);
  Object.assign(root.STRINGS_AR, AR);

  Object.assign(root.AR_CATALOG, {
    'Mécanique et gravitation': 'الميكانيك والتجاذب',
    'Électricité et ondes': 'الكهرباء والأمواج',
    'Noyau et énergie': 'النواة والطاقة',
    'Cinétique et équilibre': 'الحركية الكيميائية والتوازن',
    'Acides et bases (pH)': 'الأحماض والأسس (pH)',
    'Synthèse et analyse': 'التركيب والتحليل',
    'Électrochimie': 'الكيمياء الكهربائية',
    'Chute et projectile': 'السقوط والقذيفة',
    'Orbites et lois de Kepler': 'المدارات وقوانين كبلر',
    'Le circuit RC : calculs': 'دارة RC: حسابات',
    'Effet Doppler : fréquence perçue': 'مفعول دوبلر: التردّد المسموع',
    'Décroissance radioactive': 'التناقص الإشعاعي',
    'Équations de désintégration': 'معادلات التفتّت',
    'Chaleur et flux thermique': 'الحرارة والتدفّق الحراري',
    'Vitesse et avancement d’une réaction': 'سرعة التفاعل وتقدّمه',
    'Quotient, équilibre et taux d’avancement': 'خارج التفاعل والتوازن ونسبة التقدّم',
    'pH d’un acide fort': 'pH حمض قويّ',
    'pKa et prédominance': 'pKa والفرد الغالب',
    'Rendement d’une estérification': 'مردود تفاعل الأسترة',
    'Spectres infrarouges': 'الأطياف تحت الحمراء',
    'Pile, électrolyse et quantité d’électricité': 'العمود والتحليل الكهربائي وكمّية الكهرباء',
  });

  /* ====================================================================
   *  CATALOGUE
   * ==================================================================== */
  const lv = (root.CATALOG_EXTRA || []).find((l) => l.id === 'term');
  lv.domains.push(
    { name: 'Physique', cats: [
      { name: 'Mécanique et gravitation', skills: [
        ['Chute et projectile', 'pcterm_proj', { kinds: ['fall', 'range', 'apex', 'vy'] }],
        ['Orbites et lois de Kepler', 'pcterm_kepler', { kinds: ['ratio', 'ratio', 'v', 'T', 'geo'] }],
      ] },
      { name: 'Électricité et ondes', skills: [
        ['Le circuit RC : calculs', 'pcterm_rc', { kinds: ['tau', 'five', 'C', 'q', 'E'] }],
        ['Effet Doppler : fréquence perçue', 'pcterm_doppler', { kinds: ['ap', 'aw', 'qual'] }],
      ] },
      { name: 'Noyau et énergie', skills: [
        ['Décroissance radioactive', 'pcterm_decay', { kinds: ['left', 'time', 'half'] }],
        ['Équations de désintégration', 'pcterm_desint', { kinds: ['A', 'Z', 'type'] }],
        ['Chaleur et flux thermique', 'pcterm_therm', { kinds: ['Q', 'dT', 'flux', 'rth'] }],
      ] },
    ] },
    { name: 'Chimie', cats: [
      { name: 'Cinétique et équilibre', skills: [
        ['Vitesse et avancement d’une réaction', 'pcterm_vit', { kinds: ['v', 'rest', 'half'] }],
        ['Quotient, équilibre et taux d’avancement', 'pcterm_equi', { kinds: ['qr', 'tau', 'sens'] }],
      ] },
      { name: 'Acides et bases (pH)', skills: [
        ['pH d’un acide fort', 'pcterm_phfort', { kinds: ['ph', 'conc', 'dil', 'weak'] }],
        ['pKa et prédominance', 'pcterm_pka', { kinds: ['ph', 'ratio', 'pred'] }],
      ] },
      { name: 'Synthèse et analyse', skills: [
        ['Rendement d’une estérification', 'pcterm_ester', { kinds: ['rend', 'nester', 'mass', 'improve'] }],
        ['Spectres infrarouges', 'pcterm_ir', { kinds: ['sigma', 'band', 'grp'] }],
      ] },
      { name: 'Électrochimie', skills: [
        ['Pile, électrolyse et quantité d’électricité', 'pcterm_elec', { kinds: ['Q', 'ne', 'mass', 'electrode'] }],
      ] },
    ] }
  );
}(typeof window !== 'undefined' ? window : globalThis));
