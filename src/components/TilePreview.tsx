import { GRID_SIZE } from '../types/projectTypes'
import type { CellLabel, Tile, TileGrid } from '../types/projectTypes'

type TilePreviewProps = {
  tile: Tile
  labels: CellLabel[]
  grid?: TileGrid
  size?: 'tiny' | 'small' | 'large'
  ariaLabel?: string
}

const getColorForCell = (cellLabelId: string, labels: CellLabel[]) =>
  labels.find((label) => label.id === cellLabelId)?.color ?? '#223033'

export function TilePreview({ tile, labels, grid, size = 'small', ariaLabel }: TilePreviewProps) {
  const previewGrid = grid ?? tile.grid

  return (
    <div className={`tile-preview tile-preview--${size}`} aria-label={ariaLabel} aria-hidden={ariaLabel ? undefined : 'true'}>
      {previewGrid.slice(0, GRID_SIZE).flatMap((row, rowIndex) =>
        row.slice(0, GRID_SIZE).map((cellLabelId, columnIndex) => (
          <span
            key={`${tile.id}_${rowIndex}_${columnIndex}`}
            className="tile-preview__cell"
            style={{ backgroundColor: getColorForCell(cellLabelId, labels) }}
          />
        )),
      )}
    </div>
  )
}
