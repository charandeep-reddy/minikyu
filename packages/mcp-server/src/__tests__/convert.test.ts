import { describe, it, expect } from "vitest"
import { convert } from "../tools/convert.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

async function createTestPng(): Promise<{ path: string; cleanup: () => void }> {
  const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
  const buf = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 128, b: 255 } },
  }).png().toBuffer()
  const p = join(dir, "test.png")
  writeFileSync(p, buf)
  return { path: p, cleanup: () => rmSync(dir, { recursive: true }) }
}

describe("convert", () => {
  it("converts PNG to JPEG", async () => {
    const { path, cleanup } = await createTestPng()
    const result = await convert(path, "jpeg")
    expect(result.path).toMatch(/\.jpg$/)
    expect(result.format).toBe("jpeg")
    cleanup()
  })

  it("converts PNG to WebP", async () => {
    const { path, cleanup } = await createTestPng()
    const result = await convert(path, "webp")
    expect(result.path).toMatch(/\.webp$/)
    expect(result.format).toBe("webp")
    cleanup()
  })

  it("throws on unsupported format", async () => {
    const { path, cleanup } = await createTestPng()
    await expect(convert(path, "gif")).rejects.toThrow("Unsupported format")
    cleanup()
  })
})
