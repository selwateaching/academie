/* Cours illustrés : CM2 (10-11 ans), maths. */
(function () {
  'use strict';
  const K = window.CourseKit, { F, C, svg, T, L, ARROW, S, Q, FIG } = K;

  // Outils locaux (texte avec couleur / ancrage, rectangle, secteur de disque)
  const X = (x, y, s, o = {}) => `<text x="${x}" y="${y}" fill="${o.c || 'currentColor'}" stroke="none" font-size="${o.s || 13}" font-weight="${o.w || 700}" text-anchor="${o.a || 'middle'}"${o.k ? ` class="${o.k}"` : ''}>${s}</text>`;
  const R = (x, y, w, h, c, fo = 0.2, o = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" fill-opacity="${fo}" stroke="${c}" stroke-width="2.5" ${o}/>`;
  const rad = (a) => a * Math.PI / 180;
  const wedge = (cx, cy, r, a0, a1, c, fo = 0.35) => {
    const p = (a) => [(cx + r * Math.sin(rad(a))).toFixed(1), (cy - r * Math.cos(rad(a))).toFixed(1)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z" fill="${c}" fill-opacity="${fo}" stroke="${c}" stroke-width="2.5"/>`;
  };
  // barre partagée en n parts égales ; fills = couleur (ou '') pour chaque part
  const bar = (x, y, w, h, fills) => {
    const n = fills.length, pw = w / n; let b = '';
    fills.forEach((c, i) => { b += `<rect x="${(x + i * pw).toFixed(1)}" y="${y}" width="${pw.toFixed(1)}" height="${h}" fill="${c || 'none'}" fill-opacity="${c ? 0.4 : 0}" stroke="currentColor" stroke-width="2"/>`; });
    return b;
  };

  Object.assign(FIG, {
    /* ---------- décimaux ---------- */
    cm2_dectab: () => {
      const o = 17;
      let b = R(38 + o, 28, 64, 50, C.brand, 0.15) + R(148 + o, 28, 64, 50, C.bleu, 0.15) + R(224 + o, 28, 64, 50, C.or, 0.15);
      b += X(70 + o, 65, '3', { s: 30 }) + X(125 + o, 66, ',', { s: 34, c: C.rouge, k: 'pop' }) + X(180 + o, 65, '4', { s: 30 }) + X(256 + o, 65, '5', { s: 30 });
      b += X(70 + o, 100, 'unités', { s: 12 }) + X(180 + o, 100, 'dixièmes', { s: 12, c: C.bleu }) + X(256 + o, 100, 'centièmes', { s: 12, c: C.or });
      b += X(180, 135, '3,45 = 3 + 0,4 + 0,05', { s: 15 });
      return svg(360, 150, b);
    },
    cm2_decdroite: () => {
      let b = L(20, 60, 340, 60, 'currentColor', 3);
      for (let i = 0; i <= 10; i++) b += L(30 + 30 * i, i % 5 === 0 ? 50 : 54, 30 + 30 * i, i % 5 === 0 ? 70 : 66, 'currentColor', 2);
      b += X(30, 90, '2,4', { s: 12 }) + X(180, 90, '2,45', { s: 12 }) + X(330, 90, '2,5', { s: 12 });
      b += `<circle class="pop" cx="120" cy="60" r="8" fill="${C.bleu}"/>` + X(120, 36, '2,43', { c: C.bleu });
      b += `<circle class="pop" cx="240" cy="60" r="8" fill="${C.or}"/>` + X(240, 36, '2,47', { c: C.or });
      b += X(180, 118, '2,43 &lt; 2,47', { s: 16 });
      return svg(360, 130, b);
    },
    cm2_decadd: () => {
      const cx = 200, step = 26;
      const digit = (x, y, s, c) => X(x, y, s, { s: 26, c });
      const row = (y, ip, dp, c, extra = {}) => {
        let r = X(cx, y, ',', { s: 26, c });
        [...ip].reverse().forEach((d, k) => { r += digit(cx - 13 - step * k, y, d, c); });
        [...dp].forEach((d, k) => { r += digit(cx + 13 + step * k, y, d, extra[k] || c); });
        return r;
      };
      let b = `<line class="dash" x1="${cx}" y1="14" x2="${cx}" y2="138" stroke="${C.or}" stroke-width="2"/>`;
      b += row(44, '12', '50', 'currentColor').replace(`>0</text>`, ` class="pulse">0</text>`).replace(`fill="currentColor" stroke="none" font-size="26" font-weight="700" text-anchor="middle" class="pulse"`, `fill="${C.rouge}" stroke="none" font-size="26" font-weight="700" text-anchor="middle" class="pulse"`);
      b += X(104, 80, '+', { s: 26 }) + row(80, '3', '75', 'currentColor');
      b += L(90, 92, 290, 92, 'currentColor', 3);
      b += row(126, '16', '25', C.vert);
      return svg(360, 140, b);
    },
    cm2_decx10: () => {
      const rows = [[40, '3,4', '× 10', '34'], [85, '0,56', '× 100', '56'], [130, '7', '÷ 10', '0,7']];
      let b = ARROW('c2m1', C.brand);
      rows.forEach(([y, a, op, r]) => {
        b += X(120, y + 6, a, { s: 22, a: 'end' }) + X(240, y + 6, r, { s: 22, a: 'start', c: C.vert });
        b += `<line class="dash" x1="135" y1="${y}" x2="222" y2="${y}" stroke="${C.brand}" stroke-width="3" marker-end="url(#c2m1)"/>` + X(178, y - 10, op, { c: C.brand });
      });
      return svg(360, 150, b);
    },

    /* ---------- fractions ---------- */
    cm2_frbar: () => {
      let b = bar(40, 20, 280, 44, [C.bleu, C.bleu, C.bleu, '']);
      b += `<rect class="pulse" x="180" y="20" width="70" height="44" fill="${C.bleu}" fill-opacity=".3"/>`;
      b += X(180, 92, '3 parts prises', { c: C.bleu, s: 14 }) + X(180, 118, '4 parts égales', { c: C.gris, s: 14 });
      return svg(360, 130, b);
    },
    cm2_frdroite: () => {
      let b = ARROW('c2m2', 'currentColor') + `<line x1="20" y1="60" x2="345" y2="60" stroke="currentColor" stroke-width="3" marker-end="url(#c2m2)"/>`;
      for (let i = 0; i <= 12; i++) b += L(30 + 25 * i, i % 4 === 0 ? 50 : 54, 30 + 25 * i, i % 4 === 0 ? 70 : 66, 'currentColor', i % 4 === 0 ? 3 : 2);
      b += X(30, 90, '0') + X(130, 90, '1') + X(230, 90, '2');
      b += `<path class="draw" pathLength="100" d="M30 56Q67 22 105 56" stroke="${C.bleu}" stroke-width="3"/>`;
      b += `<circle class="pop" cx="105" cy="60" r="7" fill="${C.bleu}"/>` + X(105, 26, '3/4', { c: C.bleu });
      b += `<circle class="pop" cx="155" cy="60" r="7" fill="${C.or}"/>` + X(155, 108, '5/4', { c: C.or });
      return svg(360, 120, b);
    },
    cm2_frcomp: () => {
      let b = bar(40, 12, 280, 30, [C.bleu, C.bleu, '', '', '']) + bar(40, 56, 280, 30, [C.or, C.or, C.or, C.or, '']);
      b += X(180, 114, '2/5 &lt; 4/5', { s: 17 });
      return svg(360, 125, b);
    },
    cm2_fradd: () => {
      let b = bar(33, 22, 294, 36, [C.bleu, C.bleu, C.or, C.or, C.or, '', '']);
      b += `<path d="M36 66V72H120V66" stroke="${C.bleu}" stroke-width="2.5"/>` + `<path d="M123 66V72H249V66" stroke="${C.or}" stroke-width="2.5"/>`;
      b += X(78, 90, '2/7', { c: C.bleu }) + X(186, 90, '3/7', { c: C.or });
      b += X(180, 122, '2/7 + 3/7 = 5/7', { s: 17, c: C.vert, k: 'pop' });
      return svg(360, 135, b);
    },
    cm2_frqty: () => {
      let b = '';
      [55, 135, 215, 295].forEach((cx, g) => {
        const col = g < 3 ? C.vert : C.gris;
        b += R(cx - 38, 28, 76, 34, col, g < 3 ? 0.18 : 0.08, g === 2 ? 'class="pulse"' : '');
        for (let k = 0; k < 5; k++) b += `<circle cx="${cx - 28 + k * 14}" cy="45" r="5.5" fill="${col}"/>`;
      });
      b += X(180, 92, '1 groupe = 5 billes', { s: 14 }) + X(180, 118, '3 groupes = 15 billes', { s: 14, c: C.vert });
      return svg(360, 135, b);
    },

    /* ---------- pourcentages ---------- */
    cm2_pct100: () => {
      let b = '';
      for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
        const on = r < 5 && c < 5;
        b += `<rect${on && r === 4 && c === 4 ? ' class="pulse"' : ''} x="${20 + c * 15}" y="${8 + r * 15}" width="13" height="13" rx="2" fill="${on ? C.bleu : 'none'}" fill-opacity="${on ? 0.55 : 0}" stroke="${on ? C.bleu : C.gris}" stroke-opacity="${on ? 1 : 0.5}" stroke-width="1.5"/>`;
      }
      b += X(258, 66, '25 sur 100', { s: 16 }) + X(258, 104, '= 25 %', { s: 26, c: C.bleu, k: 'pop' });
      return svg(360, 170, b);
    },
    cm2_pctpie: () => {
      let b = `<circle cx="100" cy="62" r="46" stroke="currentColor" stroke-width="2.5"/>` + wedge(100, 62, 46, 0, 180, C.bleu);
      b += `<circle cx="260" cy="62" r="46" stroke="currentColor" stroke-width="2.5"/>` + wedge(260, 62, 46, 0, 90, C.or);
      b += X(100, 132, '50 %', { s: 17, c: C.bleu }) + X(100, 152, 'la moitié', { s: 12 });
      b += X(260, 132, '25 %', { s: 17, c: C.or }) + X(260, 152, 'le quart', { s: 12 });
      return svg(360, 162, b);
    },
    cm2_pct10: () => {
      let b = X(180, 16, '50 billes', { s: 13 }) + bar(30, 26, 300, 40, [C.vert, '', '', '', '', '', '', '', '', '']);
      for (let i = 0; i < 10; i++) b += X(45 + 30 * i, 52, '5', { s: 15, c: i === 0 ? C.vert : 'currentColor', k: i === 0 ? 'pop' : '' });
      b += X(180, 100, '10 % de 50 = 5', { s: 17, c: C.vert });
      return svg(360, 115, b);
    },
    cm2_pctsolde: () => {
      let b = ARROW('c2m3', C.brand);
      b += R(25, 28, 90, 50, C.gris, 0.1) + X(70, 61, '40 €', { s: 20 }) + L(32, 72, 108, 34, C.rouge, 3.5);
      b += `<circle class="pop" cx="170" cy="53" r="27" fill="${C.rouge}"/>` + X(170, 58, '−10 %', { s: 15, c: '#fff' });
      b += `<line x1="205" y1="53" x2="240" y2="53" stroke="${C.brand}" stroke-width="3" marker-end="url(#c2m3)"/>`;
      b += R(250, 28, 90, 50, C.vert, 0.2) + X(295, 62, '36 €', { s: 21, c: C.vert });
      b += X(180, 110, '10 % de 40 = 4', { s: 15 }) + X(180, 134, '40 − 4 = 36', { s: 15, c: C.vert });
      return svg(360, 145, b);
    },

    /* ---------- proportionnalité ---------- */
    cm2_propbis: () => {
      let b = '';
      [40, 140, 240].forEach((x) => {
        b += R(x, 22, 80, 52, C.or, 0.12);
        for (let k = 0; k < 4; k++) b += `<circle${k === 3 ? ' class="pop"' : ''} cx="${x + 24 + (k % 2) * 32}" cy="${40 + Math.floor(k / 2) * 22}" r="8" fill="${C.or}"/>`;
      });
      b += X(180, 104, '1 paquet = 4 biscuits', { s: 14 }) + X(180, 128, '3 paquets = 12 biscuits', { s: 14, c: C.or });
      return svg(360, 140, b);
    },
    cm2_proptab: () => {
      let b = ARROW('c2m4', C.brand);
      const xs = [110, 170, 230, 290], a = [1, 2, 3, 5], p = [2, 4, 6, 10];
      b += X(72, 55, 'cahiers', { a: 'end' }) + X(72, 112, 'prix (€)', { a: 'end', c: C.or });
      xs.forEach((x, i) => {
        b += R(x - 24, 30, 48, 34, C.bleu, 0.12) + X(x, 53, a[i], { s: 17 });
        b += R(x - 24, 88, 48, 34, C.or, 0.12) + X(x, 111, p[i], { s: 17 });
      });
      b += `<path class="dash" d="M318 47C345 50 345 100 320 105" stroke="${C.brand}" stroke-width="3" marker-end="url(#c2m4)"/>` + X(346, 80, '×2', { c: C.brand, s: 14 });
      return svg(360, 140, b);
    },
    cm2_propunite: () => {
      let b = ARROW('c2m5', C.brand);
      const ys = [40, 85, 130], lt = ['5 stylos', '1 stylo', '8 stylos'], rt = ['10 €', '2 €', '16 €'];
      ys.forEach((y, i) => {
        b += R(70, y - 15, 80, 30, C.bleu, 0.12) + X(110, y + 5, lt[i]);
        b += R(210, y - 15, 80, 30, C.or, 0.12) + X(250, y + 5, rt[i]);
        b += `<line class="dash" x1="158" y1="${y}" x2="202" y2="${y}" stroke="${C.gris}" stroke-width="2"/>`;
      });
      [[0, 1, '÷ 5'], [1, 2, '× 8']].forEach(([i, j, t]) => {
        const y1 = ys[i] + 10, y2 = ys[j] - 10;
        b += `<path d="M68 ${y1}C36 ${y1} 36 ${y2} 66 ${y2}" stroke="${C.brand}" stroke-width="3" marker-end="url(#c2m5)"/>` + X(22, (y1 + y2) / 2 + 5, t, { c: C.brand, s: 12 });
        b += `<path d="M292 ${y1}C324 ${y1} 324 ${y2} 294 ${y2}" stroke="${C.brand}" stroke-width="3" marker-end="url(#c2m5)"/>` + X(338, (y1 + y2) / 2 + 5, t, { c: C.brand, s: 12 });
      });
      return svg(360, 155, b);
    },
    cm2_propgraph: () => {
      let b = ARROW('c2m6', 'currentColor') + `<line x1="50" y1="140" x2="345" y2="140" stroke="currentColor" stroke-width="2.5" marker-end="url(#c2m6)"/><line x1="50" y1="140" x2="50" y2="14" stroke="currentColor" stroke-width="2.5" marker-end="url(#c2m6)"/>`;
      b += `<path class="draw" pathLength="100" d="M50 140L210 20" stroke="${C.vert}" stroke-width="3"/>`;
      for (let k = 1; k <= 4; k++) b += `<circle class="pop" cx="${50 + 40 * k}" cy="${140 - 30 * k}" r="6" fill="${C.or}"/>` + X(50 + 40 * k, 154, k, { s: 12 }) + X(40, 144 - 30 * k, 2 * k, { s: 12, a: 'end' });
      b += X(44, 154, '0', { s: 12, a: 'end' }) + X(305, 130, 'cahiers', { s: 12 }) + X(110, 14, 'prix (€)', { s: 12 });
      return svg(360, 165, b);
    },

    /* ---------- aires et volumes ---------- */
    cm2_perim: () => {
      let b = R(90, 32, 180, 90, C.bleu, 0.1, 'stroke-opacity=".3"');
      b += `<rect class="draw" pathLength="100" x="90" y="32" width="180" height="90" stroke="${C.rouge}" stroke-width="4"/>`;
      b += X(180, 24, '6 cm') + X(180, 140, '6 cm') + X(80, 82, '3 cm', { a: 'end' }) + X(280, 82, '3 cm', { a: 'start' });
      b += X(180, 160, 'P = 6 + 3 + 6 + 3 = 18 cm', { c: C.rouge, s: 14 });
      return svg(360, 168, b);
    },
    cm2_aire: () => {
      let b = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
        const hi = r === 2 && c === 4;
        b += `<rect${hi ? ' class="pulse"' : ''} x="${40 + c * 30}" y="${24 + r * 30}" width="30" height="30" fill="${hi ? C.or : C.vert}" fill-opacity="${hi ? 0.6 : 0.2}" stroke="${C.vert}" stroke-width="2"/>`;
      }
      b += X(115, 16, '5 cm') + X(32, 74, '3 cm', { a: 'end' }) + X(115, 130, '1 carreau = 1 cm²', { s: 12, c: C.or });
      b += X(272, 68, '5 × 3 = 15', { s: 19 }) + X(272, 100, '15 cm²', { s: 22, c: C.vert });
      return svg(360, 142, b);
    },
    cm2_triangle: () => {
      let b = '<g transform="translate(26 0)">' + R(30, 20, 130, 80, C.gris, 0.06, 'stroke-opacity=".5"');
      b += `<path d="M30 100V20H160Z" fill="${C.bleu}" fill-opacity=".3" stroke="${C.bleu}" stroke-width="3"/>`;
      b += `<path class="dash" d="M30 20L160 100" stroke="${C.rouge}" stroke-width="2.5"/>`;
      b += `<path d="M30 88H42V100" stroke="currentColor" stroke-width="2"/>`;
      b += X(95, 118, '6 cm') + X(22, 64, '4 cm', { a: 'end' }) + '</g>';
      b += X(270, 40, '6 × 4 = 24', { s: 16 }) + X(270, 72, '24 ÷ 2 = 12', { s: 16 }) + X(270, 104, '12 cm²', { s: 21, c: C.bleu, k: 'pop' });
      return svg(360, 128, b);
    },
    cm2_pave: () => {
      const ox = 60, oy = 0, dx = 12, dy = -8;
      const P = (x, y) => `${x + ox} ${y + oy}`;
      let b = `<path d="M${P(0, 70)}H${104 + ox}V${122}H${ox}Z" fill="${C.bleu}" fill-opacity=".15"/>`;
      b += `<path d="M${P(0, 70)}L${P(36, 46)}H${140 + ox}L${P(104, 70)}Z" fill="${C.bleu}" fill-opacity=".3"/>`;
      b += `<path d="M${P(104, 70)}L${P(140, 46)}V98L${P(104, 122)}Z" fill="${C.bleu}" fill-opacity=".08"/>`;
      b += `<rect class="pulse" x="${ox + 78}" y="96" width="26" height="26" fill="${C.or}" fill-opacity=".6"/>`;
      let g = '';
      for (let k = 1; k <= 3; k++) g += `M${P(26 * k, 70)}V122M${P(26 * k, 70)}L${P(26 * k + 36, 46)}`;
      g += `M${P(0, 96)}H${104 + ox}`;
      for (let j = 1; j <= 2; j++) g += `M${P(12 * j, 70 - 8 * j)}H${104 + 12 * j + ox}M${P(104 + 12 * j, 70 - 8 * j)}V${122 - 8 * j}`;
      g += `M${P(104, 96)}L${P(140, 72)}`;
      b += `<path d="${g}" stroke="${C.bleu}" stroke-width="1.5"/>`;
      b += `<path d="M${P(0, 70)}H${104 + ox}V122H${ox}ZM${P(0, 70)}L${P(36, 46)}H${140 + ox}L${P(104, 70)}M${P(140, 46)}V98L${P(104, 122)}" stroke="${C.brand}" stroke-width="3"/>`;
      b += X(ox + 52, 142, '4') + X(ox - 14, 100, '2') + X(ox + 160, 66, '3');
      b += X(285, 66, '4 × 3 × 2', { s: 16 }) + X(285, 98, '= 24 cm³', { s: 19, c: C.bleu });
      return svg(360, 152, b);
    },
    cm2_litre: () => {
      let b = `<path d="M40 40H110V110H40Z" fill="${C.bleu}" fill-opacity=".2"/><path d="M40 40L64 24H134L110 40M134 24V94L110 110" fill="${C.bleu}" fill-opacity=".1"/>`;
      b += `<path d="M40 40H110V110H40ZM40 40L64 24H134L110 40M134 24V94L110 110" stroke="${C.brand}" stroke-width="3"/>`;
      b += X(75, 130, '10 cm') + X(135, 124, '10 cm', { a: 'start', s: 12 });
      b += X(250, 44, '1 dm³', { s: 19 }) + X(250, 76, '= 1 L', { s: 22, c: C.bleu, k: 'pop' }) + X(250, 106, '= 1000 cm³', { s: 15 });
      return svg(360, 140, b);
    },

    /* ---------- symétrie ---------- */
    cm2_axe: () => {
      let b = `<path d="M180 30L130 72V122H180Z" fill="${C.bleu}" fill-opacity=".25" stroke="${C.bleu}" stroke-width="3"/>`;
      b += `<path d="M180 30L230 72V122H180Z" fill="${C.vert}" fill-opacity=".25" stroke="${C.vert}" stroke-width="3"/>`;
      b += R(142, 84, 18, 18, C.bleu, 0.3) + R(200, 84, 18, 18, C.vert, 0.3) + R(168, 100, 24, 22, C.or, 0.25);
      b += `<line class="dash" x1="180" y1="18" x2="180" y2="136" stroke="${C.rouge}" stroke-width="3"/>`;
      b += X(180, 12, 'axe de symétrie', { s: 12, c: C.rouge });
      return svg(360, 148, b);
    },
    cm2_sympoint: () => {
      let b = `<line class="dash" x1="180" y1="10" x2="180" y2="132" stroke="${C.rouge}" stroke-width="3"/>`;
      b += `<line class="dash" x1="95" y1="45" x2="265" y2="45" stroke="${C.gris}" stroke-width="2"/><line class="dash" x1="135" y1="100" x2="225" y2="100" stroke="${C.gris}" stroke-width="2"/>`;
      b += `<circle cx="95" cy="45" r="6" fill="${C.bleu}"/><circle class="pop" cx="265" cy="45" r="6" fill="${C.vert}"/><circle cx="135" cy="100" r="6" fill="${C.bleu}"/><circle class="pop" cx="225" cy="100" r="6" fill="${C.vert}"/>`;
      b += `<path d="M172 45V53H180" stroke="currentColor" stroke-width="1.8"/>` + L(137, 39, 137, 51, C.or, 2.5) + L(223, 39, 223, 51, C.or, 2.5);
      b += X(80, 40, 'A', { c: C.bleu }) + X(280, 40, 'A’', { c: C.vert }) + X(120, 118, 'B', { c: C.bleu }) + X(240, 118, 'B’', { c: C.vert });
      return svg(360, 140, b);
    },
    cm2_symgrille: () => {
      let b = '';
      for (let c = 0; c <= 12; c++) b += L(36 + 24 * c, 12, 36 + 24 * c, 156, C.gris, 1).replace('/>', ' stroke-opacity=".35"/>');
      for (let r = 0; r <= 6; r++) b += L(36, 12 + 24 * r, 324, 12 + 24 * r, C.gris, 1).replace('/>', ' stroke-opacity=".35"/>');
      b += `<line class="dash" x1="180" y1="4" x2="180" y2="164" stroke="${C.rouge}" stroke-width="3"/>`;
      const P = [[2, 1], [5, 3], [2, 5]], pt = (c, r) => `${36 + 24 * c} ${12 + 24 * r}`;
      P.forEach(([c, r]) => { b += `<line x1="${36 + 24 * c}" y1="${12 + 24 * r}" x2="${36 + 24 * (12 - c)}" y2="${12 + 24 * r}" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="4 4"/>`; });
      b += `<path d="M${pt(2, 1)}L${pt(5, 3)}L${pt(2, 5)}Z" fill="${C.bleu}" fill-opacity=".3" stroke="${C.bleu}" stroke-width="3"/>`;
      b += `<path class="pulse" d="M${pt(10, 1)}L${pt(7, 3)}L${pt(10, 5)}Z" fill="${C.vert}" fill-opacity=".3" stroke="${C.vert}" stroke-width="3"/>`;
      return svg(360, 168, b);
    },
    cm2_axes4: () => {
      const ax = (x1, y1, x2, y2) => `<line class="dash" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.rouge}" stroke-width="2"/>`;
      let b = R(30, 20, 60, 60, C.bleu, 0.2) + ax(60, 10, 60, 90) + ax(20, 50, 100, 50) + ax(24, 14, 96, 86) + ax(96, 14, 24, 86);
      b += R(140, 25, 80, 50, C.or, 0.2) + ax(180, 15, 180, 85) + ax(130, 50, 230, 50);
      b += `<path d="M300 18L268 73H332Z" fill="${C.vert}" fill-opacity=".2" stroke="${C.vert}" stroke-width="2.5"/>` + ax(300, 8, 300, 84) + ax(260, 78, 322, 42) + ax(340, 78, 278, 42);
      b += X(60, 110, '4 axes') + X(180, 110, '2 axes') + X(300, 110, '3 axes');
      return svg(360, 122, b);
    },

    /* ---------- triangles et angles ---------- */
    cm2_angles: () => {
      let b = L(40, 100, 110, 100, C.bleu, 3.5) + L(40, 100, 90, 50, C.bleu, 3.5) + `<path class="pulse" d="M65 100A25 25 0 0 0 57.7 82.3" stroke="${C.or}" stroke-width="3"/>`;
      b += L(140, 100, 210, 100, C.vert, 3.5) + L(140, 100, 140, 30, C.vert, 3.5) + `<path class="pulse" d="M140 86H154V100" stroke="${C.or}" stroke-width="3"/>`;
      b += L(265, 100, 335, 100, C.rouge, 3.5) + L(265, 100, 220, 55, C.rouge, 3.5) + `<path class="pulse" d="M290 100A25 25 0 0 0 247.3 82.3" stroke="${C.or}" stroke-width="3"/>`;
      b += X(75, 130, 'aigu', { c: C.bleu }) + X(175, 130, 'droit', { c: C.vert }) + X(285, 130, 'obtus', { c: C.rouge });
      return svg(360, 145, b);
    },
    cm2_rapporteur: () => {
      const cx = 180, cy = 135, r = 100;
      const pt = (a, rr) => [(cx + rr * Math.cos(rad(a))).toFixed(1), (cy - rr * Math.sin(rad(a))).toFixed(1)];
      let b = `<path d="M${cx - r - 8} ${cy}A${r + 8} ${r + 8} 0 0 1 ${cx + r + 8} ${cy}Z" fill="${C.bleu}" fill-opacity=".08" stroke="currentColor" stroke-width="2.5"/>`;
      for (let a = 0; a <= 180; a += 10) { const [x1, y1] = pt(a, r), [x2, y2] = pt(a, a % 30 === 0 ? r - 10 : r - 5); b += L(x1, y1, x2, y2, 'currentColor', a % 30 === 0 ? 2 : 1.2); }
      for (let a = 0; a <= 180; a += 30) { const [x, y] = pt(a, r - 22); b += X(x, (+y + 4).toFixed(1), a, { s: 11 }); }
      const [ex, ey] = pt(60, 104);
      b += L(cx, cy, cx + 135, cy, C.gris, 2.5) + `<line class="draw" pathLength="100" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${C.rouge}" stroke-width="3.5"/>`;
      b += `<path class="pulse" d="M${cx + 34} ${cy}A34 34 0 0 0 ${pt(60, 34).join(' ')}" stroke="${C.or}" stroke-width="3.5"/>` + X(cx + 52, cy - 18, '60°', { c: C.or, s: 15 });
      return svg(360, 148, b);
    },
    cm2_tri3: () => {
      const tk = (x1, y1, x2, y2) => L(x1, y1, x2, y2, C.rouge, 2.5);
      let b = `<path d="M60 25L20 95H100Z" fill="${C.bleu}" fill-opacity=".2" stroke="${C.bleu}" stroke-width="3"/>` + tk(35.7, 57.5, 44.3, 62.5) + tk(75.7, 62.5, 84.3, 57.5);
      b += `<path d="M180 25L145 86H215Z" fill="${C.vert}" fill-opacity=".2" stroke="${C.vert}" stroke-width="3"/>` + tk(158.2, 53, 166.8, 58) + tk(193.2, 58, 201.8, 53) + tk(180, 81, 180, 91);
      b += `<path d="M260 95V30L340 95Z" fill="${C.or}" fill-opacity=".2" stroke="${C.or}" stroke-width="3"/><path class="pulse" d="M260 83H272V95" stroke="${C.rouge}" stroke-width="2.5"/>`;
      b += X(60, 125, 'isocèle', { s: 12 }) + X(180, 125, 'équilatéral', { s: 12 }) + X(300, 125, 'rectangle', { s: 12 });
      return svg(360, 138, b);
    },
    cm2_tri180: () => {
      let b = `<path d="M129.7 16.9L60 100H160Z" fill="${C.bleu}" fill-opacity=".2" stroke="${C.bleu}" stroke-width="3"/>`;
      b += X(86, 93, '50°', { s: 12, c: C.rouge }) + X(136, 93, '70°', { s: 12, c: C.vert }) + X(129.7, 46, '60°', { s: 12, c: C.or });
      b += X(270, 58, '50° + 60° + 70°', { s: 16 }) + X(270, 92, '= 180°', { s: 24, c: C.brand, k: 'pop' });
      return svg(360, 120, b);
    },
    cm2_tricompas: () => {
      let b = L(40, 120, 190, 120, 'currentColor', 3.5);
      b += `<path class="dash" d="M40 120L96.3 37.3L190 120" stroke="${C.brand}" stroke-width="3"/>`;
      b += `<path class="draw" pathLength="100" d="M121.9 62.6A100 100 0 0 0 65.9 23.4" stroke="${C.or}" stroke-width="2.5"/><path class="draw" pathLength="100" d="M127.5 11.7A125 125 0 0 0 76.7 67.2" stroke="${C.vert}" stroke-width="2.5"/>`;
      b += `<circle class="pop" cx="96.3" cy="37.3" r="5" fill="${C.rouge}"/>`;
      b += X(30, 138, 'A') + X(200, 138, 'B') + X(96, 62, 'C');
      b += X(290, 52, 'AB = 6 cm', { s: 15 }) + X(290, 82, 'AC = 4 cm', { s: 15, c: C.or }) + X(290, 112, 'BC = 5 cm', { s: 15, c: C.vert });
      return svg(360, 148, b);
    },

    /* ---------- statistiques ---------- */
    cm2_fruits: () => {
      const xs = [105, 165, 225, 285], nm = ['pomme', 'banane', 'orange', 'fraise'], nb = [6, 3, 5, 4];
      let b = X(62, 52, 'fruit', { a: 'end', s: 12 }) + X(62, 94, 'élèves', { a: 'end', s: 12, c: C.or });
      xs.forEach((x, i) => { b += R(x - 28, 30, 56, 30, C.bleu, 0.12) + X(x, 50, nm[i], { s: 12 }) + R(x - 28, 72, 56, 30, C.or, 0.12) + X(x, 94, nb[i], { s: 17, k: i === 0 ? 'pop' : '' }); });
      b += X(180, 130, 'total : 18 élèves', { s: 15, c: C.vert });
      return svg(360, 142, b);
    },
    cm2_barres: () => {
      const xs = [100, 165, 230, 295], nm = ['pomme', 'banane', 'orange', 'fraise'], nb = [6, 3, 5, 4], col = [C.rouge, C.or, C.or, C.rouge];
      let b = X(190, 14, 'fruit préféré', { s: 13 }) + L(50, 150, 335, 150, 'currentColor', 2.5) + L(50, 150, 50, 28, 'currentColor', 2.5);
      for (let v = 2; v <= 6; v += 2) b += L(46, 150 - v * 18, 52, 150 - v * 18, 'currentColor', 2) + X(40, 154 - v * 18, v, { s: 11, a: 'end' }) + `<line x1="52" y1="${150 - v * 18}" x2="335" y2="${150 - v * 18}" stroke="${C.gris}" stroke-opacity=".3" stroke-width="1"/>`;
      xs.forEach((x, i) => { b += `<rect${i === 0 ? ' class="pulse"' : ''} x="${x - 20}" y="${150 - nb[i] * 18}" width="40" height="${nb[i] * 18}" fill="${[C.rouge, C.or, C.vert, C.bleu][i]}" fill-opacity=".5" stroke="${[C.rouge, C.or, C.vert, C.bleu][i]}" stroke-width="2.5"/>` + X(x, 168, nm[i], { s: 11 }); });
      return svg(360, 176, b);
    },
    cm2_courbe: () => {
      const xs = [80, 135, 190, 245, 300], t = [8, 10, 12, 11, 14], d = ['lun', 'mar', 'mer', 'jeu', 'ven'];
      const y = (v) => 150 - (v - 4) * 10;
      let b = L(45, 150, 340, 150, 'currentColor', 2.5) + L(45, 150, 45, 22, 'currentColor', 2.5) + X(58, 16, '°C', { s: 12 });
      b += X(38, y(8) + 4, '8', { a: 'end', s: 11 }) + X(38, y(12) + 4, '12', { a: 'end', s: 11 }) + `<line x1="45" y1="${y(12)}" x2="340" y2="${y(12)}" stroke="${C.gris}" stroke-opacity=".4" stroke-dasharray="4 4"/>`;
      b += `<path class="draw" pathLength="100" d="${t.map((v, i) => (i ? 'L' : 'M') + xs[i] + ' ' + y(v)).join('')}" stroke="${C.vert}" stroke-width="3.5"/>`;
      t.forEach((v, i) => { b += `<circle class="pop" cx="${xs[i]}" cy="${y(v)}" r="5.5" fill="${C.or}"/>` + X(xs[i], y(v) - 11, v, { s: 12 }) + X(xs[i], 168, d[i], { s: 12 }); });
      return svg(360, 176, b);
    },
    cm2_circ: () => {
      let b = `<circle cx="100" cy="78" r="62" stroke="currentColor" stroke-width="2.5"/>` + wedge(100, 78, 62, 0, 180, C.bleu) + wedge(100, 78, 62, 180, 270, C.or) + wedge(100, 78, 62, 270, 360, C.vert);
      [[C.bleu, 'foot : 50 %'], [C.or, 'judo : 25 %'], [C.vert, 'danse : 25 %']].forEach(([c, t], i) => { b += R(200, 40 + i * 32, 18, 18, c, 0.5) + X(228, 54 + i * 32, t, { a: 'start', s: 14 }); });
      return svg(360, 156, b);
    },

    /* ---------- mesures ---------- */
    cm2_lon: () => {
      const un = ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'];
      let b = '';
      un.forEach((u, i) => { b += R(19 + 46 * i, 16, 46, 28, i === 3 ? C.bleu : C.gris, i === 3 ? 0.25 : 0.1) + X(42 + 46 * i, 36, u, { s: 13 }) + R(19 + 46 * i, 44, 46, 38, i === 3 ? C.bleu : C.gris, 0.05); });
      b += X(42 + 46 * 3, 72, '2', { s: 22, c: C.bleu }) + X(42 + 46 * 4, 72, '5', { s: 22, c: C.bleu }) + X(42 + 46 * 5, 72, '0', { s: 22, c: C.rouge, k: 'pulse' });
      b += X(180, 118, '2,5 m = 250 cm', { s: 18, c: C.brand });
      return svg(360, 132, b);
    },
    cm2_masse: () => {
      let b = ARROW('c2m7', C.brand);
      [[60, 't'], [180, 'kg'], [300, 'g']].forEach(([x, u]) => { b += R(x - 35, 28, 70, 44, C.bleu, 0.15) + X(x, 58, u, { s: 22 }); });
      [[97, 143], [217, 263]].forEach(([a, c]) => { b += `<line class="dash" x1="${a}" y1="50" x2="${c}" y2="50" stroke="${C.brand}" stroke-width="3" marker-end="url(#c2m7)"/>` + X((a + c) / 2, 40, '×1000', { s: 12, c: C.brand }); });
      b += X(180, 100, '1 t = 1000 kg', { s: 15 }) + X(180, 124, '1 kg = 1000 g', { s: 15 });
      return svg(360, 135, b);
    },
    cm2_capa: () => {
      let b = `<path class="pulse" d="M132 65Q146 59 160 65T188 65T218 65V113H132Z" fill="${C.bleu}" fill-opacity=".45"/>`;
      b += `<path d="M130 15V115H230V15" stroke="currentColor" stroke-width="3.5"/>`;
      [[15, '1 L'], [40, '75 cL'], [65, '50 cL'], [90, '25 cL']].forEach(([y, t]) => { b += L(130, y, 144, y, 'currentColor', 2.5) + X(122, y + 4, t, { a: 'end', s: 12 }); });
      b += X(242, 38, '1 L = 100 cL', { a: 'start', s: 12.5 }) + X(242, 60, '= 1000 mL', { a: 'start', s: 12.5 }) + X(242, 94, '50 cL = 0,5 L', { a: 'start', s: 12.5, c: C.bleu });
      return svg(360, 125, b);
    },
    cm2_horloge: () => {
      const cx = 90, cy = 82, r = 62;
      let b = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.or}" fill-opacity=".1" stroke="currentColor" stroke-width="3.5"/>`;
      for (let i = 0; i < 12; i++) { const a = rad(i * 30); b += L((cx + (r - 3) * Math.sin(a)).toFixed(1), (cy - (r - 3) * Math.cos(a)).toFixed(1), (cx + (r - 9) * Math.sin(a)).toFixed(1), (cy - (r - 9) * Math.cos(a)).toFixed(1), 'currentColor', 2); }
      b += X(cx, cy - 40, '12', { s: 12 }) + X(cx + 42, cy + 4, '3', { s: 12 }) + X(cx, cy + 49, '6', { s: 12 }) + X(cx - 42, cy + 4, '9', { s: 12 });
      b += L(cx, cy, 124.8, 71.7, C.brand, 5) + `<line class="pulse" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 50}" stroke="${C.rouge}" stroke-width="3.5"/><circle cx="${cx}" cy="${cy}" r="4" fill="currentColor"/>`;
      b += X(262, 30, '1 h = 60 min', { s: 14, c: C.gris }) + X(262, 66, '2 h 30 min', { s: 18 }) + X(262, 96, '= 2 × 60 + 30', { s: 15 }) + X(262, 128, '= 150 min', { s: 20, c: C.vert, k: 'pop' });
      return svg(360, 160, b);
    },
  });

  K.COURSES.push(
    { id: 'cm2-decimaux', subj: 'maths', level: 'cm2', icon: '🔢', title: 'Calculer avec les décimaux',
      intro: 'Les prix, les mesures et les chronomètres utilisent des nombres à virgule. Voyons comment calculer avec eux sans se tromper.',
      steps: [
        S('Lire un nombre décimal', 'Un nombre décimal a une <b>partie entière</b> et une <b>partie décimale</b>, séparées par une virgule. Dans 3,45 : 3 unités, 4 dixièmes et 5 centièmes. Donc 3,45 = 3 + 0,4 + 0,05.', 'cm2_dectab'),
        S('Comparer', 'On compare d’abord les parties entières. Si elles sont égales, on compare les dixièmes, puis les centièmes. Ainsi 2,43 &lt; 2,47 car 3 centièmes &lt; 7 centièmes. Attention : 2,5 &gt; 2,45, car 2,50 &gt; 2,45.', 'cm2_decdroite'),
        S('Additionner et soustraire', 'On pose l’opération en <b>alignant les virgules</b>. On complète avec des zéros si besoin : 12,5 = 12,50. Puis on calcule colonne par colonne : 12,50 + 3,75 = 16,25. Pour une soustraction, on fait pareil : 5 − 1,8 = 5,0 − 1,8 = 3,2.', 'cm2_decadd'),
        S('Multiplier par 10, 100, 1000', 'Multiplier par 10, 100 ou 1000 déplace la virgule vers la <b>droite</b> de 1, 2 ou 3 rangs. Par exemple 3,4 × 10 = 34 et 0,56 × 100 = 56. Diviser par 10 la déplace vers la <b>gauche</b> : 7 ÷ 10 = 0,7.', 'cm2_decx10'),
        S('Multiplier et diviser par un entier', 'On multiplie comme avec des entiers, puis on place la virgule. Pour 1,2 × 3 : 12 × 3 = 36, donc 1,2 × 3 = 3,6. Pour diviser, on continue après la virgule en ajoutant des zéros : 7 ÷ 2 = 3,5 et 9 ÷ 4 = 2,25.'),
      ],
      recap: ['Dans 3,45 : 3 unités, 4 dixièmes, 5 centièmes.', 'Pour additionner ou soustraire, on aligne les virgules.', '× 10, × 100, × 1000 : la virgule se déplace vers la droite.', '÷ 10, ÷ 100 : la virgule se déplace vers la gauche.'],
      quiz: [Q('Quel nombre est le plus grand ?', ['3,09', '3,9', '3,19'], 1), Q('4,6 + 2,65 = ?', ['6,81', '7,25', '7,35'], 1), Q('0,8 × 10 = ?', ['8', '80', '0,08'], 0)] },

    { id: 'cm2-fractions', subj: 'maths', level: 'cm2', icon: '🍕', title: 'Les fractions',
      intro: 'Quand on partage une pizza en parts égales, chaque part est une fraction de la pizza. Les fractions servent aussi à partager des billes ou une tablette de chocolat.',
      steps: [
        S('Lire une fraction', 'Une fraction s’écrit avec deux nombres. Le <b>dénominateur</b> (en bas) dit en combien de parts égales on partage. Le <b>numérateur</b> (en haut) dit combien de parts on prend. Ici, on prend 3 parts sur 4 : ' + F(3, 4) + '.', 'cm2_frbar'),
        S('Sur la droite graduée', 'On partage chaque unité en parts égales. Ici l’unité est coupée en 4. La fraction ' + F(3, 4) + ' est entre 0 et 1. La fraction ' + F(5, 4) + ' est un peu après 1, car ' + F(5, 4) + ' = 1 + ' + F(1, 4) + '.', 'cm2_frdroite'),
        S('Comparer', 'Avec le <b>même dénominateur</b>, la plus grande fraction est celle qui a le plus grand numérateur : ' + F(2, 5) + ' &lt; ' + F(4, 5) + '. Une fraction dont le numérateur est plus petit que le dénominateur est plus petite que 1.', 'cm2_frcomp'),
        S('Additionner', 'Avec le même dénominateur, on additionne les numérateurs et on <b>garde</b> le dénominateur : ' + F(2, 7) + ' + ' + F(3, 7) + ' = ' + F(5, 7) + '. On compte des parts de même taille : le dénominateur ne change pas. Pour soustraire : ' + F(5, 7) + ' − ' + F(3, 7) + ' = ' + F(2, 7) + '.', 'cm2_fradd'),
        S('Fraction d’une quantité', 'Pour prendre ' + F(3, 4) + ' de 20 billes, on partage 20 en 4 groupes : 20 ÷ 4 = 5 billes par groupe. Puis on prend 3 groupes : 3 × 5 = 15 billes.', 'cm2_frqty'),
      ],
      recap: ['Dénominateur : nombre de parts égales. Numérateur : parts prises.', 'Avec le même dénominateur, on compare les numérateurs.', 'On additionne les numérateurs, mais on garde le dénominateur.', 'Fraction d’une quantité : on divise, puis on multiplie.'],
      quiz: [Q('Quelle fraction est la plus grande ?', [F(3, 8), F(7, 8), F(5, 8)], 1), Q(F(2, 9) + ' + ' + F(4, 9) + ' = ?', [F(6, 9), F(6, 18), F(8, 9)], 0), Q('Combien font ' + F(3, 5) + ' de 20 billes ?', ['4', '15', '12'], 2)] },

    { id: 'cm2-pourcentages', subj: 'maths', level: 'cm2', icon: '💯', title: 'Les pourcentages',
      intro: 'Dans les magasins, on voit « −10 % » sur les étiquettes. Un pourcentage, c’est une fraction de 100.',
      steps: [
        S('Pour cent', 'Un pourcentage compare à 100. <b>25 %</b> veut dire « 25 pour cent », donc ' + F(25, 100) + '. Si on colorie 25 petits carrés sur une grille de 100, on a colorié 25 % de la grille.', 'cm2_pct100'),
        S('50 % et 25 %', '<b>50 %</b> = ' + F(50, 100) + ' = ' + F(1, 2) + ' : c’est la <b>moitié</b>. <b>25 %</b> = ' + F(25, 100) + ' = ' + F(1, 4) + ' : c’est le <b>quart</b>. Pour trouver 50 % de 18 billes, on divise par 2 : 9 billes. Pour 25 % de 80, on divise par 4 : 20.', 'cm2_pctpie'),
        S('10 %', '<b>10 %</b> = ' + F(10, 100) + ' = ' + F(1, 10) + ' : c’est le <b>dixième</b>. Pour trouver 10 % d’une quantité, on la divise par 10. Ainsi, 10 % de 50 billes = 5 billes, et 10 % de 30 € = 3 €.', 'cm2_pct10'),
        S('Calculer une réduction', 'Un jeu coûte 40 €. Il est soldé à −10 %. La réduction est 10 % de 40 = 4 €. Le nouveau prix est 40 − 4 = <b>36 €</b>.', 'cm2_pctsolde'),
      ],
      recap: ['Un pourcentage est une fraction de 100.', '50 % = la moitié (on divise par 2).', '25 % = le quart (on divise par 4).', '10 % = le dixième (on divise par 10).'],
      quiz: [Q('25 % de 200 =', ['25', '50', '100'], 1), Q('10 % de 70 € =', ['7 €', '10 €', '60 €'], 0), Q('Quel pourcentage correspond à la moitié ?', ['100 %', '25 %', '50 %'], 2)] },

    { id: 'cm2-proportionnalite', subj: 'maths', level: 'cm2', icon: '⚖️', title: 'La proportionnalité',
      intro: 'Si un paquet contient 4 biscuits, deux paquets en contiennent 8. Quand une quantité double, l’autre double aussi : c’est la proportionnalité.',
      steps: [
        S('Des grandeurs proportionnelles', 'Deux grandeurs sont <b>proportionnelles</b> quand, si l’une est multipliée par 2, 3, 4…, l’autre l’est aussi. Un paquet contient 4 biscuits : 3 paquets contiennent 3 × 4 = 12 biscuits.', 'cm2_propbis'),
        S('Le tableau de proportionnalité', 'On range les valeurs dans un tableau. On passe d’une ligne à l’autre en multipliant toujours par le <b>même nombre</b>, le coefficient. Ici 1 cahier coûte 2 €, donc on multiplie par 2 : 5 cahiers coûtent 10 €.', 'cm2_proptab'),
        S('Passer par l’unité', '5 stylos coûtent 10 €. On cherche d’abord le prix d’<b>un seul</b> stylo : 10 ÷ 5 = 2 €. Puis on multiplie : 8 stylos coûtent 8 × 2 = 16 €.', 'cm2_propunite'),
        S('Le graphique', 'Quand on place sur un graphique les points d’un tableau de proportionnalité, ils sont <b>alignés</b> avec le point 0 (l’origine). C’est le signe de la proportionnalité.', 'cm2_propgraph'),
        S('Attention aux faux amis', 'Tout n’est pas proportionnel ! Un enfant mesure environ 1 m à 6 ans, mais à 12 ans il ne mesure pas 2 m. Par contre, dans une recette, on double la farine quand on double le nombre de personnes.'),
      ],
      recap: ['Proportionnel : si l’une double, l’autre double.', 'On passe d’une ligne à l’autre avec le même coefficient.', 'On peut passer par l’unité : on divise, puis on multiplie.', 'Sur un graphique, les points sont alignés avec l’origine.'],
      quiz: [Q('4 cahiers coûtent 8 €. Combien coûtent 6 cahiers ?', ['10 €', '12 €', '14 €'], 1), Q('Pour 2 personnes, il faut 200 g de farine. Et pour 6 personnes ?', ['600 g', '400 g', '800 g'], 0), Q('Quelle situation est proportionnelle ?', ['L’âge et la taille d’un enfant', 'Le jour et la température', 'Le nombre de pains et le prix à payer'], 2)] },

    { id: 'cm2-aires-volumes', subj: 'maths', level: 'cm2', icon: '📦', title: 'Aires et volumes',
      intro: 'Pour entourer un jardin, on mesure le tour. Pour le gazon, on mesure la surface. Pour remplir un aquarium, on mesure le volume.',
      steps: [
        S('Le périmètre', 'Le <b>périmètre</b> est la longueur du tour d’une figure. Pour un rectangle de 6 cm sur 3 cm : 6 + 3 + 6 + 3 = 18 cm, ou encore 2 × (6 + 3) = 18 cm.', 'cm2_perim'),
        S('L’aire du rectangle', 'L’<b>aire</b> mesure la surface à l’intérieur d’une figure. On compte les carreaux de 1 cm². Un rectangle de 5 cm sur 3 cm contient 5 × 3 = 15 carreaux, donc son aire est 15 cm². Aire = longueur × largeur. Pour un carré : côté × côté.', 'cm2_aire'),
        S('L’aire du triangle rectangle', 'Un triangle rectangle est la <b>moitié</b> d’un rectangle. Ici le rectangle mesure 6 cm sur 4 cm : 6 × 4 = 24 cm². Le triangle a donc pour aire 24 ÷ 2 = 12 cm².', 'cm2_triangle'),
        S('Le volume du pavé droit', 'Un <b>pavé droit</b> est une boîte, comme une boîte à chaussures. Son volume est le nombre de petits cubes de 1 cm³ qu’il contient : longueur × largeur × hauteur. Ici, 4 × 3 × 2 = 24 cm³.', 'cm2_pave'),
        S('Litres et décimètres cubes', 'Un cube de 10 cm de côté (1 dm) a pour volume 10 × 10 × 10 = 1000 cm³, soit 1 dm³. Et 1 dm³ contient exactement <b>1 litre</b> : 1 dm³ = 1 L.', 'cm2_litre'),
      ],
      recap: ['Périmètre : le tour. Aire : la surface. Volume : l’espace occupé.', 'Aire du rectangle = longueur × largeur.', 'Aire du triangle rectangle = la moitié de l’aire du rectangle.', 'Volume du pavé = L × l × h, et 1 dm³ = 1 L.'],
      quiz: [Q('Quelle est l’aire d’un rectangle de 8 cm sur 3 cm ?', ['11 cm²', '24 cm²', '22 cm²'], 1), Q('Quel est le volume d’un pavé de 5 cm, 2 cm et 3 cm ?', ['30 cm³', '10 cm³', '30 cm²'], 0), Q('Quel est le périmètre d’un carré de 5 cm de côté ?', ['10 cm', '25 cm', '20 cm'], 2)] },

    { id: 'cm2-symetrie', subj: 'maths', level: 'cm2', icon: '🦋', title: 'La symétrie axiale',
      intro: 'Une aile de papillon est pareille à l’autre aile. En symétrie, on plie la figure le long d’une ligne et les deux côtés se superposent.',
      steps: [
        S('L’axe de symétrie', 'Une figure a un <b>axe de symétrie</b> si on peut la plier le long d’une droite pour que les deux moitiés se recouvrent exactement. Une maison dessinée de face a un axe vertical.', 'cm2_axe'),
        S('Le symétrique d’un point', 'Le symétrique de A est le point A’ tel que l’axe coupe le segment [AA’] <b>en son milieu</b> et à <b>angle droit</b>. Les points A et A’ sont à la même distance de l’axe.', 'cm2_sympoint'),
        S('Sur un quadrillage', 'On compte les carreaux entre chaque sommet et l’axe, puis on reporte la même distance de l’autre côté. On relie ensuite les points : on obtient le <b>symétrique</b> de la figure.', 'cm2_symgrille'),
        S('Combien d’axes ?', 'Un carré a 4 axes de symétrie, un rectangle en a 2 et un triangle équilatéral en a 3. Un cercle en a une infinité : tous ses diamètres !', 'cm2_axes4'),
        S('Ce qui ne change pas', 'La symétrie axiale <b>conserve</b> les longueurs, les angles et les aires. La figure est retournée comme dans un miroir, mais elle n’est ni agrandie ni rétrécie.'),
      ],
      recap: ['Un axe de symétrie est une droite de pliage.', 'A et A’ sont à la même distance de l’axe.', 'L’axe coupe [AA’] en son milieu, à angle droit.', 'Carré : 4 axes ; rectangle : 2 ; triangle équilatéral : 3.'],
      quiz: [Q('Combien d’axes de symétrie a un carré ?', ['1', '2', '4'], 2), Q('Le point A est à 3 cm de l’axe. À quelle distance de l’axe se trouve son symétrique A’ ?', ['3 cm', '6 cm', '0 cm'], 0), Q('Qu’est-ce que la symétrie axiale ne change pas ?', ['La position de la figure', 'La longueur des côtés', 'Le côté où se trouve la figure'], 1)] },

    { id: 'cm2-triangles-angles', subj: 'maths', level: 'cm2', icon: '📐', title: 'Triangles et angles',
      intro: 'Les toits, les parts de pizza et les panneaux de signalisation ont des angles. On les mesure en degrés (°).',
      steps: [
        S('Trois sortes d’angles', 'Un angle <b>droit</b> mesure 90°, comme le coin d’une feuille. Un angle <b>aigu</b> est plus petit que 90°. Un angle <b>obtus</b> est plus grand que 90° (et plus petit que 180°).', 'cm2_angles'),
        S('Mesurer avec le rapporteur', 'On place le centre du rapporteur sur le sommet de l’angle et le zéro sur l’un des côtés. On lit la graduation où passe l’autre côté. Ici, l’angle mesure 60°.', 'cm2_rapporteur'),
        S('Des triangles particuliers', 'Un triangle <b>isocèle</b> a 2 côtés de même longueur. Un triangle <b>équilatéral</b> a 3 côtés égaux. Un triangle <b>rectangle</b> a un angle droit.', 'cm2_tri3'),
        S('La somme des angles', 'Dans n’importe quel triangle, la somme des trois angles est toujours égale à <b>180°</b>. Par exemple 50° + 60° + 70° = 180°. Si deux angles mesurent 50° et 60°, le troisième mesure 180 − 110 = 70°.', 'cm2_tri180'),
        S('Construire un triangle', 'Pour construire un triangle de côtés 6 cm, 4 cm et 5 cm : on trace [AB] = 6 cm. Puis on trace un arc de cercle de centre A et de rayon 4 cm, et un arc de centre B et de rayon 5 cm. Ils se coupent au point C.', 'cm2_tricompas'),
      ],
      recap: ['Droit : 90°. Aigu : moins de 90°. Obtus : plus de 90°.', 'On mesure un angle avec un rapporteur.', 'Isocèle : 2 côtés égaux ; équilatéral : 3 ; rectangle : 1 angle droit.', 'La somme des angles d’un triangle vaut 180°.'],
      quiz: [Q('Un angle de 120° est…', ['aigu', 'droit', 'obtus'], 2), Q('Deux angles d’un triangle mesurent 40° et 80°. Combien mesure le troisième ?', ['60°', '50°', '100°'], 0), Q('Un triangle qui a 3 côtés égaux est…', ['rectangle', 'équilatéral', 'obtus'], 1)] },

    { id: 'cm2-statistiques', subj: 'maths', level: 'cm2', icon: '📊', title: 'Tableaux et graphiques',
      intro: 'On a demandé à 18 élèves quel est leur fruit préféré. Pour mettre de l’ordre dans les réponses, on utilise un tableau et des graphiques.',
      steps: [
        S('Le tableau', 'Un tableau range les données : à chaque fruit correspond un nombre d’élèves. On lit que 6 élèves préfèrent les pommes. Le total est 6 + 3 + 5 + 4 = 18 élèves.', 'cm2_fruits'),
        S('Le diagramme en barres', 'Chaque barre représente un fruit. Plus la barre est haute, plus il y a d’élèves. On lit la valeur grâce à l’axe gradué. La barre la plus haute est celle des pommes. Si les nombres sont grands, on choisit une échelle : par exemple 1 carreau pour 2 élèves.', 'cm2_barres'),
        S('La courbe', 'Pour suivre une évolution au cours du temps, comme la température chaque jour, on relie les points : c’est un <b>graphique en ligne</b>. Ici la température passe de 8 °C le lundi à 14 °C le vendredi. Elle a baissé de 12 °C à 11 °C entre mercredi et jeudi.', 'cm2_courbe'),
        S('Le diagramme circulaire', 'Un disque est partagé en parts. Chaque part représente une fraction du total. Si 50 % des élèves aiment le foot, la moitié du disque est colorée. Avec 20 élèves : 50 % de 20 = 10 élèves.', 'cm2_circ'),
        S('Répondre aux questions', 'Pour lire un graphique, on regarde d’abord le titre, puis les axes et les unités. On peut ensuite comparer (« plus de pommes que de bananes ») et calculer une différence : 6 − 3 = 3 élèves de plus.'),
      ],
      recap: ['Un tableau range les données.', 'Diagramme en barres : la hauteur donne la valeur.', 'Courbe : on suit une évolution dans le temps.', 'Diagramme circulaire : chaque part est une fraction du total.'],
      quiz: [Q('Dans le tableau du cours, quel fruit est le plus choisi ?', ['les bananes', 'les oranges', 'les pommes'], 2), Q('Combien d’élèves ont répondu en tout ?', ['16', '18', '20'], 1), Q('Dans un disque, 25 % des 20 élèves aiment le judo. Combien d’élèves est-ce ?', ['5', '10', '25'], 0)] },

    { id: 'cm2-mesures', subj: 'maths', level: 'cm2', icon: '📏', title: 'Unités et conversions',
      intro: 'Une règle, une balance, une bouteille, une montre : chaque instrument a ses unités. Savoir convertir permet de comparer.',
      steps: [
        S('Les longueurs', 'Le mètre (m) est l’unité de base. 1 km = 1000 m et 1 m = 10 dm = 100 cm = 1000 mm. Dans le tableau de conversion, chaque colonne est 10 fois plus grande que sa voisine de droite. Pour 2,5 m, on met 2 dans la colonne m et 5 dans la colonne dm, puis un 0 jusqu’à cm : 2,5 m = <b>250 cm</b>.', 'cm2_lon'),
        S('Les masses', '1 t = 1000 kg et 1 kg = 1000 g. Pour passer à l’unité plus petite, on multiplie par 1000. Exemple : 2 kg = 2 × 1000 = 2000 g. Dans l’autre sens, 3500 g = 3,5 kg.', 'cm2_masse'),
        S('Les capacités', 'Le litre (L) mesure ce que peut contenir un récipient. 1 L = 10 dL = 100 cL = 1000 mL. Un demi-litre, c’est 0,5 L = 50 cL = 500 mL.', 'cm2_capa'),
        S('Les durées', '1 h = 60 min et 1 min = 60 s. Attention : on ne compte pas de 10 en 10 ! 2 h 30 min = 2 × 60 + 30 = <b>150 min</b>. Et 90 min = 1 h 30 min.', 'cm2_horloge'),
        S('Comparer des mesures', 'Pour comparer ou calculer, on convertit d’abord dans la <b>même unité</b>. Exemple : 3 m et 250 cm. On écrit 3 m = 300 cm, et 300 cm &gt; 250 cm, donc 3 m &gt; 250 cm. On n’additionne jamais des mètres et des centimètres sans convertir.'),
      ],
      recap: ['Longueurs : 1 m = 100 cm = 1000 mm ; 1 km = 1000 m.', 'Masses : 1 kg = 1000 g ; 1 t = 1000 kg.', 'Capacités : 1 L = 100 cL = 1000 mL.', 'Durées : 1 h = 60 min ; 1 min = 60 s.'],
      quiz: [Q('3 km = ? m', ['30 m', '300 m', '3000 m'], 2), Q('1,5 L = ? cL', ['150 cL', '15 cL', '1500 cL'], 0), Q('1 h 15 min = ? min', ['65 min', '75 min', '115 min'], 1)] },
  );
})();
