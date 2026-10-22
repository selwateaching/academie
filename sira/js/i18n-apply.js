/* Applique la traduction anglaise sur les données (en place), puis traduit les textes fixes de la page.
   Le français d'origine est conservé dans it.fr pour les illustrations (mots-clés français). */
(function () {
  "use strict";
  var en = window.LANG === "en" && window.EN;

  function staticText() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-t]"), function (el) {
      if (!el.hasAttribute("data-t-fr")) el.setAttribute("data-t-fr", el.textContent);
      el.textContent = window.T(el.getAttribute("data-t-fr"));
    });
    ["placeholder", "aria-label", "title", "content"].forEach(function (a) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-t-" + a + "]"), function (el) {
        el.setAttribute(a, window.T(el.getAttribute("data-t-" + a)));
      });
    });
    var btn = document.getElementById("langbtn");
    if (btn) {
      btn.textContent = window.LANG === "en" ? "FR" : "EN";
      btn.setAttribute("aria-label", window.LANG === "en" ? "Passer en français" : "Switch to English");
      btn.setAttribute("title", window.LANG === "en" ? "Français" : "English");
      btn.onclick = function () { window.SiraI18n.set(window.LANG === "en" ? "fr" : "en"); };
    }
  }

  if (en) {
    var items = [].concat(window.CHAPTERS || [], window.COMPANIONS || [], window.THEMES || [], window.RITES || []);
    items.forEach(function (it) {
      var tr = en.items && en.items[it.id];
      it.fr = { title: it.title, sub: it.sub, date: it.date, paras: it.paras };
      if (!tr) return;
      it.title = tr.t; it.sub = tr.s; it.date = tr.d; it.paras = tr.p;
    });
    if (en.periods) (window.PERIODS || []).forEach(function (p) { if (en.periods[p.id]) p.label = en.periods[p.id]; });
    window.QUIZ_FR = window.QUIZ;
    window.QUIZ = Object.assign({}, window.QUIZ, en.quiz || {});

    if (window.LEXIQUE) {
      var L = window.LEXIQUE;
      Object.keys(L.cat).forEach(function (k) { if (en.cat && en.cat[k]) L.cat[k] = en.cat[k]; });
      var byId = {}; (window.COMPANIONS || []).forEach(function (c) { byId[c.id] = c; });
      L.list.forEach(function (e) {
        if (e.portrait && byId[e.portrait]) {
          var c = byId[e.portrait];
          e.t = c.title; e.d = c.sub + " (" + c.date + ")";
          e.f = (en.cf && en.cf[e.portrait]) || [c.title];
          return;
        }
        var tr = en.lex && en.lex[e.k];
        if (!tr) return;
        if (tr.t) e.t = tr.t;
        if (tr.d) e.d = tr.d;
        e.f = tr.f || [];
        e.s = tr.s || "";
      });
    }
    if (window.SiraPlaces && en.places) {
      window.SiraPlaces.places.forEach(function (p) {
        var tr = en.places[p.id]; if (!tr) return;
        p.name = tr.n; p.text = tr.x;
        p.links.forEach(function (l, i) { if (tr.l && tr.l[i]) l.label = tr.l[i]; });
      });
    }
  }
  staticText();
  window.SiraI18n.staticText = staticText;
})();
