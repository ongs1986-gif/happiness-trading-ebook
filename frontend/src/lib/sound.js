let ctx;

// Soft paper rustle synthesised with filtered noise (no audio file needed).
export function playFlipSound() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const dur = 0.42;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * t), 1.6) * (0.6 + 0.4 * Math.random());
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(900, ctx.currentTime);
    bp.frequency.linearRampToValueAtTime(3200, ctx.currentTime + dur);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 400;
    const gain = ctx.createGain();
    gain.gain.value = 0.16;
    src.connect(bp).connect(hp).connect(gain).connect(ctx.destination);
    src.start();
  } catch {
    /* audio unavailable */
  }
}
