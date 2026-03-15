# Tileset Planner MVP Spec

**Project type:** React + Vite + TypeScript + Babylon.js web app  
**Primary goal:** Build a visual tileset planning, sketching, compatibility-authoring, and terrain-preview tool that works for both **2D** and **3D** tilesets.  
**Audience:** A technical artist / designer building modular tilesets, especially for 3D modular terrain.  
**Secondary goal:** Produce structured metadata that can later be used by Blender scripts or addons to validate real tile geometry against intended edge compatibility.

---

## 1. Product Summary

This application is a **tileset planning and validation companion**, not a full mesh authoring tool.

It should let the user:

1. Create a library of tiles.
2. Sketch each tile visually using a built-in pixel editor.
3. Define **edge/side tags** for each side of each tile.
4. Author or review tile-to-tile compatibility.
5. Generate a terrain preview using those compatibility rules.
6. Batch upload final production assets later:
   - 2D tile images
   - 3D tile models
7. Switch the terrain preview between:
   - sketch view
   - uploaded 2D asset view
   - uploaded 3D asset view
8. Export structured JSON metadata for downstream use.
9. Export sketches as first-class deliverables for artist handoff and documentation.

This tool should support a workflow where:

- a non-artist can sketch a tileset,
- edge rules are defined clearly,
- an artist later produces the real assets,
- the real assets are matched by name and checked against the intended structure,
- rotated variants can be generated automatically,
- sketches can be exported as references together with edge specifications.

---

## 2. Core Design Principles

1. **Visual-first UX**
   - The user is visually oriented.
   - Tile sketching is a first-class feature, not a nice-to-have.
   - Tile previews must be visible throughout the UI.

2. **Compatibility is the core system**
   - The central data model is not the drawing itself.
   - The central data model is each tile's sides and what they can connect to.

3. **Sketches are planning assets**
   - The built-in pixel sketch is not the final art.
   - It is a planning layer used to think, communicate, and validate.
   - Sketch export is a first-class workflow, not an optional extra.

4. **Universal for 2D and 3D**
   - The same logical adjacency system should work for 2D and 3D tilesets.
   - The preview layer can swap presentation mode while keeping the same logic.

5. **Strong naming contract**
   - Final uploaded assets must match tile names.
   - The app should report missing or mismatched names clearly.

6. **Incremental pipeline**
   - MVP focuses on tile planning, compatibility authoring, preview generation, and sketch export.
   - Real geometry validation is prepared for, but not fully implemented in-browser.

---

## 3. Scope of MVP

### Included in MVP

- Tile library management
- Pixel sketch editor per tile
- Side/edge tag editor
- Manual connection authoring between tile sides
- Auto-suggested compatibility based on side tags
- Terrain generation preview
- Batch upload for 2D assets
- Batch upload for 3D assets
- Preview mode switching: sketch / 2D / 3D
- Automatic rotation variant generation in logic layer
- JSON import/export
- Validation warnings for missing matches and asset-name mismatches
- Export single tile sketches
- Export all tile sketches
- Export a sketch atlas / reference sheet
- Export sketch plus metadata for artist handoff
- Export a full tileset package containing sketches and metadata

### Explicitly Not in MVP

- Automatic remeshing of uploaded 3D models
- Automatic UV unwrapping or texel density correction
- In-browser geometry fixing
- Full Blender integration from the browser
- Material-level geometric validation in-browser
- Production-grade WFC implementation beyond a straightforward constraint-based generator

---

## 4. Reference to Existing Blender Script

The user already has a Blender script that performs important adjacent work:

- compares tile borders geometrically,
- builds an adjacency index,
- generates rotated variants,
- generates a terrain grid,
- leaves cells empty when no valid tile exists.

The web app should conceptually align with that pipeline.

Important parallels from the script:

- border comparison currently happens in Blender through `comprobar_borde(modulo1, modulo2, direccion)`
- adjacency index generation currently happens through `indice_conexiones(tileset)`
- rotations currently happen through `generar_rotaciones(...)`
- terrain generation currently happens through `generar_terreno(...)`
- generation failures currently appear as unresolved / empty cells instead of crashing

