import { LibraryPanel } from './LibraryPanel'
import { TileEditorGrid } from './TileEditorGrid'
import { TileInspector } from './TileInspector'

export function EditorLayout() {
  return (
    <main className="editor-shell">
      <aside className="editor-shell__left">
        <LibraryPanel />
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
