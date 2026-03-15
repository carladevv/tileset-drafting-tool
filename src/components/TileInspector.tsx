import { useProjectStore } from '../store/projectStore'

export function TileInspector() {
  const tiles = useProjectStore((state) => state.project.tiles)
  const selectedTileId = useProjectStore((state) => state.selectedTileId)
  const validationIssues = useProjectStore((state) => state.validationIssues)
  const updateTileName = useProjectStore((state) => state.updateTileName)
  const tile = tiles.find((entry) => entry.id === selectedTileId) ?? null
  const issues = validationIssues.filter((issue) => issue.tileId === selectedTileId)

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
          </>
        )}
      </div>
    </section>
  )
}
