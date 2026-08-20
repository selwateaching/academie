import { requireAuth } from "./auth.js";
import { renderShell, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "");
  main();
}

async function main() {
  const container = document.getElementById("notif-container");
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().slice(0, 10);

  const [
    { data: quotesEnvoyes },
    { data: facturesRetard },
    { data: materialsLow },
    { data: chantiersRetard },
    { data: tachesUrgentes },
    { data: subsExpirant },
  ] = await Promise.all([
    supabase.from("quotes").select("id, numero, date_emission").eq("statut", "envoye"),
    supabase.from("invoices").select("id, numero, date_echeance").in("statut", ["envoyee", "partiellement_payee"]).lt("date_echeance", today),
    supabase.from("materials").select("id, designation, quantite_stock, stock_min"),
    supabase.from("projects").select("id, nom").eq("statut", "en_retard"),
    supabase.from("tasks").select("id, titre").eq("priorite", "urgente").neq("statut", "termine"),
    supabase.from("subcontractors").select("id, entreprise, assurance_decennale_expiration").not("assurance_decennale_expiration", "is", null).lte("assurance_decennale_expiration", in30Str),
  ]);

  const lowStock = (materialsLow || []).filter((m) => m.quantite_stock <= m.stock_min);

  const groups = [
    {
      title: "Devis envoyés en attente de réponse",
      items: (quotesEnvoyes || []).map((q) => ({ label: `${q.numero} — émis le ${q.date_emission}`, href: "devis.html" })),
    },
    {
      title: "Factures en retard de paiement",
      items: (facturesRetard || []).map((f) => ({ label: `${f.numero} — échéance dépassée (${f.date_echeance})`, href: "factures.html" })),
    },
    {
      title: "Stock faible",
      items: lowStock.map((m) => ({ label: `${m.designation} — ${m.quantite_stock} restant(s) (min. ${m.stock_min})`, href: "stock.html" })),
    },
    {
      title: "Chantiers en retard",
      items: (chantiersRetard || []).map((p) => ({ label: p.nom, href: "chantiers.html" })),
    },
    {
      title: "Tâches urgentes",
      items: (tachesUrgentes || []).map((t) => ({ label: t.titre, href: "taches.html" })),
    },
    {
      title: "Assurances sous-traitants arrivant à expiration",
      items: (subsExpirant || []).map((s) => ({ label: `${s.entreprise} — expire le ${s.assurance_decennale_expiration}`, href: "equipes.html" })),
    },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    container.innerHTML = `<p class="empty-state">Aucune alerte pour le moment. Tout est à jour !</p>`;
    return;
  }

  container.innerHTML = groups
    .map(
      (g) => `
    <div class="notif-group">
      <h3>${g.title} (${g.items.length})</h3>
      ${g.items.map((it) => `<div class="notif-item"><a href="${it.href}">${escapeHtml(it.label)}</a></div>`).join("")}
    </div>`
    )
    .join("");
}
