# Stage 4 Specification --- Terrain Generation Preview (Semantic Grid Mode)

## Purpose

Stage 4 introduces the first live terrain generation system.\
The system must use the compatibility graph created in Stage 2 and the
rotation system from Stage 3 to generate a valid terrain grid composed
of tiles.

The preview renders using the semantic 6×6 grids rather than images.

------------------------------------------------------------------------

# Dependencies

This stage builds on:

-   Stage 1 --- Tile editor
-   Stage 2 --- Border compatibility
-   Stage 3 --- Rotation system

Relevant structures:

-   Tile
-   TileGrid
-   CompatibilityGraph
-   RotatedTileView
-   GeneratedTerrain

------------------------------------------------------------------------

# Core Features

## Terrain Preview Grid

The system generates a rectangular tile grid.

Example:

width: 20\
height: 20

Each cell stores:

-   tileId
-   rotation
-   status

Status values:

-   placed
-   empty
-   invalid

------------------------------------------------------------------------

## Generation Algorithm (MVP)

The generator may use a simple forward placement algorithm:

1.  choose a starting tile
2.  iterate row by row
3.  for each cell:
    -   inspect already placed neighbors
    -   compute compatible candidates
    -   randomly choose from candidates

If no candidates exist, mark the cell empty.

------------------------------------------------------------------------

## Compatibility Enforcement

When placing tile (x,y):

Check neighbors:

north (x, y‑1)\
west (x‑1, y)

Candidate tiles must match compatibility rules on both sides.

Rotations must be considered.

------------------------------------------------------------------------

## Candidate Selection

Candidates consist of:

tiles × valid rotations

Filtered by compatibility rules.

Selection may be random using the generation seed.

------------------------------------------------------------------------

## Handling Unsatisfied Cells

If no candidate exists:

-   mark the cell empty
-   continue generation

The generator must never crash.

------------------------------------------------------------------------

# Rendering

Each tile renders as a scaled semantic 6×6 grid using cell colors.

Recommended tile preview size:

48px -- 96px

Rendering must respect tile rotation.

------------------------------------------------------------------------

# Preview Interaction

The UI must allow:

-   Generate button
-   width control
-   height control
-   seed control

Example controls:

width: 20\
height: 20\
seed: 1234

\[Generate\]

------------------------------------------------------------------------

## Tile Inspection

Clicking a generated tile shows:

-   tile name
-   rotation
-   grid coordinates
-   border arrays

------------------------------------------------------------------------

# State Management

Store preview settings:

-   generationWidth
-   generationHeight
-   generationSeed

Generated terrain itself should not be persisted.

------------------------------------------------------------------------

# Persistence

Persist:

-   generationWidth
-   generationHeight
-   generationSeed

Do not persist:

-   generated terrain grid

Terrain must regenerate on reload.

------------------------------------------------------------------------

# Validation Rules

The generator must:

-   never place incompatible tiles
-   never crash due to missing candidates
-   mark impossible cells empty
-   be deterministic for the same seed

------------------------------------------------------------------------

# Deliverable

Stage 4 is complete when the user can:

-   generate a terrain preview
-   see valid compatibility-based placement
-   regenerate terrain with a seed
-   inspect tiles inside the preview