The new app should not replicate Blender mesh analysis yet, but its exported metadata should be designed so a later Blender validation script can consume it.

---

## 5. Target Stack

- **Framework:** React
- **Build tool:** Vite
- **Language:** TypeScript
- **3D engine:** Babylon.js
- **State management:** Zustand
- **Routing:** React Router
- **UI primitives:** custom components or lightweight library only if needed
- **Styling:** CSS modules or Tailwind; either is acceptable, but the result must support a strong pixel-art UI style
- **Persistence:** localStorage for MVP, with import/export JSON

Recommended supporting libraries:

- `zustand`
- `react-router-dom`
- `@babylonjs/core`
- `@babylonjs/loaders`
- `@babylonjs/gui` only if useful
- `nanoid` for ids
- optional: `zod` for schema validation
- optional: `jszip` for exporting the full tileset package as a zip
- optional: `file-saver` for download ergonomics

---

## 6. Visual Style

The app should have a **pixel-art inspired visual style**.

### Style Requirements

- chunky pixel-like UI accents
- retro panel framing
- sharp corners or intentionally blocky rounded corners
- visible panel separation
- dark background with high-contrast panels
- strong tile thumbnails everywhere
- fonts should have a pixel aesthetic if practical
- the pixel editor should scale up the 64x64 canvas visually so drawing is comfortable
- sketch rendering should preserve hard edges using pixelated scaling

### Important note

The app should still feel modern and usable. Do not make the pixel theme reduce readability or clarity.

Where sketches are displayed in the browser, use:

```css
image-rendering: pixelated;
```

---

## 7. Information Architecture

The app should have **two primary tabs/views**:

1. **Tileset Editor**
2. **Terrain Preview**

### Tileset Editor layout
Three-panel layout:

#### Left panel: Tile Library
- list of all tiles
- add tile
- duplicate tile
- rename tile
- delete tile
- search/filter tiles
- small thumbnail per tile
- warning badges if tile has issues
- quick export actions:
  - export selected sketch
  - export all sketches
  - export sketch atlas

#### Center panel: Tile Workspace
- tile name
- pixel sketch editor
- quick tile preview
- optional metadata fields
- side tagging controls
- visible export button for the current tile sketch

#### Right panel: Compatibility & Inspection
Split into two stacked sections:

##### Top section: Side Compatibility Authoring
- select a side of the current tile
- browse all existing tiles
- browse by side of those other tiles
- tiles/sides that are currently incompatible should appear dimmed
- clicking a side should toggle compatibility
- compatibility can be filtered by side tag
- reciprocal link behavior should be enforced or clearly indicated

##### Bottom section: Connection List / Inspector
- scrollable list of all current connections for selected tile
- grouped by side
- shows what each allowed connection currently points to
- warnings for missing reciprocal links or empty sides

### Terrain Preview layout
- large main preview area
- side control panel for generation settings and asset uploads
- mode switch between:
  - Sketch
  - Uploaded 2D
  - Uploaded 3D
- validation/warnings panel
- generated terrain statistics
- package export actions
- batch upload actions for 2D and 3D assets

---

## 8. Functional Requirements

## 8.1 Tile Entity

Each tile must have:

- internal id
- display name
- canonical name (used for asset matching)
- sketch pixel data (64x64)
- side definitions
- optional tags/categories
- optional notes
- rotation settings
- linked uploaded 2D asset reference (optional)
- linked uploaded 3D asset reference (optional)

Suggested side set for MVP:

- `north`
- `east`
- `south`
- `west`

Do not support vertical stacking in MVP unless it comes almost for free.

---

## 8.2 Pixel Sketch Editor

### Requirements

- fixed internal resolution of **64x64 pixels**
- visually enlarged editor, e.g. 512x512 or similar on screen
- palette-based drawing
- minimum 8-color default palette
- pencil tool
- eraser tool
- fill tool optional but desirable
- clear canvas
- mirror tools optional but not required
- undo/redo desirable
- export sketch preview as data URL or raw pixel data in project JSON

### UX Requirements

