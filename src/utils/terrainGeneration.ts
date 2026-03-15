import type {
  GeneratedCell,
  GeneratedTerrain,
  RotatedTileView,
  Tile,
  TileRotation,
} from '../types/projectTypes'
import { getOppositeSide, getRotatedTileViews } from './compatibility'
import { normalizeTileWeight } from './tileWeights'

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

type TileSide = 'north' | 'east' | 'south' | 'west'

type NeighborConstraint = {
  side: TileSide
  neighbor: GeneratedCell
}

type CandidateIndex = {
  allCandidates: TerrainCandidate[]
  bySideAndBorder: Record<TileSide, Map<string, TerrainCandidate[]>>
  weightByTileId: Map<string, number>
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

const shuffleInPlace = <T>(items: T[], random: () => number) => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
  }

  return items
}

const getCandidateWeight = (
  candidate: TerrainCandidate,
  weightByTileId: Map<string, number>,
) => weightByTileId.get(candidate.tileId) ?? 1

const createWeightedCandidateOrder = (
  candidates: TerrainCandidate[],
  weightByTileId: Map<string, number>,
  random: () => number,
) => {
  const remaining = [...candidates]
  const ordered: TerrainCandidate[] = []

  while (remaining.length > 0) {
    const totalWeight = remaining.reduce(
      (sum, candidate) => sum + getCandidateWeight(candidate, weightByTileId),
      0,
    )

    if (totalWeight <= 0) {
      return shuffleInPlace(remaining, random)
    }

    let threshold = random() * totalWeight
    let chosenIndex = remaining.length - 1

    for (let index = 0; index < remaining.length; index += 1) {
      threshold -= getCandidateWeight(remaining[index], weightByTileId)
      if (threshold < 0) {
        chosenIndex = index
        break
      }
    }

    const [chosenCandidate] = remaining.splice(chosenIndex, 1)
    ordered.push(chosenCandidate)
  }

  return ordered
}

const cloneGeneratedCell = (cell: GeneratedCell): GeneratedCell => ({
  x: cell.x,
  y: cell.y,
  tileId: cell.tileId,
  rotation: cell.rotation,
  status: cell.status,
})

const cloneTerrain = (terrain: GeneratedTerrain): GeneratedTerrain => ({
  width: terrain.width,
  height: terrain.height,
  seed: terrain.seed,
  cells: terrain.cells.map((row) => row.map(cloneGeneratedCell)),
})

const getCellAt = (terrain: GeneratedTerrain, x: number, y: number) =>
  terrain.cells[y]?.[x] ?? null

const getNeighborPositions = (x: number, y: number): Array<{ side: TileSide; x: number; y: number }> => [
  { side: 'north', x, y: y - 1 },
  { side: 'east', x: x + 1, y },
  { side: 'south', x, y: y + 1 },
  { side: 'west', x: x - 1, y },
]

const buildRotatedViewsByTileId = (tiles: Tile[]) =>
  new Map<string, RotatedTileView[]>(tiles.map((tile) => [tile.id, getRotatedTileViews(tile)]))

const getPlacedNeighborConstraints = (
  terrain: GeneratedTerrain,
  x: number,
  y: number,
): NeighborConstraint[] =>
  getNeighborPositions(x, y)
    .map(({ side, x: neighborX, y: neighborY }) => ({
      side,
      neighbor: getCellAt(terrain, neighborX, neighborY),
    }))
    .filter(
      (entry): entry is NeighborConstraint =>
        Boolean(entry.neighbor && entry.neighbor.status === 'placed' && entry.neighbor.tileId),
    )

const getPlacedNeighborView = (
  rotatedViewsByTileId: Map<string, RotatedTileView[]>,
  cell: GeneratedCell,
): RotatedTileView | null => {
  if (cell.status !== 'placed' || !cell.tileId) {
    return null
  }

  const views = rotatedViewsByTileId.get(cell.tileId) ?? []
  return views.find((view) => view.rotation === cell.rotation) ?? null
}

export const createEmptyGeneratedCell = (
  x: number,
  y: number,
  status: GeneratedCell['status'] = 'empty',
): GeneratedCell => ({
  x,
  y,
  tileId: null,
  rotation: 0,
  status,
})

