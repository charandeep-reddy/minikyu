import { describe, it, expect } from "vitest"
import { compress } from "../tools/compress.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

async function createTestImage(): Promise<{ path: string; cleanup: () => void }> {
  const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
  const buf = await sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 0, b: 0 } },
  }).png().toBuffer()
  const p = join(dir, "test.png")
  writeFileSync(p, buf)
  return { path: p, cleanup: () => rmSync(dir, { recursive: true }) }
}

describe("compress", () => {
  it("compresses a PNG and returns output with .minikyu suffix", async () => {
    const { path, cleanup } = await createTestImage()
    const result = await compress(path, 50)
    expect(result.path).toContain(".minikyu.")
    expect(result.savingsPercent).toBeGreaterThanOrEqual(0)
    expect(result.originalSize).toBeGreaterThan(0)
    expect(result.compressedSize).toBeGreaterThan(0)
    cleanup()
  })

  it("throws on non-existent file", async () => {
    await expect(compress("/nonexistent.png", 50)).rejects.toThrow()
  })
})