- show visible pixel grid when zoomed
- drawing should feel immediate and low-latency
- selected color should be obvious
- current tile sketch should update in tile list thumbnail
- the sketch editor should have a prominent export action

The sketch is a planning tool, so usability matters more than advanced art features.

---

## 8.3 Sketch Export System

This is a first-class MVP feature.

### Purpose

Sketch export supports these workflows:

- provide visual reference sheets for artists
- document tile intent over time
- export sketches for 2D tilesets
- export sketches together with edge specifications
- create a portable design package before final art exists

### Export Single Tile Sketch

From the **Tile Editor** view, the user must be able to export the current sketch.

#### Requirements

- prominent `Export Sketch` button in the tile workspace
- export as PNG
- output should be pixel-perfect scaled from 64x64 to a larger resolution
- no smoothing during export
- support at least one standard export size such as 256x256
- optionally support 512x512 later
- optional transparent background is desirable but not required in first pass

Suggested output naming:

- `{canonicalName}.png`

### Export All Tile Sketches

From the tile library / tileset toolbar, the user must be able to export all tile sketches.

#### Requirements

- `Export All Sketches` action
- export one PNG per tile
- preserve canonical naming
- package output as a zip or equivalent download-friendly format

Suggested structure:

```txt
exports/
  sketches/
    grass_corner.png
    cliff_inner.png
    wall_end.png
```

### Export Sketch Atlas

The app should export a reference sheet containing all tile sketches.

#### Requirements

- `Export Sketch Atlas` action
- produce a PNG atlas / contact sheet
- each atlas cell should contain:
  - enlarged sketch preview
  - tile name
  - side tags
- layout should remain readable for medium-sized tilesets

Each cell should include something like:

```txt
[sketch image]

grass_corner
N: flat
E: slope_outer
S: wall_low
W: flat
```

This acts as a documentation sheet for the tileset.

### Export Sketch + Metadata

The app should support exporting a tile sketch together with a metadata sidecar.

#### Requirements

- `Export Sketch + Metadata` action for a tile
- produce:
  - `{canonicalName}.png`
  - `{canonicalName}.json`
- metadata should include tile name, side tags, rotation settings, and optional notes

Example JSON:

```json
{
  "tile": "grass_corner",
  "edges": {
    "north": "flat",
    "east": "slope_outer",
    "south": "wall_low",
    "west": "flat"
  },
  "rotationsAllowed": true
}
```

### Export Tileset Package

This should be a prominent, high-value export option.

#### Requirements

- `Export Tileset Package` action
- export a portable package containing:
  - project JSON
  - sketch PNGs
  - adjacency / compatibility JSON
  - optional sketch atlas
- zip packaging is acceptable and recommended

Suggested structure:

```txt
tileset/
  tileset.json
  adjacency.json
  atlas.png
  sketches/
    grass_corner.png
    cliff_inner.png
```

This package is intended as the portable design document for the tileset and a future handoff artifact for Blender validation workflows.

### Import Sketches

This is optional in first pass but should be designed for.

#### Desired behavior

- support importing sketches by filename
- match filename to tile canonical name
- allow replacing an existing sketch with an imported PNG

This enables a roundtrip like:

- designer sketches in app
- artist redraws or cleans them externally
- app re-imports updated tile images for preview purposes

---

## 8.4 Side / Edge Tagging System

This is one of the most important systems.

Each side of a tile should support:

- one primary **edge tag**
- optional additional tags
- optional notes

Examples of edge tags:

- `flat`
- `wall_low`
- `wall_high`
- `cliff_outer`
- `road`
- `riverbank`
- `void`

For MVP, each side can simply store:

```ts
{
  primaryTag: string | null,
  extraTags: string[]
}
```

### Behavior

- if two sides have the same primary tag, the app may suggest them as compatible
- user can still manually override compatibility
- manual compatibility remains the source of truth if conflicts appear

---

## 8.5 Compatibility Authoring

Compatibility is authored **per side**.

Example:

- `tile_A.north` can connect to `tile_B.south`
- `tile_A.north` can connect to `tile_C.south`

### Requirements

