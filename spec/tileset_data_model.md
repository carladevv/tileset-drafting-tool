# Tileset Planner --- Data Model

This document defines the core data model for the new
semantic-grid-based tileset planner.

The model is designed for the MVP and intentionally keeps the source of
truth simple:

-   each tile owns a **6x6 semantic cell grid**
-   each cell points to a **CellLabel**
-   border arrays are **derived**
-   compatibility is **computed**
-   optional tile images are used for preview
-   the model is designed to expand later into **detail asset
    placement**

------------------------------------------------------------------------

## Design Principles

-   semantic grid is the source of truth
-   border data is derived, never hand-authored
-   compatibility is computed, never manually authored
-   preview assets are optional overlays, not structural data
-   the model must support future procedural detail placement
-   all ids should be stable and serializable

------------------------------------------------------------------------

# Core Entities

## Project

Represents the full saved tileset project.

``` ts
type Project = {
  id: string;
  name: string;
  version: string;

  gridSize: 6;

  cellLabels: CellLabel[];
  tiles: Tile[];

  settings: ProjectSettings;
};
```

### Notes

-   `gridSize` is fixed to `6` for MVP.
-   Future versions may allow other sizes, but the MVP assumes 6x6
    everywhere.

------------------------------------------------------------------------

## ProjectSettings

``` ts
type ProjectSettings = {
  previewMode: "semantic" | "image";
  defaultTileImageSize: number | null;
  generationSeed: number | null;
  generationWidth: number;
  generationHeight: number;
};
```

### Notes

-   `previewMode` controls whether terrain preview prefers semantic
    rendering or associated tile images.
-   `defaultTileImageSize` is optional metadata for imported square tile
    images.
-   generation settings are included here because they apply to the
    project globally.

------------------------------------------------------------------------

## CellLabel

A semantic label that can be painted into tile cells.

``` ts
type CellLabel = {
  id: string;
  name: string;
  color: string;

  detailBehavior?: CellDetailBehavior;
  tags?: string[];
};
```

### Required fields

-   `id`: stable unique identifier
-   `name`: human-readable name like `grass`, `river`, `sand`
-   `color`: UI/editor color, hex string

### Optional fields

-   `detailBehavior`: future-facing metadata for procedural detail
    placement
-   `tags`: optional semantic grouping like `["nature", "walkable"]`

------------------------------------------------------------------------

## CellDetailBehavior

This is the key expansion point for future detail assets.

``` ts
type CellDetailBehavior = {
  allowDetailPlacement: boolean;

  detailCategories?: string[];
  densityWeight?: number;
  blocking?: boolean;
  spawnPriority?: number;
};
```

### Purpose

This allows a cell label to later participate in procedural detail
systems.

Examples: - `grass` may allow `flowers`, `rocks`, `bushes` - `water` may
allow `reeds`, `ripples`, `boats` - `road` may allow `signs`,
`cart_tracks` - `wall` may block detail placement

### Why it matters

This means the MVP data model is already expandable toward: - random
decorative placement - category-based spawning - density tuning -
blocking behavior

So yes: **the model is intentionally expandable for later detail
assets**.

------------------------------------------------------------------------

## Tile

A tile definition.

``` ts
type Tile = {
  id: string;
  name: string;

  grid: TileGrid;

  allowRotations: boolean;

  imageAsset?: TileImageAsset | null;

  metadata?: TileMetadata;
};
```

### Notes

-   `grid` is the real structural data.
-   `imageAsset` is optional and only affects preview.
-   `allowRotations` controls whether logical rotated variants are
    considered during compatibility/generation.

------------------------------------------------------------------------

## TileMetadata

``` ts
type TileMetadata = {
  notes?: string;
  category?: string;
  tags?: string[];
};
```

### Purpose

Optional organizational metadata for filtering and future editor
tooling.

------------------------------------------------------------------------

## TileGrid

A fixed 6x6 matrix of cell label ids.

