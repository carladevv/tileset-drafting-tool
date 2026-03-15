import { useProjectStore } from '../store/projectStore'

export function PalettePanel() {
  const labels = useProjectStore((state) => state.project.cellLabels)
  const tiles = useProjectStore((state) => state.project.tiles)
  const selectedLabelId = useProjectStore((state) => state.selectedLabelId)
  const createCellLabel = useProjectStore((state) => state.createCellLabel)
  const updateCellLabel = useProjectStore((state) => state.updateCellLabel)
  const deleteCellLabel = useProjectStore((state) => state.deleteCellLabel)
  const selectLabel = useProjectStore((state) => state.selectLabel)

  const countUsage = (labelId: string) =>
    tiles.reduce(
      (total, tile) => total + tile.grid.reduce((rowTotal, row) => rowTotal + row.filter((cell) => cell === labelId).length, 0),
      0,
    )

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Palette</h2>
        <button type="button" className="pixel-button" onClick={() => createCellLabel()}>
          + Add Label
        </button>
      </div>
      <div className="panel__body panel__body--stack">
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
    </section>
  )
}
