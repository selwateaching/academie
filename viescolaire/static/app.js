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
/* Rédaction assistée : élève -> classe, professeur principal, équipe ; type d'incident -> texte proposé ; texte du document modifiable. */
(function () {
  var dataEl = document.getElementById('redaction-data');
  var form = document.querySelector('form[data-redaction]');
  if (!dataEl || !form) return;
  var D = JSON.parse(dataEl.textContent);
  var $ = function (s) { return form.querySelector(s); };
  var el = {
    modele: $('[name=modele_id]'), filtreClasse: $('[data-filtre-classe]'), filtreTexte: $('[data-filtre-texte]'), eleve: $('[data-eleve]'),
    infos: $('[data-infos]'), prof: $('[data-prof]'), matiere: $('[data-matiere-champ]'), date: $('[name=date]'), heure: $('[name=heure]'),
    lieu: $('[name=lieu]'), type: $('[data-type]'), autre: $('[data-autre]'), autreInput: $('[name=type_autre]'), desc: $('[data-description]'),
    suite: $('[data-suite]'), titre: $('[data-titre]'), corps: $('[data-corps]'), inserer: $('[data-inserer]'),
    notice: $('[data-notice-corps]'), incidentBox: $('[data-incident-box]')
  };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var corpsModifie = false, descModifiee = false, titreModifie = false;

  function dateLongue(iso) {  // même rendu que le serveur : « mardi 27 octobre 2026 »
    var p = (iso || '').split('-'); if (p.length !== 3) return iso || '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return JOURS[d.getDay()] + ' ' + (d.getDate() === 1 ? '1er' : d.getDate()) + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function remplir(txt, ctx) { return (txt || '').replace(/\{\{\s*(\w+)\s*\}\}/g, function (m, k) { return k in ctx ? ctx[k] : m; }); }
  function eleveCourant() { var id = +el.eleve.value; return D.eleves.filter(function (e) { return e.id === id; })[0] || null; }
  function modeleCourant() { var id = +el.modele.value; return D.modeles.filter(function (m) { return m.id === id; })[0] || null; }
  function typeCourant() { var l = el.type.value; return D.types.filter(function (t) { return t.libelle === l; })[0] || null; }

  function contexte() {
    var e = eleveCourant(), cl = e ? D.classes[e.classe] : null, pp = cl && cl.pp;
    var opt = el.prof.options[el.prof.selectedIndex];
    var libelle = el.type.value;
    if (/^Autre/.test(libelle) && el.autreInput.value.trim()) libelle = el.autreInput.value.trim();
    return {
      eleve: e ? e.nom : '', prenom: e ? e.nom.split(' ')[0] : '', nom: e ? e.nom.split(' ').slice(1).join(' ') : '', classe: e ? e.classe : '',
      responsable: e && e.responsable ? e.responsable : 'Madame, Monsieur', professeur: opt && opt.value ? opt.getAttribute('data-nom') : '',
      matiere: el.matiere.value, prof_principal: pp ? pp.nom : '', date: dateLongue(el.date.value), heure: el.heure.value, lieu: el.lieu.value,
      type_incident: libelle, auteur: D.auteur, date_du_jour: dateLongue(D.today), etablissement: D.etablissement
    };
  }
  function majDescription() {
    var t = typeCourant();
    if (descModifiee || !t) return;
    el.desc.value = remplir(t.texte, contexte());
  }
  function majCorps() {
    var m = modeleCourant(); if (!m) return;
    if (!titreModifie) el.titre.value = m.titre + (eleveCourant() ? ' — ' + eleveCourant().nom : '');
    if (corpsModifie) return;
    var ctx = contexte(); ctx.description = remplir(el.desc.value, ctx); ctx.suite = remplir(el.suite.value, ctx);
    el.corps.value = remplir(m.corps, ctx);
    if (el.incidentBox) el.incidentBox.hidden = !m.avec_incident;
  }
  function tout() { majDescription(); majCorps(); }

  function filtrerEleves() {
    var cl = el.filtreClasse.value, terme = el.filtreTexte.value.trim().toLowerCase(), actuel = el.eleve.value;
    el.eleve.innerHTML = '<option value="">— aucun —</option>';
    D.eleves.forEach(function (e) {
      if ((cl && e.classe !== cl) || (terme && e.nom.toLowerCase().indexOf(terme) === -1)) return;
      var o = document.createElement('option'); o.value = e.id; o.textContent = e.classe + ' · ' + e.nom; el.eleve.appendChild(o);
    });
    el.eleve.value = actuel;
    if (el.eleve.value !== actuel) surEleve();
  }
  function surEleve() {
    var e = eleveCourant(), cl = e ? D.classes[e.classe] : null;
    el.prof.innerHTML = '<option value="">—</option>';
    if (cl) {
      var ajoute = function (p, etiquette) {
        var o = document.createElement('option'); o.value = p.prof_id; o.textContent = etiquette;
        o.setAttribute('data-nom', p.nom); o.setAttribute('data-matiere', p.matiere); el.prof.appendChild(o);
      };
      if (cl.pp) ajoute(cl.pp, 'Professeur principal : ' + cl.pp.nom + ' (' + cl.pp.matiere + ')');
      cl.equipe.forEach(function (p) { ajoute(p, p.nom + ' — ' + p.matiere); });
      if (el.prof.options.length > 1) el.prof.selectedIndex = 1;  // par défaut : le professeur principal (ou le premier de l'équipe)
    }
    var opt = el.prof.options[el.prof.selectedIndex];
    el.matiere.value = opt && opt.value ? opt.getAttribute('data-matiere') : '';
    el.infos.innerHTML = e ? ('<b>' + e.nom + '</b> — classe <b>' + e.classe + '</b> · professeur principal : <b>' + ((cl && cl.pp) ? cl.pp.nom : 'non renseigné') +
      '</b> · équipe : ' + (cl && cl.equipe.length ? cl.equipe.map(function (p) { return p.nom + ' (' + p.matiere + ')'; }).join(', ') : 'aucun cours planifié') + (e.responsable ? ' · responsable : ' + e.responsable : '')) :
      'Sélectionnez un élève : sa classe, son professeur principal et l\'équipe pédagogique s\'affichent automatiquement.';
    tout();
  }
  el.filtreClasse.addEventListener('change', filtrerEleves);
  el.filtreTexte.addEventListener('input', filtrerEleves);
  el.eleve.addEventListener('change', surEleve);
  el.prof.addEventListener('change', function () {
    var opt = el.prof.options[el.prof.selectedIndex]; el.matiere.value = opt && opt.value ? opt.getAttribute('data-matiere') : ''; tout();
  });
  el.type.addEventListener('change', function () { descModifiee = false; el.autre.hidden = !/^Autre/.test(el.type.value); tout(); });
  el.modele.addEventListener('change', function () { corpsModifie = false; titreModifie = false; el.notice.hidden = true; tout(); });
  [el.matiere, el.date, el.heure, el.lieu, el.autreInput, el.suite].forEach(function (c) { c.addEventListener('input', tout); });
  el.desc.addEventListener('input', function () { descModifiee = true; majCorps(); });
  el.titre.addEventListener('input', function () { titreModifie = true; });
  el.corps.addEventListener('input', function () { corpsModifie = true; el.notice.hidden = false; });
  form.querySelector('[data-regen-corps]').addEventListener('click', function () {
    if (corpsModifie && !confirm('Remplacer le texte actuel par celui du modèle ?')) return;
    corpsModifie = false; el.notice.hidden = true; majCorps();
  });
  form.querySelector('[data-regen-desc]').addEventListener('click', function () { descModifiee = false; tout(); });
  el.inserer.addEventListener('change', function () {  // insère la valeur actuelle de l'information à l'endroit du curseur
    var k = el.inserer.value; if (!k) return;
    var ctx = contexte(), v = k === 'description' ? el.desc.value : (k === 'suite' ? el.suite.value : (k in ctx ? ctx[k] : '')) || '{{' + k + '}}';
    var c = el.corps, a = c.selectionStart || 0, b = c.selectionEnd || 0;
    c.value = c.value.slice(0, a) + v + c.value.slice(b); c.focus(); c.selectionStart = c.selectionEnd = a + v.length;
    corpsModifie = true; el.notice.hidden = false; el.inserer.value = '';
  });
  surEleve();
})();
