import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { CellLabel, Project, Tile, TileGrid, ValidationIssue } from '../types/projectTypes'
import { GRID_SIZE } from '../types/projectTypes'

const STORAGE_KEY = 'tileset-drafting-tool.stage-1.project'

let fallbackIdCounter = 0

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }

  fallbackIdCounter += 1
  return `${prefix}_${Date.now()}_${fallbackIdCounter}`
}

export const createEmptyGrid = (fill = ''): TileGrid =>
  Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => fill))

const cloneGrid = (grid: TileGrid): TileGrid => grid.map((row) => [...row])

const createDefaultSettings = (): Project['settings'] => ({
  previewMode: 'semantic',
  defaultTileImageSize: null,
  generationSeed: null,
  generationWidth: 12,
  generationHeight: 12,
})

export const createDefaultProject = (): Project => ({
  id: 'project_default',
  name: 'Untitled Tileset',
  version: '1.0.0',
  gridSize: GRID_SIZE,
  cellLabels: [],
  tiles: [],
  settings: createDefaultSettings(),
})

const createValidationIssue = (issue: Omit<ValidationIssue, 'id'>): ValidationIssue => ({
  id: createId('issue'),
  ...issue,
})

export const validateProject = (project: Project): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const labelIds = new Set(project.cellLabels.map((label) => label.id))
  const nameCounts = new Map<string, number>()

  for (const tile of project.tiles) {
    const trimmedName = tile.name.trim()
    nameCounts.set(trimmedName, (nameCounts.get(trimmedName) ?? 0) + 1)

    if (trimmedName.length === 0) {
      issues.push(
        createValidationIssue({
          severity: 'error',
          scope: 'tile',
          message: 'Tile name is required.',
          tileId: tile.id,
        }),
      )
    }

    if (tile.grid.length !== GRID_SIZE || tile.grid.some((row) => row.length !== GRID_SIZE)) {
      issues.push(
        createValidationIssue({
          severity: 'error',
          scope: 'tile',
          message: `Tile grid must be exactly ${GRID_SIZE}x${GRID_SIZE}.`,
          tileId: tile.id,
        }),
      )
    }

    tile.grid.forEach((row) => {
      row.forEach((cellLabelId) => {
        if (cellLabelId !== '' && !labelIds.has(cellLabelId)) {
          issues.push(
            createValidationIssue({
              severity: 'error',
              scope: 'tile',
              message: `Tile references undefined cell label "${cellLabelId}".`,
              tileId: tile.id,
              cellLabelId,
            }),
          )
        }
      })
    })
  }

  for (const tile of project.tiles) {
    const trimmedName = tile.name.trim()
    if (trimmedName.length > 0 && (nameCounts.get(trimmedName) ?? 0) > 1) {
      issues.push(
        createValidationIssue({
          severity: 'warning',
          scope: 'tile',
          message: `Duplicate tile name "${trimmedName}".`,
          tileId: tile.id,
        }),
      )
    }
  }

  return issues
}

const createTileName = (tiles: Tile[]) => `tile_${tiles.length + 1}`
const createLabelName = (labels: CellLabel[]) => `Label ${labels.length + 1}`

const createDefaultTile = (tiles: Tile[]): Tile => ({
  id: createId('tile'),
  name: createTileName(tiles),
  grid: createEmptyGrid(),
  allowRotations: true,
})

const createDefaultLabel = (labels: CellLabel[]): CellLabel => {
  const id = createId('label')

  return {
    id,
    name: createLabelName(labels),
    color: '#5fbf5f',
  }
}

type ProjectStoreState = {
  project: Project
  selectedTileId: string | null
  selectedLabelId: string | null
  validationIssues: ValidationIssue[]
}

type ProjectStoreActions = {
  createTile: () => string
  updateTileName: (tileId: string, name: string) => void
  duplicateTile: (tileId: string) => string | null
  deleteTile: (tileId: string) => void
  selectTile: (tileId: string | null) => void
  setTileRotationEnabled: (tileId: string, allowRotations: boolean) => void
  createCellLabel: () => string
  updateCellLabel: (labelId: string, updates: Partial<Pick<CellLabel, 'name' | 'color'>>) => void
  deleteCellLabel: (labelId: string) => void
  selectLabel: (labelId: string | null) => void
  paintCell: (tileId: string, row: number, column: number, labelId: string) => void
  paintCells: (tileId: string, cells: Array<{ row: number; column: number }>, labelId: string) => void
  replaceProject: (project: Project) => void
  resetProject: () => void
}

export type ProjectStore = ProjectStoreState & ProjectStoreActions

const withValidation = (project: Project) => ({
  project,
  validationIssues: validateProject(project),
})

const getNextSelectedTileId = (tiles: Tile[], preferredTileId?: string | null) => {
  if (preferredTileId && tiles.some((tile) => tile.id === preferredTileId)) {
    return preferredTileId
  }

  return tiles[0]?.id ?? null
}

const getNextSelectedLabelId = (labels: CellLabel[], preferredLabelId?: string | null) => {
  if (preferredLabelId && labels.some((label) => label.id === preferredLabelId)) {
    return preferredLabelId
  }

  return labels[0]?.id ?? null
}

