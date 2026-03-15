import type { Side, SketchData, Tile, TileNameValidation, TileSideTags, TilesetState } from '../types/tileset'

export const STORAGE_KEY = 'tileset-planner.stage1'
export const SKETCH_SIZE = 64 as const
export const TRANSPARENT_INDEX = 0
export const SIDES: Side[] = ['north', 'east', 'south', 'west']

export const PALETTE = [
  'rgba(0,0,0,0)',
  '#f4efe1',
  '#ff7a59',
  '#ffd23f',
  '#7bd389',
  '#59c3c3',
  '#4d7cff',
  '#8b5cf6',
] as const

const EMPTY_SIDE_TAGS: TileSideTags = {
  north: '',
  east: '',
  south: '',
  west: '',
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `tile_${Math.random().toString(36).slice(2, 10)}`
}

export const createEmptySketch = (): SketchData => ({
  width: SKETCH_SIZE,
  height: SKETCH_SIZE,
  pixels: Array(SKETCH_SIZE * SKETCH_SIZE).fill(TRANSPARENT_INDEX),
})

export const createTile = (name: string, now = new Date().toISOString()): Tile => ({
  id: createId(),
  name: name.trim(),
  sketch: createEmptySketch(),
  sideTags: { ...EMPTY_SIDE_TAGS },
  createdAt: now,
  updatedAt: now,
})

export const createDefaultState = (): TilesetState => {
  const starterTile = createTile('tile_01')

  return {
    version: 1,
    selectedTileId: starterTile.id,
    tiles: [starterTile],
  }
}

export const getPixelIndex = (x: number, y: number) => y * SKETCH_SIZE + x

export const duplicateTileName = (originalName: string, existingNames: string[]) => {
  const source = originalName.trim() || 'tile'
  const base = `${source}_copy`

  if (!existingNames.includes(base)) {
    return base
  }

  let suffix = 2
  while (existingNames.includes(`${base}_${suffix}`)) {
    suffix += 1
  }

  return `${base}_${suffix}`
}

export const createNextTileName = (existingNames: string[]) => {
  let index = 1
  while (true) {
    const candidate = `tile_${String(index).padStart(2, '0')}`
    if (!existingNames.includes(candidate)) {
      return candidate
    }
    index += 1
  }
}

export const validateTileName = (name: string, tileId: string, tiles: Tile[]): TileNameValidation => {
  const trimmedName = name.trim()
  const isEmpty = trimmedName.length === 0
  const isDuplicate = tiles.some((tile) => tile.id !== tileId && tile.name.trim() === trimmedName)

  return {
    trimmedName,
    isEmpty,
    isDuplicate,
    isValid: !isEmpty && !isDuplicate,
  }
}

export const serializeState = (state: TilesetState) =>
  JSON.stringify({
    ...state,
    tiles: state.tiles.map((tile) => ({
      ...tile,
      name: tile.name.trim(),
      sideTags: Object.fromEntries(SIDES.map((side) => [side, tile.sideTags[side].trim()])) as TileSideTags,
    })),
  })

const isValidSketch = (value: unknown): value is SketchData => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const sketch = value as SketchData
  return (
    sketch.width === SKETCH_SIZE &&
    sketch.height === SKETCH_SIZE &&
    Array.isArray(sketch.pixels) &&
    sketch.pixels.length === SKETCH_SIZE * SKETCH_SIZE &&
    sketch.pixels.every((pixel) => Number.isInteger(pixel))
  )
}

const isValidTile = (value: unknown): value is Tile => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const tile = value as Tile
  return (
    typeof tile.id === 'string' &&
    typeof tile.name === 'string' &&
    typeof tile.createdAt === 'string' &&
    typeof tile.updatedAt === 'string' &&
    isValidSketch(tile.sketch) &&
    typeof tile.sideTags?.north === 'string' &&
    typeof tile.sideTags?.east === 'string' &&
    typeof tile.sideTags?.south === 'string' &&
    typeof tile.sideTags?.west === 'string'
  )
}

export const deserializeState = (raw: string | null): TilesetState => {
  if (!raw) {
    return createDefaultState()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TilesetState>
    if (parsed.version !== 1 || !Array.isArray(parsed.tiles)) {
      return createDefaultState()
    }

    const tiles = parsed.tiles.filter(isValidTile).map((tile) => ({
      ...tile,
      name: tile.name.trim(),
      sideTags: {
        north: tile.sideTags.north.trim(),
        east: tile.sideTags.east.trim(),
        south: tile.sideTags.south.trim(),
        west: tile.sideTags.west.trim(),
      },
      sketch: {
        width: SKETCH_SIZE,
        height: SKETCH_SIZE,
        pixels: tile.sketch.pixels.slice(0, SKETCH_SIZE * SKETCH_SIZE),
      },
    }))

    if (tiles.length === 0) {
      return createDefaultState()
    }

    const selectedTileId =
      typeof parsed.selectedTileId === 'string' && tiles.some((tile) => tile.id === parsed.selectedTileId)
        ? parsed.selectedTileId
        : tiles[0].id

    return {
      version: 1,
      selectedTileId,
      tiles,
    }
  } catch {
    return createDefaultState()
  }
}
