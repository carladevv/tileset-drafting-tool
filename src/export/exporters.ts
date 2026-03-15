import { saveAs } from 'file-saver'
import { PALETTE, SKETCH_SIZE } from '../lib/tileset'
import type { Tile } from '../types/tileset'

export const exportTileMetadata = (tile: Tile) => {
  const payload = {
    tile: tile.name.trim(),
    id: tile.id,
    sideTags: tile.sideTags,
    sketch: {
      width: tile.sketch.width,
      height: tile.sketch.height,
    },
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  saveAs(blob, `${tile.name.trim() || 'untitled'}.json`)
  return payload
}

const hexToRgba = (hex: string) => {
  if (hex.startsWith('rgba')) {
    return [0, 0, 0, 0]
  }

  const normalized = hex.replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return [red, green, blue, 255]
}

export const renderSketchToCanvas = (tile: Tile, scale = 8) => {
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = SKETCH_SIZE
  sourceCanvas.height = SKETCH_SIZE
  const sourceContext = sourceCanvas.getContext('2d')

  if (!sourceContext) {
    throw new Error('2D canvas context is unavailable')
  }

  const imageData = sourceContext.createImageData(SKETCH_SIZE, SKETCH_SIZE)

  tile.sketch.pixels.forEach((paletteIndex, index) => {
    const [red, green, blue, alpha] = hexToRgba(PALETTE[paletteIndex] ?? PALETTE[0])
    const offset = index * 4
    imageData.data[offset] = red
    imageData.data[offset + 1] = green
    imageData.data[offset + 2] = blue
    imageData.data[offset + 3] = alpha
  })

  sourceContext.putImageData(imageData, 0, 0)

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = SKETCH_SIZE * scale
  outputCanvas.height = SKETCH_SIZE * scale
  const outputContext = outputCanvas.getContext('2d')

  if (!outputContext) {
    throw new Error('2D canvas context is unavailable')
  }

  outputContext.imageSmoothingEnabled = false
  outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height)
  outputContext.drawImage(sourceCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
  return outputCanvas
}

export const exportSketchPng = async (tile: Tile, scale = 8) => {
  const canvas = renderSketchToCanvas(tile, scale)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(new Error('Could not encode PNG'))
        return
      }

      resolve(value)
    }, 'image/png')
  })

  saveAs(blob, `${tile.name.trim() || 'untitled'}.png`)
}
