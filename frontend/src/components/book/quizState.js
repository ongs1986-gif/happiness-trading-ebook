import { createContext, useContext, useEffect, useRef, useState } from "react";

const QuizContext = createContext(null);
const EMPTY = { answers: {}, reflections: {}, submitted: false };

export function QuizProvider({ children }) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ht-quiz") || "{}"); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("ht-quiz", JSON.stringify(state)); }, [state]);
  const update = (part, fn) => setState((s) => ({ ...s, [part]: fn({ ...EMPTY, ...(s[part] || {}) }) }));
  return <QuizContext.Provider value={{ state, update }}>{children}</QuizContext.Provider>;
}

export function useQuiz(part) {
  const { state, update } = useContext(QuizContext);
  return [{ ...EMPTY, ...(state[part] || {}) }, (fn) => update(part, fn)];
}

// Native listeners fire before page-flip's handlers so inputs don't trigger a page turn.
export function useStopFlip() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    const types = ["mousedown", "touchstart", "pointerdown", "mouseup", "touchend"];
    types.forEach((t) => el.addEventListener(t, stop));
    return () => types.forEach((t) => el.removeEventListener(t, stop));
  }, []);
  return ref;
}