``` ts
type TileGrid = CellLabelId[][];
type CellLabelId = string;
```

### Constraints

-   must be exactly 6 rows
-   each row must be exactly 6 columns
-   every cell value must reference a valid `CellLabel.id`

Example:

``` ts
const riverStraight: TileGrid = [
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
  ["grass", "grass", "river", "river", "grass", "grass"],
];
```

------------------------------------------------------------------------

## TileImageAsset

Optional square image associated with a tile.

``` ts
type TileImageAsset = {
  id: string;
  filename: string;
  mimeType: string;

  width: number;
  height: number;

  dataUrl: string;
};
```

### Notes

-   image is optional
-   MVP assumes square image association
-   if no image exists, preview falls back to semantic rendering from
    the cell grid

------------------------------------------------------------------------

# Derived Entities

These are computed from source data and should not be manually edited.

## TileBorders

``` ts
type TileBorders = {
  north: BorderArray;
  east: BorderArray;
  south: BorderArray;
  west: BorderArray;
};

type BorderArray = CellLabelId[];
```

### Derivation rules

For a 6x6 grid:

-   `north` = row `0`
-   `south` = row `5`
-   `west` = first column
-   `east` = last column

Example:

``` ts
type BorderExample = {
  north: ["grass", "grass", "river", "river", "grass", "grass"];
  east: ["grass", "grass", "grass", "grass", "grass", "grass"];
  south: ["grass", "grass", "river", "river", "grass", "grass"];
  west: ["grass", "grass", "grass", "grass", "grass", "grass"];
};
```

------------------------------------------------------------------------

## RotatedTileView

A logical rotated representation of a tile.

``` ts
type RotatedTileView = {
  baseTileId: string;
  rotation: 0 | 90 | 180 | 270;

  rotatedGrid: TileGrid;
  borders: TileBorders;
};
```

### Notes

-   rotated variants do not need to be persisted as full tiles in MVP
-   they can be generated on demand
-   compatibility may use these logical rotated views when
    `allowRotations` is true

------------------------------------------------------------------------

## CompatibilityMatch

Represents a computed valid connection.

``` ts
type CompatibilityMatch = {
  sourceTileId: string;
  sourceSide: TileSide;

  targetTileId: string;
  targetSide: TileSide;

  targetRotation: 0 | 90 | 180 | 270;
};
```

``` ts
type TileSide = "north" | "east" | "south" | "west";
```

### Notes

-   this is derived data
-   in MVP, a match exists if opposite border arrays are identical
-   source and target sides must be opposite sides in placement logic

------------------------------------------------------------------------

## CompatibilityGraph

``` ts
type CompatibilityGraph = {
  byTileId: Record<string, TileCompatibility>;
};
```

``` ts
type TileCompatibility = {
  north: CompatibilityMatch[];
  east: CompatibilityMatch[];
  south: CompatibilityMatch[];
  west: CompatibilityMatch[];
};
```

### Purpose

Allows terrain generation and UI inspection to quickly answer: - what
can connect to this side - are there zero-match sides - do rotated
variants create more options

------------------------------------------------------------------------

# Terrain Generation Entities

## GeneratedCell

A single slot in the terrain preview output.

``` ts
type GeneratedCell = {
  x: number;
  y: number;

  tileId: string | null;
  rotation: 0 | 90 | 180 | 270;

  status: "placed" | "empty" | "invalid";
};
```

### Notes

-   `empty` allows holes to be represented safely in MVP
-   `invalid` can be used for debugging failed placements

------------------------------------------------------------------------

## GeneratedTerrain

``` ts
type GeneratedTerrain = {
  width: number;
  height: number;
  seed: number | null;

  cells: GeneratedCell[][];
};
```

------------------------------------------------------------------------

# Validation Model

## ValidationIssue

