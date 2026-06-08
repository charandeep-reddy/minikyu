# Minikyu MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local MCP server exposing image processing tools (compress, convert, resize, info, batch) powered by sharp.

**Architecture:** Single entry point at `packages/mcp-server/src/index.ts` registers 5 tools with `@modelcontextprotocol/sdk`. Each tool lives in its own file under `src/tools/`. Shared utilities in `src/utils/`. Sharp handles all image processing.

**Tech Stack:** TypeScript, sharp, @modelcontextprotocol/sdk, vitest, pnpm workspace

---

### Task 1: Scaffold project

**Files:**
- Create: `packages/mcp-server/package.json`
- Create: `packages/mcp-server/tsconfig.json`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@minikyu/mcp-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.9.0",
    "sharp": "^0.34.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

- [ ] **Step 3: Add workspace package to pnpm-workspace.yaml**

The file should include the new package path. Check current content and update.

- [ ] **Step 4: Install dependencies**

Run: `pnpm install --filter @minikyu/mcp-server`
Expected: sharp and MCP SDK installed in packages/mcp-server/node_modules

---

### Task 2: Create test image fixture

**File:** Create a small test image for unit tests

- [ ] **Step 1: Create test fixture helper**

Create `packages/mcp-server/src/__tests__/fixtures.ts`:

```typescript
import sharp from "sharp"
import { mkdtempSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

export function createTestImage(
  width = 100,
  height = 100,
  format: "jpeg" | "png" | "webp" = "png",
): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "minikyu-test-"))
  const outPath = join(dir, `test.${format}`)
  writeFileSync(outPath, sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 0, b: 0 } },
  }).toFormat(format).toBuffer())
  return { path: outPath, cleanup: () => fs.rmSync(dir, { recursive: true }) }
}
```

Actually, create a simpler approach — generate images inline in tests using sharp.

---

### Task 3: Implement shared utilities

**Files:**
- Create: `packages/mcp-server/src/utils/formats.ts`
- Create: `packages/mcp-server/src/utils/types.ts`

- [ ] **Step 1: Create format maps**

`src/utils/formats.ts`:

```typescript
export const OUTPUT_FORMATS = ["jpeg", "png", "webp", "avif"] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

export const FORMAT_META: Record<OutputFormat, { mime: string; ext: string }> = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  avif: { mime: "image/avif", ext: "avif" },
}

export function isValidFormat(f: string): f is OutputFormat {
  return OUTPUT_FORMATS.includes(f as OutputFormat)
}

export function parseQuality(q: number): number {
  return Math.max(1, Math.min(100, Math.round(q)))
}
```

- [ ] **Step 2: Create shared types**

`src/utils/types.ts`:

```typescript
export interface ImageInfo {
  width: number
  height: number
  format: string
  size: number
  hasAlpha: boolean
}

export interface ProcessResult {
  path: string
  originalSize: number
  compressedSize: number
  savingsPercent: number
}

export interface ConvertResult {
  path: string
  format: string
  size: number
}

export interface ResizeResult {
  path: string
  width: number
  height: number
  size: number
}
```

---

### Task 4: Implement compress_image tool

**Files:**
- Create: `packages/mcp-server/src/tools/compress.ts`
- Test: `packages/mcp-server/src/__tests__/compress.test.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/compress.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { compress } from "../tools/compress.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { rmSync } from "fs"

function createTestImage(): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
  const buf = sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 0, b: 0 } },
  }).png().toBufferSync()
  const p = join(dir, "test.png")
  writeFileSync(p, buf)
  return { path: p, cleanup: () => rmSync(dir, { recursive: true }) }
}

describe("compress tool", () => {
  it("compresses a PNG and returns smaller size", async () => {
    const { path, cleanup } = createTestImage()
    const result = await compress(path, 50)
    expect(result.path).toContain(".minikyu.")
    expect(result.savingsPercent).toBeGreaterThanOrEqual(0)
    cleanup()
  })
})
```

Run: `pnpm --filter @minikyu/mcp-server vitest run`
Expected: FAIL (compress not exported)

- [ ] **Step 2: Implement compress**

`src/tools/compress.ts`:

```typescript
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

  await sharp(filePath)
    .jpeg({ quality: q })
    .toFile(outPath)

  const compressedSize = statSync(outPath).size
  const savingsPercent = originalSize > 0
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0

  return { path: outPath, originalSize, compressedSize, savingsPercent }
}
```

Wait — the output format should match the input format. But what if the input is PNG and we compress with `.jpeg()` ? Let me think...

