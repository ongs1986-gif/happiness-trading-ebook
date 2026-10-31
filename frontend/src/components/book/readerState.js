import { createContext, useContext, useEffect, useState } from "react";

const ReaderContext = createContext(null);

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export function ReaderStateProvider({ children }) {
  const [highlights, setHighlights] = useState(() => load("ht-hl", {}));
  const [bookmarks, setBookmarks] = useState(() => load("ht-bm", []));
  const [hlMode, setHlMode] = useState(false);
  useEffect(() => { localStorage.setItem("ht-hl", JSON.stringify(highlights)); }, [highlights]);
  useEffect(() => { localStorage.setItem("ht-bm", JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { document.body.dataset.hlmode = hlMode ? "1" : "0"; }, [hlMode]);

  const toggleHighlight = (id, text) => setHighlights((h) => {
    const next = { ...h };
    if (next[id]) delete next[id]; else next[id] = text.slice(0, 160);
    return next;
  });
  const toggleBookmark = (page, label) => setBookmarks((b) =>
    b.some((x) => x.page === page) ? b.filter((x) => x.page !== page) : [...b, { page, label }].sort((x, y) => x.page - y.page));

  return (
    <ReaderContext.Provider value={{ highlights, toggleHighlight, bookmarks, toggleBookmark, hlMode, setHlMode }}>
      {children}
    </ReaderContext.Provider>
  );
}

export const useReaderState = () => useContext(ReaderContext);
