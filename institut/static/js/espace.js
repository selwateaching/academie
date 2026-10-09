/* Espace cliente : parcours de réservation (public) + compte cliente */
(function () {
  const { h, icon, mount, get, post, put, del, eur, parse, isoDate, isoDT, hm, longDate, fullDate, shortDate, dur, cap, toast, fail, modal, confirmBox, field, fileToDataURL, statusBadge, CAT_ICON } = UI;
  const view = document.getElementById('view');
  const S = { user: null, info: null, services: [], flow: null, photos: {}, avail: {} };

  // ------------------------------------------------------------ état du parcours
  function saveFlow() { try { sessionStorage.setItem('flow', JSON.stringify(S.flow)); } catch (e) { /* stockage indisponible */ } }
  function loadFlow() { try { S.flow = JSON.parse(sessionStorage.getItem('flow') || 'null'); } catch (e) { S.flow = null; } }
  function resetFlow() { S.flow = null; S.photos = {}; try { sessionStorage.removeItem('flow'); } catch (e) { /* ignoré */ } }
  const svcById = (id) => S.services.find(s => s.id === +id);

  // --------------------------------------------------- conditions d'affichage (miroir du moteur serveur)
  function evalCond(c, a) {
    if (!c || !Object.keys(c).length) return true;
    if (c.all) return c.all.every(x => evalCond(x, a));
    if (c.any) return c.any.some(x => evalCond(x, a));
    const v = a[c.q], vals = v == null || v === '' ? [] : (Array.isArray(v) ? v : [v]), cv = c.v, cl = cv == null ? [] : (Array.isArray(cv) ? cv : [cv]);
    const S_ = (x) => String(x);
    switch (c.op) {
      case 'answered': return vals.length > 0;
      case 'eq': return Array.isArray(v) ? vals.map(S_).sort().join() === cl.map(S_).sort().join() : (vals.length > 0 && S_(vals[0]) === S_(cv));
      case 'neq': return !evalCond({ ...c, op: 'eq' }, a);
      case 'in': return vals.some(x => cl.map(S_).includes(S_(x)));
      case 'not_in': return !vals.some(x => cl.map(S_).includes(S_(x)));
      case 'has': return vals.map(S_).includes(S_(cv));
      case 'has_any': return vals.some(x => cl.map(S_).includes(S_(x)));
      case 'not_has': return !vals.map(S_).includes(S_(cv));
      case 'gte': return !isNaN(parseFloat(v)) && parseFloat(v) >= parseFloat(cv);
      case 'lte': return !isNaN(parseFloat(v)) && parseFloat(v) <= parseFloat(cv);
    }
    return false;
  }

  // ---------------------------------------------------------------- navigation
  function nav() {
    const u = S.user, cur = location.hash || '#/';
    const links = [['#/', 'Accueil', 'home'], ['#/prestations', 'Réserver', 'calendar']];
    if (u) links.push(['#/rdv', 'Mes rendez-vous', 'clock'], ['#/devis', 'Devis', 'file'], ['#/historique', 'Historique', 'sparkle'], ['#/avis', 'Avis', 'heart'], ['#/factures', 'Factures', 'receipt'], ['#/fidelite', 'Fidélité', 'heart'], ['#/profil', 'Profil', 'user']);
    const top = document.getElementById('topnav');
    mount(top, links.map(([href, label]) => h('a', { href, class: cur === href || (href !== '#/' && cur.startsWith(href)) ? 'on' : '' }, label)),
      u ? h('button.btn.ghost.sm', { onclick: logout }, 'Déconnexion') : h('a.btn.sm', { href: '#/connexion' }, 'Connexion'));
    const tabs = u ? [['#/', 'Accueil', 'home'], ['#/prestations', 'Réserver', 'calendar'], ['#/rdv', 'Rendez-vous', 'clock'], ['#/fidelite', 'Fidélité', 'heart'], ['#/profil', 'Profil', 'user']]
      : [['#/', 'Accueil', 'home'], ['#/prestations', 'Réserver', 'calendar'], ['#/connexion', 'Connexion', 'user']];
    mount(document.getElementById('tabbar'), tabs.map(([href, label, ic]) => h('a', { href, class: cur === href || (href !== '#/' && cur.startsWith(href)) ? 'on' : '' }, icon(ic), label)));
  }
  async function logout() { await post('/api/auth/logout'); S.user = null; resetFlow(); location.hash = '#/'; route(); toast('À bientôt !'); }

  const STEPS = ['Prestation', 'Diagnostic', 'Recommandations', 'Date & heure', 'Compte', 'Récapitulatif'];
  const stepper = (n) => h('ol.stepper', STEPS.map((s, i) => h('li', { class: i < n ? 'done' : i === n ? 'on' : '' }, `${i + 1}. ${s}`)));

  // -------------------------------------------------------------------- vues
  async function route() {
    const hash = (location.hash || '#/').slice(1);
    const parts = hash.split('/').map(decodeURIComponent), seg = parts[1], arg = parts[2];
    view.className = 'wrap';
    window.scrollTo({ top: 0 });
    nav();
    mount(view, h('div.spinner'));
    try {
      const fn = {
        '': viewHome, prestations: () => viewServices(arg), service: () => viewService(arg), diagnostic: () => viewDiagnostic(arg), resultat: viewResult, creneau: viewSlots,
        connexion: viewAuth, recap: viewRecap, confirmation: () => viewConfirmation(arg), rdv: viewAppointments, devis: () => (arg ? viewQuote(arg) : viewQuotes()),
        historique: viewHistory, avis: viewReviews, factures: viewInvoices, profil: viewProfile, fidelite: viewLoyalty, notifications: viewNotifications,
      }[seg || ''];
      if (!fn) return mount(view, h('div.empty', 'Page introuvable.'));
      const node = await fn();
      mount(view, node);
      view.focus({ preventScroll: true });
    } catch (e) { mount(view, h('div.notice.bad', icon('alert'), e.message)); console.error(e); }
  }

  // ------------------------------------------------------------- accueil
  async function viewHome() {
    if (!S.user) {
      return h('div', h('p.eyebrow', 'Bienvenue'), h('h1.page-title', 'Votre beauté, ', h('em.script', 'sur mesure')),
        h('p.page-sub', 'Réservez en ligne, passez votre diagnostic personnalisé et suivez vos rendez-vous.'),
        h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' } },
          h('a.card.tint', { href: '#/prestations', style: { color: 'inherit', textDecoration: 'none' } }, icon('calendar'), h('h3', 'Prendre rendez-vous'), h('p.muted', 'Choisissez une prestation, passez le diagnostic si nécessaire, puis réservez votre créneau.'), h('span.btn.sm', 'Commencer')),
          h('a.card', { href: '#/connexion', style: { color: 'inherit', textDecoration: 'none' } }, icon('user'), h('h3', 'Mon espace'), h('p.muted', 'Rendez-vous, devis, factures, historique et points fidélité.'), h('span.btn.ghost.sm', 'Me connecter'))));
    }
    const o = await get('/api/client/overview');
    S.user = o.user;
    const nxt = o.next[0];
    const loy = o.loyalty, need = loy.reward_points || 100, pts = o.user.loyalty_points, pct = Math.min(100, pts / need * 100);
    return h('div',
      h('div.hello', h('div', h('p.eyebrow', 'Mon espace'), h('h1.page-title', 'Bonjour ', h('em.script', o.user.first_name), ' ✨')), h('a.btn', { href: '#/prestations' }, icon('plus'), 'Prendre rendez-vous')),
      h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' } },
        h('div.card', h('h3', 'Prochain rendez-vous'),
          nxt ? appointmentRow(nxt, true) : h('div.empty', icon('calendar'), h('p', 'Aucun rendez-vous à venir.'), h('a.btn.sm', { href: '#/prestations' }, 'Réserver'))),
        h('div.card.points', h('div.small', { style: { opacity: .85 } }, 'Mes points fidélité'), h('div.big', pts), h('div.bar', h('i', { style: { width: pct + '%' } })),
          h('div.small', pts >= need ? `🎁 Vous avez droit à ${loy.reward_value} € de réduction !` : `Plus que ${need - pts} points pour ${loy.reward_value} € de réduction`))),
      o.quotes.length ? h('div.card', { style: { marginTop: '20px' } }, h('h3', 'Devis en attente'), o.quotes.map(q => h('div.list-item', h('div.main', h('b', q.number), h('div.small.muted', 'Valable jusqu\'au ' + shortDate(q.valid_until))), h('b', eur(q.total)), h('a.btn.sm', { href: '#/devis/' + q.id }, 'Consulter')))) : null,
      o.reminders.length ? h('div.card.flat', { style: { marginTop: '20px' } }, h('h4', icon('clock'), ' Prochains rappels'), o.reminders.map(r => h('div.list-item', h('span', r.subject), h('span.small.muted', shortDate(r.send_at))))) : null);
  }

  function appointmentRow(a, big) {
    const d = parse(a.start);
    return h('div.next-appt', h('div.date', h('b', d.getDate()), h('small', UI.MONTHS[d.getMonth()].slice(0, 4))),
      h('div', { style: { flex: 1 } }, h('b', a.service_name), h('div.small.muted', `${cap(longDate(d))} · ${hm(d)} · ${dur(a.duration)}`), h('div', { style: { marginTop: '6px' } }, statusBadge(a.status))),
      big ? h('a.btn.ghost.sm', { href: '#/rdv' }, 'Gérer') : null);
  }

  // -------------------------------------------------------- choix de prestation
  async function viewServices(cat) {
    const cats = [...new Set(S.services.map(s => s.category))];
    const active = cat && cats.includes(cat) ? cat : cats[0];
    const list = h('div.stack');
    const draw = (c) => mount(list, S.services.filter(s => s.category === c).map(s => h('button.svc', { onclick: () => startFlow(s) },
      h('b', s.name), h('span.price', eur(s.price)), h('span.d', s.description),
      h('span.meta', dur(s.duration)),
      h('div.tags', s.diagnostic_slug ? h('span.badge.gold', icon('sparkle'), s.diagnostic_required ? 'Diagnostic obligatoire' : 'Diagnostic conseillé') : null, s.deposit > 0 ? h('span.badge.neutral', `Acompte ${eur(s.deposit)}`) : null))));
    const tabs = h('div.cat-tabs', { role: 'tablist' });
    const drawTabs = (c) => mount(tabs, cats.map(x => h('button.chip', { role: 'tab', class: x === c ? 'on' : '', onclick: () => { drawTabs(x); draw(x); } }, icon(CAT_ICON[x] || 'sparkle'), x)));
    drawTabs(active); draw(active);
    return h('div', stepper(0), h('h1.page-title', 'Quelle prestation souhaitez-vous ?'), h('p.page-sub', 'Pour certaines prestations, un court diagnostic nous permet de vous conseiller au mieux.'), tabs, list);
  }

  async function viewService(id) {
    const s = svcById(id);
    if (!s) { location.hash = '#/prestations'; return h('div'); }
    startFlow(s);   // diagnostic si la prestation en a un, sinon choix du créneau
    return h('div.spinner');
  }

  function initFlow(svc) {
    S.photos = {};
    S.flow = { service: svc, diag: null, result: null, slot: null, bookService: null, quoteId: null };
    saveFlow();
  }
  function startFlow(svc) {
    initFlow(svc);
    location.hash = svc.diagnostic_slug ? '#/diagnostic/' + svc.id : '#/creneau';
  }

  // ------------------------------------------------------------- diagnostic
  async function viewDiagnostic(serviceId) {
    // accès direct depuis la page d'accueil (#/diagnostic) : on propose les prestations avec diagnostic
    if (!serviceId) {
      const withD = S.services.filter(s => s.diagnostic_slug);
      return h('div', h('h1.page-title', 'Mon diagnostic beauté'), h('p.page-sub', 'Pour quelle prestation souhaitez-vous un diagnostic ?'),
        h('div.stack', withD.map(s => h('button.svc', { onclick: () => startFlow(s) }, h('b', s.name), h('span.price', eur(s.price)), h('span.d', s.description)))));
    }
    const svc = svcById(serviceId);
    if (!svc || !svc.diagnostic_slug) { location.hash = '#/prestations'; return h('div'); }
    if (!S.flow || !S.flow.service || S.flow.service.id !== svc.id) initFlow(svc);
    const diag = await get('/api/public/diagnostics/' + svc.diagnostic_slug);
    S.flow.diag = S.flow.diag && S.flow.diag.slug === diag.slug ? S.flow.diag : { slug: diag.slug, answers: {} };
    const A = S.flow.diag.answers;
    const box = h('div.qwrap');
    let idx = -1; // -1 = intro, n = question, 'photos'

    const visible = () => diag.questions.filter(q => evalCond(q.show_if, A));
    const go = (d) => { const v = visible(); idx = Math.max(-1, idx + d); if (idx >= v.length) idx = v.length; draw(); };
    const advance = () => go(1);
    function draw() {
      const vq = visible();
      const pct = idx < 0 ? 0 : Math.min(100, (idx / (vq.length + 1)) * 100);
      const prog = h('div.progress', { role: 'progressbar', 'aria-valuenow': Math.round(pct), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: { width: pct + '%' } }));
      if (idx < 0) return mount(box, h('div.card.tint', h('p.eyebrow', diag.name), h('h2', 'Quelques questions pour vous conseiller'), h('p', diag.intro), h('div.notice.info', icon('info'), diag.disclaimer), h('div.nav-row', h('a.btn.ghost', { href: '#/prestations' }, 'Retour'), h('button.btn', { onclick: advance }, 'Commencer'))));
      if (idx >= vq.length) return drawPhotos(prog);
      const q = vq[idx];
      mount(box, prog, h('p.eyebrow', `Question ${idx + 1}`), h('h2.qtitle', q.label), q.help ? h('p.muted', q.help) : null, input(q), h('div.nav-row', h('button.btn.ghost', { onclick: () => go(-1) }, 'Retour'), nextBtn(q)));
    }
    function nextBtn(q) {
      const ok = !q.required || (Array.isArray(A[q.id]) ? A[q.id].length : A[q.id]);
      if (q.type === 'single' || q.type === 'yesno' || q.type === 'scale') return q.required ? h('span') : h('button.btn.ghost', { onclick: advance }, 'Passer');
      return h('button.btn', { disabled: !ok, onclick: advance }, 'Continuer');
    }
    function input(q) {
      if (q.type === 'text') { const t = h('textarea', { maxlength: 1000, placeholder: 'Votre réponse…', oninput: () => { A[q.id] = t.value; saveFlow(); const b = box.querySelector('.nav-row .btn:last-child'); if (b && q.required) b.disabled = !t.value.trim(); } }); t.value = A[q.id] || ''; return h('div.opts', t); }
      if (q.type === 'multi') return h('div.opts', q.options.map(o => { const on = (A[q.id] || []).includes(o.value); const b = h('button.opt.multi', { class: on ? 'on' : '', type: 'button', 'aria-pressed': on, onclick: () => { const cur = new Set(A[q.id] || []); cur.has(o.value) ? cur.delete(o.value) : cur.add(o.value); A[q.id] = [...cur]; saveFlow(); draw(); } }, h('span.dot', icon('check')), o.label); return b; }));
      const pick = (o) => { A[q.id] = o.value; saveFlow(); setTimeout(advance, 160); draw(); };
      if (q.type === 'scale') return h('div', h('div.scale', q.options.map(o => h('button.opt', { type: 'button', class: A[q.id] === o.value ? 'on' : '', 'aria-label': o.label, onclick: () => pick(o) }, o.value))), h('div.scale-legend', h('span', q.options[0].label.replace(/^\d\s*—\s*/, '')), h('span', q.options[q.options.length - 1].label.replace(/^\d\s*—\s*/, ''))));
      return h('div.opts' + (q.type === 'yesno' ? '.two' : ''), q.options.map(o => h('button.opt', { type: 'button', class: A[q.id] === o.value ? 'on' : '', 'aria-pressed': A[q.id] === o.value, onclick: () => pick(o) }, h('span.dot', icon('check')), o.label)));
    }
    function drawPhotos(prog) {
      if (!diag.photo_slots.length) return submit();
      const slots = diag.photo_slots.map(sl => {
        const holder = h('div.photo-slot');
        const render = () => {
          mount(holder, S.photos[sl.id] ? [h('img', { src: S.photos[sl.id], alt: sl.label }), h('button.rm', { type: 'button', 'aria-label': 'Retirer la photo', onclick: (e) => { e.stopPropagation(); delete S.photos[sl.id]; render(); } }, icon('x'))] : [h('div', icon('camera'), h('div', sl.label), sl.required ? h('div.small', 'Obligatoire') : h('div.small.muted', 'Facultatif'))],
            h('div.lab', sl.label),
            h('input', { type: 'file', accept: 'image/*', capture: 'environment', 'aria-label': sl.label, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { S.photos[sl.id] = await fileToDataURL(f); render(); } catch (err) { fail(err); } } }));
        };
        render();
        return holder;
      });
      mount(box, prog, h('p.eyebrow', 'Photos'), h('h2.qtitle', 'Ajoutez quelques photos'), h('p.muted', 'Elles aident la professionnelle à affiner ses conseils. Vous pouvez les prendre maintenant ou en importer, ou passer cette étape. Elles ne sont visibles que par l\'institut.'),
        h('div.photo-grid', slots), h('div.nav-row', h('button.btn.ghost', { onclick: () => go(-1) }, 'Retour'),
          h('button.btn', { onclick: submit }, 'Voir mon résultat')));
    }
    async function submit() {
      mount(box, h('div.spinner'));
      try {
        const r = await post(`/api/public/diagnostics/${diag.slug}/evaluate`, { answers: A, service_id: S.flow.service.id });
        S.flow.result = r.result; S.flow.bookService = null; saveFlow();
        location.hash = '#/resultat';
      } catch (e) { fail(e); idx = 0; draw(); }
    }
    draw();
    return h('div', stepper(1), h('div', { style: { maxWidth: '640px', margin: '0 auto' } }, box));
  }

  // ---------------------------------------------------------------- résultat
  async function viewResult() {
    if (!S.flow || !S.flow.result) { location.hash = '#/prestations'; return h('div'); }
    const { result: r, service } = S.flow;
    const ic = { go: 'check', caution: 'info', prepare: 'sparkle', not_now: 'alert' }[r.verdict];
    const total = r.recommended.reduce((s, x) => s + x.price, 0);
    const choose = (rec) => { S.flow.bookService = rec; saveFlow(); location.hash = '#/creneau'; };
    const actions = h('div.stack');
    if (r.verdict === 'go' || r.verdict === 'caution') {
      actions.appendChild(h('button.btn.lg.block', { onclick: () => choose(service) }, r.needs_validation ? 'Envoyer ma demande de rendez-vous' : 'Choisir ma date'));
    } else {
      r.recommended.forEach((rec, i) => { const full = svcById(rec.id); if (full) actions.appendChild(h('button.btn.block' + (i ? '.ghost' : ''), { onclick: () => choose(full) }, `Réserver : ${rec.name}`)); });
      if (r.verdict === 'not_now' || r.needs_validation) actions.appendChild(h('button.btn.ghost.block', { onclick: () => choose(service) }, 'Demander l\'avis de la professionnelle pour ' + service.name));
    }
    actions.appendChild(h('div.row', h('button.btn.soft.sm', { onclick: saveQuote }, icon('file'), 'Enregistrer mon devis'), h('a.btn.ghost.sm', { href: '#/prestations' }, 'Autre prestation')));
    async function saveQuote() {
      if (!S.user) { S.flow.afterAuth = 'saveQuote'; saveFlow(); location.hash = '#/connexion'; return; }
      const d = await post('/api/client/diagnostics', diagPayload());
      toast('Devis enregistré dans votre espace.', 'ok'); resetFlow(); location.hash = d.quote_id ? '#/devis/' + d.quote_id : '#/historique';
    }
    return h('div', { style: { maxWidth: '720px', margin: '0 auto' } }, stepper(2),
      h('div.card', h('div.verdict.' + r.verdict, h('div.badge-ic', icon(ic)), h('div', h('p.eyebrow', 'Résultat de votre diagnostic'), h('h2', r.title), h('p', r.message), r.extra_messages.map(m => h('p', m)))),
        r.alerts.length ? h('div.stack', { style: { marginTop: '14px' } }, r.alerts.map(a => h('div.notice.warn', icon('alert'), a))) : null,
        r.needs_validation ? h('div.notice.info', { style: { marginTop: '14px' } }, icon('shield'), 'Votre rendez-vous sera soumis à la validation de la professionnelle avant confirmation.') : null,
        r.steps.length ? [h('h3', { style: { marginTop: '22px' } }, 'Recommandation'), h('ol.reco', r.steps.map(s => h('li', s)))] : null,
        r.recommended.length ? [h('h3', 'Devis estimatif'), h('table.quote', h('tbody', r.recommended.map(x => h('tr', h('td', x.name), h('td', eur(x.price)))), h('tr.total', h('td', 'Total'), h('td', eur(total))))),
          h('p.small.muted', 'Devis définitif consultable, téléchargeable en PDF, acceptable ou refusable dans votre espace, valable 30 jours.')] : null,
        h('p.disclaimer', r.disclaimer)),
      h('div', { style: { marginTop: '20px' } }, actions));
  }

  function diagPayload() {
    return { slug: S.flow.diag.slug, service_id: S.flow.service.id, answers: S.flow.diag.answers, photos: S.photos };
  }

  // ----------------------------------------------------------------- créneaux
  async function viewSlots(opts = {}) {
    if (!S.flow) { location.hash = '#/prestations'; return h('div'); }
    const svc = S.flow.bookService ? svcById(S.flow.bookService.id) || S.flow.service : S.flow.service;
    if (svc.diagnostic_required && !S.flow.result && !S.flow.quoteId) { location.hash = '#/diagnostic/' + svc.id; return h('div'); }
    const data = await get(`/api/public/availability?service_id=${svc.id}&from=${isoDate(new Date())}&days=42`);
    const dates = Object.keys(data.days);
    let selDay = S.flow.slot ? S.flow.slot.slice(0, 10) : dates.find(d => data.days[d].length);
    const timesBox = h('div'), daysBox = h('div.days', { role: 'listbox', 'aria-label': 'Jours disponibles' });
    const drawDays = () => mount(daysBox, dates.filter((d, i) => i < 42).map(d => { const dt = parse(d + 'T00:00'), n = data.days[d].length; return h('button.day' + (n ? '' : '.none'), { type: 'button', role: 'option', 'aria-selected': d === selDay, class: d === selDay ? 'on' : '', disabled: !n, onclick: () => { selDay = d; drawDays(); drawTimes(); } }, h('small', UI.DAYS[dt.getDay()].slice(0, 3)), h('b', dt.getDate()), h('small', UI.MONTHS[dt.getMonth()].slice(0, 4)), n ? h('span', n + ' créneaux') : h('span', { style: { color: 'var(--muted)' } }, 'complet')); }));
    const drawTimes = () => {
      if (!selDay) return mount(timesBox, h('div.empty', 'Aucun créneau disponible prochainement. Contactez l\'institut.'));
      mount(timesBox, h('h4', cap(longDate(parse(selDay + 'T00:00')))), h('div.times', data.days[selDay].map(t => h('button.time', { type: 'button', class: S.flow.slot === `${selDay}T${t}` ? 'on' : '', onclick: () => { S.flow.slot = `${selDay}T${t}`; saveFlow(); drawTimes(); mount(foot, footer()); } }, t))));
    };
    const foot = h('div.nav-row');
    const footer = () => [h('a.btn.ghost', { href: S.flow.result ? '#/resultat' : svc.diagnostic_slug ? '#/diagnostic/' + svc.id : '#/prestations' }, 'Retour'),
      h('button.btn.lg', { disabled: !S.flow.slot, onclick: () => { S.flow.service.id; location.hash = S.user ? '#/recap' : '#/connexion'; } }, 'Continuer')];
    mount(foot, footer());
    drawDays(); drawTimes();
    return h('div', { style: { maxWidth: '720px', margin: '0 auto' } }, stepper(3),
      h('h1.page-title', 'Choisissez votre créneau'), h('p.page-sub', `${svc.name} · ${dur(svc.duration)} · ${eur(svc.price)}`), daysBox, timesBox, foot);
  }

  // -------------------------------------------------------- connexion / inscription
  async function viewAuth() {
    if (S.user) { location.hash = (S.flow && S.flow.slot) ? '#/recap' : '#/'; return h('div'); }
    let mode = S.flow && S.flow.slot ? 'register' : 'login';
    const box = h('div');
    const afterLogin = (u) => { S.user = u; nav(); location.hash = (S.flow && S.flow.slot) ? '#/recap' : (S.flow && S.flow.afterAuth === 'saveQuote') ? '#/resultat' : '#/'; };
    function draw() {
      const err = h('div');
      const f = h('form.stack', { novalidate: true, onsubmit: async (e) => {
        e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
        try {
          const body = mode === 'login' ? { email: fd.email, password: fd.password } : { ...fd, consent_data: !!fd.consent_data, consent_marketing: !!fd.consent_marketing, consent_photos: !!fd.consent_photos };
          const r = await post('/api/auth/' + mode, body); afterLogin(r.user);
          if (S.flow && S.flow.afterAuth === 'saveQuote') { delete S.flow.afterAuth; saveFlow(); }
        } catch (er) { mount(err, h('div.notice.bad', icon('alert'), er.message)); btn.disabled = false; }
      } },
        mode === 'register' ? h('div.form-grid', field('Prénom', h('input', { name: 'first_name', required: true, autocomplete: 'given-name' })), field('Nom', h('input', { name: 'last_name', required: true, autocomplete: 'family-name' }))) : null,
        field('Email', h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email' })),
        mode === 'register' ? field('Téléphone', h('input', { type: 'tel', name: 'phone', autocomplete: 'tel' }), 'Pour vous joindre en cas d\'imprévu') : null,
        field('Mot de passe', h('input', { type: 'password', name: 'password', required: true, minlength: 8, autocomplete: mode === 'login' ? 'current-password' : 'new-password' }), mode === 'register' ? '8 caractères minimum' : null),
        mode === 'register' ? h('div.stack',
          h('label.check', h('input', { type: 'checkbox', name: 'consent_data', required: true }), h('span', 'J\'accepte que mes données (coordonnées, diagnostic, photos) soient traitées par l\'institut pour gérer mes rendez-vous. Je peux les exporter ou les supprimer à tout moment.')),
          h('label.check', h('input', { type: 'checkbox', name: 'consent_marketing' }), h('span', 'J\'accepte de recevoir des offres et actualités de l\'institut (facultatif).')),
          h('label.check', h('input', { type: 'checkbox', name: 'consent_photos' }), h('span', 'J\'autorise l\'institut à utiliser mes photos avant/après à des fins de communication, avec mon accord à chaque publication (facultatif).'))) : null,
        err, h('button.btn.block.lg', { type: 'submit' }, mode === 'login' ? 'Me connecter' : 'Créer mon compte'));
      mount(box, h('div.auth-tabs', { role: 'tablist' }, h('button', { type: 'button', class: mode === 'login' ? 'on' : '', onclick: () => { mode = 'login'; draw(); } }, 'Connexion'), h('button', { type: 'button', class: mode === 'register' ? 'on' : '', onclick: () => { mode = 'register'; draw(); } }, 'Créer un compte')), f);
    }
    draw();
    view.classList.add('narrow');
    return h('div', { style: { maxWidth: '520px', margin: '0 auto' } }, S.flow && S.flow.slot ? stepper(4) : null, h('h1.page-title', 'Votre compte'),
      h('p.page-sub', S.flow && S.flow.slot ? 'Connectez-vous ou créez votre compte pour finaliser votre réservation.' : 'Accédez à vos rendez-vous, devis et factures.'), h('div.card', box));
  }

  // -------------------------------------------------------------- récapitulatif
  async function viewRecap() {
    if (!S.user) { location.hash = '#/connexion'; return h('div'); }
    if (!S.flow || !S.flow.slot) { location.hash = '#/prestations'; return h('div'); }
    const svc = S.flow.bookService ? svcById(S.flow.bookService.id) || S.flow.service : S.flow.service;
    const start = parse(S.flow.slot), res = S.flow.result;
    const needsVal = res && res.needs_validation;
    let payNow = svc.deposit > 0 && !needsVal;
    const notes = h('textarea', { placeholder: 'Une précision pour la professionnelle ? (facultatif)', maxlength: 500 });
    const payBox = h('div');
    const drawPay = () => mount(payBox, svc.deposit > 0 ? h('div.card.flat.tint', h('h4', 'Acompte'),
      needsVal ? h('p.small', `Un acompte de ${eur(svc.deposit)} pourra vous être demandé une fois votre demande validée.`) : [
        h('p.small', `Un acompte de ${eur(svc.deposit)} garantit votre créneau et limite les rendez-vous non honorés. Il est déduit du total de la prestation.`),
        h('label.check', h('input', { type: 'checkbox', checked: payNow, onchange: (e) => { payNow = e.target.checked; drawPay(); } }), h('span', `Payer l'acompte maintenant (${eur(svc.deposit)})`)),
        !payNow ? h('div.notice.info', icon('info'), 'Sans acompte, votre rendez-vous restera « en attente » jusqu\'à confirmation par l\'institut.') : null,
        S.info.payment_provider === 'demo' ? h('div.small.muted', 'Mode démonstration : aucun prélèvement réel n\'est effectué.') : null]) : null);
    drawPay();
    const btn = h('button.btn.lg.block', { onclick: async () => {
      btn.disabled = true;
      try {
        const body = { service_id: svc.id, start: S.flow.slot, notes: notes.value, pay_deposit: payNow };
        if (S.flow.quoteId) body.quote_id = S.flow.quoteId; else if (S.flow.diag && S.flow.result) body.diagnostic = diagPayload();
        const r = await post('/api/client/bookings', body);
        resetFlow(); location.hash = '#/confirmation/' + r.appointment.id; S.lastBooking = r.appointment;
      } catch (e) { fail(e); btn.disabled = false; if (e.status === 409) { S.flow.slot = null; saveFlow(); } }
    } }, needsVal ? 'Envoyer ma demande' : 'Confirmer mon rendez-vous');
    return h('div', { style: { maxWidth: '640px', margin: '0 auto' } }, stepper(5), h('h1.page-title', 'Récapitulatif'),
      h('div.card.stack', h('div.row.between', h('div', h('b', svc.name), h('div.small.muted', `${cap(fullDate(start))} à ${hm(start)} · ${dur(svc.duration)}`)), h('div.price', { style: { fontFamily: 'var(--serif)', fontSize: '1.6rem', color: 'var(--rose-deep)' } }, eur(svc.price))),
        res && res.alerts.length ? res.alerts.map(a => h('div.notice.warn', icon('alert'), a)) : null,
        needsVal ? h('div.notice.info', icon('shield'), 'Votre demande sera étudiée par la professionnelle, qui la confirmera ou vous contactera.') : null,
        svc.conditions ? h('div.small.muted', svc.conditions) : null, payBox, field('Message', notes),
        h('p.small.muted', 'Vous recevrez une confirmation, puis des rappels 48 h et 24 h avant, et un message après votre visite. Annulation gratuite en ligne jusqu\'à ' + (S.info.booking.cancel_hours) + ' h avant.'), btn,
        h('a.btn.ghost.block', { href: '#/creneau' }, 'Modifier le créneau')));
  }

  function icsFor(a) {
    const s = parse(a.start), e = parse(a.end), f = (d) => `${d.getFullYear()}${UI.pad(d.getMonth() + 1)}${UI.pad(d.getDate())}T${UI.pad(d.getHours())}${UI.pad(d.getMinutes())}00`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Institut//FR', 'BEGIN:VEVENT', `UID:rdv-${a.id}@institut`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${a.service_name} — ${S.info.institute.name}`, `LOCATION:${S.info.institute.address || ''}`, 'END:VEVENT', 'END:VCALENDAR'];
    return URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  }

  async function viewConfirmation(id) {
    const { appointments } = await get('/api/client/appointments');
    const a = appointments.find(x => x.id === +id);
    if (!a) return h('div.empty', 'Rendez-vous introuvable.');
    const d = parse(a.start);
    const pending = ['demande', 'en_attente'].includes(a.status);
    return h('div', { style: { maxWidth: '560px', margin: '0 auto' } }, h('div.card.confirm-hero', h('div.ok-ic', icon(pending ? 'clock' : 'check')),
      h('h1', pending ? 'Demande enregistrée' : 'Rendez-vous confirmé'),
      h('p', pending ? (a.status === 'demande' ? 'La professionnelle va étudier votre demande et vous répondra rapidement.' : 'Votre rendez-vous sera confirmé par l\'institut. Pensez à régler l\'acompte pour garantir votre créneau.') : 'Un email de confirmation vous a été envoyé.'),
      h('div.card.flat.tint', { style: { textAlign: 'left' } }, appointmentRow(a)),
      h('p.small.muted', `${S.info.institute.name} · ${S.info.institute.address}`),
      h('div.row', { style: { justifyContent: 'center' } }, h('a.btn.ghost', { href: icsFor(a), download: 'rendez-vous.ics' }, icon('calendar'), 'Ajouter à mon agenda'), h('a.btn', { href: '#/' }, 'Mon espace'))));
  }

  // ------------------------------------------------------------- mes rendez-vous
  async function viewAppointments() {
    needLogin();
    const { appointments, cancel_hours } = await get('/api/client/appointments');
    const now = new Date();
    const up = appointments.filter(a => parse(a.start) >= now && ['demande', 'confirme', 'en_attente', 'arrive', 'en_cours'].includes(a.status)).reverse();
    const past = appointments.filter(a => !up.includes(a));
    const row = (a, canEdit) => h('div.list-item', h('div.main', appointmentRow(a)),
      h('div.row', canEdit && ['demande', 'confirme', 'en_attente'].includes(a.status) ? [
        h('button.btn.ghost.sm', { onclick: () => reschedule(a) }, 'Déplacer'),
        h('button.btn.danger.sm', { onclick: async () => { if (await confirmBox('Annuler ce rendez-vous ?', `Les annulations en ligne sont possibles jusqu'à ${cancel_hours} h avant le rendez-vous.`, 'Annuler le rendez-vous', true)) { try { await post(`/api/client/appointments/${a.id}/cancel`); toast('Rendez-vous annulé.'); route(); } catch (e) { fail(e); } } } }, 'Annuler')] : null));
    return h('div', h('div.hello', h('h1.page-title', 'Mes rendez-vous'), h('a.btn', { href: '#/prestations' }, icon('plus'), 'Nouveau')),
      h('div.card', h('h3', 'À venir'), up.length ? up.map(a => row(a, true)) : h('div.empty', 'Aucun rendez-vous à venir.')),
      h('div.card', { style: { marginTop: '20px' } }, h('h3', 'Passés'), past.length ? past.slice(0, 30).map(a => row(a, false)) : h('div.empty', 'Aucun historique.')));
  }
  async function reschedule(a) {
    const svc = svcById(a.service_id);
    const data = await get(`/api/public/availability?service_id=${a.service_id}&from=${isoDate(new Date())}&days=28`);
    let day = Object.keys(data.days).find(d => data.days[d].length), sel = null;
    const body = h('div'), draw = () => mount(body, h('div.days', Object.keys(data.days).map(d => { const dt = parse(d + 'T00:00'), n = data.days[d].length; return h('button.day' + (n ? '' : '.none'), { type: 'button', disabled: !n, class: d === day ? 'on' : '', onclick: () => { day = d; sel = null; draw(); } }, h('small', UI.DAYS[dt.getDay()].slice(0, 3)), h('b', dt.getDate())); })),
      day ? h('div.times', data.days[day].map(t => h('button.time', { type: 'button', class: sel === t ? 'on' : '', onclick: () => { sel = t; draw(); } }, t))) : h('div.empty', 'Aucun créneau.'));
    draw();
    modal(`Déplacer — ${svc ? svc.name : a.service_name}`, body, [{ label: 'Annuler', cls: 'ghost' }, { label: 'Confirmer', onclick: async () => { if (!sel) { toast('Choisissez un horaire.', 'err'); return false; } await post(`/api/client/appointments/${a.id}/reschedule`, { start: `${day}T${sel}` }); toast('Rendez-vous déplacé.', 'ok'); route(); } }]);
  }

  // ----------------------------------------------------------------------- devis
  async function viewQuotes() {
    needLogin();
    const { quotes } = await get('/api/client/quotes');
    const lab = { draft: ['Brouillon', 'neutral'], sent: ['À consulter', 'info'], accepted: ['Accepté', 'ok'], refused: ['Refusé', 'bad'], converted: ['Converti en rendez-vous', 'gold'], expired: ['Expiré', 'warn'] };
    return h('div', h('h1.page-title', 'Mes devis'), h('div.card', quotes.length ? quotes.map(q => h('div.list-item', h('div.main', h('b', q.number), h('div.small.muted', `Valable jusqu'au ${shortDate(q.valid_until)}`)), h('b', eur(q.total)), h('span.badge.' + lab[q.effective_status][1], lab[q.effective_status][0]), h('a.btn.ghost.sm', { href: '#/devis/' + q.id }, 'Ouvrir'))) : h('div.empty', icon('file'), h('p', 'Aucun devis pour le moment. Votre devis apparaît après un diagnostic.'))));
  }
  async function viewQuote(id) {
    needLogin();
    const { quote: q } = await get('/api/client/quotes/' + id);
    const st = q.effective_status, open = ['draft', 'sent', 'accepted', 'refused'].includes(st);
    const act = async (a) => { try { await post(`/api/client/quotes/${q.id}/${a}`); toast(a === 'accept' ? 'Devis accepté.' : 'Devis refusé.', 'ok'); route(); } catch (e) { fail(e); } };
    const bookable = q.items.find(i => i.service_id && svcById(i.service_id));
    return h('div', { style: { maxWidth: '720px', margin: '0 auto' } }, h('a.small', { href: '#/devis' }, '← Mes devis'),
      h('div.card', { style: { marginTop: '12px' } }, h('div.row.between', h('div', h('p.eyebrow', 'Devis'), h('h2', q.number)), h('span.badge' + (st === 'accepted' ? '.ok' : st === 'refused' || st === 'expired' ? '.bad' : '.info'), { }, { draft: 'Brouillon', sent: 'À consulter', accepted: 'Accepté', refused: 'Refusé', converted: 'Converti', expired: 'Expiré' }[st])),
        q.result ? h('div.notice.info', icon('sparkle'), q.result.title) : null,
        q.steps.length ? [h('h3', 'Recommandation'), h('ol.reco', q.steps.map(s => h('li', s)))] : null,
        h('table.quote', h('tbody', q.items.map(i => h('tr', h('td', i.label), h('td', eur(i.price * (i.qty || 1)))), ), h('tr.total', h('td', 'Total'), h('td', eur(q.total))))),
        h('p.small.muted', `Valable jusqu'au ${shortDate(q.valid_until)}.`), q.result ? h('p.disclaimer', q.result.disclaimer) : null,
        h('div.row.no-print', { style: { marginTop: '16px' } },
          open && st !== 'accepted' ? h('button.btn', { onclick: () => act('accept') }, icon('check'), 'Accepter') : null,
          open && st !== 'refused' ? h('button.btn.danger', { onclick: () => act('refuse') }, 'Refuser') : null,
          (st === 'accepted' || st === 'sent') && bookable ? h('button.btn.gold', { onclick: () => { const svc = svcById(bookable.service_id); S.flow = { service: svc, bookService: svc, quoteId: q.id, result: null, diag: null, slot: null }; saveFlow(); location.hash = '#/creneau'; } }, icon('calendar'), 'Réserver ce rendez-vous') : null,
          h('a.btn.ghost', { href: `/api/client/quotes/${q.id}.pdf`, target: '_blank', rel: 'noopener' }, icon('download'), 'PDF'),
          h('button.btn.ghost', { onclick: () => window.print() }, icon('print'), 'Imprimer'),
          h('button.btn.ghost', { onclick: async () => { try { await post(`/api/client/quotes/${q.id}/email`); toast('Devis envoyé par email.', 'ok'); } catch (e) { fail(e); } } }, icon('mail'), 'Recevoir par email'))));
  }

  // ------------------------------------------------------ historique, factures, fidélité…
  async function viewHistory() {
    needLogin();
    const { diagnostics, appointments } = await get('/api/client/history');
    return h('div', h('h1.page-title', 'Mon historique'),
      h('div.card', h('h3', 'Mes diagnostics'), diagnostics.length ? diagnostics.map(d => h('div.list-item', h('div.main', h('b', d.diagnostic), h('div.small.muted', `${shortDate(d.created_at)} · ${d.service || ''}`), h('div.small', d.result.title),
        d.photos.length ? h('div.photos-row', d.photos.map(p => h('a', { href: '/media/private/' + p.file, target: '_blank', rel: 'noopener' }, h('img', { src: '/media/private/' + p.file, alt: p.label, loading: 'lazy' })))) : null),
        d.validation === 'pending' ? h('span.badge.info', 'En cours de validation') : d.validation === 'approved' ? h('span.badge.ok', 'Validé') : d.validation === 'declined' ? h('span.badge.bad', 'Non retenu') : null)) : h('div.empty', 'Aucun diagnostic.')),
      h('div.card', { style: { marginTop: '20px' } }, h('h3', 'Prestations réalisées'), appointments.length ? appointments.map(a => h('div.list-item', h('div.main', appointmentRow(a)), h('b', eur(a.price)))) : h('div.empty', 'Aucune prestation réalisée pour le moment.')));
  }
  async function viewReviews() {
    needLogin();
    const { eligible, reviews } = await get('/api/client/reviews');
    const forms = eligible.map(a => {
      let rating = 5; const stars = h('div.row', { style: { gap: '4px' } }), txt = h('textarea', { placeholder: 'Racontez votre expérience (facultatif)…', maxlength: 800 });
      const draw = () => mount(stars, [1, 2, 3, 4, 5].map(n => h('button.chip', { type: 'button', class: n <= rating ? 'on' : '', 'aria-label': n + ' sur 5', onclick: () => { rating = n; draw(); } }, '★')));
      draw();
      return h('div.card', h('b', a.service_name), h('div.small.muted', cap(longDate(parse(a.start)))), h('div', { style: { margin: '10px 0' } }, stars), txt,
        h('div.row', { style: { marginTop: '10px' } }, h('button.btn', { onclick: async () => { try { await post('/api/client/reviews', { appointment_id: a.id, rating, text: txt.value }); toast('Merci ! Votre avis sera publié après relecture.', 'ok'); route(); } catch (e) { fail(e); } } }, 'Envoyer mon avis')));
    });
    const lab = { pending: ['En relecture', 'info'], published: ['Publié', 'ok'], hidden: ['Non publié', 'neutral'] };
    return h('div', { style: { maxWidth: '640px', margin: '0 auto' } }, h('h1.page-title', 'Mes avis'), h('p.page-sub', 'Après chaque prestation, partagez votre expérience. Votre prénom et l\'initiale de votre nom seront affichés, après relecture par l\'institut.'),
      forms.length ? forms : h('div.card', h('div.empty', icon('heart'), h('p', 'Aucune prestation en attente d\'avis.'))),
      reviews.length ? h('div.card', h('h3', 'Mes avis donnés'), reviews.map(r => h('div.list-item', h('div.main', h('b', r.service || 'Prestation'), h('div.small', '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)), r.text ? h('div.small.muted', r.text) : null), h('span.badge.' + lab[r.status][1], lab[r.status][0])))) : null);
  }
  async function viewInvoices() {
    needLogin();
    const { invoices } = await get('/api/client/invoices');
    const lab = { due: ['À régler', 'warn'], partial: ['Partiellement réglée', 'info'], paid: ['Payée', 'ok'], void: ['Annulée', 'neutral'] };
    return h('div', h('h1.page-title', 'Mes factures'), h('div.card', invoices.length ? invoices.map(i => h('div.list-item', h('div.main', h('b', i.number), h('div.small.muted', shortDate(i.created_at) + ' · ' + i.items.map(x => x.label).join(', '))), h('b', eur(i.total)), h('span.badge.' + lab[i.status][1], lab[i.status][0]), h('a.btn.ghost.sm', { href: `/api/client/invoices/${i.id}.pdf`, target: '_blank', rel: 'noopener' }, icon('download'), 'PDF'))) : h('div.empty', icon('receipt'), h('p', 'Aucune facture.'))));
  }
  async function viewLoyalty() {
    needLogin();
    const l = await get('/api/client/loyalty'), need = l.config.reward_points, pct = Math.min(100, l.points / need * 100);
    return h('div', { style: { maxWidth: '640px', margin: '0 auto' } }, h('h1.page-title', 'Mes points fidélité'),
      h('div.card.points', h('div.big', l.points), h('div.small', 'points'), h('div.bar', h('i', { style: { width: pct + '%' } })), h('div.small', l.points >= need ? `🎁 ${l.config.reward_value} € de réduction disponible : présentez-vous à l'institut, elle sera appliquée sur votre prochaine facture.` : `Plus que ${need - l.points} points pour ${l.config.reward_value} € de réduction.`)),
      h('div.card', { style: { marginTop: '20px' } }, h('h3', 'Comment ça marche ?'), h('p', `${l.config.points_per_euro} point par euro dépensé. Tous les ${need} points, ${l.config.reward_value} € de réduction.`),
        h('h4', 'Mouvements'), l.ledger.length ? l.ledger.map(m => h('div.list-item', h('div.main', m.reason, h('div.small.muted', shortDate(m.created_at))), h('b', { style: { color: m.points > 0 ? 'var(--ok)' : 'var(--rose-deep)' } }, (m.points > 0 ? '+' : '') + m.points))) : h('div.empty', 'Aucun mouvement.')));
  }
  async function viewNotifications() {
    needLogin();
    const { notifications } = await get('/api/client/notifications');
    return h('div', h('h1.page-title', 'Mes messages & rappels'), h('div.card', notifications.length ? notifications.map(n => h('div.list-item', h('div.main', h('b', n.subject), h('div.small.muted', shortDate(n.send_at)), h('div.small', { style: { whiteSpace: 'pre-line' } }, n.body)), n.status === 'pending' ? h('span.badge.info', 'Programmé') : h('span.badge.ok', 'Envoyé'))) : h('div.empty', 'Aucun message.')));
  }
  async function viewProfile() {
    needLogin();
    const u = S.user;
    const f = h('form.stack', { onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      try { const r = await put('/api/client/profile', { ...fd, consent_marketing: !!fd.consent_marketing, consent_photos: !!fd.consent_photos }); S.user = r.user; toast('Profil mis à jour.', 'ok'); nav(); } catch (er) { fail(er); }
    } },
      h('div.form-grid', field('Prénom', h('input', { name: 'first_name', value: u.first_name, required: true })), field('Nom', h('input', { name: 'last_name', value: u.last_name, required: true })),
        field('Email', h('input', { type: 'email', name: 'email', value: u.email || '', required: true })), field('Téléphone', h('input', { type: 'tel', name: 'phone', value: u.phone || '' })),
        field('Date de naissance (facultatif)', h('input', { type: 'date', name: 'birth_date', value: u.birth_date || '' })), field('Adresse (facultatif)', h('input', { name: 'address', value: u.address || '' }))),
      field('Mes préférences', h('textarea', { name: 'preferences' }, u.preferences || ''), 'Ex. : allergies, couleurs préférées, boisson…'),
      h('h4', 'Consentements'),
      h('label.check', h('input', { type: 'checkbox', name: 'consent_marketing', checked: !!u.consent_marketing }), h('span', 'Recevoir les offres et actualités de l\'institut')),
      h('label.check', h('input', { type: 'checkbox', name: 'consent_photos', checked: !!u.consent_photos }), h('span', 'Autoriser l\'utilisation marketing de mes photos avant/après (jamais sans mon accord pour chaque publication)')),
      h('div.row', h('button.btn', { type: 'submit' }, 'Enregistrer')));
    return h('div', { style: { maxWidth: '720px', margin: '0 auto' } }, h('h1.page-title', 'Mon profil'), h('div.card', f),
      h('div.card', { style: { marginTop: '20px' } }, h('h3', 'Sécurité & données'), h('div.row',
        h('button.btn.ghost', { onclick: pwModal }, icon('lock'), 'Changer mon mot de passe'),
        h('a.btn.ghost', { href: '/api/client/export' }, icon('download'), 'Exporter mes données'),
        h('a.btn.ghost', { href: '#/notifications' }, icon('mail'), 'Mes messages'),
        h('button.btn.danger', { onclick: deleteModal }, icon('trash'), 'Supprimer mon compte'))));
  }
  function pwModal() {
    const c = h('input', { type: 'password', autocomplete: 'current-password' }), n = h('input', { type: 'password', autocomplete: 'new-password', minlength: 8 });
    modal('Changer mon mot de passe', h('div.stack', field('Mot de passe actuel', c), field('Nouveau mot de passe', n)), [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => { await post('/api/client/password', { current: c.value, new: n.value }); toast('Mot de passe modifié.', 'ok'); } }]);
  }
  function deleteModal() {
    const p = h('input', { type: 'password', autocomplete: 'current-password' });
    modal('Supprimer mon compte', h('div.stack', h('p', 'Vos données personnelles, photos et diagnostics seront effacés et vos rendez-vous à venir annulés. Les factures sont conservées de façon anonymisée (obligation légale).'), field('Confirmez avec votre mot de passe', p)),
      [{ label: 'Annuler', cls: 'ghost' }, { label: 'Supprimer définitivement', cls: 'danger', onclick: async () => { await del('/api/client/account', { password: p.value }); S.user = null; toast('Compte supprimé.'); location.hash = '#/'; route(); } }]);
  }

  function needLogin() { if (!S.user) { location.hash = '#/connexion'; throw new Error('Veuillez vous connecter.'); } }

  // --------------------------------------------------------------------- démarrage
  async function boot() {
    loadFlow();
    try {
      const [info, svcs, me] = await Promise.all([get('/api/public/info'), get('/api/public/services'), get('/api/auth/me')]);
      S.info = info; S.services = svcs.services; S.user = me.user && me.user.role === 'client' ? me.user : null;
      if (S.flow && S.flow.service) S.flow.service = svcById(S.flow.service.id) || S.flow.service;
    } catch (e) { return mount(view, h('div.notice.bad', icon('alert'), e.message)); }
    if (location.pathname === '/compte' && !location.hash) location.hash = S.user ? '#/' : '#/connexion';
    window.addEventListener('hashchange', route);
    route();
  }
  boot();
})();
