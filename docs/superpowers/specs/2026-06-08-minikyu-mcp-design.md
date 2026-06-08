# Minikyu MCP Server Design

> **Spec:** Image processing MCP server for minikyu — local-only, sharp-based

**Goal:** Build a local MCP server that exposes minikyu's image processing capabilities (compress, convert, resize, info, batch) as programmable tools for AI agents.

**Architecture:** Node.js/TypeScript MCP server using `@modelcontextprotocol/sdk` (stdio transport) and `sharp` for image processing. Lives as a workspace package in `packages/mcp-server/`.

**Design decisions:**
- Local-only: images never leave the machine
- sharp over squoosh/wasm: faster, more capable, well-maintained
- Param consistency: same quality ranges (1-100), format names, and scale presets (25/50/75/100%) as the web UI

## Tools

### compress_image
- **Params:** `path` (string), `quality` (number 1-100)
- **Output:** compressed file written alongside original, returns `{ path, originalSize, compressedSize, savingsPercent }`

### convert_format
- **Params:** `path` (string), `format` ("jpeg" | "png" | "webp" | "avif")
- **Output:** converted file with new extension, returns `{ path, format, size }`

### resize_image
- **Params:** `path` (string), `width?` (number), `height?` (number), `scale?` (25 | 50 | 75 | 100), `lock_aspect` (boolean, default true)
- **Output:** resized image, returns `{ path, width, height, size }`

### get_image_info
- **Params:** `path` (string)
- **Output:** returns `{ width, height, format, size, hasAlpha }`

### batch_process
- **Params:** `paths` (string[]), `quality` (number), `format?` (string), `width?` (number), `height?` (number)
- **Output:** all files processed with same settings, returns array of result objects

## Output file naming
- Compressed: `{name}.minikyu.{ext}`
- Converted: `{name}.{newExt}`
- Resized: `{name}.{width}x{height}.{ext}`
- Batch: same naming per operation type
