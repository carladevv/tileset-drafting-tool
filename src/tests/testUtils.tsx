import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { TilesetStoreProvider } from '../state/TilesetStoreContext'
import { createTilesetStore } from '../state/tilesetStore'
import type { TilesetState } from '../types/tileset'

export const renderWithStore = (ui: ReactElement, state?: TilesetState) => {
  const store = createTilesetStore(state)

  return {
    store,
    ...render(<TilesetStoreProvider store={store}>{ui}</TilesetStoreProvider>),
  }
}
