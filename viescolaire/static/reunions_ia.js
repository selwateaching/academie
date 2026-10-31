/* Réunions intelligentes : enregistrement du micro avec sauvegarde progressive sur le serveur, suivi des tâches, insertion de noms.
   Aucune bibliothèque externe. L'audio est envoyé par morceaux de 5 s : en cas de coupure, ce qui a été reçu est conservé. */
(function () {
  'use strict';

  // Ouvre le volet « Nouvelle réunion » depuis le bouton du haut
  document.querySelectorAll('[data-ouvrir]').forEach(function (a) {
    a.addEventListener('click', function () {
      var d = document.getElementById(a.getAttribute('data-ouvrir'));
      if (d && d.tagName === 'DETAILS') d.open = true;
    });
  });

  // Insère un nom d'intervenant à la position du curseur dans la transcription
  var zone = document.querySelector('[data-ri-texte]');
  document.querySelectorAll('[data-insere]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!zone) return;
      var t = b.getAttribute('data-insere'), d = zone.selectionStart || 0, f = zone.selectionEnd || 0;
      zone.value = zone.value.slice(0, d) + t + zone.value.slice(f);
      zone.focus(); zone.selectionStart = zone.selectionEnd = d + t.length;
    });
  });

  // Suivi d'une transcription ou d'une rédaction en cours : recharge la page quand c'est terminé
  var suivi = document.querySelector('[data-ri-suivi]');
  if (suivi) {
    var attend = suivi.getAttribute('data-attend');
    (function boucle() {
      fetch(suivi.getAttribute('data-url'), { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (e) {
        var p = suivi.querySelector('[data-progres]');
        if (p && e.parties) p.textContent = '(' + e.transcrites + ' partie(s) sur ' + e.parties + ')';
        if (e[attend] !== 'en_cours') { location.reload(); return; }
        setTimeout(boucle, 3000);
      }).catch(function () { setTimeout(boucle, 6000); });
    })();
  }

  var rec = document.querySelector('[data-ri-enregistreur]');
  if (!rec) return;
  var $ = function (s) { return rec.querySelector(s); };
  var bouton = function (a) { return rec.querySelector('[data-act="' + a + '"]'); };
  var chrono = $('[data-chrono]'), voyant = $('[data-voyant]'), etatTxt = $('[data-etat-texte]'), niveau = $('[data-niveau]'),
      microTxt = $('[data-micro-texte]'), msg = $('[data-msg]');
  var csrf = rec.getAttribute('data-csrf');
  var urlNouveau = rec.getAttribute('data-url-nouveau');
  var urlMorceau = rec.getAttribute('data-url-morceau'), urlFin = rec.getAttribute('data-url-fin');

  var etat = 'inactif';           // inactif | enregistre | pause | termine
  var flux = null, enr = null, ctx = null, analyseur = null, donnees = null, rafId = 0, mime = '';
  var partieId = null, seq = 0, file = [], envoiEnCours = false, termineEnvoye = false, hors = false;
  var cumul = 0, debutSegment = 0, tick = 0, dernierSon = 0, verrou = null, rotation = 0;
  var ROTATION_MS = 50 * 60 * 1000;   // une nouvelle partie toutes les 50 min : chaque fichier reste sous la limite des services de transcription

  function dire(texte, type) { msg.textContent = texte || ''; msg.className = 'ri-msg' + (type ? ' ' + type : ''); }
  function montrer(el, oui) { el.hidden = !oui; }
  function dureeS() { return Math.floor((cumul + (etat === 'enregistre' ? Date.now() - debutSegment : 0)) / 1000); }
  function format(s) { function d(n) { return (n < 10 ? '0' : '') + n; } return d(Math.floor(s / 3600)) + ':' + d(Math.floor(s / 60) % 60) + ':' + d(s % 60); }
  function majBoutons() {
    montrer(bouton('demarrer'), etat === 'inactif' || etat === 'termine');
    montrer(bouton('pause'), etat === 'enregistre');
    montrer(bouton('reprendre'), etat === 'pause');
    montrer(bouton('arreter'), etat === 'enregistre' || etat === 'pause');
    rec.setAttribute('data-etat', etat);
    voyant.className = 'ri-voyant' + (etat === 'enregistre' ? ' rec' : etat === 'pause' ? ' pause' : '');
    etatTxt.textContent = { inactif: 'Prêt à enregistrer', enregistre: 'Enregistrement en cours', pause: 'En pause', termine: 'Enregistrement terminé' }[etat];
  }
  function choisirMime() {
    var c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (var i = 0; i < c.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i];
    return '';
  }
  function post(url, formData) { return fetch(url, { method: 'POST', body: formData, credentials: 'same-origin' }); }
  function urlPartie(base) { return base.replace('/audio/0/', '/audio/' + partieId + '/'); }

  // ── Envoi des morceaux (file d'attente avec reprise automatique) ──
  function pomper() {
    if (envoiEnCours || !partieId) return;
    if (!file.length) { if (termineEnvoye === 'demande') finaliser(); return; }
    envoiEnCours = true;
    var m = file[0], fd = new FormData();
    fd.append('_csrf', csrf); fd.append('seq', m.seq); fd.append('morceau', m.blob, 'morceau');
    post(urlPartie(urlMorceau), fd).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
    }).then(function (res) {
      envoiEnCours = false;
      if (res.ok || (res.status === 409 && res.j.attendu !== undefined && res.j.attendu > m.seq)) {
        file.shift(); if (hors) { hors = false; dire('Connexion rétablie : envoi en cours.', 'ok'); }
        pomper();
      } else if (res.status === 409 && res.j.attendu !== undefined) {
        dire('Incohérence d\'envoi (morceau ' + res.j.attendu + ' attendu). Arrêtez puis redémarrez : une nouvelle partie sera créée.', 'err');
      } else if (res.status === 413 || res.status === 403 || res.status === 404 || res.status === 400) {
        dire(res.j.erreur || 'Le serveur a refusé l\'enregistrement.', 'err'); arreter(true);
      } else { reessayer(); }
    }).catch(reessayer);
  }
  function reessayer() {
    envoiEnCours = false; hors = true;
    dire('Connexion perdue : l\'enregistrement continue sur cet appareil et sera envoyé au retour du réseau (' + file.length + ' morceau(x) en attente). Gardez la page ouverte.', 'warn');
    setTimeout(pomper, 4000);
  }
  window.addEventListener('online', function () { if (file.length) pomper(); });

  function finaliser() {
    if (!partieId || termineEnvoye === true) return;
    termineEnvoye = true;
    var fd = new FormData(); fd.append('_csrf', csrf); fd.append('duree', dureeS());
    post(urlPartie(urlFin), fd).then(function () {
      dire('Enregistrement terminé et sauvegardé. Passez à l\'étape 3 pour la transcription.', 'ok');
      setTimeout(function () { location.hash = '#transcription'; location.reload(); }, 1200);
    }).catch(function () { termineEnvoye = false; setTimeout(finaliser, 3000); });
  }

  // ── Micro : niveau sonore ──
  function mesurer() {
    if (!analyseur) return;
    analyseur.getByteTimeDomainData(donnees);
    var max = 0;
    for (var i = 0; i < donnees.length; i++) { var v = Math.abs(donnees[i] - 128) / 128; if (v > max) max = v; }
    var pct = Math.min(100, Math.round(max * 220));
    niveau.style.width = (etat === 'enregistre' ? pct : 0) + '%';
    if (etat === 'enregistre') {
      if (pct > 6) { dernierSon = Date.now(); microTxt.textContent = 'Micro actif : voix captée'; microTxt.className = 'mute'; }
      else if (Date.now() - dernierSon > 10000) { microTxt.textContent = 'Aucun son depuis 10 s : vérifiez le micro et le volume'; microTxt.className = 'ri-alerte'; }
    } else if (etat === 'pause') { microTxt.textContent = 'Micro en pause'; microTxt.className = 'mute'; }
    rafId = requestAnimationFrame(mesurer);
  }

  function erreurMicro(e) {
    var n = e && e.name;
    if (n === 'NotAllowedError' || n === 'SecurityError') dire('Accès au micro refusé. Autorisez le micro pour ce site (icône de cadenas dans la barre d\'adresse), puis réessayez.', 'err');
    else if (n === 'NotFoundError' || n === 'OverconstrainedError') dire('Aucun micro détecté. Branchez un micro ou vérifiez qu\'il n\'est pas utilisé par une autre application.', 'err');
    else if (n === 'NotReadableError') dire('Le micro est occupé par une autre application : fermez-la puis réessayez.', 'err');
    else dire('Impossible de démarrer l\'enregistrement : ' + (e && e.message ? e.message : 'erreur inconnue') + '.', 'err');
  }

  function nouvelleSession() {
    return post(urlNouveau, (function () { var fd = new FormData(); fd.append('_csrf', csrf); fd.append('mime', mime); return fd; })())
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.erreur || 'Refus du serveur'); return j; }); })
      .then(function (j) { partieId = j.id; seq = 0; file = []; termineEnvoye = false; });
  }

  function lancerEnregistreur() {
    enr = new MediaRecorder(flux, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 });
    enr.ondataavailable = function (ev) { if (ev.data && ev.data.size) { file.push({ seq: seq++, blob: ev.data }); pomper(); } };
    enr.onerror = function () { dire('L\'enregistrement a été interrompu par le navigateur. Ce qui a été reçu est conservé ; vous pouvez redémarrer.', 'err'); arreter(true); };
    enr.start(5000);
  }

  function demarrer() {
    if (rec.getAttribute('data-pret') !== '1') { dire('Confirmez d\'abord le consentement des participants (étape 1).', 'err'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      dire('Ce navigateur ne permet pas l\'enregistrement audio. Utilisez une version récente de Chrome, Edge, Firefox ou Safari, en HTTPS.', 'err'); return;
    }
    if (!window.isSecureContext) { dire('L\'enregistrement exige une connexion sécurisée (HTTPS).', 'err'); return; }
    dire('Demande d\'accès au micro…');
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (s) {
      flux = s; mime = choisirMime();
      flux.getAudioTracks().forEach(function (t) { t.addEventListener('ended', function () { if (etat === 'enregistre' || etat === 'pause') { dire('Le micro a été déconnecté. Ce qui a été enregistré est conservé ; arrêtez puis redémarrez.', 'err'); arreter(true); } }); });
      return nouvelleSession();
    }).then(function () {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        var src = ctx.createMediaStreamSource(flux); analyseur = ctx.createAnalyser(); analyseur.fftSize = 512; src.connect(analyseur);
        donnees = new Uint8Array(analyseur.fftSize);
      } catch (e) { analyseur = null; }
      lancerEnregistreur();
      cumul = 0; debutSegment = Date.now(); dernierSon = Date.now(); etat = 'enregistre'; majBoutons(); dire('Enregistrement en cours : laissez cette page ouverte.', 'ok');
      tick = setInterval(function () { chrono.textContent = format(dureeS()); }, 500);
      rotation = setTimeout(tourner, ROTATION_MS);
      if (analyseur) rafId = requestAnimationFrame(mesurer);
      if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { verrou = w; }).catch(function () {});
    }).catch(function (e) { liberer(); erreurMicro(e); });
  }

  // Change de fichier toutes les 50 min sans interrompre la réunion
  function tourner() {
    if (etat !== 'enregistre') { rotation = setTimeout(tourner, 30000); return; }
    var ancien = enr, ancienId = partieId, duree = dureeS();
    enr = null; ancien.onstop = function () {
      var fd = new FormData(); fd.append('_csrf', csrf); fd.append('duree', duree);
      var finir = function () { return post(urlFin.replace('/audio/0/', '/audio/' + ancienId + '/'), fd); };
      nouvelleSession().then(function () { lancerEnregistreur(); finir(); rotation = setTimeout(tourner, ROTATION_MS); })
        .catch(function () { dire('Impossible de démarrer la partie suivante.', 'err'); });
    };
    ancien.stop();
  }

  function pause() { if (etat !== 'enregistre' || !enr) return; cumul += Date.now() - debutSegment; enr.pause(); etat = 'pause'; majBoutons(); dire('Enregistrement en pause.'); }
  function reprendre() { if (etat !== 'pause' || !enr) return; enr.resume(); debutSegment = Date.now(); etat = 'enregistre'; majBoutons(); dire('Enregistrement repris.', 'ok'); }

  function liberer() {
    clearInterval(tick); clearTimeout(rotation); cancelAnimationFrame(rafId);
    if (flux) flux.getTracks().forEach(function (t) { t.stop(); });
    if (ctx) { try { ctx.close(); } catch (e) {} }
    if (verrou) { try { verrou.release(); } catch (e) {} }
    flux = enr = ctx = analyseur = verrou = null; niveau.style.width = '0%';
  }
  function arreter(forcer) {
    if (etat !== 'enregistre' && etat !== 'pause') return;
    if (etat === 'enregistre') cumul += Date.now() - debutSegment;
    var duree = Math.floor(cumul / 1000);
    chrono.textContent = format(duree);
    etat = 'termine'; majBoutons(); microTxt.textContent = 'Micro inactif'; microTxt.className = 'mute';
    var fin = function () { liberer(); termineEnvoye = 'demande'; dire(forcer ? 'Enregistrement interrompu. Envoi de ce qui a été capté…' : 'Envoi des derniers morceaux…'); pomper(); finaliser2(duree); };
    if (enr && enr.state !== 'inactive') { enr.onstop = fin; try { enr.stop(); } catch (e) { fin(); } } else fin();
  }
  function finaliser2(duree) { cumul = duree * 1000; setTimeout(function () { if (termineEnvoye === 'demande' && !file.length) finaliser(); }, 800); }

  bouton('demarrer').addEventListener('click', demarrer);
  bouton('pause').addEventListener('click', pause);
  bouton('reprendre').addEventListener('click', reprendre);
  bouton('arreter').addEventListener('click', function () { arreter(false); });
  window.addEventListener('beforeunload', function (e) {
    if (etat === 'enregistre' || etat === 'pause' || file.length) { e.preventDefault(); e.returnValue = ''; }
  });
  majBoutons();
})();
