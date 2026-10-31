import { forwardRef, useEffect, useRef } from "react";
import { blockClass, parseContent, PAGE_W, PAGE_H } from "../../lib/book";
import { QuizPage, ReflectionPage } from "./QuizPage";
import { WorksheetPage } from "./WorksheetPage";
import { useReaderState } from "./readerState";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const assetUrl = (name) => `${API}/assets/${name}`;
const NO_NUM = new Set(["cover", "back", "blank", "title", "part"]);
const HARD = new Set(["cover", "back"]);
const NUM_WORDS = ["", "Satu", "Dua", "Tiga", "Empat", "Lima"];

const BARS = [[14, 30, 1], [22, 44, 0], [10, 26, 1], [30, 52, 1], [18, 36, 0], [38, 60, 1], [26, 40, 0], [46, 72, 1], [34, 50, 1], [56, 80, 1], [44, 58, 0], [64, 92, 1]];

export function Candles({ className = "", height = 100 }) {
  return (
    <svg className={className} viewBox="0 0 240 100" height={height} preserveAspectRatio="xMidYMax meet" aria-hidden>
      {BARS.map(([lo, hi, up], i) => {
        const x = 10 + i * 19;
        const color = up ? "#3B8258" : "#C84B4B";
        return (
          <g key={i} opacity="0.85">
            <line x1={x + 4} x2={x + 4} y1={100 - hi - 8} y2={100 - lo + 6} stroke={color} strokeWidth="1" />
            <rect x={x} y={100 - hi} width="8" height={hi - lo} fill={color} rx="1" />
          </g>
        );
      })}
    </svg>
  );
}

function Cover({ book }) {
  const m = book.meta;
  if (m.front_cover) return <img src={assetUrl(m.front_cover)} alt="Cover Happiness Trading" className="cover-img" crossOrigin="anonymous" data-testid="front-cover" />;
  return (
    <div className="cover" data-testid="front-cover">
      <div className="cover-author">{m.author}</div>
      <div className="cover-mid">
        <Candles className="cover-candles" height={120} />
        <h1 className="cover-title">Happiness<br /><em>Trading</em></h1>
        <div className="cover-rule" />
        <p className="cover-sub">{m.subtitle}</p>
      </div>
      <div className="cover-foot">{m.publisher}</div>
    </div>
  );
}

