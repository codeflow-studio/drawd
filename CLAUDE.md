# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowForge is a visual **mobile app flow designer** — a React application that lets users design app navigation flows by uploading screen images, placing them on an infinite canvas, defining interactive hotspots/tap areas, connecting screens with navigation links, and generating AI build instructions from the resulting flow.

## Architecture

### Project Structure

```
flowforge.jsx              — Re-export entry point (backwards compat)
src/
  FlowForge.jsx            — Main component (orchestrator)
  components/
    ScreenNode.jsx          — Draggable screen card with image, hotspots, action buttons
    ConnectionLines.jsx     — SVG layer rendering interactive navigation arrows between screens
    HotspotModal.jsx        — Modal for creating/editing hotspot tap areas
    InstructionsPanel.jsx   — Panel displaying generated AI build instructions
    RenameModal.jsx         — Modal for renaming screens
    ImportConfirmModal.jsx  — Modal for import replace/merge confirmation
    TopBar.jsx              — Top toolbar with upload/import/export/generate actions
    Sidebar.jsx             — Right panel showing selected screen details
    EmptyState.jsx          — Empty canvas placeholder
  hooks/
    useCanvas.js            — Pan, zoom, and drag logic
    useScreenManager.js     — Screen/connection/hotspot CRUD state
  styles/
    theme.js                — COLORS, FONTS, FONT_LINK, shared style objects
  utils/
    generateId.js           — Unique ID generator (timestamp + random)
    generateInstructions.js — AI instruction markdown generator
    exportFlow.js           — Export screens/connections as .flowforge JSON file
    importFlow.js           — Parse and validate .flowforge JSON files
    mergeFlow.js            — Remap IDs and offset positions for merge imports
```

### Component Hierarchy

```
FlowForge (src/FlowForge.jsx)
  ├── TopBar — Toolbar: upload, add blank, import, export, generate instructions
  ├── Canvas area
  │   ├── ConnectionLines — SVG bezier arrows between screens
  │   ├── ScreenNode[] — Draggable screen cards
  │   └── EmptyState — Shown when no screens exist
  ├── Sidebar — Selected screen details, hotspot list, incoming links
  ├── HotspotModal — Create/edit hotspot tap areas and actions
  ├── InstructionsPanel — Generated AI build instructions viewer
  ├── RenameModal — Screen rename dialog
  └── ImportConfirmModal — Import replace/merge confirmation dialog
```

### Key Data Structures

- **screens[]** — `{ id, name, x, y, width, imageData, imageWidth, imageHeight, hotspots[] }`
- **connections[]** — `{ id, fromScreenId, toScreenId, hotspotId, label, action }`
- **hotspot** — `{ id, label, x, y, w, h (all %), action, targetScreenId }`
- **Hotspot actions**: `navigate`, `back`, `modal`, `api`, `custom`
- **.flowforge file** — `{ version: 1, metadata: { name, exportedAt, screenCount, connectionCount }, viewport: { pan, zoom }, screens[], connections[] }`

### Custom Hooks

- **useCanvas** — Manages pan/zoom state, canvas mouse events (drag, pan, wheel zoom). Returns `{ pan, setPan, zoom, setZoom, isPanning, dragging, canvasRef, handleDragStart, handleMouseMove, handleMouseUp, handleCanvasMouseDown }`.
- **useScreenManager(pan, zoom, canvasRef)** — Manages screens, connections, and hotspot CRUD. Returns screen/connection state, all mutation callbacks, plus `replaceAll(screens, connections, counter)` and `mergeAll(screens, connections)` for import. Also provides `moveHotspot(screenId, hotspotId, x, y)`, `updateScreenDimensions(screenId, imageWidth, imageHeight)`, `quickConnectHotspot(screenId, hotspotId, targetScreenId)` for interactive hotspot features, and `updateConnection(connectionId, patch)` / `deleteConnection(connectionId)` for direct connection manipulation. Also provides undo/redo via `canUndo`, `canRedo`, `undo()`, `redo()`, `captureDragSnapshot()`, `commitDragSnapshot()`.
  - **Screen placement**: `addScreen()` places screens on a grid layout (used by file upload and drag-and-drop). `addScreenAtCenter(imageData, name, offset)` places screens at the viewport center in world coordinates (used by paste and "Add Blank"). Multiple pasted images are staggered diagonally with `offset * 30px`.

### Design System

Colors and shared styles are in `src/styles/theme.js`:
- `COLORS` — Dark theme with purple accent (`#6c5ce7`)
- `FONTS` — `{ ui, mono, heading }` font family constants
- `styles` — Reusable style objects: `monoLabel`, `input`, `select`, `modalOverlay`, `modalCard`, `modalTitle`, `btnPrimary`, `btnCancel`, `btnDanger`

### Canvas System

- **Pan**: Click-drag on empty canvas area
- **Zoom**: Mouse wheel (range 0.2x - 2x)
- **Drag-and-drop**: Images can be dropped directly onto the canvas
- **Screen dragging**: Click-drag on screen nodes to reposition

