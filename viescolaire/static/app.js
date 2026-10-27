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
