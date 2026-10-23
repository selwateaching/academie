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
    balance: () => svg(360, 170, `<path d="M180 150V50M130 150H230" stroke="currentColor" stroke-width="4"/><path d="M70 62L290 62" stroke="${C.brand}" stroke-width="4"/>
      <path d="M70 62L50 112H110Z M290 62L270 112H330Z" stroke="currentColor" stroke-width="2.5" fill="${C.brand}" fill-opacity=".08"/>
      ${T(80, 132, 'x + 3', `fill="${C.rouge}" font-size="14"`)}${T(300, 132, '8', `fill="${C.vert}" font-size="15"`)}
      ${T(180, 36, 'x + 3 = 8  →  x = 8 − 3 = 5', 'font-size="14"')}${T(180, 166, 'même opération des deux côtés', 'font-size="11"')}`),
    stats: () => svg(360, 180, `${ARROW('a7', 'currentColor')}<path d="M40 150V14" stroke="currentColor" stroke-width="2.5" marker-end="url(#a7)"/><path d="M40 150H346" stroke="currentColor" stroke-width="2.5"/>
      ${[[60, 60, C.bleu, '8'], [118, 100, C.vert, '12'], [176, 40, C.or, '6'], [234, 78, C.rouge, '10'], [292, 120, C.brand, '14']].map(([x, h, c, v], i) => `<rect class="pulse" style="animation-delay:${i * 0.25}s" x="${x}" y="${150 - h}" width="38" height="${h}" fill="${c}" fill-opacity=".7"/>${T(x + 19, 144 - h, v, 'font-size="12"')}`).join('')}
      ${T(180, 172, 'moyenne = somme des valeurs ÷ nombre de valeurs', 'font-size="12"')}`),
    urne: () => svg(360, 170, `<path d="M110 40L120 130Q180 150 240 130L250 40" stroke="currentColor" stroke-width="3.5"/>
      ${[[140, 110, C.rouge], [170, 118, C.rouge], [200, 112, C.bleu], [225, 100, C.rouge], [155, 88, C.bleu], [190, 86, C.rouge], [215, 70, C.bleu]].map(([x, y, c], i) => `<circle class="pop" style="animation-delay:${i * 0.2}s" cx="${x}" cy="${y}" r="10" fill="${c}"/>`).join('')}
      ${T(310, 80, '4 rouges', `fill="${C.rouge}" font-size="13"`)}${T(310, 100, '3 bleues', `fill="${C.bleu}" font-size="13"`)}${T(180, 22, 'P(rouge) = 4 ÷ 7', 'font-size="15"')}${T(180, 166, 'probabilité = cas favorables ÷ cas possibles', 'font-size="11"')}`),
    alternes: () => svg(360, 180, `<path d="M20 60H340M20 130H340" stroke="currentColor" stroke-width="3"/><path d="M110 170L250 20" stroke="${C.brand}" stroke-width="3.5"/>
      <path class="pop" d="M190 60L214 60A24 24 0 0 0 206 44" stroke="${C.rouge}" stroke-width="3"/><path class="pop" style="animation-delay:.5s" d="M170 130L146 130A24 24 0 0 0 154 146" stroke="${C.rouge}" stroke-width="3"/>
      ${T(222, 82, 'a', `fill="${C.rouge}" font-size="15"`)}${T(140, 122, 'a', `fill="${C.rouge}" font-size="15"`)}
      ${T(300, 50, '(d₁)', 'font-size="12"')}${T(300, 120, '(d₂)', 'font-size="12"')}${T(180, 176, 'd₁ ∥ d₂ : les angles alternes-internes sont égaux', 'font-size="12"')}`),
    prisme: () => svg(360, 180, `<path d="M70 70L190 70L190 140L70 140Z M70 70L120 40L240 40L190 70 M240 40L240 110L190 140" stroke="${C.brand}" stroke-width="3.5" fill="${C.brand}" fill-opacity=".07"/>
      <path d="M70 140L120 110L240 110M120 40V110" stroke="${C.gris}" stroke-width="1.8" stroke-dasharray="5 5"/>
      ${T(130, 162, 'base', 'font-size="12"')}${T(282, 82, 'hauteur', `fill="${C.rouge}" font-size="12"`)}${T(300, 140, 'V = aire × h', 'font-size="13"')}`),
    algo: () => svg(360, 170, `${ARROW('a8', 'currentColor')}${[['début', 14, C.vert], ['répéter ×4', 100, C.or], ['avancer 50', 186, C.bleu], ['fin', 272, C.rouge]].map(([t, x, c], i) => `<rect class="pulse" style="animation-delay:${i * 0.3}s" x="${x}" y="48" width="74" height="44" rx="10" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="3"/>${T(x + 37, 75, t, 'font-size="10"')}`).join('')}
      <path d="M88 70H100M174 70H186M260 70H272" stroke="currentColor" stroke-width="2.5" marker-end="url(#a8)"/>
      ${T(180, 130, 'un programme = une suite d’instructions', 'font-size="13"')}${T(180, 152, 'tourner de 90° quatre fois : on trace un carré', 'font-size="11"')}`),
    son: () => svg(360, 170, `<rect x="24" y="64" width="26" height="42" rx="6" fill="${C.gris}"/>${[1, 2, 3, 4].map((i) => `<circle class="wv" style="animation-delay:${i * 0.5}s" cx="62" cy="85" r="${i * 10}" stroke="${C.bleu}" stroke-width="3"/>`).join('')}
      <path d="M270 70A22 22 0 0 1 270 100M285 60A36 36 0 0 1 285 110" stroke="${C.gris}" stroke-width="2"/><circle cx="318" cy="85" r="12" fill="${C.or}" fill-opacity=".4" stroke="${C.or}" stroke-width="3"/>
      ${T(37, 128, 'source', 'font-size="12"')}${T(318, 118, 'oreille', 'font-size="12"')}${T(180, 160, 'dans l’air ≈ 340 m/s ; rien dans le vide', 'font-size="12"')}`),
    energie: () => svg(360, 170, `${ARROW('a9', C.rouge)}${[['soleil', '☀️', 10], ['panneau', '🔋', 130], ['lampe', '💡', 250]].map(([t, e, x]) => `<rect x="${x}" y="40" width="100" height="70" rx="12" stroke="currentColor" stroke-width="2.5" fill="${C.or}" fill-opacity=".12"/><text x="${x + 50}" y="82" font-size="30" text-anchor="middle" stroke="none">${e}</text>${T(x + 50, 128, t, 'font-size="12"')}`).join('')}
      <path class="dash" d="M112 75H128M232 75H248" stroke="${C.rouge}" stroke-width="3.5" marker-end="url(#a9)"/>${T(120, 30, 'rayonnante', 'font-size="10"')}${T(240, 30, 'électrique', 'font-size="10"')}${T(180, 160, 'l’énergie se convertit, elle ne disparaît pas', 'font-size="12"')}`),
    force: () => svg(360, 170, `${ARROW('a10', C.rouge)}${ARROW('a11', C.bleu)}<rect x="130" y="70" width="100" height="50" rx="6" fill="${C.gris}" fill-opacity=".3" stroke="${C.gris}" stroke-width="3"/><path d="M20 130H340" stroke="currentColor" stroke-width="3"/>
      <path class="pulse" d="M60 95H128" stroke="${C.rouge}" stroke-width="5" marker-end="url(#a10)"/>${T(80, 80, 'poussée', `fill="${C.rouge}" font-size="12"`)}
      <path d="M180 120V160" stroke="${C.bleu}" stroke-width="5" marker-end="url(#a11)"/>${T(220, 156, 'poids', `fill="${C.bleu}" font-size="12"`)}${T(180, 20, 'une force : un point, une direction, un sens, une valeur', 'font-size="12"')}`),
    lune: () => svg(360, 170, `<circle cx="50" cy="85" r="26" fill="${C.or}" fill-opacity=".5" stroke="${C.or}" stroke-width="3"/>${T(50, 130, 'Soleil', 'font-size="12"')}
      <path class="dash" d="M85 70H170M85 85H170M85 100H170" stroke="${C.or}" stroke-width="2.5"/>
      <circle cx="200" cy="85" r="22" fill="${C.bleu}" fill-opacity=".35" stroke="${C.bleu}" stroke-width="3"/>${T(200, 130, 'Terre', 'font-size="12"')}
      <circle cx="290" cy="85" r="12" fill="#1e293b" stroke="${C.gris}" stroke-width="2"/><path d="M290 73A12 12 0 0 0 290 97Z" fill="#fff" stroke="none"/>${T(290, 118, 'Lune', 'font-size="12"')}
      <path d="M200 40A110 50 0 0 1 290 40" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="5 5"/>${T(180, 160, 'une moitié de la Lune est toujours éclairée', 'font-size="11"')}`),
    oeil: () => svg(360, 170, `<circle cx="40" cy="85" r="18" fill="${C.or}" fill-opacity=".35" stroke="${C.or}" stroke-width="3"/><rect x="100" y="50" width="22" height="70" rx="6" fill="${C.vert}" fill-opacity=".5" stroke="${C.vert}" stroke-width="3"/>
      <path class="dash" d="M60 80L100 78M122 82L270 84" stroke="${C.or}" stroke-width="2.5"/><ellipse cx="300" cy="85" rx="30" ry="20" stroke="currentColor" stroke-width="3"/><circle cx="300" cy="85" r="9" fill="${C.brand}"/>
      ${T(40, 125, 'source', 'font-size="11"')}${T(111, 138, 'objet', 'font-size="11"')}${T(300, 125, 'œil', 'font-size="11"')}${T(180, 160, 'on voit un objet quand sa lumière entre dans l’œil', 'font-size="12"')}`),
    air: () => svg(360, 170, `<rect x="30" y="40" width="300" height="34" stroke="currentColor" stroke-width="2.5"/><rect class="pulse" x="30" y="40" width="234" height="34" fill="${C.bleu}" fill-opacity=".4"/><rect class="pulse" style="animation-delay:.5s" x="264" y="40" width="63" height="34" fill="${C.rouge}" fill-opacity=".45"/>
      ${T(147, 62, 'diazote N₂ ≈ 78 %', 'font-size="13"')}${T(296, 62, 'O₂ 21 %', 'font-size="11"')}${T(180, 110, 'un mélange : ≈ 4/5 de diazote, 1/5 de dioxygène', 'font-size="12"')}${T(180, 132, 'le dioxygène entretient la combustion', 'font-size="12"')}`),
    conservation: () => svg(360, 170, `<path d="M180 150V60M130 150H230" stroke="currentColor" stroke-width="4"/><path d="M60 60H300" stroke="${C.brand}" stroke-width="4"/>
      <path d="M60 60L40 112H110Z M300 60L280 112H340Z" stroke="currentColor" stroke-width="2.5" fill="${C.brand}" fill-opacity=".08"/>
      ${T(75, 132, 'glaçon 50 g', 'font-size="11"')}${T(310, 132, 'eau 50 g', 'font-size="11"')}${T(180, 32, 'la masse se conserve quand l’état change', 'font-size="13"')}${T(180, 166, 'le volume, lui, peut changer', 'font-size="11"')}`),
    goutte: () => svg(360, 170, `<path class="pop" d="M180 24C180 24 130 84 130 112A50 50 0 0 0 230 112C230 84 180 24 180 24Z" stroke="${C.bleu}" stroke-width="4" fill="${C.bleu}" fill-opacity=".25"/>
      ${T(180, 118, 'H₂O', `fill="${C.bleu}" font-size="18"`)}${T(300, 70, 'sulfate de', 'font-size="11"')}${T(300, 84, 'cuivre blanc', 'font-size="11"')}${T(300, 100, '→ bleu', `fill="${C.bleu}" font-size="12"`)}${T(60, 80, 'eau potable', 'font-size="12"')}${T(60, 98, '≠ eau pure', 'font-size="12"')}`),
    pythagore: () => svg(360, 190, `<path d="M70 150H250V50Z" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".08"/><path d="M238 150V138H250" stroke="${C.rouge}" stroke-width="2.5"/>
      ${T(160, 168, 'AB', 'font-size="14"')}${T(268, 104, 'BC', 'font-size="14"')}${T(112, 84, 'AC (hypoténuse)', `fill="${C.rouge}" font-size="12"`)}
      ${T(60, 156, 'A')}${T(262, 158, 'B')}${T(260, 46, 'C')}${T(180, 188, 'AC² = AB² + BC²', 'font-size="14"')}`),
    cosinus: () => svg(360, 190, `<path d="M60 150H260V70Z" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".08"/><path d="M248 150V138H260" stroke="${C.rouge}" stroke-width="2.5"/>
      <path class="pop" d="M100 150A40 40 0 0 0 96 134" stroke="${C.or}" stroke-width="3"/>${T(116, 142, 'α', `fill="${C.or}" font-size="15"`)}
      ${T(160, 170, 'côté adjacent', `fill="${C.vert}" font-size="12"`)}${T(160, 98, 'hypoténuse', `fill="${C.rouge}" font-size="12"`)}${T(300, 112, 'opposé', `fill="${C.bleu}" font-size="12"`)}${T(180, 188, 'cos α = adjacent ÷ hypoténuse', 'font-size="13"')}`),
    translation: () => svg(360, 180, `${ARROW('b1', C.rouge)}<path d="M60 130L120 60L150 130Z" stroke="${C.bleu}" stroke-width="3.5" fill="${C.bleu}" fill-opacity=".14"/>
      <path d="M210 100L270 30L300 100Z" stroke="${C.vert}" stroke-width="3.5" fill="${C.vert}" fill-opacity=".14"/>
      <path class="dash" d="M60 130L210 100M120 60L270 30M150 130L300 100" stroke="${C.gris}" stroke-width="1.8"/>
      <path class="pulse" d="M150 160L300 130" stroke="${C.rouge}" stroke-width="4" marker-end="url(#b1)"/>${T(220, 176, 'vecteur de translation', `fill="${C.rouge}" font-size="12"`)}`),
    pyramide: () => svg(360, 190, `<path d="M70 150L170 170L290 140L180 40Z M70 150L180 40M170 170L180 40M290 140L180 40" stroke="${C.brand}" stroke-width="3.5" fill="${C.brand}" fill-opacity=".06"/>
      <path d="M70 150L290 140" stroke="${C.gris}" stroke-width="1.6" stroke-dasharray="5 5"/><path class="dash" d="M180 40V152" stroke="${C.rouge}" stroke-width="2.5"/>
      ${T(194, 100, 'h', `fill="${C.rouge}" font-size="15"`)}${T(180, 20, 'V = ⅓ × aire de la base × h', 'font-size="13"')}${T(170, 186, 'base', 'font-size="12"')}`),
    puissances: () => svg(360, 170, `${[1, 2, 4, 8, 16].map((v, i) => `<rect class="pulse" style="animation-delay:${i * 0.25}s" x="${22 + i * 66}" y="${120 - 10 - i * 18}" width="52" height="${10 + i * 18}" rx="6" fill="${C.brand}" fill-opacity="${0.2 + i * 0.16}" stroke="${C.brand}" stroke-width="2.5"/>${T(48 + i * 66, 143, '2' + '⁰¹²³⁴'[i], 'font-size="13"')}${T(48 + i * 66, 104 - i * 18, v, 'font-size="12"')}`).join('')}${T(180, 164, 'chaque fois on multiplie par 2', 'font-size="12"')}`),
    mediane: () => svg(360, 190, `<path d="M60 150L300 150L170 30Z" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".07"/>
      <path class="dash" d="M60 150L235 90M300 150L115 90M170 30V150" stroke="${C.rouge}" stroke-width="2.5"/><circle class="pop" cx="177" cy="110" r="6" fill="${C.or}"/>
      ${T(60, 168, 'A')}${T(300, 168, 'B')}${T(170, 22, 'C')}${T(206, 112, 'G', `fill="${C.or}" font-size="15"`)}${T(180, 186, 'les médianes se coupent au centre de gravité G', 'font-size="11"')}`),
    ampere: () => svg(360, 170, `<path d="M50 40H310V130H50V40" stroke="currentColor" stroke-width="3"/><path class="flow" d="M50 78V40H310V130H50V100"/>
      <rect x="40" y="78" width="20" height="26" fill="var(--card,#fff)" stroke="none"/>${pile(50, 90)}
      <rect x="130" y="22" width="40" height="36" fill="var(--card,#fff)" stroke="none"/><circle cx="150" cy="40" r="17" stroke="${C.vert}" stroke-width="3.5" fill="#fff"/>${T(150, 46, 'A', `fill="${C.vert}" font-size="16"`)}
      <rect x="250" y="112" width="40" height="36" fill="var(--card,#fff)" stroke="none"/>${lamp(270, 130)}
      ${T(180, 84, 'ampèremètre en série', 'font-size="12"')}${T(180, 102, 'I en ampères (A)', 'font-size="12"')}${T(180, 164, 'le courant le traverse', 'font-size="11"')}`),
    volt: () => svg(360, 196, `<path d="M50 40H310V130H50V40" stroke="currentColor" stroke-width="3"/>
      <rect x="40" y="62" width="20" height="26" fill="var(--card,#fff)" stroke="none"/>${pile(50, 75)}
      <rect x="250" y="112" width="40" height="36" fill="var(--card,#fff)" stroke="none"/>${lamp(270, 130)}
      <path d="M232 130V166H308V130" stroke="${C.rouge}" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="270" cy="166" r="14" stroke="${C.rouge}" stroke-width="3.5" fill="#fff"/>${T(270, 172, 'V', `fill="${C.rouge}" font-size="15"`)}
      ${T(150, 86, 'voltmètre en dérivation', 'font-size="12"')}${T(150, 104, 'U en volts (V)', 'font-size="12"')}`),
    spectre: () => svg(360, 170, `<path class="dash" d="M20 85L120 85" stroke="${C.gris}" stroke-width="4"/><path d="M120 50L160 120H90Z" stroke="currentColor" stroke-width="3" fill="${C.bleu}" fill-opacity=".12"/>
      ${['#ef4444', '#f59e0b', '#eab308', '#16a34a', '#0ea5e9', '#4f46e5', '#7c3aed'].map((c, i) => `<path class="pulse" style="animation-delay:${i * 0.15}s" d="M148 92L330 ${34 + i * 15}" stroke="${c}" stroke-width="4"/>`).join('')}
      ${T(55, 70, 'lumière blanche', 'font-size="11"')}${T(130, 140, 'prisme', 'font-size="12"')}${T(300, 20, 'rouge', 'fill="#ef4444" font-size="11"')}${T(300, 156, 'violet', 'fill="#7c3aed" font-size="11"')}`),
    reflexion: () => svg(360, 170, `${ARROW('b2', C.or)}<path d="M20 130H340" stroke="currentColor" stroke-width="4"/><path d="M180 130V30" stroke="${C.gris}" stroke-width="2" stroke-dasharray="5 5"/>
      <path class="dash" d="M60 30L180 130" stroke="${C.or}" stroke-width="3.5"/><path class="dash" d="M180 130L300 30" stroke="${C.or}" stroke-width="3.5" marker-end="url(#b2)"/>
      <path d="M150 50A36 36 0 0 1 180 46" stroke="${C.rouge}" stroke-width="2.5"/><path d="M180 46A36 36 0 0 1 208 60" stroke="${C.rouge}" stroke-width="2.5"/>
      ${T(138, 78, 'i', `fill="${C.rouge}" font-size="15"`)}${T(222, 78, 'r', `fill="${C.rouge}" font-size="15"`)}${T(180, 152, 'miroir', 'font-size="12"')}${T(180, 166, 'angle d’incidence i = angle de réflexion r', 'font-size="11"')}`),
    atome: () => svg(360, 170, `<circle cx="180" cy="85" r="14" fill="${C.rouge}"/><circle cx="174" cy="82" r="5" fill="${C.bleu}"/>
      <ellipse cx="180" cy="85" rx="70" ry="30" stroke="${C.gris}" stroke-width="1.5"/><ellipse cx="180" cy="85" rx="70" ry="30" stroke="${C.gris}" stroke-width="1.5" transform="rotate(60 180 85)"/><ellipse cx="180" cy="85" rx="70" ry="30" stroke="${C.gris}" stroke-width="1.5" transform="rotate(120 180 85)"/>
      <circle class="pop" cx="250" cy="85" r="6" fill="${C.bleu}"/><circle class="pop" style="animation-delay:.4s" cx="145" cy="55" r="6" fill="${C.bleu}"/><circle class="pop" style="animation-delay:.8s" cx="145" cy="115" r="6" fill="${C.bleu}"/>
      ${T(300, 80, 'électrons −', `fill="${C.bleu}" font-size="11"`)}${T(60, 80, 'noyau +', `fill="${C.rouge}" font-size="11"`)}${T(180, 166, 'l’atome est neutre : autant de + que de −', 'font-size="12"')}`),
    molecule: () => svg(360, 170, `<circle cx="70" cy="70" r="22" fill="${C.rouge}" fill-opacity=".6"/>${T(70, 76, 'O', 'font-size="15" fill="#fff"')}<circle cx="38" cy="102" r="13" fill="${C.bleu}"/>${T(38, 107, 'H', 'font-size="11" fill="#fff"')}<circle cx="102" cy="102" r="13" fill="${C.bleu}"/>${T(102, 107, 'H', 'font-size="11" fill="#fff"')}${T(70, 142, 'eau H₂O', 'font-size="10"')}
      <circle cx="180" cy="80" r="20" fill="${C.gris}" fill-opacity=".7"/>${T(180, 86, 'C', 'font-size="14" fill="#fff"')}<circle cx="146" cy="80" r="16" fill="${C.rouge}" fill-opacity=".6"/>${T(146, 86, 'O', 'font-size="12" fill="#fff"')}<circle cx="214" cy="80" r="16" fill="${C.rouge}" fill-opacity=".6"/>${T(214, 86, 'O', 'font-size="12" fill="#fff"')}${T(180, 142, 'dioxyde de carbone CO₂', 'font-size="10"')}
      <circle cx="290" cy="70" r="16" fill="${C.rouge}" fill-opacity=".6"/><circle cx="318" cy="70" r="16" fill="${C.rouge}" fill-opacity=".6"/>${T(304, 142, 'dioxygène O₂', 'font-size="10"')}`),
    reaction: () => svg(360, 170, `${ARROW('b3', C.rouge)}<rect x="14" y="50" width="130" height="60" rx="12" fill="${C.bleu}" fill-opacity=".18" stroke="${C.bleu}" stroke-width="3"/>${T(79, 76, 'réactifs', 'font-size="14"')}${T(79, 96, 'ce qui disparaît', 'font-size="10"')}
      <path class="pulse" d="M150 80H206" stroke="${C.rouge}" stroke-width="4" marker-end="url(#b3)"/>${T(178, 68, 'réaction', `fill="${C.rouge}" font-size="11"`)}
      <rect x="216" y="50" width="130" height="60" rx="12" fill="${C.vert}" fill-opacity=".18" stroke="${C.vert}" stroke-width="3"/>${T(281, 76, 'produits', 'font-size="14"')}${T(281, 96, 'ce qui apparaît', 'font-size="10"')}
      ${T(180, 150, 'les atomes se réarrangent, ils ne disparaissent pas', 'font-size="12"')}`),
    feu: () => svg(360, 180, `<path d="M180 20L320 150H40Z" stroke="${C.rouge}" stroke-width="4" fill="${C.rouge}" fill-opacity=".08"/>
      <path class="pulse" d="M180 70C160 100 156 126 180 136C204 126 200 100 180 70Z" fill="${C.or}" stroke="${C.rouge}" stroke-width="3"/>
      ${T(180, 14, 'chaleur', 'font-size="12"')}${T(70, 170, 'combustible', `fill="${C.vert}" font-size="12"`)}${T(290, 170, 'comburant (O₂)', `fill="${C.bleu}" font-size="12"`)}`),
    pgcd: () => svg(360, 180, `<rect x="60" y="30" width="240" height="96" stroke="${C.brand}" stroke-width="3.5" fill="${C.brand}" fill-opacity=".05"/>
      ${[1, 2, 3, 4].map((i) => `<path d="M${60 + i * 48} 30V126" stroke="${C.gris}" stroke-width="1.4"/>`).join('')}<path d="M60 78H300" stroke="${C.gris}" stroke-width="1.4"/>
      <rect class="pulse" x="60" y="30" width="48" height="48" fill="${C.or}" fill-opacity=".3" stroke="${C.or}" stroke-width="3"/>
      ${T(180, 148, '240 = 5 × 48  et  96 = 2 × 48', 'font-size="12"')}${T(180, 166, 'carrés de côté 48 : PGCD(96 ; 240) = 48', 'font-size="12"')}`),
    racine: () => svg(360, 170, `<rect class="pulse" x="40" y="30" width="90" height="90" fill="${C.bleu}" fill-opacity=".25" stroke="${C.bleu}" stroke-width="3.5"/>${T(85, 80, 'aire 25', 'font-size="14"')}${T(85, 140, 'côté = √25 = 5', `fill="${C.bleu}" font-size="13"`)}
      <rect x="190" y="30" width="90" height="90" fill="${C.or}" fill-opacity=".25" stroke="${C.or}" stroke-width="3.5"/>${T(235, 80, 'aire 2', 'font-size="14"')}${T(235, 140, 'côté = √2 ≈ 1,414', `fill="${C.or}" font-size="13"`)}${T(180, 164, 'la racine carrée donne le côté du carré', 'font-size="12"')}`),
    carre: () => svg(360, 180, `<rect x="40" y="15" width="100" height="100" fill="${C.bleu}" fill-opacity=".25" stroke="${C.bleu}" stroke-width="3"/><rect x="140" y="15" width="60" height="100" fill="${C.or}" fill-opacity=".3" stroke="${C.or}" stroke-width="3"/>
      <rect x="40" y="115" width="100" height="60" fill="${C.or}" fill-opacity=".3" stroke="${C.or}" stroke-width="3"/><rect x="140" y="115" width="60" height="60" fill="${C.rouge}" fill-opacity=".3" stroke="${C.rouge}" stroke-width="3"/>
      ${T(90, 70, 'a²', 'font-size="18"')}${T(170, 70, 'ab', 'font-size="16"')}${T(90, 150, 'ab', 'font-size="16"')}${T(170, 150, 'b²', 'font-size="18"')}${T(285, 70, '(a + b)²', 'font-size="15"')}${T(285, 92, '= a² + 2ab + b²', 'font-size="13"')}`),
    thales: () => svg(360, 190, `<path d="M180 20L50 160H310Z" stroke="${C.brand}" stroke-width="3.5" fill="${C.brand}" fill-opacity=".05"/><path class="pulse" d="M130 90H230" stroke="${C.rouge}" stroke-width="4"/>
      ${T(180, 14, 'A')}${T(40, 168, 'B')}${T(322, 168, 'C')}${T(118, 94, 'M', `fill="${C.rouge}"`)}${T(242, 94, 'N', `fill="${C.rouge}"`)}
      ${T(180, 184, '(MN) ∥ (BC) : AM/AB = AN/AC = MN/BC', 'font-size="12"')}`),
    trigo: () => svg(360, 190, `<path d="M50 140H270V50Z" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".07"/><path d="M258 140V128H270" stroke="${C.rouge}" stroke-width="2.5"/>
      <path class="pop" d="M94 140A44 44 0 0 0 87 120" stroke="${C.or}" stroke-width="3"/>${T(112, 134, 'α', `fill="${C.or}" font-size="15"`)}
      ${T(160, 160, 'adjacent', `fill="${C.vert}" font-size="12"`)}${T(284, 96, 'opposé', `fill="${C.bleu}" font-size="12"`)}${T(130, 84, 'hypoténuse', `fill="${C.rouge}" font-size="12"`)}
      ${T(180, 180, 'cos = A/H   sin = O/H   tan = O/A', 'font-size="13"')}`),
    graphe: () => svg(360, 190, `${ARROW('g1', 'currentColor')}<path d="M180 170V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#g1)"/><path d="M20 120H340" stroke="currentColor" stroke-width="2.5" marker-end="url(#g1)"/>
      <path class="draw" pathLength="100" d="M40 160L320 40" stroke="${C.rouge}" stroke-width="4"/><circle cx="180" cy="100" r="5" fill="${C.or}"/>${T(100, 56, 'b = ordonnée à l’origine', `fill="${C.or}" font-size="11"`)}
      ${T(300, 36, 'f(x) = ax + b', `fill="${C.rouge}" font-size="13"`)}${T(260, 160, 'a = coefficient directeur', 'font-size="11"')}${T(344, 134, 'x', 'font-size="12"')}${T(194, 14, 'y', 'font-size="12"')}`),
    sphere: () => svg(360, 180, `<circle cx="150" cy="90" r="60" stroke="${C.brand}" stroke-width="4" fill="${C.brand}" fill-opacity=".08"/><ellipse class="pulse" cx="150" cy="90" rx="60" ry="18" stroke="${C.gris}" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M150 90H210" stroke="${C.rouge}" stroke-width="3"/><circle cx="150" cy="90" r="4" fill="${C.rouge}"/>${T(184, 82, 'r', `fill="${C.rouge}" font-size="15"`)}
      ${T(290, 70, 'aire = 4πr²', 'font-size="14"')}${T(290, 96, 'volume = 4/3 πr³', 'font-size="14"')}${T(180, 172, 'sphère (surface) et boule (volume)', 'font-size="12"')}`),
    ohm: () => svg(360, 180, `<path d="M50 40H310V130H50V40" stroke="currentColor" stroke-width="3"/><rect x="40" y="62" width="20" height="26" fill="var(--card,#fff)" stroke="none"/>${pile(50, 75)}
      <rect x="250" y="20" width="60" height="40" fill="var(--card,#fff)" stroke="none"/><rect class="pulse" x="262" y="28" width="46" height="22" rx="3" stroke="${C.or}" stroke-width="3" fill="${C.or}" fill-opacity=".2"/>${T(230, 80, 'résistance R', 'font-size="11"')}
      ${T(140, 90, 'U = R × I', `fill="${C.rouge}" font-size="20"`)}${T(140, 112, 'U en V, R en Ω, I en A', 'font-size="12"')}${T(180, 168, 'plus R est grande, plus I est petite', 'font-size="12"')}`),
    puissance: () => svg(360, 170, `${lamp(60, 70, C.or)}${T(60, 110, '60 W', 'font-size="14"')}${lamp(180, 70, C.or)}${T(180, 110, '100 W', 'font-size="14"')}${lamp(300, 70, C.or)}${T(300, 110, '20 W', 'font-size="14"')}
      ${T(180, 142, 'P = U × I', `fill="${C.rouge}" font-size="18"`)}${T(180, 162, 'E = P × t (énergie consommée)', 'font-size="12"')}`),
    lentille: () => svg(360, 180, `${ARROW('l1', C.or)}<path d="M180 20C200 70 200 110 180 160C160 110 160 70 180 20Z" stroke="${C.bleu}" stroke-width="3.5" fill="${C.bleu}" fill-opacity=".15"/><path d="M20 90H340" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="5 5"/>
      <path class="dash" d="M30 50H180L290 90M30 90H340M30 130H180L290 90" stroke="${C.or}" stroke-width="2.5"/><circle cx="290" cy="90" r="5" fill="${C.rouge}"/>${T(290, 78, 'foyer F’', `fill="${C.rouge}" font-size="11"`)}${T(180, 14, 'lentille convergente', 'font-size="12"')}${T(180, 176, 'les rayons parallèles convergent au foyer', 'font-size="12"')}`),
    gravit: () => svg(360, 170, `${ARROW('g2', C.rouge)}<circle cx="70" cy="85" r="40" fill="${C.bleu}" fill-opacity=".3" stroke="${C.bleu}" stroke-width="3"/>${T(70, 90, 'Terre', 'font-size="14"')}
      <circle cx="290" cy="85" r="16" fill="${C.gris}" fill-opacity=".5" stroke="${C.gris}" stroke-width="3"/>${T(290, 120, 'Lune', 'font-size="12"')}
      <path class="pulse" d="M180 70H125" stroke="${C.rouge}" stroke-width="4" marker-end="url(#g2)"/><path class="pulse" d="M180 100H245" stroke="${C.rouge}" stroke-width="4" marker-end="url(#g2)"/>
      ${T(180, 150, 'attraction mutuelle : plus de masse, plus de force', 'font-size="12"')}${T(180, 166, 'moins elle est loin, plus elle est forte', 'font-size="11"')}`),
    inertie: () => svg(360, 170, `${ARROW('i1', C.rouge)}<path d="M20 120H340" stroke="currentColor" stroke-width="3"/><circle cx="80" cy="100" r="18" fill="${C.bleu}" fill-opacity=".3" stroke="${C.bleu}" stroke-width="3"/>
      <path class="dash" d="M110 100H290" stroke="${C.rouge}" stroke-width="3.5" marker-end="url(#i1)"/>${T(200, 84, 'v constante', `fill="${C.rouge}" font-size="13"`)}${T(180, 150, 'aucune force (ou forces qui se compensent) :', 'font-size="12"')}${T(180, 166, 'mouvement rectiligne uniforme ou repos', 'font-size="12"')}`),
    cinetique: () => svg(360, 170, `${ARROW('k1', C.rouge)}<circle cx="70" cy="90" r="18" fill="${C.rouge}" fill-opacity=".3" stroke="${C.rouge}" stroke-width="3"/><path d="M96 90H160" stroke="${C.rouge}" stroke-width="3" marker-end="url(#k1)"/>${T(70, 124, 'v', 'font-size="15"')}
      <circle cx="260" cy="40" r="14" fill="${C.bleu}" fill-opacity=".3" stroke="${C.bleu}" stroke-width="3"/><path d="M260 70V120" stroke="${C.bleu}" stroke-width="2.5" stroke-dasharray="4 4"/><path d="M230 126H290" stroke="currentColor" stroke-width="3"/>${T(310, 80, 'h', 'font-size="15"')}
      ${T(100, 150, 'Ec = ½ × m × v²', `fill="${C.rouge}" font-size="13"`)}${T(260, 150, 'Ep = m × g × h', `fill="${C.bleu}" font-size="13"`)}${T(180, 14, 'énergie de mouvement et de position', 'font-size="12"')}`),
    ion: () => svg(360, 170, `<circle cx="90" cy="80" r="34" fill="${C.rouge}" fill-opacity=".25" stroke="${C.rouge}" stroke-width="3.5"/>${T(90, 86, 'Na⁺', `fill="${C.rouge}" font-size="20"`)}${T(90, 130, 'cation : a perdu 1 électron', 'font-size="10"')}
      <circle cx="270" cy="80" r="40" fill="${C.bleu}" fill-opacity=".25" stroke="${C.bleu}" stroke-width="3.5"/>${T(270, 86, 'Cl⁻', `fill="${C.bleu}" font-size="20"`)}${T(270, 134, 'anion : a gagné 1 électron', 'font-size="10"')}
      <path class="pulse" d="M130 80H226" stroke="${C.gris}" stroke-width="3" stroke-dasharray="6 5"/>${T(180, 70, 's’attirent', 'font-size="11"')}${T(180, 160, 'un ion est un atome qui a gagné ou perdu des électrons', 'font-size="11"')}`),
    ph: () => svg(360, 160, `${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => `<rect x="${12 + i * 22.6}" y="40" width="22" height="38" fill="${['#ef4444', '#f87171', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#4ade80', '#16a34a', '#2dd4bf', '#38bdf8', '#3b82f6', '#6366f1', '#7c3aed', '#6d28d9', '#4c1d95'][i]}" stroke="#fff"/>${T(23 + i * 22.6, 98, i, 'font-size="10"')}`).join('')}
      ${T(60, 26, 'acide', 'font-size="12"')}${T(184, 26, 'neutre', 'font-size="12"')}${T(300, 26, 'basique', 'font-size="12"')}${T(184, 124, 'pH = 7 : eau pure', 'font-size="12"')}${T(184, 144, 'pH &lt; 7 : acide ; pH &gt; 7 : basique', 'font-size="11"')}`),
    solution: () => svg(360, 170, `<path d="M90 30L100 140H250L260 30" stroke="currentColor" stroke-width="3.5" fill="${C.bleu}" fill-opacity=".1"/>
      ${[[130, 100, '+', C.rouge], [180, 80, '−', C.bleu], [215, 112, '+', C.rouge], [150, 125, '−', C.bleu], [200, 130, '−', C.bleu], [235, 90, '+', C.rouge]].map(([x, y, t, c], i) => `<circle class="ps" style="animation-delay:-${i * 0.2}s" cx="${x}" cy="${y}" r="10" fill="${c}" fill-opacity=".35" stroke="${c}" stroke-width="2.5"/>${T(x, y + 5, t, `fill="${c}" font-size="14"`)}`).join('')}
      ${T(314, 70, 'ions mobiles', 'font-size="11"')}${T(180, 164, 'les ions rendent la solution conductrice', 'font-size="12"')}`),
    bulles: () => svg(360, 170, `<path d="M110 30V120A22 22 0 0 0 132 142H228A22 22 0 0 0 250 120V30" stroke="currentColor" stroke-width="3.5" fill="${C.bleu}" fill-opacity=".08"/><rect x="150" y="100" width="60" height="26" rx="4" fill="${C.gris}" fill-opacity=".6"/>
      ${[[160, 90], [180, 78], [200, 92], [190, 58], [170, 50]].map(([x, y], i) => `<circle class="pl" style="animation-delay:-${i * 0.5}s" cx="${x}" cy="${y}" r="6" stroke="${C.bleu}" stroke-width="2.5" fill="#fff"/>`).join('')}
      ${T(290, 100, 'fer', 'font-size="12"')}${T(312, 70, 'bulles de H₂', `fill="${C.bleu}" font-size="11"`)}${T(180, 164, 'fer + acide → ions fer + dihydrogène', 'font-size="12"')}`),
    intervalle: () => svg(360, 150, `${ARROW('n1', 'currentColor')}<path d="M14 70H346" stroke="currentColor" stroke-width="3" marker-end="url(#n1)"/>
      ${[-2, -1, 0, 1, 2, 3, 4, 5].map((i) => `${L(70 + (i + 2) * 38, 63, 70 + (i + 2) * 38, 77, 'currentColor', 2)}${T(70 + (i + 2) * 38, 96, i, 'font-size="12"')}`).join('')}
      <path class="pulse" d="M146 70H260" stroke="${C.rouge}" stroke-width="8"/><path d="M146 56V84" stroke="${C.rouge}" stroke-width="3"/><circle cx="260" cy="70" r="7" fill="#fff" stroke="${C.rouge}" stroke-width="3"/>
      ${T(200, 40, '[0 ; 3[', `fill="${C.rouge}" font-size="15"`)}${T(180, 128, 'crochet fermé : 0 est inclus ; crochet ouvert : 3 est exclu', 'font-size="11"')}`),
    parabole: () => svg(360, 190, `${ARROW('p1', 'currentColor')}<path d="M180 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#p1)"/><path d="M15 140H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#p1)"/>
      <path class="draw" pathLength="100" d="M70 20C100 120 150 140 180 140C210 140 260 120 290 20" stroke="${C.rouge}" stroke-width="4"/><circle cx="180" cy="140" r="5" fill="${C.or}"/>
      ${T(300, 36, 'f(x) = x²', `fill="${C.rouge}" font-size="14"`)}${T(255, 164, 'minimum 0 en x = 0', 'font-size="11"')}${T(52, 100, 'décroissante', 'font-size="11"')}${T(308, 100, 'croissante', 'font-size="11"')}`),
    hyperbole: () => svg(360, 190, `${ARROW('h1', 'currentColor')}<path d="M180 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#h1)"/><path d="M15 95H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#h1)"/>
      <path class="draw" pathLength="100" d="M200 15C210 70 230 85 340 90" stroke="${C.rouge}" stroke-width="4"/><path class="draw" pathLength="100" d="M160 175C150 120 130 105 20 100" stroke="${C.rouge}" stroke-width="4"/>
      ${T(300, 40, 'f(x) = 1/x', `fill="${C.rouge}" font-size="14"`)}${T(180, 188, 'définie pour x ≠ 0', 'font-size="11"')}`),
    vecteur: () => svg(360, 190, `${ARROW('v1', C.rouge)}<path d="M20 160H340M40 20V175" stroke="${C.gris}" stroke-width="1.6"/>
      <circle cx="90" cy="130" r="5" fill="${C.bleu}"/><circle cx="250" cy="50" r="5" fill="${C.vert}"/>${T(80, 150, 'A(1 ; 2)', 'font-size="12"')}${T(274, 42, 'B(5 ; 4)', 'font-size="12"')}
      <path class="pulse" d="M92 128L246 52" stroke="${C.rouge}" stroke-width="4" marker-end="url(#v1)"/>${T(190, 108, 'AB (4 ; 2)', `fill="${C.rouge}" font-size="14"`)}${T(180, 184, 'AB = (xB − xA ; yB − yA)', 'font-size="12"')}`),
    droiteeq: () => svg(360, 190, `${ARROW('d1', 'currentColor')}<path d="M180 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#d1)"/><path d="M15 120H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#d1)"/>
      <path class="draw" pathLength="100" d="M50 170L320 30" stroke="${C.rouge}" stroke-width="4"/><path d="M180 120V100M180 100H250" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="4 4"/>
      ${T(280, 36, 'y = mx + p', `fill="${C.rouge}" font-size="14"`)}${T(98, 28, 'x = c : droite verticale', 'font-size="11"')}${T(200, 186, 'm : coefficient directeur · p : ordonnée à l’origine', 'font-size="11"')}`),
    milieu: () => svg(360, 180, `<circle cx="70" cy="140" r="6" fill="${C.bleu}"/><circle cx="290" cy="50" r="6" fill="${C.vert}"/><circle class="pop" cx="180" cy="95" r="6" fill="${C.or}"/>
      <path d="M70 140L290 50" stroke="${C.brand}" stroke-width="3.5"/><path class="dash" d="M70 140H290V50" stroke="${C.gris}" stroke-width="1.6"/>
      ${T(60, 160, 'A', 'font-size="14"')}${T(300, 44, 'B', 'font-size="14"')}${T(190, 82, 'I', `fill="${C.or}" font-size="14"`)}
      ${T(180, 160, 'AB = √((xB − xA)² + (yB − yA)²)', 'font-size="11"')}${T(180, 176, 'I = ((xA + xB)/2 ; (yA + yB)/2)', 'font-size="11"')}`),
    boite: () => svg(360, 160, `<path d="M30 80H330" stroke="${C.gris}" stroke-width="1.5"/>
      <path d="M60 60V100M120 50V110M170 50V110M240 50V110M300 60V100M120 80H240M120 50H240M120 110H240M60 80H120M240 80H300" stroke="${C.brand}" stroke-width="3"/><rect class="pulse" x="120" y="50" width="120" height="60" fill="${C.brand}" fill-opacity=".12" stroke="none"/>
      ${T(60, 130, 'min', 'font-size="11"')}${T(120, 130, 'Q1', 'font-size="12"')}${T(170, 130, 'médiane', `fill="${C.rouge}" font-size="12"`)}${T(240, 130, 'Q3', 'font-size="12"')}${T(300, 130, 'max', 'font-size="11"')}${T(180, 28, '50 % des valeurs entre Q1 et Q3', 'font-size="12"')}`),
    vitesse2: () => svg(360, 180, `${ARROW('w1', C.rouge)}<path d="M30 130C100 130 150 60 200 60S290 100 320 130" stroke="${C.gris}" stroke-width="2" stroke-dasharray="5 5"/>
      ${[[60, 130], [130, 100], [200, 60], [270, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${C.bleu}"/>`).join('')}
      <path class="pulse" d="M200 60L250 56" stroke="${C.rouge}" stroke-width="4" marker-end="url(#w1)"/>${T(230, 44, 'vecteur vitesse', `fill="${C.rouge}" font-size="12"`)}
      ${T(180, 156, 'v = d ÷ Δt', 'font-size="12"')}${T(180, 174, 'tangent à la trajectoire, dans le sens du mouvement', 'font-size="10"')}`),
    forces2: () => svg(360, 190, `${ARROW('f1', C.rouge)}${ARROW('f2', C.bleu)}<rect x="140" y="70" width="80" height="50" rx="6" fill="${C.gris}" fill-opacity=".3" stroke="${C.gris}" stroke-width="3"/><path d="M20 120H340" stroke="currentColor" stroke-width="3"/>
      <path d="M180 120V60" stroke="${C.vert}" stroke-width="4" marker-end="url(#f1)"/><path d="M180 95V160" stroke="${C.bleu}" stroke-width="4" marker-end="url(#f2)"/>${T(220, 56, 'réaction du support R', `fill="${C.vert}" font-size="11"`)}${T(240, 160, 'poids P', `fill="${C.bleu}" font-size="12"`)}
      ${T(180, 184, 'objet immobile : P + R = 0 (forces qui se compensent)', 'font-size="11"')}`),
    signal: () => svg(360, 170, `${ARROW('s1', 'currentColor')}<path d="M20 85H340" stroke="currentColor" stroke-width="2" marker-end="url(#s1)"/>
      <path class="draw" pathLength="100" d="M20 85C45 20 75 20 100 85S155 150 180 85S235 20 260 85S315 150 340 85" stroke="${C.rouge}" stroke-width="4"/>
      <path d="M100 150H260" stroke="${C.bleu}" stroke-width="2.5"/>${T(180, 166, 'période T', `fill="${C.bleu}" font-size="12"`)}${T(60, 30, 'signal périodique', 'font-size="11"')}${T(290, 30, 'f = 1/T (Hz)', `fill="${C.rouge}" font-size="12"`)}`),
    snell: () => svg(360, 190, `${ARROW('r1', C.or)}<rect x="20" y="95" width="320" height="85" fill="${C.bleu}" fill-opacity=".12"/><path d="M20 95H340" stroke="currentColor" stroke-width="3"/><path d="M180 20V180" stroke="${C.gris}" stroke-width="1.8" stroke-dasharray="5 5"/>
      <path class="dash" d="M90 25L180 95" stroke="${C.or}" stroke-width="3.5"/><path class="dash" d="M180 95L240 170" stroke="${C.or}" stroke-width="3.5" marker-end="url(#r1)"/>
      ${T(130, 70, 'i₁', `fill="${C.rouge}" font-size="14"`)}${T(214, 140, 'i₂', `fill="${C.rouge}" font-size="14"`)}${T(300, 40, 'air n₁ ≈ 1', 'font-size="12"')}${T(300, 120, 'verre n₂ > 1', 'font-size="12"')}${T(180, 14, 'n₁ sin i₁ = n₂ sin i₂', 'font-size="13"')}`),
    raies: () => svg(360, 150, `<rect x="30" y="30" width="300" height="40" fill="#111827"/>${[[70, '#a855f7'], [110, '#3b82f6'], [140, '#22c55e'], [190, '#eab308'], [260, '#ef4444'], [290, '#dc2626']].map(([x, c]) => `<path class="pulse" d="M${x} 30V70" stroke="${c}" stroke-width="5"/>`).join('')}
      ${T(180, 22, 'spectre de raies d’émission (gaz)', 'font-size="11"')}${T(180, 146, 'chaque élément a ses raies : une « empreinte »', 'font-size="11"')}`),
    mailles: () => svg(360, 190, `<path d="M40 30H320V160H40V30M180 30V160" stroke="currentColor" stroke-width="3"/><rect x="30" y="80" width="20" height="26" fill="var(--card,#fff)" stroke="none"/>${pile(40, 93)}
      <rect x="150" y="80" width="60" height="26" fill="var(--card,#fff)" stroke="none"/><rect x="160" y="82" width="40" height="22" rx="3" stroke="${C.or}" stroke-width="3" fill="${C.or}" fill-opacity=".2"/><rect x="290" y="80" width="60" height="26" fill="var(--card,#fff)" stroke="none"/><rect x="290" y="82" width="40" height="22" rx="3" stroke="${C.or}" stroke-width="3" fill="${C.or}" fill-opacity=".2" transform="translate(-0 0)"/>
      ${T(105, 16, 'loi des nœuds : I = I₁ + I₂', 'font-size="11"')}${T(180, 184, 'loi des mailles : E = U₁ + U₂', 'font-size="11"')}`),
    moleF: () => svg(360, 180, `<path d="M180 150V60M120 150H240" stroke="currentColor" stroke-width="4"/><path d="M60 60H300" stroke="${C.brand}" stroke-width="4"/><path d="M60 60L42 108H98Z M300 60L282 108H338Z" stroke="currentColor" stroke-width="2.5" fill="${C.brand}" fill-opacity=".08"/>
      ${T(70, 130, '18 g d’eau', 'font-size="11"')}${T(310, 130, '1 mol', 'font-size="12"')}${T(180, 28, 'n = m ÷ M', `fill="${C.rouge}" font-size="20"`)}${T(180, 168, 'n en mol, m en g, M en g/mol  (1 mol = 6,02 × 10²³ entités)', 'font-size="10"')}`),
    verre: () => svg(360, 180, `<path d="M70 30L82 150H168L180 30" stroke="currentColor" stroke-width="3.5" fill="${C.bleu}" fill-opacity=".25"/><path d="M200 30L212 150H298L310 30" stroke="currentColor" stroke-width="3.5" fill="${C.bleu}" fill-opacity=".1"/>
      ${T(125, 100, 'C = n/V', `fill="${C.rouge}" font-size="14"`)}${T(255, 100, 'C’ = C/2', `fill="${C.rouge}" font-size="14"`)}${T(125, 168, 'solution mère', 'font-size="11"')}${T(255, 168, 'solution diluée', 'font-size="11"')}${T(180, 18, 'C₁ × V₁ = C₂ × V₂ (dilution)', 'font-size="12"')}`),
    periodique: () => svg(360, 170, `${[['H', 1, 0, 0], ['He', 2, 6, 0], ['Li', 3, 0, 1], ['C', 6, 4, 1], ['N', 7, 5, 1], ['O', 8, 6, 1], ['Ne', 10, 7, 1], ['Na', 11, 0, 2], ['Cl', 17, 6, 2]].map(([s, z, c, r], i) => `<rect x="${40 + c * 38}" y="${8 + r * 38}" width="34" height="34" rx="4" fill="${C.brand}" fill-opacity="${0.1 + (i % 3) * 0.08}" stroke="${C.brand}" stroke-width="2"/>${T(57 + c * 38, 22 + r * 38, z, 'font-size="9"')}${T(57 + c * 38, 37 + r * 38, s, 'font-size="13"')}`).join('')}
      ${T(180, 142, 'colonnes : même nombre d’électrons de valence', 'font-size="11"')}${T(180, 162, 'lignes : remplissage des couches (K, L, M)', 'font-size="11"')}`),
    stoechio: () => svg(360, 170, `${ARROW('t1', C.rouge)}${T(80, 70, '2 H₂ + O₂', 'font-size="18"')}<path class="pulse" d="M150 66H210" stroke="${C.rouge}" stroke-width="4" marker-end="url(#t1)"/>${T(280, 70, '2 H₂O', 'font-size="18"')}
      ${T(80, 100, 'x = 0 : état initial', 'font-size="10"')}${T(280, 100, 'x = xmax : état final', 'font-size="10"')}${T(180, 140, 'réactif limitant : consommé en entier', 'font-size="12"')}${T(180, 158, 'les quantités suivent les nombres stœchiométriques', 'font-size="11"')}`),
    chromato: () => svg(360, 180, `<rect x="120" y="20" width="120" height="140" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M130 140H230" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="150" cy="140" r="5" fill="${C.rouge}"/><circle cx="180" cy="140" r="5" fill="${C.bleu}"/><circle cx="210" cy="140" r="5" fill="${C.vert}"/>
      <ellipse class="pulse" cx="150" cy="80" rx="8" ry="12" fill="${C.rouge}" fill-opacity=".55"/><ellipse class="pulse" cx="180" cy="50" rx="8" ry="12" fill="${C.bleu}" fill-opacity=".55"/><ellipse class="pulse" cx="210" cy="100" rx="8" ry="12" fill="${C.vert}" fill-opacity=".55"/>
      ${T(60, 100, 'éluant', 'font-size="12"')}${T(300, 60, 'espèces séparées', 'font-size="12"')}${T(300, 80, 'rapport frontal', 'font-size="11"')}${T(180, 176, 'même hauteur : même espèce', 'font-size="11"')}`),
    discri: () => svg(360, 190, `${ARROW('q1', 'currentColor')}<path d="M180 180V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#q1)"/><path d="M15 100H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#q1)"/>
      <path class="draw" pathLength="100" d="M90 20C120 150 160 160 180 160C200 160 240 150 270 20" stroke="${C.rouge}" stroke-width="4"/>
      <circle class="pop" cx="128" cy="100" r="5" fill="${C.or}"/><circle class="pop" cx="232" cy="100" r="5" fill="${C.or}"/>
      ${T(100, 88, 'x₁', 'font-size="12"')}${T(262, 88, 'x₂', 'font-size="12"')}${T(180, 182, 'Δ = b² − 4ac &gt; 0 : deux racines', 'font-size="11"')}${T(290, 36, 'ax² + bx + c', `fill="${C.rouge}" font-size="13"`)}`),
    tangente: () => svg(360, 190, `${ARROW('t1', 'currentColor')}<path d="M30 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#t1)"/><path d="M15 165H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#t1)"/>
      <path class="draw" pathLength="100" d="M50 150C110 150 150 70 210 60S300 40 330 30" stroke="${C.brand}" stroke-width="4"/>
      <path class="dash" d="M110 140L260 40" stroke="${C.rouge}" stroke-width="3"/><circle class="pop" cx="185" cy="90" r="6" fill="${C.or}"/>
      ${T(185, 112, 'A', 'font-size="13"')}${T(290, 30, 'tangente en A', `fill="${C.rouge}" font-size="12"`)}${T(180, 186, 'pente de la tangente = f ′(a)', 'font-size="12"')}`),
    suite: () => svg(360, 170, `${ARROW('s1', 'currentColor')}<path d="M30 145H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#s1)"/><path d="M30 145V10" stroke="currentColor" stroke-width="2.5"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="pop" style="animation-delay:${i * 0.2}s" cx="${60 + i * 50}" cy="${125 - i * 18}" r="6" fill="${C.bleu}"/>${T(60 + i * 50, 162, 'u' + '₀₁₂₃₄₅'[i], 'font-size="11"')}`).join('')}
      ${T(180, 22, 'suite arithmétique : on ajoute toujours r', 'font-size="12"')}`),
    cercleTrigo: () => svg(360, 190, `<circle cx="150" cy="95" r="70" stroke="currentColor" stroke-width="2.5"/><path d="M60 95H240M150 15V175" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/>
      <path class="draw" pathLength="100" d="M150 95L199 45" stroke="${C.rouge}" stroke-width="3.5"/><circle cx="199" cy="45" r="6" fill="${C.or}"/>
      <path d="M199 45V95" stroke="${C.vert}" stroke-width="3.5"/><path d="M150 95H199" stroke="${C.bleu}" stroke-width="3.5"/>
      ${T(224, 38, 'M', 'font-size="13"')}${T(176, 112, 'cos x', `fill="${C.bleu}" font-size="12"`)}${T(222, 76, 'sin x', `fill="${C.vert}" font-size="12"`)}${T(177, 78, 'x', 'font-size="12"')}${T(300, 100, 'rayon 1', 'font-size="12"')}${T(300, 124, 'cos² x + sin² x = 1', 'font-size="11"')}`),
    prodscal: () => svg(360, 170, `${ARROW('v1', C.rouge)}${ARROW('v2', C.bleu)}<path class="pulse" d="M60 130L250 130" stroke="${C.rouge}" stroke-width="4" marker-end="url(#v1)"/><path d="M60 130L170 50" stroke="${C.bleu}" stroke-width="4" marker-end="url(#v2)"/>
      <path d="M170 50V130" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 4"/><path d="M60 130H170" stroke="${C.vert}" stroke-width="6"/>
      ${T(255, 150, 'u', `fill="${C.rouge}" font-size="13"`)}${T(180, 44, 'v', `fill="${C.bleu}" font-size="13"`)}${T(115, 150, 'projection', `fill="${C.vert}" font-size="11"`)}${T(180, 14, 'u · v = ‖u‖ × ‖v‖ × cos θ', 'font-size="12"')}`),
    arbre: () => svg(360, 180, `<path d="M40 90L130 45M40 90L130 135M130 45L240 20M130 45L240 70M130 135L240 110M130 135L240 160" stroke="currentColor" stroke-width="2.5"/>
      ${[[40, 90, ''], [130, 45, 'A'], [130, 135, 'Ā'], [240, 20, 'B'], [240, 70, 'B̄'], [240, 110, 'B'], [240, 160, 'B̄']].map(([x, y, s]) => `<circle class="pop" cx="${x}" cy="${y}" r="6" fill="${C.brand}"/>${T(x + 18, y + 4, s, 'font-size="12"')}`).join('')}
      ${T(70, 58, 'P(A)', 'font-size="11"')}${T(70, 128, 'P(Ā)', 'font-size="11"')}${T(188, 26, 'P_A(B)', 'font-size="11"')}${T(180, 178, 'P(A ∩ B) = P(A) × P_A(B)', 'font-size="12"')}`),
    newton2: () => svg(360, 160, `${ARROW('n1', C.rouge)}${ARROW('n2', C.bleu)}<path d="M20 120H340" stroke="currentColor" stroke-width="3"/><rect class="pulse" x="140" y="80" width="60" height="40" rx="6" fill="${C.or}" fill-opacity=".3" stroke="${C.or}" stroke-width="3"/>
      <path d="M170 100H270" stroke="${C.rouge}" stroke-width="5" marker-end="url(#n1)"/><path d="M170 100H80" stroke="${C.bleu}" stroke-width="3" marker-end="url(#n2)" stroke-dasharray="6 4"/>
      ${T(285, 94, 'ΣF', `fill="${C.rouge}" font-size="13"`)}${T(60, 94, 'a', `fill="${C.bleu}" font-size="13"`)}${T(180, 148, 'ΣF = m × a : même direction et même sens', 'font-size="12"')}`),
    energieChute: () => svg(360, 180, `${ARROW('e1', C.rouge)}<path d="M180 20V150" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 4"/><path d="M60 160H300" stroke="currentColor" stroke-width="3"/>
      <circle cx="180" cy="26" r="10" fill="${C.or}"/><circle class="pulse" cx="180" cy="90" r="10" fill="${C.or}" fill-opacity=".6"/><circle cx="180" cy="148" r="10" fill="${C.or}"/>
      <rect x="230" y="20" width="60" height="12" fill="${C.vert}"/><rect x="230" y="84" width="30" height="12" fill="${C.vert}"/><rect x="260" y="84" width="30" height="12" fill="${C.rouge}"/><rect x="230" y="142" width="60" height="12" fill="${C.rouge}"/>
      ${T(110, 30, 'Ep max', `fill="${C.vert}" font-size="12"`)}${T(110, 94, 'Ep + Ec', 'font-size="12"')}${T(110, 152, 'Ec max', `fill="${C.rouge}" font-size="12"`)}${T(180, 176, 'Em = Ec + Ep reste constante (sans frottements)', 'font-size="11"')}`),
    diffraction: () => svg(360, 170, `<path d="M30 20V70M30 100V150" stroke="currentColor" stroke-width="5"/>
      ${[0, 1, 2, 3, 4].map((i) => `<path class="wv" style="animation-delay:${i * 0.3}s" d="M${70 + i * 16} 30V140" stroke="${C.bleu}" stroke-width="2"/>`).join('')}
      ${[0, 1, 2].map((i) => `<path class="wv" style="animation-delay:${i * 0.3}s" d="M${190 + i * 34} 45A${40 + i * 30} ${40 + i * 30} 0 0 1 ${190 + i * 34} 125" stroke="${C.vert}" stroke-width="2.5"/>`).join('')}
      ${T(80, 162, 'onde incidente', 'font-size="11"')}${T(280, 162, 'diffraction : l’onde s’étale', 'font-size="11"')}${T(30, 90, 'fente', 'font-size="11"')}`),
    niveaux: () => svg(360, 190, `${ARROW('l1', C.rouge)}<path d="M80 150H200" stroke="currentColor" stroke-width="4"/><path d="M80 100H200" stroke="currentColor" stroke-width="4"/><path d="M80 60H200" stroke="currentColor" stroke-width="4"/><path d="M80 34H200" stroke="currentColor" stroke-width="4"/>
      <path class="flow" d="M110 62V146" stroke="${C.rouge}" stroke-width="3" marker-end="url(#l1)" pathLength="100"/><circle class="pulse" cx="110" cy="150" r="6" fill="${C.or}"/>
      <path class="wv" d="M130 100L180 140" stroke="${C.bleu}" stroke-width="3" stroke-dasharray="3 5"/>
      ${T(40, 154, 'E₁', 'font-size="12"')}${T(40, 104, 'E₂', 'font-size="12"')}${T(40, 64, 'E₃', 'font-size="12"')}${T(280, 80, 'photon émis', `fill="${C.rouge}" font-size="12"`)}${T(280, 102, 'ΔE = h × ν', 'font-size="12"')}${T(280, 124, 'ΔE = E₃ − E₁', 'font-size="11"')}`),
    titrage: () => svg(360, 190, `${ARROW('i1', 'currentColor')}<path d="M40 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#i1)"/><path d="M25 165H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#i1)"/>
      <path class="draw" pathLength="100" d="M50 150C150 148 180 140 190 90S210 40 330 36" stroke="${C.rouge}" stroke-width="4"/>
      <path d="M190 165V90" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 4"/><circle class="pop" cx="190" cy="90" r="6" fill="${C.or}"/>
      ${T(230, 112, 'équivalence', `fill="${C.or}" font-size="12"`)}${T(190, 182, 'V', 'font-size="12"')}${T(22, 16, 'pH', 'font-size="12"')}${T(290, 154, 'volume versé V', 'font-size="11"')}`),
    redox: () => svg(360, 170, `${ARROW('r1', C.rouge)}<rect x="30" y="50" width="100" height="60" rx="10" fill="${C.bleu}" fill-opacity=".2" stroke="${C.bleu}" stroke-width="3"/><rect x="230" y="50" width="100" height="60" rx="10" fill="${C.or}" fill-opacity=".2" stroke="${C.or}" stroke-width="3"/>
      <path class="flow" d="M135 70H225" stroke="${C.rouge}" stroke-width="3" marker-end="url(#r1)" pathLength="100"/>${T(180, 62, 'e⁻', `fill="${C.rouge}" font-size="14"`)}
      ${T(80, 76, 'réducteur', 'font-size="12"')}${T(80, 96, 'cède des e⁻', 'font-size="11"')}${T(280, 76, 'oxydant', 'font-size="12"')}${T(280, 96, 'capte des e⁻', 'font-size="11"')}
      ${T(80, 134, 'oxydation', `fill="${C.bleu}" font-size="12"`)}${T(280, 134, 'réduction', `fill="${C.or}" font-size="12"`)}${T(180, 160, 'Ox + n e⁻ = Red', 'font-size="12"')}`),
    alcane: () => svg(360, 160, `${[0, 1, 2].map((i) => `<circle cx="${100 + i * 70}" cy="80" r="14" fill="${C.brand}" fill-opacity=".3" stroke="${C.brand}" stroke-width="3"/>${T(100 + i * 70, 85, 'C')}`).join('')}${L(114, 80, 156, 80)}${L(184, 80, 226, 80)}
      ${[[100, 40], [100, 120], [170, 40], [170, 120], [240, 40], [240, 120], [50, 80], [290, 80]].map(([x, y]) => `<circle class="pop" cx="${x}" cy="${y}" r="9" fill="${C.bleu}" fill-opacity=".4" stroke="${C.bleu}" stroke-width="2"/>${T(x, y + 4, 'H', 'font-size="10"')}`).join('')}
      ${L(100, 66, 100, 49, C.bleu, 2)}${L(100, 94, 100, 111, C.bleu, 2)}${L(170, 66, 170, 49, C.bleu, 2)}${L(170, 94, 170, 111, C.bleu, 2)}${L(240, 66, 240, 49, C.bleu, 2)}${L(240, 94, 240, 111, C.bleu, 2)}${L(59, 80, 86, 80, C.bleu, 2)}${L(254, 80, 281, 80, C.bleu, 2)}
      ${T(180, 156, 'propane C₃H₈ : CₙH₂ₙ₊₂, chaîne carbonée', 'font-size="12"')}`),
    asymptote: () => svg(360, 190, `${ARROW('a1', 'currentColor')}<path d="M40 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#a1)"/><path d="M25 165H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#a1)"/>
      <path d="M40 60H340" stroke="${C.rouge}" stroke-width="2.5" stroke-dasharray="6 5"/><path class="draw" pathLength="100" d="M60 160C90 100 130 75 180 66S280 61 335 60" stroke="${C.brand}" stroke-width="4"/>
      ${T(300, 48, 'y = ℓ (asymptote)', `fill="${C.rouge}" font-size="12"`)}${T(180, 186, 'lim f(x) = ℓ quand x → +∞', 'font-size="12"')}`),
    expo: () => svg(360, 190, `${ARROW('x1', 'currentColor')}<path d="M180 180V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#x1)"/><path d="M15 150H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#x1)"/>
      <path class="draw" pathLength="100" d="M30 146C100 144 150 138 190 120S270 60 320 14" stroke="${C.rouge}" stroke-width="4"/><circle class="pop" cx="180" cy="124" r="5" fill="${C.or}"/>
      ${T(215, 140, '(0 ; 1)', 'font-size="11"')}${T(290, 30, 'y = eˣ', `fill="${C.rouge}" font-size="14"`)}${T(90, 130, 'toujours &gt; 0', 'font-size="11"')}${T(180, 176, '(eˣ)′ = eˣ : croissante sur ℝ', 'font-size="11"')}`),
    lncourbe: () => svg(360, 190, `${ARROW('y1', 'currentColor')}<path d="M80 180V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#y1)"/><path d="M15 100H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#y1)"/>
      <path class="draw" pathLength="100" d="M84 175C96 130 130 100 160 80S250 45 330 30" stroke="${C.brand}" stroke-width="4"/><circle class="pop" cx="130" cy="100" r="5" fill="${C.or}"/>
      ${T(150, 118, '(1 ; 0)', 'font-size="11"')}${T(290, 24, 'y = ln x', `fill="${C.brand}" font-size="14"`)}${T(230, 176, 'définie pour x &gt; 0 · ln(ab) = ln a + ln b', 'font-size="11"')}`),
    aire: () => svg(360, 180, `${ARROW('z1', 'currentColor')}<path d="M30 160H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#z1)"/><path d="M30 160V10" stroke="currentColor" stroke-width="2.5"/>
      <path class="pulse" d="M90 160V100C130 60 190 50 250 90V160Z" fill="${C.bleu}" fill-opacity=".35" stroke="none"/><path d="M60 120C100 50 190 40 300 90" stroke="${C.brand}" stroke-width="4"/>
      <path d="M90 160V100M250 160V90" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 4"/>${T(90, 176, 'a', 'font-size="13"')}${T(250, 176, 'b', 'font-size="13"')}${T(170, 125, '∫ f(x) dx', 'font-size="14"')}${T(300, 80, 'f', `fill="${C.brand}" font-size="14"`)}`),
    binom: () => svg(360, 180, `${[0.04, 0.12, 0.21, 0.25, 0.19, 0.11, 0.05, 0.02].map((p, i) => `<rect class="pop" style="animation-delay:${i * 0.1}s" x="${34 + i * 38}" y="${150 - p * 450}" width="30" height="${p * 450}" fill="${C.bleu}" fill-opacity=".6" stroke="${C.bleu}" stroke-width="2"/>${T(49 + i * 38, 168, i, 'font-size="11"')}`).join('')}
      ${T(180, 14, 'loi binomiale B(n ; p) : nombre de succès k', 'font-size="12"')}${T(180, 178, 'P(X = k) = C(n,k) pᵏ (1 − p)ⁿ⁻ᵏ', 'font-size="11"')}`),
    espace: () => svg(360, 190, `${ARROW('b1', 'currentColor')}<path d="M180 120V12" stroke="currentColor" stroke-width="2.5" marker-end="url(#b1)"/><path d="M180 120L330 120" stroke="currentColor" stroke-width="2.5" marker-end="url(#b1)"/><path d="M180 120L70 175" stroke="currentColor" stroke-width="2.5" marker-end="url(#b1)"/>
      <path d="M180 120L250 60M250 60L250 120M250 120L220 135M220 135L220 87M220 87L250 60" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="4 4"/>
      <circle class="pop" cx="220" cy="87" r="6" fill="${C.rouge}"/>${T(194, 14, 'z', 'font-size="13"')}${T(330, 138, 'x', 'font-size="13"')}${T(66, 190, 'y', 'font-size="13"')}${T(262, 80, 'M(x ; y ; z)', `fill="${C.rouge}" font-size="12"`)}${T(250, 160, 'AB(xB − xA ;', 'font-size="11"')}${T(250, 176, 'yB − yA ; zB − zA)', 'font-size="11"')}`),
    projectile: () => svg(360, 180, `${ARROW('j1', C.rouge)}<path d="M20 160H340" stroke="currentColor" stroke-width="3"/><path class="dash" d="M40 160C100 40 200 40 320 160" stroke="${C.brand}" stroke-width="3"/>
      <circle class="pulse" cx="180" cy="55" r="9" fill="${C.or}"/><path d="M180 64V110" stroke="${C.rouge}" stroke-width="3.5" marker-end="url(#j1)"/>${T(205, 100, 'P', `fill="${C.rouge}" font-size="13"`)}
      ${T(70, 120, 'v₀', 'font-size="13"')}${T(180, 22, 'trajectoire parabolique : x(t) = v₀ cos α · t', 'font-size="11"')}${T(180, 176, 'y(t) = −½ g t² + v₀ sin α · t', 'font-size="11"')}`),
    kepler: () => svg(360, 180, `<ellipse cx="180" cy="90" rx="140" ry="65" stroke="${C.brand}" stroke-width="3"/><circle cx="125" cy="90" r="14" fill="${C.or}" fill-opacity=".8" stroke="${C.or}" stroke-width="2"/>
      <circle cx="320" cy="90" r="7" fill="${C.bleu}"/><circle class="pulse" cx="150" cy="156" r="7" fill="${C.bleu}"/>
      <path d="M125 90L150 156M125 90L180 155" stroke="${C.vert}" stroke-width="1.5"/>${T(125, 70, 'Soleil', 'font-size="11"')}${T(300, 118, 'planète', 'font-size="11"')}${T(180, 14, '3 lois de Kepler : orbite elliptique, aires égales, T² ∝ a³', 'font-size="11"')}`),
    rc: () => svg(360, 190, `${ARROW('c1', 'currentColor')}<path d="M40 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#c1)"/><path d="M25 165H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#c1)"/>
      <path d="M40 40H340" stroke="${C.rouge}" stroke-width="2" stroke-dasharray="6 5"/><path class="draw" pathLength="100" d="M40 165C80 80 130 52 200 44S300 40 335 40" stroke="${C.brand}" stroke-width="4"/>
      ${T(300, 30, 'E', `fill="${C.rouge}" font-size="13"`)}${T(240, 100, 'charge du condensateur', 'font-size="11"')}${T(240, 118, 'uC(t) = E (1 − e^(−t/τ))', 'font-size="11"')}${T(180, 186, 'τ = R × C : constante de temps', 'font-size="11"')}`),
    decroissance: () => svg(360, 190, `${ARROW('d1', 'currentColor')}<path d="M40 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#d1)"/><path d="M25 165H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#d1)"/>
      <path class="draw" pathLength="100" d="M40 30C90 90 130 125 190 142S290 160 335 163" stroke="${C.rouge}" stroke-width="4"/>
      <path d="M40 98H105M105 98V165M40 132H170M170 132V165" stroke="${C.gris}" stroke-width="1.5" stroke-dasharray="4 4"/>
      ${T(26, 30, 'N₀', 'font-size="11"')}${T(24, 100, 'N₀/2', 'font-size="10"')}${T(105, 180, 't½', 'font-size="12"')}${T(170, 180, '2 t½', 'font-size="12"')}${T(260, 70, 'N(t) = N₀ e^(−λt)', 'font-size="12"')}`),
    cinetique: () => svg(360, 190, `${ARROW('k1', 'currentColor')}<path d="M40 175V10" stroke="currentColor" stroke-width="2.5" marker-end="url(#k1)"/><path d="M25 165H345" stroke="currentColor" stroke-width="2.5" marker-end="url(#k1)"/>
      <path class="draw" pathLength="100" d="M40 30C90 90 130 125 190 142S290 160 335 163" stroke="${C.brand}" stroke-width="4"/><path class="dash" d="M50 55L150 140" stroke="${C.rouge}" stroke-width="3"/>
      ${T(26, 20, '[A]', 'font-size="12"')}${T(300, 154, 't', 'font-size="12"')}${T(250, 70, 'v = −d[A]/dt', 'font-size="12"')}${T(250, 90, 'pente de la tangente', `fill="${C.rouge}" font-size="11"`)}${T(250, 108, 'la vitesse diminue', 'font-size="11"')}`),
    equilibre: () => svg(360, 160, `${ARROW('q2', C.bleu)}<rect x="30" y="50" width="100" height="50" rx="10" fill="${C.bleu}" fill-opacity=".2" stroke="${C.bleu}" stroke-width="3"/><rect x="230" y="50" width="100" height="50" rx="10" fill="${C.or}" fill-opacity=".2" stroke="${C.or}" stroke-width="3"/>
      <path class="flow" d="M140 65H220" stroke="${C.bleu}" stroke-width="3" marker-end="url(#q2)" pathLength="100"/><path class="flow" d="M220 90H140" stroke="${C.or}" stroke-width="3" marker-end="url(#q2)" pathLength="100"/>
      ${T(80, 80, 'réactifs', 'font-size="13"')}${T(280, 80, 'produits', 'font-size="13"')}${T(180, 128, 'équilibre : vitesses égales dans les deux sens', 'font-size="11"')}${T(180, 148, 'Qr = K à l’équilibre', 'font-size="12"')}`),
    pka: () => svg(360, 150, `<rect x="20" y="50" width="150" height="26" fill="${C.rouge}" fill-opacity=".35"/><rect x="170" y="50" width="170" height="26" fill="${C.bleu}" fill-opacity=".35"/><path d="M170 40V86" stroke="currentColor" stroke-width="3"/>
      <circle class="pulse" cx="170" cy="63" r="7" fill="${C.or}"/>${T(95, 68, 'AH domine', 'font-size="13"')}${T(255, 68, 'A⁻ domine', 'font-size="13"')}${T(170, 28, 'pH = pKa', 'font-size="13"')}${T(95, 110, 'pH &lt; pKa', 'font-size="12"')}${T(255, 110, 'pH &gt; pKa', 'font-size="12"')}${T(180, 140, 'pH = pKa + log([A⁻] ÷ [AH])', 'font-size="12"')}`),
    ester: () => svg(360, 160, `${ARROW('s1', C.rouge)}${T(60, 60, 'acide', `fill="${C.rouge}" font-size="13"`)}${T(60, 78, 'carboxylique', 'font-size="11"')}${T(60, 108, '+ alcool', `fill="${C.bleu}" font-size="13"`)}
      <path class="flow" d="M115 85H215" stroke="currentColor" stroke-width="3" marker-end="url(#s1)" pathLength="100"/><path d="M215 100H115" stroke="currentColor" stroke-width="3"/>
      ${T(290, 66, 'ester', `fill="${C.vert}" font-size="13"`)}${T(290, 108, '+ eau', `fill="${C.bleu}" font-size="13"`)}${T(180, 148, 'estérification : réaction lente, limitée, réversible', 'font-size="11"')}`),
    ir: () => svg(360, 180, `${ARROW('f1', 'currentColor')}<path d="M30 160H340" stroke="currentColor" stroke-width="2.5"/><path class="draw" pathLength="100" d="M30 30H100L112 130L124 30H200L212 100L224 30H340" stroke="${C.brand}" stroke-width="3"/>
      ${T(112, 148, 'C=O', `fill="${C.rouge}" font-size="12"`)}${T(212, 148, 'O–H', `fill="${C.bleu}" font-size="12"`)}${T(180, 176, 'nombre d’onde σ (cm⁻¹)  ← 4000 … 1500', 'font-size="11"')}${T(180, 14, 'spectre IR : chaque liaison absorbe à son nombre d’onde', 'font-size="11"')}`),
    electrolyse: () => svg(360, 180, `<path d="M100 30V130A20 20 0 0 0 120 150H240A20 20 0 0 0 260 130V30" stroke="currentColor" stroke-width="3.5"/><rect x="100" y="80" width="160" height="68" fill="${C.bleu}" fill-opacity=".25" stroke="none"/>
      <path d="M150 10V120M210 10V120" stroke="${C.gris}" stroke-width="8"/>${T(150, 144, '−', `fill="${C.bleu}" font-size="18"`)}${T(210, 144, '+', `fill="${C.rouge}" font-size="18"`)}
      <circle class="pl" cx="144" cy="95" r="5" fill="${C.or}"/><circle class="pl" style="animation-delay:.5s" cx="214" cy="100" r="5" fill="${C.vert}"/>
      ${T(60, 70, 'cathode (−)', 'font-size="11"')}${T(60, 86, 'réduction', 'font-size="11"')}${T(300, 70, 'anode (+)', 'font-size="11"')}${T(300, 86, 'oxydation', 'font-size="11"')}${T(180, 172, 'électrolyse : réaction forcée par un générateur', 'font-size="11"')}`),
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
    { id: 'm5-litteral', subj: 'maths', level: '5e', icon: '🔤', title: 'Le calcul littéral et les équations',
      intro: 'Une lettre peut remplacer un nombre : c’est la clé pour écrire des formules et résoudre des problèmes.',
      steps: [
        S('Une expression littérale', 'Une <b>expression littérale</b> contient des lettres. Le périmètre d’un carré de côté c s’écrit <b>4 × c</b>, ou simplement <b>4c</b>. Si c = 3, alors 4c = 12.'),
        S('Réduire', 'On regroupe les termes de même nature : 3x + 5x = <b>8x</b>. Mais 3x + 5 ne se réduit pas, car ce ne sont pas les mêmes termes.'),
        S('La distributivité', 'On multiplie le facteur devant la parenthèse par chaque terme : <b>k × (a + b) = k × a + k × b</b>. Exemple : 3 × (x + 4) = 3x + 12.'),
        S('Résoudre une équation', 'Résoudre x + 3 = 8, c’est trouver la valeur de x. On fait la <b>même opération des deux côtés</b>, comme sur une balance : x = 8 − 3 = 5. On vérifie : 5 + 3 = 8.', 'balance'),
      ],
      recap: ['4c veut dire 4 × c.', 'On réduit les termes de même nature.', 'k(a + b) = ka + kb.', 'Une équation garde l’équilibre : même opération des deux côtés.'],
      quiz: [Q('3x + 5x = ?', ['8x', '8x²', '15x'], 0), Q('Solution de x + 6 = 10 :', ['x = 4', 'x = 16', 'x = 6'], 0)] },

    { id: 'm5-statistiques', subj: 'maths', level: '5e', icon: '📊', title: 'Les statistiques',
      intro: 'Pour comprendre une série de données (notes, tailles, ventes), on la résume avec quelques nombres et un diagramme.',
      steps: [
        S('Effectif et fréquence', 'L’<b>effectif</b> d’une valeur est le nombre de fois où elle apparaît. La <b>fréquence</b> est l’effectif divisé par l’effectif total. Si 6 élèves sur 30 ont 12, la fréquence de 12 est 6 ÷ 30 = 0,2, soit 20 %.'),
        S('Le diagramme en barres', 'Chaque valeur a une barre dont la hauteur représente son effectif. On lit tout de suite la valeur la plus fréquente.', 'stats'),
        S('La moyenne', 'La <b>moyenne</b> est la somme des valeurs divisée par leur nombre. Notes : 10, 12, 14. Moyenne = (10 + 12 + 14) ÷ 3 = 12.'),
        S('L’étendue', 'L’<b>étendue</b> est la différence entre la plus grande et la plus petite valeur. Notes de 6 à 17 : étendue = 17 − 6 = 11.'),
      ],
      recap: ['Fréquence = effectif ÷ effectif total.', 'Moyenne = somme ÷ nombre de valeurs.', 'Étendue = plus grande − plus petite.'],
      quiz: [Q('Moyenne de 8, 10 et 12 :', ['9', '10', '12'], 1), Q('Étendue de la série 4, 9, 15 :', ['11', '15', '19'], 0)] },

    { id: 'm5-probabilites', subj: 'maths', level: '5e', icon: '🎲', title: 'Les probabilités',
      intro: 'On ne peut pas prévoir le résultat d’un lancer de dé, mais on peut mesurer ses chances.',
      steps: [
        S('Une expérience aléatoire', 'Une expérience est <b>aléatoire</b> quand on connaît tous les résultats possibles mais pas celui qui sortira : un dé, une pièce, une urne.'),
        S('Calculer une probabilité', 'Si tous les résultats ont la même chance : <b>probabilité = nombre de cas favorables ÷ nombre de cas possibles</b>. Dans l’urne : 4 boules rouges sur 7, donc P(rouge) = 4 ÷ 7.', 'urne'),
        S('Entre 0 et 1', 'Une probabilité est toujours un nombre <b>entre 0 et 1</b>. 0 : événement impossible. 1 : événement certain. Un dé à 6 faces donne P(6) = 1 ÷ 6.'),
        S('L’événement contraire', 'La probabilité qu’un événement n’arrive pas vaut <b>1 − sa probabilité</b>. Si P(pluie) = 0,3, alors P(pas de pluie) = 0,7.'),
      ],
      recap: ['P = cas favorables ÷ cas possibles.', '0 ≤ P ≤ 1.', 'P(contraire) = 1 − P.'],
      quiz: [Q('Un dé : probabilité d’obtenir un nombre pair ?', ['1/6', '1/2', '1/3'], 1), Q('Une probabilité peut valoir :', ['1,5', '−0,2', '0,8'], 2)] },

    { id: 'm5-angles', subj: 'maths', level: '5e', icon: '📐', title: 'Angles et droites parallèles',
      intro: 'Quand une droite en coupe deux autres, les angles formés obéissent à des règles précises.',
      steps: [
        S('Angles opposés par le sommet', 'Quand deux droites se coupent, les angles <b>opposés par le sommet</b> sont égaux.'),
        S('Angles alternes-internes', 'Une droite coupe deux autres droites. Les angles placés de part et d’autre de la sécante, à l’intérieur, sont <b>alternes-internes</b>. Si les deux droites sont parallèles, ils sont égaux.', 'alternes'),
        S('Angles correspondants', 'Les angles situés du même côté de la sécante, l’un en haut et l’autre en bas, sont <b>correspondants</b>. Ils sont égaux si les droites sont parallèles.'),
        S('Démontrer le parallélisme', 'La règle marche aussi dans l’autre sens : si deux angles alternes-internes sont égaux, alors les droites sont <b>parallèles</b>.'),
      ],
      recap: ['Opposés par le sommet : égaux.', 'Droites parallèles : alternes-internes égaux.', 'Droites parallèles : correspondants égaux.'],
      quiz: [Q('Deux droites parallèles, un angle alterne-interne de 55°. L’autre mesure :', ['35°', '55°', '125°'], 1), Q('Des angles opposés par le sommet sont :', ['égaux', 'complémentaires'], 0)] },

    { id: 'm5-prismes', subj: 'maths', level: '5e', icon: '🧊', title: 'Prismes et cylindres',
      intro: 'Une boîte, un tube, une canette : ces solides s’étudient avec leurs faces et leur patron.',
      steps: [
        S('Le prisme droit', 'Un <b>prisme droit</b> a deux bases identiques et parallèles, reliées par des faces rectangulaires. Un pavé droit est un prisme dont la base est un rectangle.', 'prisme'),
        S('Le cylindre', 'Un <b>cylindre de révolution</b> a deux bases qui sont des disques identiques, et une surface latérale courbe. Une canette est un cylindre.'),
        S('Le patron', 'Le <b>patron</b> est la figure plane qui, pliée, donne le solide. Le patron d’un cylindre est un rectangle entouré de deux disques. Le rectangle a pour longueur le périmètre du disque.'),
        S('Compter les faces', 'Un prisme dont la base a n côtés possède n + 2 faces : le prisme à base triangulaire a 5 faces, le pavé en a 6.'),
      ],
      recap: ['Prisme : deux bases identiques + faces rectangulaires.', 'Cylindre : deux disques + une surface courbe.', 'Patron : le solide « déplié ».'],
      quiz: [Q('Combien de faces a un prisme à base triangulaire ?', ['4', '5', '6'], 1), Q('Les bases d’un cylindre sont :', ['des carrés', 'des disques'], 1)] },

    { id: 'm5-algo', subj: 'maths', level: '5e', icon: '💻', title: 'Algorithmes et programmation',
      intro: 'Un programme, c’est une recette : des instructions simples, dans le bon ordre.',
      steps: [
        S('Une suite d’instructions', 'Un <b>algorithme</b> est une suite d’instructions à exécuter dans l’ordre pour obtenir un résultat. Une recette de cuisine en est un bon exemple.', 'algo'),
        S('Les variables', 'Une <b>variable</b> est une boîte qui contient une valeur et qui porte un nom. Par exemple, <b>score = 0</b>, puis <b>score = score + 1</b> : la valeur passe à 1.'),
        S('Répéter', 'Au lieu de recopier la même instruction, on utilise une <b>boucle</b> : « répéter 4 fois : avancer de 50 puis tourner de 90° » trace un carré.'),
        S('Tester une condition', 'Avec <b>si… alors… sinon…</b>, le programme choisit : « si score &gt; 10 alors afficher Gagné, sinon afficher Perdu ». Dans Scratch, on assemble ces blocs.'),
      ],
      recap: ['Un algorithme respecte un ordre.', 'Une variable contient une valeur.', 'Une boucle répète.', '« Si… alors… sinon » permet de choisir.'],
      quiz: [Q('Pour tracer un carré, on répète 4 fois : avancer puis tourner de…', ['45°', '90°', '180°'], 1), Q('score = 3 puis score = score + 2. Le score vaut :', ['3', '2', '5'], 2)] },

    /* -------------------------------------------------------------- PHYSIQUE (suite) */
    { id: 'p5-son', subj: 'physique', level: '5e', icon: '🔊', title: 'Le son',
      intro: 'Une voix, une guitare, un tonnerre : tout son vient d’un objet qui vibre.',
      steps: [
        S('La source vibre', 'Un son est produit par un objet qui <b>vibre</b> : la corde d’une guitare, la peau d’un tambour, les cordes vocales. On peut sentir la vibration en touchant sa gorge en parlant.'),
        S('Il se propage', 'La vibration se transmet de proche en proche dans la matière : l’air, l’eau, un solide. C’est un <b>milieu matériel</b>. Dans le <b>vide</b>, le son ne se propage pas : dans l’espace, c’est le silence.', 'son'),
        S('La vitesse du son', 'Dans l’air, le son va à environ <b>340 m/s</b>. C’est bien plus lent que la lumière. Pendant un orage, on voit l’éclair avant d’entendre le tonnerre : 3 secondes de retard, c’est environ 1 kilomètre.'),
        S('Fort ou aigu', 'Un son plus ou moins <b>fort</b> dépend de l’amplitude de la vibration. Un son plus ou moins <b>aigu</b> dépend de sa fréquence, en hertz (Hz). L’oreille humaine entend de 20 Hz à 20 000 Hz.'),
      ],
      recap: ['Son = vibration.', 'Il lui faut un milieu matériel : pas de son dans le vide.', 'Dans l’air : environ 340 m/s.', 'Fort = grande amplitude, aigu = haute fréquence.'],
      quiz: [Q('Le son se propage dans :', ['le vide', 'l’air'], 1), Q('Une corde qui vibre plus vite donne un son plus :', ['grave', 'aigu'], 1)] },

    { id: 'p5-energie', subj: 'physique', level: '5e', icon: '🔋', title: 'L’énergie et ses conversions',
      intro: 'Pour rouler, s’éclairer ou chauffer, il faut de l’énergie. Elle ne disparaît pas : elle change de forme.',
      steps: [
        S('Des sources d’énergie', 'Les sources d’énergie sont le soleil, le vent, l’eau, le pétrole, le gaz, le charbon, l’uranium, le bois. Certaines sont <b>renouvelables</b>, comme le soleil et le vent. Les énergies <b>fossiles</b> (pétrole, gaz, charbon) s’épuisent.'),
        S('Des formes d’énergie', 'L’énergie existe sous plusieurs formes : <b>chimique</b> (aliments, pile), <b>électrique</b>, <b>lumineuse</b>, <b>thermique</b> (chaleur), <b>mécanique</b> (mouvement).'),
        S('Les conversions', 'Un objet convertit une forme d’énergie en une autre. Un panneau solaire transforme l’énergie lumineuse en énergie électrique. Une lampe transforme l’électrique en lumineuse et en chaleur.', 'energie'),
        S('Elle se conserve', 'On ne crée ni ne détruit l’énergie : elle est seulement <b>transformée</b> ou <b>transférée</b>. On l’exprime en joules (J).'),
      ],
      recap: ['Il y a des sources renouvelables et des sources fossiles.', 'Formes : chimique, électrique, lumineuse, thermique, mécanique.', 'L’énergie se convertit, elle se conserve.'],
      quiz: [Q('Une énergie renouvelable :', ['le pétrole', 'le vent'], 1), Q('Un panneau solaire convertit :', ['lumière → électricité', 'électricité → lumière'], 0)] },

    { id: 'p5-forces', subj: 'physique', level: '5e', icon: '🏋️', title: 'Les forces et les interactions',
      intro: 'Pousser, tirer, tomber : quand deux objets agissent l’un sur l’autre, on parle d’interaction.',
      steps: [
        S('Une interaction', 'Quand un objet agit sur un autre, ils sont en <b>interaction</b>. Un footballeur pousse le ballon, et le ballon agit aussi sur le pied. L’interaction peut se faire à <b>distance</b> (aimant, gravité) ou par <b>contact</b>.'),
        S('Une force, c’est un vecteur', 'On représente une <b>force</b> par une flèche. Elle est décrite par quatre éléments : son <b>point d’application</b>, sa <b>direction</b>, son <b>sens</b> et sa <b>valeur</b>, en newtons (N).', 'force'),
        S('Le poids', 'Le <b>poids</b> d’un objet est la force avec laquelle la Terre l’attire. Il est vertical et dirigé vers le bas. La <b>masse</b> (en kg) ne change pas selon le lieu, mais le poids change : sur la Lune, il est six fois plus faible.'),
        S('Les effets d’une force', 'Une force peut <b>mettre en mouvement</b>, <b>arrêter</b>, changer la <b>trajectoire</b> ou <b>déformer</b> un objet.'),
      ],
      recap: ['Interaction : à distance ou par contact.', 'Force : point, direction, sens, valeur (en N).', 'Poids : vertical, vers le bas.', 'Masse ≠ poids.'],
      quiz: [Q('Une force se mesure en :', ['kilogrammes', 'newtons'], 1), Q('Le poids est dirigé :', ['vers le haut', 'vers le bas'], 1)] },

    { id: 'p5-terre-lune', subj: 'physique', level: '5e', icon: '🌙', title: 'La Terre, le Soleil et la Lune',
      intro: 'La Lune change de forme au fil du mois. Pourtant, elle est toujours à moitié éclairée.',
      steps: [
        S('Une source et des objets éclairés', 'Le Soleil est une <b>source primaire</b> : il produit sa lumière. La Terre et la Lune sont des objets <b>éclairés</b> : ils renvoient la lumière du Soleil. À chaque instant, la moitié de leur surface qui est tournée vers le Soleil est éclairée.', 'lune'),
        S('La Lune tourne autour de la Terre', 'La Lune fait le tour de la Terre en environ <b>27 jours</b>, et un mois lunaire dure environ 29 jours et demi. Selon sa position, on voit une partie différente de sa face éclairée : ce sont les <b>phases</b>.'),
        S('Les phases', 'Nouvelle lune : on ne la voit pas. Premier quartier, pleine lune, dernier quartier : on voit de plus en plus, puis de moins en moins, de sa face éclairée. Le cycle se répète.'),
        S('Les éclipses', 'Une <b>éclipse de Lune</b> a lieu quand la Lune passe dans l’ombre de la Terre. Une <b>éclipse de Soleil</b> a lieu quand la Lune passe entre le Soleil et nous et cache le Soleil.'),
      ],
      recap: ['Le Soleil produit de la lumière.', 'La Lune la renvoie : elle est toujours à moitié éclairée.', 'Les phases viennent de sa position autour de la Terre.', 'Éclipse = alignement des trois astres.'],
      quiz: [Q('Quelle source produit sa propre lumière ?', ['la Lune', 'le Soleil'], 1), Q('Éclipse de Soleil : c’est la … qui cache le Soleil.', ['Lune', 'Terre'], 0)] },

    { id: 'p5-lumiere-vision', subj: 'physique', level: '5e', icon: '👁️', title: 'La lumière et la vision',
      intro: 'On voit un objet parce que de la lumière qui vient de lui entre dans notre œil.',
      steps: [
        S('Source ou objet diffusant', 'Une <b>source</b> produit de la lumière (Soleil, lampe). Un <b>objet diffusant</b>, comme ce livre, renvoie dans toutes les directions la lumière qu’il reçoit. Dans le noir, on ne voit pas ce qui n’est pas éclairé.'),
        S('Voir', 'On voit un objet quand la lumière qu’il envoie, directement ou après diffusion, <b>entre dans notre œil</b>. La lumière se propage en ligne droite.', 'oeil'),
        S('Une vitesse énorme', 'La lumière va à environ <b>300 000 km/s</b> dans le vide ou dans l’air. Elle fait le tour de la Terre en une fraction de seconde. La lumière du Soleil met environ 8 minutes à nous parvenir.'),
        S('L’année-lumière', 'Pour mesurer les distances dans l’espace, on utilise l’<b>année-lumière</b> : c’est la distance que parcourt la lumière en un an, environ 9 500 milliards de kilomètres.'),
      ],
      recap: ['On voit quand la lumière entre dans l’œil.', 'Elle se propage en ligne droite.', '300 000 km/s.', 'Année-lumière = unité de distance.'],
      quiz: [Q('La lumière se propage :', ['en ligne droite', 'en zigzag'], 0), Q('L’année-lumière est une unité de :', ['temps', 'distance'], 1)] },

    /* ---------------------------------------------------------------- CHIMIE (suite) */
    { id: 'c5-air', subj: 'chimie', level: '5e', icon: '🌬️', title: 'L’air qui nous entoure',
      intro: 'On ne le voit pas, mais l’air est de la matière. Il a une masse et il est un mélange de gaz.',
      steps: [
        S('L’air est de la matière', 'L’air a une <b>masse</b> : un litre d’air pèse environ 1,3 g. Il occupe un volume, il se comprime dans une seringue fermée et il s’échappe d’un ballon qui se dégonfle.'),
        S('Sa composition', 'L’air est un <b>mélange</b> d’environ <b>78 % de diazote</b>, <b>21 % de dioxygène</b>, et d’un peu d’autres gaz, dont la vapeur d’eau et le dioxyde de carbone.', 'air'),
        S('Le dioxygène', 'Le <b>dioxygène</b> est nécessaire à la respiration et à la <b>combustion</b>. Une bougie couverte d’un verre s’éteint quand le dioxygène est consommé.'),
        S('Tester le dioxyde de carbone', 'Le <b>dioxyde de carbone</b> trouble l’<b>eau de chaux</b>. Il se forme lors d’une combustion et de la respiration : en soufflant dans l’eau de chaux avec une paille, elle devient laiteuse.'),
      ],
      recap: ['L’air a une masse.', 'Environ 78 % de diazote et 21 % de dioxygène.', 'Le dioxygène permet la combustion.', 'Le dioxyde de carbone trouble l’eau de chaux.'],
      quiz: [Q('Le gaz le plus abondant dans l’air est :', ['le diazote', 'le dioxygène'], 0), Q('Quel gaz trouble l’eau de chaux ?', ['le dioxygène', 'le dioxyde de carbone'], 1)] },

    { id: 'c5-conservation', subj: 'chimie', level: '5e', icon: '⚖️', title: 'Conservation de la masse et du volume',
      intro: 'Quand un glaçon fond, que devient sa masse ? Et son volume ?',
      steps: [
        S('La masse se conserve', 'Lors d’un <b>changement d’état</b>, la masse ne change pas. 50 g de glace qui fond donnent 50 g d’eau liquide. On n’a rien perdu : les particules sont les mêmes.', 'conservation'),
        S('Le volume peut changer', 'Le <b>volume</b>, lui, peut changer : l’eau qui gèle <b>augmente</b> de volume. C’est pour cela qu’une bouteille pleine d’eau peut éclater au congélateur.'),
        S('Après un mélange', 'Quand on mélange deux liquides ou qu’on dissout un solide, la <b>masse totale</b> est la somme des masses : 100 g d’eau + 5 g de sucre font 105 g. Les <b>volumes</b> ne s’additionnent pas toujours exactement.'),
        S('Un contre-exemple apparent', 'Une bougie qui brûle perd de la masse : en réalité, la cire est devenue des gaz qui s’échappent dans l’air. Si on les recueillait, la masse serait conservée.'),
      ],
      recap: ['La masse se conserve lors d’un changement d’état.', 'Le volume peut varier.', 'Mélange : on additionne les masses.'],
      quiz: [Q('120 g de glace fondent. L’eau obtenue pèse :', ['100 g', '120 g', '140 g'], 1), Q('Quand l’eau gèle, son volume :', ['diminue', 'augmente'], 1)] },

    { id: 'c5-eau', subj: 'chimie', level: '5e', icon: '🚰', title: 'L’eau : potable ou pure ?',
      intro: 'Une eau limpide est-elle forcément pure ? Pas du tout : l’eau du robinet est un mélange.',
      steps: [
        S('Eau pure et eau potable', 'L’<b>eau pure</b> ne contient que des molécules d’eau (H₂O). L’<b>eau potable</b> peut être bue sans danger : elle contient des sels minéraux en petite quantité, c’est donc un mélange.', 'goutte'),
        S('Le trajet de l’eau', 'Pour rendre l’eau potable, on la <b>filtre</b>, on la fait décanter, puis on la <b>désinfecte</b> (souvent au chlore) avant de la distribuer.'),
        S('Reconnaître l’eau', 'Le <b>sulfate de cuivre anhydre</b>, blanc, devient <b>bleu</b> en présence d’eau. L’eau pure bout à 100 °C et gèle à 0 °C. Ce sont des tests sûrs.'),
        S('Préserver l’eau', 'L’eau douce est une ressource limitée. On la préserve en évitant le gaspillage et en ne polluant pas les rivières.'),
      ],
      recap: ['Eau pure = seulement H₂O.', 'Eau potable = mélange sans danger.', 'Le sulfate de cuivre blanc bleuit au contact de l’eau.'],
      quiz: [Q('Le sulfate de cuivre anhydre devient … en présence d’eau.', ['rouge', 'bleu'], 1), Q('L’eau du robinet est :', ['de l’eau pure', 'un mélange'], 1)] },
    /* ================================================================ 4e : MATHS */
    { id: 'm4-relatifs', subj: 'maths', level: '4e', icon: '✖️', title: 'Multiplier et diviser des relatifs',
      intro: 'En 5e on a appris à additionner les nombres relatifs. Voici comment les multiplier et les diviser.',
      steps: [
        S('La règle des signes', 'Le produit de deux nombres de <b>même signe</b> est <b>positif</b>. Le produit de deux nombres de <b>signes différents</b> est <b>négatif</b>. (−3) × (−4) = +12 et (−3) × (+4) = −12.'),
        S('Plusieurs facteurs', 'Pour un produit de plusieurs facteurs, on compte les facteurs négatifs. Un <b>nombre pair</b> de facteurs négatifs donne un résultat positif, un nombre impair donne un résultat négatif. (−2) × (−5) × (−1) = −10.'),
        S('La division', 'La division suit la même règle des signes : (−12) ÷ (−4) = +3 et (−12) ÷ (+4) = −3. On ne peut jamais diviser par <b>0</b>.'),
        S('Soustraire', 'Soustraire un nombre, c’est <b>ajouter son opposé</b> : 5 − (−3) = 5 + 3 = 8 et (−2) − (+6) = (−2) + (−6) = −8.', 'droite'),
      ],
      recap: ['Même signe : produit positif.', 'Signes différents : produit négatif.', 'Soustraire = ajouter l’opposé.', 'On ne divise jamais par 0.'],
      quiz: [Q('(−7) × (−2) = ?', ['−14', '+14', '−9'], 1), Q('4 − (−5) = ?', ['−1', '9', '−9'], 1)] },

    { id: 'm4-fractions', subj: 'maths', level: '4e', icon: '🍰', title: 'Multiplier et diviser des fractions',
      intro: 'Prendre la moitié d’un tiers de gâteau, c’est multiplier des fractions.',
      steps: [
        S('Le produit', 'Pour multiplier deux fractions, on multiplie les numérateurs entre eux et les dénominateurs entre eux : ' + F(2, 3) + ' × ' + F(4, 5) + ' = ' + F(8, 15) + '.'),
        S('Simplifier d’abord', 'On peut simplifier avant de multiplier : ' + F(3, 4) + ' × ' + F(8, 9) + ' = ' + F(24, 36) + ' = ' + F(2, 3) + '. On a divisé par 12.'),
        S('L’inverse', 'Deux nombres sont <b>inverses</b> si leur produit vaut 1. L’inverse de ' + F(2, 5) + ' est ' + F(5, 2) + '. Le nombre 0 n’a pas d’inverse.'),
        S('La division', 'Diviser par une fraction, c’est <b>multiplier par son inverse</b> : ' + F(3, 4) + ' ÷ ' + F(2, 5) + ' = ' + F(3, 4) + ' × ' + F(5, 2) + ' = ' + F(15, 8) + '.'),
      ],
      recap: ['Produit : numérateur × numérateur, dénominateur × dénominateur.', 'On simplifie pour calculer plus facilement.', 'Diviser = multiplier par l’inverse.'],
      quiz: [Q('1/2 × 1/3 = ?', ['1/5', '1/6', '2/3'], 1), Q('L’inverse de 3/7 est :', ['7/3', '−3/7', '3/7'], 0)] },

    { id: 'm4-puissances', subj: 'maths', level: '4e', icon: '🔢', title: 'Les puissances',
      intro: 'Écrire 2 × 2 × 2 × 2 × 2 devient 2⁵. Les puissances raccourcissent les calculs avec de très grands ou de très petits nombres.',
      steps: [
        S('Définition', 'Pour un nombre a et un entier positif n, <b>aⁿ = a × a × … × a</b> (n facteurs). Ainsi 2⁵ = 2 × 2 × 2 × 2 × 2 = 32 et 10³ = 1 000. Exposant 0 : a⁰ = 1.', 'puissances'),
        S('Les puissances de 10', '10² = 100, 10⁶ = 1 000 000. Pour un exposant négatif : 10⁻² = 0,01 et 10⁻³ = 0,001. L’exposant indique le nombre de zéros, ou de décimales.'),
        S('Produit et quotient', 'Pour un même nombre : <b>aᵐ × aⁿ = aᵐ⁺ⁿ</b> et <b>aᵐ ÷ aⁿ = aᵐ⁻ⁿ</b>. Exemple : 10³ × 10⁴ = 10⁷ et 10⁵ ÷ 10² = 10³.'),
        S('Notation scientifique', 'Un nombre est en <b>notation scientifique</b> s’il s’écrit a × 10ⁿ avec 1 ≤ a &lt; 10. La distance Terre-Soleil, 150 000 000 km, s’écrit 1,5 × 10⁸ km.'),
      ],
      recap: ['aⁿ = n facteurs égaux à a.', 'a⁰ = 1.', '10ⁿ ajoute n zéros.', 'Notation scientifique : a × 10ⁿ avec 1 ≤ a &lt; 10.'],
      quiz: [Q('2⁴ = ?', ['8', '16', '6'], 1), Q('10³ × 10² = ?', ['10⁵', '10⁶', '100⁵'], 0)] },

    { id: 'm4-equations', subj: 'maths', level: '4e', icon: '⚖️', title: 'Développer et résoudre une équation',
      intro: 'Une équation est une égalité avec une inconnue. Résoudre, c’est trouver la valeur qui la rend vraie.',
      steps: [
        S('Développer', 'Développer, c’est transformer un produit en somme : <b>k × (a + b) = k × a + k × b</b>. Exemple : 3 × (x − 2) = 3x − 6.'),
        S('L’équation ax + b = c', 'On isole x en défaisant les opérations : pour 2x + 3 = 11, on soustrait 3 : 2x = 8, puis on divise par 2 : <b>x = 4</b>. On a fait la même chose des deux côtés.', 'balance'),
        S('Vérifier', 'On remplace x par la valeur trouvée : 2 × 4 + 3 = 11, c’est juste. Une solution se vérifie toujours.'),
        S('Mettre en équation', 'Un problème : « J’ai pensé à un nombre, je le double et j’ajoute 5. Je trouve 17. » On pose 2x + 5 = 17, donc 2x = 12 et <b>x = 6</b>.'),
      ],
      recap: ['k(a + b) = ka + kb.', 'Même opération des deux côtés.', 'On vérifie la solution.'],
      quiz: [Q('Solution de 3x − 6 = 9 :', ['x = 1', 'x = 5', 'x = 15'], 1), Q('3 × (x + 2) = ?', ['3x + 2', '3x + 6', 'x + 6'], 1)] },

    { id: 'm4-pythagore', subj: 'maths', level: '4e', icon: '📏', title: 'Le théorème de Pythagore',
      intro: 'Dans un triangle rectangle, une relation relie les trois côtés. Elle permet de calculer une longueur sans la mesurer.',
      steps: [
        S('L’énoncé', 'Dans un triangle rectangle, le carré de l’<b>hypoténuse</b> (le côté opposé à l’angle droit) est égal à la <b>somme des carrés</b> des deux autres côtés. Pour ABC rectangle en B : <b>AC² = AB² + BC²</b>.', 'pythagore'),
        S('Calculer l’hypoténuse', 'Si AB = 3 cm et BC = 4 cm : AC² = 9 + 16 = 25, donc AC = 5 cm, car 5 × 5 = 25.'),
        S('Calculer un côté', 'Si AC = 13 cm et AB = 5 cm : BC² = AC² − AB² = 169 − 25 = 144, donc BC = 12 cm.'),
        S('La réciproque', 'Si dans un triangle, le carré du plus grand côté est égal à la somme des carrés des deux autres, alors ce triangle est <b>rectangle</b>. Un triangle 6, 8 et 10 : 36 + 64 = 100, il est rectangle.'),
      ],
      recap: ['AC² = AB² + BC², AC étant l’hypoténuse.', 'L’hypoténuse est le plus grand côté.', 'La réciproque permet de prouver un angle droit.'],
      quiz: [Q('Triangle rectangle de côtés 6 et 8 : l’hypoténuse mesure', ['10', '14', '12'], 0), Q('Un triangle de côtés 5, 12 et 13 est-il rectangle ?', ['Oui', 'Non'], 0)] },

    { id: 'm4-cosinus', subj: 'maths', level: '4e', icon: '📐', title: 'Le cosinus d’un angle',
      intro: 'Avec un angle et un côté d’un triangle rectangle, le cosinus donne les autres longueurs.',
      steps: [
        S('Définition', 'Dans un triangle rectangle, pour un angle aigu α : <b>cos α = côté adjacent ÷ hypoténuse</b>. Le côté adjacent est celui qui touche l’angle α sans être l’hypoténuse.', 'cosinus'),
        S('Valeurs', 'Le cosinus d’un angle aigu est un nombre entre 0 et 1, car l’hypoténuse est le plus grand côté. Par exemple, cos 60° = 0,5 et cos 0° = 1.'),
        S('Calculer une longueur', 'Avec un angle de 60° et une hypoténuse de 10 cm : adjacent = 10 × cos 60° = 10 × 0,5 = 5 cm.'),
        S('Calculer un angle', 'Avec adjacent 4 cm et hypoténuse 8 cm : cos α = 4 ÷ 8 = 0,5, donc α = 60°. On trouve l’angle avec la touche « cos⁻¹ » de la calculatrice.'),
      ],
      recap: ['cos α = adjacent ÷ hypoténuse.', 'Le cosinus est entre 0 et 1.', 'Calculatrice : cos et cos⁻¹.'],
      quiz: [Q('cos α = 0,5 : l’adjacent vaut … fois l’hypoténuse.', ['la moitié', 'le double'], 0), Q('Adjacent 3 cm et hypoténuse 6 cm. cos α = ?', ['2', '0,5', '3'], 1)] },

    { id: 'm4-translation', subj: 'maths', level: '4e', icon: '➡️', title: 'La translation',
      intro: 'Faire glisser une figure sans la tourner : c’est une translation.',
      steps: [
        S('Définition', 'Une <b>translation</b> fait glisser une figure : tous les points se déplacent dans la <b>même direction</b>, dans le <b>même sens</b> et de la <b>même longueur</b>.', 'translation'),
        S('Construire l’image', 'Pour un point A, on se donne le déplacement (une flèche). Son image A’ est obtenue en reportant cette flèche à partir de A. Si B’ est l’image de B, alors ABB’A’ est un parallélogramme.'),
        S('Ce qui est conservé', 'La translation conserve les <b>longueurs</b>, les <b>angles</b>, les <b>aires</b> et le <b>parallélisme</b>. L’image d’une droite est une droite parallèle.'),
        S('Dans la vie', 'Un ascenseur, un tiroir, une porte coulissante : tous ces mouvements sont des translations.'),
      ],
      recap: ['Même direction, même sens, même longueur.', 'Longueurs, angles, aires conservés.', 'La droite et son image sont parallèles.'],
      quiz: [Q('L’image d’une droite par une translation est :', ['une droite parallèle', 'une droite perpendiculaire'], 0), Q('Une translation conserve :', ['les longueurs', 'seulement les angles'], 0)] },

    { id: 'm4-pyramide-cone', subj: 'maths', level: '4e', icon: '🔺', title: 'Pyramides et cônes',
      intro: 'Une pyramide, un cône : des solides qui se terminent en pointe. Comment calculer leur volume ?',
      steps: [
        S('La pyramide', 'Une <b>pyramide</b> a une base (un polygone) et des faces latérales triangulaires qui se rejoignent en un sommet. La <b>hauteur</b> est la distance du sommet à la base.', 'pyramide'),
        S('Le volume d’une pyramide', '<b>V = ⅓ × aire de la base × hauteur</b>. Base carrée de 6 cm de côté et hauteur 5 cm : V = 36 × 5 ÷ 3 = 60 cm³.'),
        S('Le cône', 'Un <b>cône de révolution</b> a pour base un disque et se termine en pointe. Son volume est aussi <b>⅓ × aire de la base × hauteur</b>.'),
        S('Comparer', 'Une pyramide a le tiers du volume du prisme de même base et de même hauteur. Il faut trois pyramides pour remplir un prisme.'),
      ],
      recap: ['Pyramide et cône : V = ⅓ × aire de la base × h.', 'Un tiers du volume du prisme de même base et même hauteur.'],
      quiz: [Q('Pyramide : base de 12 cm², hauteur 5 cm. V = ?', ['20 cm³', '60 cm³', '30 cm³'], 0), Q('La base d’un cône est :', ['un disque', 'un carré'], 0)] },

    { id: 'm4-droites', subj: 'maths', level: '4e', icon: '🔻', title: 'Les droites remarquables du triangle',
      intro: 'Dans un triangle, certaines droites ont des propriétés particulières : médianes, hauteurs, médiatrices, bissectrices.',
      steps: [
        S('Les médianes', 'Une <b>médiane</b> relie un sommet au milieu du côté opposé. Les trois médianes se coupent en un point, le <b>centre de gravité</b> G.', 'mediane'),
        S('Les hauteurs', 'Une <b>hauteur</b> passe par un sommet et est perpendiculaire au côté opposé. Les trois hauteurs se coupent au point appelé <b>orthocentre</b>.'),
        S('Les médiatrices', 'La <b>médiatrice</b> d’un segment est la droite perpendiculaire au segment, en son milieu. Ses points sont à égale distance des extrémités. Les trois médiatrices se coupent au centre du <b>cercle circonscrit</b>.'),
        S('Les bissectrices', 'La <b>bissectrice</b> d’un angle le partage en deux angles égaux. Les trois bissectrices se coupent au centre du <b>cercle inscrit</b>.'),
      ],
      recap: ['Médiane : sommet vers milieu.', 'Hauteur : perpendiculaire au côté.', 'Médiatrice : perpendiculaire en son milieu.', 'Bissectrice : partage l’angle en deux.'],
      quiz: [Q('Les trois médiatrices se coupent au centre :', ['du cercle circonscrit', 'du cercle inscrit'], 0), Q('Une médiane passe par :', ['le milieu du côté opposé', 'le pied de la hauteur'], 0)] },

    /* ================================================================ 4e : PHYSIQUE */
    { id: 'p4-intensite', subj: 'physique', level: '4e', icon: '🔌', title: 'L’intensité du courant',
      intro: 'Plus ou moins de courant dans un fil : cette quantité se mesure, avec un ampèremètre.',
      steps: [
        S('Le courant électrique', 'Dans un métal, le courant électrique est un déplacement d’<b>électrons</b> libres. Ils circulent de la borne − vers la borne + de la pile. Le sens conventionnel du courant va de + vers −.'),
        S('L’intensité', 'L’<b>intensité</b> du courant (notée I) mesure la quantité d’électricité qui passe chaque seconde. Son unité est l’<b>ampère</b> (A). Un milliampère : 1 mA = 0,001 A.'),
        S('Mesurer avec l’ampèremètre', 'L’<b>ampèremètre</b> se branche <b>en série</b> dans le circuit : le courant le traverse. On choisit d’abord le plus grand calibre, puis on le diminue.', 'ampere'),
        S('Intensité et lampe', 'Plus l’intensité est grande, plus la lampe brille, jusqu’à ce qu’elle grille si elle dépasse sa valeur maximale.'),
      ],
      recap: ['I se mesure en ampères (A).', 'L’ampèremètre se branche en série.', '1 mA = 0,001 A.'],
      quiz: [Q('L’ampèremètre se branche :', ['en série', 'en dérivation'], 0), Q('250 mA = … A', ['2,5', '0,25', '25'], 1)] },

    { id: 'p4-tension', subj: 'physique', level: '4e', icon: '🔋', title: 'La tension électrique',
      intro: 'Une pile pousse le courant dans le circuit. Cette « poussée » s’appelle la tension.',
      steps: [
        S('Définition', 'La <b>tension</b> électrique (notée U) existe entre deux points d’un circuit. Son unité est le <b>volt</b> (V). Une pile plate indique 4,5 V, une pile de téléphone environ 3,7 V.'),
        S('Mesurer avec le voltmètre', 'Le <b>voltmètre</b> se branche <b>en dérivation</b>, c’est-à-dire aux bornes du dipôle dont on mesure la tension.', 'volt'),
        S('Tensions usuelles', 'Pile ronde : 1,5 V. Batterie de voiture : 12 V. Prise de la maison : 230 V, ce qui est dangereux.'),
        S('Tension nominale', 'Une lampe porte une indication, par exemple « 6 V ». Elle brille normalement avec cette tension. Au-dessus, elle risque de griller.'),
      ],
      recap: ['U se mesure en volts (V).', 'Le voltmètre se branche en dérivation.', 'Prise de la maison : 230 V, danger.'],
      quiz: [Q('Le voltmètre se branche :', ['en série', 'en dérivation'], 1), Q('La tension du secteur est de :', ['230 V', '1,5 V'], 0)] },

    { id: 'p4-lois', subj: 'physique', level: '4e', icon: '➕', title: 'Les lois des circuits',
      intro: 'Dans un circuit, les intensités et les tensions suivent des règles simples.',
      steps: [
        S('Circuit en série : l’intensité', 'Dans un circuit en <b>série</b>, l’intensité est la <b>même</b> partout : le courant n’a qu’un seul chemin. Si l’ampèremètre indique 0,3 A avant la lampe, il indique 0,3 A après.', 'serie'),
        S('Circuit en série : la tension', 'La tension aux bornes du générateur est égale à la <b>somme</b> des tensions aux bornes des récepteurs : U = U₁ + U₂. Pile de 6 V et deux lampes identiques : 3 V chacune.'),
        S('Circuit en dérivation : l’intensité', 'Au nœud, l’intensité qui arrive est égale à la <b>somme</b> des intensités qui repartent : I = I₁ + I₂. Si I₁ = 0,2 A et I₂ = 0,3 A, alors I = 0,5 A.', 'derivation'),
        S('Circuit en dérivation : la tension', 'Dans un circuit en dérivation, la tension est la <b>même</b> aux bornes de chaque branche et du générateur.'),
      ],
      recap: ['Série : I identique, U s’additionne.', 'Dérivation : U identique, I s’additionne.'],
      quiz: [Q('En série, I₁ = 0,4 A. L’intensité ailleurs dans le circuit est :', ['0,4 A', '0,8 A', '0,2 A'], 0), Q('En dérivation, I₁ = 0,2 A et I₂ = 0,3 A. L’intensité principale est :', ['0,1 A', '0,5 A', '0,3 A'], 1)] },

    { id: 'p4-securite', subj: 'physique', level: '4e', icon: '⚠️', title: 'L’électricité à la maison et la sécurité',
      intro: 'Le courant de la maison est puissant. Quelques règles évitent les accidents.',
      steps: [
        S('Le courant du secteur', 'Dans les maisons, le courant est <b>alternatif</b> : il change de sens 100 fois par seconde. Sa fréquence est de 50 hertz (Hz) et sa tension de 230 V. Une pile fournit du courant <b>continu</b>.'),
        S('Le danger', 'Le corps humain conduit l’électricité. Un courant de quelques dizaines de milliampères peut être mortel : c’est l’<b>électrocution</b>. L’eau et l’humidité augmentent le danger.'),
        S('Les protections', 'Le <b>fusible</b> et le <b>disjoncteur</b> coupent le courant en cas de surintensité. La prise de terre et le disjoncteur différentiel protègent les personnes.'),
        S('Les bons gestes', 'Ne jamais toucher un appareil avec les mains mouillées, ne pas brancher trop d’appareils sur une prise, ne pas mettre ses doigts ou des objets dans une prise, couper le courant avant de réparer.'),
      ],
      recap: ['Secteur : alternatif, 230 V, 50 Hz.', 'Fusible et disjoncteur protègent.', 'Eau et électricité ne font pas bon ménage.'],
      quiz: [Q('La tension du secteur en France est de :', ['12 V', '230 V'], 1), Q('Le fusible sert à :', ['couper le courant en cas de surintensité', 'augmenter la tension'], 0)] },

    { id: 'p4-couleurs', subj: 'physique', level: '4e', icon: '🌈', title: 'La lumière blanche et les couleurs',
      intro: 'L’arc-en-ciel montre que la lumière blanche cache toutes les couleurs.',
      steps: [
        S('Décomposer la lumière', 'Un <b>prisme</b> décompose la lumière blanche en une suite de couleurs : le <b>spectre</b>. De haut en bas : rouge, orange, jaune, vert, bleu, indigo, violet.', 'spectre'),
        S('L’arc-en-ciel', 'Un arc-en-ciel apparaît quand la lumière du Soleil traverse des gouttes d’eau, qui jouent le rôle de petits prismes.'),
        S('Les sources colorées', 'Une lumière <b>monochromatique</b> ne contient qu’une seule couleur, comme un laser. Une lumière <b>polychromatique</b> en contient plusieurs, comme la lumière blanche.'),
        S('La couleur d’un objet', 'Un objet éclairé en lumière blanche paraît rouge s’il renvoie surtout le rouge et absorbe les autres couleurs. Un objet noir absorbe tout, un objet blanc renvoie tout.'),
      ],
      recap: ['Le prisme décompose la lumière blanche.', 'Le spectre va du rouge au violet.', 'Un objet a la couleur de la lumière qu’il renvoie.'],
      quiz: [Q('Un prisme éclairé en lumière blanche donne :', ['le spectre', 'une seule couleur'], 0), Q('Un objet noir :', ['absorbe toute la lumière', 'renvoie toute la lumière'], 0)] },

    { id: 'p4-reflexion', subj: 'physique', level: '4e', icon: '🪞', title: 'La réflexion de la lumière',
      intro: 'Dans un miroir, la lumière rebondit. Cette règle permet de prévoir où elle va.',
      steps: [
        S('Réflexion et miroir', 'Quand la lumière rencontre une surface polie, comme un miroir, elle <b>rebondit</b> : c’est la <b>réflexion</b>. La surface plane et polie s’appelle un <b>miroir plan</b>.', 'reflexion'),
        S('Le rayon incident et réfléchi', 'Le rayon qui arrive est le rayon <b>incident</b>, celui qui repart est le rayon <b>réfléchi</b>. On mesure les angles par rapport à la <b>normale</b>, la perpendiculaire au miroir au point d’incidence.'),
        S('La loi de la réflexion', 'L’angle d’incidence <b>i</b> est égal à l’angle de réflexion <b>r</b> : <b>i = r</b>. Les deux rayons et la normale sont dans le même plan.'),
        S('L’image dans un miroir', 'L’image d’un objet dans un miroir plan est <b>symétrique</b> de l’objet par rapport au miroir. Elle se forme « derrière » le miroir, à la même distance.'),
      ],
      recap: ['Réflexion : la lumière rebondit sur un miroir.', 'i = r, mesurés par rapport à la normale.', 'L’image est symétrique de l’objet.'],
      quiz: [Q('Un rayon arrive avec un angle d’incidence de 30°. Il est réfléchi avec un angle de :', ['30°', '60°', '15°'], 0), Q('La normale est :', ['perpendiculaire au miroir', 'parallèle au miroir'], 0)] },

    { id: 'p4-poids-masse', subj: 'physique', level: '4e', icon: '⚖️', title: 'Poids et masse',
      intro: 'Sur la Lune, on se sent plus léger : le poids change, mais la masse reste la même.',
      steps: [
        S('Masse et poids', 'La <b>masse</b> m mesure la quantité de matière d’un objet. Elle se mesure en <b>kilogrammes</b> avec une balance. Le <b>poids</b> P est la force d’attraction de la Terre sur l’objet. Il se mesure en <b>newtons</b> avec un dynamomètre.'),
        S('La relation', '<b>P = m × g</b>. Sur Terre, g ≈ 10 N/kg (environ 9,8). Un objet de 2 kg a un poids d’environ 20 N.'),
        S('La Lune', 'Sur la Lune, g vaut environ 1,6 N/kg. Le même objet de 2 kg y a un poids d’environ 3,2 N : il y est six fois plus faible. Sa masse n’a pas changé.', 'force'),
        S('L’attraction', 'Le poids vient de l’<b>attraction gravitationnelle</b> : tous les objets s’attirent, et l’attraction est d’autant plus forte que les masses sont grandes et que les distances sont petites.'),
      ],
      recap: ['La masse se mesure en kg, le poids en N.', 'P = m × g.', 'La masse ne change pas selon le lieu, le poids change.'],
      quiz: [Q('Sur Terre (g = 10 N/kg), 3 kg ont un poids de :', ['3 N', '30 N', '13 N'], 1), Q('Sur la Lune, la masse d’un objet est :', ['plus faible', 'la même'], 1)] },

    /* ================================================================ 4e : CHIMIE */
    { id: 'c4-atomes', subj: 'chimie', level: '4e', icon: '⚛️', title: 'Les atomes',
      intro: 'Toute la matière est faite de minuscules particules : les atomes.',
      steps: [
        S('Un atome', 'Un <b>atome</b> est la plus petite particule d’un élément chimique. Il est si petit qu’on aligne 10 millions d’atomes sur un millimètre.', 'atome'),
        S('Un noyau et des électrons', 'Un atome a un <b>noyau</b> chargé positivement et des <b>électrons</b> chargés négativement qui tournent autour. L’atome est <b>neutre</b> : il y a autant de charges + que de charges −.'),
        S('Les éléments', 'Chaque atome correspond à un élément, noté par un <b>symbole</b> : H pour l’hydrogène, C pour le carbone, O pour l’oxygène, N pour l’azote, Fe pour le fer.'),
        S('Un atome est surtout du vide', 'Le noyau est des dizaines de milliers de fois plus petit que l’atome. Presque toute la masse est dans le noyau, et entre le noyau et les électrons, il n’y a rien.'),
      ],
      recap: ['Atome = noyau + électrons.', 'L’atome est neutre.', 'Symboles : H, C, O, N, Fe.'],
      quiz: [Q('Les électrons sont chargés :', ['positivement', 'négativement'], 1), Q('Le symbole de l’oxygène est :', ['O', 'Ox'], 0)] },

    { id: 'c4-molecules', subj: 'chimie', level: '4e', icon: '💧', title: 'Les molécules',
      intro: 'Des atomes qui s’assemblent forment une molécule : l’eau, le dioxygène, le dioxyde de carbone.',
      steps: [
        S('Une molécule', 'Une <b>molécule</b> est un assemblage d’atomes. Les atomes d’une molécule sont liés entre eux.', 'molecule'),
        S('La formule', 'La <b>formule chimique</b> indique le nombre d’atomes de chaque sorte. L’eau H₂O : 2 atomes d’hydrogène et 1 atome d’oxygène. Le dioxyde de carbone CO₂ : 1 carbone et 2 oxygènes.'),
        S('Quelques formules', 'Dioxygène O₂, dihydrogène H₂, diazote N₂, méthane CH₄, dioxyde de carbone CO₂, eau H₂O.'),
        S('Corps purs et mélanges', 'Un corps pur est formé d’une seule sorte de molécules. Un mélange contient plusieurs sortes de molécules, comme l’air.'),
      ],
      recap: ['Molécule = atomes liés.', 'H₂O : 2 H + 1 O.', 'Un corps pur : une seule sorte de molécules.'],
      quiz: [Q('Combien d’atomes d’oxygène dans CO₂ ?', ['1', '2', '3'], 1), Q('La formule du dioxygène est :', ['O', 'O₂'], 1)] },

    { id: 'c4-transformation', subj: 'chimie', level: '4e', icon: '🧪', title: 'La transformation chimique',
      intro: 'Une bougie brûle, du fer rouille, un œuf cuit : des substances nouvelles apparaissent.',
      steps: [
        S('Physique ou chimique ?', 'Dans une transformation <b>physique</b> (fusion, dissolution), les molécules ne changent pas. Dans une transformation <b>chimique</b>, de nouvelles substances apparaissent.'),
        S('Réactifs et produits', 'Les substances qui disparaissent sont les <b>réactifs</b>. Celles qui apparaissent sont les <b>produits</b>. On écrit : réactifs → produits.', 'reaction'),
        S('Reconnaître une réaction', 'On peut le voir par un dégagement gazeux, un changement de couleur, un dépôt solide, de la chaleur ou de la lumière.'),
        S('Un exemple', 'Le fer rouille : fer + dioxygène (de l’air) → oxyde de fer. Le fer et le dioxygène sont les réactifs, l’oxyde de fer est le produit.'),
      ],
      recap: ['Chimique : de nouvelles substances apparaissent.', 'Réactifs → produits.', 'Indices : gaz, couleur, dépôt, chaleur.'],
      quiz: [Q('La glace qui fond est une transformation :', ['chimique', 'physique'], 1), Q('Dans une transformation chimique, les réactifs :', ['disparaissent', 'ne changent pas'], 0)] },

    { id: 'c4-combustion', subj: 'chimie', level: '4e', icon: '🔥', title: 'Les combustions',
      intro: 'Brûler du bois, du gaz ou du charbon : toutes les combustions suivent la même règle.',
      steps: [
        S('Le triangle du feu', 'Pour qu’il y ait combustion, il faut trois choses : un <b>combustible</b> (bois, gaz, essence), un <b>comburant</b> (le dioxygène de l’air) et de la <b>chaleur</b> pour démarrer. Sans l’un des trois, le feu s’éteint.', 'feu'),
        S('Les produits', 'La combustion complète d’un combustible contenant du carbone produit du <b>dioxyde de carbone</b> et de l’<b>eau</b>. Exemple : méthane + dioxygène → dioxyde de carbone + eau.'),
        S('Combustion incomplète', 'Quand il manque de dioxygène, la combustion produit du <b>monoxyde de carbone</b> CO, un gaz toxique, inodore et invisible. Il faut aérer les pièces chauffées au gaz ou au charbon.'),
        S('Éteindre un feu', 'On supprime un des trois éléments : de l’eau pour refroidir, un couvercle ou une couverture pour priver de dioxygène, couper l’arrivée de gaz.'),
      ],
      recap: ['Combustible + comburant + chaleur.', 'Produits : CO₂ et eau (combustion complète).', 'Le monoxyde de carbone est toxique.'],
      quiz: [Q('Quel est le comburant ?', ['le bois', 'le dioxygène'], 1), Q('Pour éteindre un feu, on peut :', ['priver le feu de dioxygène', 'ajouter du combustible'], 0)] },

    { id: 'c4-bilan', subj: 'chimie', level: '4e', icon: '⚖️', title: 'Conservation des atomes et équation de réaction',
      intro: 'Dans une réaction chimique, rien ne se perd, rien ne se crée : les atomes se réarrangent.',
      steps: [
        S('Les atomes se conservent', 'Pendant une réaction, les atomes <b>ne disparaissent pas</b> et il n’en apparaît pas de nouveaux. Ils se séparent puis se regroupent autrement : les molécules des produits sont différentes de celles des réactifs.', 'reaction'),
        S('La masse se conserve', 'Comme les atomes se conservent, la <b>masse totale</b> des réactifs est égale à la masse totale des produits. Si 12 g de carbone réagissent avec 32 g de dioxygène, on obtient 44 g de dioxyde de carbone.'),
        S('L’équation de réaction', 'On écrit l’équation avec les formules : <b>C + O₂ → CO₂</b>. Il doit y avoir le même nombre d’atomes de chaque sorte de chaque côté : ici 1 C et 2 O des deux côtés.'),
        S('Équilibrer', 'Pour 2 H₂ + O₂ → 2 H₂O : à gauche, 4 H et 2 O. À droite, 2 × 2 = 4 H et 2 × 1 = 2 O. C’est équilibré. On ajoute des nombres devant les formules, jamais dans les formules.'),
      ],
      recap: ['Atomes conservés, masse conservée.', 'Équation : même nombre d’atomes de chaque côté.', 'On équilibre avec des nombres devant les formules.'],
      quiz: [Q('12 g de carbone et 32 g de dioxygène donnent :', ['20 g de CO₂', '44 g de CO₂', '32 g de CO₂'], 1), Q('Dans une réaction chimique, les atomes :', ['se conservent', 'disparaissent'], 0)] },

    { id: 'c4-tests', subj: 'chimie', level: '4e', icon: '🔬', title: 'Reconnaître quelques gaz',
      intro: 'On ne voit pas les gaz. Pourtant, quelques tests simples permettent de les reconnaître.',
      steps: [
        S('Le dioxygène', 'Une <b>allumette incandescente</b> (qui brille sans flamme) se rallume dans du dioxygène. C’est le test du dioxygène.'),
        S('Le dioxyde de carbone', 'Le dioxyde de carbone <b>trouble l’eau de chaux</b> : elle devient laiteuse. On l’obtient en soufflant dans l’eau de chaux avec une paille.'),
        S('Le dihydrogène', 'Le <b>dihydrogène</b> brûle avec une petite détonation, un « pop » aigu, à l’approche d’une flamme. Attention, ce gaz est inflammable.'),
        S('La vapeur d’eau', 'L’eau se reconnaît avec le <b>sulfate de cuivre anhydre</b> : il passe du blanc au bleu. On l’utilise pour vérifier qu’il se forme de l’eau.', 'goutte'),
      ],
      recap: ['O₂ : rallume une allumette incandescente.', 'CO₂ : trouble l’eau de chaux.', 'H₂ : « pop » à la flamme.', 'H₂O : sulfate de cuivre bleu.'],
      quiz: [Q('Quel gaz trouble l’eau de chaux ?', ['le dioxyde de carbone', 'le dihydrogène'], 0), Q('Le test du dihydrogène donne :', ['une petite détonation', 'un trouble blanc'], 0)] },
    /* ================================================================ 3e : MATHS */
    { id: 'm3-pgcd', subj: 'maths', level: '3e', icon: '🧩', title: 'Diviseurs, PGCD et nombres premiers',
      intro: 'Pour partager 96 bonbons et 240 gâteaux en parts identiques, on cherche le plus grand diviseur commun.',
      steps: [
        S('Diviseurs et multiples', 'Un nombre a est un <b>diviseur</b> de b si la division de b par a tombe juste. Les diviseurs de 12 sont 1, 2, 3, 4, 6 et 12. 12 est alors un <b>multiple</b> de chacun d’eux.'),
        S('Nombres premiers', 'Un nombre est <b>premier</b> s’il a exactement deux diviseurs : 1 et lui-même. Les premiers nombres premiers sont 2, 3, 5, 7, 11, 13, 17, 19… Le nombre 1 n’est pas premier.'),
        S('Le PGCD', 'Le <b>PGCD</b> de deux nombres est leur plus grand diviseur commun. Diviseurs de 96 et de 240 : le plus grand en commun est 48, donc PGCD(96 ; 240) = 48.', 'pgcd'),
        S('L’algorithme d’Euclide', 'On divise le plus grand par le plus petit, puis le diviseur par le reste, et on recommence. Le <b>dernier reste non nul</b> est le PGCD. 240 = 2 × 96 + 48, puis 96 = 2 × 48 + 0 : PGCD = 48. Une fraction est irréductible si PGCD(numérateur ; dénominateur) = 1.'),
      ],
      recap: ['Un nombre premier a exactement deux diviseurs.', 'PGCD : plus grand diviseur commun.', 'Euclide : le dernier reste non nul est le PGCD.'],
      quiz: [Q('Quel nombre est premier ?', ['21', '23', '25'], 1), Q('PGCD(12 ; 18) = ?', ['3', '6', '36'], 1)] },

    { id: 'm3-racines', subj: 'maths', level: '3e', icon: '√', title: 'Les racines carrées',
      intro: 'Si un carré a pour aire 25 cm², combien mesure son côté ? La racine carrée répond à cette question.',
      steps: [
        S('Définition', 'La <b>racine carrée</b> d’un nombre positif a, notée <b>√a</b>, est le nombre positif dont le carré vaut a. √25 = 5 car 5² = 25. Et √0 = 0.', 'racine'),
        S('Carrés parfaits', 'Les carrés parfaits à connaître : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144. Leur racine est un entier. Par exemple, √144 = 12.'),
        S('Règles de calcul', 'Pour a et b positifs : <b>√(a × b) = √a × √b</b>. Exemple : √50 = √(25 × 2) = 5√2. Attention : √(a + b) n’est pas égal à √a + √b.'),
        S('Valeurs approchées', '√2 n’est pas un nombre décimal : √2 ≈ 1,414. On le calcule avec la touche √ de la calculatrice. On ne peut pas prendre la racine d’un nombre négatif.'),
      ],
      recap: ['√a est le nombre positif de carré a.', '√(a × b) = √a × √b.', 'Pas de racine carrée d’un nombre négatif.'],
      quiz: [Q('√81 = ?', ['9', '8,1', '40,5'], 0), Q('√(9 + 16) = ?', ['7', '5', '25'], 1)] },

    { id: 'm3-identites', subj: 'maths', level: '3e', icon: '🧮', title: 'Identités remarquables et factorisation',
      intro: 'Trois égalités vraies pour tous les nombres permettent de calculer et de factoriser vite.',
      steps: [
        S('Le carré d’une somme', '<b>(a + b)² = a² + 2ab + b²</b>. Exemple : (x + 3)² = x² + 6x + 9. L’aire du grand carré se compose du carré de a, de deux rectangles ab et du carré de b.', 'carre'),
        S('Les deux autres', '<b>(a − b)² = a² − 2ab + b²</b>, et <b>(a + b)(a − b) = a² − b²</b>. Exemple : 101 × 99 = (100 + 1)(100 − 1) = 10 000 − 1 = 9 999.'),
        S('Factoriser', 'Factoriser, c’est transformer une somme en produit. Avec un facteur commun : 6x + 9 = 3 × (2x + 3). Avec une identité : x² − 25 = (x + 5)(x − 5).'),
        S('Pourquoi ?', 'Factoriser sert à résoudre des équations : un produit est nul si l’un de ses facteurs est nul. (x + 5)(x − 5) = 0 donne x = −5 ou x = 5.'),
      ],
      recap: ['(a + b)² = a² + 2ab + b².', '(a − b)² = a² − 2ab + b².', '(a + b)(a − b) = a² − b².', 'Factoriser : transformer en produit.'],
      quiz: [Q('(x + 4)² = ?', ['x² + 16', 'x² + 8x + 16', 'x² + 4x + 16'], 1), Q('x² − 9 = ?', ['(x − 3)(x + 3)', '(x − 9)²', '(x − 3)²'], 0)] },

    { id: 'm3-equations', subj: 'maths', level: '3e', icon: '⚖️', title: 'Équations produit et systèmes',
      intro: 'Deux inconnues, deux équations : on les résout ensemble. Et un produit nul est facile à résoudre.',
      steps: [
        S('Équation produit nul', 'Un produit de facteurs est nul si et seulement si <b>l’un des facteurs est nul</b>. (x − 2)(x + 5) = 0 donne x − 2 = 0 ou x + 5 = 0, donc x = 2 ou x = −5.', 'balance'),
        S('Système de deux équations', 'On cherche x et y qui vérifient en même temps deux équations. Par exemple : x + y = 10 et x − y = 2.'),
        S('Méthode par addition', 'On additionne les deux équations pour éliminer y : 2x = 12, donc x = 6. Puis y = 10 − 6 = 4. On vérifie : 6 − 4 = 2.'),
        S('Méthode par substitution', 'On exprime une inconnue : y = 10 − x. On la remplace dans l’autre équation : x − (10 − x) = 2, donc 2x − 10 = 2 et x = 6.'),
      ],
      recap: ['Produit nul : un facteur nul.', 'Système : on élimine ou on remplace une inconnue.', 'On vérifie avec les deux équations.'],
      quiz: [Q('(x − 3)(x + 1) = 0 a pour solutions :', ['3 et −1', '−3 et 1', '3 et 1'], 0), Q('x + y = 7 et x − y = 1. Alors x = ?', ['3', '4', '6'], 1)] },

    { id: 'm3-fonctions', subj: 'maths', level: '3e', icon: '📈', title: 'Fonctions linéaires et affines',
      intro: 'Un prix qui dépend du poids, une facture qui dépend de la consommation : on décrit cela avec une fonction.',
      steps: [
        S('Une fonction', 'Une <b>fonction</b> associe à chaque nombre x un unique nombre f(x), appelé son <b>image</b>. Si f(x) = 3x + 1, alors f(2) = 7 et 2 est un antécédent de 7.'),
        S('La fonction linéaire', 'Une fonction <b>linéaire</b> s’écrit f(x) = ax. Sa représentation graphique est une <b>droite passant par l’origine</b>. Elle représente une situation de proportionnalité, de coefficient a.'),
        S('La fonction affine', 'Une fonction <b>affine</b> s’écrit f(x) = ax + b. Sa courbe est une droite. Le nombre a est le <b>coefficient directeur</b> (la pente) et b est l’<b>ordonnée à l’origine</b>.', 'graphe'),
        S('Trouver a et b', 'La droite passe par les points (0 ; 1) et (2 ; 7). Le coefficient directeur est a = (7 − 1) ÷ (2 − 0) = 3, et b = 1. Donc f(x) = 3x + 1.'),
      ],
      recap: ['Linéaire : f(x) = ax, droite par l’origine.', 'Affine : f(x) = ax + b, droite.', 'a = coefficient directeur, b = ordonnée à l’origine.'],
      quiz: [Q('f(x) = 2x + 5. f(3) = ?', ['6', '11', '10'], 1), Q('La courbe d’une fonction linéaire passe par :', ['l’origine', 'le point (0 ; 1)'], 0)] },

    { id: 'm3-thales', subj: 'maths', level: '3e', icon: '📐', title: 'Le théorème de Thalès',
      intro: 'Quand deux droites parallèles coupent les côtés d’un triangle, les longueurs sont proportionnelles.',
      steps: [
        S('L’énoncé', 'Dans le triangle ABC, M est sur (AB) et N sur (AC). Si les droites <b>(MN) et (BC) sont parallèles</b>, alors <b>AM/AB = AN/AC = MN/BC</b>.', 'thales'),
        S('Calculer une longueur', 'AM = 3, AB = 6, AN = 4, donc AC = ? On a 3/6 = 4/AC, soit AC = 4 × 6 ÷ 3 = 8.'),
        S('Agrandissement et réduction', 'Le petit triangle AMN est une <b>réduction</b> du grand triangle ABC. Le rapport est k = AM/AB. Les longueurs sont multipliées par k, les aires par k².'),
        S('La réciproque', 'Si les rapports AM/AB et AN/AC sont égaux, <b>et que les points sont alignés dans le même ordre</b>, alors (MN) est parallèle à (BC). C’est ainsi qu’on prouve un parallélisme.'),
      ],
      recap: ['(MN) ∥ (BC) : AM/AB = AN/AC = MN/BC.', 'Longueurs × k, aires × k².', 'La réciproque prouve le parallélisme.'],
      quiz: [Q('AM = 2, AB = 5, AN = 3. AC = ?', ['7,5', '6', '10'], 0), Q('Avec un rapport de réduction k = 1/2, les aires sont multipliées par :', ['1/2', '1/4', '2'], 1)] },

    { id: 'm3-trigo', subj: 'maths', level: '3e', icon: '🧭', title: 'La trigonométrie : cosinus, sinus, tangente',
      intro: 'Dans un triangle rectangle, trois rapports de longueurs relient un angle aux côtés.',
      steps: [
        S('Trois rapports', 'Pour un angle aigu α d’un triangle rectangle : <b>cos α = adjacent ÷ hypoténuse</b>, <b>sin α = opposé ÷ hypoténuse</b>, <b>tan α = opposé ÷ adjacent</b>.', 'trigo'),
        S('Un moyen mnémotechnique', 'On retient « CAH SOH TOA » : Cosinus = Adjacent / Hypoténuse, Sinus = Opposé / Hypoténuse, Tangente = Opposé / Adjacent.'),
        S('Calculer une longueur', 'Hypoténuse 10 cm, angle de 30° : le côté opposé vaut 10 × sin 30° = 10 × 0,5 = 5 cm.'),
        S('Calculer un angle', 'Opposé 3 cm et adjacent 3 cm : tan α = 1, donc α = 45°. On utilise les touches « sin⁻¹ », « cos⁻¹ » ou « tan⁻¹ » de la calculatrice. Aussi : cos² α + sin² α = 1.'),
      ],
      recap: ['cos = A/H, sin = O/H, tan = O/A.', 'On calcule un angle avec sin⁻¹, cos⁻¹, tan⁻¹.', 'cos² α + sin² α = 1.'],
      quiz: [Q('Opposé 4 cm, hypoténuse 8 cm : sin α = ?', ['0,5', '2', '4'], 0), Q('tan α = ?', ['opposé ÷ adjacent', 'adjacent ÷ hypoténuse'], 0)] },

    { id: 'm3-probas', subj: 'maths', level: '3e', icon: '🎲', title: 'Probabilités',
      intro: 'On sait calculer la chance d’un événement, et même celle de deux événements qui s’enchaînent.',
      steps: [
        S('Probabilité d’un événement', 'Si les issues sont équiprobables : <b>P = nombre de cas favorables ÷ nombre de cas possibles</b>. Pour une urne de 4 boules rouges et 3 bleues : P(rouge) = 4/7.', 'urne'),
        S('L’événement contraire', 'La probabilité qu’un événement ne se réalise pas vaut <b>1 − P</b>. Si P(gagner) = 0,2, alors P(perdre) = 0,8.'),
        S('Deux épreuves', 'On peut dessiner un <b>arbre</b> ou un tableau. Pour deux lancers d’une pièce, il y a 4 issues : PP, PF, FP, FF. P(deux fois pile) = 1/4.'),
        S('Épreuves indépendantes', 'Si deux épreuves sont indépendantes, on <b>multiplie</b> les probabilités le long d’une branche : P(rouge puis rouge, avec remise) = 4/7 × 4/7 = 16/49.'),
      ],
      recap: ['P = cas favorables ÷ cas possibles.', 'P(contraire) = 1 − P.', 'Le long d’une branche, on multiplie.'],
      quiz: [Q('Un dé : P(obtenir 1 ou 2) = ?', ['1/6', '1/3', '1/2'], 1), Q('On lance deux pièces. P(deux fois pile) = ?', ['1/4', '1/2', '1/3'], 0)] },

    { id: 'm3-spheres', subj: 'maths', level: '3e', icon: '🌍', title: 'Sphères, boules et volumes',
      intro: 'Un ballon, une orange, la Terre : on calcule leur surface et leur volume avec le rayon.',
      steps: [
        S('Sphère et boule', 'La <b>sphère</b> de centre O et de rayon r est l’ensemble des points à la distance r de O (la surface). La <b>boule</b> est la sphère avec tout son intérieur.', 'sphere'),
        S('Aire et volume', '<b>Aire de la sphère = 4 × π × r²</b> et <b>volume de la boule = 4/3 × π × r³</b>. Pour r = 3 cm : aire = 4 × π × 9 ≈ 113,1 cm² et volume = 4/3 × π × 27 ≈ 113,1 cm³.'),
        S('Sections', 'La section d’une sphère par un plan est un <b>cercle</b>. Si le plan passe par le centre, c’est un grand cercle, de même rayon que la sphère. La Terre a des grands cercles : l’équateur et les méridiens.'),
        S('Agrandir et réduire', 'Quand on multiplie les longueurs par k, les aires sont multipliées par k² et les volumes par k³. Doubler le rayon multiplie le volume par 8.'),
      ],
      recap: ['Aire de la sphère : 4πr².', 'Volume de la boule : 4/3 πr³.', 'Longueurs × k, aires × k², volumes × k³.'],
      quiz: [Q('Si on double le rayon d’une boule, son volume est multiplié par :', ['2', '4', '8'], 2), Q('La section d’une sphère par un plan est :', ['un cercle', 'un carré'], 0)] },

    /* ================================================================ 3e : PHYSIQUE */
    { id: 'p3-ohm', subj: 'physique', level: '3e', icon: '🔌', title: 'La loi d’Ohm',
      intro: 'Un dipôle qui freine le courant s’appelle une résistance. La loi d’Ohm relie tension, résistance et intensité.',
      steps: [
        S('La résistance', 'Un <b>conducteur ohmique</b> (ou résistor) s’oppose au passage du courant. Sa <b>résistance</b> R se mesure en <b>ohms</b> (Ω). On la mesure à l’ohmmètre.'),
        S('La loi d’Ohm', 'Aux bornes d’un conducteur ohmique : <b>U = R × I</b>, avec U en volts, R en ohms et I en ampères. Pour R = 100 Ω et I = 0,05 A : U = 100 × 0,05 = 5 V.', 'ohm'),
        S('Trouver R ou I', 'On en déduit R = U ÷ I et I = U ÷ R. Si U = 6 V et I = 0,02 A, alors R = 6 ÷ 0,02 = 300 Ω.'),
        S('La caractéristique', 'Si on trace U en fonction de I pour un conducteur ohmique, on obtient une <b>droite passant par l’origine</b> : U est proportionnel à I, et le coefficient de proportionnalité est R.'),
      ],
      recap: ['R se mesure en ohms (Ω).', 'U = R × I.', 'La caractéristique d’un conducteur ohmique est une droite par l’origine.'],
      quiz: [Q('U = 12 V et R = 4 Ω. I = ?', ['3 A', '48 A', '0,33 A'], 0), Q('Un conducteur ohmique a une résistance R = 50 Ω et I = 0,2 A. U = ?', ['10 V', '250 V', '0,004 V'], 0)] },

    { id: 'p3-puissance', subj: 'physique', level: '3e', icon: '💡', title: 'Puissance et énergie électriques',
      intro: 'Une lampe de 100 W éclaire plus et consomme plus qu’une lampe de 20 W. La puissance mesure cette différence.',
      steps: [
        S('La puissance', 'La <b>puissance</b> électrique d’un appareil indique l’énergie qu’il consomme chaque seconde. Elle se mesure en <b>watts</b> (W). 1 kW = 1 000 W.', 'puissance'),
        S('La relation', 'Pour un appareil, <b>P = U × I</b>. Une lampe sous 230 V qui consomme 0,26 A a une puissance de 230 × 0,26 ≈ 60 W.'),
        S('L’énergie consommée', '<b>E = P × t</b>. En joules : P en watts et t en secondes. En pratique, on compte en <b>kilowattheures</b> (kWh) : P en kW et t en heures. Un radiateur de 2 kW qui fonctionne 3 h consomme 6 kWh.'),
        S('La facture', 'Le prix à payer est l’énergie consommée multipliée par le prix du kWh. Pour économiser : éteindre les appareils inutiles, choisir des lampes basse consommation.'),
      ],
      recap: ['P en watts (W).', 'P = U × I.', 'E = P × t, en kWh pour la facture.'],
      quiz: [Q('Un appareil de 2 kW fonctionne 4 h. Il consomme :', ['2 kWh', '8 kWh', '0,5 kWh'], 1), Q('U = 230 V et I = 2 A. P = ?', ['115 W', '460 W', '232 W'], 1)] },

    { id: 'p3-lentilles', subj: 'physique', level: '3e', icon: '🔍', title: 'Les lentilles convergentes',
      intro: 'Loupe, appareil photo, lunettes : les lentilles convergentes forment des images.',
      steps: [
        S('Une lentille convergente', 'Une <b>lentille convergente</b> est plus épaisse au centre qu’aux bords. Elle fait converger les rayons de lumière qui arrivent parallèlement à son axe.', 'lentille'),
        S('Le foyer', 'Les rayons parallèles à l’axe optique se croisent au <b>foyer image</b> F’. La distance entre la lentille et F’ est la <b>distance focale</b> f, en mètres. Elle caractérise la lentille.'),
        S('Rayons particuliers', 'Un rayon qui passe par le <b>centre optique</b> n’est pas dévié. Un rayon parallèle à l’axe ressort en passant par F’. En traçant ces deux rayons, on trouve où se forme l’image.'),
        S('Images', 'Selon la position de l’objet, l’image est <b>réelle</b> (on peut la recueillir sur un écran) ou <b>virtuelle</b> (loupe). Si l’objet est entre la lentille et le foyer, l’image est virtuelle, droite et agrandie.'),
      ],
      recap: ['Lentille convergente : bords minces, centre épais.', 'Rayons parallèles : ils passent par F’.', 'Centre optique : rayon non dévié.'],
      quiz: [Q('Un rayon qui passe par le centre optique est :', ['non dévié', 'dévié vers F’'], 0), Q('Une loupe forme une image :', ['réelle', 'virtuelle'], 1)] },

    { id: 'p3-gravitation', subj: 'physique', level: '3e', icon: '🌍', title: 'La gravitation universelle',
      intro: 'Pourquoi la Lune tourne-t-elle autour de la Terre ? À cause d’une force qui agit entre tous les objets.',
      steps: [
        S('Une attraction mutuelle', 'Tous les objets qui ont une masse s’attirent : c’est l’<b>interaction gravitationnelle</b>. La Terre attire la Lune et la Lune attire la Terre avec des forces de même valeur.', 'gravit'),
        S('De quoi dépend-elle ?', 'La force est d’autant plus grande que les <b>masses</b> sont grandes et que la <b>distance</b> est petite. Elle diminue quand les objets s’éloignent.'),
        S('Le poids', 'Le <b>poids</b> d’un objet est la force gravitationnelle de la Terre sur lui : P = m × g. Sur une planète plus petite, comme la Lune, g est plus faible : g ≈ 1,6 N/kg.'),
        S('Le système solaire', 'Le Soleil attire les planètes, qui tournent autour de lui. La Terre tourne autour du Soleil en un an. Les satellites artificiels tournent autour de la Terre grâce à la gravitation.'),
      ],
      recap: ['Deux masses s’attirent.', 'Plus de masse, plus de force ; plus de distance, moins de force.', 'Le poids est l’attraction de la Terre.'],
      quiz: [Q('Si la distance entre deux astres augmente, la force gravitationnelle :', ['diminue', 'augmente'], 0), Q('La force exercée par la Terre sur la Lune est :', ['plus grande que celle de la Lune sur la Terre', 'égale à celle de la Lune sur la Terre'], 1)] },

    { id: 'p3-inertie', subj: 'physique', level: '3e', icon: '🚗', title: 'Mouvement et forces : le principe d’inertie',
      intro: 'Dans une voiture qui freine brusquement, on est projeté vers l’avant : c’est l’inertie.',
      steps: [
        S('Un mouvement dépend du référentiel', 'Le mouvement d’un objet se décrit par rapport à un <b>référentiel</b>. Un passager est immobile par rapport au train, mais il se déplace par rapport au quai.'),
        S('Types de mouvements', 'La trajectoire peut être <b>rectiligne</b> ou <b>circulaire</b>. La vitesse peut être <b>constante</b> (mouvement uniforme), qui augmente (accéléré) ou qui diminue (ralenti).'),
        S('Le principe d’inertie', 'Si un objet n’est soumis à <b>aucune force</b>, ou à des forces qui <b>se compensent</b>, il reste au repos ou garde un mouvement <b>rectiligne uniforme</b>.', 'inertie'),
        S('L’inverse aussi', 'Si un objet change de vitesse ou de direction, c’est que les forces qui s’exercent sur lui ne se compensent pas. Dans une voiture qui freine, un freinage change la vitesse : une force est à l’œuvre.'),
      ],
      recap: ['Le mouvement dépend du référentiel.', 'Forces compensées : repos ou mouvement rectiligne uniforme.', 'Une vitesse qui change montre que les forces ne se compensent pas.'],
      quiz: [Q('Un objet à vitesse constante en ligne droite est soumis à des forces :', ['qui se compensent', 'qui augmentent sa vitesse'], 0), Q('Le mouvement d’un objet dépend :', ['du référentiel', 'de personne'], 0)] },

    { id: 'p3-energie', subj: 'physique', level: '3e', icon: '⚡', title: 'Énergie cinétique et énergie de position',
      intro: 'Un vélo qui roule vite ou un objet en hauteur possèdent de l’énergie, qui peut se transformer.',
      steps: [
        S('Énergie cinétique', 'Un objet de masse m qui se déplace à la vitesse v possède une <b>énergie cinétique</b> : <b>Ec = ½ × m × v²</b>. m en kg, v en m/s, Ec en joules. À 10 m/s, un objet de 2 kg a Ec = 100 J.', 'cinetique'),
        S('Plus vite, beaucoup plus d’énergie', 'Comme v est au carré, si la vitesse double, l’énergie cinétique est multipliée par <b>4</b>. C’est pourquoi la vitesse est dangereuse sur la route.'),
        S('Énergie de position', 'Un objet en hauteur possède une énergie de position : <b>Ep = m × g × h</b>. Plus il est haut, plus elle est grande. Une pierre de 1 kg à 5 m : Ep = 1 × 10 × 5 = 50 J.'),
        S('Conversion', 'Quand un objet tombe, son énergie de position diminue et son énergie cinétique augmente : l’énergie se convertit. On parle d’énergie mécanique, la somme des deux. L’énergie totale se conserve.'),
      ],
      recap: ['Ec = ½ m v².', 'Ep = m g h.', 'Vitesse × 2 : énergie cinétique × 4.'],
      quiz: [Q('Si la vitesse double, l’énergie cinétique est multipliée par :', ['2', '4', '8'], 1), Q('Ec d’un objet de 2 kg à 3 m/s : ', ['9 J', '3 J', '18 J'], 0)] },

    /* ================================================================ 3e : CHIMIE */
    { id: 'c3-ions', subj: 'chimie', level: '3e', icon: '⚡', title: 'Les ions',
      intro: 'Un atome neutre peut gagner ou perdre des électrons : il devient un ion.',
      steps: [
        S('Atome et ion', 'Un atome est neutre. S’il <b>perd</b> des électrons, il devient un ion <b>positif</b> (cation). S’il en <b>gagne</b>, il devient un ion <b>négatif</b> (anion).', 'ion'),
        S('Les symboles', 'On écrit la charge en haut à droite : Na⁺ (1 électron perdu), Cl⁻ (1 électron gagné), Cu²⁺ (2 électrons perdus), O²⁻ (2 électrons gagnés).'),
        S('Des ions positifs et négatifs', 'Les ions de charges opposées s’attirent. Dans le sel de cuisine, les ions Na⁺ et Cl⁻ forment un cristal. Le solide est neutre : il y a autant de charges + que de charges −.'),
        S('Ions polyatomiques', 'Certains ions contiennent plusieurs atomes : l’ion sulfate SO₄²⁻, l’ion nitrate NO₃⁻, l’ion hydroxyde HO⁻, l’ion hydrogène H⁺ (qui rend l’eau acide).'),
      ],
      recap: ['Cation : charge +. Anion : charge −.', 'Un atome neutre qui perd un électron devient un cation.', 'Les solides ioniques sont neutres.'],
      quiz: [Q('Un atome qui gagne un électron devient :', ['un cation', 'un anion'], 1), Q('L’ion Cu²⁺ a … électrons de moins que l’atome.', ['1', '2'], 1)] },

    { id: 'c3-solutions-ioniques', subj: 'chimie', level: '3e', icon: '🧂', title: 'Les solutions ioniques',
      intro: 'L’eau pure ne conduit presque pas le courant, mais l’eau salée oui. Pourquoi ?',
      steps: [
        S('Dissolution d’un solide ionique', 'Quand on dissout du sel dans l’eau, le cristal se dissocie : les ions Na⁺ et Cl⁻ se séparent et se dispersent dans l’eau. La solution reste <b>neutre</b>.', 'solution'),
        S('Conduction électrique', 'Les ions sont des <b>porteurs de charge</b> mobiles. Une solution qui contient des ions conduit le courant : c’est une <b>solution ionique</b>. L’eau pure, sans ions, est très peu conductrice.'),
        S('Le sens du déplacement', 'Dans une solution, les cations (+) se déplacent vers la borne négative du générateur, les anions (−) vers la borne positive.'),
        S('Concentration', 'La <b>concentration</b> d’une solution est la masse de soluté par litre : C = m ÷ V, en g/L. Si 20 g de sel sont dissous dans 0,5 L : C = 20 ÷ 0,5 = 40 g/L.'),
      ],
      recap: ['Dissolution : le cristal se dissocie en ions.', 'Les ions rendent la solution conductrice.', 'C = m ÷ V (g/L).'],
      quiz: [Q('Une solution d’eau salée conduit le courant car elle contient :', ['des ions', 'des atomes neutres'], 0), Q('10 g de sel dans 0,5 L : C = ?', ['20 g/L', '5 g/L', '10 g/L'], 0)] },

    { id: 'c3-ph', subj: 'chimie', level: '3e', icon: '🧪', title: 'Acides, bases et pH',
      intro: 'Le citron est acide, la lessive est basique. Le pH mesure cette différence.',
      steps: [
        S('L’échelle du pH', 'Le <b>pH</b> mesure l’acidité d’une solution. L’échelle va de 0 à 14. Une solution à pH = 7 est <b>neutre</b> (eau pure). En dessous de 7 : <b>acide</b>. Au-dessus de 7 : <b>basique</b>.', 'ph'),
        S('Mesurer le pH', 'On utilise du <b>papier pH</b> (qui change de couleur) ou un <b>pH-mètre</b> plus précis. Le jus de citron a un pH d’environ 2, le lait environ 6,5, l’eau de javel environ 12.'),
        S('Les ions responsables', 'Une solution acide contient un excès d’ions <b>H⁺</b>. Une solution basique contient un excès d’ions <b>HO⁻</b> (hydroxyde). Dans l’eau pure, il y en a autant : elle est neutre.'),
        S('Diluer', 'Quand on dilue une solution acide, son pH <b>augmente</b> et se rapproche de 7. Pour diluer un acide, on verse toujours l’acide dans l’eau, jamais l’inverse.'),
      ],
      recap: ['pH &lt; 7 acide, pH = 7 neutre, pH &gt; 7 basique.', 'Acide : excès de H⁺. Basique : excès de HO⁻.', 'Diluer un acide fait monter le pH vers 7.'],
      quiz: [Q('Une solution de pH = 3 est :', ['acide', 'basique'], 0), Q('On dilue une solution acide. Son pH :', ['augmente', 'diminue'], 0)] },

    { id: 'c3-acide-metal', subj: 'chimie', level: '3e', icon: '🔩', title: 'Acides et métaux',
      intro: 'Un clou de fer plongé dans de l’acide chlorhydrique fait des bulles : c’est une transformation chimique.',
      steps: [
        S('Une réaction avec des bulles', 'Quand on met du fer dans de l’acide chlorhydrique, on observe un dégagement de gaz et le fer diminue. Le métal est attaqué.', 'bulles'),
        S('Les produits', 'Le gaz dégagé est du <b>dihydrogène</b> H₂ : il fait une petite détonation à la flamme. Dans la solution, des <b>ions fer</b> Fe²⁺ sont apparus (solution verdâtre).'),
        S('Équation de réaction', 'Fe + 2 H⁺ → Fe²⁺ + H₂. On vérifie la conservation des atomes (1 Fe, 2 H) et de la charge (+2 des deux côtés).'),
        S('Les précautions', 'L’acide est corrosif : on porte des lunettes, des gants et une blouse. L’acide ne se jette pas à l’évier sans l’avoir dilué et le dihydrogène est inflammable : pas de flamme à proximité.'),
      ],
      recap: ['Fer + acide : dihydrogène et ions fer.', 'Fe + 2 H⁺ → Fe²⁺ + H₂.', 'Lunettes, gants, blouse.'],
      quiz: [Q('Quel gaz se dégage quand le fer réagit avec un acide ?', ['le dioxygène', 'le dihydrogène'], 1), Q('Dans Fe + 2 H⁺ → Fe²⁺ + H₂, la charge totale est :', ['conservée', 'perdue'], 0)] },

    { id: 'c3-tests-ions', subj: 'chimie', level: '3e', icon: '🔬', title: 'Reconnaître des ions',
      intro: 'Comment savoir quels ions contient une solution ? Grâce à des tests précis avec des réactifs.',
      steps: [
        S('Le principe', 'On ajoute à la solution un réactif qui donne avec un ion donné un <b>précipité</b> (solide) de couleur caractéristique. La couleur du précipité révèle l’ion.'),
        S('Les ions métalliques', 'Avec de la <b>soude</b> (solution d’hydroxyde de sodium) : Cu²⁺ donne un précipité <b>bleu</b>, Fe²⁺ un précipité <b>vert</b>, Fe³⁺ un précipité <b>rouille</b>, Zn²⁺ un précipité <b>blanc</b>.'),
        S('Les ions chlorure', 'Avec du <b>nitrate d’argent</b>, l’ion chlorure Cl⁻ donne un précipité <b>blanc</b> qui noircit à la lumière.'),
        S('Les ions sulfate', 'Avec du chlorure de baryum, l’ion sulfate SO₄²⁻ donne un précipité <b>blanc</b>. Ces tests servent à analyser l’eau potable, les eaux minérales ou les eaux usées.'),
      ],
      recap: ['Soude : précipité bleu (Cu²⁺), vert (Fe²⁺), rouille (Fe³⁺).', 'Nitrate d’argent : précipité blanc (Cl⁻).', 'Chlorure de baryum : précipité blanc (SO₄²⁻).'],
      quiz: [Q('Avec la soude, l’ion Cu²⁺ donne un précipité :', ['bleu', 'vert'], 0), Q('Quel réactif sert à reconnaître l’ion chlorure ?', ['le nitrate d’argent', 'la soude'], 0)] },

    { id: 'c3-securite', subj: 'chimie', level: '3e', icon: '🥽', title: 'Produits chimiques et sécurité',
      intro: 'Beaucoup de produits de la maison sont des produits chimiques. Savoir les lire évite les accidents.',
      steps: [
        S('Les pictogrammes', 'Les étiquettes portent des <b>pictogrammes</b> en losange : inflammable, corrosif, toxique, nocif ou irritant, dangereux pour l’environnement, comburant, explosif.'),
        S('Corrosif et toxique', 'Un produit <b>corrosif</b> attaque la peau, les yeux et les métaux (acides forts, soude, déboucheurs). Un produit <b>toxique</b> est dangereux par ingestion, inhalation ou contact.'),
        S('Ne jamais mélanger', 'Mélanger de l’eau de javel et un produit acide (détartrant) libère du <b>dichlore</b>, un gaz toxique. On ne mélange jamais deux produits ménagers sans connaître les risques.'),
        S('Les bons gestes', 'Lire l’étiquette, porter lunettes et gants, aérer la pièce, ne pas manger ni boire sur place, garder les produits dans leur emballage d’origine, hors de portée des enfants. En cas de contact, rincer à l’eau abondamment.'),
      ],
      recap: ['Les pictogrammes indiquent le danger.', 'Ne jamais mélanger javel et acide.', 'Lunettes, gants, aération.'],
      quiz: [Q('Que ne faut-il jamais mélanger ?', ['eau de javel et détartrant', 'eau et savon'], 0), Q('En cas de projection sur la peau, on :', ['rince à l’eau abondamment', 'frotte avec un chiffon sec'], 0)] },
    /* ================================================================ 2nde : MATHS */
    { id: 'm2-intervalles', subj: 'maths', level: '2nde', icon: '↔️', title: 'Ensembles de nombres et intervalles',
      intro: 'Pour décrire « tous les nombres compris entre 0 et 3 », les mathématiques ont un langage précis.',
      steps: [
        S('Les ensembles de nombres', 'ℕ : les entiers naturels (0, 1, 2…). ℤ : les entiers relatifs. ℚ : les nombres rationnels (fractions). ℝ : tous les nombres de la droite numérique. On a ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ. Par exemple √2 est dans ℝ mais pas dans ℚ.'),
        S('Les intervalles', 'Un <b>intervalle</b> est l’ensemble des réels compris entre deux bornes. [0 ; 3[ contient 0, mais pas 3 : le crochet est <b>fermé</b> côté 0 (la borne est incluse) et <b>ouvert</b> côté 3 (la borne est exclue).', 'intervalle'),
        S('Intersection et réunion', 'L’<b>intersection</b> A ∩ B contient les nombres qui sont dans A <b>et</b> dans B. La <b>réunion</b> A ∪ B contient ceux qui sont dans A <b>ou</b> dans B. [1 ; 5] ∩ [3 ; 8] = [3 ; 5].'),
        S('La valeur absolue', 'La valeur absolue |x| est la distance de x à 0 : |−3| = 3 et |3| = 3. L’inégalité |x − 2| &lt; 1 signifie que x est à une distance de 2 inférieure à 1, soit x dans ]1 ; 3[.'),
      ],
      recap: ['ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ.', 'Crochet fermé : borne incluse ; ouvert : borne exclue.', 'Intersection = et ; réunion = ou.', '|x| est la distance à 0.'],
      quiz: [Q('3 appartient à [0 ; 3[ ?', ['Oui', 'Non'], 1), Q('[1 ; 5] ∩ [3 ; 8] = ?', ['[3 ; 5]', '[1 ; 8]', ']3 ; 5['], 0)] },

    { id: 'm2-inequations', subj: 'maths', level: '2nde', icon: '⚖️', title: 'Inéquations et calcul algébrique',
      intro: 'Une inéquation compare deux expressions. On la résout presque comme une équation, avec une règle à connaître.',
      steps: [
        S('Résoudre une inéquation', 'On résout 2x + 1 &lt; 7 comme une équation : 2x &lt; 6, donc x &lt; 3. Les solutions sont tous les réels de l’intervalle ]−∞ ; 3[.'),
        S('La règle qui change tout', 'Quand on <b>multiplie ou divise par un nombre négatif</b>, on <b>change le sens</b> de l’inégalité. −2x &lt; 6 donne x &gt; −3.'),
        S('Tableau de signes', 'Pour étudier le signe d’un produit comme (x − 1)(x + 2), on étudie le signe de chaque facteur dans un tableau, puis on applique la règle des signes du produit.'),
        S('Développer, factoriser, fractions', 'Pour développer : (a + b)² = a² + 2ab + b². Pour factoriser : a² − b² = (a − b)(a + b). On additionne des fractions algébriques en les mettant au même dénominateur, sans oublier les valeurs interdites (dénominateur nul).'),
      ],
      recap: ['Comme une équation, mais : × ou ÷ par un négatif change le sens.', 'Tableau de signes pour un produit ou un quotient.', 'Dénominateur jamais nul.'],
      quiz: [Q('−3x &gt; 6 équivaut à :', ['x &gt; −2', 'x &lt; −2', 'x &lt; 2'], 1), Q('Solutions de x + 4 &gt; 7 :', ['x &gt; 3', 'x &lt; 3', 'x &gt; 11'], 0)] },

    { id: 'm2-fonctions', subj: 'maths', level: '2nde', icon: '📈', title: 'Généralités sur les fonctions',
      intro: 'Une fonction décrit comment une quantité dépend d’une autre. On la lit sur un tableau, une formule ou une courbe.',
      steps: [
        S('Image et antécédent', 'Une fonction f associe à tout x de son <b>ensemble de définition</b> un seul nombre f(x), son <b>image</b>. Si f(2) = 5, alors 5 est l’image de 2 et 2 est un <b>antécédent</b> de 5. Un nombre peut avoir plusieurs antécédents.'),
        S('La courbe représentative', 'La courbe est l’ensemble des points (x ; f(x)). Pour trouver l’image de a, on lit l’ordonnée du point d’abscisse a. Pour les antécédents de b, on cherche les points d’ordonnée b.', 'parabole'),
        S('Sens de variation', 'f est <b>croissante</b> sur un intervalle si, quand x augmente, f(x) augmente. Elle est <b>décroissante</b> si f(x) diminue. Un <b>tableau de variations</b> résume ce comportement, avec les maximums et les minimums.'),
        S('Résoudre graphiquement', 'Les solutions de f(x) = k sont les abscisses des points de la courbe à la hauteur k. Celles de f(x) &gt; k sont les abscisses où la courbe est au-dessus de la droite y = k.'),
      ],
      recap: ['f(x) est l’image de x.', 'Courbe : points (x ; f(x)).', 'Croissante : f(x) augmente avec x.', 'f(x) = k : on lit l’abscisse à la hauteur k.'],
      quiz: [Q('f(3) = 7 : 7 est … de 3.', ['l’antécédent', 'l’image'], 1), Q('Une fonction décroissante : quand x augmente,', ['f(x) augmente', 'f(x) diminue'], 1)] },

    { id: 'm2-reference', subj: 'maths', level: '2nde', icon: '〰️', title: 'Fonctions carré et inverse',
      intro: 'Deux fonctions de référence à connaître : celle qui élève au carré et celle qui prend l’inverse.',
      steps: [
        S('La fonction carré', 'f(x) = x². Sa courbe est une <b>parabole</b> symétrique par rapport à l’axe des ordonnées. Elle est décroissante sur ]−∞ ; 0] et croissante sur [0 ; +∞[. Son minimum est 0.', 'parabole'),
        S('Parité', 'f(−x) = f(x) : la fonction carré est <b>paire</b>, donc sa courbe est symétrique par rapport à l’axe des ordonnées. Deux opposés ont le même carré : 3² = (−3)² = 9.'),
        S('La fonction inverse', 'f(x) = 1/x, définie pour x ≠ 0. Sa courbe est une <b>hyperbole</b>. Elle est décroissante sur ]−∞ ; 0[ et sur ]0 ; +∞[. Elle est <b>impaire</b> : f(−x) = −f(x).', 'hyperbole'),
        S('Comparer', 'Sur [0 ; +∞[, la fonction carré est croissante : si 0 ≤ a &lt; b, alors a² &lt; b². La fonction inverse est décroissante sur ]0 ; +∞[ : si 0 &lt; a &lt; b, alors 1/a &gt; 1/b.'),
      ],
      recap: ['Carré : parabole, minimum 0, paire.', 'Inverse : hyperbole, définie pour x ≠ 0, impaire.', 'Sur ]0 ; +∞[ : le carré croît, l’inverse décroît.'],
      quiz: [Q('Quelle valeur n’a pas d’image par la fonction inverse ?', ['0', '1', '−1'], 0), Q('f(x) = x². f(−4) = ?', ['−16', '16', '8'], 1)] },

    { id: 'm2-vecteurs', subj: 'maths', level: '2nde', icon: '🏹', title: 'Les vecteurs',
      intro: 'Un vecteur indique un déplacement : une direction, un sens et une longueur.',
      steps: [
        S('Définition', 'Le vecteur AB représente le déplacement qui amène A en B. Il est caractérisé par sa <b>direction</b>, son <b>sens</b> et sa <b>norme</b> (la longueur AB). Deux vecteurs égaux ont les mêmes caractéristiques.'),
        S('Coordonnées', 'Si A(xA ; yA) et B(xB ; yB), alors le vecteur AB a pour coordonnées <b>(xB − xA ; yB − yA)</b>. Pour A(1 ; 2) et B(5 ; 4) : AB (4 ; 2).', 'vecteur'),
        S('Opérations', 'Somme : (a ; b) + (c ; d) = (a + c ; b + d). Produit par un réel k : k(a ; b) = (ka ; kb). Relation de Chasles : AB + BC = AC.'),
        S('Colinéarité', 'Deux vecteurs (a ; b) et (c ; d) sont <b>colinéaires</b> si ad − bc = 0. Alors les droites sont parallèles. Si AB et AC sont colinéaires, les points A, B et C sont alignés. ABCD est un parallélogramme si AB = DC.'),
      ],
      recap: ['AB = (xB − xA ; yB − yA).', 'Chasles : AB + BC = AC.', 'Colinéaires : ad − bc = 0.', 'ABCD parallélogramme : AB = DC.'],
      quiz: [Q('A(1 ; 2) et B(4 ; 6). Le vecteur AB a pour coordonnées :', ['(3 ; 4)', '(5 ; 8)', '(−3 ; −4)'], 0), Q('Les vecteurs (2 ; 3) et (4 ; 6) sont :', ['colinéaires', 'non colinéaires'], 0)] },

    { id: 'm2-droites', subj: 'maths', level: '2nde', icon: '📏', title: 'Équations de droites',
      intro: 'Une droite se décrit par une équation. Comment passer de deux points à l’équation ?',
      steps: [
        S('Équation réduite', 'Toute droite non verticale a une équation <b>y = mx + p</b>. m est le <b>coefficient directeur</b> (la pente) et p l’<b>ordonnée à l’origine</b>. Une droite verticale a une équation x = c.', 'droiteeq'),
        S('Trouver l’équation', 'La droite passe par A(1 ; 3) et B(3 ; 7). m = (7 − 3) ÷ (3 − 1) = 2. Puis p : 3 = 2 × 1 + p, donc p = 1. L’équation est y = 2x + 1.'),
        S('Droites parallèles', 'Deux droites non verticales sont <b>parallèles</b> si elles ont le <b>même coefficient directeur</b>. Elles sont sécantes sinon.'),
        S('Intersection', 'Pour trouver le point d’intersection de y = 2x + 1 et y = −x + 7, on résout 2x + 1 = −x + 7, donc 3x = 6, x = 2 et y = 5. Le point est (2 ; 5).'),
      ],
      recap: ['y = mx + p.', 'm = (yB − yA) ÷ (xB − xA).', 'Parallèles : même m.', 'Intersection : on résout un système.'],
      quiz: [Q('Droite par (0 ; 1) et (2 ; 5) : m = ?', ['2', '4', '1/2'], 0), Q('y = 3x + 1 et y = 3x − 2 sont :', ['parallèles', 'sécantes'], 0)] },

    { id: 'm2-geometrie-reperee', subj: 'maths', level: '2nde', icon: '📍', title: 'Géométrie dans un repère',
      intro: 'Avec les coordonnées, on calcule des distances et des milieux sans règle.',
      steps: [
        S('La distance', 'Dans un repère orthonormé, <b>AB = √((xB − xA)² + (yB − yA)²)</b>. Pour A(1 ; 2) et B(4 ; 6) : AB = √(9 + 16) = √25 = 5.', 'milieu'),
        S('Le milieu', 'Le milieu I de [AB] a pour coordonnées <b>((xA + xB) ÷ 2 ; (yA + yB) ÷ 2)</b>. Pour A(1 ; 2) et B(5 ; 4) : I(3 ; 3).'),
        S('Nature d’un triangle', 'On calcule les trois longueurs. Si deux sont égales, le triangle est isocèle. Si AB² + AC² = BC², le triangle est rectangle en A (réciproque de Pythagore).'),
        S('Parallélogramme', 'ABCD est un parallélogramme si ses diagonales ont le même milieu, ou si le vecteur AB est égal au vecteur DC. Les coordonnées permettent de le vérifier.'),
      ],
      recap: ['AB = √((xB − xA)² + (yB − yA)²).', 'Milieu : moyenne des coordonnées.', 'Réciproque de Pythagore pour un angle droit.'],
      quiz: [Q('Milieu de [AB] avec A(0 ; 0) et B(4 ; 6) :', ['(2 ; 3)', '(4 ; 6)', '(1 ; 1,5)'], 0), Q('Distance de A(0 ; 0) à B(3 ; 4) :', ['5', '7', '25'], 0)] },

    { id: 'm2-stats-probas', subj: 'maths', level: '2nde', icon: '📊', title: 'Statistiques et probabilités',
      intro: 'Résumer une série de données et calculer la chance d’événements combinés.',
      steps: [
        S('Médiane et quartiles', 'La <b>médiane</b> partage la série en deux moitiés. Le <b>premier quartile Q1</b> est tel qu’au moins 25 % des valeurs sont inférieures ou égales à Q1. Le <b>troisième quartile Q3</b> correspond à 75 %. L’<b>écart interquartile</b> est Q3 − Q1.', 'boite'),
        S('Moyenne et écart-type', 'La moyenne est la somme des valeurs divisée par l’effectif. L’<b>écart-type</b> σ mesure la dispersion des valeurs autour de la moyenne : plus il est grand, plus les valeurs sont dispersées.'),
        S('Probabilités : union et intersection', 'Pour deux événements A et B : <b>P(A ∪ B) = P(A) + P(B) − P(A ∩ B)</b>. Si A et B sont incompatibles (P(A ∩ B) = 0), on additionne simplement.'),
        S('Fluctuation d’échantillonnage', 'Sur un petit nombre d’essais, la fréquence observée peut s’éloigner de la probabilité. Plus on répète l’expérience, plus la fréquence se stabilise autour de la probabilité.'),
      ],
      recap: ['Médiane et quartiles Q1, Q3.', 'Écart-type : dispersion.', 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B).'],
      quiz: [Q('P(A) = 0,4, P(B) = 0,3 et P(A ∩ B) = 0,1. P(A ∪ B) = ?', ['0,6', '0,7', '0,12'], 0), Q('La médiane partage la série en :', ['deux groupes de même effectif', 'trois parties'], 0)] },

    /* ================================================================ 2nde : PHYSIQUE */
    { id: 'p2-vitesse', subj: 'physique', level: '2nde', icon: '🚀', title: 'Le mouvement et le vecteur vitesse',
      intro: 'Décrire un mouvement, c’est choisir un référentiel, une trajectoire et une vitesse.',
      steps: [
        S('Référentiel et trajectoire', 'Un mouvement se décrit par rapport à un <b>référentiel</b> (un objet de référence). La <b>trajectoire</b> est l’ensemble des positions occupées par un point de l’objet au cours du temps. Elle dépend du référentiel.'),
        S('Vitesse moyenne', 'La vitesse moyenne est <b>v = d ÷ Δt</b>. Pour d = 100 m en Δt = 10 s : v = 10 m/s. Pour passer de m/s à km/h, on multiplie par 3,6 : 10 m/s = 36 km/h.'),
        S('Le vecteur vitesse', 'Le <b>vecteur vitesse</b> d’un point est tangent à la trajectoire, dans le sens du mouvement. Sa longueur représente la valeur de la vitesse, à une échelle choisie.', 'vitesse2'),
        S('Types de mouvements', 'Le mouvement est <b>rectiligne uniforme</b> si la trajectoire est une droite et la vitesse constante. Il est <b>accéléré</b> si la valeur de la vitesse augmente, <b>ralenti</b> si elle diminue.'),
      ],
      recap: ['Le mouvement dépend du référentiel.', 'v = d ÷ Δt.', 'Le vecteur vitesse est tangent à la trajectoire.', '× 3,6 pour passer de m/s à km/h.'],
      quiz: [Q('d = 150 m et Δt = 5 s. v = ?', ['30 m/s', '750 m/s', '3 m/s'], 0), Q('20 m/s correspondent à :', ['72 km/h', '5,6 km/h'], 0)] },

    { id: 'p2-forces', subj: 'physique', level: '2nde', icon: '🏋️', title: 'Les forces et le principe d’inertie',
      intro: 'Une force est une action qui peut modifier le mouvement d’un objet. On la représente par un vecteur.',
      steps: [
        S('Modéliser une action', 'Une <b>force</b> modélise une action mécanique exercée par un objet sur un autre. Elle est représentée par un <b>vecteur force</b> : point d’application, direction, sens et valeur en newtons (N).'),
        S('Quelques forces', 'Le <b>poids</b> P = m × g est vertical, vers le bas. La <b>réaction du support</b> est perpendiculaire au support. La <b>tension d’un fil</b> est dirigée le long du fil. Les <b>frottements</b> s’opposent au mouvement.', 'forces2'),
        S('Le principe d’inertie', 'Si les forces qui s’exercent sur un objet <b>se compensent</b> (leur somme vectorielle est nulle), l’objet est au repos ou en mouvement rectiligne uniforme. Un objet immobile sur une table : poids et réaction se compensent.'),
        S('La réciproque', 'Si la vitesse d’un objet change (en valeur ou en direction), les forces ne se compensent pas. La somme des forces est alors non nulle : elle est dirigée dans le sens de la variation de vitesse.'),
      ],
      recap: ['Force : un vecteur, en newtons.', 'Poids : P = m × g.', 'Forces compensées : repos ou mouvement rectiligne uniforme.'],
      quiz: [Q('Un objet immobile sur une table : les forces :', ['se compensent', 'ne se compensent pas'], 0), Q('Le poids d’un objet de 2 kg (g = 10 N/kg) est :', ['2 N', '20 N', '0,2 N'], 1)] },

    { id: 'p2-son', subj: 'physique', level: '2nde', icon: '🔊', title: 'Les signaux sonores : période et fréquence',
      intro: 'Une note de musique, c’est un signal qui se répète régulièrement : un signal périodique.',
      steps: [
        S('Un signal périodique', 'Un signal est <b>périodique</b> s’il se reproduit identique à lui-même à intervalles de temps réguliers. La plus petite durée de répétition est la <b>période T</b>, en secondes.', 'signal'),
        S('La fréquence', 'La <b>fréquence</b> f est le nombre de périodes par seconde : <b>f = 1 ÷ T</b>. Elle se mesure en hertz (Hz). Si T = 0,002 s, alors f = 500 Hz.'),
        S('Hauteur et intensité', 'Plus la fréquence est grande, plus le son est <b>aigu</b>. Plus l’amplitude est grande, plus le son est <b>fort</b>. L’oreille humaine perçoit les sons de 20 Hz à 20 000 Hz. Au-delà : ultrasons.'),
        S('Vitesse du son', 'Dans l’air, le son se propage à environ 340 m/s. On l’utilise pour mesurer des distances : un écho met 2 s à revenir, donc l’obstacle est à 340 × 1 = 340 m (aller-retour).'),
      ],
      recap: ['f = 1 ÷ T (Hz).', 'Haute fréquence : son aigu.', 'Forte amplitude : son fort.', 'Vitesse du son dans l’air : environ 340 m/s.'],
      quiz: [Q('T = 0,01 s. f = ?', ['100 Hz', '0,01 Hz', '10 Hz'], 0), Q('Une fréquence plus grande donne un son plus :', ['grave', 'aigu'], 1)] },

    { id: 'p2-refraction', subj: 'physique', level: '2nde', icon: '🔍', title: 'Réfraction de la lumière',
      intro: 'Une paille semble cassée dans l’eau : la lumière change de direction en changeant de milieu.',
      steps: [
        S('Indice de réfraction', 'La lumière va plus vite dans l’air que dans l’eau ou le verre. L’<b>indice de réfraction</b> n d’un milieu vaut <b>n = c ÷ v</b>, où c = 3,00 × 10⁸ m/s est la vitesse dans le vide. Pour l’air, n ≈ 1 ; pour l’eau, n ≈ 1,33 ; pour le verre, n ≈ 1,5.'),
        S('La réfraction', 'Quand un rayon passe d’un milieu transparent à un autre, il est <b>dévié</b> : c’est la <b>réfraction</b>. Les angles se mesurent par rapport à la <b>normale</b> à la surface.', 'snell'),
        S('Lois de Snell-Descartes', 'Le rayon réfracté reste dans le plan d’incidence et <b>n₁ sin i₁ = n₂ sin i₂</b>. En passant de l’air vers le verre, le rayon se rapproche de la normale. Pour la réflexion, i = i’.'),
        S('Réflexion totale', 'En passant d’un milieu très réfringent vers un milieu moins réfringent, au-delà d’un angle limite, il n’y a plus de réfraction : toute la lumière est réfléchie. C’est le principe de la <b>fibre optique</b>.'),
      ],
      recap: ['n = c ÷ v.', 'n₁ sin i₁ = n₂ sin i₂.', 'Air → verre : le rayon se rapproche de la normale.', 'Réflexion totale : fibre optique.'],
      quiz: [Q('Indice de réfraction de l’air :', ['environ 1', 'environ 1,5'], 0), Q('De l’air vers l’eau, le rayon :', ['s’éloigne de la normale', 'se rapproche de la normale'], 1)] },

    { id: 'p2-spectres', subj: 'physique', level: '2nde', icon: '🌈', title: 'Spectres lumineux et longueurs d’onde',
      intro: 'La lumière d’une étoile ou d’une lampe contient des informations : on les lit dans son spectre.',
      steps: [
        S('Longueur d’onde', 'Une lumière se caractérise par sa <b>longueur d’onde λ</b>, en nanomètres (nm). Le visible va de 400 nm (violet) à 800 nm (rouge). En dessous : ultraviolets. Au-dessus : infrarouges.'),
        S('Spectre continu', 'Une lampe à incandescence ou un corps très chaud émet un <b>spectre continu</b> : toutes les couleurs. Plus l’objet est chaud, plus sa lumière tire vers le bleu.'),
        S('Spectre de raies', 'Un gaz chaud sous faible pression émet un <b>spectre de raies d’émission</b> : quelques raies colorées sur fond noir. Chaque élément chimique a ses raies propres, comme une empreinte.', 'raies'),
        S('Spectre d’absorption', 'Un gaz traversé par de la lumière blanche <b>absorbe</b> certaines longueurs d’onde, laissant des raies noires. Les astronomes en déduisent la composition des étoiles : par exemple, le Soleil contient de l’hydrogène et de l’hélium.'),
      ],
      recap: ['Visible : 400 nm à 800 nm.', 'Corps chaud : spectre continu.', 'Gaz : spectre de raies, empreinte de l’élément.'],
      quiz: [Q('La longueur d’onde se mesure en :', ['nanomètres', 'newtons'], 0), Q('Un gaz chaud sous faible pression émet un spectre :', ['continu', 'de raies'], 1)] },

    { id: 'p2-circuit', subj: 'physique', level: '2nde', icon: '🔌', title: 'Les circuits : lois des nœuds et des mailles',
      intro: 'Deux lois suffisent pour analyser un circuit : l’une sur les courants, l’autre sur les tensions.',
      steps: [
        S('Loi des nœuds', 'Dans un circuit, la somme des intensités qui arrivent à un nœud est égale à la somme des intensités qui en repartent : <b>I = I₁ + I₂</b>. Si I = 0,5 A et I₁ = 0,2 A, alors I₂ = 0,3 A.', 'mailles'),
        S('Loi des mailles', 'Dans une maille (une boucle fermée), la tension du générateur est égale à la somme des tensions aux bornes des dipôles : <b>E = U₁ + U₂</b>. Pour E = 9 V et U₁ = 5 V, on trouve U₂ = 4 V.'),
        S('Loi d’Ohm', 'Pour un conducteur ohmique : <b>U = R × I</b>, avec R en ohms (Ω). Pour 12 V aux bornes d’une résistance de 60 Ω : I = 12 ÷ 60 = 0,2 A.'),
        S('Associations de résistances', 'En <b>série</b> : R = R₁ + R₂. En <b>dérivation</b> : 1/R = 1/R₁ + 1/R₂. Deux résistances de 100 Ω en dérivation valent 50 Ω.'),
      ],
      recap: ['Nœuds : I = I₁ + I₂.', 'Mailles : E = U₁ + U₂.', 'U = R × I.', 'Série : R₁ + R₂.'],
      quiz: [Q('E = 6 V, U₁ = 2 V. U₂ = ?', ['4 V', '8 V', '3 V'], 0), Q('Deux résistances de 10 Ω en série valent :', ['5 Ω', '20 Ω', '10 Ω'], 1)] },

    /* ================================================================ 2nde : CHIMIE */
    { id: 'c2-mole', subj: 'chimie', level: '2nde', icon: '⚗️', title: 'La quantité de matière et la mole',
      intro: 'Compter des atomes un par un est impossible. On les compte par paquets : les moles.',
      steps: [
        S('La mole', 'Une <b>mole</b> contient 6,02 × 10²³ entités (atomes, molécules, ions). Ce nombre est la <b>constante d’Avogadro</b> Nₐ. La <b>quantité de matière</b> n se mesure en mol.', 'moleF'),
        S('Masse molaire', 'La <b>masse molaire</b> M est la masse d’une mole : en g/mol. M(H) = 1 g/mol, M(C) = 12 g/mol, M(O) = 16 g/mol. Pour l’eau H₂O : M = 2 × 1 + 16 = 18 g/mol.'),
        S('La relation', '<b>n = m ÷ M</b>. Pour 36 g d’eau : n = 36 ÷ 18 = 2 mol. Et m = n × M : 0,5 mol de CO₂ (M = 44 g/mol) pèse 22 g.'),
        S('Nombre d’entités', 'Le nombre d’entités est <b>N = n × Nₐ</b>. Dans 2 mol d’eau, il y a 2 × 6,02 × 10²³ = 1,20 × 10²⁴ molécules.'),
      ],
      recap: ['1 mol = 6,02 × 10²³ entités.', 'n = m ÷ M.', 'N = n × Nₐ.'],
      quiz: [Q('M(H₂O) = 18 g/mol. 54 g d’eau valent :', ['3 mol', '0,33 mol', '72 mol'], 0), Q('Une mole de molécules contient :', ['6,02 × 10²³ molécules', '6,02 × 10²³ grammes'], 0)] },

    { id: 'c2-concentration', subj: 'chimie', level: '2nde', icon: '🥛', title: 'Concentration, dissolution et dilution',
      intro: 'Un sirop trop sucré se dilue avec de l’eau. La chimie calcule exactement de combien.',
      steps: [
        S('Concentration molaire', 'La <b>concentration</b> d’une solution est <b>C = n ÷ V</b>, avec n en mol, V en litres et C en mol/L. 0,2 mol dissoutes dans 0,5 L donnent C = 0,4 mol/L.', 'verre'),
        S('Concentration massique', 'La <b>concentration massique</b> est <b>Cm = m ÷ V</b> en g/L. Elle est reliée à C par Cm = C × M. Pour du sel (M = 58,5 g/mol) à 0,5 mol/L : Cm ≈ 29 g/L.'),
        S('Dissoudre', 'Pour préparer 100 mL de solution à 0,10 mol/L de soluté de masse molaire M = 40 g/mol : n = C × V = 0,01 mol, donc m = 0,01 × 40 = 0,40 g. On dissout dans une fiole jaugée, puis on complète jusqu’au trait de jauge.'),
        S('Diluer', 'Lors d’une dilution, la quantité de matière de soluté ne change pas : <b>C₁ × V₁ = C₂ × V₂</b>. Pour obtenir 100 mL à 0,1 mol/L à partir d’une solution à 1 mol/L, il faut V₁ = 0,1 × 100 ÷ 1 = 10 mL.'),
      ],
      recap: ['C = n ÷ V (mol/L).', 'Cm = C × M.', 'Dilution : C₁V₁ = C₂V₂.'],
      quiz: [Q('0,5 mol dans 2 L : C = ?', ['0,25 mol/L', '4 mol/L', '1 mol/L'], 0), Q('On dilue 10 fois. La concentration est :', ['multipliée par 10', 'divisée par 10'], 1)] },

    { id: 'c2-periodique', subj: 'chimie', level: '2nde', icon: '🧬', title: 'Structure de l’atome et classification périodique',
      intro: 'Les éléments chimiques sont rangés dans un tableau. La place d’un élément dit comment il se comporte.',
      steps: [
        S('Noyau et nombre de charges', 'Un atome est formé d’un noyau (protons et neutrons) et d’électrons. Le nombre de protons est le <b>numéro atomique Z</b>. L’atome est neutre : il a Z électrons. Z définit l’élément : C (Z = 6), O (Z = 8).', 'periodique'),
        S('Les couches électroniques', 'Les électrons se répartissent en <b>couches</b> : K (2 électrons au maximum), L (8), M (8 pour les éléments des trois premières périodes). Carbone : (K)² (L)⁴. Oxygène : (K)² (L)⁶.'),
        S('Électrons de valence', 'Les électrons de la <b>dernière couche</b> sont les électrons de <b>valence</b>. Ils déterminent les propriétés chimiques. Les éléments d’une même colonne ont le même nombre d’électrons de valence.'),
        S('Gaz nobles et ions', 'Les gaz nobles (He, Ne, Ar) ont une couche externe saturée : ils sont très stables. Un atome tend à gagner ou perdre des électrons pour leur ressembler : Na devient Na⁺ (comme Ne) et Cl devient Cl⁻ (comme Ar).'),
      ],
      recap: ['Z = nombre de protons = nombre d’électrons.', 'Couches : K (2), L (8), M (8).', 'Même colonne : même nombre d’électrons de valence.'],
      quiz: [Q('Le carbone (Z = 6) a combien d’électrons de valence ?', ['2', '4', '6'], 1), Q('Na devient Na⁺ en :', ['perdant un électron', 'gagnant un électron'], 0)] },

    { id: 'c2-molecule-liaison', subj: 'chimie', level: '2nde', icon: '🔗', title: 'Molécules, liaisons et formules',
      intro: 'Les atomes se lient en partageant des électrons : cela forme les molécules.',
      steps: [
        S('La liaison covalente', 'Une <b>liaison covalente</b> est un doublet d’électrons partagé entre deux atomes. Chaque atome cherche à avoir une couche externe saturée : 2 électrons pour H, 8 pour C, N, O (règles du duet et de l’octet).'),
        S('Nombre de liaisons', 'H forme 1 liaison, O en forme 2, N en forme 3, C en forme 4. Dans l’eau H₂O, O est lié à deux H. Dans le méthane CH₄, C est lié à quatre H.'),
        S('Formule de Lewis', 'On représente la molécule en dessinant les <b>liaisons</b> (traits) et les <b>doublets non liants</b> (paires d’électrons sur un atome). Dans H₂O, O porte deux doublets non liants.'),
        S('Géométrie', 'La forme d’une molécule dépend du nombre de liaisons et de doublets autour de l’atome central : CO₂ est linéaire, H₂O est coudée, CH₄ est un tétraèdre.'),
      ],
      recap: ['Liaison covalente : doublet partagé.', 'H : 1 liaison, O : 2, N : 3, C : 4.', 'Règles du duet et de l’octet.'],
      quiz: [Q('Combien de liaisons forme l’atome de carbone ?', ['2', '4', '1'], 1), Q('H₂O est une molécule :', ['linéaire', 'coudée'], 1)] },

    { id: 'c2-transformation', subj: 'chimie', level: '2nde', icon: '🧪', title: 'Équation de réaction et réactif limitant',
      intro: 'Pour prévoir ce qu’une réaction produit, on suit les quantités de matière avec un tableau d’avancement.',
      steps: [
        S('Équation de réaction', 'Une transformation chimique est modélisée par une <b>équation</b> où les atomes et les charges sont conservés : <b>2 H₂ + O₂ → 2 H₂O</b>. Les nombres devant les formules sont les <b>nombres stœchiométriques</b>.', 'stoechio'),
        S('Quantités de réactifs', 'Les réactifs sont consommés dans les proportions de l’équation : 2 mol de H₂ réagissent avec 1 mol de O₂. Si on a 4 mol de H₂ et 1 mol de O₂, c’est O₂ qui manque.'),
        S('Le réactif limitant', 'Le <b>réactif limitant</b> est celui qui est entièrement consommé en premier : il détermine l’<b>avancement maximal</b> xmax. Ici, 1 mol de O₂ est consommée, donc xmax = 1 mol.'),
        S('Le tableau d’avancement', 'On écrit les quantités à l’état initial, en cours (avec x) et final (avec xmax). État final : H₂ : 4 − 2 × 1 = 2 mol restantes ; O₂ : 0 ; H₂O : 2 × 1 = 2 mol formées.'),
      ],
      recap: ['L’équation conserve atomes et charges.', 'Réactif limitant : consommé en premier.', 'État final avec xmax.'],
      quiz: [Q('Dans 2 H₂ + O₂ → 2 H₂O, 3 mol de O₂ réagissent avec :', ['3 mol de H₂', '6 mol de H₂', '1,5 mol de H₂'], 1), Q('Le réactif limitant est :', ['celui qui est en plus grande quantité', 'celui qui disparaît en premier'], 1)] },

    { id: 'c2-identification', subj: 'chimie', level: '2nde', icon: '🔬', title: 'Identifier des espèces chimiques',
      intro: 'Comment savoir si un colorant, un médicament ou une eau contient telle espèce ? Avec des analyses.',
      steps: [
        S('Les propriétés physiques', 'On identifie une espèce par des <b>grandeurs physiques</b> : température de fusion, d’ébullition, masse volumique, solubilité, indice de réfraction. Elles sont propres à chaque espèce pure.'),
        S('La chromatographie', 'La <b>chromatographie sur couche mince</b> sépare les espèces d’un mélange : un éluant monte le long de la plaque et entraîne les espèces à des vitesses différentes. Deux taches à la même hauteur correspondent à la même espèce.', 'chromato'),
        S('Le rapport frontal', 'Le <b>rapport frontal</b> est Rf = (distance parcourue par l’espèce) ÷ (distance parcourue par l’éluant). Il est propre à chaque espèce dans des conditions données.'),
        S('Spectrophotométrie', 'Une solution colorée absorbe la lumière. L’<b>absorbance A</b> d’une solution est proportionnelle à sa concentration : <b>A = k × C</b> (loi de Beer-Lambert). On mesure A, puis on en déduit C avec une courbe d’étalonnage.'),
      ],
      recap: ['Température de fusion, masse volumique : propres à une espèce.', 'Chromatographie : même hauteur, même espèce.', 'A = k × C.'],
      quiz: [Q('En chromatographie, deux taches à la même hauteur indiquent :', ['la même espèce', 'deux espèces différentes'], 0), Q('L’absorbance est proportionnelle à la :', ['concentration', 'température'], 0)] },
    /* ================================================================ 1re : MATHS */
    { id: 'm1-second-degre', subj: 'maths', level: '1re', icon: '🏔️', title: 'Le second degré',
      intro: 'Une fonction du second degré a pour courbe une parabole. Le discriminant dit combien de fois elle coupe l’axe.',
      steps: [
        S('La forme générale', 'Un trinôme du second degré s’écrit <b>ax² + bx + c</b> avec a ≠ 0. Sa courbe est une <b>parabole</b> : tournée vers le haut si a &gt; 0, vers le bas si a &lt; 0.', 'parabole'),
        S('Le discriminant', 'On calcule <b>Δ = b² − 4ac</b>. Si Δ &gt; 0 : deux racines x₁ et x₂ ; si Δ = 0 : une racine double ; si Δ &lt; 0 : aucune racine réelle.', 'discri'),
        S('Les racines', 'Si Δ &gt; 0, les racines sont <b>x = (−b ± √Δ) ÷ 2a</b>. Exemple : x² − 5x + 6, Δ = 25 − 24 = 1, donc x = (5 ± 1) ÷ 2 : les racines sont 2 et 3.'),
        S('Signe et forme factorisée', 'Le trinôme est du signe de <b>a</b> à l’extérieur des racines et du signe contraire entre elles. Avec les racines : ax² + bx + c = <b>a(x − x₁)(x − x₂)</b>. Le sommet de la parabole est en x = −b ÷ 2a.'),
      ],
      recap: ['Δ = b² − 4ac.', 'Δ > 0 : deux racines (−b ± √Δ) ÷ 2a.', 'Signe de a à l’extérieur des racines.'],
      quiz: [Q('Pour x² − 5x + 6, les racines sont :', ['2 et 3', '1 et 6', '−2 et −3'], 0), Q('Si Δ < 0, le trinôme a :', ['aucune racine réelle', 'deux racines', 'une racine double'], 0), Q('Le sommet est en x =', ['−b ÷ 2a', 'b ÷ a', 'c ÷ a'], 0)] },

    { id: 'm1-derivation', subj: 'maths', level: '1re', icon: '📉', title: 'Dérivation',
      intro: 'La dérivée mesure la pente de la courbe en un point : la vitesse à laquelle la fonction varie.',
      steps: [
        S('Le nombre dérivé', 'Le <b>nombre dérivé</b> f ′(a) est la pente de la <b>tangente</b> à la courbe au point d’abscisse a. C’est la limite du taux de variation (f(a+h) − f(a)) ÷ h quand h tend vers 0.', 'tangente'),
        S('Les dérivées usuelles', 'Constante : 0 · x : 1 · x² : 2x · xⁿ : n·xⁿ⁻¹ · 1/x : −1/x² · √x : 1 ÷ (2√x).'),
        S('Les règles de calcul', '(u + v)′ = u′ + v′ · (k·u)′ = k·u′ · <b>(u·v)′ = u′v + uv′</b> · (u/v)′ = (u′v − uv′) ÷ v².'),
        S('Équation de la tangente', 'La tangente en a a pour équation <b>y = f ′(a)(x − a) + f(a)</b>. Exemple : f(x) = x² en a = 2 : f ′(2) = 4, f(2) = 4, donc y = 4(x − 2) + 4 = 4x − 4.'),
      ],
      recap: ['f ′(a) = pente de la tangente.', '(xⁿ)′ = n·xⁿ⁻¹.', 'Tangente : y = f ′(a)(x − a) + f(a).'],
      quiz: [Q('La dérivée de x³ est :', ['3x²', 'x²', '3x'], 0), Q('f ′(a) représente :', ['la pente de la tangente', 'l’aire sous la courbe', 'la valeur de f(a)'], 0), Q('La tangente de x² en 2 est :', ['y = 4x − 4', 'y = 2x', 'y = 4x'], 0)] },

    { id: 'm1-variations', subj: 'maths', level: '1re', icon: '📊', title: 'Variations et extremums',
      intro: 'Le signe de la dérivée indique si la fonction monte ou descend.',
      steps: [
        S('Signe de la dérivée', 'Si f ′(x) &gt; 0 sur un intervalle, f est <b>croissante</b>. Si f ′(x) &lt; 0, f est <b>décroissante</b>. Si f ′(x) = 0 sur tout l’intervalle, f est constante.', 'parabole'),
        S('Tableau de variations', 'On résume : on étudie le signe de f ′, puis on place des flèches ↗ ou ↘ dans un tableau, avec les valeurs de f aux points importants.'),
        S('Extremums', 'Si f ′ s’annule <b>en changeant de signe</b> en a, f(a) est un <b>extremum</b> local : un maximum si f passe de ↗ à ↘, un minimum si f passe de ↘ à ↗.'),
        S('Un exemple', 'f(x) = x² − 4x. f ′(x) = 2x − 4, qui s’annule en 2. f décroît avant 2, croît après : <b>minimum f(2) = −4</b>.'),
      ],
      recap: ['f ′ > 0 : f croissante.', 'f ′ s’annule en changeant de signe : extremum.', 'Tableau de variations = signe de f ′ + flèches.'],
      quiz: [Q('Si f ′(x) < 0, f est :', ['décroissante', 'croissante', 'constante'], 0), Q('Le minimum de x² − 4x est :', ['−4', '4', '0'], 0)] },

    { id: 'm1-suites', subj: 'maths', level: '1re', icon: '🔢', title: 'Les suites arithmétiques et géométriques',
      intro: 'Une suite est une liste de nombres rangés : u₀, u₁, u₂… Deux modèles simples décrivent beaucoup de situations.',
      steps: [
        S('Définir une suite', 'On peut définir une suite par une <b>formule explicite</b> uₙ = f(n) ou par une <b>relation de récurrence</b> uₙ₊₁ = f(uₙ) avec un premier terme.', 'suite'),
        S('Suite arithmétique', 'On ajoute toujours la même <b>raison r</b> : uₙ₊₁ = uₙ + r. Alors <b>uₙ = u₀ + n·r</b>. Exemple : u₀ = 3, r = 2 : 3, 5, 7, 9…'),
        S('Suite géométrique', 'On multiplie toujours par la même <b>raison q</b> : uₙ₊₁ = q·uₙ. Alors <b>uₙ = u₀ × qⁿ</b>. Exemple : u₀ = 2, q = 3 : 2, 6, 18, 54… (modèle d’une croissance de +200 % à chaque étape).'),
        S('Sens de variation', 'Arithmétique : croissante si r &gt; 0. Géométrique de premier terme positif : croissante si q &gt; 1, décroissante si 0 &lt; q &lt; 1. On peut aussi étudier le signe de uₙ₊₁ − uₙ.'),
      ],
      recap: ['Arithmétique : uₙ = u₀ + n·r.', 'Géométrique : uₙ = u₀ × qⁿ.', 'Étudier uₙ₊₁ − uₙ pour la variation.'],
      quiz: [Q('Suite arithmétique, u₀ = 3, r = 2 : u₁₀ =', ['23', '30', '13'], 0), Q('Suite géométrique, u₀ = 2, q = 3 : u₃ =', ['54', '18', '27'], 0), Q('Une suite géométrique avec q > 1 et u₀ > 0 est :', ['croissante', 'décroissante'], 0)] },

    { id: 'm1-trigo', subj: 'maths', level: '1re', icon: '🎯', title: 'Trigonométrie : le cercle et les radians',
      intro: 'Le cercle trigonométrique transforme les angles en nombres : le cosinus et le sinus.',
      steps: [
        S('Le cercle trigonométrique', 'C’est le cercle de <b>rayon 1</b>. Pour un angle x, le point M du cercle a pour abscisse <b>cos x</b> et pour ordonnée <b>sin x</b>.', 'cercleTrigo'),
        S('Les radians', 'On mesure aussi les angles en <b>radians</b> : un tour complet vaut 2π rad, donc 180° = π rad. Ainsi 90° = π/2, 60° = π/3, 45° = π/4, 30° = π/6.'),
        S('Valeurs à connaître', 'cos 0 = 1, sin 0 = 0 · cos π/6 = √3/2, sin π/6 = 1/2 · cos π/4 = sin π/4 = √2/2 · cos π/3 = 1/2, sin π/3 = √3/2 · cos π/2 = 0, sin π/2 = 1.'),
        S('Relations', '<b>cos² x + sin² x = 1</b> (théorème de Pythagore dans le cercle). Aussi cos(−x) = cos x, sin(−x) = −sin x, et cos(π − x) = −cos x, sin(π − x) = sin x.'),
      ],
      recap: ['M(cos x ; sin x) sur le cercle de rayon 1.', '180° = π rad.', 'cos² x + sin² x = 1.'],
      quiz: [Q('cos² x + sin² x vaut :', ['1', '0', '2'], 0), Q('π/3 radians valent :', ['60°', '30°', '90°'], 0), Q('sin(π/6) =', ['1/2', '√3/2', '1'], 0)] },

    { id: 'm1-produit-scalaire', subj: 'maths', level: '1re', icon: '✖️', title: 'Le produit scalaire',
      intro: 'Le produit scalaire de deux vecteurs est un nombre. Il sert à mesurer des angles et à tester la perpendicularité.',
      steps: [
        S('Définition', 'Pour deux vecteurs u et v : <b>u · v = ‖u‖ × ‖v‖ × cos θ</b>, où θ est l’angle entre eux. Le résultat est un <b>nombre</b>, pas un vecteur.', 'prodscal'),
        S('Avec les coordonnées', 'Si u(x ; y) et v(x′ ; y′) : <b>u · v = x·x′ + y·y′</b>. Exemple : u(2 ; 3) et v(4 ; −1) donnent 8 − 3 = 5.'),
        S('Orthogonalité', 'Deux vecteurs sont <b>orthogonaux</b> (perpendiculaires) si et seulement si <b>u · v = 0</b>. Exemple : u(2 ; 3) et v(−3 ; 2) : −6 + 6 = 0, donc perpendiculaires.'),
        S('Calculer un angle', 'cos θ = (u · v) ÷ (‖u‖ × ‖v‖). Avec u(1 ; 0) et v(1 ; 1) : u · v = 1, ‖u‖ = 1, ‖v‖ = √2, donc cos θ = √2/2 et θ = 45°.'),
      ],
      recap: ['u · v = ‖u‖‖v‖cos θ.', 'u · v = xx′ + yy′.', 'u · v = 0 : vecteurs orthogonaux.'],
      quiz: [Q('Le produit scalaire de u(2 ; 3) et v(4 ; −1) est :', ['5', '11', '8'], 0), Q('Deux vecteurs sont perpendiculaires si leur produit scalaire vaut :', ['0', '1', '−1'], 0)] },

    { id: 'm1-proba-cond', subj: 'maths', level: '1re', icon: '🌳', title: 'Probabilités conditionnelles',
      intro: 'Quand on sait déjà qu’un événement s’est produit, la probabilité d’un autre peut changer.',
      steps: [
        S('Probabilité conditionnelle', 'La probabilité de B sachant A est <b>P_A(B) = P(A ∩ B) ÷ P(A)</b>, avec P(A) ≠ 0. On se restreint à l’univers où A est réalisé.', 'arbre'),
        S('L’arbre pondéré', 'Chaque branche porte une probabilité. Sur un chemin, on <b>multiplie</b> : P(A ∩ B) = P(A) × P_A(B). La somme des branches qui partent d’un même nœud vaut 1.'),
        S('Les probabilités totales', 'Si A et Ā partagent l’univers : <b>P(B) = P(A) × P_A(B) + P(Ā) × P_Ā(B)</b>. On additionne les chemins qui mènent à B.'),
        S('Indépendance', 'A et B sont <b>indépendants</b> si P(A ∩ B) = P(A) × P(B), c’est-à-dire si savoir A ne change pas la probabilité de B : P_A(B) = P(B).'),
      ],
      recap: ['P_A(B) = P(A ∩ B) ÷ P(A).', 'Chemin : on multiplie. Plusieurs chemins : on additionne.', 'Indépendants : P(A ∩ B) = P(A) × P(B).'],
      quiz: [Q('Sur un chemin d’un arbre, on :', ['multiplie les probabilités', 'additionne les probabilités'], 0), Q('P(A) = 0,4 et P_A(B) = 0,5. Alors P(A ∩ B) =', ['0,2', '0,9', '0,8'], 0)] },

    /* ================================================================ 1re : PHYSIQUE */
    { id: 'p1-newton', subj: 'physique', level: '1re', icon: '🚀', title: 'Les lois de Newton',
      intro: 'La deuxième loi de Newton relie la force résultante et la façon dont la vitesse change.',
      steps: [
        S('Le vecteur variation de vitesse', 'Quand la vitesse change, le vecteur vitesse varie : Δv = v₂ − v₁. L’accélération moyenne est a = Δv ÷ Δt, en m/s².'),
        S('Deuxième loi de Newton', 'Dans un référentiel galiléen : <b>ΣF = m × a</b>. La somme des forces est de même direction et de même sens que l’accélération ; m est la masse en kg.', 'newton2'),
        S('Troisième loi', 'Si A exerce une force sur B, alors B exerce sur A une force <b>opposée</b> : même direction, sens contraire, même valeur (principe des actions réciproques).'),
        S('Un exemple', 'Une voiture de 1 000 kg soumise à une force résultante de 2 000 N accélère de a = 2 000 ÷ 1 000 = <b>2 m/s²</b> : sa vitesse augmente de 2 m/s chaque seconde.'),
      ],
      recap: ['ΣF = m × a.', 'ΣF et a ont même direction et même sens.', 'Actions réciproques : forces opposées.'],
      quiz: [Q('Une force résultante de 2 000 N sur 1 000 kg donne :', ['2 m/s²', '0,5 m/s²', '2 000 m/s²'], 0), Q('Si ΣF = 0, le vecteur vitesse :', ['reste constant', 'augmente'], 0)] },

    { id: 'p1-travail-energie', subj: 'physique', level: '1re', icon: '🏗️', title: 'Travail d’une force et énergie cinétique',
      intro: 'Une force qui déplace un objet lui transfère de l’énergie : on l’appelle le travail.',
      steps: [
        S('Le travail d’une force', 'Pour une force constante F et un déplacement AB : <b>W = F × AB × cos α</b>, en joules (J), où α est l’angle entre la force et le déplacement. Le travail est moteur si α &lt; 90°, résistant si α &gt; 90°.'),
        S('L’énergie cinétique', 'Un objet de masse m et de vitesse v possède l’énergie <b>Ec = ½ m v²</b> (en joules, avec v en m/s). Doubler la vitesse multiplie l’énergie par 4.'),
        S('Le théorème de l’énergie cinétique', 'La variation d’énergie cinétique est égale à la somme des travaux des forces : <b>ΔEc = ΣW</b>. Un travail moteur fait gagner de la vitesse ; un travail résistant en fait perdre.'),
        S('Exemple', 'Une voiture de 1 000 kg roule à 20 m/s : Ec = ½ × 1 000 × 20² = <b>200 000 J</b>. Pour l’arrêter, il faut que les freins fournissent un travail résistant de −200 000 J.'),
      ],
      recap: ['W = F × AB × cos α.', 'Ec = ½ m v².', 'ΔEc = ΣW.'],
      quiz: [Q('L’énergie cinétique de 1 000 kg à 20 m/s est :', ['200 000 J', '20 000 J', '400 000 J'], 0), Q('Si on double la vitesse, Ec est multipliée par :', ['4', '2', '8'], 0)] },

    { id: 'p1-energie-mecanique', subj: 'physique', level: '1re', icon: '🎢', title: 'Énergie potentielle et énergie mécanique',
      intro: 'Dans une chute, l’énergie de position se transforme en énergie de mouvement.',
      steps: [
        S('Énergie potentielle de pesanteur', 'Un objet de masse m à la hauteur z possède <b>Epp = m × g × z</b>. Elle augmente quand l’objet monte, diminue quand il descend.'),
        S('L’énergie mécanique', 'C’est la somme <b>Em = Ec + Epp</b>. Elle mesure l’énergie totale de l’objet liée à son mouvement et à sa position.', 'energieChute'),
        S('Conservation', 'Si seules des forces <b>conservatives</b> (comme le poids) travaillent, <b>Em est constante</b> : ce que l’objet perd en hauteur, il le gagne en vitesse. Avec des frottements, Em diminue : l’énergie est transférée sous forme de chaleur.'),
        S('Exemple', 'Un objet de 1 kg lâché de 5 m (g = 10 N/kg) : Epp = 50 J. En bas, Epp = 0 et Ec = 50 J, donc ½ × 1 × v² = 50 et <b>v = 10 m/s</b>.'),
      ],
      recap: ['Epp = m g z.', 'Em = Ec + Epp.', 'Sans frottements, Em reste constante.'],
      quiz: [Q('Un objet de 1 kg lâché de 5 m arrive en bas à :', ['10 m/s', '5 m/s', '50 m/s'], 0), Q('Avec des frottements, l’énergie mécanique :', ['diminue', 'reste constante'], 0)] },

    { id: 'p1-ondes', subj: 'physique', level: '1re', icon: '🌊', title: 'Les ondes : diffraction et interférences',
      intro: 'Les ondes se comportent comme des vagues : elles contournent les obstacles et se combinent.',
      steps: [
        S('Une onde transporte de l’énergie', 'Une <b>onde</b> est la propagation d’une perturbation sans transport de matière. Elle est caractérisée par sa période T, sa fréquence f = 1/T et sa <b>longueur d’onde λ = v × T</b>.'),
        S('La diffraction', 'Quand une onde rencontre une ouverture ou un obstacle de taille <b>comparable à sa longueur d’onde</b>, elle s’étale et change de direction : c’est la <b>diffraction</b>.', 'diffraction'),
        S('Les interférences', 'Deux ondes de même fréquence qui se rencontrent s’additionnent : <b>interférences constructives</b> (ondes en phase, amplitude plus grande) ou <b>destructives</b> (ondes en opposition, amplitude nulle).'),
        S('Le son et la lumière', 'La diffraction et les interférences de la lumière (franges alternées claires et sombres) montrent que la lumière a un comportement ondulatoire. Le son se diffracte aussi : on entend derrière un mur.'),
      ],
      recap: ['λ = v × T.', 'Diffraction : l’onde s’étale par une ouverture de taille proche de λ.', 'Interférences : constructives ou destructives.'],
      quiz: [Q('La diffraction est marquée quand l’ouverture est :', ['de taille proche de λ', 'beaucoup plus grande que λ'], 0), Q('Des interférences destructives donnent :', ['une amplitude nulle', 'une amplitude double'], 0)] },

    { id: 'p1-photon', subj: 'physique', level: '1re', icon: '💡', title: 'Photons et niveaux d’énergie',
      intro: 'La lumière est aussi faite de grains d’énergie, les photons. Les atomes n’émettent que certaines couleurs.',
      steps: [
        S('Le photon', 'Un <b>photon</b> est un grain de lumière d’énergie <b>E = h × ν = h × c ÷ λ</b>, avec h = 6,63 × 10⁻³⁴ J·s, c = 3,00 × 10⁸ m/s. Plus la longueur d’onde est courte, plus l’énergie est grande.'),
        S('Niveaux d’énergie', 'L’énergie d’un atome est <b>quantifiée</b> : il n’existe que des niveaux E₁, E₂, E₃… bien précis.', 'niveaux'),
        S('Émission et absorption', 'En passant d’un niveau élevé à un niveau plus bas, l’atome <b>émet</b> un photon d’énergie ΔE = E₃ − E₁. Il peut aussi <b>absorber</b> un photon d’énergie exactement égale à l’écart entre deux niveaux.'),
        S('Les spectres', 'Chaque élément a ses propres niveaux, donc ses propres raies : le spectre de raies est son empreinte. L’électronvolt (1 eV = 1,6 × 10⁻¹⁹ J) est l’unité pratique de ces énergies.', 'raies'),
      ],
      recap: ['E = h × c ÷ λ.', 'Niveaux d’énergie quantifiés.', 'ΔE = énergie du photon émis ou absorbé.'],
      quiz: [Q('Un photon de longueur d’onde plus courte a une énergie :', ['plus grande', 'plus petite'], 0), Q('Un atome qui émet un photon passe :', ['d’un niveau haut à un niveau bas', 'd’un niveau bas à un niveau haut'], 0)] },

    { id: 'p1-champs', subj: 'physique', level: '1re', icon: '🧲', title: 'Champs et forces à distance',
      intro: 'Certaines forces agissent sans contact : la pesanteur, l’électricité, le magnétisme.',
      steps: [
        S('Un champ, c’est quoi ?', 'Un <b>champ</b> associe à chaque point de l’espace une grandeur : le champ de pesanteur g, le champ électrique E, le champ magnétique B. On le représente par des lignes de champ.'),
        S('La force de gravitation', 'Deux masses m₁ et m₂ à distance d s’attirent avec la force <b>F = G × m₁ × m₂ ÷ d²</b>, avec G = 6,67 × 10⁻¹¹ N·m²/kg². Doubler la distance divise la force par 4.'),
        S('La force électrique', 'Deux charges q₁ et q₂ exercent la force <b>F = k × |q₁ × q₂| ÷ d²</b> (loi de Coulomb), attractive si les charges sont de signes contraires, répulsive sinon. Dans un champ E, une charge q subit F = q × E.'),
        S('Champ de pesanteur', 'Près de la Terre, g ≈ 9,8 N/kg : le poids est P = m × g. Sur la Lune, g ≈ 1,6 N/kg : le même objet y pèse 6 fois moins, sa masse ne change pas.'),
      ],
      recap: ['Gravitation : F = G m₁ m₂ ÷ d².', 'Coulomb : F = k |q₁q₂| ÷ d².', 'Charges de même signe : répulsion.'],
      quiz: [Q('Si on double la distance, la force de gravitation est :', ['divisée par 4', 'divisée par 2', 'doublée'], 0), Q('Deux charges de même signe :', ['se repoussent', 's’attirent'], 0)] },

    /* ================================================================ 1re : CHIMIE */
    { id: 'c1-oxydoreduction', subj: 'chimie', level: '1re', icon: '🔋', title: 'Oxydoréduction',
      intro: 'Quand des électrons passent d’une espèce à une autre, il y a une réaction d’oxydoréduction.',
      steps: [
        S('Oxydant et réducteur', 'Un <b>oxydant</b> est une espèce qui peut <b>capter</b> des électrons. Un <b>réducteur</b> est une espèce qui peut en <b>céder</b>. Un couple s’écrit Ox/Red avec la demi-équation Ox + n e⁻ = Red.', 'redox'),
        S('Exemples de couples', 'Cu²⁺/Cu : Cu²⁺ + 2 e⁻ = Cu · Zn²⁺/Zn : Zn²⁺ + 2 e⁻ = Zn · Fe³⁺/Fe²⁺ : Fe³⁺ + e⁻ = Fe²⁺ · H⁺/H₂ : 2 H⁺ + 2 e⁻ = H₂.'),
        S('Écrire la réaction', 'On combine deux demi-équations pour que les <b>électrons échangés se compensent</b>. Exemple : Zn + Cu²⁺ → Zn²⁺ + Cu. Le zinc est oxydé (il cède 2 e⁻), le cuivre II est réduit (il capte 2 e⁻).'),
        S('La pile', 'Dans une <b>pile</b>, les deux demi-réactions se font dans des compartiments séparés : les électrons circulent dans le circuit extérieur, de l’électrode négative (où a lieu l’oxydation) vers la positive (où a lieu la réduction).'),
      ],
      recap: ['Oxydant : capte des e⁻.', 'Réducteur : cède des e⁻.', 'Oxydation à l’anode, réduction à la cathode.'],
      quiz: [Q('Un réducteur est une espèce qui :', ['cède des électrons', 'capte des électrons'], 0), Q('Dans Zn + Cu²⁺ → Zn²⁺ + Cu, le zinc est :', ['oxydé', 'réduit'], 0)] },

    { id: 'c1-titrage', subj: 'chimie', level: '1re', icon: '🧫', title: 'Dosage par titrage',
      intro: 'Pour connaître la concentration d’une solution, on la fait réagir avec une solution connue jusqu’à l’équivalence.',
      steps: [
        S('Le principe', 'On verse peu à peu un réactif <b>titrant</b> (de concentration connue) dans la solution à doser, jusqu’à ce que le réactif à doser soit entièrement consommé. Le titrage repose sur une réaction rapide et totale.', 'titrage'),
        S('L’équivalence', 'À l’<b>équivalence</b>, les réactifs ont été introduits dans les proportions de l’équation : le réactif titré et le réactif titrant sont <b>tous deux entièrement consommés</b>. On la repère par un changement de couleur, de pH ou de conductivité.'),
        S('Le calcul', 'Pour une réaction 1 : 1, à l’équivalence : <b>C × V = C_titrant × V_équivalent</b>. Exemple : 10,0 mL de vinaigre dosés par de la soude à 0,10 mol/L ; V_éq = 12,0 mL : C = 0,10 × 12,0 ÷ 10,0 = <b>0,12 mol/L</b>.'),
        S('Si les coefficients diffèrent', 'Il faut utiliser le tableau d’avancement : à l’équivalence, n(réactif titré) ÷ a = n(titrant) ÷ b, où a et b sont les coefficients stœchiométriques.'),
      ],
      recap: ['Titrant de concentration connue.', 'Équivalence : réactifs tous deux consommés.', 'Réaction 1 : 1 : C × V = C_t × V_éq.'],
      quiz: [Q('À l’équivalence :', ['les deux réactifs sont entièrement consommés', 'il ne reste que le titrant'], 0), Q('10,0 mL dosés par 0,10 mol/L avec V_éq = 12,0 mL (1 : 1) donnent C =', ['0,12 mol/L', '0,083 mol/L', '1,2 mol/L'], 0)] },

    { id: 'c1-organique', subj: 'chimie', level: '1re', icon: '⛓️', title: 'Chimie organique : alcanes et alcools',
      intro: 'La chimie organique étudie les molécules construites sur des chaînes d’atomes de carbone.',
      steps: [
        S('Les alcanes', 'Les <b>alcanes</b> ne contiennent que du carbone et de l’hydrogène, liés par des liaisons simples : formule <b>CₙH₂ₙ₊₂</b>. Méthane CH₄, éthane C₂H₆, propane C₃H₈, butane C₄H₁₀.', 'alcane'),
        S('Nommer', 'Le nom vient du nombre d’atomes de carbone de la chaîne : <b>méth</b> (1), <b>éth</b> (2), <b>prop</b> (3), <b>but</b> (4), <b>pent</b> (5), <b>hex</b> (6), suivi de la terminaison <b>-ane</b>. Une ramification se nomme avec un préfixe : 2-méthylpropane.'),
        S('Les alcools', 'Un <b>alcool</b> porte un groupe hydroxyle <b>–OH</b> sur un carbone. Éthanol : CH₃–CH₂–OH. Le nom se termine par <b>-ol</b>. Les alcools sont solubles dans l’eau quand leur chaîne est courte.'),
        S('Propriétés', 'Plus la chaîne est longue, plus la température d’ébullition est élevée. Le groupe –OH crée des liaisons hydrogène : un alcool bout à une température plus haute que l’alcane de même taille.'),
      ],
      recap: ['Alcane : CₙH₂ₙ₊₂.', 'méth, éth, prop, but, pent, hex.', 'Alcool : groupe –OH, nom en -ol.'],
      quiz: [Q('La formule du propane est :', ['C₃H₈', 'C₃H₆', 'C₂H₆'], 0), Q('Un alcool contient le groupe :', ['–OH', '–COOH'], 0)] },

    { id: 'c1-combustion', subj: 'chimie', level: '1re', icon: '🔥', title: 'Les combustions',
      intro: 'Brûler un carburant, c’est le faire réagir avec le dioxygène en libérant de l’énergie.',
      steps: [
        S('Une réaction avec le dioxygène', 'Une <b>combustion</b> est une réaction entre un combustible (méthane, propane, essence, bois…) et le dioxygène. Il faut trois ingrédients : combustible, comburant (O₂) et une énergie d’activation (étincelle, flamme).'),
        S('Combustion complète', 'Avec assez de dioxygène, un hydrocarbure produit du <b>dioxyde de carbone et de l’eau</b>. Exemple : CH₄ + 2 O₂ → CO₂ + 2 H₂O.'),
        S('Combustion incomplète', 'Avec trop peu de dioxygène, on obtient aussi du <b>monoxyde de carbone CO</b> (gaz toxique, inodore) et du carbone (suie). D’où le danger d’un chauffage mal ventilé.'),
        S('Énergie et climat', 'La combustion libère de l’énergie (réaction exothermique) mais aussi du CO₂, un gaz à effet de serre. Brûler 1 kg d’essence rejette environ 3 kg de CO₂.'),
      ],
      recap: ['Combustible + dioxygène → énergie.', 'Complète : CO₂ + H₂O.', 'Incomplète : CO toxique et suie.'],
      quiz: [Q('Une combustion complète d’un hydrocarbure donne :', ['CO₂ et H₂O', 'CO et suie'], 0), Q('Le monoxyde de carbone est :', ['toxique et inodore', 'inoffensif'], 0)] },

    { id: 'c1-energie-reaction', subj: 'chimie', level: '1re', icon: '🌡️', title: 'Énergie des réactions chimiques',
      intro: 'Une réaction chimique casse des liaisons et en forme d’autres : cela libère ou absorbe de l’énergie.',
      steps: [
        S('Casser et former des liaisons', 'Casser une liaison demande de l’énergie ; en former une en libère. L’énergie d’une liaison (en kJ/mol) est celle qu’il faut fournir pour casser une mole de ces liaisons.'),
        S('Exothermique et endothermique', 'Si on libère plus d’énergie qu’on en dépense, la réaction est <b>exothermique</b> (elle chauffe : combustion). Dans le cas contraire, elle est <b>endothermique</b> (elle refroidit : poche de froid instantané).'),
        S('Le pouvoir calorifique', 'Le <b>pouvoir calorifique</b> d’un combustible est l’énergie libérée par la combustion d’une unité de masse. Pour l’essence : environ 45 MJ/kg ; pour le bois sec : environ 15 MJ/kg ; pour le dihydrogène : environ 120 MJ/kg.'),
        S('Un calcul', 'L’énergie libérée par n moles de réactif est <b>E = n × énergie molaire de réaction</b>. Si on brûle 0,5 mol de méthane (890 kJ/mol) : E = 0,5 × 890 = <b>445 kJ</b>.'),
      ],
      recap: ['Casser des liaisons coûte, en former libère.', 'Exothermique : libère de l’énergie.', 'E = n × énergie molaire.'],
      quiz: [Q('Une combustion est une réaction :', ['exothermique', 'endothermique'], 0), Q('0,5 mol de méthane (890 kJ/mol) libère :', ['445 kJ', '890 kJ', '1 780 kJ'], 0)] },
    /* ================================================================ Terminale : MATHS */
    { id: 'mt-limites', subj: 'maths', level: 'term', icon: '♾️', title: 'Limites de fonctions et asymptotes',
      intro: 'La limite décrit ce que devient f(x) quand x devient très grand, ou s’approche d’une valeur.',
      steps: [
        S('Limite en l’infini', 'On écrit <b>lim f(x) = ℓ</b> quand x → +∞ si f(x) se rapproche de ℓ. La droite <b>y = ℓ</b> est alors une asymptote horizontale de la courbe.', 'asymptote'),
        S('Limite infinie', 'Si f(x) devient aussi grand qu’on veut, lim f(x) = +∞. Exemples : lim x² = +∞ ; lim 1/x = 0 quand x → +∞ ; lim 1/x = +∞ quand x → 0 avec x &gt; 0 (asymptote verticale x = 0).'),
        S('Opérations sur les limites', 'On additionne, multiplie ou divise les limites quand cela a un sens. Les <b>formes indéterminées</b> (∞ − ∞, 0 × ∞, ∞/∞, 0/0) demandent un calcul : factoriser par le terme dominant.'),
        S('Exemple', 'f(x) = (3x² + 1) ÷ (x² + 5) : on factorise par x² en haut et en bas, ce qui donne (3 + 1/x²) ÷ (1 + 5/x²) qui tend vers <b>3</b>. La droite y = 3 est asymptote horizontale.'),
      ],
      recap: ['lim f(x) = ℓ : asymptote horizontale y = ℓ.', 'Formes indéterminées : factoriser.', 'lim 1/x = 0 en +∞.'],
      quiz: [Q('lim 1/x quand x → +∞ vaut :', ['0', '+∞', '1'], 0), Q('f(x) = (3x² + 1) ÷ (x² + 5) tend vers :', ['3', '0', '+∞'], 0), Q('∞ − ∞ est :', ['une forme indéterminée', 'toujours 0'], 0)] },

    { id: 'mt-continuite', subj: 'maths', level: 'term', icon: '🧵', title: 'Continuité et théorème des valeurs intermédiaires',
      intro: 'Une fonction continue se trace sans lever le crayon. Cela permet de prouver qu’une équation a une solution.',
      steps: [
        S('Fonction continue', 'Une fonction est <b>continue</b> sur un intervalle si on peut tracer sa courbe sans lever le crayon. Les fonctions usuelles (polynômes, exp, ln, racine) sont continues sur leur domaine. Une fonction dérivable est continue.'),
        S('Le théorème des valeurs intermédiaires', 'Si f est continue sur [a ; b], alors pour tout nombre k compris entre f(a) et f(b), l’équation <b>f(x) = k</b> a au moins une solution dans [a ; b].'),
        S('Cas strictement monotone', 'Si f est de plus <b>strictement monotone</b> sur [a ; b], la solution est <b>unique</b>. On parle du corollaire du TVI (théorème de la bijection).'),
        S('Exemple', 'f(x) = x³ + x − 1 est continue et strictement croissante. f(0) = −1 &lt; 0 et f(1) = 1 &gt; 0, donc l’équation f(x) = 0 a une <b>unique solution</b> entre 0 et 1 (environ 0,68).'),
      ],
      recap: ['Continue : sans lever le crayon.', 'TVI : f(x) = k a une solution.', 'Strictement monotone : solution unique.'],
      quiz: [Q('Pour avoir une solution unique avec le TVI, il faut f :', ['continue et strictement monotone', 'seulement positive'], 0), Q('f(0) = −1 et f(1) = 1, f continue : f(x) = 0 a :', ['au moins une solution', 'aucune solution'], 0)] },

    { id: 'mt-exponentielle', subj: 'maths', level: 'term', icon: '📈', title: 'La fonction exponentielle',
      intro: 'L’exponentielle est la fonction qui est égale à sa propre dérivée. Elle décrit les croissances très rapides.',
      steps: [
        S('Définition', 'La fonction <b>exponentielle</b> est l’unique fonction dérivable sur ℝ telle que <b>f ′ = f</b> et f(0) = 1. On la note f(x) = eˣ, avec e ≈ 2,718.', 'expo'),
        S('Propriétés', 'eˣ &gt; 0 pour tout x · e⁰ = 1 · <b>eᵃ⁺ᵇ = eᵃ × eᵇ</b> · e⁻ᵃ = 1/eᵃ · (eᵃ)ⁿ = eⁿᵃ. La fonction est strictement croissante sur ℝ.'),
        S('Limites', 'lim eˣ = +∞ quand x → +∞ ; lim eˣ = 0 quand x → −∞. Aussi lim eˣ ÷ x = +∞ : l’exponentielle l’emporte sur toute puissance de x (croissances comparées).'),
        S('Dérivée composée', 'Si u est dérivable, <b>(e^u)′ = u′ × e^u</b>. Exemple : (e^(2x))′ = 2e^(2x). Cela sert à étudier des fonctions comme f(x) = x·eˣ ou e^(−x²).'),
      ],
      recap: ['(eˣ)′ = eˣ, e⁰ = 1.', 'eᵃ⁺ᵇ = eᵃ × eᵇ.', '(e^u)′ = u′ e^u.'],
      quiz: [Q('La dérivée de eˣ est :', ['eˣ', 'x·eˣ⁻¹', '1'], 0), Q('La dérivée de e^(2x) est :', ['2e^(2x)', 'e^(2x)', '2x·e^(2x)'], 0), Q('eˣ est toujours :', ['strictement positive', 'négative pour x < 0'], 0)] },

    { id: 'mt-logarithme', subj: 'maths', level: 'term', icon: '🔄', title: 'Le logarithme népérien',
      intro: 'Le logarithme est la fonction réciproque de l’exponentielle : il répond à la question « eᵡ vaut combien ? ».',
      steps: [
        S('Définition', 'Pour tout x &gt; 0, <b>ln x</b> est l’unique solution y de l’équation eʸ = x. Ainsi e^(ln x) = x et ln(eˣ) = x. Domaine : ]0 ; +∞[.', 'lncourbe'),
        S('Propriétés', '<b>ln(ab) = ln a + ln b</b> · ln(a/b) = ln a − ln b · ln(aⁿ) = n ln a · ln 1 = 0 · ln e = 1. Le logarithme transforme les produits en sommes.'),
        S('Variations et dérivée', 'La dérivée de ln x est <b>1/x</b>, positive : ln est strictement croissante sur ]0 ; +∞[. lim ln x = +∞ en +∞ et lim ln x = −∞ en 0⁺.'),
        S('Résoudre des équations', 'eˣ = 5 ⇔ x = ln 5. ln x = 2 ⇔ x = e². Pour comparer : ln a &lt; ln b ⇔ a &lt; b (a, b &gt; 0). Exemple : 2ˣ = 10 donne x = ln 10 ÷ ln 2 ≈ 3,32.'),
      ],
      recap: ['ln x : réciproque de eˣ.', 'ln(ab) = ln a + ln b.', '(ln x)′ = 1/x.'],
      quiz: [Q('ln(e) vaut :', ['1', '0', 'e'], 0), Q('eˣ = 5 équivaut à :', ['x = ln 5', 'x = 5e'], 0), Q('ln(ab) =', ['ln a + ln b', 'ln a × ln b'], 0)] },

    { id: 'mt-suites-limites', subj: 'maths', level: 'term', icon: '🔁', title: 'Suites : récurrence et limites',
      intro: 'Pour démontrer une propriété vraie pour tous les entiers, on utilise le raisonnement par récurrence.',
      steps: [
        S('La récurrence', 'Pour montrer qu’une propriété P(n) est vraie pour tout n ≥ n₀ : <b>initialisation</b> (P(n₀) est vraie), <b>hérédité</b> (si P(n) est vraie, alors P(n+1) l’est), et on conclut. C’est l’effet domino.'),
        S('Limite d’une suite', 'Une suite <b>converge</b> vers ℓ si uₙ se rapproche de ℓ quand n grandit. Si uₙ devient aussi grand qu’on veut, elle diverge vers +∞. Une suite géométrique de raison q : qⁿ tend vers 0 si −1 &lt; q &lt; 1 et vers +∞ si q &gt; 1.'),
        S('Théorème de convergence', 'Toute suite <b>croissante et majorée</b> converge. Toute suite décroissante et minorée converge. On ne connaît pas toujours la limite, mais on sait qu’elle existe.'),
        S('Théorème des gendarmes', 'Si uₙ ≤ vₙ ≤ wₙ et que uₙ et wₙ tendent vers la même limite ℓ, alors vₙ tend aussi vers ℓ. Exemple : (−1)ⁿ ÷ n est encadré par −1/n et 1/n, donc tend vers 0.'),
      ],
      recap: ['Récurrence : initialisation + hérédité.', 'Croissante et majorée : converge.', 'qⁿ → 0 si −1 < q < 1.'],
      quiz: [Q('Une suite croissante et majorée :', ['converge', 'diverge'], 0), Q('(0,5)ⁿ tend vers :', ['0', '+∞', '1'], 0)] },

    { id: 'mt-integrales', subj: 'maths', level: 'term', icon: '∫', title: 'Primitives et intégrales',
      intro: 'L’intégrale mesure une aire sous une courbe. Le calcul passe par les primitives.',
      steps: [
        S('Primitive', 'F est une <b>primitive</b> de f si F ′ = f. Elle est définie à une constante près. Exemples : une primitive de x est x²/2 ; de eˣ est eˣ ; de 1/x est ln x (sur ]0 ; +∞[) ; de xⁿ est xⁿ⁺¹/(n+1).'),
        S('L’intégrale', 'Si f est continue sur [a ; b] et F une primitive : <b>∫ₐᵇ f(x) dx = F(b) − F(a)</b>. Si f ≥ 0, c’est l’<b>aire</b> sous la courbe entre a et b, en unités d’aire.', 'aire'),
        S('Propriétés', 'Linéarité : ∫(f + g) = ∫f + ∫g et ∫(k·f) = k·∫f · Relation de Chasles : ∫ₐᶜ = ∫ₐᵇ + ∫ᵦᶜ · Si f ≤ g, alors ∫f ≤ ∫g.'),
        S('Exemple et valeur moyenne', '∫₀² x dx = [x²/2]₀² = 2 − 0 = 2. La <b>valeur moyenne</b> de f sur [a ; b] est (1 ÷ (b − a)) × ∫ₐᵇ f(x) dx : ici 2 ÷ 2 = 1.'),
      ],
      recap: ['F′ = f : F primitive.', '∫ₐᵇ f = F(b) − F(a).', 'Si f ≥ 0 : aire sous la courbe.'],
      quiz: [Q('∫₀² x dx vaut :', ['2', '4', '1'], 0), Q('Une primitive de eˣ est :', ['eˣ', 'x·eˣ'], 0), Q('Si f ≥ 0, l’intégrale représente :', ['une aire', 'une pente'], 0)] },

    { id: 'mt-binomiale', subj: 'maths', level: 'term', icon: '🎲', title: 'La loi binomiale',
      intro: 'On répète une expérience à deux issues, et on compte les succès : c’est la loi binomiale.',
      steps: [
        S('Épreuve de Bernoulli', 'Une <b>épreuve de Bernoulli</b> a deux issues : succès (probabilité p) ou échec (probabilité 1 − p). Exemples : pile ou face, un tir réussi ou non.', 'binom'),
        S('Schéma de Bernoulli', 'On répète n fois l’épreuve de façon <b>indépendante</b>. X = nombre de succès suit la <b>loi binomiale B(n ; p)</b> : P(X = k) = C(n, k) × pᵏ × (1 − p)ⁿ⁻ᵏ, où C(n, k) est le nombre de chemins avec k succès.'),
        S('Espérance et écart-type', '<b>E(X) = n × p</b> et V(X) = n × p × (1 − p). Exemple : 10 lancers d’une pièce équilibrée : E(X) = 5 faces en moyenne.'),
        S('Exemple', '3 lancers de pièce, P(X = 2) = C(3,2) × 0,5² × 0,5¹ = 3 × 0,125 = <b>0,375</b>. La calculatrice donne ces probabilités avec « binomFdp » et « binomFrép ».'),
      ],
      recap: ['B(n ; p) : nombre de succès sur n épreuves.', 'P(X = k) = C(n,k) pᵏ (1 − p)ⁿ⁻ᵏ.', 'E(X) = n p.'],
      quiz: [Q('Pour B(10 ; 0,5), l’espérance vaut :', ['5', '10', '0,5'], 0), Q('3 lancers, P(2 faces) =', ['0,375', '0,25', '0,5'], 0)] },

    { id: 'mt-espace', subj: 'maths', level: 'term', icon: '🧊', title: 'Géométrie dans l’espace',
      intro: 'Dans l’espace, un point a trois coordonnées. Les vecteurs et les équations servent à décrire droites et plans.',
      steps: [
        S('Repère de l’espace', 'Un point M a pour coordonnées <b>(x ; y ; z)</b> dans un repère orthonormé. Le vecteur AB a pour coordonnées (xB − xA ; yB − yA ; zB − zA).', 'espace'),
        S('Longueur et produit scalaire', 'La norme est <b>‖u‖ = √(x² + y² + z²)</b>. Le produit scalaire de u(x ; y ; z) et v(x′ ; y′ ; z′) vaut <b>x·x′ + y·y′ + z·z′</b>. Deux vecteurs sont orthogonaux si leur produit scalaire est nul.'),
        S('Droites', 'La droite passant par A de vecteur directeur u a pour représentation paramétrique : x = xA + t·a, y = yA + t·b, z = zA + t·c, où t décrit ℝ.'),
        S('Plans', 'Un plan de vecteur normal n(a ; b ; c) a une équation <b>ax + by + cz + d = 0</b>. Exemple : le plan x + y + z = 3 est perpendiculaire à n(1 ; 1 ; 1) et contient le point (1 ; 1 ; 1).'),
      ],
      recap: ['Point : (x ; y ; z).', 'Norme : √(x² + y² + z²).', 'Plan : ax + by + cz + d = 0.'],
      quiz: [Q('La norme de u(1 ; 2 ; 2) est :', ['3', '5', '9'], 0), Q('Le vecteur normal à un plan est :', ['orthogonal au plan', 'contenu dans le plan'], 0)] },

    /* ================================================================ Terminale : PHYSIQUE */
    { id: 'pt-projectile', subj: 'physique', level: 'term', icon: '🏀', title: 'Mouvement d’un projectile',
      intro: 'Un objet lancé et soumis seulement à son poids décrit une parabole.',
      steps: [
        S('Le système', 'On étudie un projectile de masse m lancé avec une vitesse initiale v₀ faisant l’angle α avec l’horizontale. On néglige les frottements : seule force, le <b>poids P = m g</b>.', 'projectile'),
        S('Accélération', 'D’après la deuxième loi de Newton, m a = m g donc <b>a = g</b> : accélération verticale vers le bas, de valeur g = 9,8 m/s², et nulle horizontalement. La masse n’intervient pas.'),
        S('Équations horaires', 'Horizontalement le mouvement est uniforme : <b>x(t) = v₀ cos α × t</b>. Verticalement, il est uniformément accéléré : <b>y(t) = −½ g t² + v₀ sin α × t</b>. En éliminant t, on obtient une parabole.'),
        S('Portée et flèche', 'Au sommet, la vitesse verticale s’annule : t = v₀ sin α ÷ g. La portée (retour au sol) est maximale pour un angle α de <b>45°</b> sur sol plat.'),
      ],
      recap: ['Seul le poids : a = g.', 'x(t) = v₀ cos α t ; y(t) = −½ g t² + v₀ sin α t.', 'Trajectoire parabolique.'],
      quiz: [Q('Dans la chute libre, l’accélération vaut :', ['g', '0', 'm g'], 0), Q('La portée est maximale pour un angle de :', ['45°', '90°', '30°'], 0)] },

    { id: 'pt-kepler', subj: 'physique', level: 'term', icon: '🛰️', title: 'Satellites et lois de Kepler',
      intro: 'Planètes et satellites tournent autour d’un astre selon trois lois découvertes par Kepler.',
      steps: [
        S('Les lois de Kepler', '<b>1ʳᵉ loi</b> : l’orbite est une ellipse dont le Soleil est un foyer. <b>2ᵉ loi</b> : le segment Soleil-planète balaie des aires égales pendant des durées égales. <b>3ᵉ loi</b> : T² ÷ a³ est la même pour toutes les planètes.', 'kepler'),
        S('Mouvement circulaire', 'Pour un satellite de masse m à la distance r du centre d’un astre de masse M, la gravitation F = G M m ÷ r² est la seule force. Le mouvement est <b>circulaire et uniforme</b> avec la vitesse <b>v = √(G M ÷ r)</b>.'),
        S('Période', 'La période est T = 2π r ÷ v, donc <b>T² ÷ r³ = 4π² ÷ (G M)</b> : troisième loi de Kepler. Plus l’orbite est haute, plus le satellite est lent et plus sa période est longue.'),
        S('Satellite géostationnaire', 'Un satellite <b>géostationnaire</b> reste au-dessus du même point de l’équateur : sa période est 24 h (précisément 23 h 56 min), son altitude environ <b>36 000 km</b>. Il sert aux télécommunications.'),
      ],
      recap: ['Orbite elliptique, aires égales, T² ∝ a³.', 'v = √(G M ÷ r).', 'Géostationnaire : T = 24 h, ≈ 36 000 km.'],
      quiz: [Q('Plus un satellite est loin, plus sa vitesse est :', ['faible', 'grande'], 0), Q('La période d’un satellite géostationnaire est environ :', ['24 h', '90 min', '1 an'], 0)] },

    { id: 'pt-condensateur', subj: 'physique', level: 'term', icon: '🔌', title: 'Le circuit RC',
      intro: 'Un condensateur stocke des charges. Sa charge dans un circuit avec résistance suit une loi exponentielle.',
      steps: [
        S('Le condensateur', 'Un <b>condensateur</b> est formé de deux armatures séparées par un isolant. Il emmagasine la charge q = C × u, où C est sa <b>capacité</b> en farads (F) et u la tension.'),
        S('La charge', 'Branché sur un générateur de tension E à travers une résistance R, il se charge : <b>uC(t) = E (1 − e^(−t/τ))</b>. La tension monte de 0 à E sans jamais dépasser E.', 'rc'),
        S('La constante de temps', '<b>τ = R × C</b> (en secondes). À t = τ, uC atteint 63 % de E ; à t = 5τ, le condensateur est chargé à plus de 99 %. Plus R ou C est grand, plus la charge est lente.'),
        S('La décharge', 'Fermé sur la résistance, il se décharge : <b>uC(t) = E × e^(−t/τ)</b>. L’énergie stockée est ½ C u² : elle est libérée dans la résistance sous forme de chaleur.'),
      ],
      recap: ['q = C u.', 'Charge : uC = E (1 − e^(−t/τ)).', 'τ = R C, chargé à 99 % à 5τ.'],
      quiz: [Q('La constante de temps du circuit RC est :', ['R × C', 'R ÷ C', 'R + C'], 0), Q('À t = 5τ le condensateur est chargé à :', ['plus de 99 %', '63 %'], 0)] },

    { id: 'pt-thermo', subj: 'physique', level: 'term', icon: '🌡️', title: 'Transferts thermiques',
      intro: 'La chaleur passe toujours du corps chaud vers le corps froid, de trois façons.',
      steps: [
        S('Température et énergie interne', 'L’<b>énergie interne</b> U d’un système est liée à l’agitation de ses particules. Quand on le chauffe, son énergie interne augmente et sa température s’élève. La variation vaut <b>ΔU = m × c × ΔT</b> pour une phase liquide ou solide (c : capacité thermique massique).'),
        S('Trois modes de transfert', 'La <b>conduction</b> (de proche en proche dans un solide), la <b>convection</b> (déplacement de matière dans un fluide), le <b>rayonnement</b> (ondes électromagnétiques, même dans le vide : le Soleil).'),
        S('Flux thermique', 'Le <b>flux thermique</b> Φ = Q ÷ Δt est l’énergie transférée par seconde, en watts. À travers une paroi, Φ = ΔT ÷ R_th : plus la <b>résistance thermique</b> est grande, meilleure est l’isolation.'),
        S('Un exemple', 'Chauffer 1 kg d’eau (c = 4 180 J/kg/°C) de 20 °C à 30 °C demande Q = 1 × 4 180 × 10 = <b>41 800 J</b>. L’eau stocke beaucoup d’énergie : c’est pourquoi elle sert aux radiateurs.'),
      ],
      recap: ['ΔU = m c ΔT.', 'Conduction, convection, rayonnement.', 'Flux Φ = ΔT ÷ R_th en watts.'],
      quiz: [Q('Le Soleil chauffe la Terre par :', ['rayonnement', 'conduction'], 0), Q('Chauffer 1 kg d’eau de 10 °C demande :', ['41 800 J', '4 180 J'], 0)] },

    { id: 'pt-radioactivite', subj: 'physique', level: 'term', icon: '☢️', title: 'La radioactivité',
      intro: 'Certains noyaux sont instables : ils se transforment spontanément en émettant un rayonnement.',
      steps: [
        S('Noyau et isotopes', 'Un noyau est noté ᴬ_Z X : A nucléons (protons + neutrons), Z protons. Les <b>isotopes</b> ont le même Z mais des A différents. Certains noyaux sont instables : ils sont <b>radioactifs</b>.'),
        S('Les désintégrations', 'La désintégration <b>α</b> émet un noyau d’hélium (A − 4, Z − 2). La <b>β⁻</b> transforme un neutron en proton et émet un électron (Z + 1). La <b>β⁺</b> émet un positon (Z − 1). Dans chaque cas, A et Z se conservent au total.'),
        S('La décroissance', 'Le nombre de noyaux radioactifs diminue : <b>N(t) = N₀ e^(−λt)</b>. La <b>demi-vie t½</b> est la durée au bout de laquelle la moitié des noyaux a disparu : t½ = ln 2 ÷ λ.', 'decroissance'),
        S('Exemple', 'Le carbone 14 a une demi-vie de 5 730 ans : après 11 460 ans (deux demi-vies), il reste 1/4 des noyaux. On l’utilise pour <b>dater</b> des objets anciens. L’activité (en becquerels) est le nombre de désintégrations par seconde.'),
      ],
      recap: ['A et Z se conservent.', 'N(t) = N₀ e^(−λt).', 'Après n demi-vies : N₀ ÷ 2ⁿ.'],
      quiz: [Q('Après 2 demi-vies, il reste :', ['1/4 des noyaux', '1/2 des noyaux', '0'], 0), Q('L’activité se mesure en :', ['becquerels', 'grays'], 0)] },

    { id: 'pt-doppler', subj: 'physique', level: 'term', icon: '🚑', title: 'L’effet Doppler',
      intro: 'Quand une source de son bouge, la hauteur du son change : c’est la sirène d’ambulance qui passe.',
      steps: [
        S('Le phénomène', 'Quand une source d’onde et un récepteur se <b>rapprochent</b>, la fréquence reçue est <b>plus grande</b> que celle émise (son plus aigu). Quand ils s’<b>éloignent</b>, elle est plus faible (son plus grave).'),
        S('Une formule simple', 'Pour une source mobile se rapprochant d’un récepteur fixe : <b>f_reçue = f_émise × v ÷ (v − v_s)</b> (v : vitesse du son, v_s : vitesse de la source). En s’éloignant : f = f_émise × v ÷ (v + v_s).'),
        S('Un exemple', 'Une sirène à 700 Hz roule à 20 m/s (v = 340 m/s) : en s’approchant, f = 700 × 340 ÷ 320 ≈ <b>744 Hz</b> ; en s’éloignant, f = 700 × 340 ÷ 360 ≈ <b>661 Hz</b>.'),
        S('Applications', 'Le <b>radar</b> mesure la vitesse des voitures, l’<b>échographie Doppler</b> la vitesse du sang. En astronomie, le décalage vers le rouge de la lumière des galaxies lointaines montre qu’elles s’éloignent de nous.'),
      ],
      recap: ['Rapprochement : fréquence plus haute.', 'Éloignement : fréquence plus basse.', 'Radar, échographie, décalage vers le rouge.'],
      quiz: [Q('Une ambulance qui s’approche paraît :', ['plus aiguë', 'plus grave'], 0), Q('Le décalage vers le rouge indique que la galaxie :', ['s’éloigne', 'se rapproche'], 0)] },

    /* ================================================================ Terminale : CHIMIE */
    { id: 'ct-vitesse', subj: 'chimie', level: 'term', icon: '⏱️', title: 'Évolution temporelle d’une réaction',
      intro: 'Une transformation chimique peut être lente ou rapide. On sait mesurer et accélérer la vitesse.',
      steps: [
        S('Lent ou rapide', 'Une réaction est <b>rapide</b> si elle semble instantanée (précipité, acide + base) et <b>lente</b> si elle dure des secondes, des heures, des années (rouille). On suit son évolution par la couleur, la pression, la conductivité ou le pH.'),
        S('La vitesse volumique', 'La vitesse de disparition d’un réactif A est <b>v = −d[A]/dt</b> : c’est l’opposé de la pente de la tangente à la courbe [A](t). Elle diminue au cours du temps car les réactifs se consomment.', 'cinetique'),
        S('Facteurs cinétiques', 'On accélère une réaction en augmentant la <b>température</b> ou la <b>concentration</b> des réactifs. Un <b>catalyseur</b> accélère sans être consommé (les enzymes sont des catalyseurs biologiques).'),
        S('Temps de demi-réaction', 'Le <b>temps de demi-réaction t½</b> est la durée au bout de laquelle l’avancement atteint la moitié de sa valeur finale. C’est un bon repère pour comparer des vitesses.'),
      ],
      recap: ['v = −d[A]/dt : pente de la tangente.', 'Température, concentration, catalyseur.', 'Temps de demi-réaction t½.'],
      quiz: [Q('Un catalyseur :', ['accélère sans être consommé', 'est consommé'], 0), Q('Quand la température monte, la réaction va :', ['plus vite', 'plus lentement'], 0)] },

    { id: 'ct-equilibre', subj: 'chimie', level: 'term', icon: '⚖️', title: 'États d’équilibre chimique',
      intro: 'Certaines réactions ne sont pas totales : réactifs et produits coexistent dans un équilibre dynamique.',
      steps: [
        S('Réaction limitée', 'Une réaction limitée s’arrête avant la disparition d’un réactif. Elle s’écrit avec une double flèche <b>⇌</b> : la réaction se fait dans les deux sens.', 'equilibre'),
        S('Quotient de réaction', 'Pour aA + bB ⇌ cC + dD, le <b>quotient de réaction</b> est Qr = [C]ᶜ[D]ᵈ ÷ ([A]ᵃ[B]ᵇ) (les solides et le solvant n’y figurent pas). Il évolue au cours du temps.'),
        S('Constante d’équilibre', 'À l’équilibre, Qr prend une valeur fixe, la <b>constante d’équilibre K</b>, qui ne dépend que de la température. Si Qr &lt; K, la réaction évolue dans le sens direct ; si Qr &gt; K, dans le sens inverse.'),
        S('Taux d’avancement', 'Le <b>taux d’avancement final</b> τ = x_f ÷ x_max vaut 1 pour une réaction totale et moins de 1 pour une réaction limitée. Un équilibre est <b>dynamique</b> : les deux réactions continuent à la même vitesse.'),
      ],
      recap: ['⇌ : réaction limitée.', 'À l’équilibre : Qr = K.', 'Qr < K : sens direct.'],
      quiz: [Q('À l’équilibre, le quotient de réaction vaut :', ['K', '0', '1'], 0), Q('Si Qr < K, la réaction évolue :', ['dans le sens direct', 'dans le sens inverse'], 0)] },

    { id: 'ct-acide-base', subj: 'chimie', level: 'term', icon: '🍋', title: 'Acides, bases et pKa',
      intro: 'Chaque couple acide-base a une constante qui dit quelle forme domine selon le pH.',
      steps: [
        S('Le couple acide-base', 'Un <b>acide</b> cède un proton H⁺, une <b>base</b> en capte un : AH = A⁻ + H⁺. Exemples : CH₃COOH/CH₃COO⁻, NH₄⁺/NH₃, H₃O⁺/H₂O. L’eau est à la fois acide et base (ampholyte).'),
        S('La constante pKa', 'La constante d’acidité Ka donne <b>pKa = −log Ka</b>. Plus le pKa est petit, plus l’acide est fort. On relie le pH au pKa : <b>pH = pKa + log([A⁻] ÷ [AH])</b>.'),
        S('Diagramme de prédominance', 'Si pH &lt; pKa, l’acide AH <b>prédomine</b> ; si pH &gt; pKa, la base A⁻ prédomine ; si pH = pKa, les deux concentrations sont égales.', 'pka'),
        S('Acide fort, acide faible', 'Un <b>acide fort</b> réagit totalement avec l’eau : pH = −log C. Un <b>acide faible</b> réagit partiellement : son pH est plus élevé que −log C. Exemple : le vinaigre (acide éthanoïque, pKa 4,8) est un acide faible.'),
      ],
      recap: ['Acide cède H⁺, base capte H⁺.', 'pH = pKa + log([A⁻]/[AH]).', 'pH < pKa : acide prédomine.'],
      quiz: [Q('Si pH < pKa, l’espèce qui prédomine est :', ['l’acide AH', 'la base A⁻'], 0), Q('Un acide fort :', ['réagit totalement avec l’eau', 'réagit partiellement'], 0)] },

    { id: 'ct-esterification', subj: 'chimie', level: 'term', icon: '🍌', title: 'Synthèse organique et estérification',
      intro: 'Les chimistes fabriquent des molécules : arômes, médicaments, plastiques. L’ester en est un bel exemple.',
      steps: [
        S('Les familles de molécules', 'On reconnaît les molécules par leur <b>groupe caractéristique</b> : alcool –OH, aldéhyde –CHO, cétone C=O, acide carboxylique –COOH, ester –COO–. La chaîne carbonée donne le nom.'),
        S('L’estérification', 'Un acide carboxylique et un alcool donnent un <b>ester</b> et de l’eau : acide + alcool ⇌ ester + eau. La réaction est <b>lente, limitée et réversible</b> (rendement d’environ 67 % avec des quantités égales).', 'ester'),
        S('Améliorer la synthèse', 'On accélère avec un <b>catalyseur</b> (acide sulfurique) et en chauffant à reflux. On améliore le rendement en ajoutant un réactif en excès ou en éliminant un produit (l’eau).'),
        S('Étapes d’une synthèse', 'Les étapes classiques : <b>transformation</b> (montage à reflux), <b>séparation</b> (extraction, décantation), <b>purification</b> (lavage, distillation), <b>identification</b> (température de fusion, chromatographie, spectres).'),
      ],
      recap: ['Acide + alcool ⇌ ester + eau.', 'Lente, limitée, catalysée par un acide.', 'Transformer, séparer, purifier, identifier.'],
      quiz: [Q('L’estérification est :', ['lente et limitée', 'rapide et totale'], 0), Q('Le montage à reflux sert à :', ['chauffer sans perdre de matière', 'refroidir un liquide'], 0)] },

    { id: 'ct-spectroscopie', subj: 'chimie', level: 'term', icon: '📉', title: 'Spectroscopie infrarouge',
      intro: 'Les liaisons d’une molécule vibrent comme des ressorts. Le spectre infrarouge révèle lesquelles sont présentes.',
      steps: [
        S('Le principe', 'Une molécule absorbe certaines radiations infrarouges qui font vibrer ses liaisons. Le <b>spectre IR</b> trace la transmittance en fonction du <b>nombre d’onde σ</b> (en cm⁻¹, σ = 1 ÷ λ).', 'ir'),
        S('Les bandes caractéristiques', 'La liaison <b>O–H</b> d’un alcool absorbe vers 3 200 à 3 600 cm⁻¹ (bande large) ; celle d’un acide carboxylique est encore plus large. La liaison <b>C=O</b> absorbe vers 1 700 cm⁻¹ (bande fine et intense). C–H absorbe vers 2 900 cm⁻¹.'),
        S('Lire un spectre', 'On repère les bandes, on lit leur nombre d’onde dans une table, et on en déduit les groupes caractéristiques présents. Un spectre avec une bande vers 1 700 mais sans bande large O–H évoque une cétone ou un aldéhyde.'),
        S('Autres techniques', 'La <b>RMN du proton</b> renseigne sur l’environnement des atomes d’hydrogène (nombre de signaux, déplacement, multiplicité). La spectroscopie <b>UV-visible</b> mesure l’absorbance et permet de doser une espèce colorée (loi de Beer-Lambert).'),
      ],
      recap: ['IR : transmittance selon σ (cm⁻¹).', 'C=O vers 1 700 cm⁻¹ ; O–H vers 3 300.', 'RMN : environnement des H.'],
      quiz: [Q('La liaison C=O absorbe vers :', ['1 700 cm⁻¹', '3 300 cm⁻¹'], 0), Q('Le spectre IR permet de repérer :', ['des groupes caractéristiques', 'la masse de la molécule'], 0)] },

    { id: 'ct-electrolyse', subj: 'chimie', level: 'term', icon: '⚡', title: 'Piles, électrolyse et accumulateurs',
      intro: 'On peut produire de l’électricité avec une réaction chimique, ou forcer une réaction avec de l’électricité.',
      steps: [
        S('La pile', 'Dans une <b>pile</b>, une réaction d’oxydoréduction spontanée produit un courant. À l’<b>anode</b> (pôle −) a lieu l’oxydation, à la <b>cathode</b> (pôle +) la réduction. Les électrons circulent de l’anode vers la cathode dans le fil.'),
        S('La quantité d’électricité', 'Une pile qui débite un courant I pendant une durée Δt a fourni la charge <b>Q = I × Δt</b>. Si n électrons sont échangés : Q = n × F, avec la constante de Faraday F = 96 500 C/mol.'),
        S('L’électrolyse', 'En <b>électrolyse</b>, un générateur impose un courant qui <b>force une réaction non spontanée</b> : l’électrode reliée au pôle + est l’anode (oxydation), l’autre est la cathode (réduction). On produit ainsi du dihydrogène, du chlore, ou on recouvre un objet de métal (galvanoplastie).', 'electrolyse'),
        S('Accumulateurs', 'Un <b>accumulateur</b> (batterie rechargeable : lithium-ion, plomb) fonctionne comme une pile en décharge et comme un électrolyseur en charge : la réaction est réversible. Le recyclage des batteries est un enjeu environnemental.'),
      ],
      recap: ['Pile : réaction spontanée → courant.', 'Électrolyse : courant → réaction forcée.', 'Q = I × Δt = n × F.'],
      quiz: [Q('Dans une pile, l’oxydation a lieu à :', ['l’anode', 'la cathode'], 0), Q('L’électrolyse est une transformation :', ['forcée', 'spontanée'], 0)] },
  ];

  const SUBJECTS = [
    { id: 'maths', label: 'Mathématiques', icon: '📐', color: '#3b3a8f' },
    { id: 'physique', label: 'Physique', icon: '⚡', color: '#d97706' },
    { id: 'chimie', label: 'Chimie', icon: '🧪', color: '#0d9488' },
  ];
  const COURSE_CYCLES = [
    { id: 'primaire', label: 'Primaire', icon: '🎒' },
    { id: 'moyen', label: 'Moyen', icon: '📚' },
    { id: 'secondaire', label: 'Secondaire', icon: '🎓' },
  ];
  const LEVELS_COURS = [
    { id: 'CP', label: 'CP', cycle: 'primaire' }, { id: 'CE1', label: 'CE1', cycle: 'primaire' }, { id: 'CE2', label: 'CE2', cycle: 'primaire' },
    { id: 'CM1', label: 'CM1', cycle: 'primaire' }, { id: 'CM2', label: 'CM2', cycle: 'primaire' },
    { id: '6e', label: '6ᵉ', cycle: 'moyen' }, { id: '5e', label: '5ᵉ', cycle: 'moyen', ready: true }, { id: '4e', label: '4ᵉ', cycle: 'moyen', ready: true }, { id: '3e', label: '3ᵉ', cycle: 'moyen', ready: true },
    { id: '2nde', label: '2nde', cycle: 'secondaire', ready: true }, { id: '1re', label: '1ʳᵉ', cycle: 'secondaire', ready: true }, { id: 'term', label: 'Terminale', cycle: 'secondaire', ready: true },
  ];


  window.COURSES = COURSES; window.COURSE_SUBJECTS = SUBJECTS; window.COURSE_LEVELS = LEVELS_COURS; window.COURSE_CYCLES = COURSE_CYCLES;
  window.courseFig = (k) => (FIG[k] ? FIG[k]() : '');
})();
