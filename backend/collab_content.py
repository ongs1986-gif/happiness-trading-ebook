"""Complementary material (from the first draft, rewritten to fit the real manuscript)."""

# chapter -> (key takeaway, [practical steps], reflection question)
INTISARI = {
    1: ("Banyak trader gagal bukan karena kurang pintar, tetapi karena ekspektasi instan dan ego yang ingin selalu benar.",
        ["Tuliskan ekspektasi Anda terhadap trading dalam satu kalimat yang realistis.", "Perhatikan kapan ego mulai ikut mengambil keputusan.", "Terima bahwa trading yang sehat memang terasa membosankan."],
        "Apa ekspektasi tersembunyi yang selama ini membuat Anda kecewa pada pasar?"),
    2: ("Bisnis trading berjalan dengan rencana dan SOP; stop loss adalah biaya operasional, bukan kegagalan pribadi.",
        ["Tulis visi, SOP entry, dan SOP risiko Anda di satu halaman.", "Catat setiap stop loss sebagai biaya bisnis di jurnal.", "Jadikan no trade sebagai pilihan yang sah saat kondisi tidak sesuai."],
        "Bagian mana dari rencana bisnis trading Anda yang masih berupa niat, belum tertulis?"),
    3: ("Big Why adalah jangkar mental yang menjaga Anda tetap tenang ketika proses terasa berat.",
        ["Tuliskan tiga alasan terdalam mengapa Anda memilih trading.", "Tempelkan Big Why Anda di dekat layar kerja.", "Baca kembali sebelum memulai sesi trading."],
        "Jika semua profit hilang hari ini, alasan apa yang tetap membuat Anda bertahan belajar?"),
    4: ("Ekosistem yang sederhana, rapi, dan dapat dipercaya adalah benteng awal seorang profesional.",
        ["Bersihkan layar dari indikator dan aplikasi yang tidak perlu.", "Periksa legalitas, eksekusi, dan biaya broker Anda.", "Gunakan teknologi sebagai alat bantu, bukan pengganti kedewasaan."],
        "Satu hal apa di meja trading Anda yang paling sering mengganggu fokus?"),
    5: ("Takut, serakah, dan balas dendam adalah tamu yang pasti datang; yang penting adalah mengenalinya lebih awal.",
        ["Kenali sinyal tubuh saat emosi mulai naik.", "Buat aturan jeda wajib setelah dua kali loss beruntun.", "Tuliskan emosi dominan di setiap catatan transaksi."],
        "Emosi apa yang paling sering muncul saat posisi Anda merugi?"),
    6: ("Mindfulness bukan mengendalikan pasar, melainkan mengamati tanpa langsung bereaksi.",
        ["Tarik tiga napas panjang sebelum membuka chart.", "Namai emosi yang muncul tanpa menghakiminya.", "Respons kerugian dengan jeda, bukan dengan transaksi baru."],
        "Trading yang bahagia bukan berarti selalu menang, melainkan selalu sadar. Seberapa sadar Anda di sesi terakhir?"),
    7: ("Ketika nilai diri tidak lagi dipertaruhkan di setiap transaksi, trading menjadi ringan dan jernih.",
        ["Pisahkan identitas diri dari hasil satu transaksi.", "Jaga jarak sehat: jam trading dan jam hidup yang jelas.", "Ingat makna fun: lapang, bukan main-main."],
        "Apakah satu kerugian masih bisa mengubah suasana hati Anda seharian?"),
    8: ("Metode MINS membantu menata taman batin: mencabut gulma keraguan dan menanam benih kepercayaan diri, ketenangan, dan kekuatan.",
        ["Luangkan 10–15 menit di tempat tenang untuk latihan MINS.", "Ulangi afirmasi benih yang paling Anda butuhkan hari ini.", "Lakukan secara rutin, terutama sebelum sesi penting."],
        "Gulma apa yang paling sering tumbuh di taman batin Anda saat trading?"),
    9: ("Trading zone lahir dari lingkungan yang sederhana, risiko yang sudah diterima, dan fokus pada kualitas eksekusi.",
        ["Matikan notifikasi yang tidak berhubungan dengan trading.", "Terima risiko sepenuhnya sebelum menekan tombol order.", "Nilai sesi dari kualitas eksekusi, bukan hasil instan."],
        "Kapan terakhir kali Anda merasakan flow saat trading, dan apa yang membuatnya mungkin?"),
    10: ("Lebih banyak analisis tidak selalu lebih baik; kesederhanaan memberi ruang bagi kejernihan.",
         ["Batasi alat analisis Anda maksimal dua.", "Jelaskan alasan entry dalam satu kalimat sederhana.", "Jika tidak bisa dijelaskan sederhana, tunda keputusan."],
         "Indikator mana yang sebenarnya hanya menambah keraguan Anda?"),
    11: ("Price action adalah bahasa tekanan pembeli dan penjual; baca jejaknya, jangan sekadar menghafal pola.",
         ["Amati area di mana harga bereaksi kuat berulang kali.", "Baca candlestick sebagai cerita tekanan, bukan simbol hafalan.", "Latih kejernihan dengan menandai chart tanpa indikator."],
         "Apakah Anda membaca pasar, atau hanya mencari pola yang ingin Anda lihat?"),
    12: ("Berita fundamental adalah kompas konteks besar, bukan pemicu kepanikan.",
         ["Cek kalender ekonomi setiap awal pekan.", "Kurangi risiko atau menepi menjelang rilis berita besar.", "Pahami bahwa pasar bereaksi pada ekspektasi, bukan hanya angka."],
         "Bagaimana Anda biasanya bereaksi saat berita besar membuat harga bergerak liar?"),
    13: ("Sistem terbaik adalah sistem yang cocok dengan kepribadian, waktu, dan ketahanan mental Anda.",
         ["Kenali gaya Anda: cepat, harian terukur, atau tenang dan luas.", "Uji satu sistem secara konsisten sebelum menggantinya.", "Berhenti mencoba menjadi ahli di semua gaya."],
         "Gaya trading mana yang paling membuat Anda tenang, bukan sekadar paling menarik?"),
    14: ("EA dan teknologi adalah karyawan digital: membantu mengurangi beban, tetapi tanggung jawab tetap pada Anda.",
         ["Gunakan hanya alat yang benar-benar Anda pahami cara kerjanya.", "Evaluasi kinerja sistem otomatis secara berkala dan objektif.", "Utamakan keandalan, bukan jumlah sistem."],
         "Bagian proses trading mana yang paling layak Anda delegasikan kepada teknologi?"),
    15: ("Holy Grail sejati adalah kemampuan bertahan: selama modal terjaga, kesempatan bertumbuh tetap ada.",
         ["Tetapkan batas kerugian harian dan mingguan.", "Ingat bahwa modal mencakup uang, mental, waktu, dan kepercayaan diri.", "Jadikan tetap berada di permainan sebagai tujuan pertama."],
         "Modal non-uang apa yang paling sering terkuras dalam trading Anda?"),
    16: ("Ukuran risiko yang tepat adalah yang tetap membuat Anda bisa tidur nyenyak.",
         ["Batasi risiko per transaksi secara kecil dan konsisten, misalnya 1–2% modal.", "Hitung ukuran lot dari jarak stop loss, bukan dari keinginan.", "Jika masih gelisah, risikonya masih terlalu besar."],
         "Berapa nominal kerugian yang benar-benar tidak mengganggu tidur Anda?"),
    17: ("Drawdown adalah data dan guru yang jujur, bukan vonis atas nilai diri Anda.",
         ["Berhenti sejenak saat kerugian beruntun terjadi.", "Turunkan ukuran risiko sampai kepercayaan diri pulih.", "Evaluasi sistem dan disiplin, bukan harga diri."],
         "Apa pelajaran paling jujur yang pernah diberikan drawdown kepada Anda?"),
    18: ("Kondisi di luar layar menentukan kualitas keputusan di depan layar.",
         ["Jaga tidur, olahraga, dan pola makan sebagai bagian dari sistem trading.", "Bangun ritual singkat sebelum sesi dimulai.", "Tentukan jam kerja dan benar-benar keluar dari market setelahnya."],
         "Rutinitas kecil apa yang bisa Anda mulai besok pagi?"),
    19: ("Jurnal adalah cermin: ukur disiplin dan kondisi emosi, bukan hanya saldo akun.",
         ["Catat alasan entry, emosi, dan kepatuhan pada SOP di setiap transaksi.", "Tinjau jurnal setiap akhir pekan untuk menemukan pola.", "Beri nilai disiplin, bukan hanya profit atau loss."],
         "Kebiasaan apa yang terlihat dari jurnal trading Anda minggu ini?"),
    20: ("Ilmu menjadi berarti ketika berubah menjadi kebiasaan: SOP, manajemen risiko, jurnal, dan latihan mental.",
         ["Pilih satu pilar yang paling lemah dan perkuat selama 30 hari.", "Tinjau keempat pilar setiap akhir bulan.", "Ukur keberhasilan dari ketenangan, disiplin, dan keseimbangan hidup."],
         "Satu komitmen apa yang ingin Anda jaga setelah menutup buku ini?"),
}

