# Stage 3 Test Specification

These tests validate logical rotation variants and rotation-aware
compatibility.

Testing framework: Vitest.

------------------------------------------------------------------------

# Test 1 --- Rotate Grid 90 Clockwise

Given a 6x6 tile grid with distinct values.

Expected result:

-   rotating by 90° clockwise remaps cells correctly

Example rule:

``` ts
rotated[x][y] = original[5 - y][x]
```

------------------------------------------------------------------------

# Test 2 --- Rotate Grid 180

Given a 6x6 tile grid with distinct values.

Expected result:

-   rotating by 180° is equivalent to two 90° clockwise rotations

------------------------------------------------------------------------

# Test 3 --- Rotate Grid 270

Given a 6x6 tile grid with distinct values.

Expected result:

-   rotating by 270° is equivalent to three 90° clockwise rotations

------------------------------------------------------------------------

# Test 4 --- Rotation Preserves Grid Size

Given any valid tile grid.

Expected result:

-   rotated grid still has 6 rows
-   each row still has 6 columns

------------------------------------------------------------------------

# Test 5 --- Rotated Borders Derived Correctly

Given a valid tile grid.

When a rotated view is created.

Expected result:

-   north/east/south/west borders are derived from the rotated grid
-   borders match the expected rotated layout

------------------------------------------------------------------------

# Test 6 --- allowRotations False Produces Only Base Variant

Given a tile with:

``` ts
allowRotations: false
```

Expected result:

-   only rotation `0` is returned by rotation helpers
-   compatibility uses only the base tile orientation

------------------------------------------------------------------------

# Test 7 --- allowRotations True Produces Four Variants

Given a tile with:

``` ts
allowRotations: true
```

Expected result:

-   rotations `0`, `90`, `180`, `270` are considered

------------------------------------------------------------------------

# Test 8 --- Rotation Creates New Compatibility

Given:

-   tile A east border does not match tile B west at rotation `0`
-   tile A east border matches tile B west at rotation `90`

Expected result:

-   compatibility graph includes a match with `targetRotation: 90`

------------------------------------------------------------------------

# Test 9 --- Rotation Disabled Removes Rotation-Only Match

Given a previous rotation-only compatibility match.

When `allowRotations` is set to false on the target tile.

Expected result:

-   the rotation-only match disappears

------------------------------------------------------------------------

# Test 10 --- Duplicate Compatibility Entries Are Deduplicated

Given a highly symmetrical tile whose multiple rotations produce
identical borders.

Expected result:

-   compatibility list does not contain accidental duplicate entries

------------------------------------------------------------------------

# Test 11 --- Validation Updates With Rotation Setting

Given a tile side with zero matches at rotation disabled.

When enabling rotations creates a valid match.

Expected result:

-   zero-match warning disappears

And the inverse:

-   if disabling rotations removes the only valid match
-   warning appears

------------------------------------------------------------------------

# Test 12 --- Rotated Preview Uses Derived Rotated Grid

Given a tile and selected preview rotation.

Expected result:

-   preview grid matches the rotated semantic layout
-   base tile grid data is unchanged

------------------------------------------------------------------------

# Test 13 --- Rotation Data Is Not Persisted

Given a saved project in localStorage.

Expected result:

-   stored project includes `allowRotations`
-   stored project does not include persisted rotated grids
-   stored project does not include persisted rotated borders
-   stored project does not include persisted rotated compatibility
    graph

------------------------------------------------------------------------

# Test 14 --- Reload Recomputes Rotation-Aware Compatibility

Given a persisted project with rotation-enabled tiles.

When the app reloads.

Expected result:

-   rotation-aware compatibility graph is recomputed identically
-   rotation-based warnings are recomputed identically

------------------------------------------------------------------------

# Test 15 --- Base Editing Still Targets Unrotated Grid

Given a tile with rotation preview enabled.

When the user paints the tile in the main editor.

Expected result:

-   the base tile grid is updated
-   rotated previews change only as derived results
-   no rotated variant is directly edited
