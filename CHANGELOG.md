# Changelog

All notable changes to Astradraw App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Version format: `v{upstream}-beta{astradraw}` (e.g., `v0.18.0-beta0.1`)
- `{upstream}` = Excalidraw version this is based on
- `{astradraw}` = Astradraw-specific feature version

## [0.18.0-beta0.3] - 2024-12-18

### Added

- Pen Settings Modal: double-click any pen to open configuration dialog
  - All Perfect Freehand settings (thinning, smoothing, streamline, easing)
  - Stroke/fill colors and styles
  - Pressure sensitivity and outline settings
  - Start/end taper options
- Russian translation support for pen modal options
- Pen tooltips now show human-readable names (e.g., "Highlighter", "Fine tip pen")

### Changed

- Renamed "Excalidraw+" button to "AstraDraw" (disabled, placeholder for future)
- Renamed "Excalidraw Default" pen to "Default"

### Technical

- New `PenSettingsModal.tsx` component with full pen customization
- Added `constants.ts` with easing functions map
- Translations added to `en.json` and `ru-RU.json` under `pens` namespace

## [0.18.0-beta0.2] - 2024-12-18

### Fixed

- Pen toolbar now correctly positions to the left of sidebar when sidebar is open
- Added missing `--right-sidebar-width` CSS variable (360px)
- Fixed pen toolbar z-index to be above sidebar layer
- Used reactive `useUIAppState()` hook for proper sidebar state detection

## [0.18.0-beta0.1] - 2024-12-18

### Added

- Custom pen presets inspired by Obsidian Excalidraw Plugin
  - Default, Highlighter, Finetip, Fountain, Marker, Thick-thin, Thin-thick-thin
  - Vertical toolbar on right side of canvas
  - Toolbar shifts left when sidebar is open
- Extended `AppState` with pen-related fields (`currentStrokeOptions`, `resetCustomPen`, `customPens`)
- Extended `ExcalidrawFreeDrawElement` with `customStrokeOptions` field
- Easing functions support for stroke rendering
- Comprehensive pen implementation documentation (`CUSTOM_PENS.md`)

### Changed

- Modified `getFreedrawOutlinePoints()` to use custom stroke options from elements
- Pen toolbar respects sidebar open/closed state

### Technical

- New `excalidraw-app/pens/` module with pen presets and toolbar component
- TypeScript types for `PenStrokeOptions`, `PenOptions`, `PenStyle`, `PenType`

## [0.18.0-beta0.0] - 2024-12-15

### Added

- Initial Astradraw release based on Excalidraw v0.18.0
- HTTP storage backend support via environment variables
- Self-hosted deployment configuration
- Docker image with nginx
- GitHub Actions workflow for releases
