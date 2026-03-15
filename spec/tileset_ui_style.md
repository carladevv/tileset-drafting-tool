# Tileset Planner --- UI Style Guide

## Design Goal

A pixel‑art inspired UI similar to classic game editors.\
The interface should feel lightweight, playful, and visually consistent
with tile‑based workflows.

Reference inspiration: retro game editors and pixel UI toolkits.

------------------------------------------------------------------------

# Core Visual Principles

## Pixel Aesthetic

UI should resemble pixel-art software tools.

Rules: - crisp edges - square corners - minimal gradients - limited
color palette - strong contrast

Use:

    image-rendering: pixelated;

for pixel previews and tile displays.

------------------------------------------------------------------------

# Color System

Muted dark editor background with bright pixel accents.

Example palette:

Background

    #2b3a3f

Panels

    #32474c

Borders

    #1b2629

Highlight / Accent

    #ffb454

Grid line

    #4a666c

Text

    #dfe9eb

------------------------------------------------------------------------

# Layout

Three-panel layout:

Left panel - tile list - palette editor

Center panel - 6x6 semantic tile editor

Right panel - tile inspector - compatibility preview

Panels should resemble pixel UI boxes with clear borders.

------------------------------------------------------------------------

# Typography

Pixel-style fonts recommended:

-   Press Start 2P
-   Pixelify Sans
-   Silkscreen

Rules: - avoid thin fonts - avoid smooth UI fonts

------------------------------------------------------------------------

# Buttons

Pixel-style rectangular buttons.

Characteristics: - square edges - 1px border - small drop shadow - hover
color shift

Example:

    background: #4a666c
    border: 1px solid #1b2629

Hover:

    background: #5a7d84

------------------------------------------------------------------------

# Tile Editor Grid

6x6 semantic cell grid.

Cells: - square - visible grid lines - filled with palette colors

Example cell size:

    64px

Editor display size:

    384px × 384px

------------------------------------------------------------------------

# Tile Preview

When images are present:

-   render image

Otherwise:

-   render semantic cell colors

Tile previews should maintain crisp pixel rendering.

------------------------------------------------------------------------

# Interaction Style

Keep interaction simple and game-like.

Examples: - click to paint cells - color palette selection - hover
highlight on tiles - warning icons for invalid tiles

------------------------------------------------------------------------

# Animations

Minimal.

Allowed: - hover highlight - small button press effect

Avoid: - smooth material-style transitions - heavy animations
