# Tileset Planner — Stage 1 Spec

**Stage name:** Tiles, Sketching, and Side Tags  
**Stack:** React + Vite + TypeScript  
**Rendering:** standard React DOM for this stage; Babylon.js is not required yet  
**State:** Zustand  
**Persistence:** localStorage  
**Purpose:** deliver the first complete, testable slice of the tileset planner

---

## 1. Stage Goal

Build the first working vertical slice of the application focused on the core authoring loop:
- manage a tile library
- edit a tile sketch in a 64x64 pixel editor
- assign side tags to north/east/south/west
- persist all edits locally
- export one tile sketch and its metadata

This stage should already feel useful on its own for planning a tileset, even before compatibility or terrain generation exists.

---

## 2. Out of Scope for Stage 1

Do not implement yet:
- side-to-side compatibility authoring
- terrain generation
- Babylon.js preview
- 2D asset upload
- 3D asset upload
- rotation generation
- full tileset zip export
- atlas export

Those belong to later stages.

---

## 3. User Stories

### Tile management
- As a user, I can create a tile.
- As a user, I can rename a tile.
- As a user, I can duplicate a tile.
- As a user, I can delete a tile.
- As a user, I can see all tiles in a left-side library.
- As a user, I can select a tile and edit it.

### Sketching
- As a user, I can draw a sketch for a tile in a 64x64 pixel canvas.
- As a user, I can see the sketch enlarged for comfortable editing.
- As a user, I can use a tiny fixed palette suitable for rough planning.
- As a user, I can erase pixels.
- As a user, I can clear the sketch.

### Side tags
- As a user, I can assign one primary tag per side for north/east/south/west.
- As a user, I can type custom tags.
- As a user, I can see which sides are still unassigned.

### Persistence and export
- As a user, I can refresh the page and keep my tileset state.
- As a user, I can export the selected tile sketch as a PNG.
- As a user, I can export the selected tile metadata as JSON.

---

## 4. UI Layout

Three-column layout.

### Left panel — Tile Library
Contains:
- app title
- button: `New Tile`
- optional search input
- scrollable list of tiles
- per tile row:
  - thumbnail
  - tile name
  - warning badge if incomplete
  - duplicate action
  - delete action

Tile row behavior:
- clicking the row selects the tile
- selected row is clearly highlighted
- tile thumbnail uses pixelated rendering

### Center panel — Tile Workspace
Contains:
- editable tile name field
- large pixel editor viewport
- compact palette
- active tool toggle: draw / erase
- button: `Clear Sketch`
- button: `Export Sketch PNG`
- live mini preview at native 64x64 scale, enlarged with nearest-neighbor display

### Right panel — Side Tag Editor and Inspector
Contains:
- four side cards: North, East, South, West
- each card includes:
  - side label
  - text input for primary tag
  - visual status: assigned / missing
- metadata preview block showing:
  - tile id
  - tile name
  - current side tags
- button: `Export Metadata JSON`

---

## 5. Visual Style Requirements

Use a pixel-art inspired UI.

Requirements:
- dark overall background
- high-contrast panel boxes
- visible panel boundaries
- blocky or retro-inspired buttons
- strong tile thumbnails
- all sketch images rendered with `image-rendering: pixelated`
- editor canvas should be large enough to draw comfortably, e.g. 512x512 CSS pixels for a 64x64 logical canvas

A pixel-style font is welcome, but readability must not suffer.

---

## 6. Data Model

Use explicit TypeScript types.

```ts
export type Side = 'north' | 'east' | 'south' | 'west';

export type TileSideTags = {
  north: string;
  east: string;
  south: string;
  west: string;
};

export type SketchData = {
  width: 64;
  height: 64;
  pixels: number[]; // palette indexes, length 4096
};

export type Tile = {
  id: string;
  name: string;
  sketch: SketchData;
  sideTags: TileSideTags;
  createdAt: string;
  updatedAt: string;
};

export type TilesetState = {
  version: 1;
  selectedTileId: string | null;
  tiles: Tile[];
};
```

### Notes
- `pixels` should store palette indices rather than RGBA for simplicity.
- Empty side tag is represented as an empty string.
- Tile names should be unique.

---

## 7. State Management

Use Zustand with actions like:

