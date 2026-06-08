import sharp from "sharp"
import { statSync } from "fs"
import type { ImageInfo } from "../utils/types.js"

export async function getInfo(filePath: string): Promise<ImageInfo> {
  const meta = await sharp(filePath).metadata()
  const size = statSync(filePath).size
  return {
    width: meta.width!,
    height: meta.height!,
    format: meta.format!,
    size,
    hasAlpha: meta.hasAlpha ?? false,
  }
}
