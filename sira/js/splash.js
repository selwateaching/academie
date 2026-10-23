/* Écran d'ouverture : la basmala en arabe, mot à mot, une fois par session. Touche ou clic pour passer. */
(function () {
  "use strict";
  var el = document.getElementById("splash");
  if (!el) return;
  try { if (sessionStorage.getItem("sira-fr:splash")) return; sessionStorage.setItem("sira-fr:splash", "1"); } catch (e) {}
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.hidden = false;
  document.body.classList.add("splash-on");
  var done = false;
  function close() {
    if (done) return; done = true;
    el.classList.add("out");
    document.body.classList.remove("splash-on");
    setTimeout(function () { el.hidden = true; }, 700);
  }
  el.addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (!done && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) close(); });
  setTimeout(close, reduce ? 2500 : 5200);
})();
