# Tileset Planner MVP — Delivery Stages and Testable Aspects

This document breaks the MVP into smaller, testable implementation stages. Each stage is meant to produce a working slice that can be manually verified and, where practical, covered by automated tests.

---

## Stage 1 — Tiles, Sketching, and Side Tags

### Goal
Establish the core data model and editor loop:
- create tiles
- rename/delete/duplicate tiles
- sketch each tile in a 64x64 pixel editor
- assign side tags on north/east/south/west
- persist the tileset locally
- export a single tile sketch and tile metadata

### Why first
This is the foundation for everything else. If this stage feels good, the rest of the app has a solid center of gravity.

### Testable aspects
- tile CRUD works reliably
- selected tile state is stable across edits
- sketch pixels persist correctly after refresh
- side tags save and reload correctly
- export generates the expected file names and contents
- image preview remains pixelated and readable at large scale
- duplicate tile copies sketch and metadata but gets a new id
- validation flags missing tile name or missing side tags

---

## Stage 2 — Compatibility Authoring and Auto-Suggestions

### Goal
Add the compatibility layer:
- compatibility data between tile sides
- manual connect/disconnect UI
- auto-suggestions based on side tags
- reciprocal connection checks
- warnings for sides with no matches

### Testable aspects
- connecting A:east to B:west creates the expected data entry
- reciprocal rules are handled correctly
- tag-based suggestions are deterministic
- incompatible sides are visibly de-emphasized
- warnings appear for isolated or one-way connections
- connection list updates immediately after edits

---

## Stage 3 — Terrain Preview in Sketch Mode

### Goal
Generate a terrain preview using the logical adjacency graph and show it using the in-app sketches.

### Testable aspects
- preview grid renders with selected dimensions
- generator only places compatible neighbors
- unsatisfied cells are shown as holes / warnings instead of crashing
- regeneration with the same seed gives the same result
- clicking a generated tile reveals its source tile name and side data
- preview performance is acceptable for MVP grid sizes

---

## Stage 4 — Rotation System

### Goal
Support automatic logical rotation variants and reflect them in editing and preview.

### Testable aspects
- rotating a tile remaps side tags correctly
- generated rotated variants get predictable names
- compatibility updates correctly for rotated variants
- user can disable rotation generation per tile
- preview can use rotated variants when enabled

---

## Stage 5 — Import/Export Package and Sketch Atlas

### Goal
Make the tool portable and useful as a handoff artifact.

### Testable aspects
- export all sketches creates one file per tile
- atlas export includes tile name and side-tag labels
- tileset package export includes metadata JSON, sketches, and adjacency data
- importing exported JSON restores the same tileset state
- exported images preserve pixel-perfect scaling with no smoothing

---

## Stage 6 — Batch Upload of Final 2D Assets

### Goal
Allow artists’ final 2D tiles to be imported and matched by tile name.

### Testable aspects
- batch upload matches files by filename to tile names
- unmatched filenames are reported clearly
- missing expected assets are reported clearly
- terrain preview can switch between sketch and uploaded 2D mode
- 2D mode falls back gracefully when an image is missing

---

## Stage 7 — Batch Upload of Final 3D Assets

### Goal
Allow final 3D tiles to be imported and previewed in Babylon.js.

### Testable aspects
- batch upload accepts supported 3D formats for MVP
- files match tile names correctly
- Babylon preview loads models without breaking the app
- terrain preview can switch between sketch / 2D / 3D modes
- missing or failed models show clear placeholders and diagnostics

---

## Stage 8 — Validation and Review Layer

### Goal
Add quality-of-life validation to prepare for a Blender-side validation pipeline.

### Testable aspects
- validation panel summarizes issues by tile
- tiles with missing side tags or missing assets are flagged
- tiles with no valid outgoing connections are flagged
- package export includes enough metadata for downstream validation
- naming contract is enforced consistently across sketches, 2D assets, and 3D assets

---

## Recommended implementation order
1. Stage 1
2. Stage 2
3. Stage 3
4. Stage 5
5. Stage 4
6. Stage 6
7. Stage 7
8. Stage 8

Stage 5 is placed early because export/import will greatly help iteration and safeguard progress while later stages are being built.