export function CandleFace({ happy, size = 46 }) {
  const color = happy ? "#5DAE4B" : "#D0403A";
  return (
    <svg width={size * 0.5} height={size * 1.6} viewBox="0 0 30 96" aria-hidden>
      <rect x="11" y="0" width="8" height="96" rx="4" fill={color} />
      <rect x="1" y="24" width="28" height="44" rx="7" fill={color} />
      <circle cx="10" cy={happy ? 40 : 52} r="3.4" fill="#fff" />
      <circle cx="20" cy={happy ? 40 : 52} r="3.4" fill="#fff" />
      <path d={happy ? "M8 50 Q15 60 22 50" : "M8 42 Q15 32 22 42"} stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Back({ book }) {
  const m = book.meta;
  return (
    <div className="back2" data-testid="back-cover">
      <div className="back2-top"><CandleFace size={70} /></div>
      <div className="back2-mid">
        <div className="back2-title">ha<span className="r">p</span>piness<br />trad<span className="g">i</span>ng</div>
        <p className="back2-quote">“Menjadi Happiness Trader berarti belajar untuk tetap utuh saat rugi, tetap rendah hati saat untung.”</p>
        <p className="back2-blurb">{m.back_blurb}</p>
        <p className="back2-tag">Happy Trade. Happy Mind. Happier Life.</p>
      </div>
      <div className="back2-foot">
        <span>{m.author}</span>
        <CandleFace happy size={50} />
        <span>{m.publisher}</span>
      </div>
    </div>
  );
}

function TitlePage({ book }) {
  const m = book.meta;
  return (
    <div className="pg-pad title-page">
      <div className="kicker">Sebuah buku tentang trading & ketenangan</div>
      <h1 className="tp-title">Happiness<br />Trading</h1>
      <p className="tp-sub">{m.subtitle}</p>
      <div className="tp-rule" />
      <p className="tp-author">{m.author}</p>
      <p className="tp-pub">{m.publisher} · {m.year}</p>
    </div>
  );
}

function Dedication({ page }) {
  const blocks = parseContent(page.section.content);
  return (
    <div className="pg-pad dedication">
      <div className="kicker">Persembahan</div>
      <div className="ded-text">
        {page.section.content.split("\n\n")[0].split("\n").map((l, i) => <p key={i}>{l}</p>)}
      </div>
      {blocks.filter((b) => b.t === "note").map((b, i) => <div key={i} className="blk blk-note">{b.text}</div>)}
    </div>
  );
}

function TocPage({ page, toc }) {
  const items = toc.items.slice(page.chunkIndex * toc.perPage, (page.chunkIndex + 1) * toc.perPage);
  return (
    <div className="pg-pad toc-page">
      {page.chunkIndex === 0 && <h2 className="blk blk-title">Daftar Isi</h2>}
      <div className="toc-list">
        {items.map((it) => (
          <div key={it.key} className={`toc-row toc-${it.type}`}>
            {it.label && <span className="toc-label">{it.label}</span>}
            <span className="toc-text">{it.title}</span>
            <span className="toc-dots" />
            <span className="toc-num">{it.page}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Block({ b, hl, onToggle }) {
  const cls = `${blockClass(b)}${hl ? " blk-hl" : ""}`;
  if (b.t === "img") return <div className={cls}><img src={assetUrl(b.src)} alt="" crossOrigin="anonymous" /></div>;
  return (
    <div className={cls} data-hl-id={b.id} onClick={onToggle ? () => onToggle(b.id, b.text) : undefined}>{b.text}</div>
  );
}

// In highlight mode, stop page-flip from reacting so taps toggle highlights instead.
function useHlStop() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const stop = (e) => { if (document.body.dataset.hlmode === "1") e.stopPropagation(); };
    const types = ["mousedown", "touchstart", "pointerdown", "mouseup", "touchend"];
    types.forEach((t) => el.addEventListener(t, stop));
    return () => types.forEach((t) => el.removeEventListener(t, stop));
  }, []);
  return ref;
}

function TextPage({ page, print }) {
  const { highlights, toggleHighlight, hlMode } = useReaderState();
  const ref = useHlStop();
  return (
    <>
      <div className="pg-header">{page.header}</div>
      <div className={`page-body ${hlMode && !print ? "hl-mode" : ""}`} ref={ref}>
        {page.blocks.map((b, i) => (
          <Block key={i} b={b} hl={!!highlights[b.id] && b.t !== "img"} onToggle={hlMode && !print && b.t !== "img" ? toggleHighlight : undefined} />
        ))}
      </div>
    </>
  );
}

function PartPage({ page }) {
  const s = page.section;
  return (
    <div className="pg-pad part-page" data-testid={`part-page-${s.part_number}`}>
      <div className="part-num">0{s.part_number}</div>
      <div className="kicker">Bagian {NUM_WORDS[s.part_number]}</div>
      <h2 className="part-title">{s.title}</h2>
      <p className="part-desc">{s.content}</p>
      <Candles className="part-candles" height={70} />
    </div>
  );
}

function ChapterPage({ page }) {
  const s = page.section;
  return (
    <div className="pg-pad chapter-page" data-testid={`chapter-opener-${s.chapter_number}`}>
      <div className="kicker">Bagian {s.part_number} · Bab {s.chapter_number}</div>
      <div className="ch-num">{String(s.chapter_number).padStart(2, "0")}</div>
      <h2 className="ch-title">{s.title}</h2>
      {s.subtitle && <p className="ch-sub">{s.subtitle}</p>}
      <div className="ch-rule" />
      {s.illustration && <img className="ch-illus" src={assetUrl(s.illustration)} alt={s.title} crossOrigin="anonymous" />}
    </div>
  );
}

function AuthorPage({ page, book }) {
  const blocks = parseContent(page.section.content);
  const photo = book.meta.author_photo;
  return (
    <div className="pg-pad author-page" data-testid="author-profile-card">
      <h2 className="blk blk-title">Profil Penulis</h2>
      <div className="author-head">
        {photo
          ? <img className="author-avatar author-photo" src={assetUrl(photo)} alt="Ongah Hermanto" crossOrigin="anonymous" />
          : <div className="author-avatar">OH</div>}
        <div>
          <div className="author-name">Ongah Hermanto</div>
          <div className="kicker">Penulis · Founder A Trader Hub Indonesia</div>
        </div>
      </div>
      <div className="author-bio">
        {blocks.map((b, i) => <div key={i} className={blockClass(b)}>{b.text}</div>)}
      </div>
    </div>
  );
}

function Blank() {
  return <div className="blank-page"><span>◆</span></div>;
}

const RENDER = {
  cover: Cover, back: Back, title: TitlePage, dedication: Dedication, toc: TocPage, text: TextPage,
  part: PartPage, chapter: ChapterPage, author: AuthorPage, blank: Blank, quiz: QuizPage, reflection: ReflectionPage, worksheet: WorksheetPage,
};

export function PageContent({ page, index, book, toc, print }) {
  const C = RENDER[page.kind];
  const side = index === 0 ? "right" : index % 2 === 1 ? "left" : "right";
  return (
    <div className={`pg pg-${page.kind} pg-side-${side}`} style={{ width: PAGE_W, height: PAGE_H }}>
      <C page={page} book={book} toc={toc} print={print} />
      {!NO_NUM.has(page.kind) && <div className="pg-num" data-testid={print ? undefined : `page-number-${index}`}>{index}</div>}
    </div>
  );
}

export const FlipPage = forwardRef(function FlipPage({ scale, ...rest }, ref) {
  return (
    <div ref={ref} className="flip-page" data-density={HARD.has(rest.page.kind) ? "hard" : "soft"}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAGE_W, height: PAGE_H }}>
        <PageContent {...rest} />
      </div>
    </div>
  );
});
