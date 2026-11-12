"""Generate print-ready files (interior PDF, cover PDF, editable DOCX) for each trim size."""
import html
import shutil
import sys
import zipfile
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from weasyprint import HTML

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from seed_content import META, build_sections  # noqa: E402
from print.build_docx import build_docx  # noqa: E402

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
FONTS = HERE / "fonts"
STATIC = FONTS / "static"
OUT = HERE / "output"

SIZES = {"14x21": (140, 210), "A5": (148, 210)}
BLEED = 3
PAPER_MM_PER_PAGE = 0.06  # bookpaper 57 g estimate; HVS 70 g ~0.05
ROMAN = ["", "I", "II", "III", "IV", "V"]
LETTERS = "ABCDE"

FONT_SPECS = [
    ("Inter", "Inter.ttf", "normal", [400, 600, 700]),
    ("Inter", "Inter-Italic.ttf", "italic", [400]),
    ("Montserrat", "Montserrat.ttf", "normal", [500, 600, 700]),
    ("Playfair Display", "PlayfairDisplay.ttf", "normal", [400, 700]),
    ("Playfair Display", "PlayfairDisplay-Italic.ttf", "italic", [400, 600]),
]


def static_fonts():
    STATIC.mkdir(parents=True, exist_ok=True)
    faces = []
    for family, src, style, weights in FONT_SPECS:
        for w in weights:
            name = f"{family.replace(' ', '')}-{w}{'-Italic' if style == 'italic' else ''}.ttf"
            dst = STATIC / name
            if not dst.exists():
                f = TTFont(FONTS / src)
                axes = {"wght": w}
                if "opsz" in [a.axisTag for a in f["fvar"].axes]:
                    axes["opsz"] = 14
                instancer.instantiateVariableFont(f, axes, inplace=True)
                f.save(dst)
            faces.append(f"@font-face{{font-family:'{family}';font-style:{style};font-weight:{w};src:url('{dst.as_uri()}');}}")
    return "\n".join(faces)


e = lambda s: html.escape(s or "")


def parse_line(l):
    if l.startswith("### "): return ("h3", l[4:])
    if l.startswith("## "): return ("h2", l[3:])
    if l.startswith("![]("): return ("img", l[4:-1])
    if l.startswith("~ "): return ("verse", l[2:].replace("\\n", "\n"))
    if l.startswith("> "): return ("quote", l[2:])
    if l.startswith("- "): return ("li", l[2:])
    return ("p", l)


def render_block(t, text):
    if t == "img":
        return f'<figure><img src="{(ASSETS / text).as_uri()}"></figure>'
    if t == "verse":
        return f'<p class="verse">{e(text).replace(chr(10), "<br>")}</p>'
    if t == "quote":
        return f"<blockquote>{e(text)}</blockquote>"
    if t == "li":
        return f"<li>{e(text)}</li>"
    if t in ("h2", "h3"):
        return f"<{t}>{e(text)}</{t}>"
    return f"<p>{e(text)}</p>"


def render_content(content):
    out, box, ul = [], [], False

    def close_ul(buf):
        nonlocal ul
        if ul:
            buf.append("</ul>")
            ul = False

    lines = [l for l in content.split("\n") if l.strip()]
    for l in lines:
        is_box = l.startswith("%% ")
        if is_box:
            l = l[3:]
        if not is_box and box:
            close_ul(box)
            out.append(f'<div class="box">{"".join(box)}</div>')
            box = []
        buf = box if is_box else out
        t, text = parse_line(l)
        if t == "li" and not ul:
            buf.append("<ul>")
            ul = True
        elif t != "li":
            close_ul(buf)
        buf.append(render_block(t, text))
    close_ul(box if box else out)
    if box:
        out.append(f'<div class="box">{"".join(box)}</div>')
    return "".join(out)


def lines_html(rows):
    return '<div class="wlines">' + '<div class="wl"></div>' * rows + "</div>"


