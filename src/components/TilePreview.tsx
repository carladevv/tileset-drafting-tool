import { GRID_SIZE } from '../types/projectTypes'
import type { CellLabel, Tile } from '../types/projectTypes'

type TilePreviewProps = {
  tile: Tile
  labels: CellLabel[]
  size?: 'small' | 'large'
}

const getColorForCell = (cellLabelId: string, labels: CellLabel[]) =>
  labels.find((label) => label.id === cellLabelId)?.color ?? '#223033'

export function TilePreview({ tile, labels, size = 'small' }: TilePreviewProps) {
  return (
    <div className={`tile-preview tile-preview--${size}`} aria-hidden="true">
      {tile.grid.slice(0, GRID_SIZE).flatMap((row, rowIndex) =>
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
