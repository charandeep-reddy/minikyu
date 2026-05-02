"use client";

import { Slider } from "@/components/ui/slider";

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function QualitySlider({ value, onChange }: QualitySliderProps) {
  const label =
    value >= 80 ? "High" : value >= 50 ? "Medium" : value >= 20 ? "Low" : "Very Low";

  const hue = Math.round((value / 100) * 120);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <label className="text-sm font-medium text-foreground/80">Quality</label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold tabular-nums">{value}</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border"
            style={{
              color: `hsl(${hue}, 50%, 35%)`,
              backgroundColor: `hsl(${hue}, 60%, 90%)`,
              borderColor: `hsl(${hue}, 50%, 80%)`,
            }}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(to right, hsl(0, 70%, 50%), hsl(60, 70%, 50%), hsl(120, 70%, 50%))`,
          }}
        />
        <Slider
          min={1}
          max={100}
          step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          className="w-full [&_[role=slider]]:z-10 [&_[role=slider]]:border-2 [&_[role=slider]]:border-background [&_[role=slider]]:shadow-md"
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span>Smallest file</span>
        <span>Best quality</span>
      </div>
    </div>
  );
}