- side-to-side compatibility matrix must be editable
- toggling compatibility should be simple and visual
- reciprocal relationships should be enforced automatically when appropriate
  - if `A.north -> B.south` is added, ensure the inverse relation is also recorded
- impossible side pairings should be visually dimmed, not hidden
- the user should be able to see all compatible candidates for the selected side
- support auto-suggest based on tags
- support “apply suggestions” action

### Validation warnings

- side has no compatible neighbors
- tile only matches itself on a side
- tile has no matches at all
- one-way mismatch exists
- tag suggests compatibility but no connection exists
- connection exists between mismatched tags

---

## 8.6 Rotation System

Rotations should be generated automatically in the logical layer.

### Requirements

- each base tile can optionally generate 0°, 90°, 180°, 270° variants
- rotations should remap side definitions correctly
- rotations should inherit sketch and asset references unless overridden
- rotated variants should have generated names

Suggested naming:

- `tile_name__rot0`
- `tile_name__rot90`
- `tile_name__rot180`
- `tile_name__rot270`

The UI should allow:

- enable/disable auto-rotation per tile
- optionally hide generated variants in the main tile library unless a toggle is on

Important: base tiles and generated rotated variants must be distinguishable.

---

## 8.7 Terrain Generation Preview

This is the second major feature after the tile editor.

The terrain preview should generate a grid using the authored compatibility data.

### MVP generation requirements

- configurable width and height
- seeded random generation
- first tile chosen randomly or optionally pinned
- each new cell must satisfy already-placed neighbors
- unresolved cells should remain visibly empty rather than causing crashes
- generation should be repeatable with the same seed

This should conceptually mirror the user's Blender script approach.

### Empty / failure handling

If no valid tile can be placed:

- leave the cell empty
- mark it visually as unresolved / hole
- count it in validation stats

### Controls

- width
- height
- seed
- regenerate
- clear
- pin starting tile optional
- filter tile pool optional

---

## 8.8 Terrain Display Modes

The terrain preview tab must support **three visual modes**:

### 1. Sketch mode
- each tile cell shows the internal 64x64 sketch
- useful early in planning

### 2. Uploaded 2D mode
- each tile cell shows the matched uploaded 2D image asset
- useful for final 2D tilesets

### 3. Uploaded 3D mode
- Babylon.js scene renders actual matched uploaded 3D tile assets
- useful for 3D modular kits

This mode-switching is a core product requirement.

---

## 8.9 Batch Upload: 2D Assets

The terrain preview tab should support batch upload of final 2D tile images.

### Requirements

- accept multiple image files
- supported formats: png, jpg, webp
- match files to tiles by filename
- report unmatched files
- report tiles with missing files
- allow replacing existing uploaded assets
- show assignment summary

### Name matching behavior

Filename without extension should match tile canonical name.

Example:

- `grass_corner.png` matches tile `grass_corner`

Rotations may be handled in one of two acceptable ways:

1. upload only base tile art and rotate in preview if appropriate
2. upload explicit rotated files if needed

Prefer option 1 for MVP unless there is a strong reason not to.

---

## 8.10 Batch Upload: 3D Assets

The terrain preview tab should support batch upload of final 3D tile assets.

### Requirements

- accept multiple 3D files
- start with `.glb` support first
- match files to tiles by filename
- report unmatched files
- report tiles with missing files
- allow replacing existing uploaded assets
- show assignment summary

### 3D Preview Requirements

- use Babylon.js to load GLB models
- instantiate models efficiently in a grid
- support camera orbit controls
- support lighting and simple ground/reference plane if useful
- unresolved cells should show placeholders

### Rotation behavior

- apply logical tile rotation to the instance transform
- do not require separate uploaded rotated files for MVP

---

## 8.11 Validation and Warnings

The app should surface problems clearly.

### Tile-level warnings

- missing sketch
- missing side tags
- side has no connections
- canonical name duplicated
- uploaded asset name mismatch

### Terrain-level warnings

- unresolved cells / holes
- tiles never used during generation
- tiles overused heavily relative to others
- disconnected compatibility islands if detectable

### Upload-level warnings

- uploaded file with no matching tile
- tile with no matching uploaded asset
- duplicate file for same tile

