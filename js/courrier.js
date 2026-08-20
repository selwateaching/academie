import { requireAuth, canWrite, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const STATUT_LABELS = { a_traiter: "À traiter", en_cours: "En cours", traite: "Traité", archive: "Archivé" };
const PRIORITE_COLORS = { basse: "badge-gray", normale: "badge-blue", haute: "badge-amber", urgente: "badge-red" };

function clientLabel(c) {
  if (!c) return null;
  return c.type === "entreprise" ? c.entreprise || "" : `${c.prenom || ""} ${c.nom || ""}`.trim();
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "courrier");
  main(profile);
}

async function main(profile) {
  const canW = canWrite(profile.role);
  const canD = canDelete(profile.role);

  const tbody = document.getElementById("mails-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const directionFilter = document.getElementById("filter-direction");
  const statutFilter = document.getElementById("filter-statut");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("mail-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const deleteBtn = document.getElementById("delete-btn");
  const mailtoBtn = document.getElementById("mailto-btn");
  const clientSelect = document.getElementById("client_id");
  const projectSelect = document.getElementById("project_id");

  if (!canW) newBtn.style.display = "none";

  let mails = [];

  async function loadOptions() {
    const [{ data: clientsData }, { data: projectsData }] = await Promise.all([
      supabase.from("clients").select("id, type, nom, prenom, entreprise").order("nom"),
      supabase.from("projects").select("id, nom").order("nom"),
    ]);
    clientSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (clientsData || []).map((c) => `<option value="${c.id}">${escapeHtml(clientLabel(c))}</option>`).join("");
    projectSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (projectsData || []).map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
  }

  async function loadMails() {
    tbody.innerHTML = `<tr><td colspan="7">Chargement…</td></tr>`;
    const { data, error } = await supabase.from("mails").select("*").order("date", { ascending: false });
    if (error) {
      tbody.innerHTML = `<tr><td colspan="7">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    mails = data || [];
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const direction = directionFilter.value;
    const statut = statutFilter.value;
    const rows = mails.filter((m) => {
      if (direction && m.direction !== direction) return false;
      if (statut && m.statut !== statut) return false;
      if (!q) return true;
      return [m.objet, m.contact].join(" ").toLowerCase().includes(q);
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map(
        (m) => `
      <tr data-id="${m.id}">
        <td>${m.date}</td>
        <td><span class="badge ${m.direction === "entrant" ? "badge-blue" : "badge-gray"}">${m.direction === "entrant" ? "Entrant" : "Sortant"}</span></td>
        <td>${escapeHtml(m.objet)}</td>
        <td>${escapeHtml(m.contact || "—")}</td>
        <td><span class="badge ${PRIORITE_COLORS[m.priorite]}">${m.priorite}</span></td>
        <td>${STATUT_LABELS[m.statut]}</td>
        <td class="row-actions">
          <button class="btn btn-sm edit-btn">${canW ? "Modifier" : "Voir"}</button>
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
  }

  [searchInput, directionFilter, statutFilter].forEach((el) => el.addEventListener("input", render));

  function openModal(mail) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("mail-id").value = mail?.id || "";
    modalTitle.textContent = mail ? "Modifier le courrier" : "Nouveau courrier";
    form.direction.value = mail?.direction || "entrant";
    document.getElementById("objet").value = mail?.objet || "";
    document.getElementById("contact").value = mail?.contact || "";
    document.getElementById("email_contact").value = mail?.email_contact || "";
    document.getElementById("date").value = mail?.date || new Date().toISOString().slice(0, 10);
    document.getElementById("priorite").value = mail?.priorite || "normale";
    clientSelect.value = mail?.client_id || "";
    projectSelect.value = mail?.project_id || "";
    document.getElementById("statut").value = mail?.statut || "a_traiter";
    document.getElementById("notes").value = mail?.notes || "";
    deleteBtn.style.display = mail && canD ? "inline-flex" : "none";
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

  mailtoBtn.addEventListener("click", () => {
    const to = document.getElementById("email_contact").value.trim();
    const subject = "RE: " + (document.getElementById("objet").value || "");
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}`;
    window.open(url, "_blank");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const objet = document.getElementById("objet").value.trim();
    if (!objet) {
      formMsg.textContent = "L'objet est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }
    const id = document.getElementById("mail-id").value;
    const payload = {
      direction: form.direction.value,
      objet,
      contact: document.getElementById("contact").value.trim(),
      email_contact: document.getElementById("email_contact").value.trim(),
      date: document.getElementById("date").value,
      priorite: document.getElementById("priorite").value,
      client_id: clientSelect.value || null,
      project_id: projectSelect.value || null,
      statut: document.getElementById("statut").value,
      notes: document.getElementById("notes").value.trim(),
    };
    let error;
    if (id) {
      ({ error } = await supabase.from("mails").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("mails").insert(payload));
    }
    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }
    closeModal();
    showToast(id ? "Courrier modifié." : "Courrier enregistré.", "success");
    loadMails();
  });

  deleteBtn.addEventListener("click", async () => {
    const id = document.getElementById("mail-id").value;
    const mail = mails.find((m) => m.id === id);
    if (!mail || !confirmDelete(mail.objet)) return;
    const { error } = await supabase.from("mails").delete().eq("id", id);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    closeModal();
    showToast("Courrier supprimé.", "success");
    loadMails();
  });

  await loadOptions();
  await loadMails();
}
