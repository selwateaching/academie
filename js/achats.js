import { requireAuth, canWrite, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const STATUT_LABELS = { demande: "Demande", commandee: "Commandée", livree: "Livrée", receptionnee: "Réceptionnée", annulee: "Annulée" };

function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "achats");
  main(profile);
}

async function main(profile) {
  const canW = canWrite(profile.role);
  const canD = canDelete(profile.role);

  const tbody = document.getElementById("po-tbody");
  const emptyMsg = document.getElementById("empty-msg");
  const searchInput = document.getElementById("search");
  const statutFilter = document.getElementById("filter-statut");
  const newBtn = document.getElementById("new-btn");

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("po-form");
  const modalTitle = document.getElementById("modal-title");
  const formMsg = document.getElementById("form-msg");
  const cancelBtn = document.getElementById("cancel-btn");
  const supplierSelect = document.getElementById("supplier_id");
  const projectSelect = document.getElementById("project_id");
  const itemsTbody = document.getElementById("items-tbody");
  const addItemBtn = document.getElementById("add-item-btn");

  if (!canW) newBtn.style.display = "none";

  let orders = [];

  async function loadOptions() {
    const [{ data: suppliersData }, { data: projectsData }] = await Promise.all([
      supabase.from("suppliers").select("id, entreprise").order("entreprise"),
      supabase.from("projects").select("id, nom").order("nom"),
    ]);
    supplierSelect.innerHTML =
      `<option value="">— Choisir —</option>` +
      (suppliersData || []).map((s) => `<option value="${s.id}">${escapeHtml(s.entreprise)}</option>`).join("");
    projectSelect.innerHTML =
      `<option value="">— Aucun —</option>` +
      (projectsData || []).map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
  }

  async function loadOrders() {
    tbody.innerHTML = `<tr><td colspan="7">Chargement…</td></tr>`;
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*, suppliers(entreprise), projects(nom)")
      .order("created_at", { ascending: false });
    if (error) {
      tbody.innerHTML = `<tr><td colspan="7">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    orders = data || [];
    render();
  }

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const statut = statutFilter.value;
    const rows = orders.filter((o) => {
      if (statut && o.statut !== statut) return false;
      if (!q) return true;
      return [o.numero, o.suppliers?.entreprise].join(" ").toLowerCase().includes(q);
    });

    if (rows.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    tbody.innerHTML = rows
      .map(
        (o) => `
      <tr data-id="${o.id}">
        <td>${escapeHtml(o.numero)}</td>
        <td>${escapeHtml(o.suppliers?.entreprise || "—")}</td>
        <td>${escapeHtml(o.projects?.nom || "—")}</td>
        <td>${o.date_livraison_prevue || "—"}</td>
        <td>${fmtMoney(o.total_ht)}</td>
        <td>
          ${canW
            ? `<select class="status-select" data-id="${o.id}">${Object.entries(STATUT_LABELS)
                .map(([v, l]) => `<option value="${v}" ${v === o.statut ? "selected" : ""}>${l}</option>`)
                .join("")}</select>`
            : `<span class="badge badge-blue">${STATUT_LABELS[o.statut]}</span>`}
        </td>
        <td class="row-actions">
          ${canW ? `<button class="btn btn-sm edit-btn">Modifier</button>` : ""}
          ${canD ? `<button class="btn btn-sm btn-danger delete-btn">Supprimer</button>` : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".status-select").forEach((sel) =>
      sel.addEventListener("change", async (e) => {
        const { error } = await supabase.from("purchase_orders").update({ statut: e.target.value }).eq("id", sel.dataset.id);
        if (error) showToast("Erreur : " + error.message, "error");
        else loadOrders();
      })
    );
    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => openModal(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => deleteOrder(rows.find((r) => r.id === e.target.closest("tr").dataset.id)))
    );
  }

  searchInput.addEventListener("input", render);
  statutFilter.addEventListener("change", render);

  function addItemRow(item) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="desc"><input class="it-desc" value="${escapeHtml(item?.description || "")}" required /></td>
      <td><input class="it-qty" type="number" step="0.01" value="${item?.quantite ?? 1}" /></td>
      <td><input class="it-pu" type="number" step="0.01" value="${item?.prix_unitaire ?? 0}" /></td>
      <td><button type="button" class="btn btn-sm btn-danger remove-item-btn">✕</button></td>
    `;
    tr.querySelectorAll("input").forEach((el) => el.addEventListener("input", recalcTotal));
    tr.querySelector(".remove-item-btn").addEventListener("click", () => {
      tr.remove();
      recalcTotal();
    });
    itemsTbody.appendChild(tr);
  }

  function readItems() {
    return Array.from(itemsTbody.querySelectorAll("tr")).map((tr) => ({
      description: tr.querySelector(".it-desc").value.trim(),
      quantite: parseFloat(tr.querySelector(".it-qty").value) || 0,
      prix_unitaire: parseFloat(tr.querySelector(".it-pu").value) || 0,
    }));
  }

  function recalcTotal() {
    const total = readItems().reduce((s, it) => s + it.quantite * it.prix_unitaire, 0);
    document.getElementById("total-ht").textContent = fmtMoney(total);
    return total;
  }
  addItemBtn.addEventListener("click", () => addItemRow(null));

  async function openModal(order) {
    form.reset();
    formMsg.textContent = "";
    itemsTbody.innerHTML = "";
    document.getElementById("po-id").value = order?.id || "";
    modalTitle.textContent = order ? `Modifier la commande ${order.numero}` : "Nouvelle commande";
    supplierSelect.value = order?.supplier_id || "";
    projectSelect.value = order?.project_id || "";
    document.getElementById("date_commande").value = order?.date_commande || new Date().toISOString().slice(0, 10);
    document.getElementById("date_livraison_prevue").value = order?.date_livraison_prevue || "";
    document.getElementById("notes").value = order?.notes || "";

    if (order) {
      const { data: items } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", order.id).order("ordre");
      (items || []).forEach((it) => addItemRow(it));
    }
    if (itemsTbody.children.length === 0) addItemRow(null);
    recalcTotal();
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
    if (!supplierSelect.value) {
      formMsg.textContent = "Le fournisseur est obligatoire.";
      formMsg.className = "form-msg error";
      return;
    }
    const items = readItems().filter((it) => it.description);
    if (items.length === 0) {
      formMsg.textContent = "Ajoute au moins une ligne.";
      formMsg.className = "form-msg error";
      return;
    }
    const total = recalcTotal();
    const id = document.getElementById("po-id").value;

    const payload = {
      supplier_id: supplierSelect.value,
      project_id: projectSelect.value || null,
      date_commande: document.getElementById("date_commande").value || null,
      date_livraison_prevue: document.getElementById("date_livraison_prevue").value || null,
      notes: document.getElementById("notes").value.trim(),
      total_ht: total,
    };

    let poId = id;
    let error;
    if (id) {
      ({ error } = await supabase.from("purchase_orders").update(payload).eq("id", id));
    } else {
      const { data: numero, error: numError } = await supabase.rpc("next_po_number", { p_company_id: profile.company_id });
      if (numError) {
        formMsg.textContent = "Erreur de numérotation : " + numError.message;
        formMsg.className = "form-msg error";
        return;
      }
      payload.numero = numero;
      payload.company_id = profile.company_id;
      payload.created_by = profile.id;
      const { data: inserted, error: insError } = await supabase.from("purchase_orders").insert(payload).select().single();
      error = insError;
      poId = inserted?.id;
    }

    if (!error && poId) {
      await supabase.from("purchase_order_items").delete().eq("purchase_order_id", poId);
      const itemsPayload = items.map((it, i) => ({ ...it, purchase_order_id: poId, company_id: profile.company_id, ordre: i }));
      ({ error } = await supabase.from("purchase_order_items").insert(itemsPayload));
    }

    if (error) {
      formMsg.textContent = "Erreur : " + error.message;
      formMsg.className = "form-msg error";
      return;
    }

    closeModal();
    showToast(id ? "Commande modifiée." : "Commande enregistrée.", "success");
    loadOrders();
  });

  async function deleteOrder(order) {
    if (!confirmDelete(order.numero)) return;
    const { error } = await supabase.from("purchase_orders").delete().eq("id", order.id);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    showToast("Commande supprimée.", "success");
    loadOrders();
  }

  await loadOptions();
  await loadOrders();
}
