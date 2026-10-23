/* Langue du site : français (par défaut), anglais ou arabe. Chargé en premier.
   En anglais ou en arabe, charge les fichiers de js/en/ ou js/ar/ avant les données ; js/i18n-apply.js les applique ensuite. */
(function () {
  "use strict";
  var KEY = "sira-fr:lang", lang = "fr", OK = /^(en|fr|ar)$/;
  try {
    var m = /[?&]lang=(en|fr|ar)\b/.exec(location.search);
    if (m) localStorage.setItem(KEY, m[1]);
    var s = localStorage.getItem(KEY);
    if (OK.test(s)) lang = s;
  } catch (e) {
    var mm = /[?&]lang=(en|fr|ar)\b/.exec(location.search);
    if (mm) lang = mm[1];
  }
  window.LANG = lang;
  window.EN = {}; window.AR = {};
  window.T = function (s) {
    var d = lang === "en" ? window.EN_UI : lang === "ar" ? window.AR_UI : null;
    return d && Object.prototype.hasOwnProperty.call(d, s) ? d[s] : s;
  };
  /* Choix d'un texte selon la langue : L3(français, anglais, arabe) ; sans arabe, on retombe sur l'anglais */
  window.L3 = function (fr, en, ar) { return lang === "en" ? en : lang === "ar" ? (ar == null ? en : ar) : fr; };
  window.SiraI18n = {
    lang: lang,
    set: function (l) {
      try { localStorage.setItem(KEY, l); } catch (e) {}
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
      location.reload();
    }
  };
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  if (lang === "en") {
    ["ui", "content-1", "content-2", "content-3", "content-4", "quiz-1", "quiz-2", "quiz-3", "quiz-4", "lex", "audio-manifest"].forEach(function (f) {
      document.write('<script src="js/en/' + f + '.js"><\/script>');
    });
  }
  if (lang === "ar") {
    ["ui", "content", "lex", "say"].forEach(function (f) {
      document.write('<script src="js/ar/' + f + '.js"><\/script>');
    });
  }
})();
