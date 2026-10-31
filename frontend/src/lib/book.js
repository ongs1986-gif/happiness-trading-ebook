export const PAGE_W = 440;
export const PAGE_H = 624;
export const BODY_W = 356;
export const BODY_H = 514;
const TOC_PER_PAGE = 17;
const Q_PER_PAGE = 2;
const SPLITTABLE = new Set(["p", "quote", "li", "note"]);
const IMG_H = 238;

export function parseContent(text = "") {
  return text.split("\n").filter((l) => l.trim()).map((l) => {
    if (l.startsWith("### ")) return { t: "h3", text: l.slice(4) };
    if (l.startsWith("## ")) return { t: "h2", text: l.slice(3) };
    if (l.startsWith("![](")) return { t: "img", src: l.slice(4, -1), text: "" };
    if (l.startsWith("~ ")) return { t: "verse", text: l.slice(2).split("\\n").join("\n") };
    if (l.startsWith("> ")) return { t: "quote", text: l.slice(2) };
    if (l.startsWith("- ")) return { t: "li", text: l.slice(2) };
    if (l.startsWith("[") && l.endsWith("]")) return { t: "note", text: l };
    return { t: "p", text: l };
  });
}

export const blockClass = (b) => `blk blk-${b.t}${b.cont ? " blk-cont" : ""}`;

function makeNode(b) {
  const d = document.createElement("div");
  d.className = blockClass(b);
  if (b.t === "img") d.style.height = `${IMG_H}px`;
  else d.textContent = b.text;
  return d;
}

const div = (cls, text, style) => {
  const d = document.createElement("div");
  d.className = cls;
  if (text) d.textContent = text;
  if (style) Object.assign(d.style, style);
  return d;
};

export const fieldHeight = (rows) => rows * 24;

function makeWsNode(it) {
  if (it.t === "title") {
    const d = div("ws-title");
    d.append(div("kicker", it.kicker), div("ws-title-h", it.text), div("ws-title-sub", it.sub));
    return d;
  }
  if (it.t === "h") return div("ws-h", it.text);
  if (it.t === "p") return div("ws-p", it.text);
  const d = div("ws-item");
  if (it.label) d.appendChild(div("ws-label", it.label));
  if (it.t === "field") d.appendChild(div("ws-area", "", { height: `${fieldHeight(it.rows)}px` }));
  if (it.t === "input") d.appendChild(div("ws-line"));
  if (it.t === "checks") it.options.forEach((o) => d.appendChild(div("ws-check", o)));
  return d;
}

function paginate(blocks, el, make = makeNode, split = true) {
  const pages = [];
  let cur = [];
  el.innerHTML = "";
  const fits = () => el.scrollHeight <= el.clientHeight;
  const tryFit = (b) => {
    const n = make(b);
    el.appendChild(n);
    const ok = fits();
    el.removeChild(n);
    return ok;
  };
  const commit = (b) => { el.appendChild(make(b)); cur.push(b); };
  const newPage = () => { pages.push(cur); cur = []; el.innerHTML = ""; };

  const KEEP = new Set(["h2", "h3", "h"]);
  const fitsWithNext = (b, nx) => {
    const a = make(b);
    const n = make(nx && SPLITTABLE.has(nx.t) && split ? { ...nx, text: nx.text.split(" ").slice(0, 12).join(" ") } : nx);
    el.append(a, n);
    const ok = fits();
    a.remove(); n.remove();
    return ok;
  };

  for (const [bi, b] of blocks.entries()) {
    const nx = blocks[bi + 1];
    if (KEEP.has(b.t) && nx && cur.length && !fitsWithNext(b, nx)) { newPage(); commit(b); continue; }
    if (tryFit(b)) { commit(b); continue; }
    if (!split || !SPLITTABLE.has(b.t)) { if (cur.length) newPage(); commit(b); continue; }
    let words = b.text.split(" ");
    let cont = !!b.cont;
    while (words.length) {
      const piece = (n) => ({ ...b, cont, text: words.slice(0, n).join(" ") });
      if (tryFit(piece(words.length))) { commit(piece(words.length)); break; }
      let lo = 0, hi = words.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (tryFit(piece(mid))) lo = mid; else hi = mid - 1;
      }
      if (lo === 0) {
        if (!cur.length) lo = words.length;
        else { newPage(); continue; }
      }
      commit(piece(lo));
      words = words.slice(lo);
      cont = true;
      if (words.length) newPage();
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export function buildBook(sections, measureEl) {
  const pages = [{ kind: "cover" }];
  const starts = {};
  const tocSections = sections.filter((s) => !["toc", "title"].includes(s.type));
  const tocPageCount = Math.max(1, Math.ceil(tocSections.length / TOC_PER_PAGE));

  for (const s of sections) {
    if (s.start_right && pages.length % 2 === 1) pages.push({ kind: "blank" });
    starts[s.key] = pages.length;
    const withIds = (blocks) => blocks.map((b, i) => ({ ...b, id: `${s.key}:${i}` }));
    if (s.type === "toc") {
      for (let i = 0; i < tocPageCount; i++) pages.push({ kind: "toc", chunkIndex: i, section: s });
    } else if (s.type === "text") {
      const blocks = withIds([{ t: "title", text: s.title }, ...parseContent(s.content)]);
      paginate(blocks, measureEl).forEach((bl) => pages.push({ kind: "text", section: s, blocks: bl, header: s.title }));
    } else if (s.type === "chapter") {
      pages.push({ kind: "chapter", section: s });
      const header = `Bab ${s.chapter_number} · ${s.title}`;
      paginate(withIds(parseContent(s.content)), measureEl).forEach((bl) => pages.push({ kind: "text", section: s, blocks: bl, header }));
    } else if (s.type === "quiz") {
      const ws = s.quiz?.worksheet || [];
      if (ws.length) {
        const items = [{ t: "title", kicker: `Bagian ${s.part_number} · Lembar Praktik`, text: s.title, sub: s.subtitle || "" }, ...ws];
        paginate(items, measureEl, makeWsNode, false).forEach((it) => pages.push({ kind: "worksheet", section: s, items: it }));
      }
      const qs = s.quiz?.questions || [];
      const groups = chunk(qs.map((q, i) => ({ ...q, index: i })), Q_PER_PAGE);
      groups.forEach((g, gi) => pages.push({ kind: "quiz", section: s, questions: g, first: gi === 0, last: gi === groups.length - 1 }));
      if (s.quiz?.reflections?.length) pages.push({ kind: "reflection", section: s });
    } else {
      pages.push({ kind: s.type, section: s });
    }
  }
  if (pages.length % 2 === 0) pages.push({ kind: "blank" });
  pages.push({ kind: "back" });

  const toc = tocSections.map((s) => ({
    key: s.key,
    type: s.type,
    group: s.group,
    title: s.title,
    label: s.type === "chapter" ? `Bab ${s.chapter_number}` : s.type === "part" ? `Bagian ${s.part_number}` : null,
    page: starts[s.key],
  }));
  return { pages, toc, starts, tocPerPage: TOC_PER_PAGE };
}

export function sectionAt(pages, index) {
  for (let i = index; i >= 0; i--) if (pages[i]?.section) return pages[i].section;
  return null;
}
