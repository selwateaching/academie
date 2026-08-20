// Génération de PDF professionnels (devis, factures) avec jsPDF.
// jsPDF est chargé en CDN classique (voir <script> dans les pages),
// donc disponible ici via window.jspdf.

function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function clientLabel(c) {
  if (!c) return "";
  return c.type === "entreprise" ? c.entreprise || "" : `${c.prenom || ""} ${c.nom || ""}`.trim();
}

// docType: "DEVIS" ou "FACTURE"
export function generateDocumentPDF({ company, client, project, doc, items, docType }) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 15;
  let y = 18;

  pdf.setFontSize(16);
  pdf.setFont(undefined, "bold");
  pdf.text(company.nom_commercial || company.raison_sociale || "Entreprise", marginX, y);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  y += 6;
  const companyLines = [
    company.adresse,
    [company.code_postal, company.ville].filter(Boolean).join(" "),
    company.telephone,
    company.email,
    company.siret ? `SIRET : ${company.siret}` : null,
    company.numero_tva ? `N° TVA : ${company.numero_tva}` : null,
  ].filter(Boolean);
  companyLines.forEach((line) => {
    pdf.text(line, marginX, y);
    y += 4.5;
  });

  pdf.setFontSize(20);
  pdf.setFont(undefined, "bold");
  pdf.text(docType, pageWidth - marginX, 20, { align: "right" });
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);
  pdf.text(`N° ${doc.numero}`, pageWidth - marginX, 27, { align: "right" });
  pdf.text(`Date : ${doc.date_emission}`, pageWidth - marginX, 32, { align: "right" });
  if (docType === "DEVIS") {
    pdf.text(`Validité : ${doc.validite_jours} jours`, pageWidth - marginX, 37, { align: "right" });
  }
  if (project?.nom) {
    pdf.text(`Chantier : ${project.nom}`, pageWidth - marginX, 42, { align: "right" });
  }

  y = Math.max(y, 44) + 6;

  pdf.setFillColor(244, 246, 248);
  pdf.rect(marginX, y, 85, 32, "F");
  pdf.setFontSize(9);
  pdf.setFont(undefined, "bold");
  pdf.text("Client", marginX + 3, y + 6);
  pdf.setFont(undefined, "normal");
  const clientLines = [
    clientLabel(client),
    client.adresse,
    [client.code_postal, client.ville].filter(Boolean).join(" "),
    client.telephone,
    client.email,
  ].filter(Boolean);
  let cy = y + 12;
  clientLines.forEach((line) => {
    pdf.text(String(line), marginX + 3, cy);
    cy += 4.5;
  });

  y += 40;

  // ---- Tableau des lignes ----
  const colX = { desc: marginX, qty: marginX + 90, unit: marginX + 108, pu: marginX + 125, tva: marginX + 150, total: pageWidth - marginX };
  pdf.setFillColor(30, 58, 138);
  pdf.rect(marginX, y, pageWidth - 2 * marginX, 7, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8.5);
  pdf.setFont(undefined, "bold");
  pdf.text("Désignation", colX.desc + 2, y + 5);
  pdf.text("Qté", colX.qty, y + 5);
  pdf.text("Unité", colX.unit, y + 5);
  pdf.text("PU HT", colX.pu, y + 5);
  pdf.text("TVA", colX.tva, y + 5);
  pdf.text("Total HT", colX.total, y + 5, { align: "right" });
  pdf.setTextColor(0, 0, 0);
  pdf.setFont(undefined, "normal");
  y += 10;

  items.forEach((item, i) => {
    const base = item.quantite * item.prix_unitaire * (1 - item.remise_pct / 100);
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
    if (i % 2 === 0) {
      pdf.setFillColor(250, 250, 251);
      pdf.rect(marginX, y - 4.5, pageWidth - 2 * marginX, 7, "F");
    }
    const descLines = pdf.splitTextToSize(item.description || "", 85);
    pdf.text(descLines, colX.desc + 2, y);
    pdf.text(String(item.quantite), colX.qty, y);
    pdf.text(item.unite || "", colX.unit, y);
    pdf.text(fmtMoney(item.prix_unitaire), colX.pu, y);
    pdf.text(`${item.taux_tva}%`, colX.tva, y);
    pdf.text(fmtMoney(base), colX.total, y, { align: "right" });
    y += Math.max(6, descLines.length * 4.5);
  });

  y += 4;
  pdf.setDrawColor(220, 220, 220);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  const totalsX = pageWidth - marginX - 55;
  pdf.setFontSize(9.5);
  pdf.text("Total HT", totalsX, y);
  pdf.text(fmtMoney(doc.total_ht), pageWidth - marginX, y, { align: "right" });
  y += 5.5;
  pdf.text("Total TVA", totalsX, y);
  pdf.text(fmtMoney(doc.total_tva), pageWidth - marginX, y, { align: "right" });
  y += 5.5;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(11);
  pdf.text("Total TTC", totalsX, y);
  pdf.text(fmtMoney(doc.total_ttc), pageWidth - marginX, y, { align: "right" });
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9.5);
  y += 10;

  if (doc.acompte_pct) {
    pdf.text(
      `Acompte demandé : ${doc.acompte_pct}% soit ${fmtMoney((doc.total_ttc * doc.acompte_pct) / 100)}`,
      marginX,
      y
    );
    y += 6;
  }

  if (doc.conditions_paiement) {
    pdf.setFont(undefined, "bold");
    pdf.text("Conditions de paiement", marginX, y);
    pdf.setFont(undefined, "normal");
    y += 5;
    const condLines = pdf.splitTextToSize(doc.conditions_paiement, pageWidth - 2 * marginX);
    pdf.text(condLines, marginX, y);
    y += condLines.length * 4.5 + 4;
  }

  if (company.iban) {
    pdf.text(`IBAN : ${company.iban}${company.bic ? "  BIC : " + company.bic : ""}`, marginX, y);
    y += 6;
  }

  // ---- Pied de page (mentions légales) ----
  pdf.setFontSize(7.5);
  pdf.setTextColor(120, 120, 120);
  const footerParts = [
    company.assurance_decennale ? `Assurance décennale : ${company.assurance_decennale}` : null,
    company.rc_professionnelle ? `RC pro : ${company.rc_professionnelle}` : null,
  ].filter(Boolean);
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (footerParts.length) pdf.text(footerParts.join("  —  "), marginX, pageHeight - 14);
  if (company.mentions_legales) {
    const mentionsLines = pdf.splitTextToSize(company.mentions_legales, pageWidth - 2 * marginX);
    pdf.text(mentionsLines, marginX, pageHeight - 9);
  }

  return pdf;
}
