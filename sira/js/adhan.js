/* Appel à la prière enregistré (adhan). Le fichier et son crédit se déclarent dans window.SIRA_ADHAN
   (voir README) ; tant qu'il est absent, rien ne s'affiche. Lecteur natif <audio>, sans autre dépendance. */
(function () {
  "use strict";
  var EN = window.LANG === "en";
  var IDS = { 301: 1, 311: 1 };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function block(id) {
    var a = window.SIRA_ADHAN;
    if (!a || !a.file || !IDS[id]) return "";
    return '<div class="adhan"><b>🕌 ' + (EN ? "Listen to the call to prayer (adhan)" : "Écouter l'appel à la prière (adhan)") + "</b>" +
      '<audio controls preload="none" src="' + esc(a.file) + '"></audio>' +
      (a.credit ? '<small class="muted">' + esc(EN && a.credit_en ? a.credit_en : a.credit) + "</small>" : "") + "</div>";
  }
  window.SiraAdhan = { block: block };
})();
