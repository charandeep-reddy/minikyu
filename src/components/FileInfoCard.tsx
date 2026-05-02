"use client";

import { formatFileSize } from "@/lib/utils";
import { ArrowRight, FileDown } from "lucide-react";

interface FileInfoCardProps {
  original: {
    name: string;
    format: string;
    width: number;
    height: number;
    size: number;
  } | null;
  output: {
    format: string;
    width: number;
    height: number;
    size: number;
  } | null;
}

export default function FileInfoCard({ original, output }: FileInfoCardProps) {
  if (!original) return null;

  const savings = output
    ? Math.round(((original.size - output.size) / original.size) * 100)
    : 0;

  return (
    <div className={`rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm px-4 py-3 shadow-sm ${output ? "animate-in fade-in slide-in-from-bottom-2 duration-500" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2 sm:gap-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <FileDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:block" />
          <span className="truncate font-medium text-foreground/70 max-sm:text-[10px]" title={original.name}>
            <span className="sm:hidden text-muted-foreground mr-1">File:</span>
            {original.name}
          </span>
          <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">·</span>
          <span className="text-muted-foreground shrink-0 whitespace-nowrap max-sm:text-[10px]">
            {original.format.toUpperCase()} · {original.width}×{original.height}
          </span>
          <span className="font-mono text-muted-foreground shrink-0 hidden sm:inline">
            {formatFileSize(original.size)}
          </span>
        </div>

        {output && (
          <>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 hidden sm:block shrink-0" />
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap max-sm:text-[10px]">
              <span className="sm:hidden font-mono text-muted-foreground">
                {formatFileSize(original.size)}
              </span>
              <span className="text-muted-foreground whitespace-nowrap max-sm:text-[10px]">
                {output.format.toUpperCase()} · {output.width}×{output.height}
              </span>
              <span className="font-mono text-foreground/80 max-sm:text-[10px]">
                {formatFileSize(output.size)}
              </span>
              {savings > 0 && (
                <span
                  className={`text-[11px] max-sm:text-[10px] font-semibold px-2 py-0.5 rounded-md border animate-in fade-in zoom-in ${
                    savings >= 50
                      ? "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                      : savings >= 20
                        ? "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
                        : "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                  }`}
                >
                  -{savings}%
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
