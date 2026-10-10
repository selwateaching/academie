/* Assistant de l'institut : réponses automatiques (FAQ) construites à partir des réglages réels du site.
   Aucun service externe : les réponses viennent de /api/public/*. Pas de conseil médical. */
(function () {
  const h = (tag, attrs, ...kids) => {
    const m = /^([a-z0-9]+)((?:\.[\w-]+)*)$/i.exec(tag); const el = document.createElement(m[1]);
    if (m[2]) el.className = m[2].slice(1).replace(/\./g, ' ');
    if (attrs != null && (attrs.nodeType || Array.isArray(attrs) || typeof attrs !== 'object')) { kids.unshift(attrs); attrs = null; }
    for (const [k, v] of Object.entries(attrs || {})) { if (k.startsWith('on')) el[k] = v; else if (v != null) el.setAttribute(k, v); }
    kids.flat().forEach(c => { if (c != null) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  };
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
  const eur = (n) => (Math.round(n * 100) / 100).toLocaleString('fr-FR') + ' €';
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  let info = null, services = [], loaded = false;

  async function load() {
    if (loaded) return; loaded = true;
    try {
      const [a, b] = await Promise.all([fetch('/api/public/info').then(r => r.json()), fetch('/api/public/services').then(r => r.json())]);
      info = a; services = b.services || [];
    } catch (e) { info = null; }
  }

  const link = (href, text) => ({ href, text });
  const hoursText = () => {
    const hrs = (info && info.hours) || {};
    return DAYS.map((d, i) => d + ' : ' + ((hrs[i] || []).length ? hrs[i].map(x => x[0] + ' – ' + x[1]).join(' · ') : 'fermé')).join('\n');
  };
  const contact = () => {
    const i = (info && info.institute) || {}, out = [];
    if (i.phone) out.push('Téléphone : ' + i.phone);
    if (i.email) out.push('Email : ' + i.email);
    if (i.address) out.push('Adresse : ' + i.address);
    return out.length ? out.join('\n') : 'Les coordonnées seront bientôt affichées. En attendant, vous pouvez réserver en ligne ou nous écrire depuis le formulaire de contact en bas de la page d\'accueil.';
  };
  const matchService = (q) => {
    const words = norm(q).split(' ').filter(w => w.length > 3);
    let best = null, score = 0;
    for (const s of services) {
      const n = norm(s.name); const sc = words.filter(w => n.includes(w) || (w.length > 5 && n.includes(w.slice(0, -1)))).length;
      if (sc > score) { best = s; score = sc; }
    }
    return best;
  };
  const priceList = () => {
    const cats = {}; services.forEach(s => (cats[s.category] ||= []).push(s));
    return Object.entries(cats).map(([c, l]) => c + ' :\n' + l.map(s => ' • ' + s.name + ' — ' + eur(s.price) + ' (' + s.duration + ' min)').join('\n')).join('\n\n');
  };

  const INTENTS = [
    [/horaire|ouvert|\bferme\b|ouverture|heure d/, () => ({ text: 'Nos horaires :\n' + hoursText() })],
    [/adresse|ou etes|ou se trouve|telephone|tel |appeler|contact|mail|joindre|situe|localis|\bplan\b/, () => ({ text: contact() })],
    [/annul|deplac|report|modifier mon rdv|changer mon rdv|retard/, () => ({ text: `Vous pouvez annuler ou déplacer un rendez-vous depuis « Rendez-vous » dans votre espace cliente, jusqu'à ${((info && info.booking && info.booking.cancel_hours) || 24)} h avant. Passé ce délai, merci de nous contacter directement.`, links: [link('/compte#/rdv', 'Mes rendez-vous')] })],
    [/acompte|arrhes|paiement|payer|regler|carte|espece/, () => {
      const d = services.filter(s => s.deposit > 0);
      return { text: d.length ? 'Certaines prestations demandent un acompte à la réservation :\n' + d.map(s => ' • ' + s.name + ' : ' + eur(s.deposit)).join('\n') + '\nLe solde se règle à l\'institut.' : 'Le règlement se fait à l\'institut après la prestation.' };
    }],
    [/fidelite|eclat|passeport|papillon|points|surprise|recompense|cadeau/, () => {
      const l = (info && info.loyalty) || {}; const t = l.stamps_target || 10;
      return { text: `Mon Passeport Beauté : chaque prestation réalisée fait briller un éclat sur votre papillon. À ${t} éclats, « ${l.reward_name || 'une surprise'} » vous est offerte, avec de petites attentions en chemin.`, links: [link('/compte#/fidelite', 'Voir mon passeport')] };
    }],
    [/diagnostic|questionnaire|conseil|recommand|personnalis/, () => ({ text: 'Pour certaines prestations, un court diagnostic (quelques questions, avec photos si besoin) nous permet de vous conseiller et de préparer votre rendez-vous. Il se passe en ligne, au moment de la réservation. Il ne remplace pas un avis médical.', links: [link('/reserver#/prestations', 'Commencer')] })],
    [/devis/, () => ({ text: 'Après un diagnostic, un devis peut vous être proposé. Vous le retrouvez dans votre espace : vous pouvez le consulter, l\'accepter, le refuser ou le télécharger en PDF.', links: [link('/compte#/devis', 'Mes devis')] })],
    [/facture|recu/, () => ({ text: 'Vos factures apparaissent dans votre espace cliente après chaque prestation réalisée, avec un PDF à télécharger.', links: [link('/compte#/factures', 'Mes factures')] })],
    [/mot de passe|connexion|connecter|compte|inscri|creer un compte|identifiant/, () => ({ text: 'Pour créer votre compte : « Mon compte » puis « Créer mon compte » (email + mot de passe). Mot de passe oublié ? Contactez l\'institut : un mot de passe temporaire pourra vous être donné.', links: [link('/compte', 'Mon compte')] })],
    [/avis|temoign|note/, () => ({ text: 'Après une prestation, vous pouvez laisser votre avis depuis votre espace (rubrique « Avis »). Il est publié après validation par l\'institut.', links: [link('/compte#/avis', 'Donner mon avis')] })],
    [/donnees|rgpd|confidential|supprimer mon compte|photo/, () => ({ text: 'Vos données ne servent qu\'à gérer vos rendez-vous. Vos photos restent privées ; elles ne sont utilisées en communication qu\'avec votre accord. Vous pouvez exporter ou supprimer vos données depuis votre profil.', links: [link('/compte#/profil', 'Mon profil')] })],
    [/enceinte|grossesse|allaite|allergi|medic|maladie|traitement|douleur|peau sensible|danger/, () => ({ text: 'Pour toute situation particulière (grossesse, allergie, traitement, peau réactive…), je ne peux pas vous conseiller moi-même : merci de le signaler dans le diagnostic ou de contacter l\'institut, qui vous répondra personnellement. Nos recommandations ne remplacent pas un avis médical.', links: [link('/reserver#/prestations', 'Passer le diagnostic')] })],
    [/reserv|rendez|rdv|prendre|creneau|dispo/, () => ({ text: 'C\'est simple : choisissez votre prestation, passez le diagnostic si besoin, puis sélectionnez un créneau. Vous recevez une confirmation et des rappels.', links: [link('/reserver#/prestations', 'Prendre rendez-vous')] })],
    [/prix|tarif|combien|coute|prestation|carte des soins|catalogue|liste/, () => ({ text: services.length ? 'Nos prestations :\n\n' + priceList() : 'Retrouvez nos prestations et tarifs dans la rubrique « Prestations ».', links: [link('/reserver#/prestations', 'Voir et réserver')] })],
    [/bonjour|salut|coucou|bonsoir|hello/, () => ({ text: 'Bonjour ! Comment puis-je vous aider ?' })],
    [/merci/, () => ({ text: 'Avec plaisir ! À très vite à l\'institut ✨' })],
  ];
  const SUGGEST = ['Horaires', 'Prestations et tarifs', 'Prendre rendez-vous', 'Annuler un rendez-vous', 'Passeport Beauté', 'Contact'];

  function answer(q) {
    const s = matchService(q);
    const t = norm(q);
    if (s && !/horaire|annul|acompte|fidelite|merci|bonjour/.test(t)) {
      return { text: `${s.name} — ${eur(s.price)}, ${s.duration} min.${s.deposit > 0 ? ' Acompte : ' + eur(s.deposit) + '.' : ''}\n${s.description || ''}${s.diagnostic_slug ? '\nUn diagnostic ' + (s.diagnostic_required ? 'est nécessaire' : 'est conseillé') + ' avant la réservation.' : ''}`.trim(), links: [link('/reserver#/service/' + s.id, 'Réserver cette prestation')] };
    }
    for (const [re, fn] of INTENTS) if (re.test(t + ' ')) return fn();
    return { text: 'Je n\'ai pas bien compris, mais je peux vous renseigner sur les horaires, les prestations, la réservation, l\'annulation ou la fidélité. Pour une question particulière, l\'institut vous répondra directement.\n\n' + contact() };
  }

  function mount() {
    if (document.getElementById('chatbot')) return;
    const log = h('div.cb-log', { role: 'log', 'aria-live': 'polite' });
    const chips = h('div.cb-chips');
    const input = h('input', { type: 'text', placeholder: 'Posez votre question…', 'aria-label': 'Votre question', maxlength: 200 });
    const panel = h('div.cb-panel', { hidden: '', role: 'dialog', 'aria-label': 'Assistant' },
      h('div.cb-head', h('b', 'Assistante Éclat de Rêve'), h('button.cb-x', { type: 'button', 'aria-label': 'Fermer', onclick: () => toggle(false) }, '×')),
      log, chips,
      (() => { const f = h('form.cb-form', { onsubmit: (e) => { e.preventDefault(); ask(input.value); input.value = ''; } }, input, h('button', { type: 'submit' }, 'Envoyer')); return f; })());
    const fab = h('button.cb-fab', { type: 'button', 'aria-label': 'Ouvrir l\'assistant', onclick: () => toggle(true) }, '💬 Une question ?');
    const root = h('div', { id: 'chatbot' }, panel, fab);
    document.body.append(root);
    const say = (who, text, links) => {
      const m = h('div.cb-msg.' + who, text);
      (links || []).forEach(l => m.append(h('a.cb-link', { href: l.href }, l.text)));
      log.append(m); log.scrollTop = log.scrollHeight;
    };
    const ask = (q) => { q = String(q || '').trim(); if (!q) return; say('me', q); const r = answer(q); setTimeout(() => say('bot', r.text, r.links), 250); };
    SUGGEST.forEach(s => chips.append(h('button.cb-chip', { type: 'button', onclick: () => ask(s) }, s)));
    let started = false;
    function toggle(open) {
      panel.hidden = !open; fab.hidden = open;
      if (open) { load().then(() => { if (!started) { started = true; say('bot', 'Bonjour ! Je suis l\'assistante de l\'institut. Je réponds aux questions sur les horaires, les prestations, la réservation et la fidélité.'); } }); input.focus(); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
