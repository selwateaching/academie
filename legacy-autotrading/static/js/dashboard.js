/* =====================================================================
   AutoTrading Pro – Dashboard JavaScript
   ===================================================================== */

'use strict';

// ── Config ──────────────────────────────────────────────────────────────────
const MIN_SCORE_NOTIFICATION = parseInt(
  document.querySelector('meta[name="min-score"]')?.content || '80',
  10
);

// ── Toast System ─────────────────────────────────────────────────────────────

/**
 * Show a toast notification in the bottom-right container.
 * @param {string} title
 * @param {string} message
 * @param {'success'|'warning'|'danger'|'info'} type
 * @param {number} duration  ms before auto-close (0 = no auto-close)
 */
function showToast(title, message, type = 'success', duration = 6000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = {
    success: 'fa-circle-check',
    warning: 'fa-triangle-exclamation',
    danger:  'fa-circle-xmark',
    info:    'fa-circle-info',
  };

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${iconMap[type] || iconMap.info}"></i></div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-msg">${escapeHtml(message)}</div>` : ''}
    </div>
    <span class="toast-close" title="Fermer">&times;</span>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  toast.addEventListener('click', (e) => {
    if (!e.target.classList.contains('toast-close')) removeToast(toast);
  });

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.style.transition = 'opacity 0.3s, transform 0.3s';
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(30px)';
  setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 320);
}

/**
 * Show a notification for a high-scoring vehicle.
 * @param {{name: string, score: number, decision: string, id: number}} vehicle
 */
function showNotification(vehicle) {
  const title = `🏆 Opportunité détectée !`;
  const msg = `${vehicle.name} — Score ${vehicle.score}/100 (${vehicle.decision})`;
  const toast = showToast(title, msg, 'success', 8000);

  // Make it clickable if id is provided
  if (vehicle.id && toast) {
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', () => {
      window.location.href = `/vehicle/${vehicle.id}`;
    });
  }
}

// ── On-load: scan visible vehicles for high scores ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('[data-score]');
  const HIGH_SCORE_VEHICLES = [];

  cards.forEach(card => {
    const score = parseInt(card.dataset.score || '0', 10);
    if (score >= MIN_SCORE_NOTIFICATION) {
      HIGH_SCORE_VEHICLES.push({
        id: parseInt(card.dataset.vehicleId || '0', 10),
        name: card.dataset.vehicleName || 'Véhicule',
        score,
        decision: card.dataset.decision || '',
      });
    }
  });

  // Show notifications staggered (300ms apart) so they don't stack immediately
  HIGH_SCORE_VEHICLES.slice(0, 3).forEach((v, i) => {
    setTimeout(() => showNotification(v), i * 400 + 600);
  });

  // Update nav badge if any high-score vehicles exist
  const badge = document.getElementById('nav-sync-badge');
  if (badge && HIGH_SCORE_VEHICLES.length > 0) {
    badge.textContent = HIGH_SCORE_VEHICLES.length;
    badge.style.display = 'inline-block';
  }
});

// ── Sync Button ───────────────────────────────────────────────────────────────
function triggerSync() {
  const btn    = document.getElementById('sync-btn');
  const icon   = document.getElementById('sync-icon');
  const text   = document.getElementById('sync-text');
  const navIcon = document.getElementById('sync-spin-icon');

  if (!btn) return;

  // Prevent double-click
  if (btn.disabled) return;
  btn.disabled = true;

  if (icon) icon.classList.add('fa-spin');
  if (navIcon) navIcon.classList.add('fa-spin');
  if (text) text.textContent = 'Synchronisation…';

  fetch('/sync', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const count = data.count || 0;
        if (count > 0) {
          showToast(
            `${count} nouveau${count > 1 ? 'x' : ''} véhicule${count > 1 ? 's' : ''} analysé${count > 1 ? 's' : ''} !`,
            `${data.total_emails || 0} email${(data.total_emails || 0) > 1 ? 's' : ''} traité${(data.total_emails || 0) > 1 ? 's' : ''} au total.`,
            'success'
          );
          // Reload page after a short delay to show new vehicles
          setTimeout(() => window.location.reload(), 2500);
        } else {
          showToast('Synchronisation terminée', 'Aucun nouveau véhicule détecté.', 'info');
          _resetSyncBtn(btn, icon, navIcon, text);
        }
      } else {
        const errMsg = data.error || 'Erreur inconnue.';
        if (errMsg.includes('OAuth') || errMsg.includes('credential') || errMsg.includes('token')) {
          showToast('Gmail non connecté', 'Connectez votre compte Gmail dans les Paramètres.', 'warning');
        } else {
          showToast('Erreur de synchronisation', errMsg, 'danger');
        }
        _resetSyncBtn(btn, icon, navIcon, text);
      }
    })
    .catch(err => {
      console.error('Sync error:', err);
      showToast('Erreur réseau', 'Impossible de contacter le serveur.', 'danger');
      _resetSyncBtn(btn, icon, navIcon, text);
    });
}

function _resetSyncBtn(btn, icon, navIcon, text) {
  if (btn)  btn.disabled = false;
  if (icon) icon.classList.remove('fa-spin');
  if (navIcon) navIcon.classList.remove('fa-spin');
  if (text) text.textContent = 'Synchroniser emails';
}

// ── Sidebar sync nav item ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const navBtn = document.getElementById('sync-nav-btn');
  if (navBtn) {
    navBtn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerSync();
    });
  }
});

// ── Utility ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
