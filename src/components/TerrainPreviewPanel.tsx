import { useMemo } from 'react'

import { useProjectStore } from '../store/projectStore'
import { getGeneratedCellView } from '../utils/terrainGeneration'
import { TilePreview } from './TilePreview'

export function TerrainPreviewPanel() {
  const project = useProjectStore((state) => state.project)
  const terrain = useProjectStore((state) => state.generatedTerrain)
  const selectedGeneratedCell = useProjectStore((state) => state.selectedGeneratedCell)
  const updateGenerationSettings = useProjectStore((state) => state.updateGenerationSettings)
  const generateTerrainPreview = useProjectStore((state) => state.generateTerrainPreview)
  const selectGeneratedCell = useProjectStore((state) => state.selectGeneratedCell)
  const selectedCell = useProjectStore((state) => state.getSelectedGeneratedTerrainCell())

  const selectedView = useMemo(
    () => getGeneratedCellView(project.tiles, selectedCell),
    [project.tiles, selectedCell],
  )
  const labelNameById = useMemo(
    () => Object.fromEntries(project.cellLabels.map((label) => [label.id, label.name])),
    [project.cellLabels],
  )
  const formatBorder = (values: string[]) => `[${values.map((value) => labelNameById[value] ?? value).join(', ')}]`

  return (
    <section className="panel panel--terrain">
      <div className="panel__body panel__body--stack panel__body--scroll">
        <div className="terrain-controls" aria-label="Terrain generation controls">
          <label className="field-group">
            <span>Width</span>
            <input
              type="number"
              min={1}
              aria-label="Generation width"
              value={project.settings.generationWidth}
              onChange={(event) => updateGenerationSettings({ generationWidth: Number(event.target.value) || 1 })}
            />
          </label>
          <label className="field-group">
            <span>Height</span>
            <input
              type="number"
              min={1}
              aria-label="Generation height"
              value={project.settings.generationHeight}
              onChange={(event) => updateGenerationSettings({ generationHeight: Number(event.target.value) || 1 })}
            />
          </label>
          <label className="field-group">
            <span>Seed</span>
            <input
              type="number"
              aria-label="Generation seed"
              value={project.settings.generationSeed ?? 0}
              onChange={(event) => updateGenerationSettings({ generationSeed: Number(event.target.value) || 0 })}
            />
          </label>
          <button type="button" className="pixel-button terrain-controls__button" onClick={() => generateTerrainPreview()}>
            Generate
          </button>
        </div>

        {!terrain ? (
          <p className="empty-copy">Generate terrain to inspect compatibility-driven placement.</p>
        ) : (
          <>
            <div
              className="terrain-grid"
              role="grid"
              aria-label={`Generated terrain ${terrain.width} by ${terrain.height}`}
              style={{
                gridTemplateColumns: `repeat(${terrain.width}, minmax(48px, 56px))`,
              }}
            >
              {terrain.cells.flatMap((row, y) =>
                row.map((cell, x) => {
                  const cellView = getGeneratedCellView(project.tiles, cell)
                  const isSelected = selectedGeneratedCell?.x === x && selectedGeneratedCell?.y === y

                  return (
                    <button
                      key={`${x}_${y}`}
                      type="button"
                      role="gridcell"
                      aria-label={`Generated cell ${x},${y} ${cell.status}`}
                      className={`terrain-grid__cell terrain-grid__cell--${cell.status} ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => selectGeneratedCell({ x, y })}
                    >
                      {cellView ? (
                        <TilePreview
                          tile={cellView.tile}
                          labels={project.cellLabels}
                          grid={cellView.view.rotatedGrid}
                          rotation={cellView.view.rotation}
                          size="medium"
                          ariaLabel={`Generated tile ${cellView.tile.name} at ${x},${y}`}
                        />
                      ) : (
                        <span className="terrain-grid__placeholder">{cell.status === 'empty' ? 'hole' : 'invalid'}</span>
                      )}
                    </button>
                  )
                }),
              )}
            </div>

            <div className="inspector-block">
              <h3>Generated Tile Details</h3>
              {!selectedCell ? (
                <p className="empty-copy">Click a generated tile to inspect it.</p>
              ) : selectedCell.status !== 'placed' || !selectedView ? (
                <div className="generated-cell-meta">
                  <p className="empty-copy">
                    Cell ({selectedCell.x}, {selectedCell.y}) is {selectedCell.status}.
                  </p>
                </div>
              ) : (
                <div className="generated-cell-meta">
                  <p>
                    <strong>{selectedView.tile.name || 'Untitled tile'}</strong> at ({selectedCell.x}, {selectedCell.y})
                  </p>
                  <p>Rotation: {selectedCell.rotation}°</p>
                  <p>North: {formatBorder(selectedView.borders.north)}</p>
                  <p>East: {formatBorder(selectedView.borders.east)}</p>
                  <p>South: {formatBorder(selectedView.borders.south)}</p>
                  <p>West: {formatBorder(selectedView.borders.west)}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
