import { getProfile, signOut, ROLE_LABELS } from "./auth.js";
import { supabase } from "./supabaseClient.js";

const MENU = [
  { key: "dashboard", label: "Tableau de bord", href: "dashboard.html" },
  { key: "clients", label: "Clients", href: "pages/clients.html" },
  { key: "prospects", label: "Prospects", href: "pages/prospects.html" },
  { key: "devis", label: "Devis", href: "pages/devis.html" },
  { key: "factures", label: "Factures", href: "pages/factures.html" },
  { key: "chantiers", label: "Chantiers", href: "pages/chantiers.html" },
  { key: "planning", label: "Planning", href: "pages/planning.html" },
  { key: "equipes", label: "Équipes", href: "pages/equipes.html" },
  { key: "fournisseurs", label: "Fournisseurs", href: "pages/fournisseurs.html" },
  { key: "achats", label: "Achats", href: "pages/achats.html" },
  { key: "stock", label: "Stock", href: "pages/stock.html" },
  { key: "documents", label: "Documents", href: "pages/documents.html" },
  { key: "courrier", label: "Courrier", href: "pages/courrier.html" },
  { key: "taches", label: "Tâches", href: "pages/taches.html" },
  { key: "agenda", label: "Agenda", href: "pages/agenda.html" },
  { key: "tresorerie", label: "Trésorerie", href: "pages/tresorerie.html" },
  { key: "rapports", label: "Rapports", href: "pages/rapports.html" },
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
    <div class="topbar-search">
      <input type="search" id="global-search" placeholder="Rechercher un client, chantier, devis, facture…" />
      <div id="global-search-results" class="search-results hidden"></div>
    </div>
    <div class="topbar-user">
      <button class="btn btn-sm" id="notif-btn" title="Notifications">🔔</button>
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
  document.getElementById("notif-btn")?.addEventListener("click", () => {
    window.location.href = `${basePrefix}pages/notifications.html`;
  });

  setupGlobalSearch(basePrefix);
}

let searchTimer = null;
function setupGlobalSearch(basePrefix) {
  const input = document.getElementById("global-search");
  const results = document.getElementById("global-search-results");
  if (!input || !results) return;

  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.classList.add("hidden");
      return;
    }
    searchTimer = setTimeout(() => runGlobalSearch(q, results, basePrefix), 300);
  });

  document.addEventListener("click", (e) => {
    if (!results.contains(e.target) && e.target !== input) results.classList.add("hidden");
  });
}

async function runGlobalSearch(q, results, basePrefix) {
  const like = `%${q}%`;
  const [{ data: clients }, { data: projects }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("id, nom, prenom, entreprise").or(`nom.ilike.${like},entreprise.ilike.${like}`).limit(5),
    supabase.from("projects").select("id, nom").ilike("nom", like).limit(5),
    supabase.from("quotes").select("id, numero").ilike("numero", like).limit(5),
    supabase.from("invoices").select("id, numero").ilike("numero", like).limit(5),
  ]);

  function clientLabel(c) {
    return c.entreprise || `${c.prenom || ""} ${c.nom || ""}`.trim();
  }

  const groups = [
    { label: "Clients", href: `${basePrefix}pages/clients.html`, items: (clients || []).map((c) => clientLabel(c)) },
    { label: "Chantiers", href: `${basePrefix}pages/chantiers.html`, items: (projects || []).map((p) => p.nom) },
    { label: "Devis", href: `${basePrefix}pages/devis.html`, items: (quotes || []).map((q) => q.numero) },
    { label: "Factures", href: `${basePrefix}pages/factures.html`, items: (invoices || []).map((i) => i.numero) },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    results.innerHTML = `<div class="search-empty">Aucun résultat.</div>`;
  } else {
    results.innerHTML = groups
      .map(
        (g) => `
      <div class="search-group">
        <div class="search-group-label">${g.label}</div>
        ${g.items.map((item) => `<a href="${g.href}" class="search-item">${escapeHtml(item)}</a>`).join("")}
      </div>`
      )
      .join("");
  }
  results.classList.remove("hidden");
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
