"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import PdfUploadZone from "@/components/PdfUploadZone";
import PdfBatchManager, { type PdfBatchItem } from "@/components/PdfBatchManager";
import { compressPdf, generatePdfThumbnail } from "@/lib/pdf-compress";
import { formatFileSize } from "@/lib/utils";
import { downloadAsZip, downloadSingle } from "@/lib/zip";
import { FileText, Sparkles, ArrowDown, Shield, Zap, Scissors, Settings } from "lucide-react";

interface SingleState {
  file: File | null;
  originalUrl: string | null;
  previewUrl: string | null;
  compressedBlob: Blob | null;
  compressedSize: number | null;
  savingsPercent: number;
  pageCount: number;
}

const initialSingle: SingleState = {
  file: null,
  originalUrl: null,
  previewUrl: null,
  compressedBlob: null,
  compressedSize: null,
  savingsPercent: 0,
  pageCount: 0,
};

export default function PdfPage() {
  const [quality, setQuality] = useState(80);

  const [single, setSingle] = useState<SingleState>(initialSingle);
  const [isProcessing, setIsProcessing] = useState(false);

  const [batchItems, setBatchItems] = useState<PdfBatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const nextId = useRef(0);

  const populateSingle = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setSingle({
      file,
      originalUrl: url,
      previewUrl: null,
      compressedBlob: null,
      compressedSize: null,
      savingsPercent: 0,
      pageCount: 0,
    });

    try {
      const { previewUrl, pageCount } = await generatePdfThumbnail(file, 1.5);
      setSingle((prev) => ({ ...prev, previewUrl, pageCount }));
    } catch (err) {
      toast.error(`Failed to load PDF preview: ${(err as Error).message}`);
    }
  }, []);

  const processSingle = useCallback(async () => {
    if (!single.file) return;
    setIsProcessing(true);
    try {
      const result = await compressPdf(single.file, quality);

      setSingle((prev) => ({
        ...prev,
        compressedBlob: result.blob,
        compressedSize: result.compressedSize,
        savingsPercent: result.savingsPercent,
        pageCount: result.pageCount,
      }));

      if (result.savingsPercent > 0) {
        toast.success(
          `Done! Saved ${result.savingsPercent}% (${formatFileSize(result.originalSize - result.compressedSize)})`,
        );
      } else {
        toast.success("Processing complete!");
      }
    } catch (err) {
      toast.error(`Compression failed: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [single, quality]);

  const handleSingleDownload = useCallback(() => {
    if (!single.compressedBlob || !single.file) return;
    const baseName = single.file.name.replace(/\.pdf$/i, "");
    downloadSingle(single.compressedBlob, `${baseName}-compressed.pdf`);
  }, [single]);

  const resetSingle = useCallback(() => {
    if (single.originalUrl) URL.revokeObjectURL(single.originalUrl);
    if (single.previewUrl) URL.revokeObjectURL(single.previewUrl);
    batchItems.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
    });
    setSingle(initialSingle);
    setBatchItems([]);
    setQuality(80);
  }, [single, batchItems]);

  const handleBatchUpload = useCallback(
    async (files: File[]) => {
      const newItems: PdfBatchItem[] = files.map((f) => ({
        id: String(nextId.current++),
        file: f,
        originalUrl: URL.createObjectURL(f),
        status: "pending",
      }));

      setBatchItems((prev) => {
        const all = [...prev, ...newItems];
        return all;
      });

      const totalAfter = batchItems.length + files.length;
      if (totalAfter === 1) {
        await populateSingle(files[0]);
      } else {
        setSingle(initialSingle);
        // Generate thumbnails asynchronously for each file
        for (const item of newItems) {
          generatePdfThumbnail(item.file).then(
            ({ previewUrl, pageCount }) => {
              setBatchItems((prev) =>
                prev.map((it) =>
                  it.id === item.id ? { ...it, previewUrl, pageCount } : it,
                ),
              );
            },
            () => {
              // Silently fail — thumbnail is not critical
            },
          );
        }
      }
    },
    [batchItems.length, populateSingle],
  );

  const processBatch = useCallback(async () => {
    setIsBatchProcessing(true);
    const items = [...batchItems];

    // Mark all pending as processing
    setBatchItems((prev) =>
      prev.map((it) =>
        it.status === "pending" ? { ...it, status: "processing" as const } : it,
      ),
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === "done") continue;

      try {
        const result = await compressPdf(item.file, quality);

        const processedName = item.file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";

        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "done" as const,
                  processedBlob: result.blob,
                  processedSize: result.compressedSize,
                  processedName,
                  pageCount: result.pageCount,
                }
              : it,
          ),
        );
      } catch {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "error" as const } : it,
          ),
        );
      }
    }

    setIsBatchProcessing(false);
    toast.success("Batch processing complete!");
  }, [batchItems, quality]);

  const handleBatchDownloadOne = useCallback((item: PdfBatchItem) => {
    if (item.processedBlob && item.processedName) {
      downloadSingle(item.processedBlob, item.processedName);
    }
  }, []);

  const handleBatchDownloadAll = useCallback(() => {
    const entries = batchItems
      .filter((it) => it.status === "done" && it.processedBlob && it.processedName)
      .map((it) => ({ name: it.processedName!, blob: it.processedBlob! }));
    if (entries.length > 0) {
      downloadAsZip(entries, "minikyu-pdfs.zip");
    }
  }, [batchItems]);

  const features = [
    { icon: Zap, label: "Compress" },
    { icon: Scissors, label: "Optimize" },
    { icon: Shield, label: "100% Private" },
  ];

  const label =
    quality >= 80 ? "High" : quality >= 50 ? "Medium" : quality >= 20 ? "Low" : "Very Low";
  const hue = Math.round((quality / 100) * 120);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <section className="text-center space-y-5 pt-6 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
          Compress & optimize
          <br />
          <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            your PDFs
          </span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base px-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          Fast, free, and 100% in-browser. No uploads, no tracking — just
          smaller files.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/5 text-primary border border-primary/10 animate-in fade-in zoom-in duration-300 fill-mode-both"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <Icon className="w-3 h-3" />
                {f.label}
              </span>
            );
          })}
        </div>
      </section>

      <div className="space-y-6">
        <PdfUploadZone multiple onFiles={handleBatchUpload} />

        {batchItems.length === 1 && single.file && single.previewUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground/80">Settings</h2>
                </div>

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
                      <span className="text-sm font-mono font-semibold tabular-nums transition-colors duration-300">{quality}</span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border transition-all duration-300"
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
                      value={[quality]}
                      onValueChange={([v]) => setQuality(v)}
                      className="w-full [&_[role=slider]]:z-10 [&_[role=slider]]:border-2 [&_[role=slider]]:border-background [&_[role=slider]]:shadow-md"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground/50">
                    <span>Smallest file</span>
                    <span>Best quality</span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-border/60 via-border to-border/60" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pages</span>
                    <span className="font-mono font-medium">{single.pageCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Original size</span>
                    <span className="font-mono font-medium">{formatFileSize(single.file.size)}</span>
                  </div>
                  {single.compressedSize != null && (
                    <div className="flex items-center justify-between text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <span className="text-muted-foreground">Compressed</span>
                      <span className="font-mono font-medium">{formatFileSize(single.compressedSize)}</span>
                    </div>
                  )}
                  {single.savingsPercent > 0 && (
                    <div className="flex items-center justify-between text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <span className="text-muted-foreground">Saved</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                          single.savingsPercent >= 50
                            ? "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                            : single.savingsPercent >= 20
                              ? "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
                              : "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                        }`}
                      >
                        -{single.savingsPercent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150"
                  onClick={processSingle}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing&hellip;
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Compress PDF
                    </span>
                  )}
                </Button>
                <Button variant="outline" onClick={resetSingle} className="active:scale-[0.98] transition-all duration-150">
                  Reset
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <FileText className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">Preview</span>
                </div>
                <div className="relative w-full aspect-[3/4] max-h-[600px] rounded-xl overflow-hidden border border-border/50 bg-white shadow-sm">
                  <img
                    src={single.previewUrl}
                    alt="PDF preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {single.compressedBlob && (
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  onClick={handleSingleDownload}
                >
                  <ArrowDown className="w-4 h-4" />
                  Download Compressed PDF
                </Button>
              )}
            </div>
          </div>
        )}

        {batchItems.length > 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground/80">Settings</h2>
                </div>

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
                      <span className="text-sm font-mono font-semibold tabular-nums transition-colors duration-300">{quality}</span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border transition-all duration-300"
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
                      value={[quality]}
                      onValueChange={([v]) => setQuality(v)}
                      className="w-full [&_[role=slider]]:z-10 [&_[role=slider]]:border-2 [&_[role=slider]]:border-background [&_[role=slider]]:shadow-md"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground/50">
                    <span>Smallest file</span>
                    <span>Best quality</span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-border/60 via-border to-border/60" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">PDFs</span>
                    <span className="font-mono font-medium">{batchItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total size</span>
                    <span className="font-mono font-medium">
                      {formatFileSize(batchItems.reduce((s, it) => s + it.file.size, 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150"
                  onClick={processBatch}
                  disabled={isBatchProcessing}
                >
                  {isBatchProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing&hellip;
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Compress {batchItems.length} PDFs
                    </span>
                  )}
                </Button>
                <Button variant="outline" onClick={resetSingle} className="active:scale-[0.98] transition-all duration-150">
                  Clear
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <PdfBatchManager
                items={batchItems}
                onDownloadOne={handleBatchDownloadOne}
                onDownloadAll={handleBatchDownloadAll}
                isProcessing={isBatchProcessing}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
