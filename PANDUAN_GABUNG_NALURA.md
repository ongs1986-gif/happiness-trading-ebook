# Panduan Menggabungkan E-book "Happiness Trading" ke Project NALURA

Dokumen ini untuk agent di job NALURA. Sumber kode: repo GitHub hasil "Save to GitHub" dari job e-book ini.
Tujuan: e-book interaktif (balik halaman, daftar isi, kuis, mode malam, ukuran huruf, suara pembaca, simpan progres)
bisa dibuka di mynalura.com, misalnya `mynalura.com/happiness-trading/baca`, tanpa merusak halaman NALURA yang sudah ada.

## 1. Stack sumber
React (CRA + Tailwind + shadcn) + FastAPI + MongoDB (motor). Tanpa login, tanpa integrasi pihak ketiga.

## 2. Dependensi
- Frontend (pakai `yarn add`): `react-pageflip@^2.0.3`, `jspdf@^4.2.1`, `html2canvas@^1.4.1`
  (sudah dipakai juga: `lucide-react`, `sonner`, `axios`, `react-router-dom`, komponen shadcn `dialog`, `sheet`, `sonner`)
- Backend: tidak ada paket baru untuk reader. (`weasyprint`, `python-docx`, `fonttools` HANYA untuk generator file cetak, tidak wajib.)

## 3. File yang dipindah

### Backend (taruh di folder sendiri, mis. `backend/happiness/`)
| Sumber | Fungsi |
|---|---|
| `backend/seed_content.py` | Seluruh naskah (META + build_sections + SEED_VERSION) |
| `backend/book_content.json` | Data naskah final (WAJIB, dibaca oleh seed_content.py) |
| `backend/import_manuscript.py`, `backend/collab_content.py`, `backend/manuscript.docx` | Opsional: hanya untuk membuat ulang book_content.json dari file Word |
| `backend/assets/` (47 file, ±4 MB) | Sampul, foto penulis, ilustrasi bab, foto belakang `back_photo_v3.jpg` |
| Bagian endpoint di `backend/server.py` | Lihat bagian 4 |

### Frontend
| Sumber | Tujuan |
|---|---|
| `frontend/src/pages/Reader.jsx` | Halaman reader |
| `frontend/src/components/book/*` (Pages, QuizPage, WorksheetPage, quizState, readerState) | Komponen halaman buku |
| `frontend/src/components/reader/*` (Toolbar, TocSidebar, PdfModal, ReadingView, ContinueCard, FontSizeControl, NarratorBar, useNarrator) | UI reader |
| `frontend/src/lib/book.js`, `layoutStore.js`, `exportPdf.js`, `sound.js`, `narration.js` | Logika paginasi, cache layout, PDF, suara |
| `frontend/src/App.css` (485 baris) | Gaya reader (lihat bagian 5) |
| Font Google: Inter 400/500/600, Montserrat 500/600/700, Playfair Display (ital 400/600, 400/600/700) | `@import` di `index.css` |

## 4. Backend — WAJIB diberi prefix agar tidak bentrok
Endpoint asli → endpoint baru yang disarankan:
- `GET /api/book` → `GET /api/ht/book`
- `GET /api/layout/{key}` → `GET /api/ht/layout/{key}`
- `POST /api/layout` → `POST /api/ht/layout`
- `GET /api/assets/{name}` → `GET /api/ht/assets/{name}`
- `/api/print/files*` → JANGAN dipindah (file untuk penerbit, tidak boleh tampil ke publik)

Koleksi MongoDB asli memakai nama umum — WAJIB diganti agar tidak menimpa data NALURA:
- `book_meta` → `ht_book_meta`
- `sections` → `ht_sections`  (PENTING: fungsi `seed()` menjalankan `delete_many({})` pada koleksi ini)
- `layouts` → `ht_layouts`

Seed dijalankan saat startup (`seed()` di server.py): cek `seed_version`, jika beda → hapus & isi ulang
`ht_book_meta` + `ht_sections`. Gabungkan ke event startup NALURA yang sudah ada.

Lalu di frontend ganti URL API:
- `Reader.jsx`: `${API}/book` → `${API}/ht/book`
- `layoutStore.js`: `/layout` → `/ht/layout`
- `components/book/Pages.jsx`: `assetUrl` → `${API}/ht/assets/${name}`

## 5. Frontend — hindari bentrok gaya
- `App.css` reader memakai kelas umum (`.toolbar`, `.reader`, `.stage`, `.blk`, `.toc-*`, dll.) dan
  mode malam memasang kelas `theme-night` di `<html>`. Salin gayanya sebagai `happiness-reader.css`,
  bungkus reader dengan `<div className="ht-reader">` dan beri prefix `.ht-reader` ke semua selektor
  (atau pakai CSS module) supaya halaman NALURA tidak berubah. Hapus kelas `theme-night` saat keluar dari halaman reader.
- localStorage memakai prefix `ht-` (aman).
- Tambahkan route baru, contoh: `<Route path="/happiness-trading/baca" element={<ReaderStateProvider><Reader /></ReaderStateProvider>} />`
  Halaman jualan `/happiness-trading` yang sudah ada TIDAK diubah, kecuali tombol "Baca Ebook" yang mengarah ke route baru.
- `react-pageflip` butuh tinggi layar penuh; layout reader sudah full-screen (toolbar sticky 64px), sembunyikan header/footer NALURA di route ini.

## 6. Hal penting yang tidak boleh diubah
- Paginasi dikunci: layout dihitung sekali lalu disimpan di `/api/ht/layout` supaya semua perangkat dapat 229 halaman yang sama
  dan daftar isi sinkron. Jangan ubah ukuran `PAGE_W/PAGE_H/BODY_W/BODY_H` atau font di `lib/book.js`.
- Copy-paste teks sengaja tetap aktif (permintaan pemilik buku).
- Halaman kuis dilewati oleh suara pembaca.

## 7. Akses pembeli (rekomendasi)
Saat ini reader terbuka untuk siapa saja yang tahu link. Jika e-book dijual, kunci route `/happiness-trading/baca`
dengan login + status pembelian dari sistem pembayaran NALURA.

## 8. Cek setelah digabung
1. `mynalura.com/happiness-trading/baca` membuka sampul, bisa dibalik, total 229 halaman.
2. Daftar Isi (hal. 6–8) menampilkan semua nomor halaman.
3. Mode malam, ukuran huruf, mode baca, penanda, stabilo, suara pembaca (ikon headphone) berjalan.
4. Halaman NALURA lain tampil sama persis seperti sebelumnya.