Actually for compress, the intent is to reduce file size while keeping the same format. So I should detect the input format and apply appropriate compression:

```typescript
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
```

- [ ] **Step 3: Run test to verify it passes**

Run: `pnpm --filter @minikyu/mcp-server vitest run`
Expected: PASS

---

### Task 5: Implement convert_format tool

**Files:**
- Create: `packages/mcp-server/src/tools/convert.ts`
- Test: `packages/mcp-server/src/__tests__/convert.test.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/convert.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { convert } from "../tools/convert.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

function createTestPng(): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
  const buf = sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 128, b: 255 } },
  }).png().toBufferSync()
  const p = join(dir, "test.png")
  writeFileSync(p, buf)
  return { path: p, cleanup: () => rmSync(dir, { recursive: true }) }
}

describe("convert tool", () => {
  it("converts PNG to JPEG", async () => {
    const { path, cleanup } = createTestPng()
    const result = await convert(path, "jpeg")
    expect(result.path).toMatch(/\.jpg$/)
    expect(result.format).toBe("jpeg")
    cleanup()
  })

  it("converts PNG to WebP", async () => {
    const { path, cleanup } = createTestPng()
    const result = await convert(path, "webp")
    expect(result.path).toMatch(/\.webp$/)
    expect(result.format).toBe("webp")
    cleanup()
  })
})
```

- [ ] **Step 2: Implement convert**

`src/tools/convert.ts`:

```typescript
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
    .toFormat(format as sharp.AvailableFormatInfo)
    .toFile(outPath)

  const size = statSync(outPath).size
  return { path: outPath, format, size }
}
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @minikyu/mcp-server vitest run`
Expected: PASS

---

### Task 6: Implement resize_image tool

**Files:**
- Create: `packages/mcp-server/src/tools/resize.ts`
- Test: `packages/mcp-server/src/__tests__/resize.test.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/resize.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { resize } from "../tools/resize.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

function createTestImage(w = 400, h = 300): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
  const buf = sharp({
    create: { width: w, height: h, channels: 3, background: { r: 100, g: 150, b: 200 } },
  }).png().toBufferSync()
  const p = join(dir, "test.png")
  writeFileSync(p, buf)
  return { path: p, cleanup: () => rmSync(dir, { recursive: true }) }
}

describe("resize tool", () => {
  it("resizes by width with aspect ratio lock", async () => {
    const { path, cleanup } = createTestImage(400, 300)
    const result = await resize(path, 200)
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
    cleanup()
  })

  it("resizes by scale percentage", async () => {
    const { path, cleanup } = createTestImage(400, 300)
    const result = await resize(path, undefined, undefined, 50)
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
    cleanup()
  })
})
```

- [ ] **Step 2: Implement resize**

`src/tools/resize.ts`:

```typescript
import sharp from "sharp"
import { dirname, basename, extname, join } from "path"
import { statSync } from "fs"
import type { ResizeResult } from "../utils/types.js"

interface ResizeOpts {
  width?: number
  height?: number
  scale?: number
  lockAspect?: boolean
}

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
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @minikyu/mcp-server vitest run`
Expected: PASS

---

### Task 7: Implement get_image_info tool

**Files:**
- Create: `packages/mcp-server/src/tools/info.ts`
- Test: `packages/mcp-server/src/__tests__/info.test.ts`

- [ ] **Step 1: Implement info**

`src/tools/info.ts`:

```typescript
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
```

- [ ] **Step 2: Write the test**

`src/__tests__/info.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { getInfo } from "../tools/info.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

describe("info tool", () => {
  it("returns image metadata", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
    const buf = sharp({
      create: { width: 640, height: 480, channels: 3, background: { r: 0, g: 0, b: 0 } },
    }).png().toBufferSync()
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
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @minikyu/mcp-server vitest run`
Expected: PASS

---

### Task 8: Implement batch_process tool

**Files:**
- Create: `packages/mcp-server/src/tools/batch.ts`
- Test: `packages/mcp-server/src/__tests__/batch.test.ts`

- [ ] **Step 1: Implement batch**

`src/tools/batch.ts`:

```typescript
import { compress } from "./compress.js"
import type { ProcessResult } from "../utils/types.js"

export async function batchProcess(
  paths: string[],
  quality: number,
  format?: string,
  width?: number,
  height?: number,
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = []

  for (const filePath of paths) {
    const result = await compress(filePath, quality)
    results.push(result)
  }

  return results
}
```

