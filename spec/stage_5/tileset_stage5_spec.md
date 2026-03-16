# Stage 5 Specification --- Single Tile Image Association and Preview Fallback

## Purpose

Stage 5 introduces optional square image assets for individual tiles.

These images are used only for preview and visual inspection. They do
not replace the semantic grid as the source of truth.

If a tile has an associated image, terrain preview may render that
image. If a tile has no associated image, preview must fall back to
semantic 6×6 cell rendering.

This stage builds on the existing tile data model, editor architecture,
and terrain generation preview.

------------------------------------------------------------------------

# Dependencies

This stage must follow:

-   `tileset_data_model.md`
-   `tileset_editor_architecture.md`
-   `tileset_stages.md`
-   `tileset_tech_stack.md`
-   `tileset_ui_style.md`

Relevant data structures:

-   `Tile`
-   `TileImageAsset`
-   `ProjectSettings`
-   `GeneratedTerrain`

------------------------------------------------------------------------

# Core Features

## Optional Per-Tile Image Asset

Each tile may optionally contain:

``` ts
imageAsset?: TileImageAsset | null
```

Shape:

``` ts
type TileImageAsset = {
  id: string
  filename: string
  mimeType: string
  width: number
  height: number
  dataUrl: string
}
```

This image is:

-   optional
-   square
-   preview-only
-   persisted with the tile

It must not affect:

-   semantic grid data
-   border derivation
-   compatibility
-   rotation logic
-   terrain generation candidate rules

------------------------------------------------------------------------

## Assign Image to Selected Tile

The user must be able to assign an image to the currently selected tile.

Input methods may include:

-   file input button
-   drag and drop onto the tile preview area

Accepted image formats for MVP:

-   PNG
-   JPG / JPEG
-   WebP

Implementation may use native browser image APIs.

------------------------------------------------------------------------

## Square Image Validation

The associated tile image must be square.

Allowed examples:

-   64 × 64
-   128 × 128
-   256 × 256
-   512 × 512

If a non-square image is uploaded, the application must either:

### Preferred MVP behavior

Reject it and show a validation message.

or

### Optional alternative

Normalize it by cropping or scaling into a square canvas.

For Stage 5, the preferred behavior is:

-   reject non-square images
-   preserve the original image as uploaded when valid

------------------------------------------------------------------------

## Remove / Replace Image

The user must be able to:

-   replace an existing associated image
-   remove the image from a tile

When an image is removed, preview must fall back to semantic rendering.

------------------------------------------------------------------------

# Preview Mode Integration

## Project Preview Mode

The project settings already include:

``` ts
previewMode: "semantic" | "image"
```

Stage 5 must activate this setting.

### Semantic Mode

Always render semantic grid previews, even if an image exists.

### Image Mode

Render the tile image if one exists. If no image exists, fall back to
semantic grid rendering.

This applies to:

-   tile list preview thumbnails
-   tile inspector preview
-   generated terrain preview

------------------------------------------------------------------------

## Fallback Rule

Preview selection rule:

1.  if `previewMode === "semantic"`, use semantic rendering
2.  if `previewMode === "image"` and tile has valid `imageAsset`, use
    image rendering
3.  otherwise use semantic rendering

This rule must be consistent across the app.

------------------------------------------------------------------------

# UI Requirements

## Tile Inspector Additions

The tile inspector must now include an image section for the selected
tile.

Required controls:

-   current tile preview
-   upload image button
-   remove image button
-   filename display if image exists
-   validation message area

Example:

``` text
Tile Preview
[ image or semantic fallback preview ]

Image
[Upload]
[Remove]

Filename: river_straight.png
```

------------------------------------------------------------------------

## Tile List Thumbnail Behavior

Each tile entry in the tile list should use the active preview mode.

That means:

-   in semantic mode: show semantic mini-preview
-   in image mode with image asset: show uploaded image
-   in image mode without image asset: show semantic fallback

The tile list must continue to follow the pixel UI style guide.

------------------------------------------------------------------------

## Generated Terrain Preview Behavior

Terrain preview tiles must also use the active preview mode.

That means the Stage 4 terrain view now supports:

-   semantic rendering
-   image rendering with fallback

No new terrain generation logic is needed. Only rendering changes.

------------------------------------------------------------------------

# State Management

The store must support:

-   setting tile image asset
-   removing tile image asset
-   updating preview mode
-   validating image metadata

Recommended actions:

``` ts
setTileImageAsset(tileId, imageAsset)
removeTileImageAsset(tileId)
setPreviewMode(mode)
```

The image asset is persisted as part of tile state.

The preview mode is persisted in project settings.

------------------------------------------------------------------------

# Persistence

Persist:

-   `Tile.imageAsset`
-   `Project.settings.previewMode`

Do not persist any derived thumbnail caches.

Any preview rendering data must be derived at runtime.

------------------------------------------------------------------------

# Validation Rules

The system must generate validation issues for:

-   non-square associated image
-   unreadable or invalid image file
-   unsupported image mime type

Validation severity:

-   unsupported or invalid file: error
-   non-square image: error

A missing image is not a validation error because the fallback path is
valid.

------------------------------------------------------------------------

# Suggested Utility Functions

``` ts
readImageFile(file): Promise<TileImageAsset>
isSquareImage(asset: TileImageAsset): boolean
getTilePreviewSource(tile, previewMode): "semantic" | TileImageAsset
removeTileImage(tileId): void
```

These functions should be independently testable.

------------------------------------------------------------------------

# Out of Scope

The following must not be implemented in Stage 5:

-   batch image upload
-   image atlas generation
-   export/import image package behavior
-   image-based compatibility
-   shader/image effects
-   per-rotation image variants
-   image editing tools

Those belong to later stages.

------------------------------------------------------------------------

# Deliverable

Stage 5 is complete when the user can:

-   upload a square image for a selected tile
-   persist that image on reload
-   switch preview mode between semantic and image
-   see image previews in the tile list, inspector, and terrain preview
-   see semantic fallback whenever a tile has no associated image