def render_worksheet(items):
    out = []
    for it in items:
        t = it["t"]
        if t == "h": out.append(f'<h2 class="ws-h">{e(it["text"])}</h2>')
        elif t == "p": out.append(f'<p class="ws-p">{e(it["text"])}</p>')
        elif t == "field": out.append(f'<div class="ws-item"><div class="ws-label">{e(it["label"])}</div>{lines_html(it.get("rows", 2))}</div>')
        elif t == "input":
            pre = f'<span class="aff">{e(it.get("prefix"))}</span>' if it.get("prefix") else ""
            suf = f'<span class="aff">{e(it.get("suffix"))}</span>' if it.get("suffix") else ""
            out.append(f'<div class="ws-item"><div class="ws-label">{e(it["label"])}</div><div class="ws-input">{pre}<span class="fill"></span>{suf}</div></div>')
        elif t == "checks":
            opts = "".join(f'<div class="chk"><span class="cb"></span>{e(o)}</div>' for o in it["options"])
            out.append(f'<div class="ws-item"><div class="ws-label">{e(it.get("label"))}</div>{opts}</div>')
    return "".join(out)


def render_questions(qs):
    out = ['<h2 class="ws-h q-head">Quiz Cepat</h2><p class="ws-p">Lingkari jawaban yang menurut Anda paling tepat. Kunci jawaban ada di bagian akhir buku.</p>']
    for i, q in enumerate(qs, 1):
        opts = "".join(f'<div class="opt"><span class="ol">{LETTERS[j]}</span>{e(o)}</div>' for j, o in enumerate(q["options"]))
        out.append(f'<div class="q"><div class="qt">{i}. {e(q["q"])}</div>{opts}</div>')
    return "".join(out)


