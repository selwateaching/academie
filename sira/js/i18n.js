/* Langue du site (français par défaut, anglais au choix). Chargé en premier.
   En anglais, charge les fichiers de js/en/ avant les données ; js/i18n-apply.js les applique ensuite. */
(function () {
  "use strict";
  var KEY = "sira-fr:lang", lang = "fr";
  try {
    var m = /[?&]lang=(en|fr)\b/.exec(location.search);
    if (m) localStorage.setItem(KEY, m[1]);
    var s = localStorage.getItem(KEY);
    if (s === "en" || s === "fr") lang = s;
  } catch (e) {
    var mm = /[?&]lang=(en|fr)\b/.exec(location.search);
    if (mm) lang = mm[1];
  }
  window.LANG = lang;
  window.EN = {};
  window.T = function (s) {
    var d = window.EN_UI;
    return lang === "en" && d && Object.prototype.hasOwnProperty.call(d, s) ? d[s] : s;
  };
  window.SiraI18n = {
    lang: lang,
    set: function (l) {
      try { localStorage.setItem(KEY, l); } catch (e) {}
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
      location.reload();
    }
  };
  document.documentElement.lang = lang;
  if (lang === "en") {
    ["ui", "content-1", "content-2", "content-3", "quiz-1", "quiz-2", "quiz-3", "lex", "audio-manifest"].forEach(function (f) {
      document.write('<script src="js/en/' + f + '.js"><\/script>');
    });
  }
})();
