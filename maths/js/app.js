/* Interface : routage, exercices, récompenses, suivi des progrès.
 * Les textes de l'interface sont regroupés dans l'objet UI en haut du fichier
 * (avec lang/fr.js et les titres de catalog.js) pour faciliter la traduction. */
(function () {
  'use strict';
  const { GEN, t } = window.MathsGen;
  const { LEVELS, byId } = window.CATALOG;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');

  /* ---------- langue : français (par défaut) ou arabe, de droite à gauche ----------
   * Les textes de l'interface sont écrits en français dans ce fichier, autour de T() ;
   * l'arabe est cherché dans lang/ar-ui.js et lang/ar-catalog.js (clé = texte français).
   * Les textes des exercices passent par t() (lang/fr.js et lang/ar.js). */
  const LANG_KEY = 'tadriss-maths.lang';
  const FR_STRINGS = window.STRINGS;
  const AR_DICT = Object.assign({}, window.AR_CATALOG, window.AR_UI);
  let lang = 'fr';
  try { lang = localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'fr'; } catch (e) { /* ignoré */ }
  function T(src, vars) {
    let s = src;
    if (lang === 'ar' && AR_DICT[src] !== undefined) s = AR_DICT[src];
    return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '')) : s;
  }
  const useLang = () => { window.STRINGS = lang === 'ar' ? Object.assign({}, FR_STRINGS, window.STRINGS_AR) : FR_STRINGS; };
  useLang();

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
    if (!r.ok) throw Object.assign(new Error(T(data.error || 'Erreur')), { status: r.status });
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
    a.textContent = auth.user ? (ap ? ap.name : T('Mon compte')) : T('Connexion');
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
  const dateFr = (iso) => new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const prog = (id) => store.skills[id] || { score: 0, answered: 0, correct: 0, secs: 0 };
  const today = () => new Date().toISOString().slice(0, 10);
  const status = (id) => { const s = prog(id).score; return s >= 100 ? 'm' : s >= 80 ? 'a' : s > 0 ? 'p' : ''; };
  const implemented = (lv) => lv.skillList.filter((s) => s.gen);
  const doneCount = (lv) => implemented(lv).filter((s) => prog(s.id).score >= 80).length;

  /* ---------- aides ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtTime = (s) => (s >= 3600 ? T('{h} h {m} min', { h: Math.floor(s / 3600), m: String(Math.floor((s % 3600) / 60)).padStart(2, '0') }) : s >= 60 ? T('{m} min', { m: Math.floor(s / 60) }) : T('{s} s', { s }));
  const lvOf = (id) => LEVELS.find((l) => l.id === id);
  const sh = (lv) => esc(T(lv.short)); // nom court du niveau (GS, CP… ou en arabe)
  const ti = (x) => esc(T(x)); // texte du catalogue traduit et échappé
  const menuBtn = $('#menuBtn'), topBar = document.querySelector('.top');
  const setMenu = (o) => { topBar.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); };
  menuBtn.addEventListener('click', () => setMenu(!topBar.classList.contains('open')));
  window.addEventListener('hashchange', () => setMenu(false));
  /* textes fixes de la page (en-tête, pied de page) + sens de lecture */
  function applyStatic() {
    const h = document.documentElement;
    h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-t]').forEach((e) => { e.textContent = T(e.dataset.t); });
    document.querySelectorAll('[data-t-aria]').forEach((e) => e.setAttribute('aria-label', T(e.dataset.tAria)));
    document.querySelectorAll('[data-t-ph]').forEach((e) => e.setAttribute('placeholder', T(e.dataset.tPh)));
    $('#foot').innerHTML = T('Tadriss-Maths · exercices originaux, générés au hasard · <a href="#/legal">Conditions et mentions légales</a>');
    document.querySelectorAll('[data-lang]').forEach((b) => { const on = b.dataset.lang === lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  }
  function setLang(l) {
    if (l === lang) return;
    lang = l; useLang();
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignoré */ }
    applyStatic(); applyMe({ user: auth.user, config: auth.config, profiles: auth.profiles, activeProfile: auth.active, subscriptions: auth.subscriptions, payments: auth.payments });
    flush(); P = null; route();
  }
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const setNav = (k) => document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === k));
  function show(html, nav) { app.innerHTML = html; setNav(nav); window.scrollTo(0, 0); }

  /* ---------- pages ---------- */
  function pageHome() {
    document.title = T('Tadriss-Maths — exercices de maths de la GS à la 6e');
    show(`<div class="wrap"><section class="hero"><h1>${T('Des exercices de maths pour réussir de la GS à la 6ᵉ')}</h1><p>${T('Choisis ton niveau, entraîne-toi sur une compétence et vois ton score grimper. Les questions sont tirées au hasard : tu ne manqueras jamais d’exercices.')}</p></section>
    <section class="levels">${LEVELS.map((lv) => {
      const n = implemented(lv).length, d = doneCount(lv);
      return `<a class="lv" href="#/niveau/${lv.id}"><span class="lv-badge" style="background:${lv.color}">${sh(lv)}</span>
        <span class="lv-body"><h2>${T('Réussir {art} {short}', { art: lv.art, short: sh(lv) })}</h2><p>${ti(lv.blurb)}</p>
        <p class="meta">${T('{age} · {cats} catégories · {d} / {n} compétences acquises', { age: ti(lv.age), cats: lv.catList.length, d, n })}</p>
        <span class="bar"><i style="width:${n ? Math.round((d / n) * 100) : 0}%;background:${lv.color}"></i></span></span>
        <span class="lv-go"><span class="btn" style="background:${lv.color}">${T('Voir les {n} compétences ›', { n: lv.skillList.length })}</span></span></a>`;
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
    if (subscribed(lv.id)) return `<div class="note ok">${T('Abonnement {lv} actif jusqu’au {date}. Tout le niveau est débloqué.', { lv: sh(lv), date: dateFr(auth.subscriptions[lv.id]) })}</div>`;
    return `<div class="note">${T('Tu peux essayer gratuitement 3 compétences du {lv}. Pour débloquer tout le niveau : <b>{price} DA par mois</b>.', { lv: sh(lv), price: price(lv.id) })} <a class="btn" style="margin-inline-start:8px;padding:7px 14px" href="#/tarifs">${T('Voir les tarifs')}</a></div>`;
  }

  function pageLevel(id) {
    const lv = lvOf(id); if (!lv) return pageHome();
    document.title = T('Maths {lv} — Tadriss-Maths', { lv: T(lv.short) });
    const pills = LEVELS.map((l) => `<a class="pill ${l.id === id ? 'on' : ''}" style="background:${l.color};--c:${l.color}" href="#/niveau/${l.id}">${sh(l)}</a>`).join('');
    const doms = lv.domains.map((d, di) => `<section class="domain" id="d${di}" style="--c:${lv.color};--c2:${lv.color}"><h2>${ti(d.name)}</h2><div class="cats">${d.cats.map((c) => `<div class="cat"><h3>${ti(c.name)}</h3>${c.skills.map((s) => s.gen
      ? `<a class="sk" style="--c:${lv.color}" href="#/exercice/${s.id}"><span class="code">${s.code}</span><span class="t">${ti(s.title)}</span>${canPlay(s) ? (isFree(s) && !auth.offline && !auth.config.open && !subscribed(lv.id) ? `<span class="soon-tag free">${T('Gratuit')}</span>` : '') + dot(s.id, lv.color) : `<span class="lock" title="${T('Réservé aux abonnés')}">🔒</span>`}</a>`
      : `<span class="sk soon"><span class="code">${s.code}</span><span class="t">${ti(s.title)}</span><span class="soon-tag">${T('bientôt')}</span></span>`).join('')}</div>`).join('')}</div></section>`).join('');
    show(`<div class="wrap"><div class="lvhead"><h1 style="color:${lv.color}">${T('Réussir {art} {short}', { art: lv.art, short: sh(lv) })}</h1>
      <p>${ti(lv.name)} · ${ti(lv.blurb)} ${T('Clique sur une compétence pour t’entraîner : ton score est enregistré et la difficulté s’adapte à mesure que tu progresses.')}</p></div>
      ${levelBanner(lv)}
      <div class="pills" aria-label="${T('Choisir un niveau')}">${pills}</div>
      <div class="anchors">${lv.domains.map((d, di) => `<a href="#/niveau/${id}" data-scroll="d${di}" style="--c:${lv.color}">${ti(d.name)}</a>`).join('')}</div>
      <div class="legend"><span><i class="lg"></i> ${T('pas commencée')}</span><span><i class="lg p" style="--c:${lv.color};--deg:200deg"></i> ${T('en cours')}</span><span><i class="lg a">✓</i> ${T('acquise (80 et plus)')}</span><span><i class="lg m">★</i> ${T('maîtrisée (100)')}</span></div>${doms}</div>`, 'maths');
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
    document.title = `${sk.code} ${T(sk.title)} — ${T('Tadriss-Maths')}`;
    show(`<div class="wrap"><div class="crumb"><a href="#/niveau/${lv.id}">${sh(lv)}</a> › ${ti(sk.cat.name)}</div>
      <div class="prac"><section class="qcard" id="qcard" aria-live="polite"></section>
      <aside class="side"><h3>${sk.code} · ${ti(sk.title)}</h3><svg class="ring" viewBox="0 0 120 120" id="ring"></svg><p class="levelmsg" id="lmsg"></p>
      <div class="stat"><span>${T('Questions')}</span><b id="sA">0</b></div><div class="stat"><span>${T('Réussies')}</span><b id="sC">0</b></div><div class="stat"><span>${T('Temps')}</span><b id="sT">${T('{s} s', { s: 0 })}</b></div>
      <p class="hint">${T('Le score monte quand tu réponds juste et baisse quand tu te trompes. À 100, la compétence est maîtrisée.')}</p></aside></div></div>`, 'maths');
    P.timer = setInterval(() => { if (!P || !$('#sT')) return clearInterval(P && P.timer); $('#sT').textContent = fmtTime(P.secs); }, 1000);
    newQuestion();
  }

  function renderSide() {
    const s = P.score, r = 50, c = 2 * Math.PI * r;
    $('#ring').innerHTML = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="#e8e6f6" stroke-width="12"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${s >= 100 ? '#15803d' : P.lv.color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(c * s) / 100} ${c}" transform="rotate(-90 60 60)"/><text x="60" y="68" text-anchor="middle" font-size="30" font-weight="800" fill="#1f1d3d">${s}</text>`;
    $('#lmsg').textContent = s >= 100 ? '★ ' + T('Maîtrisée') : s >= 80 ? T('Très bien') : '';
    $('#sA').textContent = P.answered; $('#sC').textContent = P.correct; $('#sT').textContent = fmtTime(P.secs);
  }

  function newQuestion() {
    P.q = GEN[P.skill.gen](P.skill.params); P.sel = null; P.done = false;
    const q = P.q;
    let input;
    if (q.kind === 'choice') input = `<div class="choices" role="group">${q.choices.map((c, i) => `<button class="ch" data-i="${i}">${c.label}</button>`).join('')}</div>`;
    else input = `<div class="ansrow"><input id="ans" inputmode="decimal" autocomplete="off" aria-label="${T('Ta réponse')}" enterkeyhint="done" dir="ltr"></div><div class="pad">${['7', '8', '9', '⌫', '4', '5', '6', ',', '1', '2', '3', '−', '0'].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}</div>`;
    $('#qcard').innerHTML = `<div class="qtitle">${ti(P.skill.title)}</div><div class="q">${q.q}</div>${q.vis || ''}${q.expr ? `<div class="expr">${q.expr}</div>` : ''}${input}
      <div class="ansrow" style="margin-top:16px"><button class="btn big" id="go">${T('Valider')}</button></div><div id="fb"></div>`;
    $('#go').addEventListener('click', submit);
    if (q.kind === 'choice') document.querySelectorAll('.ch').forEach((b) => b.addEventListener('click', () => { if (P.done) return; document.querySelectorAll('.ch').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); P.sel = Number(b.dataset.i); }));
    else {
      const a = $('#ans'); a.focus();
      document.querySelectorAll('.pad button').forEach((b) => b.addEventListener('click', () => { if (P.done) return; a.value = b.dataset.k === '⌫' ? a.value.slice(0, -1) : a.value + b.dataset.k; }));
    }
    renderSide();
  }

  const parse = (s) => { const n = parseFloat(String(s).replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632).replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(/[,٫،]/, '.')); return n; };

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
      ? `<div class="fb ok">${esc(pick(t('ui.correct')))}<div class="exp">${q.exp}</div></div>`
      : `<div class="fb no">${T('Pas tout à fait.')} ${T('La bonne réponse est : ')}${goodLabel}<div class="exp">${q.exp}</div></div>`;
    const go = $('#go'); go.textContent = ok ? T('Suivant') : T('J’ai compris'); go.focus();
    renderSide();
    if (P.score >= 100 && before < 100 && !P.celebrated) { P.celebrated = true; setTimeout(celebrate, 450); }
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const next = () => newQuestion();

  function celebrate() {
    const m = $('#modal'); m.hidden = false;
    m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><div class="big">🏆</div><h2>${T('Compétence maîtrisée !')}</h2><p>${ti(P.skill.title)}</p>
      <div class="row"><button class="btn" id="mBack">${T('Retour à la liste')}</button><button class="btn ghost" id="mGo">${T('Continuer')}</button></div></div>`;
    $('#mGo').onclick = () => { m.hidden = true; }; $('#mBack').onclick = () => { m.hidden = true; location.hash = '#/niveau/' + P.lv.id; };
  }

  /* ---------- récompenses ---------- */
  const PRIZES = ['⛺', '🦋', '⭐', '🐠', '🚀', '🍦', '🎈', '🦊', '🌈', '🏆', '🎨', '🐢', '🍓', '🎸', '🦄', '🪁', '🐬', '🍀', '🎲', '🦉', '🚲', '🐝', '🌻', '🎁', '🐙', '🪐', '🍩', '🦁'];
  const need = (c) => Math.min(2, c.skills.filter((s) => s.gen).length);
  const catDone = (c) => c.skills.filter((s) => s.gen && prog(s.id).score >= 80).length;

  function pageRewards(id) {
    const lv = lvOf(id) || LEVELS[4];
    document.title = T('Récompenses — Tadriss-Maths');
    let won = 0;
    const sq = lv.catList.map((c, i) => {
      const got = catDone(c) >= need(c); if (got) won++;
      return `<button class="sq ${got ? 'rev' : 'hid'}" data-c="${i}" aria-label="${ti(c.name)}">${got ? PRIZES[(i + lv.id.length) % PRIZES.length] : '?'}<small>${ti(c.name)}</small></button>`;
    }).join('');
    const all = LEVELS.reduce((a, l) => a + l.catList.filter((c) => catDone(c) >= need(c)).length, 0);
    const tabs = LEVELS.map((l) => `<a class="pill" style="background:${l.color};min-width:50px;height:50px;--c:${l.color}${l.id === lv.id ? ';opacity:1;border-color:#fff;box-shadow:0 0 0 3px ' + l.color : ''}" href="#/recompenses/${l.id}">${sh(l)}</a>`).join('');
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Récompenses')}</h1><p>${T('Chaque niveau a son plateau de jeu. Un carré se dévoile quand tu acquiers (80 et plus) deux compétences d’une même catégorie. Touche un carré pour voir ce qu’il te reste à faire.')}</p></div>
      <div class="pills" style="margin:10px 0">${tabs}</div>
      <div class="rtop"><div class="board" style="--c:${lv.color}">${sq}</div>
      <aside class="side"><h3>${T('Plateau {lv}', { lv: sh(lv) })}</h3><div class="stat"><span>${T('Carrés dévoilés')}</span><b>${won} / ${lv.catList.length}</b></div>
      <div class="stat"><span>${T('Compétences acquises')}</span><b>${doneCount(lv)} / ${implemented(lv).length}</b></div>
      <div class="stat"><span>${T('Récompenses (tous niveaux)')}</span><b>${all}</b></div></aside></div></div>`, 'recompenses');
    document.querySelectorAll('.sq').forEach((b) => b.addEventListener('click', () => {
      const c = lv.catList[Number(b.dataset.c)], got = catDone(c) >= need(c), n = need(c);
      const todo = c.skills.find((s) => s.gen && prog(s.id).score < 80) || c.skills.find((s) => s.gen);
      const m = $('#modal'); m.hidden = false;
      m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true">${got ? `<div class="big">${b.firstChild.textContent}</div><h2>${T('Récompense gagnée !')}</h2><p>${T('Tu as acquis {n} compétence(s) dans la catégorie « {cat} ».', { n: catDone(c), cat: ti(c.name) })}</p>`
        : `<div class="big">❔</div><h2>${T('Pour dévoiler ce carré')}</h2><p>${T(n > 1 ? 'Acquiers {n} compétences dans la catégorie :' : 'Acquiers {n} compétence dans la catégorie :', { n })}<br><b>${ti(c.name)}</b></p><p class="hint">${T('Tu en as déjà {n}.', { n: catDone(c) })}</p>`}
        <div class="row">${todo ? `<a class="btn" href="#/exercice/${todo.id}" id="mGo">${got ? T('S’entraîner encore') : T('Plus d’exercices')}</a>` : ''}<button class="btn ghost" id="mX">${T('Fermer')}</button></div></div>`;
      $('#mX').onclick = () => { m.hidden = true; }; const g = $('#mGo'); if (g) g.onclick = () => { m.hidden = true; };
    }));
  }

  /* ---------- suivi des progrès ---------- */
  function pageProgress() {
    document.title = T('Suivi des progrès — Tadriss-Maths');
    const rows = Object.entries(store.skills).filter(([, v]) => v.answered);
    const tot = rows.reduce((a, [, v]) => a + v.answered, 0), ok = rows.reduce((a, [, v]) => a + v.correct, 0);
    const secs = Object.values(store.days).reduce((a, d) => a + (d.secs || 0), 0) || rows.reduce((a, [, v]) => a + (v.secs || 0), 0);
    const mastered = rows.filter(([, v]) => v.score >= 100).length, acq = rows.filter(([, v]) => v.score >= 80).length;
    const days = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5), k = d.toISOString().slice(0, 10); return { k, n: (store.days[k] || {}).n || 0, lab: d.getDate() }; });
    const max = Math.max(5, ...days.map((d) => d.n));
    const weak = rows.filter(([, v]) => v.answered >= 4 && v.score < 60).sort((a, b) => a[1].score - b[1].score).slice(0, 8);
    const recent = rows.slice().sort((a, b) => (b[1].last || 0) - (a[1].last || 0)).slice(0, 8);
    const link = ([id, v]) => { const s = byId[id]; return s ? `<a href="#/exercice/${id}"><span><b>${sh(lvOf(s.level))} ${s.code}</b> · ${ti(s.title)}</span><span>${v.score}/100</span></a>` : ''; };
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Suivi des progrès')}</h1><p>${T('Un coup d’œil sur ce qui a été travaillé sur cet appareil : combien de questions, avec quelle réussite, et quelles compétences méritent un coup de pouce.')}</p></div>
      <div class="tiles"><div class="tile"><b>${tot}</b><span>${T('questions répondues')}</span></div><div class="tile"><b dir="ltr">${tot ? Math.round((ok / tot) * 100) : 0} %</b><span>${T('de réussite')}</span></div><div class="tile"><b>${fmtTime(secs)}</b><span>${T('de travail')}</span></div><div class="tile"><b>${acq}</b><span>${T('compétences acquises (dont {n} maîtrisées)', { n: mastered })}</span></div></div>
      <div class="panel"><h2>${T('Progression par niveau')}</h2>${LEVELS.map((lv) => { const n = implemented(lv).length, d = doneCount(lv); return `<a class="lrow" href="#/niveau/${lv.id}" style="text-decoration:none"><span style="color:${lv.color}">${sh(lv)}</span><span class="bar" style="margin:0"><i style="width:${n ? (d / n) * 100 : 0}%;background:${lv.color}"></i></span><span>${d} / ${n}</span></a>`; }).join('')}</div>
      <div class="panel"><h2>${T('Questions par jour (14 derniers jours)')}</h2><div class="days">${days.map((d) => `<div title="${d.k} : ${d.n}"><i style="height:${(d.n / max) * 100}%"></i>${d.lab}</div>`).join('')}</div></div>
      <div class="panel"><h2>${T('À retravailler')}</h2><div class="todo">${weak.length ? weak.map(link).join('') : `<p class="hint">${T('Rien à signaler pour l’instant : continue comme ça, ou lance-toi sur une nouvelle compétence.')}</p>`}</div></div>
      <div class="panel"><h2>${T('Dernières compétences travaillées')}</h2><div class="todo">${recent.length ? recent.map(link).join('') : `<p class="hint">${T('Aucun exercice fait pour l’instant. <a href="#/">Choisis un niveau</a> pour commencer.')}</p>`}</div></div>
      ${auth.user ? '' : `<p style="margin-bottom:30px"><button class="btn ghost" id="reset">${T('Effacer ma progression')}</button></p>`}</div>`, 'suivi');
    const rs = $('#reset');
    if (rs) rs.onclick = () => { if (confirm(T('Effacer toute la progression enregistrée sur cet appareil ?'))) { store = emptyStore(); save(); pageProgress(); } };
  }

  /* ---------- page de présentation ---------- */
  function pageAbout() {
    document.title = T('Pourquoi Tadriss-Maths');
    const total = LEVELS.reduce((a, l) => a + l.skillList.length, 0), impl = LEVELS.reduce((a, l) => a + implemented(l).length, 0);
    show(`<div class="wrap"><section class="promo"><h1>${T('Tadriss-Maths donne envie de faire des maths')}</h1><p>${T('Des exercices interactifs, corrigés tout de suite, qui s’adaptent à ton rythme. Du premier comptage de la grande section aux fractions et aux aires de la sixième.')}</p><a class="btn big" href="#/">${T('Choisir mon niveau')}</a></section>
      <h2 class="section-t">${T('Une façon d’apprendre pensée pour l’enfant')}</h2>
      <div class="feats"><div class="feat"><div class="ic">♾️</div><h3>${T('Des exercices sans fin')}</h3><p>${T('Chaque question est tirée au hasard : on peut s’entraîner autant qu’on veut.')}</p></div>
      <div class="feat"><div class="ic">🧩</div><h3>${T('Des schémas pour comprendre')}</h3><p>${T('Bandes, disques, droites graduées, horloges, solides : on voit la notion avant de calculer.')}</p></div>
      <div class="feat"><div class="ic">💡</div><h3>${T('Une explication après chaque erreur')}</h3><p>${T('La bonne réponse s’affiche avec une courte explication, pour comprendre et pas seulement corriger.')}</p></div>
      <div class="feat"><div class="ic">🏆</div><h3>${T('Des récompenses à débloquer')}</h3><p>${T('Un plateau par niveau, avec des carrés cachés à dévoiler en acquérant des compétences.')}</p></div></div>
      <h2 class="section-t">${T('Le programme, niveau par niveau')}</h2>
      <div class="feats">${LEVELS.map((lv) => `<a class="feat" href="#/niveau/${lv.id}" style="text-decoration:none;border-top:6px solid ${lv.color}"><h3 style="color:${lv.color};font-size:1.4rem">${sh(lv)}</h3><p>${ti(lv.blurb)}</p></a>`).join('')}</div>
      <div class="note"><b>${T('Où en est le site ?')}</b> ${T('{total} compétences sont listées de la GS à la 6ᵉ, et {impl} ont déjà leurs exercices. Les autres sont marquées « bientôt » et seront ajoutées niveau par niveau. L’interface existe en français et en arabe (de droite à gauche) : le bouton FR / عربي est en haut de la page.', { total, impl })}</div></div>`, 'avantages');
  }

  function pageSearch(q) {
    q = decodeURIComponent(q || '').trim().toLowerCase();
    document.title = T('Recherche — Tadriss-Maths');
    const hay = (s) => `${s.title} ${s.cat.name} ${T(s.title)} ${T(s.cat.name)}`.toLowerCase();
    const hits = Object.values(byId).filter((s) => q && hay(s).includes(q));
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Recherche')}</h1><p>${T('{n} compétence(s) pour « {q} ».', { n: hits.length, q: esc(q) })}</p></div><div class="panel results">${hits.slice(0, 80).map((s) => `<a href="${s.gen ? '#/exercice/' + s.id : '#/niveau/' + s.level}"><span class="lvtag" style="color:${lvOf(s.level).color}">${sh(lvOf(s.level))}</span><span><b>${s.code}</b> ${ti(s.title)} ${s.gen ? '' : `<span class="soon-tag">${T('bientôt')}</span>`}</span></a>`).join('')}</div></div>`, 'maths');
  }

  /* ---------- pages : accès réservé, tarifs, connexion, compte ---------- */
  function pageLocked(sk) {
    const lv = lvOf(sk.level);
    document.title = `${sk.code} — ${T('Tadriss-Maths')}`;
    show(`<div class="wrap narrow"><div class="crumb"><a href="#/niveau/${lv.id}">${sh(lv)}</a> › ${ti(sk.cat.name)}</div>
      <div class="qcard center"><div class="bigico">🔒</div><h1>${T('Compétence réservée aux abonnés')}</h1>
      <p>${T('<b>{skill}</b> fait partie de l’abonnement {lv} : <b>{price} DA par mois</b>, tout le niveau débloqué.', { skill: `${sk.code} · ${ti(sk.title)}`, lv: sh(lv), price: price(lv.id) })}</p>
      <p class="hint">${T('3 compétences de chaque niveau restent gratuites pour essayer (codes A.1, B.1 et C.1).')}</p>
      <div class="row"><a class="btn big" href="#/tarifs">${T('Voir les tarifs')}</a><a class="btn ghost big" href="#/niveau/${lv.id}">${T('Retour au niveau')}</a></div></div></div>`, 'maths');
  }

  function pagePricing() {
    document.title = T('Tarifs — Tadriss-Maths');
    const demo = auth.config.payment === 'demo';
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Tarifs')}</h1><p>${T('Un abonnement par niveau, valable {days} jours, sans reconduction automatique : tu paies quand tu veux continuer. Paiement en dinars par carte CIB ou Edahabia.', { days: auth.config.days })}</p></div>
      ${demo ? `<div class="note">${T('Mode test : aucun vrai paiement n’est effectué, le paiement est simulé.')}</div>` : ''}
      <div class="prices">${LEVELS.map((lv) => `<div class="pcard" style="--c:${lv.color}"><div class="pbadge" style="background:${lv.color}">${sh(lv)}</div><div class="pamount"><b>${price(lv.id)}</b> ${T('DA')} <span>${T('/ mois')}</span></div>
        <p>${T('{n} compétences avec exercices, correction immédiate, suivi et récompenses.', { n: implemented(lv).length })}</p>
        ${subscribed(lv.id) ? `<p class="hint">${T('Actif jusqu’au {date}', { date: dateFr(auth.subscriptions[lv.id]) })}</p>` : ''}
        <button class="btn" style="background:${lv.color}" data-buy="${lv.id}">${subscribed(lv.id) ? T('Prolonger d’un mois') : T('S’abonner')}</button></div>`).join('')}</div>
      <div class="panel"><h2>${T('Ce qui est inclus')}</h2><p>${T('Tous les exercices du niveau choisi, sans limite de questions, avec explications après chaque erreur, score, récompenses et suivi des progrès sauvegardés sur ton compte. Trois compétences par niveau restent gratuites.')}</p>
      <p class="hint" style="margin-top:10px"><label>${T('Moyen de paiement')} <select id="method"><option value="">${T('Je choisis sur la page de paiement')}</option><option value="cib">${T('Carte CIB')}</option><option value="edahabia">${T('Carte Edahabia')}</option></select></label></p><p id="buyErr" class="errtxt"></p></div></div>`, 'tarifs');
    document.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', async () => {
      if (auth.offline) { $('#buyErr').textContent = T('Les abonnements ne sont pas disponibles dans cet aperçu.'); return; }
      if (!auth.user) { returnTo = '#/tarifs'; location.hash = '#/inscription'; return; }
      b.disabled = true;
      try { const d = await api('/api/checkout', 'POST', { level: b.dataset.buy, method: $('#method').value || undefined }); location.href = d.url; }
      catch (e) { $('#buyErr').textContent = e.message; b.disabled = false; }
    }));
  }

  const field = (id, label, type, extra = '') => `<label class="fld" for="${id}">${label}<input id="${id}" name="${id}" type="${type}" ${type === 'email' || type === 'password' ? 'dir="ltr"' : ''} ${extra} required></label>`;
  function afterAuth(d) { applyMe(d); return loadProgress().then(() => { const t = returnTo; returnTo = '#/'; location.hash = t; route(); }); }

  function pageLogin() {
    document.title = T('Connexion — Tadriss-Maths');
    show(`<div class="wrap narrow"><div class="lvhead"><h1>${T('Connexion')}</h1></div><form class="form panel" id="fLogin">
      ${field('email', T('Adresse e-mail'), 'email', 'autocomplete="email"')}${field('password', T('Mot de passe'), 'password', 'autocomplete="current-password"')}
      <p class="errtxt" id="err" role="alert"></p><button class="btn big" type="submit">${T('Me connecter')}</button>
      <p class="hint">${T('Pas encore de compte ? <a href="#/inscription">Créer un compte</a>')}</p></form></div>`, 'compte');
    $('#fLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await afterAuth(await api('/api/login', 'POST', { email: $('#email').value, password: $('#password').value })); }
      catch (er) { $('#err').textContent = er.message; }
    });
  }

  function pageRegister() {
    document.title = T('Créer un compte — Tadriss-Maths');
    show(`<div class="wrap narrow"><div class="lvhead"><h1>${T('Créer un compte')}</h1><p>${T('Le compte est celui du parent. Il peut contenir jusqu’à 5 profils d’élèves, chacun avec sa propre progression.')}</p></div><form class="form panel" id="fReg">
      ${field('email', T('Adresse e-mail du parent'), 'email', 'autocomplete="email"')}${field('password', T('Mot de passe (8 caractères minimum)'), 'password', 'autocomplete="new-password" minlength="8"')}
      ${field('name', T('Prénom de l’élève'), 'text', 'maxlength="40"')}
      <label class="fld" for="level">${T('Niveau de l’élève')}<select id="level">${LEVELS.map((l) => `<option value="${l.id}" ${l.id === 'cm1' ? 'selected' : ''}>${sh(l)} · ${ti(l.name)}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" id="ok" required> ${T('J’accepte les <a href="#/legal">conditions d’utilisation</a>.')}</label>
      <p class="errtxt" id="err" role="alert"></p><button class="btn big" type="submit">${T('Créer mon compte')}</button>
      <p class="hint">${T('Déjà un compte ? <a href="#/connexion">Se connecter</a>')}</p></form></div>`, 'compte');
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
    document.title = T('Mon compte — Tadriss-Maths');
    const subs = LEVELS.filter((l) => subscribed(l.id));
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Mon compte')}</h1><p dir="ltr" style="text-align:start">${esc(auth.user.email)}</p></div>
      <div class="panel"><h2>${T('Profils des élèves')}</h2><div class="profs">${auth.profiles.map((p) => `<div class="prof ${p.id === auth.active ? 'on' : ''}"><b>${esc(p.name)}</b><span>${sh(lvOf(p.level))}</span>
        ${p.id === auth.active ? `<span class="soon-tag free">${T('profil actif')}</span>` : `<button class="btn ghost sm" data-sel="${p.id}">${T('Choisir')}</button>`}
        ${auth.profiles.length > 1 ? `<button class="btn ghost sm" data-del="${p.id}" aria-label="${T('Supprimer')} ${esc(p.name)}">${T('Supprimer')}</button>` : ''}</div>`).join('')}</div>
        ${auth.profiles.length < 5 ? `<form class="inl" id="fProf"><input id="pname" placeholder="${T('Prénom')}" maxlength="40" required aria-label="${T('Prénom du nouvel élève')}"><select id="plevel" aria-label="${T('Niveau')}">${LEVELS.map((l) => `<option value="${l.id}">${sh(l)}</option>`).join('')}</select><button class="btn" type="submit">${T('Ajouter un profil')}</button></form>` : ''}<p class="errtxt" id="err"></p></div>
      <div class="panel"><h2>${T('Abonnements')}</h2>${subs.length ? subs.map((l) => `<div class="stat"><span>${sh(l)}</span><b>${T('jusqu’au {date}', { date: dateFr(auth.subscriptions[l.id]) })}</b></div>`).join('') : `<p class="hint">${T('Aucun abonnement actif. Les compétences gratuites restent accessibles.')}</p>`}<p style="margin-top:12px"><a class="btn" href="#/tarifs">${T('Voir les tarifs')}</a></p></div>
      <div class="panel"><h2>${T('Derniers paiements')}</h2>${auth.payments.length ? auth.payments.map((x) => `<div class="stat"><span>${sh(lvOf(x.level))} · ${x.amount} ${T('DA')} · ${dateFr(x.date)}</span><b>${{ paid: T('payé'), pending: T('en attente'), failed: T('échoué') }[x.status] || x.status}</b></div>`).join('') : `<p class="hint">${T('Aucun paiement pour l’instant.')}</p>`}</div>
      <p style="margin-bottom:30px"><button class="btn ghost" id="logout">${T('Me déconnecter')}</button></p></div>`, 'compte');
    const swap = async (fn) => { try { applyMe(await fn()); await loadProgress(); pageAccount(); } catch (e) { $('#err').textContent = e.message; } };
    document.querySelectorAll('[data-sel]').forEach((b) => b.addEventListener('click', () => { pushNow(false); swap(() => api(`/api/profiles/${b.dataset.sel}/select`, 'POST', {})); }));
    document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { if (confirm(T('Supprimer ce profil et sa progression ?'))) swap(() => api(`/api/profiles/${b.dataset.del}`, 'DELETE')); }));
    const f = $('#fProf'); if (f) f.addEventListener('submit', (e) => { e.preventDefault(); pushNow(false); swap(() => api('/api/profiles', 'POST', { name: $('#pname').value, level: $('#plevel').value })); });
    $('#logout').onclick = async () => { pushNow(false); await api('/api/logout', 'POST', {}).catch(() => {}); applyMe({ user: null, config: auth.config }); store = localLoad(); location.hash = '#/'; route(); };
  }

  async function pagePaid(ok) {
    document.title = T('Paiement — Tadriss-Maths');
    show(`<div class="wrap narrow"><div class="qcard center"><div class="bigico">${ok ? '⏳' : '⚠️'}</div><h1>${ok ? T('Vérification du paiement…') : T('Paiement non terminé')}</h1><p id="pmsg">${ok ? '' : T('Le paiement a été annulé ou a échoué. Aucun abonnement n’a été activé.')}</p><div class="row"><a class="btn big" href="#/tarifs">${T('Retour aux tarifs')}</a></div></div></div>`, 'tarifs');
    if (!ok || !auth.user) return;
    try {
      const d = await api('/api/payments/refresh', 'POST', {}); applyMe(d);
      const has = Object.keys(auth.subscriptions).length;
      $('.bigico').textContent = has ? '🎉' : '⏳'; $('h1').textContent = has ? T('Paiement reçu, merci !') : T('Paiement en cours de confirmation');
      $('#pmsg').textContent = has ? T('Ton abonnement est actif. Bon entraînement !') : T('La banque n’a pas encore confirmé. Recharge cette page dans une minute.');
    } catch (e) { $('#pmsg').textContent = e.message; }
  }

  function pageLegal() {
    document.title = T('Conditions et confidentialité — Tadriss-Maths');
    show(`<div class="wrap narrow"><div class="lvhead"><h1>${T('Conditions et confidentialité')}</h1></div><div class="note">${T('Texte provisoire à faire relire et compléter (nom de l’éditeur, adresse, contact) avant l’ouverture au public.')}</div>
      <div class="panel legal"><h2>${T('Le service')}</h2><p>${T('Tadriss-Maths propose des exercices de mathématiques en ligne, de la grande section à la sixième. Trois compétences par niveau sont gratuites ; le reste du niveau est accessible avec un abonnement.')}</p>
      <h2>${T('Abonnements et paiement')}</h2><p>${T('Un abonnement concerne un niveau et dure {days} jours à partir du paiement. Il n’est pas reconduit automatiquement. Le paiement se fait en dinars algériens par carte CIB ou Edahabia, via le prestataire Chargily Pay. Tadriss-Maths ne reçoit ni ne conserve les numéros de carte.', { days: auth.config.days })}</p>
      <h2>${T('Données personnelles')}</h2><p>${T('Nous conservons l’adresse e-mail du parent, les prénoms des profils d’élèves, leur progression dans les exercices et l’historique des paiements. Ces données servent uniquement à faire fonctionner le service. Aucune publicité, aucune revente de données.')}</p>
      <h2>${T('Supprimer son compte')}</h2><p>${T('Un profil peut être supprimé depuis « Mon compte ». Pour supprimer tout le compte, écrire à l’adresse de contact (à compléter).')}</p></div></div>`, 'compte');
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
    applyStatic();
    try { applyMe(await api('/api/me')); } catch (e) { auth.offline = true; applyMe({ user: null }); } // sans serveur : aperçu, tout est accessible
    await loadProgress();
    route();
  }
  boot();
}());