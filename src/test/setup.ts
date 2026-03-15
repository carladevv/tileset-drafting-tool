import '@testing-library/jest-dom/vitest'

import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

import { useProjectStore } from '../store/projectStore'

beforeEach(() => {
  localStorage.clear()
  useProjectStore.persist.clearStorage()
  useProjectStore.getState().resetProject()
})

afterEach(() => {
  cleanup()
})
