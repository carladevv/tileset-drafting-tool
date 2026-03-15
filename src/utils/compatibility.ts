import { GRID_SIZE } from '../types/projectTypes'
import type {
  CompatibilityGraph,
  CompatibilityMatch,
  Project,
  Tile,
  TileBorders,
  TileCompatibility,
  TileGrid,
  TileSide,
  ValidationIssue,
} from '../types/projectTypes'

export const tileSides: TileSide[] = ['north', 'east', 'south', 'west']

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
        const targetBorders = bordersByTileId[targetTile.id]
        if (!targetBorders) {
          continue
        }

        if (arraysEqual(sourceBorders[sourceSide], targetBorders[targetSide])) {
          matches.push({
            sourceTileId: sourceTile.id,
            sourceSide,
            targetTileId: targetTile.id,
            targetSide,
            targetRotation: 0,
          })
        }
      }

      byTileId[sourceTile.id][sourceSide] = matches
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
