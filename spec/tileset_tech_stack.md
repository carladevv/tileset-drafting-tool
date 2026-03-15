# Tileset Authoring Tool

## Technology Stack Specification

This document defines the **approved libraries and technologies** used
in the application. The purpose is to prevent toolchain drift and ensure
consistent implementation.

The application is a **React + Vite + TypeScript web application** with
**BabylonJS** used for 3D rendering.

------------------------------------------------------------------------

# Core Stack

  Area                 Technology
  -------------------- ------------------
  Frontend Framework   React
  Build Tool           Vite
  Language             TypeScript
  3D Engine            BabylonJS
  State Management     Zustand
  Testing              Vitest
  Component Styling    CSS Modules
  UI Icons             Lucide React
  File Export          FileSaver.js
  Canvas Drawing       HTML5 Canvas API

------------------------------------------------------------------------

# 3D Engine

Library:

Babylon.js

Purpose:

Used for:

-   Terrain preview generation
-   3D tileset visualization
-   Rendering uploaded GLB tiles
-   Camera navigation
-   Grid visualization

Required packages:

    @babylonjs/core
    @babylonjs/loaders
    @babylonjs/gui

Features used:

-   ArcRotateCamera
-   GridMaterial
-   GLTFLoader
-   Mesh instancing

------------------------------------------------------------------------

# Sketch Drawing System

Implementation:

-   HTML5 Canvas
-   No external drawing library

Canvas resolution:

    64 x 64 pixels

Display scale:

    512 x 512 visual display

Rendering mode:

    image-rendering: pixelated

Tools supported:

-   Pencil
-   Eraser
-   Color picker
-   8-color palette

------------------------------------------------------------------------

# State Management

Library:

Zustand

Purpose:

-   store tiles
-   store side tags
-   store connections
-   store generation settings
-   store UI state

Store modules:

    tilesStore
    connectionsStore
    generationStore
    uiStore

Persistence:

    localStorage

------------------------------------------------------------------------

# File Import / Export

Libraries:

FileSaver.js

Used for:

-   sketch export
-   atlas export
-   metadata export
-   tileset package export

Supported formats:

    PNG
    JSON
    ZIP

------------------------------------------------------------------------

# GLB / 3D Model Import

Babylon loader:

    @babylonjs/loaders/glTF

Supported formats:

    .glb
    .gltf

Imported models used in:

-   terrain preview
-   validation view

------------------------------------------------------------------------

# Testing

Framework:

Vitest

Used for:

-   data model tests
-   tile compatibility logic
-   export correctness
-   generation validation

Testing types:

    unit tests
    logic tests
    serialization tests

------------------------------------------------------------------------

# Project Structure

    src/

    core/
      tiles/
      edges/
      generation/

    editor/
      sketch/
      tiles/

    rendering/
      babylon/

    ui/
      panels/
      components/

    state/
      stores/

    export/
      sketches/
      metadata/

    tests/

------------------------------------------------------------------------

# Font & Visual Style

Theme:

Pixel-style UI

Fonts:

Recommended:

    Press Start 2P
    or
    Pixelify Sans

Icons:

    lucide-react

UI aesthetic:

    pixel-art inspired
    clean editor layout

------------------------------------------------------------------------

# Strict Constraints

Codex should **not introduce additional major frameworks**.

Avoid:

    Redux
    Three.js
    Konva
    Fabric.js
    Next.js
    Tailwind

Only introduce libraries if absolutely necessary and documented.

------------------------------------------------------------------------

# Summary

The application stack is intentionally simple:

    React
    Vite
    TypeScript
    BabylonJS
    Zustand
    Vitest
    Canvas API

This ensures the tool remains **lightweight, maintainable, and easy for
AI-assisted development**.
