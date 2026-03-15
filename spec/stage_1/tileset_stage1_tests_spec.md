# Tileset Planner — Stage 1 Test Spec

This file defines the expected tests for Stage 1.

Use:
- **Vitest** for unit/component tests
- **React Testing Library** for UI behavior
- optional **Playwright** for one lightweight end-to-end smoke flow

The goal is not maximum test count. The goal is to cover the risky parts well.

---

## 1. Unit Tests

### 1.1 Tile creation
Test:
- `createTile()` adds a tile with:
  - unique id
  - default 64x64 sketch
  - empty side tags
  - valid default name when needed

Checks:
- tile count increases by 1
- selected tile becomes the new tile
- `pixels.length === 4096`

### 1.2 Tile duplication
Test:
- `duplicateTile()` copies sketch and side tags but not id

Checks:
- duplicate has different `id`
- duplicate name is unique
- duplicate `sketch.pixels` matches original
- duplicate `sideTags` matches original

### 1.3 Tile deletion
Test:
- `deleteTile()` removes the tile and reselects a safe alternative

Checks:
- deleted tile no longer exists
- selected tile changes to another existing tile or null

### 1.4 Name validation
Test cases:
- empty name is invalid
- whitespace-only name is invalid
- duplicate name is invalid
- unique trimmed name is valid

### 1.5 Sketch editing helpers
Test:
- setting a pixel updates the correct index only

Checks:
- index formula is correct
- neighboring pixels remain unchanged

### 1.6 Clear sketch
Test:
- `clearSketch()` resets all pixels to transparent palette index

### 1.7 Side tag editing
Test:
- `setSideTag()` updates only the requested side

### 1.8 Persistence serialization
Test:
- serializing and deserializing state preserves tiles, selected tile, pixels, and side tags
- malformed saved data falls back to a safe default state

---

## 2. Component / UI Tests

### 2.1 Tile library renders tiles
Scenario:
- render app with seeded store containing several tiles

Checks:
- tile names appear in list
- selected tile is visually distinguishable
- warning badge appears for incomplete tile

### 2.2 Selecting a tile updates workspace
Scenario:
- click a different tile in the library

Checks:
- name field updates
- side tag fields update
- sketch preview reflects selected tile

### 2.3 Renaming a tile
Scenario:
- type a new tile name into the name field

Checks:
- tile list updates immediately
- duplicate-name warning appears when appropriate

### 2.4 Side tag editing
Scenario:
- type into North/East/South/West inputs

Checks:
- values persist in UI
- inspector status changes from missing to assigned

### 2.5 Clear sketch button
Scenario:
- preseed sketch with painted pixels, click `Clear Sketch`

Checks:
- preview returns to blank state

### 2.6 Export metadata button
Scenario:
- click export metadata

Checks:
- exported filename uses tile name
- JSON payload includes tile name, id, and sideTags

### 2.7 Export sketch button
Scenario:
- click export sketch

Checks:
- export function is called
- filename uses tile name
- canvas/image export path completes without throwing

---

## 3. Pixel Editor Interaction Tests

These are the most important interaction tests.

### 3.1 Single click paints one logical pixel
Scenario:
- click at a known position in the enlarged editor

Checks:
- exactly one logical pixel changes to active palette index

### 3.2 Drag paints multiple pixels
Scenario:
- drag across the editor

Checks:
- several expected logical pixels change
- no out-of-bounds errors occur

### 3.3 Erase mode writes transparent index
Scenario:
- paint a pixel, switch to erase, erase it

Checks:
- pixel returns to transparent index

### 3.4 Pointer mapping correctness
Scenario:
- click near canvas corners

Checks:
- top-left maps to 0,0
- bottom-right maps to 63,63
- clicks never write outside bounds

---

## 4. Manual QA Checklist

### Tile CRUD
- create several tiles
- duplicate one with a nontrivial sketch
- delete a selected tile
- confirm selection remains stable

### Sketching
- draw a rough tile using several palette colors
- erase some pixels
- clear the sketch
- verify preview remains crisp and pixelated

### Side tags
- fill all four side tags
- leave some blank on another tile
- confirm incomplete warnings appear

### Persistence
- refresh the page
- verify tiles, sketch data, selection, and side tags remain intact
- corrupt localStorage manually and verify app recovers gracefully

### Exports
- export sketch PNG
- verify file name matches tile name
- verify image looks scaled and unsmoothed
- export metadata JSON
- verify side tags are correct inside the file

---

## 5. Suggested E2E Smoke Test

One Playwright smoke flow is enough for Stage 1.

Scenario:
1. open the app
2. create a new tile
3. rename it to `grass_corner`
4. draw at least one pixel
5. set all four side tags
6. refresh the page
7. verify tile still exists with same name and tags

Pass condition:
- the app survives the full authoring loop without data loss

---

## 6. Definition of Done for Testing

Stage 1 testing is sufficient when:
- core store actions are unit tested
- risky pixel-editor interactions are covered
- one persistence flow is verified
- export functions are verified at least at invocation/payload level
- one end-to-end authoring smoke flow passes
