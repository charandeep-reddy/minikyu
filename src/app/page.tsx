"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import UploadZone from "@/components/UploadZone";
import BatchManager, { type BatchItem } from "@/components/BatchManager";
import ControlPanel from "@/components/ControlPanel";

import { compressImage } from "@/lib/compress";
import { convertFormat, type OutputFormat, getExtension } from "@/lib/convert";
import {
  getImageDimensions,
  calculateDimensions,
  applyTransform,
  type Dimensions,
} from "@/lib/transform";
import { downloadAsZip, downloadSingle } from "@/lib/zip";
import { formatFileSize, stripExtension } from "@/lib/utils";
import BeforeAfterPreview from "@/components/BeforeAfterPreview";
import FileInfoCard from "@/components/FileInfoCard";
import { Sparkles, Shield, Zap, ImageIcon, ArrowDown, Settings, X } from "lucide-react";

interface SingleState {
  file: File | null;
  originalUrl: string | null;
  originalDims: Dimensions | null;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedSize: number | null;
  processedDims: Dimensions | null;
}

const initialSingle: SingleState = {
  file: null,
  originalUrl: null,
  originalDims: null,
  processedBlob: null,
  processedUrl: null,
  processedSize: null,
  processedDims: null,
};

export default function HomePage() {
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);

  const [single, setSingle] = useState<SingleState>(initialSingle);
  const [isProcessing, setIsProcessing] = useState(false);

  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [showSettings, setShowSettings] = useState(false);

  const nextId = useRef(0);

  const populateSingle = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    const dims = await getImageDimensions(file);
    setSingle({
      file,
      originalUrl: url,
      originalDims: dims,
      processedBlob: null,
      processedUrl: null,
      processedSize: null,
      processedDims: null,
    });
    setWidth(dims.width);
    setHeight(dims.height);
  }, []);

  const processSingle = useCallback(async () => {
    if (!single.file || !single.originalDims) return;
    setIsProcessing(true);
    try {
      let workingFile: File = single.file;

      const compressed = await compressImage(workingFile, quality);
      workingFile = compressed.file;

      const newDims = calculateDimensions(single.originalDims, {
        width: width || undefined,
        height: height || undefined,
        lockAspect,
      });
      const transformedBlob = await applyTransform(workingFile, {
        width: newDims.width,
        height: newDims.height,
      });
      const transformedFile = new File([transformedBlob], workingFile.name, {
        type: workingFile.type,
      });

      const finalFile = await convertFormat(transformedFile, format, quality);
      const finalUrl = URL.createObjectURL(finalFile);

      if (single.processedUrl) URL.revokeObjectURL(single.processedUrl);

      setSingle((prev) => ({
        ...prev,
        processedBlob: finalFile,
        processedUrl: finalUrl,
        processedSize: finalFile.size,
        processedDims: newDims,
      }));

      const savings = Math.round(
        ((single.file.size - finalFile.size) / single.file.size) * 100,
      );
      if (savings > 0) {
        toast.success(
          `Done! Saved ${savings}% (${formatFileSize(single.file.size - finalFile.size)})`,
        );
      } else {
        toast.success("Processing complete!");
      }
    } catch (err) {
      toast.error(`Processing failed: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [single, quality, format, width, height, lockAspect]);

  const handleSingleDownload = useCallback(() => {
    if (!single.processedBlob || !single.file) return;
    const baseName = stripExtension(single.file.name);
    const ext = getExtension(format);
    downloadSingle(single.processedBlob, `${baseName}${ext}`);
  }, [single, format]);

  const resetSingle = useCallback(() => {
    if (single.originalUrl) URL.revokeObjectURL(single.originalUrl);
    if (single.processedUrl) URL.revokeObjectURL(single.processedUrl);
    batchItems.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
      if (it.processedUrl) URL.revokeObjectURL(it.processedUrl);
    });
    setSingle(initialSingle);
    setBatchItems([]);
    setQuality(80);
    setFormat("jpeg");
    setWidth(0);
    setHeight(0);
    setLockAspect(true);
  }, [single, batchItems]);

  const handleBatchUpload = useCallback(
    async (files: File[]) => {
      const newItems: BatchItem[] = files.map((f) => ({
        id: String(nextId.current++),
        file: f,
        originalUrl: URL.createObjectURL(f),
        status: "pending" as const,
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
      }
    },
    [batchItems.length, populateSingle],
  );

  const processBatch = useCallback(async () => {
    setIsBatchProcessing(true);
    const items = [...batchItems];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === "done") continue;

      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "processing" as const } : it,
        ),
      );

      try {
        let workingFile: File = item.file;
        const dims = await getImageDimensions(workingFile);

        const compressed = await compressImage(workingFile, quality);
        workingFile = compressed.file;

        const newDims = calculateDimensions(dims, {
          width: width || undefined,
          height: height || undefined,
          lockAspect,
        });
        const transformedBlob = await applyTransform(workingFile, {
          width: newDims.width,
          height: newDims.height,
        });
        const transformedFile = new File([transformedBlob], workingFile.name, {
          type: workingFile.type,
        });

        const finalFile = await convertFormat(transformedFile, format, quality);
        const finalUrl = URL.createObjectURL(finalFile);

        const baseName = stripExtension(item.file.name);
        const ext = getExtension(format);

        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "done" as const,
                  processedBlob: finalFile,
                  processedUrl: finalUrl,
                  processedSize: finalFile.size,
                  processedName: `${baseName}${ext}`,
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
  }, [batchItems, quality, format, width, height, lockAspect]);

  const handleBatchDownloadOne = useCallback((item: BatchItem) => {
    if (item.processedBlob && item.processedName) {
      downloadSingle(item.processedBlob, item.processedName);
    }
  }, []);

  const handleBatchDownloadAll = useCallback(() => {
    const entries = batchItems
      .filter(
        (it) => it.status === "done" && it.processedBlob && it.processedName,
      )
      .map((it) => ({ name: it.processedName!, blob: it.processedBlob! }));
    if (entries.length > 0) {
      downloadAsZip(entries);
    }
  }, [batchItems]);

  const resetBatch = useCallback(() => {
    batchItems.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
      if (it.processedUrl) URL.revokeObjectURL(it.processedUrl);
    });
    setBatchItems([]);
  }, [batchItems]);

  const handleScale = useCallback(
    (scale: number) => {
      const dims = single.originalDims;
      if (!dims) return;
      setWidth(Math.round(dims.width * (scale / 100)));
      setHeight(Math.round(dims.height * (scale / 100)));
    },
    [single.originalDims],
  );

  const features = [
    { icon: Zap, label: "Compress" },
    { icon: ImageIcon, label: "Convert" },
    { icon: ArrowDown, label: "Resize" },
    { icon: Shield, label: "100% Private" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <section className="text-center space-y-5 pt-6 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
          Compress, convert & transform
          <br />
          <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            your images
          </span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base px-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          Fast, free, and 100% in-browser. No uploads, no tracking — just
          results.
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
        <UploadZone multiple onFiles={handleBatchUpload} />

        {batchItems.length === 1 && single.originalDims && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex md:hidden items-center justify-center gap-2 w-full h-9 text-sm font-medium rounded-lg border border-border/40 bg-card/50 hover:bg-muted/50 transition-colors mb-4"
              >
                {showSettings ? (
                  <>
                    <X className="w-4 h-4" /> Hide Settings
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" /> Show Settings
                  </>
                )}
              </button>
              <div className={`space-y-4 overflow-hidden transition-all duration-300 ${showSettings ? "animate-in slide-in-from-top-2 fade-in duration-300" : "hidden md:block"}`}>
                <ControlPanel
                  quality={quality}
                  setQuality={setQuality}
                  format={format}
                  setFormat={setFormat}
                  original={single.originalDims}
                  width={width}
                  height={height}
                  lockAspect={lockAspect}
                  setWidth={setWidth}
                  setHeight={setHeight}
                  setLockAspect={setLockAspect}
                  handleScale={handleScale}
                />
                <div className="hidden md:flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150"
                    onClick={processSingle}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Process Image
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetSingle} className="active:scale-[0.98] transition-all duration-150">
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex md:hidden gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150"
                  onClick={processSingle}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Process Image
                    </span>
                  )}
                </Button>
                <Button variant="outline" onClick={resetSingle} className="active:scale-[0.98] transition-all duration-150">
                  Reset
                </Button>
              </div>
              {single.processedUrl && single.originalUrl ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <BeforeAfterPreview
                    originalUrl={single.originalUrl}
                    processedUrl={single.processedUrl}
                    originalLabel={`Original · ${formatFileSize(single.file!.size)}`}
                    processedLabel={`Processed · ${single.processedSize ? formatFileSize(single.processedSize) : "—"}`}
                  />
                </div>
              ) : (
                <div className="aspect-video max-sm:aspect-square rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <div className="text-center space-y-3 px-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/5 mx-auto flex items-center justify-center">
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adjust settings & click <strong>Process Image</strong>
                    </p>
                  </div>
                </div>
              )}

              <FileInfoCard
                original={
                  single.file && single.originalDims
                    ? {
                        name: single.file.name,
                        format: single.file.type.split("/")[1] || "unknown",
                        width: single.originalDims.width,
                        height: single.originalDims.height,
                        size: single.file.size,
                      }
                    : null
                }
                output={
                  single.processedSize != null && single.processedDims
                    ? {
                        format,
                        width: single.processedDims.width,
                        height: single.processedDims.height,
                        size: single.processedSize,
                      }
                    : null
                }
              />

              {single.processedBlob && (
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  onClick={handleSingleDownload}
                >
                  <ArrowDown className="w-4 h-4" />
                  Download Processed Image
                </Button>
              )}
            </div>
          </div>
        )}

        {batchItems.length > 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex md:hidden items-center justify-center gap-2 w-full h-9 text-sm font-medium rounded-lg border border-border/40 bg-card/50 hover:bg-muted/50 transition-colors mb-4"
              >
                {showSettings ? (
                  <>
                    <X className="w-4 h-4" /> Hide Settings
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" /> Show Settings
                  </>
                )}
              </button>
              <div className={`space-y-4 overflow-hidden transition-all duration-300 ${showSettings ? "animate-in slide-in-from-top-2 fade-in duration-300" : "hidden md:block"}`}>
                <ControlPanel
                  quality={quality}
                  setQuality={setQuality}
                  format={format}
                  setFormat={setFormat}
                  original={
                    batchItems.length > 1
                      ? { width: 0, height: 0 }
                      : single.originalDims
                  }
                  width={width}
                  height={height}
                  lockAspect={lockAspect}
                  setWidth={setWidth}
                  setHeight={setHeight}
                  setLockAspect={setLockAspect}
                  handleScale={handleScale}
                />
                <div className="hidden md:flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150"
                    onClick={processBatch}
                    disabled={isBatchProcessing}
                  >
                    {isBatchProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Process {batchItems.length} Images
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetBatch} className="active:scale-[0.98] transition-all duration-150">
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex md:hidden gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150"
                  onClick={processBatch}
                  disabled={isBatchProcessing}
                >
                  {isBatchProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Process {batchItems.length} Images
                    </span>
                  )}
                </Button>
                <Button variant="outline" onClick={resetBatch} className="active:scale-[0.98] transition-all duration-150">
                  Clear
                </Button>
              </div>
              <BatchManager
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