export const createEmptyTerrain = ({
  width,
  height,
  seed,
}: TerrainGenerationSettings): GeneratedTerrain => ({
  width: normalizeDimension(width),
  height: normalizeDimension(height),
  seed,
  cells: Array.from({ length: normalizeDimension(height) }, (_, y) =>
    Array.from({ length: normalizeDimension(width) }, (_, x) => createEmptyGeneratedCell(x, y)),
  ),
})

const getAllRotatedCandidates = (
  tiles: Tile[],
  rotatedViewsByTileId: Map<string, RotatedTileView[]>,
): TerrainCandidate[] =>
  tiles.flatMap((tile) =>
    (rotatedViewsByTileId.get(tile.id) ?? []).map((view) => ({
      tileId: tile.id,
      rotation: view.rotation,
      view,
      })),
  )

const createEmptyCandidateLookup = (): CandidateIndex['bySideAndBorder'] => ({
  north: new Map<string, TerrainCandidate[]>(),
  east: new Map<string, TerrainCandidate[]>(),
  south: new Map<string, TerrainCandidate[]>(),
  west: new Map<string, TerrainCandidate[]>(),
})

const addCandidateToLookup = (
  lookup: CandidateIndex['bySideAndBorder'],
  candidate: TerrainCandidate,
  side: TileSide,
) => {
  const borderKey = serializeBorder(candidate.view.borders[side])
  const bucket = lookup[side].get(borderKey)

  if (bucket) {
    bucket.push(candidate)
    return
  }

  lookup[side].set(borderKey, [candidate])
}

const buildCandidateIndex = (
  tiles: Tile[],
  rotatedViewsByTileId: Map<string, RotatedTileView[]>,
): CandidateIndex => {
  const weightByTileId = new Map(
    tiles.map((tile) => [tile.id, normalizeTileWeight(tile.weight)]),
  )
  const allCandidates = getAllRotatedCandidates(tiles, rotatedViewsByTileId).filter(
    (candidate) => (weightByTileId.get(candidate.tileId) ?? 0) > 0,
  )
  const bySideAndBorder = createEmptyCandidateLookup()

  allCandidates.forEach((candidate) => {
    addCandidateToLookup(bySideAndBorder, candidate, 'north')
    addCandidateToLookup(bySideAndBorder, candidate, 'east')
    addCandidateToLookup(bySideAndBorder, candidate, 'south')
    addCandidateToLookup(bySideAndBorder, candidate, 'west')
  })

  return {
    allCandidates,
    bySideAndBorder,
    weightByTileId,
  }
}

export const getGenerationCandidatesForPosition = (
  tiles: Tile[],
  terrain: GeneratedTerrain,
  x: number,
  y: number,
): TerrainCandidate[] => {
  const rotatedViewsByTileId = buildRotatedViewsByTileId(tiles)
  const candidateIndex = buildCandidateIndex(tiles, rotatedViewsByTileId)
  return getGenerationCandidatesForPositionWithCache(terrain, x, y, rotatedViewsByTileId, candidateIndex)
}

const getGenerationCandidatesForPositionWithCache = (
  terrain: GeneratedTerrain,
  x: number,
  y: number,
  rotatedViewsByTileId: Map<string, RotatedTileView[]>,
  candidateIndex: CandidateIndex,
): TerrainCandidate[] => {
  const cell = getCellAt(terrain, x, y)
  if (!cell || cell.status === 'placed') {
    return []
  }

  const constraints = getPlacedNeighborConstraints(terrain, x, y)

  // No placed neighbors yet: everything is allowed.
  if (constraints.length === 0) {
    return candidateIndex.allCandidates
  }

  const candidateBuckets = constraints
    .map((constraint) => {
      const neighborView = getPlacedNeighborView(rotatedViewsByTileId, constraint.neighbor)
      if (!neighborView) {
        return []
      }

      const neighborSide = getOppositeSide(constraint.side)
      const borderKey = serializeBorder(neighborView.borders[neighborSide])
      return candidateIndex.bySideAndBorder[constraint.side].get(borderKey) ?? []
    })
    .sort((left, right) => left.length - right.length)

  const [smallestBucket, ...remainingBuckets] = candidateBuckets
  if (!smallestBucket || smallestBucket.length === 0) {
    return []
  }

  return remainingBuckets.reduce<TerrainCandidate[]>((candidates, bucket) => {
    if (candidates.length === 0 || bucket.length === 0) {
      return []
    }

    const allowed = new Set(bucket)
    return candidates.filter((candidate) => allowed.has(candidate))
  }, smallestBucket)
}

