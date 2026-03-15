import type {
  GeneratedCell,
  GeneratedTerrain,
  RotatedTileView,
  Tile,
  TileRotation,
} from '../types/projectTypes'
import { getRotatedTileViews, getOppositeSide } from './compatibility'

export type TerrainGenerationSettings = {
  width: number
  height: number
  seed: number | null
}

export type TerrainCandidate = {
  tileId: string
  rotation: TileRotation
  view: RotatedTileView
}

const DEFAULT_SEED = 0
const BORDER_SEPARATOR = '\u0000'

const normalizeDimension = (value: number) => Math.max(1, Math.floor(value))
const serializeBorder = (border: string[]) => border.join(BORDER_SEPARATOR)

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5
    let next = Math.imul(state ^ (state >>> 15), 1 | state)
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

export const createEmptyGeneratedCell = (x: number, y: number, status: GeneratedCell['status'] = 'empty'): GeneratedCell => ({
  x,
  y,
  tileId: null,
  rotation: 0,
  status,
})

export const createEmptyTerrain = ({ width, height, seed }: TerrainGenerationSettings): GeneratedTerrain => ({
  width: normalizeDimension(width),
  height: normalizeDimension(height),
  seed,
  cells: Array.from({ length: normalizeDimension(height) }, (_, y) =>
    Array.from({ length: normalizeDimension(width) }, (_, x) => createEmptyGeneratedCell(x, y)),
  ),
})

export const getGenerationCandidates = (
  tiles: Tile[],
  northNeighbor: GeneratedCell | null,
  westNeighbor: GeneratedCell | null,
): TerrainCandidate[] => {
  const rotatedViewsByTileId = new Map(tiles.map((tile) => [tile.id, getRotatedTileViews(tile)]))
  const rotatedCandidates = tiles.flatMap((tile) =>
    (rotatedViewsByTileId.get(tile.id) ?? []).map((view) => ({
      tileId: tile.id,
      rotation: view.rotation,
      view,
    })),
  )

  return rotatedCandidates.filter((candidate) => {
    if (northNeighbor?.status === 'placed' && northNeighbor.tileId) {
      const northView = (rotatedViewsByTileId.get(northNeighbor.tileId) ?? []).find(
        (view) => view.rotation === northNeighbor.rotation,
      )
      if (!northView || serializeBorder(northView.borders.south) !== serializeBorder(candidate.view.borders.north)) {
        return false
      }
    }

    if (westNeighbor?.status === 'placed' && westNeighbor.tileId) {
      const westView = (rotatedViewsByTileId.get(westNeighbor.tileId) ?? []).find(
        (view) => view.rotation === westNeighbor.rotation,
      )
      if (!westView || serializeBorder(westView.borders.east) !== serializeBorder(candidate.view.borders.west)) {
        return false
      }
    }

    return true
  })
}

export const generateTerrain = (tiles: Tile[], settings: TerrainGenerationSettings): GeneratedTerrain => {
  const terrain = createEmptyTerrain(settings)
  const random = createSeededRandom(settings.seed ?? DEFAULT_SEED)
  const starterCandidates = tiles.map((tile) => ({
    tileId: tile.id,
    rotation: 0 as const,
    view: getRotatedTileViews(tile)[0],
  }))

  if (tiles.length === 0) {
    return terrain
  }

  for (let y = 0; y < terrain.height; y += 1) {
    for (let x = 0; x < terrain.width; x += 1) {
      const northNeighbor = terrain.cells[y - 1]?.[x] ?? null
      const westNeighbor = terrain.cells[y]?.[x - 1] ?? null
      const candidates =
        x === 0 && y === 0 ? starterCandidates.filter((candidate) => candidate.view) : getGenerationCandidates(tiles, northNeighbor, westNeighbor)

      if (candidates.length === 0) {
        terrain.cells[y][x] = createEmptyGeneratedCell(x, y, 'empty')
        continue
      }

      const selectedCandidate = candidates[Math.floor(random() * candidates.length)] ?? null

      if (!selectedCandidate) {
        terrain.cells[y][x] = createEmptyGeneratedCell(x, y, 'invalid')
        continue
      }

      terrain.cells[y][x] = {
        x,
        y,
        tileId: selectedCandidate.tileId,
        rotation: selectedCandidate.rotation,
        status: 'placed',
      }
    }
  }

  return terrain
}

export const getGeneratedCellView = (tiles: Tile[], cell: GeneratedCell | null) => {
  if (!cell || cell.status !== 'placed' || !cell.tileId) {
    return null
  }

  const tile = tiles.find((entry) => entry.id === cell.tileId)
  if (!tile) {
    return null
  }

  const view = getRotatedTileViews(tile).find((entry) => entry.rotation === cell.rotation)
  if (!view) {
    return null
  }

  return {
    tile,
    view,
    borders: {
      north: view.borders.north,
      east: view.borders.east,
      south: view.borders.south,
      west: view.borders.west,
    },
  }
}

export const cellMatchesNeighbor = (
  candidate: TerrainCandidate,
  neighbor: TerrainCandidate,
  side: 'north' | 'west',
) => {
  const candidateSide = side === 'north' ? 'north' : 'west'
  const neighborSide = getOppositeSide(candidateSide)

  return serializeBorder(candidate.view.borders[candidateSide]) === serializeBorder(neighbor.view.borders[neighborSide])
}
