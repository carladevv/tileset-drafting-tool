import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { createDefaultProject, createEmptyGrid, storageKey, useProjectStore, validateProject } from './store/projectStore'
import type { Project, Tile } from './types/projectTypes'
import {
  arraysEqual,
  computeCompatibilityGraph,
  dedupeCompatibilityMatches,
  deriveTileBorders,
  getRotatedTileViews,
  isOppositeSide,
  rotateGrid,
  rotateGrid180,
  rotateGrid270,
  rotateGrid90,
} from './utils/compatibility'
import { generateTerrain, getGeneratedCellView, getGenerationCandidatesForPosition } from './utils/terrainGeneration'

const createTile = (id: string, name: string, grid: Tile['grid']): Tile => ({
  id,
  name,
  allowRotations: true,
  grid,
})

const riverColumnGrid = (): Tile['grid'] => [
  ['grass', 'grass', 'river', 'river', 'grass', 'grass'],
  ['grass', 'grass', 'river', 'river', 'grass', 'grass'],
  ['grass', 'grass', 'river', 'river', 'grass', 'grass'],
  ['grass', 'grass', 'river', 'river', 'grass', 'grass'],
  ['grass', 'grass', 'river', 'river', 'grass', 'grass'],
  ['grass', 'grass', 'river', 'river', 'grass', 'grass'],
]

const eastWestRiverGrid = (): Tile['grid'] => [
  ['river', 'grass', 'grass', 'grass', 'grass', 'river'],
  ['river', 'grass', 'grass', 'grass', 'grass', 'river'],
  ['river', 'grass', 'grass', 'grass', 'grass', 'river'],
  ['river', 'grass', 'grass', 'grass', 'grass', 'river'],
  ['river', 'grass', 'grass', 'grass', 'grass', 'river'],
  ['river', 'grass', 'grass', 'grass', 'grass', 'river'],
]

const lonelyGrid = (): Tile['grid'] => [
  ['north', 'north', 'north', 'north', 'north', 'east'],
  ['west', 'center', 'center', 'center', 'center', 'east'],
  ['west', 'center', 'center', 'center', 'center', 'east'],
  ['west', 'center', 'center', 'center', 'center', 'east'],
  ['west', 'center', 'center', 'center', 'center', 'east'],
  ['south', 'south', 'south', 'south', 'south', 'east'],
]

const distinctGrid = (): Tile['grid'] => [
  ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
  ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'],
  ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
  ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'],
  ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'],
  ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
]

const rotationSourceGrid = (): Tile['grid'] => [
  ['fill', 'fill', 'fill', 'fill', 'fill', 'a'],
  ['fill', 'fill', 'fill', 'fill', 'fill', 'b'],
  ['fill', 'fill', 'fill', 'fill', 'fill', 'c'],
  ['fill', 'fill', 'fill', 'fill', 'fill', 'd'],
  ['fill', 'fill', 'fill', 'fill', 'fill', 'e'],
  ['fill', 'fill', 'fill', 'fill', 'fill', 'f'],
]

const rotationTargetGrid = (): Tile['grid'] => [
  ['x', 'fill', 'fill', 'fill', 'fill', 'fill'],
  ['x', 'fill', 'fill', 'fill', 'fill', 'fill'],
  ['x', 'fill', 'fill', 'fill', 'fill', 'fill'],
  ['x', 'fill', 'fill', 'fill', 'fill', 'fill'],
  ['x', 'fill', 'fill', 'fill', 'fill', 'fill'],
  ['a', 'b', 'c', 'd', 'e', 'f'],
]

const uniformGrid = (label: string): Tile['grid'] => Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => label))

const westEdgeGrid = (label: string, fill = 'fill'): Tile['grid'] =>
  Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, column) => {
      if (column === 0) {
        return label
      }

      if (column === 5) {
        return `${fill}_${row}`
      }

      return fill
    }),
  )

const eastEdgeGrid = (label: string, fill = 'fill'): Tile['grid'] =>
  Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, column) => {
      if (column === 5) {
        return label
      }

      if (column === 0) {
        return `${fill}_${row}`
      }

      return fill
    }),
  )

describe('Stage 2 compatibility helpers', () => {
  it('derives north, south, west, and east borders from a 6x6 grid', () => {
    const borders = deriveTileBorders(riverColumnGrid())

    expect(borders.north).toEqual(['grass', 'grass', 'river', 'river', 'grass', 'grass'])
    expect(borders.south).toEqual(['grass', 'grass', 'river', 'river', 'grass', 'grass'])
    expect(borders.west).toEqual(['grass', 'grass', 'grass', 'grass', 'grass', 'grass'])
    expect(borders.east).toEqual(['grass', 'grass', 'grass', 'grass', 'grass', 'grass'])
  })

  it('matches identical opposite borders and rejects other combinations', () => {
    expect(arraysEqual(['grass', 'river'], ['grass', 'river'])).toBe(true)
    expect(arraysEqual(['grass', 'river'], ['grass', 'grass'])).toBe(false)
    expect(isOppositeSide('east', 'west')).toBe(true)
    expect(isOppositeSide('east', 'east')).toBe(false)
    expect(isOppositeSide('north', 'west')).toBe(false)
  })

  it('builds a compatibility graph with all valid matches', () => {
    const tiles = [
      createTile('tile_a', 'river_a', eastWestRiverGrid()),
      createTile('tile_b', 'river_b', eastWestRiverGrid()),
      createTile('tile_c', 'river_column', riverColumnGrid()),
    ]

    const graph = computeCompatibilityGraph(tiles)

    expect(graph.byTileId.tile_a.east).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetTileId: 'tile_a', targetSide: 'west' }),
        expect.objectContaining({ targetTileId: 'tile_b', targetSide: 'west' }),
      ]),
    )
    expect(graph.byTileId.tile_a.east).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ targetTileId: 'tile_c', targetSide: 'east' })]),
    )
  })
})

