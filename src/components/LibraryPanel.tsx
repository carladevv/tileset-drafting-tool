import { useEffect, useRef, useState } from 'react'

import { useProjectStore } from '../store/projectStore'
import { TilePreview } from './TilePreview'

type LibraryTab = 'tiles' | 'labels'

export function LibraryPanel() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('tiles')

  const tiles = useProjectStore((state) => state.project.tiles)
  const labels = useProjectStore((state) => state.project.cellLabels)
  const selectedTileId = useProjectStore((state) => state.selectedTileId)
  const selectedLabelId = useProjectStore((state) => state.selectedLabelId)
  const validationIssues = useProjectStore((state) => state.validationIssues)
  const createTile = useProjectStore((state) => state.createTile)
  const duplicateTile = useProjectStore((state) => state.duplicateTile)
  const deleteTile = useProjectStore((state) => state.deleteTile)
  const selectTile = useProjectStore((state) => state.selectTile)
  const createCellLabel = useProjectStore((state) => state.createCellLabel)
  const updateCellLabel = useProjectStore((state) => state.updateCellLabel)
  const deleteCellLabel = useProjectStore((state) => state.deleteCellLabel)
  const selectLabel = useProjectStore((state) => state.selectLabel)

  const tileRowRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const tilesWithWarnings = new Set(
    validationIssues
      .filter((issue) => issue.message.startsWith('No compatible tiles on the'))
      .map((issue) => issue.tileId)
      .filter((tileId): tileId is string => Boolean(tileId)),
  )

  useEffect(() => {
    if (activeTab !== 'tiles' || !selectedTileId) {
      return
    }

    const selectedTileRow = tileRowRefs.current[selectedTileId]
    if (typeof selectedTileRow?.scrollIntoView === 'function') {
      selectedTileRow.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [activeTab, selectedTileId])

  const countUsage = (labelId: string) =>
    tiles.reduce(
      (total, tile) => total + tile.grid.reduce((rowTotal, row) => rowTotal + row.filter((cell) => cell === labelId).length, 0),
      0,
    )

  return (
    <section className="panel panel--library">
      <div className="panel__header panel__header--tabs">
        <div className="panel-tabs" role="tablist" aria-label="Library sections">
          <button
            type="button"
            role="tab"
            className={`panel-tab ${activeTab === 'tiles' ? 'is-active' : ''}`}
            aria-selected={activeTab === 'tiles'}
            onClick={() => setActiveTab('tiles')}
          >
            Tiles
          </button>
          <button
            type="button"
            role="tab"
            className={`panel-tab ${activeTab === 'labels' ? 'is-active' : ''}`}
            aria-selected={activeTab === 'labels'}
            onClick={() => setActiveTab('labels')}
          >
            Labels
          </button>
        </div>
        {activeTab === 'tiles' ? (
          <button type="button" className="pixel-button" onClick={() => createTile()}>
            + New Tile
          </button>
        ) : (
          <button type="button" className="pixel-button" onClick={() => createCellLabel()}>
            + Add Label
          </button>
        )}
      </div>

      {activeTab === 'tiles' ? (
        <>
          <div className="panel__body panel__body--stack panel__body--scroll" role="tabpanel" aria-label="Tiles">
            {tiles.length === 0 ? <p className="empty-copy">No tiles yet.</p> : null}
            {tiles.map((tile) => {
              const hasCompatibilityWarning = tilesWithWarnings.has(tile.id)

              return (
                <button
                  key={tile.id}
                  type="button"
                  className={`tile-row ${tile.id === selectedTileId ? 'is-selected' : ''}`}
                  onClick={() => selectTile(tile.id)}
                  ref={(element) => {
                    tileRowRefs.current[tile.id] = element
                  }}
                >
                  <TilePreview tile={tile} labels={labels} />
                  <span className="tile-row__meta">
                    <span className="tile-row__title">
                      <strong>{tile.name || 'Untitled tile'}</strong>
                      {hasCompatibilityWarning ? (
                        <span className="tile-row__warning" aria-label={`Compatibility warnings for ${tile.name || 'Untitled tile'}`}>
                          !
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="panel__footer">
            <button
              type="button"
              className="pixel-button"
              onClick={() => selectedTileId && duplicateTile(selectedTileId)}
              disabled={!selectedTileId}
            >
              Duplicate
            </button>
            <button
              type="button"
              className="pixel-button pixel-button--danger"
              onClick={() => selectedTileId && deleteTile(selectedTileId)}
              disabled={!selectedTileId}
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <div className="panel__body panel__body--stack panel__body--scroll" role="tabpanel" aria-label="Labels">
          {labels.length === 0 ? <p className="empty-copy">No labels yet.</p> : null}
          {labels.map((label) => {
            const usage = countUsage(label.id)

            return (
              <div key={label.id} className={`palette-row ${selectedLabelId === label.id ? 'is-selected' : ''}`}>
                <button type="button" className="palette-row__swatch" onClick={() => selectLabel(label.id)} aria-label={`Select ${label.name}`}>
                  <span style={{ backgroundColor: label.color }} />
                </button>
                <div className="palette-row__fields">
                  <input
                    aria-label={`Name for ${label.id}`}
                    value={label.name}
                    onChange={(event) => updateCellLabel(label.id, { name: event.target.value })}
                  />
                  <div className="palette-row__controls">
                    <input
                      aria-label={`Color for ${label.name}`}
                      type="color"
                      value={label.color}
                      onChange={(event) => updateCellLabel(label.id, { color: event.target.value })}
                    />
                    <span>{usage} cells</span>
                    <button
                      type="button"
                      className="pixel-button pixel-button--danger"
                      onClick={() => deleteCellLabel(label.id)}
                      title={usage > 0 ? 'Deleting this label will leave validation issues on any painted tiles.' : 'Delete label'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
