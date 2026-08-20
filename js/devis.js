import { requireAuth, canWrite, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { generateDocumentPDF } from "./pdf.js";

const STATUT_LABELS = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  consulte: "Consulté",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
  annule: "Annulé",
};

const TYPE_LABELS = { prestation: "Prestation", materiau: "Matériau", main_oeuvre: "Main d'œuvre" };

function clientLabel(c) {
  if (!c) return "—";
  return c.type === "entreprise" ? c.entreprise || "(sans nom)" : `${c.prenom || ""} ${c.nom || ""}`.trim();
}
function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "devis");
  main(profile);
}

async function main(profile) {
  const canW = canWrite(profile.role);
  const canD = canDelete(profile.role);

  const tbody = document.getElementById("quotes-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const statutFilter = document.getElementById("filter-statut");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("quote-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const clientSelect = document.getElementById("client_id");
  const projectSelect = document.getElementById("project_id");
  const itemsTbody = document.getElementById("items-tbody");
  const addItemBtn = document.getElementById("add-item-btn");

  if (!canW) newBtn.style.display = "none";

  let quotes = [];
  let clients = [];
  let projects = [];

  async function loadOptions() {
    const [{ data: clientsData }, { data: projectsData }] = await Promise.all([
      supabase.from("clients").select("id, type, nom, prenom, entreprise").order("nom"),
      supabase.from("projects").select("id, nom").order("nom"),
    ]);
    clients = clientsData || [];
    projects = projectsData || [];
    clientSelect.innerHTML =
      `<option value="">— Choisir —</option>` +
      clients.map((c) => `<option value="${c.id}">${escapeHtml(clientLabel(c))}</option>`).join("");
    projectSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      projects.map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
  }

  async function loadQuotes() {
    tbody.innerHTML = `<tr><td colspan="6">Chargement…</td></tr>`;
    const { data, error } = await supabase
      .from("quotes")
      .select("*, clients(type, nom, prenom, entreprise)")
      .order("created_at", { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="6">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    quotes = data || [];
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const statut = statutFilter.value;

    const rows = quotes.filter((d) => {
      if (statut && d.statut !== statut) return false;
      if (!q) return true;
      const haystack = [d.numero, clientLabel(d.clients)].join(" ").toLowerCase();
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
        (d) => `
      <tr data-id="${d.id}">
        <td>${escapeHtml(d.numero)}</td>
        <td>${escapeHtml(clientLabel(d.clients))}</td>
        <td>${d.date_emission || "—"}</td>
        <td>${fmtMoney(d.total_ttc)}</td>
        <td>
          ${canW
            ? `<select class="status-select" data-id="${d.id}">${Object.entries(STATUT_LABELS)
                .map(([val, label]) => `<option value="${val}" ${val === d.statut ? "selected" : ""}>${label}</option>`)
                .join("")}</select>`
            : `<span class="badge badge-blue">${STATUT_LABELS[d.statut] || d.statut}</span>`}
        </td>
        <td class="row-actions">
          <button class="btn btn-sm pdf-btn">PDF</button>
          ${canW ? `<button class="btn btn-sm edit-btn">Modifier</button>` : ""}
          ${canD ? `<button class="btn btn-sm btn-danger delete-btn">Supprimer</button>` : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".status-select").forEach((sel) =>
      sel.addEventListener("change", async (e) => {
        const { error } = await supabase.from("quotes").update({ statut: e.target.value }).eq("id", sel.dataset.id);
        if (error) showToast("Erreur : " + error.message, "error");
        else {
          showToast("Statut mis à jour.", "success");
          loadQuotes();
        }
      })
    );
    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const d = rows.find((r) => r.id === e.target.closest("tr").dataset.id);
        deleteQuote(d);
      })
    );
    tbody.querySelectorAll(".pdf-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => exportPDF(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
  }

  searchInput.addEventListener("input", render);
  statutFilter.addEventListener("change", render);

  // ---------------- Lignes dynamiques ----------------
  function addItemRow(item) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <select class="it-type">
          ${Object.entries(TYPE_LABELS).map(([v, l]) => `<option value="${v}" ${item?.type === v ? "selected" : ""}>${l}</option>`).join("")}
        </select>
      </td>
      <td class="desc"><input class="it-desc" value="${escapeHtml(item?.description || "")}" required /></td>
      <td class="num"><input class="it-qty" type="number" step="0.01" value="${item?.quantite ?? 1}" /></td>
      <td class="num"><input class="it-unit" value="${escapeHtml(item?.unite || "u")}" /></td>
      <td class="num"><input class="it-pu" type="number" step="0.01" value="${item?.prix_unitaire ?? 0}" /></td>
      <td class="num"><input class="it-remise" type="number" step="0.01" value="${item?.remise_pct ?? 0}" /></td>
      <td class="num"><input class="it-tva" type="number" step="0.1" value="${item?.taux_tva ?? 20}" /></td>
      <td><button type="button" class="btn btn-sm btn-danger remove-item-btn">✕</button></td>
    `;
    tr.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", recalcTotals));
    tr.querySelector(".remove-item-btn").addEventListener("click", () => {
      tr.remove();
      recalcTotals();
    });
    itemsTbody.appendChild(tr);
  }

  function readItems() {
    return Array.from(itemsTbody.querySelectorAll("tr")).map((tr) => ({
      type: tr.querySelector(".it-type").value,
      description: tr.querySelector(".it-desc").value.trim(),
      quantite: parseFloat(tr.querySelector(".it-qty").value) || 0,
      unite: tr.querySelector(".it-unit").value.trim() || "u",
      prix_unitaire: parseFloat(tr.querySelector(".it-pu").value) || 0,
      remise_pct: parseFloat(tr.querySelector(".it-remise").value) || 0,
      taux_tva: parseFloat(tr.querySelector(".it-tva").value) || 0,
    }));
  }

  function recalcTotals() {
    const items = readItems();
    let ht = 0,
      tva = 0;
    items.forEach((it) => {
      const base = it.quantite * it.prix_unitaire * (1 - it.remise_pct / 100);
      ht += base;
      tva += base * (it.taux_tva / 100);
    });
    document.getElementById("total-ht").textContent = fmtMoney(ht);
    document.getElementById("total-tva").textContent = fmtMoney(tva);
    document.getElementById("total-ttc").textContent = fmtMoney(ht + tva);
    return { ht, tva, ttc: ht + tva };
  }

  addItemBtn.addEventListener("click", () => addItemRow(null));

  // ---------------- Modale ----------------
  async function openModal(quote) {
    form.reset();
    formMsg.textContent = "";
    itemsTbody.innerHTML = "";
    document.getElementById("quote-id").value = quote?.id || "";
    modalTitle.textContent = quote ? `Modifier le devis ${quote.numero}` : "Nouveau devis";

    clientSelect.value = quote?.client_id || "";
    projectSelect.value = quote?.project_id || "";
    document.getElementById("date_emission").value = quote?.date_emission || new Date().toISOString().slice(0, 10);
    document.getElementById("validite_jours").value = quote?.validite_jours ?? 30;
    document.getElementById("acompte_pct").value = quote?.acompte_pct ?? 0;
    document.getElementById("conditions_paiement").value =
      quote?.conditions_paiement ?? "Acompte à la commande, solde à la livraison.";
    document.getElementById("notes").value = quote?.notes || "";

    if (quote) {
      const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("ordre");
      (items || []).forEach((it) => addItemRow(it));
    }
    if (itemsTbody.children.length === 0) addItemRow(null);
    recalcTotals();

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

    if (!clientSelect.value) {
      formMsg.textContent = "Le client est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }
    const items = readItems().filter((it) => it.description);
    if (items.length === 0) {
      formMsg.textContent = "Ajoute au moins une ligne avec une désignation.";
      formMsg.className = "form-msg error";
      return;
    }

    const totals = recalcTotals();
    const id = document.getElementById("quote-id").value;
    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;

    const payload = {
      client_id: clientSelect.value,
      project_id: projectSelect.value || null,
      date_emission: document.getElementById("date_emission").value,
      validite_jours: parseInt(document.getElementById("validite_jours").value, 10) || 30,
      acompte_pct: parseFloat(document.getElementById("acompte_pct").value) || 0,
      conditions_paiement: document.getElementById("conditions_paiement").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      total_ht: totals.ht,
      total_tva: totals.tva,
      total_ttc: totals.ttc,
    };

    let quoteId = id;
    let error;

    if (id) {
      ({ error } = await supabase.from("quotes").update(payload).eq("id", id));
    } else {
      const { data: numero, error: numError } = await supabase.rpc("next_quote_number", {
        p_company_id: profile.company_id,
      });
      if (numError) {
        saveBtn.disabled = false;
        formMsg.textContent = "Erreur de numérotation : " + numError.message;
        formMsg.className = "form-msg error";
        return;
      }
      payload.numero = numero;
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      const { data: inserted, error: insError } = await supabase.from("quotes").insert(payload).select().single();
      error = insError;
      quoteId = inserted?.id;
    }

    if (!error && quoteId) {
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
      const itemsPayload = items.map((it, i) => ({
        ...it,
        quote_id: quoteId,
        company_id: profile.company_id,
        ordre: i,
      }));
      ({ error } = await supabase.from("quote_items").insert(itemsPayload));
    }

    saveBtn.disabled = false;

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    closeModal();
    showToast(id ? "Devis modifié." : "Devis enregistré.", "success");
    loadQuotes();
  });

  async function deleteQuote(quote) {
    if (!confirmDelete(quote.numero)) return;
    const { error } = await supabase.from("quotes").delete().eq("id", quote.id);
    if (error) {
      showToast("Erreur lors de la suppression : " + error.message, "error");
      return;
    }
    showToast("Devis supprimé.", "success");
    loadQuotes();
  }

  async function exportPDF(quote) {
    const [{ data: company }, { data: client }, { data: items }, { data: project }] = await Promise.all([
      supabase.from("companies").select("*").eq("id", profile.company_id).single(),
      supabase.from("clients").select("*").eq("id", quote.client_id).single(),
      supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("ordre"),
      quote.project_id
        ? supabase.from("projects").select("nom").eq("id", quote.project_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const pdf = generateDocumentPDF({
      company,
      client,
      project,
      doc: quote,
      items: items || [],
      docType: "DEVIS",
    });
    pdf.save(`${quote.numero}.pdf`);
  }

  await loadOptions();
  await loadQuotes();
}
