export type OutputFormat = "jpeg" | "png" | "webp" | "avif";

const MIME_MAP: Record<OutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const EXT_MAP: Record<OutputFormat, string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
  avif: ".avif",
};

export function getExtension(format: OutputFormat): string {
  return EXT_MAP[format];
}

export function getMimeType(format: OutputFormat): string {
  return MIME_MAP[format];
}

export async function checkFormatSupport(format: OutputFormat): Promise<boolean> {
  if (format === "jpeg" || format === "png") return true;
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob(
      (blob) => resolve(blob !== null && blob.size > 0),
      MIME_MAP[format],
      0.8
    );
  });
}

export async function convertFormat(
  file: File,
  targetFormat: OutputFormat,
  quality: number = 80
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const mimeType = MIME_MAP[targetFormat];
  const qualityParam = targetFormat === "png" ? undefined : quality / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Conversion to ${targetFormat} failed. Format may not be supported.`));
          return;
        }
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const newName = `${baseName}${EXT_MAP[targetFormat]}`;
        resolve(new File([blob], newName, { type: mimeType }));
      },
      mimeType,
      qualityParam
    );
  });
}
