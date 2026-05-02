"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type OutputFormat } from "@/lib/convert";
import { useEffect, useState } from "react";
import { checkFormatSupport } from "@/lib/convert";
import { Image, FileImage, FileVideo, Camera } from "lucide-react";

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (value: OutputFormat) => void;
}

const formats: { value: OutputFormat; label: string; icon: typeof Image }[] = [
  { value: "jpeg", label: "JPEG", icon: Camera },
  { value: "png", label: "PNG", icon: FileImage },
  { value: "webp", label: "WebP", icon: FileVideo },
  { value: "avif", label: "AVIF", icon: Image },
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
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <label className="text-sm font-medium text-foreground/80">Output Format</label>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as OutputFormat)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {formats.map((f) => {
            const Icon = f.icon;
            return (
              <SelectItem key={f.value} value={f.value}>
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {f.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {showWarning && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md px-3 py-2 border border-yellow-200 dark:border-yellow-800">
          ⚠ Your browser may not fully support {value.toUpperCase()} encoding. Results may vary.
        </p>
      )}
    </div>
  );
}
