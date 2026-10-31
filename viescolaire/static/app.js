document.addEventListener('submit', function (e) {
  var m = e.target.getAttribute('data-confirm');
  if (m && !confirm(m)) e.preventDefault();
});
document.addEventListener('change', function (e) {
  if (e.target.hasAttribute('data-autosubmit')) e.target.form.submit();
});
document.addEventListener('click', function (e) {
  if (e.target.hasAttribute('data-print')) window.print();
  if (e.target.hasAttribute('data-retour')) history.back();
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
  var effacer = form.querySelector('[data-conv-clear]');
  form.reset();          // le navigateur peut restaurer d'anciens choix : on repart toujours d'une sélection vide

  function classesChoisies() {
    return Array.prototype.filter.call(classes.options, function (o) { return o.selected; }).map(function (o) { return o.value || o.text; });
  }
  function majResume() {
    if (tous.checked) { resume.textContent = 'Tous les professeurs seront convoqués.'; return; }
    var n = Array.prototype.filter.call(profs.options, function (o) { return o.selected; }).length;
    resume.textContent = n ? n + ' professeur(s) sur ' + profs.options.length + ' convoqué(s).' : 'Aucun professeur sélectionné.';
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
  function toutEffacer() {
    Array.prototype.forEach.call(classes.options, function (o) { o.selected = false; });
    Array.prototype.forEach.call(profs.options, function (o) { o.selected = false; });
    form.querySelectorAll('input[name=eleves]').forEach(function (c) { c.checked = false; });
    form.querySelectorAll('[data-el-toute-classe]').forEach(function (c) { c.checked = false; c.indeterminate = false; });
    tous.checked = false; classes.disabled = profs.disabled = false; auto.clear();
    majResume();
    var r = form.querySelector('[data-el-resume]'); if (r) r.textContent = 'Aucun élève sélectionné.';
  }
  if (effacer) effacer.addEventListener('click', toutEffacer);
  window.addEventListener('pageshow', function (e) { if (e.persisted) toutEffacer(); });
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
  var initial = form.getAttribute('data-eleve-initial');   // arrivée depuis la fiche d'un élève ou un incident
  if (initial) el.eleve.value = initial;
  var inc = form.getAttribute('data-incident');            // arrivée depuis un incident : date, faits et suite repris
  if (inc) {
    try {
      var I = JSON.parse(inc);
      if (I.date) el.date.value = I.date;
      if (I.description) { el.desc.value = I.description; descModifiee = true; }
      if (I.suite) el.suite.value = I.suite;
    } catch (e) { /* données illisibles : on laisse le formulaire vide */ }
  }
  surEleve();
})();
/* Convocation d'élèves : sélection par classe, recherche, décompte. */
(function () {
  var box = document.querySelector('[data-el-box]');
  if (!box) return;
  var form = box.closest('form');
  var filtreClasse = form.querySelector('[data-el-classe]');
  var recherche = form.querySelector('[data-el-recherche]');
  var resume = form.querySelector('[data-el-resume]');
  var groupes = Array.prototype.slice.call(box.querySelectorAll('[data-el-groupe]'));
  function cases(g) { return Array.prototype.slice.call(g.querySelectorAll('input[name=eleves]')); }
  function majGroupe(g) {
    var cs = cases(g), n = cs.filter(function (c) { return c.checked; }).length, t = g.querySelector('[data-el-toute-classe]');
    t.checked = n === cs.length; t.indeterminate = n > 0 && n < cs.length;
  }
  function majResume() {
    var n = box.querySelectorAll('input[name=eleves]:checked').length;
    resume.textContent = n ? n + ' élève(s) sélectionné(s).' : 'Aucun élève sélectionné.';
  }
  function filtrer() {
    var cl = filtreClasse.value, terme = recherche.value.trim().toLowerCase();
    groupes.forEach(function (g) {
      var visibles = 0;
      Array.prototype.forEach.call(g.querySelectorAll('[data-el-nom]'), function (l) {
        var ok = !terme || l.getAttribute('data-el-nom').indexOf(terme) !== -1; l.hidden = !ok; if (ok) visibles++;
      });
      g.hidden = (cl && g.getAttribute('data-el-groupe') !== cl) || visibles === 0;
    });
  }
  groupes.forEach(function (g) {
    g.querySelector('[data-el-toute-classe]').addEventListener('change', function (e) {
      cases(g).forEach(function (c) { if (!c.closest('[data-el-nom]').hidden) c.checked = e.target.checked; });
      majGroupe(g); majResume();
    });
    g.addEventListener('change', function (e) { if (e.target.name === 'eleves') { majGroupe(g); majResume(); } });
  });
  filtreClasse.addEventListener('change', filtrer);
  recherche.addEventListener('input', filtrer);
  majResume();
})();
/* Filtre de liste déroulante : <input data-filtre-select="#id-du-select"> */
document.querySelectorAll('[data-filtre-select]').forEach(function (inp) {
  var sel = document.querySelector(inp.getAttribute('data-filtre-select'));
  if (!sel) return;
  var tout = Array.prototype.map.call(sel.options, function (o) { return { v: o.value, t: o.textContent }; });
  inp.addEventListener('input', function () {
    var terme = inp.value.trim().toLowerCase(), courant = sel.value;
    sel.innerHTML = '';
    tout.forEach(function (o, i) {
      if (i === 0 || !terme || o.t.toLowerCase().indexOf(terme) !== -1) { var e = document.createElement('option'); e.value = o.v; e.textContent = o.t; sel.appendChild(e); }
    });
    sel.value = courant; if (sel.value !== courant) sel.selectedIndex = 0;
    if (terme && sel.options.length === 2) sel.selectedIndex = 1;   // une seule correspondance : elle est choisie
  });
});
/* Soin programmé : afficher les jours seulement pour un soin récurrent */
(function () {
  var mode = document.querySelector('[data-mode-soin]'), rec = document.querySelector('[data-recurrence]');
  if (mode && rec) { var maj = function () { rec.hidden = mode.value !== 'recurrent'; }; mode.addEventListener('change', maj); maj(); }
})();
/* Pyramide des âges : infobulle au survol et au clavier (les valeurs figurent aussi dans le tableau) */
(function () {
  var zone = document.querySelector('[data-pyramide]');
  if (!zone) return;
  var tip = document.createElement('div'); tip.className = 'tooltip'; tip.hidden = true; document.body.appendChild(tip);
  function ligne(cle, libelle, valeur) {
    var l = document.createElement('div'); l.className = 'tt-ligne';
    var k = document.createElement('span'); k.className = 'tt-cle'; if (cle) k.style.background = cle; else k.style.visibility = 'hidden';
    var t = document.createElement('span'); t.textContent = libelle;
    var v = document.createElement('span'); v.className = 'tt-val'; v.textContent = valeur;
    l.appendChild(k); l.appendChild(t); l.appendChild(v); return l;
  }
  function afficher(r) {
    tip.textContent = '';
    var t = document.createElement('div'); t.className = 'tt-titre'; t.textContent = r.getAttribute('data-age') + ' ans'; tip.appendChild(t);
    tip.appendChild(ligne('var(--serie-m)', 'Garçons', r.getAttribute('data-m')));
    tip.appendChild(ligne('var(--serie-f)', 'Filles', r.getAttribute('data-f')));
    if (+r.getAttribute('data-nr')) tip.appendChild(ligne(null, 'Non précisé', r.getAttribute('data-nr')));
    tip.appendChild(ligne(null, 'Total', r.getAttribute('data-total')));
    tip.hidden = false;
  }
  function placer(x, y) {
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(x + 14, window.innerWidth - w - 8)) + 'px';
    tip.style.top = Math.max(8, Math.min(y + 14, window.innerHeight - h - 8)) + 'px';
  }
  zone.querySelectorAll('.py-rang').forEach(function (r) {
    r.addEventListener('pointerenter', function () { afficher(r); });
    r.addEventListener('pointermove', function (e) { placer(e.clientX, e.clientY); });
    r.addEventListener('pointerleave', function () { tip.hidden = true; });
    r.addEventListener('focus', function () { afficher(r); var b = r.getBoundingClientRect(); placer(b.left + b.width / 2, b.top); });
    r.addEventListener('blur', function () { tip.hidden = true; });
  });
})();
/* Absences : la liste des motifs suit le type (absence / indisponibilité) ; « Autre » rend la saisie libre obligatoire */
(function () {
  var motifs = document.querySelector('[data-motifs]'), type = document.querySelector('[data-type-absence]'), libre = document.querySelector('[data-motif-libre]');
  if (!motifs || !type) return;
  var listes = { absence: JSON.parse(motifs.getAttribute('data-motifs-absence')), indisponibilite: JSON.parse(motifs.getAttribute('data-motifs-indispo')) };
  function remplir() {
    motifs.innerHTML = '';
    listes[type.value].forEach(function (m) { var o = document.createElement('option'); o.textContent = m; motifs.appendChild(o); });
    majLibre();
  }
  function majLibre() {
    var autre = /^Autre/.test(motifs.value);
    libre.required = autre;
    libre.placeholder = autre ? 'Précisez le motif' : 'Facultatif (ex. grippe, jury du bac…)';
  }
  type.addEventListener('change', remplir);
  motifs.addEventListener('change', majLibre);
  majLibre();
})();
/* Planning du personnel : clic sur une plage = modifier / supprimer / copier ; clic sur une zone vide = créer à l'heure cliquée */
(function () {
  var grille = document.querySelector('[data-pg]'), panneau = document.querySelector('[data-panneau]');
  if (!grille || !panneau) return;
  var debutAxe = +grille.getAttribute('data-debut'), finAxe = +grille.getAttribute('data-fin');
  var jourCourant = grille.getAttribute('data-jour');
  var champ = function (n) { return panneau.querySelector('[data-champ=' + n + ']'); };
  var titre = panneau.querySelector('[data-pg-titre]'), bEnreg = panneau.querySelector('[data-pg-enregistrer]');
  var bSuppr = panneau.querySelector('[data-pg-supprimer]'), bCopier = panneau.querySelector('[data-pg-copier]'), copie = panneau.querySelector('[data-pg-copie]');
  var url = function (cle, id) { return grille.getAttribute('data-url-' + cle).replace(/0$/, id).replace('/0/', '/' + id + '/'); };
  var hhmm = function (m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); };
  var courant = null;

  function ouvrir() { panneau.hidden = false; panneau.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  function marquer(bloc) {
    grille.querySelectorAll('.pg-bloc.actif').forEach(function (b) { b.classList.remove('actif'); });
    if (bloc) bloc.classList.add('actif');
  }
  function nouveau(agent, debutMin) {
    courant = null; marquer(null);
    titre.textContent = 'Nouvelle plage';
    champ('agent').value = agent; champ('jour').value = jourCourant;
    champ('debut').value = hhmm(debutMin); champ('fin').value = hhmm(Math.min(debutMin + 60, finAxe));
    panneau.action = grille.getAttribute('data-url-creer');
    bEnreg.textContent = 'Ajouter'; bSuppr.hidden = true; copie.hidden = true; ouvrir();
  }
  function modifier(bloc) {
    courant = bloc.getAttribute('data-id'); marquer(bloc);
    titre.textContent = 'Modifier la plage';
    champ('agent').value = bloc.getAttribute('data-agent'); champ('poste').value = bloc.getAttribute('data-poste'); champ('jour').value = jourCourant;
    champ('debut').value = bloc.getAttribute('data-debut'); champ('fin').value = bloc.getAttribute('data-fin');
    panneau.action = url('modifier', courant);
    bEnreg.textContent = 'Enregistrer'; bSuppr.hidden = false; copie.hidden = false;
    bSuppr.setAttribute('formaction', url('supprimer', courant)); bCopier.setAttribute('formaction', url('copier', courant));
    panneau.querySelectorAll('[name^=copie_jour_]').forEach(function (c) { c.checked = false; });
    ouvrir();
  }
  grille.addEventListener('click', function (e) {
    var bloc = e.target.closest('.pg-bloc');
    if (bloc) { modifier(bloc); return; }
    var piste = e.target.closest('.pg-piste[data-agent]');
    if (piste) {
      var r = piste.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      nouveau(piste.getAttribute('data-agent'), Math.round((debutAxe + x * (finAxe - debutAxe)) / 15) * 15);
    }
  });
  panneau.querySelector('[data-pg-fermer]').addEventListener('click', function () { panneau.hidden = true; marquer(null); });
  bSuppr.addEventListener('click', function (e) { if (!confirm('Supprimer cette plage ?')) e.preventDefault(); });
  panneau.setAttribute('action', grille.getAttribute('data-url-creer'));
})();

