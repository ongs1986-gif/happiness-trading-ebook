import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
// Bump when pagination rules or page CSS change, so a fresh shared layout is computed.
export const LAYOUT_VERSION = "v1";

const serialize = (built) => ({
  ...built,
  pages: built.pages.map(({ section, ...p }) => (section ? { ...p, sk: section.key } : p)),
});

const deserialize = (layout, sections) => {
  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  return { ...layout, pages: layout.pages.map(({ sk, ...p }) => (sk ? { ...p, section: byKey[sk] } : p)) };
};

// Returns the shared (locked) layout; computes and stores it only if none exists yet for this content.
export async function getLockedLayout(book, compute, canSave = true) {
  const key = `${book.content_hash}:${LAYOUT_VERSION}`;
  try {
    const { data } = await axios.get(`${API}/layout/${encodeURIComponent(key)}`);
    return deserialize(data.layout, book.sections);
  } catch (e) {
    if (e.response?.status !== 404) throw e;
  }
  const built = compute();
  if (!canSave) return built;
  try {
    const { data } = await axios.post(`${API}/layout`, { key, layout: serialize(built) });
    return deserialize(data.layout, book.sections);
  } catch {
    return built;
  }
}
