"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type OutputFormat } from "@/lib/convert";
import { useEffect, useState } from "react";
import { checkFormatSupport } from "@/lib/convert";

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (value: OutputFormat) => void;
}

const formats: { value: OutputFormat; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

export default function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const [avifSupported, setAvifSupported] = useState<boolean | null>(null);
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);

  useEffect(() => {
    checkFormatSupport("avif").then(setAvifSupported);
    checkFormatSupport("webp").then(setWebpSupported);
  }, []);

  const showWarning =
    (value === "avif" && avifSupported === false) ||
    (value === "webp" && webpSupported === false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/80">Output Format</label>
      <Select value={value} onValueChange={(v) => onChange(v as OutputFormat)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {formats.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <span className="flex items-center gap-2">
                {f.label}
                {f.value === "avif" && avifSupported === false && (
                  <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-600 border-yellow-200">
                    Limited
                  </Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showWarning && (
        <p className="text-xs text-yellow-600 bg-yellow-50 rounded-md px-3 py-2">
          ⚠ Your browser may not fully support {value.toUpperCase()} encoding. Results may vary.
        </p>
      )}
    </div>
  );
}