describe('Stage 3 rotation helpers', () => {
  it('rotates a 6x6 grid 90 degrees clockwise', () => {
    expect(rotateGrid90(distinctGrid())).toEqual([
      ['f1', 'e1', 'd1', 'c1', 'b1', 'a1'],
      ['f2', 'e2', 'd2', 'c2', 'b2', 'a2'],
      ['f3', 'e3', 'd3', 'c3', 'b3', 'a3'],
      ['f4', 'e4', 'd4', 'c4', 'b4', 'a4'],
      ['f5', 'e5', 'd5', 'c5', 'b5', 'a5'],
      ['f6', 'e6', 'd6', 'c6', 'b6', 'a6'],
    ])
  })

  it('rotates a grid 180 degrees as two 90 degree turns', () => {
    expect(rotateGrid180(distinctGrid())).toEqual(rotateGrid90(rotateGrid90(distinctGrid())))
  })

  it('rotates a grid 270 degrees as three 90 degree turns', () => {
    expect(rotateGrid270(distinctGrid())).toEqual(rotateGrid90(rotateGrid90(rotateGrid90(distinctGrid()))))
  })

  it('preserves grid size for every rotation', () => {
    ;([0, 90, 180, 270] as const).forEach((rotation) => {
      const rotated = rotateGrid(distinctGrid(), rotation)
      expect(rotated).toHaveLength(6)
      expect(rotated.every((row) => row.length === 6)).toBe(true)
    })
  })

  it('derives rotated borders from the rotated grid', () => {
    const tile = createTile('tile_rotated', 'rotated', distinctGrid())
    const rotated90 = getRotatedTileViews(tile).find((view) => view.rotation === 90)

    expect(rotated90?.borders).toEqual({
      north: ['f1', 'e1', 'd1', 'c1', 'b1', 'a1'],
      east: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
      south: ['f6', 'e6', 'd6', 'c6', 'b6', 'a6'],
      west: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
    })
  })

  it('returns only the base rotation when allowRotations is false', () => {
    const tile = { ...createTile('tile_static', 'static', distinctGrid()), allowRotations: false }

    expect(getRotatedTileViews(tile).map((view) => view.rotation)).toEqual([0])
  })

  it('returns all four logical rotations when allowRotations is true', () => {
    const tile = createTile('tile_spin', 'spin', distinctGrid())

    expect(getRotatedTileViews(tile).map((view) => view.rotation)).toEqual([0, 90, 180, 270])
  })

  it('creates compatibility against rotated target variants', () => {
    const tiles = [
      createTile('tile_source', 'source', rotationSourceGrid()),
      createTile('tile_target', 'target', rotationTargetGrid()),
    ]

    const graph = computeCompatibilityGraph(tiles)

    expect(graph.byTileId.tile_source.east).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetTileId: 'tile_target', targetSide: 'west', targetRotation: 90 }),
      ]),
    )
  })

  it('removes rotation-only compatibility when target rotations are disabled', () => {
    const tiles = [
      createTile('tile_source', 'source', rotationSourceGrid()),
      { ...createTile('tile_target', 'target', rotationTargetGrid()), allowRotations: false },
    ]

    const graph = computeCompatibilityGraph(tiles)

    expect(graph.byTileId.tile_source.east).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ targetTileId: 'tile_target', targetRotation: 90 })]),
    )
  })

  it('deduplicates accidental duplicate compatibility entries', () => {
    const duplicates = dedupeCompatibilityMatches([
      { sourceTileId: 'a', sourceSide: 'east', targetTileId: 'b', targetSide: 'west', targetRotation: 90 },
      { sourceTileId: 'a', sourceSide: 'east', targetTileId: 'b', targetSide: 'west', targetRotation: 90 },
      { sourceTileId: 'a', sourceSide: 'east', targetTileId: 'b', targetSide: 'west', targetRotation: 270 },
    ])

    expect(duplicates).toEqual([
      { sourceTileId: 'a', sourceSide: 'east', targetTileId: 'b', targetSide: 'west', targetRotation: 90 },
      { sourceTileId: 'a', sourceSide: 'east', targetTileId: 'b', targetSide: 'west', targetRotation: 270 },
    ])
  })
})

