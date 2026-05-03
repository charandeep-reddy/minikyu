import { PDFDocument } from "pdf-lib";

export interface PdfCompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  pageCount: number;
}

export async function compressPdf(
  file: File,
  quality: number = 80,
  onProgress?: (current: number, total: number) => void
): Promise<PdfCompressionResult> {
  const originalSize = file.size;
  const arrayBuffer = await file.arrayBuffer();
  const pdfData = new Uint8Array(arrayBuffer);

  // Dynamically import pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // Load with pdfjs-dist to render pages
  const pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const pageCount = pdfDocument.numPages;

  // Determine scale based on quality (0.5x to 2.0x)
  const scale = Math.max(0.5, quality / 60);
  const jpegQuality = Math.max(0.1, quality / 100);

  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= pageCount; i++) {
    onProgress?.(i, pageCount);

    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // Fill white background (JPEG has no transparency)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, viewport }).promise;

    // Convert canvas to JPEG blob
    const imageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/jpeg", jpegQuality);
    });

    const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
    const jpgImage = await newPdf.embedJpg(imageBytes);

    // Add page with the same dimensions as the rendered viewport
    const pdfPage = newPdf.addPage([viewport.width, viewport.height]);
    pdfPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });

    page.cleanup();
  }

  const compressedBytes = await newPdf.save();
  const compressedBlob = new Blob([compressedBytes as BlobPart], { type: "application/pdf" });
  const compressedSize = compressedBlob.size;
  const savingsPercent =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return {
    blob: compressedBlob,
    originalSize,
    compressedSize,
    savingsPercent,
    pageCount,
  };
}

export function getSavingsColor(percent: number): "green" | "yellow" | "red" {
  if (percent >= 50) return "green";
  if (percent >= 20) return "yellow";
  return "red";
}

export async function generatePdfThumbnail(
  file: File,
  scale: number = 1
): Promise<{ previewUrl: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfData = new Uint8Array(arrayBuffer);
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const pageCount = pdfDocument.numPages;

  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, viewport }).promise;

  const previewBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/png");
  });

  page.cleanup();
  return { previewUrl: URL.createObjectURL(previewBlob), pageCount };
}
