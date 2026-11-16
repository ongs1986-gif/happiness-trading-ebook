import { Headphones, Pause, Play, X } from "lucide-react";

const RATES = [0.75, 1, 1.25, 1.5];

export function NarratorBar({ playing, label, rate, onPlay, onPause, onStop, onRate }) {
  return (
    <div className="narrator-bar" data-testid="narrator-bar">
      <Headphones size={16} className="narrator-ic" />
      <div className="narrator-label" data-testid="narrator-status">{playing ? "Membacakan" : "Dijeda"} · {label}</div>
      <button type="button" className="narrator-btn narrator-main" data-testid="narrator-play-pause" onClick={playing ? onPause : onPlay}
        aria-label={playing ? "Jeda" : "Lanjutkan"}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
      <div className="narrator-rates" data-testid="narrator-speed">
        {RATES.map((r) => (
          <button key={r} type="button" className={`narrator-rate ${rate === r ? "is-on" : ""}`} data-testid={`narrator-speed-${r}`}
            onClick={() => onRate(r)}>{String(r).replace(".", ",")}×</button>
        ))}
      </div>
      <button type="button" className="narrator-btn" data-testid="narrator-stop" onClick={onStop} aria-label="Berhenti"><X size={16} /></button>
    </div>
  );
}
