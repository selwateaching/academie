/* Pictogrammes illustrés pour les options du diagnostic (traits fins rose/prune).
   Association par mots-clés sur le libellé : fonctionne avec n'importe quel diagnostic configuré. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const P = {
    straight: ['M16 6v36', 'M24 6v36', 'M32 6v36'],
    wavy: ['M16 6c8 8-8 16 0 24s-8 16 0 14', 'M26 6c8 8-8 16 0 24s-8 16 0 14', 'M36 6c8 8-8 16 0 24s-8 16 0 14'],
    curly: ['M24 6c10 0 10 10 0 10s-10 10 0 10 10 10 0 10-8 6-2 8'],
    coily: ['M14 12c6-6 12 4 6 6s-8 8 0 8 8 8 0 8 2 8 8 6', 'M30 12c6-6 12 4 6 6s-8 8 0 8'],
    drop: ['M24 6c8 11 12 17 12 24a12 12 0 01-24 0c0-7 4-13 12-24z'],
    sun: ['M24 14a10 10 0 100 20 10 10 0 000-20z', 'M24 3v5M24 40v5M3 24h5M40 24h5M9 9l4 4M35 35l4 4M39 9l-4 4M13 35l-4 4'],
    spark: ['M24 4l4 14 14 4-14 4-4 14-4-14-14-4 14-4z'],
    scissors: ['M12 12a5 5 0 110 .1M12 36a5 5 0 110 .1', 'M16 15l24 20M16 33l24-20'],
    leaf: ['M8 40C8 18 22 8 40 8c0 20-10 32-32 32z', 'M8 40L28 20'],
    heart: ['M24 40S6 29 6 17a9 9 0 0118-3 9 9 0 0118 3c0 12-18 23-18 23z'],
    face: ['M24 5c-9 0-14 7-14 17s5 20 14 20 14-10 14-20S33 5 24 5z', 'M17 20h2M29 20h2M19 31q5 4 10 0'],
    dots: ['M16 16a2 2 0 100 .1M30 14a2 2 0 100 .1M22 26a2 2 0 100 .1M32 30a2 2 0 100 .1M14 34a2 2 0 100 .1', 'M24 5c-9 0-14 7-14 17s5 20 14 20 14-10 14-20S33 5 24 5z'],
    lines: ['M10 18q14-8 28 0M10 26q14-8 28 0M10 34q14-8 28 0'],
    bolt: ['M28 4L12 28h11l-3 16 16-24H25z'],
    flower: ['M24 18a6 6 0 100 12 6 6 0 000-12z', 'M24 18c-6-12 6-12 0 0M24 30c-6 12 6 12 0 0M18 24c-12-6-12 6 0 0M30 24c12 6 12-6 0 0'],
    nail: ['M16 44V20a8 8 0 0116 0v24z', 'M20 26q4-4 8 0'],
    clock: ['M24 6a18 18 0 100 36 18 18 0 000-36z', 'M24 14v11l8 5'],
    wind: ['M6 18h24a5 5 0 10-5-5M6 28h30a5 5 0 11-5 5M6 38h14'],
    broken: ['M16 6v14l-4 4 8 4-4 4v12', 'M32 6v10l4 6-8 4 4 6v10'],
    fine: ['M18 6c-2 14 2 24 0 36M24 6c-2 14 2 24 0 36M30 6c-2 14 2 24 0 36M36 6c-2 14 2 24 0 36'],
  };
  const RULES = [
    [/frise|afro|cr[eé]pu|crepu/, 'coily'], [/boucl|curl/, 'curly'], [/ondul|wavy/, 'wavy'], [/raide|lisse|droit|straight/, 'straight'],
    [/cassant|ab[iî]m|fourch|fragile|casse|sensibilis/, 'broken'], [/chute|perte|clairsem|fin\b|fins\b|cheveux fins/, 'fine'],
    [/pellicul|d[eé]mangeaison|irrit|rougeur|r[eé]actif|sensible|acn[eé]|bouton|imperfection|tache|pigment/, 'dots'],
    [/s[eè]che|d[eé]shydrat|hydrat|tiraill|soif|eau/, 'drop'], [/gras|s[eé]bum|brillant|luisant/, 'drop'],
    [/volume|gonfl|frisottis|anti.?frisott|frizz/, 'wind'], [/ride|rel[aâ]ch|fermet|[aâ]ge|anti.?[aâ]ge|lifting/, 'lines'],
    [/soleil|bronz|uv|[eé]clat|lumin|teint|terne/, 'sun'], [/coupe|longueur|taille|couper/, 'scissors'], [/color|d[eé]color|m[eè]ch|blond|balayage|ton\b/, 'spark'],
    [/naturel|bio|v[eé]g[eé]t|plante|douceur/, 'leaf'], [/ongle|vernis|gel\b|manucure|pose/, 'nail'], [/poil|[eé]pil|cire|duvet|repouss/, 'flower'],
    [/rapide|express|urgence|press[eé]|temps|dur[eé]e|tenue|long terme/, 'clock'], [/douleur|sensation|peau fine|fragile/, 'bolt'],
    [/soin|bien.?[eê]tre|relax|stress|d[eé]tente|plaisir|cocoon|envie|souhait|r[eé]sultat|objectif|brillance|souplesse|douce/, 'heart'],
    [/visage|peau|cils|sourcil|regard/, 'face'],
  ];
  const norm = (t) => String(t || '').toLowerCase();
  function pick(label) { const t = norm(label); for (const [re, k] of RULES) if (re.test(t)) return k; return null; }
  function svg(key) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 48 48'); s.setAttribute('class', 'illus'); s.setAttribute('aria-hidden', 'true');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    (P[key] || []).forEach(d => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.appendChild(p); });
    return s;
  }
  // Illustre une question si au moins la moitié des options ont un pictogramme (sinon les cartes seraient hétérogènes).
  function forQuestion(q) {
    const opts = q.options || [];
    if (!opts.length || q.type === 'scale' || q.type === 'yesno') return null;
    const keys = opts.map(o => pick(o.label));
    const hit = keys.filter(Boolean).length;
    if (hit < Math.ceil(opts.length / 2)) return null;
    return opts.map((o, i) => svg(keys[i] || 'spark'));
  }
  window.Illus = { forQuestion, pick, svg };
})();
