import { Square, CheckSquare } from "lucide-react";
import { fieldHeight } from "../../lib/book";
import { useQuiz, useStopFlip } from "./quizState";

function WsField({ it, val, put, tid, print }) {
  if (it.t === "field") {
    return print
      ? <div className="ws-area" style={{ height: fieldHeight(it.rows) }}>
          {val ? <div className="ws-print-text">{val}</div> : Array.from({ length: it.rows }, (_, i) => <div key={i} className="ws-print-line" />)}
        </div>
      : <textarea data-testid={tid} className="ws-area reflect-input" style={{ height: fieldHeight(it.rows) }} value={val || ""}
          placeholder="Tulis jawaban Anda…" onChange={(e) => put(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />;
  }
  if (it.t === "input") {
    return (
      <div className="ws-line">
        {it.prefix && <span className="ws-affix">{it.prefix}</span>}
        {print ? <span className="ws-input">{val || ""}</span>
          : <input data-testid={tid} className="ws-input" value={val || ""} onChange={(e) => put(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />}
        {it.suffix && <span className="ws-affix">{it.suffix}</span>}
      </div>
    );
  }
  return it.options.map((o, oi) => {
    const on = (val || []).includes(oi);
    return (
      <button type="button" key={oi} data-testid={`${tid}-${oi}`} className={`ws-check ${on ? "is-on" : ""}`}
        onClick={() => put(on ? val.filter((x) => x !== oi) : [...(val || []), oi])}>
        {on ? <CheckSquare size={13} /> : <Square size={13} />}<span>{o}</span>
      </button>
    );
  });
}

function WsItem({ it, part, state, set, print }) {
  if (it.t === "title") {
    return (
      <div className="ws-title">
        <div className="kicker">{it.kicker}</div>
        <div className="ws-title-h">{it.text}</div>
        <div className="ws-title-sub">{it.sub}</div>
      </div>
    );
  }
  if (it.t === "h") return <div className="ws-h">{it.text}</div>;
  if (it.t === "p") return <div className="ws-p">{it.text}</div>;
  const put = (v) => set((s) => ({ ...s, ws: { ...(s.ws || {}), [it.id]: v } }));
  return (
    <div className="ws-item">
      {it.label && <div className="ws-label">{it.label}</div>}
      <WsField it={it} val={state.ws?.[it.id]} put={put} tid={`ws-p${part}-${it.id}`} print={print} />
    </div>
  );
}

export function WorksheetPage({ page, print }) {
  const part = page.section.part_number;
  const [state, set] = useQuiz(part);
  const ref = useStopFlip();
  const first = page.items[0]?.t === "title";
  return (
    <div className="page-body ws" ref={ref} data-testid={first ? `worksheet-part-${part}` : undefined}>
      {page.items.map((it, i) => <WsItem key={i} it={it} part={part} state={state} set={set} print={print} />)}
    </div>
  );
}
