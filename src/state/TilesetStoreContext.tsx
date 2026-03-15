import { createContext, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { defaultTilesetStore, type TilesetStore, type TilesetStoreApi } from './tilesetStore'

const TilesetStoreContext = createContext<TilesetStoreApi>(defaultTilesetStore)

export const TilesetStoreProvider = ({
  children,
  store = defaultTilesetStore,
}: {
  children: ReactNode
  store?: TilesetStoreApi
}) => <TilesetStoreContext.Provider value={store}>{children}</TilesetStoreContext.Provider>

export const useTilesetStore = <T,>(selector: (state: TilesetStore) => T) => {
  const store = useContext(TilesetStoreContext)
  return useStore(store, selector)
}