/* Trombinoscope : réduit la photo choisie (400 px max, JPEG) puis envoie le formulaire */
document.querySelectorAll('input[data-photo]').forEach(function (inp) {
  inp.addEventListener('change', function () {
    var f = inp.files[0], form = inp.form;
    if (!f) return;
    var envoyer = function () { form.submit(); };
    var img = new Image(), url = URL.createObjectURL(f);
    img.onload = function () {
      try {
        var k = Math.min(1, 400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) {
          if (b) { var dt = new DataTransfer(); dt.items.add(new File([b], 'photo.jpg', { type: 'image/jpeg' })); inp.files = dt.files; }
          envoyer();
        }, 'image/jpeg', 0.85);
      } catch (e) { envoyer(); }
    };
    img.onerror = envoyer;
    img.src = url;
  });
});

/* Menu latéral : cartes dépliables (état mémorisé dans le navigateur ; la carte de la page courante reste ouverte) */
(function () {
  var nav = document.querySelector('nav.side');
  if (!nav) return;
  var cle = 'vsp_menu', etat = {};
  try { etat = JSON.parse(localStorage.getItem(cle) || '{}'); } catch (e) { etat = {}; }
  var sauver = function () { try { localStorage.setItem(cle, JSON.stringify(etat)); } catch (e) { /* stockage indisponible : sans conséquence */ } };
  var cartes = [];
  nav.querySelectorAll('.nav-carte').forEach(function (carte) {
    var h = carte.querySelector('h4'), corps = carte.querySelector('.nav-groupe'), titre = h.textContent.trim();
    h.setAttribute('role', 'button'); h.tabIndex = 0;
    var regler = function (ouvert) { corps.hidden = !ouvert; carte.classList.toggle('ouverte', ouvert); h.setAttribute('aria-expanded', ouvert ? 'true' : 'false'); };
    var courant = !!corps.querySelector('a.on');
    regler(courant || (etat[titre] === undefined ? h.hasAttribute('data-ouvert') : etat[titre] === true));
    var bascule = function () { var ouvert = corps.hidden; regler(ouvert); etat[titre] = ouvert; sauver(); };
    h.addEventListener('click', bascule);
    h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bascule(); } });
    cartes.push({ carte: carte, regler: regler, titre: titre });
  });
  if (cartes.length > 1) {
    var outils = document.createElement('div'); outils.className = 'nav-outils';
    [['Tout déplier', true], ['Tout replier', false]].forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = o[0];
      b.addEventListener('click', function () { cartes.forEach(function (c) { c.regler(o[1]); etat[c.titre] = o[1]; }); sauver(); });
      outils.appendChild(b);
    });
    nav.insertBefore(outils, cartes[0].carte);
  }
})();

