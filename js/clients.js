import { requireAuth, canWriteClients, canDeleteClients } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "clients");
  main(profile);
}

async function main(profile) {
  const canWrite = canWriteClients(profile.role);
  const canDelete = canDeleteClients(profile.role);

  const tbody = document.getElementById("clients-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const typeFilter = document.getElementById("filter-type");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("client-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const entrepriseGroup = document.getElementById("entreprise-group");
  const siretGroup = document.getElementById("siret-group");

  if (!canWrite) newBtn.style.display = "none";

  let clients = [];
  let sortKey = "nom";
  let sortDir = 1;

  document.querySelectorAll("input[name=type]").forEach((r) =>
    r.addEventListener("change", () => {
      const isEntreprise = form.type.value === "entreprise";
      entrepriseGroup.style.display = isEntreprise ? "block" : "none";
      siretGroup.style.display = isEntreprise ? "flex" : "none";
    })
  );

  async function loadClients() {
    tbody.innerHTML = `<tr><td colspan="6">Chargement…</td></tr>`;
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="6">Erreur de chargement : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    clients = data || [];
    render();
  }

  function displayName(c) {
    return c.type === "entreprise" ? (c.entreprise || "(sans nom)") : `${c.prenom || ""} ${c.nom || ""}`.trim() || "(sans nom)";
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;

    let rows = clients.filter((c) => {
      if (type && c.type !== type) return false;
      if (!q) return true;
      const haystack = [c.nom, c.prenom, c.entreprise, c.email, c.telephone, c.ville].join(" ").toLowerCase();
      return haystack.includes(q);
    });

    rows.sort((a, b) => {
      const av = (sortKey === "nom" ? displayName(a) : a[sortKey] || "").toString().toLowerCase();
      const bv = (sortKey === "nom" ? displayName(b) : b[sortKey] || "").toString().toLowerCase();
      return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map(
        (c) => `
      <tr data-id="${c.id}">
        <td>${escapeHtml(displayName(c))}</td>
        <td><span class="badge ${c.type === "entreprise" ? "badge-blue" : "badge-gray"}">${c.type === "entreprise" ? "Entreprise" : "Particulier"}</span></td>
        <td>${escapeHtml(c.telephone || "—")}</td>
        <td>${escapeHtml(c.email || "—")}</td>
        <td>${escapeHtml(c.ville || "—")}</td>
        <td class="row-actions">
          ${canWrite ? `<button class="btn btn-sm edit-btn">Modifier</button>` : ""}
          ${canDelete ? `<button class="btn btn-sm btn-danger delete-btn">Supprimer</button>` : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const row = e.target.closest("tr");
        const client = rows.find((r) => r.id === row.dataset.id);
        deleteClient(client);
      })
    );
  }

  document.querySelectorAll("th[data-sort]").forEach((th) =>
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      sortDir = sortKey === key ? -sortDir : 1;
      sortKey = key;
      render();
    })
  );

  searchInput.addEventListener("input", render);
  typeFilter.addEventListener("change", render);

  function openModal(client) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("client-id").value = client?.id || "";
    modalTitle.textContent = client ? "Modifier le client" : "Nouveau client";

    form.type.value = client?.type || "particulier";
    document.getElementById("prenom").value = client?.prenom || "";
    document.getElementById("nom").value = client?.nom || "";
    document.getElementById("entreprise").value = client?.entreprise || "";
    document.getElementById("telephone").value = client?.telephone || "";
    document.getElementById("email").value = client?.email || "";
    document.getElementById("adresse").value = client?.adresse || "";
    document.getElementById("code_postal").value = client?.code_postal || "";
    document.getElementById("ville").value = client?.ville || "";
    document.getElementById("siret").value = client?.siret || "";
    document.getElementById("numero_tva").value = client?.numero_tva || "";
    document.getElementById("notes").value = client?.notes || "";

    const isEntreprise = form.type.value === "entreprise";
    entrepriseGroup.style.display = isEntreprise ? "block" : "none";
    siretGroup.style.display = isEntreprise ? "flex" : "none";

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

    const id = document.getElementById("client-id").value;
    const payload = {
      type: form.type.value,
      prenom: document.getElementById("prenom").value.trim(),
      nom: document.getElementById("nom").value.trim(),
      entreprise: document.getElementById("entreprise").value.trim(),
      telephone: document.getElementById("telephone").value.trim(),
      email: document.getElementById("email").value.trim(),
      adresse: document.getElementById("adresse").value.trim(),
      code_postal: document.getElementById("code_postal").value.trim(),
      ville: document.getElementById("ville").value.trim(),
      siret: document.getElementById("siret").value.trim(),
      numero_tva: document.getElementById("numero_tva").value.trim(),
      notes: document.getElementById("notes").value.trim(),
    };

    if (payload.type === "particulier" && !payload.nom) {
      formMsg.textContent = "Le nom est obligatoire pour un particulier.";
      formMsg.className = "form-msg error";
      return;
    }
    if (payload.type === "entreprise" && !payload.entreprise) {
      formMsg.textContent = "Le nom de l'entreprise est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }

    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;

    let error;
    if (id) {
      ({ error } = await supabase.from("clients").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("clients").insert(payload));
    }

    saveBtn.disabled = false;

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    closeModal();
    showToast(id ? "Client modifié." : "Client enregistré.", "success");
    loadClients();
  });

  async function deleteClient(client) {
    if (!confirmDelete(displayName(client))) return;
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) {
      showToast("Erreur lors de la suppression : " + error.message, "error");
      return;
    }
    showToast("Client supprimé.", "success");
    loadClients();
  }

  loadClients();
}
