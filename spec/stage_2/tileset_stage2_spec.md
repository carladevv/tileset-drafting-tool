# Stage 2 Specification --- Derived Border Arrays and Computed Compatibility

## Purpose

Stage 2 turns the painted 6x6 semantic grid into computed tile
compatibility.

This stage introduces:

-   derived border arrays
-   automatic compatibility computation
-   compatibility preview in the tile inspector
-   warnings for sides with zero valid matches

Connections are not manually authored. Compatibility must be derived
automatically from tile cell data.

This stage builds directly on the Stage 1 editor and the semantic-grid
data model.

------------------------------------------------------------------------

# Dependencies

This stage must follow:

-   `tileset_data_model.md`
-   `tileset_stages.md`
-   `tileset_tech_stack_v2.md`
-   `tileset_ui_style.md`
-   `tileset_editor_architecture.md`

Relevant data structures:

-   `Tile`
-   `TileGrid`
-   `TileBorders`
-   `CompatibilityMatch`
-   `CompatibilityGraph`
-   `ValidationIssue`

------------------------------------------------------------------------

# Core Features

## Border Derivation

Each tile must derive four border arrays from its 6x6 grid.

Rules:

-   north = row 0
-   east = column 5
-   south = row 5
-   west = column 0

Example:

``` ts
grid = [
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
]

north = ["grass", "grass", "river", "river", "grass", "grass"]
east  = ["grass", "grass", "grass", "grass", "grass", "grass"]
south = ["grass", "grass", "river", "river", "grass", "grass"]
west  = ["grass", "grass", "grass", "grass", "grass", "grass"]
```

Border arrays are derived data and must not be persisted.

------------------------------------------------------------------------

## Compatibility Rule

MVP compatibility rule:

Two sides are compatible if:

-   they are opposite placement sides
-   their border arrays are identical

Examples:

-   source east may match target west
-   source north may match target south

Invalid examples:

-   source east must not match target east
-   source north must not match target west

Example valid match:

``` ts
source.east = ["grass", "grass", "river", "river", "grass", "grass"]
target.west = ["grass", "grass", "river", "river", "grass", "grass"]
```

This produces one `CompatibilityMatch`.

------------------------------------------------------------------------

## Compatibility Graph

The application must compute a compatibility graph for all tiles.

Shape:

``` ts
type CompatibilityGraph = {
  byTileId: Record<string, {
    north: CompatibilityMatch[];
    east: CompatibilityMatch[];
    south: CompatibilityMatch[];
    west: CompatibilityMatch[];
  }>
}
```

For each tile side, the graph must list all compatible tiles and sides.

This graph is derived at runtime and must update whenever:

-   a tile grid changes
-   a tile is added
-   a tile is removed
-   a tile name changes only if UI display depends on name

------------------------------------------------------------------------

## Validation Rules

The system must generate warnings for:

-   any tile side with zero compatible matches
-   any tile with invalid grid dimensions
-   any tile referencing undefined cell labels

Validation issues should be visible in:

-   the tile inspector
-   the tile list

Severity guidance:

-   invalid grid dimensions: error
-   undefined label references: error
-   zero compatible matches on a side: warning

------------------------------------------------------------------------

# UI Requirements

## Tile Inspector Additions

The tile inspector must show derived compatibility information for the
selected tile.

For each side:

-   derived border array
-   number of compatible matches
-   list of matching tiles
-   matching side for each result
-   warning if no matches exist

Example layout:

``` text
North
[grass, grass, river, river, grass, grass]
Matches: 2
- river_straight south
- river_bend south

East
[grass, grass, grass, grass, grass, grass]
Matches: 0
Warning: no compatible tiles
```

------------------------------------------------------------------------

## Tile List Indicators

The tile list should show a warning marker when a tile has any side with
zero compatible matches.

This should be visually subtle but visible in the Stage 1 pixel UI
style.

Example:

-   tile name
-   small preview
-   warning icon if compatibility issues exist

------------------------------------------------------------------------

## Visual De-emphasis

In the compatibility section of the inspector:

-   matching tiles should be shown normally
-   non-matching tiles do not need a full browser yet
-   if a tile list of all project tiles is shown, non-matches should be
    visually de-emphasized

This is optional for MVP Stage 2 if the inspector already shows matches
clearly.

------------------------------------------------------------------------

# State Management

Derived compatibility should be computed from the canonical tile data in
the Zustand store.

Recommended approach:

-   store only source project data
-   compute borders and compatibility with selectors or utility
    functions
-   do not persist compatibility graph into localStorage

Possible store additions:

``` ts
selectedTileId: string | null

getTileBorders(tileId): TileBorders
getCompatibilityForTile(tileId): TileCompatibility
getValidationIssues(): ValidationIssue[]
```

Implementation may use pure helper functions outside the store.

------------------------------------------------------------------------

# Persistence

Persist only source data:

-   project metadata
-   cell labels
-   tiles
-   tile grids

Do not persist:

-   border arrays
-   compatibility graph
-   compatibility counts
-   validation summaries

These must be recomputed after reload.

------------------------------------------------------------------------

# Suggested Utility Functions

Recommended pure functions:

``` ts
deriveTileBorders(grid: TileGrid): TileBorders
arraysEqual(a: string[], b: string[]): boolean
isOppositeSide(a: TileSide, b: TileSide): boolean
computeCompatibilityGraph(tiles: Tile[]): CompatibilityGraph
computeValidationIssues(project: Project): ValidationIssue[]
```

These functions should be independently testable.

------------------------------------------------------------------------

# Out of Scope

The following must not be implemented in Stage 2:

-   logical rotation variants
-   terrain generation
-   image upload
-   import/export package
-   detail asset placement
-   advanced matching rules beyond exact array equality
-   manual compatibility authoring

Those belong to later stages.

------------------------------------------------------------------------

# Deliverable

Stage 2 is complete when the user can:

-   paint a tile in the existing editor
-   inspect the tile's derived north/east/south/west border arrays
-   see which other tiles are compatible on each side
-   see warnings for sides with zero matches
-   reload the project and get the same computed compatibility results
