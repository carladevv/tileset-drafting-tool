import { GRID_SIZE } from '../types/projectTypes'
import type {
  CompatibilityGraph,
  CompatibilityMatch,
  Project,
  RotatedTileView,
  Tile,
  TileBorders,
  TileCompatibility,
  TileGrid,
  TileRotation,
  TileSide,
  ValidationIssue,
} from '../types/projectTypes'

export const tileSides: TileSide[] = ['north', 'east', 'south', 'west']
export const tileRotations: TileRotation[] = [0, 90, 180, 270]

const oppositeSideBySide: Record<TileSide, TileSide> = {
  north: 'south',
  east: 'west',
  south: 'north',
  west: 'east',
}

export const createEmptyTileCompatibility = (): TileCompatibility => ({
  north: [],
  east: [],
  south: [],
  west: [],
})

const cloneGrid = (grid: TileGrid): TileGrid => grid.map((row) => [...row])

export const deriveTileBorders = (grid: TileGrid): TileBorders => ({
  north: [...(grid[0] ?? [])],
  east: grid.map((row) => row[GRID_SIZE - 1]).filter((cell): cell is string => cell !== undefined),
  south: [...(grid[GRID_SIZE - 1] ?? [])],
  west: grid.map((row) => row[0]).filter((cell): cell is string => cell !== undefined),
})

export const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

export const isOppositeSide = (left: TileSide, right: TileSide) => oppositeSideBySide[left] === right

export const getOppositeSide = (side: TileSide): TileSide => oppositeSideBySide[side]

export const isValidGridShape = (grid: TileGrid) =>
  grid.length === GRID_SIZE && grid.every((row) => row.length === GRID_SIZE)

export const rotateGrid90 = (grid: TileGrid): TileGrid =>
  Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, column) => grid[GRID_SIZE - 1 - column]?.[row] ?? ''),
  )

export const rotateGrid180 = (grid: TileGrid): TileGrid => rotateGrid90(rotateGrid90(grid))

export const rotateGrid270 = (grid: TileGrid): TileGrid => rotateGrid90(rotateGrid180(grid))

export const rotateGrid = (grid: TileGrid, rotation: TileRotation): TileGrid => {
  if (rotation === 0) {
    return cloneGrid(grid)
  }

  if (rotation === 90) {
    return rotateGrid90(grid)
  }

  if (rotation === 180) {
    return rotateGrid180(grid)
  }

  return rotateGrid270(grid)
}

export const getTileRotations = (tile: Tile): TileRotation[] => (tile.allowRotations ? tileRotations : [0])

export const getRotatedTileViews = (tile: Tile): RotatedTileView[] =>
  getTileRotations(tile).map((rotation) => {
    const rotatedGrid = rotateGrid(tile.grid, rotation)

    return {
      baseTileId: tile.id,
      rotation,
      rotatedGrid,
      borders: deriveTileBorders(rotatedGrid),
    }
  })

export const dedupeCompatibilityMatches = (matches: CompatibilityMatch[]) => {
  const seen = new Set<string>()

  return matches.filter((match) => {
    const key = [
      match.sourceTileId,
      match.sourceSide,
      match.targetTileId,
      match.targetSide,
      match.targetRotation,
    ].join(':')

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const computeCompatibilityGraph = (tiles: Tile[]): CompatibilityGraph => {
  const bordersByTileId = Object.fromEntries(tiles.map((tile) => [tile.id, deriveTileBorders(tile.grid)]))
  const byTileId = Object.fromEntries(tiles.map((tile) => [tile.id, createEmptyTileCompatibility()]))

  for (const sourceTile of tiles) {
    const sourceBorders = bordersByTileId[sourceTile.id]
    if (!sourceBorders) {
      continue
    }

    for (const sourceSide of tileSides) {
      const matches: CompatibilityMatch[] = []
      const targetSide = getOppositeSide(sourceSide)

      for (const targetTile of tiles) {
        getRotatedTileViews(targetTile).forEach((targetView) => {
          if (!arraysEqual(sourceBorders[sourceSide], targetView.borders[targetSide])) {
            return
          }

          matches.push({
            sourceTileId: sourceTile.id,
            sourceSide,
            targetTileId: targetTile.id,
            targetSide,
            targetRotation: targetView.rotation,
          })
        })
      }

      byTileId[sourceTile.id][sourceSide] = dedupeCompatibilityMatches(matches)
    }
  }

  return { byTileId }
}

export const computeCompatibilityWarnings = (
  project: Project,
  graph: CompatibilityGraph,
  createValidationIssue: (issue: Omit<ValidationIssue, 'id'>) => ValidationIssue,
) => {
  const issues: ValidationIssue[] = []

  for (const tile of project.tiles) {
    if (!isValidGridShape(tile.grid)) {
      continue
    }

    const compatibility = graph.byTileId[tile.id] ?? createEmptyTileCompatibility()
    tileSides.forEach((side) => {
      if (compatibility[side].length === 0) {
        issues.push(
          createValidationIssue({
            severity: 'warning',
            scope: 'tile',
            message: `No compatible tiles on the ${side} side.`,
            tileId: tile.id,
          }),
        )
      }
    })
  }

  return issues
}
