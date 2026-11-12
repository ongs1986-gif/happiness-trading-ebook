import { useEffect, useState } from "react";
import { FileArchive, FileText, Printer } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/print/files`;
const SIZES = [{ key: "14x21", label: "14 × 21 cm" }, { key: "A5", label: "A5 · 14,8 × 21 cm" }];
const KINDS = [
  { prefix: "Percetakan", ext: "zip", label: "Paket lengkap (ZIP)", icon: FileArchive },
  { prefix: "Isi", ext: "pdf", label: "Isi buku (PDF)", icon: FileText },
  { prefix: "Cover", ext: "pdf", label: "Sampul (PDF)", icon: FileText },
  { prefix: "Isi", ext: "docx", label: "Isi buku (Word, bisa diedit)", icon: FileText },
];
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;

export function PrintFiles() {
  const [files, setFiles] = useState({});
  useEffect(() => {
    fetch(API).then((r) => r.json()).then((list) => setFiles(Object.fromEntries(list.map((f) => [f.name, f.size])))).catch(() => {});
  }, []);
  return (
    <div className="print-files" data-testid="print-files-section">
      <div className="print-files-head"><Printer size={15} /> File untuk percetakan</div>
      <p className="print-files-note">Siap cetak full warna dengan bleed 3 mm. Berikan paket ZIP ke percetakan — isinya PDF isi, PDF sampul (depan + punggung + belakang), versi Word, font, dan petunjuk.</p>
      {SIZES.map((s) => (
        <div key={s.key} className="print-size" data-testid={`print-size-${s.key}`}>
          <div className="print-size-label">{s.label}</div>
          {KINDS.map((k) => {
            const name = `HappinessTrading_${k.prefix}_${s.key}.${k.ext}`;
            const Icon = k.icon;
            return (
              <a key={name} href={`${API}/${name}`} download className="print-link" data-testid={`print-download-${k.prefix.toLowerCase()}-${k.ext}-${s.key}`}>
                <Icon size={14} /><span>{k.label}</span><span className="print-size-mb">{files[name] ? mb(files[name]) : ""}</span>
              </a>
            );
          })}
        </div>
      ))}
    </div>
  );
}
