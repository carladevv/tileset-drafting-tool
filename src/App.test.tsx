import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { createDefaultProject, createEmptyGrid, storageKey, useProjectStore, validateProject } from './store/projectStore'
import type { Project } from './types/projectTypes'

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
})

describe('Stage 1 editor UI', () => {
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
})
