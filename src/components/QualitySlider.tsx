"use client";

import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function QualitySlider({ value, onChange }: QualitySliderProps) {
  const label =
    value >= 80 ? "High" : value >= 50 ? "Medium" : value >= 20 ? "Low" : "Very Low";

  const color =
    value >= 80
      ? "bg-green-100 text-green-700 border-green-200"
      : value >= 50
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : "bg-red-100 text-red-700 border-red-200";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/80">Quality</label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold tabular-nums">{value}</span>
          <Badge variant="outline" className={`text-xs ${color}`}>
            {label}
          </Badge>
        </div>
      </div>
      <Slider
        min={1}
        max={100}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span>Smallest file</span>
        <span>Best quality</span>
      </div>
    </div>
  );
}
