"use client";

import { Switch } from "@/components/ui/switch";
import { type Dimensions } from "@/lib/transform";
import { Lock, Unlock, Maximize2 } from "lucide-react";

interface ResizeControlsProps {
  original: Dimensions | null;
  width: number;
  height: number;
  lockAspect: boolean;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  onLockChange: (locked: boolean) => void;
  onScaleChange: (scale: number) => void;
}

const scales = [25, 50, 75, 100];

export default function ResizeControls({
  original,
  width,
  height,
  lockAspect,
  onWidthChange,
  onHeightChange,
  onLockChange,
  onScaleChange,
}: ResizeControlsProps) {
  if (!original) return null;

  const aspect = original.width / original.height;

  const handleWidth = (val: string) => {
    const w = parseInt(val) || 0;
    onWidthChange(w);
    if (lockAspect && w > 0) {
      onHeightChange(Math.round(w / aspect));
    }
  };

  const handleHeight = (val: string) => {
    const h = parseInt(val) || 0;
    onHeightChange(h);
    if (lockAspect && h > 0) {
      onWidthChange(Math.round(h * aspect));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Maximize2 className="w-3 h-3 text-primary" />
        </div>
        <label className="text-sm font-medium text-foreground/80">Resize</label>
        {original && (
          <span className="text-[10px] text-muted-foreground/50 ml-auto font-mono">
            {original.width}×{original.height}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
        <div className="flex-1 space-y-1">
          <span className="text-[11px] text-muted-foreground">Width (px)</span>
          <input
            type="number"
            min={1}
            value={width || ""}
            onChange={(e) => handleWidth(e.target.value)}
            placeholder={String(original.width)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-center gap-1 sm:gap-0.5 sm:pb-1.5">
          <button
            onClick={() => onLockChange(!lockAspect)}
            className={`transition-colors sm:flex sm:flex-col sm:items-center sm:gap-0.5 ${lockAspect ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground/60"}`}
            title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {lockAspect ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] hidden sm:inline text-muted-foreground/50">{lockAspect ? "Locked" : "Unlocked"}</span>
          </button>
          <Switch checked={lockAspect} onCheckedChange={onLockChange} className="scale-75 sm:hidden" />
        </div>

        <div className="flex-1 space-y-1">
          <span className="text-[11px] text-muted-foreground">Height (px)</span>
          <input
            type="number"
            min={1}
            value={height || ""}
            onChange={(e) => handleHeight(e.target.value)}
            placeholder={String(original.height)}
            disabled={lockAspect}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex gap-1.5 p-0.5 rounded-lg bg-muted/50">
        {scales.map((s) => (
          <button
            key={s}
            onClick={() => onScaleChange(s)}
            className="flex-1 text-xs font-medium h-8 rounded-md bg-transparent text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm transition-all duration-150 active:scale-95"
          >
            {s}%
          </button>
        ))}
      </div>
    </div>
  );
}
