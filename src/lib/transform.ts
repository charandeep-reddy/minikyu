export interface TransformOptions {
  width?: number;
  height?: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export async function getImageDimensions(file: File): Promise<Dimensions> {
  const bitmap = await createImageBitmap(file);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}

export function calculateDimensions(
  original: Dimensions,
  opts: { width?: number; height?: number; lockAspect?: boolean; scale?: number }
): Dimensions {
  if (opts.scale !== undefined && opts.scale > 0) {
    return {
      width: Math.round(original.width * (opts.scale / 100)),
      height: Math.round(original.height * (opts.scale / 100)),
    };
  }

  if (opts.lockAspect) {
    const aspect = original.width / original.height;
    if (opts.width && !opts.height) {
      return { width: opts.width, height: Math.round(opts.width / aspect) };
    }
    if (opts.height && !opts.width) {
      return { width: Math.round(opts.height * aspect), height: opts.height };
    }
    if (opts.width) {
      return { width: opts.width, height: Math.round(opts.width / aspect) };
    }
  }

  return {
    width: opts.width || original.width,
    height: opts.height || original.height,
  };
}

export async function applyTransform(
  file: File,
  options: TransformOptions
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const srcW = bitmap.width;
  const srcH = bitmap.height;

  const targetW = options.width ?? srcW;
  const targetH = options.height ?? srcH;

  const canvasW = targetW;
  const canvasH = targetH;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);

  const drawW = canvasW;
  const drawH = canvasH;
  ctx.drawImage(bitmap, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Transform failed"));
          return;
        }
        resolve(blob);
      },
      "image/png"
    );
  });
}
