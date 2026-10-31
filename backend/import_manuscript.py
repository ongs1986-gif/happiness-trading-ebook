"""Converts the author's .docx manuscript into book_content.json (run: python import_manuscript.py <file.docx>)."""
import json
import re
import sys
from pathlib import Path

import docx

ROOT = Path(__file__).parent
END_PUNCT = tuple('.,:;!…"”’')
HEADING_FORCE = {462}
LIST_ITEMS = set(range(356, 366)) | set(range(421, 426)) | set(range(623, 627)) | set(range(974, 978)) | set(range(1040, 1045))
NO_HEADING = {219}

PARTS = [
    dict(n=1, title="Persiapan Menjadi Seorang Profesional Trader", desc="Pondasi Awal"),
    dict(n=2, title="Seni Menguasai Diri", desc="Filosofi Utama: Trading For Fun, Not For Living"),
    dict(n=3, title="Membaca Pasar dengan Pikiran Jernih", desc="Kebisingan vs sinyal, price action, makroekonomi, sistem yang sesuai kepribadian, dan peran teknologi sebagai karyawan digital."),
    dict(n=4, title="Matematika Kedamaian Batin", desc="Capital preservation, position sizing, dan menghadapi drawdown dengan tenang."),
    dict(n=5, title="Menjadi “The Happiness Trader”", desc="Rutinitas sehat, jurnal sebagai cermin diri, dan integrasi menjadi sistem hidup trading."),
]

# (chapter, part, title_idx, subtitle_idx or None, body_start, body_end, opener illustration)
CHAPTERS = [
    (1, 1, 35, None, 37, 60, "bab01.jpg"), (2, 1, 66, None, 67, 93, "bab02.jpg"),
    (3, 1, 97, 98, 99, 117, "bab03.jpg"), (4, 1, 126, 127, 128, 146, "bab04.jpg"),
    (5, 2, 189, 190, 191, 212, "bab06.jpg"), (6, 2, 215, 216, 218, 269, "bab09.jpg"),
    (7, 2, 274, 278, 276, 318, "bab05.jpg"), (8, 2, 323, 324, 326, 436, "bab11.jpg"),
    (9, 2, 452, 453, 455, 491, "bab17.jpg"), (10, 3, 543, 547, 545, 583, "bab10.jpg"),
    (11, 3, 592, 593, 594, 632, "bab12.jpg"), (12, 3, 636, 637, 638, 668, "bab02.jpg"),
    (13, 3, 672, None, 674, 712, "bab13.jpg"), (14, 3, 717, 721, 719, 757, "bab14.jpg"),
    (15, 4, 782, 784, 780, 815, "bab15.jpg"), (16, 4, 818, 822, 820, 844, "bab08.jpg"),
    (17, 4, 848, 852, 850, 888, "bab07.jpg"), (18, 5, 924, 926, 922, 955, "bab18.jpg"),
    (19, 5, 958, 962, 960, 997, "bab16.jpg"), (20, 5, 1000, 1004, 1002, 1059, "bab20.jpg"),
]

F = lambda id, label, rows=3: {"t": "field", "id": id, "label": label, "rows": rows}
I = lambda id, label, prefix="", suffix="": {"t": "input", "id": id, "label": label, "prefix": prefix, "suffix": suffix}
H = lambda text: {"t": "h", "text": text}
P = lambda text: {"t": "p", "text": text}
C = lambda id, options, label="": {"t": "checks", "id": id, "label": label, "options": options}

