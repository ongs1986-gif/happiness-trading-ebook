import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const waitImages = (root) => Promise.all([...root.querySelectorAll("img")].map((img) =>
  img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; })));

export async function exportPdf(container, onProgress) {
  const nodes = [...container.querySelectorAll(".pg")];
  await waitImages(container);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5", compress: true });
  for (let i = 0; i < nodes.length; i++) {
    const target = nodes[i];
    const canvas = await html2canvas(target, {
      scale: 2, useCORS: true, backgroundColor: "#FDFBF7", logging: false,
      ignoreElements: (el) => el.classList?.contains("reader") || (el.classList?.contains("pg") && el !== target)
        || el.getAttribute?.("role") === "dialog" || el.dataset?.state === "open",
    });
    if (i > 0) pdf.addPage("a5", "portrait");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.86), "JPEG", 0, 0, 148, 210, undefined, "FAST");
    onProgress(((i + 1) / nodes.length) * 100);
    await new Promise((r) => setTimeout(r, 0));
  }
  pdf.save("Happiness-Trading-Ongah-Hermanto.pdf");
}
