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
    ConnectionLines.jsx     — SVG layer rendering navigation arrows between screens
    HotspotModal.jsx        — Modal for creating/editing hotspot tap areas
    InstructionsPanel.jsx   — Panel displaying generated AI build instructions
    RenameModal.jsx         — Modal for renaming screens
    TopBar.jsx              — Top toolbar with upload/generate actions
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
```

### Component Hierarchy

```
FlowForge (src/FlowForge.jsx)
  ├── TopBar — Toolbar: upload, add blank, generate instructions
  ├── Canvas area
  │   ├── ConnectionLines — SVG bezier arrows between screens
  │   ├── ScreenNode[] — Draggable screen cards
  │   └── EmptyState — Shown when no screens exist
  ├── Sidebar — Selected screen details, hotspot list, incoming links
  ├── HotspotModal — Create/edit hotspot tap areas and actions
  ├── InstructionsPanel — Generated AI build instructions viewer
  └── RenameModal — Screen rename dialog
```

### Key Data Structures

- **screens[]** — `{ id, name, x, y, width, imageData, hotspots[] }`
- **connections[]** — `{ id, fromScreenId, toScreenId, hotspotId, label, action }`
- **hotspot** — `{ id, label, x, y, w, h (all %), action, targetScreenId }`
- **Hotspot actions**: `navigate`, `back`, `modal`, `api`, `custom`

### Custom Hooks

- **useCanvas** — Manages pan/zoom state, canvas mouse events (drag, pan, wheel zoom). Returns `{ pan, zoom, isPanning, canvasRef, handleDragStart, handleMouseMove, handleMouseUp, handleCanvasMouseDown }`.
- **useScreenManager(pan, zoom)** — Manages screens, connections, and hotspot CRUD. Returns screen/connection state and all mutation callbacks.

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

- `src/FlowForge.jsx` is the orchestrator (~160 lines). It wires hooks to components.
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
