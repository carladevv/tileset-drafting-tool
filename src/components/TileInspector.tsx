import { useEffect, useState } from 'react'

import { useProjectStore } from '../store/projectStore'
import { getRotatedTileViews, tileRotations, tileSides } from '../utils/compatibility'
import type { TileRotation } from '../types/projectTypes'
import { TilePreview } from './TilePreview'

export function TileInspector() {
  const tiles = useProjectStore((state) => state.project.tiles)
  const labels = useProjectStore((state) => state.project.cellLabels)
  const selectedTileId = useProjectStore((state) => state.selectedTileId)
  const validationIssues = useProjectStore((state) => state.validationIssues)
  const updateTileName = useProjectStore((state) => state.updateTileName)
  const setTileRotationEnabled = useProjectStore((state) => state.setTileRotationEnabled)
  const getTileBorders = useProjectStore((state) => state.getTileBorders)
  const getCompatibilityForTile = useProjectStore((state) => state.getCompatibilityForTile)
  const selectTile = useProjectStore((state) => state.selectTile)
  const [previewRotation, setPreviewRotation] = useState<TileRotation>(0)
  const tile = tiles.find((entry) => entry.id === selectedTileId) ?? null
  const issues = validationIssues.filter((issue) => issue.tileId === selectedTileId)
  const borders = selectedTileId ? getTileBorders(selectedTileId) : null
  const compatibility = selectedTileId ? getCompatibilityForTile(selectedTileId) : null
  const rotatedViews = tile ? getRotatedTileViews({ ...tile, allowRotations: true }) : []
  const previewView = rotatedViews.find((view) => view.rotation === previewRotation) ?? rotatedViews[0] ?? null

  const getTileName = (tileId: string) => tiles.find((entry) => entry.id === tileId)?.name || 'Untitled tile'
  const getTile = (tileId: string) => tiles.find((entry) => entry.id === tileId) ?? null
  const getLabelName = (labelId: string) => labels.find((entry) => entry.id === labelId)?.name || labelId || 'empty'

  useEffect(() => {
    setPreviewRotation(0)
  }, [selectedTileId])

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Tile Inspector</h2>
      </div>
      <div className="panel__body panel__body--stack">
        {!tile ? (
          <p className="empty-copy">Select a tile to inspect it.</p>
        ) : (
          <>
            <label className="field-group">
              <span>Name</span>
              <input
                type="text"
                aria-label="Tile name"
                value={tile.name}
                onChange={(event) => updateTileName(tile.id, event.target.value)}
              />
            </label>
            <label className="field-group">
              <span>Rotations</span>
              <div className="field-group__inline">
                <input
                  type="checkbox"
                  aria-label="Allow rotations"
                  checked={tile.allowRotations}
                  onChange={(event) => setTileRotationEnabled(tile.id, event.target.checked)}
                />
                <span>{tile.allowRotations ? 'Enabled' : 'Disabled'}</span>
              </div>
            </label>
            <div className="inspector-block">
              <h3>Rotated Preview</h3>
              <div className="compatibility-side__matches" role="tablist" aria-label="Rotation preview selector">
                {tileRotations.map((rotation) => (
                  <button
                    key={rotation}
                    type="button"
                    className="pixel-button"
                    aria-pressed={previewRotation === rotation}
                    onClick={() => setPreviewRotation(rotation)}
                  >
                    {rotation}°
                  </button>
                ))}
              </div>
              {previewView ? (
                <>
                  <p className="panel-hint">Inspecting semantic grid at {previewView.rotation}°.</p>
                  <TilePreview
                    tile={tile}
                    labels={labels}
                    grid={previewView.rotatedGrid}
                    size="large"
                    ariaLabel={`Rotated preview ${previewView.rotation} degrees`}
                  />
                </>
              ) : (
                <p className="empty-copy">No rotated preview available.</p>
              )}
            </div>
            <div className="inspector-block">
              <h3>Validation</h3>
              {issues.length === 0 ? (
                <p className="empty-copy">No issues.</p>
              ) : (
                <ul className="issue-list">
                  {issues.map((issue) => (
                    <li key={issue.id} className={`issue-list__item issue-list__item--${issue.severity}`}>
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="inspector-block">
              <h3>Compatibility</h3>
              {!borders || !compatibility ? (
                <p className="empty-copy">No compatibility data yet.</p>
              ) : (
                <div className="compatibility-list">
                  {tileSides.map((side) => {
                    const matches = compatibility[side]
                    const noMatches = matches.length === 0

                    return (
                      <section key={side} className="compatibility-side">
                        <header className="compatibility-side__header">
                          <h4>{side}</h4>
                          <span>Matches: {matches.length}</span>
                        </header>
                        <p className="compatibility-side__border">
                          [{borders[side].map((labelId) => getLabelName(labelId)).join(', ')}]
                        </p>
                        {noMatches ? (
                          <p className="compatibility-side__warning">Warning: no compatible tiles</p>
                        ) : (
                          <ul className="compatibility-side__matches">
                            {matches.map((match) => {
                              const targetTile = getTile(match.targetTileId)
                              if (!targetTile) {
                                return null
                              }

                              return (
                                <li
                                  key={`${match.sourceTileId}_${match.sourceSide}_${match.targetTileId}_${match.targetSide}_${match.targetRotation}`}
                                >
                                  <button
                                    type="button"
                                    className="compatibility-match"
                                    onClick={() => selectTile(match.targetTileId)}
                                    aria-label={`Select compatible tile ${getTileName(match.targetTileId)} on ${match.targetSide}${match.targetRotation === 0 ? '' : ` rotated ${match.targetRotation} degrees`}`}
                                  >
                                    <TilePreview tile={targetTile} labels={labels} size="tiny" />
                                    <span className="compatibility-match__meta">
                                      <span>{getTileName(match.targetTileId)}</span>
                                      <span>
                                        {match.targetSide}
                                        {match.targetRotation === 0 ? '' : ` (rot ${match.targetRotation})`}
                                      </span>
                                    </span>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </section>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
