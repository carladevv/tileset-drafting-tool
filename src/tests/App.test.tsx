import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from '../App'
import { exportSketchPng, exportTileMetadata } from '../export/exporters'
import { createDefaultState, getPixelIndex } from '../lib/tileset'
import { renderWithStore } from './testUtils'

vi.mock('../export/exporters', async () => {
  const actual = await vi.importActual<typeof import('../export/exporters')>('../export/exporters')
  return {
    ...actual,
    exportSketchPng: vi.fn(() => Promise.resolve()),
    exportTileMetadata: vi.fn(),
  }
})

const seedState = () => {
  const state = createDefaultState()
  state.tiles[0].name = 'grass_corner'
  state.tiles[0].sideTags.north = 'flat'
  state.tiles[0].sideTags.east = 'flat'
  state.tiles[0].sideTags.south = ''
  state.tiles[0].sideTags.west = 'flat'

  const second = structuredClone(state.tiles[0])
  second.id = 'tile_stone'
  second.name = 'stone_wall'
  second.sideTags.south = 'wall'
  state.tiles.push(second)
  return state
}

describe('App', () => {
  it('renders tiles and highlights incomplete tiles', () => {
    const { container } = renderWithStore(<AppShell />, seedState())

    expect(screen.getByText('grass_corner')).toBeInTheDocument()
    expect(screen.getByText('stone_wall')).toBeInTheDocument()
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
    expect(container.querySelector('[class*="tileRowSelected"]')).toBeTruthy()
  })

  it('selecting a tile updates the workspace inputs', async () => {
    const user = userEvent.setup()
    renderWithStore(<AppShell />, seedState())

    await user.click(screen.getByRole('button', { name: 'stone_wall' }))

    expect(screen.getByLabelText('Tile name')).toHaveValue('stone_wall')
    expect(screen.getByLabelText('south tag')).toHaveValue('wall')
  })

  it('renaming a tile updates the UI and shows duplicate warnings', async () => {
    const user = userEvent.setup()
    renderWithStore(<AppShell />, seedState())

    const nameInput = screen.getByLabelText('Tile name')
    await user.clear(nameInput)
    await user.type(nameInput, 'stone_wall')

    expect(screen.getAllByText('stone_wall').length).toBeGreaterThan(1)
    expect(screen.getByText('Tile name must be unique.')).toBeInTheDocument()
  })

  it('side tag editing persists in the UI', async () => {
    const user = userEvent.setup()
    renderWithStore(<AppShell />, seedState())

    const southInput = screen.getByLabelText('south tag')
    await user.clear(southInput)
    await user.type(southInput, 'ridge')

    expect(southInput).toHaveValue('ridge')
    expect(screen.getAllByText('Assigned').length).toBeGreaterThan(0)
  })

  it('clear sketch resets the preview', async () => {
    const user = userEvent.setup()
    const state = seedState()
    state.tiles[0].sketch.pixels[0] = 5
    renderWithStore(<AppShell />, state)

    expect(screen.getByTestId('selected-sketch-preview')).toHaveAttribute('data-filled-count', '1')
    await user.click(screen.getByRole('button', { name: 'Clear Sketch' }))
    expect(screen.getByTestId('selected-sketch-preview')).toHaveAttribute('data-filled-count', '0')
  })

  it('export metadata button uses the selected tile', async () => {
    const user = userEvent.setup()
    renderWithStore(<AppShell />, seedState())

    await user.click(screen.getByRole('button', { name: /Export Metadata JSON/i }))
    expect(exportTileMetadata).toHaveBeenCalled()
  })

  it('export sketch button uses the selected tile', async () => {
    const user = userEvent.setup()
    renderWithStore(<AppShell />, seedState())

    await user.click(screen.getByRole('button', { name: /Export Sketch PNG/i }))
    expect(exportSketchPng).toHaveBeenCalled()
  })

  it('single click paints one logical pixel', () => {
    const { store } = renderWithStore(<AppShell />, createDefaultState())
    const canvas = screen.getByTestId('pixel-editor-canvas')

    vi.spyOn(canvas.parentElement!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 512,
      bottom: 512,
      width: 512,
      height: 512,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(canvas.parentElement!, { clientX: 10, clientY: 10 })
    const pixels = store.getState().tiles[0].sketch.pixels

    expect(pixels[getPixelIndex(1, 1)]).toBe(1)
    expect(pixels.filter((pixel) => pixel !== 0)).toHaveLength(1)
  })

  it('drag paints multiple logical pixels', () => {
    const { store } = renderWithStore(<AppShell />, createDefaultState())
    const canvas = screen.getByTestId('pixel-editor-canvas')

    vi.spyOn(canvas.parentElement!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 512,
      bottom: 512,
      width: 512,
      height: 512,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(canvas.parentElement!, { clientX: 4, clientY: 4 })
    fireEvent.pointerMove(canvas.parentElement!, { clientX: 120, clientY: 120 })
    fireEvent.pointerMove(canvas.parentElement!, { clientX: 220, clientY: 220 })
    fireEvent.pointerUp(window)

    const pixels = store.getState().tiles[0].sketch.pixels
    expect(pixels[getPixelIndex(0, 0)]).toBe(1)
    expect(pixels[getPixelIndex(15, 15)]).toBe(1)
    expect(pixels[getPixelIndex(27, 27)]).toBe(1)
  })

  it('erase mode writes the transparent index', async () => {
    const user = userEvent.setup()
    const { store } = renderWithStore(<AppShell />, createDefaultState())
    const canvas = screen.getByTestId('pixel-editor-canvas')

    vi.spyOn(canvas.parentElement!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 512,
      bottom: 512,
      width: 512,
      height: 512,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(canvas.parentElement!, { clientX: 10, clientY: 10 })
    await user.click(screen.getByRole('button', { name: /Erase/i }))
    fireEvent.pointerDown(canvas.parentElement!, { clientX: 10, clientY: 10 })

    expect(store.getState().tiles[0].sketch.pixels[getPixelIndex(1, 1)]).toBe(0)
  })

  it('pointer mapping clamps to the canvas bounds', () => {
    const { store } = renderWithStore(<AppShell />, createDefaultState())
    const canvas = screen.getByTestId('pixel-editor-canvas')

    vi.spyOn(canvas.parentElement!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 512,
      bottom: 512,
      width: 512,
      height: 512,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(canvas.parentElement!, { clientX: 0, clientY: 0 })
    fireEvent.pointerDown(canvas.parentElement!, { clientX: 511, clientY: 511 })

    const pixels = store.getState().tiles[0].sketch.pixels
    expect(pixels[getPixelIndex(0, 0)]).toBe(1)
    expect(pixels[getPixelIndex(63, 63)]).toBe(1)
  })
})
