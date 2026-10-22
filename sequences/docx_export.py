"""Export Word (.docx) d'une séquence : fiche pédagogique modifiable, en version enseignant (corrigés sous chaque exercice) ou élève."""
import io
import re
from urllib.parse import quote

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

TEAL, TEAL_D, TEAL_L = "0F766E", "134E4A", "EAF5F3"
GREEN, GREEN_L = "15803D", "E8F5EC"
ORANGE, ORANGE_L = "C2410C", "FFF3E8"
RED, AMBER = "B91C1C", "B45309"
GREY, GREY_L, LINE = "6B7280", "F4F5F7", "D1D5DB"
LVL = {"easy": ("Facile", "15803D", "E8F5EC"), "medium": ("Intermédiaire", "B45309", "FEF3C7"), "hard": ("Difficile", "B91C1C", "FEE2E2")}
PRODS = {"orale": "Production orale", "ecrite": "Production écrite", "application": "Exercices d'application",
         "debat": "Débat", "projet": "Projet", "lecture": "Lecture"}
EARLY = re.compile(r"^(préscolaire|[123]ap|cp|ce1|ce2|maternelle)", re.I)
ARCH = re.compile(r"[؀-ۿ]")
FONT, FONT_CS = "Calibri", "Arial"
PAGE_W = 17.4  # cm utiles

PROV_OWN = "Cours élaboré à partir du texte fourni par l'enseignant."
PROV = ("Ce cours a été rédigé par une IA à partir de connaissances générales : aucune source n'a été consultée en direct. "
        "Les liens ci-dessous ouvrent des recherches pour vérifier chaque notion.")
TODO = "À compléter"

AR = {
    "FICHE PÉDAGOGIQUE": "بطاقة بيداغوجية", "FICHE DE TRAVAIL": "ورقة عمل",
    "Version enseignant": "نسخة الأستاذ", "Version élève": "نسخة التلميذ", "Page": "صفحة",
    "Niveau": "المستوى", "Enseignant(e)": "الأستاذ(ة)", "Compétence globale": "الكفاءة الشاملة", "Compétence terminale": "الكفاءة الختامية",
    "Séquence": "المقطع", "Séance": "الحصة", "Activité": "النشاط", "Support": "السند", "Titre": "العنوان", "Durée": "المدة",
    "Nom": "اللقب", "Prénom": "الاسم", "Classe": "القسم", "Date": "التاريخ",
    "Objectifs d'apprentissage": "أهداف التعلم", "L'apprenant sera capable de :": "يكون المتعلم قادرا على :", "Je dois être capable de :": "يجب أن أكون قادرا على :",
    "Texte support": "النص السند", "Déroulement de la séance": "سير الحصة", "Phases": "المراحل", "Tâches de l'enseignant": "مهام الأستاذ",
    "Réponses (tâches) de l'élève": "إجابات التلميذ", "Découverte du support": "اكتشاف السند", "Mise en situation": "وضعية الانطلاق",
    "Construction du savoir": "بناء التعلمات", "Vocabulaire": "المفردات", "Application": "التطبيق", "Production": "الإنتاج", "Évaluation": "التقويم",
    "Vocabulaire clé": "المفردات الأساسية", "Exercices": "تمارين", "Vérification des acquis": "تقويم المكتسبات",
    "Consigne": "التعليمة", "Pour réussir la production": "لأنجح في إنتاجي", "Ma production :": "إنتاجي :",
    "Corrigé": "الإجابة النموذجية", "Exemple attendu": "مثال منتظر", "Critère": "المعيار", "Points": "النقاط", "Total": "المجموع",
    "Notes de l'enseignant": "ملاحظات الأستاذ", "Sources": "المصادر", "consulté le": "تاريخ الاطلاع", "séances": "حصص",
    "Facile": "سهل", "Intermédiaire": "متوسط", "Difficile": "صعب", "Niveau facile": "المستوى السهل", "Niveau intermédiaire": "المستوى المتوسط",
    "Niveau difficile": "المستوى الصعب", "Provenance du contenu": "مصدر المحتوى", "Références à consulter": "مراجع يُنصح بها",
    "Faire lire le texte support (silencieusement puis à voix haute), vérifier la compréhension.": "قراءة النص السند (صامتة ثم جهرية) والتحقق من الفهم.",
    "Lisent le texte et répondent oralement.": "يقرؤون النص ويجيبون شفهيا.",
    "Présenter et faire expliquer le vocabulaire clé.": "عرض المفردات الأساسية وشرحها.", "Répètent et expliquent les mots.": "يردّدون الكلمات ويشرحونها.",
    "Donner la consigne de production et les critères de réussite.": "إعطاء تعليمة الإنتاج ومعايير النجاح.", "Réalisent la production.": "ينجزون الإنتاج.",
    "Évaluer les acquis (questions de vérification).": "تقويم المكتسبات (أسئلة التحقق).", "Répondent aux questions.": "يجيبون عن الأسئلة.",
    "Réalisent les exercices.": "ينجزون التمارين.", TODO: "يُكمله الأستاذ(ة)",
    PROV_OWN: "أُعدّ هذا الدرس انطلاقا من النص الذي قدّمه الأستاذ.",
    PROV: "كُتب هذا الدرس بواسطة الذكاء الاصطناعي اعتمادا على معارف عامة، دون الاطلاع على أي مصدر مباشر. تؤدي الروابط أدناه إلى عمليات بحث للتحقق من كل مفهوم.",
}

