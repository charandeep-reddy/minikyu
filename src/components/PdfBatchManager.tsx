"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/utils";
import { Download, Archive, CheckCircle2, Loader2, AlertCircle, FileText } from "lucide-react";

export interface PdfBatchItem {
  id: string;
  file: File;
  originalUrl: string;
  previewUrl?: string;
  processedBlob?: Blob;
  processedSize?: number;
  processedName?: string;
  pageCount?: number;
  status: "pending" | "processing" | "done" | "error";
}

interface PdfBatchManagerProps {
  items: PdfBatchItem[];
  onDownloadOne: (item: PdfBatchItem) => void;
  onDownloadAll: () => void;
  isProcessing: boolean;
}

export default function PdfBatchManager({
  items,
  onDownloadOne,
  onDownloadAll,
  isProcessing,
}: PdfBatchManagerProps) {
  const doneCount = items.filter((i) => i.status === "done").length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {isProcessing && (
        <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Processing PDFs&hellip;
            </span>
            <span className="font-mono tabular-nums">{doneCount} / {items.length}</span>
          </div>
          <Progress value={progress} className="h-2 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-primary [&>[role=progressbar]]:to-indigo-400" />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <Card
            key={item.id}
            className="overflow-hidden p-0 gap-0 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-44 bg-muted/10 relative overflow-hidden">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-primary/40" />
                  </div>
                </div>
              )}
              {item.status === "processing" && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
              {item.status === "done" && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-sm" />
                </div>
              )}
              {item.status === "error" && (
                <div className="absolute top-2 right-2">
                  <AlertCircle className="w-5 h-5 text-red-500 drop-shadow-sm" />
                </div>
              )}
              {item.processedSize && item.status === "done" && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-[10px] text-white/90 font-medium">
                    {formatFileSize(item.processedSize)}
                  </p>
                </div>
              )}
            </div>
            <div className="p-2.5 space-y-1.5">
              <p className="text-xs font-medium truncate text-foreground/80" title={item.file.name}>
                {item.file.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(item.file.size)}
                {item.processedSize != null && (
                  <> &rarr; {formatFileSize(item.processedSize)}</>
                )}
              </p>
              {item.pageCount != null && (
                <p className="text-[10px] text-muted-foreground">
                  {item.pageCount} page{item.pageCount !== 1 ? "s" : ""}
                  {item.status === "done" && item.processedSize != null && (
                    <> &middot; {Math.round((1 - item.processedSize / item.file.size) * 100)}% saved</>
                  )}
                </p>
              )}
              {item.status === "done" && (
                <button
                  onClick={() => onDownloadOne(item)}
                  className="flex items-center justify-center gap-1 w-full h-7 text-xs rounded-md bg-muted/50 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {doneCount > 0 && (
        <Button onClick={onDownloadAll} className="w-full gap-2 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 text-primary-foreground shadow-md active:scale-[0.98] transition-all duration-150">
          <Archive className="w-4 h-4" />
          Download All as ZIP ({doneCount} PDF{doneCount !== 1 ? "s" : ""})
        </Button>
      )}
    </div>
  );
}
