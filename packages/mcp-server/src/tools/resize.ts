import sharp from "sharp"
import { dirname, basename, extname, join } from "path"
import { statSync } from "fs"
import type { ResizeResult } from "../utils/types.js"

export async function resize(
  filePath: string,
  width?: number,
  height?: number,
  scale?: number,
  lockAspect = true,
): Promise<ResizeResult> {
  const image = sharp(filePath)
  const meta = await image.metadata()
  const srcW = meta.width!
  const srcH = meta.height!

  let targetW = srcW
  let targetH = srcH

  if (scale) {
    const pct = Math.max(1, Math.min(100, scale))
    targetW = Math.round(srcW * pct / 100)
    targetH = Math.round(srcH * pct / 100)
  } else if (width || height) {
    if (width && height) {
      targetW = width
      targetH = lockAspect ? Math.round(width * srcH / srcW) : height
    } else if (width) {
      targetW = width
      targetH = lockAspect ? Math.round(width * srcH / srcW) : srcH
    } else if (height) {
      targetH = height
      targetW = lockAspect ? Math.round(height * srcW / srcH) : srcW
    }
  }

  const dir = dirname(filePath)
  const ext = extname(filePath)
  const name = basename(filePath, ext)
  const outPath = join(dir, `${name}.${targetW}x${targetH}${ext}`)

  await image.resize(targetW, targetH).toFile(outPath)
  const size = statSync(outPath).size

  return { path: outPath, width: targetW, height: targetH, size }
}
