import { describe, expect, it } from 'vitest'
import {
  createDefaultState,
  createEmptySketch,
  deserializeState,
  getPixelIndex,
  serializeState,
  validateTileName,
} from '../lib/tileset'
import { createTilesetStore } from '../state/tilesetStore'

describe('tileset store', () => {
  it('createTile adds a selected tile with a 64x64 sketch', () => {
    const store = createTilesetStore(createDefaultState())

    store.getState().createTile()
    const state = store.getState()
    const created = state.tiles.at(-1)

    expect(state.tiles).toHaveLength(2)
    expect(state.selectedTileId).toBe(created?.id)
    expect(created?.sketch.pixels).toHaveLength(4096)
    expect(created?.sideTags).toEqual({ north: '', east: '', south: '', west: '' })
  })

  it('duplicateTile copies sketch and side tags but assigns a new id', () => {
    const initial = createDefaultState()
    initial.tiles[0].sketch.pixels[5] = 4
    initial.tiles[0].sideTags.north = 'flat'
    const store = createTilesetStore(initial)

    store.getState().duplicateTile(initial.tiles[0].id)
    const [, duplicate] = store.getState().tiles

    expect(duplicate.id).not.toBe(initial.tiles[0].id)
    expect(duplicate.name).toBe('tile_01_copy')
    expect(duplicate.sketch.pixels).toEqual(initial.tiles[0].sketch.pixels)
    expect(duplicate.sideTags).toEqual(initial.tiles[0].sideTags)
  })

  it('deleteTile removes a tile and reselects a safe alternative', () => {
    const initial = createDefaultState()
    const store = createTilesetStore(initial)
    store.getState().createTile()
    const createdId = store.getState().selectedTileId!

    store.getState().deleteTile(createdId)
    const state = store.getState()

    expect(state.tiles.some((tile) => tile.id === createdId)).toBe(false)
    expect(state.selectedTileId).toBe(initial.tiles[0].id)
  })

  it('validates empty, whitespace, duplicate, and unique names', () => {
    const initial = createDefaultState()
    const second = {
      ...initial.tiles[0],
      id: 'tile_two',
      name: 'stone',
    }

    const tiles = [initial.tiles[0], second]
    expect(validateTileName('', initial.tiles[0].id, tiles).isValid).toBe(false)
    expect(validateTileName('   ', initial.tiles[0].id, tiles).isValid).toBe(false)
    expect(validateTileName('stone', initial.tiles[0].id, tiles).isValid).toBe(false)
    expect(validateTileName(' stone_unique ', initial.tiles[0].id, tiles)).toMatchObject({
      trimmedName: 'stone_unique',
      isValid: true,
    })
  })

  it('setPixel updates the expected index only', () => {
    const store = createTilesetStore(createDefaultState())
    const tileId = store.getState().tiles[0].id

    store.getState().setPixel(tileId, 2, 3, 6)
    const pixels = store.getState().tiles[0].sketch.pixels

    expect(pixels[getPixelIndex(2, 3)]).toBe(6)
    expect(pixels[getPixelIndex(1, 3)]).toBe(0)
    expect(pixels[getPixelIndex(2, 2)]).toBe(0)
  })

  it('clearSketch resets pixels to the transparent index', () => {
    const state = createDefaultState()
    state.tiles[0].sketch = createEmptySketch()
    state.tiles[0].sketch.pixels[10] = 2
    const store = createTilesetStore(state)

    store.getState().clearSketch(state.tiles[0].id)
    expect(store.getState().tiles[0].sketch.pixels.every((pixel) => pixel === 0)).toBe(true)
  })

  it('setSideTag only updates the requested side', () => {
    const store = createTilesetStore(createDefaultState())
    const tileId = store.getState().tiles[0].id

    store.getState().setSideTag(tileId, 'east', 'slope_outer')
    expect(store.getState().tiles[0].sideTags).toEqual({
      north: '',
      east: 'slope_outer',
      south: '',
      west: '',
    })
  })

  it('serializes and deserializes state safely', () => {
    const initial = createDefaultState()
    initial.tiles[0].name = 'grass_corner'
    initial.tiles[0].sideTags.west = 'flat'
    initial.tiles[0].sketch.pixels[0] = 7

    const serialized = serializeState(initial)
    const restored = deserializeState(serialized)

    expect(restored).toEqual(initial)
    expect(deserializeState('{bad json')).toMatchObject({ version: 1 })
  })
})
