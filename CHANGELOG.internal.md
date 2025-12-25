# Changelog (Internal Development History)

All notable changes to Astradraw App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Version format: `v{upstream}-beta{astradraw}` (e.g., `v0.18.0-beta0.1`)

- `{upstream}` = Excalidraw version this is based on
- `{astradraw}` = Astradraw-specific feature version

## [0.18.0-beta0.83] - 2025-12-25

### Fixed

- **Logout autosave race condition (AUTH-002)**: Scene data was being lost after logout because autosave saved empty canvas to backend. Added `isLoggingOutAtom` flag to prevent autosave during logout with defense in depth at multiple levels (onChange handler + useAutoSave hook).

- **"Leave site?" warning during logout**: Browser's beforeunload warning no longer appears when logging out or navigating while in dashboard mode.

- **ESLint warnings in App.tsx**: Fixed missing React Hook dependencies (`setActiveCollectionId`, `isCreatingScene`, `setAppMode`) and removed unused `saveImmediately` destructuring.

## [0.18.0-beta0.82] - 2025-12-24

### Added

- **Fork Architecture Refactoring - Phase 3: Native Comment Markers**
  - Added `CommentMarker` interface to `packages/excalidraw/types.ts`
  - Added `commentMarkers` to `AppState` and `InteractiveCanvasAppState`
  - Created `renderCommentMarkers()` in `packages/excalidraw/clients.ts`
  - Canvas-rendered markers eliminate position lag during pan/zoom
  - Markers rendered in same frame as canvas (no DOM update delay)

### Changed

- **ThreadMarkersLayer** transformed from DOM renderer to data provider
  - Now writes marker data to `appState.commentMarkers` via `updateScene()`
  - Invisible hit targets preserved for click/drag interaction
  - Canvas handles visual rendering via `renderCommentMarkers()`
  - Automatic offset handling (sidebar open/close) via canvas render pipeline

## [0.18.0-beta0.81] - 2025-12-24

### Added

- **Presentation Mode Improvements (like original Excalidraw)**
  - Implicit laser pointer: Any pointer/mouse click draws laser trail in presentation mode
  - No need to select laser tool - just click and draw
  - Blocked pan/zoom in presentation mode:
    - Mouse wheel scroll
    - Touch pinch zoom
    - Safari gesture zoom
    - Space+drag panning

### Removed

- Laser toggle button from presentation controls (no longer needed)
- `isLaserActive` state from `PresentationModeState` (laser is now implicit)
- `actionTogglePresentationLaser` action (no longer needed)

## [0.18.0-beta0.80] - 2025-12-24

### Added

- **Fork Architecture Refactoring - Phase 2: Presentation Mode Actions**
  - Created `packages/excalidraw/actions/actionPresentation.ts` with 6 presentation actions
  - Added `PresentationModeState` interface to `packages/excalidraw/types.ts`
  - Added `presentationMode` to `AppState` with storage config (transient, not persisted)
  - Keyboard shortcuts now handled by action system:
    - `Alt+Shift+P`: Start presentation
    - `ArrowRight/ArrowDown/Space`: Next slide
    - `ArrowLeft/ArrowUp`: Previous slide
    - `Escape`: Exit presentation
    - `T`: Toggle theme (light/dark)
  - Added action labels to `en.json` and `ru-RU.json` locale files

### Changed

- Refactored `usePresentationMode.ts` to use action system instead of window event listeners
- Removed legacy keyboard handling from presentation hook (now handled by core action system)
- `PresentationMode.tsx` now reads state from hook instead of legacy Jotai atom

## [0.18.0-beta0.79] - 2025-12-24

### Changed

- **Fork Architecture Refactoring - Phase 1: Export Hooks**
  - Exported `useApp`, `useAppProps`, `useUIAppState` hooks from `packages/excalidraw/index.tsx`
  - Updated `AppSidebar` to use exported `useUIAppState` from main package
  - Note: Comment components still require `excalidrawAPI` prop for scroll subscriptions (`app.state` is not reactive)

---

**Note:** This is the internal development changelog. See CHANGELOG.md for the public release history.

