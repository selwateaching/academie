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
  const isFree = (sk) => auth.user ? (auth.config.picks || []).includes(sk.id) : auth.config.free.includes(sk.code.replace('.', ''));
  const picksLeft = () => (auth.config.demoMax || 3) - (auth.config.picks || []).length;
  async function pickDemo(id) { try { applyMe(await api('/api/demo-pick', 'POST', { skill: id })); route(); } catch (e) { const n = $('#pickerr'); if (n) n.textContent = e.message; } }
  const coursePicksLeft = () => (auth.config.courseMax || 3) - (auth.config.coursePicks || []).length;
  const courseOpen = (c) => auth.offline || auth.config.open || valid('fam') || valid(c.level) || (auth.config.coursePicks || []).includes(c.id);
  async function pickCourse(id) { try { applyMe(await api('/api/course-pick', 'POST', { course: id })); route(); } catch (e) { const n = $('#cpickerr'); if (n) n.textContent = e.message; } }
  const valid = (k) => !!auth.subscriptions[k] && new Date(auth.subscriptions[k]) > new Date();
  const subscribed = (lv) => valid(lv) || valid('fam');
  const expiry = (lv) => auth.subscriptions[valid(lv) ? lv : 'fam'];
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
  const planName = (id) => (id === 'fam' ? T('Forfait Famille') : lvOf(id) ? sh(lvOf(id)) : `<bdi>${esc(((window.COURSE_LEVELS || []).find((l) => l.id === id) || { full: id }).full || ((window.COURSE_LEVELS || []).find((l) => l.id === id) || { label: id }).label)}</bdi>`);
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
    $('#foot').innerHTML = T('Tadriss Sciences · exercices originaux, générés au hasard · <a href="#/legal">Conditions et mentions légales</a> · <a href="#/contact">Contact</a>');
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
  let homeCycle = 'primaire';
  const exCycle = (lv) => (lv.id === '6e' ? 'moyen' : 'primaire');
  function pageHome() {
    document.title = T('Tadriss Sciences — exercices et cours de maths, physique et chimie de la GS à la Terminale');
    show(`<div class="wrap"><section class="hero"><h1>${T('Exercices et cours pour réussir de la GS à la Terminale')}</h1><p>${T('Choisis ton cycle puis ton niveau : des exercices de maths avec correction immédiate, et des cours illustrés en maths, physique et chimie.')}</p></section>
    <div class="pills" style="margin:14px 0">${COURSE_CYCLES.map((cy) => `<button class="pill ${cy.id === homeCycle ? 'on' : ''}" style="background:#0d9488;font-family:inherit;cursor:pointer;font-size:1.05em" data-hcy="${cy.id}" aria-pressed="${cy.id === homeCycle}">${cy.icon} ${T(cy.label)}</button>`).join('')}</div>
    <section class="levels">${COURSE_LEVELS.filter((l) => l.cycle === homeCycle).map((l) => {
      const lv = LEVELS.find((x) => x.id === l.id.toLowerCase()), nc = COURSES.filter((c) => c.level === l.id).length;
      const color = lv ? lv.color : (l.color || '#3b3a8f'), n = lv ? implemented(lv).length : 0, d = lv ? doneCount(lv) : 0;
      const exBtn = lv ? `<a class="btn" style="background:${color}" href="#/niveau/${lv.id}">📝 ${(lv.domains.some((d) => d.name === 'Physique') ? T('Exercices ({n})', { n: lv.skillList.length }) : T('Exercices de maths ({n})', { n: lv.skillList.length }))}</a>` : `<span class="meta" style="margin:0;opacity:.75">📝 ${T('Exercices')} · ${T('bientôt')}</span>`;
      const cs = (sj) => COURSES.filter((c) => c.level === l.id && c.subj === sj).length, extra = cs('physique') + cs('chimie') ? `<small class="meta" style="margin:0">📐 ${cs('maths')} · ⚡ ${T('Physique')} ${cs('physique')} · 🧪 ${T('Chimie')} ${cs('chimie')}</small>` : '';
      const coBtn = nc ? `<a class="btn" style="background:${color}" href="#/cours/niv-${l.id}">🎬 ${T('Cours illustrés ({n})', { n: nc })}</a>${extra}` : `<span class="pill off">🎬 ${T('Cours')} <small>${T('bientôt')}</small></span>`;
      const body = lv ? `<h2>${T('Réussir {art} {short}', { art: lv.art, short: sh(lv) })}</h2><p>${ti(lv.blurb)}</p><p class="meta">${T('{age} · {cats} catégories · {d} / {n} compétences acquises', { age: ti(lv.age), cats: lv.catList.length, d, n })}</p><span class="bar"><i style="width:${n ? Math.round((d / n) * 100) : 0}%;background:${color}"></i></span>` : `<h2>${T('Réussir en {short}', { short: l.full || l.label })}</h2><p>${T('Maths, physique et chimie : des cours courts, illustrés et lus à voix haute.')}</p>`;
      return `<div class="lv"><span class="lv-badge" style="background:${color}"><bdi>${lv ? sh(lv) : l.label}</bdi></span><img class="lv-photo" src="/img/niveau-${l.id.toLowerCase()}.jpg" alt="" loading="lazy" width="150" height="170">
        <span class="lv-body">${body}</span><span class="lv-go" style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">${lv ? exBtn + coBtn : coBtn + exBtn}</span></div>`;
    }).join('')}</section></div>`, 'maths');
    document.querySelectorAll('[data-hcy]').forEach((b) => b.addEventListener('click', () => { homeCycle = b.dataset.hcy; pageHome(); }));
  }

  function dot(id, color) {
    const p = prog(id), st = status(id);
    if (!st) return '<span class="st"></span>';
    if (st === 'm') return '<span class="st m">★</span>';
    if (st === 'a') return '<span class="st a">✓</span>';
    return `<span class="st p" style="--c:${color};--deg:${Math.round(p.score * 3.6)}deg"></span>`;
  }

  function levelBanner(lv) {
    if (auth.offline || auth.config.open || auth.user) return '';
    if (subscribed(lv.id)) return `<div class="note ok">${T('Abonnement {lv} actif jusqu’au {date}. Tout le niveau est débloqué.', { lv: sh(lv), date: dateFr(expiry(lv.id)) })}</div>`;
    return `<div class="note">${T('Tu peux essayer gratuitement 3 compétences du {lv}. Pour débloquer tout le niveau : <b>{price} DA par mois</b>.', { lv: sh(lv), price: price(lv.id) })} <a class="btn" style="margin-inline-start:8px;padding:7px 14px" href="#/tarifs">${T('Voir les tarifs')}</a></div>`;
  }

  function pageLevel(id) {
    const lv = lvOf(id); if (!lv) return pageHome();
    document.title = T('Maths {lv} — Tadriss Sciences', { lv: T(lv.short) });
    const pills = LEVELS.map((l) => `<a class="pill ${l.id === id ? 'on' : ''}" style="background:${l.color};--c:${l.color}" href="#/niveau/${l.id}">${sh(l)}</a>`).join('');
    const doms = lv.domains.map((d, di) => `<section class="domain" id="d${di}" style="--c:${lv.color};--c2:${lv.color}"><h2>${ti(d.name)}</h2><div class="cats">${d.cats.map((c) => `<div class="cat"><h3>${ti(c.name)}</h3>${c.skills.map((s) => s.gen
      ? `<a class="sk" style="--c:${lv.color}" href="#/exercice/${s.id}"><span class="code">${s.code}</span><span class="t">${ti(s.title)}</span>${canPlay(s) ? (isFree(s) && !auth.offline && !auth.config.open && !subscribed(lv.id) ? `<span class="soon-tag free">${T('Gratuit')}</span>` : '') + dot(s.id, lv.color) : `${auth.user && picksLeft() > 0 ? `<span class="pick" data-pick="${s.id}">☆ ${T('Choisir')}</span>` : ''}<span class="lock" title="${T('Réservé aux abonnés')}">🔒</span>`}</a>`
      : `<span class="sk soon"><span class="code">${s.code}</span><span class="t">${ti(s.title)}</span><span class="soon-tag">${T('bientôt')}</span></span>`).join('')}</div>`).join('')}</div></section>`).join('');
    show(`<div class="wrap"><div class="lvhead"><h1 style="color:${lv.color}">${T('Réussir {art} {short}', { art: lv.art, short: sh(lv) })}</h1>
      <p>${ti(lv.name)} · ${ti(lv.blurb)} ${T('Clique sur une compétence pour t’entraîner : ton score est enregistré et la difficulté s’adapte à mesure que tu progresses.')}</p></div>
      ${levelBanner(lv)}
      ${auth.user && !auth.offline && !auth.config.open ? `<div class="note">${picksLeft() > 0 ? T('Ta démo : choisis {left} leçon(s) gratuite(s) de ton choix. Touche « ☆ Choisir » à côté d’une leçon verrouillée 🔒.', { left: picksLeft() }) : T('Tu as choisi tes {n} leçons gratuites. Les autres demandent un abonnement.', { n: auth.config.demoMax || 3 })}</div>` : ''}
      <div class="pills" aria-label="${T('Choisir un niveau')}">${pills}</div>
      <div class="anchors">${lv.domains.map((d, di) => `<a href="#/niveau/${id}" data-scroll="d${di}" style="--c:${lv.color}">${ti(d.name)}</a>`).join('')}</div>
      <div class="legend"><span><i class="lg"></i> ${T('pas commencée')}</span><span><i class="lg p" style="--c:${lv.color};--deg:200deg"></i> ${T('en cours')}</span><span><i class="lg a">✓</i> ${T('acquise (80 et plus)')}</span><span><i class="lg m">★</i> ${T('maîtrisée (100)')}</span></div>${doms}</div>`, 'maths');
    document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); pickDemo(b.dataset.pick); }));
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
    document.title = `${sk.code} ${T(sk.title)} — ${T('Tadriss Sciences')}`;
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
    document.title = T('Récompenses — Tadriss Sciences');
    let won = 0;
    const sq = lv.catList.map((c, i) => {
      const got = catDone(c) >= need(c); if (got) won++;
      return `<button class="sq ${got ? 'rev' : 'hid'}" data-c="${i}" aria-label="${ti(c.name)}">${got ? PRIZES[(i + lv.id.length) % PRIZES.length] : '?'}<small>${ti(c.name)}</small></button>`;
    }).join('');
    const all = LEVELS.reduce((a, l) => a + l.catList.filter((c) => catDone(c) >= need(c)).length, 0);
    const tabs = LEVELS.map((l) => `<a class="pill" style="background:${l.color};min-width:50px;height:50px;--c:${l.color}${l.id === lv.id ? ';opacity:1;border-color:#fff;box-shadow:0 0 0 3px ' + l.color : ''}" href="#/recompenses/${l.id}">${sh(l)}</a>`).join('');
    show(`<div class="wrap"><div class="lvhead"><h1><img class="ttl-ic" src="/img/ico-3.jpg" alt="" width="44" height="44">${T('Récompenses')}</h1><p>${T('Chaque niveau a son plateau de jeu. Un carré se dévoile quand tu acquiers (80 et plus) deux compétences d’une même catégorie. Touche un carré pour voir ce qu’il te reste à faire.')}</p></div>
      <div class="pills" style="margin:10px 0">${tabs}</div>
      <div class="rtop"><div class="board" style="--c:${lv.color}">${sq}</div>
      <aside class="side"><img class="side-ph" src="/img/niveau-${lv.id}.jpg" alt="" width="64" height="64"><h3>${T('Plateau {lv}', { lv: sh(lv) })}</h3><div class="stat"><span>${T('Carrés dévoilés')}</span><b>${won} / ${lv.catList.length}</b></div>
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
    document.title = T('Suivi des progrès — Tadriss Sciences');
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
    document.title = T('Pourquoi Tadriss Sciences');
    const total = LEVELS.reduce((a, l) => a + l.skillList.length, 0), impl = LEVELS.reduce((a, l) => a + implemented(l).length, 0);
    show(`<div class="wrap"><section class="promo"><h1>${T('Tadriss Sciences donne envie d’apprendre les sciences')}</h1><p>${T('Des exercices interactifs, corrigés tout de suite, qui s’adaptent à ton rythme, et des cours illustrés. Du premier comptage de la grande section aux dérivées et aux intégrales de la Terminale.')}</p><a class="btn big" href="#/">${T('Choisir mon niveau')}</a></section>
      <h2 class="section-t">${T('Une façon d’apprendre pensée pour l’enfant')}</h2>
      <div class="feats"><div class="feat"><img class="ic" src="/img/ico-0.jpg" alt="" loading="lazy" width="96" height="96"><h3>${T('Des exercices sans fin')}</h3><p>${T('Chaque question est tirée au hasard : on peut s’entraîner autant qu’on veut.')}</p></div>
      <div class="feat"><img class="ic" src="/img/ico-1.jpg" alt="" loading="lazy" width="96" height="96"><h3>${T('Des schémas pour comprendre')}</h3><p>${T('Bandes, disques, droites graduées, horloges, solides : on voit la notion avant de calculer.')}</p></div>
      <div class="feat"><img class="ic" src="/img/ico-2.jpg" alt="" loading="lazy" width="96" height="96"><h3>${T('Une explication après chaque erreur')}</h3><p>${T('La bonne réponse s’affiche avec une courte explication, pour comprendre et pas seulement corriger.')}</p></div>
      <div class="feat"><img class="ic" src="/img/ico-3.jpg" alt="" loading="lazy" width="96" height="96"><h3>${T('Des récompenses à débloquer')}</h3><p>${T('Un plateau par niveau, avec des carrés cachés à dévoiler en acquérant des compétences.')}</p></div></div>
      <h2 class="section-t">${T('Le programme, niveau par niveau')}</h2>
      <div class="feats">${LEVELS.map((lv) => `<a class="feat" href="#/niveau/${lv.id}" style="text-decoration:none;border-top:6px solid ${lv.color}"><h3 style="color:${lv.color};font-size:1.4rem">${sh(lv)}</h3><p>${ti(lv.blurb)}</p></a>`).join('')}</div>
      <div class="note"><b>${T('Où en est le site ?')}</b> ${T('{total} compétences de la GS à la Terminale, avec des exercices corrigés tout de suite et des explications ({impl} au total). L’interface existe en français et en arabe (de droite à gauche) : le bouton FR / عربي est en haut de la page.', { total, impl })}</div></div>`, 'avantages');
  }

  function pageSearch(q) {
    q = decodeURIComponent(q || '').trim().toLowerCase();
    document.title = T('Recherche — Tadriss Sciences');
    const hay = (s) => `${s.title} ${s.cat.name} ${T(s.title)} ${T(s.cat.name)}`.toLowerCase();
    const hits = Object.values(byId).filter((s) => q && hay(s).includes(q));
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Recherche')}</h1><p>${T('{n} compétence(s) pour « {q} ».', { n: hits.length, q: esc(q) })}</p></div><div class="panel results">${hits.slice(0, 80).map((s) => `<a href="${s.gen ? '#/exercice/' + s.id : '#/niveau/' + s.level}"><span class="lvtag" style="color:${lvOf(s.level).color}">${sh(lvOf(s.level))}</span><span><b>${s.code}</b> ${ti(s.title)} ${s.gen ? '' : `<span class="soon-tag">${T('bientôt')}</span>`}</span></a>`).join('')}</div></div>`, 'maths');
  }

  /* ---------- pages : accès réservé, tarifs, connexion, compte ---------- */
  function pageLocked(sk) {
    const lv = lvOf(sk.level);
    document.title = `${sk.code} — ${T('Tadriss Sciences')}`;
    show(`<div class="wrap narrow"><div class="crumb"><a href="#/niveau/${lv.id}">${sh(lv)}</a> › ${ti(sk.cat.name)}</div>
      <div class="qcard center"><div class="bigico">🔒</div><h1>${T('Compétence réservée aux abonnés')}</h1>
      <p>${T('<b>{skill}</b> fait partie de l’abonnement {lv} : <b>{price} DA par mois</b>, tout le niveau débloqué.', { skill: `${sk.code} · ${ti(sk.title)}`, lv: sh(lv), price: price(lv.id) })}</p>
      ${auth.user && picksLeft() > 0 ? `<p class="hint">${T('Ta démo : tu peux choisir {n} leçons gratuites parmi toutes celles du site. Il t’en reste {left}.', { n: auth.config.demoMax || 3, left: picksLeft() })}</p>
      <div class="row"><button class="btn big" id="pickdemo">${T('Choisir cette leçon comme démo')}</button></div><p class="hint" id="pickerr"></p>` : auth.user ? `<p class="hint">${T('Tu as déjà choisi tes {n} leçons gratuites.', { n: auth.config.demoMax || 3 })}</p>` : `<p class="hint">${T('Crée un compte gratuit pour choisir 3 leçons de ton choix en démo.')}</p>`}
      <div class="row"><a class="btn big" href="#/tarifs">${T('Voir les tarifs')}</a><a class="btn ghost big" href="#/niveau/${lv.id}">${T('Retour au niveau')}</a></div></div></div>`, 'maths');
    const pb = $('#pickdemo'); if (pb) pb.onclick = () => pickDemo(sk.id);
  }

  function pagePricing() {
    document.title = T('Tarifs — Tadriss Sciences');
    const demo = auth.config.payment === 'demo';
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Tarifs')}</h1><p>${T('Un abonnement par niveau, valable {days} jours, sans reconduction automatique : tu paies quand tu veux continuer. Paiement en dinars par carte CIB ou Edahabia.', { days: auth.config.days })}</p></div>
      ${demo ? `<div class="note">${T('Mode test : aucun vrai paiement n’est effectué, le paiement est simulé.')}</div>` : ''}
      ${auth.config.prices.fam ? `<div class="pcard fam"><div><h2>${T('Forfait Famille')}</h2><div class="pamount"><b>${price('fam')}</b> ${T('DA')} <span>${T('/ mois')}</span></div></div>
        <p>${T('Tous les niveaux, de la grande section à la Terminale, pour tous les élèves du compte (jusqu’à 5 profils), avec un seul paiement.')}</p>
        ${valid('fam') ? `<p class="hint">${T('Actif jusqu’au {date}', { date: dateFr(auth.subscriptions.fam) })}</p>` : ''}
        <button class="btn" data-buy="fam">${valid('fam') ? T('Prolonger d’un mois') : T('Choisir le forfait Famille')}</button></div>` : ''}
      <div class="prices">${LEVELS.map((lv) => `<div class="pcard" style="--c:${lv.color}"><div class="pbadge" style="background:${lv.color}">${sh(lv)}</div><div class="pamount"><b>${price(lv.id)}</b> ${T('DA')} <span>${T('/ mois')}</span></div>
        <p>${T('{n} compétences avec exercices, correction immédiate, suivi et récompenses.', { n: implemented(lv).length })}${COURSES.some((c) => c.level === lv.id) ? ' ' + T('Les {c} cours illustrés du niveau sont inclus.', { c: COURSES.filter((c) => c.level === lv.id).length }) : ''}</p>
        ${valid(lv.id) ? `<p class="hint">${T('Actif jusqu’au {date}', { date: dateFr(auth.subscriptions[lv.id]) })}</p>` : ''}
        <button class="btn" style="background:${lv.color}" data-buy="${lv.id}">${valid(lv.id) ? T('Prolonger d’un mois') : T('S’abonner')}</button></div>`).join('')}</div>
      ${COURSE_LEVELS.some((l) => l.cycle === 'secondaire' && l.ready && !lvOf(l.id)) ? `<h2 style="margin:22px 0 8px">${T('Lycée : 2nde, 1re, Terminale')}</h2>` : ''}
      <div class="prices">${COURSE_LEVELS.filter((l) => l.cycle === 'secondaire' && l.ready && !lvOf(l.id)).map((l) => `<div class="pcard" style="--c:${l.color}"><div class="pbadge" style="background:${l.color}"><bdi>${l.label}</bdi></div><div class="pamount"><b>${price(l.id)}</b> ${T('DA')} <span>${T('/ mois')}</span></div>
        <p>${T('{n} cours illustrés en maths, physique et chimie, avec schémas animés, voix et quiz.', { n: COURSES.filter((c) => c.level === l.id).length })}</p>
        ${valid(l.id) ? `<p class="hint">${T('Actif jusqu’au {date}', { date: dateFr(auth.subscriptions[l.id]) })}</p>` : ''}
        <button class="btn" style="background:${l.color}" data-buy="${l.id}">${valid(l.id) ? T('Prolonger d’un mois') : T('S’abonner')}</button></div>`).join('')}</div>
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
    document.title = T('Connexion — Tadriss Sciences');
    show(`<div class="wrap narrow"><div class="lvhead"><h1>${T('Connexion')}</h1></div><form class="form panel" id="fLogin">
      ${field('email', T('Adresse e-mail'), 'email', 'autocomplete="email"')}${field('password', T('Mot de passe'), 'password', 'autocomplete="current-password"')}
      <p class="errtxt" id="err" role="alert"></p><button class="btn big" type="submit">${T('Me connecter')}</button>
      <p class="hint">${T('Pas encore de compte ? <a href="#/inscription">Créer un compte</a>')}</p>
      <p class="hint"><a href="#" id="forgot">${T('Mot de passe oublié ?')}</a></p>
      <div id="forgotbox" hidden><p class="hint">${T('Indique l’adresse e-mail de ton compte : nous notons ta demande et nous te donnerons un mot de passe temporaire à changer ensuite.')}</p>
        <div class="inl"><input id="femail" type="email" dir="ltr" autocomplete="email" aria-label="${T('Adresse e-mail')}"><button class="btn" type="button" id="fsend">${T('Envoyer la demande')}</button></div><p class="hint" id="forgotmsg" hidden></p></div></form></div>`, 'compte');
    $('#forgot').addEventListener('click', (e) => { e.preventDefault(); $('#forgotbox').hidden = false; const f = $('#femail'); f.value = $('#email').value; f.focus(); });
    $('#fsend').addEventListener('click', async () => {
      const o = $('#forgotmsg'); o.hidden = false;
      try { await api('/api/forgot', 'POST', { email: $('#femail').value }); o.textContent = T('Demande enregistrée. Tu recevras un mot de passe temporaire de notre part.'); } catch (e) { o.textContent = e.message; }
    });
    $('#fLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await afterAuth(await api('/api/login', 'POST', { email: $('#email').value, password: $('#password').value })); }
      catch (er) { $('#err').textContent = er.message; }
    });
  }

  function pageRegister() {
    document.title = T('Créer un compte — Tadriss Sciences');
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
    document.title = T('Mon compte — Tadriss Sciences');
    const subs = LEVELS.filter((l) => valid(l.id));
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Mon compte')}</h1><p dir="ltr" style="text-align:start">${esc(auth.user.email)}</p></div>
      <div class="panel"><h2>${T('Profils des élèves')}</h2><div class="profs">${auth.profiles.map((p) => `<div class="prof ${p.id === auth.active ? 'on' : ''}"><b>${esc(p.name)}</b><span>${sh(lvOf(p.level))}</span>
        ${p.id === auth.active ? `<span class="soon-tag free">${T('profil actif')}</span>` : `<button class="btn ghost sm" data-sel="${p.id}">${T('Choisir')}</button>`}
        ${auth.profiles.length > 1 ? `<button class="btn ghost sm" data-del="${p.id}" aria-label="${T('Supprimer')} ${esc(p.name)}">${T('Supprimer')}</button>` : ''}</div>`).join('')}</div>
        ${auth.profiles.length < 5 ? `<form class="inl" id="fProf"><input id="pname" placeholder="${T('Prénom')}" maxlength="40" required aria-label="${T('Prénom du nouvel élève')}"><select id="plevel" aria-label="${T('Niveau')}">${LEVELS.map((l) => `<option value="${l.id}">${sh(l)}</option>`).join('')}</select><button class="btn" type="submit">${T('Ajouter un profil')}</button></form>` : ''}<p class="errtxt" id="err"></p></div>
      <div class="panel"><h2>${T('Abonnements')}</h2>${(subs.length || valid('fam')) ? (valid('fam') ? `<div class="stat"><span>${T('Forfait Famille')}</span><b>${T('jusqu’au {date}', { date: dateFr(auth.subscriptions.fam) })}</b></div>` : '') + subs.map((l) => `<div class="stat"><span>${sh(l)}</span><b>${T('jusqu’au {date}', { date: dateFr(auth.subscriptions[l.id]) })}</b></div>`).join('') : `<p class="hint">${T('Aucun abonnement actif. Les compétences gratuites restent accessibles.')}</p>`}<p style="margin-top:12px"><a class="btn" href="#/tarifs">${T('Voir les tarifs')}</a></p></div>
      <div class="panel"><h2>${T('Derniers paiements')}</h2>${auth.payments.length ? auth.payments.map((x) => `<div class="stat"><span>${planName(x.level)} · ${x.amount} ${T('DA')} · ${dateFr(x.date)}</span><b>${{ paid: T('payé'), pending: T('en attente'), failed: T('échoué') }[x.status] || x.status}</b></div>`).join('') : `<p class="hint">${T('Aucun paiement pour l’instant.')}</p>`}</div>
      ${auth.user.admin ? `<p><a class="btn" href="#/admin">${T('Tableau de bord administrateur')}</a></p>` : ''}
      <p style="margin-bottom:30px"><button class="btn ghost" id="logout">${T('Me déconnecter')}</button></p></div>`, 'compte');
    const swap = async (fn) => { try { applyMe(await fn()); await loadProgress(); pageAccount(); } catch (e) { $('#err').textContent = e.message; } };
    document.querySelectorAll('[data-sel]').forEach((b) => b.addEventListener('click', () => { pushNow(false); swap(() => api(`/api/profiles/${b.dataset.sel}/select`, 'POST', {})); }));
    document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { if (confirm(T('Supprimer ce profil et sa progression ?'))) swap(() => api(`/api/profiles/${b.dataset.del}`, 'DELETE')); }));
    const f = $('#fProf'); if (f) f.addEventListener('submit', (e) => { e.preventDefault(); pushNow(false); swap(() => api('/api/profiles', 'POST', { name: $('#pname').value, level: $('#plevel').value })); });
    $('#logout').onclick = async () => { pushNow(false); await api('/api/logout', 'POST', {}).catch(() => {}); applyMe({ user: null, config: auth.config }); store = localLoad(); location.hash = '#/'; route(); };
  }

  async function pagePaid(ok) {
    document.title = T('Paiement — Tadriss Sciences');
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
    document.title = T('Conditions et confidentialité — Tadriss Sciences');
    show(`<div class="wrap narrow"><div class="lvhead"><h1>${T('Conditions et confidentialité')}</h1></div><div class="note">${T('Texte provisoire à faire relire et compléter (nom de l’éditeur, adresse, contact) avant l’ouverture au public.')}</div>
      <div class="panel legal"><h2>${T('Le service')}</h2><p>${T('Tadriss Sciences propose des exercices de mathématiques, de physique et de chimie et des cours illustrés en ligne, de la grande section à la Terminale. Trois compétences par niveau sont gratuites ; le reste du niveau est accessible avec un abonnement.')}</p>
      <h2>${T('Abonnements et paiement')}</h2><p>${T('Un abonnement concerne un niveau et dure {days} jours à partir du paiement. Il n’est pas reconduit automatiquement. Le paiement se fait en dinars algériens par carte CIB ou Edahabia, via le prestataire Chargily Pay. Tadriss Sciences ne reçoit ni ne conserve les numéros de carte.', { days: auth.config.days })}</p>
      <h2>${T('Données personnelles')}</h2><p>${T('Nous conservons l’adresse e-mail du parent, les prénoms des profils d’élèves, leur progression dans les exercices et l’historique des paiements. Ces données servent uniquement à faire fonctionner le service. Aucune publicité, aucune revente de données.')}</p>
      <h2>${T('Supprimer son compte')}</h2><p>${T('Un profil peut être supprimé depuis « Mon compte ». Pour supprimer tout le compte, écrire à l’adresse de contact (à compléter).')}</p></div></div>`, 'compte');
  }

  /* ---------- contact : formulaire simple, les messages arrivent dans l'administration (et par e-mail si SMTP est configuré) ---------- */
  const CONTACT_MAIL = 'contact@veloraia.fr';
  function pageContact() {
    document.title = T('Contact — Tadriss Sciences');
    show(`<div class="wrap narrow"><div class="cbox">
      <div class="chd"><span class="cmail" aria-hidden="true">✉️</span><div><h1>${T('Nous contacter')}</h1><p>${T('Une question, un problème, une idée ? Écris-nous, nous répondons par e-mail.')}</p></div></div>
      <form class="cform" id="cForm" novalidate>
        <div class="cf"><label for="cName">${T('Ton nom')}</label><input id="cName" maxlength="80" required autocomplete="name" placeholder="${T('Ton prénom et ton nom')}"></div>
        <div class="cf"><label for="cMail">${T('Ton adresse e-mail')}</label><input id="cMail" type="email" dir="ltr" maxlength="254" required autocomplete="email" placeholder="nom@exemple.com" value="${auth.user ? esc(auth.user.email) : ''}"></div>
        <div class="cf"><label for="cMsg">${T('Ton message')}</label><textarea id="cMsg" rows="7" maxlength="3000" required placeholder="${T('Écris ton message ici…')}"></textarea></div>
        <input id="cWeb" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none">
        <p class="errtxt" id="cErr" aria-live="polite"></p>
        <button class="btn big cgo" id="cGo" type="submit">${T('Envoyer le message')}</button>
      </form>
      <p class="cdirect">${T('Ou écris directement à')} <a href="mailto:${CONTACT_MAIL}" dir="ltr">${CONTACT_MAIL}</a></p></div></div>`, 'compte');
    $('#cForm').onsubmit = async (e) => {
      e.preventDefault(); const er = $('#cErr'); er.textContent = '';
      if (!$('#cName').value.trim() || !$('#cMail').checkValidity() || !$('#cMail').value || $('#cMsg').value.trim().length < 5) { er.textContent = T('Écris ton nom, une adresse e-mail valide et ton message.'); return; }
      $('#cGo').disabled = true;
      try {
        await api('/api/contact', 'POST', { name: $('#cName').value, email: $('#cMail').value, message: $('#cMsg').value, website: $('#cWeb').value });
        $('#cForm').outerHTML = `<div class="csent" role="status"><span aria-hidden="true">✅</span><h2>${T('Message envoyé')}</h2><p>${T('Merci ! Ton message est envoyé, nous te répondons bientôt.')}</p><a class="btn ghost" href="#/">${T('Retour à l’accueil')}</a></div>`;
      } catch (x) { er.textContent = x.message; $('#cGo').disabled = false; }
    };
  }

  /* ---------- administration : clients, abonnements, paiements ---------- */
  const PLANS = () => [...LEVELS.map((l) => ({ id: l.id, label: sh(l) })), ...COURSE_LEVELS.filter((l) => l.cycle === 'secondaire').map((l) => ({ id: l.id, label: planName(l.id) })), { id: 'fam', label: T('Forfait Famille') }];
  const planLabel = (id) => (PLANS().find((p) => p.id === id) || { label: id }).label;
  const da = (n) => `<span style="white-space:nowrap">${Number(n).toLocaleString('fr-FR')} ${T('DA')}</span>`;
  function pageAdmin() {
    document.title = T('Administration — Tadriss Sciences');
    if (!auth.user) { returnTo = '#/admin'; return pageLogin(); }
    if (!auth.user.admin) { show(`<div class="wrap narrow"><div class="lvhead"><h1>${T('Administration')}</h1></div><div class="note">${T('Ce compte n’a pas accès à l’administration.')}</div><p><a class="btn ghost" href="#/compte">${T('Mon compte')}</a></p></div>`, 'compte'); return; }
    show(`<div class="wrap"><div class="lvhead"><h1>${T('Tableau de bord')}</h1></div>
      <div class="kpis" id="kpis"></div>
      <div class="panel" id="msgbox" hidden><h2>${T('Messages de contact')}</h2><div id="msglist"></div></div>
      <div class="panel" id="reqbox" hidden><h2>${T('Demandes de mot de passe')}</h2><div id="reqlist"></div></div>
      <div class="panel"><h2>${T('Clients')}</h2>
        <form class="inl" id="fSearch"><input id="aq" type="search" dir="ltr" placeholder="${T('Rechercher par e-mail')}" aria-label="${T('Rechercher par e-mail')}"><button class="btn" type="submit">${T('Chercher')}</button></form>
        <p class="errtxt" id="aerr"></p><div id="alist"></div></div></div>`, 'compte');
    const fail = (e) => { $('#aerr').textContent = e.message; };
    const loadStats = () => api('/api/admin/stats').then((s) => {
      $('#kpis').innerHTML = [[s.users, T('Comptes')], [s.subscribers, T('Abonnés actifs')], [da(s.revenue_month), T('Revenus du mois')], [da(s.revenue_total), T('Revenus au total')]]
        .map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('');
    }).catch(fail);
    const loadMsgs = () => api('/api/admin/messages').then((d) => {
      $('#msgbox').hidden = !d.messages.length;
      $('#msglist').innerHTML = d.messages.map((m) => `<div class="stat" style="display:block"><b>${esc(m.name)}</b> · <a href="mailto:${esc(m.email)}" dir="ltr">${esc(m.email)}</a> · ${dateFr(m.date)}<p style="white-space:pre-wrap;margin:4px 0 10px">${esc(m.message)}</p></div>`).join('');
    }).catch(fail);
    const loadReq = () => api('/api/admin/requests').then((d) => {
      $('#reqbox').hidden = !d.requests.length;
      $('#reqlist').innerHTML = d.requests.map((r) => `<div class="stat"><span dir="ltr">${esc(r.email)} · ${dateFr(r.date)}</span><button class="btn ghost sm" data-req="${esc(r.email)}">${T('Voir le client')}</button></div>`).join('');
      document.querySelectorAll('[data-req]').forEach((b) => b.addEventListener('click', () => { $('#aq').value = b.dataset.req; loadList(); window.scrollTo(0, document.body.scrollHeight); }));
    }).catch(fail);
    const subsText = (u) => { const k = Object.keys(u.subscriptions); return k.length ? k.map((p) => `${planLabel(p)} (${T('jusqu’au {date}', { date: dateFr(u.subscriptions[p]) })})`).join(' · ') : T('Aucun abonnement actif.'); };
    const loadList = () => api('/api/admin/users?q=' + encodeURIComponent($('#aq').value.trim())).then((d) => {
      $('#alist').innerHTML = d.users.length ? d.users.map((u) => `<div class="cl" data-u="${u.id}"><div class="clh"><b dir="ltr">${esc(u.email)}</b><span>${T('inscrit le {date}', { date: dateFr(u.created) })} · ${u.profiles} ${T('profil(s)')} · ${da(u.paid)}</span><span>${subsText(u)}</span></div><button class="btn ghost sm" data-open="${u.id}">${T('Gérer')}</button><div class="cld" hidden></div></div>`).join('') : `<p class="hint">${T('Aucun client trouvé.')}</p>`;
      document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openClient(b.closest('.cl'))));
    }).catch(fail);
    async function openClient(box) {
      const det = $('.cld', box); if (!det.hidden) { det.hidden = true; return; }
      try {
        const d = await api('/api/admin/users/' + box.dataset.u); det.hidden = false;
        const act = Object.keys(d.user.subscriptions);
        det.innerHTML = `<form class="inl" data-grant><select aria-label="${T('Niveau')}">${PLANS().map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}</select>
          <label>${T('Jours')} <input type="number" min="1" max="366" value="30" dir="ltr" style="width:80px"></label>
          <label>${T('Montant payé (DA)')} <input type="number" min="0" max="100000" value="0" dir="ltr" style="width:100px"></label>
          <button class="btn" type="submit">${T('Activer ou prolonger')}</button></form>
          <p class="hint">${T('Si le client a payé en espèces, indique le montant : il sera compté dans les revenus.')}</p>
          ${act.map((p) => `<div class="stat"><span>${planLabel(p)} · ${T('jusqu’au {date}', { date: dateFr(d.user.subscriptions[p]) })}</span><button class="btn ghost sm" data-rm="${p}">${T('Retirer')}</button></div>`).join('')}
          <div class="stat"><span>${T('Mot de passe oublié ?')}</span><button class="btn ghost sm" data-resetpw>${T('Réinitialiser le mot de passe')}</button></div><p class="hint" id="pwres" hidden></p>
          <div class="stat"><span>${T('Leçons gratuites choisies : {list}', { list: d.picks.length ? d.picks.map((x) => x.split('-')[0].toUpperCase() + ' ' + x.split('-')[1]).join(', ') : '—' })}</span>${d.picks.length || (d.coursePicks || []).length ? `<button class="btn ghost sm" data-resetpicks>${T('Remettre à zéro')}</button>` : ''}</div>
          <div class="stat"><span>${T('Cours gratuits choisis : {list}', { list: (d.coursePicks || []).length ? d.coursePicks.join(', ') : '—' })}</span></div>
          <h3>${T('Historique des paiements')}</h3>${d.payments.length ? d.payments.map((x) => `<div class="stat"><span>${planLabel(x.level)} · ${da(x.amount)} · ${dateFr(x.date)} · ${x.provider === 'manuel' ? T('espèces') : esc(x.provider)}</span><b>${{ paid: T('payé'), pending: T('en attente'), failed: T('échoué') }[x.status] || x.status}</b></div>`).join('') : `<p class="hint">${T('Aucun paiement pour l’instant.')}</p>`}`;
        const refresh = () => { loadStats(); loadList(); loadReq(); };
        $('[data-grant]', det).addEventListener('submit', async (e) => { e.preventDefault(); const f = e.target, i = f.querySelectorAll('input');
          try { await api(`/api/admin/users/${box.dataset.u}/subscription`, 'POST', { plan: f.querySelector('select').value, days: i[0].value, amount: i[1].value }); refresh(); } catch (er) { fail(er); } });
        $('[data-resetpw]', det).addEventListener('click', async () => { if (!confirm(T('Réinitialiser le mot de passe de ce client ?'))) return;
          try { const r = await api(`/api/admin/users/${box.dataset.u}/password`, 'POST', {}); const o = $('#pwres', det); o.hidden = false; o.innerHTML = `${T('Mot de passe temporaire (à transmettre au client, affiché une seule fois) :')} <b dir="ltr">${r.password}</b>`; loadReq(); } catch (er) { fail(er); } });
        const rp = $('[data-resetpicks]', det); if (rp) rp.addEventListener('click', async () => { try { await api(`/api/admin/users/${box.dataset.u}/picks`, 'POST', { reset: true }); det.hidden = true; openClient(box); } catch (er) { fail(er); } });
        det.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', async () => { if (!confirm(T('Retirer cet abonnement ?'))) return;
          try { await api(`/api/admin/users/${box.dataset.u}/subscription`, 'POST', { plan: b.dataset.rm, remove: true }); refresh(); } catch (er) { fail(er); } }));
      } catch (e) { fail(e); }
    }
    $('#fSearch').addEventListener('submit', (e) => { e.preventDefault(); loadList(); });
    loadStats(); loadList(); loadReq(); loadMsgs();
  }


  /* ---------- cours illustrés (5e : maths, physique, chimie) ---------- */
  const speech = { on: false, token: 0 };
  const synth = window.speechSynthesis;
  function stopSpeak() {
    speech.token++; speech.on = false;
    if (synth) synth.cancel();
    document.querySelectorAll('.cstep.speaking').forEach((n) => n.classList.remove('speaking'));
    const b = $('#cPlay'); if (b) b.textContent = '▶ ' + T('Écouter le cours');
  }
  const plainAr = (h) => h.replace(/<span class="frac"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, '$1 على $2').replace(/<br>/g, '. ').replace(/<[^>]+>/g, '')
    .replace(/&gt;/g, ' أكبر من ').replace(/&lt;/g, ' أصغر من ').replace(/km\/h/g, ' كيلومتر في الساعة ').replace(/m\/s/g, ' متر في الثانية ').replace(/km\/s/g, ' كيلومتر في الثانية ')
    .replace(/°C/g, ' درجة مئوية').replace(/°/g, ' درجة').replace(/cm²/g, ' سنتيمتر مربع').replace(/cm³/g, ' سنتيمتر مكعب').replace(/dm³/g, ' ديسيمتر مكعب')
    .replace(/×/g, ' ضرب ').replace(/÷/g, ' مقسوم على ').replace(/−/g, ' ناقص ').replace(/=/g, ' يساوي ').replace(/\+/g, ' زائد ').replace(/≈/g, ' يساوي تقريبًا ').replace(/π/g, ' باي ')
    .replace(/(\d)\s*%/g, '$1 في المئة').replace(/\s+/g, ' ').trim();
  const plainFr = (h) => h.replace(/<span class="frac"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, '$1 sur $2').replace(/<br>/g, '. ').replace(/<[^>]+>/g, '')
    .replace(/&gt;/g, ' supérieur à ').replace(/&lt;/g, ' inférieur à ').replace(/km\/h/g, ' kilomètres par heure ').replace(/m\/s/g, ' mètres par seconde ').replace(/km\/s/g, ' kilomètres par seconde ')
    .replace(/°C/g, ' degrés Celsius').replace(/°/g, ' degrés').replace(/cm²/g, ' centimètres carrés').replace(/cm³/g, ' centimètres cubes').replace(/dm³/g, ' décimètres cubes')
    .replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ').replace(/−/g, ' moins ').replace(/=/g, ' égale ').replace(/\+/g, ' plus ').replace(/≈/g, ' environ ').replace(/π/g, ' pi ')
    .replace(/(\d)\s*%/g, '$1 pour cent').replace(/\s+/g, ' ').trim();
  const plain = (h) => (lang === 'ar' ? plainAr(h) : plainFr(h));
  const hasArVoice = () => !!synth && synth.getVoices().some((x) => /^ar/i.test(x.lang));
  const canSpeak = () => !!synth && (lang !== 'ar' || hasArVoice());
  if (synth) synth.addEventListener('voiceschanged', () => { if (lang === 'ar' && /^#\/cours/.test(location.hash)) route(); });
  const hasAr = (c) => !!(window.AR_COURSES && window.AR_COURSES[c.id]);
  const cl = (c) => { // version du cours dans la langue de l'interface
    const a = lang === 'ar' && hasAr(c) ? window.AR_COURSES[c.id] : null; if (!a) return c;
    return Object.assign({}, c, { title: a.title, intro: a.intro, recap: a.recap, steps: c.steps.map((x, i) => Object.assign({}, x, a.steps[i])), quiz: c.quiz.map((q, i) => Object.assign({}, q, a.quiz[i])) });
  };
  const figT = (h) => (lang === 'ar' && window.AR_FIGS ? h.replace(/(<text[^>]*>)([^<]*)(<\/text>)/g, (m, x, t, y) => x + (window.AR_FIGS[t] || t) + y) : h);
  function say(text, token, onEnd) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'ar' ? 'ar-SA' : 'fr-FR'; u.rate = 0.95;
    const v = synth.getVoices().find((x) => (lang === 'ar' ? /^ar/i : /^fr/i).test(x.lang)); if (v) u.voice = v;
    u.onend = () => { if (speech.token === token) onEnd(); };
    u.onerror = () => { if (speech.token === token) onEnd(); };
    synth.speak(u);
  }
  function playParts(parts, el) { // parts : [{ text, node }]
    stopSpeak(); speech.on = true; const token = speech.token;
    const b = $('#cPlay'); if (b) b.textContent = '⏹ ' + T('Arrêter');
    let i = 0;
    const next = () => {
      document.querySelectorAll('.cstep.speaking').forEach((n) => n.classList.remove('speaking'));
      if (i >= parts.length || speech.token !== token) { if (speech.token === token) stopSpeak(); return; }
      const p = parts[i++]; if (p.node) { p.node.classList.add('speaking'); p.node.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      say(p.text, token, next);
    };
    next();
  }

  let courseLevel = '5e';
  const lvName = (id) => { const l = COURSE_LEVELS.find((x) => x.id === id); return l ? T(l.full || l.label) : id; };
  const cycleOf = (lv) => (COURSE_LEVELS.find((l) => l.id === lv) || {}).cycle || 'moyen';
  let courseCycle = 'moyen', courseSubj = 'all';
  function pageCourses() {
    stopSpeak();
    document.title = T('Cours — Tadriss Sciences');
    const chips = COURSE_LEVELS.filter((l) => l.cycle === courseCycle && l.ready).map((l) => l.ready ? `<button class="pill ${l.id === courseLevel ? 'on' : ''}" style="background:#3b3a8f;font-family:inherit;cursor:pointer" data-clv="${l.id}" aria-pressed="${l.id === courseLevel}">${l.label}</button>` : `<span class="pill off">${l.label} <small>${T('bientôt')}</small></span>`).join('');
    const subjs = COURSE_SUBJECTS.filter((s) => COURSES.some((c) => c.subj === s.id && c.level === courseLevel));
    if (courseSubj !== 'all' && !subjs.some((s) => s.id === courseSubj)) courseSubj = 'all';
    const spills = subjs.length > 1 ? `<div class="pills" style="margin:10px 0">${[{ id: 'all', icon: '📚', label: 'Tout' }, ...subjs].map((s) => `<button class="pill ${s.id === courseSubj ? 'on' : ''}" style="background:${s.color || '#0d9488'};font-family:inherit;cursor:pointer" data-csub="${s.id}" aria-pressed="${s.id === courseSubj}">${s.icon} ${T(s.label)} (${s.id === 'all' ? COURSES.filter((c) => c.level === courseLevel).length : COURSES.filter((c) => c.level === courseLevel && c.subj === s.id).length})</button>`).join('')}</div>` : '';
    const secs = subjs.filter((s) => courseSubj === 'all' || s.id === courseSubj).map((s) => `<section class="csub" style="--c:${s.color}"><h2>${s.icon} ${T(s.label)}</h2><div class="cgrid">${COURSES.filter((c) => c.subj === s.id && c.level === courseLevel).map((c) => `<a class="ccard" href="#/cours/${c.id}"><span class="cic">${c.icon}</span><span><b>${cl(c).title}</b><small><bdi>${c.level}</bdi> · ${c.steps.length} ${T('étapes')} · ${T('audio')}</small></span>${courseOpen(c) ? (!auth.config.open && !auth.offline && !valid('fam') ? `<span class="soon-tag free">${T('Gratuit')}</span>` : '') : `${auth.user && coursePicksLeft() > 0 ? `<span class="pick" data-cpick="${c.id}">☆ ${T('Choisir')}</span>` : ''}<span class="lock" title="${T('Réservé aux abonnés')}">🔒</span>`}</a>`).join('')}</div></section>`).join('');
    show(`<div class="wrap"><div class="lvhead"><h1><img class="ttl-ic" src="/img/ico-2.jpg" alt="" width="44" height="44">${T('Cours illustrés')}</h1><p>${T('Des cours courts, illustrés et lus à voix haute, en maths, physique et chimie. Pour chaque cours : les étapes, ce qu’il faut retenir et un petit quiz.')}</p></div>
      <p style="margin:6px 0"><a href="#/">${T('‹ Tous les niveaux')}</a></p>
      <div class="pills" style="margin:10px 0">${chips}</div>
      ${spills}
      ${lang === 'ar' && COURSES.some((c) => !hasAr(c)) ? `<div class="note">${T('Les cours sont pour le moment en français.')}</div>` : ''}
      ${auth.user && !auth.offline && !auth.config.open && !valid('fam') ? `<div class="note">${coursePicksLeft() > 0 ? T('Ton essai : choisis {left} cours gratuit(s) de ton choix. Touche « ☆ Choisir » à côté d’un cours verrouillé 🔒.', { left: coursePicksLeft() }) : T('Tu as choisi tes {n} cours gratuits. Les autres demandent un abonnement.', { n: auth.config.courseMax || 3 })}</div>` : !auth.user && !auth.offline && !auth.config.open ? `<div class="note">${T('Crée un compte gratuit pour choisir 3 cours de ton choix pour l’essai.')} <a href="#/inscription">${T('Créer un compte')}</a></div>` : ''}
      ${canSpeak() ? '' : `<div class="note">${T('La lecture à voix haute n’est pas disponible sur ce navigateur.')}</div>`}
      ${secs}</div>`, 'cours');
    document.querySelectorAll('[data-clv]').forEach((b) => b.addEventListener('click', () => { courseLevel = b.dataset.clv; courseSubj = 'all'; pageCourses(); }));
    document.querySelectorAll('[data-csub]').forEach((b) => b.addEventListener('click', () => { courseSubj = b.dataset.csub; pageCourses(); }));
    document.querySelectorAll('[data-cpick]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); pickCourse(b.dataset.cpick); }));
  }

  function pageCourse(id) {
    stopSpeak();
    const raw = COURSES.find((x) => x.id === id); if (!raw) return pageCourses();
    const c = cl(raw);
    const sj = COURSE_SUBJECTS.find((s) => s.id === c.subj);
    courseLevel = c.level; courseCycle = cycleOf(c.level);
    const idx = COURSES.filter((x) => x.subj === c.subj && x.level === c.level), pos = idx.indexOf(raw);
    const prev = idx[pos - 1] && cl(idx[pos - 1]), nextC = idx[pos + 1] && cl(idx[pos + 1]);
    document.title = `${c.title} — Tadriss Sciences`;
    if (!courseOpen(raw)) {
      const sjl = COURSE_SUBJECTS.find((x) => x.id === raw.subj);
      show(`<div class="wrap narrow"><div class="crumb"><a href="#/cours/niv-${c.level}">${T('Cours')}</a> › ${sjl.icon} ${T(sjl.label)} › <bdi>${lvName(c.level)}</bdi></div>
        <div class="qcard center"><div class="bigico">🔒</div><h1>${T('Cours réservé aux abonnés')}</h1>
        <p><b>${c.icon} ${c.title}</b></p><p>${c.intro}</p>
        ${auth.user && coursePicksLeft() > 0 ? `<p class="hint">${T('Ton essai : tu peux choisir {n} cours gratuits parmi tous les cours du site. Il t’en reste {left}.', { n: auth.config.courseMax || 3, left: coursePicksLeft() })}</p>
        <div class="row"><button class="btn big" id="pickcourse">${T('Choisir ce cours pour mon essai')}</button></div><p class="hint" id="cpickerr"></p>` : auth.user ? `<p class="hint">${T('Tu as déjà choisi tes {n} cours gratuits.', { n: auth.config.courseMax || 3 })}</p>` : `<p class="hint">${T('Crée un compte gratuit pour choisir 3 cours de ton choix pour l’essai.')}</p><div class="row"><a class="btn big" href="#/inscription">${T('Créer un compte')}</a></div>`}
        ${auth.config.prices[raw.level] ? `<p>${T('Abonnement {lv} : <b>{price} DA par mois</b>, tous les cours du niveau débloqués.', { lv: lvName(raw.level), price: auth.config.prices[raw.level] })}</p>` : ''}
        <div class="row"><a class="btn big ${auth.user ? '' : 'ghost'}" href="#/tarifs">${T('Voir les tarifs')}</a><a class="btn ghost big" href="#/cours">${T('Tous les cours')}</a></div></div></div>`, 'maths');
      const pb = $('#pickcourse'); if (pb) pb.onclick = () => pickCourse(raw.id);
      return;
    }
    const steps = c.steps.map((s, i) => `<section class="cstep" data-i="${i}"><div class="chd"><span class="n">${i + 1}</span><h3>${s.h}</h3>${canSpeak() ? `<button class="btn ghost sm" data-say="${i}" aria-label="${T('Écouter cette étape')}">🔊</button>` : ''}</div><div class="cbd"><p>${s.p}</p>${s.fig ? figT(courseFig(s.fig)) : ''}</div></section>`).join('');
    const quiz = c.quiz.map((q, qi) => `<div class="cq" data-q="${qi}"><p><b>${qi + 1}.</b> ${q.q}</p><div class="cch">${q.choices.map((ch, ci) => `<button class="btn ghost" data-a="${ci}">${ch}</button>`).join('')}</div><p class="cres" aria-live="polite"></p></div>`).join('');
    show(`<div class="wrap narrow cours" style="--c:${sj.color}"><div class="crumb"><a href="#/cours/niv-${c.level}">${T('Cours')}</a> › ${sj.icon} ${T(sj.label)} › <bdi>${lvName(c.level)}</bdi></div>
      <div class="chead"><span class="cic big">${c.icon}</span><div><h1>${c.title}</h1><p>${c.intro}</p></div></div>
      ${lang === 'ar' && !hasAr(raw) ? `<div class="note">${T('Les cours sont pour le moment en français.')}</div>` : ''}
      <section class="stage" id="stage" aria-live="polite"><div class="sdots" id="sDots"></div><div class="sbody" id="sBody"></div>
        <div class="sctl"><button class="btn ghost" id="sPrev" aria-label="${T('Précédent')}">⏮</button><button class="btn big" id="sPlay">▶ ${T('Lancer le cours animé')}</button><button class="btn ghost" id="sNext" aria-label="${T('Suivant')}">⏭</button></div></section>
      <h2 class="section-t cs-t">${T('Le cours en détail')}</h2>
      ${steps}
      <section class="cstep recap"><div class="chd"><span class="n">★</span><h3>${T('À retenir')}</h3></div><div class="cbd"><ul>${c.recap.map((r) => `<li>${r}</li>`).join('')}</ul></div></section>
      <section class="panel"><h2>${T('Petit quiz')}</h2>${quiz}</section>
      <div class="row cnav">${prev ? `<a class="btn ghost" href="#/cours/${prev.id}">‹ ${prev.title}</a>` : '<span></span>'}${nextC ? `<a class="btn" href="#/cours/${nextC.id}">${nextC.title} ›</a>` : `<a class="btn" href="#/cours">${T('Tous les cours')}</a>`}</div></div>`, 'maths');
    const parts = () => [{ text: `${c.title}. ${plain(c.intro)}`, node: null }, ...c.steps.map((s, i) => ({ text: `${lang === 'ar' ? 'الخطوة' : 'Étape'} ${i + 1}. ${plain(s.h)}. ${plain(s.p)}`, node: document.querySelector(`.cstep[data-i="${i}"]`) })),
      { text: `${T('À retenir')}. ${c.recap.map(plain).join('. ')}`, node: document.querySelector('.cstep.recap') }];
    // lecteur animé : introduction, une étape à la fois, puis « à retenir »
    let lastFig = c.steps.find((s) => s.fig);
    lastFig = lastFig ? lastFig.fig : '';
    let carry = '';
    const items = [{ h: c.title, p: c.intro, fig: lastFig, big: !lastFig, icon: c.icon, text: `${c.title}. ${plain(c.intro)}` },
      ...c.steps.map((s, i) => { if (s.fig) carry = s.fig; return { h: s.h, p: s.p, fig: carry, big: !carry, n: i + 1, text: `${lang === 'ar' ? 'الخطوة' : 'Étape'} ${i + 1}. ${plain(s.h)}. ${plain(s.p)}` }; }),
      { h: T('À retenir'), p: `<ul>${c.recap.map((r) => `<li>${r}</li>`).join('')}</ul>`, fig: '', n: '★', text: `${T('À retenir')}. ${c.recap.map(plain).join('. ')}` }];
    let cur = 0, playing = false, timer = null;
    const dots = $('#sDots'), body = $('#sBody'), sp = $('#sPlay');
    dots.innerHTML = items.map((_, i) => `<button class="sd" data-d="${i}" aria-label="${i + 1}"></button>`).join('');
    const stopPlayer = () => { playing = false; clearTimeout(timer); speech.token++; if (synth) synth.cancel(); sp.textContent = '▶ ' + (cur >= items.length - 1 ? T('Revoir le cours animé') : T('Lancer le cours animé')); };
    const draw = (i) => {
      cur = i; const it = items[i];
      dots.querySelectorAll('.sd').forEach((d, k) => d.classList.toggle('on', k === i));
      body.innerHTML = `<div class="sstep"><div class="sh">${it.icon ? `<span class="cic big">${it.icon}</span>` : `<span class="n">${it.n}</span>`}<h2>${it.h}</h2></div><div class="sp">${it.p}</div>${it.fig ? figT(courseFig(it.fig)) : it.big ? `<div class="sbig" aria-hidden="true">${c.icon}</div>` : ''}</div>`;
      body.querySelectorAll('.cfig > *').forEach((n, k) => { n.style.setProperty('--k', k); });
    };
    const goto = (i) => { i = Math.max(0, Math.min(items.length - 1, i)); const was = playing; stopPlayer(); draw(i); if (was) start(i); };
    const start = (i) => {
      stopPlayer(); playing = true; sp.textContent = '⏸ ' + T('Pause'); draw(i); const token = speech.token;
      const after = () => { if (!playing || speech.token !== token) return; if (cur >= items.length - 1) { stopPlayer(); return; } timer = setTimeout(() => { if (playing && speech.token === token) { start(cur + 1); } }, 700); };
      if (canSpeak()) say(items[i].text, token, after); else timer = setTimeout(after, Math.max(3500, items[i].text.length * 55));
    };
    sp.onclick = () => { if (playing) stopPlayer(); else start(cur >= items.length - 1 ? 0 : cur); };
    $('#sPrev').onclick = () => goto(cur - 1); $('#sNext').onclick = () => goto(cur + 1);
    dots.onclick = (e) => { const d = e.target.closest('[data-d]'); if (d) goto(Number(d.dataset.d)); };
    draw(0);
    document.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => { const p = parts()[Number(b.dataset.say) + 1]; playParts([p]); }));
    tutorCtx = { course: raw.id, lesson: [c.title, plain(c.intro), ...c.steps.map((x) => `${plain(x.h)} : ${plain(x.p)}`), c.recap.map(plain).join(' ; ')].join('\n') };
    document.querySelectorAll('.cq').forEach((box) => box.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const q = c.quiz[Number(box.dataset.q)], ok = Number(b.dataset.a) === q.a;
      box.querySelectorAll('[data-a]').forEach((x) => { x.disabled = true; if (Number(x.dataset.a) === q.a) x.classList.add('good'); });
      if (!ok) b.classList.add('bad');
      $('.cres', box).textContent = ok ? T('Bravo, c’est exact !') : T('Pas tout à fait : la bonne réponse est « {r} ».', { r: q.choices[q.a] });
    })));
  }

  /* ---------- tuteur IA : petit bonhomme « Aide » présent sur toutes les pages ----------
   * Sur la page d'un cours, la leçon entière est envoyée avec la question ; ailleurs, le texte de la page.
   * Le serveur vérifie l'abonnement et la limite de questions du jour. */
  let tutorCtx = null, tutorKey = null, tutorHist = [];
  const tutorEl = (() => {
    const w = document.createElement('div'); w.id = 'tutorRoot'; document.body.appendChild(w); return w;
  })();
  // Grand écran : Rizmi se place dans la marge, juste à côté de la colonne de contenu ; téléphone : coin de l'écran.
  function placeTutor() {
    const tb = $('#tBubble'), tp = $('#tutor'); if (!tb) return;
    tb.style.insetInlineEnd = ''; if (tp) tp.style.insetInlineEnd = '';
    const col = app.querySelector('.wrap'); if (!col || innerWidth < 800) return;
    const r = col.getBoundingClientRect(), rtl = document.documentElement.dir === 'rtl';
    const gutter = rtl ? r.left : innerWidth - r.right; // marge libre côté Rizmi
    const bw = tb.offsetWidth || 90, off = gutter - bw - 14;
    if (off < 16) return; // colonne large : on garde le coin
    tb.style.insetInlineEnd = off + 'px';
    if (tp) tp.style.insetInlineEnd = Math.max(16, Math.min(off, innerWidth - 400)) + 'px';
  }
  window.addEventListener('resize', placeTutor);
  function refreshTutor() {
    const showIt = !auth.offline; // sans clé API, la bulle s'affiche quand même et explique que le tuteur n'est pas activé
    const key = tutorCtx ? tutorCtx.course : '';
    if (!showIt) { tutorEl.innerHTML = ''; return; }
    const wasOpen = !!tutorEl.querySelector('#tutor:not([hidden])');
    if (key !== tutorKey) { tutorKey = key; tutorHist = []; }
    tutorEl.innerHTML = `<button class="tbubble" id="tBubble" aria-label="${T('Rizmi')} : ${T('Aide')}" aria-expanded="false"><svg class="mascot" viewBox="0 0 64 64" width="52" height="52" aria-hidden="true"><ellipse cx="32" cy="58" rx="16" ry="4" fill="rgba(0,0,0,.18)"/><path d="M14 52c0-9 8-14 18-14s18 5 18 14z" fill="#f59e0b"/><circle cx="32" cy="26" r="17" fill="#ffd9a8"/><path d="M13 22 32 10l19 12-19 7z" fill="#3b3a8f"/><path d="M22 27v6c0 3 5 5 10 5s10-2 10-5v-6l-10 5z" fill="#3b3a8f"/><path d="M51 22v10" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/><circle cx="51" cy="34" r="2.6" fill="#f59e0b"/><circle cx="26" cy="31" r="2.4" fill="#27264f"/><circle cx="38" cy="31" r="2.4" fill="#27264f"/><circle cx="22.5" cy="36" r="2.6" fill="#ff9aa2" opacity=".7"/><circle cx="41.5" cy="36" r="2.6" fill="#ff9aa2" opacity=".7"/><path d="M27 37c1.5 3 8.5 3 10 0" fill="none" stroke="#27264f" stroke-width="2" stroke-linecap="round"/></svg><b>${T('Rizmi')}</b></button>
      <section class="tpanel" id="tutor" hidden><div class="thead"><b>${T('Rizmi')} · ${T('Aide')}</b><button class="btn ghost sm" id="tClose" aria-label="${T('Fermer')}">✕</button></div>
      <p class="hint">${!auth.config.chat ? T('Le tuteur n\'est pas encore activé sur ce site.') + (auth.user && auth.user.admin ? ' Clé ANTHROPIC_API_KEY absente du serveur (Render → Environment), puis redéployer.' : '') : auth.user ? T('Salut, je suis Rizmi ! Pose-moi ta question, je t’explique autrement.') : T('Salut, je suis Rizmi ! Connecte-toi pour me poser une question.')}</p>
      ${auth.config.chat && auth.user ? `<div class="tlog" id="tLog" aria-live="polite"></div>
      <form class="trow" id="tForm"><input id="tIn" maxlength="500" autocomplete="off" placeholder="${T('Écris ta question…')}" aria-label="${T('Ta question')}"><button class="btn" id="tGo">${T('Envoyer')}</button></form>
      <p class="hint" id="tErr"></p>` : !auth.user ? `<a class="btn" href="#/connexion">${T('Connexion')}</a>` : ''}</section>`;
    const tb = $('#tBubble'), tp = $('#tutor');
    const tog = (on) => { tp.hidden = !on; tb.hidden = on; tb.setAttribute('aria-expanded', String(on)); if (on && $('#tIn')) $('#tIn').focus(); };
    tb.onclick = () => tog(true); $('#tClose').onclick = () => tog(false);
    placeTutor();
    const log = $('#tLog');
    if (!log) return;
    const bubble = (role, text) => { const d = document.createElement('div'); d.className = 'tmsg ' + role; d.textContent = text; log.appendChild(d); d.scrollIntoView({ block: 'nearest' }); return d; };
    tutorHist.forEach((m) => bubble(m.role === 'user' ? 'user' : 'bot', m.content));
    if (wasOpen) tog(true);
    const inp = $('#tIn'), go = $('#tGo'), er = $('#tErr');
    $('#tForm').onsubmit = async (e) => {
      e.preventDefault(); const q = inp.value.trim(); if (!q) return;
      inp.value = ''; er.textContent = ''; go.disabled = true; tutorHist.push({ role: 'user', content: q }); bubble('user', q);
      const wait = bubble('bot', '…');
      const lesson = tutorCtx ? tutorCtx.lesson : `${document.title}\n${(app.innerText || '').slice(0, 2500)}`;
      try {
        const r = await api('/api/chat', 'POST', { course: tutorCtx ? tutorCtx.course : '', lang, lesson, messages: tutorHist });
        tutorHist.push({ role: 'assistant', content: r.reply }); wait.textContent = r.reply;
        if (r.left !== null && r.left <= 3) er.textContent = T('Questions restantes aujourd’hui : {n}', { n: r.left });
      } catch (x) { tutorHist.pop(); wait.remove(); er.textContent = x.message; }
      go.disabled = false; inp.focus();
    };
  }

  /* ---------- routeur ---------- */
  function route() { tutorCtx = null; routePage(); refreshTutor(); }
  function routePage() {
    const [, page, arg] = (location.hash || '#/').split('/');
    $('#modal').hidden = true; if (page !== 'cours') stopSpeak();
    if (page === 'cours') { if (arg && arg.startsWith('niv-')) { courseLevel = arg.slice(4); courseCycle = cycleOf(courseLevel); courseSubj = 'all'; pageCourses(); } else if (arg) pageCourse(arg); else pageCourses(); return; }
    if (page === 'niveau') pageLevel(arg); else if (page === 'exercice') pagePractice(arg);
    else if (page === 'recompenses') pageRewards(arg); else if (page === 'suivi') pageProgress();
    else if (page === 'avantages') pageAbout(); else if (page === 'tarifs') pagePricing(); else if (page === 'connexion') pageLogin(); else if (page === 'inscription') pageRegister(); else if (page === 'compte') pageAccount(); else if (page === 'paiement') pagePaid(arg === 'succes'); else if (page === 'admin') pageAdmin(); else if (page === 'legal') pageLegal(); else if (page === 'contact') pageContact(); else if (page === 'recherche') pageSearch(arg); else pageHome();
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