### Interactive Hotspot Features

- **Draw tap areas**: Click-and-drag on screen image to draw a rectangle. On release, HotspotModal opens with pre-filled x/y/w/h percentages. Min size guard: 2% w and h.
- **Select and reposition**: Click a hotspot to select it (purple highlight + glow). Click again to begin drag-reposition within image bounds.
- **Drag-from-hotspot to connect**: Drag from a selected hotspot's green handle (right edge) to another screen to create a navigation connection without modal. Preview line renders in success color.
- **hotspotInteraction state** in FlowForge.jsx: `{ mode: "selected"|"draw"|"reposition"|"hotspot-drag"|"resize"|"conn-endpoint-drag", screenId, hotspotId, ... }`
- **Connection line origins**: When a connection has a `hotspotId` and the screen has `imageHeight`, lines originate from hotspot center instead of screen right edge.

### Interactive Connection Lines

- **Click to select**: Click a connection line to highlight it (solid stroke, glow, brighter color) and show draggable endpoint handles. Transparent wide hit-path (`strokeWidth: 12`, `pointerEvents: "stroke"`) provides generous click target without blocking canvas.
- **Double-click to edit**: Double-click a connection line to open HotspotModal for its associated hotspot.
- **Drag endpoints to reroute**: Drag the from/to endpoint circles to reroute a connection to a different screen. Live bezier preview follows the mouse. Only updates the connection record (`fromScreenId`/`toScreenId`), not the hotspot.
- **Delete with keyboard**: Press Delete/Backspace to remove the selected connection. Only removes the connection record; the associated hotspot remains.
- **selectedConnection state** in FlowForge.jsx: Separate from `hotspotInteraction`. Selecting a connection clears hotspot interaction and vice versa. Clicking empty canvas clears both.
- **Endpoint drag** uses `hotspotInteraction` mode `"conn-endpoint-drag"` to reuse the existing mouse pipeline: `{ mode, connectionId, endpoint: "from"|"to", mouseX, mouseY }`.
- **ConnectionLines helpers**: `computePoints(conn, screens)` extracts from/to coordinates and control point; `bezierD()` builds the SVG path string.

### Undo/Redo System

- **Snapshot-based**: Each undoable action stores a `{ screens, connections }` snapshot (deep clone via JSON) before the mutation. History stack lives in a `useRef` (`historyRef`) to avoid re-renders on push/pop.
- **Discrete mutations** (`addScreen`, `addScreenAtCenter`, `removeScreen`, `renameScreen`, `saveHotspot`, `deleteHotspot`, `quickConnectHotspot`, `addConnection`, `updateConnection`, `deleteConnection`, `updateScreenDescription`) call `pushHistory()` before mutating.
- **Continuous drags** (`moveScreen`, `moveHotspot`, `resizeHotspot`) do NOT push history per frame. Instead, `captureDragSnapshot()` is called at drag-start and `commitDragSnapshot()` at drag-end, producing a single undo step.
- **Import operations** (`replaceAll`, `mergeAll`) clear the history stack entirely.
- **Not undoable**: `updateScreenDimensions` (layout-only, triggered by image load).
- **Keyboard shortcuts**: `Cmd/Ctrl+Z` for undo, `Cmd/Ctrl+Shift+Z` for redo. Guarded: skipped when focus is in input/textarea or any modal is open.
- **UI**: Undo/redo buttons in `TopBar` between stats and "Upload Screens" button.

### AI Instruction Generation

`generateInstructions(screens, connections)` in `src/utils/generateInstructions.js` produces a markdown document describing all screens, hotspots, connections, and build instructions.

## Code Conventions

- Styles use shared objects from `theme.js`, spread with inline overrides where needed
- IDs generated via `generateId()` using timestamp + random string
- React hooks: `useState`, `useRef`, `useCallback`, `useEffect` only
- No external state management — state split between `useCanvas` and `useScreenManager` hooks
- No TypeScript — plain JSX
- No routing — single-view application
- No build system — bare ESM imports of React

## Working with This Codebase

- `src/FlowForge.jsx` is the orchestrator (~780 lines). It wires hooks to components and manages all canvas interaction state.
- To add new canvas interactions, extend `useCanvas` hook.
- To add new screen/connection operations, extend `useScreenManager` hook.
- To add new UI sections, create a component in `src/components/` and compose it in `FlowForge.jsx`.
- When adding new shared styles, add them to `styles` in `src/styles/theme.js`.
- `flowforge.jsx` at the root is a re-export for backwards compatibility.

## Maintaining This Document

**IMPORTANT**: This CLAUDE.md file should be kept up-to-date as the project evolves.

### When to Update CLAUDE.md

Update this file when:
- **Architecture changes** — New components, hooks, or file structure changes
- **New features added** — New hotspot actions, canvas tools, export formats
- **Dependencies added** — If a build system or package.json is introduced
- **Conventions evolve** — New coding patterns or file organization

### How to Update

Run the `/claude-init` skill to regenerate or enhance this file, or manually update specific sections as changes occur.
