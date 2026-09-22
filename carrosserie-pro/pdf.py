"""Génération des PDF (devis / factures / avoirs) au format professionnel,
conforme aux mentions légales françaises usuelles pour un carrossier
(SIRET, TVA intracommunautaire, numérotation séquentielle, pénalités de
retard, indemnité forfaitaire de recouvrement, informations d'assurance)."""

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    HRFlowable,
)

PRIMARY = colors.HexColor("#1f3a5f")
LIGHT_GREY = colors.HexColor("#f2f4f7")
BORDER_GREY = colors.HexColor("#d7dce2")
TEXT_GREY = colors.HexColor("#4a5568")

styles = getSampleStyleSheet()
STYLE_NORMAL = ParagraphStyle("normal9", parent=styles["Normal"], fontSize=9, leading=12.5, textColor=colors.black)
STYLE_SMALL = ParagraphStyle("small8", parent=styles["Normal"], fontSize=7.5, leading=10.5, textColor=TEXT_GREY)
STYLE_LABEL = ParagraphStyle("label8", parent=styles["Normal"], fontSize=8, leading=11, textColor=TEXT_GREY)
STYLE_H1 = ParagraphStyle("h1", parent=styles["Normal"], fontSize=20, leading=24, textColor=PRIMARY, fontName="Helvetica-Bold")
STYLE_H2 = ParagraphStyle("h2", parent=styles["Normal"], fontSize=11, leading=14, textColor=PRIMARY, fontName="Helvetica-Bold")
STYLE_BLOCK_TITLE = ParagraphStyle("blocktitle", parent=styles["Normal"], fontSize=8.5, leading=11, textColor=colors.white, fontName="Helvetica-Bold")
STYLE_RIGHT = ParagraphStyle("right9", parent=STYLE_NORMAL, alignment=TA_RIGHT)
STYLE_FOOTER_TITLE = ParagraphStyle("footertitle", parent=styles["Normal"], fontSize=8, leading=11, fontName="Helvetica-Bold", textColor=PRIMARY)


def _euros(value):
    value = value or 0
    return f"{value:,.2f} €".replace(",", " ").replace(".", ",")


def _p(text, style=STYLE_NORMAL):
    return Paragraph((text or "").replace("\n", "<br/>"), style)


def _entreprise_lignes(entreprise):
    lignes = [entreprise.nom or ""]
    if entreprise.forme_juridique:
        lignes[0] += f" ({entreprise.forme_juridique})"
    if entreprise.adresse:
        lignes.append(entreprise.adresse)
    cp_ville = f"{entreprise.code_postal or ''} {entreprise.ville or ''}".strip()
    if cp_ville:
        lignes.append(cp_ville)
    if entreprise.telephone:
        lignes.append(f"Tél. {entreprise.telephone}")
    if entreprise.email:
        lignes.append(entreprise.email)
    infos_legales = []
    if entreprise.siret:
        infos_legales.append(f"SIRET {entreprise.siret}")
    if entreprise.rcs_ville:
        infos_legales.append(f"RCS {entreprise.rcs_ville}")
    if entreprise.tva_intracom:
        infos_legales.append(f"TVA {entreprise.tva_intracom}")
    if entreprise.capital_social:
        infos_legales.append(f"Capital {entreprise.capital_social}")
    if infos_legales:
        lignes.append(" — ".join(infos_legales))
    return lignes


def _section_title(text):
    t = Table([[Paragraph(text, STYLE_BLOCK_TITLE)]], colWidths=["100%"])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PRIMARY),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return t


