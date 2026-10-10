/* Espace professionnel — devis, factures, statistiques, communications, paramètres */
(function () {
  const { h, icon, mount, get, post, put, del, eur, parse, isoDate, isoDT, shortDate, hm, dur, cap, toast, fail, modal, confirmBox, field, fileToDataURL } = UI;
  const A = window.ADM;
  const QLAB = { draft: ['Brouillon', 'neutral'], sent: ['Envoyé', 'info'], accepted: ['Accepté', 'ok'], refused: ['Refusé', 'bad'], converted: ['Converti en rdv', 'gold'], expired: ['Expiré', 'warn'] };
  const ILAB = { due: ['À régler', 'warn'], partial: ['Partiel', 'info'], paid: ['Payée', 'ok'], void: ['Annulée', 'neutral'] };

  // ===================================================================== devis
  A.register('devis', async (args) => {
    const { quotes } = await get('/api/admin/quotes');
    if (args[0]) { const q = quotes.find(x => x.id === +args[0]); if (q) setTimeout(() => quoteModal(q), 0); }
    const pending = quotes.filter(q => ['draft', 'sent'].includes(q.effective_status));
    return h('div', A.header('Devis', 'Créés automatiquement après un diagnostic, ou manuellement', h('button.btn', { onclick: () => quoteForm(null) }, icon('plus'), 'Nouveau devis')),
      h('div.kpis', h('div.kpi', h('div.v', pending.length), h('div.l', 'En attente de réponse')), h('div.kpi', h('div.v', eur(pending.reduce((s, q) => s + q.total, 0), 0)), h('div.l', 'Montant en attente')), h('div.kpi', h('div.v', quotes.filter(q => q.status === 'accepted').length), h('div.l', 'Acceptés, à planifier'))),
      h('div.card', quotes.length ? h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'N°'), h('th', 'Cliente'), h('th', 'Émis le'), h('th', 'Valable jusqu\'au'), h('th.num', 'Total'), h('th', 'Statut'))),
        h('tbody', quotes.map(q => h('tr.click', { onclick: () => quoteModal(q) }, h('td', h('b', q.number)), h('td', `${q.first_name} ${q.last_name}`), h('td', shortDate(q.created_at)), h('td', shortDate(q.valid_until)), h('td.num', eur(q.total)), h('td', h('span.badge.' + QLAB[q.effective_status][1], QLAB[q.effective_status][0]))))))) : h('div.empty', icon('file'), h('p', 'Aucun devis.'))));
  });

  function quoteModal(q) {
    const editable = q.status !== 'converted';
    const body = h('div.stack', h('div.row.between', h('div', h('b', `${q.first_name} ${q.last_name}`), h('div.small.muted', `Émis le ${shortDate(q.created_at)} · valable jusqu'au ${shortDate(q.valid_until)}`)), h('span.badge.' + QLAB[q.effective_status][1], QLAB[q.effective_status][0])),
      q.steps.length ? h('div', h('b', 'Recommandation'), h('ol', q.steps.map(s => h('li', s)))) : null,
      h('table.t', h('tbody', q.items.map(i => h('tr', h('td', i.label), h('td.num', i.qty > 1 ? `× ${i.qty}` : ''), h('td.num', eur(i.price * (i.qty || 1))))), h('tr', h('td', h('b', 'Total')), h('td'), h('td.num', h('b', eur(q.total)))))), q.notes ? h('p.small.muted', q.notes) : null,
      h('div.row', h('a.btn.ghost.sm', { href: `/api/admin/quotes/${q.id}.pdf`, target: '_blank', rel: 'noopener' }, icon('download'), 'PDF / imprimer'),
        h('button.btn.soft.sm', { onclick: async () => { try { const r = await post(`/api/admin/quotes/${q.id}/send`); toast('Devis envoyé par email.', 'ok'); try { await navigator.clipboard.writeText(r.link); } catch (e) { /* ignoré */ } A.route(); } catch (e) { fail(e); } } }, icon('mail'), 'Envoyer par email'),
        editable ? h('button.btn.ghost.sm', { onclick: () => { document.querySelectorAll('.modal-bg').forEach(m => m.remove()); quoteForm(q); } }, icon('edit'), 'Modifier') : null),
      editable && !['refused'].includes(q.status) ? h('div.row', h('span.small.muted', 'Statut :'), q.status !== 'accepted' ? h('button.btn.ghost.sm', { onclick: async () => { await post(`/api/admin/quotes/${q.id}/status`, { status: 'accepted' }); A.route(); } }, 'Marquer accepté') : null, h('button.btn.ghost.sm', { onclick: async () => { await post(`/api/admin/quotes/${q.id}/status`, { status: 'refused' }); A.route(); } }, 'Marquer refusé')) : null);
    modal(`Devis ${q.number}`, body, [['draft', 'refused'].includes(q.status) ? { label: 'Supprimer', cls: 'danger', onclick: async () => { if (!(await confirmBox('Supprimer ce devis ?', q.number, 'Supprimer', true))) return false; await del('/api/admin/quotes/' + q.id); A.route(); } } : null,
      !['refused', 'converted'].includes(q.status) ? { label: 'Convertir en rendez-vous', onclick: () => { document.querySelectorAll('.modal-bg').forEach(m => m.remove()); convertModal(q); return false; }, keep: true } : null, { label: 'Fermer', cls: 'ghost' }].filter(Boolean), { wide: true });
  }

  async function convertModal(q) {
    const services = (await A.loadServices()).filter(s => s.active);
    const first = q.items.find(i => i.service_id);
    const svc = h('select', services.map(s => h('option', { value: s.id, selected: first && first.service_id === s.id }, `${s.name} (${dur(s.duration)})`))), dt = h('input', { type: 'datetime-local', value: isoDT(new Date(Date.now() + 86400e3)).slice(0, 14) + '00', step: 300 }), force = h('input', { type: 'checkbox' });
    modal('Convertir en rendez-vous', h('div.stack', field('Prestation à planifier', svc), field('Date et heure', dt), h('label.check', force, h('span', 'Forcer même si le créneau n\'est pas disponible'))), [{ label: 'Annuler', cls: 'ghost' }, { label: 'Créer le rendez-vous', onclick: async () => { try { await post(`/api/admin/quotes/${q.id}/convert`, { service_id: +svc.value, start: dt.value, force: force.checked }); toast('Rendez-vous créé.', 'ok'); A.go('#/planning'); } catch (e) { if (e.status === 409) { toast(e.message + ' Cochez « forcer ».', 'err'); return false; } throw e; } } }]);
  }

  async function quoteForm(q) {
    const [services, clientSel] = await Promise.all([A.loadServices(), A.clientPicker(q ? q.client_id : null)]);
    let lines = q ? q.items.map(i => ({ ...i })) : [{ label: '', price: 0, qty: 1 }];
    const valid = h('input', { type: 'date', value: q ? q.valid_until : isoDate(new Date(Date.now() + 30 * 86400e3)) }), notes = h('textarea', q ? q.notes : '');
    const box = h('div'), total = h('b');
    const draw = () => { mount(box, lines.map((l, i) => h('div.row', { style: { flexWrap: 'nowrap', marginBottom: '6px' } }, h('input', { value: l.label, placeholder: 'Désignation', oninput: (e) => l.label = e.target.value }), h('input', { type: 'number', value: l.price, min: 0, step: '0.5', style: { maxWidth: '100px' }, 'aria-label': 'Prix', oninput: (e) => { l.price = +e.target.value; sum(); } }), h('input', { type: 'number', value: l.qty, min: 1, step: 1, style: { maxWidth: '70px' }, 'aria-label': 'Quantité', oninput: (e) => { l.qty = +e.target.value; sum(); } }), h('button.x', { type: 'button', 'aria-label': 'Retirer', onclick: () => { lines.splice(i, 1); draw(); } }, icon('x')))), h('div.row', h('button.btn.soft.sm', { type: 'button', onclick: () => { lines.push({ label: '', price: 0, qty: 1 }); draw(); } }, icon('plus'), 'Ligne libre'),
      h('select', { style: { width: 'auto' }, onchange: (e) => { const s = services.find(x => x.id === +e.target.value); if (s) { lines.push({ label: s.name, price: s.price, qty: 1, service_id: s.id }); draw(); } } }, h('option', { value: '' }, '+ Ajouter une prestation'), services.filter(s => s.active).map(s => h('option', { value: s.id }, `${s.name} — ${eur(s.price)}`))))); sum(); };
    const sum = () => total.textContent = eur(lines.reduce((s, l) => s + (l.price || 0) * (l.qty || 1), 0));
    draw();
    modal(q ? `Modifier ${q.number}` : 'Nouveau devis', h('div.stack', q ? null : field('Cliente', clientSel), h('span.lbl.small', 'Lignes du devis'), box, h('div.row.between', h('span', 'Total'), total), h('div.form-grid', field('Valable jusqu\'au', valid)), field('Notes', notes)),
      [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => { const b = { items: lines.filter(l => l.label.trim()), valid_until: valid.value, notes: notes.value, steps: q ? q.steps : [] }; if (q) await put('/api/admin/quotes/' + q.id, b); else { if (!clientSel.value) { toast('Choisissez une cliente.', 'err'); return false; } await post('/api/admin/quotes', { ...b, client_id: +clientSel.value }); } toast('Devis enregistré.', 'ok'); A.route(); } }], { wide: true });
  }

  // ================================================================== factures
  A.register('factures', async (args) => {
    const { invoices } = await get('/api/admin/invoices');
    if (args[0]) { const i = invoices.find(x => x.id === +args[0]); if (i) setTimeout(() => invoiceModal(i), 0); }
    const due = invoices.filter(i => ['due', 'partial'].includes(i.status));
    const month = new Date().toISOString().slice(0, 7);
    return h('div', A.header('Factures', 'Facturation et encaissements'),
      h('div.kpis', h('div.kpi' + (due.length ? '.alert' : ''), h('div.v', eur(due.reduce((s, i) => s + i.total - i.paid, 0), 0)), h('div.l', `${due.length} facture(s) à encaisser`)), h('div.kpi', h('div.v', invoices.filter(i => i.created_at.startsWith(month) && i.status !== 'void').length), h('div.l', 'Factures ce mois-ci'))),
      h('div.card', invoices.length ? h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'N°'), h('th', 'Cliente'), h('th', 'Date'), h('th.num', 'Total'), h('th.num', 'Réglé'), h('th', 'Statut'))),
        h('tbody', invoices.map(i => h('tr.click', { onclick: () => invoiceModal(i) }, h('td', h('b', i.number)), h('td', `${i.first_name} ${i.last_name}`), h('td', shortDate(i.created_at)), h('td.num', eur(i.total)), h('td.num', eur(i.paid)), h('td', h('span.badge.' + ILAB[i.status][1], ILAB[i.status][0]))))))) : h('div.empty', icon('receipt'), h('p', 'Aucune facture. Elles sont créées quand un rendez-vous est marqué « Terminé ».'))));
  });
  function invoiceModal(i) {
    const rest = Math.max(0, +(i.total - i.paid).toFixed(2));
    const body = h('div.stack', h('div.row.between', h('div', h('b', `${i.first_name} ${i.last_name}`), h('div.small.muted', shortDate(i.created_at))), h('span.badge.' + ILAB[i.status][1], ILAB[i.status][0])),
      h('table.t', h('tbody', i.items.map(x => h('tr', h('td', x.label), h('td.num', eur(x.price * (x.qty || 1))))), i.discount ? h('tr', h('td', 'Remise fidélité'), h('td.num', '- ' + eur(i.discount))) : null, h('tr', h('td', h('b', 'Total')), h('td.num', h('b', eur(i.total)))), h('tr', h('td', 'Déjà réglé'), h('td.num', eur(i.paid))), h('tr', h('td', h('b', 'Reste à payer')), h('td.num', h('b', eur(rest)))))),
      h('div.row', h('a.btn.ghost.sm', { href: `/api/admin/invoices/${i.id}.pdf`, target: '_blank', rel: 'noopener' }, icon('download'), 'PDF'),
        !['paid', 'void'].includes(i.status) ? h('button.btn.soft.sm', { onclick: async () => { try { const r = await post(`/api/admin/invoices/${i.id}/redeem`); toast(`Remise de ${eur(r.discount)} appliquée.`, 'ok'); A.route(); } catch (e) { fail(e); } } }, icon('heart'), 'Utiliser les points fidélité') : null));
    const amount = h('input', { type: 'number', value: rest, min: 0.01, step: '0.01', max: rest }), method = h('select', ['carte', 'espèces', 'virement', 'chèque'].map(x => h('option', x)));
    modal(`Facture ${i.number}`, body, [!['paid', 'void'].includes(i.status) ? { label: 'Encaisser…', keep: true, onclick: () => { document.querySelectorAll('.modal-bg').forEach(m => m.remove()); modal('Encaisser', h('div.stack', field('Montant (€)', amount), field('Mode de règlement', method)), [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer le paiement', onclick: async () => { await post(`/api/admin/invoices/${i.id}/payments`, { amount: +amount.value, method: method.value }); toast('Paiement enregistré.', 'ok'); A.route(); } }]); return false; } } : null, { label: 'Fermer', cls: 'ghost' }].filter(Boolean));
  }

  // ===================================================================== avis
  A.register('avis', async () => {
    const { reviews } = await get('/api/admin/reviews');
    const LAB = { pending: ['À relire', 'info'], published: ['Publié', 'ok'], hidden: ['Masqué', 'neutral'] };
    const set = async (id, status) => { await post(`/api/admin/reviews/${id}/status`, { status }); toast(status === 'published' ? 'Avis publié sur le site.' : 'Avis mis à jour.', 'ok'); A.route(); };
    return h('div', A.header('Avis', 'Les avis des clientes (réservés aux prestations réalisées). Rien n\'est publié sans votre accord.'),
      reviews.length ? reviews.map(r => h('div.card', h('div.row.between', h('div', h('b', r.display_name), h('span.small.muted', ' · ' + (r.service || '') + ' · ' + shortDate(r.created_at))), h('span.badge.' + LAB[r.status][1], LAB[r.status][0])),
        h('div', { style: { color: 'var(--gold)' } }, '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)), r.text ? h('p', r.text) : h('p.muted', 'Sans commentaire.'),
        h('div.row', r.status !== 'published' ? h('button.btn.sm', { onclick: () => set(r.id, 'published') }, 'Publier') : h('button.btn.ghost.sm', { onclick: () => set(r.id, 'hidden') }, 'Masquer'),
          h('button.btn.danger.sm', { onclick: async () => { if (await confirmBox('Supprimer cet avis ?', '', 'Supprimer', true)) { await del('/api/admin/reviews/' + r.id); A.route(); } } }, 'Supprimer')))) : h('div.card', h('div.empty', icon('star'), h('p', 'Aucun avis pour le moment. Les clientes peuvent en donner depuis leur espace après une prestation terminée.'))));
  });

  // ============================================================== statistiques
  const C = { rose: '#c4707f', gold: '#b8975a', nude: '#d9bba9', soft: '#f2d3cf', ok: '#5f8f72', bad: '#b5495b', info: '#5a7fa3', warn: '#d99a2b', ink: '#6e6260' };
  const svg = (w, hgt, ...kids) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${hgt}`); s.setAttribute('class', 'chart'); s.setAttribute('role', 'img'); kids.flat().forEach(k => k && s.appendChild(k)); return s; };
  const el = (n, a, t) => { const e = document.createElementNS('http://www.w3.org/2000/svg', n); Object.entries(a || {}).forEach(([k, v]) => e.setAttribute(k, v)); if (t != null) e.textContent = t; return e; };
  const MS = (m) => UI.MONTHS[+m.slice(5) - 1].slice(0, 4) + '.';
  function bars(labels, values, color, fmt) {
    const nice = (m) => { const e = Math.pow(10, Math.floor(Math.log10(m))), f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
    const W = 560, H = 220, pl = 58, pb = 26, pt = 14, max = nice(Math.max(1, ...values) * 1.05), bw = (W - pl) / labels.length;
    const out = [];
    for (let i = 0; i <= 4; i++) { const y = pt + (H - pt - pb) * (1 - i / 4); out.push(el('line', { x1: pl, x2: W, y1: y, y2: y, stroke: '#f0e6e2' }), el('text', { x: pl - 6, y: y + 4, 'text-anchor': 'end' }, fmt ? fmt(max * i / 4) : Math.round(max * i / 4))); }
    values.forEach((v, i) => { const bh = (H - pt - pb) * v / max, x = pl + i * bw + bw * .2; out.push(el('rect', { x, y: H - pb - bh, width: bw * .6, height: Math.max(0, bh), rx: 6, fill: color }, null), el('text', { x: x + bw * .3, y: H - 8, 'text-anchor': 'middle' }, MS(labels[i]))); if (v) out.push(el('text', { x: x + bw * .3, y: H - pb - bh - 5, 'text-anchor': 'middle', style: 'fill:#3a3435;font-weight:500' }, fmt ? fmt(v) : v)); });
    const s = svg(W, H, out); s.setAttribute('aria-label', 'Histogramme'); return s;
  }
  function donut(items) {
    const total = items.reduce((s, i) => s + i.v, 0) || 1, R = 70, r = 44; let a0 = -Math.PI / 2; const out = [];
    items.forEach(it => { const a1 = a0 + it.v / total * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0; if (it.v) { const f = (a, rad) => [100 + rad * Math.cos(a), 100 + rad * Math.sin(a)]; const [x0, y0] = f(a0, R), [x1, y1] = f(a1 - .0001, R), [x2, y2] = f(a1 - .0001, r), [x3, y3] = f(a0, r); out.push(el('path', { d: `M${x0} ${y0} A${R} ${R} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${big} 0 ${x3} ${y3}Z`, fill: it.c })); } a0 = a1; });
    out.push(el('text', { x: 100, y: 106, 'text-anchor': 'middle', style: 'font-family:var(--serif);font-size:26px;fill:#3a3435' }, total));
    return svg(200, 200, out);
  }
  function hbars(items, fmt) {
    const max = Math.max(1, ...items.map(i => i.v));
    return h('div', items.map(i => h('div', { style: { marginBottom: '10px' } }, h('div.row.between', h('span.small', i.l), h('span.small', h('b', fmt(i.v)), i.sub ? h('span.muted', ' · ' + i.sub) : null)), h('div.meter', h('i', { style: { width: (i.v / max * 100) + '%', background: i.c || C.rose } })))));
  }
  A.register('stats', async () => {
    const months = A.LS.get('stats.months', 6);
    const d = await get('/api/admin/stats?months=' + months);
    const tot = d.revenue.reduce((s, x) => s + x, 0);
    const SC = { termine: [C.ok, 'Terminés'], confirme: [C.info, 'Confirmés'], en_attente: [C.warn, 'En attente'], demande: [C.gold, 'Demandes'], annule: [C.nude, 'Annulés'], no_show: [C.bad, 'No-show'], arrive: [C.gold, 'Arrivées'], en_cours: [C.gold, 'En cours'] };
    const st = Object.entries(d.by_status).filter(([, v]) => v).map(([k, v]) => ({ v, c: (SC[k] || [C.nude])[0], l: (SC[k] || [0, k])[1] }));
    const kpi = (v, l, i) => h('div.kpi', h('span.ic', icon(i)), h('div.v', v), h('div.l', l));
    return h('div', A.header('Statistiques', 'Vue d\'ensemble de votre activité', h('div.seg', [3, 6, 12].map(n => h('button', { class: n === months ? 'on' : '', onclick: () => { A.LS.set('stats.months', n); A.route(); } }, n + ' mois')))),
      h('div.kpis', kpi(eur(tot, 0), `Encaissé sur ${months} mois`, 'chart'), kpi(eur(d.avg_basket, 0), 'Panier moyen', 'receipt'), kpi(d.occupancy + ' %', 'Taux d\'occupation (30 j)', 'clock'), kpi(d.no_show_rate + ' %', 'Taux de no-show', 'alert'), kpi(d.cancel_rate + ' %', 'Taux d\'annulation', 'x'), kpi(d.repeat_rate + ' %', 'Clientes fidèles (2 visites +)', 'heart'), kpi(d.total_clients, 'Clientes', 'users'), kpi(eur(d.stock_value, 0), 'Valeur du stock', 'box')),
      h('div.cols',
        h('div.stack', h('div.card', h('h3', 'Chiffre d\'affaires encaissé'), bars(d.months, d.revenue, C.rose, (v) => eur(v, 0))), h('div.card', h('h3', 'Nouvelles clientes'), bars(d.months, d.new_clients, C.gold)), h('div.card', h('h3', 'Prestations réalisées'), bars(d.months, d.visits, C.nude))),
        h('div.stack', h('div.card', h('h3', 'Rendez-vous par statut'), h('div.row', { style: { flexWrap: 'nowrap' } }, h('div', { style: { width: '170px', flex: 'none' } }, donut(st)), h('div.legend', { style: { flexDirection: 'column', gap: '6px' } }, st.map(s => h('span', h('i', { style: { background: s.c } }), `${s.l} : ${s.v}`))))),
          h('div.card', h('h3', 'Prestations les plus rentables'), d.top_services.length ? hbars(d.top_services.map(s => ({ l: s.name, v: s.revenue, sub: s.n + ' rdv' })), (v) => eur(v, 0)) : h('div.empty', 'Pas encore de données.')),
          h('div.card', h('h3', 'Par univers'), d.by_category.length ? hbars(d.by_category.map((s, i) => ({ l: s.name, v: s.revenue, sub: s.n + ' rdv', c: [C.rose, C.gold, C.nude, C.info][i % 4] })), (v) => eur(v, 0)) : h('div.empty', 'Pas encore de données.')))));
  });

  // =============================================================== communications
  A.register('messages', async () => {
    const { messages, smtp } = await get('/api/admin/outbox');
    const SLAB = { pending: ['Programmé', 'info'], sent: ['Envoyé', 'ok'], simulated: ['Enregistré (SMTP non configuré)', 'neutral'], failed: ['Échec', 'bad'], cancelled: ['Annulé', 'neutral'] };
    const KLAB = { confirmation: 'Confirmation', reminder_48h: 'Rappel 48 h', reminder_24h: 'Rappel 24 h', thanks: 'Après rendez-vous', quote: 'Devis', custom: 'Message' };
    return h('div', A.header('Communications', 'Confirmations, rappels automatiques et messages', h('button.btn', { onclick: compose }, icon('mail'), 'Nouveau message')),
      smtp ? null : h('div.notice.warn', { style: { marginBottom: '16px' } }, icon('alert'), 'L\'envoi d\'emails n\'est pas configuré (variables INSTITUT_SMTP_*). Les messages sont enregistrés et visibles dans l\'espace de chaque cliente, mais pas envoyés par email.'),
      h('div.card', messages.length ? h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'Date'), h('th', 'Type'), h('th', 'Destinataire'), h('th', 'Objet'), h('th', 'Statut'), h('th'))),
        h('tbody', messages.map(m => h('tr', h('td', shortDate(m.send_at) + ' ' + m.send_at.slice(11, 16)), h('td', h('span.badge.neutral', KLAB[m.kind] || m.kind)), h('td', m.first_name ? `${m.first_name} ${m.last_name}` : m.to_addr), h('td', { title: m.body }, m.subject), h('td', h('span.badge.' + SLAB[m.status][1], SLAB[m.status][0]), m.error ? h('div.small', { style: { color: 'var(--bad)' } }, m.error) : null),
          h('td', m.status === 'pending' ? h('button.btn.ghost.sm', { onclick: async () => { await del('/api/admin/outbox/' + m.id); A.route(); } }, 'Annuler') : null)))))) : h('div.empty', 'Aucun message.')));
  });
  async function compose() {
    const c = await A.clientPicker(), s = h('input', { placeholder: 'Objet' }), b = h('textarea', { style: { minHeight: '150px' } });
    modal('Nouveau message', h('div.stack', field('Cliente', c), field('Objet', s), field('Message', b)), [{ label: 'Annuler', cls: 'ghost' }, { label: 'Envoyer', onclick: async () => { if (!c.value) { toast('Choisissez une cliente.', 'err'); return false; } await post('/api/admin/messages', { client_id: +c.value, subject: s.value, body: b.value }); toast('Message envoyé.', 'ok'); A.route(); } }]);
  }

  // ================================================================== paramètres
  A.register('parametres', async (args) => {
    const tab = args[0] || 'institut';
    const { settings: S, smtp } = await get('/api/admin/settings');
    const save = async (key, value) => { await put('/api/admin/settings/' + key, { value }); toast('Paramètres enregistrés.', 'ok'); A.info = await get('/api/public/info'); };
    const tabs = [['institut', 'Institut'], ['horaires', 'Horaires'], ['reservation', 'Réservation'], ['rappels', 'Rappels'], ['fidelite', 'Fidélité'], ['visuels', 'Visuels du site'], ['conges', 'Congés & fermetures'], ['securite', 'Sécurité']];
    const views = {
      institut: () => { const f = {}; const fields = [['name', 'Nom de l\'institut'], ['tagline', 'Accroche'], ['address', 'Adresse'], ['phone', 'Téléphone'], ['email', 'Email de contact'], ['siret', 'SIRET'], ['legal', 'Mentions légales (factures)']];
        return h('div.card', h('div.form-grid', fields.map(([k, l]) => field(l, f[k] = h('input', { value: S.institute[k] || '' })))), h('div.row', { style: { marginTop: '16px' } }, h('button.btn', { onclick: () => save('institute', Object.fromEntries(Object.entries(f).map(([k, i]) => [k, i.value]))) }, 'Enregistrer'))); },
      horaires: () => { const hrs = JSON.parse(JSON.stringify(S.opening_hours)); const D = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']; const box = h('div');
        const draw = () => mount(box, D.map((d, i) => { const sp = hrs[i] ||= []; return h('div.hours-row', h('b', d), h('div.spans', sp.length ? sp.map((x, j) => h('div.row', { style: { gap: '4px', flexWrap: 'nowrap' } }, h('input', { type: 'time', value: x[0], 'aria-label': 'Début', onchange: (e) => x[0] = e.target.value }), '–', h('input', { type: 'time', value: x[1], 'aria-label': 'Fin', onchange: (e) => x[1] = e.target.value }), h('button.x', { 'aria-label': 'Retirer', onclick: () => { sp.splice(j, 1); draw(); } }, icon('x')))) : h('span.muted', 'Fermé'), h('button.btn.soft.sm', { onclick: () => { sp.push(sp.length ? ['14:00', '18:00'] : ['09:30', '18:30']); draw(); } }, icon('plus'), 'Plage'))); }));
        draw(); return h('div.card', h('p.small.muted', 'Plages d\'ouverture habituelles (plusieurs plages possibles, par exemple pour la pause déjeuner). Les congés et horaires exceptionnels se gèrent dans le planning.'), box, h('div.row', { style: { marginTop: '16px' } }, h('button.btn', { onclick: () => save('opening_hours', hrs) }, 'Enregistrer'))); },
      reservation: () => { const b = S.booking, f = {};
        return h('div.card', h('div.form-grid', field('Pas des créneaux proposés', f.slot_step = h('select', [15, 30, 45, 60].map(n => h('option', { value: n, selected: b.slot_step === n }, n + ' min')))), field('Délai minimum avant un rendez-vous (h)', f.min_notice_hours = h('input', { type: 'number', min: 0, value: b.min_notice_hours })), field('Réservation possible jusqu\'à (jours)', f.max_days_ahead = h('input', { type: 'number', min: 1, value: b.max_days_ahead })), field('Annulation / déplacement en ligne jusqu\'à (h avant)', f.cancel_hours = h('input', { type: 'number', min: 0, value: b.cancel_hours })), field('Validité des devis (jours)', f.quote_validity_days = h('input', { type: 'number', min: 1, value: b.quote_validity_days }))),
          h('label.check', { style: { marginTop: '14px' } }, f.auto_confirm = h('input', { type: 'checkbox', checked: !!b.auto_confirm }), h('span', 'Confirmer automatiquement les rendez-vous pris en ligne (sinon « en attente » jusqu\'à votre accord). Les rendez-vous soumis à validation restent toujours des demandes.')),
          h('div.row', { style: { marginTop: '16px' } }, h('button.btn', { onclick: () => save('booking', { slot_step: +f.slot_step.value, min_notice_hours: +f.min_notice_hours.value, max_days_ahead: +f.max_days_ahead.value, cancel_hours: +f.cancel_hours.value, quote_validity_days: +f.quote_validity_days.value, auto_confirm: f.auto_confirm.checked }) }, 'Enregistrer'))); },
      rappels: () => { const r = S.reminders, f = {}; const cb = (k, l) => h('label.check', f[k] = h('input', { type: 'checkbox', checked: !!r[k] }), h('span', l));
        return h('div.card', smtp ? null : h('div.notice.warn', { style: { marginBottom: '14px' } }, icon('alert'), 'Email non configuré : les rappels sont enregistrés mais pas envoyés (variables INSTITUT_SMTP_HOST, _USER, _PASSWORD, _FROM).'), h('div.stack', cb('confirmation', 'Confirmation immédiate'), cb('h48', 'Rappel 48 h avant'), cb('h24', 'Rappel 24 h avant'), cb('thanks', 'Message après le rendez-vous'), field('Délai du message de remerciement (h après la fin)', f.thanks_delay_hours = h('input', { type: 'number', min: 0, value: r.thanks_delay_hours, style: { maxWidth: '120px' } }))),
          h('div.row', { style: { marginTop: '16px' } }, h('button.btn', { onclick: () => save('reminders', { confirmation: f.confirmation.checked, h48: f.h48.checked, h24: f.h24.checked, thanks: f.thanks.checked, thanks_delay_hours: +f.thanks_delay_hours.value }) }, 'Enregistrer'))); },
      fidelite: () => { const l = S.loyalty, f = {};
        const ms = (l.milestones || []).map(m => `${m.at} | ${m.label} | ${m.msg || ''}`).join('\n');
        return h('div.card', h('h3', 'Passeport Beauté (éclats)'), h('div.form-grid', field('Nombre d\'éclats pour la surprise', f.stamps_target = h('input', { type: 'number', min: 2, max: 30, value: l.stamps_target || 10 })), field('Nom de la surprise', f.reward_name = h('input', { value: l.reward_name || 'Surprise Éclat de Rêve' }))),
          field('Petites attentions (une par ligne : étape | titre | message)', f.milestones = h('textarea', { style: { minHeight: '100px' } }, ms), '1 prestation réalisée = 1 éclat, automatiquement. Vous pouvez aussi ajouter ou retirer un éclat depuis la fiche cliente.'),
          h('h3', { style: { marginTop: '20px' } }, 'Points (par euro)'), h('div.form-grid', field('Points gagnés par euro dépensé', f.points_per_euro = h('input', { type: 'number', min: 0, step: '0.1', value: l.points_per_euro })), field('Points nécessaires pour une récompense', f.reward_points = h('input', { type: 'number', min: 1, value: l.reward_points })), field('Valeur de la récompense (€)', f.reward_value = h('input', { type: 'number', min: 0, step: '0.5', value: l.reward_value }))),
          h('div.row', { style: { marginTop: '16px' } }, h('button.btn', { onclick: () => save('loyalty', { points_per_euro: +f.points_per_euro.value, reward_points: +f.reward_points.value, reward_value: +f.reward_value.value, stamps_target: +f.stamps_target.value, reward_name: f.reward_name.value, milestones: f.milestones.value.split('\n').map(x => x.split('|').map(t => t.trim())).filter(x => +x[0]).map(x => ({ at: +x[0], label: x[1] || '', msg: x[2] || '' })) }) }, 'Enregistrer'))); },      visuels: async () => { const m = JSON.parse(JSON.stringify(S.marketing)), services = await A.loadServices(); const cats = [...new Set(services.map(s => s.category))]; m.category_images ||= {};
        const up = (label, get_, set_) => { const prev = h('div'), draw = () => mount(prev, get_() ? h('img', { src: get_(), alt: '', style: { height: '90px', borderRadius: '12px' } }) : h('span.small.muted', 'Visuel illustré par défaut')); draw(); return h('div.card.flat', h('b', label), prev, h('div.row', { style: { marginTop: '8px' } }, h('input', { type: 'file', accept: 'image/*', onchange: async (e) => { try { set_((await post('/api/admin/upload', { image: await fileToDataURL(e.target.files[0], 1600) })).url); draw(); } catch (er) { fail(er); } } }), get_() ? h('button.btn.ghost.sm', { onclick: () => { set_(''); draw(); } }, 'Retirer') : null)); };
        return h('div.stack', h('div.notice.info', icon('info'), 'Ajoutez vos propres photos (cheveux, ongles, cils, institut…) pour la page d\'accueil. Sans photo, le site affiche des visuels illustrés aux couleurs de l\'institut. Utilisez uniquement des images dont vous détenez les droits.'),
          h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' } }, up('Image principale (Cheveux, en grand)', () => m.hero_image, (v) => m.hero_image = v), cats.map(c => up('Univers : ' + c, () => m.category_images[c], (v) => { if (v) m.category_images[c] = v; else delete m.category_images[c]; }))),
          h('div.row', h('button.btn', { onclick: () => save('marketing', m) }, 'Enregistrer les visuels'))); },
      conges: async () => { const now = new Date(); const { blocks } = await get(`/api/admin/calendar?from=${isoDT(now)}&to=${isoDT(new Date(now.getTime() + 400 * 86400e3))}`);
        return h('div.card', h('p.small.muted', 'Blocages, congés et ouvertures exceptionnelles à venir. Pour en ajouter, utilisez « Bloquer / congés » dans le Planning.'), blocks.length ? blocks.map(b => h('div.item-row', h('div.grow', h('b', { block: 'Blocage', leave: 'Congés', open: 'Ouverture exceptionnelle' }[b.kind]), h('div.small.muted', `${shortDate(b.start)} ${hm(parse(b.start))} → ${shortDate(b.end)} ${hm(parse(b.end))}${b.label ? ' · ' + b.label : ''}`)), h('button.btn.ghost.sm', { onclick: async () => { await del('/api/admin/blocks/' + b.id); A.route(); } }, 'Supprimer'))) : h('div.empty', 'Aucun blocage à venir.'), h('a.btn.sm', { href: '#/planning' }, 'Aller au planning')); },
      securite: () => { const c = h('input', { type: 'password', autocomplete: 'current-password' }), n = h('input', { type: 'password', autocomplete: 'new-password', minlength: 10 });
        return h('div.card', { style: { maxWidth: '460px' } }, h('div.stack', field('Mot de passe actuel', c), field('Nouveau mot de passe', n, '10 caractères minimum'), h('button.btn', { onclick: async () => { try { await post('/api/admin/password', { current: c.value, new: n.value }); toast('Mot de passe modifié.', 'ok'); c.value = n.value = ''; } catch (e) { fail(e); } } }, 'Changer le mot de passe'))); },
    };
    const content = await views[tab || 'institut']();
    return h('div', A.header('Paramètres', 'Personnalisez votre institut'), h('div.tabs', tabs.map(([k, l]) => h('button', { class: k === tab ? 'on' : '', onclick: () => A.go('#/parametres/' + k) }, l))), content);
  });
})();