WORKSHEETS = {
    1: dict(title="Quiz Bagian I", subtitle="Refleksi Fondasi Profesional", items=[
        P("Luangkan waktu beberapa menit untuk menjawab pertanyaan-pertanyaan ini dengan jujur sebelum melanjutkan ke bagian berikutnya. Tujuannya bukan untuk terlihat benar, tetapi untuk melihat sejauh mana fondasi Anda sebagai trader mulai terbentuk."),
        H("1. Menemukan The Big Why Saya"),
        F("bigwhy", "Jika trading yang saya jalani hari ini benar-benar berhasil membawa perubahan dalam hidup saya, perubahan apa yang paling ingin saya hadirkan bagi diri saya dan orang-orang yang saya cintai?", 4),
        H("2. Deklarasi CEO"),
        P("Saya menyadari bahwa trading adalah sebuah bisnis, bukan kasino. Karena itu, mulai hari ini saya berkomitmen bahwa:"),
        F("sl", "Jika saya terkena stop loss, saya akan melihatnya sebagai:", 2),
        I("risk", "Batas maksimal risiko yang siap saya tanggung dalam satu transaksi adalah:", "", "% dari total modal saya"),
        F("nosystem", "Jika kondisi pasar tidak sesuai dengan sistem saya, maka saya akan memilih untuk:", 2),
        I("sign", "Tanda tangan:"), I("name", "Nama:"),
    ]),
    2: dict(title="Quiz Bagian II", subtitle="Refleksi Anatomi Emosi dan Metode MINS", items=[
        P("Luangkan waktu sejenak untuk menjawab bagian ini dengan jujur. Jika perlu, tutup chart Anda terlebih dahulu. Tujuannya bukan untuk menghakimi diri sendiri, tetapi untuk mengenali pola yang selama ini mungkin berulang."),
        H("1. Deteksi Dini “Racun” Emosi"),
        C("emosi", ["Ketakutan (fear / FOMO)", "Keserakahan (greed)", "Balas dendam (revenge trading)", "Kebosanan (boredom)"],
          "Coba ingat kembali salah satu transaksi terburuk yang pernah Anda alami. Emosi apa yang paling dominan saat itu?"),
        F("pelajaran", "Pelajaran termahal apa yang Anda dapatkan dari transaksi tersebut? Jawaban saya:", 3),
        H("2. Ritual Trading Zone Saya"),
        P("Sebelum membuka aplikasi trading esok hari, saya berkomitmen untuk melakukan beberapa hal berikut:"),
        I("maxsl", "Saya akan memastikan ukuran kerugian maksimal (stop loss) saya adalah sebesar:", "$"),
        I("jeda", "Jika posisi ini rugi, saya akan menutup layar dan mengambil jeda selama minimal:", "", "jam"),
        C("dana", ["Saya tidak akan trading menggunakan uang yang saya butuhkan untuk biaya hidup bulan ini. Saya menggunakan dana khusus bisnis."]),
    ]),
    3: dict(title="Quiz Bagian III", subtitle="Refleksi Teknikal dan Delegasi Smart Trading", items=[
        P("Gunakan bagian ini untuk meninjau kembali kebiasaan analisis Anda, merapikan layar kerja, dan menilai kesiapan Anda dalam memanfaatkan teknologi secara lebih sehat."),
        H("1. Diet Indikator"),
        F("indikator", "Sebutkan maksimal dua alat bantu utama yang benar-benar Anda anggap berguna dalam proses analisis Anda. Jika Anda murni menggunakan price action, tuliskan “Kosong”.", 2),
        H("2. Delegasi CEO"),
        C("delegasi", ["Saya sudah mendelegasikan sebagian proses kepada sistem otomatis, dan saya berkomitmen mengevaluasi kinerjanya secara objektif.",
                       "Saya belum menggunakan sistem otomatis, tetapi mulai mempertimbangkan alat bantu yang benar-benar saya pahami dan siap saya evaluasi."],
          "Sebagai pengelola dari bisnis trading saya sendiri, saya menyadari bahwa menatap layar terlalu lama dapat melelahkan dan memengaruhi objektivitas. Saat ini, posisi saya adalah:"),
    ]),
    4: dict(title="Quiz Bagian IV", subtitle="Refleksi Manajemen Risiko: Matematika Kedamaian Batin", items=[
        P("Isi bagian ini dengan angka yang nyata, bukan dengan harapan atau emosi sesaat."),
        H("1. Kontrak Keselamatan Modal"),
        P("Tuliskan kondisi modal dan batas risiko Anda saat ini."),
        I("modal", "Total modal trading saya saat ini:", "$"),
        I("riskpct", "Batas risiko per transaksi:", "", "%"),
        I("risknom", "Dalam nominal uang, kerugian maksimal saya per transaksi adalah:", "$"),
        P("Refleksi: Jika nominal tersebut hilang hari ini, apakah saya masih tetap tenang dan tetap bisa menjalani hidup dengan normal besok? Jika jawabannya belum, maka ukuran risikonya masih terlalu besar."),
        H("2. Skenario Saat Drawdown Datang"),
        I("lossrow", "Jika saya mengalami kerugian berturut-turut sebanyak:", "", "kali"),
        C("drawdown", ["Berhenti trading minimal 24 jam untuk menenangkan pikiran", "Menurunkan ukuran lot atau risiko pada transaksi berikutnya",
                       "Tidak melakukan averaging down pada posisi rugi besar", "Mengevaluasi apakah kerugian berasal dari sistem atau dari pelanggaran disiplin"],
          "…maka saya berkomitmen untuk:"),
    ]),
    5: dict(title="Lembar Praktik Bagian V", subtitle="Praktik Menjadi The Happiness Trader", items=[
        P("Gunakan lembar ini sebagai komitmen pribadi untuk membangun rutinitas, disiplin, dan kebebasan waktu yang lebih sehat dalam perjalanan trading Anda. Buku ini tidak hanya untuk dipahami, tetapi juga untuk dijalankan."),
        H("1. Merancang Rutinitas — Shift Kerja Pribadi Anda"),
        P("Anda adalah pengelola dari aktivitas trading Anda sendiri. Pasar tidak perlu mengatur seluruh hidup Anda. Karena itu, tentukan dengan sadar kapan Anda akan fokus pada market, dan kapan Anda akan kembali hadir sepenuhnya untuk kehidupan di luar layar."),
        I("sesi", "Sesi analisis harian saya:", "Pukul", ""),
        I("hidup", "Waktu untuk keluarga, hobi, istirahat, atau olahraga:", "Pukul", ""),
        H("2. Resolusi Happiness Trader"),
        P("Tuliskan satu kalimat yang menandai perubahan Anda. Apa perbedaan terbesar antara diri Anda yang lama saat berhadapan dengan market, dan diri Anda yang sedang Anda bangun hari ini?"),
        F("dulu", "“Dulu saat berada di depan layar, saya sering merasa…", 2),
        F("mulai", "Tetapi mulai hari ini dan seterusnya, saya akan menjalani trading dengan…”", 2),
        I("sign", "Tanda tangan:"), I("name", "Nama:"),
        P("Sekarang buku ini bukan hanya untuk dibaca, tetapi untuk dijalani."),
        P("Setelah menutup halaman ini, jangan terburu-buru mencari posisi. Tarik napas panjang. Beri diri Anda waktu untuk mencerna apa yang sudah dipelajari. Lalu mulailah melangkah dengan cara yang lebih sehat: lebih sadar dalam mengambil keputusan, lebih terukur dalam mengelola risiko, dan lebih bertanggung jawab terhadap waktu, modal, serta kehidupan Anda sendiri."),
        P("Jika setelah membaca buku ini Anda belum menjadi trader yang sempurna, itu wajar. Yang lebih penting adalah Anda sudah memiliki arah, kesadaran, dan fondasi untuk bertumbuh dengan lebih matang."),
        P("Semoga perjalanan Anda di market tidak hanya membawa hasil, tetapi juga membentuk kualitas diri yang lebih tenang, lebih jernih, dan lebih utuh."),
    ]),
}

