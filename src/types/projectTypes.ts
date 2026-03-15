export const GRID_SIZE = 6 as const

export type CellLabelId = string

export type TileGrid = CellLabelId[][]

export type TileSide = 'north' | 'east' | 'south' | 'west'

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

export type BorderArray = CellLabelId[]

export type TileBorders = {
  north: BorderArray
  east: BorderArray
  south: BorderArray
  west: BorderArray
}

export type TileRotation = 0 | 90 | 180 | 270

export type RotatedTileView = {
  baseTileId: string
  rotation: TileRotation
  rotatedGrid: TileGrid
  borders: TileBorders
}

export type CompatibilityMatch = {
  sourceTileId: string
  sourceSide: TileSide
  targetTileId: string
  targetSide: TileSide
  targetRotation: TileRotation
}

export type TileCompatibility = {
  north: CompatibilityMatch[]
  east: CompatibilityMatch[]
  south: CompatibilityMatch[]
  west: CompatibilityMatch[]
}

export type CompatibilityGraph = {
  byTileId: Record<string, TileCompatibility>
}

export type GeneratedCellStatus = 'placed' | 'empty' | 'invalid'

export type GeneratedCell = {
  x: number
  y: number
  tileId: string | null
  rotation: TileRotation
  status: GeneratedCellStatus
}

export type GeneratedTerrain = {
  width: number
  height: number
  seed: number | null
  cells: GeneratedCell[][]
}

export type ValidationIssue = {
  id: string
  severity: 'error' | 'warning' | 'info'
  scope: 'project' | 'tile' | 'cellLabel' | 'generation'
  message: string
  tileId?: string
  cellLabelId?: string
}
