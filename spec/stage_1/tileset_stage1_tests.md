# Stage 1 Test Specification

These tests validate the functionality defined in the Stage 1 spec.

Testing framework: Vitest.

------------------------------------------------------------------------

# Test 1 --- Project Initialization

Given the application starts with no stored project.

Expected result:

-   default project is created
-   tile list is empty
-   cell label palette is empty

------------------------------------------------------------------------

# Test 2 --- Create Cell Label

Action:

create label

    grass
    #5fbf5f

Expected result:

-   label appears in palette
-   label id stored in project state

------------------------------------------------------------------------

# Test 3 --- Edit Cell Label

Action:

rename label

    grass → meadow

Expected result:

-   label name updates in palette
-   label id remains unchanged

------------------------------------------------------------------------

# Test 4 --- Create Tile

Action:

create new tile.

Expected result:

-   tile appears in tile list
-   tile grid initialized as 6×6 matrix

------------------------------------------------------------------------

# Test 5 --- Duplicate Tile

Given:

tile A exists.

Action:

duplicate tile.

Expected result:

-   new tile created
-   grid contents identical
-   tile id different

------------------------------------------------------------------------

# Test 6 --- Delete Tile

Action:

delete tile.

Expected result:

-   tile removed from tile list
-   project state updated

------------------------------------------------------------------------

# Test 7 --- Paint Cell

Given:

palette contains label `grass`.

Action:

click cell (2,3).

Expected result:

-   cell value becomes `grass`
-   cell color renders correctly

------------------------------------------------------------------------

# Test 8 --- Drag Painting

Action:

drag cursor across multiple cells.

Expected result:

-   all visited cells receive selected label

------------------------------------------------------------------------

# Test 9 --- Grid Dimensions

For any tile grid:

Expected result:

-   exactly 6 rows
-   exactly 6 columns per row

Invalid grids must trigger validation error.

------------------------------------------------------------------------

# Test 10 --- Persistence

Action:

paint several cells.

Refresh page.

Expected result:

-   same tiles exist
-   same cell labels exist
-   grid contents unchanged

------------------------------------------------------------------------

# Test 11 --- Undefined Label Validation

Given:

a tile references a label id not in palette.

Expected result:

-   validation issue generated