QUICK_QUIZ = {
    1: [("Menurut Bab 2, stop loss sebaiknya dipandang sebagai…", ["Kegagalan pribadi", "Biaya operasional bisnis trading", "Kesalahan broker", "Alasan untuk balas dendam"], 1, "Seperti bisnis biasa, stop loss adalah biaya yang sudah diperhitungkan sejak awal."),
        ("Apa fungsi “Big Why” bagi seorang trader?", ["Menjamin profit", "Menjadi jangkar mental di tengah tekanan", "Mengganti trading plan", "Menentukan broker"], 1, "Big Why menjaga kita tetap terhubung dengan tujuan yang lebih besar saat proses terasa berat."),
        ("Ketika kondisi pasar tidak sesuai SOP, keputusan yang bernilai adalah…", ["Tetap entry agar tidak ketinggalan", "Menambah lot", "No trade", "Mengganti strategi saat itu juga"], 2, "No trade juga keputusan yang bernilai — disiplin berarti juga berani menunggu.")],
    2: [("Revenge trading biasanya muncul ketika…", ["Trader baru saja rugi dan ingin segera membalas", "Pasar sedang sepi", "Trader menulis jurnal", "Trader beristirahat"], 0, "Dorongan membalas kerugian membuat trader menjauh dari sistemnya sendiri."),
        ("Makna “Trading For Fun, Not For Living” adalah…", ["Trading untuk main-main", "Trading dijalani serius tanpa menjadikannya sumber tekanan hidup", "Tidak perlu rencana", "Trading hanya saat bosan"], 1, "Fun berarti menjalani dengan pikiran lapang, bukan main-main."),
        ("Dalam Metode MINS, “gulma” di taman batin melambangkan…", ["Profit besar", "Keraguan, kecemasan, dan dorongan impulsif", "Indikator teknikal", "Broker yang buruk"], 1, "Gulma dikenali dan dibersihkan dengan kesadaran, bukan kemarahan.")],
    3: [("Analysis paralysis adalah kondisi ketika…", ["Trader terlalu banyak mempertimbangkan hingga kejernihan terganggu", "Trader tidak punya chart", "Pasar libur", "Trader memakai EA"], 0, "Terlalu banyak alat sering membuat keputusan justru kabur."),
        ("Dalam pendekatan Happiness Trading, berita fundamental sebaiknya diperlakukan sebagai…", ["Pemicu untuk langsung entry", "Kompas konteks besar", "Hal yang harus diabaikan", "Jaminan arah harga"], 1, "Fundamental membantu memahami konteks, bukan pemicu kepanikan."),
        ("Peran EA atau sistem otomatis yang sehat adalah…", ["Mesin uang tanpa risiko", "Alat bantu yang tetap butuh pemahaman dan evaluasi", "Pengganti seluruh ilmu trading", "Cara menghindari tanggung jawab"], 1, "Alat bisa membantu, tetapi ilmu dan tanggung jawab tetap fondasi.")],
    4: [("Holy Grail yang sesungguhnya dalam trading adalah…", ["Indikator rahasia", "Capital preservation — kemampuan bertahan", "Sinyal grup", "Leverage tinggi"], 1, "Selama modal terjaga, Anda masih punya kesempatan untuk bertumbuh."),
        ("Jika modal $1.000 dan risiko 1% per transaksi, kerugian maksimal per transaksi adalah…", ["$1", "$10", "$100", "$1.000"], 1, "1% dari $1.000 adalah $10 — cukup kecil untuk tetap tidur nyenyak."),
        ("Langkah pertama protokol saat drawdown datang adalah…", ["Menggandakan lot", "Berhenti sejenak", "Ganti broker", "Averaging down"], 1, "Jeda memberi ruang untuk berpikir jernih sebelum kembali.")],
    5: [("Menurut Bab 18, trader profesional yang sehat…", ["Menatap layar sepanjang hari", "Menentukan jam kerja dan menjaga ruang untuk hidup", "Tidak pernah istirahat", "Trading di semua sesi"], 1, "Di luar jam trading, belajarlah benar-benar keluar dari market."),
        ("Jurnal trading yang baik mencatat…", ["Hanya profit dan loss", "Hasil sekaligus kondisi emosi dan kepatuhan pada sistem", "Hanya saldo akhir", "Tidak perlu dicatat"], 1, "Akar masalah sering tidak terlihat dari angka saja."),
        ("Empat pilar integrasi di Bab 20 adalah SOP, manajemen risiko, jurnal, dan…", ["Leverage", "Latihan mental untuk kembali ke kesadaran", "Sinyal berbayar", "Banyak indikator"], 1, "Latihan mental seperti MINS membantu menata kondisi batin sebelum keputusan penting.")],
}


