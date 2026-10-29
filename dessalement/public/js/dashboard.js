/* Tableau de bord : administrateur (tous les clients) et responsable (son client). */
lang = 'fr';
const el = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtMin = s => !s ? '—' : s < 3600 ? Math.round(s / 60) + ' min' : (s / 3600).toFixed(1).replace('.', ',') + ' h';
const AVAIL = PROGRAM.filter(p => p[2]).map(p => p[2]);
const LBY = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const lessonName = id => { const p = PROGRAM.find(x => x[2] === id); return (p ? p[0] + '. ' : '') + LBY[id].title.fr; };
let ME = null, ORG = null, SEL = null;

async function api(url, opt = {}) {
  const r = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' } }, opt));
  if (r.status === 401) { location.href = '/connexion'; throw new Error('401'); }
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (r.status === 403 && j.must_change) { location.href = '/mot-de-passe'; throw new Error('403'); }
  if (!r.ok) throw new Error(j.error || 'Erreur du serveur. Réessayez dans un instant.');
  return j;
}
const meter = (pct, ok) => `<div class="meter"><div class="b"><i class="${ok ? 'ok' : ''}" style="width:${Math.round(pct)}%"></i></div><span class="num">${Math.round(pct)} %</span></div>`;

/* ---------------------------------------------------------------- Calculs de suivi */
function summarize(rows) {
  const by = Object.fromEntries(rows.map(p => [p.lesson_id, p]));
  let done = 0, seen = 0, tot = 0, qs = 0, qt = 0, time = 0, last = null;
  AVAIL.forEach(id => {
    const p = by[id], l = LBY[id];
    if (p && p.completed_at) done++;
    if (l.scenes) { tot += l.scenes.length; if (p) seen += Math.min(p.scenes_seen.length, l.scenes.length); }
    if (p && p.quiz_first_score != null) { qs += p.quiz_first_score; qt += p.quiz_total; }
    if (p) { time += p.time_sec; if (!last || p.updated_at > last) last = p.updated_at; }
  });
  return { by, done, video: tot ? 100 * seen / tot : 0, quiz: qt ? 100 * qs / qt : null, time, last };
}

/* ---------------------------------------------------------------- Fenêtres */
function openDlg(html, onReady) { el('dlgBody').innerHTML = html; const d = el('dlg'); if (!d.open) d.showModal(); if (onReady) onReady(); }
function closeDlg() { el('dlg').close(); }
el('dlg').addEventListener('click', e => { if (e.target === el('dlg')) closeDlg(); });

