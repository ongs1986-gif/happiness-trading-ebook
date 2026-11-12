import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { Download, Loader2 } from "lucide-react";

export function PdfModal({ open, onOpenChange, onStart, progress, busy, total }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="bg-[#FDFBF7] border-[#E8E2D5] sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="pdf-download-modal">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#2C2A29]">Unduh sebagai PDF</DialogTitle>
          <DialogDescription className="text-[#65605A]">
            Seluruh {total} halaman buku akan disusun menjadi PDF ukuran A5 (148 × 210 mm), lengkap dengan ilustrasi dan nomor halaman.
          </DialogDescription>
        </DialogHeader>
        {busy ? (
          <div className="space-y-3 py-2" data-testid="pdf-progress">
            <Progress value={progress} className="h-1.5 bg-[#F0EADC]" />
            <p className="text-sm text-[#65605A] flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Menyusun halaman… {Math.round(progress)}%
            </p>
          </div>
        ) : (
          <button type="button" data-testid="pdf-start-button" onClick={onStart} className="tb-btn tb-primary justify-center w-full py-3">
            <Download size={16} /> Mulai Unduh PDF (A5)
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
