# Changelog

All notable changes to Astradraw App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Version format: `v{upstream}-beta{astradraw}` (e.g., `v0.18.0-beta0.1`)
- `{upstream}` = Excalidraw version this is based on
- `{astradraw}` = Astradraw-specific feature version

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
