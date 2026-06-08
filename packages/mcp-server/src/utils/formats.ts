export const OUTPUT_FORMATS = ["jpeg", "png", "webp", "avif"] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

export const FORMAT_META: Record<OutputFormat, { mime: string; ext: string }> = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  avif: { mime: "image/avif", ext: "avif" },
}

export function isValidFormat(f: string): f is OutputFormat {
  return OUTPUT_FORMATS.includes(f as OutputFormat)
}

export function parseQuality(q: number): number {
  return Math.max(1, Math.min(100, Math.round(q)))
}