- [ ] **Step 2: Write test**

`src/__tests__/batch.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { batchProcess } from "../tools/batch.js"
import sharp from "sharp"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

describe("batch tool", () => {
  it("processes multiple images", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-test-"))
    const paths: string[] = []
    for (let i = 0; i < 3; i++) {
      const buf = sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: i * 50, g: 0, b: 0 } },
      }).png().toBufferSync()
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
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @minikyu/mcp-server vitest run`
Expected: PASS

---

### Task 9: Wire up main entry point

**File:**
- Create: `packages/mcp-server/src/index.ts`

- [ ] **Step 1: Create main server entry**

`src/index.ts`:

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { compress } from "./tools/compress.js"
import { convert } from "./tools/convert.js"
import { resize } from "./tools/resize.js"
import { getInfo } from "./tools/info.js"
import { batchProcess } from "./tools/batch.js"
import { isValidFormat, parseQuality } from "./utils/formats.js"

const server = new Server(
  { name: "minikyu-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "compress_image",
      description: "Compress an image file with quality control (1-100)",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the image file" },
          quality: { type: "number", description: "Quality 1-100", default: 80 },
        },
        required: ["path"],
      },
    },
    {
      name: "convert_format",
      description: "Convert image to a different format (jpeg, png, webp, avif)",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the image file" },
          format: {
            type: "string",
            enum: ["jpeg", "png", "webp", "avif"],
            description: "Target format",
          },
        },
        required: ["path", "format"],
      },
    },
    {
      name: "resize_image",
      description: "Resize an image by dimensions or scale percentage",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the image file" },
          width: { type: "number", description: "Target width in pixels" },
          height: { type: "number", description: "Target height in pixels" },
          scale: {
            type: "number",
            description: "Scale percentage (25, 50, 75, 100)",
          },
          lock_aspect: {
            type: "boolean",
            description: "Maintain aspect ratio when both width and height provided",
            default: true,
          },
        },
        required: ["path"],
      },
    },
    {
      name: "get_image_info",
      description: "Get metadata about an image (dimensions, format, size)",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the image file" },
        },
        required: ["path"],
      },
    },
    {
      name: "batch_process",
      description: "Process multiple images with the same settings",
      inputSchema: {
        type: "object",
        properties: {
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Array of image file paths",
          },
          quality: { type: "number", description: "Quality 1-100", default: 80 },
          format: {
            type: "string",
            enum: ["jpeg", "png", "webp", "avif"],
            description: "Convert to format (optional)",
          },
          width: { type: "number", description: "Target width (optional)" },
          height: { type: "number", description: "Target height (optional)" },
        },
        required: ["paths"],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "compress_image": {
        const { path, quality = 80 } = args as { path: string; quality?: number }
        const result = await compress(path, quality)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      }

      case "convert_format": {
        const { path, format } = args as { path: string; format: string }
        const result = await convert(path, format)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      }

      case "resize_image": {
        const { path, width, height, scale, lock_aspect = true } = args as {
          path: string
          width?: number
          height?: number
          scale?: number
          lock_aspect?: boolean
        }
        const result = await resize(path, width, height, scale, lock_aspect)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      }

      case "get_image_info": {
        const { path } = args as { path: string }
        const result = await getInfo(path)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      }

      case "batch_process": {
        const { paths, quality = 80 } = args as { paths: string[]; quality?: number }
        const results = await batchProcess(paths, quality)
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
```

---

### Task 10: Build and verify

- [ ] **Step 1: Build the project**

Run: `pnpm --filter @minikyu/mcp-server build`
Expected: dist/index.js created with no errors

- [ ] **Step 2: Quick smoke test**

Run: `echo '{}' | node packages/mcp-server/dist/index.js 2>&1 | head -5`
Expected: server starts and listens on stdin (no immediate crash)

- [ ] **Step 3: Add to opencode config**

The user's `~/.config/opencode/opencode.jsonc` needs the minikyu MCP entry. Since this is a relative path (lives in the project), it's best configured project-scoped via `opencode.jsonc` in the minikyu project root, or via the global config.

Update `~/.config/opencode/opencode.jsonc` to add:

```jsonc
"minikyu": {
  "type": "local",
  "command": ["node", "/Users/charan/Desktop/Projects/minikyu/packages/mcp-server/dist/index.js"],
  "enabled": true
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server/ docs/superpowers/
git commit -m "feat: add minikyu MCP server with compress, convert, resize, info, batch tools"
```
