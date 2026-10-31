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

## Backlog
- P0: Import real manuscript (from user's upload) + real front cover
- P1: Real author bio/photo; replace placeholder quizzes with manuscript quizzes
- P2: Move images to object storage; embed in mynalura.com; bookmarks/notes
