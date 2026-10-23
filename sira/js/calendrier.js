/* Calendrier hégirien (Umm al-Qura via Intl, repli arithmétique) avec les fêtes et les jours de jeûne recommandés.
   Les dates dépendent de l'observation de la lune : elles peuvent varier d'un jour selon les pays. */
(function () {
  "use strict";
  var EN = window.LANG === "en", AR = window.LANG === "ar", DAY = 86400000;
  var MONTHS = AR ? ["المحرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"] : EN ? ["Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani", "Jumada al-ula", "Jumada al-thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"]
    : ["Mouharram", "Safar", "Rabi' al-awwal", "Rabi' ath-thani", "Joumada al-oula", "Joumada ath-thania", "Rajab", "Chaabane", "Ramadan", "Chawwal", "Dhou al-qi'da", "Dhou al-hijja"];
  var WD = AR ? ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"] : EN ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  var EV = [ /* mois, jour, fr, en, lien, type (f = fête, s = date marquante) */
    [1, 1, "Nouvel an hégirien", "Islamic New Year", "#/chapitre/14", "s"],
    [1, 10, "Achoura (jeûne recommandé, avec le 9 ou le 11)", "Ashura (recommended fast, with the 9th or 11th)", "#/lexique/achoura", "s"],
    [3, 12, "Mawlid (naissance du Prophète ﷺ)", "Mawlid (birth of the Prophet ﷺ)", "#/lexique/mawlid", "s"],
    [7, 27, "Isra et Mi'raj (voyage nocturne)", "Isra and Mi'raj (Night Journey)", "#/chapitre/12", "s"],
    [9, 1, "Début du Ramadan", "Start of Ramadan", "#/rite/304", "f"],
    [9, 27, "Nuit du Destin (souvent attendue cette nuit-là ; une des nuits impaires des dix dernières)", "Night of Power (often sought on this night; one of the odd nights of the last ten)", "#/lexique/qadr", "s"],
    [10, 1, "Aïd al-Fitr", "Eid al-Fitr", "#/rite/307", "f"],
    [12, 8, "Début des rites du pèlerinage (Tarwiya)", "Start of the Hajj rites (Tarwiya)", "#/rite/306", "s"],
    [12, 9, "Jour d'Arafat (jeûne recommandé pour qui n'est pas en pèlerinage)", "Day of Arafat (recommended fast for those not on pilgrimage)", "#/lexique/arafat", "s"],
    [12, 10, "Aïd al-Adha", "Eid al-Adha", "#/rite/307", "f"],
    [12, 11, "Jours de tachriq (11 à 13)", "Days of Tashriq (11th to 13th)", "#/rite/306", "s"]
  ];
  var EVAR = ["رأس السنة الهجرية", "عاشوراء (يُستحب صيامه مع التاسع أو الحادي عشر)", "المولد النبوي (مولد النبي ﷺ)", "الإسراء والمعراج", "بداية شهر رمضان", "ليلة القدر (يُرجى أن تكون ليلة السابع والعشرين؛ وهي في الوتر من العشر الأواخر)", "عيد الفطر", "بداية مناسك الحج (يوم التروية)", "يوم عرفة (يُستحب صيامه لغير الحاج)", "عيد الأضحى", "أيام التشريق (11 إلى 13)"];
  var XAR = { h: "التقويم الهجري والأعياد", lead: "التقويم القمري الإسلامي، مع الأعياد وأيام الصيام المستحبة. اضغط على السهمين للانتقال بين الأشهر.",
      today: "اليوم", up: "المناسبات القادمة", in: "بعد", days: "يوماً", tdy: "اليوم", tom: "غداً", leg: "دليل الألوان", f: "عيد", s: "مناسبة", w: "الأيام البيض (13–15): صيام مستحب", mt: "الاثنين والخميس: صيام مستحب", prev: "الشهر السابق", next: "الشهر التالي",
      note: "التواريخ وفق تقويم أم القرى. يتوقف بدء الشهر على رؤية الهلال وقد يختلف بيوم بين البلدان: اتبع إعلان مسجدك.", month: "هذا الشهر", none: "لا توجد أعياد هذا الشهر." };
  var X = AR ? XAR : EN ? { h: "Hijri calendar and festivals", lead: "The Muslim lunar calendar, with the festivals and the days of recommended fasting. Tap the arrows to move between months.",
      today: "Today", up: "Coming up", in: "in", days: "days", tdy: "today", tom: "tomorrow", leg: "Legend", f: "Festival", s: "Notable date", w: "White days (13–15): recommended fast", mt: "Monday and Thursday: recommended fast", prev: "Previous month", next: "Next month",
      note: "Dates follow the Umm al-Qura calendar. The start of a month depends on the sighting of the moon and may differ by a day depending on the country: follow your mosque's announcement.", month: "This month", none: "No festival this month." }
    : { h: "Calendrier hégirien et fêtes", lead: "Le calendrier lunaire musulman, avec les fêtes et les jours de jeûne recommandés. Touchez les flèches pour changer de mois.",
      today: "Aujourd'hui", up: "À venir", in: "dans", days: "jours", tdy: "aujourd'hui", tom: "demain", leg: "Légende", f: "Fête", s: "Date marquante", w: "Jours blancs (13-15) : jeûne recommandé", mt: "Lundi et jeudi : jeûne recommandé", prev: "Mois précédent", next: "Mois suivant",
      note: "Les dates suivent le calendrier Umm al-Qura. Le début d'un mois dépend de l'observation de la lune et peut différer d'un jour selon les pays : suivez l'annonce de votre mosquée.", month: "Ce mois-ci", none: "Pas de fête ce mois-ci." };
  function evName(e) { return AR ? EVAR[EV.indexOf(e)] : EN ? e[3] : e[2]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var fmt = null;
  try { fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }); } catch (e) {}
  function tabular(t) { /* repli : calendrier hégirien arithmétique */
    var jd = Math.floor(t / DAY) + 2440588, l = jd - 1948440 + 10632, n = Math.floor((l - 1) / 10631); l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor(50 * l / 17719) + Math.floor(l / 5670) * Math.floor(43 * l / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
    var m = Math.floor(24 * l / 709), d = l - Math.floor(709 * m / 24); return { y: 30 * n + j - 30, m: m, d: d };
  }
  function hijri(t) { /* t : date UTC à midi */
    if (fmt) { try { var p = {}; fmt.formatToParts(new Date(t)).forEach(function (x) { p[x.type] = parseInt(x.value, 10); }); if (p.year > 1000 && p.month && p.day) return { y: p.year, m: p.month, d: p.day }; } catch (e) {} }
    return tabular(t);
  }
  function noon(d) { return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12); }
  function firstOfMonth(t) { var h = hijri(t); return t - (h.d - 1) * DAY; }
  function addMonth(t, k) { /* t = 1er du mois ; k = ±1 */
    if (k > 0) { var u = t + 28 * DAY; while (hijri(u).d !== 1) u += DAY; return u; }
    var v = t - 28 * DAY; return firstOfMonth(v);
  }
  function evOf(h) { return EV.filter(function (e) { return e[0] === h.m && (e[1] === h.d || (h.m === 12 && e[1] === 11 && (h.d === 12 || h.d === 13) )); }); }
  function gfmt(t, o) { return new Intl.DateTimeFormat(AR ? "ar-u-nu-latn" : EN ? "en-GB" : "fr-FR", Object.assign({ timeZone: "UTC" }, o)).format(new Date(t)); }

  var cur = null;
  function view() {
    var app = document.getElementById("app"), now = new Date(), todayT = noon(now);
    if (cur === null) cur = firstOfMonth(todayT);
    var h0 = hijri(cur), len = 0; while (hijri(cur + len * DAY).m === h0.m && len < 31) len++;
    var lead = (new Date(cur).getUTCDay() + 6) % 7, cells = "";
    for (var i = 0; i < lead; i++) cells += '<div class="hc empty"></div>';
    var list = "";
    for (var d = 1; d <= len; d++) {
      var t = cur + (d - 1) * DAY, g = new Date(t), wd = g.getUTCDay(), ev = evOf({ m: h0.m, d: d }), cls = "hc";
      if (t === todayT) cls += " today"; if (wd === 5) cls += " fri"; if (ev.length) cls += ev.some(function (e) { return e[5] === "f"; }) ? " fest" : " mark";
      var dots = (d >= 13 && d <= 15 ? '<i class="hd w" title="' + esc(X.w) + '"></i>' : "") + ((wd === 1 || wd === 4) && !ev.length ? '<i class="hd mt" title="' + esc(X.mt) + '"></i>' : "");
      cells += '<div class="' + cls + '"><b>' + d + "</b><small>" + g.getUTCDate() + (g.getUTCDate() === 1 ? "/" + (g.getUTCMonth() + 1) : "") + "</small>" + dots + (ev.length ? '<span class="he">' + escevName(ev[0]).split(" (")[0] + "</span>" : "") + "</div>";
      ev.forEach(function (e) { list += '<li><b>' + d + " " + MONTHS[h0.m - 1] + "</b> · " + gfmt(t, { day: "numeric", month: "long" }) + " — " + (e[4] ? '<a href="' + e[4] + '">' + esc(evName(e)) + "</a>" : esc(evName(e))) + "</li>"; });
    }
    /* à venir : 6 prochains événements */
    var up = [];
    for (var k = 0; k < 420 && up.length < 6; k++) { var tt = todayT + k * DAY, hh = hijri(tt); evOf(hh).forEach(function (e) { if (e[1] === hh.d && up.length < 6) up.push({ t: tt, h: hh, e: e, k: k }); }); }
    app.innerHTML = '<section class="block wrap cal"><h2>' + X.h + '</h2><p class="lead">' + X.lead + "</p>" +
      '<div class="cal-head"><button class="btn ghost" id="calPrev" aria-label="' + X.prev + '">' + (AR ? "›" : "‹") + '</button><div class="cal-title"><b>' + MONTHS[h0.m - 1] + " " + h0.y + '</b><small>' + gfmt(cur, { month: "long", year: "numeric" }) + " – " + gfmt(cur + (len - 1) * DAY, { month: "long", year: "numeric" }) +
      '</small></div><button class="btn ghost" id="calNext" aria-label="' + X.next + '">' + (AR ? "‹" : "›") + '</button><button class="btn ghost" id="calToday">' + X.today + "</button></div>" +
      '<div class="cal-grid">' + WD.map(function (w, i) { return '<div class="hw' + (i === 4 ? " fri" : "") + '">' + w + "</div>"; }).join("") + cells + "</div>" +
      '<p class="cal-leg muted small"><span class="lg fest"></span>' + X.f + ' <span class="lg mark"></span>' + X.s + ' <span class="lg dw"></span>' + X.w + ' <span class="lg dm"></span>' + X.mt + "</p>" +
      '<h3>' + X.month + '</h3><ul class="cal-list">' + (list || "<li class=\"muted\">" + X.none + "</li>") + "</ul>" +
      '<h3>' + X.up + '</h3><ul class="cal-list">' + up.map(function (u) { var n = u.k === 0 ? X.tdy : u.k === 1 ? X.tom : X.in + " " + u.k + " " + X.days; return "<li><b>" + gfmt(u.t, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "</b> · " + u.h.d + " " + MONTHS[u.h.m - 1] + " " + u.h.y + " — " + (u.e[4] ? '<a href="' + u.e[4] + '">' + esc(evName(u.e)) + "</a>" : esc(evName(u.e))) + ' <span class="muted">(' + n + ")</span></li>"; }).join("") + "</ul>" +
      '<p class="muted small">' + X.note + "</p></section>";
    document.getElementById("calPrev").onclick = function () { cur = addMonth(cur, -1); view(); };
    document.getElementById("calNext").onclick = function () { cur = addMonth(cur, 1); view(); };
    document.getElementById("calToday").onclick = function () { cur = firstOfMonth(noon(new Date())); view(); };
    document.title = X.h + " — " + L3("Le Monde de la Sirah", "The World of the Sirah", "عالم السيرة");
  }
  window.SiraCalendrier = { view: function () { cur = null; view(); }, hijri: hijri };
})();
