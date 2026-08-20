import { requireAuth, canWrite, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const COLUMNS = [
  { key: "nouveau", label: "Nouveau" },
  { key: "contact_pris", label: "Contact pris" },
  { key: "rendez_vous", label: "Rendez-vous" },
  { key: "devis_envoye", label: "Devis envoyé" },
  { key: "relance", label: "Relance" },
  { key: "gagne", label: "Gagné" },
  { key: "perdu", label: "Perdu" },
];

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "prospects");
  main(profile);
}

async function main(profile) {
  const canW = canWrite(profile.role);
  const canD = canDelete(profile.role);

  const kanban = document.getElementById("kanban");
  const newBtn = document.getElementById("new-btn");
  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("prospect-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const deleteBtn = document.getElementById("delete-btn");

  if (!canW) newBtn.style.display = "none";

  let prospects = [];

  function label(p) {
    return p.entreprise || `${p.prenom || ""} ${p.nom || ""}`.trim() || "(sans nom)";
  }

  async function loadProspects() {
    kanban.innerHTML = `<p class="empty-state">Chargement…</p>`;
    const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    if (error) {
      kanban.innerHTML = `<p class="empty-state">Erreur : ${escapeHtml(error.message)}</p>`;
      return;
    }
    prospects = data || [];
    render();
  }

  function render() {
    kanban.innerHTML = COLUMNS.map(
      (col) => `
      <div class="kanban-col" data-statut="${col.key}">
        <h3>${col.label} (${prospects.filter((p) => p.statut === col.key).length})</h3>
        <div class="kanban-cards" data-statut="${col.key}"></div>
      </div>`
    ).join("");

    COLUMNS.forEach((col) => {
      const container = kanban.querySelector(`.kanban-cards[data-statut="${col.key}"]`);
      prospects
        .filter((p) => p.statut === col.key)
        .forEach((p) => {
          const card = document.createElement("div");
          card.className = "prospect-card";
          card.draggable = canW;
          card.dataset.id = p.id;
          card.innerHTML = `
            <div class="p-name">${escapeHtml(label(p))}</div>
            <div class="p-meta">${escapeHtml([p.telephone, p.email].filter(Boolean).join(" · ") || "—")}</div>
          `;
          card.addEventListener("click", () => openModal(p));
          card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", p.id);
          });
          container.appendChild(card);
        });
    });

    if (canW) {
      kanban.querySelectorAll(".kanban-col").forEach((colEl) => {
        colEl.addEventListener("dragover", (e) => {
          e.preventDefault();
          colEl.classList.add("drag-over");
        });
        colEl.addEventListener("dragleave", () => colEl.classList.remove("drag-over"));
        colEl.addEventListener("drop", async (e) => {
          e.preventDefault();
          colEl.classList.remove("drag-over");
          const id = e.dataTransfer.getData("text/plain");
          const newStatut = colEl.dataset.statut;
          const prospect = prospects.find((p) => p.id === id);
          if (!prospect || prospect.statut === newStatut) return;
          const { error } = await supabase.from("prospects").update({ statut: newStatut }).eq("id", id);
          if (error) {
            showToast("Erreur : " + error.message, "error");
            return;
          }
          loadProspects();
        });
      });
    }
  }

  function openModal(prospect) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("prospect-id").value = prospect?.id || "";
    modalTitle.textContent = prospect ? "Modifier le prospect" : "Nouveau prospect";

    document.getElementById("prenom").value = prospect?.prenom || "";
    document.getElementById("nom").value = prospect?.nom || "";
    document.getElementById("entreprise").value = prospect?.entreprise || "";
    document.getElementById("telephone").value = prospect?.telephone || "";
    document.getElementById("email").value = prospect?.email || "";
    document.getElementById("statut").value = prospect?.statut || "nouveau";
    document.getElementById("notes").value = prospect?.notes || "";

    deleteBtn.style.display = prospect && canD ? "inline-flex" : "none";
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
    formMsg.textContent = "";

    const id = document.getElementById("prospect-id").value;
    const payload = {
      prenom: document.getElementById("prenom").value.trim(),
      nom: document.getElementById("nom").value.trim(),
      entreprise: document.getElementById("entreprise").value.trim(),
      telephone: document.getElementById("telephone").value.trim(),
      email: document.getElementById("email").value.trim(),
      statut: document.getElementById("statut").value,
      notes: document.getElementById("notes").value.trim(),
    };
    if (!payload.nom && !payload.entreprise) {
      formMsg.textContent = "Renseigne au moins un nom ou une entreprise.";
      formMsg.className = "form-msg error";
      return;
    }

    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;

    let error;
    if (id) {
      ({ error } = await supabase.from("prospects").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("prospects").insert(payload));
    }

    saveBtn.disabled = false;

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    closeModal();
    showToast(id ? "Prospect modifié." : "Prospect enregistré.", "success");
    loadProspects();
  });

  deleteBtn.addEventListener("click", async () => {
    const id = document.getElementById("prospect-id").value;
    const prospect = prospects.find((p) => p.id === id);
    if (!prospect || !confirmDelete(label(prospect))) return;
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    closeModal();
    showToast("Prospect supprimé.", "success");
    loadProspects();
  });

  await loadProspects();
}
