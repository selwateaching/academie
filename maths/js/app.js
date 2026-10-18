/* Interface : routage, exercices, récompenses, suivi des progrès.
 * Les textes de l'interface sont regroupés dans l'objet UI en haut du fichier
 * (avec lang/fr.js et les titres de catalog.js) pour faciliter la traduction. */
(function () {
  'use strict';
  const { GEN, t } = window.MathsGen;
  const { LEVELS, byId } = window.CATALOG;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');

  const UI = {
    homeTitle: 'Des exercices de maths pour réussir de la GS à la 6ᵉ',
    homeLead: 'Choisis ton niveau, entraîne-toi sur une compétence et vois ton score grimper. Les questions sont tirées au hasard : tu ne manqueras jamais d’exercices.',
    see: (n) => `Voir les ${n} compétences ›`,
    mastered: 'Maîtrisée', excellent: 'Très bien',
    submit: 'Valider', next: 'Suivant', understood: 'J’ai compris',
    correct: ['Bravo !', 'Excellent !', 'Très bien !', 'Parfait !', 'Bien joué !'],
    wrong: 'Pas tout à fait.', answerWas: 'La bonne réponse est : ',
    soon: 'bientôt',
  };

  /* ---------- progression, compte et abonnement ---------- */
  // Sans compte : la progression reste dans le navigateur (essai gratuit).
  // Avec un compte : elle est enregistrée sur le serveur, profil par profil.
  const KEY = 'tadriss-maths.v1';
  const emptyStore = () => ({ skills: {}, days: {} });
  const localLoad = () => { try { const raw = localStorage.getItem(KEY); return raw ? Object.assign(emptyStore(), JSON.parse(raw)) : emptyStore(); } catch (e) { return emptyStore(); } };
  let store = emptyStore();
  const auth = { offline: false, user: null, profiles: [], active: null, subscriptions: {}, payments: [], config: { prices: {}, free: ['A1', 'B1', 'C1'], payment: 'demo', days: 30 } };
  const dirty = { skills: new Set(), days: new Set() };
  let pushTimer = null;
  let returnTo = '#/';

  async function api(path, method = 'GET', body, keepalive = false) {
    const opt = { method, credentials: 'same-origin', headers: { 'X-Tadriss': '1' }, keepalive };
    if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    const r = await fetch(path, opt);
    let data = {}; try { data = await r.json(); } catch (e) { /* pas de JSON */ }
    if (!r.ok) throw Object.assign(new Error(data.error || 'Erreur'), { status: r.status });
    return data;
  }
  function pushNow(keepalive) {
    clearTimeout(pushTimer);
    if (!auth.user || (!dirty.skills.size && !dirty.days.size)) return;
    const body = { skills: {}, days: {} };
    dirty.skills.forEach((id) => { if (store.skills[id]) body.skills[id] = store.skills[id]; });
    dirty.days.forEach((d) => { if (store.days[d]) body.days[d] = store.days[d]; });
    dirty.skills.clear(); dirty.days.clear();
    api('/api/progress', 'POST', body, keepalive).catch(() => { /* réessayé à la prochaine sauvegarde */ });
  }
  function save(skillId, day) {
    if (auth.user) {
      if (skillId) dirty.skills.add(skillId);
      if (day) dirty.days.add(day);
      clearTimeout(pushTimer); pushTimer = setTimeout(() => pushNow(false), 1200);
    } else { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignoré */ } }
  }
  function applyMe(d) {
    auth.user = d.user || null; auth.config = d.config || auth.config;
    auth.profiles = d.profiles || []; auth.active = d.activeProfile || null;
    auth.subscriptions = d.subscriptions || {}; auth.payments = d.payments || [];
    const a = $('#account');
    if (auth.offline) { a.hidden = true; return; }
    a.hidden = false;
    const ap = auth.profiles.find((x) => x.id === auth.active);
    a.textContent = auth.user ? (ap ? ap.name : 'Mon compte') : 'Connexion';
    a.setAttribute('href', auth.user ? '#/compte' : '#/connexion');
  }
  async function loadProgress() {
    if (!auth.user) { store = localLoad(); return; }
    try { const d = await api('/api/progress'); store = { skills: d.skills || {}, days: d.days || {} }; } catch (e) { store = emptyStore(); }
  }
  const isFree = (sk) => auth.config.free.includes(sk.code.replace('.', ''));
  const subscribed = (lv) => !!auth.subscriptions[lv] && new Date(auth.subscriptions[lv]) > new Date();
  const canPlay = (sk) => auth.offline || auth.config.open || isFree(sk) || subscribed(sk.level);
  const price = (lv) => auth.config.prices[lv] || 200;
  const dateFr = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const prog = (id) => store.skills[id] || { score: 0, answered: 0, correct: 0, secs: 0 };
  const today = () => new Date().toISOString().slice(0, 10);
  const status = (id) => { const s = prog(id).score; return s >= 100 ? 'm' : s >= 80 ? 'a' : s > 0 ? 'p' : ''; };
  const implemented = (lv) => lv.skillList.filter((s) => s.gen);
  const doneCount = (lv) => implemented(lv).filter((s) => prog(s.id).score >= 80).length;

  /* ---------- aides ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtTime = (s) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min` : s >= 60 ? `${Math.floor(s / 60)} min` : `${s} s`);
  const lvOf = (id) => LEVELS.find((l) => l.id === id);
  const menuBtn = $('#menuBtn'), topBar = document.querySelector('.top');
  const setMenu = (o) => { topBar.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); };
  menuBtn.addEventListener('click', () => setMenu(!topBar.classList.contains('open')));
  window.addEventListener('hashchange', () => setMenu(false));
  const setNav = (k) => document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === k));
  function show(html, nav) { app.innerHTML = html; setNav(nav); window.scrollTo(0, 0); }

  /* ---------- pages ---------- */
  function pageHome() {
    document.title = 'Tadriss-Maths — exercices de maths de la GS à la 6e';
    show(`<div class="wrap"><section class="hero"><h1>${UI.homeTitle}</h1><p>${UI.homeLead}</p></section>
    <section class="levels">${LEVELS.map((lv) => {
      const n = implemented(lv).length, d = doneCount(lv);
      return `<a class="lv" href="#/niveau/${lv.id}"><span class="lv-badge" style="background:${lv.color}">${lv.short}</span>
        <span class="lv-body"><h2>Réussir ${lv.art} ${lv.short}</h2><p>${esc(lv.blurb)}</p>
        <p class="meta">${lv.age} · ${lv.catList.length} catégories · ${d} / ${n} compétences acquises</p>
        <span class="bar"><i style="width:${n ? Math.round((d / n) * 100) : 0}%;background:${lv.color}"></i></span></span>
        <span class="lv-go"><span class="btn" style="background:${lv.color}">${UI.see(lv.skillList.length)}</span></span></a>`;
    }).join('')}</section></div>`, 'maths');
  }

  function dot(id, color) {
    const p = prog(id), st = status(id);
    if (!st) return '<span class="st"></span>';
    if (st === 'm') return '<span class="st m">★</span>';
    if (st === 'a') return '<span class="st a">✓</span>';
    return `<span class="st p" style="--c:${color};--deg:${Math.round(p.score * 3.6)}deg"></span>`;
  }

  function levelBanner(lv) {
    if (auth.offline || auth.config.open) return '';
    if (subscribed(lv.id)) return `<div class="note ok">Abonnement ${lv.short} actif jusqu’au ${dateFr(auth.subscriptions[lv.id])}. Tout le niveau est débloqué.</div>`;
    return `<div class="note">Tu peux essayer gratuitement 3 compétences du ${lv.short}. Pour débloquer tout le niveau : <b>${price(lv.id)} DA par mois</b>. <a class="btn" style="margin-left:8px;padding:7px 14px" href="#/tarifs">Voir les tarifs</a></div>`;
  }

  function pageLevel(id) {
    const lv = lvOf(id); if (!lv) return pageHome();
    document.title = `Maths ${lv.short} — Tadriss-Maths`;
    const pills = LEVELS.map((l) => `<a class="pill ${l.id === id ? 'on' : ''}" style="background:${l.color};--c:${l.color}" href="#/niveau/${l.id}">${l.short}</a>`).join('');
    const doms = lv.domains.map((d, di) => `<section class="domain" id="d${di}" style="--c:${lv.color};--c2:${lv.color}"><h2>${esc(d.name)}</h2><div class="cats">${d.cats.map((c) => `<div class="cat"><h3>${esc(c.name)}</h3>${c.skills.map((s) => s.gen
      ? `<a class="sk" style="--c:${lv.color}" href="#/exercice/${s.id}"><span class="code">${s.code}</span><span class="t">${esc(s.title)}</span>${canPlay(s) ? (isFree(s) && !auth.offline && !auth.config.open && !subscribed(lv.id) ? '<span class="soon-tag free">Gratuit</span>' : '') + dot(s.id, lv.color) : '<span class="lock" title="Réservé aux abonnés">🔒</span>'}</a>`
      : `<span class="sk soon"><span class="code">${s.code}</span><span class="t">${esc(s.title)}</span><span class="soon-tag">${UI.soon}</span></span>`).join('')}</div>`).join('')}</div></section>`).join('');
    show(`<div class="wrap"><div class="lvhead"><h1 style="color:${lv.color}">Réussir ${lv.art} ${lv.short}</h1>
      <p>${esc(lv.name)} · ${esc(lv.blurb)} Clique sur une compétence pour t’entraîner : ton score est enregistré et la difficulté s’adapte à mesure que tu progresses.</p></div>
      ${levelBanner(lv)}
      <div class="pills" aria-label="Choisir un niveau">${pills}</div>
      <div class="anchors">${lv.domains.map((d, di) => `<a href="#/niveau/${id}" data-scroll="d${di}" style="--c:${lv.color}">${esc(d.name)}</a>`).join('')}</div>
      <div class="legend"><span><i class="lg"></i> pas commencée</span><span><i class="lg p" style="--c:${lv.color};--deg:200deg"></i> en cours</span><span><i class="lg a">✓</i> acquise (80 et plus)</span><span><i class="lg m">★</i> maîtrisée (100)</span></div>${doms}</div>`, 'maths');
    document.querySelectorAll('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); $('#' + a.dataset.scroll).scrollIntoView({ behavior: 'smooth' }); }));
  }

  /* ---------- exercice ---------- */
  let P = null; // séance en cours
  const tick = setInterval(() => { if (P && !document.hidden) P.secs += 1; }, 1000);
  void tick;

  function flush() {
    if (!P) return;
    const e = store.skills[P.skill.id] || { score: 0, answered: 0, correct: 0, secs: 0 };
    e.secs += P.secs - P.flushed; P.flushed = P.secs;
    const d = store.days[today()] || { n: 0, ok: 0, secs: 0 };
    d.secs += P.daySecs(); store.days[today()] = d; store.skills[P.skill.id] = e; save(P.skill.id, today());
  }
  window.addEventListener('pagehide', () => { flush(); pushNow(true); });
  window.addEventListener('hashchange', () => { flush(); pushNow(false); P = null; route(); });

  function pagePractice(id) {
    const sk = byId[id]; if (!sk || !sk.gen) return pageHome();
    if (!canPlay(sk)) return pageLocked(sk);
    const lv = lvOf(sk.level), pr = prog(id);
    let lastSecs = 0;
    P = { skill: sk, lv, score: pr.score, answered: 0, correct: 0, secs: 0, flushed: 0, q: null, sel: null, done: false, celebrated: pr.score >= 100, daySecs() { const d = this.secs - lastSecs; lastSecs = this.secs; return d; } };
    document.title = `${sk.code} ${sk.title} — Tadriss-Maths`;
    show(`<div class="wrap"><div class="crumb"><a href="#/niveau/${lv.id}">${lv.short}</a> › ${esc(sk.cat.name)}</div>
      <div class="prac"><section class="qcard" id="qcard" aria-live="polite"></section>
      <aside class="side"><h3>${sk.code} · ${esc(sk.title)}</h3><svg class="ring" viewBox="0 0 120 120" id="ring"></svg><p class="levelmsg" id="lmsg"></p>
      <div class="stat"><span>Questions</span><b id="sA">0</b></div><div class="stat"><span>Réussies</span><b id="sC">0</b></div><div class="stat"><span>Temps</span><b id="sT">0 s</b></div>
      <p class="hint">Le score monte quand tu réponds juste et baisse quand tu te trompes. À 100, la compétence est maîtrisée.</p></aside></div></div>`, 'maths');
    P.timer = setInterval(() => { if (!P || !$('#sT')) return clearInterval(P && P.timer); $('#sT').textContent = fmtTime(P.secs); }, 1000);
    newQuestion();
  }

  function renderSide() {
    const s = P.score, r = 50, c = 2 * Math.PI * r;
    $('#ring').innerHTML = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="#e8e6f6" stroke-width="12"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${s >= 100 ? '#15803d' : P.lv.color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(c * s) / 100} ${c}" transform="rotate(-90 60 60)"/><text x="60" y="68" text-anchor="middle" font-size="30" font-weight="800" fill="#1f1d3d">${s}</text>`;
    $('#lmsg').textContent = s >= 100 ? '★ ' + UI.mastered : s >= 80 ? UI.excellent : '';
    $('#sA').textContent = P.answered; $('#sC').textContent = P.correct; $('#sT').textContent = fmtTime(P.secs);
  }

  function newQuestion() {
    P.q = GEN[P.skill.gen](P.skill.params); P.sel = null; P.done = false;
    const q = P.q;
    let input;
    if (q.kind === 'choice') input = `<div class="choices" role="group">${q.choices.map((c, i) => `<button class="ch" data-i="${i}">${c.label}</button>`).join('')}</div>`;
    else input = `<div class="ansrow"><input id="ans" inputmode="decimal" autocomplete="off" aria-label="Ta réponse" enterkeyhint="done"></div><div class="pad">${['7', '8', '9', '⌫', '4', '5', '6', ',', '1', '2', '3', '−', '0'].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}</div>`;
    $('#qcard').innerHTML = `<div class="qtitle">${esc(P.skill.title)}</div><div class="q">${q.q}</div>${q.vis || ''}${q.expr ? `<div class="expr">${q.expr}</div>` : ''}${input}
      <div class="ansrow" style="margin-top:16px"><button class="btn big" id="go">${UI.submit}</button></div><div id="fb"></div>`;
    $('#go').addEventListener('click', submit);
    if (q.kind === 'choice') document.querySelectorAll('.ch').forEach((b) => b.addEventListener('click', () => { if (P.done) return; document.querySelectorAll('.ch').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); P.sel = Number(b.dataset.i); }));
    else {
      const a = $('#ans'); a.focus();
      document.querySelectorAll('.pad button').forEach((b) => b.addEventListener('click', () => { if (P.done) return; a.value = b.dataset.k === '⌫' ? a.value.slice(0, -1) : a.value + b.dataset.k; }));
    }
    renderSide();
  }

  const parse = (s) => { const n = parseFloat(String(s).replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(',', '.')); return n; };

  function submit() {
    if (!P) return;
    if (P.done) return next();
    const q = P.q; let ok, given;
    if (q.kind === 'choice') { if (P.sel === null) return; given = q.choices[P.sel]; ok = String(given.v) === String(q.ans); }
    else { const raw = $('#ans').value.trim(); if (!raw) return; const n = parse(raw); if (Number.isNaN(n)) return; ok = Math.abs(n - Number(q.ans)) < 1e-6; }
    P.done = true; P.answered++; if (ok) P.correct++;
    const before = P.score;
    if (ok) P.score = Math.min(100, P.score + (P.score < 50 ? 10 : P.score < 80 ? 7 : P.score < 90 ? 4 : 3));
    else P.score = Math.max(0, P.score - (P.score >= 80 ? 10 : P.score >= 50 ? 7 : 4));
    const e = store.skills[P.skill.id] || { score: 0, answered: 0, correct: 0, secs: 0 };
    e.score = P.score; e.answered++; if (ok) e.correct++; e.last = Date.now(); store.skills[P.skill.id] = e;
    const d = store.days[today()] || { n: 0, ok: 0, secs: 0 }; d.n++; if (ok) d.ok++; store.days[today()] = d; save(P.skill.id, today());
    if (q.kind === 'choice') document.querySelectorAll('.ch').forEach((b, i) => { b.classList.toggle('good', String(q.choices[i].v) === String(q.ans)); if (i === P.sel && !ok) b.classList.add('bad'); });
    else $('#ans').disabled = true;
    const goodLabel = q.kind === 'choice' ? q.choices.find((c) => String(c.v) === String(q.ans)).label : `<span class="m">${String(q.ans).replace('-', '−').replace('.', ',')}</span>`;
    $('#fb').innerHTML = ok
      ? `<div class="fb ok">${esc(pick(UI.correct))}<div class="exp">${q.exp}</div></div>`
      : `<div class="fb no">${UI.wrong} ${UI.answerWas}${goodLabel}<div class="exp">${q.exp}</div></div>`;
    const go = $('#go'); go.textContent = ok ? UI.next : UI.understood; go.focus();
    renderSide();
    if (P.score >= 100 && before < 100 && !P.celebrated) { P.celebrated = true; setTimeout(celebrate, 450); }
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const next = () => newQuestion();

  function celebrate() {
    const m = $('#modal'); m.hidden = false;
    m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><div class="big">🏆</div><h2>Compétence maîtrisée !</h2><p>${esc(P.skill.title)}</p>
      <div class="row"><button class="btn" id="mBack">Retour à la liste</button><button class="btn ghost" id="mGo">Continuer</button></div></div>`;
    $('#mGo').onclick = () => { m.hidden = true; }; $('#mBack').onclick = () => { m.hidden = true; location.hash = '#/niveau/' + P.lv.id; };
  }

  /* ---------- récompenses ---------- */
  const PRIZES = ['⛺', '🦋', '⭐', '🐠', '🚀', '🍦', '🎈', '🦊', '🌈', '🏆', '🎨', '🐢', '🍓', '🎸', '🦄', '🪁', '🐬', '🍀', '🎲', '🦉', '🚲', '🐝', '🌻', '🎁', '🐙', '🪐', '🍩', '🦁'];
  const need = (c) => Math.min(2, c.skills.filter((s) => s.gen).length);
  const catDone = (c) => c.skills.filter((s) => s.gen && prog(s.id).score >= 80).length;

  function pageRewards(id) {
    const lv = lvOf(id) || LEVELS[4];
    document.title = 'Récompenses — Tadriss-Maths';
    let won = 0;
    const sq = lv.catList.map((c, i) => {
      const got = catDone(c) >= need(c); if (got) won++;
      return `<button class="sq ${got ? 'rev' : 'hid'}" data-c="${i}" aria-label="${esc(c.name)}">${got ? PRIZES[(i + lv.id.length) % PRIZES.length] : '?'}<small>${esc(c.name)}</small></button>`;
    }).join('');
    const all = LEVELS.reduce((a, l) => a + l.catList.filter((c) => catDone(c) >= need(c)).length, 0);
    const tabs = LEVELS.map((l) => `<a class="pill" style="background:${l.color};min-width:50px;height:50px;--c:${l.color}${l.id === lv.id ? ';opacity:1;border-color:#fff;box-shadow:0 0 0 3px ' + l.color : ''}" href="#/recompenses/${l.id}">${l.short}</a>`).join('');
    show(`<div class="wrap"><div class="lvhead"><h1>Récompenses</h1><p>Chaque niveau a son plateau de jeu. Un carré se dévoile quand tu acquiers (80 et plus) deux compétences d’une même catégorie. Touche un carré pour voir ce qu’il te reste à faire.</p></div>
      <div class="pills" style="margin:10px 0">${tabs}</div>
      <div class="rtop"><div class="board" style="--c:${lv.color}">${sq}</div>
      <aside class="side"><h3>Plateau ${lv.short}</h3><div class="stat"><span>Carrés dévoilés</span><b>${won} / ${lv.catList.length}</b></div>
      <div class="stat"><span>Compétences acquises</span><b>${doneCount(lv)} / ${implemented(lv).length}</b></div>
      <div class="stat"><span>Récompenses (tous niveaux)</span><b>${all}</b></div></aside></div></div>`, 'recompenses');
    document.querySelectorAll('.sq').forEach((b) => b.addEventListener('click', () => {
      const c = lv.catList[Number(b.dataset.c)], got = catDone(c) >= need(c), n = need(c);
      const todo = c.skills.find((s) => s.gen && prog(s.id).score < 80) || c.skills.find((s) => s.gen);
      const m = $('#modal'); m.hidden = false;
      m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true">${got ? `<div class="big">${b.firstChild.textContent}</div><h2>Récompense gagnée !</h2><p>Tu as acquis ${catDone(c)} compétence(s) dans la catégorie « ${esc(c.name)} ».</p>`
        : `<div class="big">❔</div><h2>Pour dévoiler ce carré</h2><p>Acquiers ${n} compétence${n > 1 ? 's' : ''} dans la catégorie :<br><b>${esc(c.name)}</b></p><p class="hint">Tu en as déjà ${catDone(c)}.</p>`}
        <div class="row">${todo ? `<a class="btn" href="#/exercice/${todo.id}" id="mGo">${got ? 'S’entraîner encore' : 'Plus d’exercices'}</a>` : ''}<button class="btn ghost" id="mX">Fermer</button></div></div>`;
      $('#mX').onclick = () => { m.hidden = true; }; const g = $('#mGo'); if (g) g.onclick = () => { m.hidden = true; };
    }));
  }

  /* ---------- suivi des progrès ---------- */
  function pageProgress() {
    document.title = 'Suivi des progrès — Tadriss-Maths';
    const rows = Object.entries(store.skills).filter(([, v]) => v.answered);
    const tot = rows.reduce((a, [, v]) => a + v.answered, 0), ok = rows.reduce((a, [, v]) => a + v.correct, 0);
    const secs = Object.values(store.days).reduce((a, d) => a + (d.secs || 0), 0) || rows.reduce((a, [, v]) => a + (v.secs || 0), 0);
    const mastered = rows.filter(([, v]) => v.score >= 100).length, acq = rows.filter(([, v]) => v.score >= 80).length;
    const days = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5), k = d.toISOString().slice(0, 10); return { k, n: (store.days[k] || {}).n || 0, lab: d.getDate() }; });
    const max = Math.max(5, ...days.map((d) => d.n));
    const weak = rows.filter(([, v]) => v.answered >= 4 && v.score < 60).sort((a, b) => a[1].score - b[1].score).slice(0, 8);
    const recent = rows.slice().sort((a, b) => (b[1].last || 0) - (a[1].last || 0)).slice(0, 8);
    const link = ([id, v]) => { const s = byId[id]; return s ? `<a href="#/exercice/${id}"><span><b>${lvOf(s.level).short} ${s.code}</b> · ${esc(s.title)}</span><span>${v.score}/100</span></a>` : ''; };
    show(`<div class="wrap"><div class="lvhead"><h1>Suivi des progrès</h1><p>Un coup d’œil sur ce qui a été travaillé sur cet appareil : combien de questions, avec quelle réussite, et quelles compétences méritent un coup de pouce.</p></div>
      <div class="tiles"><div class="tile"><b>${tot}</b><span>questions répondues</span></div><div class="tile"><b>${tot ? Math.round((ok / tot) * 100) : 0} %</b><span>de réussite</span></div><div class="tile"><b>${fmtTime(secs)}</b><span>de travail</span></div><div class="tile"><b>${acq}</b><span>compétences acquises (dont ${mastered} maîtrisées)</span></div></div>
      <div class="panel"><h2>Progression par niveau</h2>${LEVELS.map((lv) => { const n = implemented(lv).length, d = doneCount(lv); return `<a class="lrow" href="#/niveau/${lv.id}" style="text-decoration:none"><span style="color:${lv.color}">${lv.short}</span><span class="bar" style="margin:0"><i style="width:${n ? (d / n) * 100 : 0}%;background:${lv.color}"></i></span><span>${d} / ${n}</span></a>`; }).join('')}</div>
      <div class="panel"><h2>Questions par jour (14 derniers jours)</h2><div class="days">${days.map((d) => `<div title="${d.k} : ${d.n}"><i style="height:${(d.n / max) * 100}%"></i>${d.lab}</div>`).join('')}</div></div>
      <div class="panel"><h2>À retravailler</h2><div class="todo">${weak.length ? weak.map(link).join('') : '<p class="hint">Rien à signaler pour l’instant : continue comme ça, ou lance-toi sur une nouvelle compétence.</p>'}</div></div>
      <div class="panel"><h2>Dernières compétences travaillées</h2><div class="todo">${recent.length ? recent.map(link).join('') : '<p class="hint">Aucun exercice fait pour l’instant. <a href="#/">Choisis un niveau</a> pour commencer.</p>'}</div></div>
      ${auth.user ? '' : '<p style="margin-bottom:30px"><button class="btn ghost" id="reset">Effacer ma progression</button></p>'}</div>`, 'suivi');
    const rs = $('#reset');
    if (rs) rs.onclick = () => { if (confirm('Effacer toute la progression enregistrée sur cet appareil ?')) { store = emptyStore(); save(); pageProgress(); } };
  }

  /* ---------- page de présentation ---------- */
  function pageAbout() {
    document.title = 'Pourquoi Tadriss-Maths';
    const total = LEVELS.reduce((a, l) => a + l.skillList.length, 0), impl = LEVELS.reduce((a, l) => a + implemented(l).length, 0);
    show(`<div class="wrap"><section class="promo"><h1>Tadriss-Maths donne envie de faire des maths</h1><p>Des exercices interactifs, corrigés tout de suite, qui s’adaptent à ton rythme. Du premier comptage de la grande section aux fractions et aux aires de la sixième.</p><a class="btn big" href="#/">Choisir mon niveau</a></section>
      <h2 class="section-t">Une façon d’apprendre pensée pour l’enfant</h2>
      <div class="feats"><div class="feat"><div class="ic">♾️</div><h3>Des exercices sans fin</h3><p>Chaque question est tirée au hasard : on peut s’entraîner autant qu’on veut.</p></div>
      <div class="feat"><div class="ic">🧩</div><h3>Des schémas pour comprendre</h3><p>Bandes, disques, droites graduées, horloges, solides : on voit la notion avant de calculer.</p></div>
      <div class="feat"><div class="ic">💡</div><h3>Une explication après chaque erreur</h3><p>La bonne réponse s’affiche avec une courte explication, pour comprendre et pas seulement corriger.</p></div>
      <div class="feat"><div class="ic">🏆</div><h3>Des récompenses à débloquer</h3><p>Un plateau par niveau, avec des carrés cachés à dévoiler en acquérant des compétences.</p></div></div>
      <h2 class="section-t">Le programme, niveau par niveau</h2>
      <div class="feats">${LEVELS.map((lv) => `<a class="feat" href="#/niveau/${lv.id}" style="text-decoration:none;border-top:6px solid ${lv.color}"><h3 style="color:${lv.color};font-size:1.4rem">${lv.short}</h3><p>${esc(lv.blurb)}</p></a>`).join('')}</div>
      <div class="note"><b>Où en est le site ?</b> ${total} compétences sont listées de la GS à la 6ᵉ, et ${impl} ont déjà leurs exercices. Les autres sont marquées « bientôt » et seront ajoutées niveau par niveau. L’interface est en français ; une version en arabe (de droite à gauche) viendra ensuite.</div></div>`, 'avantages');
  }

  function pageSearch(q) {
    q = decodeURIComponent(q || '').trim().toLowerCase();
    document.title = 'Recherche — Tadriss-Maths';
    const hits = Object.values(byId).filter((s) => q && (s.title.toLowerCase().includes(q) || s.cat.name.toLowerCase().includes(q)));
    show(`<div class="wrap"><div class="lvhead"><h1>Recherche</h1><p>${hits.length} compétence(s) pour « ${esc(q)} ».</p></div><div class="panel results">${hits.slice(0, 80).map((s) => `<a href="${s.gen ? '#/exercice/' + s.id : '#/niveau/' + s.level}"><span class="lvtag" style="color:${lvOf(s.level).color}">${lvOf(s.level).short}</span><span><b>${s.code}</b> ${esc(s.title)} ${s.gen ? '' : `<span class="soon-tag">${UI.soon}</span>`}</span></a>`).join('')}</div></div>`, 'maths');
  }

  /* ---------- pages : accès réservé, tarifs, connexion, compte ---------- */
  function pageLocked(sk) {
    const lv = lvOf(sk.level);
    document.title = `${sk.code} — Tadriss-Maths`;
    show(`<div class="wrap narrow"><div class="crumb"><a href="#/niveau/${lv.id}">${lv.short}</a> › ${esc(sk.cat.name)}</div>
      <div class="qcard center"><div class="bigico">🔒</div><h1>Compétence réservée aux abonnés</h1>
      <p><b>${sk.code} · ${esc(sk.title)}</b> fait partie de l’abonnement ${lv.short} : <b>${price(lv.id)} DA par mois</b>, tout le niveau débloqué.</p>
      <p class="hint">3 compétences de chaque niveau restent gratuites pour essayer (codes A.1, B.1 et C.1).</p>
      <div class="row"><a class="btn big" href="#/tarifs">Voir les tarifs</a><a class="btn ghost big" href="#/niveau/${lv.id}">Retour au niveau</a></div></div></div>`, 'maths');
  }

  function pagePricing() {
    document.title = 'Tarifs — Tadriss-Maths';
    const demo = auth.config.payment === 'demo';
    show(`<div class="wrap"><div class="lvhead"><h1>Tarifs</h1><p>Un abonnement par niveau, valable ${auth.config.days} jours, sans reconduction automatique : tu paies quand tu veux continuer. Paiement en dinars par carte CIB ou Edahabia.</p></div>
      ${demo ? '<div class="note">Mode test : aucun vrai paiement n’est effectué, le paiement est simulé.</div>' : ''}
      <div class="prices">${LEVELS.map((lv) => `<div class="pcard" style="--c:${lv.color}"><div class="pbadge" style="background:${lv.color}">${lv.short}</div><div class="pamount"><b>${price(lv.id)}</b> DA <span>/ mois</span></div>
        <p>${implemented(lv).length} compétences avec exercices, correction immédiate, suivi et récompenses.</p>
        ${subscribed(lv.id) ? `<p class="hint">Actif jusqu’au ${dateFr(auth.subscriptions[lv.id])}</p>` : ''}
        <button class="btn" style="background:${lv.color}" data-buy="${lv.id}">${subscribed(lv.id) ? 'Prolonger d’un mois' : 'S’abonner'}</button></div>`).join('')}</div>
      <div class="panel"><h2>Ce qui est inclus</h2><p>Tous les exercices du niveau choisi, sans limite de questions, avec explications après chaque erreur, score, récompenses et suivi des progrès sauvegardés sur ton compte. Trois compétences par niveau restent gratuites.</p>
      <p class="hint" style="margin-top:10px"><label>Moyen de paiement <select id="method"><option value="">Je choisis sur la page de paiement</option><option value="cib">Carte CIB</option><option value="edahabia">Carte Edahabia</option></select></label></p><p id="buyErr" class="errtxt"></p></div></div>`, 'tarifs');
    document.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', async () => {
      if (auth.offline) { $('#buyErr').textContent = 'Les abonnements ne sont pas disponibles dans cet aperçu.'; return; }
      if (!auth.user) { returnTo = '#/tarifs'; location.hash = '#/inscription'; return; }
      b.disabled = true;
      try { const d = await api('/api/checkout', 'POST', { level: b.dataset.buy, method: $('#method').value || undefined }); location.href = d.url; }
      catch (e) { $('#buyErr').textContent = e.message; b.disabled = false; }
    }));
  }

  const field = (id, label, type, extra = '') => `<label class="fld" for="${id}">${label}<input id="${id}" name="${id}" type="${type}" ${extra} required></label>`;
  function afterAuth(d) { applyMe(d); return loadProgress().then(() => { const t = returnTo; returnTo = '#/'; location.hash = t; route(); }); }

  function pageLogin() {
    document.title = 'Connexion — Tadriss-Maths';
    show(`<div class="wrap narrow"><div class="lvhead"><h1>Connexion</h1></div><form class="form panel" id="fLogin">
      ${field('email', 'Adresse e-mail', 'email', 'autocomplete="email"')}${field('password', 'Mot de passe', 'password', 'autocomplete="current-password"')}
      <p class="errtxt" id="err" role="alert"></p><button class="btn big" type="submit">Me connecter</button>
      <p class="hint">Pas encore de compte ? <a href="#/inscription">Créer un compte</a></p></form></div>`, 'compte');
    $('#fLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await afterAuth(await api('/api/login', 'POST', { email: $('#email').value, password: $('#password').value })); }
      catch (er) { $('#err').textContent = er.message; }
    });
  }

  function pageRegister() {
    document.title = 'Créer un compte — Tadriss-Maths';
    show(`<div class="wrap narrow"><div class="lvhead"><h1>Créer un compte</h1><p>Le compte est celui du parent. Il peut contenir jusqu’à 5 profils d’élèves, chacun avec sa propre progression.</p></div><form class="form panel" id="fReg">
      ${field('email', 'Adresse e-mail du parent', 'email', 'autocomplete="email"')}${field('password', 'Mot de passe (8 caractères minimum)', 'password', 'autocomplete="new-password" minlength="8"')}
      ${field('name', 'Prénom de l’élève', 'text', 'maxlength="40"')}
      <label class="fld" for="level">Niveau de l’élève<select id="level">${LEVELS.map((l) => `<option value="${l.id}" ${l.id === 'cm1' ? 'selected' : ''}>${l.short} · ${esc(l.name)}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" id="ok" required> J’accepte les <a href="#/legal">conditions d’utilisation</a>.</label>
      <p class="errtxt" id="err" role="alert"></p><button class="btn big" type="submit">Créer mon compte</button>
      <p class="hint">Déjà un compte ? <a href="#/connexion">Se connecter</a></p></form></div>`, 'compte');
    $('#fReg').addEventListener('submit', async (e) => {
      e.preventDefault();
      const local = localLoad();
      try {
        const d = await api('/api/register', 'POST', { email: $('#email').value, password: $('#password').value, name: $('#name').value, level: $('#level').value });
        applyMe(d);
        if (Object.keys(local.skills).length) { // reprend les exercices gratuits déjà faits sur cet appareil
          try { await api('/api/progress', 'POST', local); localStorage.removeItem(KEY); } catch (er) { /* ignoré */ }
        }
        await loadProgress(); const t = returnTo; returnTo = '#/'; location.hash = t; route();
      } catch (er) { $('#err').textContent = er.message; }
    });
  }

  function pageAccount() {
    if (!auth.user) { returnTo = '#/compte'; return pageLogin(); }
    document.title = 'Mon compte — Tadriss-Maths';
    const subs = LEVELS.filter((l) => subscribed(l.id));
    show(`<div class="wrap"><div class="lvhead"><h1>Mon compte</h1><p>${esc(auth.user.email)}</p></div>
      <div class="panel"><h2>Profils des élèves</h2><div class="profs">${auth.profiles.map((p) => `<div class="prof ${p.id === auth.active ? 'on' : ''}"><b>${esc(p.name)}</b><span>${esc(lvOf(p.level).short)}</span>
        ${p.id === auth.active ? '<span class="soon-tag free">profil actif</span>' : `<button class="btn ghost sm" data-sel="${p.id}">Choisir</button>`}
        ${auth.profiles.length > 1 ? `<button class="btn ghost sm" data-del="${p.id}" aria-label="Supprimer ${esc(p.name)}">Supprimer</button>` : ''}</div>`).join('')}</div>
        ${auth.profiles.length < 5 ? `<form class="inl" id="fProf"><input id="pname" placeholder="Prénom" maxlength="40" required aria-label="Prénom du nouvel élève"><select id="plevel" aria-label="Niveau">${LEVELS.map((l) => `<option value="${l.id}">${l.short}</option>`).join('')}</select><button class="btn" type="submit">Ajouter un profil</button></form>` : ''}<p class="errtxt" id="err"></p></div>
      <div class="panel"><h2>Abonnements</h2>${subs.length ? subs.map((l) => `<div class="stat"><span>${l.short}</span><b>jusqu’au ${dateFr(auth.subscriptions[l.id])}</b></div>`).join('') : '<p class="hint">Aucun abonnement actif. Les compétences gratuites restent accessibles.</p>'}<p style="margin-top:12px"><a class="btn" href="#/tarifs">Voir les tarifs</a></p></div>
      <div class="panel"><h2>Derniers paiements</h2>${auth.payments.length ? auth.payments.map((x) => `<div class="stat"><span>${lvOf(x.level).short} · ${x.amount} DA · ${dateFr(x.date)}</span><b>${{ paid: 'payé', pending: 'en attente', failed: 'échoué' }[x.status] || x.status}</b></div>`).join('') : '<p class="hint">Aucun paiement pour l’instant.</p>'}</div>
      <p style="margin-bottom:30px"><button class="btn ghost" id="logout">Me déconnecter</button></p></div>`, 'compte');
    const swap = async (fn) => { try { applyMe(await fn()); await loadProgress(); pageAccount(); } catch (e) { $('#err').textContent = e.message; } };
    document.querySelectorAll('[data-sel]').forEach((b) => b.addEventListener('click', () => { pushNow(false); swap(() => api(`/api/profiles/${b.dataset.sel}/select`, 'POST', {})); }));
    document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { if (confirm('Supprimer ce profil et sa progression ?')) swap(() => api(`/api/profiles/${b.dataset.del}`, 'DELETE')); }));
    const f = $('#fProf'); if (f) f.addEventListener('submit', (e) => { e.preventDefault(); pushNow(false); swap(() => api('/api/profiles', 'POST', { name: $('#pname').value, level: $('#plevel').value })); });
    $('#logout').onclick = async () => { pushNow(false); await api('/api/logout', 'POST', {}).catch(() => {}); applyMe({ user: null, config: auth.config }); store = localLoad(); location.hash = '#/'; route(); };
  }

  async function pagePaid(ok) {
    document.title = 'Paiement — Tadriss-Maths';
    show(`<div class="wrap narrow"><div class="qcard center"><div class="bigico">${ok ? '⏳' : '⚠️'}</div><h1>${ok ? 'Vérification du paiement…' : 'Paiement non terminé'}</h1><p id="pmsg">${ok ? '' : 'Le paiement a été annulé ou a échoué. Aucun abonnement n’a été activé.'}</p><div class="row"><a class="btn big" href="#/tarifs">Retour aux tarifs</a></div></div></div>`, 'tarifs');
    if (!ok || !auth.user) return;
    try {
      const d = await api('/api/payments/refresh', 'POST', {}); applyMe(d);
      const has = Object.keys(auth.subscriptions).length;
      $('.bigico').textContent = has ? '🎉' : '⏳'; $('h1').textContent = has ? 'Paiement reçu, merci !' : 'Paiement en cours de confirmation';
      $('#pmsg').textContent = has ? 'Ton abonnement est actif. Bon entraînement !' : 'La banque n’a pas encore confirmé. Recharge cette page dans une minute.';
    } catch (e) { $('#pmsg').textContent = e.message; }
  }

  function pageLegal() {
    document.title = 'Conditions et confidentialité — Tadriss-Maths';
    show(`<div class="wrap narrow"><div class="lvhead"><h1>Conditions et confidentialité</h1></div><div class="note">Texte provisoire à faire relire et compléter (nom de l’éditeur, adresse, contact) avant l’ouverture au public.</div>
      <div class="panel legal"><h2>Le service</h2><p>Tadriss-Maths propose des exercices de mathématiques en ligne, de la grande section à la sixième. Trois compétences par niveau sont gratuites ; le reste du niveau est accessible avec un abonnement.</p>
      <h2>Abonnements et paiement</h2><p>Un abonnement concerne un niveau et dure ${auth.config.days} jours à partir du paiement. Il n’est pas reconduit automatiquement. Le paiement se fait en dinars algériens par carte CIB ou Edahabia, via le prestataire Chargily Pay. Tadriss-Maths ne reçoit ni ne conserve les numéros de carte.</p>
      <h2>Données personnelles</h2><p>Nous conservons l’adresse e-mail du parent, les prénoms des profils d’élèves, leur progression dans les exercices et l’historique des paiements. Ces données servent uniquement à faire fonctionner le service. Aucune publicité, aucune revente de données.</p>
      <h2>Supprimer son compte</h2><p>Un profil peut être supprimé depuis « Mon compte ». Pour supprimer tout le compte, écrire à l’adresse de contact (à compléter).</p></div></div>`, 'compte');
  }

  /* ---------- routeur ---------- */
  function route() {
    const [, page, arg] = (location.hash || '#/').split('/');
    $('#modal').hidden = true;
    if (page === 'niveau') pageLevel(arg); else if (page === 'exercice') pagePractice(arg);
    else if (page === 'recompenses') pageRewards(arg); else if (page === 'suivi') pageProgress();
    else if (page === 'avantages') pageAbout(); else if (page === 'tarifs') pagePricing(); else if (page === 'connexion') pageLogin(); else if (page === 'inscription') pageRegister(); else if (page === 'compte') pageAccount(); else if (page === 'paiement') pagePaid(arg === 'succes'); else if (page === 'legal') pageLegal(); else if (page === 'recherche') pageSearch(arg); else pageHome();
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && P && $('#go') && $('#modal').hidden && !(e.target.tagName === 'BUTTON')) { e.preventDefault(); submit(); }
    if (e.key === 'Escape') $('#modal').hidden = true;
  });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.target.hidden = true; });
  $('#search').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#q').value.trim(); if (v) location.hash = '#/recherche/' + encodeURIComponent(v); });
  async function boot() {
    try { applyMe(await api('/api/me')); } catch (e) { auth.offline = true; applyMe({ user: null }); } // sans serveur : aperçu, tout est accessible
    await loadProgress();
    route();
  }
  boot();
}());