import { requireAuth, canWriteClients, canDeleteClients } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

export const STATUT_LABELS = {
  preparation: "Préparation",
  demarrage: "Démarrage",
  en_cours: "En cours",
  en_retard: "En retard",
  suspendu: "Suspendu",
  termine: "Terminé",
  reception: "Réception",
  cloture: "Clôturé",
};

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "chantiers");
  main(profile);
}

async function main(profile) {
  const canWrite = canWriteClients(profile.role);
  const canDelete = canDeleteClients(profile.role);

  const tbody = document.getElementById("projects-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const statutFilter = document.getElementById("filter-statut");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("project-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const clientSelect = document.getElementById("client_id");
  const responsableSelect = document.getElementById("responsable_id");

  if (!canWrite) newBtn.style.display = "none";

  let projects = [];
  let clients = [];

  async function loadOptions() {
    const [{ data: clientsData }, { data: usersData }] = await Promise.all([
      supabase.from("clients").select("id, type, nom, prenom, entreprise").order("nom"),
      supabase.from("profiles").select("id, nom, prenom").eq("actif", true),
    ]);
    clients = clientsData || [];
    clientSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      clients.map((c) => `<option value="${c.id}">${escapeHtml(clientLabel(c))}</option>`).join("");
    responsableSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (usersData || [])
        .map((u) => `<option value="${u.id}">${escapeHtml(u.prenom || "")} ${escapeHtml(u.nom || "")}</option>`)
        .join("");
  }

  function clientLabel(c) {
    return c.type === "entreprise" ? c.entreprise || "(sans nom)" : `${c.prenom || ""} ${c.nom || ""}`.trim();
  }

  async function loadProjects() {
    tbody.innerHTML = `<tr><td colspan="7">Chargement…</td></tr>`;
    const { data, error } = await supabase
      .from("projects")
      .select("*, clients(type, nom, prenom, entreprise)")
      .order("created_at", { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="7">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    projects = data || [];
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const statut = statutFilter.value;

    const rows = projects.filter((p) => {
      if (statut && p.statut !== statut) return false;
      if (!q) return true;
      const haystack = [p.nom, p.adresse, p.clients ? clientLabel(p.clients) : ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map(
        (p) => `
      <tr data-id="${p.id}">
        <td>${escapeHtml(p.nom)}</td>
        <td>${escapeHtml(p.clients ? clientLabel(p.clients) : "—")}</td>
        <td><span class="badge badge-blue">${STATUT_LABELS[p.statut] || p.statut}</span></td>
        <td>${p.date_debut || "—"}</td>
        <td>${p.date_fin_prevue || "—"}</td>
        <td>${p.budget ? Number(p.budget).toLocaleString("fr-FR") + " €" : "—"}</td>
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
        const p = rows.find((r) => r.id === e.target.closest("tr").dataset.id);
        deleteProject(p);
      })
    );
  }

  searchInput.addEventListener("input", render);
  statutFilter.addEventListener("change", render);

  function openModal(project) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("project-id").value = project?.id || "";
    modalTitle.textContent = project ? "Modifier le chantier" : "Nouveau chantier";

    document.getElementById("nom").value = project?.nom || "";
    clientSelect.value = project?.client_id || "";
    document.getElementById("adresse").value = project?.adresse || "";
    document.getElementById("statut").value = project?.statut || "preparation";
    responsableSelect.value = project?.responsable_id || "";
    document.getElementById("date_debut").value = project?.date_debut || "";
    document.getElementById("date_fin_prevue").value = project?.date_fin_prevue || "";
    document.getElementById("budget").value = project?.budget ?? "";

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

    const id = document.getElementById("project-id").value;
    const nom = document.getElementById("nom").value.trim();
    if (!nom) {
      formMsg.textContent = "Le nom du chantier est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }

    const payload = {
      nom,
      client_id: clientSelect.value || null,
      adresse: document.getElementById("adresse").value.trim(),
      statut: document.getElementById("statut").value,
      responsable_id: responsableSelect.value || null,
      date_debut: document.getElementById("date_debut").value || null,
      date_fin_prevue: document.getElementById("date_fin_prevue").value || null,
      budget: document.getElementById("budget").value || null,
    };

    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;

    let error;
    if (id) {
      ({ error } = await supabase.from("projects").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("projects").insert(payload));
    }

    saveBtn.disabled = false;

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    closeModal();
    showToast(id ? "Chantier modifié." : "Chantier enregistré.", "success");
    loadProjects();
  });

  async function deleteProject(project) {
    if (!confirmDelete(project.nom)) return;
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      showToast("Erreur lors de la suppression : " + error.message, "error");
      return;
    }
    showToast("Chantier supprimé.", "success");
    loadProjects();
  }

  await loadOptions();
  await loadProjects();
}
