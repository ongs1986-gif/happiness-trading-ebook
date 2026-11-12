"""Editable Word version of the interior with print page size and mirrored margins."""
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor

from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"
GREEN, RED, GREY = RGBColor(0x3B, 0x82, 0x58), RGBColor(0xC8, 0x4B, 0x4B), RGBColor(0x6F, 0x67, 0x5B)
ROMAN = ["", "I", "II", "III", "IV", "V"]
LETTERS = "ABCDE"


def _field(par, instr):
    run = par.add_run()
    for tag, attr in (("w:fldChar", "begin"), ("w:instrText", None), ("w:fldChar", "separate"), ("w:fldChar", "end")):
        el = OxmlElement(tag)
        if attr:
            el.set(qn("w:fldCharType"), attr)
        else:
            el.set(qn("xml:space"), "preserve")
            el.text = instr
        run._r.append(el)


def _style(doc, name, font, size, bold=False, italic=False, color=None, base="Normal"):
    st = doc.styles[name] if name in [s.name for s in doc.styles] else doc.styles.add_style(name, 1)
    if name != "Normal":
        st.base_style = doc.styles[base]
    st.font.name, st.font.size, st.font.bold, st.font.italic = font, Pt(size), bold, italic
    st.element.rPr.rFonts.set(qn("w:eastAsia"), font)
    if color:
        st.font.color.rgb = color
    return st


