/* Espace professionnel — coque, routage, tableau de bord et planning */
(function () {
  const { h, icon, mount, get, post, put, del, eur, parse, isoDate, isoDT, hm, longDate, fullDate, shortDate, dur, cap, toast, fail, modal, confirmBox, field, statusBadge, pad } = UI;
  const ADM = window.ADM = { user: null, routes: {}, badges: {}, info: null, services: [], register(name, fn) { this.routes[name] = fn; } };
  const NAV = [
    ['', 'Tableau de bord', 'home'], ['planning', 'Planning', 'calendar'], ['clientes', 'Clientes', 'users'], ['diagnostics', 'Diagnostics', 'sparkle'],
    ['prestations', 'Prestations', 'scissors'], ['produits', 'Produits', 'box'], ['stocks', 'Stocks', 'layers'], ['devis', 'Devis', 'file'],
    ['factures', 'Factures', 'receipt'], ['stats', 'Statistiques', 'chart'], ['messages', 'Communications', 'mail'], ['parametres', 'Paramètres', 'gear'],
  ];
  const app = document.getElementById('app');
  const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignoré */ } } };
  ADM.LS = LS;

  ADM.start = async function () {
    try {
      const [me, info] = await Promise.all([get('/api/auth/me'), get('/api/public/info')]);
      ADM.info = info;
      if (me.user && me.user.role === 'pro') { ADM.user = me.user; return shell(); }
    } catch (e) { /* écran de connexion */ }
    loginScreen();
  };

  function loginScreen() {
    const err = h('div');
    const f = h('form.stack', { onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      try { const r = await post('/api/auth/login', fd); if (r.user.role !== 'pro') { await post('/api/auth/logout'); throw new Error('Ce compte n\'a pas accès à l\'espace professionnel.'); } ADM.user = r.user; shell(); } catch (er) { mount(err, h('div.notice.bad', icon('alert'), er.message)); }
    } }, field('Email', h('input', { type: 'email', name: 'email', required: true, autocomplete: 'username' })), field('Mot de passe', h('input', { type: 'password', name: 'password', required: true, autocomplete: 'current-password' })), err, h('button.btn.lg.block', { type: 'submit' }, 'Se connecter'));
    mount(app, h('div.login-screen', h('div.card', h('div.center', h('div.script', { style: { fontSize: '2.4rem' } }, ADM.info.institute.name), h('p.muted', 'Espace professionnel')), f, h('p.center.small', { style: { marginTop: '16px' } }, h('a', { href: '/' }, '← Retour au site')))));
  }

  async function refreshBadges() {
    try {
      const d = await get('/api/admin/dashboard');
      ADM.badges = { '': 0, planning: d.kpis.requests, diagnostics: d.kpis.diagnostics_to_review, stocks: d.kpis.low_stock, devis: d.kpis.quotes_pending };
      document.querySelectorAll('.side a.nav').forEach(a => { const n = ADM.badges[a.dataset.k]; const c = a.querySelector('.count'); if (c) c.remove(); if (n) a.appendChild(h('span.count', n)); });
      return d;
    } catch (e) { return null; }
  }

  function shell() {
    ADM.services = [];
    const side = h('aside.side', { id: 'side' }, h('div.brand', h('span.logo', icon('sparkle')), ADM.info.institute.name),
      NAV.map(([k, label, ic]) => h('a.nav', { href: '#/' + k, dataset: { k } }, icon(ic), label)), h('div.sep'),
      h('a.nav', { href: '/', target: '_blank', rel: 'noopener' }, icon('home'), 'Voir le site'), h('a.nav', { href: '/reserver', target: '_blank', rel: 'noopener' }, icon('calendar'), 'Page de réservation'),
      h('div.foot', 'Connecté·e : ' + (ADM.user.email || ''), h('br'), h('a', { href: '#', onclick: async (e) => { e.preventDefault(); await post('/api/auth/logout'); location.hash = ''; location.reload(); } }, 'Déconnexion')));
    const main = h('div.main', h('div.topbar', h('button.btn.ghost.sm.menu-btn', { 'aria-label': 'Menu', onclick: () => side.classList.toggle('open') }, icon('menu')), h('div.spacer'),
      h('button.btn.sm', { onclick: () => ADM.newAppointment() }, icon('plus'), 'Rendez-vous'), h('button.btn.soft.sm', { onclick: () => ADM.newClient() }, icon('users'), 'Cliente')),
      h('div.content', { id: 'content' }));
    mount(app, h('div.shell', side, main));
    side.addEventListener('click', (e) => { if (e.target.closest('a.nav')) side.classList.remove('open'); });
    window.addEventListener('hashchange', route);
    route();
  }

  async function route() {
    const parts = (location.hash || '#/').slice(2).split('/').map(decodeURIComponent);
    const k = parts[0] || '';
    document.querySelectorAll('.side a.nav').forEach(a => a.classList.toggle('on', a.dataset.k === k));
    const el = document.getElementById('content');
    if (!el) return;
    mount(el, h('div.spinner'));
    window.scrollTo({ top: 0 });
    try {
      const fn = ADM.routes[k];
      if (!fn) return mount(el, h('div.empty', 'Page introuvable.'));
      const node = await fn(parts.slice(1), el);
      if (node) mount(el, node);
    } catch (e) {
      if (e.status === 401 || e.status === 403) return loginScreen();
      console.error(e); mount(el, h('div.notice.bad', icon('alert'), e.message));
    }
    refreshBadges();
  }
  ADM.route = route;
  ADM.go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
  ADM.loadServices = async (force) => { if (!ADM.services.length || force) ADM.services = (await get('/api/admin/services')).services; return ADM.services; };
  ADM.header = (title, sub, ...actions) => h('div.head', h('div', h('h1', title), sub ? h('p', sub) : null), h('div.row', actions));
  ADM.initials = (c) => ((c.first_name || '?')[0] + ((c.last_name || '')[0] || '')).toUpperCase();

  /* sélecteur de cliente avec recherche */
  ADM.clientPicker = async function (selected) {
    const { clients } = await get('/api/admin/clients');
    const sel = h('select', { name: 'client_id', required: true }, h('option', { value: '' }, '— Choisir une cliente —'), clients.map(c => h('option', { value: c.id, selected: +selected === c.id }, `${c.last_name.toUpperCase()} ${c.first_name}${c.phone ? ' · ' + c.phone : ''}`)));
    return sel;
  };

  ADM.newClient = function (after) {
    const f = h('form.form-grid', h('label.field', h('span.lbl', 'Prénom *'), h('input', { name: 'first_name', required: true })), h('label.field', h('span.lbl', 'Nom *'), h('input', { name: 'last_name', required: true })),
      h('label.field', h('span.lbl', 'Téléphone'), h('input', { name: 'phone', type: 'tel' })), h('label.field', h('span.lbl', 'Email'), h('input', { name: 'email', type: 'email' })),
      h('label.field', h('span.lbl', 'Date de naissance'), h('input', { name: 'birth_date', type: 'date' })), h('label.field', h('span.lbl', 'Adresse'), h('input', { name: 'address' })),
      h('label.check', { style: { gridColumn: '1/-1' } }, h('input', { type: 'checkbox', name: 'consent_data' }), h('span', 'La cliente a donné son accord pour le traitement de ses données')),
      h('label.check', { style: { gridColumn: '1/-1' } }, h('input', { type: 'checkbox', name: 'consent_marketing' }), h('span', 'Accepte les communications commerciales')),
      h('label.check', { style: { gridColumn: '1/-1' } }, h('input', { type: 'checkbox', name: 'consent_photos' }), h('span', 'Autorise l\'utilisation marketing de ses photos')));
    modal('Nouvelle cliente', f, [{ label: 'Annuler', cls: 'ghost' }, { label: 'Créer', onclick: async () => {
      if (!f.reportValidity()) return false; const fd = new FormData(f); const b = Object.fromEntries(fd);
      ['consent_data', 'consent_marketing', 'consent_photos'].forEach(k => b[k] = fd.has(k));
      const r = await post('/api/admin/clients', b); toast('Cliente créée.', 'ok'); if (after) after(r.id); else ADM.go('#/clientes/' + r.id);
    } }]);
  };

  // ============================================================== tableau de bord
  ADM.register('', async () => {
    const d = await get('/api/admin/dashboard');
    const k = d.kpis;
    const kpi = (icn, v, l, href, alert) => h('a.kpi' + (alert && v ? '.alert' : ''), { href }, h('span.ic', icon(icn)), h('div.v', v), h('div.l', l));
    const now = new Date();
    const hello = now.getHours() < 18 ? 'Bonjour' : 'Bonsoir';
    return h('div',
      ADM.header(`${hello} ✨`, cap(fullDate(now)), h('a.btn', { href: '#/planning' }, icon('calendar'), 'Voir le planning')),
      h('div.kpis', kpi('calendar', k.appointments_today, 'Rendez-vous aujourd\'hui', '#/planning'), kpi('sparkle', k.diagnostics_to_review, 'Diagnostics à examiner', '#/diagnostics', true), kpi('file', k.quotes_pending, 'Devis en attente', '#/devis'), kpi('box', k.low_stock, 'Produits en stock faible', '#/stocks', true),
        kpi('chart', eur(k.revenue_month, 0), 'Encaissé ce mois-ci', '#/stats'), kpi('receipt', eur(k.invoices_due_total, 0), `${k.invoices_due} facture(s) à encaisser`, '#/factures')),
      h('div.cols',
        h('div.stack',
          h('div.card', h('div.row.between', h('h3', 'Planning du jour'), h('a.small', { href: '#/planning' }, 'Tout voir →')),
            d.today.length ? d.today.map(a => apptLine(a)) : h('div.empty', icon('calendar'), h('p', 'Aucun rendez-vous aujourd\'hui.'))),
          d.requests.length ? h('div.card', h('h3', 'Demandes à valider'), h('p.small.muted', 'Rendez-vous soumis à votre validation (diagnostic avec alerte, grossesse, etc.).'), d.requests.map(a => h('div.item-row', h('div.grow', h('b', a.client_name), h('div.small.muted', `${a.service_name} · ${cap(longDate(parse(a.start)))} ${hm(parse(a.start))}`)),
            h('button.btn.sm', { onclick: async () => { await post(`/api/admin/appointments/${a.id}/status`, { status: 'confirme' }); toast('Confirmé.', 'ok'); ADM.route(); } }, 'Confirmer'), h('button.btn.ghost.sm', { onclick: () => ADM.openAppointment(a.id) }, 'Ouvrir')))) : null),
        h('div.stack',
          h('div.card', h('div.row.between', h('h3', 'Diagnostics à examiner'), h('a.small', { href: '#/diagnostics' }, 'Tout voir →')),
            d.diagnostics.length ? d.diagnostics.slice(0, 5).map(s => h('div.item-row', h('div.avatar', (s.first_name[0] || '?') + (s.last_name[0] || '')), h('div.grow', h('b', `${s.first_name} ${s.last_name}`), h('div.small.muted', `${s.service || ''} · ${s.result.title || ''}`)), h('button.btn.ghost.sm', { onclick: () => ADM.go('#/diagnostics') }, 'Examiner'))) : h('div.empty', 'Rien à examiner.')),
          h('div.card', h('h3', 'Devis en attente'), d.quotes.length ? d.quotes.map(q => h('div.item-row', h('div.grow', h('b', q.number), h('div.small.muted', `Jusqu'au ${shortDate(q.valid_until)}`)), h('b', eur(q.total)))) : h('div.empty', 'Aucun devis en attente.')),
          h('div.card', h('h3', 'Stock : à surveiller'), d.low_stock.length || d.expiring.length ? [d.low_stock.map(p => h('div.item-row', h('div.grow', h('b', p.name), h('div.small.muted', `${+p.stock.toFixed(2)} ${p.unit} (seuil ${p.min_stock})`)), h('span.badge.bad', 'Stock faible'))), d.expiring.map(p => h('div.item-row', h('div.grow', h('b', p.name), h('div.small.muted', 'Péremption ' + shortDate(p.expiry_date))), h('span.badge.warn', 'Péremption proche')))] : h('div.empty', 'Tout est en ordre.')))));
  });

  function apptLine(a) {
    const s = parse(a.start);
    return h('div.item-row', h('div.time', hm(s)), h('div.grow', h('b', a.client_name), h('div.small.muted', `${a.service_name} · ${dur(a.duration)}`)), statusBadge(a.status), h('button.btn.ghost.sm', { onclick: () => ADM.openAppointment(a.id) }, 'Ouvrir'));
  }

  // ===================================================================== planning
  const P = { view: LS.get('cal.view', 'week'), date: new Date(), data: null };
  const HH = 64; // px par heure
  const startOfWeek = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  ADM.register('planning', async (args, el) => {
    if (args[0] && /^\d{4}-\d\d-\d\d$/.test(args[0])) { P.date = parse(args[0] + 'T00:00'); P.view = args[1] || 'day'; }
    const wrap = h('div');
    async function draw() {
      let from, to;
      if (P.view === 'day') { from = new Date(P.date.getFullYear(), P.date.getMonth(), P.date.getDate()); to = addDays(from, 1); }
      else if (P.view === 'week') { from = startOfWeek(P.date); to = addDays(from, 7); }
      else { const f = new Date(P.date.getFullYear(), P.date.getMonth(), 1); from = startOfWeek(f); to = addDays(from, 42); }
      const data = await get(`/api/admin/calendar?from=${isoDT(from)}&to=${isoDT(to)}`);
      P.data = data;
      const title = P.view === 'day' ? cap(fullDate(from)) : P.view === 'week' ? `Semaine du ${from.getDate()} ${UI.MONTHS[from.getMonth()]}` : cap(`${UI.MONTHS[P.date.getMonth()]} ${P.date.getFullYear()}`);
      const step = (n) => { if (P.view === 'day') P.date = addDays(P.date, n); else if (P.view === 'week') P.date = addDays(P.date, 7 * n); else P.date = new Date(P.date.getFullYear(), P.date.getMonth() + n, 1); draw(); };
      mount(wrap, ADM.header('Planning', null, h('button.btn.soft.sm', { onclick: () => blockModal() }, icon('lock'), 'Bloquer / congés'), h('button.btn.sm', { onclick: () => ADM.newAppointment() }, icon('plus'), 'Rendez-vous')),
        h('div.cal-bar', h('button.btn.ghost.sm', { onclick: () => { P.date = new Date(); draw(); }, }, 'Aujourd\'hui'), h('button.btn.ghost.sm', { 'aria-label': 'Précédent', onclick: () => step(-1) }, icon('chevL')), h('button.btn.ghost.sm', { 'aria-label': 'Suivant', onclick: () => step(1) }, icon('chevR')),
          h('div.cal-title', title), h('div', { style: { flex: 1 } }),
          h('div.seg', [['day', 'Jour'], ['week', 'Semaine'], ['month', 'Mois']].map(([k, l]) => h('button', { class: P.view === k ? 'on' : '', onclick: () => { P.view = k; LS.set('cal.view', k); draw(); } }, l)))),
        P.view === 'month' ? monthView(from, data) : gridView(from, P.view === 'day' ? 1 : 7, data, draw));
    }
    ADM.refreshCalendar = draw;
    await draw();
    return wrap;
  });

  function monthView(from, data) {
    const cells = [];
    const byDay = {};
    data.appointments.filter(a => !['annule'].includes(a.status)).forEach(a => (byDay[a.start.slice(0, 10)] ||= []).push(a));
    const hours = data.hours;
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(d => cells.push(h('div.dh', d)));
    for (let i = 0; i < 42; i++) {
      const d = addDays(from, i), k = isoDate(d), list = byDay[k] || [], out = d.getMonth() !== P.date.getMonth();
      const closed = !(hours[String((d.getDay() + 6) % 7)] || []).length;
      cells.push(h('div.cell', { class: (out ? 'out ' : '') + (k === isoDate(new Date()) ? 'today' : ''), onclick: () => { P.date = d; P.view = 'day'; LS.set('cal.view', 'day'); ADM.go('#/planning/' + k + '/day'); ADM.refreshCalendar && ADM.refreshCalendar(); } },
        h('span.n', d.getDate()), closed && !list.length ? h('div.closed-tag', 'fermé') : null,
        list.slice(0, 3).map(a => h('span.pill.' + a.status, `${hm(parse(a.start))} ${a.client_name.split(' ')[0]}`)), list.length > 3 ? h('div.small.muted', `+ ${list.length - 3}`) : null));
    }
    return h('div.month', cells);
  }

  function gridView(from, ndays, data, redraw) {
    const hours = data.hours;
    let minH = 24, maxH = 0;
    Object.values(hours).forEach(spans => spans.forEach(([a, b]) => { minH = Math.min(minH, +a.slice(0, 2)); maxH = Math.max(maxH, Math.ceil(+b.slice(0, 2) + (+b.slice(3, 5) > 0 ? 1 : 0))); }));
    data.appointments.forEach(a => { minH = Math.min(minH, parse(a.start).getHours()); maxH = Math.max(maxH, Math.ceil(parse(a.end).getHours() + 1)); });
    if (minH >= maxH) { minH = 8; maxH = 20; }
    minH = Math.max(0, minH - (minH > 7 ? 1 : 0)); maxH = Math.min(24, maxH + 0);
    const total = (maxH - minH) * HH;
    const cols = Array.from({ length: ndays }, (_, i) => addDays(from, i));
    const gt = `56px repeat(${ndays}, minmax(${ndays === 1 ? 200 : 120}px, 1fr))`;
    const yOf = (d) => ((d.getHours() + d.getMinutes() / 60) - minH) * HH;
    const head = h('div.tg-head', { style: { gridTemplateColumns: gt } }, h('div'), cols.map(d => h('div', { class: isoDate(d) === isoDate(new Date()) ? 'today' : '' }, UI.DAYS[d.getDay()].slice(0, 3), h('b', d.getDate()))));
    const hourCol = h('div.tg-hours', { style: { '--hh': HH + 'px' } }, Array.from({ length: maxH - minH }, (_, i) => h('div', `${pad(minH + i)}:00`)));
    const body = h('div.tg-body', { style: { gridTemplateColumns: gt, height: total + 'px', '--hh': HH + 'px' } }, hourCol);
    cols.forEach(d => {
      const k = isoDate(d), wd = String((d.getDay() + 6) % 7), spans = hours[wd] || [];
      const col = h('div.tg-col', { class: spans.length ? '' : 'closed', dataset: { day: k } });
      // zones fermées (hors horaires habituels)
      let cursor = minH * 60;
      const offs = [];
      spans.forEach(([a, b]) => { const s = +a.slice(0, 2) * 60 + +a.slice(3), e = +b.slice(0, 2) * 60 + +b.slice(3); if (s > cursor) offs.push([cursor, s]); cursor = Math.max(cursor, e); });
      if (cursor < maxH * 60) offs.push([cursor, maxH * 60]);
      if (spans.length) offs.forEach(([s, e]) => col.appendChild(h('div.off', { style: { top: ((s - minH * 60) / 60 * HH) + 'px', height: ((e - s) / 60 * HH) + 'px' } })));
      data.blocks.filter(b => b.start.slice(0, 10) <= k && b.end.slice(0, 10) >= k).forEach(b => {
        const s = b.start.slice(0, 10) < k ? minH * 60 : parse(b.start).getHours() * 60 + parse(b.start).getMinutes(), e = b.end.slice(0, 10) > k ? maxH * 60 : parse(b.end).getHours() * 60 + parse(b.end).getMinutes();
        col.appendChild(h('div.blk' + (b.kind === 'open' ? '.open' : ''), { style: { top: ((s - minH * 60) / 60 * HH) + 'px', height: Math.max(20, (e - s) / 60 * HH) + 'px' }, title: 'Cliquer pour supprimer', onclick: async (ev) => { ev.stopPropagation(); if (await confirmBox('Supprimer ce créneau ?', b.label || { block: 'Blocage', leave: 'Congés', open: 'Horaires exceptionnels' }[b.kind], 'Supprimer', true)) { await del('/api/admin/blocks/' + b.id); redraw(); } } }, h('b', { block: 'Bloqué', leave: 'Congés', open: 'Ouverture exceptionnelle' }[b.kind]), ' ', b.label));
      });
      data.appointments.filter(a => a.start.slice(0, 10) === k).forEach(a => {
        const s = parse(a.start), e = parse(a.end), top = yOf(s), height = Math.max(26, (e - s) / 3600000 * HH - 2);
        const ev = h('div.ev.' + a.status, { style: { top: top + 'px', height: height + 'px' }, draggable: !['termine', 'annule', 'no_show'].includes(a.status), title: `${a.client_name} — ${a.service_name}`, onclick: () => ADM.openAppointment(a.id),
          ondragstart: (e2) => { e2.dataTransfer.setData('text/plain', String(a.id)); e2.dataTransfer.effectAllowed = 'move'; ev.classList.add('dragging'); drag = { id: a.id, dur: (e - s) / 60000, offY: e2.offsetY }; },
          ondragend: () => { ev.classList.remove('dragging'); document.querySelectorAll('.tg-col .drop').forEach(x => x.remove()); } },
          h('b', `${hm(s)} ${a.client_name}`), h('span.s', a.service_name), height > 70 ? h('div.s', `${dur((e - s) / 60000)} · ${eur(a.price)}`) : null);
        col.appendChild(ev);
      });
      if (k === isoDate(new Date())) { const n = new Date(); if (n.getHours() >= minH && n.getHours() < maxH) col.appendChild(h('div.now-line', { style: { top: yOf(n) + 'px' } })); }
      const slotAt = (ev) => { const r = col.getBoundingClientRect(); const mins = Math.round(((ev.clientY - r.top) / HH * 60) / 15) * 15; return minH * 60 + mins; };
      col.addEventListener('click', (ev) => { if (ev.target !== col && !ev.target.classList.contains('off')) return; const m = slotAt(ev); ADM.newAppointment({ start: `${k}T${pad(Math.floor(m / 60))}:${pad(m % 60)}` }); });
      col.addEventListener('dragover', (ev) => { if (!drag) return; ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; const r = col.getBoundingClientRect(); const m = Math.round((((ev.clientY - r.top - drag.offY) / HH * 60)) / 15) * 15; let z = col.querySelector('.drop'); if (!z) { z = h('div.drop'); col.appendChild(z); } z.style.top = (m / 60 * HH) + 'px'; z.style.height = (drag.dur / 60 * HH) + 'px'; });
      col.addEventListener('dragleave', (ev) => { if (!col.contains(ev.relatedTarget)) { const z = col.querySelector('.drop'); if (z) z.remove(); } });
      col.addEventListener('drop', async (ev) => {
        ev.preventDefault(); if (!drag) return;
        const r = col.getBoundingClientRect(); const m = minH * 60 + Math.round((((ev.clientY - r.top - drag.offY) / HH * 60)) / 15) * 15;
        const start = `${k}T${pad(Math.floor(m / 60))}:${pad(m % 60)}`, id = drag.id; drag = null;
        try { await put('/api/admin/appointments/' + id, { start }); toast('Rendez-vous déplacé.', 'ok'); }
        catch (e) { if (e.status === 409 && await confirmBox('Créneau non disponible', e.message + ' Déplacer quand même ?', 'Forcer le déplacement')) { await put('/api/admin/appointments/' + id, { start, force: true }); toast('Déplacé (forcé).', 'ok'); } else if (e.status !== 409) fail(e); }
        redraw();
      });
      body.appendChild(col);
    });
    const scroller = h('div.tg-scroll', h('div', { style: { minWidth: ndays === 1 ? '0' : '780px' } }, head, body));
    return h('div.tg', scroller);
  }
  let drag = null;

  // =================================================== rendez-vous : création, fiche
  ADM.newAppointment = async function (pre = {}) {
    const [services, clientSel] = await Promise.all([ADM.loadServices(), ADM.clientPicker(pre.client_id)]);
    const active = services.filter(s => s.active);
    const svc = h('select', { name: 'service_id' }, active.map(s => h('option', { value: s.id, selected: +pre.service_id === s.id }, `${s.name} (${dur(s.duration)} · ${eur(s.price)})`)));
    const start = pre.start || isoDT(new Date(Date.now() + 3600e3)).slice(0, 14) + '00';
    const dt = h('input', { type: 'datetime-local', name: 'start', value: start, step: 300, required: true });
    const price = h('input', { type: 'number', name: 'price', min: 0, step: '0.5', placeholder: 'Selon la prestation' });
    const notes = h('textarea', { name: 'notes' });
    const force = h('input', { type: 'checkbox' });
    const slotsBox = h('div.row', { style: { gap: '6px' } });
    const showSlots = async () => { const day = dt.value.slice(0, 10); try { const r = await get(`/api/admin/availability?service_id=${svc.value}&date=${day}`); mount(slotsBox, r.slots.length ? r.slots.map(t => h('button.chip', { type: 'button', onclick: () => { dt.value = `${day}T${t}`; } }, t)) : h('span.small.muted', 'Aucun créneau libre ce jour-là.')); } catch (e) { fail(e); } };
    const body = h('div.stack', field('Cliente', clientSel, h('a', { href: '#', onclick: (e) => { e.preventDefault(); ADM.newClient(async (id) => { document.querySelectorAll('.modal-bg').forEach(m => m.remove()); ADM.newAppointment({ ...pre, client_id: id }); }); } }, '+ Nouvelle cliente')),
      field('Prestation', svc), field('Date et heure', dt), h('div', h('button.btn.soft.sm', { type: 'button', onclick: showSlots }, icon('clock'), 'Voir les créneaux libres'), slotsBox),
      field('Montant (€)', price), field('Notes', notes), h('label.check', force, h('span', 'Forcer même si le créneau n\'est pas disponible (hors horaires, chevauchement)')));
    modal('Nouveau rendez-vous', body, [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => {
      if (!clientSel.value) { toast('Choisissez une cliente.', 'err'); return false; }
      try { await post('/api/admin/appointments', { client_id: +clientSel.value, service_id: +svc.value, start: dt.value, notes: notes.value, price: price.value, force: force.checked }); toast('Rendez-vous créé.', 'ok'); ADM.route(); }
      catch (e) { if (e.status === 409) { toast(e.message + ' Cochez « forcer » pour passer outre.', 'err'); return false; } throw e; }
    } }]);
  };

  const FLOW = [['confirme', 'Confirmer'], ['arrive', 'Arrivée'], ['en_cours', 'En cours'], ['termine', 'Terminer'], ['no_show', 'No-show'], ['annule', 'Annuler']];
  ADM.openAppointment = async function (id) {
    const a = (await get('/api/admin/appointments/' + id)).appointment;
    const s = parse(a.start), e = parse(a.end);
    const dt = h('input', { type: 'datetime-local', value: a.start.slice(0, 16), step: 300 });
    const price = h('input', { type: 'number', value: a.price, min: 0, step: '0.5' });
    const notes = h('textarea', a.notes || '');
    const status = h('div.row', FLOW.filter(([k]) => k !== a.status).map(([k, l]) => h('button.btn.sm' + (k === 'annule' || k === 'no_show' ? '.danger' : k === 'termine' ? '' : '.soft'), { type: 'button', onclick: async () => {
      if (k === 'annule' && !(await confirmBox('Annuler le rendez-vous ?', 'Les rappels programmés seront supprimés.', 'Annuler le rendez-vous', true))) return;
      await post(`/api/admin/appointments/${a.id}/status`, { status: k }); toast(`Statut : ${UI.STATUS[k][0]}`, 'ok'); m.close(); ADM.route(); } }, l)));
    const body = h('div.stack', h('div.row.between', h('div', h('a', { href: '#/clientes/' + a.client_id, onclick: () => m.close() }, h('b', a.client_name)), h('div.small.muted', a.client_phone || '')), statusBadge(a.status)),
      h('div.card.flat.tint', h('b', a.service_name), h('div.small', `${cap(fullDate(s))} · ${hm(s)} – ${hm(e)} (${dur(a.duration)})`), a.deposit > 0 ? h('div.small', `Acompte ${eur(a.deposit)} — ${a.deposit_paid ? 'réglé ✓' : 'non réglé'}`) : null),
      a.diagnostic ? h('div.notice.' + (a.diagnostic.result.needs_validation ? 'warn' : 'info'), icon('sparkle'), h('div', h('b', a.diagnostic.result.title), (a.diagnostic.result.alerts || []).map(x => h('div.small', x)))) : null,
      h('div.form-grid', field('Date et heure', dt), field('Montant (€)', price)), field('Notes', notes), h('div', h('p.small.muted', 'Changer le statut'), status));
    const m = modal('Rendez-vous', body, [
      a.status === 'termine' ? { label: 'Voir la facture', cls: 'ghost', onclick: async () => { const r = await post(`/api/admin/appointments/${a.id}/invoice`); ADM.go('#/factures/' + r.id); } } : null,
      { label: 'Fermer', cls: 'ghost' },
      { label: 'Enregistrer', onclick: async () => {
        const b = { notes: notes.value, price: price.value }; if (dt.value !== a.start.slice(0, 16)) b.start = dt.value;
        try { await put('/api/admin/appointments/' + a.id, b); toast('Enregistré.', 'ok'); ADM.route(); }
        catch (er) { if (er.status === 409 && await confirmBox('Créneau non disponible', er.message + ' Forcer ?', 'Forcer')) { await put('/api/admin/appointments/' + a.id, { ...b, force: true }); ADM.route(); } else if (er.status !== 409) throw er; else return false; }
      } }].filter(Boolean));
  };

  function blockModal() {
    const kind = h('select', h('option', { value: 'block' }, 'Blocage de créneau'), h('option', { value: 'leave' }, 'Congés / fermeture'), h('option', { value: 'open' }, 'Horaires exceptionnels (ouverture en plus)'));
    const now = new Date(); const s0 = isoDT(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0)), e0 = isoDT(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0));
    const s = h('input', { type: 'datetime-local', value: s0, required: true }), e = h('input', { type: 'datetime-local', value: e0, required: true }), label = h('input', { placeholder: 'Ex. : formation, vacances, nocturne…' });
    modal('Bloquer un créneau', h('div.stack', field('Type', kind), h('div.form-grid', field('Début', s), field('Fin', e)), field('Libellé', label), h('p.small.muted', 'Un blocage ou des congés rendent la période indisponible à la réservation en ligne. Les rendez-vous déjà pris ne sont pas annulés automatiquement.')),
      [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => { await post('/api/admin/blocks', { kind: kind.value, start: s.value, end: e.value, label: label.value }); toast('Enregistré.', 'ok'); ADM.route(); } }]);
  }
})();
