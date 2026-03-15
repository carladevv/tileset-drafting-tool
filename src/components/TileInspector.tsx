import { useProjectStore } from '../store/projectStore'
import { tileSides } from '../utils/compatibility'
import { TilePreview } from './TilePreview'

export function TileInspector() {
  const tiles = useProjectStore((state) => state.project.tiles)
  const labels = useProjectStore((state) => state.project.cellLabels)
  const selectedTileId = useProjectStore((state) => state.selectedTileId)
  const validationIssues = useProjectStore((state) => state.validationIssues)
  const updateTileName = useProjectStore((state) => state.updateTileName)
  const getTileBorders = useProjectStore((state) => state.getTileBorders)
  const getCompatibilityForTile = useProjectStore((state) => state.getCompatibilityForTile)
  const selectTile = useProjectStore((state) => state.selectTile)
  const tile = tiles.find((entry) => entry.id === selectedTileId) ?? null
  const issues = validationIssues.filter((issue) => issue.tileId === selectedTileId)
  const borders = selectedTileId ? getTileBorders(selectedTileId) : null
  const compatibility = selectedTileId ? getCompatibilityForTile(selectedTileId) : null

  const getTileName = (tileId: string) => tiles.find((entry) => entry.id === tileId)?.name || 'Untitled tile'
  const getTile = (tileId: string) => tiles.find((entry) => entry.id === tileId) ?? null
  const getLabelName = (labelId: string) => labels.find((entry) => entry.id === labelId)?.name || labelId || 'empty'

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
                                <li key={`${match.sourceTileId}_${match.sourceSide}_${match.targetTileId}_${match.targetSide}`}>
                                  <button
                                    type="button"
                                    className="compatibility-match"
                                    onClick={() => selectTile(match.targetTileId)}
                                    aria-label={`Select compatible tile ${getTileName(match.targetTileId)} on ${match.targetSide}`}
                                  >
                                    <TilePreview tile={targetTile} labels={labels} size="tiny" />
                                    <span className="compatibility-match__meta">
                                      <span>{getTileName(match.targetTileId)}</span>
                                      <span>{match.targetSide}</span>
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
