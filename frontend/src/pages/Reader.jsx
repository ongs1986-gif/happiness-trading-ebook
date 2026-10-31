import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import HTMLFlipBook from "react-pageflip";
import { toast } from "sonner";
import { buildBook, sectionAt, PAGE_W, PAGE_H, BODY_W, BODY_H } from "../lib/book";
import { exportPdf } from "../lib/exportPdf";
import { FlipPage, PageContent } from "../components/book/Pages";
import { QuizProvider } from "../components/book/quizState";
import { useReaderState } from "../components/book/readerState";
import { playFlipSound } from "../lib/sound";
import { Toolbar } from "../components/reader/Toolbar";
import { TocSidebar } from "../components/reader/TocSidebar";
import { PdfModal } from "../components/reader/PdfModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONTS = ['700 30px "Playfair Display"', 'italic 400 20px "Playfair Display"', '600 13px Montserrat', '400 12.5px Inter', '500 12px Inter'];

function useLayout() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    let t;
    const on = () => { clearTimeout(t); t = setTimeout(() => setVp({ w: window.innerWidth, h: window.innerHeight }), 200); };
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const mobile = vp.w < 1024;
  const availW = vp.w - (mobile ? 24 : 160);
  const availH = vp.h - 64 - (mobile ? 48 : 72);
  const scale = Math.max(0.45, Math.min(availW / (mobile ? PAGE_W : PAGE_W * 2), availH / PAGE_H, 1.5));
  return { mobile, scale: Math.floor(scale * 100) / 100 };
}