describe('Stage 4 terrain generation helpers', () => {
  it('creates a generated terrain with the requested dimensions and cell structure', () => {
    const terrain = generateTerrain([createTile('tile_grass', 'grass', uniformGrid('grass'))], {
      width: 20,
      height: 15,
      seed: 1234,
    })

    expect(terrain.width).toBe(20)
    expect(terrain.height).toBe(15)
    expect(terrain.cells).toHaveLength(15)
    expect(terrain.cells.every((row) => row.length === 20)).toBe(true)
    expect(terrain.cells[0][0]).toEqual(
      expect.objectContaining({
        tileId: expect.any(String),
        rotation: expect.any(Number),
        status: expect.stringMatching(/placed|empty|invalid/),
      }),
    )
  })

  it('filters candidates to only compatibility-valid tile rotations', () => {
    const sourceCell = { x: 0, y: 0, tileId: 'tile_source', rotation: 0 as const, status: 'placed' as const }
    const tiles = [
      createTile('tile_source', 'source', rotationSourceGrid()),
      createTile('tile_target', 'target', rotationTargetGrid()),
    ]
    const terrain = {
      width: 2,
      height: 1,
      seed: 0,
      cells: [[sourceCell, { x: 1, y: 0, tileId: null, rotation: 0 as const, status: 'empty' as const }]],
    }

    const candidates = getGenerationCandidatesForPosition(tiles, terrain, 1, 0)

    expect(candidates).toEqual([
      expect.objectContaining({
        tileId: 'tile_target',
        rotation: 90,
      }),
    ])
  })

  it('records rotation on placed cells when a rotated match is required', () => {
    const tiles = [
      createTile('tile_source', 'source', rotationSourceGrid()),
      createTile('tile_target', 'target', rotationTargetGrid()),
    ]
    const terrain = generateTerrain(
      tiles,
      { width: 2, height: 1, seed: 0 },
    )

    const placedViews = terrain.cells[0]
      .map((cell) => getGeneratedCellView(tiles, cell))
      .filter((cellView) => cellView !== null)

    expect(placedViews).toHaveLength(2)
    expect(placedViews.some((cellView) => cellView.view.rotation === 90)).toBe(true)
    expect(placedViews[0].view.borders.east).toEqual(placedViews[1].view.borders.west)
  })

  it('never places incompatible neighbors', () => {
    const terrain = generateTerrain(
      [
        createTile('tile_a', 'A', uniformGrid('grass')),
        createTile('tile_b', 'B', eastEdgeGrid('river', 'grass')),
        createTile('tile_c', 'C', westEdgeGrid('river', 'grass')),
      ],
      { width: 8, height: 6, seed: 42 },
    )

    terrain.cells.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cellView = getGeneratedCellView(
          [
            createTile('tile_a', 'A', uniformGrid('grass')),
            createTile('tile_b', 'B', eastEdgeGrid('river', 'grass')),
            createTile('tile_c', 'C', westEdgeGrid('river', 'grass')),
          ],
          cell,
        )
        if (!cellView) {
          return
        }

        const eastNeighborView = getGeneratedCellView(
          [
            createTile('tile_a', 'A', uniformGrid('grass')),
            createTile('tile_b', 'B', eastEdgeGrid('river', 'grass')),
            createTile('tile_c', 'C', westEdgeGrid('river', 'grass')),
          ],
          terrain.cells[y][x + 1] ?? null,
        )
        const southNeighborView = getGeneratedCellView(
          [
            createTile('tile_a', 'A', uniformGrid('grass')),
            createTile('tile_b', 'B', eastEdgeGrid('river', 'grass')),
            createTile('tile_c', 'C', westEdgeGrid('river', 'grass')),
          ],
          terrain.cells[y + 1]?.[x] ?? null,
        )

        if (eastNeighborView) {
          expect(cellView.view.borders.east).toEqual(eastNeighborView.view.borders.west)
        }

        if (southNeighborView) {
          expect(cellView.view.borders.south).toEqual(southNeighborView.view.borders.north)
        }
      })
    })
  })

  it('returns a partial preview when the layout cannot be fully satisfied', () => {
    const terrain = generateTerrain(
      [
        createTile('tile_only', 'only', eastEdgeGrid('river', 'grass')),
        { ...createTile('tile_static', 'static', eastEdgeGrid('river', 'grass')), allowRotations: false },
      ],
      { width: 3, height: 1, seed: 0 },
    )

    expect(terrain.cells[0].some((cell) => cell.status === 'placed')).toBe(true)
    expect(terrain.cells[0].some((cell) => cell.status !== 'placed')).toBe(true)
  })

  it('is deterministic for the same seed and changes when the seed changes', () => {
    const tiles = [
      createTile('tile_a', 'A', uniformGrid('grass')),
      createTile('tile_b', 'B', eastWestRiverGrid()),
      createTile('tile_c', 'C', riverColumnGrid()),
    ]

    const first = generateTerrain(tiles, { width: 10, height: 10, seed: 99 })
    const second = generateTerrain(tiles, { width: 10, height: 10, seed: 99 })
    const third = generateTerrain(tiles, { width: 10, height: 10, seed: 100 })

    expect(second).toEqual(first)
    expect(third).not.toEqual(first)
  })

  it('returns rotated semantic grids for placed generated cells', () => {
    const tiles = [
      createTile('tile_source', 'source', rotationSourceGrid()),
      createTile('tile_target', 'target', rotationTargetGrid()),
    ]
    const terrain = generateTerrain(
      tiles,
      { width: 2, height: 1, seed: 0 },
    )
    const rotatedCell = terrain.cells[0].find((cell) => cell.status === 'placed' && cell.rotation === 90) ?? null

    const rotatedCellView = getGeneratedCellView(tiles, rotatedCell)
    const rotatedTile = tiles.find((tile) => tile.id === rotatedCell?.tileId)

    expect(rotatedCellView?.view.rotation).toBe(90)
    expect(rotatedCellView?.view.rotatedGrid).toEqual(rotateGrid(rotatedTile?.grid ?? createEmptyGrid(), 90))
  })

  it('generates a 30x30 preview quickly enough for MVP use', () => {
    const startedAt = Date.now()

    generateTerrain(
      [
        createTile('tile_a', 'A', uniformGrid('grass')),
        createTile('tile_b', 'B', eastWestRiverGrid()),
        createTile('tile_c', 'C', riverColumnGrid()),
      ],
      { width: 30, height: 30, seed: 7 },
    )

    expect(Date.now() - startedAt).toBeLessThan(1000)
  })
})

