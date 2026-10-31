import { ChevronLeft, ChevronRight, Download, List } from "lucide-react";

export function Toolbar({ onToc, onPrev, onNext, current, total, mobile, onPdf, sectionTitle }) {
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
      <div className="flex items-center gap-1.5">
        <button type="button" className="tb-icon" data-testid="btn-prev-page" onClick={onPrev} disabled={current <= 0} aria-label="Sebelumnya">
          <ChevronLeft size={18} />
        </button>
        <div className="tb-pill" data-testid="page-indicator">
          Hal. <b>{label}</b> <span className="opacity-60">/ {total - 1}</span>
        </div>
        <button type="button" className="tb-icon" data-testid="btn-next-page" onClick={onNext} disabled={current >= total - 1} aria-label="Berikutnya">
          <ChevronRight size={18} />
        </button>
      </div>
      <button type="button" className="tb-btn tb-primary" data-testid="btn-download-pdf" onClick={onPdf}>
        <Download size={16} /><span className="hidden sm:inline">Download PDF</span>
      </button>
    </header>
  );
}
