/* Cours illustrés : Grande section (5-6 ans). Peu de texte, beaucoup d'images. */
(function () {
  'use strict';
  const K = window.CourseKit, { C, svg, L, ARROW, S, Q, FIG } = K;
  const X = (x, y, s, fill = 'currentColor', size = 13, extra = '') => `<text x="${x}" y="${y}" fill="${fill}" stroke="none" font-size="${size}" font-weight="700" text-anchor="middle" ${extra}>${s}</text>`;
  const at = (cls, d) => (cls ? `class="${cls}" ` : '') + (d ? `style="animation-delay:${d}s" ` : '');
  const B = (x, y, c, r = 11, cls = '', d = 0) => `<circle ${at(cls, d)}cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="currentColor" stroke-width="1.5"/>`;
  const R = (x, y, w, h, c, cls = '', d = 0) => `<rect ${at(cls, d)}x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" stroke="currentColor" stroke-width="1.5"/>`;
  const TR = (x, y, s, c, cls = '', d = 0) => `<polygon ${at(cls, d)}points="${x},${y - s / 2} ${x + s / 2},${y + s / 2} ${x - s / 2},${y + s / 2}" fill="${c}" stroke="currentColor" stroke-width="1.5"/>`;
  const BOX = (x, y, w, h, c) => `<path d="M${x} ${y}V${y + h}H${x + w}V${y}" stroke="${c}" stroke-width="4"/>`;

  Object.assign(FIG, {
    /* ---- compter ---- */
    gs_billes: () => {
      let b = '';
      const cols = [C.bleu, C.or, C.vert, C.rouge, C.brand];
      for (let i = 0; i < 5; i++) b += B(55 + i * 62, 45, cols[i], 18, i === 4 ? 'pop' : '', 0) + X(55 + i * 62, 93, i + 1, cols[i], 20);
      return svg(360, 110, b);
    },
    gs_dix: () => {
      let b = '';
      for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
        const n = r * 5 + i + 1, c = r ? C.or : C.bleu;
        b += B(48 + i * 46, 38 + r * 50, c, 17, n === 10 ? 'pop' : '') + X(48 + i * 46, 44 + r * 50, n, '#fff', 15);
      }
      b += X(310, 75, 10, C.rouge, 46, 'class="pop"');
      return svg(360, 120, b);
    },
    gs_quinze: () => {
      let b = '';
      for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) b += B(28 + i * 22, 30 + r * 24, C.bleu, 9);
      for (let i = 0; i < 5; i++) b += B(166 + i * 20, 42, C.or, 9, 'pop', i * 0.15);
      b += X(144, 49, '+', C.gris, 26) + X(284, 49, '=', C.gris, 26) + X(326, 52, 15, C.rouge, 36, 'class="pop"');
      b += X(72, 92, 10, C.bleu, 20) + X(206, 92, 5, C.or, 20);
      return svg(360, 110, b);
    },
    gs_file20: () => {
      let b = ARROW('gsa1', 'currentColor') + `<line x1="10" y1="62" x2="352" y2="62" stroke="currentColor" stroke-width="3" marker-end="url(#gsa1)"/>`;
      for (let i = 0; i <= 10; i++) {
        const x = 24 + i * 31, n = 10 + i, hot = n === 10 || n === 15;
        b += L(x, 55, x, 69, 'currentColor', 2) + X(x, 90, n, hot ? (n === 10 ? C.bleu : C.or) : 'currentColor', hot ? 16 : 13);
      }
      b += `<path class="dash" d="M55 50Q117 6 179 50" stroke="${C.rouge}" stroke-width="3"/>`;
      b += B(55, 62, C.bleu, 7) + B(179, 62, C.or, 8, 'pop');
      return svg(360, 105, b);
    },
    /* ---- formes ---- */
    gs_formes: () => {
      let b = B(48, 52, C.bleu, 30, 'pop', 0) + R(105, 22, 60, 60, C.or, 'pop', 0.3) + TR(222, 52, 64, C.vert, 'pop', 0.6) + R(268, 30, 80, 44, C.rouge, 'pop', 0.9);
      b += X(48, 112, 'rond', C.bleu, 13) + X(135, 112, 'carre', C.or, 13) + X(222, 112, 'triangle', C.vert, 13) + X(308, 112, 'rectangle', C.rouge, 13);
      return svg(360, 128, b);
    },
    gs_cotes: () => {
      let b = '';
      b += `<polygon points="55,20 100,90 10,90" fill="${C.vert}" fill-opacity=".25" stroke="${C.vert}" stroke-width="4"/>`;
      b += X(19, 52, 1, C.rouge, 16) + X(92, 52, 2, C.rouge, 16) + X(55, 110, 3, C.rouge, 16);
      b += `<rect x="135" y="25" width="60" height="60" fill="${C.or}" fill-opacity=".25" stroke="${C.or}" stroke-width="4"/>`;
      b += X(165, 18, 1, C.rouge, 16) + X(208, 60, 2, C.rouge, 16) + X(165, 106, 3, C.rouge, 16) + X(123, 60, 4, C.rouge, 16);
      b += `<rect x="248" y="35" width="82" height="46" fill="${C.rouge}" fill-opacity=".2" stroke="${C.rouge}" stroke-width="4"/>`;
      b += X(289, 28, 1, C.brand, 16) + X(342, 62, 2, C.brand, 16) + X(289, 100, 3, C.brand, 16) + X(236, 62, 4, C.brand, 16);
      b += X(55, 138, '3 cotes', C.vert, 14) + X(165, 138, '4 cotes', C.or, 14) + X(289, 138, '4 cotes', C.rouge, 14);
      return svg(360, 150, b);
    },
    gs_objets: () => {
      let b = B(45, 50, C.gris, 28) + B(45, 50, C.bleu, 8, 'pop') + L(45, 22, 45, 78, C.gris, 2) + L(17, 50, 73, 50, C.gris, 2);
      b += R(105, 22, 56, 56, C.bleu, '') + L(133, 22, 133, 78, 'currentColor', 2) + L(105, 50, 161, 50, 'currentColor', 2);
      b += R(200, 56, 60, 36, C.or) + TR(230, 40, 60, C.rouge, 'pop');
      b += R(300, 18, 40, 70, C.vert) + B(330, 56, C.or, 4);
      b += X(45, 112, 'roue', C.gris) + X(133, 112, 'fenetre', C.bleu) + X(230, 112, 'toit', C.rouge) + X(320, 112, 'porte', C.vert);
      return svg(360, 128, b);
    },
    /* ---- grandeurs ---- */
    gs_grandpetit: () => {
      let b = R(88, 88, 22, 34, '#a16207') + B(99, 58, C.vert, 42, 'pop');
      b += R(262, 108, 10, 14, '#a16207') + B(267, 96, C.vert, 17, 'pop', 0.4);
      b += X(99, 142, 'grand', C.vert, 16) + X(267, 142, 'petit', C.vert, 16);
      return svg(360, 150, b);
    },
    gs_longcourt: () => {
      const pen = (x, y, w, c) => R(x, y, w, 22, c) + `<polygon points="${x + w},${y} ${x + w + 18},${y + 11} ${x + w},${y + 22}" fill="${C.or}" stroke="currentColor" stroke-width="1.5"/>`;
      let b = pen(26, 20, 250, C.bleu).replace('<rect', '<rect class="pulse"') + pen(26, 78, 110, C.rouge);
      b += X(150, 62, 'long', C.bleu, 16) + X(80, 120, 'court', C.rouge, 16);
      return svg(360, 130, b);
    },
    gs_compare: () => {
      let b = `<line class="dash" x1="40" y1="8" x2="40" y2="112" stroke="${C.rouge}" stroke-width="3"/>`;
      b += R(40, 22, 260, 22, C.bleu) + R(40, 66, 150, 22, C.vert);
      b += `<path class="draw" pathLength="100" d="M193 78H300" stroke="${C.or}" stroke-width="4"/>`;
      b += X(200, 134, 'meme depart', C.rouge, 14);
      return svg(360, 146, b);
    },
    gs_ranger: () => {
      let b = ARROW('gsa2', C.rouge), hs = [26, 48, 70, 92], cs = [C.bleu, C.vert, C.or, C.rouge];
      hs.forEach((h, i) => { b += R(46 + i * 62, 112 - h, 46, h, cs[i], i === 3 ? 'pop' : ''); });
      b += `<line x1="46" y1="126" x2="300" y2="126" stroke="${C.gris}" stroke-width="3" marker-end="url(#gsa2)"/>`;
      b += X(180, 148, 'petit → grand', C.gris, 14);
      return svg(360, 158, b);
    },
    /* ---- trier ---- */
    gs_tri_couleur: () => {
      const seq = [C.rouge, C.bleu, C.vert, C.rouge, C.vert, C.rouge, C.bleu, C.vert, C.vert];
      let b = '';
      seq.forEach((c, i) => { b += B(36 + i * 36, 20, c, 10); });
      const cx = [60, 180, 300], cols = [C.rouge, C.bleu, C.vert], n = [3, 2, 4];
      cols.forEach((c, k) => {
        b += `<path class="dash" d="M${cx[k]} 40V70" stroke="${c}" stroke-width="3"/>` + BOX(cx[k] - 50, 78, 100, 62, c);
        for (let i = 0; i < n[k]; i++) b += B(n[k] === 4 ? cx[k] - 22 + (i % 2) * 44 : cx[k] - 28 + i * 28 - (n[k] === 2 ? -14 : 0), n[k] === 4 ? 96 + Math.floor(i / 2) * 26 : 118, c, 10, i === n[k] - 1 ? 'pop' : '');
        b += X(cx[k], 168, n[k], c, 20);
      });
      return svg(360, 180, b);
    },
    gs_tri_forme: () => {
      let b = `<line x1="120" y1="8" x2="120" y2="132" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 5"/><line x1="240" y1="8" x2="240" y2="132" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 5"/>`;
      for (let i = 0; i < 3; i++) b += B(60, 26 + i * 40, C.bleu, 15, i === 2 ? 'pop' : '') + R(165, 12 + i * 40, 30, 30, C.or, i === 2 ? 'pop' : '') + TR(300, 28 + i * 40, 32, C.vert, i === 2 ? 'pop' : '');
      return svg(360, 140, b);
    },
    gs_tri_taille: () => {
      let b = BOX(12, 20, 160, 90, C.bleu) + BOX(188, 20, 160, 90, C.rouge);
      [0, 1, 2].forEach((i) => { b += B(44 + i * 48, 76, C.bleu, 22, i === 2 ? 'pop' : ''); });
      [0, 1, 2].forEach((i) => { b += B(214 + i * 40, 98, C.rouge, 11, i === 2 ? 'pop' : ''); });
      b += X(90, 138, 'grands', C.bleu, 15) + X(268, 138, 'petits', C.rouge, 15);
      return svg(360, 150, b);
    },
    gs_intrus: () => {
      let b = B(52, 48, C.bleu, 26) + B(142, 48, C.bleu, 26) + R(206, 22, 52, 52, C.or, 'pulse') + B(322, 48, C.bleu, 26);
      b += `<path class="draw" pathLength="100" d="M175 92Q232 118 289 92" stroke="${C.rouge}" stroke-width="3"/>`;
      b += X(232, 134, 'intrus', C.rouge, 15);
      return svg(360, 146, b);
    },
    /* ---- suites et frises ---- */
    gs_frise_ab: () => {
      let b = '';
      for (let i = 0; i < 7; i++) b += i % 2 ? R(18 + i * 44, 33, 30, 30, C.or) : B(33 + i * 44, 48, C.bleu, 15);
      b += X(33 + 7 * 44 - 1, 62, '?', C.rouge, 40, 'class="pulse"');
      return svg(360, 100, b);
    },
    gs_frise_motif: () => {
      const seq = [C.rouge, C.rouge, C.bleu, C.rouge, C.rouge, C.bleu, C.rouge, C.rouge];
      let b = '';
      seq.forEach((c, i) => { b += B(24 + i * 38, 44, c, 14); });
      b += `<path class="draw" pathLength="100" d="M8 70V80H116V70" stroke="${C.vert}" stroke-width="4"/>` + X(62, 102, 'motif', C.vert, 15);
      b += X(328, 58, '?', C.rouge, 36, 'class="pulse"');
      return svg(360, 112, b);
    },
    gs_frise_3: () => {
      let b = '';
      for (let i = 0; i < 6; i++) { const x = 34 + i * 48, k = i % 3; b += k === 0 ? TR(x, 48, 34, C.vert) : k === 1 ? B(x, 48, C.bleu, 17) : R(x - 16, 32, 32, 32, C.or); }
      b += X(34 + 6 * 48, 62, '?', C.rouge, 40, 'class="pulse"');
      return svg(360, 100, b);
    },
    gs_frise_taille: () => {
      let b = '';
      const rs = [7, 13, 19];
      for (let i = 0; i < 6; i++) { const r = rs[i % 3]; b += B(30 + i * 50, 56, i % 3 === 0 ? C.vert : i % 3 === 1 ? C.or : C.rouge, r); }
      b += X(30 + 6 * 50 - 4, 70, '?', C.brand, 40, 'class="pulse"');
      return svg(360, 100, b);
    },
    /* ---- se repérer ---- */
    gs_dessus: () => {
      let b = R(50, 62, 200, 12, '#a16207') + R(62, 74, 12, 56, '#a16207') + R(226, 74, 12, 56, '#a16207');
      b += B(120, 44, C.rouge, 18, 'pop') + B(150, 112, C.bleu, 16, 'pop', 0.4);
      b += `<path class="dash" d="M270 44H146" stroke="${C.rouge}" stroke-width="3"/>` + `<path class="dash" d="M270 112H172" stroke="${C.bleu}" stroke-width="3"/>`;
      b += X(312, 49, 'dessus', C.rouge, 15) + X(312, 117, 'dessous', C.bleu, 15);
      return svg(360, 140, b);
    },
    gs_devant: () => {
      let b = B(122, 76, C.rouge, 20, 'pop') + R(30, 24, 100, 80, C.gris) + L(30, 64, 130, 64, 'currentColor', 1.5);
      b += R(210, 24, 100, 80, C.gris) + B(262, 84, C.rouge, 20, 'pop', 0.4);
      b += X(80, 128, 'derriere', C.gris, 15) + X(262, 128, 'devant', C.rouge, 15);
      return svg(360, 142, b);
    },
    gs_gauchedroite: () => {
      let b = ARROW('gsa3', C.bleu) + ARROW('gsa4', C.or);
      b += B(180, 54, '#fde68a', 26) + B(171, 48, 'currentColor', 3) + B(189, 48, 'currentColor', 3) + `<path d="M168 62Q180 72 192 62" stroke="currentColor" stroke-width="2.5"/>`;
      b += R(34, 34, 44, 44, C.bleu, 'pop') + TR(318, 56, 50, C.or, 'pop', 0.4);
      b += `<line class="dash" x1="146" y1="56" x2="92" y2="56" stroke="${C.bleu}" stroke-width="3" marker-end="url(#gsa3)"/><line class="dash" x1="214" y1="56" x2="276" y2="56" stroke="${C.or}" stroke-width="3" marker-end="url(#gsa4)"/>`;
      b += X(56, 108, 'a gauche', C.bleu, 15) + X(300, 108, 'a droite', C.or, 15);
      return svg(360, 122, b);
    },
    gs_sens: () => {
      let b = ARROW('gsa5', C.rouge) + `<line x1="20" y1="48" x2="340" y2="48" stroke="${C.rouge}" stroke-width="4" marker-end="url(#gsa5)"/>`;
      [C.bleu, C.or, C.vert, C.brand].forEach((c, i) => { b += B(60 + i * 80, 48, c, 20, i === 3 ? 'pop' : '') + X(60 + i * 80, 55, i + 1, '#fff', 20); });
      b += X(45, 100, 'gauche', C.gris, 15) + X(315, 100, 'droite', C.gris, 15);
      return svg(360, 112, b);
    },
    /* ---- ajouter / enlever ---- */
    gs_ajouter: () => {
      let b = '';
      for (let i = 0; i < 5; i++) b += B(70 + i * 55, 34, i < 3 ? C.bleu : C.or, 20, i >= 3 ? 'pop' : '', i >= 3 ? (i - 3) * 0.3 : 0);
      b += X(60, 105, 3, C.bleu, 34) + X(110, 103, '+', C.gris, 34) + X(160, 105, 2, C.or, 34) + X(212, 103, '=', C.gris, 34) + X(265, 105, 5, C.rouge, 40, 'class="pop"');
      return svg(360, 122, b);
    },
    gs_enlever: () => {
      let b = '';
      for (let i = 0; i < 5; i++) {
        const x = 70 + i * 55;
        b += `<g${i >= 3 ? ' opacity=".4"' : ''}>${B(x, 34, '#fbbf24', 20)}${B(x - 6, 28, '#92400e', 2.5)}${B(x + 6, 30, '#92400e', 2.5)}${B(x, 42, '#92400e', 2.5)}</g>`;
        if (i >= 3) b += `<g class="pulse">${L(x - 14, 20, x + 14, 48, C.rouge, 4)}${L(x - 14, 48, x + 14, 20, C.rouge, 4)}</g>`;
      }
      b += X(60, 105, 5, C.or, 34) + X(110, 103, '−', C.gris, 34) + X(160, 105, 2, C.rouge, 34) + X(212, 103, '=', C.gris, 34) + X(265, 105, 3, C.vert, 40, 'class="pop"');
      return svg(360, 122, b);
    },
    gs_saut: () => {
      let b = ARROW('gsa6', C.rouge) + ARROW('gsa7', C.bleu);
      const line = (y, a, bb, c, id, lab, up) => {
        let s = `<line x1="14" y1="${y}" x2="346" y2="${y}" stroke="currentColor" stroke-width="3"/>`;
        for (let i = 0; i <= 10; i++) s += L(24 + i * 31, y - 6, 24 + i * 31, y + 6, 'currentColor', 2) + X(24 + i * 31, y + 22, i, i === a ? C.gris : i === bb ? c : 'currentColor', i === a || i === bb ? 16 : 12);
        const x1 = 24 + a * 31, x2 = 24 + bb * 31, m = (x1 + x2) / 2;
        s += `<path class="draw" pathLength="100" d="M${x1} ${y - 8}Q${m} ${y - 52} ${x2} ${y - 10}" stroke="${c}" stroke-width="4" marker-end="url(#${id})"/>`;
        s += B(x1, y, C.gris, 6) + B(x2, y, c, 8, 'pop') + X(m, y - 40, lab, c, 20);
        return s;
      };
      b += line(72, 4, 7, C.rouge, 'gsa6', '+3') + line(166, 8, 6, C.bleu, 'gsa7', '−2');
      return svg(360, 190, b);
    },
    gs_dix_amis: () => {
      let b = '';
      for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
        const n = r * 5 + i;
        b += R(62 + i * 48, 14 + r * 48, 44, 44, 'none') + B(84 + i * 48, 36 + r * 48, n < 6 ? C.rouge : C.bleu, 17, n === 6 ? 'pop' : '');
      }
      b += X(80, 138, 6, C.rouge, 32) + X(130, 136, '+', C.gris, 32) + X(180, 138, 4, C.bleu, 32) + X(232, 136, '=', C.gris, 32) + X(285, 138, 10, C.vert, 36, 'class="pop"');
      return svg(360, 152, b);
    },
  });

  K.COURSES.push(
    { id: 'gs-compter', subj: 'maths', level: 'gs', icon: '🔢', title: 'Je compte jusqu’à 20',
      intro: 'Compter, c’est dire combien il y en a. Avec les billes, les doigts et les nombres, on compte jusqu’à 20 !',
      steps: [
        S('Un, deux, trois…', 'Je montre <b>chaque bille</b> avec mon doigt et je dis un nombre : 1, 2, 3, 4, 5. Le dernier nombre dit, c’est <b>combien il y en a</b>.', 'gs_billes'),
        S('Jusqu’à 10', 'Avec mes deux mains, j’ai <b>10 doigts</b>. Je compte : 1, 2, 3, 4, 5, 6, 7, 8, 9, <b>10</b> !', 'gs_dix'),
        S('Une fois chacun', 'Je compte chaque objet <b>une seule fois</b>. Je les pousse d’un côté après les avoir comptés, comme ça je n’en oublie aucun.'),
        S('Après 10', 'Pour aller plus loin, je garde <b>10</b> et j’ajoute les autres un par un. 10 et 5 de plus, ça fait <b>15</b>.', 'gs_quinze'),
        S('Jusqu’à 20', 'Je continue la file : 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, <b>20</b>. Un nombre plus loin dans la file est <b>plus grand</b>.', 'gs_file20'),
      ],
      recap: ['Je montre chaque objet une seule fois.', 'Le dernier nombre dit, c’est combien il y en a.', 'Après 9, il y a 10. Après 19, il y a 20.'],
      quiz: [Q('Quel nombre vient juste après 9 ?', ['8', '10', '11'], 1), Q('Quel nombre vient juste avant 15 ?', ['14', '16', '13'], 0), Q('Dans l’ordre : 17, 18, … Quel est le nombre suivant ?', ['20', '16', '19'], 2)] },

    { id: 'gs-formes', subj: 'maths', level: 'gs', icon: '🔷', title: 'Rond, carré, triangle, rectangle',
      intro: 'Autour de moi, il y a des formes partout : sur la porte, sur la fenêtre, sur le toit des maisons.',
      steps: [
        S('Quatre formes', 'Voici quatre formes à connaître : le <b>rond</b>, le <b>carré</b>, le <b>triangle</b> et le <b>rectangle</b>.', 'gs_formes'),
        S('Le rond', 'Le <b>rond</b> n’a pas de coin et n’a pas de côté droit. Il est tout rond, alors il peut rouler, comme une roue.'),
        S('Le triangle', 'Le <b>triangle</b> a <b>3 côtés</b> et <b>3 coins</b>. Je compte avec mon doigt : 1, 2, 3.', 'gs_cotes'),
        S('Le carré et le rectangle', 'Le <b>carré</b> a <b>4 côtés</b> tous pareils. Le <b>rectangle</b> a aussi 4 côtés : 2 longs et 2 courts.'),
        S('Dans la vie', 'La roue est un rond. La fenêtre est un carré. Le toit est un triangle. La porte est un rectangle. Et dans ta classe ?', 'gs_objets'),
      ],
      recap: ['Le rond n’a pas de coin.', 'Le triangle a 3 côtés.', 'Le carré et le rectangle ont 4 côtés.'],
      quiz: [Q('Combien de côtés a un triangle ?', ['2', '3', '4'], 1), Q('Quelle forme a une roue ?', ['un carré', 'un triangle', 'un rond'], 2), Q('Quelle forme a une porte ?', ['un rectangle', 'un rond', 'un triangle'], 0)] },

    { id: 'gs-grandeurs', subj: 'maths', level: 'gs', icon: '📏', title: 'Grand, petit, long, court',
      intro: 'Pour comparer deux objets, je regarde lequel est le plus grand, le plus petit, le plus long ou le plus court.',
      steps: [
        S('Grand et petit', 'Le grand arbre est <b>plus grand</b> que le petit arbre. Le petit arbre est <b>plus petit</b>.', 'gs_grandpetit'),
        S('Long et court', 'Le crayon bleu est <b>long</b>. Le crayon rouge est <b>court</b>. Le bleu est plus long que le rouge.', 'gs_longcourt'),
        S('Bien comparer', 'Pour comparer deux bâtons, je les pose <b>côte à côte</b>, avec un bout au <b>même endroit</b>. Je regarde l’autre bout : celui qui dépasse est le plus long.', 'gs_compare'),
        S('Ranger', 'Je peux ranger des objets <b>du plus petit au plus grand</b>, comme des marches d’escalier.', 'gs_ranger'),
        S('Par rapport à…', 'Une souris est petite à côté d’un chat, mais grande à côté d’une fourmi. On compare toujours <b>deux choses</b>.'),
      ],
      recap: ['Je compare deux objets.', 'Je les pose côte à côte, au même endroit de départ.', 'Je range du plus petit au plus grand.'],
      quiz: [Q('Une fourmi est … qu’un éléphant.', ['plus grande', 'plus petite', 'aussi grande'], 1), Q('Pour comparer deux bâtons, je les mets …', ['côte à côte, bien alignés', 'très loin l’un de l’autre', 'dans mon cartable'], 0)] },

    { id: 'gs-trier', subj: 'maths', level: 'gs', icon: '🧺', title: 'Je trie et je classe',
      intro: 'Trier, c’est mettre ensemble ce qui se ressemble. Les billes rouges avec les rouges, les cubes avec les cubes !',
      steps: [
        S('Pourquoi trier ?', 'Quand je range mes jouets, je mets les voitures ensemble et les poupées ensemble. Je <b>trie</b> pour retrouver vite ce que je cherche.'),
        S('Trier par couleur', 'Je mets les billes <b>rouges</b> dans une boîte, les <b>bleues</b> dans une autre, les <b>vertes</b> dans la dernière. Ensuite je compte chaque tas : 3, 2 et 4.', 'gs_tri_couleur'),
        S('Trier par forme', 'Je peux aussi trier par <b>forme</b> : les ronds ensemble, les carrés ensemble, les triangles ensemble.', 'gs_tri_forme'),
        S('Trier par taille', 'Ou par <b>taille</b> : les grands d’un côté, les petits de l’autre.', 'gs_tri_taille'),
        S('Trouver l’intrus', 'Dans un groupe, un objet n’est pas comme les autres : c’est <b>l’intrus</b>. Ici, c’est le carré orange.', 'gs_intrus'),
      ],
      recap: ['Trier, c’est ranger ensemble ce qui se ressemble.', 'Je peux trier par couleur, par forme ou par taille.', 'L’intrus n’est pas comme les autres.'],
      quiz: [Q('Dans la boîte des billes rouges, je mets …', ['les billes bleues', 'les billes rouges', 'les cubes'], 1), Q('Quel est l’intrus : pomme, poire, ballon, banane ?', ['la poire', 'la banane', 'le ballon'], 2), Q('3 billes rouges et 2 billes bleues. Combien de billes en tout ?', ['5', '6', '1'], 0)] },

    { id: 'gs-frises', subj: 'maths', level: 'gs', icon: '🎨', title: 'Les suites et les frises',
      intro: 'Une frise, c’est une ligne de dessins qui se répètent. Savoir la continuer, c’est être un petit détective !',
      steps: [
        S('Une frise', 'Rond, carré, rond, carré… Les dessins reviennent <b>dans le même ordre</b>. Que faut-il mettre à la place du point d’interrogation ? Un <b>carré</b> !', 'gs_frise_ab'),
        S('Trouver le motif', 'Le <b>motif</b> est la petite partie qui se répète. Ici : rouge, rouge, bleu. Puis on recommence : rouge, rouge, bleu…', 'gs_frise_motif'),
        S('Continuer la frise', 'Triangle, rond, carré, triangle, rond, carré… Je regarde le motif et je continue : après le carré, il revient un <b>triangle</b>.', 'gs_frise_3'),
        S('Avec des tailles', 'Une frise peut changer de taille : petit, moyen, grand, puis petit, moyen, grand… Je continue avec un <b>petit</b>.', 'gs_frise_taille'),
        S('J’invente', 'À mon tour de créer une frise avec des cubes ou des perles. Je choisis un motif et je le répète sans me tromper !'),
      ],
      recap: ['Dans une frise, un motif se répète.', 'Je cherche le motif, puis je continue.', 'Je peux inventer ma propre frise.'],
      quiz: [Q('Rond, carré, rond, carré, rond, … Qu’est-ce qui vient après ?', ['un rond', 'un carré', 'un triangle'], 1), Q('Rouge, rouge, bleu, rouge, rouge, bleu, rouge, rouge, … Quelle couleur vient après ?', ['rouge', 'vert', 'bleu'], 2), Q('Triangle, rond, carré, triangle, rond, … Qu’est-ce qui vient après ?', ['un triangle', 'un rond', 'un carré'], 2)] },

    { id: 'gs-reperer', subj: 'maths', level: 'gs', icon: '🧭', title: 'Je me repère',
      intro: 'Dessus, dessous, devant, derrière, à gauche, à droite : ces mots disent où se trouvent les choses.',
      steps: [
        S('Dessus et dessous', 'La balle rouge est <b>sur</b> la table : elle est <b>dessus</b>. La balle bleue est <b>sous</b> la table : elle est <b>dessous</b>.', 'gs_dessus'),
        S('Devant et derrière', 'La balle est <b>devant</b> le mur : je la vois bien. Cette autre balle est <b>derrière</b> le mur : elle se cache.', 'gs_devant'),
        S('À gauche et à droite', 'Le carré bleu est <b>à gauche</b> du bonhomme. Le triangle orange est <b>à droite</b>.', 'gs_gauchedroite'),
        S('Le sens de la lecture', 'Pour lire, je vais de la <b>gauche</b> vers la <b>droite</b>. Je commence au 1, puis le 2, le 3 et le 4.', 'gs_sens'),
        S('Jacques a dit', 'Jouons ! « Mets la main <b>sur</b> ta tête. Mets le pied <b>devant</b>. Lève la main <b>droite</b>. » Je réfléchis bien avant de bouger.'),
      ],
      recap: ['Dessus ou dessous.', 'Devant ou derrière.', 'À gauche ou à droite.'],
      quiz: [Q('Le chat est sous la table. Où est-il ?', ['dessus', 'dessous', 'derrière'], 1), Q('Dans la file, la personne avant moi est …', ['derrière moi', 'devant moi', 'sous moi'], 1), Q('Le ballon est sur la table. Il est …', ['dessous', 'à gauche', 'dessus'], 2)] },

    { id: 'gs-ajouter-enlever', subj: 'maths', level: 'gs', icon: '➕', title: 'J’ajoute et j’enlève',
      intro: 'Quand je reçois des billes, j’en ai davantage qu’avant : j’ajoute. Quand j’en donne ou que j’en perds, il m’en reste moins : j’enlève. Je calcule jusqu’à 10 !',
      steps: [
        S('Ajouter', 'J’ai <b>3</b> billes bleues. On me donne <b>2</b> billes orange. Je les mets ensemble : 3 + 2 = <b>5</b> billes.', 'gs_ajouter'),
        S('Enlever', 'Il y a <b>5</b> gâteaux. J’en mange <b>2</b>. Il en reste : 5 − 2 = <b>3</b> gâteaux.', 'gs_enlever'),
        S('Sur la file des nombres', 'Pour <b>ajouter</b>, je saute en avant : 4 + 3 = <b>7</b>. Pour <b>enlever</b>, je saute en arrière : 8 − 2 = <b>6</b>.', 'gs_saut'),
        S('Les amis du 10', 'Certains nombres font <b>10</b> ensemble : 6 + 4 = <b>10</b>. Il y a 6 jetons rouges et 4 jetons bleus.', 'gs_dix_amis'),
        S('Un petit problème', 'Léa a 4 billes. Elle gagne 3 billes. Combien en a-t-elle ? Je calcule : 4 + 3 = <b>7</b>. Elle a 7 billes.'),
      ],
      recap: ['Ajouter (je reçois, on m’en donne) : j’en ai davantage, on avance sur la file.', 'Enlever (je donne, je perds, je mange) : il m’en reste moins, on recule sur la file.', '6 + 4 = 10.'],
      quiz: [Q('4 + 3 = ?', ['6', '7', '8'], 1), Q('8 − 2 = ?', ['6', '10', '5'], 0), Q('Il y a 10 billes. J’en perds 3. Combien en reste-t-il ?', ['6', '13', '7'], 2)] }
  );
})();
