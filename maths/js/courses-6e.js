/* Cours illustrés : 6e (maths, physique, chimie). Contenu en français ; l'audio utilise la voix du navigateur. */
(function () {
  'use strict';
  const K = window.CourseKit, { F, C, svg, T, L, ARROW, S, Q, FIG } = K;
  const Tx = (x, y, s, c = 'currentColor', sz = 13, a = 'middle', o = '') => `<text x="${x}" y="${y}" fill="${c}" stroke="none" font-size="${sz}" font-weight="700" text-anchor="${a}" ${o}>${s}</text>`;
  const R = (x, y, w, h, f = 'none', s = 'currentColor', sw = 2, o = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${s}" stroke-width="${sw}" ${o}/>`;
  const O = (x, y, r, f = 'none', s = 'currentColor', sw = 2, o = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${s}" stroke-width="${sw}" ${o}/>`;
  const P = (d, s = 'currentColor', sw = 3, f = 'none', o = '') => `<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${sw}" ${o}/>`;
  const pt = (cx, cy, r, a) => [+(cx + r * Math.sin(a * Math.PI / 180)).toFixed(1), +(cy - r * Math.cos(a * Math.PI / 180)).toFixed(1)];
  const sec = (cx, cy, r, a0, a1, f, o = '') => { const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1); return `<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z" fill="${f}" stroke="currentColor" stroke-width="2" ${o}/>`; };
  const fr = (x, y, n, d, c = 'currentColor', sz = 14) => Tx(x, y - 4, n, c, sz) + L(x - 9, y, x + 9, y, c, 2) + Tx(x, y + sz + 1, d, c, sz);
  const dots = (x, y, n, c, r = 5, gap = 12, o = '') => { let b = ''; for (let i = 0; i < n; i++) b += O(x + i * gap, y, r, c, 'none', 0, o); return b; };

  Object.assign(FIG, {
    /* ---- nombres décimaux ---- */
    dec_tableau: () => {
      const cols = ['dizaines', 'unités', 'dixièmes', 'centièmes', 'millièmes'], dg = ['1', '2', '5', '0', '7'], x0 = 25, w = 62; let b = '';
      cols.forEach((c, i) => { const x = x0 + i * w, k = i < 2 ? C.bleu : C.or;
        b += R(x, 22, w, 30, k, 'currentColor', 2, 'fill-opacity=".2"') + Tx(x + w / 2, 41, c, 'currentColor', 10) + R(x, 52, w, 44) + Tx(x + w / 2, 84, dg[i], k, 26); });
      b += Tx(x0 + 2 * w, 90, ',', C.rouge, 34, 'middle', 'class="pop"');
      b += P(`M${x0} 106V111H${x0 + 2 * w}V106`, C.bleu, 2) + P(`M${x0 + 2 * w + 3} 106V111H${x0 + 5 * w}V106`, C.or, 2);
      b += Tx(x0 + w, 128, 'partie entière', C.bleu, 12) + Tx(x0 + 3.5 * w, 128, 'partie décimale', C.or, 12);
      return svg(360, 136, b);
    },
    dec_carre: () => {
      let b = ''; const s = 11, x0 = 24, y0 = 12;
      for (let c = 0; c < 10; c++) for (let r = 0; r < 10; r++) { const on = c * 10 + r < 37;
        b += R(x0 + c * s, y0 + r * s, s, s, on ? (c < 3 ? C.bleu : C.or) : 'none', 'currentColor', 1, on ? `fill-opacity=".55"${c === 3 ? ' class="pulse"' : ''}` : 'stroke-opacity=".3"'); }
      b += R(x0, y0, 110, 110, 'none', 'currentColor', 2.5);
      b += Tx(79, 140, 'le grand carré = 1', 'currentColor', 11);
      b += Tx(250, 44, '3 dixièmes', C.bleu, 15) + Tx(250, 70, '+ 7 centièmes', C.or, 15) + L(190, 82, 310, 82, 'currentColor', 2) + Tx(250, 112, '= 0,37', C.rouge, 24, 'middle', 'class="pop"');
      return svg(360, 150, b);
    },
    dec_droite: () => {
      let b = L(20, 80, 340, 80, 'currentColor', 3);
      for (let i = 0; i <= 10; i++) { const x = 30 + i * 30; b += L(x, i % 5 ? 74 : 69, x, i % 5 ? 86 : 91, 'currentColor', 2) + Tx(x, 108, i === 0 ? '2' : i === 10 ? '3' : '2,' + i, i === 7 ? C.rouge : 'currentColor', 11); }
      b += O(240, 80, 7, C.rouge, 'none', 0, 'class="pop"') + L(240, 58, 240, 70, C.rouge, 3) + Tx(240, 50, '2,7', C.rouge, 17);
      b += P('M30 62Q135 30 240 62', C.bleu, 2, 'none', 'class="dash"') + Tx(120, 40, '7 pas de 0,1', C.bleu, 12);
      b += Tx(180, 134, 'un petit pas = 0,1', 'currentColor', 12);
      return svg(360, 146, b);
    },
    /* ---- fractions ---- */
    frac_parts: () => {
      let b = ''; for (let i = 0; i < 4; i++) b += sec(80, 74, 56, i * 90, (i + 1) * 90, i < 3 ? C.or : 'none', i < 3 ? 'fill-opacity=".5"' : '');
      b += sec(80, 74, 56, 0, 90, C.or, 'fill-opacity=".5" class="pulse"');
      b += fr(190, 76, '3', '4', C.rouge, 26) + Tx(280, 50, 'parts prises', C.rouge, 13) + L(236, 53, 215, 66, C.rouge, 2) + Tx(280, 112, 'parts du tout', C.bleu, 13) + L(236, 106, 215, 92, C.bleu, 2);
      return svg(360, 150, b);
    },
    frac_billes: () => {
      let b = ''; for (let g = 0; g < 4; g++) { const x = 20 + g * 85, on = g < 3;
        b += R(x, 14, 72, 32, on ? C.bleu : 'none', 'currentColor', 2, on ? 'fill-opacity=".15" class="pulse"' : 'stroke-opacity=".5"') + dots(x + 12, 30, 5, on ? C.bleu : C.gris, 5, 12); }
      b += Tx(180, 74, '20 billes en 4 groupes', 'currentColor', 13) + Tx(180, 98, '1 groupe = 5 billes', C.gris, 13) + Tx(180, 124, '3 groupes = 15 billes', C.bleu, 15, 'middle', 'class="pop"');
      return svg(360, 136, b);
    },
    frac_droite: () => {
      let b = L(30, 74, 330, 74, 'currentColor', 3);
      for (let i = 0; i <= 8; i++) { const x = 30 + i * 37.5; b += L(x, i % 4 ? 68 : 62, x, i % 4 ? 80 : 86, 'currentColor', 2); }
      [0, 1, 2].forEach((n) => { b += Tx(30 + n * 150, 108, String(n), 'currentColor', 14); });
      for (let i = 0; i < 7; i++) b += P(`M${30 + i * 37.5} 60Q${30 + i * 37.5 + 18.75} 38 ${30 + (i + 1) * 37.5} 60`, C.or, 2, 'none', 'class="dash"');
      b += O(30 + 7 * 37.5, 74, 7, C.rouge, 'none', 0, 'class="pop"') + fr(292.5, 36, '7', '4', C.rouge, 14);
      b += Tx(180, 134, 'chaque pas = un quart', C.gris, 12);
      return svg(360, 146, b);
    },
    frac_equiv: () => {
      let b = ''; [[2, 1, 28], [4, 2, 70], [8, 4, 112]].forEach(([n, k, y]) => { const w = 240 / n;
        for (let i = 0; i < n; i++) b += R(70 + i * w, y, w, 30, i < k ? C.or : 'none', 'currentColor', 2, i < k ? 'fill-opacity=".55" class="pulse"' : '');
        b += fr(34, y + 18, String(k), String(n), 'currentColor', 13); });
      b += Tx(34, 68, '=', C.rouge, 15) + Tx(34, 110, '=', C.rouge, 15);
      return svg(360, 160, b);
    },
    /* ---- division, multiples, critères ---- */
    div_billes: () => {
      let b = ''; for (let g = 0; g < 3; g++) { const x = 14 + g * 84; b += R(x, 18, 72, 32, C.bleu, 'currentColor', 2, 'fill-opacity=".15"') + dots(x + 12, 34, 5, C.bleu, 5, 12); }
      b += dots(282, 34, 2, C.rouge, 6, 18, 'class="pop"') + Tx(290, 70, 'reste', C.rouge, 13);
      b += Tx(128, 70, '3 groupes de 5', C.bleu, 13) + Tx(180, 112, '17 = 5 × 3 + 2', 'currentColor', 22, 'middle', 'class="pop"');
      return svg(360, 128, b);
    },
    div_multiples: () => {
      let b = Tx(180, 16, 'multiples de 6', C.brand, 13); for (let i = 0; i < 10; i++) { const x = 15 + (i % 5) * 66, y = i < 5 ? 26 : 62, on = i === 4;
        b += R(x, y, 62, 30, on ? C.rouge : C.or, 'currentColor', 2, `fill-opacity="${on ? '.35' : '.18'}"${on ? ' class="pulse"' : ''}`) + Tx(x + 31, y + 21, String(6 * (i + 1)), 'currentColor', 16); }
      b += Tx(180, 114, '30 = 6 × 5', C.rouge, 15) + Tx(180, 134, '6 est un diviseur de 30', 'currentColor', 12);
      return svg(360, 144, b);
    },
    div_fin: () => {
      const row = (y, a, d, t) => Tx(30, y, `${a}<tspan fill="${C.rouge}" class="pulse">${d}</tspan>`, 'currentColor', 26, 'start') + P(`M112 ${y - 8}H132`, C.gris, 2, 'none', 'class="dash"') + Tx(142, y - 2, t, 'currentColor', 13, 'start');
      return svg(360, 130, row(36, '34', '8', 'divisible par 2') + row(76, '73', '5', 'divisible par 5') + row(116, '12', '0', 'divisible par 2, 5, 10'));
    },
    div_somme: () => {
      let b = ''; ['3', '7', '8'].forEach((d, i) => { const x = 100 + i * 60; b += R(x, 12, 50, 36, C.bleu, 'currentColor', 2, 'fill-opacity=".18"') + Tx(x + 25, 40, d, 'currentColor', 24) + L(x + 25, 50, x + 25, 62, C.gris, 2); });
      b += Tx(180, 84, '3 + 7 + 8 = 18', C.rouge, 22, 'middle', 'class="pop"') + Tx(180, 108, '18 = 9 × 2', C.or, 15) + Tx(180, 132, 'divisible par 9 et 3', C.vert, 14);
      return svg(360, 146, b);
    },
  });

  K.COURSES.push(
    { id: '6e-decimaux', subj: 'maths', level: '6e', icon: '🔢', title: 'Les nombres décimaux',
      intro: 'Au marché, un kilo de pommes coûte 2,50 €. Ce nombre avec une virgule est un nombre décimal.',
      steps: [
        S('Partie entière, partie décimale', 'Un <b>nombre décimal</b> s’écrit avec une virgule. À gauche : la <b>partie entière</b>. À droite : la <b>partie décimale</b>. Dans 12,507, le chiffre 5 est le chiffre des <b>dixièmes</b>, 0 celui des <b>centièmes</b> et 7 celui des <b>millièmes</b>.', 'dec_tableau'),
        S('Dixièmes et centièmes', `Un <b>dixième</b>, c’est une part sur 10 : ${F(1, 10)} = 0,1. Un <b>centième</b>, c’est une part sur 100 : ${F(1, 100)} = 0,01. Avec 3 colonnes pleines et 7 petits carrés, on a 37 centièmes, soit 0,37.`, 'dec_carre'),
        S('Sur la droite graduée', 'On partage chaque unité en 10 pas égaux. Chaque petit pas vaut 0,1. Le point rouge est à 7 pas après 2 : il est en <b>2,7</b>.', 'dec_droite'),
        S('Comparer', 'On compare d’abord les <b>parties entières</b>. Si elles sont égales, on compare les dixièmes, puis les centièmes… Ainsi 3,9 &gt; 3,45 car 9 dixièmes &gt; 4 dixièmes. Attention : 2,5 = 2,50. On peut ajouter des zéros à droite sans changer la valeur.'),
        S('Encadrer et arrondir', 'Encadrer 7,86 à l’unité : 7 &lt; 7,86 &lt; 8. Pour <b>arrondir au dixième</b>, on regarde le chiffre des centièmes : s’il est 5 ou plus, on augmente le dixième. Donc 7,86 ≈ 7,9. Sinon on le garde : 7,83 ≈ 7,8.'),
      ],
      recap: ['Un nombre décimal a une partie entière et une partie décimale.', 'Dixième = 0,1 ; centième = 0,01 ; millième = 0,001.', 'On compare d’abord les parties entières, puis les dixièmes…', 'Pour arrondir, on regarde le chiffre juste après.'],
      quiz: [Q('Quel est le chiffre des centièmes dans 15,238 ?', ['2', '3', '8'], 1), Q('Quel nombre est le plus grand ?', ['3,9', '3,45', '3,098'], 0), Q('L’arrondi de 7,86 au dixième est :', ['7,8', '7,9', '8'], 1)] },

    { id: '6e-fractions', subj: 'maths', level: '6e', icon: '🍕', title: 'Les fractions',
      intro: 'Une pizza partagée en 4 parts égales : si tu en manges 3, tu as mangé les trois quarts de la pizza.',
      steps: [
        S('Partager en parts égales', `Dans une fraction ${F(3, 4)}, le nombre du bas, le <b>dénominateur</b>, dit en combien de parts égales on partage le tout. Le nombre du haut, le <b>numérateur</b>, dit combien de parts on prend.`, 'frac_parts'),
        S('Une fraction d’une quantité', `Pour prendre ${F(3, 4)} de 20 billes : on divise par 4 (20 ÷ 4 = 5), puis on multiplie par 3 (5 × 3 = 15). Tu as 15 billes.`, 'frac_billes'),
        S('Sur la droite graduée', `On partage chaque unité en 4 pas égaux. Chaque pas vaut ${F(1, 4)}. Après 7 pas, on arrive en ${F(7, 4)}, entre 1 et 2. Une fraction dont le numérateur est plus grand que le dénominateur est plus grande que 1.`, 'frac_droite'),
        S('Des fractions égales', `Si on multiplie (ou divise) le haut et le bas par le même nombre, la fraction ne change pas : ${F(1, 2)} = ${F(2, 4)} = ${F(4, 8)}. Attention, on garde la même part du tout, seulement coupée en morceaux plus petits.`, 'frac_equiv'),
        S('Comparer', `Même dénominateur : la plus grande fraction est celle qui a le plus grand numérateur : ${F(5, 8)} &gt; ${F(3, 8)}. On peut aussi comparer à 1 ou à ${F(1, 2)}. Quelques valeurs à retenir : ${F(1, 2)} = 0,5 ; ${F(1, 4)} = 0,25 ; ${F(3, 4)} = 0,75.`),
      ],
      recap: ['Dénominateur : nombre de parts égales du tout.', 'Numérateur : nombre de parts prises.', 'Pour prendre une fraction d’une quantité : diviser puis multiplier.', 'Multiplier ou diviser en haut et en bas par le même nombre donne une fraction égale.'],
      quiz: [Q(`Combien font ${F(3, 4)} de 20 billes ?`, ['5', '15', '12'], 1), Q(`Quelle fraction est égale à ${F(1, 2)} ?`, [F(2, 3), F(3, 6), F(2, 5)], 1), Q('Laquelle de ces fractions est plus grande que 1 ?', [F(3, 4), F(5, 4), F(4, 4)], 1)] },

    { id: '6e-division', subj: 'maths', level: '6e', icon: '➗', title: 'Division, multiples et critères',
      intro: 'Partager 17 billes entre amis, savoir si 348 se partage en 2, 3 ou 5 : voici les outils pour répondre vite.',
      steps: [
        S('La division euclidienne', 'Diviser 17 par 5, c’est chercher combien de paquets de 5 on peut faire : 3 paquets, et il reste 2 billes. On écrit <b>17 = 5 × 3 + 2</b>. Le <b>quotient</b> est 3 et le <b>reste</b> est 2. Le reste est toujours plus petit que le diviseur.', 'div_billes'),
        S('Multiples et diviseurs', 'Les <b>multiples</b> de 6 sont ceux de sa table : 6, 12, 18, 24, 30… Comme 30 = 6 × 5, on dit que 30 est un multiple de 6 et que 6 est un <b>diviseur</b> de 30. Un nombre est divisible par 6 quand le reste de la division est 0.', 'div_multiples'),
        S('Divisible par 2, 5 et 10', 'Un nombre est <b>divisible par 2</b> s’il finit par 0, 2, 4, 6 ou 8. Il est <b>divisible par 5</b> s’il finit par 0 ou 5. Il est <b>divisible par 10</b> s’il finit par 0. Exemple : 120 est divisible par 2, par 5 et par 10.', 'div_fin'),
        S('Divisible par 3 et par 9', 'On additionne les chiffres. Si la somme est dans la table de 3, le nombre est <b>divisible par 3</b>. Si elle est dans la table de 9, il est <b>divisible par 9</b>. Pour 378 : 3 + 7 + 8 = 18. Comme 18 = 9 × 2, 378 est divisible par 9, donc aussi par 3.', 'div_somme'),
        S('Continuer après la virgule', 'Quand il reste quelque chose, on peut continuer la division avec des dixièmes, des centièmes… Par exemple 7 ÷ 4 : 7 = 4 × 1 + 3, puis 30 ÷ 4 = 7 reste 2, puis 20 ÷ 4 = 5. On trouve 1,75.'),
      ],
      recap: ['Dividende = diviseur × quotient + reste, avec reste &lt; diviseur.', 'Les multiples d’un nombre sont les résultats de sa table.', 'Par 2, 5, 10 : on regarde le dernier chiffre.', 'Par 3 et 9 : on regarde la somme des chiffres.'],
      quiz: [Q('La division euclidienne de 23 par 5 donne :', ['quotient 4 et reste 3', 'quotient 3 et reste 4', 'quotient 4 et reste 5'], 0), Q('Quel nombre est divisible par 3 ?', ['124', '231', '205'], 1), Q('Un nombre divisible à la fois par 2 et par 5 finit par :', ['5', '0', '2'], 1)] },
  );

  Object.assign(FIG, {
    /* ---- droites et angles ---- */
    droites_trois: () => {
      let b = '';
      b += L(15, 30, 105, 80, C.bleu, 3) + L(20, 85, 100, 25, C.or, 3) + O(60, 55, 5, C.rouge, 'none', 0, 'class="pop"') + Tx(60, 118, 'sécantes', 'currentColor', 12);
      b += L(135, 55, 225, 55, C.bleu, 3) + L(180, 15, 180, 100, C.or, 3) + R(180, 45, 10, 10, 'none', C.rouge, 2, 'class="pulse"') + Tx(180, 118, 'perpendiculaires', 'currentColor', 11);
      b += L(255, 35, 345, 35, C.bleu, 3) + L(255, 75, 345, 75, C.or, 3) + L(300, 40, 300, 70, C.gris, 2, ) .replace('/>', ' class="dash"/>') + Tx(300, 118, 'parallèles', 'currentColor', 12);
      return svg(360, 128, b);
    },
    angles_types: () => {
      const a = (x, ang, t, c) => { const [px, py] = [x + 38 * Math.cos(ang * Math.PI / 180), 84 - 38 * Math.sin(ang * Math.PI / 180)];
        return L(x, 84, x + 40, 84, 'currentColor', 3) + L(x, 84, px, py, c, 3) + P(`M${x + 16} 84A16 16 0 0 0 ${+(x + 16 * Math.cos(ang * Math.PI / 180)).toFixed(1)} ${+(84 - 16 * Math.sin(ang * Math.PI / 180)).toFixed(1)}`, c, 2, 'none', 'class="pulse"') + Tx(x + 20, 112, t, 'currentColor', 12); };
      let b = a(18, 40, 'aigu', C.bleu) + a(110, 90, 'droit', C.vert) + a(200, 130, 'obtus', C.or);
      b += L(292, 84, 332, 84, 'currentColor', 3) + L(292, 84, 252, 84, C.rouge, 3) + P('M308 84A16 16 0 0 0 276 84', C.rouge, 2, 'none', 'class="pulse"') + Tx(292, 112, 'plat', 'currentColor', 12);
      b += Tx(38, 30, '&lt; 90°', C.bleu, 12) + Tx(130, 30, '90°', C.vert, 12) + Tx(220, 30, '&gt; 90°', C.or, 12) + Tx(292, 30, '180°', C.rouge, 12);
      return svg(360, 124, b);
    },
    rapporteur: () => {
      const cx = 180, cy = 132, r = 124; let b = P(`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`, 'currentColor', 2, C.bleu, 'fill-opacity=".1"');
      for (let a = 0; a <= 180; a += 10) { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), l = a % 30 ? 8 : 14;
        b += L(+(cx + r * c).toFixed(1), +(cy - r * s).toFixed(1), +(cx + (r - l) * c).toFixed(1), +(cy - (r - l) * s).toFixed(1), 'currentColor', 1.5);
        if (a % 30 === 0) b += Tx(+(cx + (r - 26) * c).toFixed(1), +(cy - (r - 26) * s + (a % 180 ? 4 : -6)).toFixed(1), String(a), 'currentColor', 10); }
      b += L(cx - 140, cy, cx + 140, cy, 'currentColor', 3);
      const x = +(cx + 130 * Math.cos(50 * Math.PI / 180)).toFixed(1), y = +(cy - 130 * Math.sin(50 * Math.PI / 180)).toFixed(1);
      b += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.rouge}" stroke-width="4" pathLength="100" class="draw"/>`;
      b += P(`M${cx + 40} ${cy}A40 40 0 0 0 ${+(cx + 40 * Math.cos(50 * Math.PI / 180)).toFixed(1)} ${+(cy - 40 * Math.sin(50 * Math.PI / 180)).toFixed(1)}`, C.rouge, 2) + Tx(cx + 62, cy - 14, '50°', C.rouge, 16, 'middle', 'class="pop"');
      b += Tx(50, 22, 'rapporteur', C.bleu, 13, 'start') + O(cx, cy, 4, C.rouge, 'none', 0);
      return svg(360, 142, b);
    },
    /* ---- triangles et cercle ---- */
    cercle_vocab: () => {
      const cx = 120, cy = 84, r = 70; const A = pt(cx, cy, r, 55), D = pt(cx, cy, r, 150), E = pt(cx, cy, r, 210);
      let b = O(cx, cy, r, C.bleu, 'currentColor', 3, 'fill-opacity=".08"');
      b += L(cx - r, cy, cx + r, cy, C.vert, 3) + L(cx, cy, A[0], A[1], C.rouge, 3.5).replace('/>', ' class="pulse"/>') + L(D[0], D[1], E[0], E[1], C.or, 3);
      b += O(cx, cy, 4, 'currentColor', 'none', 0) + Tx(cx - 2, cy - 8, 'O') + Tx(A[0] + 10, A[1] - 4, 'A') + Tx(cx - r - 10, cy + 4, 'B') + Tx(cx + r + 10, cy + 4, 'C') + Tx(D[0] + 10, D[1] + 14, 'D') + Tx(E[0] - 10, E[1] + 14, 'E');
      b += Tx(250, 40, 'rayon', C.rouge, 14, 'start') + Tx(250, 89, 'diamètre', C.vert, 14, 'start') + Tx(250, 144, 'corde', C.or, 14, 'start');
      b += L(240, 38, A[0] + 4, A[1] - 2, C.rouge, 1.5) + L(240, 84, 197, 84, C.vert, 1.5) + L(238, 142, 160, 146, C.or, 1.5);
      return svg(360, 170, b);
    },
    tri_types: () => {
      const tick = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy), nx = -dy / n * 6, ny = dx / n * 6; return L(+(mx - nx).toFixed(1), +(my - ny).toFixed(1), +(mx + nx).toFixed(1), +(my + ny).toFixed(1), C.rouge, 2.5).replace('/>', ' class="pulse"/>'); };
      let b = P('M60 25L15 100H105Z', 'currentColor', 3, C.bleu, 'fill-opacity=".15"') + tick(60, 25, 15, 100) + tick(60, 25, 105, 100) + Tx(60, 124, 'isocèle', 'currentColor', 12);
      b += P('M180 22L135 100H225Z', 'currentColor', 3, C.vert, 'fill-opacity=".15"') + tick(180, 22, 135, 100) + tick(180, 22, 225, 100) + tick(135, 100, 225, 100) + Tx(180, 124, 'équilatéral', 'currentColor', 12);
      b += P('M275 25V100H335Z', 'currentColor', 3, C.or, 'fill-opacity=".15"') + R(275, 90, 10, 10, 'none', C.rouge, 2, 'class="pulse"') + Tx(305, 124, 'rectangle', 'currentColor', 12);
      return svg(360, 134, b);
    },
    tri_inegalite: () => {
      let b = Tx(90, 18, 'possible', C.vert, 14) + Tx(270, 18, 'impossible', C.rouge, 14);
      b += P('M30 110L66 62L130 110Z', 'currentColor', 3, C.vert, 'fill-opacity=".15"') + Tx(40, 82, '3') + Tx(108, 80, '4') + Tx(80, 126, '5') + Tx(90, 150, '3 + 4 &gt; 5', C.vert, 14);
      b += L(190, 110, 350, 110, 'currentColor', 3) + P('M250 110A60 60 0 0 0 190 50', C.bleu, 2.5, 'none', 'class="dash"') + P('M270 110A80 80 0 0 1 350 30', C.or, 2.5, 'none', 'class="dash"') + Tx(260, 100, '?', C.rouge, 20, 'middle', 'class="pop"') + Tx(270, 126, '8', 'currentColor', 13) + Tx(270, 150, '3 + 4 &lt; 8', C.rouge, 14);
      return svg(360, 158, b);
    },
    /* ---- symétrie axiale ---- */
    sym_papillon: () => {
      const pts = [[100, 36], [58, 70], [120, 108], [140, 66]], m = (p) => [360 - p[0], p[1]];
      const poly = (a, c) => `<polygon points="${a.map((p) => p.join(',')).join(' ')}" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="3"/>`;
      let b = Tx(180, 14, 'axe de symétrie', C.rouge, 12) + L(180, 20, 180, 142, C.rouge, 2.5).replace('/>', ' class="dash"/>');
      b += poly(pts, C.bleu) + poly(pts.map(m), C.or);
      const of = [[-10, -8], [-12, 4], [0, 17], [13, -4]]; pts.forEach((p, i) => { const q = m(p); b += L(p[0], p[1], q[0], q[1], C.gris, 1.5).replace('/>', ' class="dash"/>') + Tx(p[0] + of[i][0], p[1] + of[i][1], 'ABCD'[i], C.bleu, 13) + Tx(q[0] - of[i][0], q[1] + of[i][1], 'ABCD'[i] + '′', C.or, 13); });
      b += O(100, 36, 4, C.bleu, 'none', 0, 'class="pop"') + O(260, 36, 4, C.or, 'none', 0, 'class="pop"');
      return svg(360, 150, b);
    },
    sym_construire: () => {
      let b = L(200, 8, 200, 130, C.rouge, 2.5) + Tx(228, 18, 'axe', C.rouge, 12, 'start');
      b += `<line x1="110" y1="56" x2="290" y2="56" stroke="${C.gris}" stroke-width="2" pathLength="100" class="draw"/>` + R(190, 46, 10, 10, 'none', C.rouge, 2) + O(200, 56, 3.5, C.rouge, 'none', 0);
      b += O(110, 56, 6, C.bleu, 'none', 0, 'class="pop"') + Tx(110, 42, 'A', C.bleu, 15) + O(290, 56, 6, C.or, 'none', 0, 'class="pop"') + Tx(290, 42, 'A′', C.or, 15) + Tx(212, 74, 'M', 'currentColor', 13);
      b += L(110, 90, 198, 90, C.bleu, 3) + L(202, 90, 290, 90, C.or, 3) + L(110, 84, 110, 96, C.bleu, 2) + L(198, 84, 198, 96, C.bleu, 2) + L(202, 84, 202, 96, C.or, 2) + L(290, 84, 290, 96, C.or, 2);
      b += Tx(155, 110, 'd', C.bleu, 14) + Tx(245, 110, 'd', C.or, 14) + Tx(200, 138, 'MA = MA′', 'currentColor', 14);
      return svg(360, 148, b);
    },
    sym_axes: () => {
      const ax = (x1, y1, x2, y2) => L(x1, y1, x2, y2, C.rouge, 2).replace('/>', ' class="dash"/>');
      let b = R(18, 33, 54, 54, C.bleu, 'currentColor', 3, 'fill-opacity=".15"') + ax(45, 26, 45, 94) + ax(11, 60, 79, 60) + ax(14, 29, 76, 91) + ax(76, 29, 14, 91);
      b += R(100, 38, 70, 44, C.vert, 'currentColor', 3, 'fill-opacity=".15"') + ax(135, 30, 135, 90) + ax(92, 60, 178, 60);
      b += P('M225 30L193 85H257Z', 'currentColor', 3, C.or, 'fill-opacity=".15"') + ax(225, 24, 225, 92) + ax(193, 85, 241, 57.5) + ax(257, 85, 209, 57.5);
      b += O(315, 60, 30, C.rouge, 'currentColor', 3, 'fill-opacity=".1"');
      [0, 60, 120].forEach((a) => { const p = pt(315, 60, 36, a), q = pt(315, 60, 36, a + 180); b += ax(p[0], p[1], q[0], q[1]); });
      b += Tx(45, 118, '4 axes', 'currentColor', 12) + Tx(135, 118, '2 axes', 'currentColor', 12) + Tx(225, 118, '3 axes', 'currentColor', 12) + Tx(315, 118, '∞ axes', 'currentColor', 12);
      return svg(360, 130, b);
    },
  });

  K.COURSES.push(
    { id: '6e-droites-angles', subj: 'maths', level: '6e', icon: '📐', title: 'Droites et angles',
      intro: 'Les lignes d’un cahier, les coins d’une porte, les rails d’un train : la géométrie est partout autour de toi.',
      steps: [
        S('Sécantes, perpendiculaires, parallèles', 'Deux droites <b>sécantes</b> se croisent en un point. Si elles forment un angle droit, elles sont <b>perpendiculaires</b>. Deux droites <b>parallèles</b> ne se croisent jamais : elles gardent toujours le même écartement.', 'droites_trois'),
        S('Tracer avec l’équerre', 'Pour tracer une <b>perpendiculaire</b>, on pose un côté de l’angle droit de l’équerre sur la droite, et on trace le long de l’autre côté. Pour une <b>parallèle</b>, on fait glisser l’équerre le long d’une règle : on trace deux perpendiculaires à la règle, qui sont parallèles entre elles.'),
        S('Les angles', 'Un <b>angle</b> est formé par deux demi-droites de même origine. Il est <b>aigu</b> s’il mesure moins de 90°, <b>droit</b> s’il mesure 90°, <b>obtus</b> s’il mesure plus de 90° et moins de 180°, et <b>plat</b> s’il mesure 180°.', 'angles_types'),
        S('Mesurer avec le rapporteur', 'On place le centre du rapporteur sur le sommet de l’angle et le zéro sur un côté. On lit la graduation où passe l’autre côté. Sur la figure, l’angle mesure <b>50°</b> : c’est un angle aigu.', 'rapporteur'),
        S('Une propriété utile', 'Si deux droites sont perpendiculaires à une même troisième droite, alors elles sont <b>parallèles</b> entre elles. Si une droite est perpendiculaire à l’une de deux droites parallèles, elle est aussi perpendiculaire à l’autre.'),
      ],
      recap: ['Perpendiculaires : elles forment un angle droit (90°).', 'Parallèles : elles ne se croisent jamais.', 'Aigu &lt; 90° ; droit = 90° ; obtus &gt; 90° ; plat = 180°.', 'Deux perpendiculaires à une même droite sont parallèles.'],
      quiz: [Q('Deux droites perpendiculaires forment un angle de :', ['45°', '90°', '180°'], 1), Q('Un angle de 120° est :', ['aigu', 'droit', 'obtus'], 2), Q('Deux droites perpendiculaires à une même droite sont :', ['parallèles', 'perpendiculaires', 'sécantes'], 0)] },

    { id: '6e-triangles-cercle', subj: 'maths', level: '6e', icon: '🔺', title: 'Le cercle et les triangles',
      intro: 'Le compas trace des cercles parfaits, la règle des segments : avec les deux, on construit des triangles.',
      steps: [
        S('Le cercle', 'Un <b>cercle</b> est l’ensemble des points situés à la même distance d’un point appelé <b>centre</b>. Un <b>rayon</b> relie le centre à un point du cercle. Un <b>diamètre</b> passe par le centre et relie deux points du cercle. Une <b>corde</b> relie deux points du cercle.', 'cercle_vocab'),
        S('Rayon et diamètre', 'Le diamètre est deux fois plus long que le rayon : <b>d = 2 × r</b>. Si le rayon mesure 4 cm, le diamètre mesure 8 cm. Le diamètre est la plus longue corde du cercle.'),
        S('Les triangles particuliers', 'Un triangle <b>isocèle</b> a deux côtés de même longueur. Un triangle <b>équilatéral</b> a ses trois côtés de même longueur. Un triangle <b>rectangle</b> a un angle droit. On code les côtés égaux avec de petits traits.', 'tri_types'),
        S('Construire un triangle', 'Pour construire un triangle de côtés 4 cm, 5 cm et 6 cm : on trace le côté de 6 cm, puis, avec le compas, on trace un arc de cercle de rayon 4 cm autour d’une extrémité et un arc de rayon 5 cm autour de l’autre. Ils se coupent au troisième sommet.'),
        S('Est-ce toujours possible ?', 'Non ! Dans un triangle, chaque côté est plus petit que la somme des deux autres. 3 + 4 &gt; 5 : on peut construire le triangle. Mais 3 + 4 &lt; 8 : les arcs ne se rejoignent pas, le triangle est impossible.', 'tri_inegalite'),
      ],
      recap: ['Tous les points d’un cercle sont à la même distance du centre.', 'Diamètre = 2 × rayon.', 'Isocèle : 2 côtés égaux ; équilatéral : 3 ; rectangle : un angle droit.', 'Un côté est toujours plus petit que la somme des deux autres.'],
      quiz: [Q('Le rayon d’un cercle mesure 4 cm. Son diamètre mesure :', ['2 cm', '8 cm', '16 cm'], 1), Q('Un triangle qui a trois côtés de même longueur est :', ['isocèle', 'équilatéral', 'rectangle'], 1), Q('Peut-on construire un triangle de côtés 2 cm, 3 cm et 6 cm ?', ['Oui', 'Non'], 1)] },

    { id: '6e-symetrie', subj: 'maths', level: '6e', icon: '🦋', title: 'La symétrie axiale',
      intro: 'Si tu plies une feuille de papier le long d’une ligne, les deux côtés se recouvrent : c’est l’idée de la symétrie.',
      steps: [
        S('Symétrique d’une figure', 'Deux figures sont <b>symétriques</b> par rapport à une droite (l’<b>axe</b>) si elles se superposent quand on plie la feuille le long de cet axe. C’est comme l’image dans un miroir.', 'sym_papillon'),
        S('Symétrique d’un point', 'Pour construire le symétrique A′ d’un point A : on trace la perpendiculaire à l’axe qui passe par A, elle coupe l’axe en M. Puis on place A′ de l’autre côté, à la même distance : <b>MA′ = MA</b>. L’axe est la médiatrice du segment [AA′].', 'sym_construire'),
        S('Ce qui est conservé', 'La symétrie axiale conserve les <b>longueurs</b>, les <b>angles</b>, les <b>aires</b> et le périmètre. Le symétrique d’une droite est une droite, celui d’un cercle est un cercle de même rayon. Un point de l’axe est son propre symétrique.'),
        S('Axes de symétrie', 'Un <b>axe de symétrie</b> d’une figure la partage en deux moitiés qui se superposent par pliage. Un carré a 4 axes, un rectangle 2, un triangle équilatéral 3, et un cercle en a une infinité : tous ses diamètres.', 'sym_axes'),
        S('Construire sur quadrillage', 'Sur un quadrillage, on compte les carreaux entre le point et l’axe, puis on les reporte de l’autre côté. On fait de même avec chaque sommet d’une figure, puis on relie les points symétriques dans le même ordre.'),
      ],
      recap: ['Deux figures symétriques se superposent par pliage.', 'A′ est à la même distance de l’axe que A, sur la perpendiculaire.', 'La symétrie conserve longueurs, angles et aires.', 'Carré : 4 axes ; rectangle : 2 ; triangle équilatéral : 3 ; cercle : une infinité.'],
      quiz: [Q('Le point A est à 3 cm de l’axe. Son symétrique A′ est à :', ['3 cm de l’axe', '6 cm de l’axe', '1,5 cm de l’axe'], 0), Q('Combien d’axes de symétrie a un carré ?', ['2', '4', '8'], 1), Q('La symétrie axiale conserve :', ['seulement les angles', 'rien', 'les longueurs et les angles'], 2)] },
  );

  Object.assign(FIG, {
    /* ---- périmètre et aire ---- */
    peri_rect: () => {
      let b = R(40, 30, 160, 100, C.bleu, 'currentColor', 2, 'fill-opacity=".1"') + R(40, 30, 160, 100, 'none', C.rouge, 4, 'class="dash"');
      b += Tx(120, 22, '8 cm') + Tx(22, 85, '5', 'currentColor', 13) + Tx(120, 84, 'rectangle', C.gris, 12);
      b += Tx(285, 60, 'périmètre', C.rouge, 15) + Tx(285, 92, '2 × (8 + 5)', 'currentColor', 15) + Tx(285, 120, '= 26 cm', C.rouge, 18, 'middle', 'class="pop"');
      return svg(360, 146, b);
    },
    aire_carres: () => {
      let b = ''; for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) b += R(30 + c * 36, 22 + r * 36, 36, 36, C.bleu, 'currentColor', 1.5, `fill-opacity="${(c + r) % 2 ? '.18' : '.32'}"`);
      b += Tx(48, 46, '1', 'currentColor', 11) + Tx(102, 146, '4 carreaux', 'currentColor', 12) + Tx(16, 82, '3', 'currentColor', 12);
      b += Tx(272, 56, 'aire', C.bleu, 16) + Tx(272, 86, '4 × 3', 'currentColor', 17) + Tx(272, 116, '= 12 cm²', C.rouge, 18, 'middle', 'class="pop"');
      return svg(360, 154, b);
    },
    aire_formes: () => {
      let b = R(22, 24, 76, 52, C.bleu, 'currentColor', 3, 'fill-opacity=".2"') + Tx(60, 54, 'L', 'currentColor', 14) + Tx(14, 54, 'l', 'currentColor', 12) + Tx(60, 106, 'rectangle', 'currentColor', 12) + Tx(60, 128, 'L × l', C.bleu, 15);
      b += P('M130 76L170 24L230 76Z', 'currentColor', 3, C.or, 'fill-opacity=".2"') + L(170, 24, 170, 76, C.rouge, 2).replace('/>', ' class="dash"/>') + Tx(182, 54, 'h', C.rouge, 13, 'start') + Tx(180, 90, 'b', 'currentColor', 13) + Tx(180, 106, 'triangle', 'currentColor', 12) + Tx(180, 128, 'b × h ÷ 2', C.or, 15);
      b += O(300, 50, 28, C.vert, 'currentColor', 3, 'fill-opacity=".2"') + L(300, 50, 328, 50, C.rouge, 2.5) + Tx(314, 44, 'r', C.rouge, 13) + Tx(300, 106, 'disque', 'currentColor', 12) + Tx(300, 128, 'π × r × r', C.vert, 15);
      return svg(360, 138, b);
    },
    peri_cercle: () => {
      let b = O(56, 52, 35, C.bleu, 'currentColor', 3, 'fill-opacity=".1"') + L(21, 52, 91, 52, C.rouge, 2.5) + Tx(56, 46, 'd', C.rouge, 13);
      b += L(110, 112, 180, 112, C.bleu, 6) + L(180, 112, 250, 112, C.or, 6) + L(250, 112, 320, 112, C.vert, 6) + L(320, 112, 330, 112, C.rouge, 6).replace('/>', ' class="pulse"/>');
      [145, 215, 285].forEach((x) => { b += Tx(x, 134, 'd', 'currentColor', 13); });
      b += P('M70 90Q90 112 108 112', C.gris, 2, 'none', 'class="dash"');
      b += Tx(245, 36, 'C = π × d', C.rouge, 20, 'middle', 'class="pop"') + Tx(245, 64, 'π ≈ 3,14', 'currentColor', 15);
      return svg(360, 146, b);
    },
    /* ---- proportionnalité ---- */
    prop_tableau: () => {
      let b = Tx(8, 62, 'cahiers', 'currentColor', 11, 'start') + Tx(8, 92, 'prix en €', 'currentColor', 11, 'start');
      [[1, 3], [2, 6], [5, 15], [10, 30]].forEach(([n, p], i) => { const x = 100 + i * 65;
        b += R(x, 44, 60, 30, C.bleu, 'currentColor', 2, 'fill-opacity=".18"') + Tx(x + 30, 66, String(n), 'currentColor', 16) + R(x, 74, 60, 30, C.or, 'currentColor', 2, 'fill-opacity=".18"') + Tx(x + 30, 96, String(p), 'currentColor', 16); });
      b += ARROW('apr', C.rouge) + P('M130 40Q162 8 195 40', C.rouge, 2.5, 'none', 'marker-end="url(#apr)"') + Tx(162, 14, '× 2', C.rouge, 14, 'middle', 'class="pop"');
      b += P('M130 108Q162 140 195 108', C.rouge, 2.5, 'none', 'marker-end="url(#apr)"') + Tx(162, 140, '× 2', C.rouge, 14, 'middle', 'class="pop"');
      b += Tx(260, 140, 'coefficient × 3', C.brand, 13, 'middle');
      return svg(360, 150, b);
    },
    prop_graph: () => {
      let b = L(40, 124, 340, 124, 'currentColor', 2.5) + L(40, 124, 40, 10, 'currentColor', 2.5) + Tx(46, 14, 'prix (€)', 'currentColor', 11, 'start') + Tx(318, 142, 'cahiers', 'currentColor', 11);
      for (let n = 1; n <= 4; n++) b += L(40 + n * 40, 120, 40 + n * 40, 128, 'currentColor', 2) + Tx(40 + n * 40, 140, String(n), 'currentColor', 11);
      b += `<line x1="40" y1="124" x2="215" y2="19" stroke="${C.rouge}" stroke-width="3" pathLength="100" class="draw"/>`;
      for (let n = 1; n <= 4; n++) b += O(40 + n * 40, 124 - 24 * n, 6, C.bleu, 'none', 0, 'class="pop"');
      b += Tx(40, 138, 'O', 'currentColor', 11, 'end') + Tx(280, 84, 'droite passant par O', C.rouge, 12);
      return svg(360, 150, b);
    },
    prop_pourcent: () => {
      let b = Tx(180, 22, '100 % = 20 €', 'currentColor', 14) + P('M60 34H300', 'currentColor', 2);
      for (let i = 0; i < 4; i++) b += R(60 + i * 60, 42, 60, 34, i === 0 ? C.rouge : C.bleu, 'currentColor', 2, `fill-opacity="${i === 0 ? '.45' : '.12'}"${i === 0 ? ' class="pulse"' : ''}`);
      b += Tx(90, 65, '25 %', 'currentColor', 14) + P('M60 84V90H120V84', C.rouge, 2) + Tx(90, 108, '= 5 €', C.rouge, 15, 'middle', 'class="pop"') + Tx(240, 108, '20 ÷ 4 = 5', 'currentColor', 15);
      return svg(360, 122, b);
    },
    /* ---- statistiques ---- */
    stat_tableau: () => {
      let b = ''; [['foot', 8, C.vert], ['basket', 5, C.or], ['natation', 4, C.bleu], ['danse', 3, C.rouge]].forEach(([n, k, c], i) => { const y = 26 + i * 30;
        b += Tx(8, y + 5, n, 'currentColor', 12, 'start') + dots(100, y, k, c, 8, 20, i === 0 ? 'class="pulse"' : '') + Tx(290, y + 5, String(k), c, 16); });
      b += Tx(180, 150, '1 rond = 1 élève', C.gris, 12) + Tx(180, 170, 'effectif total = 20', 'currentColor', 13);
      return svg(360, 180, b);
    },
    stat_barres: () => {
      let b = L(50, 122, 340, 122, 'currentColor', 2.5) + L(50, 122, 50, 18, 'currentColor', 2.5) + Tx(180, 12, 'sports préférés', 'currentColor', 12);
      [0, 2, 4, 6, 8].forEach((v) => { b += L(46, 122 - v * 12, 54, 122 - v * 12, 'currentColor', 1.5) + Tx(38, 126 - v * 12, String(v), 'currentColor', 10, 'end'); });
      [['foot', 8, C.vert], ['basket', 5, C.or], ['natation', 4, C.bleu], ['danse', 3, C.rouge]].forEach(([n, k, c], i) => { const x = 66 + i * 68;
        b += R(x, 122 - 12 * k, 44, 12 * k, c, 'currentColor', 2, `fill-opacity=".5"${i === 0 ? ' class="pulse"' : ''}`) + Tx(x + 22, 116 - 12 * k, String(k), 'currentColor', 13) + Tx(x + 22, 138, n, 'currentColor', 11); });
      return svg(360, 146, b);
    },
    stat_circulaire: () => {
      const d = [['foot', 40, C.vert], ['basket', 25, C.or], ['natation', 20, C.bleu], ['danse', 15, C.rouge]]; let b = '', a = 0;
      d.forEach(([n, p, c], i) => { const a1 = a + p * 3.6; b += sec(95, 78, 62, a, a1, c, `fill-opacity=".55"${i === 0 ? ' class="pulse"' : ''}`); a = a1; });
      d.forEach(([n, p, c], i) => { const y = 38 + i * 30; b += R(210, y - 10, 16, 16, c, 'currentColor', 1.5, 'fill-opacity=".55"') + Tx(234, y + 3, n, 'currentColor', 13, 'start') + Tx(330, y + 3, p + ' %', c, 14, 'end'); });
      return svg(360, 156, b);
    },
    stat_courbe: () => {
      const v = [12, 14, 13, 17, 16], x = (i) => 70 + i * 62, y = (t) => 128 - (t - 10) * 13; let b = L(46, 128, 340, 128, 'currentColor', 2.5) + L(46, 128, 46, 20, 'currentColor', 2.5) + Tx(50, 14, '°C', 'currentColor', 11, 'start');
      [10, 14, 18].forEach((t) => { b += L(42, y(t), 50, y(t), 'currentColor', 1.5) + Tx(36, y(t) + 4, String(t), 'currentColor', 10, 'end') + L(50, y(t), 336, y(t), C.gris, 1).replace('/>', ' stroke-opacity=".3"/>'); });
      b += `<polyline points="${v.map((t, i) => x(i) + ',' + y(t)).join(' ')}" stroke="${C.rouge}" stroke-width="3" pathLength="100" class="draw"/>`;
      ['lun', 'mar', 'mer', 'jeu', 'ven'].forEach((j, i) => { b += O(x(i), y(v[i]), 5, C.rouge, 'none', 0, 'class="pop"') + Tx(x(i), 144, j, 'currentColor', 11) + Tx(x(i), y(v[i]) - 10, String(v[i]), 'currentColor', 11); });
      return svg(360, 152, b);
    },
  });

  K.COURSES.push(
    { id: '6e-perimetre-aire', subj: 'maths', level: '6e', icon: '📏', title: 'Périmètre et aire',
      intro: 'Pour entourer un jardin d’une clôture, on calcule son périmètre. Pour le recouvrir de gazon, on calcule son aire.',
      steps: [
        S('Le périmètre', 'Le <b>périmètre</b> d’une figure est la longueur de son contour. Pour un rectangle de 8 cm sur 5 cm : <b>2 × (8 + 5) = 26 cm</b>. Pour un carré de côté c : 4 × c. Le périmètre s’exprime en unités de longueur (cm, m, km).', 'peri_rect'),
        S('L’aire', 'L’<b>aire</b> mesure la surface d’une figure. On compte combien de carreaux de 1 cm² la recouvrent. Un rectangle de 4 cm sur 3 cm contient 4 × 3 = <b>12 cm²</b>. Aire du rectangle : <b>longueur × largeur</b>. Aire du carré : côté × côté.', 'aire_carres'),
        S('Triangle et disque', 'Aire d’un <b>triangle</b> : (base × hauteur) ÷ 2. La hauteur est perpendiculaire à la base. Aire d’un <b>disque</b> de rayon r : π × r × r, avec π ≈ 3,14. Exemple : un triangle de base 6 cm et de hauteur 4 cm a une aire de 6 × 4 ÷ 2 = 12 cm².', 'aire_formes'),
        S('La longueur d’un cercle', 'Le périmètre d’un cercle s’appelle sa <b>circonférence</b>. Elle vaut un peu plus de 3 diamètres : <b>C = π × d</b>. Pour d = 10 cm : C ≈ 3,14 × 10 = 31,4 cm.', 'peri_cercle'),
        S('Les unités d’aire', 'Attention : le périmètre est en cm, l’aire est en cm². On a 1 cm² = 100 mm² et 1 m² = 100 dm² = 10 000 cm². Ne mélange jamais le périmètre et l’aire : ce sont deux grandeurs différentes.'),
      ],
      recap: ['Périmètre = longueur du contour.', 'Aire du rectangle = longueur × largeur ; aire du triangle = base × hauteur ÷ 2.', 'Circonférence du cercle : C = π × d.', 'Aire en cm², périmètre en cm.'],
      quiz: [Q('Un rectangle mesure 7 cm sur 3 cm. Son périmètre est :', ['20 cm', '21 cm', '10 cm'], 0), Q('Un triangle a une base de 6 cm et une hauteur de 4 cm. Son aire est :', ['24 cm²', '12 cm²', '10 cm²'], 1), Q('L’aire d’un carré de côté 5 cm est :', ['20 cm²', '10 cm²', '25 cm²'], 2)] },

    { id: '6e-proportionnalite', subj: 'maths', level: '6e', icon: '🛒', title: 'La proportionnalité',
      intro: 'Au magasin, si 1 cahier coûte 3 €, alors 2 cahiers coûtent 6 €. Le prix est proportionnel au nombre de cahiers.',
      steps: [
        S('Reconnaître une situation proportionnelle', 'Deux grandeurs sont <b>proportionnelles</b> quand, si l’une est multipliée par 2, 3, 4…, l’autre est multipliée par le même nombre. Le prix des cahiers l’est. Mais l’âge et la taille ne le sont pas : à 10 ans, tu n’as pas deux fois la taille de tes 5 ans.'),
        S('Tableau et coefficient', 'On range les valeurs dans un <b>tableau de proportionnalité</b>. On passe de la première ligne à la seconde en multipliant toujours par le même nombre, le <b>coefficient</b>. Ici : 1 × 3 = 3, 2 × 3 = 6, 5 × 3 = 15. Le coefficient est 3.', 'prop_tableau'),
        S('Passer par l’unité', 'Si 5 cahiers coûtent 15 €, combien coûtent 7 cahiers ? On cherche d’abord le prix d’un cahier : 15 ÷ 5 = 3 €. Puis 7 cahiers coûtent 7 × 3 = <b>21 €</b>. On peut aussi additionner des colonnes : 7 = 5 + 2, donc 15 + 6 = 21.'),
        S('Le graphique', 'Si on place les points (nombre de cahiers ; prix) sur un graphique, ils sont <b>alignés avec l’origine O</b> : ils sont sur une droite qui passe par O. C’est la marque d’une situation proportionnelle.', 'prop_graph'),
        S('Les pourcentages', `Un pourcentage est une proportionnalité sur 100. <b>25 %</b> signifie ${F(25, 100)} = ${F(1, 4)}. Pour trouver 25 % de 20 €, on divise par 4 : 5 €. De même, 50 % c’est la moitié et 10 % c’est le dixième : 10 % de 90 € = 9 €.`, 'prop_pourcent'),
      ],
      recap: ['Proportionnelles : on multiplie par le même nombre dans les deux lignes.', 'Le coefficient passe d’une ligne à l’autre.', 'On peut passer par l’unité.', '25 % = un quart ; 50 % = la moitié ; 10 % = un dixième.'],
      quiz: [Q('3 stylos coûtent 6 €. Combien coûtent 5 stylos ?', ['10 €', '12 €', '8 €'], 0), Q('Dans un tableau de proportionnalité, 4 devient 10. Alors 6 devient :', ['12', '15', '16'], 1), Q('10 % de 90 €, c’est :', ['0,9 €', '900 €', '9 €'], 2)] },

    { id: '6e-statistiques', subj: 'maths', level: '6e', icon: '📊', title: 'Statistiques et graphiques',
      intro: 'Dans ta classe de 20 élèves, quel est le sport préféré ? Pour le savoir, on compte, puis on dessine.',
      steps: [
        S('Compter : les effectifs', 'On interroge les 20 élèves de la classe. L’<b>effectif</b> d’une réponse est le nombre d’élèves qui l’ont choisie : foot 8, basket 5, natation 4, danse 3. L’<b>effectif total</b> est 8 + 5 + 4 + 3 = 20. On peut aussi les ranger dans un tableau.', 'stat_tableau'),
        S('Le diagramme en barres', 'Chaque réponse a sa barre. Plus l’effectif est grand, plus la barre est <b>haute</b>. On lit tout de suite que le foot est le sport préféré, et que la danse est le sport le moins choisi.', 'stat_barres'),
        S('Le diagramme circulaire', `Le disque entier représente les 20 élèves. Chaque part est proportionnelle à l’effectif. Le foot occupe ${F(8, 20)} du disque, soit 40 %. Pratique pour comparer des parts : 40 % + 25 % + 20 % + 15 % = 100 %.`, 'stat_circulaire'),
        S('La courbe', 'Pour suivre une grandeur qui change avec le temps, comme la température, on relie les points par une <b>courbe</b>. Ici, la température monte de 13 °C le mercredi à 17 °C le jeudi : c’est la plus forte hausse de la semaine.', 'stat_courbe'),
        S('Calculer des pourcentages', `Pour passer d’un effectif à un pourcentage, on divise par l’effectif total : ${F(5, 20)} = 0,25 = 25 %. Le basket a donc été choisi par 25 % de la classe. Attention : il faut toujours préciser le total pour interpréter un graphique.`),
      ],
      recap: ['Effectif : nombre d’éléments de chaque réponse.', 'Barres : hauteur proportionnelle à l’effectif.', 'Disque : chaque part est proportionnelle à l’effectif.', 'Pourcentage = effectif ÷ effectif total.'],
      quiz: [Q('Dans l’exemple, combien d’élèves préfèrent la natation ?', ['3', '4', '5'], 1), Q('Sur un diagramme en barres, la barre la plus haute indique :', ['l’effectif le plus petit', 'l’effectif le plus grand'], 1), Q('Sur 20 élèves, 5 aiment le basket. Quel pourcentage ?', ['5 %', '20 %', '25 %'], 2)] },
  );

  Object.assign(FIG, {
    /* ---- jour, nuit, saisons ---- */
    jn_terre: () => {
      let b = ARROW('ajn', C.rouge) + O(45, 75, 26, C.or, C.or, 3, 'fill-opacity=".4" class="pulse"');
      for (let a = 0; a < 360; a += 45) { const p = pt(45, 75, 33, a), q = pt(45, 75, 41, a); b += L(p[0], p[1], q[0], q[1], C.or, 3); }
      b += Tx(45, 128, 'Soleil', C.or, 13);
      [48, 75, 102].forEach((y) => { b += L(95, y, 212, y, C.or, 2.5).replace('/>', ' class="dash"/>'); });
      b += P('M265 29A46 46 0 0 0 265 121Z', 'none', 0, C.or, 'fill-opacity=".45"') + P('M265 29A46 46 0 0 1 265 121Z', 'none', 0, C.gris, 'fill-opacity=".55"') + O(265, 75, 46, 'none', 'currentColor', 3);
      b += Tx(240, 80, 'jour', 'currentColor', 13) + Tx(292, 80, 'nuit', 'currentColor', 13);
      b += P('M232 20Q265 -6 298 20', C.rouge, 2.5, 'none', 'marker-end="url(#ajn)"') + Tx(265, 146, 'rotation en 24 h', C.rouge, 13);
      return svg(360, 154, b);
    },
    jn_soleil: () => {
      let b = L(20, 120, 340, 120, 'currentColor', 3);
      b += P('M40 120Q180 -60 320 120', C.or, 3, 'none', 'pathLength="100" class="draw"') + P('M70 120Q180 0 290 120', C.vert, 3, 'none', 'pathLength="100" class="draw"') + P('M110 120Q180 60 250 120', C.bleu, 3, 'none', 'pathLength="100" class="draw"');
      b += O(180, 30, 8, C.or, 'none', 0, 'class="pop"') + Tx(198, 26, 'été', C.or, 13, 'start') + Tx(180, 54, 'équinoxe', C.vert, 12) + Tx(180, 82, 'hiver', C.bleu, 13);
      b += Tx(40, 140, 'lever', 'currentColor', 12) + Tx(320, 140, 'coucher', 'currentColor', 12);
      return svg(360, 148, b);
    },
    jn_saisons: () => {
      const earth = (x, y, lbl, lx, ly, an) => O(x, y, 10, C.bleu, 'currentColor', 2, 'fill-opacity=".35"') + L(+(x - 5.5).toFixed(1), +(y + 13).toFixed(1), +(x + 5.5).toFixed(1), +(y - 13).toFixed(1), C.rouge, 2.5) + Tx(lx, ly, lbl, 'currentColor', 12, an);
      let b = `<ellipse cx="180" cy="80" rx="125" ry="48" stroke="${C.gris}" stroke-width="2" class="dash"/>` + O(180, 80, 18, C.or, C.or, 3, 'fill-opacity=".5" class="pulse"');
      b += earth(55, 80, 'été', 55, 108, 'middle') + earth(305, 80, 'hiver', 305, 108, 'middle') + earth(180, 32, 'printemps', 200, 28, 'start') + earth(180, 128, 'automne', 200, 140, 'start');
      return svg(360, 150, b);
    },
    /* ---- signaux ---- */
    sig_chaine: () => {
      let b = ARROW('asg', C.rouge);
      [['émetteur', 15, C.or], ['signal', 135, C.rouge], ['récepteur', 255, C.bleu]].forEach(([t, x, c]) => { b += R(x, 18, 90, 36, c, 'currentColor', 2.5, 'fill-opacity=".2"') + Tx(x + 45, 41, t, 'currentColor', 14); });
      b += L(107, 36, 131, 36, C.rouge, 3).replace('/>', ' marker-end="url(#asg)" class="dash"/>') + L(227, 36, 251, 36, C.rouge, 3).replace('/>', ' marker-end="url(#asg)" class="dash"/>');
      [['lampe', 15], ['lumière', 135], ['œil', 255]].forEach(([t, x]) => { b += L(x + 45, 58, x + 45, 80, C.gris, 2).replace('/>', ' class="dash"/>') + R(x, 84, 90, 30, 'none', C.gris, 2) + Tx(x + 45, 104, t, C.gris, 14); });
      return svg(360, 128, b);
    },
    sig_morse: () => {
      let b = Tx(180, 22, 'code Morse', C.brand, 14), i = 0; const dl = () => `style="animation-delay:${(i++ * 0.25).toFixed(2)}s" class="pulse"`;
      [36, 58, 80, 250, 272, 294].forEach((x) => { b += O(x, 62, 7, C.rouge, 'none', 0, dl()); });
      [118, 154, 190].forEach((x) => { b += R(x, 56, 28, 12, C.bleu, 'none', 0, dl()); });
      b += Tx(58, 100, 'S') + Tx(168, 100, 'O') + Tx(272, 100, 'S') + Tx(180, 132, 'SOS : appel au secours', C.rouge, 13);
      return svg(360, 142, b);
    },
    sig_binaire: () => {
      let b = Tx(180, 20, 'ordinateur : 0 et 1', C.brand, 14); [0, 1, 0, 0, 0, 0, 0, 1].forEach((v, i) => { const x = 40 + i * 40;
        b += O(x, 58, 14, v ? C.or : 'none', v ? C.or : C.gris, 3, v ? 'fill-opacity=".6" class="pulse"' : '') + Tx(x, 100, String(v), v ? C.rouge : 'currentColor', 18); });
      b += Tx(180, 138, 'A = 01000001', 'currentColor', 20, 'middle', 'class="pop"');
      return svg(360, 150, b);
    },
    /* ---- tri et recyclage ---- */
    rec_poubelles: () => {
      const bins = [['verre', C.vert, (x) => R(x - 6, 24, 12, 22, C.vert, 'currentColor', 2, 'fill-opacity=".4"') + R(x - 3, 14, 6, 10, 'none', 'currentColor', 2)],
        ['papier', C.bleu, (x) => R(x - 11, 14, 22, 30, '#fff', 'currentColor', 2) + L(x - 6, 24, x + 6, 24, 'currentColor', 1.5) + L(x - 6, 32, x + 6, 32, 'currentColor', 1.5)],
        ['emballages', C.or, (x) => R(x - 9, 18, 18, 26, C.gris, 'currentColor', 2, 'fill-opacity=".35"') + L(x - 9, 24, x + 9, 24, 'currentColor', 1.5)],
        ['compost', '#92400e', (x) => O(x, 32, 12, C.rouge, 'currentColor', 2, 'fill-opacity=".4"') + L(x, 20, x + 4, 12, C.vert, 3)]];
      let b = ''; bins.forEach(([n, c, item], i) => { const x = 45 + i * 90;
        b += `<g class="${i === 0 ? 'pl' : ''}">${item(x)}</g>` + R(x - 26, 72, 52, 52, c, 'currentColor', 2, 'fill-opacity=".4"') + R(x - 31, 62, 62, 12, c, 'currentColor', 2, 'fill-opacity=".7"') + Tx(x, 144, n, 'currentColor', 12); });
      return svg(360, 152, b);
    },
    rec_cycle: () => {
      const e = (t) => [+(180 + 110 * Math.sin(t * Math.PI / 180)).toFixed(1), +(80 - 52 * Math.cos(t * Math.PI / 180)).toFixed(1)];
      let b = ARROW('arc', C.vert);
      [[30, 70], [110, 150], [210, 250], [290, 330]].forEach(([a, z]) => { const p = e(a), q = e(z); b += P(`M${p[0]} ${p[1]}A110 52 0 0 1 ${q[0]} ${q[1]}`, C.vert, 3, 'none', 'marker-end="url(#arc)" class="dash"'); });
      [['objet usagé', 180, 28, C.gris], ['tri', 290, 80, C.bleu], ['recyclage', 180, 132, C.or], ['objet neuf', 70, 80, C.vert]].forEach(([t, x, y, c]) => { b += R(x - 50, y - 12, 100, 24, c, 'currentColor', 2, 'fill-opacity=".3"') + Tx(x, y + 5, t, 'currentColor', 13); });
      return svg(360, 150, b);
    },
    rec_aimant: () => {
      let b = R(30, 50, 18, 60, C.gris, 'currentColor', 2, 'fill-opacity=".5"') + R(48, 50, 56, 18, C.rouge, 'currentColor', 2, 'fill-opacity=".6"') + R(48, 92, 56, 18, C.bleu, 'currentColor', 2, 'fill-opacity=".6"') + Tx(60, 138, 'aimant', 'currentColor', 13);
      b += R(150, 32, 30, 36, C.gris, 'currentColor', 2.5, 'fill-opacity=".4"') + L(144, 50, 112, 56, C.vert, 3).replace('/>', ' class="dash"/>') + Tx(208, 46, 'acier', 'currentColor', 14, 'start') + Tx(208, 66, 'attiré', C.vert, 14, 'start');
      b += R(150, 92, 30, 36, C.or, 'currentColor', 2.5, 'fill-opacity=".3"') + Tx(208, 108, 'aluminium', 'currentColor', 14, 'start') + Tx(208, 128, 'pas attiré', C.rouge, 14, 'start') + L(190, 102, 200, 112, C.rouge, 0);
      return svg(360, 148, b);
    },
  });

  K.COURSES.push(
    { id: 'p6-jour-nuit-saisons', subj: 'physique', level: '6e', icon: '🌍', title: 'Jour, nuit et saisons',
      intro: 'Pourquoi fait-il nuit le soir ? Pourquoi les jours sont-ils longs en été ? La réponse vient des mouvements de la Terre.',
      steps: [
        S('La Terre tourne sur elle-même', 'La Terre tourne sur elle-même en <b>24 heures</b>. Le Soleil n’éclaire que la moitié de la Terre : là où il éclaire, c’est le <b>jour</b> ; de l’autre côté, c’est la <b>nuit</b>. En tournant, chaque endroit passe du jour à la nuit, puis de la nuit au jour.', 'jn_terre'),
        S('Le trajet apparent du Soleil', 'Le Soleil semble se déplacer dans le ciel : il se lève vers l’<b>est</b>, monte jusqu’à sa hauteur maximale à midi, puis se couche vers l’<b>ouest</b>. En réalité, c’est la Terre qui tourne. En été, il monte plus haut et reste plus longtemps dans le ciel qu’en hiver.', 'jn_soleil'),
        S('La Terre tourne autour du Soleil', 'La Terre fait aussi le tour du Soleil en un peu plus de <b>365 jours</b>, soit une <b>année</b>. Pour compenser les 6 heures en plus, on ajoute un jour au calendrier tous les 4 ans : c’est l’année bissextile, de 366 jours.'),
        S('L’axe incliné et les saisons', 'L’axe de rotation de la Terre est <b>incliné</b>, et il pointe toujours dans la même direction. Quand l’hémisphère Nord penche vers le Soleil, c’est l’<b>été</b> : les jours sont longs et il fait chaud. Six mois plus tard, il penche à l’opposé : c’est l’<b>hiver</b>.', 'jn_saisons'),
        S('Quatre saisons', 'Les saisons ne viennent pas de la distance au Soleil, mais de l’inclinaison de l’axe. Vers le 21 juin, c’est le jour le plus long ; vers le 21 décembre, le plus court. Vers le 21 mars et le 22 septembre, le jour et la nuit durent environ 12 heures chacun.'),
      ],
      recap: ['La Terre tourne sur elle-même en 24 heures : jour et nuit.', 'Le Soleil se lève à l’est et se couche à l’ouest.', 'La Terre fait le tour du Soleil en environ 365 jours.', 'Les saisons viennent de l’inclinaison de l’axe de la Terre.'],
      quiz: [Q('La Terre fait un tour sur elle-même en :', ['24 heures', '1 an', '1 mois'], 0), Q('Les saisons existent parce que l’axe de la Terre est :', ['droit', 'incliné', 'absent'], 1), Q('Dans l’hémisphère Nord, les jours d’été sont, par rapport aux jours d’hiver :', ['plus courts', 'plus longs'], 1)] },

    { id: 'p6-signaux', subj: 'physique', level: '6e', icon: '📡', title: 'Transmettre une information',
      intro: 'Un feu rouge, une sonnerie, un message sur un téléphone : tous transmettent une information grâce à un signal.',
      steps: [
        S('Émetteur, signal, récepteur', 'Pour transmettre une information, il faut un <b>émetteur</b> qui produit un <b>signal</b>, et un <b>récepteur</b> qui le reçoit. Une lampe (émetteur) envoie de la lumière (signal) qui entre dans l’œil (récepteur).', 'sig_chaine'),
        S('Signaux lumineux et sonores', 'Un signal peut être de la lumière (feu tricolore, phare) ou un son (sirène, cloche). La lumière va à 300 000 km/s, le son à environ 340 m/s dans l’air. C’est pourquoi on voit l’éclair avant d’entendre le tonnerre. Si le tonnerre arrive 3 secondes après l’éclair, l’orage est à environ 1 km.'),
        S('Un code pour se comprendre', 'Pour que l’information soit comprise, l’émetteur et le récepteur doivent utiliser le même <b>code</b>. Le code Morse utilise des signaux courts (points) et longs (traits). Trois points, trois traits, trois points : SOS, un appel au secours.', 'sig_morse'),
        S('Le langage des ordinateurs', 'Un ordinateur n’utilise que deux signes : <b>0</b> et <b>1</b>. Chaque lettre est codée par une suite de 8 chiffres. La lettre A s’écrit 01000001. Les photos, les sons et les vidéos sont aussi codés avec des 0 et des 1.', 'sig_binaire'),
        S('Voyager très loin', 'Les messages d’Internet voyagent dans des câbles, comme la <b>fibre optique</b> où circule de la lumière, ou par ondes radio, comme le Wi-Fi et le téléphone. Ces signaux vont très vite et traversent le monde en une fraction de seconde.'),
      ],
      recap: ['Une information passe d’un émetteur à un récepteur par un signal.', 'Le signal peut être lumineux ou sonore.', 'Il faut un code commun : Morse, 0 et 1…', 'La lumière va beaucoup plus vite que le son.'],
      quiz: [Q('Dans une chaîne d’information, qui reçoit le signal ?', ['l’émetteur', 'le récepteur'], 1), Q('Le code Morse utilise :', ['des chiffres de 0 à 9', 'des points et des traits', 'des lettres'], 1), Q('Un ordinateur code l’information avec :', ['0 et 1', 'A et B'], 0)] },

    { id: 'c6-tri-recyclage', subj: 'chimie', level: '6e', icon: '♻️', title: 'Trier et recycler',
      intro: 'Chaque jour, on jette des emballages, des papiers, des restes de repas. Bien trier permet de leur donner une seconde vie.',
      steps: [
        S('Pourquoi trier ?', 'Les déchets sont faits de matières différentes : verre, papier, plastique, métal, déchets organiques. Si on les trie, on peut <b>récupérer</b> ces matières pour fabriquer de nouveaux objets, au lieu de tout enterrer ou brûler. On économise des matières premières et de l’énergie.'),
        S('Les bons bacs', 'Le <b>verre</b> va dans le conteneur à verre, le <b>papier</b> et le carton dans le bac à papier, les <b>emballages</b> en plastique et en métal dans le bac des emballages, et les épluchures dans le <b>compost</b>. Un objet mal trié peut empêcher de recycler tout le reste.', 'rec_poubelles'),
        S('Le circuit du recyclage', 'Un objet usagé est trié, puis envoyé à l’usine. La matière est <b>broyée, fondue</b> ou transformée, puis sert à fabriquer un objet neuf. Le verre peut être fondu et refait sans fin. Des bouteilles en plastique recyclées servent à fabriquer des vêtements.', 'rec_cycle'),
        S('Séparer avec un aimant', 'Dans un centre de tri, un <b>aimant</b> attire les objets en acier (fer) comme les boîtes de conserve. Il n’attire pas l’aluminium ni le plastique : c’est ainsi qu’on sépare les métaux. On utilise une propriété de la matière pour séparer un mélange.', 'rec_aimant'),
        S('Réduire, réutiliser, recycler', 'Le meilleur déchet est celui qu’on ne produit pas. On peut <b>réduire</b> (moins d’emballages), <b>réutiliser</b> (gourde, cartable en bon état) et enfin <b>recycler</b>. Le <b>compost</b> transforme les déchets de cuisine et de jardin en terreau pour les plantes.'),
      ],
      recap: ['Trier permet de récupérer des matières.', 'Verre, papier, emballages, compost : chacun son bac.', 'Un aimant attire l’acier, pas l’aluminium.', 'Réduire, réutiliser, puis recycler.'],
      quiz: [Q('Où jette-t-on une bouteille en verre ?', ['dans le conteneur à verre', 'dans le compost', 'dans le bac à papier'], 0), Q('Un aimant attire :', ['l’aluminium', 'l’acier', 'le plastique'], 1), Q('Le compost est fabriqué avec :', ['du verre', 'des piles', 'des épluchures et des feuilles'], 2)] },
  );
})();
