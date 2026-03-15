import { useMemo, useState } from 'react'
import { Copy, Eraser, FileDown, Paintbrush, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { exportSketchPng, exportTileMetadata } from './export/exporters'
import { PALETTE, SIDES, validateTileName } from './lib/tileset'
import type { Side, Tile } from './types/tileset'
import { TilesetStoreProvider, useTilesetStore } from './state/TilesetStoreContext'
import { getSelectedTile, getTileWarnings } from './state/tilesetStore'
import { PixelEditorCanvas } from './components/PixelEditorCanvas'
import { SketchCanvas } from './components/SketchCanvas'
import styles from './App.module.css'

const SideTagCard = ({ tile, side }: { tile: Tile; side: Side }) => {
  const setSideTag = useTilesetStore((state) => state.setSideTag)
  const value = tile.sideTags[side]
  const isMissing = value.trim().length === 0

  return (
    <label className={styles.sideCard}>
      <span className={styles.sideHeader}>
        <span>{side}</span>
        <span className={isMissing ? styles.statusMissing : styles.statusAssigned}>
          {isMissing ? 'Missing' : 'Assigned'}
        </span>
      </span>
      <input
        value={value}
        onChange={(event) => setSideTag(tile.id, side, event.target.value)}
        placeholder={`${side} tag`}
        aria-label={`${side} tag`}
        className={styles.textInput}
      />
    </label>
  )
}

export const AppShell = () => {
  const [search, setSearch] = useState('')
  const [activeTool, setActiveTool] = useState<'draw' | 'erase'>('draw')
  const [activePaletteIndex, setActivePaletteIndex] = useState(1)

  const tiles = useTilesetStore((state) => state.tiles)
  const selectedTileId = useTilesetStore((state) => state.selectedTileId)
  const createTile = useTilesetStore((state) => state.createTile)
  const selectTile = useTilesetStore((state) => state.selectTile)
  const renameTile = useTilesetStore((state) => state.renameTile)
  const duplicateTile = useTilesetStore((state) => state.duplicateTile)
  const deleteTile = useTilesetStore((state) => state.deleteTile)
  const setPixel = useTilesetStore((state) => state.setPixel)
  const clearSketch = useTilesetStore((state) => state.clearSketch)

  const selectedTile = useTilesetStore(getSelectedTile)

  const filteredTiles = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return tiles
    }

    return tiles.filter((tile) => tile.name.toLowerCase().includes(query))
  }, [search, tiles])

  if (!selectedTile) {
    return null
  }

  const selectedWarnings = getTileWarnings(selectedTile, tiles)
  const nameValidation = validateTileName(selectedTile.name, selectedTile.id, tiles)
  const filledPixelCount = selectedTile.sketch.pixels.filter((pixel) => pixel !== 0).length

  return (
    <main className={styles.appShell}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Tileset Planner MVP</p>
            <h1 className={styles.title}>Stage 1 Workshop</h1>
          </div>
          <button className={styles.primaryButton} type="button" onClick={() => createTile()}>
            <Plus size={16} />
            New Tile
          </button>
        </div>

        <input
          className={styles.textInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tiles"
          aria-label="Search tiles"
        />

        <div className={styles.tileList}>
          {filteredTiles.map((tile) => {
            const warnings = getTileWarnings(tile, tiles)
            const incomplete = warnings.missingName || warnings.duplicateName || warnings.missingSides.length > 0

            return (
              <button
                key={tile.id}
                type="button"
                className={`${styles.tileRow} ${tile.id === selectedTileId ? styles.tileRowSelected : ''}`}
                onClick={() => selectTile(tile.id)}
                aria-label={tile.name || 'Untitled tile'}
              >
                <SketchCanvas sketch={tile.sketch} size={64} className={styles.tileThumb} />
                <span className={styles.tileMeta}>
                  <span className={styles.tileName}>{tile.name || 'Untitled tile'}</span>
                  {incomplete ? (
                    <span className={styles.warningBadge}>
                      <TriangleAlert size={14} />
                      Needs attention
                    </span>
                  ) : (
                    <span className={styles.completeBadge}>Ready</span>
                  )}
                </span>
                <span className={styles.tileActions}>
                  <span
                    role="button"
                    tabIndex={0}
                    className={styles.iconButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      duplicateTile(tile.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        duplicateTile(tile.id)
                      }
                    }}
                    aria-label={`Duplicate ${tile.name}`}
                  >
                    <Copy size={16} />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={styles.iconButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteTile(tile.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        deleteTile(tile.id)
                      }
                    }}
                    aria-label={`Delete ${tile.name}`}
                  >
                    <Trash2 size={16} />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Tile Workspace</p>
            <h2 className={styles.sectionTitle}>Sketch and export</h2>
          </div>
          <div className={styles.pixelStat}>{filledPixelCount} painted pixels</div>
        </div>

        <label className={styles.fieldStack}>
          <span>Tile name</span>
          <input
            className={styles.textInput}
            value={selectedTile.name}
            onChange={(event) => renameTile(selectedTile.id, event.target.value)}
            placeholder="Tile name"
            aria-label="Tile name"
          />
        </label>
        {!nameValidation.isValid ? (
          <p className={styles.inlineWarning}>
            {nameValidation.isEmpty ? 'Tile name is required.' : 'Tile name must be unique.'}
          </p>
        ) : null}

        <PixelEditorCanvas
          sketch={selectedTile.sketch}
          activeTool={activeTool}
          activePaletteIndex={activePaletteIndex}
          onPaint={(x, y, paletteIndex) => setPixel(selectedTile.id, x, y, paletteIndex)}
        />

        <div className={styles.toolbar}>
          <div className={styles.toolGroup}>
            <button
              type="button"
              className={`${styles.toolButton} ${activeTool === 'draw' ? styles.toolButtonActive : ''}`}
              onClick={() => setActiveTool('draw')}
            >
              <Paintbrush size={16} />
              Draw
            </button>
            <button
              type="button"
              className={`${styles.toolButton} ${activeTool === 'erase' ? styles.toolButtonActive : ''}`}
              onClick={() => setActiveTool('erase')}
            >
              <Eraser size={16} />
              Erase
            </button>
          </div>

          <div className={styles.paletteRow}>
            {PALETTE.map((color, index) => (
              <button
                key={color}
                type="button"
                className={`${styles.paletteSwatch} ${index === activePaletteIndex ? styles.paletteSwatchActive : ''}`}
                onClick={() => setActivePaletteIndex(index)}
                aria-label={`Palette color ${index}`}
                style={{
                  background:
                    color === PALETTE[0]
                      ? 'linear-gradient(135deg, #0f172a 48%, #f97316 50%, #0f172a 52%)'
                      : color,
                }}
              />
            ))}
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={() => clearSketch(selectedTile.id)}>
              Clear Sketch
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                void exportSketchPng(selectedTile)
              }}
            >
              <FileDown size={16} />
              Export Sketch PNG
            </button>
          </div>
        </div>

        <div className={styles.previewCard}>
          <div>
            <p className={styles.sectionLabel}>Native Preview</p>
            <h3 className={styles.previewTitle}>Pixel-accurate reference</h3>
          </div>
          <SketchCanvas
            sketch={selectedTile.sketch}
            size={192}
            className={styles.previewCanvas}
            data-testid="selected-sketch-preview"
          />
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Inspector</p>
            <h2 className={styles.sectionTitle}>Side tags and metadata</h2>
          </div>
          <div
            className={
              selectedWarnings.missingName || selectedWarnings.duplicateName || selectedWarnings.missingSides.length > 0
                ? styles.inspectorStatusWarning
                : styles.inspectorStatusReady
            }
          >
            {selectedWarnings.missingName || selectedWarnings.duplicateName || selectedWarnings.missingSides.length > 0
              ? 'Incomplete'
              : 'Complete'}
          </div>
        </div>

        <div className={styles.sideGrid}>
          {SIDES.map((side) => (
            <SideTagCard key={side} tile={selectedTile} side={side} />
          ))}
        </div>

        <div className={styles.metadataCard}>
          <p className={styles.sectionLabel}>Metadata preview</p>
          <pre className={styles.metadataBlock}>
            {JSON.stringify(
              {
                id: selectedTile.id,
                name: selectedTile.name,
                sideTags: selectedTile.sideTags,
              },
              null,
              2,
            )}
          </pre>
          <button type="button" className={styles.primaryButton} onClick={() => exportTileMetadata(selectedTile)}>
            <FileDown size={16} />
            Export Metadata JSON
          </button>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <TilesetStoreProvider>
      <AppShell />
    </TilesetStoreProvider>
  )
}

export default App
