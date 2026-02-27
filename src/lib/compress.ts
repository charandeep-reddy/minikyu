import imageCompression from "browser-image-compression";

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

export async function compressImage(
  file: File,
  quality: number = 80
): Promise<CompressionResult> {
  const originalSize = file.size;

  const options = {
    maxSizeMB: 20,
    initialQuality: quality / 100,
    useWebWorker: true,
    preserveExif: false,
  };

  const compressedFile = await imageCompression(file, options);
  const compressedSize = compressedFile.size;
  const savingsPercent =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return {
    file: compressedFile,
    originalSize,
    compressedSize,
    savingsPercent,
  };
}

export function getSavingsColor(percent: number): "green" | "yellow" | "red" {
  if (percent >= 50) return "green";
  if (percent >= 20) return "yellow";
  return "red";
}