function showCredentials(c, title, forManager) {
  const url = location.origin + '/connexion';
  const msg = `Bonjour ${c.name},\n\nVoici vos accès à la formation dessalement :\nAdresse : ${url}\nE-mail : ${c.email}\nMot de passe provisoire : ${c.password}\n\nÀ la première connexion, vous choisirez votre propre mot de passe.`;
  openDlg(`<h2>${esc(title)}</h2>
    <div class="cred"><div>Adresse : <code>${esc(url)}</code></div><div>E-mail : <code>${esc(c.email)}</code></div><div>Mot de passe provisoire : <code>${esc(c.password)}</code></div></div>
    <p class="warnbox">Ce mot de passe ne sera plus affiché. Copiez le message et envoyez-le à ${forManager ? 'ce responsable' : 'cet apprenant'} (WhatsApp, e-mail…). ${forManager ? 'Il' : 'Il ou elle'} choisira son propre mot de passe à la première connexion.</p>
    <p class="okmsg" id="copied" hidden>Message copié.</p>
    <div class="row"><button class="btn" id="cpy" type="button">Copier le message</button><button class="btn main" id="okb" type="button">J'ai bien noté</button></div>`, () => {
    el('okb').onclick = closeDlg;
    el('cpy').onclick = async () => {
      try { await navigator.clipboard.writeText(msg); el('copied').hidden = false; }
      catch (e) { const r = document.createRange(); r.selectNodeContents(el('dlgBody').querySelector('.cred')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    };
  });
}

function formDlg(title, intro, fields, submitLabel, onSubmit) {
  openDlg(`<h2>${esc(title)}</h2>${intro ? `<p>${esc(intro)}</p>` : ''}
    <form id="dform" novalidate>${fields.map(f => `<div class="field"><label for="${f.id}">${esc(f.label)}</label><input id="${f.id}" type="${f.type || 'text'}" ${f.type === 'email' ? 'dir="ltr" autocomplete="off"' : ''} required></div>`).join('')}
    <p class="err" id="derr" role="alert" hidden></p>
    <div class="row"><button class="btn" type="button" id="dcancel">Annuler</button><button class="btn main" type="submit" id="dgo">${esc(submitLabel)}</button></div></form>`, () => {
    el('dcancel').onclick = closeDlg;
    el(fields[0].id).focus();
    el('dform').onsubmit = async e => {
      e.preventDefault(); const b = el('dgo'); b.disabled = true; el('derr').hidden = true;
      try { await onSubmit(Object.fromEntries(fields.map(f => [f.id, el(f.id).value.trim()]))); }
      catch (x) { el('derr').textContent = x.message; el('derr').hidden = false; b.disabled = false; }
    };
  });
}

function confirmDlg(title, text, label, danger, onYes) {
  openDlg(`<h2>${esc(title)}</h2><p>${esc(text)}</p><p class="err" id="derr" hidden></p>
    <div class="row"><button class="btn" id="dno" type="button">Annuler</button><button class="btn ${danger ? 'danger' : 'main'}" id="dyes" type="button">${esc(label)}</button></div>`, () => {
    el('dno').onclick = closeDlg;
    el('dyes').onclick = async () => { el('dyes').disabled = true; try { await onYes(); } catch (x) { el('derr').textContent = x.message; el('derr').hidden = false; el('dyes').disabled = false; } };
  });
}

/* ---------------------------------------------------------------- Vue administrateur : les clients */
async function viewOrgs() {
  SEL = null;
  const j = await api('/api/admin/orgs');
  const learners = j.orgs.reduce((a, o) => a + o.learners, 0);
  el('view').innerHTML = `
  <div style="display:grid;gap:20px">
    <div class="head"><div><h1>Mes clients</h1></div>
      <div class="actions"><button class="btn main" id="newOrg">+ Nouveau client</button></div></div>
    <div class="stats">
      <div class="stat"><b>${j.orgs.length}</b><span>clients</span></div>
      <div class="stat"><b>${learners}</b><span>apprenants</span></div>
      <div class="stat"><b>${j.orgs.reduce((a, o) => a + o.completed, 0)}</b><span>leçons terminées au total</span></div>
    </div>
    <section class="panel"><h2>Clients</h2>
      ${j.orgs.length ? `<div class="tscroll"><table><thead><tr><th>Client</th><th class="num">Apprenants</th><th>Progression moyenne</th><th>Dernière activité</th><th>Statut</th></tr></thead><tbody>
      ${j.orgs.map(o => { const pct = o.learners ? 100 * o.completed / (o.learners * AVAIL.length) : 0;
        return `<tr class="click" data-id="${o.id}" tabindex="0"><td><b>${esc(o.name)}</b></td><td class="num">${o.learners}</td><td>${meter(pct, pct >= 100)}</td><td>${fmtDate(o.last_activity)}</td><td>${o.active ? '<span class="chip ok">Actif</span>' : '<span class="chip off">Désactivé</span>'}</td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="empty">Aucun client pour l'instant. Créez le premier avec « Nouveau client » : vous recevrez les accès de son responsable.</div>`}
    </section>
  </div>`;
  el('view').querySelectorAll('tr.click').forEach(tr => { const go = () => { location.hash = 'client-' + tr.dataset.id; }; tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter') go(); }; });
  el('newOrg').onclick = () => formDlg('Nouveau client', 'Le responsable du client pourra ajouter ses apprenants et suivre leurs résultats.',
    [{ id: 'name', label: 'Nom du client (centre, entreprise…)' }, { id: 'manager_name', label: 'Nom du responsable' }, { id: 'manager_email', label: 'E-mail du responsable', type: 'email' }],
    'Créer le client', async v => { const r = await api('/api/admin/orgs', { method: 'POST', body: JSON.stringify(v) }); showCredentials(r.credentials, 'Client créé : accès du responsable', true); viewOrgs(); });
}

/* ---------------------------------------------------------------- Vue d'un client */
async function viewOrg(id) {
  const j = await api('/api/orgs/' + id);
  ORG = j;
  const learners = j.users.filter(u => u.role === 'learner'), managers = j.users.filter(u => u.role === 'manager');
  const progBy = {}; j.progress.forEach(p => (progBy[p.user_id] = progBy[p.user_id] || []).push(p));
  const S = Object.fromEntries(learners.map(u => [u.id, summarize(progBy[u.id] || [])]));
  const active = learners.filter(u => u.active);
  const avgDone = active.length ? active.reduce((a, u) => a + S[u.id].done, 0) / active.length : 0;
  const qVals = active.map(u => S[u.id].quiz).filter(v => v != null);
  const isAdmin = ME.role === 'admin';

  /* Par leçon : taux de réussite, score moyen au 1er essai, question la plus ratée. */
  const perLesson = AVAIL.map(lid => {
    const rows = active.map(u => (progBy[u.id] || []).find(p => p.lesson_id === lid)).filter(Boolean);
    const done = rows.filter(p => p.completed_at).length;
    const fs = rows.filter(p => p.quiz_first_score != null);
    const avg = fs.length ? 100 * fs.reduce((a, p) => a + p.quiz_first_score / p.quiz_total, 0) / fs.length : null;
    const cnt = {}; fs.forEach(p => p.quiz_missed.forEach(i => cnt[i] = (cnt[i] || 0) + 1));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    const qtext = top ? LBY[lid].quiz[top[0]].q.fr : null;
    return { lid, done, avg, top: top ? { text: qtext, n: top[1], of: fs.length } : null };
  });

  el('view').innerHTML = `
  <div style="display:grid;gap:20px">
    <div class="head"><div>${isAdmin ? `<div class="crumb"><a href="#">Mes clients</a> › ${esc(j.org.name)}</div>` : '<div class="crumb">Votre espace responsable</div>'}
      <h1>${esc(j.org.name)} ${j.org.active ? '' : '<span class="chip off">Désactivé</span>'}</h1></div>
      <div class="actions"><button class="btn main" id="addL">+ Ajouter un apprenant</button>
        <a class="btn" href="/api/orgs/${j.org.id}/export.csv">Exporter (Excel)</a>
        ${isAdmin ? `<button class="btn" id="addM">+ Responsable</button><button class="btn ${j.org.active ? 'danger' : ''}" id="toggleOrg">${j.org.active ? 'Désactiver le client' : 'Réactiver le client'}</button>` : ''}</div></div>
    <div class="stats">
      <div class="stat"><b>${active.length}</b><span>apprenants actifs</span></div>
      <div class="stat"><b>${avgDone.toFixed(1).replace('.', ',')} / ${AVAIL.length}</b><span>leçons terminées en moyenne</span></div>
      <div class="stat"><b>${qVals.length ? Math.round(qVals.reduce((a, b) => a + b, 0) / qVals.length) + ' %' : '—'}</b><span>score moyen aux quiz (1er essai)</span></div>
      <div class="stat"><b>${active.filter(u => !u.last_login).length}</b><span>jamais connectés</span></div>
    </div>
    <section class="panel"><h2>Apprenants</h2>
      ${learners.length ? `<div class="tscroll"><table><thead><tr><th>Nom</th><th>Leçons terminées</th><th>Vidéos vues</th><th class="num">Quiz (1er essai)</th><th class="num">Temps</th><th>Dernière activité</th><th></th></tr></thead><tbody>
      ${learners.map(u => { const s = S[u.id];
        const state = !u.active ? '<span class="chip off">Désactivé</span>' : !u.last_login ? '<span class="chip warn">Jamais connecté</span>' : s.done === AVAIL.length ? '<span class="chip ok">Terminé</span>' : '';
        return `<tr class="click" data-uid="${u.id}" tabindex="0" aria-selected="${SEL === u.id}"><td><b>${esc(u.name)}</b><br><span style="color:var(--muted);font-size:13px">${esc(u.email)}</span></td>
        <td>${meter(100 * s.done / AVAIL.length, s.done === AVAIL.length)}</td><td>${meter(s.video)}</td>
        <td class="num">${s.quiz == null ? '—' : Math.round(s.quiz) + ' %'}</td><td class="num">${fmtMin(s.time)}</td><td>${fmtDate(s.last || u.last_login)}</td><td>${state}</td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="empty">Aucun apprenant. Ajoutez-en un : vous recevrez ses accès à lui transmettre.</div>`}
    </section>
    <section class="panel" id="detail" ${SEL && learners.some(u => u.id === SEL) ? '' : 'hidden'}></section>
    <section class="panel"><h2>Par leçon</h2><div class="tscroll"><table><thead><tr><th>Leçon</th><th class="num">Terminée par</th><th class="num">Score moyen (1er essai)</th><th>Question la plus ratée</th></tr></thead><tbody>
      ${perLesson.map(r => `<tr><td class="lessoncell">${esc(lessonName(r.lid))}</td><td class="num">${r.done} / ${active.length}</td><td class="num">${r.avg == null ? '—' : Math.round(r.avg) + ' %'}</td>
        <td class="wrapcell">${r.top ? `${esc(r.top.text)} <span style="color:var(--muted)">(${r.top.n} sur ${r.top.of})</span>` : '—'}</td></tr>`).join('')}
    </tbody></table></div></section>
    ${isAdmin ? `<section class="panel"><h2>Responsables</h2><div class="tscroll"><table><thead><tr><th>Nom</th><th>E-mail</th><th>Dernière connexion</th><th></th></tr></thead><tbody>
      ${managers.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.email)}</td><td>${fmtDate(m.last_login)}</td><td><button class="linkbtn" data-reset="${m.id}">Nouveau mot de passe</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Aucun responsable.</td></tr>'}
    </tbody></table></div></section>` : ''}
  </div>`;

  el('view').querySelectorAll('tr[data-uid]').forEach(tr => { const go = () => { SEL = Number(tr.dataset.uid); viewOrg(id).then(() => el('detail').scrollIntoView({ behavior: 'smooth', block: 'start' })); }; tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter') go(); }; });
  if (SEL && learners.some(u => u.id === SEL)) renderDetail(learners.find(u => u.id === SEL), progBy[SEL] || []);
  el('addL').onclick = () => formDlg('Ajouter un apprenant', null, [{ id: 'name', label: 'Nom et prénom' }, { id: 'email', label: 'E-mail', type: 'email' }], 'Créer le compte',
    async v => { const r = await api(`/api/orgs/${id}/learners`, { method: 'POST', body: JSON.stringify(v) }); showCredentials(r.credentials, 'Compte créé', false); viewOrg(id); });
  if (isAdmin) {
    el('addM').onclick = () => formDlg('Ajouter un responsable', 'Il pourra gérer les apprenants de ce client.', [{ id: 'name', label: 'Nom et prénom' }, { id: 'email', label: 'E-mail', type: 'email' }], 'Créer le compte',
      async v => { const r = await api(`/api/orgs/${id}/managers`, { method: 'POST', body: JSON.stringify(v) }); showCredentials(r.credentials, 'Responsable ajouté', true); viewOrg(id); });
    el('toggleOrg').onclick = () => confirmDlg(j.org.active ? 'Désactiver ce client ?' : 'Réactiver ce client ?',
      j.org.active ? 'Ses responsables et apprenants ne pourront plus se connecter. Leurs résultats sont conservés.' : 'Ses comptes pourront de nouveau se connecter.',
      j.org.active ? 'Désactiver' : 'Réactiver', j.org.active, async () => { await api('/api/admin/orgs/' + id, { method: 'PATCH', body: JSON.stringify({ active: !j.org.active }) }); closeDlg(); viewOrg(id); });
    el('view').querySelectorAll('[data-reset]').forEach(b => b.onclick = () => resetPw(Number(b.dataset.reset), true));
  }
}

function resetPw(uid, isManager) {
  confirmDlg('Créer un nouveau mot de passe provisoire ?', 'L\'ancien mot de passe ne fonctionnera plus. La personne devra en choisir un nouveau à sa prochaine connexion.', 'Créer le mot de passe', false,
    async () => { const r = await api(`/api/users/${uid}/reset`, { method: 'POST' }); showCredentials(r.credentials, 'Nouveau mot de passe provisoire', isManager); });
}

function renderDetail(u, rows) {
  const s = summarize(rows), id = ORG.org.id;
  el('detail').innerHTML = `<h2>Détail : ${esc(u.name)}</h2><div class="detail">
    <div class="actions"><button class="btn" id="dReset">Nouveau mot de passe</button><button class="btn ${u.active ? 'danger' : ''}" id="dToggle">${u.active ? 'Désactiver le compte' : 'Réactiver le compte'}</button><button class="btn" id="dClose">Fermer</button></div>
    <p style="margin:0;color:var(--muted)">Compte créé le ${fmtDate(u.created_at)} · dernière connexion : ${fmtDate(u.last_login)} · temps total : ${fmtMin(s.time)}</p>
  </div>
  <div class="tscroll"><table><thead><tr><th>Leçon</th><th>Vidéo</th><th class="num">Quiz 1er essai</th><th class="num">Essais</th><th>Terminée le</th><th>Questions ratées au 1er essai</th></tr></thead><tbody>
  ${AVAIL.map(lid => { const p = s.by[lid], l = LBY[lid];
    const vid = l.scenes ? (p ? `${Math.min(p.scenes_seen.length, l.scenes.length)} / ${l.scenes.length} scènes` : `0 / ${l.scenes.length} scènes`) : 'lecture';
    const missed = p && p.quiz_missed.length ? `<ol class="missed">${p.quiz_missed.map(i => `<li>${esc(l.quiz[i] ? l.quiz[i].q.fr : 'Question ' + (i + 1))}</li>`).join('')}</ol>` : (p && p.quiz_first_score != null ? 'aucune' : '—');
    return `<tr><td class="lessoncell">${esc(lessonName(lid))}</td><td>${vid}</td><td class="num">${p && p.quiz_first_score != null ? p.quiz_first_score + ' / ' + p.quiz_total : '—'}</td>
      <td class="num">${p ? p.quiz_attempts || '—' : '—'}</td><td>${p && p.completed_at ? '<span class="chip ok">' + fmtDate(p.completed_at) + '</span>' : '—'}</td><td class="wrapcell">${missed}</td></tr>`; }).join('')}
  </tbody></table></div>`;
  el('detail').hidden = false;
  el('dClose').onclick = () => { SEL = null; viewOrg(id); };
  el('dReset').onclick = () => resetPw(u.id, false);
  el('dToggle').onclick = () => confirmDlg(u.active ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?', u.active ? 'L\'apprenant ne pourra plus se connecter. Ses résultats sont conservés.' : 'L\'apprenant pourra de nouveau se connecter.',
    u.active ? 'Désactiver' : 'Réactiver', u.active, async () => { await api('/api/users/' + u.id, { method: 'PATCH', body: JSON.stringify({ active: !u.active }) }); closeDlg(); viewOrg(id); });
}

/* ---------------------------------------------------------------- Navigation */
async function route() {
  try {
    if (ME.role === 'manager') return await viewOrg(ME.org_id);
    const m = location.hash.match(/^#client-(\d+)$/);
    if (m) { if (!ORG || ORG.org.id !== Number(m[1])) SEL = null; await viewOrg(Number(m[1])); } else await viewOrgs();
  } catch (e) { if (e.message !== '401' && e.message !== '403') el('view').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}
window.addEventListener('hashchange', route);
el('logout').onclick = async () => { await fetch('/api/logout', { method: 'POST', headers: { 'X-Requested-With': 'fetch' } }); location.href = '/connexion'; };

(async () => {
  try {
    const j = await api('/api/me'); ME = j.user;
    if (ME.must_change) { location.href = '/mot-de-passe'; return; }
    if (ME.role === 'learner') { location.href = '/formation'; return; }
    el('meName').textContent = ME.name; el('meRole').textContent = ME.role === 'admin' ? 'Administrateur' : 'Responsable · ' + (ME.org_name || '');
    route();
  } catch (e) {}
})();
