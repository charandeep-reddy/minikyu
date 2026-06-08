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
      description: "Get metadata about an image (dimensions, format, size, alpha)",
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
