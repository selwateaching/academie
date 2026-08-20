import { requireAuth } from "./auth.js";
import { renderShell, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "rapports");
  main(profile);
}

async function main() {
  const [
    { data: projects },
    { data: invoices },
    { data: movements },
    { data: materials },
    { data: hours },
    { data: profiles },
    { data: purchaseOrders },
    { data: expenses },
  ] = await Promise.all([
    supabase.from("projects").select("id, nom"),
    supabase.from("invoices").select("project_id, type, total_ht, date_emission"),
    supabase.from("stock_movements").select("project_id, material_id, quantite, type").eq("type", "sortie"),
    supabase.from("materials").select("id, prix_achat"),
    supabase.from("employee_hours").select("project_id, profile_id, heures_normales, heures_supplementaires"),
    supabase.from("profiles").select("id, taux_horaire"),
    supabase.from("purchase_orders").select("project_id, total_ht"),
    supabase.from("expenses").select("project_id, montant"),
  ]);

  const materialsMap = Object.fromEntries((materials || []).map((m) => [m.id, m.prix_achat || 0]));
  const profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.taux_horaire || 0]));

  function sumByProject(rows, projectKey, valueFn) {
    const map = {};
    (rows || []).forEach((r) => {
      const pid = r[projectKey];
      if (!pid) return;
      map[pid] = (map[pid] || 0) + valueFn(r);
    });
    return map;
  }

  const caMap = {};
  (invoices || []).forEach((inv) => {
    if (!inv.project_id) return;
    const sign = inv.type === "avoir" ? -1 : 1;
    caMap[inv.project_id] = (caMap[inv.project_id] || 0) + sign * Number(inv.total_ht);
  });

  const materiauxMap = sumByProject(movements, "project_id", (m) => Number(m.quantite) * (materialsMap[m.material_id] || 0));
  const mainOeuvreMap = sumByProject(
    hours,
    "project_id",
    (h) => (Number(h.heures_normales) + Number(h.heures_supplementaires)) * (profilesMap[h.profile_id] || 0)
  );
  const achatsMap = sumByProject(purchaseOrders, "project_id", (po) => Number(po.total_ht));
  const depensesMap = sumByProject(expenses, "project_id", (e) => Number(e.montant));

  const rows = (projects || []).map((p) => {
    const ca = caMap[p.id] || 0;
    const materiaux = materiauxMap[p.id] || 0;
    const mainOeuvre = mainOeuvreMap[p.id] || 0;
    const achats = achatsMap[p.id] || 0;
    const depenses = depensesMap[p.id] || 0;
    const marge = ca - materiaux - mainOeuvre - achats - depenses;
    const pct = ca > 0 ? (marge / ca) * 100 : null;
    return { nom: p.nom, ca, materiaux, mainOeuvre, achats, depenses, marge, pct };
  });

  const tbody = document.getElementById("rentabilite-tbody");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">Aucun chantier avec des données à analyser pour le moment.</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr class="${r.pct !== null && r.pct < 10 ? "marge-alerte" : ""}">
        <td>${escapeHtml(r.nom)}</td>
        <td>${fmtMoney(r.ca)}</td>
        <td>${fmtMoney(r.materiaux)}</td>
        <td>${fmtMoney(r.mainOeuvre)}</td>
        <td>${fmtMoney(r.achats)}</td>
        <td>${fmtMoney(r.depenses)}</td>
        <td class="${r.marge >= 0 ? "marge-positive" : "marge-negative"}">${fmtMoney(r.marge)}</td>
        <td>${r.pct !== null ? r.pct.toFixed(1) + " %" : "—"}</td>
      </tr>`
      )
      .join("");
  }

  document.getElementById("export-csv-btn").addEventListener("click", () => {
    const header = ["Chantier", "CA facturé", "Matériaux", "Main d'œuvre", "Achats", "Autres dépenses", "Marge", "% marge"];
    const lines = [header.join(";")].concat(
      rows.map((r) =>
        [r.nom, r.ca, r.materiaux, r.mainOeuvre, r.achats, r.depenses, r.marge, r.pct !== null ? r.pct.toFixed(1) : ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";")
      )
    );
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rentabilite_chantiers.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------------- CA par mois ----------------
  const caParMois = {};
  (invoices || []).forEach((inv) => {
    const mois = (inv.date_emission || "").slice(0, 7);
    if (!mois) return;
    const sign = inv.type === "avoir" ? -1 : 1;
    caParMois[mois] = (caParMois[mois] || 0) + sign * Number(inv.total_ht);
  });
  const caTbody = document.getElementById("ca-tbody");
  const moisTries = Object.keys(caParMois).sort().reverse();
  caTbody.innerHTML = moisTries.length
    ? moisTries.map((m) => `<tr><td>${m}</td><td>${fmtMoney(caParMois[m])}</td></tr>`).join("")
    : `<tr><td colspan="2">Aucune facture émise pour le moment.</td></tr>`;
}
