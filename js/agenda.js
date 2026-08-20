import { requireAuth, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const TYPE_LABELS = {
  client: "Rendez-vous client",
  visite_chantier: "Visite de chantier",
  reunion: "Réunion",
  livraison: "Livraison",
  intervention: "Intervention",
  fournisseur: "Rendez-vous fournisseur",
  autre: "Autre",
};

function clientLabel(c) {
  if (!c) return null;
  return c.type === "entreprise" ? c.entreprise || "(sans nom)" : `${c.prenom || ""} ${c.nom || ""}`.trim();
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "agenda");
  main(profile);
}

async function main(profile) {
  const canD = canDelete(profile.role);

  const listEl = document.getElementById("appt-list");
  const fromInput = document.getElementById("filter-from");
  const toInput = document.getElementById("filter-to");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("appt-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const clientSelect = document.getElementById("client_id");
  const projectSelect = document.getElementById("project_id");

  const today = new Date();
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  fromInput.value = today.toISOString().slice(0, 10);
  toInput.value = in30.toISOString().slice(0, 10);

  let appts = [];

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

  async function loadAppointments() {
    listEl.innerHTML = `<p class="empty-state">Chargement…</p>`;
    const from = fromInput.value ? new Date(fromInput.value + "T00:00:00").toISOString() : null;
    const to = toInput.value ? new Date(toInput.value + "T23:59:59").toISOString() : null;

    let query = supabase.from("appointments").select("*, clients(type, nom, prenom, entreprise), projects(nom)").order("date_debut");
    if (from) query = query.gte("date_debut", from);
    if (to) query = query.lte("date_debut", to);

    const { data, error } = await query;
    if (error) {
      listEl.innerHTML = `<p class="empty-state">Erreur : ${escapeHtml(error.message)}</p>`;
      return;
    }
    appts = data || [];
    render();
  }

  function render() {
    if (appts.length === 0) {
      listEl.innerHTML = `<p class="empty-state">Aucun rendez-vous sur cette période.</p>`;
      return;
    }

    const groups = {};
    appts.forEach((a) => {
      const day = a.date_debut.slice(0, 10);
      (groups[day] = groups[day] || []).push(a);
    });

    listEl.innerHTML = Object.keys(groups)
      .sort()
      .map((day) => {
        const label = new Date(day + "T00:00:00").toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        const cards = groups[day]
          .map((a) => {
            const time = new Date(a.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            const metaParts = [TYPE_LABELS[a.type], clientLabel(a.clients), a.projects?.nom, a.lieu].filter(Boolean);
            return `
          <div class="appt-card" data-id="${a.id}">
            <div class="appt-time">${time}</div>
            <div class="appt-info">
              <div class="appt-title">${escapeHtml(a.titre)}</div>
              <div class="appt-meta">${escapeHtml(metaParts.join(" · "))}</div>
            </div>
            <div class="row-actions">
              <button class="btn btn-sm edit-btn">Modifier</button>
              ${canD ? `<button class="btn btn-sm btn-danger delete-btn">Supprimer</button>` : ""}
            </div>
          </div>`;
          })
          .join("");
        return `<div class="day-group"><h3>${label}</h3>${cards}</div>`;
      })
      .join("");

    listEl.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(appts.find((a) => a.id === e.target.closest(".appt-card").dataset.id)))
    );
    listEl.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => deleteAppt(appts.find((a) => a.id === e.target.closest(".appt-card").dataset.id)))
    );
  }

  fromInput.addEventListener("change", loadAppointments);
  toInput.addEventListener("change", loadAppointments);

  function toLocalInput(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openModal(appt) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("appt-id").value = appt?.id || "";
    modalTitle.textContent = appt ? "Modifier le rendez-vous" : "Nouveau rendez-vous";

    document.getElementById("titre").value = appt?.titre || "";
    document.getElementById("type").value = appt?.type || "client";
    document.getElementById("lieu").value = appt?.lieu || "";
    document.getElementById("date_debut").value = toLocalInput(appt?.date_debut) || toLocalInput(new Date().toISOString());
    document.getElementById("date_fin").value = toLocalInput(appt?.date_fin);
    clientSelect.value = appt?.client_id || "";
    projectSelect.value = appt?.project_id || "";
    document.getElementById("notes").value = appt?.notes || "";

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
    const debut = document.getElementById("date_debut").value;
    if (!titre || !debut) {
      formMsg.textContent = "Le titre et la date de début sont obligatoires.";
      formMsg.className = "form-msg error";
      return;
    }

    const id = document.getElementById("appt-id").value;
    const fin = document.getElementById("date_fin").value;
    const payload = {
      titre,
      type: document.getElementById("type").value,
      lieu: document.getElementById("lieu").value.trim(),
      date_debut: new Date(debut).toISOString(),
      date_fin: fin ? new Date(fin).toISOString() : null,
      client_id: clientSelect.value || null,
      project_id: projectSelect.value || null,
      notes: document.getElementById("notes").value.trim(),
    };

    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;

    let error;
    if (id) {
      ({ error } = await supabase.from("appointments").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("appointments").insert(payload));
    }

    saveBtn.disabled = false;

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    closeModal();
    showToast(id ? "Rendez-vous modifié." : "Rendez-vous enregistré.", "success");
    loadAppointments();
  });

  async function deleteAppt(appt) {
    if (!confirmDelete(appt.titre)) return;
    const { error } = await supabase.from("appointments").delete().eq("id", appt.id);
    if (error) {
      showToast("Erreur lors de la suppression : " + error.message, "error");
      return;
    }
    showToast("Rendez-vous supprimé.", "success");
    loadAppointments();
  }

  await loadOptions();
  await loadAppointments();
}
