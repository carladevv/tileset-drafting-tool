import { useEffect, useMemo, useRef } from 'react'
import { SKETCH_SIZE, TRANSPARENT_INDEX } from '../lib/tileset'
import { SketchCanvas } from './SketchCanvas'
import styles from '../App.module.css'
import type { SketchData } from '../types/tileset'

type PixelEditorCanvasProps = {
  sketch: SketchData
  activeTool: 'draw' | 'erase'
  activePaletteIndex: number
  onPaint: (x: number, y: number, paletteIndex: number) => void
}

const clampCoordinate = (value: number) => Math.min(SKETCH_SIZE - 1, Math.max(0, value))

export const PixelEditorCanvas = ({
  sketch,
  activeTool,
  activePaletteIndex,
  onPaint,
}: PixelEditorCanvasProps) => {
  const isPaintingRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const paintIndex = useMemo(
    () => (activeTool === 'erase' ? TRANSPARENT_INDEX : activePaletteIndex),
    [activePaletteIndex, activeTool],
  )

  useEffect(() => {
    const stopPainting = () => {
      isPaintingRef.current = false
    }

    window.addEventListener('pointerup', stopPainting)
    return () => window.removeEventListener('pointerup', stopPainting)
  }, [])

  const paintFromEvent = (clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current
    if (!wrapper) {
      return
    }

    const rect = wrapper.getBoundingClientRect()
    const x = clampCoordinate(Math.floor(((clientX - rect.left) / rect.width) * SKETCH_SIZE))
    const y = clampCoordinate(Math.floor(((clientY - rect.top) / rect.height) * SKETCH_SIZE))
    onPaint(x, y, paintIndex)
  }

  return (
    <div
      ref={wrapperRef}
      className={styles.editorCanvasFrame}
      onPointerDown={(event) => {
        isPaintingRef.current = true
        paintFromEvent(event.clientX, event.clientY)
      }}
      onPointerMove={(event) => {
        if (!isPaintingRef.current) {
          return
        }

        paintFromEvent(event.clientX, event.clientY)
      }}
      onPointerLeave={() => {
        isPaintingRef.current = false
      }}
    >
      <SketchCanvas sketch={sketch} size={512} className={styles.editorCanvas} data-testid="pixel-editor-canvas" />
      <div className={styles.editorGridOverlay} aria-hidden="true" />
      <div className={styles.editorLabel}>64 x 64 logical pixels</div>
    </div>
  )
}
