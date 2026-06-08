import { compress } from "./compress.js"
import type { ProcessResult } from "../utils/types.js"

export async function batchProcess(
  paths: string[],
  quality: number,
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = []

  for (const filePath of paths) {
    const result = await compress(filePath, quality)
    results.push(result)
  }

  return results
}
