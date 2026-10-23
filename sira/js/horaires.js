/* Horaires de prière et direction de la qibla selon la position. Calcul astronomique local (aucun service externe,
   aucune clé) : la position reste sur l'appareil. Les horaires sont indicatifs : se référer à sa mosquée en cas de doute. */
(function () {
  "use strict";
  var EN = window.LANG === "en", KEY = "sira-fr:pt";
  var R = Math.PI / 180;
  function mod(a, n) { return ((a % n) + n) % n; }
  function sin(d) { return Math.sin(d * R); } function cos(d) { return Math.cos(d * R); }
  function tan(d) { return Math.tan(d * R); }
  function asin(x) { return Math.asin(x) / R; } function acos(x) { return Math.acos(x) / R; }
  function atan2(y, x) { return Math.atan2(y, x) / R; } function acot(x) { return Math.atan(1 / x) / R; }

  var METHODS = {
    mwl: { n: "Ligue islamique mondiale", en: "Muslim World League", f: 18, i: 17 },
    uoif: { n: "UOIF (France)", en: "UOIF (France)", f: 12, i: 12 },
    egypt: { n: "Autorité égyptienne", en: "Egyptian Authority", f: 19.5, i: 17.5 },
    makkah: { n: "Umm al-Qura (La Mecque)", en: "Umm al-Qura (Mecca)", f: 18.5, im: 90 },
    isna: { n: "Amérique du Nord (ISNA)", en: "North America (ISNA)", f: 15, i: 15 },
    morocco: { n: "Maroc", en: "Morocco", f: 19, i: 17 }
  };
  var CITIES = [
    ["Paris", 48.8566, 2.3522, "Europe/Paris"], ["Marseille", 43.2965, 5.3698, "Europe/Paris"], ["Bruxelles", 50.8503, 4.3517, "Europe/Brussels"],
    ["Alger", 36.7538, 3.0588, "Africa/Algiers"], ["Casablanca", 33.5731, -7.5898, "Africa/Casablanca"], ["Tunis", 36.8065, 10.1815, "Africa/Tunis"],
    ["Le Caire", 30.0444, 31.2357, "Africa/Cairo"], ["Dakar", 14.7167, -17.4677, "Africa/Dakar"], ["La Mecque", 21.4225, 39.8262, "Asia/Riyadh"],
    ["Médine", 24.4686, 39.6142, "Asia/Riyadh"], ["Istanbul", 41.0082, 28.9784, "Europe/Istanbul"], ["Londres", 51.5072, -0.1276, "Europe/London"],
    ["Montréal", 45.5017, -73.5673, "America/Toronto"], ["New York", 40.7128, -74.006, "America/New_York"]
  ];
  var CITY_EN = { "Bruxelles": "Brussels", "Alger": "Algiers", "Le Caire": "Cairo", "La Mecque": "Mecca", "Médine": "Medina", "Londres": "London", "Montréal": "Montreal" };

  function tzOffset(tz, date) { /* décalage horaire (en heures) du fuseau tz à cette date */
    try {
      var f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
      var p = {}; f.formatToParts(date).forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
      var asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
      return (asUTC - Math.floor(date.getTime() / 1000) * 1000) / 3600000;
    } catch (e) { return -date.getTimezoneOffset() / 60; }
  }
  function sun(jd) {
    var D = jd - 2451545.0, g = mod(357.529 + 0.98560028 * D, 360), q = mod(280.459 + 0.98564736 * D, 360);
    var L = mod(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    var ra = mod(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - ra > 12 ? q / 15 - ra - 24 : (q / 15 - ra < -12 ? q / 15 - ra + 24 : q / 15 - ra) };
  }
  function julian(y, m, d) { if (m <= 2) { y -= 1; m += 12; } var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }

  /* Retourne les heures (décimales, heure locale du fuseau) : fajr, sunrise, dhuhr, asr, maghrib, isha */
  function compute(date, lat, lng, tz, method, hanafi) {
    var m = METHODS[method] || METHODS.mwl, off = tzOffset(tz, date);
    var y = date.getFullYear(), mo = date.getMonth() + 1, d = date.getDate();
    var jd = julian(y, mo, d) - lng / (15 * 24), s = sun(jd + 0.5);
    var noon = 12 + off - lng / 15 - s.eqt;
    function t(angle, ccw) {
      var c = (-sin(angle) - sin(s.decl) * sin(lat)) / (cos(s.decl) * cos(lat));
      if (c < -1 || c > 1) return NaN;
      var h = acos(c) / 15; return ccw ? noon - h : noon + h;
    }
    var sunrise = t(0.833, true), sunset = t(0.833, false);
    var asrAngle = -acot((hanafi ? 2 : 1) + tan(Math.abs(lat - s.decl)));
    var fajr = t(m.f, true), isha = m.im ? sunset + m.im / 60 : t(m.i, false);
    var night = mod(sunrise - sunset, 24);
    if (isNaN(fajr)) fajr = sunrise - night / 7;            /* hautes latitudes : septième de la nuit */
    if (isNaN(isha)) isha = sunset + night / 7;
    return { fajr: fajr, sunrise: sunrise, dhuhr: noon + 2 / 60, asr: t(asrAngle, false), maghrib: sunset + 1 / 60, isha: isha };
  }
  function fmt(h) {
    if (isNaN(h)) return "--:--";
    h = mod(h + 0.5 / 60, 24); var hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  }
  function qibla(lat, lng) {
    var kl = 21.4225, kg = 39.8262, dl = kg - lng;
    return mod(atan2(sin(dl), cos(lat) * tan(kl) - sin(lat) * cos(dl)), 360);
  }
  function dirName(b) { var n = EN ? ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] : ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]; return n[Math.round(b / 45) % 8]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  var NAMES = EN ? [["fajr", "Fajr", "Dawn"], ["sunrise", "Sunrise", ""], ["dhuhr", "Dhuhr", "Midday"], ["asr", "Asr", "Afternoon"], ["maghrib", "Maghrib", "Sunset"], ["isha", "Isha", "Night"]]
    : [["fajr", "Fajr", "Aube"], ["sunrise", "Lever du soleil", ""], ["dhuhr", "Dhuhr", "Milieu du jour"], ["asr", "Asr", "Après-midi"], ["maghrib", "Maghrib", "Coucher du soleil"], ["isha", "Isha", "Nuit"]];
  var X = EN ? {
    h: "Prayer times and qibla", lead: "Times of the five prayers and the direction of the Kaaba, calculated on your device from your position. Nothing is sent anywhere.",
    loc: "📍 Use my position", city: "Or choose a city", pos: "Position", method: "Calculation method", asr: "Asr: Hanafi school (later)", next: "Next prayer", in: "in",
    qh: "Direction of the qibla", qd: "from north, clockwise", wait: "Locating…", fail: "Position unavailable. Choose a city instead.", date: "Today",
    note: "Times are indicative and may differ by a few minutes from your local mosque. In case of doubt, follow your mosque's timetable.", listen: "🔊 Listen to the adhan", pick: "— choose —"
  } : {
    h: "Horaires de prière et qibla", lead: "Les heures des cinq prières et la direction de la Kaaba, calculées sur votre appareil à partir de votre position. Rien n'est envoyé nulle part.",
    loc: "📍 Utiliser ma position", city: "Ou choisissez une ville", pos: "Position", method: "Méthode de calcul", asr: "Asr : école hanafite (plus tardif)", next: "Prochaine prière", in: "dans",
    qh: "Direction de la qibla", qd: "depuis le nord, dans le sens des aiguilles d'une montre", wait: "Localisation…", fail: "Position indisponible. Choisissez plutôt une ville.", date: "Aujourd'hui",
    note: "Les horaires sont indicatifs et peuvent différer de quelques minutes de ceux de votre mosquée. En cas de doute, suivez le calendrier de votre mosquée.", listen: "🔊 Écouter l'adhan", pick: "— choisir —"
  };
  var timer = null;

  function view() {
    var app = document.getElementById("app"), st = load();
    var def = (Intl.DateTimeFormat().resolvedOptions().timeZone || "") === "Europe/Paris" ? "uoif" : "mwl";
    st.method = st.method || def; st.hanafi = !!st.hanafi;
    app.innerHTML = '<section class="block wrap pt"><h2>' + X.h + '</h2><p class="lead">' + X.lead + "</p>" +
      '<div class="pt-clock" aria-live="off"><div class="pt-time" id="ptTime">--:--:--</div><div class="pt-date" id="ptDate"></div><div class="pt-hijri" id="ptHijri"></div></div>' +
      '<div class="pt-ctl"><button class="btn gold" id="ptLoc" type="button">' + X.loc + "</button>" +
      '<label class="rate">' + X.city + ' <select id="ptCity"><option value="">' + X.pick + "</option>" + CITIES.map(function (c, i) { return '<option value="' + i + '">' + esc(EN && CITY_EN[c[0]] || c[0]) + "</option>"; }).join("") + "</select></label>" +
      '<label class="rate">' + X.method + ' <select id="ptMethod">' + Object.keys(METHODS).map(function (k) { return '<option value="' + k + '"' + (k === st.method ? " selected" : "") + ">" + esc(EN ? METHODS[k].en : METHODS[k].n) + "</option>"; }).join("") + "</select></label>" +
      '<label class="rate"><input type="checkbox" id="ptHanafi"' + (st.hanafi ? " checked" : "") + "> " + X.asr + "</label></div>" +
      '<div id="ptOut" class="pt-out"></div><p class="muted small">' + X.note + "</p></section>";
    var out = document.getElementById("ptOut");
    var loc = EN ? "en-GB" : "fr-FR";
    function clock() {
      var tEl = document.getElementById("ptTime"); if (!tEl) { clearInterval(clk); return; }
      var tz = st.tz || undefined, n = new Date();
      tEl.textContent = new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: tz }).format(n);
      document.getElementById("ptDate").textContent = new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(n) + (st.name ? " · " + st.name : "");
      var hj = ""; try { hj = new Intl.DateTimeFormat((EN ? "en" : "fr") + "-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(n); } catch (e) {}
      document.getElementById("ptHijri").textContent = hj ? "🌙 " + hj : "";
    }
    clearInterval(window._siraClk); var clk = window._siraClk = setInterval(clock, 1000); clock();
    function show() {
      clearInterval(timer);
      if (st.lat == null) { out.innerHTML = ""; return; }
      var now = new Date(), tz = st.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
      var T = compute(now, st.lat, st.lng, tz, st.method, st.hanafi), q = qibla(st.lat, st.lng);
      var offNow = tzOffset(tz, now), nowH = mod(now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600 + offNow, 24);
      var order = ["fajr", "dhuhr", "asr", "maghrib", "isha"], nextK = null;
      for (var i = 0; i < order.length; i++) { if (T[order[i]] > nowH) { nextK = order[i]; break; } }
      var rows = NAMES.map(function (n) { return '<div class="pt-row' + (n[0] === nextK ? " next" : "") + '" data-k="' + n[0] + '"><span class="pt-n"><b>' + n[1] + "</b>" + (n[2] ? "<small>" + n[2] + "</small>" : "") + '</span><span class="pt-t">' + fmt(T[n[0]]) + "</span></div>"; }).join("");
      out.innerHTML = '<p class="pt-pos muted">' + X.pos + " : " + (st.name ? esc(st.name) + " · " : "") + Math.abs(st.lat).toFixed(2) + "°" + (st.lat >= 0 ? "N" : "S") + ", " + Math.abs(st.lng).toFixed(2) + "°" + (st.lng >= 0 ? "E" : "W") + "</p>" +
        '<div class="pt-next" id="ptNext"></div><div class="pt-grid">' + rows + "</div>" +
        '<div class="pt-q"><svg viewBox="-60 -60 120 120" class="pt-compass" role="img" aria-label="' + X.qh + '"><circle r="54" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/><text y="-40" text-anchor="middle" fill="currentColor" font-size="12">N</text>' +
        '<g transform="rotate(' + q.toFixed(1) + ')"><path d="M0-46L8 4H-8Z" fill="#f0b72e"/><circle r="4" fill="#fff"/><text y="-50" text-anchor="middle" font-size="12">🕋</text></g></svg>' +
        "<div><b>" + X.qh + " : " + Math.round(q) + "° " + dirName(q) + "</b><br><small class=\"muted\">" + X.qd + "</small></div></div>" +
        (window.SIRA_ADHAN && window.SIRA_ADHAN.file ? '<p><audio controls preload="none" src="' + esc(window.SIRA_ADHAN.file) + '" aria-label="' + X.listen + '"></audio></p>' : "");
      function tick() {
        var el = document.getElementById("ptNext"); if (!el) { clearInterval(timer); return; }
        var n = new Date(), h = mod(n.getUTCHours() + n.getUTCMinutes() / 60 + n.getUTCSeconds() / 3600 + tzOffset(tz, n), 24), k = null, tgt = null;
        for (var j = 0; j < order.length; j++) { if (T[order[j]] > h) { k = order[j]; tgt = T[order[j]]; break; } }
        if (!k) { k = "fajr"; tgt = T.fajr + 24; }
        var diff = Math.max(0, tgt - h), hh = Math.floor(diff), mm = Math.floor((diff - hh) * 60), ss = Math.floor(((diff - hh) * 60 - mm) * 60), nm = NAMES.filter(function (x) { return x[0] === k; })[0][1];
        el.innerHTML = X.next + " : <b>" + nm + "</b> " + fmt(T[k]) + " — " + X.in + " " + (hh ? hh + " h " : "") + mm + " min " + ss + " s";
      }
      tick(); timer = setInterval(tick, 1000);
    }
    document.getElementById("ptLoc").onclick = function () {
      if (!navigator.geolocation) { out.innerHTML = '<p class="muted">' + X.fail + "</p>"; return; }
      out.innerHTML = '<p class="muted">' + X.wait + "</p>";
      navigator.geolocation.getCurrentPosition(function (p) { st.lat = p.coords.latitude; st.lng = p.coords.longitude; st.tz = null; st.name = ""; save(st); show(); },
        function () { out.innerHTML = '<p class="muted">' + X.fail + "</p>"; }, { timeout: 12000, maximumAge: 3600000 });
    };
    document.getElementById("ptCity").onchange = function (e) { var c = CITIES[e.target.value]; if (!c) return; st.lat = c[1]; st.lng = c[2]; st.tz = c[3]; st.name = EN && CITY_EN[c[0]] || c[0]; save(st); show(); };
    document.getElementById("ptMethod").onchange = function (e) { st.method = e.target.value; save(st); show(); };
    document.getElementById("ptHanafi").onchange = function (e) { st.hanafi = e.target.checked; save(st); show(); };
    show();
    document.title = X.h + " — " + (EN ? "The World of the Sirah" : "Le Monde de la Sirah");
  }
  window.SiraHoraires = { view: view, compute: compute, qibla: qibla };
})();
