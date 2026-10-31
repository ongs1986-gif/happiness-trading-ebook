import { useState } from "react";
import { Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";

const GROUP_LABEL = { front: "Halaman Awal", back: "Halaman Akhir" };

function TocLink({ it, active, onJump }) {
  return (
    <button type="button" data-testid={`toc-link-${it.key}`} onClick={() => onJump(it.page)}
      className={`toc-side-link ${it.type === "part" ? "is-part" : ""} ${active ? "is-active" : ""}`}>
      <span className="flex-1 text-left">
        {it.label && <span className="toc-side-label">{it.label}</span>}
        {it.title}
      </span>
      <span className="toc-side-num">{it.page}</span>
    </button>
  );
}

function SavedList({ tab, bookmarks, highlights, onJump, onRemoveBookmark }) {
  if (tab === "bm") {
    if (!bookmarks.length) return <p className="toc-empty" data-testid="bookmarks-empty">Belum ada penanda. Tekan ikon penanda di toolbar untuk menandai halaman yang sedang dibaca.</p>;
    return bookmarks.map((b) => (
      <div key={b.page} className="saved-row" data-testid={`bookmark-item-${b.page}`}>
        <button type="button" className="toc-side-link flex-1" onClick={() => onJump(b.page)}>
          <span className="flex-1 text-left">{b.label}</span><span className="toc-side-num">{b.page}</span>
        </button>
        <button type="button" className="saved-del" data-testid={`bookmark-remove-${b.page}`} onClick={() => onRemoveBookmark(b)} aria-label="Hapus penanda"><X size={14} /></button>
      </div>
    ));
  }
  if (!highlights.length) return <p className="toc-empty" data-testid="highlights-empty">Belum ada stabilo. Aktifkan mode stabilo di toolbar, lalu ketuk paragraf favorit Anda.</p>;
  return highlights.map((h) => (
    <button type="button" key={h.id} className="hl-row" data-testid={`highlight-item-${h.id}`} onClick={() => onJump(h.page)}>
      <span className="hl-text">“{h.text}{h.text.length >= 160 ? "…" : ""}”</span>
      <span className="toc-side-num">Hal. {h.page}</span>
    </button>
  ));
}

const TABS = [["toc", "Daftar Isi"], ["bm", "Penanda"], ["hl", "Stabilo"]];

export function TocSidebar({ open, onOpenChange, items, activeKey, onJump, bookmarks = [], highlights = [], onRemoveBookmark }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("toc");
  const filtered = items.filter((it) => `${it.label || ""} ${it.title}`.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="toc-sheet w-[88vw] sm:max-w-[400px] p-0" data-testid="toc-sidebar">
        <SheetHeader className="px-7 pt-8 pb-4 text-left">
          <div className="kicker-ui">Happiness Trading</div>
          <SheetTitle className="font-display text-3xl text-[#2C2A29]">Daftar Isi</SheetTitle>
          <SheetDescription className="sr-only">Navigasi bab buku</SheetDescription>
          <div className="toc-tabs">
            {TABS.map(([k, label]) => (
              <button type="button" key={k} data-testid={`sidebar-tab-${k}`} className={`toc-tab ${tab === k ? "is-active" : ""}`} onClick={() => setTab(k)}>
                {label}{k === "bm" && bookmarks.length ? ` (${bookmarks.length})` : ""}{k === "hl" && highlights.length ? ` (${highlights.length})` : ""}
              </button>
            ))}
          </div>
          {tab === "toc" && <div className="relative mt-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65605A]" />
            <input data-testid="toc-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari bab…"
              className="w-full rounded-full border border-[#E8E2D5] bg-[#FDFBF7] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#3B8258]" />
          </div>}
        </SheetHeader>
        <div className="toc-scroll px-4 pb-10">
          {tab !== "toc" && <SavedList tab={tab} bookmarks={bookmarks} highlights={highlights} onJump={onJump} onRemoveBookmark={onRemoveBookmark} />}
          {tab === "toc" && groups.map((g) => {
            const list = filtered.filter((i) => i.group === g);
            if (!list.length) return null;
            const testId = g.startsWith("part-") ? `toc-item-${g}` : g === "front" ? "toc-item-front-matter" : "toc-item-back-matter";
            return (
              <div key={g} data-testid={testId} className="mb-5">
                {GROUP_LABEL[g] && <div className="toc-group-label">{GROUP_LABEL[g]}</div>}
                {list.map((it) => <TocLink key={it.key} it={it} active={it.key === activeKey} onJump={onJump} />)}
              </div>
            );
          })}
          {tab === "toc" && !filtered.length && <p className="px-3 text-sm text-[#65605A]">Tidak ada bab yang cocok.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
