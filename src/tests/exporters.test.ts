import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveAs } from 'file-saver'
import { exportSketchPng, exportTileMetadata } from '../export/exporters'
import { createDefaultState } from '../lib/tileset'

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

describe('exporters', () => {
  beforeEach(() => {
    vi.mocked(saveAs).mockClear()
  })

  it('exports metadata with the expected filename and payload', () => {
    const tile = createDefaultState().tiles[0]
    tile.name = 'grass_corner'
    tile.sideTags.east = 'slope_outer'

    const payload = exportTileMetadata(tile)

    expect(payload).toMatchObject({
      tile: 'grass_corner',
      id: tile.id,
      sideTags: tile.sideTags,
    })
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'grass_corner.json')
  })

  it('exports sketch png with the expected filename', async () => {
    const tile = createDefaultState().tiles[0]
    tile.name = 'grass_corner'
    tile.sketch.pixels[0] = 3

    await expect(exportSketchPng(tile)).resolves.toBeUndefined()
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'grass_corner.png')
  })
})