type NextCellChoice = {
  x: number
  y: number
  candidates: TerrainCandidate[]
}

const findMostConstrainedEmptyCell = (
  terrain: GeneratedTerrain,
  rotatedViewsByTileId: Map<string, RotatedTileView[]>,
  candidateIndex: CandidateIndex,
): NextCellChoice | null => {
  let bestChoice: NextCellChoice | null = null

  for (let y = 0; y < terrain.height; y += 1) {
    for (let x = 0; x < terrain.width; x += 1) {
      const cell = terrain.cells[y][x]
      if (cell.status === 'placed') {
        continue
      }

      const candidates = getGenerationCandidatesForPositionWithCache(
        terrain,
        x,
        y,
        rotatedViewsByTileId,
        candidateIndex,
      )

      // Immediate contradiction: this is the best possible choice because it fails now.
      if (candidates.length === 0) {
        return { x, y, candidates }
      }

      if (!bestChoice || candidates.length < bestChoice.candidates.length) {
        bestChoice = { x, y, candidates }

        // MRV early exit: can't do better than 1.
        if (candidates.length === 1) {
          return bestChoice
        }
      }
    }
  }

  return bestChoice
}

const markRemainingEmptyCellsAsInvalid = (terrain: GeneratedTerrain) => {
  for (let y = 0; y < terrain.height; y += 1) {
    for (let x = 0; x < terrain.width; x += 1) {
      const cell = terrain.cells[y][x]
      if (cell.status !== 'placed') {
        terrain.cells[y][x] = createEmptyGeneratedCell(x, y, 'invalid')
      }
    }
  }
}

const solveTerrain = (
  terrain: GeneratedTerrain,
  rotatedViewsByTileId: Map<string, RotatedTileView[]>,
  candidateIndex: CandidateIndex,
  random: () => number,
  placedCount: number,
  bestSnapshotRef: { terrain: GeneratedTerrain; placedCount: number },
): boolean => {
  if (placedCount > bestSnapshotRef.placedCount) {
    bestSnapshotRef.placedCount = placedCount
    bestSnapshotRef.terrain = cloneTerrain(terrain)
  }

  const nextChoice = findMostConstrainedEmptyCell(terrain, rotatedViewsByTileId, candidateIndex)

  // No empty cells left => solved.
  if (!nextChoice) {
    return true
  }

  // Contradiction.
  if (nextChoice.candidates.length === 0) {
    return false
  }

  const candidates = createWeightedCandidateOrder(
    nextChoice.candidates,
    candidateIndex.weightByTileId,
    random,
  )

  for (const candidate of candidates) {
    terrain.cells[nextChoice.y][nextChoice.x] = {
      x: nextChoice.x,
      y: nextChoice.y,
      tileId: candidate.tileId,
      rotation: candidate.rotation,
      status: 'placed',
    }

    const solved = solveTerrain(
      terrain,
      rotatedViewsByTileId,
      candidateIndex,
      random,
      placedCount + 1,
      bestSnapshotRef,
    )
    if (solved) {
      return true
    }

    terrain.cells[nextChoice.y][nextChoice.x] = createEmptyGeneratedCell(
      nextChoice.x,
      nextChoice.y,
      'empty',
    )
  }

  return false
}

export const generateTerrain = (
  tiles: Tile[],
  settings: TerrainGenerationSettings,
): GeneratedTerrain => {
  const terrain = createEmptyTerrain(settings)

  if (tiles.length === 0) {
    return terrain
  }

  const random = createSeededRandom(settings.seed ?? DEFAULT_SEED)
  const rotatedViewsByTileId = buildRotatedViewsByTileId(tiles)
  const candidateIndex = buildCandidateIndex(tiles, rotatedViewsByTileId)

  const bestSnapshotRef = {
    terrain: cloneTerrain(terrain),
    placedCount: 0,
  }

  const solved = solveTerrain(terrain, rotatedViewsByTileId, candidateIndex, random, 0, bestSnapshotRef)

  if (solved) {
    return terrain
  }

  const fallbackTerrain = cloneTerrain(bestSnapshotRef.terrain)
  markRemainingEmptyCellsAsInvalid(fallbackTerrain)
  return fallbackTerrain
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
  side: 'north' | 'west' | 'east' | 'south',
) => {
  const neighborSide = getOppositeSide(side)
  return (
    serializeBorder(candidate.view.borders[side]) ===
    serializeBorder(neighbor.view.borders[neighborSide])
  )
}
