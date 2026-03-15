# Stage 3 Specification --- Rotation System

## Purpose

Stage 3 introduces logical tile rotation variants and integrates them
into derived borders, computed compatibility, and preview inspection.

This stage builds on:

-   Stage 1 semantic 6x6 tile editing
-   Stage 2 derived border arrays and computed compatibility

Rotation is logical in this stage. The system rotates the semantic 6x6
grid and derives new borders from the rotated view. It does not yet
generate terrain and does not yet handle image rotation for final
preview assets.

------------------------------------------------------------------------

# Dependencies

This stage must follow:

-   `tileset_data_model.md`
-   `tileset_stages.md`
-   `tileset_tech_stack_v2.md`
-   `tileset_ui_style.md`
-   `tileset_editor_architecture.md`
-   `tileset_stage1_spec.md`
-   `tileset_stage2_spec_v2.md`

Relevant data structures:

-   `Tile`
-   `TileGrid`
-   `TileBorders`
-   `RotatedTileView`
-   `CompatibilityMatch`
-   `CompatibilityGraph`
-   `ValidationIssue`

------------------------------------------------------------------------

# Core Features

## Rotation Toggle Per Tile

Each tile already contains:

``` ts
allowRotations: boolean
```

Stage 3 must make this field active.

User must be able to:

-   enable rotations for a tile
-   disable rotations for a tile

Default behavior:

-   new tiles start with `allowRotations: true`

When `allowRotations` is false:

-   only the base rotation `0` is considered for compatibility

When `allowRotations` is true:

-   logical rotation variants `0`, `90`, `180`, and `270` are considered

------------------------------------------------------------------------

## Logical Rotation Model

Rotation variants are not persisted as separate tiles.

They are computed as logical views of a base tile.

Shape:

``` ts
type RotatedTileView = {
  baseTileId: string;
  rotation: 0 | 90 | 180 | 270;

  rotatedGrid: TileGrid;
  borders: TileBorders;
};
```

The application must compute rotated grids on demand.

------------------------------------------------------------------------

## Grid Rotation Rules

A 6x6 grid rotated clockwise by 90° must remap cell positions correctly.

Rule:

``` ts
rotated[x][y] = original[5 - y][x]
```

Equivalent conceptual behavior:

-   90° rotates clockwise
-   180° rotates twice
-   270° rotates three times clockwise

The rotated grid must preserve:

-   dimensions
-   cell label ids
-   exact relative structure after rotation

------------------------------------------------------------------------

## Rotated Border Derivation

Borders must be derived from the rotated grid, not from the original
grid plus manual remapping.

For every `RotatedTileView`:

-   north = rotated row 0
-   east = rotated column 5
-   south = rotated row 5
-   west = rotated column 0

This keeps border derivation consistent with Stage 2.

------------------------------------------------------------------------

## Rotation-Aware Compatibility

Stage 2 compatibility compared only base tile sides.

Stage 3 must extend this so compatibility may match against rotated tile
views.

Example:

-   source tile A east border matches
-   target tile B west border under rotation 90

This produces a compatibility result that includes:

-   target tile id
-   target side
-   target rotation

Example:

``` ts
{
  sourceTileId: "tile_a",
  sourceSide: "east",
  targetTileId: "tile_b",
  targetSide: "west",
  targetRotation: 90
}
```

Compatibility rule remains the same:

-   opposite sides only
-   border arrays must be identical

The only new behavior is that rotated target variants are considered
when `allowRotations` is true.

------------------------------------------------------------------------

## Duplicate Rotation Handling

Some tiles will produce identical rotated variants.

Example:

-   a fully symmetrical tile may look identical at 0, 90, 180, 270

The compatibility system must avoid duplicate compatibility entries.

If multiple rotations produce the same effective result, only one match
entry should be shown per unique tile + side + rotation combination.

Implementation may also collapse identical rotated views in UI if
desired, but the minimum requirement is:

-   no accidental duplicate spam in compatibility lists

------------------------------------------------------------------------

# UI Requirements

## Tile Inspector Rotation Controls

The tile inspector must expose:

-   tile name
-   `allowRotations` toggle

Example:

``` text
Rotations: Enabled
```

or

``` text
Rotations: Disabled
```

Changing this setting must recompute compatibility immediately.

------------------------------------------------------------------------

## Rotated Compatibility Results

The tile inspector compatibility section must now include rotation info
for matches where rotation is not `0`.

Example:

``` text
East
Matches: 3
- river_straight west
- river_bend west (rot 90)
- river_bend west (rot 270)
```

If the target rotation is `0`, rotation text may be omitted.

------------------------------------------------------------------------

## Rotated Preview Inspection

For the selected tile, the inspector should be able to show rotated
previews of the semantic grid.

Minimum requirement:

-   display tabs, buttons, or selectors for `0`, `90`, `180`, `270`
-   when a rotation is selected, show the rotated 6x6 semantic grid

This preview is for inspection only and does not replace the base tile
editor.

The main editor still edits the base tile grid.

------------------------------------------------------------------------

# State Management

Recommended pure functions:

``` ts
rotateGrid90(grid: TileGrid): TileGrid
rotateGrid180(grid: TileGrid): TileGrid
rotateGrid270(grid: TileGrid): TileGrid
getRotatedTileViews(tile: Tile): RotatedTileView[]
computeCompatibilityGraph(tiles: Tile[]): CompatibilityGraph
```

Rules:

-   source project data remains canonical
-   rotated variants are derived, not persisted
-   compatibility graph is recomputed from current tile data and
    rotation settings

------------------------------------------------------------------------

# Persistence

Persist:

-   `allowRotations` on each tile

Do not persist:

-   rotated grids
-   rotated borders
-   rotated compatibility results

These must be recomputed after reload.

------------------------------------------------------------------------

# Validation Rules

Stage 3 should add the following validation behavior:

-   no new error type is required just for rotation
-   compatibility warnings must reflect rotation-aware matching
-   if enabling rotations resolves a zero-match side, the warning should
    disappear
-   if disabling rotations causes a side to become unmatched, the
    warning should appear

This means validation remains derived from the final compatibility
graph.

------------------------------------------------------------------------

# Suggested Utility Functions

``` ts
rotateGrid(grid: TileGrid, rotation: 0 | 90 | 180 | 270): TileGrid
deriveTileBorders(grid: TileGrid): TileBorders
getTileRotations(tile: Tile): Array<0 | 90 | 180 | 270>
getRotatedTileViews(tile: Tile): RotatedTileView[]
computeCompatibilityGraph(tiles: Tile[]): CompatibilityGraph
dedupeCompatibilityMatches(matches: CompatibilityMatch[]): CompatibilityMatch[]
```

These should be independently testable.

------------------------------------------------------------------------

# Out of Scope

The following must not be implemented in Stage 3:

-   terrain generation
-   image asset rotation handling
-   batch image import
-   import/export package changes
-   detail asset placement
-   weighted rotation probabilities
-   manual rotation overrides in generation

Those belong to later stages.

------------------------------------------------------------------------

# Deliverable

Stage 3 is complete when the user can:

-   toggle rotations on a tile
-   inspect rotated semantic-grid variants
-   see compatibility results that include rotated matches
-   see compatibility warnings update when rotation settings change
-   reload the project and get the same rotation-aware compatibility
    results
