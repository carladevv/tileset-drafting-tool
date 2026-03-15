# Stage 4 Test Specification

Testing framework: Vitest.

------------------------------------------------------------------------

# Test 1 --- Terrain Dimensions

Given:

width = 20\
height = 15

Expected:

generated grid has correct dimensions.

------------------------------------------------------------------------

# Test 2 --- Cell Structure

Each cell contains:

tileId\
rotation\
status

Status must be:

placed \| empty \| invalid

------------------------------------------------------------------------

# Test 3 --- Compatibility Enforcement

Adjacent tiles must respect border compatibility.

------------------------------------------------------------------------

# Test 4 --- Rotation Matching

If a tile match requires rotation:

the placed tile must record the correct rotation.

------------------------------------------------------------------------

# Test 5 --- Candidate Filtering

Only compatibility-valid tiles appear in candidate lists.

------------------------------------------------------------------------

# Test 6 --- Unsatisfied Cell Handling

If no candidate exists:

status becomes empty.

Generation continues.

------------------------------------------------------------------------

# Test 7 --- Deterministic Generation

Running generation twice with the same seed must produce identical
terrain.

------------------------------------------------------------------------

# Test 8 --- Seed Variation

Different seeds must produce different terrain.

------------------------------------------------------------------------

# Test 9 --- Rotation Rendering

Rendered semantic grid must match rotated tile orientation.

------------------------------------------------------------------------

# Test 10 --- Tile Inspection

Clicking a generated tile displays:

tile id\
rotation\
coordinates

------------------------------------------------------------------------

# Test 11 --- Performance

Generating a 30×30 terrain should complete quickly (≈ under 1 second).
