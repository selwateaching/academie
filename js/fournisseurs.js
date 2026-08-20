import { requireAuth, canWrite, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "fournisseurs");
  main(profile);
}

async function main(profile) {
  const canW = canWrite(profile.role);
  const canD = canDelete(profile.role);

  const tbody = document.getElementById("suppliers-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const newBtn = document.getElementById("new-btn");
  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("supplier-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const deleteBtn = document.getElementById("delete-btn");

  if (!canW) newBtn.style.display = "none";

  let suppliers = [];

  async function loadSuppliers() {
    tbody.innerHTML = `<tr><td colspan="6">Chargement…</td></tr>`;
    const { data, error } = await supabase.from("suppliers").select("*").order("entreprise");
    if (error) {
      tbody.innerHTML = `<tr><td colspan="6">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    suppliers = data || [];
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const rows = suppliers.filter((s) => !q || [s.entreprise, s.contact_nom, s.email].join(" ").toLowerCase().includes(q));

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map(
        (s) => `
      <tr data-id="${s.id}">
        <td>${escapeHtml(s.entreprise)}</td>
        <td>${escapeHtml(s.contact_nom || "—")}</td>
        <td>${escapeHtml(s.telephone || "—")}</td>
        <td>${escapeHtml(s.email || "—")}</td>
        <td>${escapeHtml(s.conditions_paiement || "—")}</td>
        <td class="row-actions">${canW ? `<button class="btn btn-sm edit-btn">Modifier</button>` : ""}</td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
  }

  searchInput.addEventListener("input", render);

  function openModal(s) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("supplier-id").value = s?.id || "";
    modalTitle.textContent = s ? "Modifier le fournisseur" : "Nouveau fournisseur";
    document.getElementById("entreprise").value = s?.entreprise || "";
    document.getElementById("contact_nom").value = s?.contact_nom || "";
    document.getElementById("telephone").value = s?.telephone || "";
    document.getElementById("email").value = s?.email || "";
    document.getElementById("adresse").value = s?.adresse || "";
    document.getElementById("conditions_paiement").value = s?.conditions_paiement || "";
    document.getElementById("notes").value = s?.notes || "";
    deleteBtn.style.display = s && canD ? "inline-flex" : "none";
    overlay.classList.remove("hidden");
  }
  function closeModal() {
    overlay.classList.add("hidden");
  }
  newBtn.addEventListener("click", () => openModal(null));
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("supplier-id").value;
    const entreprise = document.getElementById("entreprise").value.trim();
    if (!entreprise) {
      formMsg.textContent = "Le nom de l'entreprise est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }
    const payload = {
      entreprise,
      contact_nom: document.getElementById("contact_nom").value.trim(),
      telephone: document.getElementById("telephone").value.trim(),
      email: document.getElementById("email").value.trim(),
      adresse: document.getElementById("adresse").value.trim(),
      conditions_paiement: document.getElementById("conditions_paiement").value.trim(),
      notes: document.getElementById("notes").value.trim(),
    };
    let error;
    if (id) {
      ({ error } = await supabase.from("suppliers").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("suppliers").insert(payload));
    }
    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }
    closeModal();
    showToast(id ? "Fournisseur modifié." : "Fournisseur enregistré.", "success");
    loadSuppliers();
  });

  deleteBtn.addEventListener("click", async () => {
    const id = document.getElementById("supplier-id").value;
    const s = suppliers.find((x) => x.id === id);
    if (!s || !confirmDelete(s.entreprise)) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    closeModal();
    showToast("Fournisseur supprimé.", "success");
    loadSuppliers();
  });

  await loadSuppliers();
}
