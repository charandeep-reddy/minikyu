import sharp from "sharp"
import { dirname, basename, extname, join } from "path"
import { statSync } from "fs"
import { parseQuality } from "../utils/formats.js"
import type { ProcessResult } from "../utils/types.js"

export async function compress(filePath: string, quality: number): Promise<ProcessResult> {
  const q = parseQuality(quality)
  const dir = dirname(filePath)
  const ext = extname(filePath)
  const name = basename(filePath, ext)
  const outPath = join(dir, `${name}.minikyu${ext}`)

  const originalSize = statSync(filePath).size
  const image = sharp(filePath)
  const meta = await image.metadata()

  let pipeline = image
  switch (meta.format) {
    case "jpeg":
      pipeline = pipeline.jpeg({ quality: q })
      break
    case "png":
      pipeline = pipeline.png({ quality: q })
      break
    case "webp":
      pipeline = pipeline.webp({ quality: q })
      break
    case "avif":
      pipeline = pipeline.avif({ quality: q })
      break
    default:
      pipeline = pipeline.jpeg({ quality: q })
  }

  await pipeline.toFile(outPath)
  const compressedSize = statSync(outPath).size
  const savingsPercent = originalSize > 0
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0

  return { path: outPath, originalSize, compressedSize, savingsPercent }
}