describe('Stage 1 store behavior', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('creates the default project with empty tiles and palette', () => {
    const state = useProjectStore.getState()

    expect(state.project).toMatchObject({
      id: 'project_default',
      name: 'Untitled Tileset',
      gridSize: 6,
    })
    expect(state.project.tiles).toEqual([])
    expect(state.project.cellLabels).toEqual([])
  })

  it('creates and edits a cell label while keeping the id stable', () => {
    const labelId = useProjectStore.getState().createCellLabel()
    useProjectStore.getState().updateCellLabel(labelId, { name: 'Grass', color: '#5fbf5f' })
    useProjectStore.getState().updateCellLabel(labelId, { name: 'Meadow' })

    const label = useProjectStore.getState().project.cellLabels[0]
    expect(label.id).toBe(labelId)
    expect(label.name).toBe('Meadow')
    expect(label.color).toBe('#5fbf5f')
  })

  it('creates a tile with a 6x6 grid', () => {
    const tileId = useProjectStore.getState().createTile()
    const tile = useProjectStore.getState().project.tiles.find((entry) => entry.id === tileId)

    expect(tile).toBeDefined()
    expect(tile?.grid).toHaveLength(6)
    expect(tile?.grid.every((row) => row.length === 6)).toBe(true)
  })

  it('duplicates a tile with a new id and copied cell data', () => {
    const labelId = useProjectStore.getState().createCellLabel()
    const tileId = useProjectStore.getState().createTile()
    useProjectStore.getState().paintCell(tileId, 2, 3, labelId)

    const duplicateId = useProjectStore.getState().duplicateTile(tileId)
    const [source, duplicate] = useProjectStore.getState().project.tiles

    expect(duplicateId).not.toBeNull()
    expect(duplicate.id).not.toBe(source.id)
    expect(duplicate.grid).toEqual(source.grid)
  })

  it('deletes a tile from the project', () => {
    const tileId = useProjectStore.getState().createTile()
    useProjectStore.getState().deleteTile(tileId)

    expect(useProjectStore.getState().project.tiles).toEqual([])
  })

  it('paints a cell and drag paints across multiple cells', () => {
    const labelId = useProjectStore.getState().createCellLabel()
    const tileId = useProjectStore.getState().createTile()

    useProjectStore.getState().paintCell(tileId, 2, 3, labelId)
    useProjectStore.getState().paintCells(
      tileId,
      [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 2 },
      ],
      labelId,
    )

    const tile = useProjectStore.getState().project.tiles[0]
    expect(tile.grid[2][3]).toBe(labelId)
    expect(tile.grid[0][0]).toBe(labelId)
    expect(tile.grid[0][1]).toBe(labelId)
    expect(tile.grid[0][2]).toBe(labelId)
  })

  it('persists project state to localStorage', () => {
    const labelId = useProjectStore.getState().createCellLabel()
    useProjectStore.getState().updateCellLabel(labelId, { name: 'Grass', color: '#5fbf5f' })
    const tileId = useProjectStore.getState().createTile()
    useProjectStore.getState().paintCell(tileId, 1, 1, labelId)

    const storedRaw = localStorage.getItem(storageKey)
    expect(storedRaw).not.toBeNull()

    const stored = JSON.parse(storedRaw ?? '{}') as { state?: { project?: Project } }
    expect(stored.state?.project?.cellLabels[0].name).toBe('Grass')
    expect(stored.state?.project?.tiles[0].grid[1][1]).toBe(labelId)
  })

  it('flags invalid grid dimensions and undefined labels', () => {
    const project = createDefaultProject()
    project.tiles.push({
      id: 'tile_invalid',
      name: 'broken',
      allowRotations: true,
      grid: createEmptyGrid().slice(0, 5),
    })
    project.tiles.push({
      id: 'tile_unknown_label',
      name: 'unknown',
      allowRotations: true,
      grid: createEmptyGrid('missing_label'),
    })

    const issues = validateProject(project)
    expect(issues.some((issue) => issue.message.includes('exactly 6x6'))).toBe(true)
    expect(issues.some((issue) => issue.message.includes('undefined cell label'))).toBe(true)
  })

  it('adds warnings for tile sides with zero compatible matches', () => {
    const project = createDefaultProject()
    project.cellLabels.push(
      { id: 'north', name: 'North', color: '#5fbf5f' },
      { id: 'east', name: 'East', color: '#4aa3ff' },
      { id: 'south', name: 'South', color: '#d97b2d' },
      { id: 'west', name: 'West', color: '#7dce82' },
      { id: 'center', name: 'Center', color: '#94aeb5' },
    )
    project.tiles.push(createTile('tile_lonely', 'lonely', lonelyGrid()))
    project.tiles[0].allowRotations = false

    const issues = validateProject(project)

    expect(issues.filter((issue) => issue.message.startsWith('No compatible tiles on the'))).toHaveLength(4)
  })

  it('recomputes compatibility after a grid edit', () => {
    const state = useProjectStore.getState()
    const grassId = state.createCellLabel()
    state.updateCellLabel(grassId, { name: 'Grass', color: '#5fbf5f' })
    const riverId = state.createCellLabel()
    state.updateCellLabel(riverId, { name: 'River', color: '#4aa3ff' })

    const tileA = state.createTile()
    const tileB = useProjectStore.getState().createTile()

    const eastCells = [
      { row: 0, column: 5 },
      { row: 1, column: 5 },
      { row: 2, column: 5 },
      { row: 3, column: 5 },
      { row: 4, column: 5 },
      { row: 5, column: 5 },
    ]
    const westCells = [
      { row: 0, column: 0 },
      { row: 1, column: 0 },
      { row: 2, column: 0 },
      { row: 3, column: 0 },
      { row: 4, column: 0 },
      { row: 5, column: 0 },
    ]

    useProjectStore.getState().paintCells(tileA, eastCells, riverId)
    useProjectStore.getState().paintCells(tileB, westCells, riverId)

    expect(useProjectStore.getState().getCompatibilityForTile(tileA).east).toEqual(
      expect.arrayContaining([expect.objectContaining({ targetTileId: tileB, targetSide: 'west' })]),
    )

    useProjectStore.getState().paintCell(tileB, 0, 0, grassId)

    expect(useProjectStore.getState().getCompatibilityForTile(tileA).east).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ targetTileId: tileB, targetSide: 'west' })]),
    )
  })

  it('does not persist compatibility graph or border arrays', () => {
    const labelId = useProjectStore.getState().createCellLabel()
    const tileId = useProjectStore.getState().createTile()
    useProjectStore.getState().paintCell(tileId, 0, 0, labelId)
    useProjectStore.getState().setTileRotationEnabled(tileId, false)

    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as { state?: { project?: Project } }
    const persistedTile = stored.state?.project?.tiles[0] as Record<string, unknown> | undefined

    expect(persistedTile).toBeDefined()
    expect(persistedTile?.allowRotations).toBe(false)
    expect(persistedTile).not.toHaveProperty('borders')
    expect(persistedTile).not.toHaveProperty('rotatedGrid')
    expect(persistedTile).not.toHaveProperty('rotatedViews')
    expect(stored.state?.project).not.toHaveProperty('compatibilityGraph')
  })

  it('recomputes compatibility deterministically from persisted project data', () => {
    const state = useProjectStore.getState()
    const grassId = state.createCellLabel()
    state.updateCellLabel(grassId, { name: 'Grass', color: '#5fbf5f' })
    const tileId = state.createTile()
    useProjectStore.getState().paintCells(
      tileId,
      [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 2 },
        { row: 0, column: 3 },
        { row: 0, column: 4 },
        { row: 0, column: 5 },
      ],
      grassId,
    )

    const beforeReload = useProjectStore.getState().getCompatibilityGraph()
    const beforeValidation = useProjectStore
      .getState()
      .getValidationIssues()
      .map((issue) => `${issue.severity}:${issue.message}`)

    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as { state?: { project?: Project } }
    useProjectStore.getState().replaceProject(stored.state?.project ?? createDefaultProject())

    const afterReload = useProjectStore.getState().getCompatibilityGraph()
    const afterValidation = useProjectStore
      .getState()
      .getValidationIssues()
      .map((issue) => `${issue.severity}:${issue.message}`)

    expect(afterReload).toEqual(beforeReload)
    expect(afterValidation).toEqual(beforeValidation)
  })

  it('updates validation warnings when rotation settings change', () => {
    const project = createDefaultProject()
    project.cellLabels.push(
      { id: 'fill', name: 'Fill', color: '#5fbf5f' },
      { id: 'a', name: 'A', color: '#ff0000' },
      { id: 'b', name: 'B', color: '#ff8800' },
      { id: 'c', name: 'C', color: '#ffee00' },
      { id: 'd', name: 'D', color: '#00aa44' },
      { id: 'e', name: 'E', color: '#3399ff' },
      { id: 'f', name: 'F', color: '#8844ff' },
      { id: 'x', name: 'X', color: '#333333' },
    )
    project.tiles.push(
      createTile('tile_source', 'source', rotationSourceGrid()),
      { ...createTile('tile_target', 'target', rotationTargetGrid()), allowRotations: false },
    )

    const withoutRotations = validateProject(project)
    project.tiles[1].allowRotations = true
    const withRotations = validateProject(project)
    project.tiles[1].allowRotations = false
    const disabledAgain = validateProject(project)

    expect(withoutRotations.some((issue) => issue.tileId === 'tile_source' && issue.message.includes('east side'))).toBe(true)
    expect(withRotations.some((issue) => issue.tileId === 'tile_source' && issue.message.includes('east side'))).toBe(false)
    expect(disabledAgain.some((issue) => issue.tileId === 'tile_source' && issue.message.includes('east side'))).toBe(true)
  })

  it('recomputes rotation-aware compatibility after reload', () => {
    const state = useProjectStore.getState()
    ;[
      ['fill', 'Fill', '#5fbf5f'],
      ['a', 'A', '#ff0000'],
      ['b', 'B', '#ff8800'],
      ['c', 'C', '#ffee00'],
      ['d', 'D', '#00aa44'],
      ['e', 'E', '#3399ff'],
      ['f', 'F', '#8844ff'],
      ['x', 'X', '#333333'],
    ].forEach(([id, name, color]) => {
      state.project.cellLabels.push({ id, name, color })
    })

    state.replaceProject({
      ...state.project,
      cellLabels: state.project.cellLabels,
      tiles: [
        createTile('tile_source', 'source', rotationSourceGrid()),
        createTile('tile_target', 'target', rotationTargetGrid()),
      ],
    })

    const beforeReload = useProjectStore.getState().getCompatibilityGraph()
    const beforeValidation = useProjectStore.getState().getValidationIssues().map((issue) => issue.message)
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as { state?: { project?: Project } }

    useProjectStore.getState().replaceProject(stored.state?.project ?? createDefaultProject())

    expect(useProjectStore.getState().getCompatibilityGraph()).toEqual(beforeReload)
    expect(useProjectStore.getState().getValidationIssues().map((issue) => issue.message)).toEqual(beforeValidation)
  })
})

