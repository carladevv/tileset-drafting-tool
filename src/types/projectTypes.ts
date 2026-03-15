export const GRID_SIZE = 6 as const

export type CellLabelId = string

export type TileGrid = CellLabelId[][]

export type PreviewMode = 'semantic' | 'image'

export type CellDetailBehavior = {
  allowDetailPlacement: boolean
  detailCategories?: string[]
  densityWeight?: number
  blocking?: boolean
  spawnPriority?: number
}

export type CellLabel = {
  id: string
  name: string
  color: string
  detailBehavior?: CellDetailBehavior
  tags?: string[]
}

export type TileImageAsset = {
  id: string
  filename: string
  mimeType: string
  width: number
  height: number
  dataUrl: string
}

export type TileMetadata = {
  notes?: string
  category?: string
  tags?: string[]
}

export type Tile = {
  id: string
  name: string
  grid: TileGrid
  allowRotations: boolean
  imageAsset?: TileImageAsset | null
  metadata?: TileMetadata
}

export type ProjectSettings = {
  previewMode: PreviewMode
  defaultTileImageSize: number | null
  generationSeed: number | null
  generationWidth: number
  generationHeight: number
}

export type Project = {
  id: string
  name: string
  version: string
  gridSize: typeof GRID_SIZE
  cellLabels: CellLabel[]
  tiles: Tile[]
  settings: ProjectSettings
}

export type ValidationIssue = {
  id: string
  severity: 'error' | 'warning' | 'info'
  scope: 'project' | 'tile' | 'cellLabel' | 'generation'
  message: string
  tileId?: string
  cellLabelId?: string
}
