/* Médailles colorées pour les récompenses (badges, niveaux, trophée). Dessins vectoriels, sans personnage. */
(function () {
  "use strict";
  var uid = 0;
  var GLYPH = {
    sprout: function () { return '<path d="M0,22 V0" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M0,4 C-6,-14 -22,-12 -25,-3 C-16,3 -6,7 0,4 Z" fill="#d9ffb8"/><path d="M0,-3 C6,-23 23,-21 25,-12 C16,-6 6,-2 0,-3 Z" fill="#fff"/><path d="M-17,23 H17" stroke="#ffe08a" stroke-width="4" stroke-linecap="round"/>'; },
    target: function () { return '<circle r="23" fill="#fff"/><circle r="17" fill="#e53935"/><circle r="11" fill="#fff"/><circle r="5.5" fill="#e53935"/><path d="M3,-3 L24,-24" stroke="#6d4c1f" stroke-width="3.5" stroke-linecap="round"/><path d="M19,-27 L27,-27 L27,-19 Z M23,-15 L15,-23 L29,-23 Z" fill="#ffd54f"/>'; },
    bolt: function () { return '<polygon points="5,-27 -15,4 -3,4 -8,27 17,-8 3,-8" fill="#fff59d" stroke="#ef6c00" stroke-width="2.5" stroke-linejoin="round"/>'; },
    moon: function (c) { return '<circle r="21" fill="#fff3b8"/><circle cx="10" cy="-6" r="18" fill="' + c + '"/><path d="M15,-17 l2.4,6 l6,2.4 l-6,2.4 l-2.4,6 l-2.4,-6 l-6,-2.4 l6,-2.4 Z" fill="#fff3b8"/><circle cx="20" cy="12" r="2.2" fill="#fff3b8"/><circle cx="-4" cy="-24" r="1.8" fill="#fff3b8"/>'; },
    kaaba: function () { return '<ellipse cy="22" rx="24" ry="4" fill="#fff" opacity=".4"/><polygon points="-18,-8 -18,20 12,20 12,-8" fill="#1d1d22"/><polygon points="12,-8 21,-13 21,15 12,20" fill="#0f0f13"/><polygon points="-18,-8 -9,-14 21,-14 12,-8" fill="#42424b"/><rect x="-18" y="-3" width="30" height="6" fill="#f4c542"/><polygon points="12,-3 21,-8 21,-2 12,3" fill="#c8961d"/><rect x="-10" y="6" width="9" height="14" fill="#f4c542"/>'; },
    mosque: function () { return '<rect x="-26" y="2" width="42" height="20" fill="#d9a766"/><polygon points="-30,2 -21,-9 11,-9 20,2" fill="#7a5230"/><g fill="#8a5a2b"><rect x="-22" y="4" width="4" height="18"/><rect x="-12" y="4" width="4" height="18"/><rect x="0" y="4" width="4" height="18"/><rect x="9" y="4" width="4" height="18"/></g><rect x="-8" y="9" width="8" height="13" rx="4" fill="#3a2514"/><path d="M24,22 Q22,6 26,-6" stroke="#8a5a2b" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M26,-6 q-12,-2 -16,8 q9,-6 16,-8 M26,-6 q12,-2 16,8 q-9,-6 -16,-8 M26,-6 q-2,-12 -10,-14 q6,4 10,14 M26,-6 q4,-12 12,-14 q-8,4 -12,14" fill="#2fbf5b"/>'; },
    palm: function () { return '<path d="M-2,26 Q-8,6 2,-10" stroke="#8a5a2b" stroke-width="6" fill="none" stroke-linecap="round"/><g fill="#2fbf5b"><path d="M2,-10 q-24,-4 -28,12 q14,-12 28,-12"/><path d="M2,-10 q24,-4 28,12 q-14,-12 -28,-12"/><path d="M2,-10 q-12,-18 -26,-14 q16,0 26,14"/><path d="M2,-10 q12,-18 26,-14 q-16,0 -26,14"/><path d="M2,-10 q-3,-18 3,-26 q4,12 -3,26"/></g><circle cx="-2" cy="-6" r="3.2" fill="#a85d22"/><circle cx="6" cy="-4" r="3.2" fill="#8c4a1a"/>'; },
    book: function () { return '<path d="M-27,2 L-1,12 L-1,-26 L-27,-34 Z" transform="translate(0 6)" fill="#fffbe6"/><path d="M1,12 L27,2 L27,-34 L1,-26 Z" transform="translate(0 6)" fill="#fff3c4"/><path d="M-30,10 L0,22 L30,10 L30,16 L0,28 L-30,16 Z" fill="#0f7a6a"/><path d="M-21,-20 L-8,-15 M-21,-12 L-8,-7 M-21,-4 L-8,1 M8,-15 L21,-20 M8,-7 L21,-12 M8,1 L21,-4" stroke="#d9a93a" stroke-width="2.2" stroke-linecap="round"/>'; },
    rites: function () { return '<path d="M-24,20 C-24,-10 24,-10 24,20 Z" fill="#fff6dd"/><path d="M-24,20 C-24,-10 24,-10 24,20" fill="none" stroke="#f4c542" stroke-width="3"/><rect x="-27" y="18" width="54" height="7" rx="2" fill="#f4c542"/><path d="M-7,20 V12 Q0,4 7,12 V20 Z" fill="#c2185b"/><path d="M0,-7 V-12" stroke="#f4c542" stroke-width="3"/><circle cx="0" cy="-19" r="8" fill="#ffd54f"/><circle cx="3.5" cy="-21" r="7" fill="#d9467a"/>'; },
    trophy: function () { return '<path d="M-17,-22 H17 V-6 C17,8 8,15 0,15 C-8,15 -17,8 -17,-6 Z" fill="url(#TG)"/><path d="M-17,-18 H-27 C-27,-4 -21,2 -14,2 M17,-18 H27 C27,-4 21,2 14,2" fill="none" stroke="#ffd54f" stroke-width="4" stroke-linecap="round"/><rect x="-4" y="14" width="8" height="9" fill="#e0a826"/><rect x="-14" y="22" width="28" height="7" rx="2" fill="#a5731a"/><path d="M0,-17 l3.6,7.4 l8.2,1.1 l-6,5.7 l1.5,8.1 l-7.3,-4 l-7.3,4 l1.5,-8.1 l-6,-5.7 l8.2,-1.1 Z" fill="#fff"/>'; }
  };
  var STYLE = {
    sprout: { c: ["#9be15d", "#2e9e4a"], r: ["#2e9e4a", "#1f7a37"], g: GLYPH.sprout },
    target: { c: ["#ff8a80", "#d32f2f"], r: ["#d32f2f", "#9a1d1d"], g: GLYPH.target },
    bolt: { c: ["#ffd740", "#ff8f00"], r: ["#ff8f00", "#c25e00"], g: GLYPH.bolt },
    moon: { c: ["#7c6df2", "#2a2a8a"], r: ["#3f3fb5", "#2a2a8a"], g: function () { return GLYPH.moon("#4a40c4"); } },
    kaaba: { c: ["#ffd86b", "#e08a00"], r: ["#e08a00", "#a85d00"], g: GLYPH.kaaba },
    mosque: { c: ["#55e08a", "#0f8a4a"], r: ["#0f8a4a", "#0a6535"], g: GLYPH.mosque },
    palm: { c: ["#59c8ff", "#1565c0"], r: ["#1565c0", "#0d4a8f"], g: GLYPH.palm },
    book: { c: ["#4fe3c9", "#00897b"], r: ["#00897b", "#00675c"], g: GLYPH.book },
    rites: { c: ["#ff9bd0", "#c2185b"], r: ["#c2185b", "#8e1244"], g: GLYPH.rites },
    trophy: { c: ["#ff8a65", "#b71c1c"], r: ["#b71c1c", "#7f1212"], g: GLYPH.trophy }
  };
  var LEVEL = [
    { c: ["#9be15d", "#2e9e4a"], r: ["#2e9e4a", "#1f7a37"] }, { c: ["#6ec6ff", "#1f6fd1"], r: ["#1f6fd1", "#154f9a"] }, { c: ["#d08bff", "#7b2ff7"], r: ["#7b2ff7", "#5a1ec0"] },
    { c: ["#ffb55a", "#e8590c"], r: ["#e8590c", "#b04508"] }, { c: ["#ff7d7d", "#c62828"], r: ["#c62828", "#8f1d1d"] }, { c: ["#ffe27a", "#d9a93a"], r: ["#c2185b", "#8e1244"] }
  ];

  function frame(style, glyph, opts) {
    var i = ++uid, c = style.c, r = style.r;
    var o = '<svg viewBox="0 0 100 112" class="medal' + (opts && opts.locked ? " locked" : "") + '" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="rg' + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6b5"/><stop offset=".5" stop-color="#f0b72e"/><stop offset="1" stop-color="#a8721a"/></linearGradient>' +
      '<radialGradient id="ig' + i + '" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></radialGradient>' +
      '<linearGradient id="TG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".55" stop-color="#f4b82a"/><stop offset="1" stop-color="#c27d0e"/></linearGradient></defs>';
    o += '<path d="M28,64 L16,108 L33,100 L45,110 L53,70 Z" fill="' + r[0] + '"/><path d="M72,64 L84,108 L67,100 L55,110 L47,70 Z" fill="' + r[1] + '"/>';
    o += '<circle cx="50" cy="46" r="40" fill="url(#rg' + i + ')"/><circle cx="50" cy="46" r="34.5" fill="#8a5a12" opacity=".55"/><circle cx="50" cy="46" r="32" fill="url(#ig' + i + ')"/>';
    o += '<g transform="translate(50 46)">' + glyph + "</g>";
    o += '<path d="M24,32 A28,28 0 0 1 56,16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".32"/>';
    if (opts && opts.sparkle) o += '<path d="M88,10 l2.4,6 l6,2.4 l-6,2.4 l-2.4,6 l-2.4,-6 l-6,-2.4 l6,-2.4 Z M10,22 l1.8,4.4 l4.4,1.8 l-4.4,1.8 l-1.8,4.4 l-1.8,-4.4 l-4.4,-1.8 l4.4,-1.8 Z" fill="#fff6b5"/>';
    if (opts && opts.locked) o += '<g transform="translate(74 76)"><circle r="14" fill="#1b2a44" stroke="#f0b72e" stroke-width="2.5"/><rect x="-6" y="-2" width="12" height="9" rx="2" fill="#f0b72e"/><path d="M-4,-2 V-6 a4,4 0 0 1 8,0 V-2" fill="none" stroke="#f0b72e" stroke-width="2.4"/></g>';
    return o + "</svg>";
  }

  window.SiraMedals = {
    badge: function (art, unlocked) { var s = STYLE[art] || STYLE.trophy; return frame(s, s.g(), { locked: !unlocked, sparkle: unlocked }); },
    level: function (i) { var s = LEVEL[Math.max(0, Math.min(LEVEL.length - 1, i))]; return frame(s, '<text y="12" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="38" fill="#fff" stroke="#00000055" stroke-width="1.5" paint-order="stroke">' + (i + 1) + "</text>", { sparkle: true }); },
    trophy: function (px) {
      var i = ++uid;
      return '<svg viewBox="-34 -32 68 66" width="' + px + '" height="' + px + '" aria-hidden="true" focusable="false"><defs><linearGradient id="TG' + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".55" stop-color="#f4b82a"/><stop offset="1" stop-color="#c27d0e"/></linearGradient></defs>' + GLYPH.trophy().replace(/url\(#TG\)/, "url(#TG" + i + ")") + "</svg>";
    }
  };
})();
