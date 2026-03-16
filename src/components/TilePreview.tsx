import { useProjectStore } from '../store/projectStore'
import { GRID_SIZE } from '../types/projectTypes'
import type { CellLabel, Tile, TileGrid, TileRotation } from '../types/projectTypes'
import { getTilePreviewSource } from '../utils/tileImageAssets'

type TilePreviewProps = {
  tile: Tile
  labels: CellLabel[]
  grid?: TileGrid
  rotation?: TileRotation
  size?: 'tiny' | 'small' | 'medium' | 'large'
  ariaLabel?: string
}

const getColorForCell = (cellLabelId: string, labels: CellLabel[]) =>
  labels.find((label) => label.id === cellLabelId)?.color ?? '#223033'

export function TilePreview({ tile, labels, grid, rotation = 0, size = 'small', ariaLabel }: TilePreviewProps) {
  const previewGrid = grid ?? tile.grid
  const previewMode = useProjectStore((state) => state.project.settings.previewMode)
  const previewSource = getTilePreviewSource(tile, previewMode)
  const isImagePreview = previewSource !== 'semantic'

  return (
    <div
      className={`tile-preview tile-preview--${size} ${isImagePreview ? 'tile-preview--image' : 'tile-preview--semantic'}`}
      data-preview-kind={isImagePreview ? 'image' : 'semantic'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : 'true'}
    >
      {isImagePreview ? (
        <img
          src={previewSource.dataUrl}
          alt=""
          aria-hidden="true"
          className="tile-preview__image"
          style={{ transform: rotation === 0 ? undefined : `rotate(${rotation}deg)` }}
        />
      ) : (
        previewGrid.slice(0, GRID_SIZE).flatMap((row, rowIndex) =>
          row.slice(0, GRID_SIZE).map((cellLabelId, columnIndex) => (
            <span
              key={`${tile.id}_${rowIndex}_${columnIndex}`}
              className="tile-preview__cell"
              style={{ backgroundColor: getColorForCell(cellLabelId, labels) }}
            />
          )),
        )
      )}
    </div>
  )
}
