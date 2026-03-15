# Tileset Planner MVP — Delivery Stages and Testable Aspects

This document breaks the MVP into smaller, testable implementation stages. Each stage is meant to produce a working slice that can be manually verified and, where practical, covered by automated tests.

This plan replaces the earlier approach based on 64x64 sketching and per-side tags, while keeping the same staged-document format as the previous file. The old stages file was centered on freehand sketching, side tags, computed side compatibility, terrain preview, rotation, import/export, 2D/3D uploads, and validation. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

---

## Stage 1 — Tiles, Cell Palette, and 6x6 Semantic Grid Editor

### Goal
Establish the new core data model and editor loop:
- create tiles
- rename/delete/duplicate tiles
- define a cell-label palette
- assign a color to each cell label
- paint each tile on a 6x6 grid using those labels
- persist the tileset locally

### Why first
This is the true foundation of the new system. The semantic 6x6 grid is now the source of truth for compatibility and later generation, instead of side tags or freehand sketch pixels.

### Testable aspects
- tile CRUD works reliably
- cell-label palette CRUD works reliably
- each tile stores a 6x6 grid of cell labels
- painting cells updates the selected tile immediately
- selected tile state is stable across edits
- tile data persists correctly after refresh
- duplicate tile copies the 6x6 cell layout but gets a new id
- validation flags missing tile name
- validation flags tiles containing undefined cell labels
- painted cells render with the correct palette colors

---

## Stage 2 — Derived Border Arrays and Computed Compatibility

### Goal
Turn the painted 6x6 semantic grid into automatically computed compatibility results.

This stage introduces:
- border extraction from the 6x6 grid
- compatibility computation derived from border arrays
- deterministic match rules
- compatibility previews per tile side
- warnings for sides with zero matches

Connections are NOT manually authored.  
Compatibility must be computed automatically from the tile’s painted cell data.

### Functionality added
- derive north/east/south/west border arrays from each tile
- compute compatible sides across all tiles
- recompute compatibility whenever cell data changes
- display compatibility results in the tile inspector
- detect and warn about sides with zero valid matches

### Border model
Each tile side is derived automatically from the 6x6 grid:

- north = top row
- east = right column
- south = bottom row
- west = left column

Example:

north:
[grass, grass, river, river, grass, grass]

### Compatibility rule (MVP)
Two opposite sides match if their label arrays are identical.

Example:

[grass, grass, river, river, grass, grass]
matches
[grass, grass, river, river, grass, grass]

### UI additions
Tile inspector must now show:

For each side:
- derived border array
- number of compatible matches
- computed list of compatible tiles
- warning indicators if matches are zero

Compatibility results should include:
- tile name
- matching side

Non-matching tiles should be visually de-emphasized.

### Testable aspects
- border arrays are derived correctly from the 6x6 grid
- changing a border cell recomputes compatibility immediately
- identical opposite border arrays match correctly
- non-identical border arrays do not match
- sides with zero valid matches show warnings
- compatibility results remain stable across reloads

---

## Stage 3 — Rotation System

### Goal
Support automatic logical rotation variants and reflect them in compatibility and preview.

### Testable aspects
- rotating a tile rotates the full 6x6 cell grid correctly
- rotated border arrays are derived correctly
- generated rotated variants get predictable names
- compatibility updates correctly for rotated variants
- user can disable rotation generation per tile
- compatibility results can include rotated variants when enabled

---

## Stage 4 — Terrain Generation Preview in Semantic Grid Mode

### Goal
Generate a terrain preview using the computed compatibility graph and display it using the 6x6 semantic cell grids so artists can quickly inspect how a tileset reads visually at map scale.

### Why here
The current Blender workflow already depends on building an adjacency index and then generating terrain from valid neighbors, with optional rotation generation. This stage mirrors that logic in a 2D MVP form. :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}

### Testable aspects
- preview grid renders with selected dimensions
- generator only places compatible neighbors
- preview remains useful for visual inspection even when some cells cannot be filled
- regeneration with the same seed gives the same result
- clicking a generated tile reveals its source tile name and border arrays
- preview performance is acceptable for MVP grid sizes

---

## Stage 5 — Single Tile Image Association and Preview Fallback

### Goal
Allow each tile to optionally have a square image associated with it for generation preview.

If a tile has an associated image, preview can render that image.  
If a tile has no associated image, preview falls back to rendering the painted semantic 6x6 grid.

### Testable aspects
- a square image can be assigned to a tile
- assigned image persists correctly after reload
- tile preview uses the associated image when present
- tile preview falls back to semantic grid rendering when no image is present
- non-square images are rejected or normalized according to the spec
- removing an associated image restores fallback behavior

---

## Stage 6 — Import/Export Package and Semantic Atlas

### Goal
Make the tool portable and useful as a handoff artifact.

Exports should focus on the new semantic system:
- tileset JSON
- cell-label palette
- tile 6x6 cell layouts
- derived compatibility data
- optional associated tile images
- semantic atlas / reference sheet

### Testable aspects
- export includes palette definitions and colors
- export includes tile cell layouts
- export includes computed adjacency data
- importing exported JSON restores the same tileset state
- semantic atlas includes tile name and readable 6x6 semantic preview
- exported images preserve crisp pixel edges with no smoothing

---

## Stage 7 — Batch Upload of Final 2D Tile Images

### Goal
Allow artists’ final 2D tile images to be imported and matched by tile name.

This stage extends the single-image association flow into a batch workflow.

### Testable aspects
- batch upload matches files by filename to tile names
- unmatched filenames are reported clearly
- missing expected images are reported clearly
- terrain preview can switch between semantic-grid mode and uploaded-image mode
- uploaded-image mode falls back gracefully when an image is missing
- re-uploading an image updates the correct tile without corrupting others

---

## Stage 8 — Cell Behavior Semantics Layer

### Goal
Add a lightweight behavior layer to cell labels so the system can support not only top-down terrain, but also more directional and gameplay-relevant tilesets such as platformers.

This stage does not change compatibility rules.  
Compatibility must still be computed from border label arrays exactly as before.

Instead, this stage adds semantic meaning to the cell labels so they can later support:

- detail placement rules
- gameplay-aware tile semantics
- broader tileset types beyond top-down terrain

### Functionality added
- extend `CellLabel` with an optional `behaviorType` field
- allow editing `behaviorType` in the palette / label editor
- persist `behaviorType` in project data
- expose behavior information in tile and label inspection UI
- allow generated terrain preview to inspect cell behavior values
- prepare the data model for later detail placement rules

### Behavior model

Each `CellLabel` may now include:

```ts
behaviorType?: "empty" | "walkable" | "solid" | "platform" | "liquid" | "hazard" | "climbable"

---

## Stage 9 — Detail Semantics Layer

### Goal
Prepare the system for future procedural detail placement by making internal cell labels meaningful, not just border data.

This stage does not yet place final art details. It defines and validates the semantic groundwork for them.

### Functionality added
- allow certain cell labels to be marked as detail-capable
- define optional metadata on cell labels for later decoration categories
- preview detail candidate cells in the tile editor and generated terrain
- expose which generated tiles contain valid cells for future detail placement

### Why this matters
Your Blender workflow already includes a later detail-placement phase driven by semantic cues on generated terrain. This stage prepares the 2D planner to carry similar intent forward. :contentReference[oaicite:4]{index=4}

### Testable aspects
- a cell label can be marked as detail-capable
- cell-label metadata persists correctly
- detail-capable cells are highlighted in the tile editor
- generated terrain can visualize detail-capable cells
- changing a cell label updates detail previews immediately
