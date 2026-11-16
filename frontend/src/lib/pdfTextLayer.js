const WORD = /\S+/g;

function collectLines(node) {
  const words = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const el = t.parentElement;
    if (!el || getComputedStyle(el).visibility === "hidden") continue;
    for (const m of t.data.matchAll(WORD)) {
      range.setStart(t, m.index);
      range.setEnd(t, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      if (r.width && r.height) words.push({ text: m[0], left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }
  }
  const lines = [];
  for (const w of words) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line.top - w.top) < 3 && w.left >= line.right - 1) {
      line.text += ` ${w.text}`;
      line.right = w.right;
      line.bottom = Math.max(line.bottom, w.bottom);
    } else lines.push({ ...w });
  }
  return lines;
}

// Invisible, selectable text over the page image so quotes can be copied.
export function addTextLayer(pdf, node, pageW) {
  const box = node.getBoundingClientRect();
  const k = pageW / box.width;
  pdf.setFont("helvetica", "normal");
  for (const l of collectLines(node)) {
    const h = (l.bottom - l.top) * k;
    const w = (l.right - l.left) * k;
    const unit = pdf.getStringUnitWidth(l.text);
    if (!unit) continue;
    const size = Math.min((w * pdf.internal.scaleFactor) / unit, h * pdf.internal.scaleFactor * 1.1);
    pdf.setFontSize(size);
    pdf.text(l.text, (l.left - box.left) * k, (l.bottom - box.top) * k - h * 0.22, { renderingMode: "invisible" });
  }
}
