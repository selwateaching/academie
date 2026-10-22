/* QCM par chapitre : progression, chronomètre, points, étoiles, niveaux et badges. */
(function () {
  "use strict";
  var KEY = "sira-fr:quiz", SECONDS = 20, BASE = 100, BONUS = 50;
  var LEVELS = [
    { min: 0, name: "Curieux" }, { min: 500, name: "Lecteur" }, { min: 1500, name: "Étudiant" },
    { min: 3000, name: "Chercheur" }, { min: 5000, name: "Savant" }, { min: 7500, name: "Gardien de la Sira" }
  ];
  var timer = null;
  function itemOf(id) { return id >= 100 ? window.COMPANIONS[id - 101] : window.CHAPTERS[id - 1]; }
  function nextOf(id) { return id >= 100 ? window.COMPANIONS[id - 100] : window.CHAPTERS[id]; }
  function hrefOf(id) { return (id >= 100 ? "#/compagnon/" : "#/chapitre/") + id; }
  function allItems() { return window.CHAPTERS.concat(window.COMPANIONS || []); }

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function starsFor(score, total) { return score === total ? 3 : score >= total - 1 ? 2 : score >= Math.ceil(total * 0.6) ? 1 : 0; }
  function starStr(n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); }

  function totalXp() { var s = load(), t = 0; for (var k in s) t += s[k].pts || 0; return t; }
  function levelInfo(xp) {
    var i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
    var next = LEVELS[i + 1];
    return { index: i, name: LEVELS[i].name, next: next || null, pct: next ? Math.round(((xp - LEVELS[i].min) / (next.min - LEVELS[i].min)) * 100) : 100 };
  }
  function badges() {
    var s = load(), ch = window.CHAPTERS, ids = Object.keys(s), out = [];
    function done(id) { return s[id] && s[id].stars >= 1; }
    out.push({ icon: "🌱", name: "Premier pas", desc: "Réussir un premier quiz", ok: ids.some(done) });
    out.push({ icon: "🎯", name: "Sans faute", desc: "Obtenir 3 étoiles sur un chapitre", ok: ids.some(function (k) { return s[k].stars === 3; }) });
    out.push({ icon: "⚡", name: "Éclair", desc: "Dépasser 700 points sur un chapitre", ok: ids.some(function (k) { return s[k].pts >= 700; }) });
    (window.PERIODS || []).forEach(function (p) {
      var list = ch.filter(function (c) { return c.period === p.id; });
      out.push({ icon: p.icon, name: p.label, desc: "Réussir tous les quiz de cette période", ok: list.every(function (c) { return done(c.id); }) });
    });
    out.push({ icon: "👥", name: "Compagnon", desc: "Réussir les 15 quiz sur les compagnons", ok: (window.COMPANIONS || []).every(function (c) { return done(c.id); }) });
    out.push({ icon: "🏆", name: "Gardien de la Sira", desc: "Réussir les 25 quiz", ok: ch.every(function (c) { return done(c.id); }) });
    return out;
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function app() { return document.getElementById("app"); }

  function view(id) {
    stop();
    var ch = itemOf(id), qs = window.QUIZ && window.QUIZ[id];
    if (!ch || !qs) { location.hash = "#/chapitres"; return; }
    var order = shuffle(qs), i = 0, score = 0, pts = 0, left = SECONDS, locked = false;

    function render() {
      locked = false; left = SECONDS;
      var q = order[i], opts = shuffle(q.slice(1));
      var pct = Math.round((i / order.length) * 100);
      app().innerHTML = '<div class="quiz wrap"><div class="q-top"><span>Question <b>' + (i + 1) + "</b> sur " + order.length + "</span><span class=\"q-pts\">" + pts + " pts</span></div>" +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="q-time"><span><b id="qt">' + SECONDS + '</b> s</span><span class="muted">⚡ Plus vite = plus de points</span></div><div class="bar thin"><i id="tb" style="width:100%"></i></div>' +
        '<div class="q-card"><div class="q-head"><span class="q-num">' + (i + 1) + '</span><div><small>' + esc((id >= 100 ? "Compagnon" : "Chapitre " + ch.id) + " · " + ch.title) + "</small><h2>" + esc(q[0]) + "</h2></div></div>" +
        '<div class="q-opts" role="group" aria-label="Réponses">' + opts.map(function (o) { return '<button class="opt" data-v="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + "</div>" +
        '<button class="skip" id="skip">⏭ Je ne sais pas (passer)</button><p class="q-fb" id="fb" aria-live="polite"></p></div></div>';
      Array.prototype.forEach.call(app().querySelectorAll(".opt"), function (b) { b.onclick = function () { answer(b.getAttribute("data-v"), b); }; });
      document.getElementById("skip").onclick = function () { answer(null); };
      stop();
      timer = setInterval(function () {
        left -= 0.1;
        var t = document.getElementById("qt"), tb = document.getElementById("tb");
        if (!t) { stop(); return; }
        t.textContent = Math.max(0, Math.ceil(left));
        tb.style.width = Math.max(0, (left / SECONDS) * 100) + "%";
        if (left <= 0) answer(null, null, true);
      }, 100);
    }

    function answer(v, btn, timeout) {
      if (locked) return; locked = true; stop();
      var q = order[i], ok = v === q[1], fb = document.getElementById("fb");
      Array.prototype.forEach.call(app().querySelectorAll(".opt"), function (b) {
        b.disabled = true;
        if (b.getAttribute("data-v") === q[1]) b.classList.add("good");
      });
      document.getElementById("skip").disabled = true;
      if (ok) {
        var gain = BASE + Math.round(BONUS * Math.max(0, left) / SECONDS);
        score++; pts += gain; fb.className = "q-fb good"; fb.textContent = "✓ Bonne réponse ! +" + gain + " points";
      } else {
        if (btn) btn.classList.add("bad");
        fb.className = "q-fb bad"; fb.textContent = timeout ? "⏱ Temps écoulé. La bonne réponse est surlignée." : v === null ? "La bonne réponse est surlignée." : "✗ Ce n'est pas la bonne réponse.";
      }
      setTimeout(function () { i++; if (i < order.length) render(); else finish(); }, ok ? 1100 : 1800);
    }

    function finish() {
      stop();
      var s = load(), prev = s[id] || { stars: 0, pts: 0, best: 0 }, stars = starsFor(score, order.length);
      var xpBefore = totalXp(), badgesBefore = badges().filter(function (b) { return b.ok; }).map(function (b) { return b.name; });
      var improved = pts > prev.pts;
      s[id] = { stars: Math.max(prev.stars, stars), pts: Math.max(prev.pts, pts), best: Math.max(prev.best, score) };
      save(s);
      var xpAfter = totalXp(), lvB = levelInfo(xpBefore), lvA = levelInfo(xpAfter);
      var newB = badges().filter(function (b) { return b.ok && badgesBefore.indexOf(b.name) === -1; });
      var next = nextOf(id);
      var msg = stars === 3 ? "Parfait, aucune erreur !" : stars >= 1 ? "Bien joué !" : "Relisez le chapitre et réessayez.";
      app().innerHTML = '<div class="quiz wrap"><div class="q-card result"><div class="stars big" aria-label="' + stars + ' étoiles sur 3">' + starStr(stars) + "</div>" +
        "<h2>" + msg + "</h2><p class=\"lead\">" + score + " bonne" + (score > 1 ? "s" : "") + " réponse" + (score > 1 ? "s" : "") + " sur " + order.length + " · <b>" + pts + " points</b></p>" +
        (improved && prev.pts ? '<p class="q-fb good">Nouveau record personnel !</p>' : !improved && prev.pts ? '<p class="muted">Votre meilleur score reste de ' + prev.pts + " points.</p>" : "") +
        (lvA.index > lvB.index ? '<p class="reward">🎉 Nouveau niveau : <b>' + esc(lvA.name) + "</b></p>" : "") +
        newB.map(function (b) { return '<p class="reward">' + b.icon + " Badge débloqué : <b>" + esc(b.name) + "</b></p>"; }).join("") +
        '<div class="cta c"><button class="btn gold" id="again">↻ Rejouer</button>' +
        (next ? '<a class="btn ghost" href="' + hrefOf(next.id) + '">' + (id >= 100 ? "Portrait suivant" : "Chapitre suivant") + " →</a>" : "") + '<a class="btn ghost" href="' + hrefOf(id) + '">Relire</a>' +
        '<a class="btn ghost" href="#/recompenses">🏆 Mes récompenses</a></div></div></div>';
      document.getElementById("again").onclick = function () { view(id); };
      updateTrophy();
    }
    render();
  }

  function rewardsHtml(compact) {
    var xp = totalXp(), lv = levelInfo(xp), s = load(), done = Object.keys(s).filter(function (k) { return s[k].stars >= 1; }).length;
    var stars = Object.keys(s).reduce(function (a, k) { return a + (s[k].stars || 0); }, 0);
    var h = '<div class="rw"><div class="rw-lv"><span class="rw-icon">🏆</span><div><small>Niveau ' + (lv.index + 1) + '</small><b>' + esc(lv.name) + '</b></div><div class="rw-xp"><b>' + xp + "</b> pts</div></div>" +
      '<div class="bar"><i style="width:' + lv.pct + '%"></i></div><p class="muted small">' + (lv.next ? "Encore " + (lv.next.min - xp) + " points pour devenir « " + esc(lv.next.name) + " »" : "Niveau maximum atteint !") + "</p>" +
      '<div class="rw-stats"><span>⭐ ' + stars + " / " + allItems().length * 3 + " étoiles</span><span>✓ " + done + " / " + allItems().length + " quiz réussis</span></div>";
    if (!compact) h += '<h3>Badges</h3><div class="badges">' + badges().map(function (b) {
      return '<div class="badge-c' + (b.ok ? " on" : "") + '"><span>' + b.icon + "</span><b>" + esc(b.name) + "</b><small>" + esc(b.desc) + "</small></div>";
    }).join("") + "</div>";
    return h + "</div>";
  }
  function rewardsView() {
    stop();
    var ch = allItems(), s = load();
    app().innerHTML = '<section class="block wrap"><h2>Mes récompenses</h2><p class="lead">Répondez aux quiz pour gagner des points, des étoiles et des badges.</p>' + rewardsHtml(false) +
      "<h3>Étoiles par chapitre</h3><div class=\"grid\">" + ch.map(function (c) {
        var r = s[c.id];
        return '<a class="card" href="#/quiz/' + c.id + '"><span class="num">' + (c.id >= 100 ? "👤" : String(c.id).padStart(2, "0")) + "</span><h3>" + esc(c.title) + '</h3><div class="stars">' + starStr(r ? r.stars : 0) + '</div><div class="meta"><span>' + (r ? r.pts + " pts" : "Pas encore joué") + "</span><span>Jouer →</span></div></a>";
      }).join("") + "</div></section>";
  }
  function updateTrophy() {
    var el = document.getElementById("trophy"); if (!el) return;
    var xp = totalXp(), lv = levelInfo(xp);
    el.innerHTML = "🏆 <b>" + xp + "</b><small>" + esc(lv.name) + "</small>";
  }

  window.SiraQuiz = {
    view: view, stop: stop, rewardsView: rewardsView, rewardsHtml: rewardsHtml, updateTrophy: updateTrophy,
    stars: function (id) { var r = load()[id]; return r ? r.stars : null; },
    has: function (id) { return !!(window.QUIZ && window.QUIZ[id]); },
    starStr: starStr
  };
})();
