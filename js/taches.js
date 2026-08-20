import { requireAuth } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const STATUT_LABELS = { a_faire: "À faire", en_cours: "En cours", termine: "Terminé", bloque: "Bloqué" };
const PRIORITE_LABELS = { basse: "Basse", normale: "Normale", haute: "Haute", urgente: "Urgente" };
const PRIORITE_COLORS = { basse: "badge-gray", normale: "badge-blue", haute: "badge-amber", urgente: "badge-red" };

function clientLabel(c) {
  if (!c) return null;
  return c.type === "entreprise" ? c.entreprise || "(sans nom)" : `${c.prenom || ""} ${c.nom || ""}`.trim();
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "taches");
  main(profile);
}

async function main(profile) {
  const tbody = document.getElementById("tasks-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const statutFilter = document.getElementById("filter-statut");
  const prioriteFilter = document.getElementById("filter-priorite");
  const mineFilter = document.getElementById("filter-mine");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("task-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const clientSelect = document.getElementById("client_id");
  const projectSelect = document.getElementById("project_id");
  const assignedSelect = document.getElementById("assigned_to");

  let tasks = [];

  async function loadOptions() {
    const [{ data: clientsData }, { data: projectsData }, { data: usersData }] = await Promise.all([
      supabase.from("clients").select("id, type, nom, prenom, entreprise").order("nom"),
      supabase.from("projects").select("id, nom").order("nom"),
      supabase.from("profiles").select("id, nom, prenom").eq("actif", true),
    ]);
    clientSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (clientsData || []).map((c) => `<option value="${c.id}">${escapeHtml(clientLabel(c))}</option>`).join("");
    projectSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (projectsData || []).map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
    assignedSelect.innerHTML =
      `<option value="">— Non assigné —</option>` +
      (usersData || [])
        .map((u) => `<option value="${u.id}">${escapeHtml(u.prenom || "")} ${escapeHtml(u.nom || "")}</option>`)
        .join("");
  }

  async function loadTasks() {
    tbody.innerHTML = `<tr><td colspan="7">Chargement…</td></tr>`;
    const { data, error } = await supabase
      .from("tasks")
      .select("*, clients(type, nom, prenom, entreprise), projects(nom), assigned:assigned_to(nom, prenom)")
      .order("echeance", { ascending: true, nullsFirst: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="7">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    tasks = data || [];
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const statut = statutFilter.value;
    const priorite = prioriteFilter.value;
    const mine = mineFilter.checked;

    const rows = tasks.filter((t) => {
      if (statut && t.statut !== statut) return false;
      if (priorite && t.priorite !== priorite) return false;
      if (mine && t.assigned_to !== profile.id) return false;
      if (!q) return true;
      return [t.titre, t.description].join(" ").toLowerCase().includes(q);
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map((t) => {
        const lienParts = [clientLabel(t.clients), t.projects?.nom].filter(Boolean);
        return `
      <tr data-id="${t.id}">
        <td>${escapeHtml(t.titre)}</td>
        <td>${escapeHtml(lienParts.join(" / ") || "—")}</td>
        <td>${t.assigned ? escapeHtml(`${t.assigned.prenom || ""} ${t.assigned.nom || ""}`.trim()) : "—"}</td>
        <td>${t.echeance || "—"}</td>
        <td><span class="badge ${PRIORITE_COLORS[t.priorite]}">${PRIORITE_LABELS[t.priorite]}</span></td>
        <td>
          <select class="status-select" data-id="${t.id}">
            ${Object.entries(STATUT_LABELS).map(([v, l]) => `<option value="${v}" ${v === t.statut ? "selected" : ""}>${l}</option>`).join("")}
          </select>
        </td>
        <td class="row-actions">
          <button class="btn btn-sm edit-btn">Modifier</button>
          <button class="btn btn-sm btn-danger delete-btn">Supprimer</button>
        </td>
      </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".status-select").forEach((sel) =>
      sel.addEventListener("change", async (e) => {
        const { error } = await supabase.from("tasks").update({ statut: e.target.value }).eq("id", sel.dataset.id);
        if (error) showToast("Erreur : " + error.message, "error");
        else loadTasks();
      })
    );
    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => deleteTask(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
  }

  [searchInput, statutFilter, prioriteFilter].forEach((el) => el.addEventListener("input", render));
  mineFilter.addEventListener("change", render);

  function openModal(task) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("task-id").value = task?.id || "";
    modalTitle.textContent = task ? "Modifier la tâche" : "Nouvelle tâche";

    document.getElementById("titre").value = task?.titre || "";
    document.getElementById("description").value = task?.description || "";
    document.getElementById("statut").value = task?.statut || "a_faire";
    document.getElementById("priorite").value = task?.priorite || "normale";
    document.getElementById("echeance").value = task?.echeance || "";
    assignedSelect.value = task?.assigned_to || "";
    clientSelect.value = task?.client_id || "";
    projectSelect.value = task?.project_id || "";

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

    const titre = document.getElementById("titre").value.trim();
    if (!titre) {
      formMsg.textContent = "Le titre est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }

    const id = document.getElementById("task-id").value;
    const payload = {
      titre,
      description: document.getElementById("description").value.trim(),
      statut: document.getElementById("statut").value,
      priorite: document.getElementById("priorite").value,
      echeance: document.getElementById("echeance").value || null,
      assigned_to: assignedSelect.value || null,
      client_id: clientSelect.value || null,
      project_id: projectSelect.value || null,
    };

    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;

    let error;
    if (id) {
      ({ error } = await supabase.from("tasks").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("tasks").insert(payload));
    }

    saveBtn.disabled = false;

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    closeModal();
    showToast(id ? "Tâche modifiée." : "Tâche enregistrée.", "success");
    loadTasks();
  });

  async function deleteTask(task) {
    if (!confirmDelete(task.titre)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      showToast("Erreur lors de la suppression : " + error.message, "error");
      return;
    }
    showToast("Tâche supprimée.", "success");
    loadTasks();
  }

  await loadOptions();
  await loadTasks();
}