const createInitialState = (): ProjectStoreState => ({
  ...withValidation(createDefaultProject()),
  selectedTileId: null,
  selectedLabelId: null,
})

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      createTile: () => {
        const { project } = get()
        const tile = createDefaultTile(project.tiles)
        const nextProject = {
          ...project,
          tiles: [...project.tiles, tile],
        }

        set({
          ...withValidation(nextProject),
          selectedTileId: tile.id,
        })

        return tile.id
      },

      updateTileName: (tileId, name) => {
        const { project } = get()
        const nextProject = {
          ...project,
          tiles: project.tiles.map((tile) => (tile.id === tileId ? { ...tile, name } : tile)),
        }

        set(withValidation(nextProject))
      },

      duplicateTile: (tileId) => {
        const { project } = get()
        const tile = project.tiles.find((entry) => entry.id === tileId)
        if (!tile) {
          return null
        }

        const duplicate: Tile = {
          ...tile,
          id: createId('tile'),
          name: `${tile.name || 'tile'} copy`,
          grid: cloneGrid(tile.grid),
        }

        const nextProject = {
          ...project,
          tiles: [...project.tiles, duplicate],
        }

        set({
          ...withValidation(nextProject),
          selectedTileId: duplicate.id,
        })

        return duplicate.id
      },

      deleteTile: (tileId) => {
        const state = get()
        const nextTiles = state.project.tiles.filter((tile) => tile.id !== tileId)
        const nextProject = {
          ...state.project,
          tiles: nextTiles,
        }

        set({
          ...withValidation(nextProject),
          selectedTileId: getNextSelectedTileId(nextTiles, state.selectedTileId === tileId ? null : state.selectedTileId),
        })
      },

      selectTile: (tileId) => set({ selectedTileId: tileId }),

      setTileRotationEnabled: (tileId, allowRotations) => {
        const { project } = get()
        const nextProject = {
          ...project,
          tiles: project.tiles.map((tile) => (tile.id === tileId ? { ...tile, allowRotations } : tile)),
        }

        set(withValidation(nextProject))
      },

      createCellLabel: () => {
        const { project } = get()
        const label = createDefaultLabel(project.cellLabels)
        const nextProject = {
          ...project,
          cellLabels: [...project.cellLabels, label],
        }

        set({
          ...withValidation(nextProject),
          selectedLabelId: label.id,
        })

        return label.id
      },

      updateCellLabel: (labelId, updates) => {
        const { project } = get()
        const nextProject = {
          ...project,
          cellLabels: project.cellLabels.map((label) => (label.id === labelId ? { ...label, ...updates } : label)),
        }

        set(withValidation(nextProject))
      },

      deleteCellLabel: (labelId) => {
        const state = get()
        const nextLabels = state.project.cellLabels.filter((label) => label.id !== labelId)
        const nextProject = {
          ...state.project,
          cellLabels: nextLabels,
        }

        set({
          ...withValidation(nextProject),
          selectedLabelId: getNextSelectedLabelId(nextLabels, state.selectedLabelId === labelId ? null : state.selectedLabelId),
        })
      },

      selectLabel: (labelId) => set({ selectedLabelId: labelId }),

      paintCell: (tileId, row, column, labelId) => {
        const { project } = get()
        const nextProject = {
          ...project,
          tiles: project.tiles.map((tile) => {
            if (tile.id !== tileId || !tile.grid[row] || tile.grid[row][column] === undefined) {
              return tile
            }

            const grid = cloneGrid(tile.grid)
            grid[row][column] = labelId
            return { ...tile, grid }
          }),
        }

        set(withValidation(nextProject))
      },

      paintCells: (tileId, cells, labelId) => {
        const uniqueCells = Array.from(new Set(cells.map(({ row, column }) => `${row}:${column}`))).map((entry) => {
          const [row, column] = entry.split(':').map(Number)
          return { row, column }
        })

        const { project } = get()
        const nextProject = {
          ...project,
          tiles: project.tiles.map((tile) => {
            if (tile.id !== tileId) {
              return tile
            }

            const grid = cloneGrid(tile.grid)
            uniqueCells.forEach(({ row, column }) => {
              if (grid[row]?.[column] !== undefined) {
                grid[row][column] = labelId
              }
            })

            return { ...tile, grid }
          }),
        }

        set(withValidation(nextProject))
      },

      replaceProject: (project) =>
        set({
          ...withValidation(project),
          selectedTileId: getNextSelectedTileId(project.tiles, get().selectedTileId),
          selectedLabelId: getNextSelectedLabelId(project.cellLabels, get().selectedLabelId),
        }),

      resetProject: () => set(createInitialState()),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ project: state.project }),
      merge: (persistedState, currentState) => {
        const persistedProject = (persistedState as Partial<ProjectStore> | undefined)?.project
        if (!persistedProject) {
          return currentState
        }

        return {
          ...currentState,
          ...withValidation(persistedProject),
          selectedTileId: getNextSelectedTileId(persistedProject.tiles),
          selectedLabelId: getNextSelectedLabelId(persistedProject.cellLabels),
        }
      },
    },
  ),
)

export const storageKey = STORAGE_KEY
