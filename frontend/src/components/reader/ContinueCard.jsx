import { BookOpen, X } from "lucide-react";

export function ContinueCard({ section, page, total, onContinue, onDismiss, onClose }) {
  const label = section?.type === "chapter" ? `Bab ${section.chapter_number}` : section?.type === "part" ? `Bagian ${section.part_number}` : "Terakhir dibaca";
  const pct = Math.round((page / Math.max(1, total - 1)) * 100);
  return (
    <div className="continue-card" data-testid="continue-reading-card" role="dialog" aria-label="Lanjut membaca">
      <button type="button" className="continue-close" data-testid="continue-dismiss-x" onClick={onClose} aria-label="Tutup"><X size={14} /></button>
      <div className="kicker-ui">Lanjut membaca</div>
      <div className="continue-label">{label} · Hal. {page}</div>
      <div className="continue-title" data-testid="continue-section-title">{section?.title}</div>
      <div className="continue-bar"><span style={{ width: `${pct}%` }} /></div>
      <div className="continue-pct">{pct}% dari buku</div>
      <div className="flex gap-2 mt-4">
        <button type="button" className="tb-btn tb-primary flex-1 justify-center" data-testid="continue-reading-button" onClick={onContinue}>
          <BookOpen size={15} /> Lanjutkan
        </button>
        <button type="button" className="tb-btn" data-testid="continue-start-over-button" onClick={onDismiss}>Dari awal</button>
      </div>
    </div>
  );
}
