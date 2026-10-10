/* Papillon de fidélité : dessin SVG avec N emplacements d'éclats. Butterfly.draw(el, obtenus, total) */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const e = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs || {}) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

  // emplacements (aile gauche) : x, y, rayon. L'aile droite est le miroir autour de x = 200.
  const LEFT = [[118, 112, 21], [70, 150, 19], [128, 178, 17], [112, 262, 17], [150, 305, 14]];
  const FILL_ORDER = [];   // alterne gauche / droite : G1 D1 G2 D2 ...
  LEFT.forEach((_, i) => { FILL_ORDER.push([i, 0]); FILL_ORDER.push([i, 1]); });

  function spots(total) {
    const base = FILL_ORDER.map(([i, side]) => { const [x, y, r] = LEFT[i]; return { x: side ? 400 - x : x, y, r }; });
    if (total >= base.length) return base.concat(Array.from({ length: total - base.length }, (_, i) => ({ x: 200, y: 120 + i * 30, r: 10 })));
    return base.slice(0, total);
  }

  function star(parent, cx, cy, r, fill) {   // étincelle à 4 branches
    const p = e('path', { d: `M${cx} ${cy - r} Q${cx + r * .18} ${cy - r * .18} ${cx + r} ${cy} Q${cx + r * .18} ${cy + r * .18} ${cx} ${cy + r} Q${cx - r * .18} ${cy + r * .18} ${cx - r} ${cy} Q${cx - r * .18} ${cy - r * .18} ${cx} ${cy - r}Z`, fill }, parent);
    return p;
  }

  function draw(host, got, total) {
    host.replaceChildren();
    const svg = e('svg', { viewBox: '0 0 400 380', role: 'img', 'aria-label': `Papillon de fidélité : ${got} éclats sur ${total}`, class: 'butterfly' });
    const defs = e('defs', {}, svg);
    const wing = e('linearGradient', { id: 'bfWing', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
    e('stop', { offset: '0', 'stop-color': '#fde7ef' }, wing); e('stop', { offset: '.55', 'stop-color': '#f6c9dc' }, wing); e('stop', { offset: '1', 'stop-color': '#d9b3e6' }, wing);
    const gem = e('radialGradient', { id: 'bfGem', cx: '.4', cy: '.35', r: '.8' }, defs);
    e('stop', { offset: '0', 'stop-color': '#ff8fc0' }, gem); e('stop', { offset: '1', 'stop-color': '#c93f86' }, gem);
    const body = e('linearGradient', { id: 'bfBody', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    e('stop', { offset: '0', 'stop-color': '#b97cc9' }, body); e('stop', { offset: '1', 'stop-color': '#8a4fa6' }, body);

    const wings = e('g', { stroke: '#d8a35f', 'stroke-width': '2', 'stroke-linejoin': 'round' }, svg);
    const upper = 'M196 176 C150 70 40 52 26 130 C16 200 96 236 194 214 Z';
    const lower = 'M194 226 C128 222 66 262 92 322 C118 376 186 336 198 268 Z';
    [false, true].forEach((m) => {
      const g = e('g', m ? { transform: 'translate(400 0) scale(-1 1)' } : {}, wings);
      e('path', { d: upper, fill: 'url(#bfWing)' }, g); e('path', { d: lower, fill: 'url(#bfWing)', opacity: '.95' }, g);
      e('path', { d: 'M190 190 C150 150 100 120 60 112', fill: 'none', stroke: '#f0c6a0', 'stroke-width': '1.3', opacity: '.7' }, g);
      e('path', { d: 'M190 240 C150 262 120 290 108 318', fill: 'none', stroke: '#f0c6a0', 'stroke-width': '1.3', opacity: '.7' }, g);
    });

    const slots = spots(total);
    slots.forEach((s, i) => {
      const on = i < got;
      const g = e('g', { class: on ? 'spot on' : 'spot' }, svg);
      e('circle', { cx: s.x, cy: s.y, r: s.r, fill: on ? 'url(#bfGem)' : 'rgba(255,255,255,.55)', stroke: on ? '#e58ab8' : '#d9a7c4', 'stroke-width': on ? 2.5 : 2 }, g);
      if (on) { star(g, s.x, s.y, s.r * .78, '#fff'); e('circle', { cx: s.x, cy: s.y, r: s.r + 5, fill: 'none', stroke: '#ff9ac7', 'stroke-width': '1', opacity: '.5' }, g); }
    });

    // corps, tête, antennes
    e('ellipse', { cx: 200, cy: 212, rx: 11, ry: 66, fill: 'url(#bfBody)', stroke: '#d8a35f', 'stroke-width': '1.5' }, svg);
    e('circle', { cx: 200, cy: 142, r: 11, fill: '#8a4fa6' }, svg);
    e('path', { d: 'M196 133 C184 104 168 92 154 90 M204 133 C216 104 232 92 246 90', fill: 'none', stroke: '#8a4fa6', 'stroke-width': '3', 'stroke-linecap': 'round' }, svg);
    e('circle', { cx: 154, cy: 90, r: 4, fill: '#d8a35f' }, svg); e('circle', { cx: 246, cy: 90, r: 4, fill: '#d8a35f' }, svg);
    e('path', { d: 'M200 186 l7 9 l-7 9 l-7 -9z', fill: '#e9c6f2', stroke: '#d8a35f', 'stroke-width': '1' }, svg);
    host.appendChild(svg);
    return svg;
  }

  window.Butterfly = { draw };
  document.querySelectorAll('[data-butterfly]').forEach((el) => draw(el, +el.dataset.got || 0, +el.dataset.total || 10));
})();
