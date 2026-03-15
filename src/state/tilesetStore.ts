import { createStore } from 'zustand/vanilla'
import type { StoreApi } from 'zustand/vanilla'
import {
  createDefaultState,
  createNextTileName,
  createTile,
  deserializeState,
  duplicateTileName,
  getPixelIndex,
  serializeState,
  SIDES,
  STORAGE_KEY,
  TRANSPARENT_INDEX,
  validateTileName,
} from '../lib/tileset'
import type { Side, Tile, TilesetState } from '../types/tileset'

type TilesetActions = {
  createTile: () => void
  selectTile: (tileId: string) => void
  renameTile: (tileId: string, newName: string) => void
  duplicateTile: (tileId: string) => void
  deleteTile: (tileId: string) => void
  setPixel: (tileId: string, x: number, y: number, paletteIndex: number) => void
  clearSketch: (tileId: string) => void
  setSideTag: (tileId: string, side: Side, tag: string) => void
  loadState: (state: TilesetState) => void
  resetState: () => void
}

export type TilesetStore = TilesetState & TilesetActions
export type TilesetStoreApi = StoreApi<TilesetStore>

const stampTile = (tile: Tile, changes: Partial<Tile>): Tile => ({
  ...tile,
  ...changes,
  updatedAt: new Date().toISOString(),
})

const bindActions = (
  set: StoreApi<TilesetStore>['setState'],
  get: StoreApi<TilesetStore>['getState'],
): TilesetActions => ({
  createTile: () =>
    set((state) => {
      const tile = createTile(createNextTileName(state.tiles.map((existingTile) => existingTile.name.trim())))
      return {
        ...state,
        selectedTileId: tile.id,
        tiles: [...state.tiles, tile],
      }
    }),
  selectTile: (tileId) =>
    set((state) => ({
      ...state,
      selectedTileId: state.tiles.some((tile) => tile.id === tileId) ? tileId : state.selectedTileId,
    })),
  renameTile: (tileId, newName) =>
    set((state) => ({
      ...state,
      tiles: state.tiles.map((tile) =>
        tile.id === tileId
          ? stampTile(tile, {
              name: newName.trim(),
            })
          : tile,
      ),
    })),
  duplicateTile: (tileId) =>
    set((state) => {
      const source = state.tiles.find((tile) => tile.id === tileId)
      if (!source) {
        return state
      }

      const duplicate = createTile(duplicateTileName(source.name, state.tiles.map((tile) => tile.name.trim())))
      duplicate.sketch = {
        width: source.sketch.width,
        height: source.sketch.height,
        pixels: [...source.sketch.pixels],
      }
      duplicate.sideTags = { ...source.sideTags }

      return {
        ...state,
        selectedTileId: duplicate.id,
        tiles: [...state.tiles, duplicate],
      }
    }),
  deleteTile: (tileId) =>
    set((state) => {
      const index = state.tiles.findIndex((tile) => tile.id === tileId)
      if (index === -1) {
        return state
      }

      const tiles = state.tiles.filter((tile) => tile.id !== tileId)
      const selectedTileId =
        state.selectedTileId !== tileId ? state.selectedTileId : tiles[index]?.id ?? tiles[index - 1]?.id ?? null

      return {
        ...state,
        selectedTileId,
        tiles,
      }
    }),
  setPixel: (tileId, x, y, paletteIndex) =>
    set((state) => {
      if (x < 0 || x > 63 || y < 0 || y > 63) {
        return state
      }

      return {
        ...state,
        tiles: state.tiles.map((tile) => {
          if (tile.id !== tileId) {
            return tile
          }

          const nextPixels = [...tile.sketch.pixels]
          nextPixels[getPixelIndex(x, y)] = paletteIndex

          return stampTile(tile, {
            sketch: {
              width: tile.sketch.width,
              height: tile.sketch.height,
              pixels: nextPixels,
            },
          })
        }),
      }
    }),
  clearSketch: (tileId) =>
    set((state) => ({
      ...state,
      tiles: state.tiles.map((tile) =>
        tile.id === tileId
          ? stampTile(tile, {
              sketch: {
                width: tile.sketch.width,
                height: tile.sketch.height,
                pixels: Array(tile.sketch.width * tile.sketch.height).fill(TRANSPARENT_INDEX),
              },
            })
          : tile,
      ),
    })),
  setSideTag: (tileId, side, tag) =>
    set((state) => ({
      ...state,
      tiles: state.tiles.map((tile) =>
        tile.id === tileId
          ? stampTile(tile, {
              sideTags: {
                ...tile.sideTags,
                [side]: tag.trim(),
              },
            })
          : tile,
      ),
    })),
  loadState: (state) => set(() => ({ ...state, ...bindActions(set, get) })),
  resetState: () => set(() => ({ ...createDefaultState(), ...bindActions(set, get) })),
})

const createInitialState = () => {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  return deserializeState(window.localStorage.getItem(STORAGE_KEY))
}

export const createTilesetStore = (initialState?: TilesetState) => {
  const baseState = initialState ?? createInitialState()

  const store = createStore<TilesetStore>((set, get) => ({
    ...baseState,
    ...bindActions(set, get),
  }))

  if (typeof window !== 'undefined') {
    let timeoutId: number | undefined

    store.subscribe((snapshot) => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        const persisted: TilesetState = {
          version: snapshot.version,
          selectedTileId: snapshot.selectedTileId,
          tiles: snapshot.tiles,
        }

        window.localStorage.setItem(STORAGE_KEY, serializeState(persisted))
      }, 180)
    })
  }

  return store
}

export const defaultTilesetStore = createTilesetStore()

export const getSelectedTile = (state: TilesetState) =>
  state.tiles.find((tile) => tile.id === state.selectedTileId) ?? null

export const getTileWarnings = (tile: Tile, tiles: Tile[]) => {
  const nameState = validateTileName(tile.name, tile.id, tiles)
  return {
    missingName: nameState.isEmpty,
    duplicateName: nameState.isDuplicate,
    missingSides: SIDES.filter((side) => tile.sideTags[side].trim().length === 0),
  }
}
