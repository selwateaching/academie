/* Espace professionnel — prestations, produits et stocks */
(function () {
  const { h, icon, mount, get, post, put, del, eur, shortDate, dur, cap, toast, fail, modal, confirmBox, field, fileToDataURL } = UI;
  const A = window.ADM;
  const num = (v) => (v === '' || v == null ? 0 : +v);

  // ============================================================== prestations
  A.register('prestations', async () => {
    const [{ services }, { diagnostics }, { products }] = await Promise.all([get('/api/admin/services'), get('/api/admin/diagnostics'), get('/api/admin/products')]);
    A.services = services;
    const cats = [...new Set(services.map(s => s.category))];
    return h('div', A.header('Prestations', 'Votre carte, vos tarifs et les produits consommés', h('button.btn', { onclick: () => edit(null, services, diagnostics, products) }, icon('plus'), 'Nouvelle prestation')),
      cats.map(cat => h('div.card', { style: { marginBottom: '20px' } }, h('h3', h('span', { style: { marginRight: '8px' } }, icon(UI.CAT_ICON[cat] || 'sparkle')), cat), h('div.table-wrap', h('table.t', h('thead', h('tr', ['Prestation', 'Prix', 'Durée', 'Acompte', 'Diagnostic', 'Produits', ''].map((x, i) => h('th', { class: i === 1 || i === 3 ? 'num' : '' }, x)))),
        h('tbody', services.filter(s => s.category === cat).map(s => h('tr.click', { onclick: () => edit(s, services, diagnostics, products), style: { opacity: s.active ? 1 : .55 } },
          h('td', h('b', s.name), !s.active ? h('span.badge.neutral', { style: { marginLeft: '6px' } }, 'Archivée') : !s.online_bookable ? h('span.badge.neutral', { style: { marginLeft: '6px' } }, 'Hors ligne') : null, h('div.small.muted', s.description.slice(0, 70) + (s.description.length > 70 ? '…' : ''))),
          h('td.num', eur(s.price)), h('td', dur(s.duration), (s.prep_time || s.cleanup_time) ? h('div.small.muted', `+${s.prep_time + s.cleanup_time} min prép./nettoyage`) : null), h('td.num', s.deposit ? eur(s.deposit) : '—'),
          h('td', s.diagnostic_id ? h('span.badge' + (s.diagnostic_required ? '.gold' : '.neutral'), s.diagnostic_required ? 'Obligatoire' : 'Conseillé') : '—'), h('td.small', s.products.map(p => p.name).join(', ') || '—'), h('td', icon('chevR'))))))))));
  });

  function edit(s, services, diagnostics, products) {
    const v = s || { name: '', category: '', description: '', price: 0, duration: 60, prep_time: 0, cleanup_time: 0, deposit: 0, conditions: '', photo: '', diagnostic_id: null, diagnostic_required: 0, active: 1, online_bookable: 1, products: [] };
    const f = {};
    const inp = (k, o = {}) => (f[k] = h('input', { value: v[k] ?? '', ...o }));
    const cats = [...new Set(services.map(x => x.category))];
    let photo = v.photo, prods = v.products.map(p => ({ product_id: p.product_id, qty: p.qty }));
    const prev = h('div');
    const drawPhoto = () => mount(prev, photo ? h('img', { src: photo, alt: '', style: { maxHeight: '120px', borderRadius: '12px' } }) : null);
    drawPhoto();
    const dsel = h('select', h('option', { value: '' }, 'Aucun diagnostic'), diagnostics.filter(d => d.active).map(d => h('option', { value: d.id, selected: v.diagnostic_id === d.id }, d.name)));
    const dreq = h('input', { type: 'checkbox', checked: !!v.diagnostic_required });
    const act = h('input', { type: 'checkbox', checked: !!v.active }), onl = h('input', { type: 'checkbox', checked: !!v.online_bookable });
    const pbox = h('div'), drawProds = () => mount(pbox, prods.map((p, i) => h('div.row', { style: { flexWrap: 'nowrap', marginBottom: '6px' } },
      h('select', { onchange: (e) => p.product_id = +e.target.value }, products.filter(x => x.active || x.id === p.product_id).map(x => h('option', { value: x.id, selected: x.id === p.product_id }, `${x.name} (${x.unit})`))),
      h('input', { type: 'number', min: 0.001, step: 'any', value: p.qty, style: { maxWidth: '100px' }, 'aria-label': 'Quantité', oninput: (e) => p.qty = +e.target.value }), h('button.x', { type: 'button', 'aria-label': 'Retirer', onclick: () => { prods.splice(i, 1); drawProds(); } }, icon('x')))),
      h('button.btn.soft.sm', { type: 'button', onclick: () => { if (!products.length) return toast('Ajoutez d\'abord des produits.', 'err'); prods.push({ product_id: products.find(x => x.active).id, qty: 1 }); drawProds(); } }, icon('plus'), 'Ajouter un produit consommé'));
    drawProds();
    const desc = h('textarea', v.description || ''), cond = h('textarea', { placeholder: 'Ex. : ne pas se laver les cheveux 48 h après…' }, v.conditions || '');
    const body = h('div.stack', h('div.form-grid', field('Nom *', inp('name')), field('Catégorie *', Object.assign(inp('category', { list: 'cats' }), {}), null)), h('datalist#cats', cats.map(c => h('option', { value: c }))),
      field('Description', desc), h('div.form-grid', field('Prix (€)', inp('price', { type: 'number', min: 0, step: '0.5' })), field('Durée (min)', inp('duration', { type: 'number', min: 5, step: 5 })), field('Préparation avant (min)', inp('prep_time', { type: 'number', min: 0, step: 5 })), field('Nettoyage après (min)', inp('cleanup_time', { type: 'number', min: 0, step: 5 })), field('Acompte (€)', inp('deposit', { type: 'number', min: 0, step: '0.5' }), '0 = aucun acompte')),
      field('Conditions & précautions', cond), h('div.form-grid', field('Diagnostic associé', dsel), h('label.check', { style: { alignSelf: 'end', paddingBottom: '12px' } }, dreq, h('span', 'Diagnostic obligatoire avant réservation'))),
      h('div', h('span.lbl.small', 'Produits consommés (déduits du stock à chaque prestation terminée)'), pbox),
      h('div', h('span.lbl.small', 'Photo'), h('input', { type: 'file', accept: 'image/*', onchange: async (e) => { try { const url = (await post('/api/admin/upload', { image: await fileToDataURL(e.target.files[0], 1200) })).url; photo = url; drawPhoto(); } catch (er) { fail(er); } } }), prev),
      h('div.row', h('label.check', act, h('span', 'Prestation active')), h('label.check', onl, h('span', 'Réservable en ligne'))));
    const buttons = [s ? { label: 'Supprimer', cls: 'danger', onclick: async (close) => { if (!(await confirmBox('Supprimer cette prestation ?', 'Si elle a déjà des rendez-vous, elle sera archivée.', 'Supprimer', true))) return false; const r = await del('/api/admin/services/' + s.id); toast(r.archived ? 'Prestation archivée.' : 'Prestation supprimée.', 'ok'); A.services = []; A.route(); } } : null,
      { label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => {
        if (!f.name.value.trim() || !f.category.value.trim()) { toast('Nom et catégorie obligatoires.', 'err'); return false; }
        const b = { name: f.name.value, category: f.category.value, description: desc.value, price: num(f.price.value), duration: num(f.duration.value), prep_time: num(f.prep_time.value), cleanup_time: num(f.cleanup_time.value), deposit: num(f.deposit.value), conditions: cond.value, photo, diagnostic_id: dsel.value ? +dsel.value : null, diagnostic_required: dreq.checked, active: act.checked, online_bookable: onl.checked, products: prods };
        if (s) await put('/api/admin/services/' + s.id, b); else await post('/api/admin/services', b);
        toast('Prestation enregistrée.', 'ok'); A.services = []; A.route();
      } }].filter(Boolean);
    modal(s ? s.name : 'Nouvelle prestation', body, buttons, { wide: true });
  }

  // ================================================================== produits
  A.register('produits', async () => {
    const { products, summary } = await get('/api/admin/products');
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    const box = h('div'), q = h('input', { type: 'search', placeholder: 'Rechercher un produit…', 'aria-label': 'Rechercher' }), cat = h('select', h('option', { value: '' }, 'Toutes catégories'), cats.map(c => h('option', c)));
    const draw = () => { const t = q.value.toLowerCase(); const list = products.filter(p => (!cat.value || p.category === cat.value) && (!t || (p.name + p.brand + p.sku).toLowerCase().includes(t)));
      mount(box, h('div.table-wrap', h('table.t', h('thead', h('tr', ['Produit', 'Catégorie', 'Prix d\'achat', 'Prix de vente', 'Fournisseur', 'Stock', ''].map((x, i) => h('th', { class: i === 2 || i === 3 || i === 5 ? 'num' : '' }, x)))),
        h('tbody', list.map(p => h('tr.click', { onclick: () => productModal(p), style: { opacity: p.active ? 1 : .5 } }, h('td', h('b', p.name), h('div.small.muted', [p.brand, p.sku].filter(Boolean).join(' · '))), h('td', p.category), h('td.num', eur(p.cost_price)), h('td.num', p.sellable ? eur(p.sale_price) : h('span.muted', 'Usage cabine')), h('td', p.supplier || '—'),
          h('td.num', h('span.badge' + (p.low ? '.bad' : '.ok'), `${+p.stock.toFixed(2)} ${p.unit}`)), h('td', icon('chevR'))))))), list.length ? null : h('div.empty', 'Aucun produit.')); };
    q.addEventListener('input', draw); cat.addEventListener('change', draw); draw();
    return h('div', A.header('Produits', 'Catalogue de vos produits professionnels et de revente', h('button.btn', { onclick: () => productModal(null) }, icon('plus'), 'Nouveau produit')),
      h('div.kpis', h('div.kpi', h('div.v', products.filter(p => p.active).length), h('div.l', 'Produits actifs')), h('div.kpi', h('div.v', products.filter(p => p.active && p.sellable).length), h('div.l', 'En vente aux clientes')), h('div.kpi', h('div.v', eur(summary.value, 0)), h('div.l', 'Valeur du stock (prix d\'achat)'))),
      h('div.card', h('div.form-grid', { style: { marginBottom: '14px' } }, q, cat), box));
  });

  function productModal(p) {
    const v = p || { name: '', brand: '', category: '', sku: '', unit: 'unité', cost_price: 0, sale_price: 0, sellable: 0, stock: 0, min_stock: 0, supplier: '', expiry_date: '', location: '', notes: '', active: 1 };
    const f = {}; const inp = (k, o = {}) => (f[k] = h('input', { value: v[k] ?? '', ...o }));
    const sellable = h('input', { type: 'checkbox', checked: !!v.sellable }), active = h('input', { type: 'checkbox', checked: !!v.active });
    const body = h('div.stack', h('div.form-grid', field('Nom *', inp('name')), field('Marque', inp('brand')), field('Catégorie', inp('category')), field('Référence (SKU)', inp('sku')), field('Unité', inp('unit', { placeholder: 'L, pot, flacon…' })), field('Fournisseur', inp('supplier')),
      field('Prix d\'achat (€)', inp('cost_price', { type: 'number', min: 0, step: '0.01' })), field('Prix de vente (€)', inp('sale_price', { type: 'number', min: 0, step: '0.01' })), field('Seuil d\'alerte', inp('min_stock', { type: 'number', min: 0, step: 'any' })), field('Péremption', inp('expiry_date', { type: 'date' })), field('Emplacement', inp('location')),
      p ? null : field('Stock initial', inp('stock', { type: 'number', min: 0, step: 'any' }))),
      field('Notes', h('textarea', { oninput: (e) => v.notes = e.target.value }, v.notes || '')), h('div.row', h('label.check', sellable, h('span', 'Vendu aux clientes')), h('label.check', active, h('span', 'Produit actif'))),
      p ? h('p.small.muted', 'Le stock se modifie via la page Stocks (réception, perte, inventaire).') : null);
    modal(p ? p.name : 'Nouveau produit', body, [p ? { label: 'Archiver', cls: 'danger', onclick: async () => { if (!(await confirmBox('Archiver ce produit ?', 'Il n\'apparaîtra plus dans les listes mais son historique est conservé.', 'Archiver', true))) return false; await del('/api/admin/products/' + p.id); toast('Produit archivé.'); A.route(); } } : null, { label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => {
      if (!f.name.value.trim()) { toast('Nom obligatoire.', 'err'); return false; }
      const b = { name: f.name.value, brand: f.brand.value, category: f.category.value, sku: f.sku.value, unit: f.unit.value, supplier: f.supplier.value, cost_price: num(f.cost_price.value), sale_price: num(f.sale_price.value), min_stock: num(f.min_stock.value), expiry_date: f.expiry_date.value, location: f.location.value, notes: v.notes, sellable: sellable.checked, active: active.checked };
      if (!p) b.stock = num(f.stock.value);
      if (p) await put('/api/admin/products/' + p.id, b); else await post('/api/admin/products', b);
      toast('Produit enregistré.', 'ok'); A.route();
    } }].filter(Boolean), { wide: true });
  }

  // =================================================================== stocks
  A.register('stocks', async () => {
    const { products, summary } = await get('/api/admin/products');
    const act = products.filter(p => p.active), low = act.filter(p => p.low), exp = act.filter(p => p.expiring);
    const meter = (p) => { const ratio = p.min_stock ? Math.min(1, p.stock / (p.min_stock * 3)) : 1; return h('div.meter' + (p.low ? '.low' : ratio < .5 ? '.mid' : ''), h('i', { style: { width: Math.max(4, ratio * 100) + '%' } })); };
    const row = (p) => h('tr', h('td', h('b', p.name), h('div.small.muted', [p.brand, p.location].filter(Boolean).join(' · '))), h('td', { style: { minWidth: '130px' } }, meter(p)), h('td.num', h('b', +p.stock.toFixed(2)), ' ', h('span.small.muted', p.unit)), h('td.num', p.min_stock), h('td', p.expired ? h('span.badge.bad', 'Périmé') : p.expiring ? h('span.badge.warn', shortDate(p.expiry_date)) : p.expiry_date ? shortDate(p.expiry_date) : '—'),
      h('td', p.days_left != null ? (p.days_left < 15 ? h('span.badge.warn', `≈ ${p.days_left} j`) : `≈ ${p.days_left} j`) : h('span.muted', '—')),
      h('td', h('div.row', { style: { flexWrap: 'nowrap', gap: '6px' } }, h('button.btn.soft.sm', { onclick: () => moveModal(p, 'reception') }, 'Entrée'), h('button.btn.ghost.sm', { onclick: () => moveModal(p, 'loss') }, 'Sortie'), h('button.btn.ghost.sm', { title: 'Historique', onclick: () => history(p) }, icon('clock')))));
    return h('div', A.header('Stocks', 'Niveaux, alertes, réceptions et inventaires', h('button.btn.ghost', { onclick: () => reorder(low) }, icon('file'), 'Liste de réapprovisionnement'), h('button.btn', { onclick: () => inventory(act) }, icon('check'), 'Faire un inventaire')),
      h('div.kpis', h('div.kpi' + (low.length ? '.alert' : ''), h('span.ic', icon('alert')), h('div.v', low.length), h('div.l', 'Sous le seuil d\'alerte')), h('div.kpi', h('span.ic', icon('clock')), h('div.v', exp.length), h('div.l', 'Péremption sous 45 jours')), h('div.kpi', h('span.ic', icon('box')), h('div.v', eur(summary.value, 0)), h('div.l', 'Valeur du stock'))),
      low.length ? h('div.card', { style: { marginBottom: '20px' } }, h('h3', 'À réapprovisionner'), h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'Produit'), h('th', 'Niveau'), h('th.num', 'Stock'), h('th.num', 'Seuil'), h('th', 'Péremption'), h('th', 'Autonomie'), h('th'))), h('tbody', low.map(row))))) : null,
      h('div.card', h('h3', 'Tous les produits'), h('p.small.muted', 'L\'autonomie est estimée d\'après la consommation des 60 derniers jours. Le stock est décrémenté automatiquement quand une prestation est marquée « Terminée ».'), h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'Produit'), h('th', 'Niveau'), h('th.num', 'Stock'), h('th.num', 'Seuil'), h('th', 'Péremption'), h('th', 'Autonomie'), h('th'))), h('tbody', act.map(row))))));
  });

  const REASON = { reception: 'Réception de marchandise', loss: 'Perte / casse / péremption', return: 'Retour', inventory: 'Inventaire', usage: 'Utilisation hors prestation' };
  function moveModal(p, reason) {
    const q = h('input', { type: 'number', min: 0, step: 'any', value: '' }), note = h('input', { placeholder: 'Note (n° de facture, motif…)' });
    const cost = h('input', { type: 'number', min: 0, step: '0.01', value: p.cost_price }), exp = h('input', { type: 'date', value: p.expiry_date || '' });
    modal(`${REASON[reason]} — ${p.name}`, h('div.stack', h('p.small.muted', `Stock actuel : ${+p.stock.toFixed(2)} ${p.unit}`), field(`Quantité (${p.unit})`, q), reason === 'reception' ? h('div.form-grid', field('Prix d\'achat unitaire (€)', cost), field('Nouvelle péremption', exp)) : null, field('Note', note)),
      [{ label: 'Annuler', cls: 'ghost' }, { label: 'Valider', onclick: async () => { const r = await post(`/api/admin/products/${p.id}/move`, { reason, qty: +q.value, note: note.value, unit_cost: reason === 'reception' ? +cost.value : undefined, expiry_date: reason === 'reception' ? exp.value : undefined }); toast(`Nouveau stock : ${+r.stock.toFixed(2)} ${p.unit}`, 'ok'); A.route(); } }]);
  }
  async function history(p) {
    const { movements } = await get(`/api/admin/products/${p.id}/movements`);
    modal(`Historique — ${p.name}`, h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'Date'), h('th', 'Motif'), h('th.num', 'Quantité'), h('th', 'Note'))), h('tbody', movements.map(m => h('tr', h('td', shortDate(m.created_at)), h('td', { reception: 'Réception', usage: 'Prestation', sale: 'Vente', inventory: 'Inventaire', loss: 'Perte', return: 'Retour' }[m.reason] || m.reason), h('td.num', { style: { color: m.delta > 0 ? 'var(--ok)' : 'var(--bad)' } }, (m.delta > 0 ? '+' : '') + +m.delta.toFixed(3)), h('td.small.muted', m.note || m.ref || '')))))), [{ label: 'Fermer' }], { wide: true });
  }
  function inventory(products) {
    const inputs = {};
    modal('Inventaire', h('div.stack', h('p.small.muted', 'Saisissez les quantités réellement comptées. Seuls les écarts sont enregistrés (mouvement « inventaire »).'),
      h('div.table-wrap', h('table.t', h('thead', h('tr', h('th', 'Produit'), h('th.num', 'Théorique'), h('th', 'Compté'))), h('tbody', products.map(p => h('tr', h('td', p.name), h('td.num', `${+p.stock.toFixed(2)} ${p.unit}`), h('td', (inputs[p.id] = h('input', { type: 'number', min: 0, step: 'any', placeholder: '—', style: { maxWidth: '110px' } }))))))))),
    [{ label: 'Annuler', cls: 'ghost' }, { label: 'Appliquer les écarts', onclick: async () => { let n = 0; for (const p of products) { const v = inputs[p.id].value; if (v !== '' && Math.abs(+v - p.stock) > 0.0001) { await post(`/api/admin/products/${p.id}/move`, { reason: 'inventory', qty: +v, note: 'Inventaire' }); n++; } } toast(`${n} écart(s) enregistré(s).`, 'ok'); A.route(); } }], { wide: true });
  }
  function reorder(low) {
    const by = {}; low.forEach(p => (by[p.supplier || 'Fournisseur non renseigné'] ||= []).push(p));
    const text = Object.entries(by).map(([s, ps]) => `${s}\n` + ps.map(p => `  - ${p.name} : ${Math.max(1, Math.ceil(p.min_stock * 2 - p.stock))} ${p.unit}`).join('\n')).join('\n\n');
    modal('Liste de réapprovisionnement', low.length ? h('div.stack', h('p.small.muted', 'Quantités suggérées pour revenir à 2 × le seuil d\'alerte.'), h('textarea', { readonly: true, style: { minHeight: '260px', fontFamily: 'monospace' } }, text)) : h('p', 'Rien à commander : tous les stocks sont au-dessus du seuil.'),
      low.length ? [{ label: 'Copier', onclick: async () => { try { await navigator.clipboard.writeText(text); toast('Copié.', 'ok'); } catch (e) { toast('Copie impossible : sélectionnez le texte.', 'err'); } return false; }, keep: true }, { label: 'Fermer', cls: 'ghost' }] : [{ label: 'Fermer' }], { wide: true });
  }
})();
