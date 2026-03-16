# Stage 5 Test Specification

Testing framework: Vitest.

These tests validate single-tile image association and preview fallback
behavior.

------------------------------------------------------------------------

# Test 1 --- Assign Valid Square Image

Given a selected tile.

When the user uploads a valid square image.

Expected result:

-   the tile stores `imageAsset`
-   filename, mime type, width, height, and dataUrl are present
-   no validation error is produced

------------------------------------------------------------------------

# Test 2 --- Reject Non-Square Image

Given a selected tile.

When the user uploads a non-square image.

Expected result:

-   the image is rejected
-   tile `imageAsset` is unchanged
-   validation error is shown

------------------------------------------------------------------------

# Test 3 --- Reject Unsupported File Type

When the user uploads an unsupported file type.

Expected result:

-   the image is rejected
-   tile `imageAsset` is unchanged
-   validation error is shown

------------------------------------------------------------------------

# Test 4 --- Remove Associated Image

Given a tile with an associated image.

When the user removes the image.

Expected result:

-   `imageAsset` becomes null or undefined
-   preview falls back to semantic rendering

------------------------------------------------------------------------

# Test 5 --- Replace Existing Image

Given a tile with an existing image.

When the user uploads a new valid square image.

Expected result:

-   the previous image is replaced
-   the tile stores the new file metadata and dataUrl

------------------------------------------------------------------------

# Test 6 --- Preview Mode Semantic Forces Semantic Rendering

Given a tile with an associated image.

When `previewMode = "semantic"`.

Expected result:

-   tile list uses semantic preview
-   tile inspector uses semantic preview
-   terrain preview uses semantic preview

------------------------------------------------------------------------

# Test 7 --- Preview Mode Image Uses Image When Present

Given a tile with an associated image.

When `previewMode = "image"`.

Expected result:

-   tile list uses image preview
-   tile inspector uses image preview
-   terrain preview uses image preview

------------------------------------------------------------------------

# Test 8 --- Preview Mode Image Falls Back When Missing

Given a tile without an associated image.

When `previewMode = "image"`.

Expected result:

-   tile list uses semantic fallback
-   tile inspector uses semantic fallback
-   terrain preview uses semantic fallback

------------------------------------------------------------------------

# Test 9 --- Image Asset Persists Across Reload

Given a tile with an associated image.

After project persistence and reload.

Expected result:

-   tile `imageAsset` is restored
-   preview behavior remains correct

------------------------------------------------------------------------

# Test 10 --- Preview Mode Persists Across Reload

Given `previewMode = "image"`.

After reload.

Expected result:

-   preview mode remains `"image"`

------------------------------------------------------------------------

# Test 11 --- Terrain Generation Is Unchanged by Image Association

Given a tileset and seed.

Generate terrain before and after assigning tile images.

Expected result:

-   terrain placement results are identical
-   only rendering changes

------------------------------------------------------------------------

# Test 12 --- Missing Image Is Not a Validation Error

Given a tile without an image.

Expected result:

-   no validation issue is created solely because the image is missing
-   semantic fallback remains valid
