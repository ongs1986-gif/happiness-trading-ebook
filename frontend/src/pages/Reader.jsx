import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import HTMLFlipBook from "react-pageflip";
import { toast } from "sonner";
import { buildBook, sectionAt, PAGE_W, PAGE_H, BODY_W, BODY_H } from "../lib/book";
import { exportPdf } from "../lib/exportPdf";
import { getLockedLayout } from "../lib/layoutStore";
import { FlipPage, PageContent } from "../components/book/Pages";
import { QuizProvider } from "../components/book/quizState";
import { useReaderState } from "../components/book/readerState";
import { playFlipSound } from "../lib/sound";
import { Toolbar } from "../components/reader/Toolbar";
import { TocSidebar } from "../components/reader/TocSidebar";
import { PdfModal } from "../components/reader/PdfModal";
import { ReadingView } from "../components/reader/ReadingView";
import { ContinueCard } from "../components/reader/ContinueCard";

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

const LAYOUT_SAFETY = 26;

async function loadBook() {
  const { data } = await axios.get(`${API}/book`);
  await Promise.all(FONTS.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  const built = await getLockedLayout(data, () => {
    const el = document.createElement("div");
    el.className = "page-body page-measure";
    // Measure slightly shorter than the real page so other devices' font rendering still fits.
    Object.assign(el.style, { width: `${BODY_W}px`, height: `${BODY_H - LAYOUT_SAFETY}px` });
    document.body.appendChild(el);
    const b = buildBook(data.sections, el);
    el.remove();
    return b;
  }, FONTS.every((f) => document.fonts.check(f)));
  return { book: data, built };
}

export default function Reader() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);
  const [resume, setResume] = useState(() => {
    const p = Number(localStorage.getItem("ht-page")) || 0;
    return p > 1 ? p : null;
  });
  const [fontPct, setFontPct] = useState(() => Number(localStorage.getItem("ht-font")) || 100);
  const [cardHidden, setCardHidden] = useState(false);
  const [night, setNight] = useState(() => localStorage.getItem("ht-theme") === "night");
  useEffect(() => {
    document.documentElement.classList.toggle("theme-night", night);
    localStorage.setItem("ht-theme", night ? "night" : "day");
  }, [night]);
  useEffect(() => { localStorage.setItem("ht-font", String(fontPct)); }, [fontPct]);
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
  const [readMode, setReadMode] = useState(() => {
    const v = localStorage.getItem("ht-mode");
    return v ? v === "read" : window.innerWidth < 1024;
  });
  const [readKey, setReadKey] = useState(null);

  useEffect(() => { loadBook().then(setData).catch(() => setError(true)); }, []);
  useEffect(() => { if (data && resume === null) localStorage.setItem("ht-page", String(current)); startRef.current = current; }, [current, data, resume]);

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

  const jump = (n) => {
    setTocOpen(false);
    if (readMode) {
      const sec = sectionAt(pages, n);
      setTimeout(() => document.getElementById(`sec-${sec?.key}`)?.scrollIntoView(), 250);
      return;
    }
    setTimeout(() => flip(n), 250);
  };
  const onReadSection = useCallback((key) => { setReadKey(key); const p = data?.built.starts[key]; if (p !== undefined) setCurrent(p); }, [data]);
  const secKeys = useMemo(() => data?.book.sections.filter((s) => s.type !== "toc").map((s) => s.key) || [], [data]);
  const stepSection = (d) => {
    const i = Math.max(0, secKeys.indexOf(readKey));
    const k = secKeys[Math.min(secKeys.length - 1, Math.max(0, i + d))];
    document.getElementById(`sec-${k}`)?.scrollIntoView({ behavior: "smooth" });
  };
  const toggleReadMode = () => {
    const nextMode = !readMode;
    localStorage.setItem("ht-mode", nextMode ? "read" : "flip");
    if (!nextMode) {
      const p = !mobile && current > 0 && current % 2 === 0 ? current - 1 : current;
      startRef.current = p;
      setCurrent(p);
    }
    setReadMode(nextMode);
    if (nextMode) {
      const sec = sectionAt(pages, current);
      setTimeout(() => document.getElementById(`sec-${sec?.key}`)?.scrollIntoView(), 80);
    }
  };

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

  const section = readMode
    ? data.book.sections.find((s) => s.key === readKey) || sectionAt(pages, current)
    : sectionAt(pages, !mobile && current > 0 ? Math.min(current + 1, pages.length - 1) : current);
  const hlItems = Object.entries(highlights).map(([id, text]) => ({ id, text, page: idPage[id] }))
    .filter((h) => h.page !== undefined).sort((a, b) => a.page - b.page);
  const isBookmarked = bookmarks.some((b) => b.page === current);
  const safeStart = Math.min(startRef.current, pages.length - 1);

  const resumePage = (() => {
    if (resume === null) return 0;
    const n = Math.min(resume, pages.length - 1);
    const nx = pages[n + 1];
    if (pages[n]?.kind === "blank" || (n % 2 === 1 && nx?.section && nx.section !== pages[n]?.section)) return Math.min(n + 1, pages.length - 1);
    return n;
  })();
  const continueReading = () => {
    const n = resumePage;
    setResume(null);
    if (readMode) {
      const sec = sectionAt(pages, n);
      document.getElementById(`sec-${sec?.key}`)?.scrollIntoView();
      return;
    }
    flip(n);
  };
  const resumeSection = resume !== null ? sectionAt(pages, resumePage) : null;

  return (
    <QuizProvider>
      <div className="reader" data-testid="reader-container">
        {resume !== null && !cardHidden && (
          <ContinueCard section={resumeSection} page={resumePage} total={pages.length}
            onContinue={continueReading} onDismiss={() => setResume(null)} onClose={() => setCardHidden(true)} />
        )}
        <Toolbar onToc={() => setTocOpen(true)} onPrev={readMode ? () => stepSection(-1) : prev} onNext={readMode ? () => stepSection(1) : next}
          fontPct={fontPct} onFont={setFontPct} night={night} onNight={() => setNight(!night)}
          current={current} total={pages.length} readMode={readMode} onReadMode={toggleReadMode}
          mobile={mobile || readMode} onPdf={() => setPdf((s) => ({ ...s, open: true }))}
          sectionTitle={!readMode && (pages[current]?.kind === "back" || (!mobile && pages[current + 1]?.kind === "back")) ? "Cover Belakang" : section?.title}
          hlMode={hlMode} onHl={() => { setHlMode(!hlMode); toast(hlMode ? "Mode stabilo nonaktif" : "Mode stabilo aktif — ketuk paragraf untuk menandai"); }}
          bookmarked={isBookmarked} onBookmark={() => toggleBookmark(current, section?.title || "Sampul")}
          sound={sound} onSound={() => setSound(!sound)} />
        {readMode ? (
          <main className="rv-stage" data-testid="book-canvas-reading">
            <ReadingView book={data.book} onSection={onReadSection} fontPct={fontPct} />
          </main>
        ) : (
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
              onFlip={(e) => { setCurrent(e.data); setResume(null); if (soundRef.current) playFlipSound(); }}
            >
              {children}
            </HTMLFlipBook>
          </div>
          <p className="stage-hint">{mobile ? "Geser untuk membalik halaman" : "Klik sudut halaman atau gunakan tombol panah ← →"}</p>
        </main>
        )}
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
