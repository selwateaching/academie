/* Cours illustrés : 5e (pilote). Contenu en français ; l'audio utilise la voix du navigateur. */
(function () {
  'use strict';
  const F = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
  const C = { brand: '#3b3a8f', or: '#f59e0b', bleu: '#0ea5e9', vert: '#16a34a', rouge: '#ef4444', gris: '#64748b' };
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true" class="cfig" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const T = (x, y, s, o = '') => `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-size="13" font-weight="700" text-anchor="middle" ${o}>${s}</text>`;
  const L = (x1, y1, x2, y2, c = 'currentColor', w = 3) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
  const lamp = (x, y, c = C.or) => `<circle cx="${x}" cy="${y}" r="16" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="3"/>${L(x - 11, y - 11, x + 11, y + 11, c, 2.5)}${L(x - 11, y + 11, x + 11, y - 11, c, 2.5)}`;
  const pile = (x, y) => `${L(x - 6, y - 16, x - 6, y + 16, C.rouge, 3)}${L(x + 6, y - 9, x + 6, y + 9, C.brand, 5)}${T(x - 14, y - 20, '+', 'fill="#ef4444"')}`;
  const ARROW = (id, c) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}" stroke="none"/></marker></defs>`;

  const FIG = {
    droite: () => {
      let b = ARROW('ar1', 'currentColor') + `<line x1="14" y1="70" x2="346" y2="70" stroke="currentColor" stroke-width="3" marker-end="url(#ar1)"/>`;
      for (let i = -5; i <= 5; i++) { const x = 180 + i * 28; b += L(x, 63, x, 77, 'currentColor', 2) + T(x, 96, (i > 0 ? '+' : i < 0 ? '−' : '') + Math.abs(i), i === 0 ? '' : 'font-weight="600" font-size="12"'); }
      b += `<circle cx="${180 - 3 * 28}" cy="70" r="8" fill="${C.bleu}"/>${T(180 - 84, 48, 'A', `fill="${C.bleu}"`)}<circle cx="${180 + 2 * 28}" cy="70" r="8" fill="${C.or}"/>${T(180 + 56, 48, 'B', `fill="${C.or}"`)}`;
      b += T(70, 126, '← négatifs', `fill="${C.bleu}"`) + T(290, 126, 'positifs →', `fill="${C.or}"`);
      return svg(360, 140, b);
    },
    circuitSimple: () => svg(360, 170, `${ARROW('ar2', C.rouge)}
      <path d="M60 40H140M220 40H300V130H60V40" stroke="currentColor" stroke-width="3"/><path class="flow" d="M60 100V130H300V40H220M140 40H60V70" pathLength="100"/>
      ${pile(60, 85)}${lamp(300, 85)}
      ${L(140, 40, 220, 40, C.vert, 5)}${T(180, 28, 'interrupteur fermé', 'font-size="12"')}
      ${T(60, 160, 'pile', 'font-size="12"')}${T(300, 160, 'lampe', 'font-size="12"')}
      <path d="M100 118H260" stroke="${C.rouge}" stroke-width="2.5" stroke-dasharray="5 5" marker-end="url(#ar2)"/>${T(180, 150, 'sens du courant', `fill="${C.rouge}" font-size="12"`)}`),
    serie: () => svg(360, 150, `<path d="M50 30H310V120H50V30" stroke="currentColor" stroke-width="3"/><path class="flow" d="M50 62V30H310V120H50V88"/>
      <rect x="40" y="62" width="20" height="26" fill="var(--card,#fff)" stroke="none"/>${pile(50, 75)}
      <rect x="110" y="16" width="40" height="28" fill="var(--card,#fff)" stroke="none"/>${lamp(130, 30)}
      <rect x="210" y="16" width="40" height="28" fill="var(--card,#fff)" stroke="none"/>${lamp(230, 30, C.vert)}
      ${T(180, 145, 'un seul chemin : les deux lampes sont l’une après l’autre', 'font-size="12"')}`),
    derivation: () => svg(360, 190, `<path d="M50 30H310V160H50V30M180 30V160" stroke="currentColor" stroke-width="3"/><path class="flow" d="M50 82V30H310V160H50V108M180 30V160"/>
      <rect x="40" y="82" width="20" height="26" fill="var(--card,#fff)" stroke="none"/>${pile(50, 95)}
      <rect x="160" y="82" width="40" height="30" fill="var(--card,#fff)" stroke="none"/>${lamp(180, 97)}
      <rect x="290" y="82" width="40" height="30" fill="var(--card,#fff)" stroke="none"/>${lamp(310, 97, C.vert)}
      ${T(120, 20, 'nœud', 'font-size="11"')}${T(180, 186, 'plusieurs branches : chaque lampe a son propre chemin', 'font-size="12"')}`),
    symboles: () => svg(360, 150, `
      ${pile(40, 40)}${T(40, 80, 'pile', 'font-size="12"')}
      ${lamp(110, 40)}${T(110, 80, 'lampe', 'font-size="12"')}
      ${L(160, 40, 175, 40)}${L(175, 40, 195, 24, C.vert, 3)}${L(200, 40, 215, 40)}${T(188, 80, 'interrupteur ouvert', 'font-size="11"')}
      ${L(240, 40, 255, 40)}${L(255, 40, 285, 40, C.vert, 3)}${L(285, 40, 300, 40)}${T(270, 80, 'fermé', 'font-size="11"')}
      <circle cx="330" cy="40" r="16" stroke="${C.bleu}" stroke-width="3"/>${T(330, 46, 'M', `fill="${C.bleu}" font-size="16"`)}${T(330, 80, 'moteur', 'font-size="12"')}
      ${L(30, 118, 130, 118)}${T(80, 140, 'fil de connexion', 'font-size="12"')}
      <circle cx="210" cy="118" r="16" stroke="${C.rouge}" stroke-width="3"/>${T(210, 123, 'V', `fill="${C.rouge}" font-size="14"`)}${T(210, 146, 'voltmètre', 'font-size="11"')}
      <circle cx="300" cy="118" r="16" stroke="${C.vert}" stroke-width="3"/>${T(300, 123, 'A', `fill="${C.vert}" font-size="14"`)}${T(300, 146, 'ampèremètre', 'font-size="11"')}`),
    etats: () => {
      const dots = (x0, kind) => { let s = ''; const rnd = (i) => ((i * 9301 + 49297) % 233280) / 233280;
        if (kind === 's') for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s += `<circle class="ps" style="animation-delay:-${((r * 4 + c) * 0.31).toFixed(2)}s" cx="${x0 + 16 + c * 20}" cy="${52 + r * 20}" r="7" fill="${C.bleu}"/>`;
        else if (kind === 'l') for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s += `<circle class="pl" style="animation-delay:-${((r * 4 + c) * 0.43).toFixed(2)}s" cx="${x0 + 16 + c * 20 + (r % 2) * 5 + rnd(r * 4 + c) * 5}" cy="${72 + r * 17 + rnd(c + 3) * 4}" r="7" fill="${C.vert}"/>`;
        else for (let i = 0; i < 9; i++) s += `<circle class="pg" style="animation-delay:-${(i * 0.7).toFixed(2)}s;animation-duration:${(2.6 + (i % 3) * 0.8).toFixed(1)}s" cx="${x0 + 14 + rnd(i + 1) * 70}" cy="${34 + rnd(i * 3 + 2) * 74}" r="6" fill="${C.rouge}"/>`;
        return s; };
      return svg(360, 170, `${[0, 1, 2].map((i) => `<rect x="${10 + i * 118}" y="20" width="104" height="110" rx="8" stroke="currentColor" stroke-width="2.5"/>`).join('')}
        ${dots(10, 's')}${dots(128, 'l')}${dots(246, 'g')}
        ${T(62, 152, 'SOLIDE')}${T(180, 152, 'LIQUIDE')}${T(298, 152, 'GAZ')}${T(62, 166, 'rangées, serrées', 'font-size="10" font-weight="600"')}${T(180, 166, 'serrées, mobiles', 'font-size="10" font-weight="600"')}${T(298, 166, 'très éloignées', 'font-size="10" font-weight="600"')}`);
    },
    changements: () => svg(360, 200, `${ARROW('a3', C.rouge)}${ARROW('a4', C.bleu)}
      ${['SOLIDE', 'LIQUIDE', 'GAZ'].map((t, i) => `<rect x="${12 + i * 122}" y="78" width="100" height="40" rx="10" fill="${[C.bleu, C.vert, C.rouge][i]}" fill-opacity=".18" stroke="${[C.bleu, C.vert, C.rouge][i]}" stroke-width="3"/>${T(62 + i * 122, 103, t)}`).join('')}
      <path class="pulse" d="M114 88H132" stroke="${C.rouge}" stroke-width="3" marker-end="url(#a3)"/>${T(123, 72, 'fusion', `fill="${C.rouge}" font-size="11"`)}
      <path class="pulse" d="M236 88H254" stroke="${C.rouge}" stroke-width="3" marker-end="url(#a3)"/>${T(245, 72, 'vaporisation', `fill="${C.rouge}" font-size="11"`)}
      <path class="pulse" style="animation-delay:.6s" d="M132 108H114" stroke="${C.bleu}" stroke-width="3" marker-end="url(#a4)"/>${T(123, 134, 'solidification', `fill="${C.bleu}" font-size="10"`)}
      <path class="pulse" style="animation-delay:.6s" d="M254 108H236" stroke="${C.bleu}" stroke-width="3" marker-end="url(#a4)"/>${T(245, 134, 'liquéfaction', `fill="${C.bleu}" font-size="10"`)}
      <path d="M62 76C62 20 298 20 298 76" stroke="${C.rouge}" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#a3)"/>${T(180, 30, 'sublimation', `fill="${C.rouge}" font-size="11"`)}
      <path d="M298 120C298 176 62 176 62 120" stroke="${C.bleu}" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#a4)"/>${T(180, 186, 'condensation solide', `fill="${C.bleu}" font-size="11"`)}`),
    palier: () => svg(360, 190, `${ARROW('a5', 'currentColor')}
      <path d="M44 160V14" stroke="currentColor" stroke-width="2.5" marker-end="url(#a5)"/><path d="M44 160H346" stroke="currentColor" stroke-width="2.5" marker-end="url(#a5)"/>
      ${T(28, 24, '°C', 'font-size="11"')}${T(330, 178, 'temps', 'font-size="11"')}
      ${T(30, 128, '0', 'font-size="11"')}${T(24, 48, '100', 'font-size="11"')}
      <path class="draw" pathLength="100" d="M44 150L84 128H150L196 78 H258 L318 28" stroke="${C.rouge}" stroke-width="4"/>
      <path d="M44 128H346M44 78H346" stroke="${C.gris}" stroke-width="1" stroke-dasharray="4 4"/>
      ${T(117, 120, 'fusion : 0 °C', `fill="${C.bleu}" font-size="11"`)}${T(228, 70, 'ébullition : 100 °C', `fill="${C.vert}" font-size="11"`)}
      ${T(66, 104, 'glace', 'font-size="11"')}${T(172, 108, 'eau liquide', 'font-size="11"')}${T(300, 56, 'vapeur', 'font-size="11"')}`),
    triangle: () => svg(360, 170, `<path d="M70 140L290 140L200 30Z" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".08"/>
      <path class="pop" d="M96 140A26 26 0 0 0 84 117" stroke="${C.rouge}" stroke-width="3"/><path class="pop" style="animation-delay:.4s" d="M270 140A20 20 0 0 1 276 123" stroke="${C.bleu}" stroke-width="3"/><path class="pop" style="animation-delay:.8s" d="M190 52A22 22 0 0 0 214 54" stroke="${C.vert}" stroke-width="3"/>
      ${T(112, 133, 'α', `fill="${C.rouge}" font-size="16"`)}${T(256, 133, 'β', `fill="${C.bleu}" font-size="16"`)}${T(202, 74, 'γ', `fill="${C.vert}" font-size="16"`)}
      ${T(180, 164, 'α + β + γ = 180°', 'font-size="15"')}`),
    parallelogramme: () => svg(360, 180, `<path d="M70 140L250 140L310 40L130 40Z" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".08"/>
      ${L(70, 140, 310, 40, C.rouge, 2.5)}${L(250, 140, 130, 40, C.bleu, 2.5)}<circle cx="190" cy="90" r="5" fill="${C.or}"/>
      ${T(58, 150, 'A')}${T(262, 154, 'B')}${T(322, 40, 'C')}${T(120, 34, 'D')}${T(202, 112, 'O', `fill="${C.or}"`)}
      ${T(180, 174, 'les diagonales se coupent en leur milieu O', 'font-size="12"')}`),
    symetrie: () => svg(360, 170, `<path d="M60 130L120 50L150 130Z" stroke="${C.bleu}" stroke-width="3.5" fill="${C.bleu}" fill-opacity=".12"/>
      <path d="M300 30L240 110L210 30Z" stroke="${C.vert}" stroke-width="3.5" fill="${C.vert}" fill-opacity=".12"/>
      <path d="M60 130L300 30M120 50L240 110M150 130L210 30" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="5 5"/>
      <circle cx="180" cy="80" r="6" fill="${C.or}"/>${T(180, 100, 'O', `fill="${C.or}"`)}
      ${T(50, 145, 'A')}${T(112, 42, 'B')}${T(158, 146, 'C')}${T(310, 26, 'A’')}${T(248, 126, 'B’')}${T(202, 24, 'C’')}`),
    rayon: () => svg(360, 170, `${ARROW('a6', C.or)}
      <circle cx="40" cy="85" r="18" fill="${C.or}" fill-opacity=".35" stroke="${C.or}" stroke-width="3"/>${T(40, 125, 'source', 'font-size="12"')}
      <path class="dash" d="M60 78L150 56M60 85L150 85M60 92L150 114" stroke="${C.or}" stroke-width="2.5" marker-end="url(#a6)"/>
      <rect x="150" y="52" width="16" height="66" rx="4" fill="${C.gris}"/>${T(158, 142, 'objet opaque', 'font-size="12"')}
      <path d="M166 56L300 20M166 114L300 150" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="5 5"/>
      <rect x="300" y="14" width="10" height="142" fill="#e5e7eb" stroke="#94a3b8"/><rect x="300" y="42" width="10" height="86" fill="#1e293b"/>${T(318, 166, 'écran', 'font-size="11"')}${T(260, 90, 'ombre', 'font-size="12" fill="#1e293b"')}`),
    airetri: () => svg(360, 160, `<path d="M60 130L260 130L150 30Z" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".08"/>
      ${L(150, 30, 150, 130, C.rouge, 2.5).replace('/>', ' stroke-dasharray="6 5"/>')}<path d="M150 118H162V130" stroke="${C.rouge}" stroke-width="2"/>
      ${T(160, 82, 'h', `fill="${C.rouge}" font-size="16"`)}${T(160, 150, 'base b')}${T(300, 85, 'A = b × h ÷ 2', 'font-size="14"')}`),
  };

  const S = (h, p, fig) => ({ h, p, fig });
  const Q = (q, choices, a) => ({ q, choices, a });

  const COURSES = [
    /* ---------------------------------------------------------------- MATHS */
    { id: 'm5-relatifs', subj: 'maths', level: '5e', icon: '➕', title: 'Les nombres relatifs',
      intro: 'Pour mesurer une température sous zéro, une altitude sous la mer ou une dette, on a besoin de nombres avec un signe.',
      steps: [
        S('Un nombre avec un signe', 'Un <b>nombre relatif</b> est un nombre précédé d’un signe : <b>+</b> (positif) ou <b>−</b> (négatif). Exemples : +3, −5, +0,5. Le nombre <b>0</b> n’est ni positif ni négatif.'),
        S('La droite graduée', 'On place un point <b>0</b> (l’origine). Les nombres <b>positifs</b> sont à droite, les <b>négatifs</b> à gauche. Sur la figure, A est le point d’abscisse −3 et B celui d’abscisse +2.', 'droite'),
        S('Les nombres opposés', 'Deux nombres sont <b>opposés</b> quand ils sont à la même distance de 0 mais de part et d’autre : −3 et +3 sont opposés. L’opposé de 0 est 0.'),
        S('Comparer', 'Plus on va vers la droite, plus le nombre est grand. Tout nombre négatif est plus petit que tout nombre positif. Entre deux négatifs, le plus grand est celui qui est <b>le plus proche de 0</b> : −2 &gt; −7.'),
        S('Additionner', '<b>Même signe</b> : on additionne les distances à 0 et on garde le signe. (−3) + (−4) = −7.<br><b>Signes différents</b> : on soustrait la plus petite distance de la plus grande, et on garde le signe de celui qui est le plus loin de 0. (+5) + (−8) = −3.'),
      ],
      recap: ['Un relatif = un signe + une distance à 0.', 'Positifs à droite, négatifs à gauche de 0.', 'Deux opposés sont symétriques par rapport à 0.', 'Le plus proche de 0 est le plus grand parmi les négatifs.'],
      quiz: [Q('Quel nombre est le plus grand ?', ['−9', '−2', '−5'], 1), Q('(−6) + (+2) = ?', ['−8', '−4', '+4'], 1)] },

    { id: 'm5-priorites', subj: 'maths', level: '5e', icon: '🧮', title: 'Les priorités de calcul',
      intro: 'Dans un calcul, on ne lit pas toujours de gauche à droite : certaines opérations passent avant les autres.',
      steps: [
        S('Parenthèses d’abord', 'On commence toujours par calculer ce qui est <b>entre parenthèses</b>. (3 + 4) × 5 = 7 × 5 = 35.'),
        S('Multiplier et diviser avant', 'Sans parenthèses, les <b>multiplications et divisions</b> passent avant les additions et soustractions. 3 + 4 × 5 = 3 + 20 = 23 (et pas 35).'),
        S('De gauche à droite', 'À priorité égale, on calcule <b>de gauche à droite</b>. 24 ÷ 4 × 3 = 6 × 3 = 18. Et 20 − 5 + 2 = 15 + 2 = 17.'),
        S('Une méthode', 'On réécrit le calcul à chaque étape en ne changeant qu’une opération : 18 − 6 ÷ 3 = 18 − 2 = 16. Cela évite les erreurs et montre le raisonnement.'),
      ],
      recap: ['1 : parenthèses.', '2 : × et ÷.', '3 : + et −.', 'À priorité égale : de gauche à droite.'],
      quiz: [Q('12 − 3 × 2 = ?', ['18', '6', '24'], 1), Q('(12 − 3) × 2 = ?', ['18', '6', '30'], 0)] },

    { id: 'm5-fractions', subj: 'maths', level: '5e', icon: '🍕', title: 'Additionner des fractions',
      intro: 'On peut additionner des parts de gâteau si elles sont de même taille. Sinon, il faut d’abord les rendre comparables.',
      steps: [
        S('Même dénominateur', 'Quand les dénominateurs sont identiques, on additionne les <b>numérateurs</b> et on garde le dénominateur : ' + F(2, 7) + ' + ' + F(3, 7) + ' = ' + F(5, 7) + '.'),
        S('Dénominateurs différents', 'On les réduit au <b>même dénominateur</b> : ' + F(1, 2) + ' + ' + F(1, 3) + ' = ' + F(3, 6) + ' + ' + F(2, 6) + ' = ' + F(5, 6) + '.'),
        S('Un multiple de l’autre', 'Si un dénominateur est un multiple de l’autre, on transforme seulement une fraction : ' + F(3, 4) + ' + ' + F(1, 8) + ' = ' + F(6, 8) + ' + ' + F(1, 8) + ' = ' + F(7, 8) + '.'),
        S('Simplifier', 'On divise le numérateur et le dénominateur par le même nombre : ' + F(6, 8) + ' = ' + F(3, 4) + '. La soustraction fonctionne de la même façon.'),
      ],
      recap: ['Même dénominateur : on additionne les numérateurs.', 'Sinon : on réduit au même dénominateur.', 'On simplifie le résultat quand c’est possible.'],
      quiz: [Q('3/5 + 1/5 = ?', ['4/10', '4/5', '3/25'], 1), Q('1/4 + 1/2 = ?', ['2/6', '3/4', '1/8'], 1)] },

    { id: 'm5-proportionnalite', subj: 'maths', level: '5e', icon: '🛒', title: 'La proportionnalité et les pourcentages',
      intro: 'Si 3 pains coûtent 4,50 €, combien coûtent 6 pains ? 10 pains ? La proportionnalité permet de répondre sans se tromper.',
      steps: [
        S('Grandeurs proportionnelles', 'Deux grandeurs sont <b>proportionnelles</b> quand on passe de l’une à l’autre en multipliant toujours par le même nombre, le <b>coefficient de proportionnalité</b>.'),
        S('Le tableau', 'Nombre de pains : 3, 6, 10. Prix en € : 4,50 ; 9 ; 15. On passe du nombre de pains au prix en multipliant par <b>1,5</b> : c’est le prix d’un pain.'),
        S('Retour à l’unité', 'Pour 8 stylos à 1,50 € pièce : 8 × 1,50 = 12 €. On cherche d’abord le prix d’un objet, puis on multiplie.'),
        S('Les pourcentages', 'Prendre <b>20 %</b> d’une quantité, c’est la multiplier par ' + F(20, 100) + '. 20 % de 150 = 150 × 20 ÷ 100 = 30. 50 % c’est la moitié, 25 % le quart.'),
      ],
      recap: ['Proportionnel = même coefficient.', 'On peut passer par le prix d’un seul objet.', 'x % de N = N × x ÷ 100.'],
      quiz: [Q('5 stylos coûtent 7,50 €. Combien coûtent 8 stylos ?', ['10 €', '12 €', '15 €'], 1), Q('25 % de 80 = ?', ['20', '25', '40'], 0)] },

    { id: 'm5-triangles', subj: 'maths', level: '5e', icon: '🔺', title: 'Les triangles',
      intro: 'Dans tout triangle, les trois angles et les trois côtés sont liés. Deux règles à connaître absolument.',
      steps: [
        S('La somme des angles', 'Dans un triangle, la somme des trois angles est toujours égale à <b>180°</b>. Si deux angles mesurent 50° et 60°, le troisième mesure 180° − 50° − 60° = 70°.', 'triangle'),
        S('Inégalité triangulaire', 'Chaque côté est <b>plus petit que la somme des deux autres</b>. Un triangle de côtés 3 cm, 4 cm et 8 cm est impossible, car 3 + 4 = 7 est inférieur à 8.'),
        S('Triangles particuliers', '<b>Isocèle</b> : deux côtés égaux, donc deux angles égaux à la base.<br><b>Équilatéral</b> : trois côtés égaux et trois angles de 60°.<br><b>Rectangle</b> : un angle droit (90°).'),
        S('Construire au compas', 'Pour construire un triangle dont on connaît les trois côtés, on trace un côté, puis on place le troisième sommet à l’intersection de deux arcs de cercle.'),
      ],
      recap: ['Angles : 180° au total.', 'Un côté ≤ somme des deux autres.', 'Équilatéral : 3 angles de 60°.'],
      quiz: [Q('Deux angles mesurent 40° et 75°. Le troisième mesure :', ['55°', '65°', '75°'], 1), Q('Peut-on construire un triangle de côtés 2 cm, 3 cm et 6 cm ?', ['Oui', 'Non'], 1)] },

    { id: 'm5-parallelogrammes', subj: 'maths', level: '5e', icon: '▱', title: 'Les parallélogrammes',
      intro: 'Un parallélogramme est un quadrilatère « penché » dont les côtés opposés sont parallèles.',
      steps: [
        S('Définition', 'Un <b>parallélogramme</b> est un quadrilatère dont les côtés opposés sont parallèles deux à deux.', 'parallelogramme'),
        S('Propriétés', 'Dans un parallélogramme : les côtés opposés ont la <b>même longueur</b>, les angles opposés sont <b>égaux</b>, et les diagonales se coupent en <b>leur milieu</b>.'),
        S('Cas particuliers', 'Un <b>rectangle</b> a 4 angles droits. Un <b>losange</b> a 4 côtés égaux. Un <b>carré</b> est à la fois un rectangle et un losange. Ce sont tous des parallélogrammes.'),
        S('Reconnaître', 'Un quadrilatère dont les diagonales se coupent en leur milieu est un parallélogramme. Un quadrilatère dont les côtés opposés sont égaux aussi.'),
      ],
      recap: ['Côtés opposés parallèles et égaux.', 'Angles opposés égaux.', 'Diagonales : même milieu.'],
      quiz: [Q('ABCD est un parallélogramme avec AB = 5 cm. Que vaut CD ?', ['2,5 cm', '5 cm', '10 cm'], 1), Q('Les diagonales d’un parallélogramme se coupent :', ['à angle droit', 'en leur milieu', 'en un tiers'], 1)] },

    { id: 'm5-symetrie', subj: 'maths', level: '5e', icon: '🔄', title: 'La symétrie centrale',
      intro: 'On fait tourner une figure d’un demi-tour autour d’un point : c’est la symétrie centrale.',
      steps: [
        S('Le symétrique d’un point', 'Le symétrique de A par rapport à O est le point A’ tel que <b>O est le milieu de [AA’]</b>. Les points A, O et A’ sont alignés.', 'symetrie'),
        S('Construire', 'On trace la droite (AO), puis on reporte au compas la longueur OA de l’autre côté de O. On obtient A’ tel que OA’ = OA.'),
        S('Ce qui est conservé', 'La symétrie centrale conserve les <b>longueurs</b>, les <b>angles</b> et les <b>aires</b>. Une droite a pour symétrique une droite <b>parallèle</b>.'),
        S('Centre de symétrie', 'Une figure a un centre de symétrie si elle se superpose à elle-même après un demi-tour. Le parallélogramme en a un : le point de croisement de ses diagonales.'),
      ],
      recap: ['O est le milieu de [AA’].', 'Longueurs, angles et aires conservés.', 'La droite et sa symétrique sont parallèles.'],
      quiz: [Q('O est le milieu de [AA’] et OA = 4 cm. Que vaut AA’ ?', ['4 cm', '8 cm', '2 cm'], 1), Q('Une droite et sa symétrique par rapport à un point sont :', ['perpendiculaires', 'parallèles', 'sécantes'], 1)] },

    { id: 'm5-aires-volumes', subj: 'maths', level: '5e', icon: '📦', title: 'Aires et volumes',
      intro: 'Pour peindre un mur ou remplir une boîte, il faut savoir calculer des aires et des volumes.',
      steps: [
        S('Aire d’un triangle', 'Aire = <b>base × hauteur ÷ 2</b>. La hauteur est perpendiculaire à la base. Pour une base de 6 cm et une hauteur de 4 cm : 6 × 4 ÷ 2 = 12 cm².', 'airetri'),
        S('Aire d’un parallélogramme', 'Aire = <b>base × hauteur</b>. Un parallélogramme a deux fois l’aire d’un triangle de même base et même hauteur.'),
        S('Le disque', 'Le périmètre d’un cercle de rayon r est <b>2 × π × r</b>. L’aire d’un disque est <b>π × r × r</b>. On prend souvent π ≈ 3,14.'),
        S('Volume d’un prisme droit', 'Volume = <b>aire de la base × hauteur</b>. Avec une base de 10 cm² et une hauteur de 5 cm : 10 × 5 = 50 cm³. Pour un cylindre, la base est un disque.'),
        S('Les unités', '1 L = 1 dm³ et 1 mL = 1 cm³. Pour passer des cm² aux m², on divise par 10 000.'),
      ],
      recap: ['Triangle : b × h ÷ 2.', 'Parallélogramme : b × h.', 'Prisme : aire de la base × hauteur.', '1 L = 1 dm³.'],
      quiz: [Q('Aire d’un triangle de base 6 cm et de hauteur 4 cm :', ['10 cm²', '12 cm²', '24 cm²'], 1), Q('Volume d’un prisme : base 10 cm², hauteur 5 cm :', ['15 cm³', '50 cm³', '100 cm³'], 1)] },

    /* -------------------------------------------------------------- PHYSIQUE */
    { id: 'p5-circuit', subj: 'physique', level: '5e', icon: '🔌', title: 'Le circuit électrique simple',
      intro: 'Pour allumer une lampe, il faut un chemin complet pour le courant : un circuit fermé.',
      steps: [
        S('Les éléments', 'Un circuit simple contient un <b>générateur</b> (la pile), un <b>récepteur</b> (la lampe) et des <b>fils</b> de connexion. On y ajoute souvent un <b>interrupteur</b>.', 'circuitSimple'),
        S('Circuit fermé, circuit ouvert', 'Le courant ne circule que dans un <b>circuit fermé</b>, sans coupure. Interrupteur ouvert : le circuit est ouvert, la lampe est éteinte. Interrupteur fermé : la lampe brille.'),
        S('Le sens du courant', 'Par convention, le courant sort de la borne <b>+</b> de la pile, traverse la lampe, puis revient par la borne <b>−</b>.'),
        S('Le court-circuit', 'Si un fil relie directement les deux bornes de la pile sans passer par un récepteur, c’est un <b>court-circuit</b> : les fils chauffent, la pile s’use vite. C’est dangereux.'),
      ],
      recap: ['Pile + lampe + fils = circuit.', 'Il doit être fermé pour fonctionner.', 'Court-circuit : à éviter.'],
      quiz: [Q('Quand l’interrupteur est ouvert, la lampe :', ['brille', 'est éteinte'], 1), Q('Un fil relie directement les deux bornes de la pile. C’est :', ['un court-circuit', 'un circuit normal'], 0)] },

    { id: 'p5-serie-derivation', subj: 'physique', level: '5e', icon: '🔀', title: 'Circuit en série et en dérivation',
      intro: 'Avec deux lampes, il y a deux manières de les brancher. Le comportement du circuit n’est pas le même.',
      steps: [
        S('En série', 'Les dipôles sont placés <b>les uns à la suite des autres</b> : il n’y a qu’un seul chemin pour le courant. Si une lampe est dévissée, l’autre s’éteint aussi.', 'serie'),
        S('En dérivation', 'Le circuit se sépare en <b>plusieurs branches</b> reliées par des nœuds. Si on dévisse une lampe, l’autre continue de briller.', 'derivation'),
        S('Dans la maison', 'Les prises et les lampes d’une maison sont branchées <b>en dérivation</b> : on peut éteindre une lampe sans couper tout le reste.'),
        S('Reconnaître', 'Pour savoir si deux lampes sont en série, on se demande : « peut-on suivre un fil qui passe par une lampe sans passer par l’autre ? » Si oui, elles sont en dérivation.'),
      ],
      recap: ['Série : un seul chemin.', 'Dérivation : plusieurs branches.', 'La maison est en dérivation.'],
      quiz: [Q('Deux lampes en série. On en dévisse une. L’autre :', ['continue de briller', 's’éteint'], 1), Q('Dans une maison, les appareils sont branchés :', ['en série', 'en dérivation'], 1)] },

    { id: 'p5-conducteurs', subj: 'physique', level: '5e', icon: '⚡', title: 'Conducteurs, isolants et sécurité',
      intro: 'Certains matériaux laissent passer le courant, d’autres l’arrêtent. C’est essentiel pour fabriquer des appareils sûrs.',
      steps: [
        S('Les conducteurs', 'Un matériau <b>conducteur</b> laisse passer le courant électrique : les métaux (cuivre, fer, aluminium), le graphite de la mine du crayon, l’eau salée.'),
        S('Les isolants', 'Un matériau <b>isolant</b> ne laisse pas passer le courant : le plastique, le verre, le bois sec, le caoutchouc, l’air sec. On en recouvre les fils électriques.'),
        S('Le test', 'Pour tester un objet, on l’intègre dans un circuit avec une lampe. Si la lampe brille, l’objet est conducteur ; sinon, il est isolant.'),
        S('Sécurité', 'L’eau du robinet contient des sels dissous : elle <b>conduit le courant</b>. On n’approche jamais d’appareil branché sur le secteur avec les mains mouillées. Une pile de 4,5 V est sans danger, le secteur (230 V) est dangereux.'),
      ],
      recap: ['Métaux, graphite, eau salée : conducteurs.', 'Plastique, verre, bois sec : isolants.', 'Eau et électricité du secteur : danger.'],
      quiz: [Q('Lequel de ces matériaux est un isolant ?', ['le cuivre', 'le plastique', 'le fer'], 1), Q('L’eau du robinet est :', ['isolante', 'conductrice'], 1)] },

    { id: 'p5-schemas', subj: 'physique', level: '5e', icon: '✏️', title: 'Les schémas électriques',
      intro: 'Pour communiquer, les scientifiques dessinent les circuits avec des symboles que tout le monde comprend.',
      steps: [
        S('Des symboles normalisés', 'Chaque dipôle a son symbole : la pile, la lampe (un cercle avec une croix), l’interrupteur ouvert ou fermé, le moteur (un cercle avec M), le voltmètre (V), l’ampèremètre (A).', 'symboles'),
        S('Les règles du schéma', 'On dessine à la règle, avec des angles droits. Les fils sont des traits sans épaisseur particulière. On place les symboles sur les côtés du rectangle, jamais dans les coins.'),
        S('Lire un schéma', 'Pour lire un schéma, on part de la borne + de la pile et on suit le fil : on passe par chaque dipôle, puis on revient à la borne −.'),
        S('Passer du réel au schéma', 'On repère chaque dipôle du montage, on dessine son symbole, puis on relie les symboles dans le même ordre que les fils réels.'),
      ],
      recap: ['Un symbole par dipôle.', 'Dessin à la règle, angles droits.', 'On suit le fil de + vers −.'],
      quiz: [Q('Le symbole d’une lampe est :', ['un cercle avec une croix', 'un carré', 'un triangle'], 0), Q('Le moteur se représente par :', ['un cercle avec la lettre M', 'un cercle avec la lettre A'], 0)] },

    { id: 'p5-lumiere', subj: 'physique', level: '5e', icon: '💡', title: 'Comment la lumière se propage',
      intro: 'La lumière voyage très vite et toujours en ligne droite. C’est ce qui permet de comprendre les ombres.',
      steps: [
        S('Les sources de lumière', 'Une <b>source primaire</b> produit sa propre lumière : le Soleil, une lampe, une flamme. Un <b>objet diffusant</b> renvoie la lumière reçue : la Lune, un mur, un livre.', 'rayon'),
        S('La ligne droite', 'Dans un milieu <b>transparent et homogène</b> (air, eau, vide), la lumière se propage en <b>ligne droite</b>. On la représente par un <b>rayon lumineux</b>, une demi-droite avec une flèche.'),
        S('Une vitesse énorme', 'La lumière se propage à environ <b>300 000 km par seconde</b> dans le vide. Elle met environ 8 minutes pour venir du Soleil jusqu’à la Terre.'),
        S('Les milieux', 'Un milieu <b>transparent</b> laisse passer la lumière (verre, eau claire), un milieu <b>translucide</b> la laisse passer en la diffusant (papier calque), un milieu <b>opaque</b> l’arrête (bois, métal).'),
      ],
      recap: ['Source primaire ≠ objet diffusant.', 'Ligne droite dans un milieu transparent homogène.', 'Environ 300 000 km/s.'],
      quiz: [Q('Quelle est une source primaire de lumière ?', ['la Lune', 'le Soleil', 'un miroir'], 1), Q('Dans l’air, la lumière se propage :', ['en ligne droite', 'en zigzag'], 0)] },

    { id: 'p5-ombres', subj: 'physique', level: '5e', icon: '🌓', title: 'Ombres, Soleil, Terre et Lune',
      intro: 'Une ombre apparaît derrière un objet qui arrête la lumière. Cela explique aussi les phases de la Lune.',
      steps: [
        S('Formation d’une ombre', 'Un objet opaque éclairé arrête la lumière. Derrière lui, la zone qui ne reçoit pas de lumière est l’<b>ombre portée</b>. L’ombre a la forme de l’objet.', 'rayon'),
        S('Taille de l’ombre', 'Plus l’objet est proche de la source, plus l’ombre est grande. Le soir, les ombres sont longues car le Soleil est bas.'),
        S('Voir un objet', 'On voit un objet quand la lumière qu’il envoie (ou qu’il diffuse) <b>entre dans notre œil</b>. Dans le noir complet, on ne voit rien.'),
        S('Les phases de la Lune', 'La Lune ne produit pas de lumière : elle diffuse celle du Soleil. Moitié de sa surface est toujours éclairée, mais depuis la Terre, on n’en voit qu’une partie qui change : ce sont les <b>phases</b>, sur environ 29 jours.'),
      ],
      recap: ['Ombre = zone sans lumière derrière un objet opaque.', 'On voit si la lumière entre dans l’œil.', 'La Lune est éclairée par le Soleil.'],
      quiz: [Q('Une ombre se forme derrière un objet :', ['transparent', 'opaque'], 1), Q('La Lune brille parce qu’elle :', ['produit sa lumière', 'diffuse la lumière du Soleil'], 1)] },

    { id: 'p5-vitesse', subj: 'physique', level: '5e', icon: '🚗', title: 'Mouvement et vitesse',
      intro: 'Un objet est-il en mouvement ? Cela dépend de qui l’observe. Et on peut mesurer à quelle vitesse il va.',
      steps: [
        S('Le mouvement dépend de l’observateur', 'Un passager assis dans un train est immobile par rapport au train, mais en mouvement par rapport au quai. On précise toujours le <b>référentiel</b>.'),
        S('La trajectoire', 'La trajectoire est la ligne décrite par l’objet : <b>rectiligne</b> (droite), <b>circulaire</b> ou quelconque.'),
        S('La vitesse moyenne', 'La vitesse moyenne se calcule avec <b>v = d ÷ t</b> (distance divisée par durée). Une voiture parcourt 120 km en 2 h : v = 120 ÷ 2 = 60 km/h.'),
        S('Changer d’unité', 'Pour passer de <b>km/h</b> à <b>m/s</b>, on divise par 3,6. 72 km/h = 72 ÷ 3,6 = 20 m/s. Pour l’inverse, on multiplie par 3,6.'),
      ],
      recap: ['Le mouvement dépend du référentiel.', 'v = d ÷ t.', 'km/h ÷ 3,6 = m/s.'],
      quiz: [Q('Une voiture parcourt 150 km en 3 h. Sa vitesse moyenne :', ['30 km/h', '50 km/h', '450 km/h'], 1), Q('36 km/h valent :', ['10 m/s', '36 m/s', '100 m/s'], 0)] },

    /* ---------------------------------------------------------------- CHIMIE */
    { id: 'c5-etats', subj: 'chimie', level: '5e', icon: '🧊', title: 'Les trois états de la matière',
      intro: 'L’eau peut être de la glace, de l’eau liquide ou de la vapeur. Toute la matière existe sous trois états.',
      steps: [
        S('Solide, liquide, gaz', 'La matière se présente sous trois états : <b>solide</b>, <b>liquide</b> et <b>gazeux</b>.', 'etats'),
        S('Le solide', 'Un solide a une <b>forme propre</b> et un volume qui ne change pas. On peut le tenir dans la main (un glaçon, une pierre).'),
        S('Le liquide', 'Un liquide prend la <b>forme du récipient</b>. Sa surface libre est <b>plane et horizontale</b>. Il est difficile à comprimer.'),
        S('Le gaz', 'Un gaz occupe tout l’espace disponible et se <b>comprime</b> facilement. Il est souvent invisible, comme l’air ou la vapeur d’eau.'),
        S('Le modèle des particules', 'Dans un solide, les particules sont rangées et serrées. Dans un liquide, elles sont serrées mais mobiles. Dans un gaz, elles sont très éloignées et se déplacent dans tous les sens.'),
      ],
      recap: ['Trois états : solide, liquide, gaz.', 'Solide : forme propre.', 'Liquide : surface horizontale.', 'Gaz : occupe tout l’espace.'],
      quiz: [Q('Quel état de la matière prend la forme de son récipient ?', ['solide', 'liquide'], 1), Q('Quel état peut être comprimé facilement ?', ['gaz', 'liquide', 'solide'], 0)] },

    { id: 'c5-changements', subj: 'chimie', level: '5e', icon: '💧', title: 'Les changements d’état',
      intro: 'Avec la chaleur ou le froid, la matière peut passer d’un état à un autre : ce sont les changements d’état.',
      steps: [
        S('Le schéma complet', 'Chaque changement d’état a un nom. Du solide au liquide : la <b>fusion</b>. Du liquide au gaz : la <b>vaporisation</b>. Dans l’autre sens : la <b>liquéfaction</b> (gaz vers liquide) et la <b>solidification</b> (liquide vers solide).', 'changements'),
        S('Passages directs', 'Parfois, on passe directement du solide au gaz : c’est la <b>sublimation</b> (la naphtaline, la glace sèche). Le passage inverse est la <b>condensation solide</b>, comme le givre.'),
        S('Évaporation et ébullition', 'La vaporisation peut être lente et en surface, c’est l’<b>évaporation</b> (le linge qui sèche), ou rapide avec des bulles dans tout le liquide, c’est l’<b>ébullition</b>.'),
        S('Un changement physique', 'Pendant un changement d’état, la <b>nature de la matière ne change pas</b> : la glace fondue reste de l’eau. On peut revenir en arrière.'),
      ],
      recap: ['Fusion : solide vers liquide.', 'Vaporisation : liquide vers gaz.', 'Solidification et liquéfaction : les sens inverses.', 'La matière reste la même.'],
      quiz: [Q('Un glaçon se transforme en eau liquide. C’est :', ['la solidification', 'la fusion', 'la vaporisation'], 1), Q('De la vapeur d’eau devient des gouttes sur une vitre froide. C’est :', ['la liquéfaction', 'la fusion'], 0)] },

    { id: 'c5-temperature', subj: 'chimie', level: '5e', icon: '🌡️', title: 'Température et paliers de l’eau',
      intro: 'Quand on chauffe de la glace, la température monte… sauf pendant les changements d’état.',
      steps: [
        S('Les températures de l’eau pure', 'À la pression atmosphérique normale, l’eau pure fond à <b>0 °C</b> et bout à <b>100 °C</b>.', 'palier'),
        S('Les paliers', 'Pendant un changement d’état d’un <b>corps pur</b>, la température reste <b>constante</b> : c’est un palier. Sur le graphe, la courbe est horizontale pendant la fusion et pendant l’ébullition.'),
        S('Lire le graphe', 'Avant le premier palier, c’est de la glace qui se réchauffe. Entre les deux paliers, c’est de l’eau liquide. Après le second palier, c’est de la vapeur.'),
        S('Le thermomètre', 'On mesure une température avec un thermomètre, en degrés Celsius (°C). Pour lire : on place le regard à la hauteur du liquide et on attend que la valeur se stabilise.'),
      ],
      recap: ['Eau pure : 0 °C et 100 °C.', 'Palier : température constante pendant le changement d’état.', 'Un corps pur a un palier.'],
      quiz: [Q('À quelle température l’eau pure bout-elle (pression normale) ?', ['10 °C', '100 °C', '1000 °C'], 1), Q('Pendant la fusion de la glace pure, la température :', ['augmente', 'reste constante'], 1)] },

    { id: 'c5-masse-volume', subj: 'chimie', level: '5e', icon: '⚖️', title: 'Masse et volume',
      intro: 'Quand un glaçon fond, il devient liquide. A-t-il perdu de la matière ? Non : sa masse se conserve.',
      steps: [
        S('La masse se conserve', 'Lors d’un changement d’état, la <b>masse ne change pas</b> : un glaçon de 30 g donne 30 g d’eau liquide. On la mesure avec une balance, en grammes (g) ou kilogrammes (kg).'),
        S('Le volume peut changer', 'Le <b>volume</b> peut varier. L’eau, en gelant, <b>augmente de volume</b> d’environ 9 % : une bouteille pleine éclate au congélateur. On le mesure avec une éprouvette graduée en mL ou en L.'),
        S('Les unités', '1 L = 1 dm³ = 1 000 mL, et 1 mL = 1 cm³. Pour l’eau liquide, <b>1 L a une masse de 1 kg</b>.'),
        S('Une propriété du matériau', 'Pour un même volume, deux matériaux n’ont pas la même masse : l’huile est moins lourde que l’eau (elle flotte dessus), le fer est plus lourd.'),
      ],
      recap: ['La masse se conserve pendant un changement d’état.', 'Le volume peut changer.', '1 L = 1 dm³ ; 1 L d’eau = 1 kg.'],
      quiz: [Q('Un glaçon de 30 g fond. Quelle est la masse de l’eau obtenue ?', ['moins de 30 g', '30 g', 'plus de 30 g'], 1), Q('En gelant, l’eau :', ['augmente de volume', 'diminue de volume'], 0)] },

    { id: 'c5-corps-purs', subj: 'chimie', level: '5e', icon: '🥤', title: 'Corps purs et mélanges',
      intro: 'L’eau du robinet, l’eau minérale, l’eau distillée : elles n’ont pas la même composition.',
      steps: [
        S('Le corps pur', 'Un <b>corps pur</b> est constitué d’une seule espèce chimique : l’eau distillée, le sucre en poudre pur, le fer pur.'),
        S('Le mélange', 'Un <b>mélange</b> contient plusieurs espèces chimiques : l’eau minérale (eau et sels minéraux), l’air, le lait, le jus d’orange.'),
        S('L’air', 'L’air est un mélange de gaz : environ <b>78 % de diazote</b> et <b>21 % de dioxygène</b>, avec un peu d’autres gaz comme le dioxyde de carbone.'),
        S('Comment savoir ?', 'Un corps pur a des caractéristiques fixes : par exemple, l’eau pure bout toujours à 100 °C. Un mélange n’en a pas : la température d’ébullition varie.'),
      ],
      recap: ['Corps pur : une seule espèce chimique.', 'Mélange : plusieurs espèces.', 'Air : environ 78 % de diazote, 21 % de dioxygène.'],
      quiz: [Q('L’air est :', ['un corps pur', 'un mélange'], 1), Q('Le dioxygène représente environ :', ['21 % de l’air', '78 % de l’air', '100 % de l’air'], 0)] },

    { id: 'c5-homogene', subj: 'chimie', level: '5e', icon: '🥛', title: 'Mélanges homogènes et hétérogènes',
      intro: 'Dans un verre, on peut voir plusieurs couches ou une seule. Cela change le nom du mélange.',
      steps: [
        S('Hétérogène', 'Un mélange est <b>hétérogène</b> quand on peut distinguer plusieurs constituants à l’œil nu : eau et huile, eau et sable, une salade. Chaque partie visible s’appelle une phase.'),
        S('Homogène', 'Un mélange est <b>homogène</b> quand on ne distingue qu’une seule phase : eau sucrée, eau salée, sirop dilué. Attention : transparent ne veut pas dire corps pur.'),
        S('Miscible ou non', 'Deux liquides qui forment un mélange homogène sont dits <b>miscibles</b> (eau et sirop). Sinon, ils sont <b>non miscibles</b> et se séparent en couches (eau et huile).'),
        S('L’ordre des couches', 'Dans un mélange hétérogène de liquides, le plus <b>dense</b> reste en bas. L’huile, moins dense que l’eau, flotte au-dessus.'),
      ],
      recap: ['Hétérogène : plusieurs phases visibles.', 'Homogène : une seule phase.', 'Miscibles : ils se mélangent.'],
      quiz: [Q('Eau et huile forment un mélange :', ['homogène', 'hétérogène'], 1), Q('Eau et sel dissous forment un mélange :', ['homogène', 'hétérogène'], 0)] },

    { id: 'c5-dissolution', subj: 'chimie', level: '5e', icon: '🧂', title: 'La dissolution',
      intro: 'Le sucre disparaît dans le café. Où est-il passé ? Il est toujours là, mais dissous.',
      steps: [
        S('Solvant, soluté, solution', 'Dans l’eau salée, l’eau est le <b>solvant</b> (le liquide qui dissout), le sel est le <b>soluté</b> (ce qui est dissous) et le mélange obtenu est une <b>solution</b>.'),
        S('Le soluté ne disparaît pas', 'Quand on dissout du sucre dans l’eau, il ne disparaît pas : la <b>masse totale se conserve</b>. 200 g d’eau + 10 g de sucre donnent 210 g de solution.'),
        S('La saturation', 'On ne peut pas dissoudre une quantité illimitée de soluté. Quand il n’y en a plus qu’un dépôt au fond, la solution est <b>saturée</b>.'),
        S('Les facteurs', 'Remuer et chauffer aident à dissoudre plus vite. Chauffer permet souvent d’en dissoudre davantage.'),
      ],
      recap: ['Solvant + soluté = solution.', 'Masse conservée.', 'Saturée : le soluté ne se dissout plus.'],
      quiz: [Q('Dans l’eau sucrée, le soluté est :', ['l’eau', 'le sucre'], 1), Q('On dissout 10 g de sucre dans 200 g d’eau. La solution a une masse de :', ['190 g', '200 g', '210 g'], 2)] },

    { id: 'c5-separation', subj: 'chimie', level: '5e', icon: '🧪', title: 'Séparer les constituants d’un mélange',
      intro: 'Pour obtenir du sel de l’eau de mer ou de l’eau pure, on utilise des techniques de séparation.',
      steps: [
        S('La décantation', 'On laisse reposer un mélange hétérogène : le constituant le plus dense se dépose au fond. Puis on verse doucement le liquide : c’est la <b>décantation</b>.'),
        S('La filtration', 'On fait passer un mélange avec un solide non dissous à travers un <b>filtre</b>. Le solide reste sur le papier filtre, le liquide qui passe est le <b>filtrat</b>.'),
        S('L’évaporation', 'On chauffe une solution : l’eau s’évapore et le <b>soluté</b> reste (le sel). Cela sert à récupérer le sel de l’eau de mer dans les marais salants.'),
        S('La distillation', 'On chauffe un mélange liquide, puis on <b>refroidit la vapeur</b> pour la liquéfier. On récupère le solvant pur : de l’eau distillée.'),
      ],
      recap: ['Décantation : laisser reposer.', 'Filtration : retenir un solide.', 'Évaporation : récupérer le soluté.', 'Distillation : récupérer le solvant.'],
      quiz: [Q('Pour récupérer le sel de l’eau salée, on utilise :', ['la filtration', 'l’évaporation'], 1), Q('Pour retenir du sable dans de l’eau, on utilise :', ['la filtration', 'la distillation'], 0)] },
  ];

  const SUBJECTS = [
    { id: 'maths', label: 'Mathématiques', icon: '📐', color: '#3b3a8f' },
    { id: 'physique', label: 'Physique', icon: '⚡', color: '#d97706' },
    { id: 'chimie', label: 'Chimie', icon: '🧪', color: '#0d9488' },
  ];
  const LEVELS_COURS = [
    { id: '5e', label: '5ᵉ', ready: true }, { id: '4e', label: '4ᵉ' }, { id: '3e', label: '3ᵉ' },
    { id: '2nde', label: '2nde' }, { id: '1re', label: '1ʳᵉ' }, { id: 'term', label: 'Terminale' },
  ];

  window.COURSES = COURSES; window.COURSE_SUBJECTS = SUBJECTS; window.COURSE_LEVELS = LEVELS_COURS;
  window.courseFig = (k) => (FIG[k] ? FIG[k]() : '');
})();
