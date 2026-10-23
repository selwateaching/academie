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
