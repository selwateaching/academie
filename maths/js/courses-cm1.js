/* Cours illustrés : CM1 (9-10 ans). */
(function () {
  'use strict';
  const K = window.CourseKit, { F, C, svg, T, L, ARROW, FIG } = K;
  const N = (s) => String(s).replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ');
  const S = (h, p, fig) => K.S(N(h), N(p), fig);
  const Q = (q, ch, a) => K.Q(N(q), ch.map(N), a);
  const D = (o) => { o.intro = N(o.intro); o.recap = o.recap.map(N); return o; };
  // texte (couleur / taille / ancrage au choix)
  const TX = (x, y, s, c = 'currentColor', size = 13, anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" fill="${c}" stroke="none" font-size="${size}" font-weight="700" text-anchor="${anchor}" ${extra}>${s}</text>`;
  const R = (x, y, w, h, c, fo = 0.25, extra = '', sw = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c}" fill-opacity="${fo}" stroke="${c}" stroke-width="${sw}" ${extra}/>`;
  const Dot = (x, y, c, r = 8, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="none" ${extra}/>`;
  const P = (d, c, w = 3, extra = '', fill = 'none') => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}" ${extra}/>`;
  const AL = (id, x1, y1, x2, y2, c = C.gris, extra = '') => `${ARROW(id, c)}<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="3" marker-end="url(#${id})" ${extra}/>`;
  const slice = (cx, cy, r, a0, a1, fill, extra = '') => {
    const p = (a) => [(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1), (cy + r * Math.sin(a * Math.PI / 180)).toFixed(1)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}Z" fill="${fill}" ${extra}/>`;
  };

  Object.assign(FIG, {
    /* ---------- grands nombres ---------- */
    cm1_paquets: () => {
      let b = '';
      for (let i = 1; i < 10; i++) b += L(92, 35 + i * 6, 100, 35 + i * 6, C.bleu, 1) + L(160 + i * 6, 35, 160 + i * 6, 95, C.vert, 1) + L(160, 35 + i * 6, 220, 35 + i * 6, C.vert, 1);
      b += R(24, 89, 6, 6, C.or, 0.6, 'class="pop"', 1.5) + R(92, 35, 8, 60, C.bleu, 0.3, '', 1.5) + R(160, 35, 60, 60, C.vert, 0.25, '', 2);
      b += `<path d="M280 47H328V95H280Z" fill="${C.brand}" fill-opacity=".3" stroke="${C.brand}" stroke-width="2" class="pop"/><path d="M280 47L292 35H340L328 47Z" fill="${C.brand}" fill-opacity=".15" stroke="${C.brand}" stroke-width="2"/><path d="M328 47L340 35V83L328 95Z" fill="${C.brand}" fill-opacity=".45" stroke="${C.brand}" stroke-width="2"/>`;
      b += AL('cm1p1', 44, 85, 74, 85) + AL('cm1p2', 116, 85, 146, 85) + AL('cm1p3', 236, 85, 266, 85);
      b += TX(59, 74, '× 10', C.gris, 12) + TX(131, 74, '× 10', C.gris, 12) + TX(251, 74, '× 10', C.gris, 12);
      b += TX(27, 116, '1') + TX(96, 116, '10') + TX(190, 116, '100') + TX(310, 116, '1 000');
      return svg(360, 128, b);
    },
    cm1_classes: () => {
      let b = R(60, 8, 120, 26, C.or, 0.3) + TX(120, 26, 'milliers') + R(180, 8, 120, 26, C.bleu, 0.3) + TX(240, 26, 'unites');
      const dg = '345678', lt = 'CDUCDU';
      for (let i = 0; i < 6; i++) {
        const x = 60 + i * 40, c = i < 3 ? C.or : C.bleu;
        b += `<rect x="${x}" y="38" width="40" height="64" fill="${c}" fill-opacity="${i < 3 ? 0.08 : 0.08}" stroke="${c}" stroke-width="2"/>` + TX(x + 20, 54, lt[i], C.gris, 12) + TX(x + 20, 90, dg[i], 'currentColor', 28, 'middle', i === 2 ? 'class="pop"' : '');
      }
      b += TX(180, 126, '345 678', C.brand, 16);
      return svg(360, 136, b);
    },
    cm1_droiteM: () => {
      let b = L(30, 70, 310, 70, 'currentColor', 3);
      for (let i = 0; i <= 10; i++) b += L(30 + i * 28, i % 5 === 0 ? 60 : 64, 30 + i * 28, i % 5 === 0 ? 80 : 76, 'currentColor', 2);
      b += TX(30, 100, '0', 'currentColor', 12) + TX(170, 100, '500 000', 'currentColor', 12) + TX(310, 100, '1 000 000', 'currentColor', 12);
      b += `<path d="M128 56V44" stroke="${C.bleu}" stroke-width="2.5" class="dash"/>` + Dot(128, 70, C.bleu, 8, 'class="pop"') + TX(128, 36, '350 000', C.bleu, 14);
      return svg(360, 112, b);
    },
    /* ---------- fractions ---------- */
    cm1_gateau: () => {
      let b = '';
      for (let i = 0; i < 3; i++) b += slice(110, 80, 62, -90 + 90 * i, -90 + 90 * (i + 1), C.or, `fill-opacity=".45" stroke="${C.or}" stroke-width="3"`);
      b += slice(110, 80, 62, 180, 270, 'none', `stroke="${C.gris}" stroke-width="3" class="dash"`);
      b += TX(260, 62, '3', C.brand, 34, 'middle', 'class="pop"') + L(236, 72, 284, 72, C.brand, 4) + TX(260, 108, '4', C.brand, 34) + TX(260, 138, '3 parts sur 4', C.gris, 12);
      return svg(360, 156, b);
    },
    cm1_droiteFrac: () => {
      let b = L(30, 66, 330, 66, 'currentColor', 3);
      for (let i = 0; i <= 8; i++) b += L(30 + i * 37.5, i % 4 === 0 ? 56 : 60, 30 + i * 37.5, i % 4 === 0 ? 76 : 72, 'currentColor', i % 4 === 0 ? 3 : 2);
      b += TX(30, 98, '0') + TX(180, 98, '1') + TX(330, 98, '2');
      b += `<path d="M30 52Q86 20 142.5 52" stroke="${C.or}" stroke-width="3" class="draw" pathLength="100"/>` + Dot(142.5, 66, C.or, 8, 'class="pop"') + TX(142.5, 22, '3/4', C.or, 15);
      b += Dot(217.5, 66, C.bleu, 8, 'class="pop"') + TX(217.5, 22, '5/4', C.bleu, 15);
      return svg(360, 112, b);
    },
    cm1_barres: () => {
      let b = '';
      for (let i = 0; i < 5; i++) {
        b += R(70 + i * 48, 20, 48, 30, C.bleu, i < 2 ? 0.55 : 0.05, '', 2) + R(70 + i * 48, 64, 48, 30, C.or, i < 4 ? 0.55 : 0.05, i === 2 || i === 3 ? 'class="pop"' : '', 2);
      }
      b += TX(34, 41, '2/5', C.bleu, 15) + TX(34, 85, '4/5', C.or, 15) + TX(190, 126, '4/5 &gt; 2/5', C.brand, 18);
      return svg(360, 138, b);
    },
    /* ---------- décimaux ---------- */
    cm1_dixiemes: () => {
      let b = TX(180, 24, '1 = 10 dixiemes', C.gris, 13);
      for (let i = 0; i < 10; i++) b += R(30 + i * 30, 36, 30, 36, C.or, i < 3 ? 0.55 : 0.06, i < 3 ? 'class="pop"' : '', 2);
      b += TX(180, 108, '3/10 = 0,3', C.brand, 20);
      return svg(360, 124, b);
    },
    cm1_centiemes: () => {
      let b = '';
      for (let c = 0; c < 10; c++) for (let r = 0; r < 10; r++) {
        const on = c < 2 || (c === 2 && r < 7);
        b += `<rect x="${30 + c * 12}" y="${14 + r * 12}" width="12" height="12" fill="${on ? C.vert : 'none'}" fill-opacity="${on ? 0.5 : 0}" stroke="${C.vert}" stroke-opacity=".55" stroke-width="1" ${c === 2 && on ? 'class="pop"' : ''}/>`;
      }
      b += R(30, 14, 120, 120, C.vert, 0, '', 2.5);
      b += TX(255, 56, '27 centiemes', C.vert, 14) + TX(255, 92, '27/100 = 0,27', C.brand, 16);
      return svg(360, 148, b);
    },
    cm1_tabdec: () => {
      let b = R(30, 6, 140, 22, C.or, 0.25) + TX(100, 22, 'partie entiere', 'currentColor', 12) + R(190, 6, 140, 22, C.bleu, 0.25) + TX(260, 22, 'partie decimale', 'currentColor', 12);
      const hd = ['dizaines', 'unites', 'dixiemes', 'centiemes'], dg = ['1', '2', '3', '4'], xs = [30, 100, 190, 260];
      xs.forEach((x, i) => { const c = i < 2 ? C.or : C.bleu; b += `<rect x="${x}" y="34" width="70" height="66" fill="${c}" fill-opacity=".08" stroke="${c}" stroke-width="2"/>` + TX(x + 35, 50, hd[i], C.gris, 11) + TX(x + 35, 88, dg[i], 'currentColor', 30); });
      b += TX(180, 92, ',', C.rouge, 34, 'middle', 'class="pulse"');
      return svg(360, 116, b);
    },
    cm1_droiteDec: () => {
      let b = L(30, 72, 330, 72, 'currentColor', 3);
      for (let i = 0; i <= 10; i++) b += L(30 + i * 30, i % 5 === 0 ? 62 : 66, 30 + i * 30, i % 5 === 0 ? 82 : 78, 'currentColor', i % 5 === 0 ? 3 : 2);
      b += TX(30, 102, '2', 'currentColor', 14) + TX(330, 102, '3', 'currentColor', 14);
      b += Dot(165, 72, C.bleu, 7, 'class="pop"') + TX(150, 48, '2,45', C.bleu, 14) + Dot(180, 72, C.or, 7, 'class="pop"') + TX(210, 48, '2,5', C.or, 14);
      b += TX(285, 38, '2,5 &gt; 2,45', C.brand, 13);
      return svg(360, 114, b);
    },
  });

  Object.assign(FIG, {
    /* ---------- multiplication ---------- */
    cm1_billes: () => {
      let b = '';
      [C.bleu, C.or, C.vert].forEach((c, r) => { for (let k = 0; k < 4; k++) b += Dot(40 + k * 32, 28 + r * 32, c, 12, r === 1 ? 'class="pop"' : ''); });
      b += TX(255, 50, '3 × 4', C.brand, 26) + TX(255, 88, '= 12', C.brand, 26, 'middle', 'class="pop"') + TX(255, 116, '4 + 4 + 4 = 12', C.gris, 12);
      return svg(360, 130, b);
    },
    cm1_x10: () => {
      let b = '';
      [['35', 20, C.bleu], ['350', 140, C.or], ['3 500', 260, C.vert]].forEach(([t, x, c]) => { b += R(x, 36, 80, 46, c, 0.25) + TX(x + 40, 67, t, 'currentColor', 22); });
      b += AL('cm1m1', 104, 59, 136, 59, C.gris, 'class="dash"') + AL('cm1m2', 224, 59, 256, 59, C.gris, 'class="dash"');
      b += TX(120, 30, '× 10', C.gris, 13) + TX(240, 30, '× 10', C.gris, 13) + TX(180, 118, 'on ajoute un zero', C.rouge, 14, 'middle', 'class="pulse"');
      return svg(360, 132, b);
    },
    cm1_posee1: () => {
      let b = TX(100, 34, '3', C.rouge, 14) + TX(130, 34, '2', C.rouge, 14) + TX(205, 34, 'retenue', C.rouge, 13, 'start');
      [['2', 100], ['7', 130], ['5', 160]].forEach(([d, x]) => { b += TX(x, 66, d, 'currentColor', 26); });
      b += TX(62, 100, '×', 'currentColor', 26) + TX(160, 100, '4', 'currentColor', 26) + L(44, 110, 182, 110, 'currentColor', 3);
      [['1', 70], ['1', 100], ['0', 130], ['0', 160]].forEach(([d, x]) => { b += TX(x, 144, d, C.brand, 26, 'middle', 'class="pop"'); });
      b += TX(205, 70, '4 × 5 = 20', 'currentColor', 13, 'start') + TX(205, 92, '4 × 7 + 2 = 30', 'currentColor', 13, 'start') + TX(205, 114, '4 × 2 + 3 = 11', 'currentColor', 13, 'start');
      return svg(360, 160, b);
    },
    cm1_posee2: () => {
      let b = TX(120, 30, '3', 'currentColor', 24) + TX(150, 30, '6', 'currentColor', 24) + TX(62, 60, '×', 'currentColor', 24) + TX(120, 60, '2', 'currentColor', 24) + TX(150, 60, '4', 'currentColor', 24) + L(44, 70, 174, 70, 'currentColor', 3);
      b += TX(90, 102, '1', C.bleu, 24) + TX(120, 102, '4', C.bleu, 24) + TX(150, 102, '4', C.bleu, 24);
      b += TX(62, 132, '+', 'currentColor', 24) + TX(90, 132, '7', C.or, 24) + TX(120, 132, '2', C.or, 24) + TX(150, 132, '0', C.rouge, 24, 'middle', 'class="pop"') + L(44, 142, 174, 142, 'currentColor', 3);
      b += TX(90, 174, '8', C.brand, 24) + TX(120, 174, '6', C.brand, 24) + TX(150, 174, '4', C.brand, 24);
      b += TX(200, 102, '36 × 4 = 144', C.bleu, 13, 'start') + TX(200, 132, '36 × 20 = 720', C.or, 13, 'start') + TX(200, 174, '144 + 720 = 864', C.brand, 13, 'start');
      return svg(360, 188, b);
    },
    /* ---------- division ---------- */
    cm1_partage: () => {
      let b = '';
      for (let i = 0; i < 4; i++) {
        const x = 20 + i * 82;
        b += R(x, 12, 70, 58, [C.bleu, C.or, C.vert, C.brand][i], 0.12, '', 2);
        for (let k = 0; k < 6; k++) b += Dot(x + 15 + (k % 3) * 20, 29 + Math.floor(k / 3) * 24, [C.bleu, C.or, C.vert, C.brand][i], 7);
      }
      b += TX(180, 92, '6 billes chacun', C.gris, 13) + Dot(180, 114, C.rouge, 8, 'class="pop"') + TX(180, 144, 'il reste 1', C.rouge, 14);
      return svg(360, 154, b);
    },
    cm1_vocab: () => {
      const items = [['25', 40, C.brand, 'dividende'], ['4', 130, C.bleu, 'diviseur'], ['6', 220, C.vert, 'quotient'], ['1', 310, C.rouge, 'reste']];
      let b = TX(85, 52, '=', 'currentColor', 28) + TX(175, 52, '×', 'currentColor', 28) + TX(265, 52, '+', 'currentColor', 28);
      items.forEach(([n, x, c, w]) => { b += TX(x, 52, n, c, 32, 'middle', 'class="pop"') + L(x, 62, x, 80, c, 2) + TX(x, 98, w, c, 13); });
      return svg(360, 112, b);
    },
    cm1_divpose: () => {
      let b = TX(50, 40, '9', 'currentColor', 22) + TX(78, 40, '7', 'currentColor', 22) + L(96, 20, 96, 80, 'currentColor', 3) + L(96, 48, 172, 48, 'currentColor', 3) + TX(130, 40, '4', C.bleu, 22);
      b += TX(118, 74, '2', C.brand, 22) + TX(146, 74, '4', C.brand, 22, 'middle', 'class="pop"');
      b += TX(50, 76, '8', C.gris, 22) + L(36, 84, 66, 84, 'currentColor', 2);
      b += TX(50, 108, '1', 'currentColor', 22) + TX(78, 108, '7', C.or, 22, 'middle', 'class="pop"');
      b += TX(50, 138, '1', C.gris, 22) + TX(78, 138, '6', C.gris, 22) + L(36, 146, 92, 146, 'currentColor', 2);
      b += TX(78, 172, '1', C.rouge, 22);
      b += TX(200, 76, '4 × 2 = 8', 'currentColor', 13, 'start') + TX(200, 108, 'on abaisse le 7', C.or, 13, 'start') + TX(200, 138, '4 × 4 = 16', 'currentColor', 13, 'start') + TX(200, 172, 'reste 1', C.rouge, 14, 'start');
      return svg(360, 184, b);
    },
    /* ---------- périmètre et aire ---------- */
    cm1_perim: () => {
      let b = R(80, 28, 200, 80, C.brand, 0.08, '', 2) + `<rect x="80" y="28" width="200" height="80" rx="4" stroke="${C.rouge}" stroke-width="4" class="draw" pathLength="100"/>`;
      b += TX(180, 20, '8 cm', C.bleu, 13) + TX(180, 128, '8 cm', C.bleu, 13) + TX(48, 72, '5 cm', C.or, 13) + TX(312, 72, '5 cm', C.or, 13);
      b += TX(180, 64, '8 + 5 + 8 + 5', 'currentColor', 14) + TX(180, 90, 'P = 26 cm', C.brand, 18, 'middle', 'class="pop"');
      return svg(360, 140, b);
    },
    cm1_carreP: () => {
      let b = R(50, 25, 90, 90, C.vert, 0.15, '', 3);
      b += TX(95, 18, '3 cm', C.vert, 13) + TX(95, 134, '3 cm', C.vert, 13) + TX(24, 74, '3 cm', C.vert, 12) + TX(166, 74, '3 cm', C.vert, 12);
      b += TX(265, 52, 'P = 4 × c', C.brand, 18) + TX(265, 84, '4 × 3 = 12', 'currentColor', 15) + TX(265, 116, 'P = 12 cm', C.rouge, 18, 'middle', 'class="pop"');
      return svg(360, 146, b);
    },
    cm1_aire: () => {
      let b = '';
      for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) b += `<rect x="${50 + c * 30}" y="${28 + r * 30}" width="30" height="30" fill="${C.or}" fill-opacity="${(c + r) % 2 ? 0.35 : 0.2}" stroke="${C.or}" stroke-width="1.5" ${c === 4 && r === 2 ? 'class="pop"' : ''}/>`;
      b += TX(125, 20, '5 cm', C.or, 13) + TX(24, 76, '3 cm', C.or, 12);
      b += TX(272, 56, '15 carreaux', C.gris, 14) + TX(272, 86, '5 × 3 = 15', 'currentColor', 15) + TX(272, 118, 'A = 15 cm²', C.rouge, 17, 'middle', 'class="pop"');
      return svg(360, 138, b);
    },
    /* ---------- angles ---------- */
    cm1_angle: () => {
      let b = L(120, 120, 320, 120, C.brand, 4) + L(120, 120, 250, 35, C.bleu, 4) + P('M160 120A40 40 0 0 0 151 95', C.or, 4, 'class="pulse"') + Dot(120, 120, C.rouge, 6);
      b += TX(120, 142, 'sommet', C.rouge, 13) + TX(290, 140, 'cote', C.brand, 13) + TX(205, 46, 'cote', C.bleu, 13);
      return svg(360, 152, b);
    },
    cm1_droit: () => {
      let b = `<path d="M50 120V30L150 120Z" fill="${C.bleu}" fill-opacity=".2" stroke="${C.bleu}" stroke-width="3"/>` + P('M50 104H66V120', C.rouge, 3, 'class="pulse"');
      b += TX(120, 142, 'equerre', C.bleu, 12) + TX(24, 114, '90°', C.rouge, 14);
      b += R(210, 24, 110, 96, C.gris, 0.08, '', 2) + P('M210 46H232V24', C.rouge, 2.5) + P('M320 46H298V24', C.rouge, 2.5) + P('M210 98H232V120', C.rouge, 2.5) + P('M320 98H298V120', C.rouge, 2.5);
      b += TX(265, 76, 'angle droit', 'currentColor', 13);
      return svg(360, 154, b);
    },
    cm1_types: () => {
      const f = (vx, a, c, x2, y2) => L(vx, 110, vx + 80, 110, c, 4) + L(vx, 110, x2, y2, c, 4);
      let b = f(20, 45, C.vert, 77, 53) + P('M45 110A25 25 0 0 0 38 92', C.or, 4, 'class="pulse"');
      b += L(145, 110, 225, 110, C.bleu, 4) + L(145, 110, 145, 30, C.bleu, 4) + P('M145 98H157V110', C.or, 3, 'class="pulse"');
      b += L(300, 110, 340, 110, C.rouge, 4) + L(300, 110, 243, 53, C.rouge, 4) + P('M325 110A25 25 0 0 0 282 92', C.or, 4, 'class="pulse"');
      b += TX(60, 134, 'aigu', C.vert, 13) + TX(185, 134, 'droit', C.bleu, 13) + TX(290, 134, 'obtus', C.rouge, 13);
      b += TX(60, 152, '&lt; 90°', C.gris, 12) + TX(185, 152, '= 90°', C.gris, 12) + TX(290, 152, '&gt; 90°', C.gris, 12);
      return svg(360, 162, b);
    },
    cm1_rapporteur: () => {
      const cx = 180, cy = 160, pt = (a, r) => [(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1), (cy - r * Math.sin(a * Math.PI / 180)).toFixed(1)];
      let b = `<path d="M40 160A140 140 0 0 1 320 160Z" fill="${C.brand}" fill-opacity=".07" stroke="${C.brand}" stroke-width="2.5"/>`;
      for (let a = 0; a <= 180; a += 10) { const [x1, y1] = pt(a, 140), [x2, y2] = pt(a, a % 30 === 0 ? 124 : 131); b += L(x1, y1, x2, y2, C.brand, a % 30 === 0 ? 2.5 : 1.5); }
      for (let a = 0; a <= 180; a += 30) { const [x, y] = pt(a, 154); b += TX(x, +y + 4, a, C.brand, 11); }
      const [ex, ey] = pt(60, 135);
      b += L(180, 160, 320, 160, C.bleu, 3) + L(180, 160, ex, ey, C.rouge, 3);
      b += P('M225 160A45 45 0 0 0 202.5 121', C.or, 4, 'class="pulse"') + TX(236, 136, '60°', C.or, 14);
      b += Dot(180, 160, C.rouge, 5, 'class="pop"') + TX(180, 182, 'centre', C.rouge, 11);
      return svg(360, 190, b);
    },
    /* ---------- droites ---------- */
    cm1_perp: () => {
      let b = P('M40 110H320', C.brand, 4, 'class="draw" pathLength="100"') + P('M180 15V140', C.bleu, 4, 'class="draw" pathLength="100"');
      b += P('M180 96H194V110', C.rouge, 3, 'class="pop"') + TX(300, 98, 'd1', C.brand, 14) + TX(196, 28, 'd2', C.bleu, 14) + TX(270, 58, 'd1 ⊥ d2', 'currentColor', 15);
      return svg(360, 150, b);
    },
    cm1_para: () => {
      let b = '';
      for (let x = 40; x <= 320; x += 30) b += L(x, 44, x, 106, C.gris, 6);
      b += L(20, 50, 340, 50, C.brand, 5) + L(20, 100, 340, 100, C.bleu, 5);
      b += AL('cm1r1', 70, 56, 70, 94, C.rouge, 'class="dash"') + AL('cm1r2', 290, 56, 290, 94, C.rouge, 'class="dash"');
      b += TX(335, 40, 'd3', C.brand, 13) + TX(335, 124, 'd4', C.bleu, 13) + TX(180, 28, 'd3 // d4', 'currentColor', 15) + TX(180, 140, 'meme ecart partout', C.rouge, 13, 'middle', 'class="pulse"');
      return svg(360, 150, b);
    },
    cm1_equerre: () => {
      let b = L(20, 120, 340, 120, C.brand, 3) + `<path d="M150 120H260L150 35Z" fill="${C.bleu}" fill-opacity=".22" stroke="${C.bleu}" stroke-width="3"/>`;
      b += P('M150 106H164V120', C.rouge, 2.5) + P('M150 120V12', C.rouge, 4, 'class="draw" pathLength="100"') + Dot(150, 120, C.or, 5);
      b += TX(205, 108, 'equerre', C.bleu, 12) + TX(150, 142, 'A', C.or, 14) + TX(50, 108, 'd', C.brand, 14);
      return svg(360, 152, b);
    },
    cm1_glisse: () => {
      let b = R(116, 18, 28, 134, C.gris, 0.25, '', 2) + TX(130, 12, 'regle', C.gris, 11);
      b += L(20, 140, 340, 140, C.brand, 3) + `<path d="M144 140H244L144 90Z" fill="${C.bleu}" fill-opacity=".25" stroke="${C.bleu}" stroke-width="2.5"/>`;
      b += `<path d="M144 80H244L144 30Z" fill="${C.bleu}" fill-opacity=".1" stroke="${C.bleu}" stroke-width="2" stroke-dasharray="5 4"/>` + L(144, 80, 330, 80, C.rouge, 4, '').replace('/>', ' class="draw" pathLength="100"/>');
      b += AL('cm1g1', 290, 134, 290, 90, C.or, 'class="dash"') + TX(318, 116, 'glisse', C.or, 12) + TX(40, 130, 'd1', C.brand, 14) + TX(325, 70, 'd2', C.rouge, 14);
      return svg(360, 160, b);
    },
    /* ---------- proportionnalité ---------- */
    cm1_tableau: () => {
      let b = TX(48, 46, 'gateaux', C.brand, 12) + TX(48, 90, 'prix (€)', C.or, 12);
      for (let i = 0; i < 4; i++) b += R(96 + i * 48, 26, 46, 36, C.brand, 0.15) + TX(119 + i * 48, 50, i + 1, 'currentColor', 17) + R(96 + i * 48, 70, 46, 36, C.or, 0.2, i === 3 ? 'class="pop"' : '') + TX(119 + i * 48, 94, 2 * (i + 1), 'currentColor', 17);
      b += `${ARROW('cm1t1', C.rouge)}<path d="M292 44Q322 66 292 88" stroke="${C.rouge}" stroke-width="3" marker-end="url(#cm1t1)"/>` + TX(334, 72, '× 2', C.rouge, 14);
      return svg(360, 122, b);
    },
    cm1_coef: () => {
      let b = TX(50, 70, 'crayons', C.brand, 12) + TX(50, 118, 'prix (€)', C.or, 12);
      b += R(112, 46, 70, 36, C.brand, 0.15) + TX(147, 71, '2', 'currentColor', 18) + R(232, 46, 70, 36, C.brand, 0.15) + TX(267, 71, '6', 'currentColor', 18, 'middle', 'class="pop"');
      b += R(112, 94, 70, 36, C.or, 0.2) + TX(147, 119, '4', 'currentColor', 18) + R(232, 94, 70, 36, C.or, 0.2) + TX(267, 119, '12', 'currentColor', 18, 'middle', 'class="pop"');
      b += `${ARROW('cm1c1', C.rouge)}<path d="M147 42Q207 8 262 42" stroke="${C.rouge}" stroke-width="3" marker-end="url(#cm1c1)"/><path d="M147 134Q207 168 262 134" stroke="${C.rouge}" stroke-width="3" marker-end="url(#cm1c1)"/>`;
      b += TX(207, 22, '× 3', C.rouge, 14) + TX(207, 166, '× 3', C.rouge, 14);
      return svg(360, 176, b);
    },
    cm1_unite: () => {
      let b = '';
      [['4 cahiers = 12 €', 8, C.brand], ['1 cahier = 3 €', 66, C.or], ['7 cahiers = 21 €', 124, C.vert]].forEach(([t, y, c]) => { b += R(60, y, 240, 32, c, 0.18) + TX(180, y + 22, t, 'currentColor', 16); });
      b += AL('cm1u1', 180, 42, 180, 64, C.rouge, 'class="dash"') + TX(210, 58, '÷ 4', C.rouge, 14, 'start') + AL('cm1u2', 180, 100, 180, 122, C.rouge, 'class="dash"') + TX(210, 116, '× 7', C.rouge, 14, 'start');
      return svg(360, 164, b);
    },
  });

  K.COURSES.push(
    D({ id: 'cm1-grands-nombres', subj: 'maths', level: 'cm1', icon: '🔢', title: 'Les grands nombres',
      intro: 'Habitants d’une ville, pages d’une bibliothèque, spectateurs d’un stade : pour compter de très grandes quantités, on utilise des nombres jusqu’à un million.',
      steps: [
        S('Des paquets de 10', 'Dix unités font <b>une dizaine</b>, dix dizaines font <b>une centaine</b>, dix centaines font <b>un millier</b>. Chaque fois, on multiplie par 10 : 1, 10, 100, 1 000.', 'cm1_paquets'),
        S('Le tableau des classes', 'On range les chiffres par groupes de trois : la <b>classe des milliers</b> et la <b>classe des unités</b>. Dans chaque classe, il y a des centaines (C), des dizaines (D) et des unités (U). Dans 345 678, le 5 est le chiffre des unités de mille.', 'cm1_classes'),
        S('Lire et écrire', 'On lit chaque classe, puis on dit son nom. 345 678 se lit : « trois cent quarante-cinq <b>mille</b> six cent soixante-dix-huit ». On laisse un petit espace entre les classes pour bien lire.'),
        S('Décomposer', '52 304 = 5 × 10 000 + 2 × 1 000 + 3 × 100 + 0 × 10 + 4. Le 0 montre qu’il n’y a aucune dizaine. On peut aussi dire : 52 304 = 52 milliers + 304 unités.'),
        S('Comparer et ranger', 'Le nombre qui a le plus de chiffres est le plus grand : 12 400 &gt; 9 999. S’ils ont autant de chiffres, on compare de gauche à droite : 48 520 &lt; 48 700. Après 999 999 vient <b>1 000 000</b> : un million !', 'cm1_droiteM'),
      ],
      recap: ['10 unités = 1 dizaine, 10 dizaines = 1 centaine, 10 centaines = 1 millier.', 'On range les chiffres en classes de trois : milliers et unités.', 'Plus un nombre a de chiffres, plus il est grand.', '999 999 + 1 = 1 000 000 (un million).'],
      quiz: [Q('Dans 482 135, quel est le chiffre des unités de mille ?', ['4', '8', '2'], 2), Q('Quel nombre est le plus grand ?', ['98 765', '102 304', '99 999'], 1), Q('999 999 + 1 = ?', ['1 000 000', '100 000', '10 000 000'], 0)] }),

    D({ id: 'cm1-fractions', subj: 'maths', level: 'cm1', icon: '🍰', title: 'Les fractions',
      intro: 'Tu partages un gâteau avec tes amis : chacun reçoit une part. Pour dire quelle part du gâteau tu manges, on utilise une fraction.',
      steps: [
        S('Partager en parts égales', `Une fraction décrit des <b>parts égales</b> d’un tout. Un gâteau coupé en 4 parts égales : chaque part est ${F(1, 4)} du gâteau (un quart). Si on en mange 3, on a mangé ${F(3, 4)}.`, 'cm1_gateau'),
        S('Numérateur et dénominateur', `Dans ${F(3, 4)}, le nombre du bas, <b>4</b>, est le <b>dénominateur</b> : il dit en combien de parts on coupe. Le nombre du haut, <b>3</b>, est le <b>numérateur</b> : il dit combien de parts on prend.`),
        S('Sur la droite graduée', `On partage l’unité en parts égales. Entre 0 et 1 on place ${F(1, 4)}, ${F(2, 4)}, ${F(3, 4)}, puis ${F(4, 4)} = 1. Après 1, on continue : ${F(5, 4)} est un peu plus grand que 1.`, 'cm1_droiteFrac'),
        S('Comparer', `Si le dénominateur est le même, la plus grande fraction est celle qui a le <b>plus grand numérateur</b> : ${F(4, 5)} &gt; ${F(2, 5)}. Si le numérateur est le même, plus on coupe en parts, plus les parts sont petites : ${F(1, 2)} &gt; ${F(1, 4)}.`, 'cm1_barres'),
        S('Le tout', `Quand on prend toutes les parts, on a le tout : ${F(4, 4)} = 1 et ${F(8, 8)} = 1. Une fraction comme ${F(3, 2)} est plus grande que 1 : c’est 1 entier et ${F(1, 2)}.`),
      ],
      recap: ['Une fraction = des parts égales d’un tout.', 'Le dénominateur dit en combien de parts on coupe, le numérateur combien on en prend.', 'Même dénominateur : la plus grande fraction a le plus grand numérateur.', `${F(4, 4)} = 1 : toutes les parts font le tout.`],
      quiz: [Q('Une pizza est coupée en 8 parts égales. Tu en manges 3. Quelle fraction as-tu mangée ?', ['8/3', '3/5', '3/8'], 2), Q('Quelle fraction est la plus grande ?', ['1/5', '4/5', '2/5'], 1), Q('Combien de quarts y a-t-il dans 1 entier ?', ['4', '2', '1'], 0)] }),

    D({ id: 'cm1-decimaux', subj: 'maths', level: 'cm1', icon: '🔟', title: 'Les nombres décimaux',
      intro: 'Une baguette coûte 1,20 €, ta règle mesure 2,5 dm… Pour écrire des nombres entre deux entiers, on utilise une virgule.',
      steps: [
        S('Le dixième', `On coupe 1 entier en <b>10 parts égales</b> : chaque part est un <b>dixième</b>. ${F(1, 10)} s’écrit aussi <b>0,1</b>. Trois dixièmes : ${F(3, 10)} = 0,3.`, 'cm1_dixiemes'),
        S('Le centième', `On coupe 1 entier en <b>100 parts égales</b> : chaque part est un <b>centième</b>. ${F(1, 100)} = <b>0,01</b>. Sur la grille de 100 carreaux, 27 carreaux colorés font ${F(27, 100)} = 0,27. Un dixième vaut 10 centièmes.`, 'cm1_centiemes'),
        S('La virgule et le tableau', 'La virgule sépare la <b>partie entière</b> (à gauche) de la <b>partie décimale</b> (à droite). Dans 12,34 : 1 dizaine, 2 unités, 3 dixièmes et 4 centièmes.', 'cm1_tabdec'),
        S('Comparer', 'On compare d’abord les parties entières. Si elles sont égales, on compare les dixièmes, puis les centièmes. 2,5 &gt; 2,45 car 5 dixièmes &gt; 4 dixièmes. Astuce : 2,5 = 2,50.', 'cm1_droiteDec'),
        S('Fraction ou virgule ?', `Une fraction décimale a 10, 100… au dénominateur. On peut l’écrire avec une virgule : ${F(7, 10)} = 0,7 ; ${F(45, 100)} = 0,45 ; ${F(5, 100)} = 0,05. Attention au zéro : 0,05 n’est pas 0,5 !`),
      ],
      recap: ['1 dixième = 0,1 ; 1 centième = 0,01.', 'La virgule sépare la partie entière de la partie décimale.', 'On compare les parties entières, puis les dixièmes, puis les centièmes.', `${F(7, 10)} = 0,7 et ${F(45, 100)} = 0,45.`],
      quiz: [Q('Dans 7,48, quel est le chiffre des dixièmes ?', ['8', '4', '7'], 1), Q('Quel nombre est le plus grand ?', ['3,09', '3,19', '3,9'], 2), Q('3 dixièmes + 4 centièmes = ?', ['0,34', '0,43', '0,7'], 0)] }),

    D({ id: 'cm1-multiplication', subj: 'maths', level: 'cm1', icon: '✖️', title: 'La multiplication posée',
      intro: 'Dans une boîte, il y a 6 billes. Combien de billes dans 24 boîtes ? Plutôt que d’additionner 24 fois, on multiplie !',
      steps: [
        S('Une addition répétée', '3 rangées de 4 billes : 4 + 4 + 4 = 12, donc 3 × 4 = 12. Multiplier, c’est additionner plusieurs fois le même nombre. Il faut bien connaître les <b>tables de multiplication</b>.', 'cm1_billes'),
        S('× 10, × 100, × 1 000', 'Pour multiplier un nombre entier par <b>10</b>, chaque chiffre avance d’un rang : on écrit un zéro à droite. 35 × 10 = 350. Par <b>100</b>, deux zéros : 35 × 100 = 3 500. Par <b>1 000</b>, trois zéros : 35 × 1 000 = 35 000.', 'cm1_x10'),
        S('Par un nombre à un chiffre', 'On pose 275 × 4 et on commence par les unités. 4 × 5 = 20 : j’écris 0 et je retiens 2. 4 × 7 = 28, plus 2 retenu = 30 : j’écris 0 et je retiens 3. 4 × 2 = 8, plus 3 = 11. Résultat : 1 100.', 'cm1_posee1'),
        S('Par un nombre à deux chiffres', 'Pour 36 × 24, on fait deux multiplications. D’abord 36 × 4 = 144. Ensuite 36 × 20 : on écrit un <b>0</b> sous les unités, puis 36 × 2 = 72, ce qui donne 720. On additionne : 144 + 720 = 864.', 'cm1_posee2'),
        S('Vérifier avec un ordre de grandeur', 'Pour voir si le résultat est possible, on arrondit : 36 × 24 est proche de 40 × 20 = 800. Le résultat 864 est proche de 800 : c’est cohérent !'),
      ],
      recap: ['Multiplier = additionner plusieurs fois le même nombre.', '× 10, × 100, × 1 000 : on ajoute 1, 2 ou 3 zéros.', 'On pose l’opération en commençant par les unités, sans oublier les retenues.', 'Avec deux chiffres : on multiplie par les unités, puis par les dizaines (avec un 0).'],
      quiz: [Q('35 × 100 = ?', ['350', '3 500', '35 000'], 1), Q('24 × 3 = ?', ['72', '62', '82'], 0), Q('Quel est l’ordre de grandeur de 48 × 21 ?', ['100', '10 000', '1 000'], 2)] }),

    D({ id: 'cm1-division', subj: 'maths', level: 'cm1', icon: '➗', title: 'La division euclidienne',
      intro: 'Tu as 25 billes à partager entre 4 amis. Chacun en reçoit 6, et il en reste 1 : c’est une division avec reste.',
      steps: [
        S('Partager', '25 billes pour 4 amis : on cherche combien chacun en reçoit. 4 × 6 = 24, donc chacun reçoit <b>6</b> billes. Il en reste <b>1</b>, qu’on ne peut pas partager.', 'cm1_partage'),
        S('Le vocabulaire', '25 = 4 × 6 + 1. Le nombre qu’on partage (25) est le <b>dividende</b>. Le nombre de parts (4) est le <b>diviseur</b>. Le résultat (6) est le <b>quotient</b>. Ce qui reste (1) est le <b>reste</b>.', 'cm1_vocab'),
        S('Le reste est petit', 'Le <b>reste</b> est toujours plus petit que le diviseur. Avec 4 amis, s’il reste 4 billes, on peut encore en donner 1 à chacun ! Donc le reste est 0, 1, 2 ou 3.'),
        S('Poser la division', 'Pour 97 ÷ 4 : dans 9, il y a 2 fois 4 (2 × 4 = 8) ; 9 − 8 = 1. On abaisse le 7 : 17. Dans 17, il y a 4 fois 4 (4 × 4 = 16) ; 17 − 16 = 1. Le quotient est <b>24</b> et le reste est <b>1</b>.', 'cm1_divpose'),
        S('Vérifier', 'On vérifie avec : <b>dividende = diviseur × quotient + reste</b>. Ici : 4 × 24 + 1 = 96 + 1 = 97. Le calcul tombe juste, la division est bonne.'),
      ],
      recap: ['Dividende = diviseur × quotient + reste.', 'Le reste est toujours plus petit que le diviseur.', 'On divise chiffre par chiffre, en abaissant le chiffre suivant.', 'On vérifie avec une multiplication et une addition.'],
      quiz: [Q('Dans 38 = 5 × 7 + 3, quel est le reste ?', ['3', '5', '7'], 0), Q('On divise 50 par 6. Quel est le quotient et le reste ?', ['7 et 8', '8 et 2', '8 et 8'], 1), Q('Dans une division par 7, quel reste est possible ?', ['7', '9', '4'], 2)] }),

    D({ id: 'cm1-perimetre-aire', subj: 'maths', level: 'cm1', icon: '🟦', title: 'Périmètre et aire',
      intro: 'Pour entourer un jardin d’une clôture, il faut connaître la longueur de son tour. Pour le recouvrir de gazon, il faut connaître sa surface.',
      steps: [
        S('Le périmètre', 'Le <b>périmètre</b> d’une figure est la longueur de son <b>tour</b>. Pour un rectangle de 8 cm sur 5 cm : 8 + 5 + 8 + 5 = 26 cm. On l’exprime en cm, en m, en km…', 'cm1_perim'),
        S('Formules du périmètre', 'Rectangle : <b>P = 2 × (L + l)</b>, avec L la longueur et l la largeur. Ici 2 × (8 + 5) = 2 × 13 = 26 cm. Carré : <b>P = 4 × c</b>, car les 4 côtés sont égaux. Un carré de 3 cm de côté : 4 × 3 = 12 cm.', 'cm1_carreP'),
        S('L’aire', 'L’<b>aire</b> mesure la <b>surface</b> à l’intérieur d’une figure. On compte combien de carreaux la recouvrent. Un rectangle de 5 carreaux sur 3 carreaux : 15 carreaux. Si chaque carreau mesure 1 cm de côté, l’aire est 15 cm<sup>2</sup>.', 'cm1_aire'),
        S('Formules de l’aire', 'Rectangle : <b>A = L × l</b>. Un rectangle de 6 cm sur 4 cm : 6 × 4 = 24 cm<sup>2</sup>. Carré : <b>A = c × c</b>. Un carré de 5 cm de côté : 5 × 5 = 25 cm<sup>2</sup>.'),
        S('Ne pas confondre', 'Le périmètre se mesure en <b>cm</b> (une longueur) ; l’aire se mesure en <b>cm<sup>2</sup></b> (une surface). Un rectangle de 6 cm sur 2 cm et un rectangle de 5 cm sur 3 cm ont le même périmètre, 16 cm, mais pas la même aire : 12 cm<sup>2</sup> et 15 cm<sup>2</sup>.'),
      ],
      recap: ['Périmètre = longueur du tour (en cm, en m…).', 'Rectangle : P = 2 × (L + l) ; carré : P = 4 × c.', 'Aire = surface (en cm<sup>2</sup>, en m<sup>2</sup>…).', 'Rectangle : A = L × l ; carré : A = c × c.'],
      quiz: [Q('Quel est le périmètre d’un rectangle de 7 cm sur 3 cm ?', ['20 cm', '21 cm', '10 cm'], 0), Q('Quelle est l’aire d’un carré de 5 cm de côté ?', ['20 cm<sup>2</sup>', '10 cm<sup>2</sup>', '25 cm<sup>2</sup>'], 2), Q('Un rectangle a pour aire 24 cm<sup>2</sup> et pour longueur 6 cm. Quelle est sa largeur ?', ['18 cm', '4 cm', '30 cm'], 1)] }),

    D({ id: 'cm1-angles', subj: 'maths', level: 'cm1', icon: '📐', title: 'Les angles',
      intro: 'Quand tu ouvres un livre, une porte ou un compas, tu fabriques un angle. Plus tu ouvres, plus l’angle est grand.',
      steps: [
        S('Qu’est-ce qu’un angle ?', 'Un <b>angle</b> est formé par deux côtés qui partent du même point, le <b>sommet</b>. Plus l’écart entre les deux côtés est grand, plus l’angle est grand. La longueur des côtés ne change rien.', 'cm1_angle'),
        S('L’angle droit', 'L’<b>angle droit</b> est celui d’un coin de feuille ou de cahier. On le vérifie avec l’<b>équerre</b> et on le marque avec un petit carré. Il mesure <b>90°</b>.', 'cm1_droit'),
        S('Aigu, droit, obtus', 'Un angle <b>aigu</b> est plus petit qu’un angle droit (moins de 90°). Un angle <b>obtus</b> est plus grand qu’un angle droit (entre 90° et 180°). L’angle <b>plat</b> mesure 180° : c’est une ligne droite.', 'cm1_types'),
        S('Mesurer avec le rapporteur', 'On mesure un angle en <b>degrés (°)</b> avec le <b>rapporteur</b>. On pose le centre sur le sommet, on aligne un côté avec le 0, puis on lit le nombre où passe l’autre côté. Ici : 60°.', 'cm1_rapporteur'),
        S('Astuce de lecture', 'Le rapporteur a deux séries de nombres. On lit celle qui commence par le <b>0</b> posé sur un côté de l’angle. Avant de mesurer, on se demande : l’angle est-il aigu ou obtus ? Cela évite de lire le mauvais nombre.'),
      ],
      recap: ['Un angle a un sommet et deux côtés.', 'Angle droit = 90° (équerre).', 'Aigu : moins de 90° ; obtus : plus de 90° ; plat : 180°.', 'On mesure un angle en degrés avec le rapporteur.'],
      quiz: [Q('Un angle de 120° est…', ['aigu', 'droit', 'obtus'], 2), Q('Combien mesure un angle droit ?', ['90°', '45°', '180°'], 0), Q('Quel instrument mesure un angle ?', ['le compas', 'le rapporteur', 'la règle'], 1)] }),

    D({ id: 'cm1-droites', subj: 'maths', level: 'cm1', icon: '🛤️', title: 'Parallèles et perpendiculaires',
      intro: 'Les rails d’un train ne se croisent jamais. Les côtés d’une fenêtre se croisent dans les coins. Voilà deux façons différentes de placer des droites.',
      steps: [
        S('Droites perpendiculaires', 'Deux droites sont <b>perpendiculaires</b> quand elles se coupent en formant un <b>angle droit</b>. On note d<sub>1</sub> ⊥ d<sub>2</sub>. On marque l’angle droit avec un petit carré.', 'cm1_perp'),
        S('Droites parallèles', 'Deux droites sont <b>parallèles</b> quand elles ne se coupent jamais, même si on les prolonge. Elles gardent toujours le même écart, comme les deux rails d’un train. On note d<sub>3</sub> // d<sub>4</sub>.', 'cm1_para'),
        S('Tracer une perpendiculaire', 'On pose l’<b>équerre</b> avec un côté de l’angle droit sur la droite d. On trace le long de l’autre côté de l’angle droit. Pour passer par un point A, on glisse l’équerre jusqu’à ce que ce côté touche A.', 'cm1_equerre'),
        S('Tracer une parallèle', 'On pose l’équerre sur la droite, puis la règle contre un autre côté de l’équerre. On tient bien la règle et on <b>glisse</b> l’équerre le long de la règle. On trace alors la nouvelle droite : elle est parallèle à la première.', 'cm1_glisse'),
        S('Dans la vie', 'Dans la classe, les bords opposés d’une table sont parallèles. Un coin de la table forme un angle droit : deux bords voisins sont perpendiculaires. Cherche d’autres exemples autour de toi !'),
      ],
      recap: ['Perpendiculaires : elles se coupent en angle droit.', 'Parallèles : elles ne se coupent jamais et gardent le même écart.', 'On trace une perpendiculaire avec l’équerre.', 'On trace une parallèle en glissant l’équerre le long d’une règle.'],
      quiz: [Q('Deux droites perpendiculaires forment un angle…', ['aigu', 'obtus', 'droit'], 2), Q('Les deux rails d’un train sont…', ['parallèles', 'perpendiculaires', 'courbes'], 0), Q('Quel outil sert à tracer un angle droit ?', ['le compas', 'l’équerre', 'la gomme'], 1)] }),

    D({ id: 'cm1-proportionnalite', subj: 'maths', level: 'cm1', icon: '⚖️', title: 'La proportionnalité',
      intro: 'Si un gâteau coûte 2 €, deux gâteaux coûtent 4 €, trois gâteaux 6 €… Le prix augmente régulièrement : c’est de la proportionnalité.',
      steps: [
        S('Un tableau de proportionnalité', 'Deux grandeurs sont <b>proportionnelles</b> quand, si l’une est multipliée par 2, 3, 4…, l’autre est multipliée par le même nombre. Dans le tableau, on passe de la ligne du haut à la ligne du bas en multipliant toujours par le même nombre : ici × 2.', 'cm1_tableau'),
        S('Passer d’une colonne à l’autre', 'On peut aussi comparer deux colonnes. Si on multiplie le nombre de crayons par 3 (de 2 à 6), on multiplie aussi le prix par 3 (de 4 à 12).', 'cm1_coef'),
        S('Le retour à l’unité', 'Pour trouver le prix d’un seul objet, on divise. 4 cahiers coûtent 12 €, donc 1 cahier coûte 12 ÷ 4 = 3 €. Puis 7 cahiers coûtent 7 × 3 = 21 €.', 'cm1_unite'),
        S('Doubles, moitiés et sommes', 'On peut aussi utiliser les doubles, les moitiés ou additionner des colonnes. Si 2 gâteaux coûtent 4 € et 3 gâteaux coûtent 6 €, alors 5 gâteaux coûtent 4 + 6 = 10 €. La moitié de 8 € est 4 € : 2 gâteaux coûtent la moitié du prix de 4 gâteaux.'),
        S('Attention !', 'Tout n’est pas proportionnel ! Si Léa a 8 ans et mesure 130 cm, elle ne mesurera pas 260 cm à 16 ans. Avant de calculer, on se demande : « Si je double l’un, est-ce que l’autre double aussi ? »'),
      ],
      recap: ['Proportionnel : on multiplie (ou on divise) les deux lignes par le même nombre.', 'Retour à l’unité : on cherche d’abord la valeur pour 1.', 'On peut utiliser le double, la moitié ou la somme de colonnes.', 'Tout n’est pas proportionnel : on vérifie toujours.'],
      quiz: [Q('Un cahier coûte 3 €. Combien coûtent 5 cahiers ?', ['8 €', '15 €', '10 €'], 1), Q('3 stylos coûtent 6 €. Combien coûtent 9 stylos ?', ['12 €', '15 €', '18 €'], 2), Q('4 gâteaux coûtent 8 €. Combien coûtent 2 gâteaux ?', ['4 €', '16 €', '6 €'], 0)] }),
  );
})();
