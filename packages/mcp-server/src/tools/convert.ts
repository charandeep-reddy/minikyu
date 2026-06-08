import sharp from "sharp"
import { dirname, basename, extname, join } from "path"
import { statSync } from "fs"
import { FORMAT_META, isValidFormat } from "../utils/formats.js"
import type { ConvertResult } from "../utils/types.js"

export async function convert(filePath: string, format: string): Promise<ConvertResult> {
  if (!isValidFormat(format)) {
    throw new Error(`Unsupported format: ${format}. Use: jpeg, png, webp, avif`)
  }

  const fmt = FORMAT_META[format]
  const dir = dirname(filePath)
  const name = basename(filePath, extname(filePath))
  const outPath = join(dir, `${name}.${fmt.ext}`)

  await sharp(filePath)
    .toFormat(format as unknown as sharp.AvailableFormatInfo)
    .toFile(outPath)

  const size = statSync(outPath).size
  return { path: outPath, format, size }
}
