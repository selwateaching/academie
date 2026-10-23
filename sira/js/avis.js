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
  function link(cls) { return '<a class="btn gold ' + (cls || "") + '" href="' + URL + '" target="_blank" rel="noopener">' + L.btn + "</a>"; }
  function view() {
    document.getElementById("app").innerHTML = '<section class="block wrap avis"><h2>' + L.h + '</h2><p class="lead">' + L.lead + "</p><ul class=\"avis-li\">" +
      L.li.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul><p>" + link() + '</p><p class="muted small">' + L.note + "</p><p class=\"avis-dua\">" + L.dua + "</p></section>";
    document.title = L.h + " — " + L3("Le Monde de la Sirah", "The World of the Sirah", "عالم السيرة");
  }
  function cta() { return '<div class="quiz-cta avis-cta"><div><b>💛 ' + L.ctaT + "</b><small>" + L.ctaS + "</small></div>" + link() + "</div>"; }
  window.SiraAvis = { view: view, cta: cta, url: URL };
})();