def build_interior_html(sections, fonts_css, w, h):
    m = META
    body, toc = [], []
    answers = []
    for s in sections:
        k, typ = s["key"], s["type"]
        sid = f"s-{k}"
        if typ == "title":
            body.append(f"""<section class="title-page plain">
<div class="kicker">Sebuah buku tentang trading &amp; ketenangan</div>
<h1 class="tp-title">Happiness<br>Trading</h1><p class="tp-sub">{e(m['subtitle'])}</p>
<div class="rule"></div><p class="tp-author">{e(m['author'])}</p><p class="tp-pub">{e(m['publisher'])}</p></section>
<section class="copyright plain"><p><b>Happiness Trading</b><br>{e(m['subtitle'])}</p>
<p>Penulis: {e(m['author'])}<br>Penerbit: {e(m['publisher'])}<br>Cetakan pertama, {e(m['year'])}</p>
<p>ISBN: ____________________</p>
<p>Ukuran: {w / 10:g} x {h / 10:g} cm</p>
<p>Hak cipta dilindungi undang-undang. Dilarang memperbanyak sebagian atau seluruh isi buku ini dalam bentuk apa pun tanpa izin tertulis dari penulis.</p></section>""")
            continue
        if typ == "toc":
            body.append('<section class="toc plain-head" id="toc"><h1 class="sec-title">Daftar Isi</h1>@@TOC@@</section>')
            continue
        level = "part" if typ == "part" else "item"
        label = s["title"]
        if typ == "chapter": label = f"Bab {s['chapter_number']} · {s['title']}"
        if typ == "part": label = f"Bagian {ROMAN[s['part_number']]} · {s['title']}"
        toc.append((level, sid, label))
        run = e(s["title"])
        if typ == "part":
            body.append(f"""<section class="part plain" id="{sid}"><div class="part-num">{ROMAN[s['part_number']]}</div>
<div class="kicker">Bagian {ROMAN[s['part_number']]}</div><h1 class="part-title">{e(s['title'])}</h1>
<div class="rule"></div><p class="part-desc">{e(s['content'])}</p></section>""")
        elif typ == "chapter":
            ill = f'<img class="ch-illus" src="{(ASSETS / s["illustration"]).as_uri()}">' if s.get("illustration") else ""
            sub = f'<p class="ch-sub">{e(s["subtitle"])}</p>' if s.get("subtitle") else ""
            body.append(f"""<section class="chapter" id="{sid}"><div class="ch-open">{ill}
<div class="kicker">Bab {s['chapter_number']}</div><h1 class="ch-title" data-run="{run}">{e(s['title'])}</h1>{sub}</div>
<div class="content">{render_content(s['content'])}</div></section>""")
        elif typ == "quiz":
            q = s.get("quiz") or {}
            answers.append((s["title"], q.get("questions", [])))
            body.append(f"""<section class="chapter quiz" id="{sid}"><div class="kicker">Bagian {ROMAN[s['part_number']]} · Lembar Praktik</div>
<h1 class="sec-title" data-run="{run}">{e(s['title'])}</h1><p class="ch-sub">{e(s.get('subtitle'))}</p>
{render_worksheet(q.get('worksheet', []))}{render_questions(q.get('questions', []))}</section>""")
        elif typ == "author":
            if answers:
                toc.append(("item", "s-kunci", "Kunci Jawaban Quiz Cepat"))
                ak = []
                for title, qs in answers:
                    rows = "".join(f'<div class="ak-q"><b>{i}. {LETTERS[q["answer"]]}</b> — {e(q["options"][q["answer"]])}<div class="ak-x">{e(q.get("explain"))}</div></div>' for i, q in enumerate(qs, 1))
                    ak.append(f'<h2>{e(title)}</h2>{rows}')
                body.append(f'<section class="chapter" id="s-kunci"><h1 class="sec-title" data-run="Kunci Jawaban">Kunci Jawaban Quiz Cepat</h1>{"".join(ak)}</section>')
            body.append(f"""<section class="chapter author" id="{sid}"><h1 class="sec-title" data-run="{run}">{e(s['title'])}</h1>
<img class="author-photo" src="{(ASSETS / m['author_photo']).as_uri()}"><div class="content">{render_content(s['content'])}</div></section>""")
        else:
            cls = "chapter verse-sec" if s.get("variant") == "verse" else "chapter"
            body.append(f"""<section class="{cls}" id="{sid}"><h1 class="sec-title" data-run="{run}">{e(s['title'])}</h1>
<div class="content">{render_content(s['content'])}</div></section>""")

    toc_html = "".join(
        f'<div class="toc-{lv}"><a href="#{sid}">{e(lab)}</a></div>' for lv, sid, lab in toc
    )
    css = (HERE / "interior.css").read_text().replace("@@W@@", f"{w}mm").replace("@@H@@", f"{h}mm")
    return f"""<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Happiness Trading</title>
<style>{fonts_css}\n{css}</style></head><body>{''.join(body).replace('@@TOC@@', toc_html)}</body></html>"""


def build_cover_html(fonts_css, w, h, spine):
    m = META
    css = (HERE / "cover.css").read_text()
    for k, v in {"@@W@@": w, "@@H@@": h, "@@S@@": spine, "@@B@@": BLEED,
                 "@@TW@@": 2 * w + spine + 2 * BLEED, "@@TH@@": h + 2 * BLEED}.items():
        css = css.replace(k, f"{v:.2f}mm")
    back = (ASSETS / m["back_photo"]).as_uri()
    face = """<svg class="face" viewBox="0 0 100 100"><circle cx="27" cy="24" r="13" fill="#fff"/><circle cx="73" cy="24" r="13" fill="#fff"/>
<path d="M12 50 A38 38 0 0 0 88 50 L74 50 A24 24 0 0 1 26 50 Z" fill="#fff"/></svg>"""
    candle = lambda c: f'<div class="candle {c}"><div class="wick top"></div><div class="body">{face}</div><div class="wick bot"></div></div>'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{fonts_css}\n{css}</style></head><body>