async function loadBook() {
  const { data } = await axios.get(`${API}/book`);
  await Promise.all(FONTS.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  const el = document.createElement("div");
  el.className = "page-body page-measure";
  Object.assign(el.style, { width: `${BODY_W}px`, height: `${BODY_H}px` });
  document.body.appendChild(el);
  const built = buildBook(data.sections, el);
  el.remove();
  return { book: data, built };
}

export default function Reader() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(() => Number(localStorage.getItem("ht-page")) || 0);
  const [tocOpen, setTocOpen] = useState(false);
  const [pdf, setPdf] = useState({ open: false, busy: false, progress: 0 });
  const printRef = useRef(null);
  const flipRef = useRef(null);
  const startRef = useRef(current);
  const { mobile, scale } = useLayout();
  const { bookmarks, toggleBookmark, highlights, hlMode, setHlMode } = useReaderState();
  const [sound, setSound] = useState(() => localStorage.getItem("ht-sound") !== "0");
  const soundRef = useRef(sound);
  useEffect(() => { soundRef.current = sound; localStorage.setItem("ht-sound", sound ? "1" : "0"); }, [sound]);

  useEffect(() => { loadBook().then(setData).catch(() => setError(true)); }, []);
  useEffect(() => { localStorage.setItem("ht-page", String(current)); startRef.current = current; }, [current]);

  const pages = data?.built.pages;
  const toc = useMemo(() => data && { items: data.built.toc, perPage: data.built.tocPerPage }, [data]);
  const pw = Math.round(PAGE_W * scale);
  const ph = Math.round(PAGE_H * scale);

  const children = useMemo(() => pages?.map((p, i) => (
    <FlipPage key={i} page={p} index={i} book={data.book} toc={toc} scale={pw / PAGE_W} />
  )), [pages, data, toc, pw]);
  const idPage = useMemo(() => {
    const m = {};
    pages?.forEach((p, i) => p.blocks?.forEach((b) => { if (!(b.id in m)) m[b.id] = i; }));
    return m;
  }, [pages]);

  const flip = useCallback((n) => flipRef.current?.pageFlip()?.flip(n), []);
  const next = useCallback(() => flipRef.current?.pageFlip()?.flipNext(), []);
  const prev = useCallback(() => flipRef.current?.pageFlip()?.flipPrev(), []);

  useEffect(() => {
    const onKey = (e) => {
      if (["TEXTAREA", "INPUT"].includes(document.activeElement?.tagName)) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const jump = (n) => { setTocOpen(false); setTimeout(() => flip(n), 250); };

  const startPdf = async () => {
    setPdf({ open: true, busy: true, progress: 0 });
    await new Promise((r) => setTimeout(r, 300));
    try {
      await exportPdf(printRef.current, (progress) => setPdf((s) => ({ ...s, progress })));
      toast.success("PDF berhasil diunduh");
      setPdf({ open: false, busy: false, progress: 0 });
    } catch {
      toast.error("Gagal membuat PDF, silakan coba lagi");
      setPdf((s) => ({ ...s, busy: false }));
    }
  };

  if (error) return <div className="reader-state" data-testid="reader-error">Gagal memuat buku. Muat ulang halaman.</div>;
  if (!data) return <div className="reader-state" data-testid="reader-loading"><div className="loader-candle" />Menyiapkan halaman buku…</div>;

  const section = sectionAt(pages, pages[current]?.kind === "blank" && !mobile ? current + 1 : current);
  const hlItems = Object.entries(highlights).map(([id, text]) => ({ id, text, page: idPage[id] }))
    .filter((h) => h.page !== undefined).sort((a, b) => a.page - b.page);
  const isBookmarked = bookmarks.some((b) => b.page === current);
  const safeStart = Math.min(startRef.current, pages.length - 1);

  return (
    <QuizProvider>
      <div className="reader" data-testid="reader-container">
        <Toolbar onToc={() => setTocOpen(true)} onPrev={prev} onNext={next} current={current} total={pages.length}
          mobile={mobile} onPdf={() => setPdf((s) => ({ ...s, open: true }))} sectionTitle={section?.title}
          hlMode={hlMode} onHl={() => { setHlMode(!hlMode); toast(hlMode ? "Mode stabilo nonaktif" : "Mode stabilo aktif — ketuk paragraf untuk menandai"); }}
          bookmarked={isBookmarked} onBookmark={() => toggleBookmark(current, section?.title || "Sampul")}
          sound={sound} onSound={() => setSound(!sound)} />
        <main className="stage" data-testid="book-canvas">
          <div className="book-shadow" style={{ width: mobile ? pw : pw * 2, height: ph }}>
            <HTMLFlipBook
              key={`${mobile}-${pw}`}
              ref={flipRef}
              width={pw} height={ph} minWidth={pw} maxWidth={pw} minHeight={ph} maxHeight={ph}
              size="fixed" showCover usePortrait={mobile} drawShadow maxShadowOpacity={0.45}
              flippingTime={850} mobileScrollSupport startPage={safeStart} startZIndex={0}
              autoSize={false} clickEventForward useMouseEvents swipeDistance={30} showPageCorners
              disableFlipByClick={false} className="flipbook" style={{}}
              onFlip={(e) => { setCurrent(e.data); if (soundRef.current) playFlipSound(); }}
            >
              {children}
            </HTMLFlipBook>
          </div>
          <p className="stage-hint">{mobile ? "Geser untuk membalik halaman" : "Klik sudut halaman atau gunakan tombol panah ← →"}</p>
        </main>
        <TocSidebar open={tocOpen} onOpenChange={setTocOpen} items={toc.items} activeKey={section?.key} onJump={jump}
          bookmarks={bookmarks} onRemoveBookmark={(b) => toggleBookmark(b.page, b.label)} highlights={hlItems} />
        <PdfModal open={pdf.open} busy={pdf.busy} progress={pdf.progress} total={pages.length}
          onOpenChange={(open) => setPdf((s) => ({ ...s, open }))} onStart={startPdf} />
        {pdf.busy && createPortal(
          <div ref={printRef} className="print-root" aria-hidden>
            {pages.map((p, i) => <PageContent key={i} page={p} index={i} book={data.book} toc={toc} print />)}
          </div>, document.body)}
      </div>
    </QuizProvider>
  );
}
