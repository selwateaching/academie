import { requireAuth, canWrite, canDelete, ROLE_LABELS } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "equipes");
  main(profile);
}

async function main(profile) {
  const isAdmin = profile.role === "admin";
  const canW = canWrite(profile.role);
  const canD = canDelete(profile.role);

  // ---------------- Onglets ----------------
  document.querySelectorAll(".tab-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    })
  );

  let clientsProjects = { projects: [] };

  async function loadSharedOptions() {
    const { data: projectsData } = await supabase.from("projects").select("id, nom").order("nom");
    clientsProjects.projects = projectsData || [];
  }

  // ================= SALARIÉS =================
  const salariesTbody = document.getElementById("salaries-tbody");
  const salarieOverlay = document.getElementById("modal-overlay-salarie");
  const salarieForm = document.getElementById("salarie-form");

  async function loadSalaries() {
    salariesTbody.innerHTML = `<tr><td colspan="6">Chargement…</td></tr>`;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("actif", true)
      .order("nom");
    if (error) {
      salariesTbody.innerHTML = `<tr><td colspan="6">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    salariesTbody.innerHTML = (data || [])
      .map(
        (u) => `
      <tr data-id="${u.id}">
        <td>${escapeHtml(u.prenom || "")} ${escapeHtml(u.nom || "")}</td>
        <td>${escapeHtml(ROLE_LABELS[u.role] || u.role)}</td>
        <td>${escapeHtml(u.poste || "—")}</td>
        <td>${u.taux_horaire ? Number(u.taux_horaire).toLocaleString("fr-FR") + " €/h" : "—"}</td>
        <td>${u.date_embauche || "—"}</td>
        <td class="row-actions">${isAdmin ? `<button class="btn btn-sm edit-salarie-btn">Modifier</button>` : ""}</td>
      </tr>`
      )
      .join("");

    salariesTbody.querySelectorAll(".edit-salarie-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const u = (data || []).find((x) => x.id === e.target.closest("tr").dataset.id);
        openSalarieModal(u);
      })
    );

    // Remplit aussi le sélecteur de salarié dans l'onglet Heures.
    const hProfile = document.getElementById("h-profile");
    hProfile.innerHTML = (data || [])
      .map((u) => `<option value="${u.id}">${escapeHtml(u.prenom || "")} ${escapeHtml(u.nom || "")}</option>`)
      .join("");
  }

  function openSalarieModal(u) {
    document.getElementById("s-id").value = u.id;
    document.getElementById("s-name-label").textContent = `${u.prenom || ""} ${u.nom || ""} — ${ROLE_LABELS[u.role] || u.role}`;
    document.getElementById("s-poste").value = u.poste || "";
    document.getElementById("s-qualification").value = u.qualification || "";
    document.getElementById("s-taux").value = u.taux_horaire ?? "";
    document.getElementById("s-embauche").value = u.date_embauche || "";
    document.getElementById("s-habilitations").value = u.habilitations || "";
    document.getElementById("s-visite").value = u.visite_medicale_date || "";
    document.getElementById("s-msg").textContent = "";
    salarieOverlay.classList.remove("hidden");
  }
  document.getElementById("s-cancel-btn").addEventListener("click", () => salarieOverlay.classList.add("hidden"));
  salarieOverlay.addEventListener("click", (e) => {
    if (e.target === salarieOverlay) salarieOverlay.classList.add("hidden");
  });

  salarieForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("s-id").value;
    const payload = {
      poste: document.getElementById("s-poste").value.trim(),
      qualification: document.getElementById("s-qualification").value.trim(),
      taux_horaire: document.getElementById("s-taux").value || null,
      date_embauche: document.getElementById("s-embauche").value || null,
      habilitations: document.getElementById("s-habilitations").value.trim(),
      visite_medicale_date: document.getElementById("s-visite").value || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", id);
    const msg = document.getElementById("s-msg");
    if (error) {
      msg.textContent = "Erreur : " + error.message;
      msg.className = "form-msg error";
      return;
    }
    salarieOverlay.classList.add("hidden");
    showToast("Fiche salarié mise à jour.", "success");
    loadSalaries();
  });

  // ================= HEURES =================
  const hoursTbody = document.getElementById("hours-tbody");
  const hoursForm = document.getElementById("hours-form");
  document.getElementById("h-date").value = new Date().toISOString().slice(0, 10);

  async function loadHours() {
    hoursTbody.innerHTML = `<tr><td colspan="7">Chargement…</td></tr>`;
    document.getElementById("h-project").innerHTML =
      `<option value="">— Aucun —</option>` +
      clientsProjects.projects.map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");

    const { data, error } = await supabase
      .from("employee_hours")
      .select("*, profiles!employee_hours_profile_id_fkey(nom, prenom), projects(nom)")
      .order("date", { ascending: false })
      .limit(50);
    if (error) {
      hoursTbody.innerHTML = `<tr><td colspan="7">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    hoursTbody.innerHTML = (data || [])
      .map(
        (h) => `
      <tr data-id="${h.id}">
        <td>${h.date}</td>
        <td>${escapeHtml(h.profiles ? `${h.profiles.prenom || ""} ${h.profiles.nom || ""}` : "—")}</td>
        <td>${escapeHtml(h.projects?.nom || "—")}</td>
        <td>${h.heures_normales}</td>
        <td>${h.heures_supplementaires}</td>
        <td>${h.heures_deplacement}</td>
        <td class="row-actions">${canD ? `<button class="btn btn-sm btn-danger delete-hours-btn">Supprimer</button>` : ""}</td>
      </tr>`
      )
      .join("");

    hoursTbody.querySelectorAll(".delete-hours-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        if (!confirmDelete("cette saisie d'heures")) return;
        const { error } = await supabase.from("employee_hours").delete().eq("id", id);
        if (error) showToast("Erreur : " + error.message, "error");
        else {
          showToast("Saisie supprimée.", "success");
          loadHours();
        }
      })
    );
  }

  hoursForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      company_id: profile.company_id,
      profile_id: document.getElementById("h-profile").value,
      project_id: document.getElementById("h-project").value || null,
      date: document.getElementById("h-date").value,
      heures_normales: parseFloat(document.getElementById("h-normales").value) || 0,
      heures_supplementaires: parseFloat(document.getElementById("h-sup").value) || 0,
      heures_deplacement: parseFloat(document.getElementById("h-deplacement").value) || 0,
      notes: document.getElementById("h-notes").value.trim(),
      created_by: profile.id,
    };
    const { error } = await supabase.from("employee_hours").insert(payload);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    showToast("Heures enregistrées.", "success");
    document.getElementById("h-notes").value = "";
    loadHours();
  });

  // ================= SOUS-TRAITANTS =================
  const subsTbody = document.getElementById("subs-tbody");
  const subOverlay = document.getElementById("modal-overlay-sub");
  const subForm = document.getElementById("sub-form");
  const newSubBtn = document.getElementById("new-sub-btn");
  if (!canW) newSubBtn.style.display = "none";

  let subs = [];

  async function loadSubs() {
    subsTbody.innerHTML = `<tr><td colspan="5">Chargement…</td></tr>`;
    const { data, error } = await supabase.from("subcontractors").select("*").order("entreprise");
    if (error) {
      subsTbody.innerHTML = `<tr><td colspan="5">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    subs = data || [];
    subsTbody.innerHTML = subs
      .map(
        (s) => `
      <tr data-id="${s.id}">
        <td>${escapeHtml(s.entreprise)}</td>
        <td>${escapeHtml(s.contact_nom || "—")}</td>
        <td>${escapeHtml(s.telephone || "—")}</td>
        <td>${s.assurance_decennale_expiration || "—"}</td>
        <td class="row-actions">${canW ? `<button class="btn btn-sm edit-sub-btn">Modifier</button>` : ""}</td>
      </tr>`
      )
      .join("");
    subsTbody.querySelectorAll(".edit-sub-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openSubModal(subs.find((s) => s.id === e.target.closest("tr").dataset.id)))
    );
  }

  function openSubModal(s) {
    document.getElementById("sub-id").value = s?.id || "";
    document.getElementById("sub-modal-title").textContent = s ? "Modifier le sous-traitant" : "Nouveau sous-traitant";
    document.getElementById("sub-entreprise").value = s?.entreprise || "";
    document.getElementById("sub-contact").value = s?.contact_nom || "";
    document.getElementById("sub-telephone").value = s?.telephone || "";
    document.getElementById("sub-email").value = s?.email || "";
    document.getElementById("sub-siret").value = s?.siret || "";
    document.getElementById("sub-decennale").value = s?.assurance_decennale || "";
    document.getElementById("sub-decennale-exp").value = s?.assurance_decennale_expiration || "";
    document.getElementById("sub-rc").value = s?.rc_professionnelle || "";
    document.getElementById("sub-notes").value = s?.notes || "";
    document.getElementById("sub-msg").textContent = "";
    document.getElementById("sub-delete-btn").style.display = s && canD ? "inline-flex" : "none";
    subOverlay.classList.remove("hidden");
  }
  document.getElementById("sub-cancel-btn").addEventListener("click", () => subOverlay.classList.add("hidden"));
  subOverlay.addEventListener("click", (e) => {
    if (e.target === subOverlay) subOverlay.classList.add("hidden");
  });
  newSubBtn.addEventListener("click", () => openSubModal(null));

  subForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("sub-id").value;
    const entreprise = document.getElementById("sub-entreprise").value.trim();
    const msg = document.getElementById("sub-msg");
    if (!entreprise) {
      msg.textContent = "Le nom de l'entreprise est obligatoire.";
      msg.className = "form-msg error";
      return;
    }
    const payload = {
      entreprise,
      contact_nom: document.getElementById("sub-contact").value.trim(),
      telephone: document.getElementById("sub-telephone").value.trim(),
      email: document.getElementById("sub-email").value.trim(),
      siret: document.getElementById("sub-siret").value.trim(),
      assurance_decennale: document.getElementById("sub-decennale").value.trim(),
      assurance_decennale_expiration: document.getElementById("sub-decennale-exp").value || null,
      rc_professionnelle: document.getElementById("sub-rc").value.trim(),
      notes: document.getElementById("sub-notes").value.trim(),
    };
    let error;
    if (id) {
      ({ error } = await supabase.from("subcontractors").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("subcontractors").insert(payload));
    }
    if (error) {
      msg.textContent = "Erreur : " + error.message;
      msg.className = "form-msg error";
      return;
    }
    subOverlay.classList.add("hidden");
    showToast(id ? "Sous-traitant modifié." : "Sous-traitant enregistré.", "success");
    loadSubs();
  });

  document.getElementById("sub-delete-btn").addEventListener("click", async () => {
    const id = document.getElementById("sub-id").value;
    const s = subs.find((x) => x.id === id);
    if (!s || !confirmDelete(s.entreprise)) return;
    const { error } = await supabase.from("subcontractors").delete().eq("id", id);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    subOverlay.classList.add("hidden");
    showToast("Sous-traitant supprimé.", "success");
    loadSubs();
  });

  await loadSharedOptions();
  await loadSalaries();
  await loadHours();
  await loadSubs();
}