def clean(t):
    return re.sub(r"[ \u00a0]+", " ", t).strip()


def load(path):
    d = docx.Document(path)
    rels = {rid: Path(r.target_ref).stem for rid, r in d.part.rels.items() if "image" in r.reltype}
    out = []
    for p in d.paragraphs:
        imgs = p._p.xpath(".//a:blip/@r:embed")
        bold = bool(p.runs) and bool(p.runs[0].bold)
        out.append({"text": p.text, "img": [f"doc_{rels[i]}.jpg" for i in imgs], "bold": bold})
    return out


def is_heading(i, t, nxt):
    if i in HEADING_FORCE:
        return True
    if i in NO_HEADING or i in LIST_ITEMS or len(t) > 90 or t.endswith(tuple('.,:;!…"')) or t.endswith("?"):
        return False
    if t.startswith("“"):
        return False
    return nxt is not None and len(nxt) > 40


def body_lines(P, a, b, skip=()):
    lines = []
    idx = [i for i in range(a, b + 1) if i not in skip]
    for k, i in enumerate(idx):
        p = P[i]
        for img in p["img"]:
            lines.append(f"![]({img})")
        raw = p["text"]
        if not raw.strip():
            continue
        if "\n" in raw:
            first, rest = raw.split("\n", 1)
            if p["bold"] or (len(first) < 70 and not first.strip().endswith(END_PUNCT)):
                lines.append("### " + clean(first))
                lines.append(clean(rest.replace("\n", " ")))
                continue
            raw = raw.replace("\n", " ")
        t = clean(raw)
        nxt = next((clean(P[j]["text"]) for j in idx[k + 1:] if P[j]["text"].strip()), None)
        if i in LIST_ITEMS:
            lines.append("- " + t)
        elif t.lower().startswith("catatan penting"):
            lines.append("### " + t.rstrip(":"))
        elif t.startswith("“") and t.endswith("”"):
            lines.append("> " + t)
        elif is_heading(i, t, nxt):
            lines.append(("## " if len(t) < 70 else "### ") + t)
        else:
            lines.append(t)
    return "\n".join(lines)