/* Téléphone : bouton « Menu » qui ouvre / ferme le menu latéral */
(function () {
  var nav = document.querySelector('nav.side');
  if (!nav) return;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'menu-btn'; b.textContent = 'Menu'; b.setAttribute('aria-expanded', 'false');
  b.addEventListener('click', function () {
    var o = nav.classList.toggle('ouvert');
    b.textContent = o ? 'Fermer' : 'Menu'; b.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  var logo = nav.querySelector('.logo');
  nav.insertBefore(b, logo ? logo.nextSibling : nav.firstChild);
})();

/* Trombinoscope : filtrage instantané pendant la frappe (la recherche serveur reste disponible avec Entrée) */
(function () {
  var champ = document.querySelector('[data-tromb-recherche]');
  if (!champ) return;
  var fiches = document.querySelectorAll('[data-tromb-fiche]'), groupes = document.querySelectorAll('[data-tromb-groupe]'), compte = document.querySelector('[data-tromb-compte]');
  var norm = function (t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
  fiches.forEach(function (f) { f.setAttribute('data-texte', norm(f.textContent)); });
  champ.addEventListener('input', function () {
    var mots = norm(champ.value).split(/\s+/).filter(Boolean), n = 0;
    fiches.forEach(function (f) {
      var ok = mots.every(function (m) { return f.getAttribute('data-texte').indexOf(m) !== -1; });
      f.hidden = !ok; if (ok) n++;
    });
    groupes.forEach(function (g) { g.hidden = !g.querySelector('[data-tromb-fiche]:not([hidden])'); });
    if (compte) compte.textContent = n + ' personne' + (n > 1 ? 's' : '') + (champ.value.trim() ? ' pour « ' + champ.value.trim() + ' »' : '') + '.';
  });
})();

/* Page Classes : filtre par niveau, tout déplier / replier */
(function () {
  var barre = document.querySelector('.filtre-niveaux');
  if (!barre) return;
  var blocs = document.querySelectorAll('.niv-bloc');
  barre.querySelectorAll('button[data-niv]').forEach(function (b) {
    b.addEventListener('click', function () {
      barre.querySelectorAll('button[data-niv]').forEach(function (x) { x.classList.toggle('on', x === b); });
      blocs.forEach(function (bl) { bl.hidden = !!b.getAttribute('data-niv') && bl.getAttribute('data-niveau') !== b.getAttribute('data-niv'); });
    });
  });
  var tout = function (ouvert) { document.querySelectorAll('.classe-carte').forEach(function (d) { d.open = ouvert; }); };
  barre.querySelector('[data-ouvrir-tout]').addEventListener('click', function () { tout(true); });
  barre.querySelector('[data-fermer-tout]').addEventListener('click', function () { tout(false); });
})();
/* Saisie des fiches élèves : champs vides repérés, statut et jauge en direct, filtre « à compléter », contrôles de saisie, alerte avant de perdre des modifications */
(function () {
  var form = document.querySelector('form[data-saisie]');
  if (!form) return;
  var modifie = false, etat = form.querySelector('[data-etat]');
  var lignes = Array.prototype.slice.call(form.querySelectorAll('tr[data-ligne]'));
  var jauge = document.querySelector('[data-jauge]'), nb = document.querySelector('[data-complets]');
  var req = function (tr) { return Array.prototype.slice.call(tr.querySelectorAll('[data-req]')); };
  var vue = 'tous';
  function majLigne(tr) {
    var champs = req(tr), vides = 0;
    champs.forEach(function (c) { var v = !String(c.value).trim(); c.classList.toggle('vide', v); if (v) vides++; });
    var ok = vides === 0, st = tr.querySelector('[data-statut]');
    tr.setAttribute('data-complet', ok ? '1' : '0');
    if (st) { st.textContent = ok ? 'Complète' : 'À faire'; st.className = 'statut ' + (ok ? 'ok' : 'a-faire'); }
    return ok;
  }
  function compter() {
    var n = lignes.filter(function (tr) { return tr.getAttribute('data-complet') === '1'; }).length;
    if (nb) nb.textContent = n;
    if (jauge && lignes.length) jauge.style.width = Math.round(100 * n / lignes.length) + '%';
  }
  function filtrer() { lignes.forEach(function (tr) { tr.hidden = vue === 'incomplets' && tr.getAttribute('data-complet') === '1'; }); }
  lignes.forEach(majLigne); compter();
  var valide = function (c) {
    var v = c.value.trim(), ko = false;
    if (c.type === 'email' && v) ko = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
    if (c.type === 'tel' && v) ko = !/^[0-9 +().-]{6,20}$/.test(v);
    if (c.name && c.name.indexOf('code_postal_') === 0 && v) ko = !/^[0-9A-Za-z -]{3,10}$/.test(v);
    c.classList.toggle('invalide', ko);
  };
  var change = function (e) {
    modifie = true; if (etat) etat.textContent = 'Modifications non enregistrées.';
    var tr = e.target.closest && e.target.closest('tr[data-ligne]'); if (tr) majLigne(tr);
    valide(e.target); compter();
  };
  form.addEventListener('input', change); form.addEventListener('change', change);
  form.addEventListener('submit', function (e) {
    if (form.querySelector('.invalide')) { e.preventDefault(); alert('Corrigez les champs en rouge (e-mail, téléphone ou code postal) avant d\'enregistrer.'); return; }
    modifie = false;
  });
  window.addEventListener('beforeunload', function (e) { if (modifie) { e.preventDefault(); e.returnValue = ''; } });
  document.querySelectorAll('.saisie-filtres button').forEach(function (b) {
    b.addEventListener('click', function () {
      vue = b.getAttribute('data-vue');
      document.querySelectorAll('.saisie-filtres button').forEach(function (x) { x.classList.toggle('on', x === b); });
      filtrer();
    });
  });
  var choix = document.querySelector('select[data-autosubmit]');
  if (choix) choix.addEventListener('change', function (e) {
    if (modifie && !confirm('Des modifications ne sont pas enregistrées. Changer de classe les perdra. Continuer ?')) { e.stopImmediatePropagation(); choix.value = new URLSearchParams(location.search).get('classe') || ''; }
  }, true);
})();

document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('button[data-confirm-btn]');
  if (b && !confirm('Supprimer cet élément ?')) e.preventDefault();
});

/* Appel : tout le monde présent, compteur, saisie du retard */
(function () {
  var f = document.querySelector('form[data-appel]');
  if (!f) return;
  var cpt = f.querySelector('[data-compte-appel]');
  var maj = function () {
    var a = 0, r = 0;
    f.querySelectorAll('tr[data-ligne]').forEach(function (tr) {
      var v = (tr.querySelector('input[type=radio]:checked') || {}).value;
      tr.className = 'ligne-' + (v || 'present'); if (v === 'absent') a++; if (v === 'retard') r++;
    });
    if (cpt) cpt.textContent = a + ' absent(s), ' + r + ' retard(s)';
  };
  f.addEventListener('change', maj); maj();
  var b = f.querySelector('[data-tous-presents]');
  if (b) b.addEventListener('click', function () { f.querySelectorAll('input[type=radio][value=present]').forEach(function (x) { x.checked = true; }); maj(); });
})();
/* Liste des absences : tout cocher */
document.addEventListener('change', function (e) {
  if (e.target.hasAttribute && e.target.hasAttribute('data-tout-cocher')) {
    var t = e.target.closest('table'); t.querySelectorAll('input[name=sel]').forEach(function (c) { c.checked = e.target.checked; });
  }
});

/* Compteurs animés du tableau de bord : le chiffre monte jusqu'à sa valeur (sans animation si l'utilisateur la réduit) */
(function () {
  var els = document.querySelectorAll('[data-compte]');
  if (!els.length || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  els.forEach(function (el) {
    var cible = parseInt(el.getAttribute('data-compte'), 10);
    if (!isFinite(cible) || cible < 2) return;
    var debut = null, duree = 700;
    function pas(t) {
      if (debut === null) debut = t;
      var k = Math.min(1, (t - debut) / duree);
      el.textContent = Math.round(cible * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(pas); else el.textContent = cible;
    }
    el.textContent = '0';
    requestAnimationFrame(pas);
  });
})();

/* Recherche rapide d'une personne (élève, professeur, personnel) : filtre local, sans quitter la page ; « Ajouter » coche la personne dans la convocation */
(function () {
  var zone = document.querySelector('[data-recherche-personnes]');
  if (!zone) return;
  var donnees = []; try { donnees = JSON.parse(zone.getAttribute('data-donnees') || '[]'); } catch (e) {}
  var champ = zone.querySelector('[data-rp-champ]'), liste = zone.querySelector('[data-rp-liste]'), compte = zone.querySelector('[data-rp-compte]');
  var filtre = '', LIBELLES = { E: 'Élève', P: 'Professeur', S: 'Personnel' };
  var form = document.querySelector('form[data-convocation]');
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function ajouter(p, bouton) {
    if (!form) return;
    if (p.t === 'E') { var c = form.querySelector('input[name=eleves][value="' + p.id + '"]'); if (c) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } }
    if (p.t === 'P') {
      var s = form.querySelector('[data-conv-profs]'); if (!s) return;
      Array.prototype.forEach.call(s.options, function (o) { if (o.value === String(p.id)) o.selected = true; });
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }
    bouton.textContent = 'Ajouté'; bouton.disabled = true;
  }
  function afficher() {
    var mots = norm(champ.value).split(/\s+/).filter(Boolean);
    if (!mots.length && !filtre) { liste.textContent = ''; compte.textContent = 'Tapez au moins une lettre, ou choisissez Élèves, Professeurs ou Personnel pour voir la liste.'; return; }
    var trouves = donnees.filter(function (p) {
      if (filtre && p.t !== filtre) return false;
      var h = norm(p.n + ' ' + p.d);
      return mots.every(function (m) { return h.indexOf(m) !== -1; });
    });
    compte.textContent = trouves.length + ' résultat(s)' + (trouves.length > 40 ? ' : affinez la recherche pour voir les autres.' : '.');
    liste.textContent = '';
    trouves.slice(0, 40).forEach(function (p) {
      var li = document.createElement('li');
      var tag = document.createElement('span'); tag.className = 'ri-rtag ri-rtag-' + p.t; tag.textContent = LIBELLES[p.t];
      var nom = document.createElement('b'); nom.textContent = p.n;
      var det = document.createElement('span'); det.className = 'mute'; det.textContent = p.d;
      li.appendChild(tag); li.appendChild(nom); li.appendChild(det);
      if (form && (p.t === 'E' || p.t === 'P')) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sec sm'; b.textContent = 'Ajouter à la réunion';
        b.addEventListener('click', function () { ajouter(p, b); }); li.appendChild(b);
      }
      liste.appendChild(li);
    });
  }
  champ.addEventListener('input', afficher);
  zone.querySelectorAll('[data-rp-filtre]').forEach(function (b) {
    b.addEventListener('click', function () {
      filtre = b.getAttribute('data-rp-filtre');
      zone.querySelectorAll('[data-rp-filtre]').forEach(function (x) { x.classList.toggle('on', x === b); });
      afficher();
    });
  });
  afficher();
})();

/* Brouillon : ce qui est saisi dans un formulaire [data-brouillon] est mémorisé dans ce navigateur (7 jours) et restauré au retour ; effacé à l'envoi */
(function () {
  var forms = document.querySelectorAll('form[data-brouillon]');
  forms.forEach(function (form) {
    var cle = 'vsp-brouillon:' + form.getAttribute('data-brouillon'), minuteur = 0;
    function lire() { try { return JSON.parse(localStorage.getItem(cle) || 'null'); } catch (e) { return null; } }
    function effacerStock() { try { localStorage.removeItem(cle); } catch (e) {} }
    function champs() { return Array.prototype.filter.call(form.elements, function (el) { return el.name && el.name.charAt(0) !== '_' && el.type !== 'file' && el.type !== 'password' && el.type !== 'hidden' && el.type !== 'button' && el.type !== 'submit'; }); }
    function sauver() {
      var vals = [];
      champs().forEach(function (el) {
        if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) vals.push([el.name, el.value]); }
        else if (el.tagName === 'SELECT' && el.multiple) { Array.prototype.forEach.call(el.options, function (o) { if (o.selected) vals.push([el.name, o.value]); }); }
        else if (el.value) vals.push([el.name, el.value]);
      });
      try { if (vals.length) localStorage.setItem(cle, JSON.stringify({ t: Date.now(), v: vals })); else localStorage.removeItem(cle); } catch (e) {}
    }
    function restaurer(d) {
      var par = {}; d.v.forEach(function (p) { (par[p[0]] = par[p[0]] || []).push(p[1]); });
      var els = champs();
      els.sort(function (a, b) { return (b.hasAttribute('data-conv-classes') ? 1 : 0) - (a.hasAttribute('data-conv-classes') ? 1 : 0); });   // les classes d'abord : elles cochent des professeurs, que l'on rectifie ensuite
      els.forEach(function (el) {
        var v = par[el.name]; if (!v) return;
        if (el.type === 'checkbox' || el.type === 'radio') { if (v.indexOf(el.value) !== -1) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } }
        else if (el.tagName === 'SELECT' && el.multiple) { Array.prototype.forEach.call(el.options, function (o) { o.selected = v.indexOf(o.value) !== -1; }); el.dispatchEvent(new Event('change', { bubbles: true })); }
        else if (el.tagName === 'SELECT') { el.value = v[0]; el.dispatchEvent(new Event('change', { bubbles: true })); }
        else { el.value = v[0]; el.dispatchEvent(new Event('input', { bubbles: true })); }
      });
    }
    var d = lire();
    if (d && d.v && Date.now() - d.t < 7 * 86400000) {
      restaurer(d);
      var bandeau = document.createElement('div'); bandeau.className = 'al info noprint';
      bandeau.appendChild(document.createTextNode('Brouillon retrouvé : ce que vous aviez saisi (' + new Date(d.t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) + ') a été restauré. '));
      var b = document.createElement('button'); b.type = 'button'; b.className = 'sec sm'; b.textContent = 'Effacer le brouillon';
      b.addEventListener('click', function () { effacerStock(); location.reload(); });
      bandeau.appendChild(b); form.parentNode.insertBefore(bandeau, form);
    }
    var planifier = function () { clearTimeout(minuteur); minuteur = setTimeout(sauver, 300); };
    form.addEventListener('input', planifier); form.addEventListener('change', planifier);
    form.addEventListener('submit', effacerStock);
  });
})();

