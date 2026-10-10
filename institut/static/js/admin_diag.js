/* Espace professionnel — diagnostics : questionnaires, règles configurables, simulateur, dossiers reçus */
(function () {
  const { h, icon, mount, get, post, put, del, eur, parse, shortDate, hm, cap, toast, fail, modal, confirmBox, field } = UI;
  const A = window.ADM;
  const VERDICT = { go: 'Prestation possible', caution: 'Possible avec précautions', prepare: 'Préparation recommandée', not_now: 'Déconseillée pour le moment' };
  const QTYPES = { single: 'Choix unique', yesno: 'Oui / Non', scale: 'Échelle 1 à 5', multi: 'Choix multiples', text: 'Texte libre' };
  const slug = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  const YN = [{ value: 'yes', label: 'Oui' }, { value: 'no', label: 'Non' }];
  const SCALE = [['1', '1 — pas du tout'], ['2', '2'], ['3', '3 — moyennement'], ['4', '4'], ['5', '5 — extrêmement']].map(([value, label]) => ({ value, label }));
  const vchip = (v) => h('span.vchip.' + v, VERDICT[v]);

  // ============================================================ liste + dossiers
  A.register('diagnostics', async (args) => {
    if (args[0] === 'dossiers') return dossiers();
    if (args[0]) return editor(+args[0], args[1] || 'questions');
    const [{ diagnostics }, { submissions }] = await Promise.all([get('/api/admin/diagnostics'), get('/api/admin/submissions?validation=pending')]);
    return h('div', A.header('Diagnostics', 'Questionnaires intelligents et règles de recommandation', h('a.btn.ghost', { href: '#/diagnostics/dossiers' }, icon('file'), 'Tous les dossiers reçus'), h('button.btn', { onclick: () => createModal(diagnostics) }, icon('plus'), 'Nouveau diagnostic')),
      submissions.length ? h('div.card', { style: { marginBottom: '20px' } }, h('h3', `${submissions.length} dossier(s) à examiner`), submissions.slice(0, 4).map(s => submissionCard(s, true))
        , submissions.length > 4 ? h('a', { href: '#/diagnostics/dossiers' }, 'Voir tous →') : null) : null,
      h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' } }, diagnostics.map(d => h('a.card', { href: '#/diagnostics/' + d.id, style: { color: 'inherit', textDecoration: 'none', opacity: d.active ? 1 : .6 } },
        h('div.row.between', h('span.badge.gold', d.category || 'Général'), d.active ? null : h('span.badge.neutral', 'Archivé')), h('h3', { style: { marginTop: '10px' } }, d.name), h('p.small.muted', `${d.questions} questions · ${d.rules} règles`), h('span.btn.ghost.sm', 'Configurer')))));
  });

  function createModal(list) {
    const n = h('input', { placeholder: 'Ex. : Diagnostic soin visage', required: true }), c = h('input', { placeholder: 'Catégorie (Cheveux, Ongles…)' });
    const dup = h('select', h('option', { value: '' }, 'Diagnostic vide'), list.map(d => h('option', { value: d.id }, 'Dupliquer : ' + d.name)));
    modal('Nouveau diagnostic', h('div.stack', field('Nom', n), field('Catégorie', c), field('Point de départ', dup), h('p.small.muted', 'Vous pourrez ensuite ajouter vos questions, vos règles de recommandation, puis l\'associer à une prestation (menu Prestations).')),
      [{ label: 'Annuler', cls: 'ghost' }, { label: 'Créer', onclick: async () => { if (!n.value.trim()) { toast('Donnez un nom.', 'err'); return false; } const r = await post('/api/admin/diagnostics', { name: n.value, category: c.value, duplicate_of: dup.value || null }); A.go('#/diagnostics/' + r.id); } }]);
  }

  async function dossiers() {
    const { submissions } = await get('/api/admin/submissions');
    return h('div', h('a.small', { href: '#/diagnostics' }, '← Diagnostics'), A.header('Dossiers de diagnostic', 'Réponses et photos des clientes'), h('div.stack', submissions.length ? submissions.map(s => h('div.card', submissionCard(s))) : h('div.card', h('div.empty', 'Aucun dossier.'))));
  }

  function submissionCard(s, compact) {
    const r = s.result || {};
    const box = h('div', { style: compact ? { padding: '14px 0', borderBottom: '1px solid var(--line)' } : {} },
      h('div.row.between', h('div.row', { style: { flexWrap: 'nowrap' } }, h('div.avatar', (s.first_name[0] || '?') + (s.last_name[0] || '')), h('div', h('a', { href: '#/clientes/' + s.client_id + '/diagnostics' }, h('b', `${s.first_name} ${s.last_name}`)), h('div.small.muted', `${s.diagnostic} · ${shortDate(s.created_at)}${s.service ? ' · ' + s.service : ''}`))),
        h('div.row', vchip(r.verdict || 'go'), s.validation === 'pending' ? h('span.badge.info', 'À valider') : s.validation === 'approved' ? h('span.badge.ok', 'Validé') : s.validation === 'declined' ? h('span.badge.bad', 'Refusé') : null)),
      (r.alerts || []).map(a => h('div.notice.warn', { style: { marginTop: '10px' } }, icon('alert'), a)),
      r.steps && r.steps.length ? h('p.small', { style: { marginTop: '10px' } }, h('b', 'Recommandation envoyée : '), r.steps.join(' → ')) : null,
      r.internal_notes && r.internal_notes.length ? h('p.small.muted', 'Notes internes : ' + r.internal_notes.join(' ; ')) : null,
      s.photos.length ? h('div.ph-grid', { style: { marginTop: '10px' } }, s.photos.map(p => h('div.ph', h('img', { src: '/media/private/' + p.file, alt: p.label, loading: 'lazy', onclick: () => modal(p.label, h('img', { src: '/media/private/' + p.file, alt: p.label, style: { width: '100%', borderRadius: '12px' } }), [{ label: 'Fermer' }], { wide: true }) }), h('div.in', p.label)))) : null);
    if (!compact) box.appendChild(h('details', { style: { marginTop: '12px' } }, h('summary.small', 'Voir toutes les réponses'), h('table.t', h('tbody', s.qa.map(x => h('tr', h('td', { style: { width: '55%' } }, x.q), h('td', h('b', x.a))))))));
    if (s.validation === 'pending') {
      box.appendChild(h('div.row', { style: { marginTop: '12px' } }, h('button.btn.sm', { onclick: () => review(s, 'approved') }, icon('check'), 'Valider'), h('button.btn.danger.sm', { onclick: () => review(s, 'declined') }, 'Refuser'), compact ? h('a.btn.ghost.sm', { href: '#/diagnostics/dossiers' }, 'Détails') : null));
    }
    if (s.pro_comment) box.appendChild(h('p.small.muted', 'Votre commentaire : ' + s.pro_comment));
    return box;
  }
  function review(s, decision) {
    const c = h('textarea', { placeholder: 'Commentaire (facultatif)' });
    modal(decision === 'approved' ? 'Valider le dossier' : 'Refuser le dossier', h('div.stack', h('p', decision === 'approved' ? 'Les rendez-vous « demande » liés à ce dossier seront confirmés (ou mis en attente d\'acompte).' : 'Les rendez-vous « demande » liés à ce dossier seront annulés.'), field('Commentaire', c)),
      [{ label: 'Annuler', cls: 'ghost' }, { label: decision === 'approved' ? 'Valider' : 'Refuser', cls: decision === 'approved' ? '' : 'danger', onclick: async () => { await post(`/api/admin/submissions/${s.id}/review`, { validation: decision, comment: c.value }); toast('Décision enregistrée.', 'ok'); A.route(); } }]);
  }

  // =================================================================== éditeur
  async function editor(id, tab) {
    const data = await get('/api/admin/diagnostics/' + id);
    const meta = await get('/api/admin/diagnostics');
    const D = data.diagnostic, rules = data.rules, services = data.services;
    const save = async (patch) => { await put('/api/admin/diagnostics/' + id, patch); toast('Enregistré.', 'ok'); A.route(); };
    const tabs = [['questions', `Questions (${D.questions.length})`], ['regles', `Règles (${rules.length})`], ['textes', 'Photos & textes'], ['simulateur', 'Simulateur']];
    const body = { questions: () => questionsTab(D, save), regles: () => rulesTab(D, rules, services, meta, id), textes: () => textsTab(D, save, meta), simulateur: () => simulatorTab(D, id) }[tab]();
    return h('div', h('a.small', { href: '#/diagnostics' }, '← Diagnostics'),
      A.header(D.name, `${D.category || 'Général'} · ${D.active ? 'Actif' : 'Archivé'}`,
        h('button.btn.ghost.sm', { onclick: () => { const n = h('input', { value: D.name }), c = h('input', { value: D.category || '' }); modal('Renommer', h('div.stack', field('Nom', n), field('Catégorie', c)), [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: () => save({ name: n.value, category: c.value }) }]); } }, icon('edit'), 'Renommer'),
        h('button.btn.ghost.sm', { onclick: () => save({ active: D.active ? 0 : 1 }) }, D.active ? 'Archiver' : 'Réactiver'),
        h('button.btn.danger.sm', { onclick: async () => { if (await confirmBox('Supprimer ce diagnostic ?', 'S\'il a déjà été utilisé par des clientes, il sera archivé.', 'Supprimer', true)) { await del('/api/admin/diagnostics/' + id); A.go('#/diagnostics'); } } }, icon('trash'))),
      h('div.tabs', tabs.map(([k, l]) => h('button', { class: k === tab ? 'on' : '', onclick: () => A.go(`#/diagnostics/${id}/${k}`) }, l))), body);
  }

  // -------------------------------------------------------------- questions
  function questionsTab(D, save) {
    const qs = D.questions.map(q => ({ ...q }));
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= qs.length) return; [qs[i], qs[j]] = [qs[j], qs[i]]; save({ questions: qs }); };
    return h('div', h('div.notice.info', { style: { marginBottom: '14px' } }, icon('info'), 'Une question peut n\'apparaître que selon une réponse précédente (« questions intelligentes »), par exemple « Quel type de lissage ? » seulement si la cliente a déjà fait un lissage.'),
      qs.map((q, i) => h('div.qcard', h('span.handle', icon('drag')), h('div.grow', h('b', q.label), h('div.small.muted', `${QTYPES[q.type]}${q.required ? ' · obligatoire' : ' · facultatif'}${q.show_if ? ' · conditionnelle' : ''} · id : ${q.id}`)),
        h('button.x', { 'aria-label': 'Monter', disabled: i === 0, onclick: () => move(i, -1) }, '↑'), h('button.x', { 'aria-label': 'Descendre', disabled: i === qs.length - 1, onclick: () => move(i, 1) }, '↓'),
        h('button.btn.ghost.sm', { onclick: () => questionModal(qs, i, save) }, icon('edit'), 'Modifier'),
        h('button.x', { 'aria-label': 'Supprimer', onclick: async () => { if (await confirmBox('Supprimer cette question ?', 'Les règles qui l\'utilisent devront être mises à jour.', 'Supprimer', true)) { qs.splice(i, 1); save({ questions: qs }); } } }, icon('trash')))),
      h('button.btn', { onclick: () => questionModal(qs, -1, save) }, icon('plus'), 'Ajouter une question'));
  }

  function questionModal(qs, idx, save) {
    const isNew = idx < 0, q = isNew ? { id: '', label: '', type: 'single', required: true, options: [{ value: '', label: '' }, { value: '', label: '' }] } : JSON.parse(JSON.stringify(qs[idx]));
    const label = h('input', { value: q.label, placeholder: 'Ex. : Vos cheveux sont-ils cassants ?' });
    const type = h('select', Object.entries(QTYPES).map(([k, v]) => h('option', { value: k, selected: q.type === k }, v)));
    const req = h('input', { type: 'checkbox', checked: !!q.required }), help = h('input', { value: q.help || '', placeholder: 'Aide affichée sous la question (facultatif)' });
    const optBox = h('div'); let opts = (q.options || []).map(o => ({ ...o }));
    const drawOpts = () => {
      const t = type.value;
      if (t === 'text') return mount(optBox, h('p.small.muted', 'Réponse libre : aucune option à définir.'));
      if (t === 'yesno') { opts = YN.map(o => ({ ...o })); return mount(optBox, h('p.small.muted', 'Réponses : Oui / Non.')); }
      if (t === 'scale') { opts = SCALE.map(o => ({ ...o })); return mount(optBox, h('p.small.muted', 'Échelle de 1 à 5 (1 = pas du tout, 5 = extrêmement).')); }
      mount(optBox, h('span.lbl.small', 'Réponses possibles'), opts.map((o, i) => h('div.row', { style: { flexWrap: 'nowrap', marginBottom: '6px' } }, h('input', { value: o.label, placeholder: 'Libellé affiché', oninput: (e) => { o.label = e.target.value; if (!o._manual) o.value = slug(e.target.value); } }), h('button.x', { type: 'button', 'aria-label': 'Retirer', onclick: () => { opts.splice(i, 1); drawOpts(); } }, icon('x')))),
        h('button.btn.soft.sm', { type: 'button', onclick: () => { opts.push({ value: '', label: '' }); drawOpts(); } }, icon('plus'), 'Ajouter une réponse'));
    };
    type.addEventListener('change', () => { if (type.value === 'yesno') opts = YN.map(o => ({ ...o })); else if (type.value === 'scale') opts = SCALE.map(o => ({ ...o })); else if (!opts.length || ['yes'].includes(opts[0].value)) opts = [{ value: '', label: '' }, { value: '', label: '' }]; drawOpts(); });
    drawOpts();
    // condition d'affichage
    const earlier = qs.slice(0, isNew ? qs.length : idx).filter(x => x.type !== 'text');
    const cond = q.show_if && q.show_if.q ? q.show_if : null;
    const sq = h('select', h('option', { value: '' }, 'Toujours afficher'), earlier.map(x => h('option', { value: x.id, selected: cond && cond.q === x.id }, 'Si « ' + x.label.slice(0, 50) + ' »')));
    const sv = h('select');
    const drawSv = () => { const t = earlier.find(x => x.id === sq.value); mount(sv, t ? t.options.map(o => h('option', { value: o.value, selected: cond && cond.v === o.value || (cond && Array.isArray(cond.v) && cond.v[0] === o.value) }, '= ' + o.label)) : []); sv.style.display = t ? '' : 'none'; };
    sq.addEventListener('change', drawSv); drawSv();
    modal(isNew ? 'Nouvelle question' : 'Modifier la question', h('div.stack', field('Intitulé', label), h('div.form-grid', field('Type de réponse', type), h('label.check', { style: { alignSelf: 'end', paddingBottom: '12px' } }, req, h('span', 'Réponse obligatoire'))), field('Aide', help), optBox,
      h('hr.soft'), h('div', h('span.lbl.small', 'Afficher cette question…'), h('div.form-grid', sq, sv))),
      [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => {
        if (!label.value.trim()) { toast('Saisissez l\'intitulé.', 'err'); return false; }
        const cleaned = (type.value === 'text' ? [] : opts).filter(o => o.label.trim()).map(o => ({ value: o.value || slug(o.label), label: o.label.trim() }));
        if (type.value !== 'text' && cleaned.length < 2 && type.value !== 'yesno') { toast('Ajoutez au moins deux réponses.', 'err'); return false; }
        const out = { id: isNew ? (slug(label.value).slice(0, 28) || 'q') : q.id, label: label.value.trim(), type: type.value, required: req.checked };
        if (help.value.trim()) out.help = help.value.trim();
        if (type.value !== 'text') out.options = cleaned;
        if (sq.value) out.show_if = { q: sq.value, op: 'eq', v: sv.value };
        if (isNew) { let n = out.id, k = 2; while (qs.some(x => x.id === n)) n = out.id + '_' + k++; out.id = n; qs.push(out); } else qs[idx] = out;
        await save({ questions: qs });
      } }], { wide: true });
  }

  // ------------------------------------------------------------------ règles
  function ruleSummary(D, r, services) {
    const qmap = Object.fromEntries(D.questions.map(q => [q.id, q]));
    const val = (qid, v) => { const q = qmap[qid]; const one = (x) => (q && q.options ? (q.options.find(o => String(o.value) === String(x)) || {}).label : null) || x; return Array.isArray(v) ? v.map(one).join(' / ') : one(v); };
    const lab = (c) => (qmap[c.q] || { label: c.q }).label.replace(/\s*\?\s*$/, '');
    const one = (c) => {
      const L = lab(c), V = val(c.q, c.v), list = [].concat(c.v == null ? [] : c.v);
      switch (c.op) {
        case 'eq': return `${L} : ${V}`;
        case 'neq': return `${L} : autre que ${V}`;
        case 'in': case 'has_any': return `${L} : ${list.map(x => val(c.q, x)).join(' ou ')}`;
        case 'not_in': return `${L} : ni ${list.map(x => val(c.q, x)).join(' ni ')}`;
        case 'has': return `${L} inclut « ${V} »`;
        case 'not_has': return `${L} n'inclut pas « ${V} »`;
        case 'gte': return `${L} ≥ ${V}`;
        case 'lte': return `${L} ≤ ${V}`;
        case 'answered': return `${L} renseigné`;
      }
      return L;
    };
    const txt = (c) => c.all ? c.all.map(x => (x.all || x.any) ? '(' + txt(x) + ')' : txt(x)).join(' ET ') : c.any ? c.any.map(x => (x.all || x.any) ? '(' + txt(x) + ')' : txt(x)).join(' OU ') : one(c);
    const a = r.action, parts = [];
    if (a.verdict) parts.push(VERDICT[a.verdict]);
    if (a.recommend && a.recommend.length) parts.push('proposer : ' + a.recommend.map(s => (services.find(x => x.slug === s) || { name: s }).name).join(', '));
    if (a.validation) parts.push('validation professionnelle requise');
    if (a.alert) parts.push('alerte affichée');
    return [Object.keys(r.condition || {}).length ? txt(r.condition) : 'toujours', parts.join(' · ') || '—'];
  }

  function rulesTab(D, rules, services, meta, id) {
    return h('div', h('div.notice.info', { style: { marginBottom: '14px' } }, icon('info'), 'Les règles décident du résultat présenté à la cliente. Le verdict final est le plus sévère parmi les règles déclenchées. Exemples : « SI cheveux décolorés ALORS proposer un soin réparateur », « SI cliente enceinte ALORS alerte + validation professionnelle ».'),
      rules.map(r => { const [cond, act] = ruleSummary(D, r, services); return h('div.rule-card' + (r.active ? '' : '.off'),
        h('div.row.between', h('div.row', h('b', r.name), h('span.badge.neutral', 'priorité ' + r.priority), r.action.verdict ? vchip(r.action.verdict) : null, r.action.validation ? h('span.badge.info', 'Validation pro') : null), h('div.row', h('button.btn.ghost.sm', { onclick: () => ruleModal(D, r, services, meta, id) }, icon('edit'), 'Modifier'), h('button.x', { 'aria-label': 'Supprimer', onclick: async () => { if (await confirmBox('Supprimer cette règle ?', r.name, 'Supprimer', true)) { await del('/api/admin/rules/' + r.id); A.route(); } } }, icon('trash')))),
        h('div.if-then', h('b', 'Si'), h('span', cond), h('b', 'Alors'), h('span', act))); }),
      h('button.btn', { onclick: () => ruleModal(D, null, services, meta, id) }, icon('plus'), 'Ajouter une règle'));
  }

  function ruleModal(D, rule, services, meta, did) {
    const r = rule ? JSON.parse(JSON.stringify(rule)) : { name: '', priority: 100, active: 1, condition: { all: [] }, action: {} };
    const qs = D.questions.filter(q => q.type !== 'text');
    let root = r.condition && (r.condition.all || r.condition.any) ? r.condition : (r.condition && r.condition.q ? { all: [r.condition] } : { all: [] });
    const name = h('input', { value: r.name, placeholder: 'Ex. : Cheveux décolorés → soin réparateur' }), prio = h('input', { type: 'number', value: r.priority, min: 1, max: 999 }), active = h('input', { type: 'checkbox', checked: !!r.active });
    const condBox = h('div');
    const OPS = meta.operators;
    function groupUI(g, depth, onRemove) {
      const mode = g.all ? 'all' : 'any', items = g[mode];
      const wrap = h('div', { style: depth ? { border: '1px dashed var(--rose-300)', borderRadius: '14px', padding: '10px', margin: '8px 0', background: 'var(--rose-50)' } : {} });
      const sel = h('select', { style: { width: 'auto' }, onchange: (e) => { const arr = g[mode]; delete g[mode]; g[e.target.value] = arr; draw(); } }, h('option', { value: 'all', selected: mode === 'all' }, 'TOUTES les conditions suivantes'), h('option', { value: 'any', selected: mode === 'any' }, 'L\'UNE des conditions suivantes'));
      wrap.appendChild(h('div.row.between', { style: { marginBottom: '8px' } }, h('div.row', h('span.small.muted', 'Si'), sel), onRemove ? h('button.x', { type: 'button', onclick: onRemove, 'aria-label': 'Supprimer le groupe' }, icon('trash')) : null));
      items.forEach((c, i) => { if (c.all || c.any) wrap.appendChild(groupUI(c, depth + 1, () => { items.splice(i, 1); draw(); })); else wrap.appendChild(condRow(c, () => { items.splice(i, 1); draw(); })); });
      wrap.appendChild(h('div.row', h('button.btn.soft.sm', { type: 'button', onclick: () => { items.push({ q: qs[0].id, op: 'eq', v: (qs[0].options[0] || {}).value }); draw(); } }, icon('plus'), 'Condition'), depth < 2 ? h('button.btn.ghost.sm', { type: 'button', onclick: () => { items.push({ any: [{ q: qs[0].id, op: 'eq', v: (qs[0].options[0] || {}).value }] }); draw(); } }, 'Groupe (OU / ET)') : null));
      return wrap;
    }
    function condRow(c, onRemove) {
      const q = qs.find(x => x.id === c.q) || qs[0];
      const qsel = h('select', { 'aria-label': 'Question', onchange: (e) => { c.q = e.target.value; const nq = qs.find(x => x.id === c.q); c.op = nq.type === 'multi' ? 'has' : (nq.type === 'scale' ? 'gte' : 'eq'); c.v = (nq.options[0] || {}).value; draw(); } }, qs.map(x => h('option', { value: x.id, selected: x.id === c.q }, x.label.slice(0, 60))));
      const allowed = q.type === 'multi' ? ['has', 'has_any', 'not_has', 'answered'] : q.type === 'scale' ? ['gte', 'lte', 'eq', 'answered'] : ['eq', 'neq', 'in', 'not_in', 'answered'];
      const osel = h('select', { 'aria-label': 'Opérateur', onchange: (e) => { c.op = e.target.value; if (['in', 'not_in', 'has_any'].includes(c.op)) c.v = [].concat(c.v || []); else if (Array.isArray(c.v)) c.v = c.v[0]; draw(); } }, allowed.map(o => h('option', { value: o, selected: c.op === o }, OPS[o])));
      if (!allowed.includes(c.op)) c.op = allowed[0];
      let vin = h('span');
      if (c.op === 'answered') c.v = undefined;
      else if (['in', 'not_in', 'has_any'].includes(c.op)) { const cur = new Set([].concat(c.v || []).map(String)); vin = h('div', q.options.map(o => h('label.check', { style: { fontSize: '.82rem' } }, h('input', { type: 'checkbox', checked: cur.has(String(o.value)), onchange: (e) => { e.target.checked ? cur.add(String(o.value)) : cur.delete(String(o.value)); c.v = [...cur]; } }), h('span', o.label)))); c.v = [...cur]; }
      else vin = h('select', { 'aria-label': 'Valeur', onchange: (e) => { c.v = e.target.value; } }, q.options.map(o => h('option', { value: o.value, selected: String(c.v) === String(o.value) }, o.label)));
      if (!['in', 'not_in', 'has_any', 'answered'].includes(c.op) && (c.v === undefined || !q.options.some(o => String(o.value) === String(c.v)))) c.v = (q.options[0] || {}).value;
      return h('div.cond-row', qsel, osel, vin, h('button.x', { type: 'button', 'aria-label': 'Retirer la condition', onclick: onRemove }, icon('x')));
    }
    const draw = () => mount(condBox, qs.length ? groupUI(root, 0, null) : h('p.small.muted', 'Ajoutez d\'abord des questions.'));
    draw();
    const a = r.action || {};
    const verdict = h('select', h('option', { value: '' }, '— Ne pas modifier le verdict —'), Object.entries(VERDICT).map(([k, v]) => h('option', { value: k, selected: a.verdict === k }, v)));
    const valid = h('input', { type: 'checkbox', checked: !!a.validation });
    const alertT = h('textarea', { placeholder: 'Alerte affichée à la cliente (précaution, contre-indication…)' }, a.alert || ''), msg = h('textarea', { placeholder: 'Message additionnel affiché à la cliente' }, a.message || ''), note = h('textarea', { placeholder: 'Note interne (visible uniquement par vous)' }, a.note || '');
    const rec = new Set(a.recommend || []);
    const recBox = h('div', { style: { maxHeight: '170px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '12px', padding: '8px 12px' } }, services.map(s => h('label.check', h('input', { type: 'checkbox', checked: rec.has(s.slug), onchange: (e) => e.target.checked ? rec.add(s.slug) : rec.delete(s.slug) }), h('span', `${s.name} — ${eur(s.price)}`))));
    modal(rule ? 'Modifier la règle' : 'Nouvelle règle', h('div.stack', field('Nom de la règle', name), h('div.form-grid', field('Priorité (plus petit = d\'abord)', prio), h('label.check', { style: { alignSelf: 'end', paddingBottom: '12px' } }, active, h('span', 'Règle active'))),
      h('h4', 'SI…'), condBox, h('h4', 'ALORS…'), field('Verdict', verdict), h('label.check', valid, h('span', 'Demander la validation de la professionnelle (le rendez-vous reste une « demande » jusqu\'à votre accord)')),
      h('div', h('span.lbl.small', 'Prestations à proposer (apparaissent dans le devis)'), recBox), field('Alerte', alertT), field('Message', msg), field('Note interne', note)),
    [{ label: 'Annuler', cls: 'ghost' }, { label: 'Enregistrer', onclick: async () => {
      if (!name.value.trim()) { toast('Nommez la règle.', 'err'); return false; }
      const action = { verdict: verdict.value || undefined, validation: valid.checked || undefined, alert: alertT.value.trim() || undefined, message: msg.value.trim() || undefined, note: note.value.trim() || undefined, recommend: [...rec] };
      const body = { name: name.value, priority: +prio.value || 100, active: active.checked, condition: root, action };
      if (rule) await put('/api/admin/rules/' + rule.id, body); else await post(`/api/admin/diagnostics/${did}/rules`, body);
      toast('Règle enregistrée.', 'ok'); A.route();
    } }], { wide: true });
  }

  // ------------------------------------------------------------ photos & textes
  function textsTab(D, save, meta) {
    const intro = h('textarea', { style: { minHeight: '110px' } }, D.intro || '');
    const slots = D.photo_slots.map(s => ({ ...s }));
    const slotBox = h('div'), drawSlots = () => mount(slotBox, slots.map((s, i) => h('div.row', { style: { flexWrap: 'nowrap', marginBottom: '8px' } }, h('input', { value: s.label, placeholder: 'Ex. : Vue de face', oninput: (e) => { s.label = e.target.value; if (!s._fixed) s.id = slug(e.target.value).replace(/_/g, '-') || 'photo'; } }), h('label.check', { style: { whiteSpace: 'nowrap' } }, h('input', { type: 'checkbox', checked: !!s.required, onchange: (e) => s.required = e.target.checked }), h('span', 'Obligatoire')), h('button.x', { 'aria-label': 'Retirer', onclick: () => { slots.splice(i, 1); drawSlots(); } }, icon('x')))), h('button.btn.soft.sm', { onclick: () => { slots.push({ id: 'photo-' + (slots.length + 1), label: '', required: false }); drawSlots(); } }, icon('plus'), 'Ajouter un emplacement photo'));
    slots.forEach(s => s._fixed = true); drawSlots();
    const vt = JSON.parse(JSON.stringify(D.verdict_texts || {}));
    const verdictFields = Object.keys(VERDICT).map(k => { const dflt = meta.verdict_defaults[k], t = vt[k] ||= {}; return h('div.card.flat', h('div.row', vchip(k)), field('Titre', h('input', { value: t.title || '', placeholder: dflt.title, oninput: (e) => t.title = e.target.value })), field('Message', h('textarea', { placeholder: dflt.message, oninput: (e) => t.message = e.target.value }, t.message || ''))); });
    return h('div.stack', h('div.card', h('h3', 'Introduction'), h('p.small.muted', 'Texte affiché avant le questionnaire.'), intro),
      h('div.card', h('h3', 'Photos demandées'), h('p.small.muted', 'La cliente peut prendre ou importer une photo par emplacement (face, arrière, profil, gros plan…). Elles sont privées et visibles uniquement par vous.'), slotBox),
      h('div.card', h('h3', 'Textes des résultats'), h('p.small.muted', 'Personnalisez les messages affichés selon le verdict (laissez vide pour utiliser le texte par défaut).'), h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' } }, verdictFields)),
      h('div.row', h('button.btn', { onclick: () => save({ intro: intro.value, photo_slots: slots.filter(s => s.label.trim()).map(({ _fixed, ...s }) => s), verdict_texts: vt }) }, 'Enregistrer')));
  }

  // ---------------------------------------------------------------- simulateur
  function simulatorTab(D, id) {
    const ans = {}, out = h('div'), form = h('div.stack');
    const evalC = (c) => { if (!c || !Object.keys(c).length) return true; if (c.all) return c.all.every(evalC); if (c.any) return c.any.some(evalC); const v = ans[c.q]; const vals = v == null ? [] : [].concat(v); return c.op === 'eq' ? vals[0] === c.v : c.op === 'in' ? vals.some(x => [].concat(c.v).includes(x)) : false; };
    let t;
    const run = () => { clearTimeout(t); t = setTimeout(async () => { try { const r = (await post(`/api/admin/diagnostics/${id}/test`, { answers: ans })).result; mount(out, resultCard(r)); } catch (e) { mount(out, h('div.notice.bad', icon('alert'), e.message)); } }, 200); };
    const drawForm = () => mount(form, D.questions.filter(q => !q.show_if || evalC(q.show_if)).map(q => {
      const lbl = h('span.lbl', q.label);
      if (q.type === 'text') return h('label.field', lbl, h('input', { oninput: (e) => { ans[q.id] = e.target.value; run(); } }));
      if (q.type === 'multi') return h('div.field', lbl, h('div.row', q.options.map(o => h('label.check', h('input', { type: 'checkbox', checked: (ans[q.id] || []).includes(o.value), onchange: (e) => { const s = new Set(ans[q.id] || []); e.target.checked ? s.add(o.value) : s.delete(o.value); ans[q.id] = [...s]; run(); } }), h('span', o.label)))));
      return h('label.field', lbl, h('select', { onchange: (e) => { if (e.target.value) ans[q.id] = e.target.value; else delete ans[q.id]; drawForm(); run(); } }, h('option', { value: '' }, '—'), q.options.map(o => h('option', { value: o.value, selected: ans[q.id] === o.value }, o.label))));
    }));
    drawForm(); run();
    return h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', alignItems: 'start' } }, h('div.card', h('h3', 'Réponses fictives'), h('p.small.muted', 'Testez vos règles comme le ferait une cliente. Rien n\'est enregistré.'), form), h('div.card.tint', h('h3', 'Résultat'), out));
  }
  function resultCard(r) {
    return h('div.stack', h('div', vchip(r.verdict), r.needs_validation ? h('span.badge.info', { style: { marginLeft: '8px' } }, 'Validation pro requise') : null), h('h4', r.title), h('p', r.message), r.extra_messages.map(m => h('p', m)),
      r.alerts.map(a => h('div.notice.warn', icon('alert'), a)),
      r.steps.length ? h('div', h('b', 'Recommandation'), h('ol', r.steps.map(s => h('li', s)))) : null,
      r.recommended.length ? h('div', h('b', 'Devis : '), r.recommended.map(x => `${x.name} (${eur(x.price)})`).join(' + '), ' = ', h('b', eur(r.recommended.reduce((s, x) => s + x.price, 0)))) : null,
      r.internal_notes.length ? h('p.small.muted', 'Notes internes : ' + r.internal_notes.join(' ; ')) : null,
      h('p.small.muted', 'Règles déclenchées : ' + (r.fired_rules.map(x => x.name).join(' · ') || 'aucune')));
  }
})();
