import { Separator } from "./ui/separator";
import QualitySlider from "./QualitySlider";
import FormatSelector from "./FormatSelector";
import ResizeControls from "./ResizeControls";
import { Dimensions } from "@/lib/transform";
import { OutputFormat } from "@/lib/convert";

interface ControlPanelProps {
  quality: number;
  setQuality: (quality: number) => void;
  format: OutputFormat;
  setFormat: (format: OutputFormat) => void;
  original: Dimensions | null;
  width: number;
  height: number;
  lockAspect: boolean;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setLockAspect: (lockAspect: boolean) => void;
  handleScale: (scale: number) => void;
}

export default function ControlPanel({ quality, setQuality, format, setFormat, original, width, height, lockAspect, setWidth, setHeight, setLockAspect, handleScale }: ControlPanelProps) {
  return (
    <div className="space-y-5">
      <QualitySlider value={quality} onChange={setQuality} />
      <Separator />
      <FormatSelector value={format} onChange={setFormat} />
      <Separator />
      <ResizeControls
        original={
          original ||
          { width: 0, height: 0 }
        }
        width={width}
        height={height}
        lockAspect={lockAspect}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onLockChange={setLockAspect}
        onScaleChange={handleScale}
      />
      <Separator />
    </div>
  );
}