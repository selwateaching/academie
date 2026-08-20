import { requireAuth, ROLE_LABELS } from "./auth.js";
import { renderShell, showToast, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "parametres");
  main(profile);
}

const COMPANY_FIELDS = [
  "raison_sociale", "nom_commercial", "siret", "numero_tva", "adresse",
  "code_postal", "ville", "telephone", "email", "site_web", "iban", "bic",
  "taux_tva_defaut", "assurance_decennale", "rc_professionnelle",
  "mentions_legales", "conditions_generales",
];

async function main(profile) {
  const isAdmin = profile.role === "admin";
  const canInvite = ["admin", "conducteur"].includes(profile.role);

  await loadCompany();
  await loadUsers();
  await loadInvitations();

  document.getElementById("company-form").addEventListener("submit", saveCompany);
  document.getElementById("invite-form").addEventListener("submit", sendInvitation);

  if (!isAdmin) {
    document.getElementById("company-save-btn").style.display = "none";
    COMPANY_FIELDS.forEach((f) => (document.getElementById(f).disabled = true));
  }
  if (!canInvite) {
    document.getElementById("invite-form").style.display = "none";
  }

  async function loadCompany() {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single();
    if (error) {
      showToast("Erreur chargement entreprise : " + error.message, "error");
      return;
    }
    COMPANY_FIELDS.forEach((f) => {
      const el = document.getElementById(f);
      if (el) el.value = data[f] ?? "";
    });
  }

  async function saveCompany(e) {
    e.preventDefault();
    const msg = document.getElementById("company-msg");
    msg.textContent = "";
    const payload = {};
    COMPANY_FIELDS.forEach((f) => (payload[f] = document.getElementById(f).value || null));

    const { error } = await supabase.from("companies").update(payload).eq("id", profile.company_id);
    if (error) {
      msg.textContent = "Erreur : " + error.message;
      msg.className = "form-msg error";
      return;
    }
    msg.textContent = "Informations enregistrées.";
    msg.className = "form-msg success";
    showToast("Entreprise mise à jour.", "success");
  }

  async function loadUsers() {
    const tbody = document.getElementById("users-tbody");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nom, prenom, role, actif")
      .order("created_at", { ascending: true });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="4">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    tbody.innerHTML = data
      .map(
        (u) => `
      <tr data-id="${u.id}">
        <td>${escapeHtml(u.prenom || "")} ${escapeHtml(u.nom || "")}</td>
        <td>
          ${isAdmin
            ? `<select class="role-select" style="width:auto;">${Object.entries(ROLE_LABELS)
                .map(([val, label]) => `<option value="${val}" ${val === u.role ? "selected" : ""}>${label}</option>`)
                .join("")}</select>`
            : escapeHtml(ROLE_LABELS[u.role] || u.role)}
        </td>
        <td><span class="badge ${u.actif ? "badge-blue" : "badge-gray"}">${u.actif ? "Actif" : "Désactivé"}</span></td>
        <td class="row-actions">
          ${isAdmin && u.id !== profile.id
            ? `<button class="btn btn-sm save-user-btn">Enregistrer</button>
               <button class="btn btn-sm btn-danger toggle-actif-btn">${u.actif ? "Désactiver" : "Activer"}</button>`
            : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".save-user-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        const role = row.querySelector(".role-select").value;
        const { error } = await supabase.from("profiles").update({ role }).eq("id", row.dataset.id);
        if (error) showToast("Erreur : " + error.message, "error");
        else {
          showToast("Rôle mis à jour.", "success");
          loadUsers();
        }
      })
    );
    tbody.querySelectorAll(".toggle-actif-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        const user = data.find((u) => u.id === row.dataset.id);
        const { error } = await supabase.from("profiles").update({ actif: !user.actif }).eq("id", user.id);
        if (error) showToast("Erreur : " + error.message, "error");
        else {
          showToast(user.actif ? "Utilisateur désactivé." : "Utilisateur activé.", "success");
          loadUsers();
        }
      })
    );
  }

  async function sendInvitation(e) {
    e.preventDefault();
    const msg = document.getElementById("invite-msg");
    msg.textContent = "";
    const email = document.getElementById("invite-email").value.trim();
    const role = document.getElementById("invite-role").value;

    const { error } = await supabase.from("invitations").insert({
      company_id: profile.company_id,
      email,
      role,
      invited_by: profile.id,
    });

    if (error) {
      msg.textContent = "Erreur : " + error.message;
      msg.className = "form-msg error";
      return;
    }
    msg.textContent = "Invitation créée.";
    msg.className = "form-msg success";
    document.getElementById("invite-form").reset();
    loadInvitations();
  }

  async function loadInvitations() {
    const tbody = document.getElementById("invitations-tbody");
    const { data, error } = await supabase
      .from("invitations")
      .select("email, role, used")
      .order("created_at", { ascending: false });
    if (error) {
      tbody.innerHTML = `<tr><td colspan="3">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="3">Aucune invitation.</td></tr>`;
      return;
    }
    tbody.innerHTML = data
      .map(
        (i) => `<tr>
          <td>${escapeHtml(i.email)}</td>
          <td>${escapeHtml(ROLE_LABELS[i.role] || i.role)}</td>
          <td><span class="badge ${i.used ? "badge-blue" : "badge-gray"}">${i.used ? "Utilisée" : "En attente"}</span></td>
        </tr>`
      )
      .join("");
  }
}