# Ordre des enfants imposé par le schéma OOXML (Word refuse parfois les fichiers mal ordonnés).
ORD = {
    "pPr": ["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl", "numPr", "suppressLineNumbers", "pBdr", "shd", "tabs",
            "suppressAutoHyphens", "kinsoku", "wordWrap", "overflowPunct", "topLinePunct", "autoSpaceDE", "autoSpaceDN", "bidi", "adjustRightInd",
            "snapToGrid", "spacing", "ind", "contextualSpacing", "mirrorIndents", "suppressOverlap", "jc", "textDirection", "textAlignment",
            "textboxTightWrap", "outlineLvl", "divId", "cnfStyle", "rPr", "sectPr", "pPrChange"],
    "rPr": ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "dstrike", "outline", "shadow", "emboss", "imprint", "noProof",
            "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern", "position", "sz", "szCs", "highlight", "u", "effect", "bdr", "shd",
            "fitText", "vertAlign", "rtl", "cs", "em", "lang", "eastAsianLayout", "specVanish", "oMath"],
    "tblPr": ["tblStyle", "tblpPr", "tblOverlap", "bidiVisual", "tblStyleRowBandSize", "tblStyleColBandSize", "tblW", "jc", "tblCellSpacing", "tblInd",
              "tblBorders", "shd", "tblLayout", "tblCellMar", "tblLook"],
    "trPr": ["cnfStyle", "divId", "gridBefore", "gridAfter", "wBefore", "wAfter", "cantSplit", "trHeight", "tblHeader", "tblCellSpacing", "jc", "hidden"],
    "tcPr": ["cnfStyle", "tcW", "gridSpan", "hMerge", "vMerge", "tcBorders", "shd", "noWrap", "tcMar", "textDirection", "tcFitText", "vAlign", "hideMark"],
}


PUA_BULLETS = "\uf0a7\uf0b7\uf076\uf0d8\uf0fc\uf02d\uf0a8\uf06c"


def clean_text(s):
    """Retire les caractères de puces propres à Word/PDF (affichés en « ? ») et les espaces multiples."""
    s = "".join("•" if c in PUA_BULLETS else ("" if "\ue000" <= c <= "\uf8ff" else c) for c in str(s or ""))
    s = re.sub(r"^[ \t]*•[ \t]*", "• ", s, flags=re.M)
    return re.sub(r"[ \t\u00a0]{2,}", " ", s)


def clean_title(s):
    s = t(s, 200)
    if " " not in s and re.search(r"[-_]", s):  # nom de fichier : « 7970-Mise-en-place » -> « Mise en place »
        s = re.sub(r"^[\d\s_-]+", "", re.sub(r"[-_]+", " ", s)).strip()
        s = s[:1].upper() + s[1:]
    return s


def t(x, n=2000):
    return str(x or "").strip()[:n]


def put(parent, child):
    """Insère child dans parent à la place que le schéma impose (et remplace un élément identique)."""
    pname = parent.tag.split("}")[1]
    order = ORD[pname]
    cname = child.tag.split("}")[1]
    for sib in list(parent):
        if sib.tag == child.tag:
            parent.remove(sib)
    idx = order.index(cname)
    for sib in list(parent):
        sname = sib.tag.split("}")[1]
        if sname in order and order.index(sname) > idx:
            sib.addprevious(child)
            return child
    parent.append(child)
    return child


def el(name, **attrs):
    e = OxmlElement("w:" + name)
    for k, v in attrs.items():
        e.set(qn("w:" + k), str(v))
    return e


