import '@testing-library/jest-dom/vitest'

import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

import { useProjectStore } from '../store/projectStore'

const imageSizeByName: Record<string, { width: number; height: number }> = {
  'tile-square.png': { width: 64, height: 64 },
  'tile-square.webp': { width: 128, height: 128 },
  'tile-replacement.jpg': { width: 256, height: 256 },
  'tile-wide.png': { width: 96, height: 64 },
}

globalThis.createImageBitmap = (async (source: Blob) => {
  const fileName = source instanceof File ? source.name : ''
  const dimensions = imageSizeByName[fileName] ?? { width: 64, height: 64 }

  return {
    width: dimensions.width,
    height: dimensions.height,
    close() {},
  } as ImageBitmap
}) as typeof createImageBitmap

beforeEach(() => {
  localStorage.clear()
  useProjectStore.persist.clearStorage()
  useProjectStore.getState().resetProject()
})

afterEach(() => {
  cleanup()
})
