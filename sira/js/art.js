/* Illustrations vectorielles : scènes de paysages, de lieux et d'objets (aucun visage ni personnage :
   le Prophète ﷺ, les compagnons et les autres prophètes ne sont pas représentés).
   Chaque image est composée à partir du texte : moment de la journée, décor et objets sont choisis
   d'après les mots-clés du paragraphe. Tirage pseudo-aléatoire stable (même texte = même image). */
(function () {
  "use strict";
  var W = 800, H = 340, HOR = 228;
  var uid = 0;

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ﷺ/g, ""); }
  function f(n) { return Math.round(n * 10) / 10; }

  /* ---------- Palettes selon le moment de la journée ---------- */
  var T = {
    day:    { sky: ["#5ab9ea", "#a9defa", "#fbefc4"], far: "#d2b88c", d1: "#ecd09a", d2: "#e0b877", d3: "#cf9b57", gr: "#c98f4d", ink: "#3b2a1c", sea: ["#3aa6d4", "#1c6fa8"], wall: "#d9b06a", wallS: "#b98a4a", glow: 0 },
    dawn:   { sky: ["#34407f", "#d9728f", "#ffd49a"], far: "#a1788f", d1: "#e9b98c", d2: "#d19a72", d3: "#b07556", gr: "#a56a4c", ink: "#3a2430", sea: ["#59508e", "#2f3a73"], wall: "#d49a74", wallS: "#a8705a", glow: 1 },
    sunset: { sky: ["#3c2f72", "#e0603f", "#ffc46b"], far: "#8a5a6c", d1: "#e8a870", d2: "#c98258", d3: "#a2603f", gr: "#935237", ink: "#34202a", sea: ["#8a4a7c", "#3a2f6a"], wall: "#c98258", wallS: "#9a5f48", glow: 1 },
    night:  { sky: ["#070d2a", "#1b2c63", "#33518f"], far: "#1c2b58", d1: "#31407a", d2: "#27346a", d3: "#1d2859", gr: "#18214c", ink: "#0a1030", sea: ["#18306a", "#0b1a45"], wall: "#3b4a86", wallS: "#2a3668", glow: 0 }
  };
  function tint(c, k) { /* assombrit une couleur hex (k<1) */
    var n = parseInt(c.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function z(v) { return Math.max(0, Math.min(255, Math.round(v * k))); }
    return "#" + ((1 << 24) + (z(r) << 16) + (z(g) << 8) + z(b)).toString(16).slice(1);
  }

  /* ---------- Éléments de décor ---------- */
  function sky(P, id, R, time) {
    var o = '<defs><linearGradient id="sk' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.sky[0] + '"/><stop offset=".55" stop-color="' + P.sky[1] + '"/><stop offset="1" stop-color="' + P.sky[2] + '"/></linearGradient></defs>';
    o += '<rect width="' + W + '" height="' + (HOR + 40) + '" fill="url(#sk' + id + ')"/>';
    if (time === "night") {
      for (var i = 0; i < 46; i++) { var x = R() * W, y = R() * (HOR - 40), r = 0.6 + R() * 1.6; o += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="#fff" opacity="' + f(0.45 + R() * 0.55) + '"/>'; }
      o += '<circle cx="640" cy="70" r="30" fill="#fdf3c8"/><circle cx="654" cy="62" r="27" fill="' + P.sky[0] + '"/>';
    } else if (time === "dawn" || time === "sunset") {
      var sx = time === "dawn" ? 560 : 250;
      o += '<circle cx="' + sx + '" cy="' + (HOR - 6) + '" r="90" fill="#ffd27a" opacity=".28"/><circle cx="' + sx + '" cy="' + (HOR - 6) + '" r="46" fill="#ffe29a"/>';
    } else {
      o += '<circle cx="640" cy="72" r="70" fill="#fff6c4" opacity=".4"/><circle cx="640" cy="72" r="36" fill="#ffe27a"/>';
      for (var k = 0; k < 3; k++) { var cx = 90 + R() * 560, cy = 40 + R() * 70; o += cloud(cx, cy, 0.7 + R() * 0.6); }
    }
    return o;
  }
  function cloud(x, y, s) { return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')" fill="#fff" opacity=".85"><ellipse cx="0" cy="0" rx="34" ry="11"/><ellipse cx="-14" cy="-8" rx="18" ry="11"/><ellipse cx="12" cy="-10" rx="22" ry="13"/></g>'; }
  function mountains(P, R, high) {
    var d = "M0," + HOR, x = 0, h = high ? 120 : 60;
    while (x < W) { x += 55 + R() * 60; d += " L" + f(x - 25) + "," + f(HOR - h * (0.5 + R() * 0.7)) + " L" + f(x) + "," + f(HOR - 8 - R() * 20); }
    return '<path d="' + d + ' L' + W + "," + HOR + ' Z" fill="' + P.far + '"/>';
  }
  function dunes(P, R) {
    var o = "";
    [[HOR - 6, P.d1, 26], [HOR + 28, P.d2, 30], [HOR + 66, P.d3, 34]].forEach(function (L, i) {
      var y = L[0], d = "M0," + (y + 40);
      for (var x = 0; x <= W; x += 100) d += " Q" + f(x + 50) + "," + f(y - L[2] * (0.4 + R())) + " " + f(x + 100) + "," + f(y + R() * 8);
      o += '<path d="' + d + ' L' + W + "," + H + ' L0,' + H + ' Z" fill="' + L[1] + '"/>';
    });
    o += '<rect y="' + (H - 36) + '" width="' + W + '" height="36" fill="' + P.gr + '" opacity=".55"/>';
    for (var i = 0; i < 14; i++) o += '<ellipse cx="' + f(R() * W) + '" cy="' + f(HOR + 40 + R() * 90) + '" rx="' + f(2 + R() * 4) + '" ry="1.6" fill="' + P.ink + '" opacity=".16"/>';
    return o;
  }
  function sea(P, id, R) {
    var o = '<defs><linearGradient id="se' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.sea[0] + '"/><stop offset="1" stop-color="' + P.sea[1] + '"/></linearGradient></defs>';
    o += '<rect y="' + (HOR - 4) + '" width="' + W + '" height="' + (H - HOR + 4) + '" fill="url(#se' + id + ')"/>';
    for (var r = 0; r < 7; r++) {
      var y = HOR + 10 + r * 16, d = "M" + f(-20 + R() * 60) + "," + y;
      for (var x = 0; x < 10; x++) d += " q18,-7 36,0 t36,0";
      o += '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="2" opacity="' + f(0.18 + r * 0.04) + '" transform="translate(' + f(R() * 40) + ' 0)"/>';
    }
    return o;
  }

  /* ---------- Objets ---------- */
  function camel(x, y, s, P, flip, load) {
    var body = tint("#b98650", P === T.night ? 0.45 : 1), dark = tint("#8d6234", P === T.night ? 0.45 : 1);
    var o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(flip ? -s : s) + " " + f(s) + ')">';
    o += '<g stroke="' + dark + '" stroke-width="6" stroke-linecap="round" fill="none"><path d="M-30,-6 L-32,32"/><path d="M-14,-6 L-12,32"/><path d="M14,-6 L16,32"/><path d="M30,-6 L36,32"/></g>';
    o += '<path d="M-48,-30 Q-50,-4 -30,-6 L36,-6 Q58,-8 50,-34 Q40,-52 24,-46 Q8,-62 -8,-46 Q-24,-52 -34,-44 Q-46,-46 -48,-30 Z" fill="' + body + '"/>';
    o += '<path d="M44,-38 Q60,-70 66,-84" stroke="' + body + '" stroke-width="15" stroke-linecap="round" fill="none"/>';
    o += '<ellipse cx="72" cy="-86" rx="13" ry="8" fill="' + body + '" transform="rotate(-18 72 -86)"/><circle cx="74" cy="-89" r="1.8" fill="' + dark + '"/>';
    o += '<path d="M-48,-30 q-8,4 -6,18" stroke="' + dark + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    if (load) o += '<rect x="-30" y="-58" width="44" height="22" rx="6" fill="#c0392b"/><rect x="-30" y="-48" width="44" height="5" fill="#f4d58d"/><rect x="2" y="-64" width="24" height="16" rx="5" fill="#2e86c1"/>';
    return o + "</g>";
  }
  function caravan(x, y, s, P, R) { var o = ""; for (var i = 0; i < 3; i++) o += camel(x + i * 92 * s, y - i * 5 * s, s * (1 - i * 0.07), P, false, i !== 1); return o; }
  function palm(x, y, s, P, dates) {
    var g1 = tint("#2f9a58", P === T.night ? 0.4 : 1), g2 = tint("#237a46", P === T.night ? 0.4 : 1), tr = tint("#8a5a2b", P === T.night ? 0.45 : 1);
    var o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')">';
    o += '<path d="M0,0 Q-8,-50 4,-100" stroke="' + tr + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
    [[-70, -20], [-52, -52], [-20, -64], [20, -64], [52, -52], [70, -20], [-36, -28], [36, -28]].forEach(function (p, i) {
      o += '<path d="M4,-100 Q' + (4 + p[0] * 0.55) + "," + (-100 + p[1] - 22) + " " + (4 + p[0]) + "," + (-100 + p[1] + 26) + " Q" + (4 + p[0] * 0.5) + "," + (-100 + p[1] + 2) + ' 4,-100 Z" fill="' + (i % 2 ? g1 : g2) + '"/>';
    });
    if (dates) o += '<circle cx="-4" cy="-94" r="4.5" fill="#8c4a1a"/><circle cx="6" cy="-90" r="4.5" fill="#a85d22"/><circle cx="12" cy="-97" r="4.2" fill="#8c4a1a"/>';
    return o + "</g>";
  }
  function tent(x, y, s, P) {
    var c = tint("#4a3426", P === T.night ? 0.6 : 1), l = tint("#e6cfa0", P === T.night ? 0.45 : 1);
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><path d="M-80,0 L-52,-62 Q0,-76 52,-62 L80,0 Z" fill="' + c + '"/><path d="M-80,0 L-52,-62 L-40,-60 L-58,0 Z" fill="' + tint("#2f2018", 1) + '" opacity=".6"/><path d="M-18,0 L-6,-46 L6,-46 L18,0 Z" fill="' + tint("#16110d", 1) + '"/><path d="M-52,-62 Q0,-76 52,-62" fill="none" stroke="' + l + '" stroke-width="5"/><path d="M-80,0 L-96,10 M80,0 L96,10" stroke="' + l + '" stroke-width="2"/><g fill="' + l + '"><circle cx="-100" cy="11" r="3"/><circle cx="100" cy="11" r="3"/></g></g>';
  }
  function kaaba(x, y, s, P) {
    var n = P === T.night;
    var o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')">';
    o += '<ellipse cx="0" cy="4" rx="140" ry="14" fill="' + (n ? "#3b4a86" : "#f1e2bd") + '" opacity=".95"/>';
    for (var i = -3; i <= 3; i++) o += '<path d="M' + (i * 34 - 12) + ",-6 L" + (i * 34 - 12) + ",-34 Q" + (i * 34) + "," + (-50) + " " + (i * 34 + 12) + ",-34 L" + (i * 34 + 12) + ',-6 Z" fill="' + (n ? "#2f3b70" : "#f6ecd0") + '" opacity=".75" transform="translate(0 -4) scale(1 .8)"/>';
    o += '<polygon points="-62,-6 -62,-106 26,-106 26,-6" fill="#1d1d21"/><polygon points="26,-6 26,-106 66,-94 66,-2" fill="#111114"/><polygon points="-62,-106 -22,-120 66,-120 26,-106" fill="#33333a"/><polygon points="26,-106 66,-120 66,-94" fill="#26262c"/>';
    o += '<rect x="-62" y="-92" width="88" height="11" fill="#d9a93a"/><polygon points="26,-92 66,-104 66,-94 26,-81" fill="#b98c26"/><rect x="-36" y="-81" width="28" height="42" fill="none" stroke="#d9a93a" stroke-width="2.5" opacity=".7"/>';
    o += '<rect x="-30" y="-58" width="22" height="52" rx="2" fill="#d9a93a"/><rect x="-26" y="-54" width="14" height="44" fill="#9c6f17" opacity=".55"/>';
    return o + "</g>";
  }
  function mosque(x, y, s, P) {
    var n = P === T.night, w = tint("#c79a62", n ? 0.5 : 1), w2 = tint("#a67a46", n ? 0.5 : 1), roof = tint("#7a5a32", n ? 0.5 : 1), col = tint("#8a5a2b", n ? 0.5 : 1);
    var o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')">';
    o += '<rect x="-120" y="-70" width="240" height="70" fill="' + w + '"/><rect x="-120" y="-70" width="240" height="8" fill="' + w2 + '"/>';
    o += '<path d="M-130,-70 L-112,-92 L112,-92 L130,-70 Z" fill="' + roof + '"/><path d="M-116,-84 H116 M-122,-77 H122" stroke="' + tint("#a88150", n ? 0.5 : 1) + '" stroke-width="2"/>';
    for (var i = 0; i < 7; i++) o += '<rect x="' + (-100 + i * 33) + '" y="-62" width="8" height="62" fill="' + col + '"/>';
    o += '<rect x="-14" y="-52" width="28" height="52" rx="14" fill="' + tint("#2b1d12", 1) + '"/>';
    o += '<g opacity="' + (n ? 1 : 0) + '"><circle cx="-60" cy="-38" r="5" fill="#ffd45a"/><circle cx="60" cy="-38" r="5" fill="#ffd45a"/></g>';
    return o + "</g>" ;
  }
  function city(P, R, x0, x1, kind) {
    var o = "", x = x0, n = P === T.night;
    while (x < x1) {
      var w = 28 + R() * 34, h = 26 + R() * 46, c = R() < 0.5 ? P.wall : tint(P.wall, 0.9);
      o += '<rect x="' + f(x) + '" y="' + f(HOR - h + 8) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + c + '"/><rect x="' + f(x) + '" y="' + f(HOR - h + 8) + '" width="' + f(w) + '" height="5" fill="' + P.wallS + '"/><rect x="' + f(x + w * 0.35) + '" y="' + f(HOR - 16) + '" width="' + f(w * 0.28) + '" height="24" fill="' + P.ink + '" opacity=".6"/>';
      if (R() < 0.6) o += '<rect x="' + f(x + w * 0.2) + '" y="' + f(HOR - h + 20) + '" width="6" height="8" fill="' + (n ? "#ffd45a" : P.ink) + '" opacity="' + (n ? 1 : 0.5) + '"/>';
      x += w + 4 + R() * 10;
      if (kind === "medine" && R() < 0.25) { o += palm(x + 6, HOR + 10, 0.55, P, false); x += 22; }
    }
    return o;
  }
  function fortress(x, y, s, P) {
    var c = P.wall, d = P.wallS;
    var o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')">';
    o += '<rect x="-130" y="-70" width="260" height="70" fill="' + c + '"/>';
    for (var i = -6; i <= 6; i++) o += '<rect x="' + (i * 20 - 7) + '" y="-82" width="14" height="12" fill="' + c + '"/>';
    [-130, 100].forEach(function (tx) { o += '<rect x="' + tx + '" y="-120" width="30" height="120" fill="' + d + '"/>'; for (var j = 0; j < 3; j++) o += '<rect x="' + (tx + j * 11 - 1) + '" y="-130" width="8" height="10" fill="' + d + '"/>'; });
    o += '<path d="M-24,0 V-40 Q0,-62 24,-40 V0 Z" fill="' + P.ink + '" opacity=".8"/><rect x="-130" y="-72" width="260" height="4" fill="' + d + '"/>';
    return o + "</g>";
  }
  function well(x, y, s, P) {
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><path d="M-40,0 V-30 H40 V0 Q0,16 -40,0 Z" fill="' + tint("#9a8c7a", P === T.night ? 0.5 : 1) + '"/><ellipse cx="0" cy="-30" rx="40" ry="10" fill="' + tint("#5a4c3c", P === T.night ? 0.5 : 1) + '"/><ellipse cx="0" cy="-30" rx="30" ry="6" fill="#2b88c9" opacity=".8"/><path d="M-36,-30 V-86 M36,-30 V-86 M-42,-86 H42" stroke="' + tint("#6a4a2a", P === T.night ? 0.5 : 1) + '" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M0,-86 V-56" stroke="#e8d9b6" stroke-width="2"/><path d="M-8,-56 h16 l-3,14 h-10 Z" fill="#8c5a2b"/></g>';
  }
  function ship(x, y, s, P) {
    var n = P === T.night;
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><path d="M-90,-4 H80 Q60,26 20,28 H-50 Q-80,26 -90,-4 Z" fill="' + tint("#8a5a2b", n ? 0.5 : 1) + '"/><path d="M-90,-4 H80" stroke="' + tint("#c99a5b", n ? 0.5 : 1) + '" stroke-width="5"/><path d="M0,-6 V-122" stroke="' + tint("#5a3a1a", n ? 0.5 : 1) + '" stroke-width="5"/><path d="M4,-118 Q60,-70 78,-14 H4 Z" fill="' + tint("#f4ead0", n ? 0.55 : 1) + '"/><path d="M-4,-100 Q-46,-60 -62,-14 H-4 Z" fill="' + tint("#e6d6a8", n ? 0.55 : 1) + '"/><path d="M0,-122 l22,6 l-22,6 Z" fill="#fff"/></g>';
  }
  function cave(x, y, s, P, glow) {
    var o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')">';
    o += '<path d="M-150,0 L-96,-92 L-60,-70 L-8,-168 L40,-110 L78,-132 L150,0 Z" fill="' + tint(P.far, 0.78) + '"/><path d="M-8,-168 L40,-110 L18,-100 L-8,-168 Z" fill="' + tint(P.far, 0.6) + '"/><path d="M-150,0 L-96,-92 L-70,-60 L-92,0 Z" fill="' + tint(P.far, 0.9) + '" opacity=".6"/>';
    o += '<path d="M-34,-6 Q-34,-70 0,-70 Q34,-70 34,-6 Z" fill="#0d0b12"/>';
    if (glow) o += '<path d="M-26,-6 Q-26,-58 0,-58 Q26,-58 26,-6 Z" fill="#ffe9a0" opacity=".5"/>';
    return o + "</g>";
  }
  function book(x, y, s, P, rays) {
    var o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')">';
    if (rays) { for (var i = 0; i < 12; i++) o += '<path d="M0,-60 L' + f(Math.cos(i * Math.PI / 6) * 190) + "," + f(-60 + Math.sin(i * Math.PI / 6) * 190) + " L" + f(Math.cos((i + 0.4) * Math.PI / 6) * 190) + "," + f(-60 + Math.sin((i + 0.4) * Math.PI / 6) * 190) + ' Z" fill="#fff3b0" opacity=".22"/>'; o += '<circle cx="0" cy="-60" r="62" fill="#fff3b0" opacity=".35"/>'; }
    o += '<path d="M-60,-20 L-4,-6 L-4,-62 L-60,-76 Z" fill="#fdf5dc"/><path d="M4,-6 L60,-20 L60,-76 L4,-62 Z" fill="#f6ecca"/><path d="M-66,-16 L0,0 L66,-16 L66,-22 L0,-6 L-66,-22 Z" fill="#2f7d5a"/><path d="M0,-6 V-62" stroke="#c9b07a" stroke-width="2"/>';
    for (var j = 0; j < 4; j++) o += '<path d="M-52,' + (-30 - j * 11) + " L-12," + (-22 - j * 11) + '" stroke="#c9b07a" stroke-width="1.5" opacity=".7"/><path d="M12,' + (-22 - j * 11) + " L52," + (-30 - j * 11) + '" stroke="#c9b07a" stroke-width="1.5" opacity=".7"/>';
    return o + '<path d="M-40,0 L40,0 L52,28 L-52,28 Z" fill="' + tint("#6a4a2a", P === T.night ? 0.6 : 1) + '"/></g>';
  }
  function scroll(x, y, s, P) {
    var n = P === T.night;
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ') rotate(-8)"><rect x="-62" y="-30" width="124" height="52" rx="6" fill="' + tint("#f3e4bd", n ? 0.6 : 1) + '"/><rect x="-70" y="-34" width="14" height="60" rx="7" fill="' + tint("#c9a45a", n ? 0.6 : 1) + '"/><rect x="56" y="-34" width="14" height="60" rx="7" fill="' + tint("#c9a45a", n ? 0.6 : 1) + '"/><g stroke="#a58a55" stroke-width="2" opacity=".7"><path d="M-44,-16 H40 M-44,-6 H30 M-44,4 H42 M-44,14 H18"/></g><circle cx="30" cy="16" r="9" fill="#b8322a"/></g>';
  }
  function scale(x, y, s, P) {
    var g = "#d9a93a";
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><path d="M0,0 V-120" stroke="' + g + '" stroke-width="7"/><path d="M-26,0 H26" stroke="' + g + '" stroke-width="8" stroke-linecap="round"/><path d="M-80,-110 H80" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-122" r="9" fill="' + g + '"/><path d="M-80,-110 L-100,-60 M-80,-110 L-60,-60 M80,-110 L60,-60 M80,-110 L100,-60" stroke="' + g + '" stroke-width="2.5"/><path d="M-106,-60 H-54 Q-60,-38 -80,-36 Q-100,-38 -106,-60 Z" fill="' + g + '"/><path d="M54,-60 H106 Q100,-38 80,-36 Q60,-38 54,-60 Z" fill="' + g + '"/></g>';
  }
  function dates(x, y, s, P) {
    var n = P === T.night;
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><path d="M-48,-26 H48 Q44,6 0,8 Q-44,6 -48,-26 Z" fill="' + tint("#c8793a", n ? 0.6 : 1) + '"/><ellipse cx="0" cy="-26" rx="48" ry="9" fill="' + tint("#a85d22", n ? 0.6 : 1) + '"/><g fill="#6e3513"><ellipse cx="-24" cy="-34" rx="11" ry="6" transform="rotate(-18 -24 -34)"/><ellipse cx="-4" cy="-40" rx="11" ry="6"/><ellipse cx="18" cy="-35" rx="11" ry="6" transform="rotate(20 18 -35)"/><ellipse cx="-12" cy="-30" rx="10" ry="5.5"/><ellipse cx="8" cy="-28" rx="10" ry="5.5"/></g><g transform="translate(70 0)"><path d="M-16,-34 h32 l-4,38 h-24 Z" fill="' + tint("#c0792b", n ? 0.6 : 1) + '"/><ellipse cx="0" cy="-34" rx="16" ry="4" fill="#2b88c9" opacity=".8"/></g></g>';
  }
  function crescent(x, y, s, P) { return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><circle r="30" fill="#fdf3c8"/><circle cx="14" cy="-7" r="27" fill="' + P.sky[0] + '"/><path d="M34,-24 l3,8 l8,3 l-8,3 l-3,8 l-3,-8 l-8,-3 l8,-3 Z" fill="#fdf3c8"/></g>'; }
  function banners(x, y, s, P) {
    var n = P === T.night, o = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')">';
    [[-70, "#f4f1e6", 1], [0, "#1c1c20", -1], [70, "#f4f1e6", 1]].forEach(function (b) {
      o += '<path d="M' + b[0] + ',0 V-150" stroke="' + tint("#6a4a2a", n ? 0.6 : 1) + '" stroke-width="5" stroke-linecap="round"/><path d="M' + b[0] + ",-148 q" + (b[2] * 40) + ",-12 " + (b[2] * 78) + ",0 v44 q" + (-b[2] * 40) + ",-12 " + (-b[2] * 78) + ',0 Z" fill="' + tint(b[1], n && b[1] !== "#1c1c20" ? 0.6 : 1) + '"/>';
    });
    return o + '<path d="M-110,-6 L110,-6" stroke="' + tint("#6a4a2a", 1) + '" stroke-width="0"/></g>';
  }
  function swords(x, y, s, P) {
    var g = "#d9a93a", bl = "#dfe6ee";
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><g transform="rotate(38)"><rect x="-4" y="-120" width="8" height="104" fill="' + bl + '"/><path d="M-4,-120 L0,-134 L4,-120 Z" fill="' + bl + '"/><rect x="-16" y="-16" width="32" height="7" rx="3" fill="' + g + '"/><rect x="-4" y="-10" width="8" height="26" fill="#6a3a1a"/><circle cy="18" r="5" fill="' + g + '"/></g><g transform="rotate(-38)"><rect x="-4" y="-120" width="8" height="104" fill="' + bl + '"/><path d="M-4,-120 L0,-134 L4,-120 Z" fill="' + bl + '"/><rect x="-16" y="-16" width="32" height="7" rx="3" fill="' + g + '"/><rect x="-4" y="-10" width="8" height="26" fill="#6a3a1a"/><circle cy="18" r="5" fill="' + g + '"/></g><path d="M-34,-30 H34 V0 Q34,26 0,38 Q-34,26 -34,0 Z" fill="#2f7d5a" stroke="' + g + '" stroke-width="4"/></g>';
  }
  function stone(x, y, s, P) {
    var n = P === T.night;
    return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + f(s) + ')"><ellipse cx="4" cy="4" rx="74" ry="9" fill="#000" opacity=".18"/><path d="M-70,0 Q-76,-52 -34,-72 Q10,-92 50,-66 Q82,-44 70,0 Z" fill="' + tint("#a89377", n ? 0.5 : 1) + '"/><path d="M-34,-72 Q10,-92 50,-66 Q30,-50 -6,-54 Q-30,-56 -34,-72 Z" fill="' + tint("#c4b196", n ? 0.5 : 1) + '"/><path d="M50,-66 Q82,-44 70,0 L36,0 Q52,-30 50,-66 Z" fill="' + tint("#857055", n ? 0.5 : 1) + '"/></g>';
  }
  function trench(P) { return '<path d="M-10,' + (H - 66) + ' L' + (W + 10) + "," + (H - 78) + " L" + (W + 10) + "," + (H - 50) + " L-10," + (H - 38) + ' Z" fill="' + tint(P.gr, 0.45) + '"/><path d="M-10,' + (H - 70) + ' L' + (W + 10) + "," + (H - 82) + '" stroke="' + P.d3 + '" stroke-width="8"/>'; }
  function road(P, R) { return '<path d="M-10,' + (H - 14) + " C220," + (H - 70) + " 380," + (HOR + 46) + " 560," + (HOR + 20) + " S720," + (HOR + 4) + " 820," + (HOR - 2) + '" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="3 12" stroke-linecap="round" opacity=".75"/>'; }
  function rocks(P, R) { var o = ""; for (var i = 0; i < 4; i++) { var x = R() * W, y = HOR + 60 + R() * 70, w = 18 + R() * 28; o += '<path d="M' + f(x - w) + "," + f(y) + " Q" + f(x - w * 0.6) + "," + f(y - w * 0.8) + " " + f(x) + "," + f(y - w * 0.9) + " Q" + f(x + w * 0.7) + "," + f(y - w * 0.6) + " " + f(x + w) + "," + f(y) + ' Z" fill="' + tint(P.d3, 0.8) + '"/>'; } return o; }

  /* ---------- Choix des motifs d'après le texte ---------- */
  /* mot-clé (début de mot) -> poids ; les noms de villes comptent peu pour ne pas tout rattacher à la Kaaba */
  var KW = {
    kaaba: { kaaba: 1.5, pelerin: 1, hajj: 1, safa: 1, marwa: 1, arafat: 1, sanctuaire: 1, ihram: 1, tawaf: 1, "la mecque": 0.3 },
    mosque: { mosquee: 1.2, medine: 0.3, priere: 0.8, prier: 0.6, adhan: 1, muezzin: 1, qibla: 1, vendredi: 1, imam: 0.8, suffa: 1, minbar: 1, quba: 1 },
    caravan: { caravane: 1.5, chameau: 1, chamelle: 1, commerc: 0.6, marchand: 0.8, voyage: 0.4, bosra: 1, syrie: 0.4, troupeau: 0.8, expedition: 0.3 },
    tent: { tente: 1.5, bedouin: 1, campement: 1, halima: 1.5, nourrice: 1.5, berger: 1 },
    well: { puits: 1.5, zamzam: 1.5, rumah: 1.5, abreuv: 1 },
    palm: { palmier: 1.5, datte: 0.8, oasis: 1, jardin: 0.8, verger: 1, recolte: 0.8 },
    ship: { "mer rouge": 1.5, bateau: 2, navire: 2, abyssinie: 1.5, negus: 1, "traversent la mer": 2 },
    fortress: { forteresse: 1.5, fortifi: 1, siege: 0.8, rempart: 1, citadelle: 1, constantinople: 1.5, khaybar: 1.5, tabuk: 1 },
    battle: { bataille: 1.2, combat: 0.6, armee: 0.6, epee: 1, guerre: 0.6, badr: 1, uhud: 1, hunayn: 1, mouta: 1, "mu'ta": 1, tranchee: 1, martyr: 0.8, coalition: 1, archer: 1, etendard: 1, victoire: 0.6, vainqueur: 0.8, champion: 0.8 },
    trench: { tranchee: 2, fosse: 1 },
    book: { coran: 1, revelation: 1, verset: 0.8, sourate: 0.8, livre: 0.6, "lis !": 1.5, recueil: 1.2, scribe: 1, secretaire: 0.5 },
    scroll: { lettre: 1.5, charte: 1.5, traite: 1, accord: 0.6, pacte: 1, serment: 0.8, souverain: 1, negociat: 0.8, emissaire: 1, delegation: 0.8, tribut: 0.8 },
    scale: { justice: 1.5, juge: 1, arbitre: 1, arbitr: 1, equite: 1, tribunal: 1, voleu: 1, honnet: 1, "digne de confiance": 1 },
    dates: { datte: 1.2, jeun: 1, ramadan: 1, iftar: 1.5, suhur: 1.5, repas: 0.6, faim: 0.8, zakat: 1, aumone: 1, sadaqa: 1 },
    crescent: { ramadan: 1, aid: 1, lune: 1, hilal: 1.5, calendrier: 0.8 },
    cave: { grotte: 2, hira: 1.5, thawr: 1.5, caverne: 2, montagne: 1, colline: 0.6, "mont ": 0.6 },
    road: { hegire: 1, emigr: 0.8, route: 0.6, chemin: 0.6, cachette: 1, poursuiv: 1, exil: 0.6, depart: 0.5 },
    rays: { lumiere: 1, revelation: 0.8, ange: 1, jibril: 1.5, ascension: 1.5, isra: 1.5, miraj: 1.5, "voyage nocturne": 1.5 }
  };
  var KWRE = {};
  Object.keys(KW).forEach(function (k) { KWRE[k] = Object.keys(KW[k]).map(function (w) { return [new RegExp("(?:^|[^a-z])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), KW[k][w]]; }); });
  function score(text) { var o = {}; Object.keys(KWRE).forEach(function (k) { var v = 0; KWRE[k].forEach(function (p) { var m = text.match(p[0]); if (m) v += m.length * p[1]; }); o[k] = Math.round(v * 10) / 10; }); return o; }
  function pickTime(t) {
    if (/nuit|etoile|minuit|veill|lune|isra|miraj|tahajjud|nocturne|obscur/.test(t)) return "night";
    if (/aube|matin|lever du soleil|fajr|premiere lueur/.test(t)) return "dawn";
    if (/soir|coucher|crepuscule|maghrib|apres-midi/.test(t)) return "sunset";
    return "day";
  }


  /* Décors choisis à la main pour les en-têtes : f = objets, t = moment, m = décor (sea | mount) */
  var HERO = {
    2: { f: ["tent"], t: "dawn" }, 3: { f: ["caravan", "scale"] }, 4: { f: ["book"], t: "night", m: "mount", cave: 1 }, 5: { f: ["book"], t: "dawn" }, 6: { f: ["kaaba"], t: "dawn" },
    7: { f: ["stone"] }, 9: { f: ["kaaba", "battle"] }, 10: { f: ["tent"], m: "mount" }, 11: { f: ["palm"], t: "sunset" }, 12: { f: ["kaaba", "mosque"], t: "night" }, 13: { f: ["scroll", "palm"], t: "night" },
    15: { f: ["mosque", "palm"] }, 17: { f: ["battle"], t: "sunset", m: "mount" }, 19: { f: ["scroll", "palm"] }, 20: { f: ["fortress", "scroll"] }, 22: { f: ["battle"], t: "dawn", m: "mount" },
    23: { f: ["caravan", "fortress"] }, 24: { f: ["kaaba"], t: "sunset", m: "mount" }, 25: { f: ["mosque", "palm"], t: "sunset" },
    101: { f: ["caravan"], t: "night", m: "mount", cave: 1 }, 102: { f: ["scale", "mosque"] }, 103: { f: ["well", "dates"] }, 104: { f: ["battle"], t: "dawn" }, 105: { f: ["kaaba"], t: "dawn" },
    106: { f: ["caravan", "palm"] }, 107: { f: ["battle"], t: "sunset", m: "mount" }, 108: { f: ["book", "mosque"] }, 109: { f: ["battle"], t: "day" }, 110: { f: ["scale", "fortress"] },
    111: { f: ["battle", "tent"], t: "sunset" }, 112: { f: ["battle"], t: "dawn", m: "mount" }, 113: { f: ["book", "mosque"], t: "night" }, 114: { f: ["dates"], t: "night", m: "mount", cave: 1 }, 115: { f: ["scroll", "palm"] },
    116: { f: ["caravan", "scale"], t: "dawn" }, 117: { f: ["dates", "palm"], t: "sunset" }, 118: { f: ["caravan"], t: "dawn" }, 119: { f: [], m: "sea" }, 120: { f: ["battle"], m: "mount" },
    121: { f: ["caravan", "dates"] }, 122: { f: ["tent"], t: "sunset" }, 123: { f: ["book", "caravan"] }, 124: { f: ["mosque", "book"], t: "dawn" }, 125: { f: ["book", "kaaba"] },
    126: { f: ["mosque", "stone"] }, 127: { f: ["fortress", "palm"] }, 128: { f: ["battle", "palm"], t: "sunset" }, 129: { f: ["book"], t: "night" }, 130: { f: ["dates", "palm"] },
    201: { f: ["tent", "palm"], t: "sunset" }, 202: { f: ["palm", "dates"], t: "dawn" }, 203: { f: ["mosque", "palm"] }, 204: { f: ["well", "mosque"] }, 205: { f: ["palm", "dates"] },
    206: { f: ["scale", "mosque"] }, 207: { f: ["tent", "dates"] }, 208: { f: ["mosque", "palm"], t: "dawn" }, 209: { f: ["book", "mosque"] }, 210: { f: ["mosque", "dates"] },
    211: { f: ["book"], t: "night" }, 212: { f: ["scroll", "fortress"] }, 213: { f: ["battle", "fortress"], t: "sunset", m: "mount" }, 214: { f: ["caravan"], t: "night" }, 215: { f: ["palm", "caravan"], t: "dawn" },
    216: { f: ["scroll", "mosque"] }, 301: { f: ["mosque"], t: "dawn" }, 302: { f: ["mosque", "kaaba"] }, 303: { f: ["mosque", "palm"] }, 305: { f: ["scale", "dates"] },
    307: { f: ["dates", "kaaba"], t: "dawn" }, 308: { f: ["mosque"], t: "night" }
  };

  /* ---------- Composition ---------- */
  function compose(spec) {
    var id = ++uid, R = rng(hash(spec.seed)), t = norm(spec.text), s = score(t), strong = score(norm(spec.title || ""));
    Object.keys(s).forEach(function (k) { s[k] += (strong[k] || 0) * 3; });
    var man = spec.man || null;
    var time = (man && man.t) || spec.time || pickTime(norm((spec.title || "") + " " + t.slice(0, 400)));
    var P = T[time];
    var seaScene = man && man.m ? man.m === "sea" : s.ship >= 2;
    var mount = !seaScene && (man && man.m ? man.m === "mount" : s.cave >= 2.5);
    var caveOn = mount && (man ? !!man.cave : s.cave >= 2.5);
    var cityK = /medine|yathrib/.test(t) && !/mecque/.test(t) ? "medine" : /mecque|taif|jerusalem|bosra|damas/.test(t) ? "mecque" : null;
    var order = ["kaaba", "mosque", "caravan", "tent", "well", "palm", "fortress", "battle", "book", "scroll", "scale", "dates", "cave", "road"];
    var cand = order.filter(function (k) { return s[k] >= 1; }).sort(function (a, b) { return s[b] - s[a] || order.indexOf(a) - order.indexOf(b); });
    if (s.battle >= 2.4) cand = cand.filter(function (k) { return (k !== "kaaba" && k !== "mosque") || s[k] >= s.battle * 0.9; });
    if (spec.force) cand = spec.force.concat(cand);
    var chosen = [];
    if (man) cand = [];
    cand.forEach(function (k, i) {
      if (chosen.length >= 2 || chosen.indexOf(k) !== -1) return;
      if ((mount && k === "cave") || (seaScene && k === "ship") || (k === "road" && chosen.length)) return;
      if (chosen.length === 1 && s[k] < Math.max(1.8, s[chosen[0]] * 0.4)) return;
      chosen.push(k);
    });
    if (man) chosen = man.f.slice(0, 2);
    if (!chosen.length && !mount && !seaScene) chosen = [R() < 0.5 ? "caravan" : "palm"];
    if (man && !chosen.length) chosen = [];

    var o = '<svg viewBox="0 0 ' + W + " " + H + '" class="art" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">';
    o += sky(P, id, R, time);
    if (s.crescent >= 2 && time !== "night") o += crescent(120, 70, 0.9, P);
    o += mountains(P, R, mount);
    if (seaScene) o += sea(P, id, R); else o += dunes(P, R);
    if (!seaScene && !mount && cityK) o += city(P, R, 40, W - 40, cityK);
    if (s.trench > 0) o += trench(P);
    if (s.road >= 2 && !seaScene) o += road(P, R);
    if (!seaScene) o += rocks(P, R);
    if (caveOn) o += cave(400, HOR + 70, 1.5, P, (s.rays > 0 || s.book > 0) && time !== "day");
    if (seaScene) o += ship(430, HOR + 40, 1.7, P);

    var slots = chosen.length === 1 ? [400] : [210, 590];
    if (caveOn) slots = chosen.length ? [190, 640] : [400];
    chosen.forEach(function (k, i) {
      var x = slots[i] || 400, y = HOR + 88 + R() * 14;
      if (k === "kaaba") o += kaaba(x, y, 1.45, P);
      else if (k === "mosque") o += mosque(x, y, 1.45, P);
      else if (k === "caravan") o += caravan(x - 150, y + 6, 1.05, P, R);
      else if (k === "tent") o += tent(x, y, 1.3, P) + tent(x + 105, y + 14, 0.9, P);
      else if (k === "well") o += well(x, y + 14, 1.6, P) + palm(x + 90, y + 8, 1.1, P, true);
      else if (k === "palm") o += palm(x - 50, y + 10, 1.5, P, true) + palm(x + 40, y + 20, 1.2, P, true) + palm(x + 100, y + 6, 0.9, P, false);
      else if (k === "fortress") o += fortress(x, y + 8, 1.5, P);
      else if (k === "battle") o += banners(x - 40, y + 6, 1.15, P) + swords(x + 100, y - 36, 0.85, P);
      else if (k === "book") o += book(x, y + 30, 1.4, P, true);
      else if (k === "scroll") o += scroll(x, y + 4, 1.6, P);
      else if (k === "scale") o += scale(x, y + 20, 1.25, P);
      else if (k === "dates") o += dates(x, y + 28, 1.7, P) + (time !== "night" ? "" : "");
      else if (k === "cave") o += cave(x, y + 20, 1.2, P, false);
      else if (k === "road") o += camel(x - 20, y + 8, 1.1, P, false, true);
      else if (k === "stone") o += stone(x, y + 24, 1.5, P);
    });
    if (!man && (!chosen.length || (chosen.length === 1 && chosen[0] !== "palm" && chosen[0] !== "well"))) { if (R() < 0.85) o += palm(60 + R() * 60, HOR + 78 + R() * 20, 0.95 + R() * 0.3, P, true); if (R() < 0.6) o += palm(700 + R() * 50, HOR + 90 + R() * 15, 0.8 + R() * 0.3, P, false); }
    if (!man && s.rays >= 2.5 && chosen.indexOf("book") === -1 && !mount && !seaScene) o += book(690, HOR + 100, 0.85, P, true);
    if (time === "night") o += '<rect width="' + W + '" height="' + H + '" fill="#0a1030" opacity=".12"/>';
    o += '<rect width="' + W + '" height="' + H + '" fill="url(#vg' + id + ')"/><defs><radialGradient id="vg' + id + '" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>';
    return o + "</svg>";
  }

  function itemText(it) { return [it.title, it.sub].concat(it.paras).join(" "); }
  window.SiraArt = {
    hero: function (it) { return compose({ seed: "h" + it.id, text: itemText(it), title: it.title + " " + it.sub, man: HERO[it.id] }); },
    panel: function (it, i) { return compose({ seed: "p" + it.id + "-" + i, text: it.paras[i], title: it.title }); },
    thumb: function (it) { return compose({ seed: "h" + it.id, text: itemText(it), title: it.title + " " + it.sub, man: HERO[it.id] }); },
    _compose: compose
  };
})();