def verse(P, a, b, per_paragraph=False):
    groups, cur = [], []
    for i in range(a, b + 1):
        t = P[i]["text"].strip()
        if t:
            cur.append("\\n".join(clean(x) for x in t.split("\n")))
            if per_paragraph:
                groups.append(cur); cur = []
        elif cur:
            groups.append(cur); cur = []
    if cur:
        groups.append(cur)
    return "\n".join("~ " + "\\n".join(g) for g in groups)


def build(path):
    P = load(path)
    s = []

    def add(**kw):
        kw.setdefault("start_right", True)
        kw.setdefault("content", "")
        kw["order"] = len(s)
        s.append(kw)

    add(key="halaman-judul", type="title", title="Halaman Judul", group="front")
    add(key="persembahan", type="text", variant="verse", title="Persembahan", group="front", content=verse(P, 1, 3, per_paragraph=True))
    add(key="daftar-isi", type="toc", title="Daftar Isi", group="front")
    add(key="ucapan-terima-kasih", type="text", title="Ucapan Terima Kasih", group="front", content="\n".join([verse(P, 6, 7, True), body_lines(P, 8, 15), verse(P, 16, 16)]))
    add(key="kata-pengantar", type="text", title="Kata Pengantar", group="front", content="\n".join([
        "Setiap hari, jutaan keputusan diambil di depan layar trading. Sebagian lahir dari analisis yang matang, sebagian lagi lahir dari rasa takut, keserakahan, atau keinginan untuk segera menebus kerugian. Grafik yang kita lihat mungkin sama, tetapi kondisi batin di balik setiap keputusan sering kali sangat berbeda.",
        "Buku ini saya tulis untuk mengajak Anda melihat trading dari sudut yang lebih utuh. Bukan hanya tentang entry, exit, indikator, atau strategi, tetapi juga tentang bagaimana kita mengenal diri sendiri, mengelola emosi, menjaga modal, dan tetap hadir sebagai manusia di tengah pasar yang tidak pernah berhenti bergerak.",
        "Happiness Trading tersusun dalam lima bagian. Kita akan memulai dari fondasi seorang profesional trader, lalu belajar seni menguasai diri, membaca pasar dengan pikiran yang jernih, memahami matematika kedamaian batin melalui manajemen risiko, hingga akhirnya menjadi The Happiness Trader yang mampu mengintegrasikan semuanya ke dalam kehidupan sehari-hari.",
        "Di akhir setiap bagian, Anda akan menemukan quiz dan lembar praktik. Isilah dengan jujur. Tidak ada jawaban yang benar atau salah, karena tujuannya bukan untuk menilai, melainkan untuk membantu Anda melihat pola yang selama ini mungkin tidak disadari.",
        "Saya tidak menjanjikan bahwa buku ini akan membuat Anda selalu profit. Market tetap memiliki risiko, dan kerugian tetap menjadi bagian dari perjalanan. Namun saya percaya, trader yang lebih sadar, lebih disiplin, dan lebih tenang akan memiliki peluang yang jauh lebih baik untuk bertahan dan bertumbuh dalam jangka panjang.",
        "Terima kasih telah memilih untuk berjalan bersama saya melalui halaman-halaman ini. Semoga buku ini menjadi teman yang menenangkan, pengingat yang jujur, dan panduan yang membantu Anda menemukan kebahagiaan dalam proses.",
        "~ Salam hangat,\\nOngah Hermanto",
    ]))
    add(key="pendahuluan", type="text", title="Pendahuluan", group="front", content=body_lines(P, 21, 28))

    for part in PARTS:
        n = part["n"]
        add(key=f"bagian-{n}", type="part", title=part["title"], part_number=n, content=part["desc"], group=f"part-{n}")
        if n == 2:
            add(key="filosofi-utama", type="text", title="Filosofi Utama: Trading For Fun, Not For Living", part_number=2,
                group="part-2", content=body_lines(P, 182, 186))
        for ch, pn, ti, si, a, b, illus in CHAPTERS:
            if pn != n:
                continue
            skip = {ti} | ({si} if si else set())
            add(key=f"bab-{ch}", type="chapter", title=clean(P[ti]["text"]), subtitle=clean(P[si]["text"]) if si else None,
                part_number=n, chapter_number=ch, illustration=illus, content=body_lines(P, a, b, skip), group=f"part-{n}")
        ws = WORKSHEETS[n]
        add(key=f"quiz-{n}", type="quiz", title=ws["title"], subtitle=ws["subtitle"], part_number=n, group=f"part-{n}",
            quiz={"worksheet": ws["items"],
                  "questions": [{"q": q, "options": o, "answer": a, "explain": e} for q, o, a, e in QUICK_QUIZ[n]]})

    add(key="kesimpulan", type="text", variant="verse", title="Kesimpulan", group="back", content=verse(P, 1104, 1135))
    add(key="profil-penulis", type="author", title="Profil Penulis", group="back", start_right=False,
        content="\n".join([
            "Ongah Hermanto adalah pendiri A Trader Hub Indonesia, sebuah ekosistem edukasi dan pendampingan trading yang lahir dari keinginan untuk menghadirkan edukasi trading yang lebih bermartabat di Indonesia.",
            "## Perjalanan",
            "Dalam perjalanannya sebagai trader dan pendidik, Ongah bertemu dengan banyak orang yang masuk ke dunia trading dengan harapan besar: ingin bebas finansial, ingin mengubah hidup, ingin membuktikan diri. Namun ia juga menyaksikan bagaimana banyak dari mereka kelelahan secara mental, kehilangan ketenangan, dan menjadikan trading sebagai sumber tekanan baru.",
            "Dari pengalaman, pengamatan, dan perenungan itulah lahir sebuah keyakinan: persoalan dalam trading sering kali bukan hanya soal market, tetapi juga soal pikiran, emosi, dan cara kita hadir di dalam proses.",
            "## Pendekatan",
            "Ongah memadukan praktik trading profesional dengan pembelajaran pengembangan diri. Ia belajar Neuro-Linguistic Programming (NLP), mendalami pola pikir bisnis dan sistem, serta terinspirasi oleh pendekatan kesadaran dan kinerja pikiran. Perpaduan inilah yang kemudian ia rangkum menjadi latihan reflektif seperti Metode MINS di dalam buku ini.",
            "Baginya, trading yang sehat adalah trading yang dijalani sebagai bisnis: dengan rencana, SOP, manajemen risiko, jurnal, dan pemanfaatan teknologi secara bijak — tanpa kehilangan kehidupan di luar layar.",
            "## Nilai yang Dipegang",
            "Ongah memegang prinsip sederhana yang ia pelajari dari para gurunya: Family is Number One. Keluarga adalah tempat pulang dan pengingat bahwa kebahagiaan sejati tidak hanya dicari di pasar, tetapi dijaga di dalam hati dan rumah sendiri.",
            "Melalui Happiness Trading, karya yang lahir dengan restu sang ibu, ia mengajak setiap trader untuk menjalani trading dengan lebih sadar, lebih terukur, dan lebih bahagia.",
            "> Happy Trade. Happy Mind. Happier Life.",
        ]))
    return s


if __name__ == "__main__":
    sections = build(sys.argv[1])
    (ROOT / "book_content.json").write_text(json.dumps(sections, ensure_ascii=False, indent=1))
    print(len(sections), "sections written")
