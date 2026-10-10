/* Photos cliquables : la photo s'agrandit avec, à côté, les prestations correspondantes à réserver.
   Flèches / clavier / balayage pour parcourir les autres photos. */
(function () {
  const sel = '.gallery img, .arch img, .univ .ph img';
  const nodes = () => [...document.querySelectorAll(sel)];
  let DATA = {};
  try { DATA = JSON.parse(document.getElementById('svc-data').textContent); } catch (e) { /* pas de données */ }
  const list = () => { const seen = new Set(); return nodes().filter(i => !seen.has(i.src) && seen.add(i.src)).map(i => ({ src: i.src, alt: i.alt || '', cat: i.dataset.cat || '' })); };
  let items = [], idx = 0, box;

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const dur = (m) => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') : '') : m + ' min';
  const eur = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',') + ' €';

  function build() {
    box = el('div', 'lb'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Photo et prestations');
    box.innerHTML = '<button class="lb-x" aria-label="Fermer">✕</button><div class="lb-body"><div class="lb-main"><button class="lb-p" aria-label="Photo précédente">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-n" aria-label="Photo suivante">›</button></div><aside class="lb-panel"></aside></div><div class="lb-t"></div>';
    document.body.appendChild(box);
    box.addEventListener('click', (e) => { if (e.target === box || e.target.classList.contains('lb-body') || e.target.closest('.lb-x')) close(); });
    box.querySelector('.lb-p').addEventListener('click', () => go(-1));
    box.querySelector('.lb-n').addEventListener('click', () => go(1));
    box.querySelector('.lb-panel').addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a && window.APERCU && typeof window.apercu === 'function') { e.preventDefault(); window.apercu(); }  // fichier d'aperçu autonome
    });
    let x0 = null;
    box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); x0 = null; });
  }

  function panel(cat) {
    const p = box.querySelector('.lb-panel'); p.replaceChildren();
    const svcs = DATA[cat] || [];
    if (!svcs.length) {
      p.append(el('p', 'lb-eyebrow', 'Prendre rendez-vous'), el('h3', '', 'Réservez votre moment'), el('p', 'lb-muted', 'Choisissez une prestation, passez le diagnostic si nécessaire, puis votre créneau.'));
      const a = el('a', 'lb-btn', 'Voir toutes les prestations ✦'); a.href = '/reserver#/prestations'; p.append(a);
      return;
    }
    p.append(el('p', 'lb-eyebrow', 'Prestations'), el('h3', '', cat));
    svcs.forEach(s => {
      const row = el('a', 'lb-svc'); row.href = '/reserver#/service/' + s.id; row.title = 'Réserver : ' + s.name;   // toute la ligne est cliquable
      const info = el('div', 'lb-info'); info.append(el('b', '', s.name), el('span', 'lb-muted', dur(s.duration) + (s.diag ? ' · diagnostic' : '')));
      const side = el('div', 'lb-side'); side.append(el('span', 'lb-price', eur(s.price)), el('span', 'lb-btn sm', 'Réserver'));
      row.append(info, side); p.append(row);
    });
    const all = el('a', 'lb-link', 'Toutes les prestations →'); all.href = '/reserver#/prestations/' + encodeURIComponent(cat); p.append(all);
  }

  function show() {
    const it = items[idx];
    const img = box.querySelector('img'); img.src = it.src; img.alt = it.alt;
    box.querySelector('figcaption').textContent = it.alt;
    box.querySelector('.lb-t').textContent = (idx + 1) + ' / ' + items.length;
    box.classList.toggle('single', items.length < 2);
    panel(it.cat);
  }
  function go(d) { idx = (idx + d + items.length) % items.length; show(); }
  function open(src) {
    items = list(); idx = Math.max(0, items.findIndex(i => i.src === src));
    if (!box) build();
    box.classList.add('on'); document.body.style.overflow = 'hidden'; show(); box.querySelector('.lb-x').focus();
  }
  function close() { box.classList.remove('on'); document.body.style.overflow = ''; }
  document.addEventListener('keydown', (e) => {
    if (!box || !box.classList.contains('on')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
  });
  document.addEventListener('click', (e) => {
    const img = e.target.closest(sel) || (e.target.closest('.univ .ph') && e.target.closest('.univ .ph').querySelector('img'));
    if (!img) return;
    e.preventDefault(); open(img.src);
  });
  nodes().forEach(i => { i.style.cursor = 'pointer'; });
})();
