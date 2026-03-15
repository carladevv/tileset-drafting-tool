import { useState } from 'react'

import { LibraryPanel } from './LibraryPanel'
import { TerrainPreviewPanel } from './TerrainPreviewPanel'
import { TileEditorGrid } from './TileEditorGrid'
import { TileInspector } from './TileInspector'

export function EditorLayout() {
  const [activeCenterTab, setActiveCenterTab] = useState<'editor' | 'terrain'>('editor')

  return (
    <main className="editor-shell">
      <aside className="editor-shell__left">
        <LibraryPanel />
      </aside>
      <section className="editor-shell__center">
        <div className="editor-shell__center-stack">
          <div className="panel panel--workspace-tabs">
            <div className="panel__header panel__header--tabs">
              <div className="panel-tabs" role="tablist" aria-label="Workspace views">
                <button
                  type="button"
                  role="tab"
                  className={`panel-tab ${activeCenterTab === 'editor' ? 'is-active' : ''}`}
                  aria-selected={activeCenterTab === 'editor'}
                  onClick={() => setActiveCenterTab('editor')}
                >
                  Tile Editor
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`panel-tab ${activeCenterTab === 'terrain' ? 'is-active' : ''}`}
                  aria-selected={activeCenterTab === 'terrain'}
                  onClick={() => setActiveCenterTab('terrain')}
                >
                  Terrain Preview
                </button>
              </div>
            </div>
          </div>
          {activeCenterTab === 'editor' ? <TileEditorGrid /> : <TerrainPreviewPanel />}
        </div>
      </section>
      <aside className="editor-shell__right">
        <TileInspector />
      </aside>
    </main>
  )
}
