import { describe, it, expect } from "vitest"
import { resize } from "../tools/resize.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

async function createTestImage(w = 400, h = 300): Promise<{ path: string; cleanup: () => void }> {
  const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
  const buf = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 100, g: 150, b: 200 } },
  }).png().toBuffer()
  const p = join(dir, "test.png")
  writeFileSync(p, buf)
  return { path: p, cleanup: () => rmSync(dir, { recursive: true }) }
}

describe("resize", () => {
  it("resizes by width with aspect ratio lock", async () => {
    const { path, cleanup } = await createTestImage(400, 300)
    const result = await resize(path, 200)
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
    cleanup()
  })

  it("resizes by scale percentage", async () => {
    const { path, cleanup } = await createTestImage(400, 300)
    const result = await resize(path, undefined, undefined, 50)
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
    cleanup()
  })

  it("resizes by width and height without aspect lock", async () => {
    const { path, cleanup } = await createTestImage(400, 300)
    const result = await resize(path, 100, 200, undefined, false)
    expect(result.width).toBe(100)
    expect(result.height).toBe(200)
    cleanup()
  })

  it("includes dimensions in output filename", async () => {
    const { path, cleanup } = await createTestImage(400, 300)
    const result = await resize(path, 200)
    expect(result.path).toContain("200x150")
    cleanup()
  })
})
