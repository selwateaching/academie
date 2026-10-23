/* Avis des visiteurs : formulaire Google Forms court (30 secondes). */
(function () {
  "use strict";
  var URL = "https://forms.gle/SLKd5tYSSZFi61Fu8", EN = window.LANG === "en", AR = window.LANG === "ar";
  var L = AR ? {
    h: "رأيك يهمّنا", lead: "هذا الموقع هدية وصدقة جارية، مجاني وبلا إعلانات. أخبرنا برأيك: يستغرق الأمر 30 ثانية ويساعدنا على تحسينه للجميع.",
    btn: "⭐ أريد أن أعطي رأيي", li: ["قيّم الموقع بنقرة واحدة", "قل لنا ما الذي أعجبك أكثر", "اقترح ما يجب تحسينه أو إضافته"], note: "يُفتح النموذج في تبويب جديد. لا حاجة إلى حساب.",
    ctaT: "هل أعجبك هذا الموقع؟", ctaS: "شاركنا رأيك في 30 ثانية", dua: "جزاكم الله خيراً."
  } : EN ? {
    h: "Your feedback", lead: "This site is offered as a sadaqa jariya (ongoing charity), for free and without advertising. Tell us what you think: it takes 30 seconds and helps us improve it for everyone.",
    btn: "⭐ Give my feedback", li: ["Rate the site in one tap", "Tell us what you liked most", "Suggest what to improve or add"], note: "The form opens in a new tab. No account is needed.",
    ctaT: "Did you enjoy this site?", ctaS: "Give your feedback in 30 seconds", dua: "May God reward you."
  } : {
    h: "Votre avis", lead: "Ce site est offert comme sadaqa jariya (aumône continue), gratuitement et sans publicité. Dites-nous ce que vous en pensez : cela prend 30 secondes et nous aide à l'améliorer pour tous.",
    btn: "⭐ Donner mon avis", li: ["Notez le site en un clic", "Dites ce que vous avez le plus aimé", "Proposez ce qu'il faut améliorer ou ajouter"], note: "Le formulaire s'ouvre dans un nouvel onglet. Aucun compte n'est nécessaire.",
    ctaT: "Ce site vous a plu ?", ctaS: "Donnez votre avis en 30 secondes", dua: "Qu'Allah vous récompense."
  };
  /* Avis publiés : onglet « Public » du tableur Google publié en CSV (colonnes : note, commentaire, profil).
     Renseigner l'adresse dans js/avis-config.js ; tant qu'elle est vide, rien ne s'affiche. */
  var CSV = window.SIRA_AVIS_CSV || "";
  function parseCSV(t) {
    var rows = [], row = [], f = "", q = false, i, c;
    for (i = 0; i < t.length; i++) {
      c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
      else f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  var cache = null, TTL = 5 * 60 * 1000;
  var PROFIL_AR = { "un enfant": "طفل", "un adolescent": "مراهق", "un parent ou un enseignant": "ولي أمر أو معلّم", "un adulte": "بالغ" };
  function profil(w) { /* « Un adolescent / A teenager » -> la partie dans la langue du site */
    var a = String(w || "").split(/\s*\/\s*/), fr = (a[0] || "").trim(), en = (a[1] || a[0] || "").trim();
    return window.LANG === "ar" ? (PROFIL_AR[fr.toLowerCase()] || en) : window.LANG === "en" ? en : fr;
  }
  function reviews(cb) {
    if (!CSV) return cb([]);
    if (cache) return cb(cache);
    try { var s = JSON.parse(sessionStorage.getItem("sira-fr:avis2") || "null"); if (s && s.t && Date.now() - s.t < TTL && s.d && s.d.length) { cache = s.d; return cb(cache); } } catch (e) {}
    fetch(CSV + (CSV.indexOf("?") > -1 ? "&" : "?") + "t=" + Math.floor(Date.now() / 60000), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
      var out = parseCSV(t).filter(function (r) { return r.length >= 2 && /^[1-5]\s*$/.test((r[0] || "").trim()) && (r[1] || "").trim().length > 2; })
        .map(function (r) { return { n: parseInt(r[0], 10), c: r[1].trim().slice(0, 400), w: profil(r[2]).slice(0, 60) }; });
      if (out.length) { cache = out; try { sessionStorage.setItem("sira-fr:avis2", JSON.stringify({ t: Date.now(), d: out })); } catch (e) {} }
      cb(out);
    }).catch(function () { cb([]); });
  }
  function stars(n) { return new Array(n + 1).join("★") + new Array(6 - n).join("☆"); }
  function mount() { /* remplit les éléments [data-avis="max"] présents dans la page */
    var els = document.querySelectorAll("[data-avis]"); if (!els.length || !CSV) return;
    reviews(function (list) {
      if (!list.length) return;
      Array.prototype.forEach.call(els, function (el) {
        var max = parseInt(el.getAttribute("data-avis"), 10) || 6;
        el.innerHTML = '<h3 class="avis-h">💬 ' + L3("Ils en parlent", "What people say", "ماذا قالوا عنّا") + '</h3><div class="avis-grid">' + list.slice(0, max).map(function (r) {
          return '<figure class="avis-card"><div class="avis-st" aria-label="' + r.n + '/5">' + stars(r.n) + "</div><blockquote>" + esc(r.c) + "</blockquote>" + (r.w ? "<figcaption>" + esc(r.w) + "</figcaption>" : "") + "</figure>";
        }).join("") + "</div>";
      });
    });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function link(cls) { return '<a class="btn gold ' + (cls || "") + '" href="' + URL + '" target="_blank" rel="noopener">' + L.btn + "</a>"; }
  function view() {
    document.getElementById("app").innerHTML = '<section class="block wrap avis"><h2>' + L.h + '</h2><p class="lead">' + L.lead + "</p><ul class=\"avis-li\">" +
      L.li.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul><p>" + link() + '</p><p class="muted small">' + L.note + "</p><p class=\"avis-dua\">" + L.dua + "</p><div data-avis=\"12\" class=\"avis-pub\"></div></section>";
    document.title = L.h + " — " + L3("Le Monde de la Sirah", "The World of the Sirah", "عالم السيرة");
  }
  function cta() { return '<div class="quiz-cta avis-cta"><div><b>💛 ' + L.ctaT + "</b><small>" + L.ctaS + "</small></div>" + link() + "</div>"; }
  window.SiraAvis = { view: view, cta: cta, mount: mount, url: URL };
})();
