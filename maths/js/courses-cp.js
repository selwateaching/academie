/* Cours illustrés : CP (6-7 ans). Contenu en français ; figures SVG animées. */
(function () {
  'use strict';
  const K = window.CourseKit, { F, C, svg, T, L, ARROW, S, Q, FIG } = K;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" fill="${o.f || 'currentColor'}" stroke="none" font-size="${o.s || 13}" font-weight="700" text-anchor="${o.a || 'middle'}"${o.c ? ` class="${o.c}"` : ''}>${s}</text>`;
  const dot = (x, y, c, r = 10, cls = '') => `<circle${cls ? ` class="${cls}"` : ''} cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".8" stroke="${c}" stroke-width="2"/>`;
  const box = (x, y, w, h, c, cls = '', op = 0.25, sw = 2.5) => `<rect${cls ? ` class="${cls}"` : ''} x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${c}" fill-opacity="${op}" stroke="${c}" stroke-width="${sw}"/>`;
  const poly = (pts, c, op = 0.25, cls = '') => `<polygon${cls ? ` class="${cls}"` : ''} points="${pts}" fill="${c}" fill-opacity="${op}" stroke="${c}" stroke-width="2.5"/>`;
  const f1 = (n) => n.toFixed(1);
  const pencil = (x, y, total, c) => `${box(x, y, total - 14, 16, c, '', 0.45, 2)}<polygon points="${x + total - 14},${y} ${x + total},${y + 8} ${x + total - 14},${y + 16}" fill="${C.or}" fill-opacity=".7" stroke="${C.or}" stroke-width="2"/>${box(x, y, 12, 16, C.rouge, '', 0.5, 2)}`;
  const clock = (cx, cy, r, h, m, fs) => {
    let b = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.bleu}" fill-opacity=".1" stroke="currentColor" stroke-width="3"/>`;
    for (let n = 1; n <= 12; n++) { const a = n * Math.PI / 6; b += txt(f1(cx + (r - 12) * Math.sin(a)), f1(cy - (r - 12) * Math.cos(a) + fs / 3), n, { s: fs }); }
    const hand = (len, deg, c, w, cls = '') => { const a = deg * Math.PI / 180; return `<line${cls ? ` class="${cls}"` : ''} x1="${cx}" y1="${cy}" x2="${f1(cx + len * Math.sin(a))}" y2="${f1(cy - len * Math.cos(a))}" stroke="${c}" stroke-width="${w}"/>`; };
    return b + hand(r - 24, m * 6, C.bleu, 3) + hand((r - 24) * 0.62, (h % 12) * 30 + m * 0.5, C.rouge, 5, 'pulse') + `<circle cx="${cx}" cy="${cy}" r="4" fill="currentColor" stroke="none"/>`;
  };
  const jump = (a, b, lab, formula, id) => {
    const X = (i) => 24 + i * 26;
    let s = ARROW(id, C.vert) + L(14, 70, 346, 70, 'currentColor', 3);
    for (let i = 0; i <= 12; i++) s += L(X(i), 64, X(i), 76, 'currentColor', 2) + txt(X(i), 94, i, { s: 11 });
    const x1 = X(a), x2 = X(b), mid = (x1 + x2) / 2;
    s += `<path class="dash" d="M${x1} 60 Q${mid} 12 ${x2} 62" stroke="${C.vert}" stroke-width="3" marker-end="url(#${id})"/>`;
    s += dot(x1, 70, C.bleu, 7) + dot(x2, 70, C.or, 7, 'pop') + txt(mid, 30, lab, { s: 16, f: C.vert });
    return svg(360, 125, s + txt(180, 118, formula, { s: 15 }));
  };
  const pips = (cx, cy) => [[-14, -14], [14, -14], [-14, 14], [14, 14]].map(([dx, dy]) => dot(cx + dx, cy + dy, C.brand, 6)).join('');
  const hline = (a, b, y, c = 'currentColor', w = 3) => L(a, y, b, y, c, w);

  Object.assign(FIG, {
    cp_billes: () => {
      let b = '';
      for (let i = 0; i < 10; i++) { const x = 60 + (i % 5) * 48, y = i < 5 ? 36 : 82; b += dot(x, y, i % 2 ? C.or : C.bleu, 16, i === 9 ? 'pop' : '') + txt(x, y + 5, i + 1, { s: 13 }); }
      return svg(360, 118, b + txt(318, 72, '10', { s: 32, f: C.brand, c: 'pop' }));
    },
    cp_dizaines: () => {
      let b = '';
      [40, 72, 104].forEach((x) => { b += box(x, 15, 22, 90, C.bleu, '', 0.25, 2.5); for (let k = 1; k < 10; k++) b += L(x, 15 + k * 9, x + 22, 15 + k * 9, C.bleu, 1); });
      for (let i = 0; i < 4; i++) b += box(190 + i * 26, 85, 20, 20, C.or, i === 3 ? 'pop' : '', 0.4, 2.5);
      b += txt(83, 128, '3 dizaines', { f: C.bleu }) + txt(239, 128, '4 unités', { f: C.or }) + txt(180, 156, '3 × 10 + 4 = 34', { s: 17 });
      return svg(360, 165, b);
    },
    cp_droite100: () => {
      const X = (i) => 20 + i * 32;
      let b = ARROW('cpd1', 'currentColor') + `<line x1="8" y1="70" x2="352" y2="70" stroke="currentColor" stroke-width="3" marker-end="url(#cpd1)"/>`;
      for (let i = 0; i <= 10; i++) b += L(X(i), 63, X(i), 77, 'currentColor', 2) + txt(X(i), 94, i * 10, { s: 11 });
      for (let i = 0; i < 3; i++) { const m = (X(i) + X(i + 1)) / 2; b += `<path class="dash" d="M${X(i)} 60 Q${m} 28 ${X(i + 1)} 60" stroke="${C.vert}" stroke-width="2.5"/>` + txt(m, 38, '+10', { s: 12, f: C.vert }); }
      b += dot(X(3), 70, C.rouge, 7, 'pop');
      return svg(360, 126, b + txt(180, 118, 'de 10 en 10', { f: C.vert }));
    },
    cp_reunir: () => {
      const apple = (x, y, c = '') => dot(x, y, C.rouge, 15, c) + L(x, y - 15, x + 4, y - 22, C.vert, 3);
      let b = apple(30, 55) + apple(66, 55) + apple(102, 55) + txt(135, 64, '+', { s: 26 }) + apple(168, 55, 'pop') + apple(204, 55, 'pop') + txt(240, 64, '=', { s: 26 }) + txt(288, 70, '5', { s: 38, f: C.brand, c: 'pop' });
      return svg(360, 115, b + txt(66, 100, '3', { s: 16, f: C.bleu }) + txt(186, 100, '2', { s: 16, f: C.or }));
    },
    cp_saut: () => jump(6, 9, '+3', '6 + 3 = 9', 'cpj1'),
    cp_recul: () => jump(9, 5, '−4', '9 − 4 = 5', 'cpj2'),
    cp_dix: () => {
      let b = '';
      for (let i = 0; i < 10; i++) { const x = 95 + (i % 5) * 34, y = i < 5 ? 15 : 49; b += box(x, y, 30, 30, i < 7 ? C.bleu : C.or, i < 7 ? '' : 'pulse', i < 7 ? 0.12 : 0.05, 2); if (i < 7) b += dot(x + 15, y + 15, C.bleu, 10); }
      return svg(360, 125, b + txt(180, 108, '7 + 3 = 10', { s: 17 }));
    },
    cp_poser: () => {
      let b = txt(155, 26, 'D', { f: C.bleu }) + txt(215, 26, 'U', { f: C.or }) + L(185, 12, 185, 118, 'currentColor', 1.5);
      b += txt(155, 56, '2', { s: 22 }) + txt(215, 56, '3', { s: 22 }) + txt(105, 86, '+', { s: 22 }) + txt(155, 86, '1', { s: 22 }) + txt(215, 86, '4', { s: 22 });
      b += hline(95, 250, 98, 'currentColor', 3) + txt(155, 125, '3', { s: 24, f: C.vert, c: 'pop' }) + txt(215, 125, '7', { s: 24, f: C.vert, c: 'pop' });
      return svg(360, 135, b);
    },
    cp_enlever: () => {
      let b = '';
      for (let i = 0; i < 7; i++) { const x = 30 + i * 45; if (i < 4) b += dot(x, 50, C.or, 15); else b += dot(x, 50, C.gris, 15, 'pulse') + L(x - 10, 40, x + 10, 60, C.rouge, 3) + L(x - 10, 60, x + 10, 40, C.rouge, 3); }
      return svg(360, 115, b + txt(180, 102, '7 − 3 = 4', { s: 18 }));
    },
    cp_ecart: () => {
      let b = '';
      for (let i = 0; i < 8; i++) b += box(40 + i * 28, 22, 24, 24, i < 5 ? C.bleu : C.rouge, i < 5 ? '' : 'pulse', i < 5 ? 0.3 : 0.45, 2);
      for (let i = 0; i < 5; i++) b += box(40 + i * 28, 56, 24, 24, C.or, '', 0.4, 2);
      b += txt(290, 40, '8', { s: 18 }) + txt(290, 74, '5', { s: 18 }) + hline(180, 260, 56, C.rouge, 0) + L(180, 92, 260, 92, C.rouge, 3);
      return svg(360, 125, b + txt(220, 112, '3 en plus', { f: C.rouge }) + txt(90, 112, '8 − 5 = 3', { s: 16 }));
    },
    cp_famille: () => {
      let b = poly('90,30 45,100 135,100', C.brand, 0.08) + dot(90, 30, C.brand, 19) + dot(45, 100, C.bleu, 19) + dot(135, 100, C.or, 19, 'pop');
      b += txt(90, 36, '8', { s: 17 }) + txt(45, 106, '3', { s: 17 }) + txt(135, 106, '5', { s: 17 });
      [['3 + 5 = 8', 36], ['5 + 3 = 8', 66], ['8 − 3 = 5', 96], ['8 − 5 = 3', 126]].forEach(([s, y]) => { b += txt(270, y, s, { s: 16, f: y < 80 ? C.bleu : C.rouge }); });
      return svg(360, 148, b);
    },
    cp_compare: () => {
      let b = L(165, 12, 165, 112, C.gris, 2).replace('/>', ' class="dash"/>');
      for (let i = 0; i < 6; i++) b += dot(40 + (i % 3) * 34, 34 + Math.floor(i / 3) * 34, C.bleu, 12, 'pop');
      for (let i = 0; i < 4; i++) b += dot(222 + (i % 2) * 34, 34 + Math.floor(i / 2) * 34, C.or, 12);
      return svg(360, 125, b + txt(74, 112, 'plus', { f: C.bleu }) + txt(239, 112, 'moins', { f: C.or }));
    },
    cp_croco: () => {
      const gt = (x, y) => `<polyline class="pop" points="${x - 10},${y - 16} ${x + 10},${y} ${x - 10},${y + 16}" stroke="${C.rouge}" stroke-width="5"/>`;
      const lt = (x, y) => `<polyline class="pop" points="${x + 10},${y - 16} ${x - 10},${y} ${x + 10},${y + 16}" stroke="${C.rouge}" stroke-width="5"/>`;
      let b = txt(110, 55, '12', { s: 28, f: C.bleu }) + gt(180, 45) + txt(250, 52, '8', { s: 16, f: C.or });
      b += txt(110, 112, '5', { s: 16, f: C.or }) + lt(180, 105) + txt(250, 115, '9', { s: 28, f: C.bleu });
      return svg(360, 135, b);
    },
    cp_dizcomp: () => {
      const lt = `<polyline class="pop" points="190,36 170,52 190,68" stroke="${C.rouge}" stroke-width="5"/>`;
      let b = txt(75, 62, '4', { s: 36, f: C.bleu }) + txt(105, 62, '7', { s: 36 }) + lt + txt(255, 62, '5', { s: 36, f: C.or }) + txt(285, 62, '2', { s: 36 });
      b += txt(90, 92, '4 dizaines', { f: C.bleu }) + txt(270, 92, '5 dizaines', { f: C.or });
      return svg(360, 135, b + txt(180, 124, '4 &lt; 5 → 47 &lt; 52', { s: 17 }));
    },
    cp_rang: () => {
      let b = ARROW('cpr1', C.vert);
      [8, 15, 23, 41].forEach((n, i) => { b += box(24 + i * 84, 14, 60, 50, [C.bleu, C.vert, C.or, C.rouge][i], i === 0 ? 'pop' : '', 0.25, 2.5) + txt(54 + i * 84, 48, n, { s: 22 }); });
      b += `<line x1="24" y1="88" x2="336" y2="88" stroke="${C.vert}" stroke-width="3.5" marker-end="url(#cpr1)"/>`;
      return svg(360, 128, b + txt(60, 116, 'plus petit', { f: C.bleu }) + txt(300, 116, 'plus grand', { f: C.rouge }));
    },
    cp_double: () => {
      const die = (x) => box(x, 25, 60, 60, C.brand, '', 0.08, 3) + pips(x + 30, 55);
      return svg(360, 125, die(30) + txt(115, 64, '+', { s: 26 }) + die(140) + txt(225, 64, '=', { s: 26 }) + txt(272, 72, '8', { s: 42, f: C.brand, c: 'pop' }) + txt(180, 112, 'le double de 4', { f: C.bleu }));
    },
    cp_tabdouble: () => {
      let b = txt(50, 50, 'nombre', { f: C.bleu }) + txt(50, 100, 'double', { f: C.or }) + txt(50, 76, '×2', { f: C.rouge, c: 'pulse', s: 15 });
      [1, 2, 3, 4, 5, 10].forEach((n, i) => { const x = 118 + i * 44; b += box(x - 19, 28, 38, 34, C.bleu, '', 0.2, 2) + txt(x, 51, n, { s: 16 }) + box(x - 19, 78, 38, 34, C.or, i === 5 ? 'pop' : '', 0.3, 2) + txt(x, 101, n * 2, { s: 16 }); });
      return svg(360, 125, b);
    },
    cp_moitie: () => {
      let b = box(30, 30, 130, 60, C.bleu, '', 0.1, 2.5) + box(200, 30, 130, 60, C.or, '', 0.1, 2.5);
      [-42, -14, 14, 42].forEach((d) => { b += dot(95 + d, 60, C.bleu, 11) + dot(265 + d, 60, C.or, 11, 'pop'); });
      return svg(360, 125, b + txt(180, 24, '8', { s: 20 }) + txt(180, 68, '÷ 2', { s: 20, f: C.rouge }) + txt(95, 114, '4', { s: 18, f: C.bleu }) + txt(265, 114, '4', { s: 18, f: C.or }));
    },
    cp_gateau: () => {
      let b = `<path d="M90 20A42 42 0 0 0 90 104Z" fill="${C.or}" fill-opacity=".4" stroke="${C.or}" stroke-width="2.5"/><path class="pop" d="M90 20A42 42 0 0 1 90 104Z" fill="${C.rouge}" fill-opacity=".3" stroke="${C.rouge}" stroke-width="2.5"/>` + L(90, 20, 90, 104, 'currentColor', 2).replace('/>', ' class="dash"/>');
      b += box(200, 34, 38, 60, C.or, '', 0.4, 2.5) + box(238, 34, 82, 60, C.rouge, '', 0.3, 2.5);
      return svg(360, 138, b + txt(90, 14, '✓', { s: 16, f: C.vert }) + txt(260, 24, '✗', { s: 16, f: C.rouge }) + txt(90, 128, 'la moitié') + txt(260, 128, 'pas la moitié'));
    },
    cp_formes: () => svg(360, 135,
      box(28, 38, 44, 44, C.bleu, 'pop') + box(108, 44, 64, 32, C.vert, 'pop') + poly('230,34 204,82 256,82', C.or, 0.3, 'pop') + `<circle class="pop" cx="320" cy="60" r="24" fill="${C.rouge}" fill-opacity=".25" stroke="${C.rouge}" stroke-width="2.5"/>`
      + txt(50, 118, 'carré') + txt(140, 118, 'rectangle') + txt(230, 118, 'triangle') + txt(320, 118, 'disque')),
    cp_cotes: () => {
      let b = poly('30,100 130,100 80,30', C.bleu, 0.1).replace('stroke-width="2.5"', 'stroke-width="4"') + box(220, 35, 80, 65, C.bleu, '', 0.1, 4);
      [[30, 100], [130, 100], [80, 30], [220, 35], [300, 35], [220, 100], [300, 100]].forEach(([x, y]) => { b += dot(x, y, C.rouge, 6, 'pulse'); });
      return svg(360, 150, b + txt(80, 122, '3 côtés', { f: C.bleu }) + txt(80, 140, '3 sommets', { f: C.rouge }) + txt(260, 122, '4 côtés', { f: C.bleu }) + txt(260, 140, '4 sommets', { f: C.rouge }));
    },
    cp_rect: () => {
      let b = box(45, 25, 60, 60, C.bleu, '', 0.15, 3) + box(190, 35, 120, 50, C.vert, '', 0.15, 3);
      b += L(75, 20, 75, 30, C.rouge, 2.5) + L(75, 80, 75, 90, C.rouge, 2.5) + L(40, 55, 50, 55, C.rouge, 2.5) + L(100, 55, 110, 55, C.rouge, 2.5);
      b += L(250, 30, 250, 40, C.rouge, 2.5) + L(250, 80, 250, 90, C.rouge, 2.5) + L(185, 52, 195, 52, C.vert, 2.5) + L(185, 58, 195, 58, C.vert, 2.5) + L(305, 52, 315, 52, C.vert, 2.5) + L(305, 58, 315, 58, C.vert, 2.5);
      return svg(360, 125, b + txt(75, 112, '4 côtés égaux') + txt(250, 112, '2 longs, 2 courts'));
    },
    cp_solides: () => {
      let b = box(25, 55, 45, 45, C.bleu, '', 0.25, 2.5) + poly('25,55 39,41 84,41 70,55', C.bleu, 0.45) + poly('70,55 84,41 84,86 70,100', C.bleu, 0.12);
      b += box(105, 65, 65, 35, C.vert, '', 0.25, 2.5) + poly('105,65 119,51 184,51 170,65', C.vert, 0.45) + poly('170,65 184,51 184,86 170,100', C.vert, 0.12);
      b += `<circle class="pop" cx="240" cy="75" r="29" fill="${C.rouge}" fill-opacity=".25" stroke="${C.rouge}" stroke-width="2.5"/><path d="M222 66A22 22 0 0 1 238 52" stroke="${C.rouge}" stroke-width="3"/>`;
      b += `<rect x="288" y="55" width="48" height="45" fill="${C.or}" fill-opacity=".25" stroke="none"/>${L(288, 55, 288, 100, C.or, 2.5)}${L(336, 55, 336, 100, C.or, 2.5)}<ellipse cx="312" cy="100" rx="24" ry="8" fill="${C.or}" fill-opacity=".25" stroke="${C.or}" stroke-width="2.5"/><ellipse cx="312" cy="55" rx="24" ry="8" fill="${C.or}" fill-opacity=".5" stroke="${C.or}" stroke-width="2.5"/>`;
      return svg(360, 145, b + txt(48, 130, 'cube') + txt(135, 130, 'pavé') + txt(240, 130, 'boule') + txt(312, 130, 'cylindre'));
    },
    cp_crayons: () => {
      let b = L(20, 8, 20, 108, C.gris, 2).replace('/>', ' class="dash"/>');
      b += pencil(20, 16, 214, C.bleu) + pencil(20, 48, 146, C.vert) + pencil(20, 80, 94, C.rouge);
      return svg(360, 120, b + txt(300, 29, 'le plus long', { f: C.bleu, c: 'pulse' }) + txt(210, 93, 'le plus court', { f: C.rouge, c: 'pulse' }));
    },
    cp_regle: () => {
      let b = box(15, 62, 330, 38, C.or, '', 0.2, 2.5);
      for (let i = 0; i <= 10; i++) b += L(30 + i * 30, 62, 30 + i * 30, 76, 'currentColor', 2) + txt(30 + i * 30, 94, i, { s: 12 });
      b += pencil(30, 26, 180, C.bleu) + L(30, 44, 30, 62, C.rouge, 2.5).replace('/>', ' class="dash"/>') + L(210, 44, 210, 62, C.rouge, 2.5).replace('/>', ' class="dash"/>');
      return svg(360, 128, b + txt(120, 18, '6 cm', { s: 15, f: C.bleu }) + txt(30, 118, '↑', { f: C.rouge, c: 'pulse', s: 16 }) + txt(100, 118, 'on part de 0'));
    },
    cp_trace: () => {
      let b = box(55, 62, 270, 38, C.or, '', 0.2, 2.5);
      for (let i = 0; i <= 8; i++) b += L(70 + i * 30, 62, 70 + i * 30, 76, 'currentColor', 2) + txt(70 + i * 30, 94, i, { s: 12 });
      b += `<path class="draw" pathLength="100" d="M70 46H220" stroke="${C.bleu}" stroke-width="4"/>` + L(220, 46, 220, 62, C.rouge, 2).replace('/>', ' class="dash"/>');
      b += dot(70, 46, C.rouge, 5) + dot(220, 46, C.rouge, 5, 'pulse') + txt(70, 32, 'A', { f: C.rouge }) + txt(220, 32, 'B', { f: C.rouge }) + txt(145, 30, '5 cm', { s: 14, f: C.bleu });
      return svg(360, 115, b);
    },
    cp_horloge: () => svg(360, 170, clock(110, 85, 72, 4, 0, 12)
      + txt(270, 52, 'petite aiguille', { f: C.rouge }) + txt(270, 70, 'les heures') + txt(270, 112, 'grande aiguille', { f: C.bleu }) + txt(270, 130, 'les minutes')),
    cp_hpile: () => svg(360, 165, clock(90, 70, 56, 3, 0, 10) + clock(270, 70, 56, 7, 0, 10)
      + txt(90, 148, '3 h', { s: 16, f: C.rouge }) + txt(270, 148, '7 h', { s: 16, f: C.rouge })
      + txt(180, 162, 'grande aiguille sur 12', { f: C.bleu, s: 12 })),
    cp_hdemi: () => svg(360, 165, clock(90, 70, 56, 3, 30, 10) + clock(270, 70, 56, 8, 30, 10)
      + txt(90, 148, '3 h 30', { s: 16, f: C.rouge }) + txt(270, 148, '8 h 30', { s: 16, f: C.rouge })
      + txt(180, 162, 'grande aiguille sur 6', { f: C.bleu, s: 12 })),
    cp_jour: () => {
      let b = '';
      [['matin', C.or, 0.25], ['après-midi', C.or, 0.55], ['soir', C.brand, 0.35], ['nuit', C.brand, 0.7]].forEach(([n, c, o], i) => { b += box(30 + i * 75, 40, 75, 34, c, '', o, 2) + txt(67 + i * 75, 62, n, { s: 12 }); });
      ['6 h', '12 h', '18 h', '24 h', '6 h'].forEach((h, i) => { b += txt(30 + i * 75, 96, h, { s: 12 }); });
      b += dot(67, 20, C.or, 9, 'pop') + dot(293, 20, C.gris, 9, 'pop');
      return svg(360, 110, b);
    },
    cp_pieces: () => {
      let b = txt(40, 44, 'pièces', { a: 'middle' }) + dot(120, 40, C.or, 21) + dot(176, 40, C.gris, 24);
      b += txt(120, 45, '1 €', { s: 13 }) + txt(176, 45, '2 €', { s: 13 }) + txt(40, 108, 'billets');
      [['5 €', C.vert, 90], ['10 €', C.rouge, 165], ['20 €', C.bleu, 240]].forEach(([n, c, x], i) => { b += box(x, 86, 60, 34, c, i === 2 ? 'pop' : '', 0.3, 2.5) + txt(x + 30, 108, n, { s: 14 }); });
      return svg(360, 135, b);
    },
    cp_payer: () => {
      let b = dot(45, 55, C.gris, 24) + txt(45, 60, '2 €') + txt(85, 63, '+', { s: 24 }) + dot(125, 55, C.gris, 24) + txt(125, 60, '2 €') + txt(165, 63, '+', { s: 24 }) + dot(205, 55, C.or, 19, 'pop') + txt(205, 60, '1 €') + txt(245, 63, '=', { s: 24 });
      b += box(262, 30, 76, 50, C.vert, 'pop', 0.3, 2.5) + txt(300, 63, '5 €', { s: 20 });
      return svg(360, 120, b + txt(300, 22, 'prix', { f: C.vert }) + txt(125, 106, '2 + 2 + 1 = 5', { s: 15 }));
    },
    cp_rendre: () => {
      let b = box(15, 28, 76, 42, C.rouge, '', 0.3, 2.5) + txt(53, 55, '10 €', { s: 15 }) + txt(112, 58, '−', { s: 24 }) + box(128, 30, 56, 40, C.vert, '', 0.3, 2.5) + txt(156, 56, '7 €', { s: 15 }) + txt(205, 58, '=', { s: 24 });
      [240, 275, 310].forEach((x) => { b += dot(x, 50, C.or, 15, 'pop') + txt(x, 54, '1 €', { s: 11 }); });
      return svg(360, 115, b + txt(53, 94, 'je donne') + txt(156, 94, 'prix') + txt(275, 94, 'on me rend', { f: C.or }));
    },
    cp_centimes: () => {
      let b = dot(48, 55, C.gris, 24) + txt(48, 60, '50 c', { s: 13 }) + txt(88, 62, '+', { s: 24 }) + dot(128, 55, C.gris, 24) + txt(128, 60, '50 c', { s: 13 }) + txt(172, 62, '=', { s: 24 }) + dot(225, 55, C.or, 30, 'pop') + txt(225, 61, '1 €', { s: 17 });
      return svg(360, 115, b + txt(180, 105, '100 centimes = 1 €', { f: C.brand }));
    },
  });

  K.COURSES.push(
    { id: 'cp-nombres', subj: 'maths', level: 'cp', icon: '🔢', title: 'Les nombres jusqu’à 100',
      intro: 'Dans la cour de récréation, dans ton cartable, partout il y a des nombres. Apprenons à compter jusqu’à 100 !',
      steps: [
        S('Compter des objets', 'Pour compter, on touche chaque objet <b>une seule fois</b> et on dit les nombres dans l’ordre : 1, 2, 3… Le dernier nombre dit est le <b>total</b>. Ici, il y a 10 billes.', 'cp_billes'),
        S('Dizaines et unités', 'On fait des paquets de 10 : une <b>dizaine</b> = 10 objets. Les objets tout seuls sont des <b>unités</b>. Le nombre 34, c’est 3 dizaines et 4 unités : 3 × 10 + 4.', 'cp_dizaines'),
        S('Lire et écrire les nombres', 'Il faut connaître les mots : vingt (20), trente (30), quarante (40), cinquante (50), soixante (60). Après 69 vient <b>soixante-dix</b> (70). Le nombre 80 se dit <b>quatre-vingts</b> et 90 se dit <b>quatre-vingt-dix</b>. Et 100 se dit <b>cent</b>.'),
        S('La file des nombres', 'Sur la droite graduée, les nombres avancent de 10 en 10 : 0, 10, 20, 30… jusqu’à 100. Plus on va vers la droite, plus le nombre est grand.', 'cp_droite100'),
        S('Avant et après', 'Le nombre <b>juste après</b> 39 est 40 : on ajoute 1. Le nombre <b>juste avant</b> 40 est 39 : on enlève 1. Après 69, on dit 70. Après 99, on dit 100.'),
      ],
      recap: ['Une dizaine = 10 unités.', '34 = 3 dizaines et 4 unités.', 'Le dernier nombre dit quand on compte est le total.', 'Après 69 vient 70, et après 99 vient 100.'],
      quiz: [Q('Combien de dizaines y a-t-il dans 47 ?', ['7', '4', '47'], 1), Q('Quel nombre vient juste après 59 ?', ['60', '58', '69'], 0), Q('Que vaut 5 dizaines et 2 unités ?', ['25', '7', '52'], 2)] },

    { id: 'cp-additions', subj: 'maths', level: 'cp', icon: '➕', title: 'Les additions',
      intro: 'Tu as 3 billes et un copain t’en donne 2. Combien en as-tu maintenant ? Pour le savoir, on additionne !',
      steps: [
        S('Réunir pour additionner', 'Additionner, c’est <b>réunir</b> deux groupes. 3 pommes et 2 pommes font 5 pommes : <b>3 + 2 = 5</b>. Le signe + se lit « plus » et le signe = se lit « égale ». Le résultat s’appelle la <b>somme</b>.', 'cp_reunir'),
        S('Avancer sur la file', 'Pour calculer 6 + 3, on part de 6 et on avance de 3 : 7, 8, 9. Donc <b>6 + 3 = 9</b>. Astuce : pour 2 + 7, on part du plus grand nombre, 7.', 'cp_saut'),
        S('Les paires de 10', 'À connaître par cœur : 1 + 9, 2 + 8, 3 + 7, 4 + 6 et 5 + 5 font tous <b>10</b>. Dans la boîte à 10 cases, il y a 7 billes et 3 cases vides : 7 + 3 = 10.', 'cp_dix'),
        S('Dizaines et unités', 'On additionne d’abord les unités, puis les dizaines. Pour 23 + 14 : 3 + 4 = 7 unités, 2 + 1 = 3 dizaines. Le résultat est <b>37</b>. Pour 30 + 20, on calcule 3 dizaines + 2 dizaines = 5 dizaines, donc 50.', 'cp_poser'),
        S('On peut changer l’ordre', '3 + 4 = 4 + 3 = 7. Quand on ajoute 0, le nombre ne change pas : 8 + 0 = 8. Ajouter 1, c’est passer au nombre suivant.'),
      ],
      recap: ['Additionner, c’est réunir deux groupes.', 'On peut ajouter en avançant sur la file des nombres.', 'Les paires de 10 : 3 + 7, 4 + 6, 5 + 5…', 'On additionne d’abord les unités, puis les dizaines.'],
      quiz: [Q('6 + 4 = ?', ['9', '10', '11'], 1), Q('4 + 9 = ?', ['12', '14', '13'], 2), Q('30 + 20 = ?', ['50', '5', '60'], 0)] },

    { id: 'cp-soustractions', subj: 'maths', level: 'cp', icon: '➖', title: 'Les soustractions',
      intro: 'Tu as 7 bonbons et tu en manges 3. Combien en reste-t-il ? Pour le savoir, on soustrait !',
      steps: [
        S('Enlever', 'Soustraire, c’est <b>enlever</b>. Il y a 7 oiseaux, 3 s’envolent : il en reste 4. On écrit <b>7 − 3 = 4</b>. Le signe − se lit « moins ». Le résultat s’appelle la <b>différence</b>.', 'cp_enlever'),
        S('Reculer sur la file', 'Pour calculer 9 − 4, on part de 9 et on recule de 4 : 8, 7, 6, 5. Donc <b>9 − 4 = 5</b>.', 'cp_recul'),
        S('Chercher l’écart', 'On peut aussi comparer deux groupes. Il y a 8 carrés bleus et 5 carrés orange : combien en plus ? L’<b>écart</b> est de 3. On calcule 8 − 5 = 3.', 'cp_ecart'),
        S('Addition et soustraction', 'Les deux vont ensemble ! Avec 3, 5 et 8 : 3 + 5 = 8, 5 + 3 = 8, 8 − 3 = 5 et 8 − 5 = 3. Pour trouver 8 − 5, tu peux chercher : 5 + ? = 8.', 'cp_famille'),
        S('Enlever des dizaines', '5 dizaines − 2 dizaines = 3 dizaines, donc <b>50 − 20 = 30</b>. Si on n’enlève rien, le nombre ne change pas : 6 − 0 = 6. Si on enlève tout, il reste 0 : 6 − 6 = 0.'),
      ],
      recap: ['Soustraire, c’est enlever.', 'Pour 9 − 4, on part de 9 et on recule de 4.', 'L’écart entre deux groupes se calcule avec une soustraction.', 'Addition et soustraction vont ensemble : 3 + 5 = 8 et 8 − 5 = 3.'],
      quiz: [Q('10 − 3 = ?', ['6', '7', '8'], 1), Q('50 − 20 = ?', ['70', '3', '30'], 2), Q('Si 4 + 6 = 10, alors 10 − 4 = ?', ['14', '6', '4'], 1)] },

    { id: 'cp-comparer', subj: 'maths', level: 'cp', icon: '⚖️', title: 'Comparer et ranger',
      intro: 'Qui a le plus de billes ? Qui a le moins de gâteaux ? Pour comparer des nombres, on utilise des signes spéciaux.',
      steps: [
        S('Plus que, moins que', 'Sur la figure, il y a 6 billes bleues et 4 billes orange. Le nombre 6 est <b>plus grand</b> que 4, et 4 est <b>plus petit</b> que 6.', 'cp_compare'),
        S('Les signes de comparaison', 'Le signe est comme une bouche qui s’ouvre vers le <b>plus grand</b> nombre. 12 &gt; 8 : 12 est plus grand que 8. 5 &lt; 9 : 5 est plus petit que 9. Si les deux nombres sont pareils, on écrit =.', 'cp_croco'),
        S('Comparer deux nombres à deux chiffres', 'On regarde d’abord les <b>dizaines</b>. Pour 47 et 52 : 4 dizaines contre 5 dizaines. Comme 4 &lt; 5, on a 47 &lt; 52. Si les dizaines sont pareilles, on regarde les unités : 63 &gt; 61.', 'cp_dizcomp'),
        S('Ranger les nombres', 'Dans l’<b>ordre croissant</b>, on range du plus petit au plus grand : 8, 15, 23, 41. Dans l’<b>ordre décroissant</b>, on range du plus grand au plus petit : 41, 23, 15, 8.', 'cp_rang'),
        S('Entre deux nombres', 'Un nombre peut se trouver <b>entre</b> deux autres : 34 est entre 30 et 40. Pour trouver le plus petit nombre d’une liste, on cherche celui qui a le moins de dizaines.'),
      ],
      recap: ['Le signe &gt; ou &lt; s’ouvre vers le plus grand nombre.', 'On compare d’abord les dizaines, puis les unités.', 'Ordre croissant : du plus petit au plus grand.', 'Ordre décroissant : du plus grand au plus petit.'],
      quiz: [Q('Quel signe met-on : 25 … 31 ?', ['&gt;', '&lt;', '='], 1), Q('Quel est le plus grand nombre ?', ['83', '38', '80'], 0), Q('Range du plus petit au plus grand : 9, 4, 7.', ['9, 7, 4', '7, 4, 9', '4, 7, 9'], 2)] },

    { id: 'cp-doubles', subj: 'maths', level: 'cp', icon: '🎲', title: 'Doubles et moitiés',
      intro: 'Deux dés identiques, un gâteau partagé en deux : les doubles et les moitiés sont partout !',
      steps: [
        S('Le double', 'Le <b>double</b> d’un nombre, c’est ce nombre ajouté à lui-même. Le double de 4, c’est 4 + 4 = 8. C’est comme deux dés qui ont chacun 4 points.', 'cp_double'),
        S('La table des doubles', 'À connaître par cœur : le double de 1 est 2, le double de 2 est 4, de 3 est 6, de 4 est 8 et de 5 est 10. Le double de 10 est 20.', 'cp_tabdouble'),
        S('La moitié', 'La <b>moitié</b>, c’est partager en <b>2 parts égales</b>. La moitié de 8, c’est 4, car 4 + 4 = 8. Chaque enfant reçoit autant de billes.', 'cp_moitie'),
        S('Doubles et moitiés', 'Ils vont ensemble. Le double de 5 est 10, donc la moitié de 10 est 5. La moitié de 6 est 3, car 3 + 3 = 6.'),
        S('Couper en deux parts égales', 'Un gâteau coupé en deux parts <b>égales</b> donne deux moitiés. Si une part est plus grande que l’autre, ce n’est pas la moitié !', 'cp_gateau'),
      ],
      recap: ['Le double de 4, c’est 4 + 4 = 8.', 'Le double de 5 est 10 et le double de 10 est 20.', 'La moitié, c’est partager en 2 parts égales.', 'Le double et la moitié sont le contraire l’un de l’autre.'],
      quiz: [Q('Quel est le double de 6 ?', ['8', '12', '10'], 1), Q('Quelle est la moitié de 10 ?', ['5', '20', '2'], 0), Q('Quelle est la moitié de 14 ?', ['28', '12', '7'], 2)] },

    { id: 'cp-formes', subj: 'maths', level: 'cp', icon: '🔷', title: 'Formes et solides',
      intro: 'Regarde autour de toi : une règle, un ballon, une boîte… Les objets ont des formes. Apprenons à les reconnaître !',
      steps: [
        S('Les formes planes', 'Sur une feuille, on dessine des formes planes : le <b>carré</b>, le <b>rectangle</b>, le <b>triangle</b> et le <b>disque</b>. Le disque est tout rond, il n’a pas de coins.', 'cp_formes'),
        S('Côtés et sommets', 'Un <b>côté</b> est un trait droit. Un <b>sommet</b> est un coin, là où deux côtés se rencontrent. Le triangle a 3 côtés et 3 sommets. Le carré a 4 côtés et 4 sommets.', 'cp_cotes'),
        S('Carré et rectangle', 'Le carré a 4 côtés <b>égaux</b>. Le rectangle a aussi 4 côtés et 4 coins droits, mais il a 2 côtés longs et 2 côtés courts.', 'cp_rect'),
        S('Les solides', 'Les objets qu’on peut tenir dans la main sont des <b>solides</b> : le cube (un dé), le pavé (une boîte de céréales), la boule (un ballon) et le cylindre (une boîte de conserve).', 'cp_solides'),
        S('Reconnaître les solides', 'La boule roule dans tous les sens. Le cylindre roule dans un seul sens. Le cube et le pavé ont des faces plates et ne roulent pas. Un cube a 6 faces carrées toutes pareilles.'),
      ],
      recap: ['Formes planes : carré, rectangle, triangle, disque.', 'Un côté est un trait droit, un sommet est un coin.', 'Le carré a 4 côtés égaux.', 'Solides : cube, pavé, boule, cylindre.'],
      quiz: [Q('Combien de côtés a un triangle ?', ['3', '4', '2'], 0), Q('Quel solide roule dans tous les sens ?', ['le cube', 'la boule', 'le pavé'], 1), Q('Quelle forme a 4 côtés égaux ?', ['le triangle', 'le disque', 'le carré'], 2)] },

    { id: 'cp-longueurs', subj: 'maths', level: 'cp', icon: '📏', title: 'Mesurer des longueurs',
      intro: 'Ton crayon est-il plus long que ton stylo ? Pour le savoir exactement, on le mesure avec une règle.',
      steps: [
        S('Comparer des longueurs', 'On compare deux objets en les posant l’un à côté de l’autre, bien alignés au départ. Le premier crayon est <b>le plus long</b>, le dernier est <b>le plus court</b>.', 'cp_crayons'),
        S('Le centimètre', 'Pour mesurer, on utilise une unité. Pour les petites longueurs, c’est le <b>centimètre</b>, qu’on écrit <b>cm</b>. Sur la règle, entre deux traits numérotés qui se suivent, il y a 1 cm.'),
        S('Bien placer la règle', 'On place le trait <b>0</b> au début de l’objet. On lit ensuite le nombre en face de la fin de l’objet. Ici, le crayon mesure 6 cm.', 'cp_regle'),
        S('Tracer un trait', 'Pour tracer un trait de 5 cm : on pose le 0 de la règle sur le point A, on repère le 5, on marque le point B, puis on trace de A à B.', 'cp_trace'),
        S('Le mètre', 'Pour les grandes longueurs (la classe, la cour), on utilise le <b>mètre</b>, qu’on écrit <b>m</b>. <b>1 m = 100 cm</b>. Une porte mesure environ 2 m.'),
      ],
      recap: ['On mesure une longueur avec une règle graduée en centimètres (cm).', 'On place le 0 au début de l’objet.', 'Le plus long a la plus grande mesure.', '1 m = 100 cm.'],
      quiz: [Q('Un crayon va du 0 au 8 sur la règle. Quelle est sa longueur ?', ['0 cm', '8 cm', '80 cm'], 1), Q('Où place-t-on le début de l’objet sur la règle ?', ['sur le 1', 'sur le 10', 'sur le 0'], 2), Q('Combien y a-t-il de cm dans 1 m ?', ['100 cm', '10 cm', '1 cm'], 0)] },

    { id: 'cp-heure', subj: 'maths', level: 'cp', icon: '🕒', title: 'Lire l’heure',
      intro: 'À quelle heure commence la classe ? À quelle heure sonne la récréation ? L’horloge nous le dit.',
      steps: [
        S('L’horloge', 'L’horloge a deux aiguilles. La <b>petite aiguille</b> montre les heures. La <b>grande aiguille</b> montre les minutes. Ici, la petite est sur le 4 et la grande sur le 12 : il est 4 h.', 'cp_horloge'),
        S('Les heures pile', 'Quand la grande aiguille est sur le <b>12</b>, c’est une heure pile. On lit le nombre montré par la petite aiguille : 3 h, 7 h…', 'cp_hpile'),
        S('La demi-heure', 'Quand la grande aiguille est sur le <b>6</b>, il est « et demie ». La petite aiguille est alors entre deux nombres. Sur la figure, il est 3 h 30 et 8 h 30. Une demi-heure, c’est 30 minutes.', 'cp_hdemi'),
        S('Les moments de la journée', 'Une journée a 24 heures. Le <b>matin</b>, on se lève et on va à l’école. L’<b>après-midi</b> commence à midi (12 h). Le <b>soir</b>, on dîne et on se couche. La <b>nuit</b>, on dort.', 'cp_jour'),
        S('Une heure, c’est 60 minutes', '1 heure = 60 minutes. Une demi-heure = 30 minutes. La grande aiguille fait un tour complet du cadran en 1 heure.'),
      ],
      recap: ['La petite aiguille montre les heures, la grande aiguille montre les minutes.', 'Grande aiguille sur le 12 : heure pile.', 'Grande aiguille sur le 6 : et demie, c’est 30 minutes.', '1 heure = 60 minutes.'],
      quiz: [Q('La petite aiguille est sur 7 et la grande sur 12. Quelle heure est-il ?', ['6 h', '7 h', '12 h'], 1), Q('La grande aiguille est sur le 6. Que dit-on ?', ['et demie', 'heure pile', 'midi'], 0), Q('Combien de minutes y a-t-il dans une demi-heure ?', ['60', '15', '30'], 2)] },

    { id: 'cp-monnaie', subj: 'maths', level: 'cp', icon: '💶', title: 'La monnaie : les euros',
      intro: 'À la boulangerie ou à la papeterie, on paie avec des pièces et des billets. En France, la monnaie s’appelle l’euro.',
      steps: [
        S('Pièces et billets', 'L’euro s’écrit <b>€</b>. Il y a des pièces (1 € et 2 €) et des billets (5 €, 10 € et 20 €). Une pièce de 2 € vaut autant que 2 pièces de 1 €.', 'cp_pieces'),
        S('Payer', 'Un cahier coûte 5 €. On peut payer avec 2 € + 2 € + 1 €, ou avec un billet de 5 €. Pour payer, on <b>additionne</b> les pièces et les billets.', 'cp_payer'),
        S('Rendre la monnaie', 'Tu donnes un billet de 10 € pour un jouet à 7 €. La marchande te rend 3 €, car <b>10 − 7 = 3</b>. Pour rendre la monnaie, on fait une soustraction.', 'cp_rendre'),
        S('Les centimes', 'Il existe aussi de petites pièces : les <b>centimes</b>. 100 centimes = 1 €. Deux pièces de 50 centimes font 1 €.', 'cp_centimes'),
        S('Comparer des prix', 'Une gomme à 2 € est moins chère qu’un stylo à 3 € : 2 &lt; 3. Avec 5 €, on peut acheter les deux, car 2 + 3 = 5.'),
      ],
      recap: ['L’euro s’écrit €.', 'Pièces : 1 € et 2 €. Billets : 5 €, 10 € et 20 €.', 'Pour payer, on additionne. Pour rendre la monnaie, on soustrait.', '100 centimes = 1 €.'],
      quiz: [Q('Combien font 2 € + 2 € + 1 € ?', ['4 €', '6 €', '5 €'], 2), Q('Je donne 10 € pour un objet à 6 €. Combien me rend-on ?', ['4 €', '16 €', '6 €'], 0), Q('Combien de centimes y a-t-il dans 1 € ?', ['10', '100', '1'], 1)] },
  );
})();
