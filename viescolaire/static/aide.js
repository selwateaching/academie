/* Assistant d'aide : bulle flottante « Besoin d'aide ? », conversation conservée pendant la navigation (cet onglet seulement) */
(function () {
  'use strict';
  var zone = document.querySelector('[data-aide]');
  if (!zone) return;
  var bouton = zone.querySelector('[data-aide-ouvrir]');
  var url = zone.getAttribute('data-url'), pageAide = zone.getAttribute('data-page'), csrf = zone.getAttribute('data-csrf');
  var puces = []; try { puces = JSON.parse(zone.getAttribute('data-puces') || '[]'); } catch (e) {}
  var CLE = 'vsp-aide-conversation';
  var historique = [];
  try { historique = JSON.parse(sessionStorage.getItem(CLE) || '[]'); } catch (e) {}

  var panneau = document.createElement('section');
  panneau.id = 'aide-panneau'; panneau.className = 'aide-panneau'; panneau.hidden = true; panneau.setAttribute('role', 'dialog'); panneau.setAttribute('aria-label', 'Assistant d\'aide');
  var tete = document.createElement('header'); tete.className = 'aide-tete';
  var titre = document.createElement('b'); titre.textContent = 'Assistant d\'aide';
  var guide = document.createElement('a'); guide.href = pageAide; guide.textContent = 'Tous les guides'; guide.className = 'aide-lien-guides';
  var fermer = document.createElement('button'); fermer.type = 'button'; fermer.className = 'aide-fermer'; fermer.textContent = '✕'; fermer.setAttribute('aria-label', 'Fermer l\'aide');
  tete.appendChild(titre); tete.appendChild(guide); tete.appendChild(fermer);
  var fil = document.createElement('div'); fil.className = 'aide-fil'; fil.setAttribute('aria-live', 'polite');
  var suggestions = document.createElement('div'); suggestions.className = 'aide-puces';
  var form = document.createElement('form'); form.className = 'aide-saisie'; form.autocomplete = 'off';
  var champ = document.createElement('input'); champ.type = 'text'; champ.maxLength = 300; champ.placeholder = 'Posez votre question…'; champ.setAttribute('aria-label', 'Votre question');
  var envoi = document.createElement('button'); envoi.type = 'submit'; envoi.textContent = 'Envoyer';
  form.appendChild(champ); form.appendChild(envoi);
  var note = document.createElement('p'); note.className = 'aide-note'; note.textContent = 'N\'écrivez pas de noms d\'élèves : décrivez seulement ce que vous voulez faire.';
  panneau.appendChild(tete); panneau.appendChild(fil); panneau.appendChild(suggestions); panneau.appendChild(form); panneau.appendChild(note);
  zone.appendChild(panneau);

  function sauver() { try { sessionStorage.setItem(CLE, JSON.stringify(historique.slice(-12))); } catch (e) {} }
  function defiler() { fil.scrollTop = fil.scrollHeight; }
  function bulle(qui, texte) {
    var b = document.createElement('div'); b.className = 'aide-bulle aide-' + qui; b.textContent = texte; fil.appendChild(b); return b;
  }
  function fiche(f) {
    var c = document.createElement('div'); c.className = 'aide-carte';
    var t = document.createElement('b'); t.textContent = f.titre; c.appendChild(t);
    var ol = document.createElement('ol'); f.pas.forEach(function (p) { var li = document.createElement('li'); li.textContent = p; ol.appendChild(li); }); c.appendChild(ol);
    if (f.menu) { var m = document.createElement('p'); m.className = 'mute'; m.textContent = 'Dans le menu : ' + f.menu; c.appendChild(m); }
    if (f.url && f.url.charAt(0) === '/') { var a = document.createElement('a'); a.href = f.url; a.className = 'btn sm'; a.textContent = 'Ouvrir la page'; c.appendChild(a); }
    fil.appendChild(c);
  }
  function rendre(m) {
    if (m.qui === 'moi') { bulle('moi', m.texte); return; }
    bulle('bot', m.texte);
    (m.fiches || []).forEach(fiche);
    if (m.themes && m.themes.length) poserPuces(m.themes);
  }
  function poserPuces(liste) {
    suggestions.textContent = '';
    liste.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'sec sm'; b.textContent = t;
      b.addEventListener('click', function () { demander(t); }); suggestions.appendChild(b);
    });
  }
  function demander(q) {
    q = (q || '').trim(); if (!q) return;
    champ.value = ''; historique.push({ qui: 'moi', texte: q }); bulle('moi', q); defiler();
    var attente = bulle('bot', 'Je cherche…'); attente.classList.add('aide-attente');
    var fd = new FormData(); fd.append('_csrf', csrf); fd.append('q', q);
    fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} return { ok: r.ok, status: r.status, j: j }; }); })
      .then(function (res) {
        attente.remove();
        var m = res.j && res.j.texte ? { qui: 'bot', texte: res.j.texte, fiches: res.j.fiches || [], themes: res.j.themes || [] }
          : { qui: 'bot', texte: res.status === 400 ? ((res.j && res.j.erreur) || 'Page à recharger (Ctrl+F5), puis réessayez.') : 'Je n\'ai pas pu répondre. Rechargez la page et réessayez.', fiches: [] };
        historique.push(m); rendre(m); sauver(); defiler();
      }).catch(function () { attente.remove(); var m = { qui: 'bot', texte: 'Connexion impossible pour le moment. Vérifiez votre connexion et réessayez.', fiches: [] }; historique.push(m); rendre(m); sauver(); });
  }
  function ouvrir(oui) {
    panneau.hidden = !oui; bouton.setAttribute('aria-expanded', oui ? 'true' : 'false');
    zone.classList.toggle('ouvert', oui);
    if (oui) {
      if (!fil.childNodes.length) {
        if (!historique.length) historique.push({ qui: 'bot', texte: 'Bonjour ! Je suis l\'assistant d\'aide. Dites-moi avec vos mots ce que vous voulez faire, par exemple « comment ajouter un professeur ? ». Je vous guide pas à pas.', fiches: [] });
        historique.forEach(rendre);
      }
      if (!suggestions.childNodes.length) poserPuces(puces);
      defiler(); champ.focus();
    } else { bouton.focus(); }
  }
  bouton.addEventListener('click', function () { ouvrir(panneau.hidden); });
  fermer.addEventListener('click', function () { ouvrir(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panneau.hidden) ouvrir(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); demander(champ.value); });

  // Page « Aide et premiers pas » : filtre des guides
  var filtre = document.querySelector('[data-aide-filtre]');
  if (filtre) {
    filtre.addEventListener('input', function () {
      var mots = filtre.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean), vus = 0;
      document.querySelectorAll('[data-aide-fiche]').forEach(function (f) {
        var t = (f.getAttribute('data-texte') || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
        var ok = mots.every(function (m) { return t.indexOf(m) !== -1; }); f.hidden = !ok; if (ok) { vus++; if (mots.length) f.open = true; }
      });
      document.querySelectorAll('[data-aide-cat]').forEach(function (c) { c.hidden = !c.querySelector('[data-aide-fiche]:not([hidden])'); });
      var v = document.querySelector('[data-aide-vide]'); if (v) v.hidden = vus > 0 || !mots.length;
    });
  }
})();
