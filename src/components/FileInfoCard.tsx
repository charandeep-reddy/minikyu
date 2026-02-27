"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/utils";

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

  const savingsColor =
    savings >= 50
      ? "bg-green-100 text-green-700 border-green-200"
      : savings >= 20
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : "bg-red-100 text-red-700 border-red-200";

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground/80">File Info</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Original */}
        <div className="space-y-1.5">
          <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Original</p>
          <p className="truncate font-medium" title={original.name}>{original.name}</p>
          <p className="text-muted-foreground">{original.format.toUpperCase()} · {original.width}×{original.height}</p>
          <p className="font-mono">{formatFileSize(original.size)}</p>
        </div>

        {/* Output */}
        {output && (
          <div className="space-y-1.5">
            <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Output</p>
            <p className="font-medium">{output.format.toUpperCase()}</p>
            <p className="text-muted-foreground">{output.width}×{output.height}</p>
            <div className="flex items-center gap-2">
              <span className="font-mono">{formatFileSize(output.size)}</span>
              {savings > 0 && (
                <Badge variant="outline" className={`text-[10px] ${savingsColor}`}>
                  −{savings}%
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
