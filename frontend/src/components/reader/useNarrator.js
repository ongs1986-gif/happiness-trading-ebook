import { useCallback, useEffect, useRef, useState } from "react";
import { pickVoice, toChunks } from "../../lib/narration";

export function useNarrator() {
  const [state, setState] = useState({ on: false, playing: false, idx: -1 });
  const [rate, setRateState] = useState(() => Number(localStorage.getItem("ht-rate")) || 1);
  const R = useRef({ texts: [], idx: 0, chunk: 0, chunks: [], token: 0, rate, onIdx: null });
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const speakFrom = useCallback((idx, chunk = 0) => {
    const r = R.current;
    const tk = ++r.token;
    synth.cancel();
    let i = idx;
    while (i < r.texts.length && !r.texts[i]) i++;
    if (i >= r.texts.length) { setState((s) => ({ ...s, playing: false })); return; }
    r.idx = i; r.chunks = toChunks(r.texts[i]); r.chunk = chunk;
    if (chunk === 0) r.onIdx?.(i);
    setState({ on: true, playing: true, idx: i });
    const step = () => {
      if (tk !== r.token) return;
      if (r.chunk >= r.chunks.length) { speakFrom(i + 1); return; }
      const u = new SpeechSynthesisUtterance(r.chunks[r.chunk]);
      const { voice, male } = pickVoice();
      u.lang = "id-ID";
      if (voice) u.voice = voice;
      u.pitch = male ? 1 : 0.8;
      u.rate = r.rate;
      u.onend = u.onerror = () => { if (tk !== r.token) return; r.chunk++; step(); };
      synth.speak(u);
    };
    step();
  }, [synth]);

  const start = useCallback((texts, idx, onIdx) => {
    Object.assign(R.current, { texts, onIdx });
    speakFrom(idx);
  }, [speakFrom]);
  const pause = useCallback(() => { R.current.token++; synth.cancel(); setState((s) => ({ ...s, playing: false })); }, [synth]);
  const resume = useCallback(() => speakFrom(R.current.idx, R.current.chunk), [speakFrom]);
  const stop = useCallback(() => { R.current.token++; synth?.cancel(); setState({ on: false, playing: false, idx: -1 }); }, [synth]);
  const setRate = useCallback((v) => {
    R.current.rate = v;
    setRateState(v);
    localStorage.setItem("ht-rate", String(v));
    if (state.playing) speakFrom(R.current.idx, R.current.chunk);
  }, [state.playing, speakFrom]);

  useEffect(() => () => { R.current.token++; synth?.cancel(); }, [synth]);
  useEffect(() => { synth?.getVoices(); }, [synth]);

  return { ...state, rate, supported: !!synth, start, pause, resume, stop, setRate, speakFrom };
}