```ts
createTile()
selectTile(tileId: string)
renameTile(tileId: string, newName: string)
duplicateTile(tileId: string)
deleteTile(tileId: string)
setPixel(tileId: string, x: number, y: number, paletteIndex: number)
clearSketch(tileId: string)
setSideTag(tileId: string, side: Side, tag: string)
loadState(state: TilesetState)
resetState()
```

### Required behavior
- all writes update `updatedAt`
- deletion must safely reselect another tile if one exists
- duplication must copy sketch and side tags, but assign a new id and a unique name
- localStorage autosave should be debounced

---

## 8. Tile Name Rules

Stage 1 tile naming rules:
- required
- must be unique within the tileset
- trimmed before save
- suggested duplicate naming pattern: `original_copy`, then `original_copy_2`, etc.

Validation:
- show inline warning if name is empty
- show inline warning if name conflicts with another tile
- tile should still remain editable even while invalid

---

## 9. Pixel Editor Requirements

Logical canvas:
- fixed at 64x64 pixels

Displayed size:
- large enough for easy editing, recommended 512x512 CSS pixels minimum

Tools for Stage 1:
- draw pencil
- erase
- clear all

Palette for Stage 1:
- fixed 8-color palette
- include transparent/empty as one entry
- no custom color picker yet

Interaction:
- click paints one logical pixel
- drag paints continuously
- erase writes the transparent palette index
- editor must map pointer positions to logical pixel coordinates correctly
- sketch preview updates immediately

Rendering:
- use nearest-neighbor / no smoothing
- no anti-aliasing

Recommended implementation:
- use an HTML canvas for editing and an offscreen or image-data approach for performance

---

## 10. Persistence

Persist the entire `TilesetState` to localStorage.

Requirements:
- autosave after edits
- restore on load
- tolerate missing or malformed stored data by falling back to a valid empty/default state
- include a schema/version field for future migration

Default initial state:
- create one starter tile automatically if no saved state exists

Suggested starter tile name:
- `tile_01`

---

## 11. Export Requirements

### Export Sketch PNG
From the selected tile.

Behavior:
- export the 64x64 sketch scaled up to 256x256 or 512x512
- preserve hard pixel edges
- filename: `{tileName}.png`
- transparent pixels remain transparent if possible

### Export Metadata JSON
From the selected tile.

Filename:
- `{tileName}.json`

Shape:

```json
{
  "tile": "grass_corner",
  "id": "tile_xxx",
  "sideTags": {
    "north": "flat",
    "east": "slope_outer",
    "south": "wall_low",
    "west": "flat"
  },
  "sketch": {
    "width": 64,
    "height": 64
  }
}
```

The JSON does not need to embed pixel data in Stage 1. It is a lightweight metadata export for artist/spec use.

---

## 12. Incomplete Tile Warnings

A tile should be considered incomplete if any of these are true:
- name is empty
- name is not unique
- one or more side tags are empty

Incomplete state should appear:
- in the tile list
- in the right-side inspector

Do not block editing or export, but show the warning clearly.

---

## 13. Suggested Component Breakdown

```text
AppShell
  TileLibraryPanel
    TileList
    TileListItem
  TileWorkspacePanel
    TileNameField
    PixelEditorCanvas
    PalettePicker
    ToolToggle
    SketchPreview
    ExportSketchButton
  TileInspectorPanel
    SideTagEditor
    SideTagCard
    TileMetadataPreview
    ExportMetadataButton
```

Store hooks:
- `useTilesetStore()`
- optional selectors per panel to minimize rerenders

Utilities:
- `createEmptySketch()`
- `duplicateTileName()`
- `validateTileName()`
- `exportSketchPng()`
- `exportTileMetadata()`
- `serializeState()` / `deserializeState()`

---

## 14. Acceptance Criteria

Stage 1 is complete when:

1. user can create, rename, duplicate, select, and delete tiles
2. user can draw and erase on a 64x64 sketch
3. user can assign north/east/south/west side tags
4. tiles persist after page refresh
5. selected tile sketch can be exported as PNG
6. selected tile metadata can be exported as JSON
7. duplicate tile copies sketch and side tags correctly
8. empty or conflicting names are visibly flagged
9. missing side tags are visibly flagged
10. the app is visually usable and pleasant in the pixel-art direction

---

## 15. Notes for Codex

Prioritize correctness and testability over visual polish.

Important implementation priorities:
1. stable data model
2. reliable pixel editing math
3. robust local persistence
4. simple, clean component boundaries
5. export functions that actually generate useful files

Avoid premature abstraction for later stages unless it clearly helps Stage 1.
