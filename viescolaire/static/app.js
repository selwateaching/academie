document.addEventListener('submit', function (e) {
  var m = e.target.getAttribute('data-confirm');
  if (m && !confirm(m)) e.preventDefault();
});
document.addEventListener('change', function (e) {
  if (e.target.hasAttribute('data-autosubmit')) e.target.form.submit();
});
document.addEventListener('click', function (e) {
  if (e.target.hasAttribute('data-print')) window.print();
});
/* Formulaire de convocation : classes -> professeurs de ces classes, « tous » exclusif, décompte en direct. */
(function () {
  var form = document.querySelector('form[data-convocation]');
  if (!form) return;
  var classes = form.querySelector('[data-conv-classes]');
  var profs = form.querySelector('[data-conv-profs]');
  var tous = form.querySelector('[data-conv-tous]');
  var resume = form.querySelector('[data-conv-resume]');
  var auto = new Set();  // professeurs cochés automatiquement par une classe (les choix manuels n'en font pas partie)

  function classesChoisies() {
    return Array.prototype.filter.call(classes.options, function (o) { return o.selected; }).map(function (o) { return o.value || o.text; });
  }
  function majResume() {
    if (tous.checked) { resume.textContent = 'Tous les professeurs seront convoqués.'; return; }
    var n = Array.prototype.filter.call(profs.options, function (o) { return o.selected; }).length;
    resume.textContent = n ? n + ' professeur(s) convoqué(s).' : 'Aucun professeur sélectionné.';
  }
  function surClasses() {
    var choisies = classesChoisies();
    Array.prototype.forEach.call(profs.options, function (o) {
      var enseigne = (o.getAttribute('data-classes') || '').split('|').some(function (c) { return choisies.indexOf(c) !== -1; });
      if (enseigne) { o.selected = true; auto.add(o.value); }
      else if (auto.has(o.value)) { o.selected = false; auto.delete(o.value); }
    });
    majResume();
  }
  function surProfs() {  // un choix fait à la main n'est plus retiré automatiquement
    Array.prototype.forEach.call(profs.options, function (o) { if (o.selected) auto.delete(o.value); });
    majResume();
  }
  function surTous() {
    classes.disabled = profs.disabled = tous.checked;
    majResume();
  }
  classes.addEventListener('change', surClasses);
  profs.addEventListener('change', surProfs);
  tous.addEventListener('change', surTous);
  majResume();
})();
