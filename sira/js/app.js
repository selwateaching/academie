(function () {
  "use strict";
  var app = document.getElementById("app");
  var qInput = document.getElementById("q");
  var CH = window.CHAPTERS, PER = window.PERIODS, CO = window.COMPANIONS, TH = window.THEMES, RI = window.RITES;
  function kindOf(id) { return id >= 300 ? "ri" : id >= 200 ? "th" : id >= 100 ? "co" : "ch"; }
  function hrefOf(id) { var k = kindOf(id); return (k === "ri" ? "#/rite/" : k === "th" ? "#/theme/" : k === "co" ? "#/compagnon/" : "#/chapitre/") + id; }
  var KIND = {
    ch: { list: CH, off: 1, back: "#/chapitres", end: "Fin du récit — tous les chapitres", fact: "Chapitre", icon: null },
    co: { list: CO, off: 101, back: "#/compagnons", end: "Tous les compagnons", fact: "Portrait", icon: "👤", crumb: "Compagnons" },
    th: { list: TH, off: 201, back: "#/themes", end: "Toutes les fiches", fact: "Fiche", icon: "📖", crumb: "Famille et thèmes" },
    ri: { list: RI, off: 301, back: "#/rites", end: "Toutes les fiches", fact: "Fiche", icon: "🕌", crumb: "Rites et fêtes" }
  };
  var KEY = "sira-fr:read", KEY_FS = "sira-fr:fs";

  function store(get, k, v) {
    try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function readSet() {
    try { return JSON.parse(store(true, KEY) || "[]"); } catch (e) { return []; }
  }
  function isRead(id) { return readSet().indexOf(id) !== -1; }
  function setRead(id, on) {
    var s = readSet().filter(function (x) { return x !== id; });
    if (on) s.push(id);
    store(false, KEY, JSON.stringify(s));
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function minutes(c) {
    var w = c.paras.join(" ").split(/\s+/).length;
    return Math.max(1, Math.round(w / 200));
  }
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ﷺ/g, "").replace(/mouhammed/g, "muhammad");
  }
  function periodLabel(id) {
    return PER.filter(function (p) { return p.id === id; })[0].label;
  }

  function card(c) {
    return '<a class="card' + (isRead(c.id) ? " done" : "") + '" href="' + hrefOf(c.id) + '">' +
      '<span class="num">' + (KIND[kindOf(c.id)].icon || String(c.id).padStart(2, "0")) + '</span>' +
      "<h3>" + esc(c.title) + "</h3><p>" + esc(c.sub) + "</p>" +
      '<div class="meta"><span>' + esc(c.date) + "</span><span>" + (SiraQuiz.stars(c.id) !== null ? '<span class="stars sm">' + SiraQuiz.starStr(SiraQuiz.stars(c.id)) + "</span> · " : "") + minutes(c) + " min</span></div></a>";
  }

  /* ---------- Audio : voir js/speech.js ---------- */
  var SPEECH = SiraAudio.supported();
  function stopSpeech() { SiraAudio.stop(); }

  /* ---------- Vues ---------- */
  function viewHome() {
    var done = readSet().filter(function (x) { return x < 100; }).length;
    var next = CH.filter(function (c) { return !isRead(c.id); })[0] || CH[0];
    var label = done === 0 ? "Commencer la lecture" : done >= CH.length ? "Relire depuis le début" : "Reprendre : chapitre " + next.id;
    var target = done >= CH.length ? CH[0] : next;
    app.innerHTML =
      '<section class="hero"><div class="wrap hero-inner"><div>' +
      '<span class="badge">Récit complet en 25 chapitres</span>' +
      "<h1>Découvrez la vie du Prophète <em>ﷺ</em> d'une manière différente</h1>" +
      "<p>Ici, on ne se contente pas de dates : on suit un homme, ses proches, ses épreuves et ses victoires, de l'orphelin de La Mecque au guide d'une communauté. Une lecture simple, claire et fidèle aux sources.</p>" +
      '<div class="cta"><a class="btn gold" href="#/chapitre/' + target.id + '">' + label + '</a><a class="btn ghost" href="#/chapitres">Tous les chapitres</a></div></div>' +
      '<div class="cover" aria-hidden="true"><div><div class="tag">Collection Sira</div><h2>La vie du Prophète ﷺ</h2></div>' +
      '<svg viewBox="0 0 200 120"><path d="M10 110h180M30 110V70a20 20 0 0 1 40 0v40M80 110V50a20 20 0 0 1 40 0v60M130 110V75a18 18 0 0 1 36 0v35M100 10v14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>' +
      '<div class="foot">De La Mecque à Médine · 570 – 632</div></div></div></section>' +
      '<div class="wrap stats">' +
      '<div class="stat"><b>25</b><span>chapitres</span></div>' +
      '<div class="stat"><b>3</b><span>grandes périodes</span></div>' +
      '<div class="stat"><b>63</b><span>années de vie</span></div>' +
      '<div class="stat"><b>' + done + "/" + CH.length + "</b><span>chapitres lus</span></div></div>" +
      '<section class="block wrap"><h2>Vos récompenses</h2><p class="lead">Chaque chapitre se termine par un quiz.</p>' + SiraQuiz.rewardsHtml(true) + '<p><a class="btn ghost" href="#/recompenses">Voir tous mes badges</a></p></section>' +
      '<section class="block wrap"><h2>Choisissez votre période</h2><p class="lead">Trois grandes étapes, du berceau à l\'adieu.</p><div class="grid">' +
      PER.map(function (p) {
        var list = CH.filter(function (c) { return c.period === p.id; });
        return '<a class="card" href="#/chapitres/' + p.id + '"><span class="num">' + p.icon + "</span><h3>" + esc(p.label) + "</h3><p>" +
          list.length + " chapitres · " + esc(list[0].date.replace(/^avant /, "")) + " → " + esc(list[list.length - 1].date) + "</p></a>";
      }).join("") + "</div></section>" +
      '<section class="block wrap"><h2>Les compagnons du Prophète ﷺ</h2><p class="lead">Trente portraits : ceux qui ont marché, combattu et prié à ses côtés.</p><div class="grid">' +
      [101, 102, 105, 113].map(function (id) { return card(CO[id - 101]); }).join("") + '</div><p><a class="btn ghost" href="#/compagnons">Voir tous les compagnons</a></p></section>' +
      '<section class="block wrap"><h2>Famille et thèmes</h2><p class="lead">Les épouses, les enfants, le caractère du Prophète ﷺ et la vie à Médine.</p><div class="grid">' +
      [201, 204, 208, 211].map(function (id) { return card(TH[id - 201]); }).join("") + '</div><p><a class="btn ghost" href="#/themes">Voir toutes les fiches</a></p></section>' +
      '<section class="block wrap"><h2>Rites et fêtes</h2><p class="lead">La prière, le jeûne, la zakat, le pèlerinage et les deux fêtes.</p><div class="grid">' +
      [301, 304, 306, 307].map(function (id) { return card(RI[id - 301]); }).join("") + '</div><p><a class="btn ghost" href="#/rites">Voir tous les rites</a></p></section>' +
      '<section class="block wrap"><h2>Cartes et lieux</h2><p class="lead">Où tout s\'est passé : La Mecque, Médine, Badr, Khaybar, Tabuk…</p><p><a class="btn gold" href="#/lieux">Ouvrir la carte</a></p></section>' +
      '<section class="block wrap"><h2>Pour commencer</h2><p class="lead">Quelques passages incontournables.</p><div class="grid">' +
      [4, 14, 16, 21, 24, 25].map(function (id) { return card(CH[id - 1]); }).join("") + "</div></section>";
  }

  function viewList(period, query) {
    var qn = query ? norm(query) : "";
    var list = CH.filter(function (c) {
      if (period && c.period !== period) return false;
      if (!qn) return true;
      return norm(c.title + " " + c.sub + " " + c.paras.join(" ")).indexOf(qn) !== -1;
    });
    var chips = '<button class="chip" aria-pressed="' + (!period) + '" data-p="">Tous</button>' +
      PER.map(function (p) {
        return '<button class="chip" aria-pressed="' + (period === p.id) + '" data-p="' + p.id + '">' + p.icon + " " + esc(p.label) + "</button>";
      }).join("");
    var colist = qn && !period ? CO.concat(TH, RI).filter(function (c) { return norm(c.title + " " + c.sub + " " + c.paras.join(" ")).indexOf(qn) !== -1; }) : [];
    list = list.concat(colist);
    app.innerHTML = '<section class="block wrap"><h2>' + (qn ? "Résultats pour « " + esc(query) + " »" : "Tous les chapitres") + "</h2>" +
      '<p class="lead">' + list.length + (qn ? " résultat" : " chapitre") + (list.length > 1 ? "s" : "") + "</p>" +
      '<div class="chips">' + chips + "</div>" +
      (list.length ? '<div class="grid">' + list.map(card).join("") + "</div>" : '<p class="empty">Aucun chapitre ne correspond. Essayez un autre mot.</p>') + "</section>";
    Array.prototype.forEach.call(app.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () {
        var p = b.getAttribute("data-p");
        location.hash = p ? "#/chapitres/" + p : "#/chapitres";
      });
    });
  }

  function viewCompanions() {
    app.innerHTML = '<section class="block wrap"><h2>Les compagnons du Prophète ﷺ</h2><p class="lead">Trente portraits de compagnons et de compagnes. Chaque fiche se termine par un quiz.</p><div class="grid">' + CO.map(card).join("") + "</div></section>";
  }

  function viewThemes() {
    app.innerHTML = '<section class="block wrap"><h2>Famille et thèmes</h2><p class="lead">Seize fiches sur la famille du Prophète ﷺ, son caractère, la vie à Médine et quelques épisodes importants. Chaque fiche se termine par un quiz.</p><div class="grid">' + TH.map(card).join("") + "</div></section>";
  }

  function viewRites() {
    app.innerHTML = '<section class="block wrap"><h2>Rites et fêtes</h2><p class="lead">Huit fiches sur l\'appel à la prière, la qibla, le vendredi, le jeûne, la zakat, le pèlerinage, les deux fêtes et la prière du Prophète ﷺ. Chaque fiche se termine par un quiz.</p><div class="grid">' + RI.map(card).join("") + "</div></section>";
  }

  function viewTimeline() {
    var html = '<section class="block wrap"><h2>Chronologie</h2><p class="lead">Les grandes étapes, de 570 à 632.</p>';
    PER.forEach(function (p) {
      html += '<div class="tl-period">' + p.icon + " " + esc(p.label) + '</div><div class="timeline">' +
        CH.filter(function (c) { return c.period === p.id; }).map(function (c) {
          return '<div class="tl-item"><time>' + esc(c.date) + '</time><a href="#/chapitre/' + c.id + '"><h3>' + c.id + ". " + esc(c.title) + "</h3></a><span class=\"muted\">" + esc(c.sub) + "</span></div>";
        }).join("") + "</div>";
    });
    app.innerHTML = html + "</section>";
  }

  function viewChapter(id) {
    var kd = kindOf(id), K = KIND[kd], LIST = K.list, idx = id - K.off;
    var c = LIST[idx];
    if (!c) return viewList();
    var prev = LIST[idx - 1], next = LIST[idx + 1];
    var fs = parseFloat(store(true, KEY_FS)) || 1.1;
    app.innerHTML = '<div class="progress" id="bar"></div><article class="reader">' +
      '<div class="crumbs"><a href="#/">Accueil</a> › ' + (kd !== "ch" ? '<a href="' + K.back + '">' + K.crumb + "</a> › " + esc(c.title) : '<a href="#/chapitres/' + c.period + '">' + esc(periodLabel(c.period)) + "</a> › Chapitre " + c.id) + "</div>" +
      "<h1>" + esc(c.title) + '</h1><p class="sub">' + esc(c.sub) + "</p>" +
      '<div class="facts"><span>📅 ' + esc(c.date) + "</span><span>⏱ " + minutes(c) + " min de lecture</span><span>" + (kd !== "ch" ? K.fact + " " + (idx + 1) + " / " + LIST.length : "Chapitre " + c.id + " / " + CH.length) + "</span></div>" +
      '<div class="tools" role="group" aria-label="Taille du texte"><button id="fsm" aria-label="Réduire le texte">A−</button><button id="fsp" aria-label="Agrandir le texte">A+</button></div>' +
      (SPEECH ? '<div class="audio" role="group" aria-label="Lecture audio"><button class="btn gold" id="play">🔊 Écouter ce chapitre</button>' +
        '<button class="btn ghost" id="pause" disabled>⏸ Pause</button><button class="btn ghost" id="stop" disabled>⏹ Arrêter</button>' +
        '<label class="rate">Voix <select id="voice" aria-label="Choisir la voix"></select></label>' +
        '<label class="rate">Vitesse <select id="rate"><option value="0.8">0,8×</option><option value="0.9">0,9×</option><option value="1" selected>1×</option><option value="1.15">1,15×</option><option value="1.3">1,3×</option></select></label>' +
        '<label class="rate"><input type="checkbox" id="auto"> Enchaîner</label></div>' +
        '<p class="audio-note" id="audioNote"></p>' : '<p class="audio-note">La lecture audio n\'est pas disponible sur ce navigateur.</p>') +
      '<div class="prose" id="prose" style="--fs:' + fs + 'rem">' + c.paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      '<div class="quiz-cta"><div><b>🎯 Testez vos connaissances</b><small>5 questions · points, étoiles et badges à gagner</small></div><a class="btn gold" href="#/quiz/' + id + '">Passer le quiz</a></div>' +
      '<button class="btn ghost mark-read" id="mark">' + (isRead(id) ? "✓ Marqué comme lu" : "Marquer comme lu") + "</button>" +
      '<nav class="pager" aria-label="Chapitres">' +
      (prev ? '<a class="btn ghost" href="' + hrefOf(prev.id) + '">← <span><small>Précédent</small>' + esc(prev.title) + "</span></a>" : "<span></span>") +
      (next ? '<a class="btn gold" href="' + hrefOf(next.id) + '"><span><small>Suivant</small>' + esc(next.title) + "</span> →</a>" : '<a class="btn gold" href="' + K.back + '">' + K.end + "</a>") +
      "</nav></article>";

    var prose = document.getElementById("prose");
    function size(d) {
      fs = Math.min(1.6, Math.max(0.9, +(fs + d).toFixed(2)));
      prose.style.setProperty("--fs", fs + "rem");
      store(false, KEY_FS, String(fs));
    }
    document.getElementById("fsm").onclick = function () { size(-0.1); };
    document.getElementById("fsp").onclick = function () { size(0.1); };
    var mark = document.getElementById("mark");
    mark.onclick = function () {
      var on = !isRead(id);
      setRead(id, on);
      mark.textContent = on ? "✓ Marqué comme lu" : "Marquer comme lu";
    };
    var bar = document.getElementById("bar");
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 100;
      bar.style.width = pct + "%";
      if (pct > 92 && !isRead(id)) { setRead(id, true); mark.textContent = "✓ Marqué comme lu"; }
    }
    if (SPEECH) SiraAudio.setup(c, next, hrefOf);
    window.removeEventListener("scroll", window._siraScroll || function () {});
    window._siraScroll = onScroll;
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Routeur ---------- */
  function route() {
    var fromAudio = /\?audio=1/.test(location.hash);
    if (!fromAudio) stopSpeech();
    SiraQuiz.stop();
    window.removeEventListener("scroll", window._siraScroll || function () {});
    var h = location.hash.replace(/\?audio=1/, "").replace(/^#\/?/, "").split("/");
    var page = h[0] || "";
    var nav = page === "lieux" ? "pl" : page === "rites" || page === "rite" ? "ri" : page === "compagnons" || page === "compagnon" ? "co" : page === "themes" || page === "theme" ? "th" : page === "chapitres" ? "list" : page === "chronologie" ? "timeline" : page === "" ? "home" : "";
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      a.classList.toggle("on", a.getAttribute("data-nav") === nav);
    });
    if (page === "chapitre") viewChapter(parseInt(h[1], 10));
    else if (page === "compagnon") viewChapter(parseInt(h[1], 10));
    else if (page === "compagnons") viewCompanions();
    else if (page === "theme") viewChapter(parseInt(h[1], 10));
    else if (page === "themes") viewThemes();
    else if (page === "rite") viewChapter(parseInt(h[1], 10));
    else if (page === "rites") viewRites();
    else if (page === "lieux") SiraPlaces.view(h[1] || "");
    else if (page === "quiz") SiraQuiz.view(parseInt(h[1], 10));
    else if (page === "recompenses") SiraQuiz.rewardsView();
    else if (page === "chapitres") viewList(h[1] || "", "");
    else if (page === "chronologie") viewTimeline();
    else if (page === "recherche") viewList("", decodeURIComponent(h.slice(1).join("/")));
    else viewHome();
    SiraQuiz.updateTrophy();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    var cur = page === "chapitre" ? CH[parseInt(h[1], 10) - 1] : page === "compagnon" ? CO[parseInt(h[1], 10) - 101] : page === "theme" ? TH[parseInt(h[1], 10) - 201] : page === "rite" ? RI[parseInt(h[1], 10) - 301] : null;
    document.title = cur
      ? cur.title + " — Le Monde de la Sira"
      : "Le Monde de la Sira — La vie du Prophète ﷺ en 25 récits";
  }

  var t;
  qInput.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var v = qInput.value.trim();
      location.hash = v ? "#/recherche/" + encodeURIComponent(v) : "#/chapitres";
    }, 250);
  });
  document.getElementById("tickerClose").onclick = function () {
    document.getElementById("ticker").classList.add("hidden");
  };
  window.addEventListener("hashchange", route);
  route();
})();
