"""PDF de devis et de factures (ReportLab)."""

import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROSE = colors.HexColor("#B96B7E")
ROSE_LIGHT = colors.HexColor("#F7E6E3")
INK = colors.HexColor("#3B3536")
MUTED = colors.HexColor("#8A7F80")
GOLD = colors.HexColor("#B8975A")


def _styles():
    base = ParagraphStyle("b", fontName="Helvetica", fontSize=9.5, leading=13, textColor=INK)
    return {
        "base": base,
        "small": ParagraphStyle("s", parent=base, fontSize=8, leading=11, textColor=MUTED),
        "brand": ParagraphStyle("brand", parent=base, fontName="Times-Italic", fontSize=26, leading=28, textColor=ROSE),
        "h": ParagraphStyle("h", parent=base, fontName="Helvetica-Bold", fontSize=11, textColor=ROSE, spaceBefore=10, spaceAfter=4),
        "title": ParagraphStyle("t", parent=base, fontName="Times-Roman", fontSize=18, leading=22),
        "right": ParagraphStyle("r", parent=base, alignment=2),
        "alert": ParagraphStyle("a", parent=base, fontSize=8.5, leading=12, textColor=colors.HexColor("#7a4b3a")),
    }


def euro(v):
    return f"{v:,.2f} €".replace(",", " ").replace(".", ",")


def _fr(d):
    try:
        return datetime.fromisoformat(d).strftime("%d/%m/%Y")
    except (TypeError, ValueError):
        return d or ""


def build(kind, doc, client, inst, extra=None):
    """kind : 'quote' | 'invoice'. doc : dict (items décodés). Retourne les octets du PDF."""
    st = _styles()
    buf = io.BytesIO()
    pdf = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
                            title=f"{'Devis' if kind == 'quote' else 'Facture'} {doc['number']}", author=inst.get("name", ""))
    story = []
    head = Table([[
        [Paragraph(inst.get("name", ""), st["brand"]), Paragraph(inst.get("tagline", ""), st["small"])],
        [Paragraph(f"<b>{'DEVIS' if kind == 'quote' else 'FACTURE'}</b> {doc['number']}", st["right"]),
         Paragraph(f"Émis le {_fr(doc['created_at'])}", ParagraphStyle("rr", parent=st["small"], alignment=2))]]],
        colWidths=[100 * mm, 70 * mm])
    head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story += [head, Spacer(1, 6 * mm)]

    emitter = f"{inst.get('name', '')}<br/>{inst.get('address', '')}<br/>{inst.get('phone', '')} — {inst.get('email', '')}"
    if inst.get("siret"):
        emitter += f"<br/>SIRET {inst['siret']}"
    cl = f"<b>{client['first_name']} {client['last_name']}</b><br/>{client.get('email') or ''}<br/>{client.get('phone') or ''}"
    box = Table([[Paragraph("<b>Émetteur</b><br/>" + emitter, st["base"]), Paragraph("<b>Cliente</b><br/>" + cl, st["base"])]],
                colWidths=[85 * mm, 85 * mm])
    box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), ROSE_LIGHT), ("BOX", (0, 0), (-1, -1), 0, ROSE_LIGHT),
                             ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    story += [box, Spacer(1, 5 * mm)]

    if kind == "quote":
        story.append(Paragraph("Diagnostic beauté & devis", st["title"]))
        if extra and extra.get("service"):
            story.append(Paragraph(f"Prestation demandée : <b>{extra['service']}</b>", st["base"]))
        if extra and extra.get("result_title"):
            story.append(Paragraph(f"Résultat du diagnostic : <b>{extra['result_title']}</b>", st["base"]))
        if doc.get("steps"):
            story.append(Paragraph("Recommandation", st["h"]))
            for i, s in enumerate(doc["steps"], 1):
                story.append(Paragraph(f"{i}. {s}", st["base"]))
        for a in (extra or {}).get("alerts", []):
            story.append(Paragraph(f"• {a}", st["alert"]))
        story.append(Paragraph("Devis", st["h"]))
    else:
        story.append(Paragraph("Détail de la facture", st["title"]))
        story.append(Spacer(1, 3 * mm))

    data = [["Désignation", "Qté", "Prix unit.", "Total"]]
    for it in doc["items"]:
        q = it.get("qty", 1)
        data.append([it["label"] if "label" in it else it["name"], str(q), euro(it["price"]), euro(it["price"] * q)])
    t = Table(data, colWidths=[85 * mm, 15 * mm, 35 * mm, 35 * mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("TEXTCOLOR", (0, 0), (-1, 0), ROSE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, ROSE), ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK), ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, colors.HexColor("#E7D8D4")),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    rows_ = []
    if kind == "invoice" and doc.get("discount"):
        rows_.append(["Remise fidélité", f"- {euro(doc['discount'])}"])
    rows_.append(["Total", euro(doc["total"])])
    if kind == "invoice" and extra:
        rows_.append(["Déjà réglé", euro(extra.get("paid", 0))])
        rows_.append(["Reste à payer", euro(max(0, doc["total"] - extra.get("paid", 0)))])
    tt = Table(rows_, colWidths=[135 * mm, 35 * mm], hAlign="RIGHT")
    tt.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "RIGHT"), ("FONTSIZE", (0, 0), (-1, -1), 10),
                            ("TEXTCOLOR", (0, 0), (-1, -1), INK), ("FONTNAME", (0, len(rows_) - 1 if kind == "quote" else 0), (-1, len(rows_) - 1 if kind == "quote" else 0), "Helvetica-Bold"),
                            ("LINEABOVE", (0, 0), (-1, 0), 0.8, GOLD), ("TOPPADDING", (0, 0), (-1, -1), 5)]))
    story += [tt, Spacer(1, 6 * mm)]

    if kind == "quote":
        story.append(Paragraph(f"Devis valable jusqu'au <b>{_fr(doc['valid_until'])}</b>. Vous pouvez l'accepter ou le refuser en ligne depuis votre espace cliente.", st["base"]))
        if doc.get("notes"):
            story.append(Paragraph(doc["notes"], st["base"]))
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph((extra or {}).get("disclaimer", ""), st["small"]))
    else:
        if inst.get("legal"):
            story.append(Paragraph(inst["legal"], st["small"]))
    pdf.build(story)
    return buf.getvalue()
