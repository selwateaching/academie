/* Physique-chimie, niveau 3e : générateurs, textes FR/AR, catalogue. */
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
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[R(0, a.length - 1)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const round = (x, k = 6) => Number(x.toFixed(k));
  const fmt = (x) => String(x).replace(/-/g, '−').replace('.', ',');
  const m = (s) => `<span class="m">${String(s).replace(/[؀-ۿ]+/g, '⁦$&⁩')}</span>`;
  const mu = (x, u) => m(fmt(x) + ' ' + u);                  // nombre + unité
  function mc(correct, wrongs, labelf = (v) => m(v)) {
    const seen = new Set([String(correct)]), out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  }
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" direction="ltr" style="direction:ltr">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;
  const num = (q, ans, exp, vis) => ({ q, vis, kind: 'num', ans, exp });
  // QCM dont les choix sont des textes : clés pre.<lettre>, énoncé pre.q, correction pre.exp
  const qcm = (pre, ans, wrongs, vars, vis) => ({
    q: t(pre + '.q', vars), vis, kind: 'choice', ans,
    choices: mc(ans, wrongs, (v) => t(pre + '.' + v, vars)), exp: t(pre + '.exp', vars),
  });
  const kinds = (p, d) => (p && p.kinds) || d;

  /* ================================================================ Électricité */

  const circuit = (rl, il) => svg(300, 130,
    '<rect x="40" y="25" width="220" height="80" fill="none" stroke="#334155" stroke-width="2"/>' +
    '<rect x="30" y="55" width="20" height="20" fill="#f8fafc" stroke="none"/><line x1="34" y1="48" x2="34" y2="82" stroke="#334155" stroke-width="3"/><line x1="46" y1="56" x2="46" y2="74" stroke="#334155" stroke-width="3"/>' +
    '<rect x="215" y="14" width="70" height="22" fill="#fff" stroke="#334155" stroke-width="2"/>' +
    txt(250, 30, rl, { s: 13 }) + txt(20, 68, 'U', { s: 15, c: '#dc2626', a: 'end' }) +
    '<polygon points="150,25 140,19 140,31" fill="#2563eb"/>' + txt(150, 14, il, { s: 14, c: '#2563eb' }));

  GEN.pc3e_ohm = (p) => {
    const k = pick((p && p.modes) || ['U', 'R', 'I', 'Um']);
    const Rs = [10, 20, 25, 40, 50, 100, 200, 220, 500], Is = [0.02, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 1, 2];
    if (k === 'Um') {
      const r = pick([10, 20, 50, 100, 200, 500]), ma = pick([10, 20, 50, 100, 200, 250, 500]), u = round(r * ma / 1000);
      return num(t('pc.3e.ohm.Um.q', { R: mu(r, 'Ω'), I: mu(ma, 'mA') }), u, t('pc.3e.ohm.Um.exp', { R: m(r), ma: m(ma), I: mu(round(ma / 1000), 'A'), ans: mu(u, 'V') }), circuit(`R = ${r} Ω`, 'I'));
    }
    const r = pick(Rs), i = pick(Is), u = round(r * i);
    const d = { R: mu(r, 'Ω'), I: mu(i, 'A'), U: mu(u, 'V'), r: m(r), i: m(fmt(i)), u: m(fmt(u)) };
    if (k === 'U') return num(t('pc.3e.ohm.U.q', d), u, t('pc.3e.ohm.U.exp', d), circuit(`R = ${fmt(r)} Ω`, `I = ${fmt(i)} A`));
    if (k === 'R') return num(t('pc.3e.ohm.R.q', d), r, t('pc.3e.ohm.R.exp', d), circuit('R = ?', `I = ${fmt(i)} A`));
    return num(t('pc.3e.ohm.I.q', d), i, t('pc.3e.ohm.I.exp', d), circuit(`R = ${fmt(r)} Ω`, 'I = ?'));
  };

  GEN.pc3e_puiss = (p) => {
    const k = pick((p && p.modes) || ['P', 'I', 'E', 'cost', 'J']);
    if (k === 'P' || k === 'I') {
      const u = pick([6, 9, 12, 24, 230]), i = pick([0.2, 0.25, 0.5, 1, 1.5, 2, 4]), pw = round(u * i);
      const d = { U: mu(u, 'V'), I: mu(i, 'A'), P: mu(pw, 'W'), u: m(u), i: m(fmt(i)), p: m(fmt(pw)) };
      return k === 'P' ? num(t('pc.3e.pu.P.q', d), pw, t('pc.3e.pu.P.exp', d)) : num(t('pc.3e.pu.I.q', d), i, t('pc.3e.pu.I.exp', d));
    }
    if (k === 'J') {
      const pw = pick([10, 20, 60, 100, 500]), s = pick([10, 30, 60, 120]), e = pw * s;
      return num(t('pc.3e.pu.J.q', { P: mu(pw, 'W'), t: mu(s, 's') }), e, t('pc.3e.pu.J.exp', { p: m(pw), s: m(s), ans: mu(e, 'J') }));
    }
    const pw = pick([100, 200, 500, 1000, 1500, 2000, 2500]), h = pick([1, 2, 3, 4, 5, 6, 8, 10]), e = round(pw * h / 1000);
    const d = { P: mu(pw, 'W'), t: mu(h, 'h'), pk: mu(round(pw / 1000), 'kW'), p: m(fmt(round(pw / 1000))), h: m(h), E: mu(e, 'kWh') };
    if (k === 'E') return num(t('pc.3e.pu.E.q', d), e, t('pc.3e.pu.E.exp', d));
    const pr = pick([0.1, 0.2, 0.25, 0.5]), c = round(e * pr);
    return num(t('pc.3e.pu.C.q', Object.assign({ pr: mu(pr, '€') }, d)), c, t('pc.3e.pu.C.exp', Object.assign({ e: m(fmt(e)), pr: m(fmt(pr)), ans: mu(c, '€') }, d)));
  };

  /* ================================================================ Lumière et gravitation */

  const lens = (ray) => {
    let s = '<line x1="10" y1="70" x2="310" y2="70" stroke="#94a3b8" stroke-width="1.5"/>' +
      '<path d="M160 20 Q178 70 160 120 Q142 70 160 20Z" fill="#bae6fd" stroke="#0369a1" stroke-width="2"/>';
    [[100, 'F'], [220, 'F′'], [160, 'O']].forEach(([x, l]) => { s += `<line x1="${x}" y1="65" x2="${x}" y2="75" stroke="#334155" stroke-width="2"/>` + txt(x + (l === 'O' ? 10 : 0), 90, l, { s: 14 }); });
    if (ray === 'par') s += '<line x1="20" y1="40" x2="160" y2="40" stroke="#dc2626" stroke-width="2"/><polygon points="95,40 87,36 87,44" fill="#dc2626"/>';
    else s += '<line x1="30" y1="105" x2="160" y2="70" stroke="#dc2626" stroke-width="2"/><polygon points="95,87 86,87 90,95" fill="#dc2626"/>';
    return svg(320, 135, s);
  };

  GEN.pc3e_lentille = (p) => {
    const k = pick(kinds(p, ['par', 'cen', 'img', 'shape', 'f']));
    if (k === 'par') return qcm('pc.3e.len.par', 'a', ['b', 'c', 'd'], {}, lens('par'));
    if (k === 'cen') return qcm('pc.3e.len.cen', 'a', ['b', 'c', 'd'], {}, lens('cen'));
    if (k === 'shape') return qcm('pc.3e.len.shape', 'a', ['b', 'c'], {});
    if (k === 'f') {
      const cm = pick([2, 4, 5, 8, 10, 20, 25, 40, 50, 100]), mm = round(cm / 100);
      return num(t('pc.3e.len.f.q', { f: mu(cm, 'cm') }), mm, t('pc.3e.len.f.exp', { f: m(cm), ans: mu(mm, 'm') }));
    }
    return qcm('pc.3e.len.img' + pick([1, 2, 3]), 'a', ['b', 'c', 'd'], {});
  };

  const PLANETS = { earth: 10, moon: 1.6, mars: 3.7, jup: 25 };
  GEN.pc3e_poids = (p) => {
    const k = pick((p && p.modes) || ['P', 'm', 'moon', 'qual']);
    if (k === 'qual') return qcm('pc.3e.pds.q' + pick([1, 2, 3, 4]), 'a', ['b', 'c', 'd'], {});
    if (k === 'moon') {
      const ms = pick([5, 10, 20, 30, 50]), pt = ms * 10, pl = round(ms * 1.6);
      return num(t('pc.3e.pds.moon.q', { P: mu(pt, 'N') }), pl, t('pc.3e.pds.moon.exp', { P: m(pt), mm: mu(ms, 'kg'), ms: m(ms), ans: mu(pl, 'N') }));
    }
    const pl = pick(Object.keys(PLANETS)), g = PLANETS[pl], ms = pick([1, 2, 5, 10, 20, 50, 60, 70, 80]), w = round(ms * g);
    const d = { pl: t('pc.3e.pl.' + pl), g: mu(g, 'N/kg'), gg: m(fmt(g)), M: mu(ms, 'kg'), ms: m(ms), P: mu(w, 'N') };
    return k === 'P' ? num(t('pc.3e.pds.P.q', d), w, t('pc.3e.pds.P.exp', d)) : num(t('pc.3e.pds.m.q', d), ms, t('pc.3e.pds.m.exp', d));
  };

  /* ================================================================ Mouvement et énergie */

  GEN.pc3e_inertie = () => qcm('pc.3e.ine.q' + R(1, 7), 'a', ['b', 'c'], {});

  GEN.pc3e_ec = (p) => {
    const k = pick((p && p.modes) || ['Ec', 'v', 'kmh', 'ratio']);
    if (k === 'ratio') {
      const f = pick([2, 3, 4, 5]);
      return num(t('pc.3e.ec.r.q', { k: m(f) }), f * f, t('pc.3e.ec.r.exp', { k: m(f), k2: m(f * f) }));
    }
    if (k === 'kmh') {
      const ms = pick([800, 1000, 1200, 1500]), kmh = pick([18, 36, 54, 72, 90, 108]), v = kmh / 3.6, e = ms * v * v / 2;
      return num(t('pc.3e.ec.kmh.q', { M: mu(ms, 'kg'), V: mu(kmh, 'km/h') }), e, t('pc.3e.ec.kmh.exp', { kmh: m(kmh), v: mu(v, 'm/s'), vv: m(v), ms: m(ms), ans: mu(e, 'J') }));
    }
    if (k === 'v') {
      const ms = pick([2, 4, 6, 8, 10, 20, 50]), v = R(2, 30), e = ms * v * v / 2;
      return num(t('pc.3e.ec.v.q', { M: mu(ms, 'kg'), E: mu(e, 'J') }), v, t('pc.3e.ec.v.exp', { ms: m(ms), e: m(fmt(e)), v2: m(v * v), v: mu(v, 'm/s') }));
    }
    const ms = pick([1, 2, 3, 4, 5, 6, 8, 10, 20]), v = R(2, 20), e = ms * v * v / 2;
    return num(t('pc.3e.ec.Ec.q', { M: mu(ms, 'kg'), V: mu(v, 'm/s') }), e, t('pc.3e.ec.Ec.exp', { ms: m(ms), v: m(v), ans: mu(e, 'J') }));
  };

  GEN.pc3e_ep = (p) => {
    const k = pick((p && p.modes) || ['Ep', 'h', 'm', 'vfall']);
    const ms = pick([1, 2, 3, 4, 5, 10, 20, 50]), h = pick([2, 3, 4, 5, 8, 10, 15, 20, 30]), e = ms * 10 * h;
    const d = { M: mu(ms, 'kg'), H: mu(h, 'm'), E: mu(e, 'J'), ms: m(ms), h: m(h), e: m(e) };
    if (k === 'Ep') return num(t('pc.3e.ep.E.q', d), e, t('pc.3e.ep.E.exp', d));
    if (k === 'h') return num(t('pc.3e.ep.h.q', d), h, t('pc.3e.ep.h.exp', d));
    if (k === 'm') return num(t('pc.3e.ep.m.q', d), ms, t('pc.3e.ep.m.exp', d));
    const hh = pick([5, 20, 45, 80, 125]), v = Math.sqrt(20 * hh);
    return num(t('pc.3e.ep.v.q', { H: mu(hh, 'm') }), v, t('pc.3e.ep.v.exp', { h: m(hh), v2: m(20 * hh), v: mu(v, 'm/s') }));
  };

  /* ================================================================ Ions et solutions */

  // [formule, charge, nombre d’électrons de l’atome]
  const IONS = [['Na', 1, 11], ['Cu', 2, 29], ['Fe', 2, 26], ['Fe', 3, 26], ['Zn', 2, 30], ['Ca', 2, 20], ['Ag', 1, 47], ['Al', 3, 13], ['Cl', -1, 17], ['O', -2, 8], ['S', -2, 16]];
  const ionF = (s, c) => s + '<sup>' + (Math.abs(c) > 1 ? Math.abs(c) : '') + (c > 0 ? '+' : '−') + '</sup>';

  GEN.pc3e_ions = (p) => {
    const k = pick(kinds(p, ['e', 'type', 'z', 'neutral']));
    if (k === 'neutral') {
      const cat = pick([['Na', 1], ['Ca', 2], ['Fe', 3], ['Cu', 2], ['Al', 3], ['Zn', 2]]), an = pick([['Cl', -1], ['O', -2]]);
      const b = -an[1], n = b * R(2, 4), need = n * cat[1] / b;
      return num(t('pc.3e.ion.n.q', { n: m(n), c: m(ionF(cat[0], cat[1])), a: m(ionF(an[0], an[1])) }), need,
        t('pc.3e.ion.n.exp', { n: m(n), tot: m(n * cat[1]), b: m(b), ans: m(need), a: m(ionF(an[0], an[1])) }));
    }
    const [s, c, z] = pick(IONS);
    if (k === 'type') {
      const cc = c > 0 ? 'a' : 'b';
      return { q: t('pc.3e.ion.t.q', { ion: m(ionF(s, c)) }), kind: 'choice', ans: cc, choices: mc(cc, ['a', 'b', 'c'], (v) => t('pc.3e.ion.t.' + v)), exp: t('pc.3e.ion.t.exp' + (c > 0 ? '1' : '2'), { ion: m(ionF(s, c)) }) };
    }
    if (k === 'z') {
      const e = z - c;
      return num(t('pc.3e.ion.z.q', { s: m(s), z: m(z), ion: m(ionF(s, c)) }), e, t('pc.3e.ion.z.exp' + (c > 0 ? '1' : '2'), { z: m(z), c: m(Math.abs(c)), ans: m(e) }));
    }
    return num(t('pc.3e.ion.e.q' + (c > 0 ? '1' : '2'), { s: m(s), ion: m(ionF(s, c)) }), Math.abs(c), t('pc.3e.ion.e.exp' + (c > 0 ? '1' : '2'), { ion: m(ionF(s, c)), ans: m(Math.abs(c)) }));
  };

  GEN.pc3e_solion = (p) => {
    const k = pick(kinds(p, ['dir', 'dir', 'fix']));
    if (k === 'dir') {
      const [s, c] = pick(IONS), cc = c > 0 ? 'a' : 'b';
      return { q: t('pc.3e.sol.dir.q', { ion: m(ionF(s, c)) }), kind: 'choice', ans: cc, choices: mc(cc, ['a', 'b', 'c'], (v) => t('pc.3e.sol.dir.' + v)), exp: t('pc.3e.sol.dir.exp' + (c > 0 ? '1' : '2'), { ion: m(ionF(s, c)) }) };
    }
    return qcm('pc.3e.sol.f' + R(1, 5), 'a', ['b', 'c', 'd'], {});
  };

  GEN.pc3e_conc = (p) => {
    const k = pick((p && p.modes) || ['C', 'm', 'V']);
    const C = pick([2, 5, 8, 10, 20, 25, 40, 50, 100]), V = pick([0.1, 0.2, 0.25, 0.5, 1, 2, 4]);
    const ms = round(C * V), ml = Math.round(V * 1000), useMl = Math.random() < 0.4;
    const Vl = useMl ? mu(ml, 'mL') : mu(V, 'L');
    const conv = useMl ? t('pc.3e.cc.conv', { ml: m(ml), l: mu(V, 'L') }) : '';
    if (k === 'C') return num(t('pc.3e.cc.C.q', { M: mu(ms, 'g'), V: Vl }), C, conv + t('pc.3e.cc.C.exp', { ms: m(fmt(ms)), v: m(fmt(V)), ans: mu(C, 'g/L') }));
    if (k === 'm') return num(t('pc.3e.cc.m.q', { C: mu(C, 'g/L'), V: Vl }), ms, conv + t('pc.3e.cc.m.exp', { c: m(C), v: m(fmt(V)), ans: mu(ms, 'g') }));
    return useMl
      ? num(t('pc.3e.cc.V2.q', { M: mu(ms, 'g'), C: mu(C, 'g/L') }), ml, t('pc.3e.cc.V2.exp', { ms: m(fmt(ms)), c: m(C), v: mu(V, 'L'), ans: mu(ml, 'mL') }))
      : num(t('pc.3e.cc.V.q', { M: mu(ms, 'g'), C: mu(C, 'g/L') }), V, t('pc.3e.cc.V.exp', { ms: m(fmt(ms)), c: m(C), ans: mu(V, 'L') }));
  };

  /* ================================================================ Acides, bases et métaux */

  GEN.pc3e_ph = (p) => {
    const k = pick(kinds(p, ['class', 'cmp', 'ions', 'dil', 'dil2']));
    if (k === 'class') {
      const v = pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 2.5, 5.5, 6.5, 8.5, 11.5]), a = v < 7 ? 'a' : v === 7 ? 'b' : 'c';
      return { q: t('pc.3e.ph.c.q', { ph: m(fmt(v)) }), kind: 'choice', ans: a, choices: mc(a, ['a', 'b', 'c'], (x) => t('pc.3e.ph.c.' + x)), exp: t('pc.3e.ph.c.exp' + a, { ph: m(fmt(v)) }) };
    }
    if (k === 'cmp') {
      let x = R(0, 14), y = R(0, 14); while (x === y) y = R(0, 14);
      const a = x < y ? 'A' : 'B';
      return { q: t('pc.3e.ph.m.q', { a: m(x), b: m(y) }), kind: 'choice', ans: a, choices: mc(a, ['A', 'B'], (v) => t('pc.3e.ph.m.' + v)), exp: t('pc.3e.ph.m.exp', { a: m(x), b: m(y), s: m(a) }) };
    }
    if (k === 'ions') {
      const ac = Math.random() < 0.5, a = ac ? 'a' : 'b', v = ac ? R(1, 6) : R(8, 13);
      return { q: t('pc.3e.ph.i.q', { ph: m(v) }), kind: 'choice', ans: a, choices: mc(a, ['a', 'b', 'c'], (x) => t('pc.3e.ph.i.' + x)), exp: t('pc.3e.ph.i.exp' + a, { ph: m(v) }) };
    }
    if (k === 'dil') {
      const ac = Math.random() < 0.7, a = ac ? 'a' : 'b', v = ac ? R(1, 5) : R(9, 13);
      return { q: t('pc.3e.ph.d.q' + (ac ? '1' : '2'), { ph: m(v) }), kind: 'choice', ans: a, choices: mc(a, ['a', 'b', 'c'], (x) => t('pc.3e.ph.d.' + x)), exp: t('pc.3e.ph.d.exp' + a, { ph: m(v) }) };
    }
    return qcm('pc.3e.ph.w', 'a', ['b', 'c'], {});
  };

  const MET = { Fe: [2, 'Fe'], Zn: [2, 'Zn'], Al: [3, 'Al'] };
  GEN.pc3e_acmet = (p) => {
    const k = pick(kinds(p, ['bal', 'chg', 'gas', 'react']));
    if (k === 'gas') {
      const f = { a: 'H<sub>2</sub>', b: 'O<sub>2</sub>', c: 'CO<sub>2</sub>', d: 'N<sub>2</sub>' };
      return { q: t('pc.3e.am.g.q'), kind: 'choice', ans: 'a', choices: mc('a', ['b', 'c', 'd'], (v) => m(f[v])), exp: t('pc.3e.am.g.exp') };
    }
    if (k === 'react') {
      const all = ['Fe', 'Zn', 'Al', 'Cu'], a = 'Cu';
      return { q: t('pc.3e.am.r.q'), kind: 'choice', ans: a, choices: mc(a, ['Fe', 'Zn', 'Al'], (v) => m(v)), exp: t('pc.3e.am.r.exp') };
    }
    const mk = pick(Object.keys(MET)), n = MET[mk][0];
    const eq = (nm, nh) => (mk === 'Al' ? '2 ' : '') + mk + ' + ' + nh + ' H<sup>+</sup> → ' + (mk === 'Al' ? '2 ' : '') + mk + '<sup>' + nm + '+</sup> + ' + (mk === 'Al' ? '3 ' : '') + 'H<sub>2</sub>';
    if (k === 'bal') {
      const ask = (mk === 'Al' ? '2 ' : '') + mk + ' + <span class="box">?</span> H<sup>+</sup> → ' + (mk === 'Al' ? '2 ' : '') + mk + '<sup>' + n + '+</sup> + ' + (mk === 'Al' ? '3 ' : '') + 'H<sub>2</sub>';
      const tot = mk === 'Al' ? 6 : 2;
      return Object.assign(num(t('pc.3e.am.b.q'), tot, t('pc.3e.am.b.exp', { eq: m(eq(n, tot)), ans: m(tot), n: m(n) })), { expr: m(ask) });
    }
    const ask = (mk === 'Al' ? '2 ' : '') + mk + ' + ' + (mk === 'Al' ? 6 : 2) + ' H<sup>+</sup> → ' + (mk === 'Al' ? '2 ' : '') + mk + '<sup><span class="box">?</span>+</sup> + ' + (mk === 'Al' ? '3 ' : '') + 'H<sub>2</sub>';
    return Object.assign(num(t('pc.3e.am.c.q'), n, t('pc.3e.am.c.exp', { eq: m(eq(n, mk === 'Al' ? 6 : 2)), tot: m(mk === 'Al' ? 6 : 2), ans: m(n) })), { expr: m(ask) });
  };

  /* ================================================================ Analyse et sécurité */

  const METALS = [['Cu', 2, 'b'], ['Fe', 2, 'v'], ['Fe', 3, 'r'], ['Zn', 2, 'w']];
  GEN.pc3e_testion = (p) => {
    const k = pick(kinds(p, ['color', 'ion', 'reag', 'cl']));
    if (k === 'color') {
      const [s, c, col] = pick(METALS);
      return { q: t('pc.3e.ti.c.q', { ion: m(ionF(s, c)) }), kind: 'choice', ans: col, choices: mc(col, ['b', 'v', 'r', 'w'], (v) => t('pc.3e.ti.col.' + v)), exp: t('pc.3e.ti.c.exp', { ion: m(ionF(s, c)), col: t('pc.3e.ti.col.' + col) }) };
    }
    if (k === 'ion') {
      const [s, c, col] = pick(METALS), key = s + c, all = METALS.map((x) => x[0] + x[1]);
      return { q: t('pc.3e.ti.i.q', { col: t('pc.3e.ti.col.' + col) }), kind: 'choice', ans: key, choices: mc(key, all, (v) => m(ionF(v.slice(0, -1), +v.slice(-1)))), exp: t('pc.3e.ti.i.exp', { ion: m(ionF(s, c)), col: t('pc.3e.ti.col.' + col) }) };
    }
    if (k === 'cl') return qcm('pc.3e.ti.cl', 'a', ['b', 'c', 'd'], {});
    const items = [['Cu', 2, 'a'], ['Cl', -1, 'b'], ['SO<sub>4</sub>', -2, 'c'], ['Fe', 3, 'a']];
    const [s, c, a] = pick(items);
    return { q: t('pc.3e.ti.r.q', { ion: m(s === 'SO<sub>4</sub>' ? 'SO<sub>4</sub><sup>2−</sup>' : ionF(s, c)) }), kind: 'choice', ans: a, choices: mc(a, ['a', 'b', 'c', 'd'], (v) => t('pc.3e.ti.r.' + v)), exp: t('pc.3e.ti.r.exp' + a, {}) };
  };

  GEN.pc3e_secu = () => qcm('pc.3e.sec.q' + R(1, 10), 'a', ['b', 'c', 'd'], {});

  /* ================================================================ textes français */
  Object.assign(root.STRINGS, {
    'pc.3e.pl.earth': 'la Terre', 'pc.3e.pl.moon': 'la Lune', 'pc.3e.pl.mars': 'Mars', 'pc.3e.pl.jup': 'Jupiter',

    'pc.3e.ohm.U.q': 'Un conducteur ohmique de résistance R = {R} est parcouru par un courant d’intensité I = {I}. Calcule la tension U à ses bornes, en volts.',
    'pc.3e.ohm.U.exp': 'U = R × I = {r} × {i} = {u} V.',
    'pc.3e.ohm.R.q': 'Aux bornes d’un conducteur ohmique, la tension est U = {U} et l’intensité du courant est I = {I}. Calcule sa résistance R, en ohms.',
    'pc.3e.ohm.R.exp': 'R = U ÷ I = {u} ÷ {i} = {r} Ω.',
    'pc.3e.ohm.I.q': 'Un conducteur ohmique de résistance R = {R} est soumis à une tension U = {U}. Calcule l’intensité I du courant qui le traverse, en ampères.',
    'pc.3e.ohm.I.exp': 'I = U ÷ R = {u} ÷ {r} = {i} A.',
    'pc.3e.ohm.Um.q': 'Un conducteur ohmique de résistance R = {R} est traversé par un courant de {I}. Calcule la tension U à ses bornes, en volts.',
    'pc.3e.ohm.Um.exp': 'On convertit : {ma} mA = {I}. Puis U = R × I = {R} × {I} = {ans}.',

    'pc.3e.pu.P.q': 'Une lampe fonctionne sous une tension de {U} et elle est traversée par un courant de {I}. Calcule sa puissance P, en watts.',
    'pc.3e.pu.P.exp': 'P = U × I = {u} × {i} = {p} W.',
    'pc.3e.pu.I.q': 'Un appareil de puissance {P} fonctionne sous une tension de {U}. Calcule l’intensité du courant qui le traverse, en ampères.',
    'pc.3e.pu.I.exp': 'P = U × I donc I = P ÷ U = {p} ÷ {u} = {i} A.',
    'pc.3e.pu.J.q': 'Une lampe de puissance {P} fonctionne pendant {t}. Calcule l’énergie électrique consommée, en joules.',
    'pc.3e.pu.J.exp': 'E = P × t = {p} × {s} = {ans} (P en watts, t en secondes).',
    'pc.3e.pu.E.q': 'Un radiateur de puissance {P} fonctionne pendant {t}. Calcule l’énergie consommée, en kilowattheures (kWh).',
    'pc.3e.pu.E.exp': 'On convertit : P = {pk}. Puis E = P × t = {p} × {h} = {E}.',
    'pc.3e.pu.C.q': 'Un radiateur de puissance {P} fonctionne pendant {t}. Le kWh coûte {pr}. Calcule le coût de cette consommation, en euros.',
    'pc.3e.pu.C.exp': 'P = {pk}, donc E = {p} × {h} = {E}. Coût = {e} × {pr} = {ans}.',

    'pc.3e.len.par.q': 'Un rayon lumineux arrive sur une lentille convergente parallèlement à son axe optique (voir la figure). Après la lentille, le rayon :',
    'pc.3e.len.par.a': 'passe par le foyer image F′', 'pc.3e.len.par.b': 'passe par le foyer objet F', 'pc.3e.len.par.c': 'reste parallèle à l’axe optique', 'pc.3e.len.par.d': 'repart en arrière, dans la direction d’où il vient',
    'pc.3e.len.par.exp': 'Un rayon parallèle à l’axe optique ressort de la lentille en passant par le foyer image F′.',
    'pc.3e.len.cen.q': 'Un rayon lumineux traverse une lentille convergente en passant par son centre optique O (voir la figure). Après la lentille, ce rayon :',
    'pc.3e.len.cen.a': 'n’est pas dévié', 'pc.3e.len.cen.b': 'est dévié et passe par F′', 'pc.3e.len.cen.c': 'devient parallèle à l’axe optique', 'pc.3e.len.cen.d': 'est arrêté par la lentille',
    'pc.3e.len.cen.exp': 'Un rayon qui passe par le centre optique O n’est pas dévié.',
    'pc.3e.len.shape.q': 'Quelle lentille est convergente ?',
    'pc.3e.len.shape.a': 'Celle qui est plus épaisse au centre qu’aux bords', 'pc.3e.len.shape.b': 'Celle qui est plus mince au centre qu’aux bords', 'pc.3e.len.shape.c': 'Celle qui a la même épaisseur partout',
    'pc.3e.len.shape.exp': 'Une lentille convergente a un centre épais et des bords minces.',
    'pc.3e.len.f.q': 'Une lentille convergente a pour distance focale f = {f}. Exprime f en mètres.',
    'pc.3e.len.f.exp': '1 m = 100 cm, donc {f} cm = {ans}.',
    'pc.3e.len.img1.q': 'Un objet est placé entre une lentille convergente et son foyer objet. L’image obtenue est :',
    'pc.3e.len.img1.a': 'virtuelle, droite et agrandie', 'pc.3e.len.img1.b': 'réelle et renversée', 'pc.3e.len.img1.c': 'virtuelle et renversée', 'pc.3e.len.img1.d': 'réelle, droite et agrandie',
    'pc.3e.len.img1.exp': 'Objet entre la lentille et le foyer : l’image est virtuelle, droite et agrandie (c’est le cas d’une loupe).',
    'pc.3e.len.img2.q': 'On obtient avec une lentille convergente une image que l’on peut recueillir sur un écran. Cette image est :',
    'pc.3e.len.img2.a': 'réelle', 'pc.3e.len.img2.b': 'virtuelle', 'pc.3e.len.img2.c': 'impossible à observer', 'pc.3e.len.img2.d': 'toujours droite',
    'pc.3e.len.img2.exp': 'Une image que l’on peut recueillir sur un écran est une image réelle.',
    'pc.3e.len.img3.q': 'On observe un insecte à travers une loupe (lentille convergente), l’insecte étant entre la loupe et son foyer. L’image que l’on voit est :',
    'pc.3e.len.img3.a': 'virtuelle', 'pc.3e.len.img3.b': 'réelle', 'pc.3e.len.img3.c': 'réduite', 'pc.3e.len.img3.d': 'renversée',
    'pc.3e.len.img3.exp': 'Avec une loupe, l’objet est entre la lentille et le foyer : l’image est virtuelle (et agrandie).',

    'pc.3e.pds.P.q': 'Sur {pl}, l’intensité de la pesanteur est g = {g}. Calcule le poids, en newtons, d’un objet de masse {M} placé sur {pl}.',
    'pc.3e.pds.P.exp': 'P = m × g = {ms} × {gg} = {P}.',
    'pc.3e.pds.m.q': 'Sur {pl}, l’intensité de la pesanteur est g = {g}. Un objet y a un poids de {P}. Calcule sa masse, en kilogrammes.',
    'pc.3e.pds.m.exp': 'P = m × g donc m = P ÷ g = {P} ÷ {gg} = {M}.',
    'pc.3e.pds.moon.q': 'Un objet pèse {P} sur la Terre (g = 10 N/kg). Sur la Lune, g = 1,6 N/kg. Calcule son poids sur la Lune, en newtons.',
    'pc.3e.pds.moon.exp': 'Sa masse est {P} ÷ 10 = {mm}. Sur la Lune : P = m × g = {ms} × 1,6 = {ans}.',
    'pc.3e.pds.q1.q': 'Deux astres s’éloignent l’un de l’autre. La force gravitationnelle qu’ils exercent l’un sur l’autre :',
    'pc.3e.pds.q1.a': 'diminue', 'pc.3e.pds.q1.b': 'augmente', 'pc.3e.pds.q1.c': 'ne change pas', 'pc.3e.pds.q1.d': 'devient nulle immédiatement',
    'pc.3e.pds.q1.exp': 'La force gravitationnelle est d’autant plus petite que la distance est grande.',
    'pc.3e.pds.q2.q': 'Un astronaute se rend de la Terre sur la Lune. Quelle grandeur ne change pas ?',
    'pc.3e.pds.q2.a': 'sa masse', 'pc.3e.pds.q2.b': 'son poids', 'pc.3e.pds.q2.c': 'l’intensité de la pesanteur', 'pc.3e.pds.q2.d': 'la force exercée sur lui par l’astre',
    'pc.3e.pds.q2.exp': 'La masse est une quantité de matière : elle ne dépend pas du lieu. Le poids, lui, dépend de g.',
    'pc.3e.pds.q3.q': 'La force exercée par la Terre sur la Lune et la force exercée par la Lune sur la Terre ont :',
    'pc.3e.pds.q3.a': 'la même valeur', 'pc.3e.pds.q3.b': 'une valeur plus grande pour la Terre', 'pc.3e.pds.q3.c': 'une valeur plus grande pour la Lune', 'pc.3e.pds.q3.d': 'une valeur nulle',
    'pc.3e.pds.q3.exp': 'L’attraction est mutuelle : les deux forces ont la même valeur.',
    'pc.3e.pds.q4.q': 'Le poids d’un objet est :',
    'pc.3e.pds.q4.a': 'la force d’attraction exercée par l’astre sur l’objet', 'pc.3e.pds.q4.b': 'la quantité de matière de l’objet', 'pc.3e.pds.q4.c': 'une grandeur qui se mesure en kilogrammes', 'pc.3e.pds.q4.d': 'toujours le même sur tous les astres',
    'pc.3e.pds.q4.exp': 'Le poids est une force (en newtons) : l’attraction de l’astre sur l’objet.',

    'pc.3e.ine.q1.q': 'Un objet se déplace en ligne droite à vitesse constante. Que peut-on dire des forces qui s’exercent sur lui ?',
    'pc.3e.ine.q1.a': 'Elles se compensent.', 'pc.3e.ine.q1.b': 'Elles ne se compensent pas.', 'pc.3e.ine.q1.c': 'Il n’y a forcément aucune force, même pas son poids.',
    'pc.3e.ine.q1.exp': 'Principe d’inertie : un mouvement rectiligne uniforme correspond à des forces qui se compensent (ou à aucune force).',
    'pc.3e.ine.q2.q': 'Un objet posé immobile sur une table est soumis à son poids et à la réaction de la table. Ces forces :',
    'pc.3e.ine.q2.a': 'se compensent', 'pc.3e.ine.q2.b': 'ne se compensent pas', 'pc.3e.ine.q2.c': 'n’existent pas',
    'pc.3e.ine.q2.exp': 'L’objet reste au repos : les forces qui s’exercent sur lui se compensent.',
    'pc.3e.ine.q3.q': 'Une voiture roule en ligne droite et sa vitesse augmente. Que peut-on dire des forces qui s’exercent sur elle ?',
    'pc.3e.ine.q3.a': 'Elles ne se compensent pas.', 'pc.3e.ine.q3.b': 'Elles se compensent.', 'pc.3e.ine.q3.c': 'Aucune force ne s’exerce sur elle.',
    'pc.3e.ine.q3.exp': 'La vitesse change : d’après le principe d’inertie, les forces ne se compensent pas.',
    'pc.3e.ine.q4.q': 'Un satellite tourne autour de la Terre sur une trajectoire circulaire. Sa direction change sans cesse. Les forces qui s’exercent sur lui :',
    'pc.3e.ine.q4.a': 'ne se compensent pas', 'pc.3e.ine.q4.b': 'se compensent', 'pc.3e.ine.q4.c': 'sont nulles',
    'pc.3e.ine.q4.exp': 'Le mouvement n’est pas rectiligne : les forces ne se compensent pas (la gravitation l’attire vers la Terre).',
    'pc.3e.ine.q5.q': 'Un passager est assis dans un train qui roule. Il est immobile par rapport :',
    'pc.3e.ine.q5.a': 'au train', 'pc.3e.ine.q5.b': 'au quai', 'pc.3e.ine.q5.c': 'à aucun référentiel',
    'pc.3e.ine.q5.exp': 'Le mouvement dépend du référentiel : le passager est immobile par rapport au train mais se déplace par rapport au quai.',
    'pc.3e.ine.q6.q': 'Dans une voiture qui freine brusquement, les passagers sont projetés vers l’avant. C’est dû :',
    'pc.3e.ine.q6.a': 'à l’inertie : sans force, ils tendent à garder leur vitesse', 'pc.3e.ine.q6.b': 'à une force qui les pousse vers l’avant', 'pc.3e.ine.q6.c': 'à l’absence de poids',
    'pc.3e.ine.q6.exp': 'Les passagers conservent leur mouvement tant qu’aucune force ne le change : c’est l’inertie.',
    'pc.3e.ine.q7.q': 'Un cycliste roule à vitesse constante sur une route droite. Il est soumis à des forces :',
    'pc.3e.ine.q7.a': 'qui se compensent', 'pc.3e.ine.q7.b': 'qui ne se compensent pas', 'pc.3e.ine.q7.c': 'toutes nulles',
    'pc.3e.ine.q7.exp': 'Mouvement rectiligne uniforme : d’après le principe d’inertie, les forces se compensent.',

    'pc.3e.ec.Ec.q': 'Calcule l’énergie cinétique d’un objet de masse {M} qui se déplace à la vitesse {V}. Réponds en joules.',
    'pc.3e.ec.Ec.exp': 'Ec = ½ × m × v² = ½ × {ms} × {v}² = {ans}.',
    'pc.3e.ec.v.q': 'Un objet de masse {M} possède une énergie cinétique de {E}. Calcule sa vitesse, en m/s.',
    'pc.3e.ec.v.exp': 'Ec = ½ × m × v² donc v² = 2 × Ec ÷ m = 2 × {e} ÷ {ms} = {v2}, d’où v = {v}.',
    'pc.3e.ec.kmh.q': 'Une voiture de masse {M} roule à {V}. Calcule son énergie cinétique, en joules (pense à convertir la vitesse en m/s).',
    'pc.3e.ec.kmh.exp': '{kmh} km/h ÷ 3,6 = {v}. Ec = ½ × {ms} × {vv}² = {ans}.',
    'pc.3e.ec.r.q': 'La vitesse d’un véhicule est multipliée par {k}. Par combien est multipliée son énergie cinétique ?',
    'pc.3e.ec.r.exp': 'Ec est proportionnelle à v² : (×{k})² = ×{k2}.',

    'pc.3e.ep.E.q': 'Calcule l’énergie de position d’un objet de masse {M} situé à {H} de hauteur. On prend g = 10 N/kg. Réponds en joules.',
    'pc.3e.ep.E.exp': 'Ep = m × g × h = {ms} × 10 × {h} = {e} J.',
    'pc.3e.ep.h.q': 'Un objet de masse {M} possède une énergie de position de {E}. On prend g = 10 N/kg. À quelle hauteur, en mètres, se trouve-t-il ?',
    'pc.3e.ep.h.exp': 'Ep = m × g × h donc h = Ep ÷ (m × g) = {e} ÷ ({ms} × 10) = {h} m.',
    'pc.3e.ep.m.q': 'Un objet situé à {H} de hauteur possède une énergie de position de {E}. On prend g = 10 N/kg. Quelle est sa masse, en kilogrammes ?',
    'pc.3e.ep.m.exp': 'Ep = m × g × h donc m = Ep ÷ (g × h) = {e} ÷ (10 × {h}) = {ms} kg.',
    'pc.3e.ep.v.q': 'Un objet tombe sans frottement d’une hauteur de {H}. On prend g = 10 N/kg. Quelle est sa vitesse, en m/s, quand il arrive au sol ?',
    'pc.3e.ep.v.exp': 'Toute l’énergie de position se convertit en énergie cinétique : ½ × m × v² = m × g × h, donc v² = 2 × 10 × {h} = {v2} et v = {v}.',

    'pc.3e.ion.n.q': 'Un cristal ionique est neutre. Combien d’ions {a} faut-il pour neutraliser {n} ions {c} ?',
    'pc.3e.ion.n.exp': 'La charge des {n} cations est +{tot}. Chaque ion {a} a une charge de −{b}, donc il en faut {tot} ÷ {b} = {ans}.',
    'pc.3e.ion.t.q': 'L’ion {ion} est :', 'pc.3e.ion.t.a': 'un cation', 'pc.3e.ion.t.b': 'un anion', 'pc.3e.ion.t.c': 'un atome neutre',
    'pc.3e.ion.t.exp1': 'L’ion {ion} porte une charge positive : c’est un cation.', 'pc.3e.ion.t.exp2': 'L’ion {ion} porte une charge négative : c’est un anion.',
    'pc.3e.ion.z.q': 'L’atome {s} possède {z} électrons. Combien d’électrons possède l’ion {ion} ?',
    'pc.3e.ion.z.exp1': 'L’ion est positif : l’atome a perdu {c} électron(s). {z} − {c} = {ans}.', 'pc.3e.ion.z.exp2': 'L’ion est négatif : l’atome a gagné {c} électron(s). {z} + {c} = {ans}.',
    'pc.3e.ion.e.q1': 'L’atome {s} devient l’ion {ion}. Combien d’électrons a-t-il perdus ?', 'pc.3e.ion.e.q2': 'L’atome {s} devient l’ion {ion}. Combien d’électrons a-t-il gagnés ?',
    'pc.3e.ion.e.exp1': 'La charge de {ion} est +{ans} : l’atome a perdu {ans} électron(s).', 'pc.3e.ion.e.exp2': 'La charge de {ion} est −{ans} : l’atome a gagné {ans} électron(s).',

    'pc.3e.sol.dir.q': 'Dans une solution soumise à un champ électrique entre deux électrodes, vers quelle borne du générateur se déplace l’ion {ion} ?',
    'pc.3e.sol.dir.a': 'vers la borne négative', 'pc.3e.sol.dir.b': 'vers la borne positive', 'pc.3e.sol.dir.c': 'il ne se déplace pas',
    'pc.3e.sol.dir.exp1': 'L’ion {ion} est un cation (+) : il se déplace vers la borne négative.', 'pc.3e.sol.dir.exp2': 'L’ion {ion} est un anion (−) : il se déplace vers la borne positive.',
    'pc.3e.sol.f1.q': 'Pourquoi l’eau salée conduit-elle le courant électrique alors que l’eau pure le conduit très peu ?',
    'pc.3e.sol.f1.a': 'Parce qu’elle contient des ions mobiles', 'pc.3e.sol.f1.b': 'Parce qu’elle contient des électrons libres', 'pc.3e.sol.f1.c': 'Parce qu’elle contient des atomes neutres', 'pc.3e.sol.f1.d': 'Parce qu’elle est plus chaude',
    'pc.3e.sol.f1.exp': 'Les ions dissous sont des porteurs de charge mobiles : la solution ionique conduit le courant.',
    'pc.3e.sol.f2.q': 'On dissout du sel de cuisine dans l’eau. La solution obtenue est :',
    'pc.3e.sol.f2.a': 'électriquement neutre', 'pc.3e.sol.f2.b': 'chargée positivement', 'pc.3e.sol.f2.c': 'chargée négativement', 'pc.3e.sol.f2.d': 'sans aucun ion',
    'pc.3e.sol.f2.exp': 'Il y a autant de charges positives (Na⁺) que de charges négatives (Cl⁻) : la solution est neutre.',
    'pc.3e.sol.f3.q': 'Quand on dissout un cristal de sel dans l’eau, il se passe que :',
    'pc.3e.sol.f3.a': 'le cristal se dissocie en ions Na⁺ et Cl⁻ dispersés dans l’eau', 'pc.3e.sol.f3.b': 'le cristal disparaît sans laisser de trace', 'pc.3e.sol.f3.c': 'les ions Na⁺ et Cl⁻ se transforment en atomes', 'pc.3e.sol.f3.d': 'l’eau se transforme en ions',
    'pc.3e.sol.f3.exp': 'La dissolution dissocie le cristal : les ions se séparent et se dispersent dans l’eau.',
    'pc.3e.sol.f4.q': 'Dans une solution ionique, le courant électrique est assuré par le déplacement :',
    'pc.3e.sol.f4.a': 'des ions positifs et négatifs', 'pc.3e.sol.f4.b': 'uniquement des électrons', 'pc.3e.sol.f4.c': 'uniquement des atomes', 'pc.3e.sol.f4.d': 'des molécules d’eau seulement',
    'pc.3e.sol.f4.exp': 'Les cations et les anions, mobiles, sont les porteurs de charge de la solution.',
    'pc.3e.sol.f5.q': 'Une solution de sucre dans l’eau ne conduit pas le courant. Pourquoi ?',
    'pc.3e.sol.f5.a': 'Elle ne contient pas d’ions', 'pc.3e.sol.f5.b': 'Elle contient trop d’ions', 'pc.3e.sol.f5.c': 'Le sucre est un métal', 'pc.3e.sol.f5.d': 'L’eau empêche toujours le courant de passer',
    'pc.3e.sol.f5.exp': 'Le sucre se dissout en molécules neutres, sans ions : la solution n’est pas ionique.',

    'pc.3e.cc.conv': 'On convertit : {ml} mL = {l}. ',
    'pc.3e.cc.C.q': 'On dissout {M} de soluté dans de l’eau pour obtenir {V} de solution. Calcule la concentration C, en g/L.',
    'pc.3e.cc.C.exp': 'C = m ÷ V = {ms} ÷ {v} = {ans}.',
    'pc.3e.cc.m.q': 'Une solution de concentration {C} a un volume de {V}. Calcule la masse de soluté dissous, en grammes.',
    'pc.3e.cc.m.exp': 'm = C × V = {c} × {v} = {ans}.',
    'pc.3e.cc.V.q': 'On dispose de {M} de soluté et on veut préparer une solution de concentration {C}. Quel volume de solution obtient-on, en litres ?',
    'pc.3e.cc.V.exp': 'C = m ÷ V donc V = m ÷ C = {ms} ÷ {c} = {ans}.',
    'pc.3e.cc.V2.q': 'On dispose de {M} de soluté et on veut préparer une solution de concentration {C}. Quel volume de solution obtient-on, en millilitres ?',
    'pc.3e.cc.V2.exp': 'V = m ÷ C = {ms} ÷ {c} = {v}, soit {ans}.',

    'pc.3e.ph.c.q': 'Une solution a un pH égal à {ph}. Elle est :', 'pc.3e.ph.c.a': 'acide', 'pc.3e.ph.c.b': 'neutre', 'pc.3e.ph.c.c': 'basique',
    'pc.3e.ph.c.expa': 'pH = {ph} est inférieur à 7 : la solution est acide.', 'pc.3e.ph.c.expb': 'pH = {ph} : la solution est neutre.', 'pc.3e.ph.c.expc': 'pH = {ph} est supérieur à 7 : la solution est basique.',
    'pc.3e.ph.m.q': 'La solution A a un pH de {a} et la solution B a un pH de {b}. Quelle solution est la plus acide ?', 'pc.3e.ph.m.A': 'la solution A', 'pc.3e.ph.m.B': 'la solution B',
    'pc.3e.ph.m.exp': 'Plus le pH est petit, plus la solution est acide. Ici : {s}.',
    'pc.3e.ph.i.q': 'Une solution a un pH de {ph}. Elle contient un excès d’ions :', 'pc.3e.ph.i.a': 'H⁺', 'pc.3e.ph.i.b': 'HO⁻', 'pc.3e.ph.i.c': 'Cl⁻',
    'pc.3e.ph.i.expa': 'pH = {ph} &lt; 7 : solution acide, avec un excès d’ions H⁺.', 'pc.3e.ph.i.expb': 'pH = {ph} &gt; 7 : solution basique, avec un excès d’ions HO⁻.',
    'pc.3e.ph.d.q1': 'On dilue avec de l’eau une solution acide de pH = {ph}. Son pH :', 'pc.3e.ph.d.q2': 'On dilue avec de l’eau une solution basique de pH = {ph}. Son pH :',
    'pc.3e.ph.d.a': 'augmente, en se rapprochant de 7', 'pc.3e.ph.d.b': 'diminue, en se rapprochant de 7', 'pc.3e.ph.d.c': 'ne change pas',
    'pc.3e.ph.d.expa': 'En diluant un acide, le pH augmente et se rapproche de 7.', 'pc.3e.ph.d.expb': 'En diluant une base, le pH diminue et se rapproche de 7.',
    'pc.3e.ph.w.q': 'Pour diluer un acide concentré en toute sécurité, on verse :',
    'pc.3e.ph.w.a': 'l’acide dans l’eau, doucement', 'pc.3e.ph.w.b': 'l’eau dans l’acide', 'pc.3e.ph.w.c': 'les deux en même temps, très vite',
    'pc.3e.ph.w.exp': 'Règle de sécurité : on verse toujours l’acide dans l’eau, jamais l’inverse.',

    'pc.3e.am.g.q': 'Un métal attaqué par un acide dégage un gaz qui produit une petite détonation à l’approche d’une flamme. Quel est ce gaz ?',
    'pc.3e.am.g.exp': 'Le gaz qui détone à la flamme est le dihydrogène H₂.',
    'pc.3e.am.r.q': 'Parmi ces métaux, lequel n’est pas attaqué par l’acide chlorhydrique dilué ?',
    'pc.3e.am.r.exp': 'Le fer, le zinc et l’aluminium sont attaqués par l’acide chlorhydrique. Le cuivre ne réagit pas.',
    'pc.3e.am.b.q': 'Quel nombre doit remplacer le point d’interrogation pour que l’équation soit équilibrée en atomes et en charges ?',
    'pc.3e.am.b.exp': 'Les charges se conservent : à droite, la charge est +{ans}, donc il faut {ans} ions H⁺ à gauche. Équation : {eq}.',
    'pc.3e.am.c.q': 'Quelle est la charge de l’ion métallique formé ? (Donne la valeur de la charge, sans le signe.)',
    'pc.3e.am.c.exp': 'À gauche, la charge totale est +{tot}. À droite, elle doit être la même : l’ion a donc la charge +{ans}. Équation : {eq}.',

    'pc.3e.ti.col.b': 'bleu', 'pc.3e.ti.col.v': 'vert', 'pc.3e.ti.col.r': 'rouille', 'pc.3e.ti.col.w': 'blanc',
    'pc.3e.ti.c.q': 'On ajoute de la soude à une solution contenant l’ion {ion}. Quelle est la couleur du précipité obtenu ?',
    'pc.3e.ti.c.exp': 'Avec la soude, l’ion {ion} donne un précipité {col}.',
    'pc.3e.ti.i.q': 'On ajoute de la soude à une solution : il se forme un précipité {col}. Quel ion métallique contenait-elle ?',
    'pc.3e.ti.i.exp': 'Un précipité {col} avec la soude caractérise l’ion {ion}.',
    'pc.3e.ti.cl.q': 'On ajoute du nitrate d’argent à une solution : il se forme un précipité blanc qui noircit à la lumière. Quel ion contenait-elle ?',
    'pc.3e.ti.cl.a': 'l’ion chlorure Cl⁻', 'pc.3e.ti.cl.b': 'l’ion cuivre Cu²⁺', 'pc.3e.ti.cl.c': 'l’ion sulfate SO₄²⁻', 'pc.3e.ti.cl.d': 'l’ion fer Fe³⁺',
    'pc.3e.ti.cl.exp': 'Le nitrate d’argent donne avec l’ion chlorure un précipité blanc qui noircit à la lumière.',
    'pc.3e.ti.r.q': 'Quel réactif utilise-t-on pour reconnaître l’ion {ion} ?',
    'pc.3e.ti.r.a': 'la soude', 'pc.3e.ti.r.b': 'le nitrate d’argent', 'pc.3e.ti.r.c': 'le chlorure de baryum', 'pc.3e.ti.r.d': 'l’eau distillée',
    'pc.3e.ti.r.expa': 'Les ions métalliques (Cu²⁺, Fe²⁺, Fe³⁺, Zn²⁺) se reconnaissent avec la soude.', 'pc.3e.ti.r.expb': 'L’ion chlorure se reconnaît avec le nitrate d’argent.', 'pc.3e.ti.r.expc': 'L’ion sulfate se reconnaît avec le chlorure de baryum.',

    'pc.3e.sec.q1.q': 'Un produit porte le pictogramme représentant une flamme. Il est :', 'pc.3e.sec.q1.a': 'inflammable', 'pc.3e.sec.q1.b': 'corrosif', 'pc.3e.sec.q1.c': 'dangereux pour l’environnement', 'pc.3e.sec.q1.d': 'sans danger', 'pc.3e.sec.q1.exp': 'La flamme signale un produit inflammable : pas de flamme à proximité.',
    'pc.3e.sec.q2.q': 'Un produit porte le pictogramme représentant une tête de mort. Il est :', 'pc.3e.sec.q2.a': 'toxique', 'pc.3e.sec.q2.b': 'inflammable', 'pc.3e.sec.q2.c': 'comburant', 'pc.3e.sec.q2.d': 'sans danger', 'pc.3e.sec.q2.exp': 'La tête de mort signale un produit toxique, dangereux par ingestion, inhalation ou contact.',
    'pc.3e.sec.q3.q': 'Un déboucheur porte le pictogramme représentant une main et un métal rongés par un liquide. Il est :', 'pc.3e.sec.q3.a': 'corrosif', 'pc.3e.sec.q3.b': 'inflammable', 'pc.3e.sec.q3.c': 'explosif', 'pc.3e.sec.q3.d': 'inoffensif pour la peau', 'pc.3e.sec.q3.exp': 'Ce pictogramme signale un produit corrosif : il attaque la peau, les yeux et les métaux.',
    'pc.3e.sec.q4.q': 'On mélange de l’eau de javel et un détartrant (acide). Que se passe-t-il ?', 'pc.3e.sec.q4.a': 'Il se dégage du dichlore, un gaz toxique', 'pc.3e.sec.q4.b': 'Le mélange devient plus efficace sans danger', 'pc.3e.sec.q4.c': 'Il ne se passe rien', 'pc.3e.sec.q4.d': 'Il se dégage de l’oxygène pur', 'pc.3e.sec.q4.exp': 'Javel et acide libèrent du dichlore, gaz toxique : on ne mélange jamais ces produits.',
    'pc.3e.sec.q5.q': 'Un produit corrosif est projeté sur la peau. Le bon réflexe est de :', 'pc.3e.sec.q5.a': 'rincer abondamment à l’eau', 'pc.3e.sec.q5.b': 'frotter avec un chiffon sec', 'pc.3e.sec.q5.c': 'ne rien faire', 'pc.3e.sec.q5.d': 'appliquer un autre produit chimique', 'pc.3e.sec.q5.exp': 'On rince abondamment à l’eau, puis on demande de l’aide.',
    'pc.3e.sec.q6.q': 'Quels équipements de protection porte-t-on pour manipuler un acide au laboratoire ?', 'pc.3e.sec.q6.a': 'lunettes, gants et blouse', 'pc.3e.sec.q6.b': 'aucun équipement', 'pc.3e.sec.q6.c': 'seulement des chaussures ouvertes', 'pc.3e.sec.q6.d': 'seulement un chapeau', 'pc.3e.sec.q6.exp': 'Lunettes, gants et blouse protègent contre les projections d’un produit corrosif.',
    'pc.3e.sec.q7.q': 'Un produit porte le pictogramme représentant un arbre mort et un poisson. Il est :', 'pc.3e.sec.q7.a': 'dangereux pour l’environnement', 'pc.3e.sec.q7.b': 'inflammable', 'pc.3e.sec.q7.c': 'sans effet sur la nature', 'pc.3e.sec.q7.d': 'comburant', 'pc.3e.sec.q7.exp': 'Ce pictogramme signale un produit dangereux pour l’environnement : on ne le jette pas dans la nature.',
    'pc.3e.sec.q8.q': 'Où faut-il conserver un produit ménager dangereux ?', 'pc.3e.sec.q8.a': 'dans son emballage d’origine, hors de portée des enfants', 'pc.3e.sec.q8.b': 'dans une bouteille d’eau', 'pc.3e.sec.q8.c': 'sur la table de la cuisine', 'pc.3e.sec.q8.d': 'dans un verre', 'pc.3e.sec.q8.exp': 'On garde le produit dans son emballage d’origine, avec son étiquette, hors de portée des enfants.',
    'pc.3e.sec.q9.q': 'Que faire avant d’utiliser un produit chimique inconnu ?', 'pc.3e.sec.q9.a': 'lire l’étiquette et ses pictogrammes', 'pc.3e.sec.q9.b': 'le sentir de près', 'pc.3e.sec.q9.c': 'le goûter', 'pc.3e.sec.q9.d': 'le mélanger avec un autre produit', 'pc.3e.sec.q9.exp': 'On lit toujours l’étiquette : elle indique les dangers et les précautions à prendre.',
    'pc.3e.sec.q10.q': 'Un point d’exclamation dans un losange à bordure rouge sur une étiquette signifie que le produit est :', 'pc.3e.sec.q10.a': 'nocif ou irritant', 'pc.3e.sec.q10.b': 'inoffensif', 'pc.3e.sec.q10.c': 'explosif', 'pc.3e.sec.q10.d': 'bon pour la santé', 'pc.3e.sec.q10.exp': 'Le point d’exclamation signale un produit nocif ou irritant : on évite tout contact.',
  });

  /* ================================================================ textes arabes */
  Object.assign(root.STRINGS_AR, {
    'pc.3e.pl.earth': 'الأرض', 'pc.3e.pl.moon': 'القمر', 'pc.3e.pl.mars': 'المريخ', 'pc.3e.pl.jup': 'المشتري',

    'pc.3e.ohm.U.q': 'موصل أومي مقاومته R = {R} يعبره تيار شدته I = {I}. احسب التوتر U بين طرفيه بالفولط.',
    'pc.3e.ohm.U.exp': 'U = R × I = {r} × {i} = {u} V.',
    'pc.3e.ohm.R.q': 'بين طرفي موصل أومي، التوتر هو U = {U} وشدة التيار I = {I}. احسب مقاومته R بالأوم.',
    'pc.3e.ohm.R.exp': 'R = U ÷ I = {u} ÷ {i} = {r} Ω.',
    'pc.3e.ohm.I.q': 'موصل أومي مقاومته R = {R} يخضع لتوتر U = {U}. احسب شدة التيار I الذي يعبره بالأمبير.',
    'pc.3e.ohm.I.exp': 'I = U ÷ R = {u} ÷ {r} = {i} A.',
    'pc.3e.ohm.Um.q': 'موصل أومي مقاومته R = {R} يعبره تيار شدته {I}. احسب التوتر U بين طرفيه بالفولط.',
    'pc.3e.ohm.Um.exp': 'نحوّل: {ma} mA = {I}. ثم U = R × I = {R} × {I} = {ans}.',

    'pc.3e.pu.P.q': 'مصباح يشتغل تحت توتر {U} ويعبره تيار شدته {I}. احسب قدرته P بالواط.',
    'pc.3e.pu.P.exp': 'P = U × I = {u} × {i} = {p} W.',
    'pc.3e.pu.I.q': 'جهاز قدرته {P} يشتغل تحت توتر {U}. احسب شدة التيار الذي يعبره بالأمبير.',
    'pc.3e.pu.I.exp': 'P = U × I إذن I = P ÷ U = {p} ÷ {u} = {i} A.',
    'pc.3e.pu.J.q': 'مصباح قدرته {P} يشتغل مدة {t}. احسب الطاقة الكهربائية المستهلكة بالجول.',
    'pc.3e.pu.J.exp': 'E = P × t = {p} × {s} = {ans} (P بالواط وt بالثانية).',
    'pc.3e.pu.E.q': 'مدفأة قدرتها {P} تشتغل مدة {t}. احسب الطاقة المستهلكة بالكيلوواط ساعي (kWh).',
    'pc.3e.pu.E.exp': 'نحوّل: P = {pk}. ثم E = P × t = {p} × {h} = {E}.',
    'pc.3e.pu.C.q': 'مدفأة قدرتها {P} تشتغل مدة {t}. ثمن الكيلوواط ساعي هو {pr}. احسب تكلفة هذا الاستهلاك بالأورو.',
    'pc.3e.pu.C.exp': 'P = {pk}، إذن E = {p} × {h} = {E}. التكلفة = {e} × {pr} = {ans}.',

    'pc.3e.len.par.q': 'يصل شعاع ضوئي إلى عدسة لامّة موازيًا لمحورها البصري (انظر الشكل). بعد العدسة، الشعاع:',
    'pc.3e.len.par.a': 'يمرّ بالبؤرة الصورة F′', 'pc.3e.len.par.b': 'يمرّ بالبؤرة الشيء F', 'pc.3e.len.par.c': 'يبقى موازيًا للمحور البصري', 'pc.3e.len.par.d': 'يرجع إلى الخلف في اتجاه مصدره',
    'pc.3e.len.par.exp': 'الشعاع الموازي للمحور البصري يخرج من العدسة مارًّا بالبؤرة الصورة F′.',
    'pc.3e.len.cen.q': 'يعبر شعاع ضوئي عدسة لامّة مارًّا بمركزها البصري O (انظر الشكل). بعد العدسة، هذا الشعاع:',
    'pc.3e.len.cen.a': 'لا ينحرف', 'pc.3e.len.cen.b': 'ينحرف ويمرّ بالنقطة F′', 'pc.3e.len.cen.c': 'يصبح موازيًا للمحور البصري', 'pc.3e.len.cen.d': 'تحجبه العدسة',
    'pc.3e.len.cen.exp': 'الشعاع الذي يمرّ بالمركز البصري O لا ينحرف.',
    'pc.3e.len.shape.q': 'أيّ عدسة هي لامّة؟',
    'pc.3e.len.shape.a': 'التي تكون أسمك في الوسط منها عند الحواف', 'pc.3e.len.shape.b': 'التي تكون أرقّ في الوسط منها عند الحواف', 'pc.3e.len.shape.c': 'التي لها السمك نفسه في كل مكان',
    'pc.3e.len.shape.exp': 'العدسة اللامّة وسطها سميك وحوافها رقيقة.',
    'pc.3e.len.f.q': 'البعد البؤري لعدسة لامّة هو f = {f}. عبّر عن f بالمتر.',
    'pc.3e.len.f.exp': '1 m = 100 cm، إذن {f} cm = {ans}.',
    'pc.3e.len.img1.q': 'وُضع جسم بين عدسة لامّة وبؤرتها الشيء. الصورة المحصل عليها:',
    'pc.3e.len.img1.a': 'وهمية، مباشرة ومكبّرة', 'pc.3e.len.img1.b': 'حقيقية ومقلوبة', 'pc.3e.len.img1.c': 'وهمية ومقلوبة', 'pc.3e.len.img1.d': 'حقيقية، مباشرة ومكبّرة',
    'pc.3e.len.img1.exp': 'جسم بين العدسة والبؤرة: الصورة وهمية، مباشرة ومكبّرة (حالة المكبّرة).',
    'pc.3e.len.img2.q': 'نحصل بواسطة عدسة لامّة على صورة يمكن استقبالها على شاشة. هذه الصورة:',
    'pc.3e.len.img2.a': 'حقيقية', 'pc.3e.len.img2.b': 'وهمية', 'pc.3e.len.img2.c': 'يستحيل رؤيتها', 'pc.3e.len.img2.d': 'مباشرة دائمًا',
    'pc.3e.len.img2.exp': 'الصورة التي يمكن استقبالها على شاشة صورة حقيقية.',
    'pc.3e.len.img3.q': 'نلاحظ حشرة بواسطة مكبّرة (عدسة لامّة) والحشرة بين المكبّرة وبؤرتها. الصورة التي نراها:',
    'pc.3e.len.img3.a': 'وهمية', 'pc.3e.len.img3.b': 'حقيقية', 'pc.3e.len.img3.c': 'مصغّرة', 'pc.3e.len.img3.d': 'مقلوبة',
    'pc.3e.len.img3.exp': 'مع المكبّرة، الجسم بين العدسة والبؤرة: الصورة وهمية (ومكبّرة).',

    'pc.3e.pds.P.q': 'على {pl}، شدة الثقالة هي g = {g}. احسب وزن جسم كتلته {M} موضوع على {pl}، بالنيوتن.',
    'pc.3e.pds.P.exp': 'P = m × g = {ms} × {gg} = {P}.',
    'pc.3e.pds.m.q': 'على {pl}، شدة الثقالة هي g = {g}. وزن جسم هناك {P}. احسب كتلته بالكيلوغرام.',
    'pc.3e.pds.m.exp': 'P = m × g إذن m = P ÷ g = {P} ÷ {gg} = {M}.',
    'pc.3e.pds.moon.q': 'وزن جسم على الأرض هو {P} (g = 10 N/kg). على القمر، g = 1,6 N/kg. احسب وزنه على القمر بالنيوتن.',
    'pc.3e.pds.moon.exp': 'كتلته {P} ÷ 10 = {mm}. على القمر: P = m × g = {ms} × 1,6 = {ans}.',
    'pc.3e.pds.q1.q': 'يبتعد نجمان أحدهما عن الآخر. قوة التجاذب الكتلي بينهما:',
    'pc.3e.pds.q1.a': 'تنقص', 'pc.3e.pds.q1.b': 'تزداد', 'pc.3e.pds.q1.c': 'لا تتغير', 'pc.3e.pds.q1.d': 'تنعدم فورًا',
    'pc.3e.pds.q1.exp': 'قوة التجاذب الكتلي أصغر كلما كانت المسافة أكبر.',
    'pc.3e.pds.q2.q': 'ينتقل رائد فضاء من الأرض إلى القمر. ما الكمية التي لا تتغير؟',
    'pc.3e.pds.q2.a': 'كتلته', 'pc.3e.pds.q2.b': 'وزنه', 'pc.3e.pds.q2.c': 'شدة الثقالة', 'pc.3e.pds.q2.d': 'القوة التي يطبقها الكوكب عليه',
    'pc.3e.pds.q2.exp': 'الكتلة كمية المادة: لا تتعلق بالمكان. أما الوزن فيتعلق بـ g.',
    'pc.3e.pds.q3.q': 'القوة التي تطبقها الأرض على القمر والقوة التي يطبقها القمر على الأرض لهما:',
    'pc.3e.pds.q3.a': 'القيمة نفسها', 'pc.3e.pds.q3.b': 'قيمة أكبر بالنسبة للأرض', 'pc.3e.pds.q3.c': 'قيمة أكبر بالنسبة للقمر', 'pc.3e.pds.q3.d': 'قيمة منعدمة',
    'pc.3e.pds.q3.exp': 'التجاذب متبادل: للقوتين القيمة نفسها.',
    'pc.3e.pds.q4.q': 'وزن جسم هو:',
    'pc.3e.pds.q4.a': 'قوة التجاذب التي يطبقها الكوكب على الجسم', 'pc.3e.pds.q4.b': 'كمية المادة في الجسم', 'pc.3e.pds.q4.c': 'مقدار يُقاس بالكيلوغرام', 'pc.3e.pds.q4.d': 'هو نفسه دائمًا على كل الكواكب',
    'pc.3e.pds.q4.exp': 'الوزن قوة (بالنيوتن): تجاذب الكوكب للجسم.',

    'pc.3e.ine.q1.q': 'يتحرك جسم على خط مستقيم بسرعة ثابتة. ماذا نقول عن القوى المطبقة عليه؟',
    'pc.3e.ine.q1.a': 'تتعادل.', 'pc.3e.ine.q1.b': 'لا تتعادل.', 'pc.3e.ine.q1.c': 'لا توجد أيّ قوة حتمًا، حتى وزنه.',
    'pc.3e.ine.q1.exp': 'مبدأ العطالة: الحركة المستقيمة المنتظمة توافق قوى متعادلة (أو انعدام القوى).',
    'pc.3e.ine.q2.q': 'جسم ساكن موضوع على طاولة يخضع لوزنه ولفعل الطاولة. هاتان القوتان:',
    'pc.3e.ine.q2.a': 'تتعادلان', 'pc.3e.ine.q2.b': 'لا تتعادلان', 'pc.3e.ine.q2.c': 'غير موجودتين',
    'pc.3e.ine.q2.exp': 'يبقى الجسم ساكنًا: القوى المطبقة عليه تتعادل.',
    'pc.3e.ine.q3.q': 'سيارة تسير على خط مستقيم وسرعتها تزداد. ماذا نقول عن القوى المطبقة عليها؟',
    'pc.3e.ine.q3.a': 'لا تتعادل.', 'pc.3e.ine.q3.b': 'تتعادل.', 'pc.3e.ine.q3.c': 'لا تخضع لأيّ قوة.',
    'pc.3e.ine.q3.exp': 'السرعة تتغير: حسب مبدأ العطالة، القوى لا تتعادل.',
    'pc.3e.ine.q4.q': 'قمر اصطناعي يدور حول الأرض في مسار دائري، واتجاهه يتغير باستمرار. القوى المطبقة عليه:',
    'pc.3e.ine.q4.a': 'لا تتعادل', 'pc.3e.ine.q4.b': 'تتعادل', 'pc.3e.ine.q4.c': 'منعدمة',
    'pc.3e.ine.q4.exp': 'الحركة ليست مستقيمة: القوى لا تتعادل (التجاذب الكتلي يجذبه نحو الأرض).',
    'pc.3e.ine.q5.q': 'يجلس مسافر في قطار يسير. هو ساكن بالنسبة إلى:',
    'pc.3e.ine.q5.a': 'القطار', 'pc.3e.ine.q5.b': 'الرصيف', 'pc.3e.ine.q5.c': 'أيّ مرجع',
    'pc.3e.ine.q5.exp': 'الحركة تتعلق بالمرجع: المسافر ساكن بالنسبة إلى القطار لكنه يتحرك بالنسبة إلى الرصيف.',
    'pc.3e.ine.q6.q': 'في سيارة تكبح فجأة، يندفع الركاب إلى الأمام. ويعود ذلك إلى:',
    'pc.3e.ine.q6.a': 'العطالة: بدون قوة، يميلون إلى الاحتفاظ بسرعتهم', 'pc.3e.ine.q6.b': 'قوة تدفعهم إلى الأمام', 'pc.3e.ine.q6.c': 'انعدام الوزن',
    'pc.3e.ine.q6.exp': 'يحتفظ الركاب بحركتهم ما دامت لا توجد قوة تغيّرها: هذه هي العطالة.',
    'pc.3e.ine.q7.q': 'يسير دراج بسرعة ثابتة على طريق مستقيم. يخضع لقوى:',
    'pc.3e.ine.q7.a': 'متعادلة', 'pc.3e.ine.q7.b': 'غير متعادلة', 'pc.3e.ine.q7.c': 'منعدمة كلها',
    'pc.3e.ine.q7.exp': 'حركة مستقيمة منتظمة: حسب مبدأ العطالة، القوى تتعادل.',

    'pc.3e.ec.Ec.q': 'احسب الطاقة الحركية لجسم كتلته {M} يتحرك بسرعة {V}. أجب بالجول.',
    'pc.3e.ec.Ec.exp': 'Ec = ½ × m × v² = ½ × {ms} × {v}² = {ans}.',
    'pc.3e.ec.v.q': 'جسم كتلته {M} له طاقة حركية قدرها {E}. احسب سرعته بـ m/s.',
    'pc.3e.ec.v.exp': 'Ec = ½ × m × v² إذن v² = 2 × Ec ÷ m = 2 × {e} ÷ {ms} = {v2}، ومنه v = {v}.',
    'pc.3e.ec.kmh.q': 'سيارة كتلتها {M} تسير بسرعة {V}. احسب طاقتها الحركية بالجول (تذكّر تحويل السرعة إلى m/s).',
    'pc.3e.ec.kmh.exp': '{kmh} km/h ÷ 3,6 = {v}. Ec = ½ × {ms} × {vv}² = {ans}.',
    'pc.3e.ec.r.q': 'تضاعفت سرعة مركبة {k} مرات. كم مرة تتضاعف طاقتها الحركية؟',
    'pc.3e.ec.r.exp': 'Ec تتناسب مع v²: (×{k})² = ×{k2}.',

    'pc.3e.ep.E.q': 'احسب طاقة الوضع لجسم كتلته {M} يوجد على ارتفاع {H}. نأخذ g = 10 N/kg. أجب بالجول.',
    'pc.3e.ep.E.exp': 'Ep = m × g × h = {ms} × 10 × {h} = {e} J.',
    'pc.3e.ep.h.q': 'جسم كتلته {M} له طاقة وضع قدرها {E}. نأخذ g = 10 N/kg. على أيّ ارتفاع، بالمتر، يوجد؟',
    'pc.3e.ep.h.exp': 'Ep = m × g × h إذن h = Ep ÷ (m × g) = {e} ÷ ({ms} × 10) = {h} m.',
    'pc.3e.ep.m.q': 'جسم يوجد على ارتفاع {H} له طاقة وضع قدرها {E}. نأخذ g = 10 N/kg. ما كتلته بالكيلوغرام؟',
    'pc.3e.ep.m.exp': 'Ep = m × g × h إذن m = Ep ÷ (g × h) = {e} ÷ (10 × {h}) = {ms} kg.',
    'pc.3e.ep.v.q': 'يسقط جسم بدون احتكاك من ارتفاع {H}. نأخذ g = 10 N/kg. ما سرعته بـ m/s عند وصوله إلى الأرض؟',
    'pc.3e.ep.v.exp': 'تتحول كل طاقة الوضع إلى طاقة حركية: ½ × m × v² = m × g × h، إذن v² = 2 × 10 × {h} = {v2} ومنه v = {v}.',

    'pc.3e.ion.n.q': 'بلّورة أيونية متعادلة. كم أيونًا {a} يلزم لمعادلة {n} من الأيونات {c}؟',
    'pc.3e.ion.n.exp': 'شحنة {n} من الكاتيونات هي +{tot}. شحنة كل أيون {a} هي −{b}، إذن يلزم {tot} ÷ {b} = {ans}.',
    'pc.3e.ion.t.q': 'الأيون {ion} هو:', 'pc.3e.ion.t.a': 'أيون موجب (كاتيون)', 'pc.3e.ion.t.b': 'أيون سالب (أنيون)', 'pc.3e.ion.t.c': 'ذرة متعادلة',
    'pc.3e.ion.t.exp1': 'الأيون {ion} يحمل شحنة موجبة: إنه كاتيون.', 'pc.3e.ion.t.exp2': 'الأيون {ion} يحمل شحنة سالبة: إنه أنيون.',
    'pc.3e.ion.z.q': 'الذرة {s} تحتوي على {z} إلكترونًا. كم إلكترونًا يحتوي الأيون {ion}؟',
    'pc.3e.ion.z.exp1': 'الأيون موجب: الذرة فقدت {c} إلكترونًا. {z} − {c} = {ans}.', 'pc.3e.ion.z.exp2': 'الأيون سالب: الذرة اكتسبت {c} إلكترونًا. {z} + {c} = {ans}.',
    'pc.3e.ion.e.q1': 'تتحول الذرة {s} إلى الأيون {ion}. كم إلكترونًا فقدت؟', 'pc.3e.ion.e.q2': 'تتحول الذرة {s} إلى الأيون {ion}. كم إلكترونًا اكتسبت؟',
    'pc.3e.ion.e.exp1': 'شحنة {ion} هي +{ans}: الذرة فقدت {ans} إلكترونًا.', 'pc.3e.ion.e.exp2': 'شحنة {ion} هي −{ans}: الذرة اكتسبت {ans} إلكترونًا.',

    'pc.3e.sol.dir.q': 'في محلول خاضع لمجال كهربائي بين مسريين، نحو أيّ قطب للمولّد يتحرك الأيون {ion}؟',
    'pc.3e.sol.dir.a': 'نحو القطب السالب', 'pc.3e.sol.dir.b': 'نحو القطب الموجب', 'pc.3e.sol.dir.c': 'لا يتحرك',
    'pc.3e.sol.dir.exp1': 'الأيون {ion} كاتيون (+): يتحرك نحو القطب السالب.', 'pc.3e.sol.dir.exp2': 'الأيون {ion} أنيون (−): يتحرك نحو القطب الموجب.',
    'pc.3e.sol.f1.q': 'لماذا يوصل الماء المالح التيار الكهربائي بينما الماء الخالص يوصله قليلًا جدًا؟',
    'pc.3e.sol.f1.a': 'لأنه يحتوي على أيونات متحركة', 'pc.3e.sol.f1.b': 'لأنه يحتوي على إلكترونات حرة', 'pc.3e.sol.f1.c': 'لأنه يحتوي على ذرات متعادلة', 'pc.3e.sol.f1.d': 'لأنه أسخن',
    'pc.3e.sol.f1.exp': 'الأيونات المنحلّة حاملات شحنة متحركة: المحلول الأيوني يوصل التيار.',
    'pc.3e.sol.f2.q': 'نُذيب ملح الطعام في الماء. المحلول المحصل عليه:',
    'pc.3e.sol.f2.a': 'متعادل كهربائيًا', 'pc.3e.sol.f2.b': 'مشحون إيجابًا', 'pc.3e.sol.f2.c': 'مشحون سلبًا', 'pc.3e.sol.f2.d': 'بدون أيّ أيون',
    'pc.3e.sol.f2.exp': 'عدد الشحنات الموجبة (Na⁺) يساوي عدد الشحنات السالبة (Cl⁻): المحلول متعادل.',
    'pc.3e.sol.f3.q': 'عند إذابة بلّورة ملح في الماء، يحدث أن:',
    'pc.3e.sol.f3.a': 'تتفكك البلّورة إلى أيونات Na⁺ وCl⁻ منتشرة في الماء', 'pc.3e.sol.f3.b': 'تختفي البلّورة دون أثر', 'pc.3e.sol.f3.c': 'تتحول الأيونات Na⁺ وCl⁻ إلى ذرات', 'pc.3e.sol.f3.d': 'يتحول الماء إلى أيونات',
    'pc.3e.sol.f3.exp': 'الإذابة تفكك البلّورة: تنفصل الأيونات وتنتشر في الماء.',
    'pc.3e.sol.f4.q': 'في محلول أيوني، يتم التيار الكهربائي بفضل حركة:',
    'pc.3e.sol.f4.a': 'الأيونات الموجبة والسالبة', 'pc.3e.sol.f4.b': 'الإلكترونات فقط', 'pc.3e.sol.f4.c': 'الذرات فقط', 'pc.3e.sol.f4.d': 'جزيئات الماء فقط',
    'pc.3e.sol.f4.exp': 'الكاتيونات والأنيونات المتحركة هي حاملات الشحنة في المحلول.',
    'pc.3e.sol.f5.q': 'محلول السكر في الماء لا يوصل التيار الكهربائي. لماذا؟',
    'pc.3e.sol.f5.a': 'لأنه لا يحتوي على أيونات', 'pc.3e.sol.f5.b': 'لأنه يحتوي على أيونات كثيرة جدًا', 'pc.3e.sol.f5.c': 'لأن السكر فلز', 'pc.3e.sol.f5.d': 'لأن الماء يمنع مرور التيار دائمًا',
    'pc.3e.sol.f5.exp': 'ينحل السكر إلى جزيئات متعادلة دون أيونات: المحلول ليس أيونيًا.',

    'pc.3e.cc.conv': 'نحوّل: {ml} mL = {l}. ',
    'pc.3e.cc.C.q': 'نُذيب {M} من المذاب في الماء للحصول على {V} من المحلول. احسب التركيز C بـ g/L.',
    'pc.3e.cc.C.exp': 'C = m ÷ V = {ms} ÷ {v} = {ans}.',
    'pc.3e.cc.m.q': 'محلول تركيزه {C} وحجمه {V}. احسب كتلة المذاب المنحلّ بالغرام.',
    'pc.3e.cc.m.exp': 'm = C × V = {c} × {v} = {ans}.',
    'pc.3e.cc.V.q': 'نتوفر على {M} من المذاب ونريد تحضير محلول تركيزه {C}. ما حجم المحلول المحصل عليه باللتر؟',
    'pc.3e.cc.V.exp': 'C = m ÷ V إذن V = m ÷ C = {ms} ÷ {c} = {ans}.',
    'pc.3e.cc.V2.q': 'نتوفر على {M} من المذاب ونريد تحضير محلول تركيزه {C}. ما حجم المحلول المحصل عليه بالميلتر؟',
    'pc.3e.cc.V2.exp': 'V = m ÷ C = {ms} ÷ {c} = {v}، أي {ans}.',

    'pc.3e.ph.c.q': 'محلول له pH يساوي {ph}. هذا المحلول:', 'pc.3e.ph.c.a': 'حمضي', 'pc.3e.ph.c.b': 'معتدل', 'pc.3e.ph.c.c': 'قاعدي',
    'pc.3e.ph.c.expa': 'pH = {ph} أصغر من 7: المحلول حمضي.', 'pc.3e.ph.c.expb': 'pH = {ph}: المحلول معتدل.', 'pc.3e.ph.c.expc': 'pH = {ph} أكبر من 7: المحلول قاعدي.',
    'pc.3e.ph.m.q': 'المحلول A له pH يساوي {a} والمحلول B له pH يساوي {b}. أيّ المحلولين أكثر حمضية؟', 'pc.3e.ph.m.A': 'المحلول A', 'pc.3e.ph.m.B': 'المحلول B',
    'pc.3e.ph.m.exp': 'كلما كان pH أصغر كان المحلول أكثر حمضية. هنا: {s}.',
    'pc.3e.ph.i.q': 'محلول له pH يساوي {ph}. يحتوي على وفرة من الأيونات:', 'pc.3e.ph.i.a': 'H⁺', 'pc.3e.ph.i.b': 'HO⁻', 'pc.3e.ph.i.c': 'Cl⁻',
    'pc.3e.ph.i.expa': 'pH = {ph} &lt; 7: محلول حمضي، به وفرة من الأيونات H⁺.', 'pc.3e.ph.i.expb': 'pH = {ph} &gt; 7: محلول قاعدي، به وفرة من الأيونات HO⁻.',
    'pc.3e.ph.d.q1': 'نخفّف بالماء محلولًا حمضيًا pH = {ph}. قيمة pH:', 'pc.3e.ph.d.q2': 'نخفّف بالماء محلولًا قاعديًا pH = {ph}. قيمة pH:',
    'pc.3e.ph.d.a': 'تزداد وتقترب من 7', 'pc.3e.ph.d.b': 'تنقص وتقترب من 7', 'pc.3e.ph.d.c': 'لا تتغير',
    'pc.3e.ph.d.expa': 'عند تخفيف حمض، يزداد pH ويقترب من 7.', 'pc.3e.ph.d.expb': 'عند تخفيف قاعدة، ينقص pH ويقترب من 7.',
    'pc.3e.ph.w.q': 'لتخفيف حمض مركّز بأمان، نصبّ:',
    'pc.3e.ph.w.a': 'الحمض في الماء ببطء', 'pc.3e.ph.w.b': 'الماء في الحمض', 'pc.3e.ph.w.c': 'الاثنين معًا بسرعة كبيرة',
    'pc.3e.ph.w.exp': 'قاعدة السلامة: نصبّ دائمًا الحمض في الماء وليس العكس.',

    'pc.3e.am.g.q': 'فلز يهاجمه حمض فينطلق غاز يُحدث فرقعة صغيرة عند تقريب لهب. ما هذا الغاز؟',
    'pc.3e.am.g.exp': 'الغاز الذي يُفرقع عند اللهب هو ثنائي الهيدروجين H₂.',
    'pc.3e.am.r.q': 'من بين هذه الفلزات، أيّها لا يهاجمه حمض الكلورهيدريك المخفف؟',
    'pc.3e.am.r.exp': 'الحديد والزنك والألومنيوم يهاجمها حمض الكلورهيدريك. أما النحاس فلا يتفاعل.',
    'pc.3e.am.b.q': 'ما العدد الذي يجب أن يعوّض علامة الاستفهام لتكون المعادلة موزونة من حيث الذرات والشحنات؟',
    'pc.3e.am.b.exp': 'الشحنات تنحفظ: شحنة الطرف الأيمن +{ans}، إذن يلزم {ans} من الأيونات H⁺ في الطرف الأيسر. المعادلة: {eq}.',
    'pc.3e.am.c.q': 'ما شحنة الأيون الفلزي المتكوّن؟ (أعط قيمة الشحنة دون إشارة.)',
    'pc.3e.am.c.exp': 'في الطرف الأيسر الشحنة الكلية +{tot}. في الطرف الأيمن يجب أن تكون نفسها: شحنة الأيون إذن +{ans}. المعادلة: {eq}.',

    'pc.3e.ti.col.b': 'أزرق', 'pc.3e.ti.col.v': 'أخضر', 'pc.3e.ti.col.r': 'صدئي', 'pc.3e.ti.col.w': 'أبيض',
    'pc.3e.ti.c.q': 'نضيف الصودا إلى محلول يحتوي على الأيون {ion}. ما لون الراسب المتكوّن؟',
    'pc.3e.ti.c.exp': 'مع الصودا، يعطي الأيون {ion} راسبًا لونه {col}.',
    'pc.3e.ti.i.q': 'نضيف الصودا إلى محلول فيتكوّن راسب لونه {col}. ما الأيون الفلزي الذي كان يحتوي عليه؟',
    'pc.3e.ti.i.exp': 'الراسب {col} مع الصودا يميّز الأيون {ion}.',
    'pc.3e.ti.cl.q': 'نضيف نترات الفضة إلى محلول فيتكوّن راسب أبيض يسودّ في الضوء. ما الأيون الذي كان يحتوي عليه؟',
    'pc.3e.ti.cl.a': 'أيون الكلورور Cl⁻', 'pc.3e.ti.cl.b': 'أيون النحاس Cu²⁺', 'pc.3e.ti.cl.c': 'أيون الكبريتات SO₄²⁻', 'pc.3e.ti.cl.d': 'أيون الحديد Fe³⁺',
    'pc.3e.ti.cl.exp': 'تعطي نترات الفضة مع أيون الكلورور راسبًا أبيض يسودّ في الضوء.',
    'pc.3e.ti.r.q': 'ما الكاشف المستعمل للتعرف على الأيون {ion}؟',
    'pc.3e.ti.r.a': 'الصودا', 'pc.3e.ti.r.b': 'نترات الفضة', 'pc.3e.ti.r.c': 'كلورور الباريوم', 'pc.3e.ti.r.d': 'الماء المقطّر',
    'pc.3e.ti.r.expa': 'الأيونات الفلزية (Cu²⁺ وFe²⁺ وFe³⁺ وZn²⁺) يُتعرَّف عليها بالصودا.', 'pc.3e.ti.r.expb': 'يُتعرَّف على أيون الكلورور بنترات الفضة.', 'pc.3e.ti.r.expc': 'يُتعرَّف على أيون الكبريتات بكلورور الباريوم.',

    'pc.3e.sec.q1.q': 'منتوج يحمل رمز لهب. هو:', 'pc.3e.sec.q1.a': 'قابل للاشتعال', 'pc.3e.sec.q1.b': 'أكّال', 'pc.3e.sec.q1.c': 'خطير على البيئة', 'pc.3e.sec.q1.d': 'غير خطير', 'pc.3e.sec.q1.exp': 'اللهب يدل على منتوج قابل للاشتعال: لا لهب بالقرب منه.',
    'pc.3e.sec.q2.q': 'منتوج يحمل رمز جمجمة. هو:', 'pc.3e.sec.q2.a': 'سام', 'pc.3e.sec.q2.b': 'قابل للاشتعال', 'pc.3e.sec.q2.c': 'مؤكسِد', 'pc.3e.sec.q2.d': 'غير خطير', 'pc.3e.sec.q2.exp': 'الجمجمة تدل على منتوج سام، خطير عند الابتلاع أو الاستنشاق أو اللمس.',
    'pc.3e.sec.q3.q': 'منظّف للأنابيب يحمل رمز يد ومعدن تأكلهما سوائل. هو:', 'pc.3e.sec.q3.a': 'أكّال', 'pc.3e.sec.q3.b': 'قابل للاشتعال', 'pc.3e.sec.q3.c': 'متفجّر', 'pc.3e.sec.q3.d': 'غير مؤذٍ للجلد', 'pc.3e.sec.q3.exp': 'هذا الرمز يدل على منتوج أكّال: يهاجم الجلد والعينين والفلزات.',
    'pc.3e.sec.q4.q': 'نخلط ماء جافيل مع مزيل للكلس (حمض). ماذا يحدث؟', 'pc.3e.sec.q4.a': 'ينطلق ثنائي الكلور، وهو غاز سام', 'pc.3e.sec.q4.b': 'يصبح الخليط أنجع دون خطر', 'pc.3e.sec.q4.c': 'لا يحدث شيء', 'pc.3e.sec.q4.d': 'ينطلق الأكسجين النقي', 'pc.3e.sec.q4.exp': 'ماء جافيل والحمض يحرران ثنائي الكلور، غازًا ساما: لا نخلط هذه المنتوجات أبدًا.',
    'pc.3e.sec.q5.q': 'سقط منتوج أكّال على الجلد. التصرف الصحيح هو:', 'pc.3e.sec.q5.a': 'الغسل بكثرة من الماء', 'pc.3e.sec.q5.b': 'المسح بخرقة جافة', 'pc.3e.sec.q5.c': 'عدم فعل شيء', 'pc.3e.sec.q5.d': 'وضع منتوج كيميائي آخر', 'pc.3e.sec.q5.exp': 'نغسل بكثرة من الماء ثم نطلب المساعدة.',
    'pc.3e.sec.q6.q': 'ما وسائل الوقاية عند التعامل مع حمض في المختبر؟', 'pc.3e.sec.q6.a': 'نظارات وقفازات ومئزر', 'pc.3e.sec.q6.b': 'لا وسيلة', 'pc.3e.sec.q6.c': 'حذاء مفتوح فقط', 'pc.3e.sec.q6.d': 'قبعة فقط', 'pc.3e.sec.q6.exp': 'النظارات والقفازات والمئزر تحمي من تطاير منتوج أكّال.',
    'pc.3e.sec.q7.q': 'منتوج يحمل رمز شجرة ميتة وسمكة. هو:', 'pc.3e.sec.q7.a': 'خطير على البيئة', 'pc.3e.sec.q7.b': 'قابل للاشتعال', 'pc.3e.sec.q7.c': 'لا أثر له على الطبيعة', 'pc.3e.sec.q7.d': 'مؤكسِد', 'pc.3e.sec.q7.exp': 'هذا الرمز يدل على منتوج خطير على البيئة: لا نرميه في الطبيعة.',
    'pc.3e.sec.q8.q': 'أين يجب حفظ منتوج منزلي خطير؟', 'pc.3e.sec.q8.a': 'في غلافه الأصلي بعيدًا عن متناول الأطفال', 'pc.3e.sec.q8.b': 'في قنينة ماء', 'pc.3e.sec.q8.c': 'على طاولة المطبخ', 'pc.3e.sec.q8.d': 'في كأس', 'pc.3e.sec.q8.exp': 'نحفظ المنتوج في غلافه الأصلي وعليه ملصقه، بعيدًا عن متناول الأطفال.',
    'pc.3e.sec.q9.q': 'ماذا نفعل قبل استعمال منتوج كيميائي مجهول؟', 'pc.3e.sec.q9.a': 'نقرأ الملصق ورموزه', 'pc.3e.sec.q9.b': 'نشمّه عن قرب', 'pc.3e.sec.q9.c': 'نتذوقه', 'pc.3e.sec.q9.d': 'نخلطه بمنتوج آخر', 'pc.3e.sec.q9.exp': 'نقرأ الملصق دائمًا: فهو يبيّن الأخطار والاحتياطات الواجب اتخاذها.',
    'pc.3e.sec.q10.q': 'علامة تعجب داخل معيّن بإطار أحمر على ملصق تعني أن المنتوج:', 'pc.3e.sec.q10.a': 'ضارّ أو مهيّج', 'pc.3e.sec.q10.b': 'غير مؤذٍ', 'pc.3e.sec.q10.c': 'متفجّر', 'pc.3e.sec.q10.d': 'مفيد للصحة', 'pc.3e.sec.q10.exp': 'علامة التعجب تدل على منتوج ضارّ أو مهيّج: نتجنب أي تلامس معه.',
  });

  /* ================================================================ titres arabes du catalogue */
  Object.assign(root.AR_CATALOG, {
    'Physique': 'الفيزياء', 'Chimie': 'الكيمياء',
    'Électricité': 'الكهرباء', 'Lumière et gravitation': 'الضوء والتجاذب الكتلي', 'Mouvement et énergie': 'الحركة والطاقة',
    'Ions et solutions': 'الأيونات والمحاليل', 'Acides, bases et métaux': 'الأحماض والقواعد والفلزات', 'Analyse et sécurité': 'التحليل والسلامة',
    'Loi d’Ohm : U, R ou I': 'قانون أوم: U أو R أو I',
    'Puissance, intensité et énergie électriques': 'القدرة وشدة التيار والطاقة الكهربائية',
    'Lentilles convergentes : rayons et images': 'العدسات اللامّة: الأشعة والصور',
    'Poids et gravitation': 'الوزن والتجاذب الكتلي',
    'Principe d’inertie et forces': 'مبدأ العطالة والقوى',
    'Énergie cinétique': 'الطاقة الحركية',
    'Énergie de position et conversion': 'طاقة الوضع وتحوّل الطاقة',
    'Atomes et ions': 'الذرات والأيونات',
    'Solutions ioniques et conduction': 'المحاليل الأيونية والتوصيل',
    'Concentration d’une solution (g/L)': 'تركيز محلول (g/L)',
    'pH : acide, neutre ou basique': 'pH: حمضي أو معتدل أو قاعدي',
    'Action d’un acide sur un métal': 'تأثير حمض على فلز',
    'Tests de reconnaissance des ions': 'اختبارات التعرف على الأيونات',
    'Sécurité et produits chimiques': 'السلامة والمنتوجات الكيميائية',
  });

  /* ================================================================ catalogue */
  const lv = (root.CATALOG_EXTRA || []).find((l) => l.id === '3e');
  lv.domains.push(
    { name: 'Physique', cats: [
      { name: 'Électricité', skills: [['Loi d’Ohm : U, R ou I', 'pc3e_ohm', {}], ['Puissance, intensité et énergie électriques', 'pc3e_puiss', {}]] },
      { name: 'Lumière et gravitation', skills: [['Lentilles convergentes : rayons et images', 'pc3e_lentille', {}], ['Poids et gravitation', 'pc3e_poids', {}]] },
      { name: 'Mouvement et énergie', skills: [['Principe d’inertie et forces', 'pc3e_inertie', {}], ['Énergie cinétique', 'pc3e_ec', {}], ['Énergie de position et conversion', 'pc3e_ep', {}]] },
    ] },
    { name: 'Chimie', cats: [
      { name: 'Ions et solutions', skills: [['Atomes et ions', 'pc3e_ions', {}], ['Solutions ioniques et conduction', 'pc3e_solion', {}], ['Concentration d’une solution (g/L)', 'pc3e_conc', {}]] },
      { name: 'Acides, bases et métaux', skills: [['pH : acide, neutre ou basique', 'pc3e_ph', {}], ['Action d’un acide sur un métal', 'pc3e_acmet', {}]] },
      { name: 'Analyse et sécurité', skills: [['Tests de reconnaissance des ions', 'pc3e_testion', {}], ['Sécurité et produits chimiques', 'pc3e_secu', {}]] },
    ] }
  );
}(typeof window !== 'undefined' ? window : globalThis));
