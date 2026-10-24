/* Cours illustrés : CE2 (8-9 ans). Contenu en français ; l'audio utilise la voix du navigateur. */
(function () {
  'use strict';
  const K = window.CourseKit, { F, C, svg, T, L, ARROW, S, Q, FIG } = K;

  /* ---------- petits outils de dessin ---------- */
  const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" fill="${o.fill || 'currentColor'}" stroke="none" font-size="${o.size || 13}" font-weight="${o.w || 700}" text-anchor="${o.a || 'middle'}"${o.cls ? ` class="${o.cls}"` : ''}${o.style ? ` style="${o.style}"` : ''}>${s}</text>`;
  const R = (x, y, w, h, c, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx == null ? 6 : o.rx}" fill="${o.fill || c}" fill-opacity="${o.fo == null ? 0.18 : o.fo}" stroke="${c}" stroke-width="${o.sw || 2.5}"${o.cls ? ` class="${o.cls}"` : ''}${o.style ? ` style="${o.style}"` : ''}/>`;
  const D = (x, y, r, c, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity="${o.fo == null ? 1 : o.fo}" stroke="${o.stroke || c}" stroke-width="${o.sw || 2}"${o.cls ? ` class="${o.cls}"` : ''}${o.style ? ` style="${o.style}"` : ''}/>`;
  const dl = (i) => `animation-delay:${(i * 0.25).toFixed(2)}s`;
  const pt = (cx, cy, r, a) => [(cx + r * Math.sin(a * Math.PI / 180)).toFixed(1), (cy - r * Math.cos(a * Math.PI / 180)).toFixed(1)];
  const sector = (cx, cy, r, a0, a1, c, fo) => {
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1);
    return `<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z" fill="${c}" fill-opacity="${fo}" stroke="${c}" stroke-width="2.5"/>`;
  };
  const pie = (cx, cy, r, n, k, c) => {
    let b = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="3"/>`;
    for (let i = 0; i < k; i++) b += sector(cx, cy, r, i * 360 / n, (i + 1) * 360 / n, c, 0.55);
    for (let i = 0; i < n; i++) { const [x, y] = pt(cx, cy, r, i * 360 / n); b += L(cx, cy, x, y, 'currentColor', 2.5); }
    return b;
  };
  const clock = (cx, cy, r, hAng, mAng) => {
    let b = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.bleu}" fill-opacity=".08" stroke="currentColor" stroke-width="3"/>`;
    for (let i = 0; i < 12; i++) { const [x1, y1] = pt(cx, cy, r - 2, i * 30), [x2, y2] = pt(cx, cy, r - (i % 3 ? 7 : 11), i * 30); b += L(x1, y1, x2, y2, 'currentColor', i % 3 ? 1.5 : 2.5); }
    for (let i = 1; i <= 12; i++) { const [x, y] = pt(cx, cy, r - 19, i * 30); b += t(x, (+y + 4).toFixed(1), i, { size: 10, w: 600 }); }
    const [hx, hy] = pt(cx, cy, r * 0.5, hAng), [mx, my] = pt(cx, cy, r * 0.76, mAng);
    return b + L(cx, cy, hx, hy, C.brand, 5) + L(cx, cy, mx, my, C.rouge, 3.5) + D(cx, cy, 4, C.or, { cls: 'pop' });
  };

  Object.assign(FIG, {
    /* ---------- nombres jusqu'à 10 000 ---------- */
    ce2_echanges: () => {
      let g = '';
      for (let i = 1; i < 10; i++) g += L(100, 30 + i * 6, 112, 30 + i * 6, C.vert, 1.5);
      let h = '';
      for (let i = 1; i < 10; i++) h += `M${160 + i * 5} 30V80M160 ${30 + i * 5}H210`;
      return svg(360, 140, ARROW('ce2a', C.gris) +
        R(24, 78, 12, 12, C.bleu, { rx: 2, fo: 0.7, cls: 'pop' }) +
        R(100, 30, 12, 60, C.vert, { rx: 2, fo: 0.35, sw: 2 }) + g +
        `<polygon points="160,30 168,22 218,22 210,30" fill="${C.or}" fill-opacity=".3" stroke="${C.or}" stroke-width="2"/>` +
        R(160, 30, 50, 50, C.or, { rx: 2, fo: 0.3, sw: 2 }) + `<path d="${h}" stroke="${C.or}" stroke-width="1"/>` +
        `<g class="pop">` + R(270, 24, 52, 56, C.rouge, { rx: 3, fo: 0.3, sw: 2.5 }) + R(262, 32, 52, 56, C.rouge, { rx: 3, fo: 0.3, sw: 2.5 }) + `</g>` +
        L(48, 62, 90, 62, C.gris, 2.5).replace('/>', ' marker-end="url(#ce2a)"/>') + t(69, 54, '×10', { size: 12, fill: C.gris }) +
        L(122, 62, 150, 62, C.gris, 2.5).replace('/>', ' marker-end="url(#ce2a)"/>') + t(136, 54, '×10', { size: 12, fill: C.gris }) +
        L(222, 62, 250, 62, C.gris, 2.5).replace('/>', ' marker-end="url(#ce2a)"/>') + t(236, 54, '×10', { size: 12, fill: C.gris }) +
        t(30, 112, '1') + t(106, 112, '10') + t(185, 112, '100') + t(290, 112, '1000') +
        t(30, 130, 'unité', { size: 11, fill: C.bleu }) + t(106, 130, 'dizaine', { size: 11, fill: C.vert }) + t(185, 130, 'centaine', { size: 11, fill: C.or }) + t(290, 130, 'millier', { size: 11, fill: C.rouge }));
    },
    ce2_posval: () => {
      const cols = [['milliers', C.or, '3', '3 000'], ['centaines', C.rouge, '4', '400'], ['dizaines', C.vert, '5', '50'], ['unités', C.bleu, '2', '2']];
      let b = '';
      cols.forEach(([n, c, d, v], i) => {
        const x = 75 + i * 70;
        b += t(x, 20, n, { size: 12, fill: c }) + R(x - 28, 30, 56, 54, c, { rx: 10 }) + t(x, 69, d, { size: 32, fill: c, cls: 'pop', style: dl(i) }) + t(x, 106, v, { size: 12 });
      });
      return svg(360, 150, b + t(180, 136, '3 452 = 3 000 + 400 + 50 + 2', { size: 13, fill: C.brand }));
    },
    ce2_decomp: () => {
      const br = [['4000', C.or, '4 × 1 000'], ['500', C.rouge, '5 × 100'], ['20', C.vert, '2 × 10'], ['7', C.bleu, '7 × 1']];
      let b = t(180, 26, '4 527', { size: 22, fill: C.brand });
      br.forEach(([v, c, e], i) => {
        const x = 12 + i * 90;
        b += R(x, 44, 62, 44, c, { rx: 8, cls: 'pop', style: dl(i) }) + t(x + 31, 73, v, { size: 18, fill: c }) + t(x + 31, 110, e, { size: 11 });
        if (i < 3) b += t(x + 76, 74, '+', { size: 20 });
      });
      return svg(360, 128, b);
    },
    ce2_compare: () => {
      const a = ['3', '4', '6', '5'], bb = ['3', '4', '5', '2'], sy = ['=', '=', '&gt;'];
      let b = '';
      for (let i = 0; i < 4; i++) {
        const x = 20 + i * 44, hot = i === 2;
        b += R(x, 12, 38, 34, hot ? C.rouge : C.gris, { rx: 6 }) + t(x + 19, 37, a[i], { size: 22, fill: hot ? C.rouge : 'currentColor' });
        b += R(x, 80, 38, 34, hot ? C.rouge : C.gris, { rx: 6 }) + t(x + 19, 105, bb[i], { size: 22, fill: hot ? C.rouge : 'currentColor' });
        if (i < 3) b += t(x + 19, 71, sy[i], { size: 20, fill: hot ? C.rouge : C.gris, cls: hot ? 'pulse' : '' });
      }
      return svg(360, 128, b + t(272, 64, '3 465 &gt; 3 452', { size: 16, fill: C.brand }));
    },
    ce2_droite10: () => {
      let b = ARROW('ce2b', 'currentColor') + `<line x1="14" y1="70" x2="348" y2="70" stroke="currentColor" stroke-width="3" marker-end="url(#ce2b)"/>`;
      for (let i = 0; i <= 10; i++) { const x = 20 + i * 30; b += L(x, 62, x, 78, 'currentColor', 2) + t(x, 98, i * 100, { size: 10, w: 600 }); if (i < 10) b += L(x + 15, 66, x + 15, 74, C.gris, 1.5); }
      b += `<path class="draw" pathLength="100" d="M200 70H230" stroke="${C.or}" stroke-width="7"/>`;
      b += D(215, 70, 8, C.rouge, { cls: 'pop' }) + t(215, 44, '650', { size: 16, fill: C.rouge });
      return svg(360, 120, b + t(50, 120, '0', { size: 0.1 }).replace(/.*/, ''));
    },

    /* ---------- multiplication posée ---------- */
    ce2_posee1: () => {
      const x = [130, 160, 190];
      return svg(360, 140,
        t(x[1], 40, '3', { size: 24 }) + t(x[2], 40, '2', { size: 24 }) +
        t(100, 74, '×', { size: 22, fill: C.gris }) + t(x[2], 74, '3', { size: 24, fill: C.brand }) +
        L(85, 84, 205, 84, 'currentColor', 3) +
        t(x[1], 114, '9', { size: 26, fill: C.or, cls: 'pop', style: dl(1) }) + t(x[2], 114, '6', { size: 26, fill: C.rouge, cls: 'pop' }) +
        t(222, 42, '2 × 3 = 6', { a: 'start', size: 13, fill: C.rouge }) + t(222, 74, '3 × 3 = 9', { a: 'start', size: 13, fill: C.or }) +
        t(222, 114, '32 × 3 = 96', { a: 'start', size: 13, fill: C.brand }));
    },
    ce2_posee2: () => {
      const x = [130, 160, 190];
      return svg(360, 150,
        t(x[1], 20, '4', { size: 14, fill: C.rouge, cls: 'pulse' }) +
        t(x[1], 48, '4', { size: 24 }) + t(x[2], 48, '7', { size: 24 }) +
        t(100, 82, '×', { size: 22, fill: C.gris }) + t(x[2], 82, '6', { size: 24, fill: C.brand }) +
        L(85, 92, 205, 92, 'currentColor', 3) +
        t(x[0], 124, '2', { size: 26, fill: C.or, cls: 'pop', style: dl(2) }) + t(x[1], 124, '8', { size: 26, fill: C.or, cls: 'pop', style: dl(1) }) + t(x[2], 124, '2', { size: 26, fill: C.rouge, cls: 'pop' }) +
        t(222, 46, '7 × 6 = 42', { a: 'start', size: 13, fill: C.rouge }) + t(222, 64, 'je retiens 4', { a: 'start', size: 12, fill: C.rouge }) +
        t(222, 82, '4 × 6 = 24', { a: 'start', size: 13, fill: C.or }) + t(222, 100, '24 + 4 = 28', { a: 'start', size: 13, fill: C.or }) +
        t(222, 126, '47 × 6 = 282', { a: 'start', size: 13, fill: C.brand }));
    },
    ce2_posee3: () => {
      const x = [130, 160, 190];
      return svg(360, 150,
        t(x[0], 20, '1', { size: 14, fill: C.rouge, cls: 'pulse', style: dl(2) }) + t(x[1], 20, '2', { size: 14, fill: C.rouge, cls: 'pulse', style: dl(1) }) +
        t(x[0], 48, '2', { size: 24 }) + t(x[1], 48, '3', { size: 24 }) + t(x[2], 48, '6', { size: 24 }) +
        t(100, 82, '×', { size: 22, fill: C.gris }) + t(x[2], 82, '4', { size: 24, fill: C.brand }) +
        L(85, 92, 205, 92, 'currentColor', 3) +
        t(x[0], 124, '9', { size: 26, fill: C.vert, cls: 'pop', style: dl(2) }) + t(x[1], 124, '4', { size: 26, fill: C.or, cls: 'pop', style: dl(1) }) + t(x[2], 124, '4', { size: 26, fill: C.rouge, cls: 'pop' }) +
        t(218, 46, '6 × 4 = 24', { a: 'start', size: 12, fill: C.rouge }) + t(218, 68, '3 × 4 = 12, 12 + 2 = 14', { a: 'start', size: 11, fill: C.or }) +
        t(218, 90, '2 × 4 = 8, 8 + 1 = 9', { a: 'start', size: 11, fill: C.vert }) + t(218, 126, '236 × 4 = 944', { a: 'start', size: 13, fill: C.brand }));
    },
    ce2_posee4: () => {
      const x = [130, 160, 190];
      return svg(360, 168,
        t(x[1], 24, '2', { size: 22 }) + t(x[2], 24, '3', { size: 22 }) +
        t(100, 52, '×', { size: 20, fill: C.gris }) + t(x[1], 52, '1', { size: 22, fill: C.brand }) + t(x[2], 52, '4', { size: 22, fill: C.brand }) +
        L(85, 60, 205, 60, 'currentColor', 3) +
        t(x[1], 86, '9', { size: 22, fill: C.rouge }) + t(x[2], 86, '2', { size: 22, fill: C.rouge }) +
        t(100, 114, '+', { size: 20, fill: C.gris }) + t(x[0], 114, '2', { size: 22, fill: C.vert }) + t(x[1], 114, '3', { size: 22, fill: C.vert }) + t(x[2], 114, '0', { size: 22, fill: C.vert, cls: 'pulse' }) +
        L(85, 124, 205, 124, 'currentColor', 3) +
        t(x[0], 152, '3', { size: 24, fill: C.brand, cls: 'pop', style: dl(2) }) + t(x[1], 152, '2', { size: 24, fill: C.brand, cls: 'pop', style: dl(1) }) + t(x[2], 152, '2', { size: 24, fill: C.brand, cls: 'pop' }) +
        t(222, 86, '23 × 4 = 92', { a: 'start', size: 13, fill: C.rouge }) + t(222, 114, '23 × 10 = 230', { a: 'start', size: 13, fill: C.vert }) +
        t(222, 152, '92 + 230 = 322', { a: 'start', size: 13, fill: C.brand }));
    },

    /* ---------- la division ---------- */
    ce2_partage: () => {
      const cs = [C.bleu, C.or, C.vert];
      let b = '';
      for (let i = 0; i < 12; i++) b += D(104 + (i % 6) * 30, 18 + Math.floor(i / 6) * 24, 9, cs[Math.floor(i / 4)], { fo: 0.8 });
      b += ARROW('ce2c', C.gris) + L(180, 56, 180, 74, C.gris, 3).replace('/>', ' marker-end="url(#ce2c)"/>');
      cs.forEach((c, k) => {
        const x = 24 + k * 114;
        b += R(x, 82, 96, 46, c, { rx: 10 });
        for (let j = 0; j < 4; j++) b += D(x + 28 + (j % 2) * 40, 98 + Math.floor(j / 2) * 20, 8, c, { fo: 0.8, cls: 'pop', style: dl(j) });
      });
      return svg(360, 160, b + t(180, 152, '12 ÷ 3 = 4', { size: 15, fill: C.brand }));
    },
    ce2_groupes: () => {
      const cs = [C.bleu, C.or, C.vert];
      let b = '';
      cs.forEach((c, k) => {
        const y = 28 + k * 40;
        b += `<ellipse class="dash" cx="105" cy="${y}" rx="76" ry="18" stroke="${c}" stroke-width="2.5" fill="${c}" fill-opacity=".1"/>`;
        for (let j = 0; j < 4; j++) b += D(64 + j * 26, y, 8.5, c, { fo: 0.85 });
        b += D(212, y, 13, c, { fo: 0.2, cls: 'pop', style: dl(k) }) + t(212, y + 5, k + 1, { size: 14, fill: c });
      });
      return svg(360, 150, b + t(290, 54, '3 groupes', { size: 15, fill: C.brand }) + t(290, 86, '12 ÷ 4 = 3', { size: 15, fill: C.brand }) + t(180, 142, '4 + 4 + 4 = 12', { size: 12 }));
    },
    ce2_famille: () => {
      const eq = (x, y, s, c) => R(x, y, 150, 38, c, { rx: 10 }) + t(x + 75, y + 25, s, { size: 17, fill: c });
      return svg(360, 140, ARROW('ce2d', C.gris) +
        eq(20, 12, '3 × 4 = 12', C.bleu) + eq(190, 12, '4 × 3 = 12', C.bleu) +
        eq(20, 88, '12 ÷ 3 = 4', C.rouge) + eq(190, 88, '12 ÷ 4 = 3', C.rouge) +
        `<path class="dash" d="M95 52V86M265 52V86M170 31H188M170 107H188" stroke="${C.gris}" stroke-width="2.5"/>` +
        t(180, 74, '×  ⟷  ÷', { size: 14, fill: C.gris }));
    },
    ce2_reste: () => {
      const cs = [C.bleu, C.or, C.vert];
      let b = '';
      cs.forEach((c, k) => {
        const y = 26 + k * 38;
        b += `<ellipse cx="93" cy="${y}" rx="64" ry="16" stroke="${c}" stroke-width="2.5" fill="${c}" fill-opacity=".1"/>`;
        for (let j = 0; j < 4; j++) b += D(60 + j * 22, y, 7.5, c, { fo: 0.85 });
      });
      b += D(232, 52, 8, C.rouge, { cls: 'pulse' }) + D(258, 52, 8, C.rouge, { cls: 'pulse', style: dl(1) }) + t(245, 82, 'reste 2', { size: 14, fill: C.rouge });
      return svg(360, 150, b + t(180, 138, '14 ÷ 4 = 3 reste 2', { size: 15, fill: C.brand }));
    },

    /* ---------- les tables ---------- */
    ce2_rect: () => {
      let b = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) b += D(34 + c * 26, 30 + r * 26, 9, [C.bleu, C.or, C.vert][r], { fo: 0.8, cls: 'pop', style: dl(r + c * 0.3) });
      b += R(16, 14, 186, 84, C.gris, { rx: 10, fo: 0, sw: 1.5 }).replace('<rect', '<rect class="dash"');
      return svg(360, 120, b + t(272, 44, '3 × 7 = 21', { size: 16, fill: C.brand }) + t(272, 68, '7 × 3 = 21', { size: 16, fill: C.brand }) + t(272, 92, '3 × 7 = 7 × 3', { size: 13, fill: C.rouge }));
    },
    ce2_table5: () => {
      let b = '';
      for (let i = 0; i < 10; i++) {
        const v = 5 * (i + 1), x = 18 + (i % 5) * 66, y = 18 + Math.floor(i / 5) * 46, s = String(v), last = s.slice(-1), c = last === '0' ? C.rouge : C.bleu;
        b += R(x, y, 56, 34, c, { rx: 8 }) + t(x + 28, y + 23, (s.length > 1 ? s.slice(0, -1) : '') + `<tspan fill="${c}">${last}</tspan>`, { size: 18 });
      }
      return svg(360, 120, b + t(180, 112, '0 – 5 – 0 – 5', { size: 12, fill: C.gris }));
    },
    ce2_table9: () => {
      let b = '';
      for (let i = 0; i < 10; i++) {
        const x = 24 + i * 33, v = 9 * (i + 1), td = Math.floor(v / 10), ud = v % 10;
        b += t(x, 16, `9 × ${i + 1}`.replace(/9 × (\d+)/, '×$1'), { size: 10, fill: C.gris, w: 600 });
        b += R(x - 15, 24, 30, 32, C.brand, { rx: 7, fo: 0.08, sw: 2 }) + t(x, 46, `<tspan fill="${C.bleu}">${td}</tspan><tspan fill="${C.rouge}">${ud}</tspan>`, { size: 17, cls: 'pop', style: dl(i * 0.4) });
        b += t(x, 84, td, { size: 14, fill: C.bleu }) + t(x, 104, ud, { size: 14, fill: C.rouge });
      }
      return svg(360, 140, b + t(100, 128, 'dizaines +1', { size: 12, fill: C.bleu }) + t(260, 128, 'unités −1', { size: 12, fill: C.rouge }));
    },
    ce2_x4: () => {
      const nd = (x, v, c) => D(x, 48, 28, c, { fo: 0.2, sw: 3 }) + t(x, 55, v, { size: 20, fill: c });
      return svg(360, 120, ARROW('ce2e', C.gris) + nd(50, '7', C.bleu) + nd(180, '14', C.or) + nd(310, '28', C.vert).replace('r="28"', 'r="28" class="pop"') +
        L(82, 48, 144, 48, C.gris, 3).replace('/>', ' marker-end="url(#ce2e)"/>') + L(214, 48, 276, 48, C.gris, 3).replace('/>', ' marker-end="url(#ce2e)"/>') +
        t(113, 38, '×2', { size: 15, fill: C.gris }) + t(245, 38, '×2', { size: 15, fill: C.gris }) + t(180, 106, '7 × 4 = 28', { size: 16, fill: C.brand }));
    },

    /* ---------- fractions ---------- */
    ce2_egales: () => {
      const xs = [210, 242.5, 275, 307.5];
      return svg(360, 130, R(20, 24, 130, 60, C.rouge, { rx: 6 }) + L(52, 24, 52, 84, C.rouge, 3) + L(120, 24, 120, 84, C.rouge, 3) +
        R(210, 24, 130, 60, C.vert, { rx: 6 }) + xs.slice(1).map((x) => L(x, 24, x, 84, C.vert, 3)).join('') +
        t(85, 112, 'non', { size: 16, fill: C.rouge, cls: 'pulse' }) + t(275, 112, 'oui', { size: 16, fill: C.vert, cls: 'pulse' }));
    },
    ce2_moitie: () => svg(360, 150, pie(90, 62, 46, 2, 1, C.bleu) + R(190, 26, 130, 72, C.gris, { rx: 6, fo: 0, sw: 3 }) +
      R(190, 26, 65, 72, C.bleu, { rx: 6, fo: 0.5, cls: 'pop' }) + L(255, 26, 255, 98, 'currentColor', 3) +
      t(90, 134, '1/2', { size: 18, fill: C.bleu }) + t(255, 134, '1/2', { size: 18, fill: C.bleu })),
    ce2_quart: () => svg(360, 150, pie(90, 62, 46, 4, 1, C.or) + pie(270, 62, 46, 4, 3, C.vert) +
      t(90, 134, '1/4', { size: 18, fill: C.or }) + t(270, 134, '3/4', { size: 18, fill: C.vert })),
    ce2_tiers: () => svg(360, 150, pie(90, 62, 46, 3, 1, C.rouge) + R(190, 26, 130, 72, C.gris, { rx: 6, fo: 0, sw: 3 }) +
      R(190, 26, 43.3, 72, C.rouge, { rx: 6, fo: 0.5, cls: 'pop' }) + L(233.3, 26, 233.3, 98, 'currentColor', 3) + L(276.6, 26, 276.6, 98, 'currentColor', 3) +
      t(90, 134, '1/3', { size: 18, fill: C.rouge }) + t(255, 134, '1/3', { size: 18, fill: C.rouge })),
    ce2_compfrac: () => {
      const rows = [[2, C.bleu, '1/2'], [3, C.vert, '1/3'], [4, C.or, '1/4']];
      let b = '';
      rows.forEach(([n, c, l], i) => {
        const y = 14 + i * 40, w = 240 / n;
        b += R(60, y, 240, 30, C.gris, { rx: 5, fo: 0, sw: 2.5 }) + R(60, y, w, 30, c, { rx: 5, fo: 0.55, cls: 'pop', style: dl(i) });
        for (let k = 1; k < n; k++) b += L(60 + k * w, y, 60 + k * w, y + 30, 'currentColor', 2.5);
        b += t(30, y + 20, l, { size: 14, fill: c });
      });
      return svg(360, 150, b + t(180, 142, '1/2 &gt; 1/3 &gt; 1/4', { size: 15, fill: C.brand }));
    },

    /* ---------- périmètre ---------- */
    ce2_fourmi: () => svg(360, 150, `<rect class="dash" x="80" y="38" width="200" height="72" rx="6" stroke="${C.bleu}" stroke-width="4"/>` +
      `<rect x="80" y="38" width="200" height="72" rx="6" fill="${C.vert}" fill-opacity=".12" stroke="none"/>` +
      D(80, 38, 9, C.rouge, { cls: 'pulse' }) + t(80, 26, 'départ', { size: 12, fill: C.rouge }) + t(180, 80, 'jardin', { size: 14, fill: C.vert }) + t(180, 140, 'le tour', { size: 15, fill: C.bleu })),
    ce2_polygone: () => {
      const P = '100 115,100 55,180 25,260 55,240 115';
      return svg(360, 170, `<polygon points="${P}" fill="${C.bleu}" fill-opacity=".12" stroke="none"/><polygon class="draw" pathLength="100" points="${P}" stroke="${C.brand}" stroke-width="3.5"/>` +
        t(84, 90, '3', { fill: C.rouge }) + t(128, 30, '4', { fill: C.or }) + t(230, 30, '3', { fill: C.vert }) + t(264, 92, '2', { fill: C.bleu }) + t(170, 136, '4', { fill: C.rouge }) +
        t(180, 162, '3 + 4 + 3 + 2 + 4 = 16 cm', { size: 14, fill: C.brand }));
    },
    ce2_rect_p: () => svg(360, 165, R(100, 30, 160, 70, C.bleu, { rx: 4, fo: 0.12, sw: 3.5 }).replace('<rect', '<rect class="dash"') +
      t(180, 22, '6 cm', { fill: C.rouge }) + t(180, 120, '6 cm', { fill: C.rouge }) + t(76, 70, '3 cm', { fill: C.or }) + t(284, 70, '3 cm', { fill: C.or }) +
      t(180, 142, '6 + 3 + 6 + 3 = 18 cm', { size: 14, fill: C.brand }) + t(180, 160, '2 × 6 + 2 × 3 = 18 cm', { size: 12, fill: C.gris })),
    ce2_carre_p: () => svg(360, 165, R(144, 26, 72, 72, C.vert, { rx: 3, fo: 0.15, sw: 3.5 }).replace('<rect', '<rect class="dash"') +
      t(180, 18, '5 cm', { fill: C.rouge }) + t(180, 116, '5 cm', { fill: C.rouge }) + t(112, 66, '5 cm', { fill: C.rouge }) + t(248, 66, '5 cm', { fill: C.rouge }) +
      t(180, 138, '5 + 5 + 5 + 5 = 20 cm', { size: 14, fill: C.brand }) + t(180, 158, '4 × 5 = 20 cm', { size: 13, fill: C.gris })),

    /* ---------- symétrie ---------- */
    ce2_papillon: () => {
      const wing = (m) => {
        const X = (x) => (m ? 360 - x : x), ang = m ? -1 : 1;
        return `<g class="pop"><ellipse cx="${X(135)}" cy="55" rx="40" ry="24" transform="rotate(${-22 * ang} ${X(135)} 55)" fill="${C.bleu}" fill-opacity=".35" stroke="${C.bleu}" stroke-width="3"/></g>` +
          `<g class="pop" style="${dl(1)}"><ellipse cx="${X(142)}" cy="100" rx="30" ry="18" transform="rotate(${22 * ang} ${X(142)} 100)" fill="${C.or}" fill-opacity=".4" stroke="${C.or}" stroke-width="3"/></g>` +
          L(180, 48, X(162), 22, 'currentColor', 2);
      };
      return svg(360, 150, `<line class="dash" x1="180" y1="8" x2="180" y2="124" stroke="${C.rouge}" stroke-width="2.5"/>` + wing(0) + wing(1) +
        `<ellipse cx="180" cy="76" rx="6" ry="32" fill="${C.brand}"/>` + t(180, 144, 'axe de symétrie', { size: 13, fill: C.rouge }));
    },
    ce2_pliage: () => svg(360, 150, ARROW('ce2f', C.or) +
      `<polygon points="180,48 110,86 110,128 180,128" fill="${C.bleu}" fill-opacity=".3" stroke="${C.bleu}" stroke-width="3.5"/>` +
      `<polygon class="dash" points="180,48 250,86 250,128 180,128" stroke="${C.gris}" stroke-width="3"/>` +
      `<line x1="180" y1="38" x2="180" y2="136" stroke="${C.rouge}" stroke-width="2.5" stroke-dasharray="6 5"/>` +
      `<path class="draw" pathLength="100" d="M128 62Q180 10 232 62" stroke="${C.or}" stroke-width="3.5" marker-end="url(#ce2f)"/>` +
      t(180, 146, 'pliage', { size: 13, fill: C.rouge })),
    ce2_points: () => {
      let g = '';
      for (let i = 0; i <= 8; i++) g += `M${60 + i * 30} 14V134`;
      for (let j = 0; j <= 4; j++) g += `M60 ${14 + j * 30}H300`;
      const pr = (x, y, n, c) => D(x, y, 6, c, { cls: 'pop' }) + t(x, y - 10, n, { fill: c }) + D(360 - x, y, 6, c, { cls: 'pop', style: dl(1) }) + t(360 - x, y - 10, n + '’', { fill: c }) +
        `<line class="dash" x1="${x}" y1="${y}" x2="${360 - x}" y2="${y}" stroke="${c}" stroke-width="2"/>`;
      return svg(360, 170, `<path d="${g}" stroke="${C.gris}" stroke-opacity=".35" stroke-width="1"/>` + `<line x1="180" y1="6" x2="180" y2="142" stroke="${C.rouge}" stroke-width="3"/>` +
        pr(120, 44, 'A', C.bleu) + pr(90, 104, 'B', C.vert) + t(180, 164, 'même distance', { size: 14, fill: C.rouge, cls: 'pulse' }));
    },
    ce2_axes: () => {
      const ax = (x1, y1, x2, y2) => `<line class="dash" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.rouge}" stroke-width="2.5"/>`;
      return svg(360, 150, R(20, 30, 60, 60, C.bleu, { rx: 2, fo: 0.15, sw: 3 }) + ax(50, 22, 50, 98) + ax(12, 60, 88, 60) + ax(14, 24, 86, 96) + ax(86, 24, 14, 96) +
        R(135, 40, 80, 40, C.or, { rx: 2, fo: 0.15, sw: 3 }) + ax(175, 30, 175, 90) + ax(127, 60, 223, 60) +
        `<polygon points="300,30 268,90 332,90" fill="${C.vert}" fill-opacity=".15" stroke="${C.vert}" stroke-width="3"/>` + ax(300, 22, 300, 98) +
        t(50, 126, '4 axes', { fill: C.bleu }) + t(175, 126, '2 axes', { fill: C.or }) + t(300, 126, '1 axe', { fill: C.vert }));
    },
    ce2_lettres: () => {
      const ls = [['A', 1, 1], ['H', 1, 1], ['M', 1, 1], ['F', 0, 0], ['R', 0, 0]];
      let b = '';
      ls.forEach(([l, ok], i) => {
        const x = 40 + i * 70;
        b += t(x, 70, l, { size: 52, fill: C.brand });
        if (ok) b += `<line class="dash" x1="${x}" y1="18" x2="${x}" y2="84" stroke="${C.rouge}" stroke-width="2.5"/>`;
        b += t(x, 112, ok ? 'oui' : 'non', { size: 15, fill: ok ? C.vert : C.rouge, cls: 'pulse', style: dl(i) });
      });
      return svg(360, 128, b);
    },

    /* ---------- euros et centimes ---------- */
    ce2_euro: () => {
      let b = D(62, 62, 38, C.or, { fo: 0.35, sw: 4 }) + D(62, 62, 27, C.gris, { fo: 0.15, sw: 2 }) + t(62, 70, '1 €', { size: 22, fill: C.brand, cls: 'pop' }) + t(122, 70, '=', { size: 26 });
      for (let i = 0; i < 100; i++) b += D(158 + (i % 10) * 9.5, 18 + Math.floor(i / 10) * 9.5, 3.4, C.or, { fo: 0.8, sw: 1 });
      return svg(360, 150, b + t(305, 62, '100 c', { size: 18, fill: C.brand }) + t(180, 138, '1 € = 100 centimes', { size: 15, fill: C.brand }));
    },
    ce2_pieces: () => {
      const co = [['1 c', 11, 0], ['2 c', 13, 0], ['5 c', 15, 0], ['10 c', 13, 1], ['20 c', 15, 1], ['50 c', 17, 1], ['1 €', 18, 2], ['2 €', 20, 2]];
      let b = '';
      co.forEach(([l, r, k], i) => {
        const x = 28 + i * 44, c = k === 0 ? '#c2410c' : C.or;
        b += D(x, 40, r, c, { fo: 0.3, sw: 2.5, cls: 'pop', style: dl(i * 0.5) }) + (k === 2 ? D(x, 40, r - 6, C.gris, { fo: 0.15, sw: 1.5 }) : '') + t(x, 44, l, { size: 9 });
      });
      const bi = [['5 €', C.gris], ['10 €', C.rouge], ['20 €', C.bleu], ['50 €', C.or]];
      bi.forEach(([l, c], i) => { const x = 14 + i * 86; b += R(x, 86, 72, 38, c, { rx: 5, fo: 0.2 }) + t(x + 36, 111, l, { size: 16, fill: c }); });
      return svg(360, 160, b + t(180, 76, 'pièces', { size: 11, fill: C.gris }) + t(180, 148, 'billets', { size: 11, fill: C.gris }));
    },
    ce2_somme: () => {
      let b = '';
      [40, 80, 120].forEach((x, i) => { b += D(x, 46, 18, C.or, { fo: 0.3, sw: 3, cls: 'pop', style: dl(i) }) + D(x, 46, 12, C.gris, { fo: 0.15, sw: 1.5 }) + t(x, 50, '1 €', { size: 10 }); });
      [190, 226].forEach((x, i) => { b += D(x, 46, 15, C.or, { fo: 0.3, sw: 3, cls: 'pop', style: dl(3 + i) }) + t(x, 50, '20 c', { size: 10 }); });
      b += D(280, 46, 13, '#c2410c', { fo: 0.3, sw: 3, cls: 'pop', style: dl(5) }) + t(280, 50, '5 c', { size: 10 });
      b += t(80, 84, '3 €', { size: 15, fill: C.or }) + t(208, 84, '40 c', { size: 15, fill: C.or }) + t(280, 84, '5 c', { size: 15, fill: '#c2410c' });
      b += t(154, 52, '+', { size: 20, fill: C.gris }) + t(252, 52, '+', { size: 20, fill: C.gris });
      return svg(360, 140, b + t(180, 124, '3 € 45 c = 3,45 €', { size: 17, fill: C.brand }));
    },
    ce2_monnaie: () => {
      const a = (d, lab, lx, ly) => `<path class="draw" pathLength="100" d="${d}" stroke="${C.vert}" stroke-width="3" marker-end="url(#ce2g)"/>` + t(lx, ly, lab, { size: 13, fill: C.vert });
      let b = ARROW('ce2g', C.vert) + `<line x1="30" y1="70" x2="340" y2="70" stroke="currentColor" stroke-width="3"/>`;
      [[122, '3,60 €'], [170, '4 €'], [290, '5 €']].forEach(([x, l]) => { b += L(x, 62, x, 78, 'currentColor', 2.5) + t(x, 94, l, { size: 13 }); });
      b += D(122, 70, 7, C.rouge, { cls: 'pop' }) + D(290, 70, 7, C.bleu, { cls: 'pop' });
      b += a('M122 60Q146 32 168 58', '+ 40 c', 138, 38) + a('M172 58Q230 24 288 58', '+ 1 €', 230, 36);
      return svg(360, 150, b + t(122, 112, 'prix', { size: 12, fill: C.rouge }) + t(290, 112, 'je paie', { size: 12, fill: C.bleu }) + t(180, 140, 'je rends 1,40 €', { size: 16, fill: C.brand }));
    },

    /* ---------- durées ---------- */
    ce2_unites: () => svg(360, 130,
      clock(60, 36, 24, 0, 0).replace(/<text[^>]*>\d+<\/text>/g, '') + t(135, 42, '1 h', { size: 17, fill: C.brand }) + t(180, 42, '=', { size: 20 }) + t(255, 42, '60 min', { size: 17, fill: C.rouge }) +
      D(60, 96, 20, C.or, { fo: 0.2, sw: 3 }) + L(60, 80, 60, 76, C.or, 4) + L(60, 96, 60, 84, C.or, 3).replace('/>', ' class="pulse"/>') +
      t(135, 102, '1 min', { size: 17, fill: C.brand }) + t(180, 102, '=', { size: 20 }) + t(255, 102, '60 s', { size: 17, fill: C.rouge })),
    ce2_horloge: () => svg(360, 165, clock(95, 72, 58, 90, 0) + clock(265, 72, 58, 105, 180) + t(95, 152, '3 h', { size: 16, fill: C.brand }) + t(265, 152, '3 h 30', { size: 16, fill: C.brand })),
    ce2_quart_h: () => {
      let b = '';
      [[0, 90, C.bleu, '15', 45], [90, 180, C.vert, '30', 135], [180, 270, C.or, '45', 225], [270, 360, C.rouge, '60', 315]].forEach(([a0, a1, c, l, am], i) => {
        const [x, y] = pt(110, 74, 34, am);
        b += sector(110, 74, 58, a0, a1, c, 0.35) + t(x, +y + 5, l, { size: 14, fill: c });
      });
      b += `<circle cx="110" cy="74" r="58" fill="none" stroke="currentColor" stroke-width="3"/>` + L(110, 16, 110, 132, 'currentColor', 2) + L(52, 74, 168, 74, 'currentColor', 2);
      return svg(360, 150, b + t(265, 50, '1/4 h = 15 min', { size: 13, fill: C.bleu }) + t(265, 78, '1/2 h = 30 min', { size: 13, fill: C.vert }) + t(265, 106, '3/4 h = 45 min', { size: 13, fill: C.or }));
    },
    ce2_duree: () => {
      const a = (d, lab, lx) => `<path class="draw" pathLength="100" d="${d}" stroke="${C.vert}" stroke-width="3" marker-end="url(#ce2h)"/>` + t(lx, 30, lab, { size: 14, fill: C.vert });
      let b = ARROW('ce2h', C.vert) + `<line x1="20" y1="76" x2="340" y2="76" stroke="currentColor" stroke-width="3"/>`;
      [[50, '14 h 30'], [180, '15 h'], [310, '16 h']].forEach(([x, l], i) => { b += L(x, 68, x, 84, 'currentColor', 2.5) + t(x, 102, l, { size: 14 }) + D(x, 76, 6, [C.rouge, C.or, C.bleu][i], { cls: 'pop' }); });
      b += a('M54 66Q115 18 176 66', '+ 30 min', 115) + a('M184 66Q245 18 306 66', '+ 1 h', 245);
      return svg(360, 150, b + t(180, 134, '30 min + 1 h = 1 h 30', { size: 15, fill: C.brand }));
    },
  });

  K.COURSES.push(
    /* ------------------------------------------------------------ 1. NOMBRES */
    { id: 'ce2-nombres', subj: 'maths', level: 'ce2', icon: '🔢', title: 'Les nombres jusqu’à 10 000',
      intro: 'Combien de billes dans la grande boîte de la classe ? Pour compter de grands tas, on les range en paquets de 10, de 100, de 1 000.',
      steps: [
        S('Des paquets de 10', 'Avec <b>10 unités</b>, on fait <b>1 dizaine</b>. Avec 10 dizaines, on fait <b>1 centaine</b> (100). Avec 10 centaines, on fait <b>1 millier</b> (1 000). Et 10 milliers font <b>10 000</b>.', 'ce2_echanges'),
        S('Le tableau des positions', 'Chaque chiffre a une place. Dans <b>3 452</b>, le 3 est le chiffre des <b>milliers</b>, le 4 celui des <b>centaines</b>, le 5 celui des <b>dizaines</b> et le 2 celui des <b>unités</b>.', 'ce2_posval'),
        S('Lire et écrire', '3 452 se lit « trois mille quatre cent cinquante-deux ». On lit 1 000 « mille » (pas « un mille »). Le plus grand nombre à 4 chiffres est 9 999, et <b>9 999 + 1 = 10 000</b> (dix mille).'),
        S('Décomposer', 'On peut découper un nombre selon ses positions : <b>4 527 = 4 000 + 500 + 20 + 7</b>. C’est comme payer avec des billets de 1 000, de 100, de 10 et des pièces de 1.', 'ce2_decomp'),
        S('Comparer', 'On compare les chiffres <b>de gauche à droite</b>. On s’arrête au premier chiffre différent : 3 465 &gt; 3 452 car 6 dizaines &gt; 5 dizaines. Le symbole &lt; veut dire « plus petit que ».', 'ce2_compare'),
        S('Ranger sur une droite', 'Sur la droite graduée de 100 en 100, plus on va vers la droite, plus le nombre est grand. 650 est entre 600 et 700, juste au milieu.', 'ce2_droite10'),
      ],
      recap: ['10 unités = 1 dizaine, 10 dizaines = 1 centaine, 10 centaines = 1 millier.', 'Chaque chiffre a une valeur selon sa place.', 'On décompose : 4 527 = 4 000 + 500 + 20 + 7.', 'Pour comparer, on regarde les chiffres de gauche à droite.'],
      quiz: [Q('Dans 5 308, quel est le chiffre des centaines ?', ['5', '0', '3'], 2), Q('Quel nombre est le plus grand ?', ['2 987', '3 012', '2 999'], 1), Q('4 000 + 300 + 6 = ?', ['4 306', '4 360', '4 036'], 0)] },

    /* ------------------------------------------------------------ 2. MULTIPLICATION POSÉE */
    { id: 'ce2-multiplication', subj: 'maths', level: 'ce2', icon: '✖️', title: 'La multiplication posée',
      intro: 'Pour calculer vite 47 paquets de 6 cartes, on pose la multiplication en colonnes, comme une addition bien rangée.',
      steps: [
        S('Poser en colonnes', 'On écrit les nombres l’un sous l’autre : <b>unités sous unités</b>, dizaines sous dizaines. On multiplie en commençant par les unités, à droite. 32 × 3 : 2 × 3 = 6, puis 3 × 3 = 9. Résultat : 96.', 'ce2_posee1'),
        S('La retenue', 'Quand un produit dépasse 9, on écrit le chiffre des unités et on <b>retient</b> les dizaines. 47 × 6 : 7 × 6 = 42, j’écris 2 et je retiens 4. Puis 4 × 6 = 24, et 24 + 4 = 28. Résultat : 282.', 'ce2_posee2'),
        S('Un nombre à trois chiffres', 'On fait pareil, colonne après colonne. 236 × 4 : 6 × 4 = 24 (j’écris 4, je retiens 2) ; 3 × 4 = 12 et 12 + 2 = 14 (j’écris 4, je retiens 1) ; 2 × 4 = 8 et 8 + 1 = 9. Résultat : 944.', 'ce2_posee3'),
        S('Multiplier par un nombre à deux chiffres', 'Pour 23 × 14, on fait deux multiplications. D’abord 23 × 4 = 92. Ensuite 23 × 10 = 230 : on écrit un <b>0</b> dans les unités. Enfin on additionne : 92 + 230 = 322.', 'ce2_posee4'),
        S('Vérifier avec un ordre de grandeur', 'Avant de poser, on arrondit. 47 × 6 est proche de 50 × 6 = 300. Le résultat 282 est proche de 300 : c’est bon. Retiens aussi : multiplier par 10, c’est ajouter un 0 (35 × 10 = 350).'),
      ],
      recap: ['On aligne les unités, les dizaines, les centaines.', 'On multiplie en commençant par la droite.', 'Si le produit dépasse 9, on écrit les unités et on retient les dizaines.', 'Avec deux chiffres, on ajoute une ligne qui finit par 0.'],
      quiz: [Q('32 × 3 = ?', ['86', '96', '69'], 1), Q('Dans 47 × 6, que fait-on avec 7 × 6 = 42 ?', ['J’écris 4 et je retiens 2', 'J’écris 2 et je retiens 4', 'J’écris 42 sans retenue'], 1), Q('35 × 10 = ?', ['350', '45', '305'], 0)] },

    /* ------------------------------------------------------------ 3. DIVISION */
    { id: 'ce2-division', subj: 'maths', level: 'ce2', icon: '➗', title: 'La division',
      intro: 'À la récréation, 12 billes à partager entre 3 amis : combien chacun en reçoit-il ? C’est une division.',
      steps: [
        S('Partager en parts égales', 'Je distribue les billes une à une, pour que chacun en ait <b>autant</b> que les autres. 12 billes pour 3 enfants : chacun en reçoit 4. On écrit <b>12 ÷ 3 = 4</b>.', 'ce2_partage'),
        S('Faire des groupes', 'Autre question : avec 12 billes, combien de groupes de 4 puis-je faire ? J’en fais 3. On écrit <b>12 ÷ 4 = 3</b>. Le signe ÷ se lit « divisé par ».', 'ce2_groupes'),
        S('La division et la multiplication', 'Diviser, c’est chercher le nombre qui manque dans une multiplication. Comme 3 × 4 = 12, on sait que 12 ÷ 3 = 4 et 12 ÷ 4 = 3. Les tables de multiplication aident à diviser !', 'ce2_famille'),
        S('Quand il reste des objets', 'Avec 14 billes en groupes de 4, je fais 3 groupes et il <b>reste 2</b> billes. On écrit <b>14 ÷ 4 = 3 reste 2</b>. Pour vérifier : 4 × 3 + 2 = 14.', 'ce2_reste'),
        S('Le reste est toujours petit', 'Le <b>reste</b> doit être plus petit que le nombre qui divise. Avec des groupes de 4, le reste ne peut être que 0, 1, 2 ou 3. S’il y avait 4 billes en trop, je pourrais faire un groupe de plus !'),
      ],
      recap: ['Diviser, c’est partager en parts égales ou faire des groupes.', 'Une division se vérifie avec une multiplication.', 'Le reste est plus petit que le nombre qui divise.'],
      quiz: [Q('20 ÷ 5 = ?', ['15', '4', '25'], 1), Q('17 ÷ 5 = ?', ['3 reste 2', '2 reste 3', '3 reste 5'], 0), Q('Je range 24 œufs par boîtes de 6. Combien de boîtes ?', ['3', '5', '4'], 2)] },

    /* ------------------------------------------------------------ 4. TABLES */
    { id: 'ce2-tables', subj: 'maths', level: 'ce2', icon: '🧮', title: 'Les tables de multiplication',
      intro: 'Connaître les tables par cœur, c’est comme avoir une calculatrice dans la tête. Voici des astuces pour toutes les retenir.',
      steps: [
        S('Une multiplication, c’est un rectangle', '3 × 7 veut dire 3 lignes de 7 jetons. Si on tourne le rectangle, on a 7 lignes de 3 jetons. On peut donc <b>changer l’ordre</b> : 3 × 7 = 7 × 3 = 21. On n’a qu’à apprendre la moitié des tables !', 'ce2_rect'),
        S('Les tables de 2, 5 et 10', 'Table de 2 : c’est le <b>double</b> (2 × 6 = 12). Table de 10 : on ajoute un 0 (10 × 7 = 70). Table de 5 : les résultats finissent par <b>0 ou 5</b>, et c’est la moitié de la table de 10 : 5 × 8 = 40.', 'ce2_table5'),
        S('La table de 9', 'Dans la table de 9, les <b>dizaines augmentent de 1</b> et les <b>unités diminuent de 1</b> : 09, 18, 27, 36… Et la somme des chiffres fait toujours 9 (par exemple 5 + 4 = 9 pour 54). Astuce : 9 × 6 = 6 × 10 − 6 = 54.', 'ce2_table9'),
        S('Doubler pour la table de 4', 'Pour multiplier par 4, je <b>double deux fois</b>. 7 × 4 : le double de 7 est 14, le double de 14 est 28. Donc 7 × 4 = 28. Pour la table de 8, je double encore une fois.', 'ce2_x4'),
        S('Les tables difficiles', 'Pour 6 × 7, je pars de 5 × 7 = 35 et j’ajoute 7 : 35 + 7 = 42. Pour 7 × 8, je retiens la petite suite <b>5, 6, 7, 8</b> : 56 = 7 × 8. Et 8 × 8 = 64.'),
      ],
      recap: ['3 × 7 = 7 × 3 : l’ordre ne change pas le résultat.', 'Table de 2 : double ; table de 10 : on ajoute un 0 ; table de 5 : finit par 0 ou 5.', 'Table de 9 : dizaines +1, unités −1.', 'Table de 4 : on double deux fois.'],
      quiz: [Q('7 × 8 = ?', ['54', '56', '48'], 1), Q('Quelle table donne toujours un résultat qui finit par 0 ou 5 ?', ['la table de 5', 'la table de 4', 'la table de 9'], 0), Q('Pour 4 × 6, je double 6 puis je double encore. Résultat ?', ['12', '18', '24'], 2)] },

    /* ------------------------------------------------------------ 5. FRACTIONS */
    { id: 'ce2-fractions', subj: 'maths', level: 'ce2', icon: '🍕', title: 'Moitié, quart, tiers',
      intro: 'Quand on partage une pizza ou une tablette de chocolat, chaque part est une fraction du tout. Découvrons les plus simples.',
      steps: [
        S('Des parts égales', 'Pour parler de fraction, il faut partager un objet en parts <b>toutes de la même taille</b>. Si les morceaux sont inégaux, ce n’est pas une fraction !', 'ce2_egales'),
        S('La moitié', 'Je partage en <b>2 parts égales</b> : chaque part est la <b>moitié</b>, on écrit ' + F(1, 2) + '. La moitié de 8 billes, c’est 4 billes (car 4 + 4 = 8).', 'ce2_moitie'),
        S('Le quart', 'Je partage en <b>4 parts égales</b> : chaque part est un <b>quart</b>, on écrit ' + F(1, 4) + '. C’est la moitié de la moitié. Trois parts sur quatre font <b>trois quarts</b> : ' + F(3, 4) + '.', 'ce2_quart'),
        S('Le tiers', 'Je partage en <b>3 parts égales</b> : chaque part est un <b>tiers</b>, on écrit ' + F(1, 3) + '. Le tiers de 12 billes, c’est 4 billes (car 4 + 4 + 4 = 12).', 'ce2_tiers'),
        S('Comparer des parts', 'Plus on coupe en beaucoup de parts, plus chaque part est <b>petite</b>. Donc ' + F(1, 2) + ' &gt; ' + F(1, 3) + ' &gt; ' + F(1, 4) + '. Un demi-gâteau est plus gros qu’un quart de gâteau.', 'ce2_compfrac'),
      ],
      recap: ['Une fraction partage en parts de même taille.', 'Moitié = 1 part sur 2, tiers = 1 part sur 3, quart = 1 part sur 4.', 'Plus il y a de parts, plus chaque part est petite.'],
      quiz: [Q('Quelle est la moitié de 8 ?', ['2', '6', '4'], 2), Q('Quelle part est la plus grande ?', ['1/4', '1/2', '1/3'], 1), Q('Le tiers de 12 billes, c’est…', ['4 billes', '3 billes', '6 billes'], 0)] },

    /* ------------------------------------------------------------ 6. PÉRIMÈTRE */
    { id: 'ce2-perimetre', subj: 'maths', level: 'ce2', icon: '📏', title: 'Le périmètre',
      intro: 'Une fourmi fait le tour du jardin. Quelle distance parcourt-elle ? C’est le périmètre du jardin.',
      steps: [
        S('Le tour d’une figure', 'Le <b>périmètre</b> d’une figure, c’est la <b>longueur de son contour</b>. Si la fourmi part d’un point et revient à ce point, elle a parcouru le périmètre.', 'ce2_fourmi'),
        S('Additionner les côtés', 'Pour trouver le périmètre d’un polygone, on <b>additionne la longueur de tous ses côtés</b>. Ici : 3 + 4 + 3 + 2 + 4 = 16, donc le périmètre est 16 cm.', 'ce2_polygone'),
        S('Le rectangle', 'Un rectangle a 2 côtés de même <b>longueur</b> et 2 côtés de même <b>largeur</b>. Pour 6 cm sur 3 cm : 6 + 3 + 6 + 3 = 18 cm. On peut aussi calculer 2 × 6 + 2 × 3 = 12 + 6 = 18 cm.', 'ce2_rect_p'),
        S('Le carré', 'Un carré a <b>4 côtés égaux</b>. Pour un côté de 5 cm : 5 + 5 + 5 + 5 = 20 cm, ou plus vite <b>4 × 5 = 20 cm</b>.', 'ce2_carre_p'),
        S('Attention aux unités', 'On additionne des longueurs qui ont la <b>même unité</b>. Un enclos de 3 m sur 2 m a pour périmètre 3 + 2 + 3 + 2 = 10 m. Rappel : 1 m = 100 cm.'),
      ],
      recap: ['Le périmètre est la longueur du contour d’une figure.', 'On additionne tous les côtés.', 'Carré : 4 × côté. Rectangle : 2 longueurs + 2 largeurs.', 'On écrit l’unité (cm, m) dans la réponse.'],
      quiz: [Q('Quel est le périmètre d’un carré de côté 6 cm ?', ['12 cm', '24 cm', '36 cm'], 1), Q('Quel est le périmètre d’un rectangle de 8 cm sur 3 cm ?', ['11 cm', '24 cm', '22 cm'], 2), Q('Un triangle a des côtés de 5 cm, 6 cm et 7 cm. Son périmètre est…', ['18 cm', '12 cm', '210 cm'], 0)] },

    /* ------------------------------------------------------------ 7. SYMÉTRIE */
    { id: 'ce2-symetrie', subj: 'maths', level: 'ce2', icon: '🦋', title: 'La symétrie',
      intro: 'Les ailes d’un papillon se ressemblent comme dans un miroir. Les deux côtés sont symétriques.',
      steps: [
        S('L’axe de symétrie', 'Une figure est <b>symétrique</b> quand une ligne la partage en deux moitiés qui se superposent exactement. Cette ligne s’appelle l’<b>axe de symétrie</b>. Le papillon a un axe vertical.', 'ce2_papillon'),
        S('Le test du pliage', 'Pour vérifier, on <b>plie</b> la feuille sur l’axe. Si les deux côtés se recouvrent parfaitement, l’axe est bon. On peut aussi découper : un cœur en papier se plie en deux.', 'ce2_pliage'),
        S('Le symétrique d’un point', 'Le point A’ est le symétrique de A si A et A’ sont <b>à la même distance de l’axe</b>, de chaque côté, sur une ligne droite qui coupe l’axe à angle droit. Sur un quadrillage, on compte les carreaux.', 'ce2_points'),
        S('Combien d’axes ?', 'Un <b>carré</b> a 4 axes de symétrie. Un <b>rectangle</b> (qui n’est pas un carré) en a 2. Un triangle qui a seulement deux côtés égaux en a 1. Certaines figures n’en ont aucun.', 'ce2_axes'),
        S('Les lettres', 'Certaines lettres ont un axe de symétrie : A, H, M. D’autres n’en ont pas : F, R. Pour le savoir, imagine un miroir posé au milieu de la lettre.', 'ce2_lettres'),
      ],
      recap: ['L’axe de symétrie partage une figure en deux moitiés identiques.', 'On vérifie par pliage.', 'Un point et son symétrique sont à la même distance de l’axe.', 'Carré : 4 axes. Rectangle : 2 axes.'],
      quiz: [Q('Combien d’axes de symétrie a un carré ?', ['4', '2', '1'], 0), Q('A est à 3 carreaux de l’axe. À combien de carreaux est son symétrique A’ ?', ['6', '3', '1'], 1), Q('Quelle lettre a un axe de symétrie ?', ['F', 'R', 'H'], 2)] },

    /* ------------------------------------------------------------ 8. EUROS */
    { id: 'ce2-euros', subj: 'maths', level: 'ce2', icon: '💶', title: 'Les euros et les centimes',
      intro: 'À la boulangerie, il faut payer et vérifier la monnaie. Pour cela, on doit bien connaître les pièces et les billets.',
      steps: [
        S('Euro et centime', 'La monnaie utilisée en France est l’<b>euro</b> (€). Un euro se partage en <b>100 centimes</b>. Donc <b>1 € = 100 centimes</b>, et 50 centimes, c’est la moitié d’un euro.', 'ce2_euro'),
        S('Pièces et billets', 'Les pièces valent 1, 2, 5, 10, 20 et 50 centimes, puis 1 € et 2 €. Les billets valent 5 €, 10 €, 20 €, 50 € (et plus). Une pièce de 2 €, c’est 200 centimes.', 'ce2_pieces'),
        S('Écrire une somme', 'On sépare les euros et les centimes avec une <b>virgule</b>. 3 euros et 45 centimes s’écrit <b>3,45 €</b>. En centimes, c’est 345 centimes. Avec des pièces : 3 € + 40 c + 5 c.', 'ce2_somme'),
        S('Rendre la monnaie', 'Un livre coûte 3,60 € et je donne 5 €. Pour rendre la monnaie, je <b>complète</b> : de 3,60 € à 4 €, il y a 40 centimes ; de 4 € à 5 €, il y a 1 €. Je rends 1,40 €.', 'ce2_monnaie'),
        S('Calculer un prix', 'Quatre gâteaux à 2 € coûtent 4 × 2 = 8 €. Deux cahiers à 1,50 € coûtent 1,50 + 1,50 = 3 €. On additionne ou on multiplie, comme pour les autres nombres.'),
      ],
      recap: ['1 € = 100 centimes.', 'On écrit 3 € 45 centimes : 3,45 €.', 'Pour rendre la monnaie, on complète jusqu’à la somme donnée.', 'Prix total = nombre d’objets × prix d’un objet.'],
      quiz: [Q('2,50 € en centimes, cela fait…', ['25 centimes', '250 centimes', '205 centimes'], 1), Q('Je paie un livre de 7 € avec un billet de 10 €. Combien me rend-on ?', ['3 €', '4 €', '2 €'], 0), Q('3 pièces de 50 centimes valent…', ['1 €', '2 €', '1,50 €'], 2)] },

    /* ------------------------------------------------------------ 9. DURÉES */
    { id: 'ce2-durees', subj: 'maths', level: 'ce2', icon: '⏰', title: 'Les durées',
      intro: 'Le film commence à 15 h. À quelle heure finit-il ? Pour répondre, il faut savoir lire l’heure et calculer une durée.',
      steps: [
        S('Heures, minutes, secondes', '<b>1 heure = 60 minutes</b> et <b>1 minute = 60 secondes</b>. L’heure s’écrit « h », la minute « min » et la seconde « s ». Une journée dure 24 heures.', 'ce2_unites'),
        S('Lire l’horloge', 'La <b>petite aiguille</b> montre les heures, la <b>grande aiguille</b> montre les minutes. À 3 h, la grande aiguille est sur le 12. À 3 h 30, elle est sur le 6 et la petite aiguille est entre le 3 et le 4.', 'ce2_horloge'),
        S('Quart d’heure et demi-heure', 'Un <b>quart d’heure</b>, c’est 15 minutes. Une <b>demi-heure</b>, c’est 30 minutes. Trois quarts d’heure, c’est 45 minutes. Quatre quarts d’heure font une heure entière.', 'ce2_quart_h'),
        S('Calculer une durée', 'De 14 h 30 à 16 h, il s’écoule combien de temps ? De 14 h 30 à 15 h : 30 minutes. De 15 h à 16 h : 1 heure. Au total : <b>1 h 30</b>. On avance de repère en repère, comme sur une droite.', 'ce2_duree'),
        S('Jours, semaines, mois', '1 semaine = 7 jours. 1 année = 12 mois, soit 365 jours (366 les années bissextiles). Certains mois ont 30 jours, d’autres 31 jours, et février en a 28 (ou 29).'),
      ],
      recap: ['1 h = 60 min ; 1 min = 60 s.', 'Quart d’heure = 15 min, demi-heure = 30 min.', 'Pour une durée, on avance par étapes jusqu’à l’heure d’arrivée.', '1 semaine = 7 jours ; 1 année = 12 mois.'],
      quiz: [Q('1 heure = ? minutes', ['30', '100', '60'], 2), Q('Un film commence à 15 h et finit à 16 h 45. Combien de temps dure-t-il ?', ['1 h 45', '1 h 15', '2 h 45'], 0), Q('Un quart d’heure, c’est… minutes.', ['25', '15', '10'], 1)] },
  );
})();
