import { AlignLeft, BookOpen, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Download, Highlighter, List, Volume2, VolumeX } from "lucide-react";
import { FontSizeControl } from "./FontSizeControl";

function ToolIcons({ hlMode, onHl, bookmarked, onBookmark, sound, onSound, readMode, onReadMode, fontPct, onFont }) {
  return (
    <div className="flex items-center gap-1.5">
      {readMode && <FontSizeControl value={fontPct} onChange={onFont} />}
      <button type="button" className={`tb-icon ${readMode ? "is-on-bm" : ""}`} data-testid="btn-reading-mode" onClick={onReadMode}
        aria-label="Mode baca" title={readMode ? "Kembali ke tampilan buku" : "Mode baca (teks besar)"}>{readMode ? <BookOpen size={16} /> : <AlignLeft size={16} />}</button>
      <button type="button" className={`tb-icon ${hlMode ? "is-on-hl" : ""}`} data-testid="btn-highlight-mode" onClick={onHl}
        aria-label="Mode stabilo" title="Mode stabilo"><Highlighter size={16} /></button>
      <button type="button" className={`tb-icon ${bookmarked ? "is-on-bm" : ""}`} data-testid="btn-bookmark" onClick={onBookmark}
        aria-label="Penanda halaman" title="Tandai halaman ini">{bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}</button>
      <button type="button" className="tb-icon" data-testid="btn-sound-toggle" onClick={onSound}
        aria-label="Suara membalik halaman" title={sound ? "Matikan suara" : "Nyalakan suara"}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
    </div>
  );
}

export function Toolbar({ onToc, onPrev, onNext, current, total, mobile, onPdf, sectionTitle, ...tools }) {
  const label = mobile || current === 0 || current === total - 1 ? `${current}` : `${current}–${Math.min(current + 1, total - 1)}`;
  return (
    <header className="toolbar" data-testid="top-toolbar">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" className="tb-btn" data-testid="btn-toggle-toc" onClick={onToc} aria-label="Daftar Isi">
          <List size={18} /><span className="hidden md:inline">Daftar Isi</span>
        </button>
        <div className="hidden lg:block min-w-0">
          <div className="tb-brand">Happiness Trading</div>
          <div className="tb-section truncate" data-testid="current-section-title">{sectionTitle || "Ongah Hermanto"}</div>
        </div>
      </div>
      <div className={`items-center gap-1.5 ${tools.readMode ? "hidden sm:flex" : "flex"}`}>
        <button type="button" className="tb-icon" data-testid="btn-prev-page" onClick={onPrev} disabled={current <= 0} aria-label="Sebelumnya">
          <ChevronLeft size={18} />
        </button>
        <div className="tb-pill" data-testid="page-indicator">
          <span className="hidden sm:inline">Hal. </span><b>{label}</b> <span className="opacity-60 hidden sm:inline">/ {total - 1}</span>
        </div>
        <button type="button" className="tb-icon" data-testid="btn-next-page" onClick={onNext} disabled={current >= total - 1} aria-label="Berikutnya">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <ToolIcons {...tools} />
        <button type="button" className="tb-btn tb-primary" data-testid="btn-download-pdf" onClick={onPdf}>
          <Download size={16} /><span className="hidden xl:inline">Download PDF</span>
        </button>
      </div>
    </header>
  );
}