def build_docx(sections, meta, w, h, out_path):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(w), Mm(h)
    sec.top_margin, sec.bottom_margin = Mm(17), Mm(19)
    sec.left_margin, sec.right_margin = Mm(19), Mm(14)
    mirror = OxmlElement("w:mirrorMargins")
    doc.settings.element.append(mirror)
    upd = OxmlElement("w:updateFields")
    upd.set(qn("w:val"), "true")
    doc.settings.element.append(upd)

    normal = _style(doc, "Normal", "Inter", 9.6)
    normal.paragraph_format.line_spacing = 1.4
    normal.paragraph_format.space_after = Pt(0)
    for lvl, size in (("Heading 1", 20), ("Heading 2", 10), ("Heading 3", 9.4)):
        st = _style(doc, lvl, "Playfair Display" if lvl == "Heading 1" else "Montserrat", size, bold=True, color=RGBColor(0x2C, 0x2A, 0x29))
        st.paragraph_format.space_before, st.paragraph_format.space_after = Pt(12 if lvl != "Heading 1" else 18), Pt(6 if lvl != "Heading 1" else 14)
        st.paragraph_format.keep_with_next = True
    _style(doc, "Kicker", "Montserrat", 7, bold=True, color=GREEN)
    _style(doc, "Subjudul", "Montserrat", 9, color=GREY).paragraph_format.space_after = Pt(10)
    _style(doc, "Kutipan", "Playfair Display", 11.5, italic=True).paragraph_format.left_indent = Mm(5)
    _style(doc, "Puisi", "Playfair Display", 11, italic=True).paragraph_format.space_after = Pt(12)
    _style(doc, "Kotak", "Inter", 9.2, color=RGBColor(0x2C, 0x2A, 0x29))
    _style(doc, "Label", "Montserrat", 8.4, bold=True)

    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    _field(footer, "PAGE")

    first = [True]

    def new_section():
        if first[0]:
            first[0] = False
            return
        doc.add_section(WD_SECTION.ODD_PAGE)

    def para(text, style="Normal", indent=True, align=None):
        p = doc.add_paragraph(text, style=style)
        if style == "Normal":
            p.paragraph_format.first_line_indent = Mm(4) if indent else None
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if align is not None:
            p.alignment = align
        return p

    def content(text):
        prev = "h"
        for l in [x for x in text.split("\n") if x.strip()]:
            box = l.startswith("%% ")
            if box:
                l = l[3:]
            if l.startswith("### "): doc.add_paragraph(l[4:], style="Heading 3"); prev = "h"
            elif l.startswith("## "): doc.add_paragraph(l[3:], style="Heading 2"); prev = "h"
            elif l.startswith("![]("):
                p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.add_run().add_picture(str(ASSETS / l[4:-1]), width=Mm(w - 40)); prev = "h"
            elif l.startswith("~ "):
                para(l[2:].replace("\\n", "\n"), "Puisi", align=WD_ALIGN_PARAGRAPH.CENTER); prev = "h"
            elif l.startswith("> "): para(l[2:], "Kutipan"); prev = "h"
            elif l.startswith("- "): para("•  " + l[2:], "Kotak" if box else "Normal", indent=False).paragraph_format.left_indent = Mm(5); prev = "li"
            else:
                para(l, "Kotak" if box else "Normal", indent=(prev == "p" and not box)); prev = "p"

    def lines(n):
        for _ in range(n):
            doc.add_paragraph("_" * 52, style="Normal").paragraph_format.space_after = Pt(4)

    answers = []
    for s in sections:
        typ = s["type"]
        if typ == "title":
            new_section()
            for _ in range(6): doc.add_paragraph()
            doc.add_paragraph("Sebuah buku tentang trading & ketenangan", style="Kicker")
            _style(doc, "JudulBuku", "Playfair Display", 34, bold=True)
            doc.add_paragraph("Happiness\nTrading", style="JudulBuku")
            doc.add_paragraph(meta["subtitle"], style="Subjudul")
            doc.add_paragraph(meta["author"], style="Label")
            doc.add_paragraph(meta["publisher"], style="Subjudul")
            doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
            for _ in range(14): doc.add_paragraph()
            for t in (f"Happiness Trading — {meta['subtitle']}", f"Penulis: {meta['author']}", f"Penerbit: {meta['publisher']}",
                      f"Cetakan pertama, {meta['year']}", "ISBN: ____________________", f"Ukuran: {w / 10:g} x {h / 10:g} cm",
                      "Hak cipta dilindungi undang-undang. Dilarang memperbanyak sebagian atau seluruh isi buku ini tanpa izin tertulis dari penulis."):
                p = doc.add_paragraph(t); p.runs[0].font.size = Pt(7.5); p.paragraph_format.space_after = Pt(4)
            continue
        new_section()
        if typ == "toc":
            doc.add_paragraph("Daftar Isi", style="Heading 1")
            _field(doc.add_paragraph(), 'TOC \\o "1-1" \\h \\z \\u')
            continue
        if typ == "part":
            for _ in range(8): doc.add_paragraph()
            doc.add_paragraph(f"Bagian {ROMAN[s['part_number']]}", style="Kicker")
            doc.add_paragraph(f"Bagian {ROMAN[s['part_number']]} · {s['title']}", style="Heading 1")
            doc.add_paragraph(s["content"], style="Subjudul")
            continue
        if typ == "author" and answers:
            doc.add_paragraph("Kunci Jawaban Quiz Cepat", style="Heading 1")
            for title, qs in answers:
                doc.add_paragraph(title, style="Heading 2")
                for i, q in enumerate(qs, 1):
                    p = doc.add_paragraph(f"{i}. {LETTERS[q['answer']]} — {q['options'][q['answer']]}")
                    p.add_run(f"\n{q.get('explain', '')}").italic = True
                    p.paragraph_format.space_after = Pt(5)
            new_section()
        if typ == "chapter":
            if s.get("illustration"):
                p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.add_run().add_picture(str(ASSETS / s["illustration"]), width=Mm(w - 33), height=Mm(62))
            doc.add_paragraph(f"Bab {s['chapter_number']}", style="Kicker")
            doc.add_paragraph(f"Bab {s['chapter_number']} · {s['title']}", style="Heading 1")
        else:
            if typ == "quiz":
                doc.add_paragraph(f"Bagian {ROMAN[s['part_number']]} · Lembar Praktik", style="Kicker")
            doc.add_paragraph(s["title"], style="Heading 1")
        if s.get("subtitle"):
            doc.add_paragraph(s["subtitle"], style="Subjudul")
        if typ == "author" and meta.get("author_photo"):
            doc.add_paragraph().add_run().add_picture(str(ASSETS / meta["author_photo"]), width=Mm(30))
        if typ == "quiz":
            q = s.get("quiz") or {}
            answers.append((s["title"], q.get("questions", [])))
            for it in q.get("worksheet", []):
                t = it["t"]
                if t == "h": doc.add_paragraph(it["text"], style="Heading 2")
                elif t == "p": para(it["text"], indent=False)
                elif t == "field": doc.add_paragraph(it["label"], style="Label"); lines(it.get("rows", 2))
                elif t == "input":
                    doc.add_paragraph(it["label"], style="Label")
                    doc.add_paragraph(f"{it.get('prefix') or ''} {'_' * 40} {it.get('suffix') or ''}".strip())
                elif t == "checks":
                    if it.get("label"): doc.add_paragraph(it["label"], style="Label")
                    for o in it["options"]: doc.add_paragraph(f"☐  {o}")
            doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
            doc.add_paragraph("Quiz Cepat", style="Heading 2")
            para("Lingkari jawaban yang menurut Anda paling tepat. Kunci jawaban ada di bagian akhir buku.", indent=False)
            for i, qq in enumerate(q.get("questions", []), 1):
                doc.add_paragraph(f"{i}. {qq['q']}", style="Label").paragraph_format.space_before = Pt(8)
                for j, o in enumerate(qq["options"]):
                    doc.add_paragraph(f"     {LETTERS[j]}.  {o}")
        else:
            content(s.get("content", "") if typ != "part" else "")
    doc.save(out_path)
