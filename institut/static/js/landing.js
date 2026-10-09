/* Visionneuse de photos : clic sur une photo -> plein écran, flèches / clavier / balayage */
(function () {
  const sel = '.gallery img, .arch img, .univ .ph img';
  const nodes = () => [...document.querySelectorAll(sel)];
  const list = () => { const seen = new Set(); return nodes().filter(i => !seen.has(i.src) && seen.add(i.src)).map(i => ({ src: i.src, alt: i.alt || '' })); };
  let items = [], idx = 0, box;

  function build() {
    box = document.createElement('div');
    box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Photos');
    box.innerHTML = '<button class="lb-x" aria-label="Fermer">✕</button><button class="lb-p" aria-label="Photo précédente">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-n" aria-label="Photo suivante">›</button><div class="lb-t"></div>';
    document.body.appendChild(box);
    box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.lb-x')) close(); });
    box.querySelector('.lb-p').addEventListener('click', () => go(-1));
    box.querySelector('.lb-n').addEventListener('click', () => go(1));
    let x0 = null;
    box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); x0 = null; });
  }
  function show() {
    const it = items[idx];
    box.querySelector('img').src = it.src; box.querySelector('img').alt = it.alt;
    box.querySelector('figcaption').textContent = it.alt;
    box.querySelector('.lb-t').textContent = (idx + 1) + ' / ' + items.length;
    box.classList.toggle('single', items.length < 2);
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
    e.preventDefault(); open(img.src);   // sur une carte de prestation, la photo s'agrandit ; le reste de la carte mène à la réservation
  });
  nodes().forEach(i => { i.style.cursor = 'zoom-in'; });
})();
