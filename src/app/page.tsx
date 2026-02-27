"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import UploadZone from "@/components/UploadZone";
import QualitySlider from "@/components/QualitySlider";
import FormatSelector from "@/components/FormatSelector";
import ResizeControls from "@/components/ResizeControls";
import BeforeAfterPreview from "@/components/BeforeAfterPreview";
import FileInfoCard from "@/components/FileInfoCard";
import BatchManager, { type BatchItem } from "@/components/BatchManager";

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
import Image from "next/image";

// ── Single-mode state ──────────────────────────────────
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
  // ── SHARED SETTINGS ──
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);

  // ── SINGLE MODE ──
  const [single, setSingle] = useState<SingleState>(initialSingle);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── BATCH MODE ──
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const nextId = useRef(0);

  // ────────────────────────────────────────────────
  // Single: Upload
  // ────────────────────────────────────────────────
  const handleSingleUpload = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
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

  // ────────────────────────────────────────────────
  // Single: Process
  // ────────────────────────────────────────────────
  const processSingle = useCallback(async () => {
    if (!single.file || !single.originalDims) return;
    setIsProcessing(true);
    try {
      let workingFile: File = single.file;

      // 1. compress
      const compressed = await compressImage(workingFile, quality);
      workingFile = compressed.file;

      // 2. resize + transform
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

      // 3. convert format
      const finalFile = await convertFormat(transformedFile, format, quality);
      const finalUrl = URL.createObjectURL(finalFile);

      // Clean up old URL
      if (single.processedUrl) URL.revokeObjectURL(single.processedUrl);

      setSingle((prev) => ({
        ...prev,
        processedBlob: finalFile,
        processedUrl: finalUrl,
        processedSize: finalFile.size,
        processedDims: newDims,
      }));

      const savings = Math.round(
        ((single.file.size - finalFile.size) / single.file.size) * 100
      );
      if (savings > 0) {
        toast.success(`Done! Saved ${savings}% (${formatFileSize(single.file.size - finalFile.size)})`);
      } else {
        toast.success("Processing complete!");
      }
    } catch (err) {
      toast.error(`Processing failed: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [single, quality, format, width, height, lockAspect]);

  // ────────────────────────────────────────────────
  // Single: Download
  // ────────────────────────────────────────────────
  const handleSingleDownload = useCallback(() => {
    if (!single.processedBlob || !single.file) return;
    const baseName = stripExtension(single.file.name);
    const ext = getExtension(format);
    downloadSingle(single.processedBlob, `${baseName}-minikyu${ext}`);
  }, [single, format]);

  // ────────────────────────────────────────────────
  // Single: Reset
  // ────────────────────────────────────────────────
  const resetSingle = useCallback(() => {
    if (single.originalUrl) URL.revokeObjectURL(single.originalUrl);
    if (single.processedUrl) URL.revokeObjectURL(single.processedUrl);
    setSingle(initialSingle);
    setQuality(80);
    setFormat("jpeg");
    setWidth(0);
    setHeight(0);
    setLockAspect(true);
  }, [single]);

  // ────────────────────────────────────────────────
  // Batch: Upload
  // ────────────────────────────────────────────────
  const handleBatchUpload = useCallback((files: File[]) => {
    const newItems: BatchItem[] = files.map((f) => ({
      id: String(nextId.current++),
      file: f,
      originalUrl: URL.createObjectURL(f),
      status: "pending" as const,
    }));
    setBatchItems((prev) => [...prev, ...newItems]);
  }, []);

  // ────────────────────────────────────────────────
  // Batch: Process All
  // ────────────────────────────────────────────────
  const processBatch = useCallback(async () => {
    setIsBatchProcessing(true);
    const items = [...batchItems];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === "done") continue;

      setBatchItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "processing" as const } : it))
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
                  processedName: `${baseName}-minikyu${ext}`,
                }
              : it
          )
        );
      } catch {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "error" as const } : it
          )
        );
      }
    }

    setIsBatchProcessing(false);
    toast.success("Batch processing complete!");
  }, [batchItems, quality, format, width, height, lockAspect]);

  // ────────────────────────────────────────────────
  // Batch: Downloads
  // ────────────────────────────────────────────────
  const handleBatchDownloadOne = useCallback((item: BatchItem) => {
    if (item.processedBlob && item.processedName) {
      downloadSingle(item.processedBlob, item.processedName);
    }
  }, []);

  const handleBatchDownloadAll = useCallback(() => {
    const entries = batchItems
      .filter((it) => it.status === "done" && it.processedBlob && it.processedName)
      .map((it) => ({ name: it.processedName!, blob: it.processedBlob! }));
    if (entries.length > 0) {
      downloadAsZip(entries);
    }
  }, [batchItems]);

  // ────────────────────────────────────────────────
  // Batch: Reset
  // ────────────────────────────────────────────────
  const resetBatch = useCallback(() => {
    batchItems.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
      if (it.processedUrl) URL.revokeObjectURL(it.processedUrl);
    });
    setBatchItems([]);
  }, [batchItems]);

  // ────────────────────────────────────────────────
  // Resize helpers
  // ────────────────────────────────────────────────
  const handleScale = useCallback(
    (scale: number) => {
      const dims = single.originalDims;
      if (!dims) return;
      setWidth(Math.round(dims.width * (scale / 100)));
      setHeight(Math.round(dims.height * (scale / 100)));
    },
    [single.originalDims]
  );

  // ────────────────────────────────────────────────
  // Controls panel (shared between single & batch)
  // ────────────────────────────────────────────────
  const controlsPanel = (
    <div className="space-y-5">
      <QualitySlider value={quality} onChange={setQuality} />
      <Separator />
      <FormatSelector value={format} onChange={setFormat} />
      <Separator />
      <ResizeControls
        original={single.originalDims || (batchItems[0] ? { width: 0, height: 0 } : null)}
        width={width}
        height={height}
        lockAspect={lockAspect}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onLockChange={setLockAspect}
        onScaleChange={handleScale}
      />
      <Separator />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ── HERO ── */}
      <section className="text-center space-y-3 pt-4 pb-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Compress, convert & transform
          <br />
          <span className="text-primary">your images</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
          Fast, free, and 100% in-browser. No uploads, no tracking — just results.
        </p>
      </section>

      {/* ── TABS ── */}
      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2">
          <TabsTrigger value="single">Single</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
        </TabsList>

        {/* ═══════════ SINGLE MODE ═══════════ */}
        <TabsContent value="single" className="space-y-6">
          {!single.file ? (
            <UploadZone onFiles={handleSingleUpload} />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Controls */}
                <div className="lg:col-span-1 space-y-4">
                  {controlsPanel}
                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={processSingle}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing…
                        </span>
                      ) : (
                        "Process Image"
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetSingle}>
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Right: Preview */}
                <div className="lg:col-span-2 space-y-4">
                  {single.processedUrl && single.originalUrl ? (
                    <BeforeAfterPreview
                      originalUrl={single.originalUrl}
                      processedUrl={single.processedUrl}
                      originalLabel={`Original · ${formatFileSize(single.file!.size)}`}
                      processedLabel={`Processed · ${single.processedSize ? formatFileSize(single.processedSize) : "—"}`}
                    />
                  ) : (
                    <div className="aspect-video rounded-xl border border-border/50 bg-muted/20 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Image src="/minikyu.png" alt="Minikyu" width={64} height={64} className="opacity-40 mx-auto" />
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
                    <Button className="w-full" onClick={handleSingleDownload}>
                      Download Processed Image
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════ BATCH MODE ═══════════ */}
        <TabsContent value="batch" className="space-y-6">
          <UploadZone multiple onFiles={handleBatchUpload} />

          {batchItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Controls */}
              <div className="lg:col-span-1 space-y-4">
                {controlsPanel}
                <Separator />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={processBatch}
                    disabled={isBatchProcessing}
                  >
                    {isBatchProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      `Process ${batchItems.length} Images`
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetBatch}>
                    Clear
                  </Button>
                </div>
              </div>

              {/* Right: Batch Grid */}
              <div className="lg:col-span-2">
                <BatchManager
                  items={batchItems}
                  onDownloadOne={handleBatchDownloadOne}
                  onDownloadAll={handleBatchDownloadAll}
                  isProcessing={isBatchProcessing}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
