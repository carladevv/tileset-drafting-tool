# Tileset Planner --- Editor Architecture

This document defines the React component architecture for the Stage 1
editor. It ensures the UI is organized consistently with the project
data model, technology stack, and pixel-style UI guidelines.

The goal is to keep the architecture simple, predictable, and easy for
automated tools or contributors to extend.

------------------------------------------------------------------------

# High-Level Structure

The application follows a **single-page editor layout**.

Main hierarchy:

App └── EditorLayout ├── TileListPanel ├── PalettePanel ├──
TileEditorGrid └── TileInspector

State is centralized using a Zustand store.

------------------------------------------------------------------------

# Root Application

## App

Responsibilities:

-   initialize project state
-   mount global Zustand stores
-   load persisted project data
-   provide application layout

Example structure:

``` tsx
<App>
  <EditorLayout />
</App>
```

------------------------------------------------------------------------

# Editor Layout

## EditorLayout

The main UI layout component.

Responsibilities:

-   create three-column layout
-   host all editor panels
-   manage panel sizing

Structure:

``` tsx
<EditorLayout>
  <TileListPanel />
  <TileEditorGrid />
  <TileInspector />
</EditorLayout>
```

Layout must follow the pixel UI design:

-   dark panel backgrounds
-   1px borders
-   square edges
-   grid-based alignment

------------------------------------------------------------------------

# State Management

All project data is managed through a **Zustand store**.

Example store:

``` ts
type ProjectStore = {
  project: Project

  selectedTileId: string | null
  selectedLabelId: string | null

  createTile()
  deleteTile()
  duplicateTile()

  createCellLabel()
  updateCellLabel()
  deleteCellLabel()

  paintCell(tileId, x, y, labelId)
}
```

The store is the single source of truth for:

-   project
-   tiles
-   palette
-   active tile
-   active label

------------------------------------------------------------------------

# Panels

## TileListPanel

Left-side panel displaying all tiles.

Responsibilities:

-   list tiles
-   select tile
-   create tile
-   duplicate tile
-   delete tile

Visual layout:

    +--------------------+
    | Tiles              |
    |--------------------|
    | grass_plain        |
    | river_straight     |
    | shore_corner       |
    | + New Tile         |
    +--------------------+

Each tile entry should include:

-   tile name
-   small preview
-   selection highlight

------------------------------------------------------------------------

## PalettePanel

Located in the left column under the tile list.

Responsibilities:

-   display cell labels
-   allow selecting active label
-   create/edit/delete labels

Example layout:

    +--------------------+
    | Palette            |
    |--------------------|
    | grass  ■           |
    | water  ■           |
    | sand   ■           |
    | + Add Label        |
    +--------------------+

Selecting a label activates it for painting.

------------------------------------------------------------------------

# Tile Editor

## TileEditorGrid

The central editing component.

Responsibilities:

-   render the 6×6 semantic grid
-   handle painting interactions
-   display grid cell colors
-   handle drag painting

Grid specification:

-   6 rows
-   6 columns
-   cell size: 64px

Total editor size:

384 × 384 pixels

Example grid:

    [grass][grass][river][river][grass][grass]
    [grass][grass][river][river][grass][grass]
    [grass][grass][river][river][grass][grass]
    [grass][grass][river][river][grass][grass]
    [grass][grass][river][river][grass][grass]
    [grass][grass][river][river][grass][grass]

Implementation uses HTML5 Canvas or div grid.

Interactions:

-   click to paint cell
-   drag to paint multiple cells
-   hover highlight cell

------------------------------------------------------------------------

# Tile Inspector

## TileInspector

Right-side panel showing metadata for the selected tile.

Responsibilities:

-   display tile name
-   allow renaming
-   toggle rotation support
-   show validation issues

Example layout:

    +----------------------+
    | Tile Inspector       |
    |----------------------|
    | Name: river_straight |
    | Rotations: Enabled   |
    |                      |
    | Validation           |
    | - No issues          |
    +----------------------+

------------------------------------------------------------------------

# Rendering Rules

The UI must follow the pixel-art style guide:

-   crisp edges
-   no rounded corners
-   minimal gradients
-   high contrast borders

Example CSS:

    image-rendering: pixelated;
    border: 1px solid #1b2629;

------------------------------------------------------------------------

# Component Communication

Components communicate through the Zustand store.

Flow example:

PalettePanel → select label TileEditorGrid → paint cell ProjectStore →
update tile grid TileEditorGrid → rerender

------------------------------------------------------------------------

# Folder Structure

Recommended structure:

    src/

    components/
      EditorLayout.tsx
      TileEditorGrid.tsx
      TileInspector.tsx
      TileListPanel.tsx
      PalettePanel.tsx

    stores/
      projectStore.ts

    types/
      projectTypes.ts

    styles/
      theme.css

------------------------------------------------------------------------

# Performance Considerations

Stage 1 is small, but the architecture should support scaling.

Guidelines:

-   avoid unnecessary React re-renders
-   memoize grid cells if needed
-   keep tile grids immutable
-   compute derived data later stages

------------------------------------------------------------------------

# Out of Scope

The following features belong to later stages:

-   compatibility previews
-   terrain generation
-   tile rotations visualization
-   image uploads
-   export/import
-   detail asset placement

These should not be implemented in Stage 1.

------------------------------------------------------------------------

# Completion Criteria

Stage 1 architecture is complete when:

-   all panels render correctly
-   painting updates grid state
-   tiles and palette persist correctly
-   UI follows pixel style guidelines
