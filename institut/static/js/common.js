/* Outils communs : requêtes, construction DOM sûre (aucun innerHTML), formats, icônes, toasts, modales */
(function () {
  const ICONS = {
    home: 'M3 11l9-8 9 8M5 10v10h14V10',
    calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
    users: 'M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
    box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
    file: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6',
    receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
    plus: 'M12 5v14M5 12h14',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    x: 'M6 6l12 12M18 6L6 18',
    chevL: 'M15 5l-7 7 7 7',
    chevR: 'M9 5l7 7-7 7',
    clock: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
    alert: 'M12 9v4M12 17h.01M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
    info: 'M12 16v-4M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z',
    camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zM12 17a4 4 0 100-8 4 4 0 000 8z',
    heart: 'M12 20.5s-8-4.8-8-11A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5c0 6.200-8 11-8 11z',
    gift: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.500 2.500 0 110-5C11 2 12 7 12 7zM12 7h4.500a2.500 2.500 0 100-5C13 2 12 7 12 7z',
    search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.300-4.300',
    download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
    print: 'M7 9V3h10v6M7 17H5a1 1 0 01-1-1v-5a1 1 0 011-1h14a1 1 0 011 1v5a1 1 0 01-1 1h-2M7 14h10v7H7z',
    mail: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6',
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
    logout: 'M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4',
    menu: 'M4 7h16M4 12h16M4 17h16',
    hair: 'M5 21c0-7 2-10 3-14 .6-2.400 2-4 4-4s3.400 1.600 4 4c1 4 3 7 3 14M9 21c0-5 1-8 3-12 2 4 3 7 3 12',
    nail: 'M8 21v-7l-1-5a2 2 0 014 0l1 5v7M15 21v-5M12 4V3',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
    foot: 'M8 21c-2 0-3-1.500-3-3.500 0-3 1.500-4 1.500-8C6.500 6 8 3 10.500 3S14 5 14 8c0 2-1 3-1 5 0 3 2.500 3 2.500 5S13 21 11 21zM17.500 6.500v.01M20 9v.01M20.500 12.500v.01',
    shield: 'M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z',
    star: 'M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z',
    scissors: 'M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM8.100 7.900L20 20M8.100 16.100L20 4',
    drag: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
    refresh: 'M20 11a8 8 0 00-14.900-3M4 4v4h4M4 13a8 8 0 0014.900 3M20 20v-4h-4',
    lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3',
    phone: 'M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
    pin: 'M12 21s7-6.200 7-11a7 7 0 10-14 0c0 4.800 7 11 7 11zM12 12a2.500 2.500 0 100-5 2.500 2.500 0 000 5z',
  };
  const SVGNS = 'http://www.w3.org/2000/svg';

  function icon(name, cls) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', ICONS[name] || ICONS.sparkle);
    s.appendChild(p);
    return s;
  }

  /* h('div.card#id', {onclick, class, dataset:{}}, ...enfants) — le texte est toujours inséré en textContent */
  function h(sel, attrs, ...kids) {
    const m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(sel) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, k, v) => { if (k === '#') el.id = v; else el.classList.add(v); });
    if (attrs != null && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') v.split(' ').filter(Boolean).forEach(c => el.classList.add(c));
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    append(el, kids);
    return el;
  }
  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function mount(el, ...kids) { clear(el); return append(el, kids); }

  async function api(path, opts = {}) {
    const init = { method: opts.method || 'GET', headers: { 'X-Requested-With': 'institut' }, credentials: 'same-origin' };
    if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    let res;
    try { res = await fetch(path, init); } catch (e) { throw new Error('Connexion impossible. Vérifiez votre réseau.'); }
    let data = null;
    try { data = await res.json(); } catch (e) { /* PDF ou vide */ }
    if (!res.ok) { const err = new Error((data && data.error) || 'Une erreur est survenue.'); err.status = res.status; err.data = data; throw err; }
    return data;
  }
  const get = (p) => api(p);
  const post = (p, body) => api(p, { method: 'POST', body: body || {} });
  const put = (p, body) => api(p, { method: 'PUT', body });
  const del = (p, body) => api(p, { method: 'DELETE', body });

  const eur = (v, dec) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec == null ? (Number.isInteger(+v) ? 0 : 2) : dec, maximumFractionDigits: 2 }).format(+v || 0);
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const pad = (n) => String(n).padStart(2, '0');
  const parse = (s) => { if (!s) return null; const [d, t] = s.split('T'); const [y, m, dd] = d.split('-').map(Number); const [hh, mm] = (t || '00:00').split(':').map(Number); return new Date(y, m - 1, dd, hh || 0, mm || 0); };
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoDT = (d) => `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const longDate = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fullDate = (d) => `${longDate(d)} ${d.getFullYear()}`;
  const shortDate = (s) => { const d = typeof s === 'string' ? parse(s.length === 10 ? s + 'T00:00' : s) : s; return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : ''; };
  const dur = (min) => { const hh = Math.floor(min / 60), m = min % 60; return hh ? (m ? `${hh} h ${pad(m)}` : `${hh} h`) : `${m} min`; };

  function toast(msg, kind) {
    let box = document.getElementById('toasts');
    if (!box) { box = h('div#toasts', { role: 'status', 'aria-live': 'polite' }); document.body.appendChild(box); }
    const t = h('div.toast' + (kind ? '.' + kind : ''), msg);
    box.appendChild(t);
    setTimeout(() => t.remove(), kind === 'err' ? 6000 : 3500);
  }
  const fail = (e) => { console.error(e); toast(e.message || 'Erreur', 'err'); };

  function modal(title, bodyNode, buttons, opts = {}) {
    const bg = h('div.modal-bg', { onmousedown: (e) => { if (e.target === bg && !opts.persistent) close(); } });
    const close = () => { bg.remove(); document.removeEventListener('keydown', esc); if (opts.onclose) opts.onclose(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    const foot = h('footer');
    (buttons || []).forEach(b => foot.appendChild(h('button.btn' + (b.cls ? '.' + b.cls.split(' ').join('.') : ''), {
      type: 'button', onclick: async (e) => {
        const btn = e.currentTarget; btn.disabled = true;
        try { const r = b.onclick ? await b.onclick(close) : undefined; if (r !== false && !b.keep) close(); } catch (err) { fail(err); } finally { btn.disabled = false; }
      },
    }, b.label)));
    const box = h('div.modal' + (opts.wide ? '.wide' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('header', h('h3', title), h('button.x', { type: 'button', 'aria-label': 'Fermer', onclick: close }, icon('x'))),
      h('div.body', bodyNode), (buttons && buttons.length) ? foot : null);
    bg.appendChild(box);
    document.body.appendChild(bg);
    const first = box.querySelector('input,select,textarea');
    if (first && !opts.noFocus) first.focus();
    return { close, box };
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise((resolve) => {
      let done = false;
      modal(title, h('p', text), [
        { label: 'Annuler', cls: 'ghost', onclick: () => { done = true; resolve(false); } },
        { label: okLabel || 'Confirmer', cls: danger ? 'danger' : '', onclick: () => { done = true; resolve(true); } },
      ], { onclose: () => { if (!done) resolve(false); } });
    });
  }
  /* Champ de formulaire : retourne {node, input} */
  function field(label, input, hint) {
    return h('label.field', h('span.lbl', label), input, hint ? h('span.small.muted', hint) : null);
  }
  function fileToDataURL(file, maxSide = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\/(jpeg|png|webp|heic|heif)/.test(file.type) && !file.type.startsWith('image/')) return reject(new Error('Format d’image non pris en charge.'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible.')); };
      img.src = url;
    });
  }
  const STATUS = {
    demande: ['Demande', 'info'], confirme: ['Confirmé', 'ok'], en_attente: ['En attente', 'warn'], arrive: ['Arrivé', 'gold'],
    en_cours: ['En cours', 'gold'], termine: ['Terminé', 'neutral'], annule: ['Annulé', 'bad'], no_show: ['No-show', 'bad'],
  };
  const statusBadge = (s) => h('span.badge.' + (STATUS[s] ? STATUS[s][1] : 'neutral'), STATUS[s] ? STATUS[s][0] : s);
  const CAT_ICON = { Cheveux: 'hair', Ongles: 'nail', Pieds: 'foot', Cils: 'eye' };

  window.UI = { h, icon, clear, mount, append, api, get, post, put, del, eur, parse, isoDate, isoDT, hm, longDate, fullDate, shortDate, dur, cap, MONTHS, DAYS, pad, toast, fail, modal, confirmBox, field, fileToDataURL, statusBadge, STATUS, CAT_ICON };
})();
