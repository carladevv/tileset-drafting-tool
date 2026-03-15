# Stage 1 Specification --- Tiles, Cell Palette, and 6x6 Semantic Grid Editor

## Purpose

Stage 1 establishes the core editing loop for the tileset planner.

The user must be able to:

-   create tiles
-   rename/delete/duplicate tiles
-   define a cell-label palette
-   assign colors to labels
-   paint a tile using a 6x6 semantic grid
-   persist the project locally

This stage creates the core editing environment for the semantic grid
system.

The semantic grid is the **source of truth for tile structure**.

Compatibility, borders, and generation will be derived later.

------------------------------------------------------------------------

# Dependencies

This stage must follow:

-   the project data model (`tileset_data_model.md`)
-   the UI style guide (`tileset_ui_style.md`)
-   the technology stack (`tileset_tech_stack_v2.md`)

Relevant data structures:

-   `Project`
-   `CellLabel`
-   `Tile`
-   `TileGrid`

------------------------------------------------------------------------

# Core Features

## Project Initialization

When the application starts:

-   create a default empty project
-   initialize an empty tile list
-   initialize an empty cell label palette

Example default project:

    {
      id: "project_default",
      name: "Untitled Tileset",
      gridSize: 6,
      tiles: [],
      cellLabels: []
    }

Project state should be stored in a Zustand store.

------------------------------------------------------------------------

# Cell Label Palette

Users must be able to manage semantic cell labels.

## Required fields

Each label must contain:

    id
    name
    color

Example:

    {
      id: "grass",
      name: "Grass",
      color: "#5fbf5f"
    }

## Operations

User must be able to:

-   create label
-   rename label
-   change label color
-   delete label
-   select label for painting

Deleting a label must:

-   warn if tiles currently use it
-   optionally replace with another label

------------------------------------------------------------------------

# Tile List

Tiles must appear in a list panel.

Each tile must contain:

    id
    name
    grid
    allowRotations

Example:

    tile_grass_plain

## Tile operations

User must be able to:

-   create tile
-   rename tile
-   duplicate tile
-   delete tile
-   select tile

Duplicate tile must:

-   copy grid values
-   generate new id

------------------------------------------------------------------------

# 6x6 Tile Grid Editor

The center panel contains the tile editor.

Grid size:

    6 × 6

Each cell stores:

    CellLabelId

Example:

    grass grass river river grass grass

## Rendering

Cells must display the color of the associated `CellLabel`.

Cell size:

    64px

Editor size:

    384px × 384px

Rendering must follow pixel-style UI rules.

------------------------------------------------------------------------

# Painting Interaction

User workflow:

1.  select label from palette
2.  click grid cell
3.  cell value updates

Required behaviors:

-   click paints cell
-   drag paints multiple cells
-   active label highlighted in palette
-   grid updates immediately

------------------------------------------------------------------------

# Validation Rules

The system must detect:

-   tile with empty name
-   tile grid containing undefined label
-   duplicate tile names

Validation issues should be stored using the `ValidationIssue` model.

------------------------------------------------------------------------

# Persistence

The project must persist using:

    localStorage

Persistence behavior:

-   save automatically on edit
-   load project on startup

Persisted data:

-   project metadata
-   cell labels
-   tiles
-   tile grids

Derived data must NOT be stored.

------------------------------------------------------------------------

# UI Layout

Three-panel layout.

Left panel:

-   tile list
-   palette editor

Center panel:

-   6×6 tile editor

Right panel:

-   tile inspector
-   tile metadata editor

UI must follow pixel-style design described in the style guide.

------------------------------------------------------------------------

# Out of Scope

The following must NOT be implemented in Stage 1:

-   border derivation
-   compatibility matching
-   tile rotations
-   terrain generation
-   tile image uploads
-   export/import
-   detail asset placement

Those features belong to later stages.

------------------------------------------------------------------------

# Deliverable

Stage 1 is complete when the user can:

-   create tiles
-   define palette labels
-   paint tiles on a 6×6 grid
-   reload the project and see the same tiles