``` ts
type ValidationIssue = {
  id: string;
  severity: "error" | "warning" | "info";

  scope: "project" | "tile" | "cellLabel" | "generation";

  message: string;

  tileId?: string;
  cellLabelId?: string;
};
```

### Typical examples

-   tile name missing
-   tile grid has invalid dimensions
-   tile references undefined cell label
-   tile side has zero compatible neighbors
-   associated image is not square

------------------------------------------------------------------------

# Future Detail Asset Expansion

The current model is designed to grow into a detail-placement system
without needing a rewrite.

## DetailAssetDefinition

This is not required for MVP, but the current model is designed to
support it later.

``` ts
type DetailAssetDefinition = {
  id: string;
  name: string;

  category: string;

  allowedCellLabelIds: string[];

  weight: number;

  imageAsset?: {
    id: string;
    filename: string;
    dataUrl: string;
  };
};
```

### Example

A `flower_patch` detail may be allowed on: - `grass` - `meadow`

A `boat` detail may be allowed on: - `water`

------------------------------------------------------------------------

## DetailPlacementRule

``` ts
type DetailPlacementRule = {
  id: string;
  category: string;

  allowedCellLabelIds: string[];
  density: number;
  minDistance?: number;
  maxPerTile?: number;
};
```

### Why the current model supports this

Because each tile already stores interior semantic cells, the system can
later: - inspect all 36 cells - find cells with matching labels - place
random details in valid positions - respect per-label behavior and
density

This is the main reason the 6x6 semantic grid is much stronger than a
side-only system.

------------------------------------------------------------------------

# Persistence Rules

## Persisted

The following should be saved in project JSON: - project identity -
settings - cell labels - tiles - tile grids - tile image assets -
metadata

## Derived at runtime

The following should be recomputed: - tile borders - rotated tile
views - compatibility graph - validation summaries - terrain preview
results

This separation keeps saved files simpler and avoids stale computed
data.

------------------------------------------------------------------------

# Recommended Naming Rules

## Cell labels

Use lowercase stable ids: - `grass` - `river` - `sand` - `road` - `wall`

## Tiles

Use stable descriptive names: - `river_straight` - `river_bend` -
`road_crossing` - `shore_corner`

Consistent naming is especially important for future batch image import.

------------------------------------------------------------------------

# Minimal Example Project

``` ts
const project: Project = {
  id: "project_1",
  name: "Starter Tileset",
  version: "1.0.0",
  gridSize: 6,
  settings: {
    previewMode: "semantic",
    defaultTileImageSize: 256,
    generationSeed: 1234,
    generationWidth: 12,
    generationHeight: 12,
  },
  cellLabels: [
    {
      id: "grass",
      name: "Grass",
      color: "#5fbf5f",
      detailBehavior: {
        allowDetailPlacement: true,
        detailCategories: ["flowers", "rocks"],
        densityWeight: 0.7,
      },
    },
    {
      id: "river",
      name: "River",
      color: "#4aa3ff",
      detailBehavior: {
        allowDetailPlacement: true,
        detailCategories: ["ripples", "boats"],
        densityWeight: 0.25,
      },
    },
  ],
  tiles: [
    {
      id: "tile_river_straight",
      name: "river_straight",
      allowRotations: true,
      grid: [
        ["grass", "grass", "river", "river", "grass", "grass"],
        ["grass", "grass", "river", "river", "grass", "grass"],
        ["grass", "grass", "river", "river", "grass", "grass"],
        ["grass", "grass", "river", "river", "grass", "grass"],
        ["grass", "grass", "river", "river", "grass", "grass"],
        ["grass", "grass", "river", "river", "grass", "grass"],
      ],
    },
  ],
};
```

------------------------------------------------------------------------

# Summary

The MVP source of truth is:

-   `CellLabel`
-   `Tile.grid`
-   optional `Tile.imageAsset`

Everything else is derived from that.

And yes: this model is intentionally expandable so you can later add
**random detail assets placed into valid semantic cell types** without
replacing the core architecture.