INTISARI_TITLE = "Intisari & Langkah Praktis"


def intisari_lines(ch):
    poin, steps, tanya = INTISARI[ch]
    return [f"%% ## {INTISARI_TITLE}", f"%% {poin}", *[f"%% - {s}" for s in steps], f"%% ### Pertanyaan Refleksi", f"%% {tanya}"]


CARA_MEMBACA = [
    "## Cara Membaca Buku Ini",
    "Buku ini terbagi menjadi lima bagian. Setiap bagian diakhiri dengan quiz, lembar praktik, dan Quiz Cepat yang dapat Anda isi langsung di dalam reader ini. Di akhir setiap bab, Anda juga akan menemukan intisari dan langkah praktis untuk membantu ilmu berubah menjadi kebiasaan.",
    "- Bacalah perlahan, satu bab dalam satu waktu.",
    "- Isi lembar praktik dengan jujur, karena tidak ada jawaban yang benar atau salah.",
    "- Tandai paragraf yang menyentuh Anda dengan stabilo, dan tuliskan catatan pribadi.",
    "- Kembali ke bab tertentu kapan pun Anda membutuhkannya.",
]

PENUTUP = [
    "Kita telah berjalan bersama melewati lima bagian perjalanan: membangun pondasi sebagai profesional trader, menguasai diri, membaca pasar dengan pikiran jernih, memahami matematika kedamaian batin, hingga menjadi The Happiness Trader.",
    "> Pasar akan selalu bergerak. Biarkan hati Anda tetap tenang.",
    "Perjalanan ini tidak berakhir di halaman terakhir. Kembalilah ke lembar praktik, jurnal, dan catatan Anda setiap kali pasar terasa berat. Semoga trading Anda menjadi sumber kebahagiaan, bukan beban.",
    "Terima kasih telah membaca.",
]

