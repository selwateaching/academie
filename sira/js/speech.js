/* Lecture audio : prononciation française des noms arabes, découpage naturel, choix de la voix,
   et lecture de fichiers enregistrés (audio/<id>/<n>.mp3) lorsqu'ils existent. */
(function () {
  "use strict";

  /* ---------- Lexique : écriture du site -> écriture pensée pour une voix française ---------- */
  var LEX = {
    "Mouhammed": "Mouhammade", "Abu": "Abou", "Umm": "Oumm", "Omar": "Oumar", "Banu": "Banou",
    "Quraysh": "Qoraïch", "Qurayza": "Qouraïza", "Qaynuqa": "Qaïnouqa", "Khuza'a": "Khouzaa",
    "Jibril": "Djibril", "Ja'far": "Djaafar", "Jabal": "Djabal", "Jahl": "Djahle", "Jahsh": "Djahch", "Jarrah": "Djarrah", "Jurmuz": "Djourmouz", "Juwayriyya": "Djouaïriya",
    "Khadija": "Khadidja", "Khaybar": "Khaïbar", "Khazraj": "Khazradj", "Khuwaylid": "Khouaïlid", "Khuzayma": "Khouzaïma", "Ka'b": "Kaab",
    "Mada'in": "Madaïne", "Mas'ud": "Massoud", "Mi'raj": "Miradj", "Isra'": "Israa", "Isra": "Israa", "Bay'at": "Baya", "Baqi'": "Baqi",
    "Mu'adh": "Mouaz", "Mu'attal": "Mouattal", "Mu'awiya": "Mouawiya", "Mu'ta": "Mouta", "Mus'ab": "Mousab", "Musa": "Moussa",
    "Rabi'a": "Rabia", "Rabi'": "Rabi", "Sa'd": "Saad", "Sa'diyya": "Saadiya", "Zam'a": "Zamaa", "Lu'lu'a": "Loulouaa", "Lu'lu": "Loulou",
    "Hudaybiyya": "Houdaïbiya", "Hudayr": "Houdaïr", "Hunayn": "Hounaïne", "Hurayra": "Houraïra", "Husayn": "Houssaïne", "Hasan": "Hassane", "Hassan": "Hassane", "Hashim": "Hachim", "Hisham": "Hicham",
    "Hajar": "Hadjar", "Hijja": "Hidjdja", "Hajj": "Hadj", "Harun": "Haroune", "Hawazin": "Haouazine", "Hubab": "Houbab",
    "Idris": "Idriss", "Isa": "Issa", "Sufyan": "Soufiane", "Suhayl": "Souhaïl", "Sulaym": "Soulaïm", "Sumayya": "Soumaya", "Suffa": "Soufa", "Sunna": "Souna", "Suraqa": "Souraqa",
    "Siffin": "Siffine", "Safiyya": "Safiya", "Safwan": "Safouane", "Salman": "Salmane", "Tabuk": "Tabouk", "Ubayda": "Oubaïda", "Ubaydillah": "Oubaïdillah", "Ubayy": "Oubaï",
    "Uhud": "Ouhoud", "Umayr": "Oumaïr", "Umays": "Oumaïs", "Umayya": "Oumaya", "Uraiqit": "Ouraïqit", "Usama": "Ousama", "Usayd": "Ousaïd", "Uthman": "Outmane",
    "Yasir": "Yassir", "Yusuf": "Youssouf", "Zayd": "Zaïd", "Zaynab": "Zaïnab", "Zubayr": "Zoubaïr", "Zuhayr": "Zouhaïr",
    "Qadisiyya": "Qadissiya", "Qasim": "Qassim", "Quba": "Qouba", "Quhafa": "Qouhafa", "Rahman": "Rahmane", "Ridwan": "Ridouane", "Rumah": "Roumah", "Ruqayya": "Rouqaya",
    "Mundhir": "Mondhir", "Muqawqis": "Mouqawqis", "Muljam": "Mouldjam", "Muhajirun": "Mouhadjiroune", "Mustaliq": "Moustaliq", "Muttalib": "Mouttalib", "Muzdalifa": "Mouzdalifa", "Makhzum": "Makhzoum",
    "Maymuna": "Maïmouna", "Maysara": "Maïsara", "Najran": "Nadjrane", "Nitaqayn": "Nitaqaïne", "Nurayn": "Nouraïne", "Nur": "Nour", "Nuh": "Nouh",
    "Ashhal": "Achhal", "Awwam": "Awam", "Ayyub": "Ayyoub", "Dhu": "Dhou", "Dujana": "Doujana", "Faruq": "Farouk", "Fudul": "Foudoul", "Ghatafan": "Ghatafane",
    "Kulthum": "Koultoum", "Amin": "Amine", "Anas": "Anass", "Affan": "Affane", "Ahl": "Ahle", "Thabit": "Tabit", "Thawr": "Taour", "Thaqif": "Taqif", "Yathrib": "Yatrib", "Harith": "Haritte", "Haritha": "Harita", "Hind": "Hinnde", "Ifk": "Ifque", "Ramadan": "Ramadane", "calife": "kalif", "califes": "kalifes", "califat": "kalifat", "dos": "dau", "moud": "mou", "rythme": "ritme",
    "'umra": "oumra", "hadiths": "hadites", "hadith": "hadite", "zakat": "zakate", "adhan": "adhane", "suhur": "souhour", "ihram": "ihrame", "muezzin": "mouézine", "mubahala": "moubahala", "i'tikaf": "itikaf"
  };
  var keys = Object.keys(LEX).sort(function (a, b) { return b.length - a.length; });
  var LEXRE = new RegExp("(?<![\\p{L}])(" + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")(?![\\p{L}])", "gu");
  var ELISION = { l: 1, d: 1, j: 1, m: 1, n: 1, s: 1, t: 1, c: 1, qu: 1, jusqu: 1, lorsqu: 1, puisqu: 1, quoiqu: 1, quelqu: 1, aujourd: 1 };
  var PRAYER = "que la paix et les bénédictions de Dieu soient sur lui";

  /* Retourne le texte à dire à voix haute (l'affichage, lui, n'est pas modifié). */
  function prepare(t) {
    t = t.replace(/ ?ﷺ/g, ", " + PRAYER + ",");
    t = t.replace(/,\s*([,.;:!?])/g, "$1").replace(/,,+/g, ",");
    t = t.replace(LEXRE, function (m) { return LEX[m]; });
    // apostrophe interne d'un nom arabe (hors élisions françaises) : on la supprime, sinon la voix épelle les lettres
    t = t.replace(/([\p{L}]+)['’]([\p{L}]+)/gu, function (m, a, b) { return ELISION[a.toLowerCase()] ? m : a + b; });
    t = t.replace(/([\p{L}]+)['’](?![\p{L}])/gu, function (m, a) { return /\s$/.test(m) ? m : a; });
    // « w » et « sh » se lisent mal en français
    t = t.replace(/w/g, "ou").replace(/W/g, "Ou").replace(/sh/g, "ch").replace(/Sh/g, "Ch");
    return t;
  }

  /* Découpe en phrases courtes (plus naturelles, et évite les coupures des voix longues). */
  function sentences(t) {
    var out = [];
    t.split(/(?<=[.!?…])\s+(?=[«"“A-ZÀ-Ý])/).forEach(function (s) {
      s = s.trim(); if (!s) return;
      while (s.length > 200) {
        var cut = s.lastIndexOf(", ", 190); if (cut < 60) cut = s.lastIndexOf(" ", 190); if (cut < 60) break;
        out.push(s.slice(0, cut + 1).trim()); s = s.slice(cut + 1).trim();
      }
      if (s) out.push(s);
    });
    return out;
  }

  /* ---------- Voix de l'appareil ---------- */
  function score(v) {
    var n = v.name || "", s = 0;
    if (/natural/i.test(n)) s += 100;
    else if (/online/i.test(n)) s += 80;
    if (/enhanced|premium|siri|neural/i.test(n)) s += 90;
    if (/google/i.test(n)) s += 60;
    if (/amélie|thomas|audrey|aurélie|denise|henri|vivienne|remy|rémy|eloise|éloïse/i.test(n)) s += 25;
    if (/fr[-_]FR/i.test(v.lang)) s += 10;
    if (/hortense|paul|julie|microsoft (?!.*(online|natural))/i.test(n) && !/online|natural/i.test(n)) s -= 20;
    return s;
  }
  function frVoices() {
    var l = (window.speechSynthesis ? window.speechSynthesis.getVoices() : []).filter(function (x) { return /^fr/i.test(x.lang); });
    return l.sort(function (a, b) { return score(b) - score(a); });
  }

  /* ---------- Lecteur ---------- */
  var KEY_V = "sira-fr:voice", KEY_R = "sira-fr:rate", KEY_A = "sira-fr:auto";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var gen = 0, audioEl = null;

  function stop() {
    gen++;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioEl) { audioEl.onended = null; audioEl.onerror = null; audioEl.pause(); audioEl = null; }
  }
  function recorded(id) { return !!(window.SIRA_AUDIO && window.SIRA_AUDIO.ids && window.SIRA_AUDIO.ids.indexOf(id) !== -1); }
  function supported() { return ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) || !!(window.SIRA_AUDIO && window.SIRA_AUDIO.ids && window.SIRA_AUDIO.ids.length); }

  function setup(c, next, hrefOf) {
    var $ = function (i) { return document.getElementById(i); };
    var play = $("play"), pause = $("pause"), stopB = $("stop"), rate = $("rate"), auto = $("auto"), note = $("audioNote"), sel = $("voice");
    var paras = Array.prototype.slice.call(document.querySelectorAll("#prose p"));
    var texts = [c.title + ". " + c.sub + "."].concat(c.paras);
    var hasRec = recorded(c.id), mode = null, my = 0, paused = false;

    rate.value = get(KEY_R) || "1";
    auto.checked = get(KEY_A) === "1";
    rate.onchange = function () { set(KEY_R, rate.value); if (audioEl) audioEl.playbackRate = parseFloat(rate.value) || 1; };
    auto.onchange = function () { set(KEY_A, auto.checked ? "1" : "0"); };

    function fillVoices() {
      var voices = frVoices(), saved = get(KEY_V), html = "";
      if (hasRec) html += '<option value="rec">Voix enregistrée (naturelle)</option>';
      voices.forEach(function (v) { html += '<option value="' + v.name.replace(/"/g, "&quot;") + '">' + v.name.replace(/</g, "&lt;") + "</option>"; });
      sel.innerHTML = html || '<option value="">Aucune voix française</option>';
      var wanted = saved && Array.prototype.some.call(sel.options, function (o) { return o.value === saved; }) ? saved : hasRec ? "rec" : (voices[0] ? voices[0].name : "");
      sel.value = wanted; mode = wanted;
      var best = voices[0];
      note.textContent = wanted === "rec" ? "" : !voices.length
        ? "Aucune voix française trouvée sur cet appareil : installez-en une dans les réglages du système."
        : (best && !/natural|online|enhanced|premium|neural|google/i.test(best.name)
          ? "Astuce : dans Microsoft Edge, la voix « Natural » (Denise, Henri) est bien plus naturelle que les voix classiques de Windows."
          : "");
    }
    fillVoices();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = fillVoices;
    sel.onchange = function () { mode = sel.value; set(KEY_V, mode); if (!play.disabled) return; start(); };

    function clear() { paras.forEach(function (p) { p.classList.remove("speaking"); }); }
    function ui(on) { play.disabled = on; pause.disabled = !on; stopB.disabled = !on; pause.textContent = "⏸ Pause"; paused = false; }
    function highlight(i) { clear(); if (i > 0 && paras[i - 1]) { paras[i - 1].classList.add("speaking"); paras[i - 1].scrollIntoView({ block: "center", behavior: "smooth" }); } }
    function finish() { clear(); ui(false); if (auto.checked && next) location.hash = hrefOf(next.id) + "?audio=1"; }

    /* voix enregistrée : un fichier par paragraphe */
    function playRec(i) {
      if (gen !== my) return;
      if (i >= texts.length) return finish();
      highlight(i);
      audioEl = new Audio("audio/" + c.id + "/" + i + ".mp3");
      audioEl.playbackRate = parseFloat(rate.value) || 1;
      audioEl.onended = function () { setTimeout(function () { playRec(i + 1); }, 250); };
      audioEl.onerror = function () { hasRec = false; fillVoices(); start(); };
      audioEl.play().catch(function () { ui(false); });
      if (i + 1 < texts.length) { var pre = new Audio(); pre.preload = "auto"; pre.src = "audio/" + c.id + "/" + (i + 1) + ".mp3"; }
    }

    /* voix de l'appareil : phrase par phrase */
    function playTTS() {
      var items = [];
      texts.forEach(function (t, i) { sentences(prepare(t)).forEach(function (s, k) { items.push({ i: i, s: s, first: k === 0 }); }); });
      var voice = frVoices().filter(function (v) { return v.name === mode; })[0] || frVoices()[0] || null;
      (function step(n) {
        if (gen !== my) return;
        if (n >= items.length) return finish();
        var it = items[n];
        if (it.first) highlight(it.i);
        var u = new SpeechSynthesisUtterance(it.s);
        u.lang = voice ? voice.lang : "fr-FR"; if (voice) u.voice = voice;
        u.rate = parseFloat(rate.value) || 1; u.pitch = 1;
        var nextItem = items[n + 1];
        u.onend = function () { if (nextItem && nextItem.first) setTimeout(function () { step(n + 1); }, 350); else step(n + 1); };
        u.onerror = function (e) { if (e.error !== "canceled" && e.error !== "interrupted") ui(false); };
        window.speechSynthesis.speak(u);
      })(0);
    }

    function start() { stop(); my = gen; ui(true); if (mode === "rec") playRec(0); else playTTS(); }
    play.onclick = start;
    pause.onclick = function () {
      if (mode === "rec" && audioEl) { if (audioEl.paused) { audioEl.play(); pause.textContent = "⏸ Pause"; } else { audioEl.pause(); pause.textContent = "▶ Reprendre"; } return; }
      var ss = window.speechSynthesis;
      if (ss.paused) { ss.resume(); pause.textContent = "⏸ Pause"; } else { ss.pause(); pause.textContent = "▶ Reprendre"; }
    };
    stopB.onclick = function () { stop(); clear(); ui(false); };
    if (/audio=1/.test(location.hash)) { history.replaceState(null, "", location.hash.replace(/\?audio=1/, "")); setTimeout(start, 300); }
  }

  window.SiraAudio = { setup: setup, stop: stop, supported: supported, prepare: prepare, sentences: sentences, frVoices: frVoices };
})();
