import { describe, it, expect } from "vitest"
import { batchProcess } from "../tools/batch.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

describe("batchProcess", () => {
  it("processes multiple images", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
    const paths: string[] = []
    for (let i = 0; i < 3; i++) {
      const buf = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: i * 50, g: 0, b: 0 } },
      }).png().toBuffer()
      const p = join(dir, `test-${i}.png`)
      writeFileSync(p, buf)
      paths.push(p)
    }

    const results = await batchProcess(paths, 50)
    expect(results).toHaveLength(3)
    for (const r of results) {
      expect(r.path).toContain(".minikyu.")
      expect(r.savingsPercent).toBeGreaterThanOrEqual(0)
    }
    rmSync(dir, { recursive: true })
  })
})
