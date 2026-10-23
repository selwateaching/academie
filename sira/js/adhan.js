/* Appel à la prière enregistré (adhan). Le fichier et son crédit se déclarent dans window.SIRA_ADHAN
   (voir README) ; tant qu'il est absent, rien ne s'affiche. Lecteur natif <audio>, sans autre dépendance. */
(function () {
  "use strict";
  var EN = window.LANG === "en", AR = window.LANG === "ar";
  var IDS = { 301: 1, 311: 1 };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function block(id) {
    var a = window.SIRA_ADHAN;
    if (!a || !a.file || !IDS[id]) return "";
    return '<div class="adhan"><b>🕌 ' + L3("Écouter l'appel à la prière (adhan)", "Listen to the call to prayer (adhan)", "استمع إلى الأذان") + "</b>" +
      '<audio controls preload="none" src="' + esc(a.file) + '"></audio>' +
      (a.credit ? '<small class="muted">' + esc(AR && a.credit_ar ? a.credit_ar : EN && a.credit_en ? a.credit_en : a.credit) + "</small>" : "") + "</div>";
  }
  window.SiraAdhan = { block: block };
})();
