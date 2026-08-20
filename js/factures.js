import { requireAuth, canWriteInvoices, canDeleteInvoices } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { generateDocumentPDF } from "./pdf.js";

const STATUT_LABELS = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  partiellement_payee: "Partiellement payée",
  payee: "Payée",
  annulee: "Annulée",
};
const TYPE_LABELS = { classique: "Classique", acompte: "Acompte", situation: "Situation", finale: "Finale", avoir: "Avoir" };
const ITEM_TYPE_LABELS = { prestation: "Prestation", materiau: "Matériau", main_oeuvre: "Main d'œuvre" };
const MOYEN_LABELS = { virement: "Virement", cheque: "Chèque", especes: "Espèces", carte: "Carte", prelevement: "Prélèvement", autre: "Autre" };

function clientLabel(c) {
  if (!c) return "—";
  return c.type === "entreprise" ? c.entreprise || "(sans nom)" : `${c.prenom || ""} ${c.nom || ""}`.trim();
}
function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function isLate(invoice, reste) {
  return (
    invoice.date_echeance &&
    reste > 0.001 &&
    !["payee", "annulee"].includes(invoice.statut) &&
    new Date(invoice.date_echeance) < new Date(new Date().toDateString())
  );
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "factures");
  main(profile);
}

async function main(profile) {
  const canW = canWriteInvoices(profile.role);
  const canD = canDeleteInvoices(profile.role);

  const tbody = document.getElementById("invoices-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const statutFilter = document.getElementById("filter-statut");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("invoice-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const clientSelect = document.getElementById("client_id");
  const projectSelect = document.getElementById("project_id");
  const typeSelect = document.getElementById("type");
  const itemsTbody = document.getElementById("items-tbody");
  const addItemBtn = document.getElementById("add-item-btn");
  const paymentsBox = document.getElementById("payments-box");
  const paymentsTbody = document.getElementById("payments-tbody");

  if (!canW) newBtn.style.display = "none";

  let invoices = [];
  let invoicesReste = {}; // id -> reste à payer
  let currentPayments = [];
  let currentInvoiceId = null;

  async function loadOptions() {
    const [{ data: clientsData }, { data: projectsData }] = await Promise.all([
      supabase.from("clients").select("id, type, nom, prenom, entreprise").order("nom"),
      supabase.from("projects").select("id, nom").order("nom"),
    ]);
    clientSelect.innerHTML =
      `<option value="">— Choisir —</option>` +
      (clientsData || []).map((c) => `<option value="${c.id}">${escapeHtml(clientLabel(c))}</option>`).join("");
    projectSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (projectsData || []).map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
  }

  async function loadInvoices() {
    tbody.innerHTML = `<tr><td colspan="8">Chargement…</td></tr>`;
    const [{ data, error }, { data: paymentsData }] = await Promise.all([
      supabase.from("invoices").select("*, clients(type, nom, prenom, entreprise)").order("created_at", { ascending: false }),
      supabase.from("payments").select("invoice_id, montant"),
    ]);

    if (error) {
      tbody.innerHTML = `<tr><td colspan="8">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    invoices = data || [];
    invoicesReste = {};
    invoices.forEach((inv) => (invoicesReste[inv.id] = inv.total_ttc));
    (paymentsData || []).forEach((p) => {
      invoicesReste[p.invoice_id] = (invoicesReste[p.invoice_id] ?? 0) - p.montant;
    });
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const statut = statutFilter.value;

    const rows = invoices.filter((inv) => {
      if (statut && inv.statut !== statut) return false;
      if (!q) return true;
      return [inv.numero, clientLabel(inv.clients)].join(" ").toLowerCase().includes(q);
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map((inv) => {
        const reste = invoicesReste[inv.id] ?? inv.total_ttc;
        const late = isLate(inv, reste);
        return `
      <tr data-id="${inv.id}">
        <td>${escapeHtml(inv.numero)}</td>
        <td>${TYPE_LABELS[inv.type] || inv.type}</td>
        <td>${escapeHtml(clientLabel(inv.clients))}</td>
        <td>${inv.date_echeance || "—"}</td>
        <td>${fmtMoney(inv.total_ttc)}</td>
        <td>${fmtMoney(reste)}</td>
        <td>
          ${late ? `<span class="badge" style="background:#fee2e2;color:#991b1b;">En retard</span>` : ""}
          ${canW
            ? `<select class="status-select" data-id="${inv.id}">${Object.entries(STATUT_LABELS)
                .map(([val, label]) => `<option value="${val}" ${val === inv.statut ? "selected" : ""}>${label}</option>`)
                .join("")}</select>`
            : `<span class="badge badge-blue">${STATUT_LABELS[inv.statut] || inv.statut}</span>`}
        </td>
        <td class="row-actions">
          <button class="btn btn-sm pdf-btn">PDF</button>
          ${canW ? `<button class="btn btn-sm edit-btn">Modifier</button>` : ""}
          ${canD ? `<button class="btn btn-sm btn-danger delete-btn">Supprimer</button>` : ""}
        </td>
      </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".status-select").forEach((sel) =>
      sel.addEventListener("change", async (e) => {
        const { error } = await supabase.from("invoices").update({ statut: e.target.value }).eq("id", sel.dataset.id);
        if (error) showToast("Erreur : " + error.message, "error");
        else {
          showToast("Statut mis à jour.", "success");
          loadInvoices();
        }
      })
    );
    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => deleteInvoice(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
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
          ${Object.entries(ITEM_TYPE_LABELS).map(([v, l]) => `<option value="${v}" ${item?.type === v ? "selected" : ""}>${l}</option>`).join("")}
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
    updateResteAPayer(ht + tva);
    return { ht, tva, ttc: ht + tva };
  }

  addItemBtn.addEventListener("click", () => addItemRow(null));

  // ---------------- Paiements ----------------
  function updateResteAPayer(ttc) {
    const paye = currentPayments.reduce((s, p) => s + Number(p.montant), 0);
    document.getElementById("reste-a-payer").textContent = fmtMoney(ttc - paye);
  }

  function renderPayments(ttc) {
    paymentsTbody.innerHTML = currentPayments
      .map(
        (p) => `
      <tr data-id="${p.id}">
        <td>${p.date_paiement}</td>
        <td>${fmtMoney(p.montant)}</td>
        <td>${MOYEN_LABELS[p.moyen_paiement] || p.moyen_paiement}</td>
        <td><button type="button" class="btn btn-sm btn-danger remove-payment-btn">✕</button></td>
      </tr>`
      )
      .join("");
    paymentsTbody.querySelectorAll(".remove-payment-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) {
          showToast("Erreur : " + error.message, "error");
          return;
        }
        currentPayments = currentPayments.filter((p) => p.id !== id);
        renderPayments(ttc);
        updateResteAPayer(ttc);
      })
    );
    updateResteAPayer(ttc);
  }

  document.getElementById("add-payment-btn").addEventListener("click", async () => {
    const montant = parseFloat(document.getElementById("pay-montant").value);
    const date = document.getElementById("pay-date").value || new Date().toISOString().slice(0, 10);
    const moyen = document.getElementById("pay-moyen").value;
    if (!montant || montant <= 0 || !currentInvoiceId) return;

    const { data, error } = await supabase
      .from("payments")
      .insert({
        invoice_id: currentInvoiceId,
        company_id: profile.company_id,
        montant,
        date_paiement: date,
        moyen_paiement: moyen,
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    currentPayments.push(data);
    const ttc = parseFloat(document.getElementById("total-ttc").textContent.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
    renderPayments(ttc);
    document.getElementById("pay-montant").value = "";
    showToast("Paiement enregistré.", "success");

    // Met à jour automatiquement le statut selon le reste à payer.
    const reste = ttc - currentPayments.reduce((s, p) => s + Number(p.montant), 0);
    const newStatut = reste <= 0.01 ? "payee" : "partiellement_payee";
    await supabase.from("invoices").update({ statut: newStatut }).eq("id", currentInvoiceId);
  });

  // ---------------- Modale ----------------
  async function openModal(invoice, draft) {
    form.reset();
    formMsg.textContent = "";
    itemsTbody.innerHTML = "";
    currentPayments = [];
    currentInvoiceId = invoice?.id || null;
    document.getElementById("invoice-id").value = invoice?.id || "";
    modalTitle.textContent = invoice ? `Modifier la facture ${invoice.numero}` : "Nouvelle facture";

    clientSelect.value = invoice?.client_id || draft?.client_id || "";
    projectSelect.value = invoice?.project_id || draft?.project_id || "";
    typeSelect.value = invoice?.type || "classique";
    document.getElementById("date_emission").value = invoice?.date_emission || new Date().toISOString().slice(0, 10);
    document.getElementById("date_echeance").value = invoice?.date_echeance || "";
    document.getElementById("conditions_paiement").value =
      invoice?.conditions_paiement ?? draft?.conditions_paiement ?? "Paiement à réception de facture.";
    document.getElementById("notes").value = invoice?.notes || draft?.notes || "";

    if (invoice) {
      const [{ data: items }, { data: payments }] = await Promise.all([
        supabase.from("invoice_items").select("*").eq("invoice_id", invoice.id).order("ordre"),
        supabase.from("payments").select("*").eq("invoice_id", invoice.id).order("date_paiement"),
      ]);
      (items || []).forEach((it) => addItemRow(it));
      currentPayments = payments || [];
      paymentsBox.style.display = "block";
    } else if (draft) {
      (draft.items || []).forEach((it) => addItemRow(it));
      paymentsBox.style.display = "none";
    } else {
      paymentsBox.style.display = "none";
    }
    if (itemsTbody.children.length === 0) addItemRow(null);

    const totals = recalcTotals();
    if (invoice) renderPayments(totals.ttc);

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
    const id = document.getElementById("invoice-id").value;
    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;

    const payload = {
      client_id: clientSelect.value,
      project_id: projectSelect.value || null,
      type: typeSelect.value,
      date_emission: document.getElementById("date_emission").value,
      date_echeance: document.getElementById("date_echeance").value || null,
      conditions_paiement: document.getElementById("conditions_paiement").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      total_ht: totals.ht,
      total_tva: totals.tva,
      total_ttc: totals.ttc,
    };

    let invoiceId = id;
    let error;

    if (id) {
      ({ error } = await supabase.from("invoices").update(payload).eq("id", id));
    } else {
      const prefix = payload.type === "avoir" ? "AV" : "FAC";
      const { data: numero, error: numError } = await supabase.rpc("next_invoice_number", {
        p_company_id: profile.company_id,
        p_prefix: prefix,
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
      const draftQuoteId = window.__draftQuoteId || null;
      if (draftQuoteId) payload.quote_id = draftQuoteId;
      const { data: inserted, error: insError } = await supabase.from("invoices").insert(payload).select().single();
      error = insError;
      invoiceId = inserted?.id;
    }

    if (!error && invoiceId) {
      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
      const itemsPayload = items.map((it, i) => ({ ...it, invoice_id: invoiceId, company_id: profile.company_id, ordre: i }));
      ({ error } = await supabase.from("invoice_items").insert(itemsPayload));
    }

    saveBtn.disabled = false;

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    window.__draftQuoteId = null;
    closeModal();
    showToast(id ? "Facture modifiée." : "Facture enregistrée.", "success");
    loadInvoices();
  });

  async function deleteInvoice(invoice) {
    if (!confirmDelete(invoice.numero)) return;
    const { error } = await supabase.from("invoices").delete().eq("id", invoice.id);
    if (error) {
      showToast("Erreur lors de la suppression : " + error.message, "error");
      return;
    }
    showToast("Facture supprimée.", "success");
    loadInvoices();
  }

  async function exportPDF(invoice) {
    const [{ data: company }, { data: client }, { data: items }, { data: project }] = await Promise.all([
      supabase.from("companies").select("*").eq("id", profile.company_id).single(),
      supabase.from("clients").select("*").eq("id", invoice.client_id).single(),
      supabase.from("invoice_items").select("*").eq("invoice_id", invoice.id).order("ordre"),
      invoice.project_id
        ? supabase.from("projects").select("nom").eq("id", invoice.project_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const pdf = generateDocumentPDF({
      company,
      client,
      project,
      doc: invoice,
      items: items || [],
      docType: invoice.type === "avoir" ? "AVOIR" : "FACTURE",
    });
    pdf.save(`${invoice.numero}.pdf`);
  }

  await loadOptions();
  await loadInvoices();

  // Facture pré-remplie depuis un devis accepté (voir js/devis.js).
  const draftRaw = sessionStorage.getItem("draftInvoiceFromQuote");
  if (draftRaw) {
    sessionStorage.removeItem("draftInvoiceFromQuote");
    const draft = JSON.parse(draftRaw);
    window.__draftQuoteId = draft.quote_id || null;
    openModal(null, draft);
  }
}