/* Accessibilité : associe chaque étiquette à son champ, nomme les champs sans étiquette, rend les tableaux défilants accessibles au clavier */
(function () {
  var n = 0;
  function champ(el) { return /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.type !== 'hidden'; }
  document.querySelectorAll('label:not([for])').forEach(function (l) {
    if (l.querySelector('input,select,textarea')) return;
    var c = l.nextElementSibling, pas = 0;
    while (c && pas < 3 && !champ(c)) {
      if (c.tagName === 'LABEL') { c = null; break; }
      var dedans = c.querySelector && c.querySelector('input:not([type=hidden]),select,textarea');
      if (dedans) { c = dedans; break; }
      c = c.nextElementSibling; pas++;
    }
    if (!c || !champ(c)) return;
    if (!c.id) c.id = 'vsp-champ-' + (++n);
    if (document.querySelectorAll('label[for="' + c.id + '"]').length === 0) l.htmlFor = c.id;
  });
  document.querySelectorAll('input,select,textarea').forEach(function (c) {
    if (c.type === 'hidden' || c.type === 'submit' || c.type === 'button' || c.type === 'checkbox' || c.type === 'radio') return;
    if (c.labels && c.labels.length) return;
    if (c.getAttribute('aria-label') || c.getAttribute('aria-labelledby')) return;
    var nom = c.getAttribute('placeholder') || c.getAttribute('title') || c.getAttribute('name');
    if (nom) c.setAttribute('aria-label', nom.replace(/[_-]+/g, ' '));
  });
  function defilants() {
    document.querySelectorAll('.scroll').forEach(function (z) {
      if (z.scrollWidth > z.clientWidth + 1 || z.scrollHeight > z.clientHeight + 1) { z.setAttribute('tabindex', '0'); if (!z.getAttribute('role')) { z.setAttribute('role', 'region'); z.setAttribute('aria-label', 'Tableau défilant'); } }
    });
  }
  defilants(); window.addEventListener('resize', defilants);
})();
