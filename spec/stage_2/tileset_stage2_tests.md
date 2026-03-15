# Stage 2 Test Specification

These tests validate derived border arrays and computed compatibility.

Testing framework: Vitest.

------------------------------------------------------------------------

# Test 1 --- Derive North Border

Given a 6x6 tile grid.

Expected result:

-   north border equals row 0

Example:

``` ts
north = grid[0]
```

------------------------------------------------------------------------

# Test 2 --- Derive South Border

Given a 6x6 tile grid.

Expected result:

-   south border equals row 5

------------------------------------------------------------------------

# Test 3 --- Derive West Border

Given a 6x6 tile grid.

Expected result:

-   west border equals the first value of each row

------------------------------------------------------------------------

# Test 4 --- Derive East Border

Given a 6x6 tile grid.

Expected result:

-   east border equals the last value of each row

------------------------------------------------------------------------

# Test 5 --- Exact Opposite-Side Match

Given:

-   tile A east border =
    `["grass", "grass", "river", "river", "grass", "grass"]`
-   tile B west border =
    `["grass", "grass", "river", "river", "grass", "grass"]`

Expected result:

-   A east matches B west

------------------------------------------------------------------------

# Test 6 --- Non-Identical Borders Do Not Match

Given:

-   tile A east border =
    `["grass", "grass", "river", "river", "grass", "grass"]`
-   tile B west border =
    `["grass", "river", "river", "river", "grass", "grass"]`

Expected result:

-   no compatibility match

------------------------------------------------------------------------

# Test 7 --- Same-Side Matching Is Rejected

Given identical border arrays on:

-   tile A east
-   tile B east

Expected result:

-   no compatibility match

------------------------------------------------------------------------

# Test 8 --- Orthogonal Side Matching Is Rejected

Given identical border arrays on:

-   tile A north
-   tile B west

Expected result:

-   no compatibility match

------------------------------------------------------------------------

# Test 9 --- Compatibility Graph Includes All Matches

Given a project with multiple tiles.

Expected result:

-   each tile side lists all valid compatible matches
-   each match includes target tile id and target side

------------------------------------------------------------------------

# Test 10 --- Zero-Match Warning

Given a tile side with no compatible neighbors.

Expected result:

-   validation includes a warning for that side

------------------------------------------------------------------------

# Test 11 --- Undefined Label Validation

Given a tile grid referencing a label id not present in `cellLabels`.

Expected result:

-   validation includes an error

------------------------------------------------------------------------

# Test 12 --- Invalid Grid Dimensions Validation

Given a grid that is not 6 rows by 6 columns.

Expected result:

-   validation includes an error

------------------------------------------------------------------------

# Test 13 --- Compatibility Recomputes After Grid Edit

Given a valid compatibility match.

When a border cell is changed.

Expected result:

-   compatibility graph updates
-   prior match disappears if arrays no longer match

------------------------------------------------------------------------

# Test 14 --- Compatibility Is Not Persisted

Given a saved project in localStorage.

Expected result:

-   stored project contains tiles and labels
-   stored project does not contain precomputed border arrays
-   stored project does not contain compatibility graph

------------------------------------------------------------------------

# Test 15 --- Reload Recomputes Deterministically

Given a persisted project.

When the app reloads.

Expected result:

-   recomputed compatibility graph is identical to the pre-reload result
-   recomputed validation warnings are identical to the pre-reload
    result