class Builder:
    def __init__(self, series, mode="teacher"):
        self.s = series
        self.teacher = mode != "student"
        lang = t(series.get("language")).lower()
        txt = t(series.get("title")) + t(series.get("topic"))
        self.rtl = lang.startswith(("arab", "hébr", "persan")) or len(ARCH.findall(txt)) >= 3
        self.big = bool(EARLY.match(t(series.get("level"))))
        self.size = 15 if self.big else 11
        self.lh = 1.55 if self.big else 1.2
        self.doc = Document()
        sec = self.doc.sections[0]
        sec.page_width, sec.page_height = Cm(21), Cm(29.7)
        sec.left_margin = sec.right_margin = Cm(1.8)
        sec.top_margin, sec.bottom_margin = Cm(2.0), Cm(1.8)
        sec.header_distance = sec.footer_distance = Cm(0.9)
        self.styles()
        self.header_footer(sec)

    # ---------------------------------------------------------------- infrastructure
    def L(self, fr):
        return AR.get(fr, fr) if self.rtl else fr

    def styles(self):
        st = self.doc.styles
        n = st["Normal"]
        n.font.name, n.font.size = FONT, Pt(self.size)
        rf = n.element.get_or_add_rPr().get_or_add_rFonts()
        for a in ("ascii", "hAnsi", "eastAsia"):
            rf.set(qn("w:" + a), FONT)
        rf.set(qn("w:cs"), FONT_CS)
        n.paragraph_format.space_after = Pt(4)
        n.paragraph_format.line_spacing = self.lh
        for name, size, color, before, after in (("Heading 1", self.size + 5, TEAL, 16, 6), ("Heading 2", self.size + 1.5, TEAL_D, 10, 4)):
            h = st[name]
            h.font.name, h.font.size, h.font.bold = FONT, Pt(size), True
            h.font.color.rgb = RGBColor.from_string(color)
            hr = h.element.get_or_add_rPr().get_or_add_rFonts()
            for a in ("ascii", "hAnsi", "eastAsia"):
                hr.set(qn("w:" + a), FONT)
            hr.set(qn("w:cs"), FONT_CS)
            for a in ("asciiTheme", "hAnsiTheme", "eastAsiaTheme", "cstheme"):
                if hr.get(qn("w:" + a)) is not None:
                    del hr.attrib[qn("w:" + a)]
            h.paragraph_format.space_before, h.paragraph_format.space_after = Pt(before), Pt(after)
            h.paragraph_format.keep_with_next = True
            if name == "Heading 1":
                ppr = h.element.get_or_add_pPr()
                bd = el("pBdr")
                bd.append(el("bottom", val="single", sz=8, space=2, color=TEAL))
                put(ppr, bd)

    def header_footer(self, sec):
        hp = sec.header.paragraphs[0]
        self.rtl_par(hp)
        self.run(hp, t(self.s.get("title"), 90) + "  ·  " + t(self.s.get("level")), size=8.5, color=GREY)
        fp = sec.footer.paragraphs[0]
        self.rtl_par(fp)
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        self.run(fp, self.L("Version enseignant" if self.teacher else "Version élève") + "   ·   " + self.L("Page") + " ", size=8.5, color=GREY)
        self.field(fp, "PAGE")
        self.run(fp, " / ", size=8.5, color=GREY)
        self.field(fp, "NUMPAGES")

    def field(self, p, instr):
        def piece():
            r = p.add_run()
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor.from_string(GREY)
            return r
        piece()._r.append(el("fldChar", fldCharType="begin"))
        it = el("instrText")
        it.set(qn("xml:space"), "preserve")
        it.text = " " + instr + " "
        piece()._r.append(it)
        piece()._r.append(el("fldChar", fldCharType="separate"))
        piece().text = "1"
        piece()._r.append(el("fldChar", fldCharType="end"))

    def rtl_par(self, p):
        if self.rtl:
            put(p._p.get_or_add_pPr(), el("bidi"))
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    def run(self, p, text, bold=False, size=None, color=None, italic=False, shade=None, spacing=None):
        r = p.add_run(text)
        r.bold, r.italic = bold, italic
        r.font.size = Pt(size or self.size)
        if color:
            r.font.color.rgb = RGBColor.from_string(color)
        rPr = r._r.get_or_add_rPr()
        if shade:
            put(rPr, el("shd", val="clear", color="auto", fill=shade))
        if spacing:
            put(rPr, el("spacing", val=spacing))
        if self.rtl:
            put(rPr, el("rtl"))
            put(rPr, el("szCs", val=int((size or self.size) * 2)))
            if bold:
                put(rPr, el("bCs"))
        return r

    def par(self, host, text="", bold=False, size=None, color=None, italic=False, align=None, after=4, before=0, style=None,
            shade=None, bar=None, indent=None, hang=None, keep=False, first=False):
        if first and host.paragraphs and not host.paragraphs[0].text and len(host.paragraphs) == 1:
            p = host.paragraphs[0]
        else:
            p = host.add_paragraph(style=style) if style else host.add_paragraph()
        if text:
            self.run(p, text, bold, size, color, italic)
        pf = p.paragraph_format
        pf.space_after, pf.space_before = Pt(after), Pt(before)
        pf.line_spacing = self.lh
        pf.keep_with_next = keep or None
        ppr = p._p.get_or_add_pPr()
        if shade:
            put(ppr, el("shd", val="clear", color="auto", fill=shade))
        if bar:
            bd = el("pBdr")
            bd.append(el("right" if self.rtl else "left", val="single", sz=24, space=6, color=bar))
            put(ppr, bd)
        if indent is not None or hang is not None:
            ind = el("ind", left=int((indent or 0) * 567) + int((hang or 0) * 567), hanging=int((hang or 0) * 567))
            put(ppr, ind)
        self.rtl_par(p)
        if align == "c":
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        return p

    def bullet(self, host, text, **kw):
        p = self.par(host, "", after=kw.pop("after", 2), hang=0.5, indent=0.15, **kw)
        self.run(p, "•\t", color=TEAL, bold=True)
        tabs = el("tabs")
        tabs.append(el("tab", val="left", pos=int(0.65 * 567)))
        put(p._p.get_or_add_pPr(), tabs)
        self.run(p, text)
        return p

    def heading(self, text, level=1):
        p = self.doc.add_paragraph(style="Heading %d" % level)
        self.run(p, text, bold=True, size=None, color=TEAL if level == 1 else TEAL_D)
        # la taille vient du style
        for r in p.runs:
            r.font.size = None
        self.rtl_par(p)
        return p

    def shade(self, cell, fill):
        put(cell._tc.get_or_add_tcPr(), el("shd", val="clear", color="auto", fill=fill))

    def table(self, rows, cols, widths=None, borders=LINE, margins=(70, 110), header=False):
        tb = self.doc.add_table(rows=rows, cols=cols)
        tb.alignment = WD_TABLE_ALIGNMENT.CENTER
        tb.autofit = False
        pr = tb._tbl.tblPr
        if self.rtl:
            put(pr, el("bidiVisual"))
        if borders:
            bd = el("tblBorders")
            for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
                bd.append(el(side, val="single", sz=4, space=0, color=borders))
            put(pr, bd)
        else:
            bd = el("tblBorders")
            for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
                bd.append(el(side, val="nil"))
            put(pr, bd)
        mar = el("tblCellMar")
        for side, v in (("top", margins[0]), ("left", margins[1]), ("bottom", margins[0]), ("right", margins[1])):
            mar.append(el(side, w=v, type="dxa"))
        put(pr, mar)
        if widths:
            for col, w in zip(tb.columns, widths):
                col.width = Cm(w)
            for row in tb.rows:
                for c, w in zip(row.cells, widths):
                    c.width = Cm(w)
        for i, row in enumerate(tb.rows):
            trPr = row._tr.get_or_add_trPr()
            put(trPr, el("cantSplit"))
            if header and i == 0:
                put(trPr, el("tblHeader"))
        return tb

    def cell(self, c, text="", bold=False, size=None, color=None, italic=False, first=True, **kw):
        p = self.par(c, text, bold, size, color, italic, after=kw.pop("after", 2), first=first, **kw)
        return p

    def gap(self, pts=4):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing = Pt(pts)
        return p

    def lines(self, n):
        """Lignes de cahier : un tableau sans cadre dont chaque rangée a un trait bleu en bas."""
        tb = self.table(n, 1, [PAGE_W], borders=None, margins=(0, 0))
        pr = tb._tbl.tblPr
        bd = el("tblBorders")
        for side in ("top", "left", "right", "insideV"):
            bd.append(el(side, val="nil"))
        for side in ("bottom", "insideH"):
            bd.append(el(side, val="single", sz=6, space=0, color="7DA7D9"))
        put(pr, bd)
        h = 1.0 if self.big else 0.78
        for row in tb.rows:
            put(row._tr.get_or_add_trPr(), el("trHeight", val=int(h * 567), hRule="exact"))
            row.cells[0].paragraphs[0].paragraph_format.space_after = Pt(0)
        self.gap(6)

    def link(self, p, text, url):
        rid = p.part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
        h = el("hyperlink")
        h.set(qn("r:id"), rid)
        r = el("r")
        rPr = el("rPr")
        put(rPr, el("color", val="0563C1"))
        put(rPr, el("sz", val=int(self.size * 2)))
        put(rPr, el("u", val="single"))
        r.append(rPr)
        tx = el("t")
        tx.text = text
        r.append(tx)
        h.append(r)
        p._p.append(h)

    def chip(self, p, level):
        if level in LVL:
            name, col, fill = LVL[level]
            self.run(p, " " + self.L(name) + " ", True, self.size - 2, col, shade=fill)
            self.run(p, "  ")

    # ---------------------------------------------------------------- éléments de la fiche
    def banner(self, kicker, title, sub):
        tb = self.table(1, 1, [PAGE_W], borders=None, margins=(150, 260))
        c = tb.rows[0].cells[0]
        self.shade(c, TEAL)
        self.par(c, kicker, True, self.size - 1.5, "BFE3DD", after=2, first=True)
        self.par(c, title, True, self.size + 8, "FFFFFF", after=3)
        if sub:
            self.par(c, sub, False, self.size - 0.5, "DDF1EE", after=0)
        self.gap(8)

    def info_grid(self, i, n, lesson, sup):
        rows = [
            [("Niveau", t(self.s.get("level")), 1), ("Enseignant(e)", None, 1)],
            [("Séquence", t(self.s.get("title")), 3)],
            [("Titre", t(lesson.get("title")), 3)],
            [("Compétence globale", None, 3)],
            [("Compétence terminale", None, 3)],
            [("Activité", None, 1), ("Support", t(clean_title(sup.get("title")), 120) if sup else None, 1)],
            [("Durée", "1 h" if not self.rtl else "ساعة", 1), ("Séance", f"{i + 1} / {n}", 1)],
        ]
        w = [3.2, 5.5, 3.2, 5.5]
        tb = self.table(len(rows), 4, w, borders=LINE, margins=(80, 120))
        for r, spec in enumerate(rows):
            cells = tb.rows[r].cells
            pos = 0
            for lab, val, span in spec:
                lc = cells[pos]
                self.shade(lc, TEAL_L)
                self.cell(lc, self.L(lab), True, self.size - 1, TEAL_D, first=True)
                lc.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                vc = cells[pos + 1]
                if span == 3:
                    vc = vc.merge(cells[pos + 3])
                if val:
                    self.cell(vc, val, False, self.size, first=True)
                else:
                    self.cell(vc, self.L(TODO), False, self.size - 1, "9CA3AF", italic=True, first=True)
                vc.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                pos += 2
        self.gap(8)

    def student_header(self):
        tb = self.table(1, 4, [PAGE_W / 4] * 4, borders=LINE, margins=(110, 120))
        for c, lab in zip(tb.rows[0].cells, ("Nom", "Prénom", "Classe", "Date")):
            self.cell(c, self.L(lab) + " :", True, self.size - 1, TEAL_D, first=True)
        self.gap(8)

    def objectives(self, obj):
        self.heading(self.L("Objectifs d'apprentissage"))
        self.par(self.doc, self.L("L'apprenant sera capable de :" if self.teacher else "Je dois être capable de :"), True, after=3, keep=True)
        for b in obj or [self.L(TODO)]:
            self.bullet(self.doc, b)

    def support_block(self, sup):
        self.heading(self.L("Texte support") + (" — " + clean_title(sup.get("title")) if sup.get("title") else ""))
        # des paragraphes (et non un tableau) : un long texte doit pouvoir passer d'une page à l'autre
        for para in clean_text(t(sup.get("text"), 20000)).split("\n"):
            if para.strip():
                self.par(self.doc, para.strip(), False, self.size + (2 if self.big else 0.5), after=5, shade="FBFAF4", bar=TEAL, indent=0.4, before=0)
        self.gap(8)

    def _cell_bar(self):
        tcb = el("tcBorders")
        tcb.append(el("right" if self.rtl else "left", val="single", sz=36, space=0, color=TEAL))
        return tcb

    def deroulement(self, phases, exo, quiz):
        self.heading(self.L("Déroulement de la séance"))
        tb = self.table(1 + len(phases), 3, [3.4, 8.0, 6.0], header=True)
        for c, txt in zip(tb.rows[0].cells, ("Phases", "Tâches de l'enseignant", "Réponses (tâches) de l'élève")):
            self.shade(c, TEAL)
            self.cell(c, self.L(txt), True, self.size - 0.5, "FFFFFF", first=True)
        for r, (name, what) in enumerate(phases, start=1):
            a, b, c = tb.rows[r].cells
            self.shade(a, TEAL_L)
            self.cell(a, name, True, self.size - 0.5, TEAL_D, first=True)
            if isinstance(what, list):
                k = 0
                for sx in what:
                    k = self.slide_cell(b, sx, k)
                self.cell(c, "", first=True)
            else:
                msg_t, msg_s = what
                self.cell(b, self.L(msg_t), False, self.size - 0.5, first=True)
                self.cell(c, self.L(msg_s), False, self.size - 0.5, GREY, italic=True, first=True)
        self.gap(8)

    def slide_cell(self, cell, sx, k):
        if sx.get("title"):
            self.cell(cell, t(sx["title"], 160), True, self.size - 0.5, TEAL_D, first=(k == 0), before=0 if k == 0 else 4)
            k += 1
        if sx.get("layout") == "quote":
            self.cell(cell, "« " + t(sx.get("quote"), 300) + " » — " + t(sx.get("author"), 80), False, self.size - 1, italic=True, first=False)
        for it in sx.get("items") or []:
            if isinstance(it, dict):
                self.cell(cell, "•  " + t(it.get("t"), 120) + (" : " + t(it.get("x"), 200) if it.get("x") else ""), False, self.size - 1, first=False, after=1)
        for b in sx.get("bullets") or []:
            self.cell(cell, "•  " + t(b, 220), False, self.size - 1, first=False, after=1)
        return k + 1

    def vocab_block(self, vocab):
        self.heading(self.L("Vocabulaire clé"))
        tb = self.table(len(vocab), 2, [4.6, 12.8])
        for r, v in enumerate(vocab):
            a, b = tb.rows[r].cells
            self.shade(a, TEAL_L)
            self.cell(a, t(v.get("term"), 100), True, self.size, TEAL_D, first=True)
            self.cell(b, t(v.get("definition"), 400), False, self.size, first=True)
        self.gap(6)

    # ---- exercices
    def answer_text(self, q):
        ch = q.get("choices") or []
        if ch:
            k = int(q.get("answer") or 0) % len(ch)
            return f"{'abcdef'[k % 6]}) {t(ch[k], 300)}"
        return t(q.get("open"), 900)

    def corrige(self, q):
        if not self.teacher:
            return
        p = self.par(self.doc, "", after=6, shade=GREEN_L, bar=GREEN, indent=0.4, before=0)
        self.run(p, self.L("Corrigé") + " : ", True, self.size - 1, GREEN)
        self.run(p, self.answer_text(q), False, self.size - 1)
        if q.get("why"):
            self.run(p, "  —  " + t(q["why"], 700), False, self.size - 1.5, GREY, italic=True)

    def exercise(self, k, q, lvl=True):
        p = self.par(self.doc, "", after=3, before=6, keep=True, hang=0.75)
        self.run(p, f"{k}.", True, self.size + 1, TEAL)
        self.run(p, "\t")
        put(p._p.get_or_add_pPr(), self._tabs(0.75))
        if lvl:
            self.chip(p, t(q.get("level")))
        self.run(p, t(q.get("q"), 700), True)
        for j, c in enumerate(q.get("choices") or []):
            self.par(self.doc, f"{'abcdef'[j % 6]})   {t(c, 300)}", after=1, indent=0.9)
        if not q.get("choices"):
            self.gap(2)
            self.lines(1 if t(q.get("type")) == "fill" else 2)
        self.corrige(q)

    def _tabs(self, pos):
        tabs = el("tabs")
        tabs.append(el("tab", val="left", pos=int(pos * 567)))
        return tabs

    def exercises_block(self, exo):
        self.heading(self.L("Exercices"))
        levels = {t(x["q"].get("level")) for x in exo if t(x["q"].get("level")) in LVL}
        k = 0
        if len(levels) >= 2:
            for lv in ("easy", "medium", "hard"):
                grp = [x for x in exo if t(x["q"].get("level")) == lv]
                if not grp:
                    continue
                name, col, fill = LVL[lv]
                p = self.par(self.doc, "", after=2, before=8, shade=fill, bar=col, indent=0.35, keep=True)
                self.run(p, self.L("Niveau " + name.lower()), True, self.size + 0.5, col)
                for x in grp:
                    k += 1
                    self.exercise(k, x["q"], lvl=False)
            rest = [x for x in exo if t(x["q"].get("level")) not in LVL]
            for x in rest:
                k += 1
                self.exercise(k, x["q"], lvl=False)
        else:
            for x in exo:
                k += 1
                self.exercise(k, x["q"], lvl=True)

    def production(self, pr):
        kind = self.L(PRODS.get(pr.get("kind"), "Production")) if self.rtl else PRODS.get(pr.get("kind"), "Production")
        lv = LVL.get(pr.get("level"))
        self.heading((t(pr.get("title")) or kind), 2)
        if lv or pr.get("duration"):
            p = self.par(self.doc, "", after=4, keep=True)
            if lv:
                self.chip(p, pr.get("level"))
            self.run(p, kind + (f"  ·  {t(pr.get('duration'), 60)}" if pr.get("duration") else ""), False, self.size - 1, GREY)
        tb = self.table(1, 2, [10.2, 7.2], borders=LINE, margins=(110, 160))
        a, b = tb.rows[0].cells
        self.shade(a, ORANGE_L)
        self.shade(b, GREEN_L)
        self.cell(a, self.L("Consigne"), True, self.size - 0.5, ORANGE, first=True, after=3)
        self.cell(a, t(pr.get("task"), 1500), False, self.size, first=False)
        self.cell(b, self.L("Pour réussir la production"), True, self.size - 0.5, GREEN, first=True, after=3)
        for c in pr.get("criteria") or []:
            self.cell(b, "•  " + t(c, 240), False, self.size - 1, first=False, after=2)
        self.gap(6)
        self.par(self.doc, self.L("Ma production :"), True, color=TEAL, after=2, keep=True)
        self.lines(7 if not self.big else 5)
        if self.teacher:
            if pr.get("example"):
                p = self.par(self.doc, "", after=4, shade=GREEN_L, bar=GREEN, indent=0.4)
                self.run(p, self.L("Exemple attendu") + " : ", True, self.size - 1, GREEN)
                self.run(p, t(pr["example"], 1500), False, self.size - 1)
            rub = pr.get("rubric") or []
            if rub:
                tb = self.table(len(rub) + 2, 2, [13.4, 4.0], header=True)
                for c, txt in zip(tb.rows[0].cells, ("Critère", "Points")):
                    self.shade(c, GREEN)
                    self.cell(c, self.L(txt), True, self.size - 1, "FFFFFF", first=True)
                tot = 0
                for r, z in enumerate(rub, 1):
                    pts = z.get("points") if isinstance(z.get("points"), int) else 0
                    tot += pts
                    self.cell(tb.rows[r].cells[0], t(z.get("criterion"), 200), False, self.size - 1, first=True)
                    self.cell(tb.rows[r].cells[1], str(pts), False, self.size - 1, first=True)
                self.cell(tb.rows[-1].cells[0], self.L("Total"), True, self.size - 1, first=True)
                self.cell(tb.rows[-1].cells[1], str(tot), True, self.size - 1, first=True)
                for c in tb.rows[-1].cells:
                    self.shade(c, GREY_L)
        self.gap(8)

    def sources_block(self, srcs, prov):
        self.heading(self.L("Sources"))
        for v in srcs:
            p = self.par(self.doc, "", after=3, hang=0.5, indent=0.15)
            self.run(p, "•\t", color=TEAL, bold=True)
            put(p._p.get_or_add_pPr(), self._tabs(0.65))
            if v.get("url"):
                self.link(p, t(v.get("title") or v.get("site") or v["url"], 200), t(v["url"], 500))
                extra = ", ".join(x for x in (t(v.get("site"), 80), (self.L("consulté le") + " " + t(v.get("accessed"), 20)) if v.get("accessed") else "") if x)
                if extra:
                    self.run(p, f"  ({extra})", size=self.size - 2, color=GREY)
            else:
                self.run(p, t(v.get("title"), 300))
        if prov:
            self.par(self.doc, self.L("Provenance du contenu"), True, color=TEAL_D, after=2, before=6, keep=True)
            self.par(self.doc, self.L(PROV_OWN if prov.get("src") else PROV), italic=True, size=self.size - 1.5, color=GREY, after=3)
            if prov.get("works"):
                self.par(self.doc, self.L("Références à consulter") + " : " + " · ".join(t(w, 120) for w in prov["works"]), size=self.size - 1, after=3)
            wl = {"arab": "ar", "angl": "en", "espag": "es", "allem": "de"}.get(t(self.s.get("language")).lower()[:5].rstrip("e"), "fr")
            for k in prov.get("keywords") or []:
                p = self.par(self.doc, "", after=2, hang=0.5, indent=0.15)
                self.run(p, "•\t", color=TEAL, bold=True)
                put(p._p.get_or_add_pPr(), self._tabs(0.65))
                self.run(p, t(k, 80) + "   ")
                self.link(p, "Wikipédia", f"https://{wl}.wikipedia.org/w/index.php?search={quote(t(k, 80))}")
                self.run(p, "   ")
                self.link(p, "Google Scholar", f"https://scholar.google.com/scholar?q={quote(t(k, 80))}")

    def notes_block(self, sl):
        notes = [(t(x.get("title"), 160), t(x.get("notes"), 1200)) for x in sl
                 if x.get("notes") and x.get("layout") not in ("production", "support", "sources", "title")]
        if not notes:
            return
        self.heading(self.L("Notes de l'enseignant"))
        for ti, nt in notes:
            p = self.par(self.doc, "", after=5, shade=GREY_L, bar=TEAL, indent=0.35)
            if ti:
                self.run(p, ti + " — ", True, self.size - 1, TEAL_D)
            self.run(p, nt, False, self.size - 1.5)

    # ---------------------------------------------------------------- fiche complète
    def fiche(self, i, lesson):
        n = len(self.s["lessons"])
        sl = [x for x in lesson.get("slides") or [] if isinstance(x, dict)]
        title_sl = next((x for x in sl if x.get("layout") == "title"), {})
        content = [x for x in sl if x.get("layout") in ("text_image", "list", "steps", "timeline", "quote", "video")]
        vocab = [v for x in sl if x.get("layout") == "vocab" for v in x.get("vocab") or []]
        acts = [x for x in sl if x.get("layout") == "activity" and isinstance(x.get("q"), dict)]
        exo = [x for x in acts if not t(x.get("title")).lower().startswith("vérification")]
        quiz = [x for x in acts if x not in exo]
        sups = [x for x in sl if x.get("layout") == "support" and t(x.get("text"))]
        sup = ({"title": clean_title(re.sub(r"\s*\(\d+/\d+\)$", "", t(sups[0].get("title")))), "text": "\n".join(t(x.get("text"), 3000) for x in sups)} if sups else None)
        prods = [x for x in sl if x.get("layout") == "production" and isinstance(x.get("prod"), dict)]
        srcs = [v for x in sl if x.get("layout") == "sources" for v in x.get("sources") or [] if isinstance(v, dict) and (v.get("url") or v.get("title"))]
        prov = next((x.get("prov") for x in sl if x.get("layout") == "sources" and isinstance(x.get("prov"), dict)), None)
        sub = f"{t(self.s.get('title'), 120)}  ·  {t(self.s.get('level'))}  ·  {self.L('Séance')} {i + 1}/{n}"

        if self.teacher:
            self.banner(self.L("FICHE PÉDAGOGIQUE"), t(lesson.get("title"), 200), sub)
            self.info_grid(i, n, lesson, sup)
        else:
            self.banner(self.L("FICHE DE TRAVAIL"), t(lesson.get("title"), 200), sub)
            self.student_header()

        obj = [t(b, 400) for b in title_sl.get("bullets") or [] if b]
        self.objectives(obj)
        if sup:
            self.support_block(sup)

        if self.teacher:
            phases = []
            if sup:
                phases.append((self.L("Découverte du support"), ("Faire lire le texte support (silencieusement puis à voix haute), vérifier la compréhension.",
                                                                  "Lisent le texte et répondent oralement.")))
            if content:
                phases.append((self.L("Mise en situation"), content[:1]))
                if content[1:]:
                    phases.append((self.L("Construction du savoir"), content[1:]))
            if vocab:
                phases.append((self.L("Vocabulaire"), ("Présenter et faire expliquer le vocabulaire clé.", "Répètent et expliquent les mots.")))
            if exo:
                phases.append((self.L("Application"), (f"Faire réaliser les {len(exo)} exercices." if not self.rtl else f"إنجاز التمارين ({len(exo)}).", "Réalisent les exercices.")))
            if prods:
                phases.append((self.L("Production"), ("Donner la consigne de production et les critères de réussite.", "Réalisent la production.")))
            if quiz:
                phases.append((self.L("Évaluation"), ("Évaluer les acquis (questions de vérification).", "Répondent aux questions.")))
            self.deroulement(phases, exo, quiz)

        if vocab:
            self.vocab_block(vocab)
        if exo:
            self.exercises_block(exo)
        if prods:
            self.heading(self.L("Production"))
            for x in prods:
                self.production(x["prod"])
        if quiz:
            self.heading(self.L("Vérification des acquis"))
            for k, x in enumerate(quiz, 1):
                self.exercise(k, x["q"], lvl=False)
        if self.teacher:
            if srcs or prov:
                self.sources_block(srcs, prov)
            self.notes_block(sl)

    def cover(self, lessons):
        self.banner(self.L("FICHE PÉDAGOGIQUE" if self.teacher else "FICHE DE TRAVAIL"), t(self.s.get("title"), 200),
                    f"{t(self.s.get('level'))}  ·  {len(lessons)} {self.L('séances')}")
        tb = self.table(len(lessons), 2, [1.6, 15.8])
        for r, l in enumerate(lessons):
            a, b = tb.rows[r].cells
            self.shade(a, TEAL_L)
            self.cell(a, str(r + 1), True, self.size + 1, TEAL, first=True)
            self.cell(b, t(l.get("title"), 200), False, self.size, first=True)

    def build(self):
        lessons = [x for x in self.s.get("lessons") or [] if isinstance(x, dict) and x.get("slides")]
        self.s["lessons"] = lessons
        if len(lessons) > 1:
            self.cover(lessons)
            self.doc.add_page_break()
        for i, l in enumerate(lessons):
            if i:
                self.doc.add_page_break()
            self.fiche(i, l)
        bio = io.BytesIO()
        self.doc.save(bio)
        return bio.getvalue()


def build_docx(series, mode="teacher"):
    return Builder(series, mode).build()
