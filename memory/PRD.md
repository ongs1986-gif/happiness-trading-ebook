# Happiness Trading — E-Book Reader (PRD)

## Original problem statement
Personal web e-book reader for "Happiness Trading" by Ongah Hermanto: realistic page flip, interactive TOC with page numbers matching, full 20-chapter manuscript (front matter, 5 parts x 4 chapters + quiz, Penutup), front/back cover, chapter illustrations, PDF download, responsive, premium warm-analog design (ivory, charcoal, subtle red/green candlestick accents; Playfair Display / Montserrat / Inter). React + FastAPI + MongoDB.

## User choices
- Manuscript: user will UPLOAD (current content = clearly marked placeholder)
- Front cover: user will UPLOAD original (current = temporary HTML candlestick cover)
- PDF: A5; Quizzes: interactive (localStorage); Author profile page: yes

## Architecture
- Backend: `server.py` (GET /api/book, GET /api/assets/{name}); `seed_content.py` seeds `book_meta` + `sections` (versioned SEED_VERSION). Illustrations in `/app/backend/assets`.
- Content format per section: lines; `## ` sub-heading, `> ` quote, `- ` list, `[...]` note, else paragraph.
- Frontend: `lib/book.js` DOM-measured pagination at fixed logical page 440x624 (A5 ratio) -> identical page numbers across devices; chapters/parts start on right (even) pages; TOC numbers auto-computed. `Reader.jsx` react-pageflip (2-page desktop >=1024, 1-page mobile). `lib/exportPdf.js` html2canvas + jsPDF A5 (~20s for 128 pages).

## Implemented (2026-06)
- Flip reader, toolbar (TOC, prev/next, page indicator, Download PDF), keyboard arrows, last-page resume
- TOC sidebar with search + in-book Daftar Isi page
- 20 AI-generated chapter illustrations, part pages, chapter openers, back cover, author page
- Interactive quizzes (score, explanations, retake) + Lembar Praktik textareas (saved locally)
- A5 PDF export verified

## Iteration 2 (2026-06)
- Real manuscript imported from author's docx via `backend/import_manuscript.py` -> `book_content.json` (20 bab, 5 bagian, worksheets Quiz I-IV + Lembar Praktik V, Kesimpulan, 20 author images inline). ~198 pages.
- Original front cover (cropped from upload) + new matching back cover
- Kept: generated opener illustrations, MC "Quiz Cepat" (rewritten to real content), Kata Pengantar page (placeholder note — not in manuscript)
- New: stabilo (paragraph highlight) mode, page bookmarks, sidebar tabs (Daftar Isi/Penanda/Stabilo), soft synthesized page-flip sound toggle
- Author profile from facts in manuscript; photo/full bio pending
- Bagian III title not in manuscript -> provisional "Teknikal dan Delegasi Smart Trading"

## Backlog
- P0: Author bio + photo; confirm Bagian III title; Kata Pengantar text or remove
- P1: Better mobile legibility (text ~10px at 390px); hide blank versos on mobile
- P2: Move images to object storage; embed in mynalura.com; sentence-level highlights/notes
