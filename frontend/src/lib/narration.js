import { parseContent } from "./book";

const blocksText = (blocks = []) => blocks.filter((b) => b.text && !["img", "spacer"].includes(b.t)).map((b) => b.text).join(" ");

export function pageText(p, book) {
  const s = p?.section;
  switch (p?.kind) {
    case "title": return `${book.meta.title}. ${book.meta.subtitle || ""}. Oleh ${book.meta.author}.`;
    case "part": return `Bagian ${s.part_number}. ${s.title}. ${s.content || ""}`;
    case "chapter": return `Bab ${s.chapter_number}. ${s.title}. ${s.subtitle || ""}`;
    case "text": return blocksText(p.blocks);
    case "author": return `${s.title}. ${blocksText(p.blocks)}`;
    case "dedication": return `${s.title}. ${blocksText(parseContent(s.content))}`;
    default: return "";
  }
}

export function toChunks(text) {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?…:;])\s+/);
  const out = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last && last.length + s.length < 220) out[out.length - 1] = `${last} ${s}`;
    else out.push(s);
  }
  return out.filter(Boolean);
}

const MALE = /ardi|andika|male|pria|laki|gadis-?x/i;

export function pickVoice() {
  const id = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().replace("_", "-").startsWith("id"));
  const male = id.find((v) => MALE.test(v.name) && !/female|wanita|gadis/i.test(v.name));
  return { voice: male || id[0] || null, male: !!male };
}
