import { useEffect, useRef } from 'react'
import { PALETTE, SKETCH_SIZE } from '../lib/tileset'
import type { SketchData } from '../types/tileset'

type SketchCanvasProps = {
  sketch: SketchData
  size: number
  className?: string
  'data-testid'?: string
}

export const SketchCanvas = ({ sketch, size, className, 'data-testid': testId }: SketchCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const imageData = context.createImageData(SKETCH_SIZE, SKETCH_SIZE)
    sketch.pixels.forEach((paletteIndex, index) => {
      const color = PALETTE[paletteIndex] ?? PALETTE[0]
      const offset = index * 4
      if (color.startsWith('rgba')) {
        imageData.data[offset + 3] = 0
        return
      }

      imageData.data[offset] = Number.parseInt(color.slice(1, 3), 16)
      imageData.data[offset + 1] = Number.parseInt(color.slice(3, 5), 16)
      imageData.data[offset + 2] = Number.parseInt(color.slice(5, 7), 16)
      imageData.data[offset + 3] = 255
    })

    context.putImageData(imageData, 0, 0)
  }, [sketch])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={SKETCH_SIZE}
      height={SKETCH_SIZE}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      data-testid={testId}
      data-filled-count={sketch.pixels.filter((pixel) => pixel !== 0).length}
    />
  )
}
