(function () {
  "use strict";
  var app = document.getElementById("app");
  var qInput = document.getElementById("q");
  var CH = window.CHAPTERS, PER = window.PERIODS, CO = window.COMPANIONS;
  function isCo(id) { return id >= 100; }
  function hrefOf(id) { return (isCo(id) ? "#/compagnon/" : "#/chapitre/") + id; }
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
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function periodLabel(id) {
    return PER.filter(function (p) { return p.id === id; })[0].label;
  }

  function card(c) {
    return '<a class="card' + (isRead(c.id) ? " done" : "") + '" href="' + hrefOf(c.id) + '">' +
      '<span class="num">' + (isCo(c.id) ? "👤" : String(c.id).padStart(2, "0")) + '</span>' +
      "<h3>" + esc(c.title) + "</h3><p>" + esc(c.sub) + "</p>" +
      '<div class="meta"><span>' + esc(c.date) + "</span><span>" + (SiraQuiz.stars(c.id) !== null ? '<span class="stars sm">' + SiraQuiz.starStr(SiraQuiz.stars(c.id)) + "</span> · " : "") + minutes(c) + " min</span></div></a>";
  }

  /* ---------- Audio (synthèse vocale du navigateur) ---------- */
  var SPEECH = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var AUTO_KEY = "sira-fr:auto", RATE_KEY = "sira-fr:rate";

  function frVoice() {
    var v = window.speechSynthesis.getVoices().filter(function (x) { return /^fr/i.test(x.lang); });
    if (!v.length) return null;
    // privilégier une voix de qualité (réseau / « naturelle ») puis fr-FR
    v.sort(function (a, b) {
      function sc(x) { return (/natural|online|google|premium|enhanced/i.test(x.name) ? 2 : 0) + (/fr[-_]FR/i.test(x.lang) ? 1 : 0); }
      return sc(b) - sc(a);
    });
    return v[0];
  }
  function stopSpeech() { if (SPEECH) { window.speechSynthesis.cancel(); window._siraSpeakId = (window._siraSpeakId || 0) + 1; } }

  function setupAudio(c, next) {
    var play = document.getElementById("play"), pause = document.getElementById("pause"), stop = document.getElementById("stop");
    var rate = document.getElementById("rate"), auto = document.getElementById("auto"), note = document.getElementById("audioNote");
    var paras = Array.prototype.slice.call(document.querySelectorAll("#prose p"));
    var texts = [c.title + ". " + c.sub + "."].concat(c.paras);
    var myId;
    rate.value = store(true, RATE_KEY) || "1";
    auto.checked = store(true, AUTO_KEY) === "1";
    rate.onchange = function () { store(false, RATE_KEY, rate.value); };
    auto.onchange = function () { store(false, AUTO_KEY, auto.checked ? "1" : "0"); };
    window.speechSynthesis.onvoiceschanged = function () { note.textContent = frVoice() ? "" : "Aucune voix française trouvée sur cet appareil."; };
    if (!frVoice() && window.speechSynthesis.getVoices().length) note.textContent = "Aucune voix française trouvée sur cet appareil : installez-en une dans les réglages de votre système.";

    function clear() { paras.forEach(function (p) { p.classList.remove("speaking"); }); }
    function ui(on) { play.disabled = on; pause.disabled = !on; stop.disabled = !on; pause.textContent = "⏸ Pause"; }
    function speak(i) {
      if (window._siraSpeakId !== myId) return;
      clear();
      if (i >= texts.length) {
        ui(false);
        if (auto.checked && next) location.hash = hrefOf(next.id) + "?audio=1";
        return;
      }
      if (i > 0) { paras[i - 1].classList.add("speaking"); paras[i - 1].scrollIntoView({ block: "center", behavior: "smooth" }); }
      var u = new SpeechSynthesisUtterance(texts[i]);
      var v = frVoice();
      u.lang = v ? v.lang : "fr-FR";
      if (v) u.voice = v;
      u.rate = parseFloat(rate.value) || 1;
      u.onend = function () { speak(i + 1); };
      u.onerror = function (e) { if (e.error !== "canceled" && e.error !== "interrupted") ui(false); };
      window.speechSynthesis.speak(u);
    }
    function start() {
      window.speechSynthesis.cancel();
      window._siraSpeakId = (window._siraSpeakId || 0) + 1;
      myId = window._siraSpeakId;
      ui(true);
      speak(0);
    }
    play.onclick = start;
    pause.onclick = function () {
      var ss = window.speechSynthesis;
      if (ss.paused) { ss.resume(); pause.textContent = "⏸ Pause"; } else { ss.pause(); pause.textContent = "▶ Reprendre"; }
    };
    stop.onclick = function () { stopSpeech(); clear(); ui(false); };
    if (/audio=1/.test(location.hash)) {
      history.replaceState(null, "", location.hash.replace(/\?audio=1/, ""));
      setTimeout(start, 300);
    }
  }

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
      '<div class="cover" aria-hidden="true"><div><div class="tag">Collection Sira</div><h2>La vie du Prophète</h2></div>' +
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
      '<section class="block wrap"><h2>Les compagnons du Prophète</h2><p class="lead">Quinze portraits : ceux qui ont marché, combattu et prié à ses côtés.</p><div class="grid">' +
      [101, 102, 105, 113].map(function (id) { return card(CO[id - 101]); }).join("") + '</div><p><a class="btn ghost" href="#/compagnons">Voir tous les compagnons</a></p></section>' +
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
    var colist = qn && !period ? CO.filter(function (c) { return norm(c.title + " " + c.sub + " " + c.paras.join(" ")).indexOf(qn) !== -1; }) : [];
    list = list.concat(colist);
    app.innerHTML = '<section class="block wrap"><h2>' + (qn ? "Résultats pour « " + esc(query) + " »" : "Tous les chapitres") + "</h2>" +
      '<p class="lead">' + list.length + " chapitre" + (list.length > 1 ? "s" : "") + "</p>" +
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
    app.innerHTML = '<section class="block wrap"><h2>Les compagnons du Prophète</h2><p class="lead">Quinze portraits de compagnons et de compagnes. Chaque fiche se termine par un quiz.</p><div class="grid">' + CO.map(card).join("") + "</div></section>";
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
    var isC = isCo(id), LIST = isC ? CO : CH, idx = isC ? id - 101 : id - 1;
    var c = LIST[idx];
    if (!c) return viewList();
    var prev = LIST[idx - 1], next = LIST[idx + 1];
    var fs = parseFloat(store(true, KEY_FS)) || 1.1;
    app.innerHTML = '<div class="progress" id="bar"></div><article class="reader">' +
      '<div class="crumbs"><a href="#/">Accueil</a> › ' + (isC ? '<a href="#/compagnons">Compagnons</a> › ' + esc(c.title) : '<a href="#/chapitres/' + c.period + '">' + esc(periodLabel(c.period)) + "</a> › Chapitre " + c.id) + "</div>" +
      "<h1>" + esc(c.title) + '</h1><p class="sub">' + esc(c.sub) + "</p>" +
      '<div class="facts"><span>📅 ' + esc(c.date) + "</span><span>⏱ " + minutes(c) + " min de lecture</span><span>" + (isC ? "Portrait " + (idx + 1) + " / " + CO.length : "Chapitre " + c.id + " / " + CH.length) + "</span></div>" +
      '<div class="tools" role="group" aria-label="Taille du texte"><button id="fsm" aria-label="Réduire le texte">A−</button><button id="fsp" aria-label="Agrandir le texte">A+</button></div>' +
      (SPEECH ? '<div class="audio" role="group" aria-label="Lecture audio"><button class="btn gold" id="play">🔊 Écouter ce chapitre</button>' +
        '<button class="btn ghost" id="pause" disabled>⏸ Pause</button><button class="btn ghost" id="stop" disabled>⏹ Arrêter</button>' +
        '<label class="rate">Vitesse <select id="rate"><option value="0.8">0,8×</option><option value="0.9">0,9×</option><option value="1" selected>1×</option><option value="1.15">1,15×</option><option value="1.3">1,3×</option></select></label>' +
        '<label class="rate"><input type="checkbox" id="auto"> Enchaîner</label></div>' +
        '<p class="audio-note" id="audioNote"></p>' : '<p class="audio-note">La lecture audio n\'est pas disponible sur ce navigateur.</p>') +
      '<div class="prose" id="prose" style="--fs:' + fs + 'rem">' + c.paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      '<div class="quiz-cta"><div><b>🎯 Testez vos connaissances</b><small>5 questions · points, étoiles et badges à gagner</small></div><a class="btn gold" href="#/quiz/' + id + '">Passer le quiz</a></div>' +
      '<button class="btn ghost mark-read" id="mark">' + (isRead(id) ? "✓ Marqué comme lu" : "Marquer comme lu") + "</button>" +
      '<nav class="pager" aria-label="Chapitres">' +
      (prev ? '<a class="btn ghost" href="' + hrefOf(prev.id) + '">← <span><small>Précédent</small>' + esc(prev.title) + "</span></a>" : "<span></span>") +
      (next ? '<a class="btn gold" href="' + hrefOf(next.id) + '"><span><small>Suivant</small>' + esc(next.title) + "</span> →</a>" : '<a class="btn gold" href="' + (isC ? "#/compagnons" : "#/chapitres") + '">' + (isC ? "Tous les compagnons" : "Fin du récit — tous les chapitres") + "</a>") +
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
    if (SPEECH) setupAudio(c, next);
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
    var nav = page === "compagnons" || page === "compagnon" ? "co" : page === "chapitres" ? "list" : page === "chronologie" ? "timeline" : page === "" ? "home" : "";
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      a.classList.toggle("on", a.getAttribute("data-nav") === nav);
    });
    if (page === "chapitre") viewChapter(parseInt(h[1], 10));
    else if (page === "compagnon") viewChapter(parseInt(h[1], 10));
    else if (page === "compagnons") viewCompanions();
    else if (page === "quiz") SiraQuiz.view(parseInt(h[1], 10));
    else if (page === "recompenses") SiraQuiz.rewardsView();
    else if (page === "chapitres") viewList(h[1] || "", "");
    else if (page === "chronologie") viewTimeline();
    else if (page === "recherche") viewList("", decodeURIComponent(h.slice(1).join("/")));
    else viewHome();
    SiraQuiz.updateTrophy();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    var cur = page === "chapitre" ? CH[parseInt(h[1], 10) - 1] : page === "compagnon" ? CO[parseInt(h[1], 10) - 101] : null;
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
