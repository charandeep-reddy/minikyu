"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { type Dimensions } from "@/lib/transform";

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
      <label className="text-sm font-medium text-foreground/80">Resize</label>

      {/* Dimension inputs */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Width</span>
          <input
            type="number"
            min={1}
            value={width || ""}
            onChange={(e) => handleWidth(e.target.value)}
            placeholder={String(original.width)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col items-center gap-1 pb-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-colors ${lockAspect ? "text-primary" : "text-muted-foreground/40"}`}
          >
            {lockAspect ? (
              <path d="M16 11V7a4 4 0 0 0-8 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
            ) : (
              <path d="M18 8V7a4 4 0 0 0-8 0M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
            )}
          </svg>
          <Switch
            checked={lockAspect}
            onCheckedChange={onLockChange}
            className="scale-75"
          />
        </div>

        <div className="flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Height</span>
          <input
            type="number"
            min={1}
            value={height || ""}
            onChange={(e) => handleHeight(e.target.value)}
            placeholder={String(original.height)}
            disabled={lockAspect}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Scale buttons */}
      <div className="flex gap-2">
        {scales.map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onScaleChange(s)}
          >
            {s}%
          </Button>
        ))}
      </div>

      {/* Dimension summary */}
      <p className="text-xs text-muted-foreground">
        {original.width}×{original.height} → {width || original.width}×{height || original.height}
      </p>
    </div>
  );
}
