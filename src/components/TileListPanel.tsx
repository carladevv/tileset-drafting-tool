import { useProjectStore } from '../store/projectStore'
import { TilePreview } from './TilePreview'

export function TileListPanel() {
  const tiles = useProjectStore((state) => state.project.tiles)
  const labels = useProjectStore((state) => state.project.cellLabels)
  const selectedTileId = useProjectStore((state) => state.selectedTileId)
  const validationIssues = useProjectStore((state) => state.validationIssues)
  const createTile = useProjectStore((state) => state.createTile)
  const duplicateTile = useProjectStore((state) => state.duplicateTile)
  const deleteTile = useProjectStore((state) => state.deleteTile)
  const selectTile = useProjectStore((state) => state.selectTile)
  const tilesWithWarnings = new Set(
    validationIssues
      .filter((issue) => issue.message.startsWith('No compatible tiles on the'))
      .map((issue) => issue.tileId)
      .filter((tileId): tileId is string => Boolean(tileId)),
  )

  return (
    <section className="panel panel--tiles">
      <div className="panel__header">
        <h2>Tiles</h2>
        <button type="button" className="pixel-button" onClick={() => createTile()}>
          + New Tile
        </button>
      </div>
      <div className="panel__body panel__body--stack panel__body--scroll">
        {tiles.length === 0 ? <p className="empty-copy">No tiles yet.</p> : null}
        {tiles.map((tile) => {
          const hasCompatibilityWarning = tilesWithWarnings.has(tile.id)

          return (
            <button
              key={tile.id}
              type="button"
              className={`tile-row ${tile.id === selectedTileId ? 'is-selected' : ''}`}
              onClick={() => selectTile(tile.id)}
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
                <span>Rotations enabled by default</span>
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
    </section>
  )
}
