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
