import { requireAuth, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "stock");
  main(profile);
}

async function main(profile) {
  const canW = ["admin", "conducteur", "administratif", "chef_chantier"].includes(profile.role);
  const canD = canDelete(profile.role);

  const tbody = document.getElementById("materials-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const lowFilter = document.getElementById("filter-low");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("material-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const supplierSelect = document.getElementById("supplier_id");
  const projectSelect = document.getElementById("project_id");

  const mvtOverlay = document.getElementById("modal-overlay-mvt");
  const mvtForm = document.getElementById("mvt-form");
  const mvtProjectSelect = document.getElementById("mvt-project");

  if (!canW) newBtn.style.display = "none";

  let materials = [];

  async function loadOptions() {
    const [{ data: suppliersData }, { data: projectsData }] = await Promise.all([
      supabase.from("suppliers").select("id, entreprise").order("entreprise"),
      supabase.from("projects").select("id, nom").order("nom"),
    ]);
    const supplierOpts =
      `<option value="">— Aucun —</option>` +
      (suppliersData || []).map((s) => `<option value="${s.id}">${escapeHtml(s.entreprise)}</option>`).join("");
    const projectOpts =
      `<option value="">— Aucun —</option>` +
      (projectsData || []).map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
    supplierSelect.innerHTML = supplierOpts;
    projectSelect.innerHTML = projectOpts;
    mvtProjectSelect.innerHTML = projectOpts;
  }

  async function loadMaterials() {
    tbody.innerHTML = `<tr><td colspan="7">Chargement…</td></tr>`;
    const { data, error } = await supabase.from("materials").select("*").order("designation");
    if (error) {
      tbody.innerHTML = `<tr><td colspan="7">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    materials = data || [];
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const low = lowFilter.checked;

    const rows = materials.filter((m) => {
      if (low && !(m.quantite_stock <= m.stock_min)) return false;
      if (!q) return true;
      return [m.reference, m.designation, m.categorie].join(" ").toLowerCase().includes(q);
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map((m) => {
        const isLow = m.quantite_stock <= m.stock_min;
        return `
      <tr data-id="${m.id}">
        <td>${escapeHtml(m.reference || "—")}</td>
        <td>${escapeHtml(m.designation)}</td>
        <td>${escapeHtml(m.categorie || "—")}</td>
        <td>
          ${m.quantite_stock} ${escapeHtml(m.unite)}
          ${isLow ? `<span class="badge" style="background:#fee2e2;color:#991b1b; margin-left:6px;">Stock faible</span>` : ""}
        </td>
        <td>${m.stock_min} ${escapeHtml(m.unite)}</td>
        <td>${escapeHtml(m.emplacement || "—")}</td>
        <td class="row-actions">
          ${canW ? `<button class="btn btn-sm mvt-btn">Mouvement</button>` : ""}
          ${canW ? `<button class="btn btn-sm edit-btn">Modifier</button>` : ""}
          ${canD ? `<button class="btn btn-sm btn-danger delete-btn">Supprimer</button>` : ""}
        </td>
      </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => deleteMaterial(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".mvt-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openMvtModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
  }

  searchInput.addEventListener("input", render);
  lowFilter.addEventListener("change", render);

  function openModal(m) {
    form.reset();
    formMsg.textContent = "";
    document.getElementById("material-id").value = m?.id || "";
    modalTitle.textContent = m ? "Modifier le matériau" : "Nouveau matériau";
    document.getElementById("reference").value = m?.reference || "";
    document.getElementById("designation").value = m?.designation || "";
    document.getElementById("categorie").value = m?.categorie || "";
    document.getElementById("unite").value = m?.unite || "u";
    supplierSelect.value = m?.supplier_id || "";
    document.getElementById("prix_achat").value = m?.prix_achat ?? "";
    document.getElementById("quantite_stock").value = m?.quantite_stock ?? 0;
    document.getElementById("stock_min").value = m?.stock_min ?? 0;
    document.getElementById("emplacement").value = m?.emplacement || "";
    projectSelect.value = m?.project_id || "";
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
    const id = document.getElementById("material-id").value;
    const designation = document.getElementById("designation").value.trim();
    if (!designation) {
      formMsg.textContent = "La désignation est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }
    const payload = {
      reference: document.getElementById("reference").value.trim(),
      designation,
      categorie: document.getElementById("categorie").value.trim(),
      unite: document.getElementById("unite").value.trim() || "u",
      supplier_id: supplierSelect.value || null,
      prix_achat: document.getElementById("prix_achat").value || 0,
      quantite_stock: document.getElementById("quantite_stock").value || 0,
      stock_min: document.getElementById("stock_min").value || 0,
      emplacement: document.getElementById("emplacement").value.trim(),
      project_id: projectSelect.value || null,
    };
    let error;
    if (id) {
      ({ error } = await supabase.from("materials").update(payload).eq("id", id));
    } else {
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      ({ error } = await supabase.from("materials").insert(payload));
    }
    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }
    closeModal();
    showToast(id ? "Matériau modifié." : "Matériau enregistré.", "success");
    loadMaterials();
  });

  async function deleteMaterial(m) {
    if (!confirmDelete(m.designation)) return;
    const { error } = await supabase.from("materials").delete().eq("id", m.id);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    showToast("Matériau supprimé.", "success");
    loadMaterials();
  }

  // ---------------- Mouvements de stock ----------------
  function openMvtModal(m) {
    mvtForm.reset();
    document.getElementById("mvt-msg").textContent = "";
    document.getElementById("mvt-material-id").value = m.id;
    document.getElementById("mvt-title").textContent = `Mouvement — ${m.designation} (stock actuel : ${m.quantite_stock} ${m.unite})`;
    mvtOverlay.classList.remove("hidden");
  }
  document.getElementById("mvt-cancel-btn").addEventListener("click", () => mvtOverlay.classList.add("hidden"));
  mvtOverlay.addEventListener("click", (e) => {
    if (e.target === mvtOverlay) mvtOverlay.classList.add("hidden");
  });

  mvtForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("mvt-msg");
    const materialId = document.getElementById("mvt-material-id").value;
    const type = document.getElementById("mvt-type").value;
    const quantite = parseFloat(document.getElementById("mvt-quantite").value) || 0;
    const material = materials.find((m) => m.id === materialId);

    let newStock = material.quantite_stock;
    if (type === "entree") newStock += quantite;
    else if (type === "sortie") newStock -= quantite;
    else newStock = quantite; // correction = valeur d'inventaire directe

    const { error: updError } = await supabase.from("materials").update({ quantite_stock: newStock }).eq("id", materialId);
    if (updError) {
      msg.textContent = "Erreur : " + updError.message;
      msg.className = "form-msg error";
      return;
    }
    await supabase.from("stock_movements").insert({
      company_id: profile.company_id,
      material_id: materialId,
      type,
      quantite,
      project_id: mvtProjectSelect.value || null,
      notes: document.getElementById("mvt-notes").value.trim(),
      created_by: profile.id,
    });

    mvtOverlay.classList.add("hidden");
    showToast("Mouvement enregistré.", "success");
    loadMaterials();
  });

  await loadOptions();
  await loadMaterials();
}