---

## 8.12 Import / Export

### Export JSON requirements

The app must export a project JSON containing:

- project metadata
- tile definitions
- side tags
- compatibility data
- sketch data
- upload references / logical assignments
- generation settings

### Import JSON requirements

- load a saved project fully
- validate shape before loading
- show errors if malformed

---

## 9. Suggested Data Model

```ts
export type Side = 'north' | 'east' | 'south' | 'west';

export interface SideDefinition {
  primaryTag: string | null;
  extraTags: string[];
  notes?: string;
}

export interface CompatibilityRef {
  tileId: string;
  side: Side;
}

export interface TileAsset2D {
  filename: string;
  objectUrl?: string;
}

export interface TileAsset3D {
  filename: string;
  objectUrl?: string;
}

export interface TileRotationConfig {
  enabled: boolean;
  generate90: boolean;
  generate180: boolean;
  generate270: boolean;
}

export interface TileSketch {
  width: 64;
  height: 64;
  palette: string[];
  pixels: number[];
}

export interface TileDefinition {
  id: string;
  name: string;
  canonicalName: string;
  notes?: string;
  categories: string[];
  sketch: TileSketch;
  sides: Record<Side, SideDefinition>;
  compatibility: Record<Side, CompatibilityRef[]>;
  rotation: TileRotationConfig;
  asset2D?: TileAsset2D;
  asset3D?: TileAsset3D;
}

export interface TerrainSettings {
  width: number;
  height: number;
  seed: string;
  renderMode: 'sketch' | 'asset2d' | 'asset3d';
}

export interface TilesetProject {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  tiles: TileDefinition[];
  terrain: TerrainSettings;
}
```

### Important implementation note

Generated rotated variants do **not** have to be stored permanently in project JSON at first. They can be derived at runtime from base tiles.

---

## 10. Terrain Generation Algorithm

Keep the MVP algorithm simple and reliable.

### Minimum viable approach

Use a grid-fill algorithm similar in spirit to the Blender script:

1. start with empty grid
2. place an initial tile
3. maintain a queue of unresolved neighboring cells
4. for each unresolved cell:
   - inspect already-placed neighbors
   - compute the intersection of valid tiles for all relevant sides
   - choose one candidate randomly using seed
   - if no candidate exists, leave the cell unresolved

This mirrors the user's current Blender script logic closely enough for MVP.

### Do not over-engineer initially

Do **not** start with a full WFC implementation unless it is genuinely simple in the codebase.

Reliable, understandable generation is more important than algorithm prestige.

---

## 11. Babylon.js Requirements

Babylon.js is required mainly for the 3D terrain preview tab.

### Requirements

- reusable `<BabylonTerrainPreview />` component
- create scene, engine, camera, and lights cleanly
- dispose resources correctly on unmount
- load GLB files dynamically
- instance or clone models efficiently
- rotate instances according to logical tile rotation
- show fallback boxes/placeholders for missing 3D assets

### Nice-to-have

- hover highlight on tile cell
- click cell to inspect placed tile
- orbit camera reset button

---

## 12. UX Details

### Must-feel-good interactions

- selecting a tile should be immediate
- sketch updates should reflect in thumbnails live
- selecting a side should clearly highlight it on the tile
- compatible candidate sides should be easy to scan visually
- generation failures should be obvious but not alarming
- asset upload results should be understandable at a glance
- export actions for sketches should be easy to discover

### Side selection visualization

In the tile workspace, show a simple square tile preview with clickable side hotspots:

- top = north
- right = east
- bottom = south
- left = west

This should be used for side selection and editing.

### Hover tooltip recommendation

When hovering a tile anywhere in the app, show a tooltip or hover card containing:

- sketch preview
- tile name
- north/east/south/west side tags

This is not mandatory in first pass but is strongly recommended because it significantly improves scanability.

---

## 13. Suggested Project Structure

