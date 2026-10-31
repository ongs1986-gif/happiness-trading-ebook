import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function exportPdf(container, onProgress) {
  const nodes = [...container.querySelectorAll(".pg")];
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5", compress: true });
  for (let i = 0; i < nodes.length; i++) {
    const canvas = await html2canvas(nodes[i], { scale: 2.2, useCORS: true, backgroundColor: "#FDFBF7", logging: false });
    if (i > 0) pdf.addPage("a5", "portrait");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, 148, 210, undefined, "FAST");
    onProgress(((i + 1) / nodes.length) * 100);
    await new Promise((r) => setTimeout(r, 0));
  }
  pdf.save("Happiness-Trading-Ongah-Hermanto.pdf");
}
