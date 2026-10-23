/* Lexique : page de recherche, mots soulignés dans les textes, fenêtre d'explication, prononciation. */
(function () {
  "use strict";
  var D = window.LEXIQUE, L = D.list, CAT = D.cat, BYK = {}, MAP = {}, forms = [];
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ﷺ/g, "").replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه"); }
  function spoken(e) { return e.s || e.t.replace(/\s*\([^)]*\)/g, ""); }

  L.forEach(function (e) {
    BYK[e.k] = e;
    e.f.forEach(function (f) { var k = f.toLocaleLowerCase("fr"); if (!MAP[k]) { MAP[k] = e.k; forms.push(f); } });
  });
  forms.sort(function (a, b) { return b.length - a.length; });
  var RE = forms.length ? new RegExp("(^|[^\\p{L}])(" + forms.map(rx).join("|") + ")(?![\\p{L}])", "giu") : null;

  /* Texte brut -> HTML, avec les mots du lexique soulignés (première apparition de chaque mot par page). */
  function annotate(raw, ctx) {
    ctx = ctx || {}; var used = ctx.used || (ctx.used = {}), skip = ctx.skip || {}, cap = ctx.cap || 4;
    if (!RE) return esc(raw);
    var out = "", last = 0, n = 0, m; RE.lastIndex = 0;
    while ((m = RE.exec(raw))) {
      var k = MAP[m[2].toLocaleLowerCase("fr")];
      if (!k || used[k] || skip[k] || n >= cap) continue;
      var at = m.index + m[1].length;
      out += esc(raw.slice(last, at)) + '<button type="button" class="gl" data-g="' + k + '">' + esc(m[2]) + "</button>";
      last = at + m[2].length; used[k] = 1; n++;
    }
    return out + esc(raw.slice(last));
  }

  /* ---------- Fenêtre d'explication ---------- */
  var pop = null, openedAt = 0;
  function pron(e) {
    var p = window.SiraAudio ? SiraAudio.prepare(spoken(e)) : spoken(e);
    return norm(p) === norm(spoken(e)) ? "" : p;
  }
  function closePop() { if (pop) { pop.remove(); pop = null; } document.querySelectorAll(".gl.on").forEach(function (b) { b.classList.remove("on"); }); }
  function openPop(btn) {
    var e = BYK[btn.getAttribute("data-g")]; if (!e) return;
    var wasOn = btn.classList.contains("on"); closePop(); if (wasOn) return;
    btn.classList.add("on");
    pop = document.createElement("div"); pop.className = "glpop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", e.t);
    var p = pron(e);
    pop.innerHTML = '<div class="gp-h"><b>' + esc(e.t) + "</b>" + (e.a ? '<span class="gp-ar" lang="ar" dir="rtl">' + esc(e.a) + "</span>" : "") + '<button type="button" class="gp-x" aria-label="' + T("Fermer") + '">×</button></div>' +
      '<p class="gp-d">' + esc(e.d) + "</p>" + (p ? T('<p class="gp-p">Se prononce : <i>') + esc(p) + "</i></p>" : "") +
      '<div class="gp-a"><button type="button" class="gp-say" data-say="' + e.k + T('">🔊 Écouter</button>') + (e.l ? '<a href="' + e.l + T('">En savoir plus</a>') : "") + '<a href="#/lexique/' + e.k + T('">Voir dans le lexique</a></div>');
    document.body.appendChild(pop); openedAt = Date.now();
    if (window.innerWidth > 700) {
      var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
      var left = Math.min(Math.max(12, r.left), window.innerWidth - w - 12), top = r.bottom + 8;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
      pop.style.left = left + "px"; pop.style.top = top + "px";
    }
  }
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var say = t.closest && t.closest("[data-say]");
    if (say) { var e = BYK[say.getAttribute("data-say")]; if (e && window.SiraAudio) SiraAudio.say(e.k, spoken(e)); return; }
    var g = t.closest && t.closest(".gl");
    if (g) { ev.preventDefault(); openPop(g); return; }
    if (t.closest && t.closest(".gp-x")) { closePop(); return; }
    if (pop && !(t.closest && t.closest(".glpop"))) closePop();
    if (t.closest && t.closest(".glpop a")) closePop();
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closePop(); });
  window.addEventListener("scroll", function () { if (pop && window.innerWidth > 700 && Date.now() - openedAt > 600) closePop(); }, { passive: true });
  window.addEventListener("hashchange", closePop);

  /* ---------- Page « Lexique » ---------- */
  function sortKey(e) {
    var s = norm(e.t).replace(/^(al|an|ar|as|az|ad|at|ash)-/, "").replace(/[^a-z0-9 ]/g, "").trim();
    return s || "~";
  }
  function view(sel) {
    var app = document.getElementById("app"), cat = "", q = "";
    var order = L.slice().sort(function (a, b) { return sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0; });
    app.innerHTML = T('<section class="block wrap"><h2>Lexique</h2><p class="lead">') + L.length + T(' mots, noms et lieux expliqués simplement. Touchez 🔊 pour entendre la prononciation. Dans les textes, les mots soulignés ouvrent une petite explication.</p>') +
      T('<label class="lx-search"><span class="sr-only">Chercher un mot</span><input id="lxq" type="search" placeholder="Chercher un mot : hégire, qibla, Quraysh…" autocomplete="off"></label>') +
      '<div class="chips" id="lxc"></div><nav class="lx-az" id="lxaz" aria-label="' + T("Index alphabétique") + '"></nav><div id="lxl"></div></section>';
    function chips() {
      var h = '<button class="chip" data-c="" aria-pressed="' + (cat === "") + T('">Tous</button>');
      Object.keys(CAT).forEach(function (k) { h += '<button class="chip" data-c="' + k + '" aria-pressed="' + (cat === k) + '">' + esc(CAT[k]) + "</button>"; });
      document.getElementById("lxc").innerHTML = h;
      Array.prototype.forEach.call(document.querySelectorAll("#lxc .chip"), function (b) { b.onclick = function () { cat = b.getAttribute("data-c"); chips(); render(); }; });
    }
    function render() {
      var qn = norm(q).trim(), groups = {}, letters = [];
      order.forEach(function (e) {
        if (cat && e.c !== cat) return;
        if (qn && norm(e.t + " " + e.d + " " + e.f.join(" ")).indexOf(qn) === -1) return;
        var l = sortKey(e).charAt(0).toUpperCase(); if (!/[A-Z]/.test(l)) l = "#";
        (groups[l] = groups[l] || []).push(e);
      });
      letters = Object.keys(groups).sort();
      document.getElementById("lxaz").innerHTML = letters.map(function (l) { return '<a href="#" data-l="' + l + '">' + l + "</a>"; }).join("");
      document.getElementById("lxl").innerHTML = letters.length ? letters.map(function (l) {
        return '<h3 class="lx-l" id="lx-' + (l === "#" ? "x" : l) + '">' + l + '</h3><div class="lx-grid">' + groups[l].map(function (e) {
          var p = pron(e);
          return '<article class="lx" id="g-' + e.k + '"><header><h4>' + esc(e.t) + "</h4>" + (e.a ? '<span class="lx-ar" lang="ar" dir="rtl">' + esc(e.a) + "</span>" : "") + '<button type="button" class="lx-say" data-say="' + e.k + T('" aria-label="Écouter ') + esc(e.t) + '">🔊</button></header>' +
            (p ? T('<p class="lx-pr">Se prononce : <i>') + esc(p) + "</i></p>" : "") + "<p>" + esc(e.d) + '</p><footer><span class="lx-cat">' + esc(CAT[e.c]) + "</span>" + (e.l ? '<a href="' + e.l + T('">En savoir plus →</a>') : "") + "</footer></article>";
        }).join("") + "</div>";
      }).join("") : T('<p class="empty">Aucun mot ne correspond. Essayez une autre écriture.</p>');
      Array.prototype.forEach.call(document.querySelectorAll("#lxaz a"), function (a) {
        a.onclick = function (ev) { ev.preventDefault(); var t = document.getElementById("lx-" + (a.getAttribute("data-l") === "#" ? "x" : a.getAttribute("data-l"))); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); };
      });
    }
    document.getElementById("lxq").addEventListener("input", function (ev) { q = ev.target.value; render(); });
    chips(); render();
    if (sel && BYK[sel]) setTimeout(function () { var el = document.getElementById("g-" + sel); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); } }, 60);
  }

  function search(q, max) {
    var qn = norm(q).trim(); if (qn.length < 2) return [];
    return L.filter(function (e) { return norm(e.t + " " + e.f.join(" ")).indexOf(qn) !== -1; }).slice(0, max || 6);
  }

  window.SiraLexique = { annotate: annotate, view: view, search: search, closePop: closePop, byKey: function (k) { return BYK[k]; }, list: L, spoken: spoken };
})();
