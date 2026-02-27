"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/utils";

export interface BatchItem {
  id: string;
  file: File;
  originalUrl: string;
  processedBlob?: Blob;
  processedUrl?: string;
  processedSize?: number;
  processedName?: string;
  status: "pending" | "processing" | "done" | "error";
}

interface BatchManagerProps {
  items: BatchItem[];
  onDownloadOne: (item: BatchItem) => void;
  onDownloadAll: () => void;
  isProcessing: boolean;
}

export default function BatchManager({
  items,
  onDownloadOne,
  onDownloadAll,
  isProcessing,
}: BatchManagerProps) {
  const doneCount = items.filter((i) => i.status === "done").length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Processing images…</span>
            <span>{doneCount} / {items.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden p-0 gap-0">
            <div className="aspect-square bg-muted/20 relative">
              <img
                src={item.processedUrl || item.originalUrl}
                alt={item.file.name}
                className="w-full h-45 object-cover"
              />
              {item.status === "processing" && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {item.status === "done" && (
                <div className="absolute top-1.5 right-1.5">
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">✓</Badge>
                </div>
              )}
            </div>
            <div className="p-2 space-y-1">
              <p className="text-xs font-medium truncate" title={item.file.name}>
                {item.file.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(item.file.size)}
                {item.processedSize != null && (
                  <> → {formatFileSize(item.processedSize)}</>
                )}
              </p>
              {item.status === "done" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs mt-1"
                  onClick={() => onDownloadOne(item)}
                >
                  Download
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Download All */}
      {doneCount > 0 && (
        <Button onClick={onDownloadAll} className="w-full">
          Download All as ZIP ({doneCount} images)
        </Button>
      )}
    </div>
  );
}
