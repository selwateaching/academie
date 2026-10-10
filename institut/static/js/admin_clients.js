/* Espace professionnel — clientes : liste et fiche complète */
(function () {
  const { h, icon, mount, get, post, put, del, eur, parse, shortDate, longDate, hm, dur, cap, toast, fail, modal, confirmBox, field, fileToDataURL, statusBadge } = UI;
  const A = window.ADM;
  const TL_ICON = { appointment: 'calendar', quote: 'file', invoice: 'receipt', payment: 'receipt', diagnostic: 'sparkle', photo: 'camera', note: 'edit' };

  A.register('clientes', async (args) => {
    if (args[0]) return fiche(+args[0], args[1]);
    const box = h('div'), search = h('input', { type: 'search', placeholder: 'Rechercher une cliente (nom, email, téléphone)…', 'aria-label': 'Rechercher' });
    let timer;
    async function load() {
      const { clients } = await get('/api/admin/clients?q=' + encodeURIComponent(search.value));
      mount(box, clients.length ? h('div.table-wrap', h('table.t', h('thead', h('tr', ['Cliente', 'Contact', 'Visites', 'Dépensé', 'Dernière visite', 'Prochain rdv', 'Points'].map((x, i) => h('th', { class: i === 2 || i === 3 || i === 6 ? 'num' : '' }, x)))),
        h('tbody', clients.map(c => h('tr.click', { onclick: () => A.go('#/clientes/' + c.id) }, h('td', h('div.row', { style: { flexWrap: 'nowrap' } }, h('div.avatar', A.initials(c)), h('b', `${c.first_name} ${c.last_name}`))), h('td', h('div', c.email || '—'), h('div.small.muted', c.phone || '')), h('td.num', c.visits), h('td.num', eur(c.spent, 0)), h('td', c.last_visit ? shortDate(c.last_visit) : '—'), h('td', c.next_visit ? shortDate(c.next_visit) + ' ' + hm(parse(c.next_visit)) : '—'), h('td.num', c.loyalty_points)))))) : h('div.empty', icon('users'), h('p', 'Aucune cliente trouvée.')));
    }
    search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 250); });
    await load();
    return h('div', A.header('Clientes', 'Toutes vos clientes et leur historique', h('button.btn', { onclick: () => A.newClient() }, icon('plus'), 'Nouvelle cliente')), h('div.card', h('div', { style: { marginBottom: '14px' } }, search), box));
  });

  async function fiche(id, tab) {
    tab = tab || 'timeline';
    const d = await get('/api/admin/clients/' + id), c = d.client;
    const reload = () => A.route();
    const tabs = [['timeline', 'Chronologie'], ['infos', 'Informations'], ['diagnostics', `Diagnostics (${d.diagnostics.length})`], ['photos', `Photos (${d.photos.length})`], ['produits', 'Produits'], ['finance', 'Devis & factures'], ['notes', `Notes (${d.notes.length})`]];
    const content = await ({ timeline, infos, diagnostics, photos, produits, finance, notes }[tab] || timeline)(d, c, reload);
    const done = d.appointments.filter(a => a.status === 'termine');
    return h('div', h('a.small', { href: '#/clientes' }, '← Clientes'),
      h('div.card', { style: { marginTop: '10px' } }, h('div.row.between', h('div.row', { style: { flexWrap: 'nowrap', gap: '16px' } }, h('div.avatar.lg', A.initials(c)),
        h('div', h('h2', { style: { margin: 0 } }, `${c.first_name} ${c.last_name}`), h('div.small.muted', [c.email, c.phone].filter(Boolean).join(' · ') || 'Pas de coordonnées'),
          h('div.row', { style: { gap: '6px', marginTop: '6px' } }, h('span.badge.gold', icon('heart'), `${c.loyalty_points} pts`), c.consent_data ? h('span.badge.ok', 'Données ✓') : h('span.badge.warn', 'Consentement données ?'), c.consent_photos ? h('span.badge.ok', 'Photos marketing ✓') : h('span.badge.neutral', 'Photos : usage interne'), c.consent_marketing ? h('span.badge.ok', 'Newsletter ✓') : null))),
        h('div.row', h('button.btn', { onclick: () => A.newAppointment({ client_id: c.id }) }, icon('calendar'), 'Rendez-vous'), h('button.btn.ghost', { onclick: () => msgModal(c) }, icon('mail'), 'Message'))),
        h('div.kpis', { style: { margin: '18px 0 0' } }, [['Visites', done.length], ['Dépensé', eur(d.spent, 0)], ['Panier moyen', done.length ? eur(d.spent / done.length, 0) : '—'], ['Dernière visite', done.length ? shortDate(done[0].start) : '—']].map(([l, v]) => h('div.kpi', { style: { boxShadow: 'none' } }, h('div.v', { style: { fontSize: '1.7rem' } }, v), h('div.l', l))))),
      h('div.tabs', { role: 'tablist', style: { marginTop: '20px' } }, tabs.map(([k, l]) => h('button', { role: 'tab', class: k === tab ? 'on' : '', onclick: () => A.go(`#/clientes/${id}/${k}`) }, l))),
      content);
  }

  function timeline(d) {
    return h('div.card', d.timeline.length ? h('div.timeline', d.timeline.slice(0, 80).map(e => h('div.tl', h('span.dot', icon(TL_ICON[e.type] || 'info')), h('div.when', shortDate(e.at.slice(0, 10)) + (e.at.length > 10 && e.at.slice(11, 16) !== '00:00' ? ' · ' + e.at.slice(11, 16) : '')), h('b', e.title), e.detail ? h('div.small.muted', e.detail) : null))) : h('div.empty', 'Aucun historique pour le moment.'));
  }

  async function infos(d, c, reload) {
    const { passport: pp } = await get(`/api/admin/clients/${c.id}/passport`);
    const f = h('form.stack', { onsubmit: async (e) => {
      e.preventDefault(); const fd = new FormData(f), b = Object.fromEntries(fd);
      ['consent_data', 'consent_marketing', 'consent_photos'].forEach(k => b[k] = fd.has(k));
      try { await put('/api/admin/clients/' + c.id, b); toast('Fiche mise à jour.', 'ok'); reload(); } catch (er) { fail(er); }
    } },
      h('div.form-grid', field('Prénom', h('input', { name: 'first_name', value: c.first_name, required: true })), field('Nom', h('input', { name: 'last_name', value: c.last_name, required: true })), field('Téléphone', h('input', { name: 'phone', value: c.phone || '' })), field('Email', h('input', { name: 'email', type: 'email', value: c.email || '' })),
        field('Date de naissance', h('input', { name: 'birth_date', type: 'date', value: c.birth_date || '' })), field('Adresse', h('input', { name: 'address', value: c.address || '' }))),
      field('Préférences', h('textarea', { name: 'preferences' }, c.preferences || '')),
      field('Notes privées (jamais visibles par la cliente)', h('textarea', { name: 'notes', style: { minHeight: '120px' } }, c.notes || '')),
      h('h4', 'Consentements'),
      h('label.check', h('input', { type: 'checkbox', name: 'consent_data', checked: !!c.consent_data }), h('span', 'Traitement des données personnelles (RGPD)')),
      h('label.check', h('input', { type: 'checkbox', name: 'consent_marketing', checked: !!c.consent_marketing }), h('span', 'Communications commerciales')),
      h('label.check', h('input', { type: 'checkbox', name: 'consent_photos', checked: !!c.consent_photos }), h('span', 'Utilisation marketing des photos avant/après (retirer ce consentement désactive toutes ses photos publiées)')),
      h('div.row', h('button.btn', { type: 'submit' }, 'Enregistrer')));
    return h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' } }, h('div.card', f),
      h('div.stack', h('div.card', h('h3', 'Passeport Beauté'), h('p', h('b', `${pp.current} / ${pp.target} éclats`), pp.pending_rewards > 0 ? h('span.badge.gold', { style: { marginLeft: '8px' } }, '🎁 ' + pp.reward_name + ' à remettre') : null), h('p.small.muted', `${pp.total} prestations/éclats au total · ${pp.rewards_given} surprise(s) remise(s)`),
          h('div.row', h('button.btn.soft.sm', { onclick: async () => { try { await post(`/api/admin/clients/${c.id}/stamps`, { delta: 1 }); toast('+1 éclat.', 'ok'); reload(); } catch (e) { toast(e.message, 'err'); } } }, '+1 éclat'),
            h('button.btn.ghost.sm', { onclick: async () => { try { await post(`/api/admin/clients/${c.id}/stamps`, { delta: -1 }); toast('-1 éclat.', 'ok'); reload(); } catch (e) { toast(e.message, 'err'); } } }, '−1'),
            pp.pending_rewards > 0 ? h('button.btn.sm', { onclick: async () => { if (await confirmBox('Surprise remise ?', 'Confirmez que la cliente a reçu : ' + pp.reward_name, 'Oui, remise')) { try { await post(`/api/admin/clients/${c.id}/reward`); toast('Surprise enregistrée.', 'ok'); reload(); } catch (e) { toast(e.message, 'err'); } } } }, '🎁 Surprise remise') : null)),
        h('div.card', h('h3', 'Points'), h('p', `${c.loyalty_points} points`), d.loyalty_ledger.slice(0, 6).map(m => h('div.item-row', h('div.grow', m.reason, h('div.small.muted', shortDate(m.created_at))), h('b', (m.points > 0 ? '+' : '') + m.points))),
        h('button.btn.soft.sm', { onclick: () => pointsModal(c, reload) }, 'Ajuster les points')),
        h('div.card', h('h3', 'Accès au compte'), h('p.small.muted', 'La cliente se connecte avec son email. En cas d\'oubli, générez un mot de passe temporaire à lui communiquer.'),
          h('button.btn.ghost.sm', { onclick: async () => { if (await confirmBox('Générer un mot de passe temporaire ?', 'L\'ancien mot de passe ne fonctionnera plus.', 'Générer')) { const r = await post(`/api/admin/clients/${c.id}/reset-password`); modal('Mot de passe temporaire', h('div.stack', h('p', 'À transmettre à la cliente (affiché une seule fois) :'), h('input', { readonly: true, value: r.temporary_password, onfocus: (e) => e.target.select() })), [{ label: 'Fermer' }]); } } }, icon('lock'), 'Mot de passe temporaire'))));
  }
  function pointsModal(c, reload) {
    const p = h('input', { type: 'number', value: 10, step: 1 }), r = h('input', { placeholder: 'Motif (ex. geste commercial)' });
    modal('Ajuster les points', h('div.stack', field('Points (négatif pour retirer)', p), field('Motif', r)), [{ label: 'Annuler', cls: 'ghost' }, { label: 'Valider', onclick: async () => { await post(`/api/admin/clients/${c.id}/loyalty`, { points: +p.value, reason: r.value }); toast('Points mis à jour.', 'ok'); reload(); } }]);
  }
  function msgModal(c) {
    const s = h('input', { placeholder: 'Objet' }), b = h('textarea', { style: { minHeight: '140px' } });
    modal(`Message à ${c.first_name}`, h('div.stack', !c.email ? h('div.notice.warn', icon('alert'), 'Pas d\'adresse email : le message sera uniquement visible dans son espace.') : null, field('Objet', s), field('Message', b)),
      [{ label: 'Annuler', cls: 'ghost' }, { label: 'Envoyer', onclick: async () => { await post('/api/admin/messages', { client_id: c.id, subject: s.value, body: b.value }); toast('Message envoyé.', 'ok'); } }]);
  }

  function zoom(src) { modal('Photo', h('img', { src, alt: '', style: { width: '100%', borderRadius: '12px' } }), [{ label: 'Fermer' }], { wide: true }); }

  function diagnostics(d, c, reload) {
    if (!d.diagnostics.length) return h('div.card', h('div.empty', icon('sparkle'), h('p', 'Aucun diagnostic.')));
    return h('div.stack', d.diagnostics.map(s => h('div.card', h('div.row.between', h('div', h('b', s.diagnostic), h('div.small.muted', `${shortDate(s.created_at)} · ${s.service || ''}`)),
      h('span.vchip.' + (s.result.verdict || 'go'), s.result.title || '')),
      s.result.alerts && s.result.alerts.length ? s.result.alerts.map(a => h('div.notice.warn', { style: { marginTop: '10px' } }, icon('alert'), a)) : null,
      s.result.steps && s.result.steps.length ? h('p.small', { style: { marginTop: '10px' } }, h('b', 'Recommandation : '), s.result.steps.join(' → ')) : null,
      s.result.internal_notes && s.result.internal_notes.length ? h('p.small.muted', 'Notes internes : ' + s.result.internal_notes.join(' ; ')) : null,
      s.photos.length ? h('div.ph-grid', { style: { marginTop: '12px' } }, s.photos.map(p => h('div.ph', h('img', { src: '/media/private/' + p.file, alt: p.label, loading: 'lazy', onclick: () => zoom('/media/private/' + p.file) }), h('div.in', p.label)))) : null,
      h('div.row', { style: { marginTop: '12px' } }, h('span.badge' + ({ pending: '.info', approved: '.ok', declined: '.bad', none: '.neutral' }[s.validation]), { pending: 'À valider', approved: 'Validé', declined: 'Refusé', none: 'Sans validation requise' }[s.validation]), s.validation === 'pending' ? h('button.btn.sm', { onclick: () => A.go('#/diagnostics/dossiers') }, 'Examiner') : null))));
  }

  async function photos(d, c, reload) {
    const services = await A.loadServices();
    const byAppt = {};
    d.photos.forEach(p => { const k = p.appointment_id || `${p.service_id || 0}|${p.taken_on}`; (byAppt[k] ||= []).push(p); });
    const pairs = Object.values(byAppt).filter(g => g.some(x => x.kind === 'before') && g.some(x => x.kind === 'after'));
    const card = (p) => h('div.ph', h('img', { src: '/media/private/' + p.file, alt: p.kind, loading: 'lazy', onclick: () => zoom('/media/private/' + p.file) }),
      h('div.in', h('div.row.between', h('span.badge' + (p.kind === 'before' ? '.neutral' : '.ok'), p.kind === 'before' ? 'Avant' : 'Après'), h('button.x', { 'aria-label': 'Supprimer', onclick: async () => { if (await confirmBox('Supprimer cette photo ?', '', 'Supprimer', true)) { await del('/api/admin/photos/' + p.id); reload(); } } }, icon('trash'))),
        h('div.small', shortDate(p.taken_on) + (p.service ? ' · ' + p.service : '')), p.comment ? h('div.small.muted', p.comment) : null,
        h('label.check', { style: { fontSize: '.78rem', marginTop: '4px' }, title: c.consent_photos ? '' : 'Consentement de la cliente requis' }, h('input', { type: 'checkbox', checked: !!p.marketing_ok, disabled: !c.consent_photos, onchange: async (e) => { try { await put('/api/admin/photos/' + p.id, { marketing_ok: e.target.checked }); toast(e.target.checked ? 'Utilisable en marketing.' : 'Usage marketing retiré.', 'ok'); } catch (er) { e.target.checked = !e.target.checked; fail(er); } } }), h('span', 'Usage marketing'))));
    return h('div.stack',
      h('div.row.between', h('div', c.consent_photos ? h('span.badge.ok', 'Consentement photo marketing ✓') : h('span.badge.warn', 'Pas de consentement marketing : photos à usage interne uniquement')), h('button.btn', { onclick: () => photoModal(c, d, services, reload) }, icon('camera'), 'Ajouter une photo')),
      pairs.length ? h('div.card', h('h3', 'Avant / après'), h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' } }, pairs.map(g => { const b = g.find(x => x.kind === 'before'), a = g.find(x => x.kind === 'after'); return h('div', h('div.ba', h('figure', h('img', { src: '/media/private/' + b.file, alt: 'Avant' }), h('figcaption', 'Avant')), h('figure', h('img', { src: '/media/private/' + a.file, alt: 'Après' }), h('figcaption', 'Après'))), h('div.small.muted', `${shortDate(a.taken_on)}${a.service ? ' · ' + a.service : ''}${a.comment ? ' — ' + a.comment : ''}`)); }))) : null,
      d.photos.length ? h('div.card', h('h3', 'Toutes les photos'), h('div.ph-grid', d.photos.map(card))) : h('div.card', h('div.empty', icon('camera'), h('p', 'Aucune photo avant/après.'))));
  }
  function photoModal(c, d, services, reload) {
    let img = null;
    const kind = h('select', h('option', { value: 'before' }, 'Avant'), h('option', { value: 'after' }, 'Après'));
    const file = h('input', { type: 'file', accept: 'image/*', capture: 'environment', onchange: async (e) => { try { img = await fileToDataURL(e.target.files[0]); mount(prev, h('img', { src: img, alt: '', style: { maxHeight: '220px', borderRadius: '12px' } })); } catch (er) { fail(er); } } });
    const prev = h('div');
    const svc = h('select', h('option', { value: '' }, '— Prestation —'), services.map(s => h('option', { value: s.id }, s.name)));
    const appt = h('select', h('option', { value: '' }, '— Rendez-vous associé —'), d.appointments.filter(a => a.status === 'termine' || a.status === 'en_cours' || a.status === 'arrive').map(a => h('option', { value: a.id, 'data-svc': a.service_id }, `${shortDate(a.start)} · ${a.service_name}`)));
    appt.addEventListener('change', () => { const o = appt.selectedOptions[0]; if (o && o.dataset.svc) svc.value = o.dataset.svc; });
    const date = h('input', { type: 'date', value: UI.isoDate(new Date()) }), comment = h('textarea', { placeholder: 'Commentaire (produit utilisé, technique, ressenti…)' });
    const mk = h('input', { type: 'checkbox', disabled: !c.consent_photos });
    modal('Ajouter une photo', h('div.stack', h('div.form-grid', field('Type', kind), field('Date', date)), field('Photo', file), prev, field('Prestation', svc), field('Rendez-vous', appt), field('Commentaire', comment),
      h('label.check', mk, h('span', c.consent_photos ? 'Cette photo peut être utilisée à des fins marketing (la cliente y a consenti)' : 'Usage marketing impossible : la cliente n\'a pas donné son consentement (à renseigner dans sa fiche).'))),
    [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => { if (!img) { toast('Choisissez une photo.', 'err'); return false; } await post('/api/admin/photos', { client_id: c.id, kind: kind.value, image: img, service_id: svc.value || null, appointment_id: appt.value || null, taken_on: date.value, comment: comment.value, marketing_ok: mk.checked }); toast('Photo ajoutée.', 'ok'); reload(); } }]);
  }

  async function produits(d, c, reload) {
    const { products } = await get('/api/admin/products');
    return h('div.card', h('div.row.between', h('h3', 'Produits utilisés et achetés'), h('button.btn.soft.sm', { onclick: () => sellModal(c, products.filter(p => p.active && p.sellable), reload) }, icon('plus'), 'Vendre un produit')),
      d.products.length ? h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'Date'), h('th', 'Produit'), h('th', 'Type'), h('th.num', 'Qté'), h('th.num', 'Montant'))), h('tbody', d.products.map(p => h('tr', h('td', shortDate(p.created_at)), h('td', p.name), h('td', h('span.badge' + (p.kind === 'sold' ? '.gold' : '.neutral'), p.kind === 'sold' ? 'Acheté' : 'Utilisé en cabine')), h('td.num', +p.qty.toFixed(2)), h('td.num', p.kind === 'sold' ? eur(p.price) : '—')))))) : h('div.empty', 'Aucun produit pour le moment.'));
  }
  function sellModal(c, products, reload) {
    const p = h('select', products.map(x => h('option', { value: x.id }, `${x.name} — ${eur(x.sale_price)} (stock ${+x.stock.toFixed(1)})`))), q = h('input', { type: 'number', min: 1, value: 1, step: 1 });
    const m = h('select', ['carte', 'espèces', 'virement', 'chèque'].map(x => h('option', x)));
    modal('Vendre un produit', products.length ? h('div.stack', field('Produit', p), field('Quantité', q), field('Règlement', m)) : h('p', 'Aucun produit à la vente. Activez « vendable » sur une fiche produit.'), products.length ? [{ label: 'Annuler', cls: 'ghost' }, { label: 'Encaisser', onclick: async () => { await post('/api/admin/sales', { client_id: c.id, product_id: +p.value, qty: +q.value, method: m.value, paid: true }); toast('Vente enregistrée.', 'ok'); reload(); } }] : [{ label: 'Fermer' }]);
  }

  function finance(d) {
    const qlab = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', refused: 'Refusé', converted: 'Converti', expired: 'Expiré' }, ilab = { due: 'À régler', partial: 'Partiel', paid: 'Payée', void: 'Annulée' };
    return h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' } },
      h('div.card', h('h3', 'Devis'), d.quotes.length ? d.quotes.map(q => h('div.item-row', h('div.grow', h('b', q.number), h('div.small.muted', shortDate(q.created_at))), h('b', eur(q.total)), h('span.badge.info', qlab[q.effective_status]), h('a.btn.ghost.sm', { href: '#/devis/' + q.id }, 'Ouvrir'))) : h('div.empty', 'Aucun devis.')),
      h('div.card', h('h3', 'Factures'), d.invoices.length ? d.invoices.map(i => h('div.item-row', h('div.grow', h('b', i.number), h('div.small.muted', shortDate(i.created_at))), h('b', eur(i.total)), h('span.badge' + (i.status === 'paid' ? '.ok' : '.warn'), ilab[i.status]), h('a.btn.ghost.sm', { href: `/api/admin/invoices/${i.id}.pdf`, target: '_blank', rel: 'noopener' }, 'PDF'))) : h('div.empty', 'Aucune facture.')));
  }

  function notes(d, c, reload) {
    const t = h('textarea', { placeholder: 'Nouvelle note (technique, préférence, point d\'attention…)' });
    return h('div.stack', h('div.card', t, h('div.row', { style: { marginTop: '10px' } }, h('button.btn', { onclick: async () => { if (!t.value.trim()) return; await post(`/api/admin/clients/${c.id}/notes`, { text: t.value }); toast('Note ajoutée.', 'ok'); reload(); } }, 'Ajouter la note'))),
      d.notes.length ? h('div.card', d.notes.map(n => h('div.item-row', h('div.grow', h('div', { style: { whiteSpace: 'pre-wrap' } }, n.text), h('div.small.muted', shortDate(n.created_at))), h('button.x', { 'aria-label': 'Supprimer', onclick: async () => { if (await confirmBox('Supprimer la note ?', '', 'Supprimer', true)) { await del('/api/admin/client-notes/' + n.id); reload(); } } }, icon('trash'))))) : null);
  }
})();
