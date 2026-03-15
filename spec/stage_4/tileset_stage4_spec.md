# Stage 4 Specification --- Terrain Generation Preview (Semantic Grid Mode)

## Purpose

Stage 4 introduces the first live terrain generation system.\
The system must use the compatibility graph created in Stage 2 and the
rotation system from Stage 3 to generate a valid terrain grid composed
of tiles.

The preview renders using the semantic 6×6 grids rather than images and
acts primarily as a visual sandbox for inspecting how the authored
tileset reads when repeated across a larger area.

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

The generator may use any deterministic compatibility-aware search
strategy that fits the MVP, including backtracking.

For each candidate placement:

1.  inspect already placed neighbors
2.  compute compatible candidates
3.  choose from those candidates using the generation seed
4.  continue until no more useful placements can be made

The goal is not to guarantee a hole-free result. Partial fills are
acceptable as long as the preview remains stable, readable, and useful
for visual evaluation.

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

Each tile also carries a generation weight from `0` to `100`:

-   `0` excludes the tile from preview generation
-   `1` is the default baseline likelihood
-   higher values bias compatible selection proportionally
-   `100` makes a compatible tile one hundred times as likely as a `1`
    tile

------------------------------------------------------------------------

## Handling Unsatisfied Cells

If no candidate exists:

-   leave the preview in a safe non-crashing state
-   allow partially filled output
-   surface the result clearly in the UI

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
-   tolerate partial or incomplete fills without treating them as a
    failure of the preview workflow
-   be deterministic for the same seed

------------------------------------------------------------------------

# Deliverable

Stage 4 is complete when the user can:

-   generate a terrain preview
-   see valid compatibility-based placement
-   regenerate terrain with a seed
-   inspect tiles inside the preview
-   use the preview to judge visual variety and adjacency behavior even
    when not every cell is filled
