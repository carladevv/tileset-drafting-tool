import { useEffect, useRef } from 'react'

import { useProjectStore } from '../store/projectStore'
import { GRID_SIZE } from '../types/projectTypes'

const emptyCellColor = '#223033'

export function TileEditorGrid() {
  const tiles = useProjectStore((state) => state.project.tiles)
  const selectedTileId = useProjectStore((state) => state.selectedTileId)
  const labels = useProjectStore((state) => state.project.cellLabels)
  const selectedLabelId = useProjectStore((state) => state.selectedLabelId)
  const paintCell = useProjectStore((state) => state.paintCell)
  const isPaintingRef = useRef(false)
  const tile = tiles.find((entry) => entry.id === selectedTileId) ?? null

  useEffect(() => {
    const stopPainting = () => {
      isPaintingRef.current = false
    }

    window.addEventListener('mouseup', stopPainting)
    return () => window.removeEventListener('mouseup', stopPainting)
  }, [])

  if (!tile) {
    return (
      <section className="editor-panel">
        <div className="editor-panel__header">
          <h2>Tile Editor</h2>
        </div>
        <div className="editor-panel__empty">
          <p>Create a tile to start painting.</p>
        </div>
      </section>
    )
  }

  const getColorForCell = (cellLabelId: string) =>
    labels.find((label) => label.id === cellLabelId)?.color ?? emptyCellColor

  const handlePaint = (row: number, column: number) => {
    if (!selectedLabelId) {
      return
    }

    paintCell(tile.id, row, column, selectedLabelId)
  }

  return (
    <section className="editor-panel">
      <div className="editor-panel__header">
        <div>
          <p className="panel-kicker">Semantic Grid</p>
          <h2>{tile.name || 'Untitled tile'}</h2>
        </div>
        <p className="panel-hint">6x6 at 64px per cell</p>
      </div>
      <div className="editor-panel__body">
        <div className="tile-grid" role="grid" aria-label="Tile editor grid">
          {Array.from({ length: GRID_SIZE }).flatMap((_, row) =>
            Array.from({ length: GRID_SIZE }).map((__, column) => (
              <button
                key={`${row}_${column}`}
                type="button"
                role="gridcell"
                aria-label={`Cell ${row},${column}`}
                className="tile-grid__cell"
                data-row={row}
                data-column={column}
                data-label-id={tile.grid[row]?.[column] ?? ''}
                onMouseDown={() => {
                  isPaintingRef.current = true
                  handlePaint(row, column)
                }}
                onMouseEnter={(event) => {
                  if (isPaintingRef.current || event.buttons === 1) {
                    handlePaint(row, column)
                  }
                }}
                style={{ backgroundColor: getColorForCell(tile.grid[row]?.[column] ?? '') }}
              />
            )),
          )}
        </div>
      </div>
      <div className="editor-panel__footer">
        <span>Active label: {labels.find((label) => label.id === selectedLabelId)?.name ?? 'None selected'}</span>
      </div>
    </section>
  )
}
