import { useEffect, useRef } from "react";
import { BlockList, ChapterPage, PartPage, AuthorPage, TitlePage, Back, assetUrl } from "../book/Pages";
import { WorksheetPage } from "../book/WorksheetPage";
import { QuizPage } from "../book/QuizPage";
import { sectionBlocks } from "../../lib/book";
import { useReaderState } from "../book/readerState";

function QuizSection({ s }) {
  const ws = s.quiz?.worksheet || [];
  const qs = (s.quiz?.questions || []).map((q, i) => ({ ...q, index: i }));
  const title = { t: "title", kicker: `Bagian ${s.part_number} · Lembar Praktik`, text: s.title, sub: s.subtitle || "" };
  return (
    <>
      {ws.length > 0 && <div className="rv-card"><WorksheetPage page={{ section: s, items: [title, ...ws] }} /></div>}
      {qs.length > 0 && <div className="rv-card"><QuizPage page={{ section: s, questions: qs, first: true, last: true }} /></div>}
    </>
  );
}

function SectionBody({ s, book }) {
  if (s.type === "title") return <div className="rv-card rv-title"><TitlePage book={book} /></div>;
  if (s.type === "part") return <div className="rv-card rv-part"><PartPage page={{ section: s }} /></div>;
  if (s.type === "quiz") return <QuizSection s={s} />;
  if (s.type === "author") return <div className="rv-card"><AuthorPage page={{ section: s, blocks: sectionBlocks(s) }} book={book} /></div>;
  return (
    <>
      {s.type === "chapter" && <div className="rv-card rv-chapter"><ChapterPage page={{ section: s }} /></div>}
      <div className="rv-text"><BlockList blocks={sectionBlocks(s)} /></div>
    </>
  );
}

export function ReadingView({ book, onSection, fontPct = 100 }) {
  const { hlMode } = useReaderState();
  const ref = useRef(null);
  useEffect(() => {
    const els = [...ref.current.querySelectorAll("[data-sec]")];
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) onSection(vis[0].target.dataset.sec);
    }, { rootMargin: "-80px 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [onSection]);
  return (
    <div className={`reading-view ${hlMode ? "hl-mode" : ""}`} ref={ref} data-testid="reading-view" style={{ "--rv-k": fontPct / 100 }}>
      <img className="rv-cover" src={assetUrl(book.meta.front_cover)} alt="Cover Happiness Trading" />
      {book.sections.filter((s) => s.type !== "toc").map((s) => (
        <section key={s.key} id={`sec-${s.key}`} data-sec={s.key} className="rv-section">
          <SectionBody s={s} book={book} />
        </section>
      ))}
      <div className="rv-card rv-back"><Back book={book} /></div>
    </div>
  );
}
