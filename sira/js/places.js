/* Cartes et lieux : carte schématique (non à l'échelle) des lieux de la Sira. */
(function () {
  "use strict";
  var W = 450, H = 720, K = 36, LON0 = 33, LAT0 = 33.5;
  function X(lon) { return +((lon - LON0) * K).toFixed(1); }
  function Y(lat) { return +((LAT0 - lat) * K).toFixed(1); }
  function pts(a) { return a.map(function (p) { return X(p[0]) + "," + Y(p[1]); }).join(" "); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ch(id, label) { return { href: "#/chapitre/" + id, label: label || "Chapitre " + id }; }

  /* [lon, lat] */
  var SEA = [[34.3, 27.8], [33.8, 27.2], [33.93, 26.75], [34.9, 25.1], [35.5, 23.9], [36.2, 22.5], [37.22, 19.6], [39.45, 15.6], [42.7, 13.0], [43.5, 12.6], [43.25, 13.3], [42.95, 14.8], [42.8, 16.3], [42.55, 16.9], [41.08, 19.13], [39.17, 21.5], [39.03, 22.8], [38.06, 24.09], [37.27, 25.02], [36.46, 26.23], [35.69, 27.35], [34.95, 29.3], [35.0, 29.55], [34.8, 28.9], [34.5, 28.0]];
  var MED = [[33, 33.5], [35.15, 33.5], [35.1, 33.0], [34.95, 32.5], [34.75, 32.0], [34.45, 31.5], [34.2, 31.3], [33, 31.15]];
  var HIJRA = [[39.83, 21.42], [39.7, 21.3], [39.45, 22.0], [39.4, 22.8], [39.4, 23.5], [39.5, 24.0], [39.62, 24.44]];

  var PLACES = [
    { id: "mecque", name: "La Mecque", lat: 21.42, lon: 39.83, icon: "🕋", ax: "end",
      text: "La ville natale de Mouhammed ﷺ et le lieu de la Kaaba. Il y naît, reçoit la première révélation, y prêche pendant treize ans, puis y revient en vainqueur en l'an 8. Autour de la ville se trouvent plusieurs lieux importants : la grotte de Hira (première révélation), la grotte de Thawr (cachette de l'Hégire), la plaine d'Arafat et Mina (pèlerinage), Hudaybiyya (le traité de l'an 6) et la vallée de Hunayn (la bataille de l'an 8).",
      links: [ch(2, "Naissance"), ch(4, "Première révélation"), ch(14, "Hégire et Thawr"), ch(19, "Hudaybiyya"), ch(21, "Conquête"), ch(22, "Hunayn"), { href: "#/rite/306", label: "Le pèlerinage" }] },
    { id: "taif", name: "Taïf", lat: 21.27, lon: 40.42, icon: "🍇", dy: 14,
      text: "Ville fraîche et fertile, à l'est de La Mecque. En 619, le Prophète ﷺ y cherche un appui après la mort d'Abu Talib et de Khadija, mais il est rejeté et chassé à coups de pierres. Taïf est assiégée sans succès en l'an 8 et finit par se rallier.",
      links: [ch(11), ch(22, "Hunayn et siège de Taïf")] },
    { id: "medine", name: "Médine", lat: 24.47, lon: 39.61, icon: "🕌",
      text: "Anciennement Yathrib, la ville de l'Hégire (622). Le Prophète ﷺ y construit sa mosquée, y fonde la première communauté et y meurt en 632. Tout près se trouvent Quba (la première mosquée de l'islam), le mont Uhud (la bataille de l'an 3) et la tranchée creusée en l'an 5.",
      links: [ch(14), ch(15), ch(17, "Uhud"), ch(18, "La Tranchée"), ch(25, "Sa mort")] },
    { id: "badr", name: "Badr", lat: 23.78, lon: 38.79, icon: "⚔️",
      text: "Un point d'eau sur la route des caravanes de Syrie, au sud-ouest de Médine. La première grande bataille de l'islam y a lieu en Ramadan de l'an 2 : environ trois cent treize musulmans y affrontent près de mille Mecquois.",
      links: [ch(16)] },
    { id: "khaybar", name: "Khaybar", lat: 25.7, lon: 39.29, icon: "🏰",
      text: "Une oasis fortifiée au nord de Médine. Elle est conquise en l'an 7, peu après le traité de Hudaybiyya. À cette époque, Ja'far et les émigrés d'Abyssinie rentrent à Médine.",
      links: [ch(20)] },
    { id: "tabuk", name: "Tabuk", lat: 28.38, lon: 36.57, icon: "🐪",
      text: "Une étape au nord de l'Arabie, vers la frontière byzantine. En l'an 9, le Prophète ﷺ y mène l'armée de la difficulté, composée d'environ trente mille hommes, en plein été.",
      links: [ch(23)] },
    { id: "muta", name: "Mu'ta", lat: 31.07, lon: 35.7, icon: "🚩",
      text: "Un village de l'actuelle Jordanie. En l'an 8, une armée musulmane d'environ trois mille hommes y affronte une force byzantine bien plus nombreuse. Les trois chefs désignés par le Prophète ﷺ y tombent l'un après l'autre.",
      links: [{ href: "#/theme/213", label: "La bataille de Mu'ta" }] },
    { id: "jerusalem", name: "Jérusalem", lat: 31.78, lon: 35.23, icon: "🕌",
      text: "Pendant le voyage nocturne, le Prophète ﷺ est transporté de La Mecque à la mosquée al-Aqsa, d'où il monte aux cieux. C'est aussi la première direction de prière (qibla) des musulmans pendant environ seize mois.",
      links: [ch(12, "Voyage nocturne"), { href: "#/rite/302", label: "Le changement de qibla" }] },
    { id: "bosra", name: "Bosra", lat: 32.52, lon: 36.48, icon: "🛣️",
      text: "Ville de Syrie, étape des caravanes de La Mecque. Selon la tradition, le moine Bahira y remarque chez le jeune Mouhammed ﷺ des signes de prophétie. Il y retourne plus tard avec les caravanes de Khadija.",
      links: [ch(3)] },
    { id: "najran", name: "Najran", lat: 17.49, lon: 44.13, icon: "⛪",
      text: "Une oasis du sud de l'Arabie, à majorité chrétienne. En l'an 9 ou 10, une délégation de Najran se rend à Médine, où le Prophète ﷺ la reçoit dans sa mosquée.",
      links: [{ href: "#/theme/216", label: "Les chrétiens de Najran" }] },
    { id: "abyssinie", name: "Abyssinie (Aksoum)", lat: 14.13, lon: 38.72, icon: "🌍",
      text: "Le royaume chrétien du Négus, de l'autre côté de la mer Rouge. À partir de 615, plus de quatre-vingts musulmans, dont Ja'far et Uthman, y trouvent refuge et protection.",
      links: [ch(8)] }
  ];

  function view(sel) {
    var app = document.getElementById("app");
    var cur = PLACES.filter(function (p) { return p.id === sel; })[0] || PLACES[0];
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" class="map" role="img" aria-label="Carte schématique du Hedjaz et de ses environs">' +
      '<rect width="' + W + '" height="' + H + '" class="m-land"/>' +
      '<polygon points="' + pts(MED) + '" class="m-sea"/><polygon points="' + pts(SEA) + '" class="m-sea"/>' +
      '<text x="' + X(37.9) + '" y="' + Y(20.4) + '" class="m-lbl" transform="rotate(48 ' + X(37.9) + " " + Y(20.4) + ')">Mer Rouge</text>' +
      '<text x="' + X(33.3) + '" y="' + Y(32.6) + '" class="m-lbl">Méditerranée</text>' +
      '<text x="' + X(41.6) + '" y="' + Y(26.5) + '" class="m-land-lbl">ARABIE</text>' +
      '<polyline points="' + pts(HIJRA) + '" class="m-route"/>' +
      PLACES.map(function (p) {
        var on = p.id === cur.id;
        return '<g class="m-pt' + (on ? " on" : "") + '" data-id="' + p.id + '" tabindex="0" role="button" aria-label="' + esc(p.name) + '">' +
          '<circle cx="' + X(p.lon) + '" cy="' + Y(p.lat) + '" r="' + (on ? 9 : 6) + '"/>' +
          '<text x="' + (X(p.lon) + (p.ax === "end" ? -11 : 11)) + '" y="' + (Y(p.lat) + (p.dy || 4)) + '"' + (p.ax === "end" ? ' text-anchor="end"' : "") + ">" + esc(p.name) + "</text></g>";
      }).join("") + "</svg>";

    function panel(p) {
      return '<h2>' + p.icon + " " + esc(p.name) + "</h2><p>" + esc(p.text) + '</p><div class="m-links">' +
        p.links.map(function (l) { return '<a class="btn ghost" href="' + l.href + '">' + esc(l.label) + "</a>"; }).join("") + "</div>";
    }

    app.innerHTML = '<section class="block wrap"><h2>Cartes et lieux</h2><p class="lead">Touchez un lieu pour voir ce qui s\'y est passé. Carte schématique : les distances et les côtes sont approximatives.</p>' +
      '<div class="m-wrap"><div class="m-box">' + svg + '<p class="muted small">Pointillés : la route de l\'Hégire (tracé approximatif).</p></div>' +
      '<aside class="m-panel" id="mp" aria-live="polite">' + panel(cur) + '</aside></div>' +
      '<h3>Tous les lieux</h3><div class="chips">' + PLACES.map(function (p) { return '<button class="chip" data-id="' + p.id + '" aria-pressed="' + (p.id === cur.id) + '">' + p.icon + " " + esc(p.name) + "</button>"; }).join("") + "</div></section>";

    function select(id) {
      var p = PLACES.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      document.getElementById("mp").innerHTML = panel(p);
      Array.prototype.forEach.call(app.querySelectorAll(".m-pt"), function (g) {
        var on = g.getAttribute("data-id") === id; g.classList.toggle("on", on); g.querySelector("circle").setAttribute("r", on ? 9 : 6);
      });
      Array.prototype.forEach.call(app.querySelectorAll(".chip"), function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-id") === id); });
      try { history.replaceState(null, "", "#/lieux/" + id); } catch (e) {}
    }
    Array.prototype.forEach.call(app.querySelectorAll(".m-pt, .chip"), function (el) {
      el.addEventListener("click", function () { select(el.getAttribute("data-id")); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(el.getAttribute("data-id")); } });
    });
  }

  window.SiraPlaces = { view: view, places: PLACES };
})();
