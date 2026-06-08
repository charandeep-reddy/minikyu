import { describe, it, expect } from "vitest"
import { getInfo } from "../tools/info.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

describe("getInfo", () => {
  it("returns image metadata", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
    const buf = await sharp({
      create: { width: 640, height: 480, channels: 3, background: { r: 0, g: 0, b: 0 } },
    }).png().toBuffer()
    const p = join(dir, "test.png")
    writeFileSync(p, buf)

    const info = await getInfo(p)
    expect(info.width).toBe(640)
    expect(info.height).toBe(480)
    expect(info.format).toBe("png")
    expect(info.size).toBeGreaterThan(0)
    expect(info.hasAlpha).toBe(false)

    rmSync(dir, { recursive: true })
  })
})