<div class="spread">
  <div class="back"><img class="back-img" src="{back}"><div class="back-top"></div><div class="back-shade"></div>
    <div class="back-panel"><div class="tagline">{e(m['back_tagline'])}</div><div class="brule"></div>
      <p class="summary">{e(m['back_summary'])}</p><p class="btag">Happy Trade. Happy Mind. Happier Life.</p>
      <div class="bfoot"><span>{e(m['author'])}</span><span class="isbn">ISBN / barcode</span><span>{e(m['publisher'])}</span></div></div></div>
  <div class="spine"><div class="spine-in"><span class="sp-title">ha<b class="r">p</b>piness trad<b class="g">i</b>ng</span><span class="sp-author">{e(m['author'])}</span></div></div>
  <div class="front">{candle('red')}
    <div class="f-author">{e(m['author'])}</div>
    <div class="f-title"><div>ha<span class="r">p<i class="arr down"></i></span>piness</div><div>trad<span class="g">ı<i class="arr up"></i></span>ng</div></div>
    <div class="f-sub">achieve your optimum trading<br>performance with mindfulness</div>
    {candle('green')}</div>
</div></body></html>"""


README = """PETUNJUK UNTUK PERCETAKAN — Happiness Trading ({size})

1. Isi buku : HappinessTrading_Isi_{size}.pdf
   - Ukuran potong {w} x {h} mm, bleed 3 mm di setiap sisi (TrimBox & BleedBox sudah diatur)
   - Full warna (RGB, silakan dikonversi ke CMYK sesuai mesin), font sudah ter-embed
   - Jumlah halaman: {pages} (sudah kelipatan 4)
   - Teks asli (bukan gambar) sehingga bisa diedit di Acrobat / Illustrator / CorelDRAW
2. Sampul : HappinessTrading_Cover_{size}.pdf
   - Satu lembar utuh: belakang + punggung + depan, ukuran {cw:.1f} x {ch:.1f} mm (termasuk bleed 3 mm)
   - Lebar punggung {spine:.1f} mm (perkiraan kertas bookpaper 57 g, {pages} halaman).
     Mohon dicek ulang sesuai kertas yang dipakai, lalu informasikan bila perlu disesuaikan.
   - Kotak "ISBN / barcode" di sampul belakang untuk diganti barcode ISBN.
3. Versi Word (bisa diedit) : HappinessTrading_Isi_{size}.docx
   - Ukuran halaman & margin sudah sesuai. Daftar isi: klik kanan > Update Field.
4. Folder fonts/ : font yang dipakai (Playfair Display, Montserrat, Inter — lisensi bebas OFL).
"""


def main():
    OUT.mkdir(exist_ok=True)
    fonts_css = static_fonts()
    sections = build_sections()
    for size, (w, h) in SIZES.items():
        interior = OUT / f"HappinessTrading_Isi_{size}.pdf"
        doc = HTML(string=build_interior_html(sections, fonts_css, w, h), base_url=str(HERE)).render()
        while len(doc.pages) % 4:
            html_str = build_interior_html(sections, fonts_css, w, h)
            pad = 4 - len(doc.pages) % 4
            html_str = html_str.replace("</body>", '<section class="blankpad plain"></section>' * pad + "</body>")
            doc = HTML(string=html_str, base_url=str(HERE)).render()
        doc.write_pdf(interior)
        pages = len(doc.pages)
        spine = pages * PAPER_MM_PER_PAGE
        cover = OUT / f"HappinessTrading_Cover_{size}.pdf"
        HTML(string=build_cover_html(fonts_css, w, h, spine), base_url=str(HERE)).write_pdf(cover)
        docx = OUT / f"HappinessTrading_Isi_{size}.docx"
        build_docx(sections, META, w, h, docx)
        readme = README.format(size=size, w=w, h=h, pages=pages, spine=spine, cw=2 * w + spine + 2 * BLEED, ch=h + 2 * BLEED)
        zpath = OUT / f"HappinessTrading_Percetakan_{size}.zip"
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            for f in (interior, cover, docx):
                z.write(f, f.name)
            z.writestr("PETUNJUK_PERCETAKAN.txt", readme)
            for f in STATIC.glob("*.ttf"):
                z.write(f, f"fonts/{f.name}")
        print(size, "pages", pages, "spine", round(spine, 1), "mm")
    shutil.rmtree(HERE / "__pycache__", ignore_errors=True)


if __name__ == "__main__":
    main()
