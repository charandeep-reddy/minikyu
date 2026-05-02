import { Settings } from "lucide-react";
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

export default function ControlPanel({
  quality,
  setQuality,
  format,
  setFormat,
  original,
  width,
  height,
  lockAspect,
  setWidth,
  setHeight,
  setLockAspect,
  handleScale,
}: ControlPanelProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-5 shadow-sm">
      <div className="flex items-center gap-2 pb-1 border-b border-border/30">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground/80">Settings</h2>
      </div>
      <QualitySlider value={quality} onChange={setQuality} />
      <div className="h-px bg-gradient-to-r from-border/60 via-border to-border/60" />
      <FormatSelector value={format} onChange={setFormat} />
      <div className="h-px bg-gradient-to-r from-border/60 via-border to-border/60" />
      <ResizeControls
        original={original || { width: 0, height: 0 }}
        width={width}
        height={height}
        lockAspect={lockAspect}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onLockChange={setLockAspect}
        onScaleChange={handleScale}
      />
    </div>
  );
}