def _bloc_client(client):
    lignes = [f"<b>{client.nom_affichage}</b>"]
    if client.type_client == "professionnel" and client.siret:
        lignes.append(f"SIRET {client.siret}")
    if client.adresse:
        lignes.append(client.adresse)
    cp_ville = f"{client.code_postal or ''} {client.ville or ''}".strip()
    if cp_ville:
        lignes.append(cp_ville)
    if client.telephone:
        lignes.append(f"Tél. {client.telephone}")
    if client.email:
        lignes.append(client.email)
    body = "<br/>".join(lignes)
    inner = Table(
        [[_section_title("CLIENT")], [Paragraph(body, STYLE_NORMAL)]],
        colWidths=["100%"],
    )
    inner.setStyle(
        TableStyle(
            [
                ("BOX", (0, 1), (-1, 1), 0.6, BORDER_GREY),
                ("LEFTPADDING", (0, 1), (-1, 1), 8),
                ("RIGHTPADDING", (0, 1), (-1, 1), 8),
                ("TOPPADDING", (0, 1), (-1, 1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
            ]
        )
    )
    return inner


def _bloc_vehicule(vehicule, dossier):
    lignes = [f"<b>{vehicule.marque} {vehicule.modele}</b>"]
    lignes.append(f"Immatriculation : {vehicule.immatriculation}")
    if vehicule.vin:
        lignes.append(f"N° de série (VIN) : {vehicule.vin}")
    if vehicule.kilometrage:
        lignes.append(f"Kilométrage : {vehicule.kilometrage:,} km".replace(",", " "))
    if dossier.reference:
        lignes.append(f"Dossier atelier : {dossier.reference}")
    body = "<br/>".join(lignes)
    inner = Table(
        [[_section_title("VÉHICULE")], [Paragraph(body, STYLE_NORMAL)]],
        colWidths=["100%"],
    )
    inner.setStyle(
        TableStyle(
            [
                ("BOX", (0, 1), (-1, 1), 0.6, BORDER_GREY),
                ("LEFTPADDING", (0, 1), (-1, 1), 8),
                ("RIGHTPADDING", (0, 1), (-1, 1), 8),
                ("TOPPADDING", (0, 1), (-1, 1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
            ]
        )
    )
    return inner


def _bloc_assurance(dossier):
    if not dossier.est_assurance:
        return None
    lignes = []
    if dossier.assureur:
        lignes.append(f"<b>{dossier.assureur.nom}</b>")
    lignes.append(f"Type de sinistre : {dossier.type_sinistre_libelle}")
    if dossier.numero_sinistre:
        lignes.append(f"N° de sinistre : {dossier.numero_sinistre}")
    if dossier.numero_police:
        lignes.append(f"N° de police : {dossier.numero_police}")
    if dossier.date_sinistre:
        lignes.append(f"Date du sinistre : {dossier.date_sinistre.strftime('%d/%m/%Y')}")
    if dossier.expert_nom or dossier.expert_cabinet:
        expert = " — ".join(x for x in [dossier.expert_nom, dossier.expert_cabinet] if x)
        lignes.append(f"Expert : {expert}")
    if dossier.franchise_montant:
        lignes.append(f"Franchise : {_euros(dossier.franchise_montant)}")
    body = "<br/>".join(lignes)
    inner = Table(
        [[_section_title("ASSURANCE / SINISTRE")], [Paragraph(body, STYLE_NORMAL)]],
        colWidths=["100%"],
    )
    inner.setStyle(
        TableStyle(
            [
                ("BOX", (0, 1), (-1, 1), 0.6, BORDER_GREY),
                ("LEFTPADDING", (0, 1), (-1, 1), 8),
                ("RIGHTPADDING", (0, 1), (-1, 1), 8),
                ("TOPPADDING", (0, 1), (-1, 1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
            ]
        )
    )
    return inner


def _lignes_table(lignes):
    header = ["Réf.", "Désignation", "Qté", "PU HT", "Remise", "TVA", "Total HT"]
    data = [header]
    for l in lignes:
        data.append(
            [
                l.reference or "",
                Paragraph(l.designation or "", STYLE_NORMAL),
                f"{l.quantite:g} {l.unite or ''}".strip(),
                _euros(l.prix_unitaire_ht),
                f"{l.remise_pourcentage:g} %" if l.remise_pourcentage else "—",
                f"{l.taux_tva:g} %",
                _euros(l.total_ht),
            ]
        )
    col_widths = [18 * mm, 66 * mm, 18 * mm, 22 * mm, 16 * mm, 14 * mm, 24 * mm]
    table = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, PRIMARY),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, BORDER_GREY),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), LIGHT_GREY))
    table.setStyle(TableStyle(style))
    return table


def _totaux_table(total_ht, total_tva, total_ttc, par_taux, est_avoir=False):
    rows = [["Base HT", "Total HT", _euros(total_ht)]]
    for taux in sorted(par_taux.keys()):
        d = par_taux[taux]
        rows.append([f"dont TVA {taux:g} %", _euros(d["base_ht"]), _euros(d["tva"])])
    signe = "-" if est_avoir else ""
    data = [["", "", ""]]
    table_rows = []
    table_rows.append(["Total HT", "", _euros(total_ht)])
    for taux in sorted(par_taux.keys()):
        d = par_taux[taux]
        table_rows.append([f"TVA ({taux:g} %)", "", _euros(d["tva"])])
    table_rows.append(["Total TTC", "", f"{signe}{_euros(total_ttc)}"])

    data = [[r[0], r[2]] for r in table_rows]
    table = Table(data, colWidths=[45 * mm, 30 * mm])
    style = [
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEABOVE", (0, -1), (-1, -1), 0.8, PRIMARY),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 11),
        ("BACKGROUND", (0, -1), (-1, -1), LIGHT_GREY),
    ]
    table.setStyle(TableStyle(style))
    return table


def _footer_mentions(entreprise, kind):
    blocks = []
    if kind == "facture":
        blocks.append(
            f"<b>Conditions de règlement :</b> paiement à {entreprise.delai_paiement_jours or 30} jours. "
            f"En cas de retard de paiement, application d'une pénalité au taux annuel de "
            f"{entreprise.taux_penalite_retard or 10:g} % (minimum légal : 3 fois le taux d'intérêt légal) "
            f"ainsi que d'une indemnité forfaitaire pour frais de recouvrement de "
            f"{_euros(entreprise.indemnite_recouvrement or 40)} (article L441-10 du Code de commerce). "
            f"Aucun escompte pour paiement anticipé."
        )
        if entreprise.iban:
            blocks.append(f"<b>Coordonnées bancaires :</b> IBAN {entreprise.iban}" + (f" — BIC {entreprise.bic}" if entreprise.bic else ""))
    else:
        blocks.append(
            f"<b>Validité de l'offre :</b> {entreprise.validite_devis_jours or 30} jours à compter de la date d'émission. "
            f"Devis établi sur la base d'un examen visuel du véhicule ; des travaux complémentaires peuvent être "
            f"nécessaires après démontage et feront l'objet d'un devis complémentaire soumis à accord préalable."
        )
    if entreprise.franchise_en_base_tva:
        blocks.append("<b>TVA non applicable, article 293 B du Code général des impôts.</b>")
    agreements = []
    if entreprise.assurance_rc_pro:
        agreements.append(f"RC Pro : {entreprise.assurance_rc_pro}")
    if entreprise.assurance_decennale:
        agreements.append(f"Garantie décennale : {entreprise.assurance_decennale}")
    if entreprise.agrement_qualirepar:
        agreements.append("Label QualiRépar")
    if agreements:
        blocks.append(" — ".join(agreements))
    if entreprise.mentions_facture and kind == "facture":
        blocks.append(entreprise.mentions_facture)
    if entreprise.mentions_devis and kind == "devis":
        blocks.append(entreprise.mentions_devis)
    return blocks


def generate_pdf(kind, document, entreprise):
    """kind: 'devis' ou 'facture'. Retourne un BytesIO contenant le PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        title=f"{kind}-{document.numero}",
    )

    elements = []

    est_avoir = getattr(document, "est_avoir", False)
    titre = {"devis": "DEVIS", "facture": "AVOIR" if est_avoir else "FACTURE"}[kind]

    entreprise_para = Paragraph("<br/>".join(_entreprise_lignes(entreprise)), STYLE_SMALL)
    numero_bloc = [
        Paragraph(titre, STYLE_H1),
        Paragraph(f"N° {document.numero}", STYLE_H2),
        Spacer(1, 3),
        Paragraph(f"Date d'émission : {document.date_emission.strftime('%d/%m/%Y')}", STYLE_LABEL),
    ]
    if kind == "devis":
        if document.date_limite_validite:
            numero_bloc.append(Paragraph(f"Valable jusqu'au : {document.date_limite_validite.strftime('%d/%m/%Y')}", STYLE_LABEL))
    else:
        if document.date_echeance:
            numero_bloc.append(Paragraph(f"Échéance : {document.date_echeance.strftime('%d/%m/%Y')}", STYLE_LABEL))
        if document.devis_id:
            numero_bloc.append(Paragraph(f"Réf. devis : {document.devis.numero}", STYLE_LABEL))

    header_table = Table([[entreprise_para, numero_bloc]], colWidths=[105 * mm, 65 * mm])
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )
    elements.append(header_table)
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.2, color=PRIMARY))
    elements.append(Spacer(1, 10))

    dossier = document.dossier
    client_block = _bloc_client(dossier.client)
    vehicule_block = _bloc_vehicule(dossier.vehicule, dossier)
    blocks_row = [client_block, vehicule_block]
    blocks_table = Table([blocks_row], colWidths=[85 * mm, 85 * mm])
    blocks_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (1, 0), (1, 0), 6)]))
    elements.append(blocks_table)

    assurance_block = _bloc_assurance(dossier)
    if assurance_block:
        elements.append(Spacer(1, 6))
        elements.append(assurance_block)

    elements.append(Spacer(1, 14))
    elements.append(_lignes_table(document.lignes))
    elements.append(Spacer(1, 10))

    total_ht, total_tva, total_ttc, par_taux = document.totaux
    totals_table = _totaux_table(total_ht, total_tva, total_ttc, par_taux, est_avoir=est_avoir)
    wrapper = Table([["", totals_table]], colWidths=[105 * mm, 75 * mm])
    wrapper.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(wrapper)

    if kind == "facture" and not est_avoir:
        elements.append(Spacer(1, 6))
        if document.destinataire_type != "client":
            repartition = [
                ["Part prise en charge par l'assurance", _euros(document.montant_part_assurance)],
            ]
            if document.destinataire_type == "mixte":
                repartition.append(["Part restant à la charge du client (franchise)", _euros(document.montant_part_client)])
            rep_table = Table(repartition, colWidths=[105 * mm, 40 * mm])
            rep_table.setStyle(
                TableStyle(
                    [
                        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                        ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_GREY),
                        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                        ("TOPPADDING", (0, 0), (-1, -1), 2),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ]
                )
            )
            elements.append(rep_table)
        if document.total_paye:
            paye_table = Table(
                [["Déjà réglé", _euros(document.total_paye)], ["Reste à payer", _euros(document.reste_a_payer)]],
                colWidths=[105 * mm, 40 * mm],
            )
            paye_table.setStyle(
                TableStyle(
                    [
                        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                        ("TOPPADDING", (0, 0), (-1, -1), 2),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ]
                )
            )
            elements.append(paye_table)

    if document.notes:
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(f"<b>Remarques :</b> {document.notes}", STYLE_NORMAL))

    if kind == "devis":
        elements.append(Spacer(1, 24))
        signature = Table(
            [[
                Paragraph("Bon pour accord — date et signature du client précédées de la mention manuscrite « Bon pour accord »", STYLE_LABEL),
                "",
            ]],
            colWidths=[100 * mm, 60 * mm],
        )
        elements.append(signature)
        elements.append(Spacer(1, 20))
        box = Table([[""]], colWidths=[70 * mm], rowHeights=[25 * mm])
        box.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, BORDER_GREY)]))
        elements.append(box)

    elements.append(Spacer(1, 18))
    elements.append(HRFlowable(width="100%", thickness=0.6, color=BORDER_GREY))
    elements.append(Spacer(1, 6))
    for mention in _footer_mentions(entreprise, kind):
        elements.append(Paragraph(mention, STYLE_SMALL))
        elements.append(Spacer(1, 3))

    doc.build(elements)
    buffer.seek(0)
    return buffer