EXTRA_REFLECTIONS = {
    1: [("ref_ego", "Kapan terakhir kali ego memengaruhi keputusan trading Anda? Apa yang terjadi?")],
    2: [("ref_fomo", "Apa yang akan Anda lakukan saat FOMO datang lagi?"),
        ("ref_jeda", "Rancang ritual jeda 60 detik versi Anda sebelum menekan tombol order.")],
    3: [("ref_tubuh", "Di bagian tubuh mana Anda merasakan stres saat chart bergerak cepat atau berita besar rilis?")],
    4: [("ref_tidur", "Jika kerugian maksimal per transaksi terjadi tiga kali berturut-turut, apakah Anda masih bisa tidur nyenyak? Jelaskan.")],
    5: [("ref_jurnal", "Kebiasaan apa yang terlihat dari jurnal trading Anda minggu ini?"),
        ("ref_arti", "Apa arti kebahagiaan dalam trading bagi Anda sekarang?")],
}

EXTRA_QUIZ = {
    1: [("Ego dalam trading paling sering muncul sebagai…", ["Menolak cut loss karena ingin benar", "Membuat jurnal", "Istirahat setelah loss", "Mengurangi lot"], 0,
         "Keinginan untuk selalu benar membuat kita mengabaikan sinyal pasar.")],
    2: [("Ketika muncul rasa FOMO, tindakan terbaik adalah…", ["Langsung masuk posisi", "Menaikkan lot", "Berhenti sejenak dan cek trading plan", "Menutup aplikasi selamanya"], 2,
         "Jeda memberi ruang bagi logika untuk kembali memimpin.")],
    3: [("Saat tubuh tegang melihat candle merah panjang, sebaiknya…", ["Mengabaikan sinyal tubuh", "Menyadari ketegangan dan bernapas perlahan", "Menambah posisi", "Menutup laptop dengan marah"], 1,
         "Tubuh sering memberi tanda lebih awal daripada pikiran.")],
    4: [("Greed biasanya mendorong kita untuk…", ["Mengambil profit sesuai rencana", "Menggeser target dan stop terus-menerus", "Membuat jurnal", "Istirahat"], 1,
         "Serakah membuat rencana kehilangan arah; manajemen risiko menjaganya tetap utuh.")],
    5: [("Kebahagiaan dalam trading paling banyak ditemukan pada…", ["Hasil satu transaksi besar", "Proses belajar dan bertumbuh", "Saldo akun saja", "Pujian orang lain"], 1,
         "Proses yang dinikmati membuat perjalanan panjang terasa ringan.")],
}
