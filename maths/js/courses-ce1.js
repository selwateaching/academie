/* Cours illustrés : CE1 (7-8 ans). Contenu en français ; l'audio utilise la voix du navigateur. */
(function () {
  'use strict';
  const K = window.CourseKit, { F, C, svg, L, ARROW, S, Q, FIG } = K;
  // T local : accepte font-size dans les attributs (sinon 13)
  const T = (x, y, s, o = '') => { const m = /font-size="([\d.]+)"/.exec(o); return `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-size="${m ? m[1] : 13}" font-weight="700" text-anchor="middle" ${o.replace(/font-size="[\d.]+"/, '')}>${s}</text>`; };

  // ---------- petits outils de dessin ----------
  const R = (x, y, w, h, c, o = '', op = '.2') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c}" fill-opacity="${op}" stroke="${c}" stroke-width="2.5" ${o}/>`;
  const D = (x, y, c, r = 6, o = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="none" ${o}/>`;
  const pt = (cx, cy, r, deg) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];
  // coin d'angle droit en (x,y), dx et dy valent +1 ou -1
  const corner = (x, y, dx, dy, c = C.vert, s = 12) => `<path d="M${x + dx * s} ${y}L${x + dx * s} ${y + dy * s}L${x} ${y + dy * s}" stroke="${c}" stroke-width="2.5"/>`;
  // horloge : centre, rayon, heures, minutes
  const clock = (cx, cy, r, h, m) => {
    let b = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.or}" fill-opacity=".1" stroke="currentColor" stroke-width="3"/>`;
    for (let i = 0; i < 12; i++) { const [x1, y1] = pt(cx, cy, r - 1, i * 30), [x2, y2] = pt(cx, cy, r - (i % 3 ? 6 : 10), i * 30); b += L(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1), 'currentColor', i % 3 ? 1.5 : 2.5); }
    const fs = Math.max(9, Math.round(r * 0.22));
    b += T(cx, cy - r + 10 + fs, '12', `font-size="${fs}"`) + T(cx + r - 12 - fs / 2, cy + fs / 3, '3', `font-size="${fs}"`) + T(cx, cy + r - 12, '6', `font-size="${fs}"`) + T(cx - r + 12 + fs / 2, cy + fs / 3, '9', `font-size="${fs}"`);
    const [hx, hy] = pt(cx, cy, r * 0.5, ((h % 12) + m / 60) * 30), [mx, my] = pt(cx, cy, r * 0.76, m * 6);
    b += L(cx, cy, hx.toFixed(1), hy.toFixed(1), C.bleu, 4.5) + L(cx, cy, mx.toFixed(1), my.toFixed(1), C.rouge, 3) + D(cx, cy, 'currentColor', 3.5);
    return b;
  };
  // opération posée : colonnes des unités (x=190), dizaines (150), centaines (110)
  const posed = (op, a, b, r, extra, notes) => {
    const n = Math.max(a.length, b.length, r.length), X = (i) => 190 - 40 * i, tint = [C.or, C.bleu, C.vert];
    let s = '';
    for (let i = 0; i < n; i++) s += `<rect x="${X(i) - 20}" y="12" width="40" height="150" rx="8" fill="${tint[i]}" fill-opacity=".13" stroke="none"/>`;
    const row = (str, y, c) => [...str].reverse().map((ch, i) => T(X(i), y, ch, `font-size="30" fill="${c}"`)).join('');
    const sx = X(n - 1) - 40;
    s += row(a, 66, 'currentColor') + row(b, 100, 'currentColor') + T(sx, 100, op, 'font-size="30"') + L(sx - 14, 112, 210, 112, 'currentColor', 3) + row(r, 146, C.vert);
    s += extra || '';
    (notes || []).forEach((t, i) => { s += T(285, 62 + i * 30, t, `font-size="13" fill="${[C.bleu, C.or, C.vert][i]}"`); });
    return svg(360, 170, s);
  };
  const small = (x, y, s, c = C.rouge, o = '') => T(x, y, s, `font-size="17" fill="${c}" ${o}`);

  Object.assign(FIG, {
    /* ------------------------------------------------ nombres */
    ce1_blocs: () => {
      let b = '';
      [14, 64].forEach((x) => { b += R(x, 18, 44, 44, C.brand) + T(x + 22, 46, '100', `font-size="14" fill="${C.brand}"`); });
      [140, 158, 176].forEach((x) => { b += R(x, 18, 12, 44, C.bleu, 'class="pop"'); });
      [[254, 30], [270, 30], [254, 46], [270, 46]].forEach(([x, y]) => { b += D(x, y, C.or, 6.5); });
      b += T(122, 48, '+', 'font-size="22"') + T(210, 48, '+', 'font-size="22"');
      b += T(61, 84, '200', 'font-size="16"') + T(61, 102, 'centaines', `font-size="12" fill="${C.brand}"`);
      b += T(158, 84, '30', 'font-size="16"') + T(158, 102, 'dizaines', `font-size="12" fill="${C.bleu}"`);
      b += T(262, 84, '4', 'font-size="16"') + T(262, 102, 'unités', `font-size="12" fill="${C.or}"`);
      b += T(180, 138, '200 + 30 + 4 = 234', `font-size="17" fill="${C.vert}" class="pop"`);
      return svg(360, 150, b);
    },
    ce1_cdu: () => {
      let b = '';
      [[24, 'centaines', C.brand, '3', '300'], [132, 'dizaines', C.bleu, '4', '40'], [240, 'unités', C.or, '5', '5']].forEach(([x, n, c, d, v]) => {
        b += R(x, 12, 96, 28, c, '', '.3') + T(x + 48, 31, n, `font-size="14" fill="${c}"`);
        b += R(x, 40, 96, 54, c, '', '.08') + T(x + 48, 80, d, `font-size="38" fill="${c}" class="pop"`);
        b += T(x + 48, 116, v, `font-size="15" fill="${c}"`);
      });
      b += T(180, 142, '300 + 40 + 5 = 345', `font-size="16" fill="${C.vert}"`);
      return svg(360, 154, b);
    },
    ce1_droite: () => {
      let b = ARROW('ce1ar1', 'currentColor') + `<line x1="14" y1="74" x2="348" y2="74" stroke="currentColor" stroke-width="3" marker-end="url(#ce1ar1)"/>`;
      for (let i = 0; i <= 5; i++) b += L(30 + i * 60, 66, 30 + i * 60, 82, 'currentColor', 2) + T(30 + i * 60, 100, i * 100, 'font-size="11"');
      b += `<circle cx="150" cy="74" r="8" fill="${C.bleu}"/>${T(150, 56, '200', `fill="${C.bleu}"`)}<circle class="pop" cx="270" cy="74" r="8" fill="${C.or}"/>${T(270, 56, '400', `fill="${C.or}"`)}`;
      b += T(180, 24, '200 &lt; 400', 'font-size="18"') + T(180, 132, 'plus à droite = plus grand', `font-size="12" fill="${C.vert}" class="pulse"`);
      return svg(360, 148, b);
    },

    /* ------------------------------------------------ additions */
    ce1_add1: () => posed('+', '34', '25', '59', '', ['4 + 5 = 9', '3 + 2 = 5']),
    ce1_retenue: () => posed('+', '47', '38', '85', small(150, 42, '1', C.rouge, 'class="pulse"'), ['7 + 8 = 15', 'j’écris 5', 'je retiens 1']),
    ce1_add3: () => posed('+', '126', '235', '361', small(150, 42, '1', C.rouge, 'class="pulse"'), ['6 + 5 = 11', '2 + 3 + 1 = 6', '1 + 2 = 3']),

    /* ------------------------------------------------ soustractions */
    ce1_billes: () => {
      let b = '';
      for (let i = 0; i < 12; i++) {
        const x = 70 + (i % 6) * 40, y = 30 + Math.floor(i / 6) * 38, out = i >= 7;
        b += `<circle cx="${x}" cy="${y}" r="13" fill="${out ? C.gris : C.bleu}" fill-opacity="${out ? '.2' : '.7'}" stroke="${out ? C.gris : C.bleu}" stroke-width="2.5"/>`;
        if (out) b += `<g class="pulse">${L(x - 9, y - 9, x + 9, y + 9, C.rouge, 3)}${L(x - 9, y + 9, x + 9, y - 9, C.rouge, 3)}</g>`;
      }
      b += T(180, 112, '12 − 5 = 7', `font-size="22" fill="${C.vert}" class="pop"`) + T(180, 140, 'on enlève 5 billes', `font-size="12" fill="${C.gris}"`);
      return svg(360, 152, b);
    },
    ce1_sous1: () => posed('−', '58', '23', '35', '', ['8 − 3 = 5', '5 − 2 = 3']),
    ce1_sous2: () => posed('−', '52', '27', '25', small(172, 50, '1', C.rouge, 'class="pulse"') + small(130, 98, '1', C.rouge, 'class="pulse"'), ['12 − 7 = 5', '2 + 1 = 3', '5 − 3 = 2']),

    /* ------------------------------------------------ tables */
    ce1_t2: () => {
      let b = '';
      for (let i = 0; i < 5; i++) {
        const x = 40 + i * 70, c = i % 2 ? C.or : C.bleu;
        b += `<rect x="${x - 26}" y="22" width="52" height="40" rx="20" fill="${c}" fill-opacity=".15" stroke="${c}" stroke-width="2"/>` + D(x - 11, 42, c, 8) + D(x + 11, 42, c, 8);
        b += T(x, 90, (i + 1) * 2, `font-size="18" fill="${c}"`);
      }
      b += T(180, 126, '2 + 2 + 2 + 2 + 2 = 10', 'font-size="14"') + T(180, 152, '5 × 2 = 10', `font-size="20" fill="${C.vert}" class="pop"`);
      return svg(360, 164, b);
    },
    ce1_t5: () => {
      const X = (v) => 20 + v * 6.4;
      let b = L(14, 80, 346, 80, 'currentColor', 3);
      for (let v = 0; v <= 50; v += 5) b += L(X(v), 74, X(v), 86, 'currentColor', 2) + T(X(v), 104, v, 'font-size="10.5"');
      for (let v = 0; v < 50; v += 5) {
        const c = (v / 5) % 2 ? C.or : C.bleu, x1 = X(v), x2 = X(v + 5);
        b += `<path class="draw" pathLength="100" d="M${x1} 76Q${(x1 + x2) / 2} 34 ${x2} 76" stroke="${c}" stroke-width="3"/>` + T((x1 + x2) / 2, 46, '+5', `font-size="10.5" fill="${c}"`);
      }
      b += T(180, 134, '5, 10, 15, 20 … 50', 'font-size="14"') + T(180, 158, 'finit par 0 ou 5', `font-size="13" fill="${C.vert}" class="pulse"`);
      return svg(360, 170, b);
    },
    ce1_t10: () => {
      let b = '';
      for (let k = 0; k < 4; k++) {
        const x = 30 + k * 44;
        b += R(x, 20, 28, 100, C.bleu, 'class="pop"', '.15');
        for (let j = 1; j < 10; j++) b += L(x, 20 + j * 10, x + 28, 20 + j * 10, C.bleu, 1);
      }
      b += T(270, 52, '4 × 10', 'font-size="20"') + T(270, 84, '= 40', `font-size="22" fill="${C.vert}"`) + T(270, 112, 'un 0 à la fin', `font-size="12" fill="${C.rouge}" class="pulse"`);
      return svg(360, 138, b);
    },
    ce1_tab: () => {
      let b = '', ys = 12;
      const rows = [[2, C.bleu], [5, C.or], [10, C.vert]];
      b += T(44, 32, '×', 'font-size="18"');
      for (let j = 1; j <= 5; j++) b += T(102 + 56 * (j - 1), 32, j, 'font-size="15"');
      rows.forEach(([n, c], i) => {
        const y = 46 + i * 36;
        b += R(14, y, 60, 30, c, '', '.35') + T(44, y + 21, '× ' + n, `font-size="15" fill="${c}"`);
        for (let j = 1; j <= 5; j++) b += R(76 + 56 * (j - 1), y, 52, 30, c, '', '.08') + T(102 + 56 * (j - 1), y + 21, n * j, `font-size="15" fill="${c}"` + (n * j === 10 ? ' class="pop"' : ''));
      });
      return svg(360, 160, b);
    },

    /* ------------------------------------------------ multiplication */
    ce1_groupes: () => {
      let b = '';
      for (let i = 0; i < 4; i++) {
        const x = 55 + i * 83;
        b += `<circle cx="${x}" cy="52" r="32" fill="${C.bleu}" fill-opacity=".12" stroke="${C.bleu}" stroke-width="2.5"/>` + D(x, 40, C.or, 7, 'class="pop"') + D(x - 11, 62, C.or, 7, 'class="pop"') + D(x + 11, 62, C.or, 7, 'class="pop"');
      }
      b += T(180, 114, '3 + 3 + 3 + 3 = 12', 'font-size="17"') + T(180, 146, '4 × 3 = 12', `font-size="22" fill="${C.vert}" class="pop"`);
      return svg(360, 158, b);
    },
    ce1_tableau: () => {
      let b = ARROW('ce1ar3', C.rouge) + ARROW('ce1ar4', C.bleu);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b += D(90 + c * 30, 50 + r * 30, (r + c) % 2 ? C.or : C.brand, 10);
      b += `<line x1="70" y1="26" x2="200" y2="26" stroke="${C.rouge}" stroke-width="2.5" marker-end="url(#ce1ar3)"/>` + T(135, 16, '4 colonnes', `font-size="12" fill="${C.rouge}"`);
      b += `<line x1="222" y1="34" x2="222" y2="116" stroke="${C.bleu}" stroke-width="2.5" marker-end="url(#ce1ar4)"/>` + T(285, 80, '3 lignes', `font-size="13" fill="${C.bleu}"`);
      b += T(135, 148, '3 × 4 = 12', `font-size="20" fill="${C.vert}" class="pop"`);
      return svg(360, 160, b);
    },
    ce1_commut: () => {
      let b = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b += D(30 + c * 24, 34 + r * 24, C.bleu, 8);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) b += D(238 + c * 24, 28 + r * 24, C.or, 8);
      b += T(180, 74, '=', `font-size="34" fill="${C.vert}" class="pop"`) + T(66, 114, '3 × 4', 'font-size="18"') + T(262, 130, '4 × 3', 'font-size="18"') + T(180, 100, '12', `font-size="18" fill="${C.vert}"`);
      return svg(360, 146, b);
    },

    /* ------------------------------------------------ géométrie */
    ce1_angle: () => svg(360, 150, `
      <path d="M60 20V112H150" stroke="${C.bleu}" stroke-width="5"/>${corner(60, 112, 1, -1, C.rouge, 18).replace('stroke-width="2.5"', 'stroke-width="3" class="pulse"')}
      <path d="M220 112H320M220 112L300 52" stroke="${C.gris}" stroke-width="5"/><path d="M252 112A32 32 0 0 0 246 94" stroke="${C.gris}" stroke-width="2.5"/>
      ${T(105, 138, 'angle droit', `fill="${C.bleu}"`)}${T(270, 138, 'pas droit', `fill="${C.gris}"`)}`),
    ce1_equerre: () => svg(360, 150, `
      ${R(24, 16, 150, 118, C.gris, '', '.08')}
      <path class="pop" d="M24 134H134V52Z" fill="${C.brand}" fill-opacity=".25" stroke="${C.brand}" stroke-width="3"/>${corner(24, 134, 1, -1, C.rouge, 20)}
      ${T(262, 56, 'l’équerre', `font-size="17" fill="${C.brand}"`)}${T(262, 84, 'dans le coin :', 'font-size="12"')}${T(262, 106, 'ça colle = droit', `font-size="12" fill="${C.vert}" class="pulse"`)}`),
    ce1_carre: () => {
      let b = R(130, 20, 100, 100, C.bleu, '', '.12');
      [[130, 20, 1, 1], [230, 20, -1, 1], [130, 120, 1, -1], [230, 120, -1, -1]].forEach(([x, y, dx, dy]) => { b += corner(x, y, dx, dy); });
      [[180, 15, 180, 25], [180, 115, 180, 125], [125, 70, 135, 70], [225, 70, 235, 70]].forEach(([a, c, d, e]) => { b += L(a, c, d, e, C.rouge, 3); });
      b += T(66, 66, '4 côtés', `font-size="14" fill="${C.rouge}"`) + T(66, 86, 'égaux', `font-size="14" fill="${C.rouge}"`);
      b += T(300, 66, '4 angles', `font-size="14" fill="${C.vert}"`) + T(300, 86, 'droits', `font-size="14" fill="${C.vert}"`);
      b += `<rect class="draw" pathLength="100" x="130" y="20" width="100" height="100" stroke="${C.bleu}" stroke-width="4"/>`;
      return svg(360, 140, b);
    },
    ce1_rect: () => {
      let b = R(100, 34, 160, 80, C.or, '', '.12');
      [[100, 34, 1, 1], [260, 34, -1, 1], [100, 114, 1, -1], [260, 114, -1, -1]].forEach(([x, y, dx, dy]) => { b += corner(x, y, dx, dy); });
      [[180, 29, 180, 39], [180, 109, 180, 119]].forEach(([a, c, d, e]) => { b += L(a, c, d, e, C.rouge, 3); });
      [[95, 74], [255, 74]].forEach(([x, y]) => { b += L(x, y - 6, x + 10, y - 6, C.bleu, 3) + L(x, y + 6, x + 10, y + 6, C.bleu, 3); });
      b += T(180, 22, 'longueur', `font-size="13" fill="${C.rouge}"`) + T(312, 78, 'largeur', `font-size="13" fill="${C.bleu}"`);
      b += T(180, 142, 'côtés opposés égaux', `font-size="12" class="pulse"`);
      return svg(360, 152, b);
    },
    ce1_quad: () => {
      let b = '';
      for (let i = 0; i <= 10; i++) b += L(60 + i * 24, 16, 60 + i * 24, 136, C.gris, 1).replace('/>', ' opacity=".4"/>');
      for (let j = 0; j <= 5; j++) b += L(60, 16 + j * 24, 300, 16 + j * 24, C.gris, 1).replace('/>', ' opacity=".4"/>');
      b += `<rect class="draw" pathLength="100" x="84" y="40" width="120" height="72" fill="${C.vert}" fill-opacity=".2" stroke="${C.vert}" stroke-width="4"/>`;
      b += T(144, 32, '5 carreaux', `font-size="12" fill="${C.rouge}"`) + T(252, 80, '3 carreaux', `font-size="12" fill="${C.bleu}"`);
      return svg(360, 150, b);
    },

    /* ------------------------------------------------ mesures */
    ce1_regle: () => {
      let b = R(20, 70, 320, 38, C.or, '', '.15');
      for (let i = 0; i <= 10; i++) {
        b += L(30 + i * 30, 70, 30 + i * 30, 86, 'currentColor', 2) + T(30 + i * 30, 101, i, 'font-size="11"');
        if (i < 10) b += L(45 + i * 30, 70, 45 + i * 30, 78, 'currentColor', 1.5);
      }
      b += `<rect x="30" y="34" width="185" height="24" fill="${C.or}" fill-opacity=".55" stroke="${C.or}" stroke-width="2.5"/><rect x="30" y="34" width="16" height="24" fill="${C.rouge}" fill-opacity=".6" stroke="${C.rouge}" stroke-width="2.5"/><path d="M215 34L242 46L215 58Z" fill="#fcd9a8" stroke="${C.or}" stroke-width="2.5"/>${D(242, 46, C.gris, 3)}`;
      b += `<line class="dash" x1="242" y1="52" x2="242" y2="70" stroke="${C.rouge}" stroke-width="2.5"/><line class="dash" x1="30" y1="52" x2="30" y2="70" stroke="${C.rouge}" stroke-width="2.5"/>`;
      b += T(242, 24, '7 cm', `font-size="16" fill="${C.rouge}" class="pop"`) + T(180, 134, 'on commence à 0', `font-size="12" fill="${C.gris}"`);
      return svg(360, 146, b);
    },
    ce1_metre: () => {
      let b = '';
      for (let i = 0; i < 10; i++) b += R(20 + i * 32, 52, 32, 32, i % 2 ? C.or : C.bleu, '', '.25') + T(36 + i * 32, 73, 10, 'font-size="11"');
      b += T(180, 30, '1 m = 100 cm', `font-size="19" fill="${C.vert}" class="pop"`) + T(180, 112, '10 morceaux de 10 cm', 'font-size="12"');
      b += `<path class="draw" pathLength="100" d="M20 92V98H340V92" stroke="${C.rouge}" stroke-width="3"/>`;
      return svg(360, 128, b);
    },
    ce1_balance: () => svg(360, 150, `
      ${L(180, 52, 180, 124)}${L(140, 124, 220, 124, 'currentColor', 5)}${L(60, 52, 300, 52, 'currentColor', 4)}<path d="M170 52L190 52L180 38Z" fill="currentColor"/>
      ${L(60, 52, 30, 96, C.gris, 1.5)}${L(60, 52, 90, 96, C.gris, 1.5)}${L(300, 52, 270, 96, C.gris, 1.5)}${L(300, 52, 330, 96, C.gris, 1.5)}
      ${L(24, 96, 96, 96, C.gris, 4)}${L(264, 96, 336, 96, C.gris, 4)}
      ${R(34, 66, 52, 30, C.bleu, '', '.3')}${T(60, 86, '1 kg', 'font-size="13"')}${R(274, 66, 52, 30, C.or, '', '.3')}${T(300, 86, '1 000 g', 'font-size="12"')}
      ${T(180, 24, '1 kg = 1 000 g', `font-size="18" fill="${C.vert}" class="pop"`)}`),
    ce1_litre: () => {
      let b = R(60, 56, 44, 76, C.bleu, '', '.35') + R(72, 32, 20, 26, C.bleu, '', '.35') + T(82, 100, '1 L', 'font-size="16"');
      b += `<path d="M190 40V132H262V40" stroke="currentColor" stroke-width="3"/><path d="M262 60Q290 60 290 86Q290 108 262 108" stroke="currentColor" stroke-width="3"/>`;
      b += `<rect class="pulse" x="192" y="70" width="68" height="60" fill="${C.bleu}" fill-opacity=".45" stroke="none"/>`;
      [[100, '1 L'], [70, '2 L'], [40, '3 L']].forEach(([y, t]) => { b += L(190, y, 204, y, 'currentColor', 2) + T(226, y + 4, t, 'font-size="11"'); });
      b += T(82, 154, '1 litre', `font-size="13" fill="${C.bleu}"`) + T(226, 154, '2 litres', `font-size="13" fill="${C.bleu}"`);
      return svg(360, 164, b);
    },

    /* ------------------------------------------------ heure */
    ce1_horloge: () => svg(360, 164, `${clock(100, 82, 64, 3, 0)}
      ${L(196, 40, 214, 40, C.bleu, 5)}${T(278, 44, 'petite aiguille', `font-size="14" fill="${C.bleu}"`)}${T(278, 62, '= les heures', 'font-size="12"')}
      ${L(196, 96, 214, 96, C.rouge, 3)}${T(278, 100, 'grande aiguille', `font-size="14" fill="${C.rouge}"`)}${T(278, 118, '= les minutes', 'font-size="12"')}
      ${T(278, 150, '3 h', `font-size="20" fill="${C.vert}" class="pop"`)}`),
    ce1_trois: () => {
      let b = '';
      [[45, 3, 0, '3 h', 'pile'], [135, 3, 15, '3 h 15', 'et quart'], [225, 3, 30, '3 h 30', 'et demie'], [315, 3, 45, '3 h 45', 'moins le quart']].forEach(([x, h, m, t, s], i) => {
        b += clock(x, 50, 36, h, m) + T(x, 112, t, `font-size="14" fill="${[C.brand, C.bleu, C.or, C.vert][i]}"`) + T(x, 130, s, 'font-size="10.5"');
      });
      return svg(360, 142, b);
    },
    ce1_heure60: () => {
      let b = '';
      const cx = 100, cy = 82, r = 58, cols = [C.brand, C.bleu, C.vert, C.or];
      for (let k = 0; k < 4; k++) {
        const [x1, y1] = pt(cx, cy, r, k * 90), [x2, y2] = pt(cx, cy, r, k * 90 + 90), [lx, ly] = pt(cx, cy, r * 0.62, k * 90 + 45);
        b += `<path d="M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z" fill="${cols[k]}" fill-opacity=".3" stroke="${cols[k]}" stroke-width="2.5"/>` + T(lx.toFixed(1), (ly + 5).toFixed(1), 15 * (k + 1), 'font-size="14"');
      }
      b += L(cx, cy, cx, cy - r + 4, C.rouge, 3.5) + D(cx, cy, 'currentColor', 4);
      b += T(272, 30, '1 heure', `font-size="15" fill="${C.brand}" class="pop"`) + T(272, 50, '= 60 minutes', 'font-size="13"');
      b += T(272, 84, 'demi-heure', `font-size="14" fill="${C.vert}"`) + T(272, 104, '= 30 minutes', 'font-size="13"');
      b += T(272, 134, 'quart d’heure', `font-size="14" fill="${C.bleu}"`) + T(272, 154, '= 15 minutes', 'font-size="13"');
      return svg(360, 164, b);
    },
    ce1_duree: () => {
      let b = L(30, 84, 330, 84, 'currentColor', 3);
      for (let i = 0; i < 5; i++) b += D(40 + i * 70, 84, i <= 3 ? C.brand : C.gris, 7) + T(40 + i * 70, 112, `${8 + i} h`, 'font-size="14"');
      b += `<path class="draw" pathLength="100" d="M40 74Q145 14 250 74" stroke="${C.rouge}" stroke-width="4"/>` + T(145, 34, '3 heures', `font-size="17" fill="${C.rouge}" class="pop"`);
      b += T(180, 144, 'de 8 h à 11 h', `font-size="13" fill="${C.gris}"`);
      return svg(360, 156, b);
    },

    /* ------------------------------------------------ problèmes */
    ce1_etapes: () => {
      let b = ARROW('ce1ar2', C.brand);
      ['Je lis', 'Je cherche', 'Je calcule', 'Je réponds'].forEach((t, i) => {
        const x = 8 + i * 88, c = [C.bleu, C.or, C.vert, C.brand][i];
        b += R(x + 2, 48, 72, 46, c, '', '.18') + T(x + 38, 76, t, `font-size="12" fill="${c}"`) + D(x + 38, 34, c, 12) + T(x + 38, 39, i + 1, 'font-size="14" fill="#fff"');
        if (i < 3) b += `<line x1="${x + 77}" y1="71" x2="${x + 87}" y2="71" stroke="${C.brand}" stroke-width="2.5" marker-end="url(#ce1ar2)"/>`;
      });
      b += T(180, 128, 'puis je vérifie', `font-size="14" fill="${C.rouge}" class="pulse"`);
      return svg(360, 144, b);
    },
    ce1_schema: () => {
      let b = R(40, 50, 168, 36, C.bleu, '', '.25') + R(208, 50, 112, 36, C.or, '', '.25') + T(124, 74, 9, 'font-size="18"') + T(264, 74, 6, 'font-size="18"');
      b += `<path d="M40 44V36H320V44" stroke="${C.vert}" stroke-width="3"/>` + T(180, 26, '? en tout', `font-size="15" fill="${C.vert}" class="pulse"`);
      b += T(124, 108, 'avant', 'font-size="12"') + T(264, 108, 'gagnées', 'font-size="12"') + T(180, 140, '9 + 6 = 15', `font-size="20" fill="${C.vert}" class="pop"`);
      return svg(360, 152, b);
    },
    ce1_mots: () => {
      let b = '';
      [['en tout', '+', C.vert], ['il reste', '−', C.rouge], ['paquets de', '×', C.bleu]].forEach(([t, s, c], i) => {
        const y = 14 + i * 44;
        b += R(24, y, 140, 34, c, '', '.15') + T(94, y + 22, t, `font-size="14" fill="${c}"`) + L(176, y + 17, 214, y + 17, c, 3) + `<path d="M208 ${y + 10}L216 ${y + 17}L208 ${y + 24}" stroke="${c}" stroke-width="3"/>` + T(270, y + 28, s, `font-size="32" fill="${c}"` + (i === 0 ? ' class="pop"' : ''));
      });
      return svg(360, 148, b);
    },
  });

  K.COURSES.push(
    /* ---------------------------------------------------------------- 1 */
    { id: 'ce1-nombres', subj: 'maths', level: 'ce1', icon: '🔢', title: 'Les nombres jusqu’à 1 000',
      intro: 'Tu sais compter jusqu’à 100. Maintenant, tu vas aller jusqu’à 1 000 avec les unités, les dizaines et les centaines !',
      steps: [
        S('Unités, dizaines, centaines', 'Une bille seule, c’est une <b>unité</b>. Un paquet de 10 billes, c’est une <b>dizaine</b>. <b>10 dizaines</b> font une <b>centaine</b> (100). Sur la figure : 2 centaines, 3 dizaines et 4 unités font 234.', 'ce1_blocs'),
        S('Le tableau des nombres', 'Chaque chiffre a une place. Dans <b>345</b> : le 3 est le chiffre des centaines (300), le 4 celui des dizaines (40) et le 5 celui des unités (5). On écrit 345 = 300 + 40 + 5.', 'ce1_cdu'),
        S('Lire et écrire', '345 se lit « trois cent quarante-cinq ». Attention : <b>200</b> s’écrit « deux cent<b>s</b> », mais <b>245</b> s’écrit « deux cent quarante-cinq » (sans s). Et 10 centaines font <b>1 000</b> (mille).'),
        S('Comparer les nombres', 'On compare d’abord les <b>centaines</b>, puis les dizaines, puis les unités. 410 &gt; 398 car 4 centaines, c’est plus que 3 centaines. Sur la droite graduée, le plus grand nombre est le plus à droite : 200 &lt; 400.', 'ce1_droite'),
        S('Compter de 10 en 10 et de 100 en 100', 'De 10 en 10 : 250, 260, 270, 280… Seul le chiffre des dizaines change. De 100 en 100 : 300, 400, 500, 600… Seul le chiffre des centaines change.'),
      ],
      recap: ['10 unités = 1 dizaine ; 10 dizaines = 1 centaine ; 10 centaines = 1 000.', 'Dans 345 : 3 centaines, 4 dizaines, 5 unités.', 'Pour comparer, on regarde d’abord les centaines.', 'Le nombre le plus à droite sur la droite graduée est le plus grand.'],
      quiz: [Q('Dans 507, quel est le chiffre des dizaines ?', ['5', '0', '7'], 1), Q('Quel nombre est le plus grand ?', ['398', '309', '410'], 2), Q('300 + 40 + 5 = ?', ['345', '3 405', '354'], 0)] },

    /* ---------------------------------------------------------------- 2 */
    { id: 'ce1-additions', subj: 'maths', level: 'ce1', icon: '➕', title: 'Les additions posées',
      intro: 'Pour additionner de grands nombres, on les pose l’un sous l’autre. C’est facile si on range bien les chiffres !',
      steps: [
        S('Bien poser l’addition', 'On écrit les nombres l’un sous l’autre : <b>unités sous unités</b>, <b>dizaines sous dizaines</b>. On met le signe <b>+</b> et un trait. On calcule toujours en commençant par la <b>droite</b> : les unités.', 'ce1_add1'),
        S('Un exemple : 34 + 25', 'Les unités : 4 + 5 = 9. Les dizaines : 3 + 2 = 5. Le résultat est <b>59</b>.'),
        S('La retenue', 'Pour 47 + 38, les unités font 7 + 8 = <b>15</b>. Je ne peux pas écrire 15 dans une seule colonne. J’écris <b>5</b> et je <b>retiens 1</b> dizaine, que j’ajoute aux dizaines : 4 + 3 + 1 = 8. Le résultat est <b>85</b>.', 'ce1_retenue'),
        S('Avec des centaines', 'Pour 126 + 235 : unités 6 + 5 = 11, j’écris 1 et je retiens 1. Dizaines : 2 + 3 + 1 = 6. Centaines : 1 + 2 = 3. Le résultat est <b>361</b>.', 'ce1_add3'),
        S('Vérifier son résultat', 'On peut changer l’ordre : 5 + 7 = 7 + 5. On peut aussi faire un calcul rapide : 47 + 38 est proche de 50 + 40 = 90, donc 85 est un bon résultat.'),
      ],
      recap: ['Unités sous unités, dizaines sous dizaines.', 'On commence par la colonne de droite.', 'Si une colonne dépasse 9, on écrit le chiffre des unités et on retient 1.', 'On ajoute la retenue à la colonne suivante.'],
      quiz: [Q('23 + 45 = ?', ['58', '68', '78'], 1), Q('Pour 6 + 7 = 13 dans la colonne des unités, j’écris…', ['13 et je retiens 0', '3 et je retiens 1', '1 et je retiens 3'], 1), Q('48 + 27 = ?', ['65', '75', '85'], 1)] },

    /* ---------------------------------------------------------------- 3 */
    { id: 'ce1-soustractions', subj: 'maths', level: 'ce1', icon: '➖', title: 'Les soustractions posées',
      intro: 'Soustraire, c’est enlever. On peut aussi poser la soustraction pour trouver ce qu’il reste.',
      steps: [
        S('Soustraire, c’est enlever', 'J’ai 12 billes et j’en perds 5. Il m’en reste 7. On écrit 12 − 5 = 7. Le résultat d’une soustraction s’appelle la <b>différence</b>.', 'ce1_billes'),
        S('Poser sans retenue', 'On écrit le grand nombre en haut, le petit en dessous, unités sous unités. Pour 58 − 23 : unités 8 − 3 = 5, dizaines 5 − 2 = 3. Le résultat est <b>35</b>.', 'ce1_sous1'),
        S('La retenue en soustraction', 'Pour 52 − 27, on ne peut pas faire 2 − 7. Alors on ajoute <b>10</b> aux unités : 12 − 7 = 5. Pour garder le même résultat, on ajoute <b>1</b> dizaine en bas : 2 + 1 = 3. Puis 5 − 3 = 2. Le résultat est <b>25</b>.', 'ce1_sous2'),
        S('Vérifier avec une addition', 'L’addition vérifie la soustraction. Si 52 − 27 = 25, alors 25 + 27 doit faire 52. Et c’est vrai !'),
        S('Avec des centaines', 'On fait pareil, colonne par colonne, en commençant par la droite. 475 − 132 : 5 − 2 = 3, 7 − 3 = 4, 4 − 1 = 3. Le résultat est <b>343</b>.'),
      ],
      recap: ['Soustraire, c’est enlever ou trouver ce qu’il reste.', 'On pose le grand nombre en haut, et on commence par les unités.', 'Si le chiffre du haut est trop petit, on ajoute 10 en haut et 1 dizaine en bas.', 'On vérifie avec une addition.'],
      quiz: [Q('84 − 31 = ?', ['53', '115', '55'], 0), Q('Pour vérifier 60 − 24 = 36, je calcule…', ['60 + 24', '36 + 24', '36 − 24'], 1), Q('41 − 8 = ?', ['32', '34', '33'], 2)] },

    /* ---------------------------------------------------------------- 4 */
    { id: 'ce1-tables', subj: 'maths', level: 'ce1', icon: '✖️', title: 'Les tables de 2, 5 et 10',
      intro: 'Les tables de multiplication aident à calculer vite. Commençons par les plus faciles : 2, 5 et 10.',
      steps: [
        S('La table de 2 : les doubles', 'Multiplier par 2, c’est prendre le <b>double</b>. 2, 4, 6, 8, 10, 12, 14, 16, 18, 20. Par exemple 2 × 7 = 14 (7 + 7). Tous ces nombres sont <b>pairs</b>.', 'ce1_t2'),
        S('La table de 5', 'On compte de 5 en 5 : 5, 10, 15, 20, 25, 30, 35, 40, 45, 50. Les résultats finissent toujours par <b>0</b> ou par <b>5</b>. Par exemple 5 × 7 = 35.', 'ce1_t5'),
        S('La table de 10', 'Quand on multiplie par 10, on écrit un <b>0</b> à la fin du nombre. 4 × 10 = 40. Et 7 × 10 = 70. 10 × 10 = 100.', 'ce1_t10'),
        S('Toutes les tables ensemble', 'Regarde le tableau : 5 × 2 = 10, 2 × 5 = 10 et 1 × 10 = 10. L’ordre ne change pas le résultat. Apprends ces trois tables par cœur !', 'ce1_tab'),
        S('Dans la vie', '6 sachets de 5 bonbons ? 6 × 5 = 30 bonbons. 8 paires de chaussettes ? 8 × 2 = 16 chaussettes. 3 paquets de 10 images ? 3 × 10 = 30 images.'),
      ],
      recap: ['Table de 2 : les doubles (2, 4, 6, 8, 10…).', 'Table de 5 : les résultats finissent par 0 ou 5.', 'Table de 10 : on ajoute un 0 à la fin.', 'L’ordre des nombres ne change pas le résultat.'],
      quiz: [Q('2 × 8 = ?', ['16', '10', '18'], 0), Q('5 × 7 = ?', ['30', '35', '40'], 1), Q('10 × 6 = ?', ['16', '600', '60'], 2)] },

    /* ---------------------------------------------------------------- 5 */
    { id: 'ce1-multiplication', subj: 'maths', level: 'ce1', icon: '🍪', title: 'La multiplication',
      intro: 'Tu as 4 assiettes avec 3 gâteaux sur chacune. Combien de gâteaux en tout ? La multiplication calcule vite !',
      steps: [
        S('Additionner plusieurs fois le même nombre', '4 assiettes de 3 gâteaux : 3 + 3 + 3 + 3 = 12. Au lieu d’une longue addition, on écrit <b>4 × 3 = 12</b>.', 'ce1_groupes'),
        S('Le signe ×', 'Le signe <b>×</b> se lit « <b>fois</b> ». 4 × 3 se lit « quatre fois trois ». Le résultat s’appelle le <b>produit</b>.'),
        S('Lignes et colonnes', 'On peut ranger les objets en <b>lignes</b> et en <b>colonnes</b>. Ici : 3 lignes de 4 points. Il y a 3 × 4 = 12 points.', 'ce1_tableau'),
        S('On peut changer l’ordre', 'Si je tourne le tableau, j’ai 4 lignes de 3 points. Le nombre de points ne change pas : <b>3 × 4 = 4 × 3 = 12</b>. Pratique pour calculer !', 'ce1_commut'),
        S('Multiplier par 0 et par 1', 'Multiplier par 1, on ne change rien : 1 × 7 = 7. Multiplier par 0, on obtient 0 : 0 × 7 = 0 (zéro assiette, zéro gâteau).'),
        S('Un petit problème', 'Dans une boîte, il y a 5 crayons. Combien de crayons dans 6 boîtes ? 6 × 5 = <b>30</b> crayons.'),
      ],
      recap: ['Une multiplication est une addition qui répète le même nombre.', 'Le signe × se lit « fois ».', '3 × 4 = 4 × 3 : on peut changer l’ordre.', 'Un nombre × 1 ne change pas, un nombre × 0 donne 0.'],
      quiz: [Q('5 + 5 + 5 s’écrit aussi…', ['5 × 5', '3 × 5', '3 + 5'], 1), Q('4 × 3 = ?', ['7', '10', '12'], 2), Q('8 × 0 = ?', ['0', '8', '80'], 0)] },

    /* ---------------------------------------------------------------- 6 */
    { id: 'ce1-geometrie', subj: 'maths', level: 'ce1', icon: '📐', title: 'Angle droit, carré et rectangle',
      intro: 'Regarde ton cahier, ta table, la fenêtre : il y a des coins partout. Certains sont « droits » !',
      steps: [
        S('L’angle droit', 'Le coin d’une feuille ou d’un cahier est un <b>angle droit</b>. On le marque avec un petit carré dans le coin. Un angle qui est plus ouvert ou plus fermé n’est pas droit.', 'ce1_angle'),
        S('L’équerre', 'Pour vérifier un angle droit, on utilise une <b>équerre</b>. On pose le coin de l’équerre dans l’angle. Si les deux côtés collent bien, c’est un angle droit.', 'ce1_equerre'),
        S('Le carré', 'Le <b>carré</b> a <b>4 côtés égaux</b> (de la même longueur) et <b>4 angles droits</b>. Les petits traits rouges montrent que les côtés sont égaux.', 'ce1_carre'),
        S('Le rectangle', 'Le <b>rectangle</b> a <b>4 angles droits</b>. Ses côtés opposés ont la même longueur : les deux grands côtés (la longueur) sont égaux, les deux petits côtés (la largeur) aussi.', 'ce1_rect'),
        S('Carré ou rectangle ?', 'Un carré est un rectangle un peu spécial, car ses 4 côtés sont tous égaux. Mais un rectangle qui a deux côtés plus longs que les deux autres n’est pas un carré.'),
        S('Sur le quadrillage', 'Sur une feuille quadrillée, on compte les carreaux pour tracer. Ce rectangle mesure 5 carreaux sur 3 carreaux. On trace avec une règle, et on vérifie les coins avec l’équerre.', 'ce1_quad'),
      ],
      recap: ['L’angle droit est le coin d’une feuille ; on le vérifie avec l’équerre.', 'Le carré a 4 côtés égaux et 4 angles droits.', 'Le rectangle a 4 angles droits et ses côtés opposés sont égaux.', 'Un carré est un rectangle particulier.'],
      quiz: [Q('Un carré a…', ['3 côtés égaux', '2 côtés égaux', '4 côtés égaux'], 2), Q('Combien d’angles droits a un rectangle ?', ['2', '4', '3'], 1), Q('Pour vérifier un angle droit, j’utilise…', ['une gomme', 'une équerre', 'un crayon'], 1)] },

    /* ---------------------------------------------------------------- 7 */
    { id: 'ce1-mesures', subj: 'maths', level: 'ce1', icon: '📏', title: 'Les mesures',
      intro: 'Pour savoir si ton cartable est lourd, si la cour est grande ou si la bouteille est pleine, on mesure !',
      steps: [
        S('Mesurer une longueur', 'On mesure avec une <b>règle</b>. On place le <b>0</b> au début de l’objet et on lit le nombre à la fin. Ce crayon mesure <b>7 cm</b> (sept centimètres).', 'ce1_regle'),
        S('Le mètre et le centimètre', 'Le <b>centimètre</b> (cm) sert aux petits objets. Le <b>mètre</b> (m) sert aux grandes longueurs : la classe, la cour. <b>1 m = 100 cm</b>. Le mètre ruban a 100 centimètres.', 'ce1_metre'),
        S('Peser : le gramme et le kilogramme', 'On pèse avec une balance. Le <b>gramme</b> (g) sert aux objets légers, le <b>kilogramme</b> (kg) aux objets lourds. <b>1 kg = 1 000 g</b>. Un paquet de sucre pèse 1 kg.', 'ce1_balance'),
        S('Le litre', 'Pour mesurer ce que contient une bouteille ou un seau, on utilise le <b>litre</b> (L). Une grande bouteille d’eau contient 1 L. Dans le pichet, il y a 2 L.', 'ce1_litre'),
        S('Choisir la bonne unité', 'Un crayon : en <b>cm</b>. La cour : en <b>m</b>. Une gomme : en <b>g</b>. Un sac de pommes de terre : en <b>kg</b>. Un seau d’eau : en <b>L</b>.'),
        S('Quelques conversions', '2 m = 200 cm. 3 kg = 3 000 g. 2 L + 3 L = 5 L. Pour 2 m = 200 cm, on pense : 1 m = 100 cm, donc 2 m = 100 cm + 100 cm.'),
      ],
      recap: ['Longueurs : cm et m ; 1 m = 100 cm.', 'Masses : g et kg ; 1 kg = 1 000 g.', 'Contenances : le litre (L).', 'Je choisis l’unité qui convient à l’objet.'],
      quiz: [Q('1 m = ?', ['10 cm', '100 cm', '1 000 cm'], 1), Q('Quelle unité pour mesurer le jus d’une bouteille ?', ['kg', 'cm', 'L'], 2), Q('Un cahier mesure environ 30…', ['cm', 'kg', 'L'], 0)] },

    /* ---------------------------------------------------------------- 8 */
    { id: 'ce1-heure', subj: 'maths', level: 'ce1', icon: '⏰', title: 'L’heure et les durées',
      intro: 'Il est l’heure d’aller à l’école, de la récréation, du goûter ! Apprenons à lire l’heure et à calculer le temps qui passe.',
      steps: [
        S('Lire l’horloge', 'L’horloge a deux aiguilles. La <b>petite aiguille</b> montre les <b>heures</b>. La <b>grande aiguille</b> montre les <b>minutes</b>. Ici, la petite aiguille est sur le 3 et la grande sur le 12 : il est <b>3 heures</b>.', 'ce1_horloge'),
        S('Heure pile, et quart, et demie', 'Grande aiguille sur le 12 : l’heure <b>pile</b>. Sur le 3 : l’heure <b>et quart</b> (15 minutes). Sur le 6 : l’heure <b>et demie</b> (30 minutes). Sur le 9 : l’heure suivante <b>moins le quart</b>.', 'ce1_trois'),
        S('Les minutes', '<b>1 heure = 60 minutes</b>. Une demi-heure dure 30 minutes. Un quart d’heure dure 15 minutes. La récréation de 15 minutes, c’est un quart d’heure.', 'ce1_heure60'),
        S('Calculer une durée', 'La <b>durée</b>, c’est le temps entre le début et la fin. Si la classe commence à 8 h et que la récréation est à 11 h, il s’est passé 11 − 8 = <b>3 heures</b>.', 'ce1_duree'),
        S('Jours, semaines, mois', '1 jour = 24 heures. 1 semaine = 7 jours. 1 an = 12 mois. L’après-midi, on peut dire 15 h pour 3 heures de l’après-midi.'),
      ],
      recap: ['Petite aiguille : les heures ; grande aiguille : les minutes.', '1 heure = 60 minutes ; une demi-heure = 30 minutes ; un quart d’heure = 15 minutes.', 'Pour trouver une durée, on compte le temps entre le début et la fin.', '1 semaine = 7 jours ; 1 an = 12 mois.'],
      quiz: [Q('Combien de minutes dans 1 heure ?', ['30', '60', '100'], 1), Q('Il est 4 h 30. On dit…', ['4 heures et quart', '4 heures et demie', '5 heures et demie'], 1), Q('Je commence à 9 h et je finis à 12 h. Quelle est la durée ?', ['3 heures', '2 heures', '4 heures'], 0)] },

    /* ---------------------------------------------------------------- 9 */
    { id: 'ce1-probleme', subj: 'maths', level: 'ce1', icon: '🧩', title: 'Résoudre un problème',
      intro: 'Un problème est une petite histoire avec une question. Avec une bonne méthode, tu vas toujours trouver !',
      steps: [
        S('Quatre étapes', 'Pour réussir : 1. <b>Je lis</b> l’énoncé en entier. 2. <b>Je cherche</b> ce qu’on sait et ce qu’on demande. 3. <b>Je calcule</b>. 4. <b>Je réponds</b> par une phrase. Et enfin, je vérifie.', 'ce1_etapes'),
        S('Faire un schéma', 'Léa a 9 billes. Elle en gagne 6. Combien en a-t-elle en tout ? On dessine une barre : 9 d’un côté, 6 de l’autre, et « ? » pour le total.', 'ce1_schema'),
        S('Choisir l’opération', 'Certains mots aident. « <b>En tout</b> », « ensemble » : on fait une <b>addition</b>. « <b>Il reste</b> », « il perd » : une <b>soustraction</b>. « <b>Paquets de</b> », « chacun a » : une <b>multiplication</b>.', 'ce1_mots'),
        S('Calculer', 'Pour Léa : 9 + 6 = 15. Autre exemple : il y a 25 élèves, 8 partent, combien restent-ils ? 25 − 8 = 17. Et 4 sacs de 5 pommes ? 4 × 5 = 20 pommes.'),
        S('Répondre et vérifier', 'J’écris une <b>phrase réponse</b> : « Léa a 15 billes. » Puis je vérifie : est-ce que mon résultat est possible ? 15 est plus grand que 9, c’est logique car elle en a gagné.'),
      ],
      recap: ['Je lis tout l’énoncé et je cherche la question.', 'Un schéma m’aide à comprendre.', 'En tout : +. Il reste : −. Paquets de : ×.', 'J’écris toujours une phrase réponse.'],
      quiz: [Q('Dans « il en reste », je fais…', ['une addition', 'une soustraction', 'une multiplication'], 1), Q('3 boîtes de 10 crayons. Combien de crayons en tout ?', ['13', '7', '30'], 2), Q('Léa a 14 images et en donne 5. Combien lui en reste-t-il ?', ['9', '19', '8'], 0)] },
  );
})();
