import { requireAuth, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const CATEGORIE_LABELS = {
  contrat: "Contrat",
  devis: "Devis",
  facture: "Facture",
  assurance: "Assurance",
  attestation: "Attestation",
  plan: "Plan",
  photo: "Photo",
  bon_commande: "Bon de commande",
  bon_livraison: "Bon de livraison",
  document_salarie: "Document salarié",
  document_chantier: "Document chantier",
  document_fournisseur: "Document fournisseur",
  autre: "Autre",
};

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "documents");
  main(profile);
}

async function main(profile) {
  const canD = canDelete(profile.role);

  const tbody = document.getElementById("docs-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const categorieFilter = document.getElementById("filter-categorie");
  const projectSelect = document.getElementById("project_id");
  const clientSelect = document.getElementById("client_id");
  const uploadForm = document.getElementById("upload-form");
  const uploadMsg = document.getElementById("upload-msg");
  const uploadBtn = document.getElementById("upload-btn");

  let docs = [];

  async function loadOptions() {
    const [{ data: projectsData }, { data: clientsData }] = await Promise.all([
      supabase.from("projects").select("id, nom").order("nom"),
      supabase.from("clients").select("id, type, nom, prenom, entreprise").order("nom"),
    ]);
    projectSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (projectsData || []).map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
    clientSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (clientsData || [])
        .map((c) => `<option value="${c.id}">${escapeHtml(c.type === "entreprise" ? c.entreprise : `${c.prenom || ""} ${c.nom || ""}`.trim())}</option>`)
        .join("");
  }

  async function loadDocs() {
    tbody.innerHTML = `<tr><td colspan="6">Chargement…</td></tr>`;
    const { data, error } = await supabase
      .from("documents")
      .select("*, projects(nom), clients(type, nom, prenom, entreprise)")
      .order("created_at", { ascending: false });
    if (error) {
      tbody.innerHTML = `<tr><td colspan="6">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    docs = data || [];
    render();
  }

  function clientLabel(c) {
    if (!c) return "—";
    return c.type === "entreprise" ? c.entreprise || "" : `${c.prenom || ""} ${c.nom || ""}`.trim();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const cat = categorieFilter.value;
    const rows = docs.filter((d) => {
      if (cat && d.categorie !== cat) return false;
      if (!q) return true;
      return d.nom.toLowerCase().includes(q);
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map(
        (d) => `
      <tr data-id="${d.id}">
        <td>${escapeHtml(d.nom)}</td>
        <td><span class="badge badge-blue">${CATEGORIE_LABELS[d.categorie] || d.categorie}</span></td>
        <td>${escapeHtml(d.projects?.nom || "—")}</td>
        <td>${escapeHtml(clientLabel(d.clients))}</td>
        <td>${new Date(d.created_at).toLocaleDateString("fr-FR")}</td>
        <td class="row-actions">
          <button class="btn btn-sm download-btn">Télécharger</button>
          ${canD ? `<button class="btn btn-sm btn-danger delete-btn">Supprimer</button>` : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".download-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => downloadDoc(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => deleteDoc(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
  }

  searchInput.addEventListener("input", render);
  categorieFilter.addEventListener("change", render);

  async function downloadDoc(doc) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 60);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function deleteDoc(doc) {
    if (!confirmDelete(doc.nom)) return;
    const { error: storageError } = await supabase.storage.from("documents").remove([doc.storage_path]);
    if (storageError) {
      showToast("Erreur : " + storageError.message, "error");
      return;
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    showToast("Document supprimé.", "success");
    loadDocs();
  }

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadMsg.textContent = "";
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    const categorie = document.getElementById("categorie").value;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${profile.company_id}/${categorie}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
    if (uploadError) {
      uploadBtn.disabled = false;
      uploadMsg.textContent = "Erreur d'envoi : " + uploadError.message;
      uploadMsg.className = "form-msg error";
      return;
    }

    const { error } = await supabase.from("documents").insert({
      company_id: profile.company_id,
      categorie,
      nom: file.name,
      storage_path: storagePath,
      taille: file.size,
      type_mime: file.type,
      project_id: projectSelect.value || null,
      client_id: clientSelect.value || null,
      uploaded_by: profile.id,
    });

    uploadBtn.disabled = false;

    if (error) {
      uploadMsg.textContent = "Erreur : " + error.message;
      uploadMsg.className = "form-msg error";
      return;
    }

    uploadForm.reset();
    showToast("Document ajouté.", "success");
    loadDocs();
  });

  await loadOptions();
  await loadDocs();
}
