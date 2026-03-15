export type Side = 'north' | 'east' | 'south' | 'west'

export type TileSideTags = {
  north: string
  east: string
  south: string
  west: string
}

export type SketchData = {
  width: 64
  height: 64
  pixels: number[]
}

export type Tile = {
  id: string
  name: string
  sketch: SketchData
  sideTags: TileSideTags
  createdAt: string
  updatedAt: string
}

export type TilesetState = {
  version: 1
  selectedTileId: string | null
  tiles: Tile[]
}

export type TileNameValidation = {
  trimmedName: string
  isEmpty: boolean
  isDuplicate: boolean
  isValid: boolean
}