```txt
src/
  app/
    router.tsx
    store.ts
  components/
    layout/
    tiles/
    pixel-editor/
    compatibility/
    terrain/
    upload/
    export/
    common/
  features/
    tiles/
    compatibility/
    generation/
    assets/
    project-io/
    sketch-export/
  lib/
    generation/
    rotation/
    validation/
    naming/
    babylon/
    sketch/
    export/
    storage/
  pages/
    TilesetEditorPage.tsx
    TerrainPreviewPage.tsx
  types/
    project.ts
  styles/
    theme.css
```

---

## 14. State Management Expectations

Use Zustand for central project state.

Suggested slices:

- project slice
- tile selection slice
- generation slice
- upload slice
- export slice
- UI preferences slice

State should support:

- undoable tile editing later if practical
- import/export serialization
- derived runtime rotated tile variants

---

## 15. Validation Rules to Implement Early

Implement these early because they shape the UX:

1. no duplicate canonical names
2. no side left completely undefined without warning
3. compatibility refs must point to real tiles
4. reciprocal compatibility should be normalized
5. uploaded filenames should map deterministically
6. generation settings must be clamped to safe ranges

Suggested safe generation limits for MVP:

- width: 1 to 64
- height: 1 to 64

---

## 16. Export Formats

### Main project export
`project-name.tileset.json`

### Optional derived export
Also support exporting a simplified adjacency file for Blender-side use later.

Suggested shape:

```json
{
  "tiles": {
    "grass_corner": {
      "north": ["grass_straight:south", "grass_corner:south"],
      "east": ["cliff_outer:west"]
    }
  }
}
```

This derived file is optional in the first pass but desirable.

### Sketch export formats

Support these exports prominently:

- `{tileName}.png`
- `{tileName}.json`
- `tile_sketch_atlas.png`
- `tileset-package.zip`

---

## 17. Development Priorities

Build in this order:

### Phase 1
- app shell
- state model
- tile library CRUD
- pixel editor
- side editor
- single tile sketch export

### Phase 2
- compatibility UI
- auto-suggest by tags
- validation warnings
- export all sketches
- sketch atlas export

### Phase 3
- grid generation
- sketch-mode terrain preview
- tileset package export

### Phase 4
- 2D batch upload and 2D terrain rendering

### Phase 5
- Babylon.js 3D terrain preview with GLB upload

### Phase 6
- import/export polish
- rotated variant polish
- UI theme refinement
- sketch + metadata sidecar export

---

## 18. Acceptance Criteria

The MVP is successful if the user can:

1. create several tiles
2. sketch them visually in-app
3. assign side tags
4. define or auto-suggest compatibility
5. generate a terrain preview from those rules
6. clearly see unresolved holes
7. batch upload 2D assets and preview terrain using them
8. batch upload 3D GLB assets and preview terrain using them in Babylon.js
9. switch terrain rendering between sketch / 2D / 3D modes
10. export the project as JSON and reload it later
11. export an individual tile sketch as a PNG
12. export all tile sketches in one action
13. export a sketch atlas / reference sheet
14. export a package that an artist can use as a tileset design reference

---

## 19. Non-Goals / Guardrails for Codex

When implementing this app, do **not**:

- overcomplicate the generation algorithm at the beginning
- start by building Blender integration inside the web app
- build mesh repair tools yet
- build UV tools yet
- introduce unnecessary backend dependencies
- require a server for MVP

This should be a **local-first front-end application**.

---

## 20. Future Extensions (Not MVP, but Design for Them)

The architecture should not block these later:

- Blender addon import/export integration
- geometric border validation against intended edge rules
- material/texel-density validation
- support for top/bottom vertical sides in 3D
- weighted tile frequencies
- biome/category filters
- smarter generation algorithms
- side-profile presets and reusable edge archetype libraries
- artist handoff packages
- sketch import replacement workflow

---

## 21. Final Build Intent

This product should feel like a **universal modular tileset planner**.

It should be useful even before final art exists.

It should let a designer sketch and reason about a tileset, define how pieces connect, preview the generated world, then swap in real 2D or 3D assets later without changing the underlying logic.

That universality is part of the value of the tool and should be preserved in the implementation.

A key part of that value is that the app does not only help with generation logic. It also acts as a **communication layer between designer and artist**, with sketch exports and packaged metadata serving as a practical handoff format.