describe('Stage 1 editor UI', () => {
  beforeEach(() => {
    localStorage.clear()
    useProjectStore.getState().resetProject()
  })

  it('renders painted cells with the active palette color and supports drag painting', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('tab', { name: /labels/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ add label/i }))
    const nameInput = screen.getByLabelText(/name for label_/i)
    fireEvent.change(nameInput, { target: { value: 'Grass' } })
    const colorInput = screen.getByLabelText(/color for grass/i)
    fireEvent.change(colorInput, { target: { value: '#5fbf5f' } })

    fireEvent.click(screen.getByRole('tab', { name: /tiles/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ new tile/i }))

    const cell00 = screen.getByRole('gridcell', { name: 'Cell 0,0' })
    const cell01 = screen.getByRole('gridcell', { name: 'Cell 0,1' })
    const cell02 = screen.getByRole('gridcell', { name: 'Cell 0,2' })

    fireEvent.mouseDown(cell00, { buttons: 1 })
    fireEvent.mouseEnter(cell01, { buttons: 1 })
    fireEvent.mouseEnter(cell02, { buttons: 1 })
    fireEvent.mouseUp(window)

    expect(cell00).toHaveStyle({ backgroundColor: 'rgb(95, 191, 95)' })
    expect(cell01).toHaveStyle({ backgroundColor: 'rgb(95, 191, 95)' })
    expect(cell02).toHaveStyle({ backgroundColor: 'rgb(95, 191, 95)' })
  })

  it('lets the user switch the active label from the tile editor quick palette', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('tab', { name: /labels/i }))
    await user.click(screen.getByRole('button', { name: /\+ add label/i }))
    const firstLabelName = screen.getByLabelText(/name for label_/i)
    await user.clear(firstLabelName)
    await user.type(firstLabelName, 'Grass')
    fireEvent.change(screen.getByLabelText(/color for grass/i), { target: { value: '#5fbf5f' } })

    await user.click(screen.getByRole('button', { name: /\+ add label/i }))
    const labelInputs = screen.getAllByRole('textbox').filter((input) => input.getAttribute('aria-label')?.match(/name for/i))
    await user.clear(labelInputs[1])
    await user.type(labelInputs[1], 'River')
    fireEvent.change(screen.getByLabelText(/color for river/i), { target: { value: '#4aa3ff' } })

    await user.click(screen.getByRole('tab', { name: /tiles/i }))
    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))

    expect(screen.getByText(/active label: river/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /use grass/i }))

    expect(screen.getByText(/active label: grass/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use grass/i })).toHaveClass('is-selected')
  })

  it('allows renaming the selected tile from the inspector', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))

    const nameInput = screen.getByRole('textbox', { name: /tile name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Cliff Edge')

    expect(nameInput).toHaveValue('Cliff Edge')
    expect(screen.getAllByRole('heading', { name: 'Cliff Edge' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /^cliff edge$/i })).toBeInTheDocument()
  })

  it('switches between tile and label editors inside the shared library panel', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByRole('tab', { name: /tiles/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /\+ new tile/i })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /labels/i }))

    expect(screen.getByRole('tab', { name: /labels/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /\+ add label/i })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: /labels/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /\+ add label/i }))
    expect(screen.getByLabelText(/name for label_/i)).toBeInTheDocument()
  })

  it('switches the tile inspector between properties and compatibility tabs', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))

    expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: /properties/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/tile name/i)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /compatibility/i }))

    expect(screen.getByRole('tab', { name: /compatibility/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: /compatibility/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'north' })).toBeInTheDocument()
  })

  it('shows derived borders, matches, and warnings in the inspector and tile list', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('tab', { name: /labels/i }))
    await user.click(screen.getByRole('button', { name: /\+ add label/i }))
    const firstLabelName = screen.getByLabelText(/name for label_/i)
    await user.clear(firstLabelName)
    await user.type(firstLabelName, 'Grass')
    fireEvent.change(screen.getByLabelText(/color for grass/i), { target: { value: '#5fbf5f' } })

    await user.click(screen.getByRole('button', { name: /\+ add label/i }))
    const riverNameInputs = screen.getAllByRole('textbox').filter((input) => input.getAttribute('aria-label')?.match(/name for/i))
    await user.clear(riverNameInputs[1])
    await user.type(riverNameInputs[1], 'River')
    fireEvent.change(screen.getByLabelText(/color for river/i), { target: { value: '#4aa3ff' } })
    await user.click(screen.getByRole('button', { name: /^select river$/i }))

    await user.click(screen.getByRole('tab', { name: /tiles/i }))
    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))
    const tileNameInput = screen.getByRole('textbox', { name: /tile name/i })
    await user.clear(tileNameInput)
    await user.type(tileNameInput, 'River Source')

    const eastCells = [
      screen.getByRole('gridcell', { name: 'Cell 0,5' }),
      screen.getByRole('gridcell', { name: 'Cell 1,5' }),
      screen.getByRole('gridcell', { name: 'Cell 2,5' }),
      screen.getByRole('gridcell', { name: 'Cell 3,5' }),
      screen.getByRole('gridcell', { name: 'Cell 4,5' }),
      screen.getByRole('gridcell', { name: 'Cell 5,5' }),
    ]

    eastCells.forEach((cell) => fireEvent.mouseDown(cell, { buttons: 1 }))
    fireEvent.mouseUp(window)

    await user.click(screen.getByRole('tab', { name: /compatibility/i }))
    expect(screen.getByRole('tabpanel', { name: /compatibility/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'east' })).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('label_')

    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))
    await user.click(screen.getByRole('tab', { name: /properties/i }))
    const secondTileName = screen.getByRole('textbox', { name: /tile name/i })
    await user.clear(secondTileName)
    await user.type(secondTileName, 'River Bank')

    const westCells = [
      screen.getByRole('gridcell', { name: 'Cell 0,0' }),
      screen.getByRole('gridcell', { name: 'Cell 1,0' }),
      screen.getByRole('gridcell', { name: 'Cell 2,0' }),
      screen.getByRole('gridcell', { name: 'Cell 3,0' }),
      screen.getByRole('gridcell', { name: 'Cell 4,0' }),
      screen.getByRole('gridcell', { name: 'Cell 5,0' }),
    ]

    westCells.forEach((cell) => fireEvent.mouseDown(cell, { buttons: 1 }))
    fireEvent.mouseUp(window)

    await user.click(screen.getByRole('button', { name: /^river source$/i }))
    await user.click(screen.getByRole('tab', { name: /compatibility/i }))

    const compatibleTileButton = screen.getByRole('button', { name: /select compatible tile river bank on west/i })
    expect(compatibleTileButton).toBeInTheDocument()

    await user.click(compatibleTileButton)
    await user.click(screen.getByRole('tab', { name: /properties/i }))

    expect(screen.getByRole('textbox', { name: /tile name/i })).toHaveValue('River Bank')
  })

  it('lets the user toggle rotations and inspect rotated previews without editing rotated data directly', async () => {
    const user = userEvent.setup()

    render(<App />)

    const labelSpecs = [
      ['A', '#ff0000'],
      ['B', '#ff8800'],
      ['C', '#ffee00'],
      ['D', '#00aa44'],
      ['E', '#3399ff'],
      ['F', '#8844ff'],
    ] as const

    await user.click(screen.getByRole('tab', { name: /labels/i }))

    for (const [name, color] of labelSpecs) {
      await user.click(screen.getByRole('button', { name: /\+ add label/i }))
      const nameInputs = screen.getAllByRole('textbox').filter((input) => input.getAttribute('aria-label')?.match(/name for/i))
      const latestNameInput = nameInputs.at(-1)
      if (!latestNameInput) {
        throw new Error('Expected a label name input')
      }

      await user.clear(latestNameInput)
      await user.type(latestNameInput, name)
      fireEvent.change(screen.getByLabelText(new RegExp(`color for ${name}`, 'i')), { target: { value: color } })
    }

    const labelIdsByName = Object.fromEntries(
      useProjectStore
        .getState()
        .project.cellLabels.map((label) => [label.name, label.id]),
    ) as Record<string, string>

    await user.click(screen.getByRole('tab', { name: /tiles/i }))
    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))

    for (let column = 0; column < labelSpecs.length; column += 1) {
      await user.click(screen.getByRole('tab', { name: /labels/i }))
      await user.click(screen.getByRole('button', { name: new RegExp(`^select ${labelSpecs[column][0]}$`, 'i') }))
      await user.click(screen.getByRole('tab', { name: /tiles/i }))
      fireEvent.mouseDown(screen.getByRole('gridcell', { name: `Cell 5,${column}` }), { buttons: 1 })
      fireEvent.mouseUp(window)
    }

    const rotationToggle = screen.getByRole('checkbox', { name: /allow rotations/i })
    expect(rotationToggle).toBeChecked()
    expect(screen.getByLabelText(/rotation previews/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rotated preview 90 degrees/i)).toBeInTheDocument()

    await user.click(rotationToggle)
    expect(rotationToggle).not.toBeChecked()
    expect(screen.getByRole('button', { name: /tile_1/i })).not.toHaveAccessibleName(/rotations/i)
    expect(screen.getByLabelText(/rotation previews/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rotated preview 0 degrees/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/rotated preview 90 degrees/i)).not.toBeInTheDocument()

    await user.click(rotationToggle)

    const preview = screen.getByLabelText(/rotated preview 90 degrees/i)
    const previewCells = Array.from(preview.querySelectorAll('.tile-preview__cell'))
    expect(previewCells[0]).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })
    expect(previewCells[30]).toHaveStyle({ backgroundColor: 'rgb(136, 68, 255)' })
    expect(useProjectStore.getState().project.tiles[0].grid[5][0]).toBe(labelIdsByName.A)

    await user.click(screen.getByRole('tab', { name: /labels/i }))
    await user.click(screen.getByRole('button', { name: /^select a$/i }))
    await user.click(screen.getByRole('tab', { name: /tiles/i }))
    fireEvent.mouseDown(screen.getByRole('gridcell', { name: 'Cell 0,0' }), { buttons: 1 })
    fireEvent.mouseUp(window)

    expect(useProjectStore.getState().project.tiles[0].grid[0][0]).toBe(labelIdsByName.A)
    expect(useProjectStore.getState().project.tiles[0].grid[5][0]).toBe(labelIdsByName.A)
  }, 10000)

  it('generates terrain from preview controls and shows generated tile inspection details', async () => {
    const user = userEvent.setup()

    const project = createDefaultProject()
    project.cellLabels = [
      { id: 'grass', name: 'Grass', color: '#5fbf5f' },
      { id: 'river', name: 'River', color: '#4aa3ff' },
      { id: 'fill', name: 'Fill', color: '#7d8f93' },
      { id: 'a', name: 'A', color: '#ff0000' },
      { id: 'b', name: 'B', color: '#ff8800' },
      { id: 'c', name: 'C', color: '#ffee00' },
      { id: 'd', name: 'D', color: '#00aa44' },
      { id: 'e', name: 'E', color: '#3399ff' },
      { id: 'f', name: 'F', color: '#8844ff' },
      { id: 'x', name: 'X', color: '#333333' },
    ]
    project.tiles = [
      createTile('tile_source', 'River Source', rotationSourceGrid()),
      createTile('tile_target', 'River Bank', rotationTargetGrid()),
    ]
    project.settings.generationWidth = 2
    project.settings.generationHeight = 1
    project.settings.generationSeed = 0

    useProjectStore.getState().replaceProject(project)

    render(<App />)

    await user.click(screen.getByRole('tab', { name: /terrain preview/i }))

    await user.clear(screen.getByRole('spinbutton', { name: /generation width/i }))
    await user.type(screen.getByRole('spinbutton', { name: /generation width/i }), '2')
    await user.clear(screen.getByRole('spinbutton', { name: /generation height/i }))
    await user.type(screen.getByRole('spinbutton', { name: /generation height/i }), '1')
    await user.clear(screen.getByRole('spinbutton', { name: /generation seed/i }))
    await user.type(screen.getByRole('spinbutton', { name: /generation seed/i }), '0')

    await user.click(screen.getByRole('button', { name: /^generate$/i }))
    await user.click(screen.getByRole('gridcell', { name: /generated cell 1,0 placed/i }))

    const generatedDetails = screen.getByText(/generated tile details/i).closest('.inspector-block')
    expect(generatedDetails).not.toBeNull()
    expect(generatedDetails).toHaveTextContent(/river source|river bank/i)
    expect(within(generatedDetails as HTMLElement).getByText(/rotation:/i)).toBeInTheDocument()
    expect(within(generatedDetails as HTMLElement).getByText(/west:/i)).toBeInTheDocument()
  }, 10000)
})
