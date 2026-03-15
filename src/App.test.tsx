import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { createDefaultProject, createEmptyGrid, storageKey, useProjectStore, validateProject } from './store/projectStore'
import type { Project, Tile } from './types/projectTypes'
import {
  arraysEqual,
  computeCompatibilityGraph,
  deriveTileBorders,
  isOppositeSide,
} from './utils/compatibility'

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

    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as { state?: { project?: Project } }
    const persistedTile = stored.state?.project?.tiles[0] as Record<string, unknown> | undefined

    expect(persistedTile).toBeDefined()
    expect(persistedTile).not.toHaveProperty('borders')
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
})

describe('Stage 1 editor UI', () => {
  beforeEach(() => {
    localStorage.clear()
    useProjectStore.getState().resetProject()
  })

  it('renders painted cells with the active palette color and supports drag painting', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /\+ add label/i }))
    const nameInput = screen.getByLabelText(/name for label_/i)
    fireEvent.change(nameInput, { target: { value: 'Grass' } })
    const colorInput = screen.getByLabelText(/color for grass/i)
    fireEvent.change(colorInput, { target: { value: '#5fbf5f' } })

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

  it('allows renaming the selected tile from the inspector', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))

    const nameInput = screen.getByRole('textbox', { name: /tile name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Cliff Edge')

    expect(nameInput).toHaveValue('Cliff Edge')
    expect(screen.getAllByRole('heading', { name: 'Cliff Edge' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /cliff edge/i })).toBeInTheDocument()
  })

  it('shows derived borders, matches, and warnings in the inspector and tile list', async () => {
    const user = userEvent.setup()

    render(<App />)

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

    await user.click(screen.getByRole('button', { name: /select river/i }))
    eastCells.forEach((cell) => fireEvent.mouseDown(cell, { buttons: 1 }))
    fireEvent.mouseUp(window)

    expect(screen.getByRole('heading', { name: /compatibility/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'east' })).toBeInTheDocument()
    expect(screen.getAllByText(/warning: no compatible tiles/i).length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/compatibility warnings for river source/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /\+ new tile/i }))
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

    await user.click(screen.getByRole('button', { name: /river source/i }))

    expect(screen.getAllByText('Matches: 1').length).toBeGreaterThan(0)
    expect(screen.getByText(/river bank west/i)).toBeInTheDocument()
  })
})
