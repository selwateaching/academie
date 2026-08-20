import { requireAuth, canDelete } from "./auth.js";
import { renderShell, showToast, confirmDelete, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "tresorerie");
  main(profile);
}

async function main(profile) {
  const canW = ["admin", "conducteur", "administratif", "comptable"].includes(profile.role);
  const canD = ["admin", "comptable"].includes(profile.role);

  const fromInput = document.getElementById("filter-from");
  const toInput = document.getElementById("filter-to");
  const tbody = document.getElementById("mvts-tbody");
  const expenseForm = document.getElementById("expense-form");

  if (!canW) expenseForm.style.display = "none";

  const debutMois = new Date();
  debutMois.setDate(1);
  fromInput.value = debutMois.toISOString().slice(0, 10);
  toInput.value = new Date().toISOString().slice(0, 10);
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);

  async function loadData() {
    tbody.innerHTML = `<tr><td colspan="5">Chargement…</td></tr>`;
    const from = fromInput.value;
    const to = toInput.value;

    const [{ data: payments, error: payErr }, { data: expenses, error: expErr }] = await Promise.all([
      supabase.from("payments").select("*").gte("date_paiement", from).lte("date_paiement", to),
      supabase.from("expenses").select("*").gte("date", from).lte("date", to),
    ]);

    if (payErr || expErr) {
      tbody.innerHTML = `<tr><td colspan="5">Erreur de chargement.</td></tr>`;
      return;
    }

    const totalIn = (payments || []).reduce((s, p) => s + Number(p.montant), 0);
    const totalOut = (expenses || []).reduce((s, e) => s + Number(e.montant), 0);
    document.getElementById("kpi-in").textContent = fmtMoney(totalIn);
    document.getElementById("kpi-out").textContent = fmtMoney(totalOut);
    const solde = document.getElementById("kpi-solde");
    solde.textContent = fmtMoney(totalIn - totalOut);
    solde.style.color = totalIn - totalOut >= 0 ? "var(--color-success)" : "var(--color-danger)";

    const rows = [
      ...(payments || []).map((p) => ({
        date: p.date_paiement,
        type: "entree",
        libelle: `Paiement client (${p.moyen_paiement})`,
        montant: p.montant,
        id: p.id,
        source: "payment",
      })),
      ...(expenses || []).map((e) => ({
        date: e.date,
        type: "sortie",
        libelle: e.libelle,
        montant: e.montant,
        id: e.id,
        source: "expense",
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">Aucun mouvement sur cette période.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${r.date}</td>
        <td><span class="badge ${r.type === "entree" ? "badge-green" : "badge-red"}">${r.type === "entree" ? "Entrée" : "Sortie"}</span></td>
        <td>${escapeHtml(r.libelle)}</td>
        <td style="color:${r.type === "entree" ? "var(--color-success)" : "var(--color-danger)"};">
          ${r.type === "entree" ? "+" : "-"}${fmtMoney(r.montant)}
        </td>
        <td class="row-actions">
          ${r.source === "expense" && canD ? `<button class="btn btn-sm btn-danger delete-expense-btn" data-id="${r.id}">Supprimer</button>` : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".delete-expense-btn").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirmDelete("cette dépense")) return;
        const { error } = await supabase.from("expenses").delete().eq("id", btn.dataset.id);
        if (error) showToast("Erreur : " + error.message, "error");
        else {
          showToast("Dépense supprimée.", "success");
          loadData();
        }
      })
    );
  }

  fromInput.addEventListener("change", loadData);
  toInput.addEventListener("change", loadData);

  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      company_id: profile.company_id,
      libelle: document.getElementById("libelle").value.trim(),
      montant: parseFloat(document.getElementById("montant").value),
      date: document.getElementById("date").value,
      categorie: document.getElementById("categorie").value,
      moyen_paiement: document.getElementById("moyen_paiement").value,
      created_by: profile.id,
    };
    if (!payload.libelle || !payload.montant) return;
    const { error } = await supabase.from("expenses").insert(payload);
    if (error) {
      showToast("Erreur : " + error.message, "error");
      return;
    }
    showToast("Dépense enregistrée.", "success");
    expenseForm.reset();
    document.getElementById("date").value = new Date().toISOString().slice(0, 10);
    loadData();
  });

  await loadData();
}
