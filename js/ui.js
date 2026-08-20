import { getProfile, signOut, ROLE_LABELS } from "./auth.js";

const MENU = [
  { key: "dashboard", label: "Tableau de bord", href: "dashboard.html" },
  { key: "clients", label: "Clients", href: "pages/clients.html" },
  { key: "prospects", label: "Prospects", href: "pages/a-venir.html?m=Prospects" },
  { key: "devis", label: "Devis", href: "pages/devis.html" },
  { key: "factures", label: "Factures", href: "pages/factures.html" },
  { key: "chantiers", label: "Chantiers", href: "pages/chantiers.html" },
  { key: "planning", label: "Planning", href: "pages/a-venir.html?m=Planning" },
  { key: "equipes", label: "Équipes", href: "pages/a-venir.html?m=Équipes" },
  { key: "fournisseurs", label: "Fournisseurs", href: "pages/a-venir.html?m=Fournisseurs" },
  { key: "achats", label: "Achats", href: "pages/a-venir.html?m=Achats" },
  { key: "stock", label: "Stock", href: "pages/a-venir.html?m=Stock" },
  { key: "documents", label: "Documents", href: "pages/a-venir.html?m=Documents" },
  { key: "courrier", label: "Courrier", href: "pages/a-venir.html?m=Courrier" },
  { key: "taches", label: "Tâches", href: "pages/a-venir.html?m=Tâches" },
  { key: "agenda", label: "Agenda", href: "pages/a-venir.html?m=Agenda" },
  { key: "tresorerie", label: "Trésorerie", href: "pages/a-venir.html?m=Trésorerie" },
  { key: "rapports", label: "Rapports", href: "pages/a-venir.html?m=Rapports" },
  { key: "parametres", label: "Paramètres", href: "pages/parametres.html" },
];

// Construit la coquille de page (sidebar + topbar). À appeler sur
// chaque page interne avec le profil déjà chargé (voir requireAuth()).
export function renderShell(profile, activeKey) {
  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");
  if (!sidebar || !topbar) return;

  const basePrefix = location.pathname.includes("/pages/") ? "../" : "";

  sidebar.innerHTML = `
    <div class="sidebar-brand">${escapeHtml(profile?.companies?.nom_commercial || profile?.companies?.raison_sociale || "BTP Manager")}</div>
    <ul class="sidebar-nav">
      ${MENU.map(
        (item) => `<li><a href="${basePrefix}${item.href}" class="${item.key === activeKey ? "active" : ""}">${item.label}</a></li>`
      ).join("")}
    </ul>
  `;

  const roleLabel = ROLE_LABELS[profile?.role] || profile?.role || "";
  topbar.innerHTML = `
    <button id="menu-toggle" aria-label="Ouvrir le menu">&#9776;</button>
    <div class="topbar-user">
      <span>${escapeHtml(profile?.prenom || "")} ${escapeHtml(profile?.nom || "")}</span>
      <span class="role-badge">${escapeHtml(roleLabel)}</span>
      <button class="btn btn-sm" id="logout-btn">Déconnexion</button>
    </div>
  `;

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await signOut();
    window.location.href = `${basePrefix}login.html`;
  });
}

export async function initShell(activeKey) {
  const profile = await getProfile();
  renderShell(profile, activeKey);
  return profile;
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Confirmation avant suppression (action destructive).
export function confirmDelete(label) {
  return window.confirm(`Supprimer définitivement "${label}" ? Cette action est irréversible.`);
}
