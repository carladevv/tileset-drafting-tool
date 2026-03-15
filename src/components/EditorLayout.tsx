import { PalettePanel } from './PalettePanel'
import { TileEditorGrid } from './TileEditorGrid'
import { TileInspector } from './TileInspector'
import { TileListPanel } from './TileListPanel'

export function EditorLayout() {
  return (
    <main className="editor-shell">
      <aside className="editor-shell__left">
        <TileListPanel />
        <PalettePanel />
      </aside>
      <section className="editor-shell__center">
        <TileEditorGrid />
      </section>
      <aside className="editor-shell__right">
        <TileInspector />
      </aside>
    </main>
  )
}
