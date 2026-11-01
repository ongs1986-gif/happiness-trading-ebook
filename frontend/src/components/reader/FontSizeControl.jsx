import { Type } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";

export function FontSizeControl({ value, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="tb-icon" data-testid="btn-font-size" aria-label="Ukuran huruf" title="Ukuran huruf"><Type size={16} /></button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-[#FDFBF7] border-[#E8E2D5]" data-testid="font-size-popover">
        <div className="kicker-ui mb-3">Ukuran Huruf</div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#65605A]">A</span>
          <Slider data-testid="font-size-slider" min={80} max={150} step={5} value={[value]} onValueChange={([v]) => onChange(v)} className="flex-1" />
          <span className="text-lg font-semibold text-[#65605A]">A</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#65605A]" data-testid="font-size-value">{value}%</span>
          <button type="button" className="text-xs font-semibold text-[#3B8258]" data-testid="font-size-reset" onClick={() => onChange(100)}>Atur ulang</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
