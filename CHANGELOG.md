# Changelog

All notable changes to Astradraw App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Version format: `v{upstream}-beta{astradraw}` (e.g., `v0.18.0-beta0.1`)
- `{upstream}` = Excalidraw version this is based on
- `{astradraw}` = Astradraw-specific feature version

## [0.18.0-beta0.9] - 2025-12-18

### Changed

- **Presentation Controls**
  - Controls now completely invisible when not hovered (was 10% opacity)
  - Faster fade-in on hover (0.15s)

- **Presentation Zoom**
  - Increased viewport zoom factor to 100% (edge-to-edge on limiting dimension)
  - Frames now fill the entire viewport height/width with no margins

## [0.18.0-beta0.8] - 2025-12-18

### Fixed

- **Presentation Mode Zoom**
  - Frames now properly zoom to fill the viewport during presentation
  - Changed from `fitToContent` (max 100% zoom) to `fitToViewport` with 95% viewport coverage
  - Matches upstream Excalidraw+ behavior with minimal margins around slides

## [0.18.0-beta0.7] - 2025-12-18

### Added

- **Slides Layout Dialog**
  - New dialog to arrange frames on canvas (Row, Column, Grid layouts)
  - Grid layout with configurable column count
  - Accessible via grid icon button in presentation panel header
  - Full translations for EN and RU

- **Presentation Toggle Button**
  - New button in footer next to undo/redo
  - Opens/closes presentation sidebar with one click
  - Styled to match undo/redo buttons with background and shadow
  - Tooltip on hover (localized)

- **Redesigned Slide Previews**
  - Large vertical card layout for slide previews
  - Hover overlay with rename and drag handle icons
  - Drag & drop reordering with visual drop indicator line
  - Auto-scroll when dragging near edges

- **FooterLeftExtra Component**
  - New tunnel component for injecting content after undo/redo in footer
  - Exported from @excalidraw/excalidraw package

### Changed

- Presentation panel now uses CSS Grid layout for fixed header/footer with scrollable content
- Slide previews are larger (280x158px canvas)
- Removed up/down arrow buttons, replaced with drag & drop

### Known Issues

- Scroll may not work when cursor is directly over slide preview images
- Toggle button may not close sidebar properly (use X button instead)

## [0.18.0-beta0.6] - 2025-12-18

### Changed

- **AstraDraw Branding**
  - New AstraDraw logo component with presentation-screen icon
  - Updated welcome screen with AstraDraw logo
  - Updated favicon to AstraDraw icon (SVG)
  - PWA manifest renamed to AstraDraw
  - Tab title changed to "AstraDraw Whiteboard"

- **Menu & Links Updates**
  - Left menu: removed Excalidraw+ and social links, kept GitHub with custom URL
  - Help dialog: disabled docs/blog/YouTube links, updated GitHub issues URL
  - Command palette: removed Excalidraw+/Twitter/Discord/YouTube commands
  - Sign up buttons changed to "Sign in" (disabled until auth implementation)

- **Export Dialog**
  - Renamed "Excalidraw+" to "AstraDraw+" 
  - Export to AstraDraw+ button disabled (coming soon)
  - Uses i18n for proper Russian translations

### Fixed

- Logo centering and sizing adjustments
- Better font for AstraDraw text (uses Assistant/Inter)

## [0.18.0-beta0.5] - 2024-12-18

### Added

- **Presentation Mode Enhancements**
  - Live frame previews in presentation sidebar panel
  - Inline frame rename: double-click name or click edit button (✎)
  - Auto-numbering: frames get order prefixes (e.g., "1. ", "2. ") when reordered
  - Order persistence: frame order is saved via name prefixes, persists across sessions
  - Clean presentation view: hamburger menu, zoom controls, zen mode button all hidden

### Fixed

- Frame order now respects custom ordering set in sidebar (not just alphabetical)
- Laser pointer now works correctly in presentation mode (fixed canvas panning conflict)
- Frame borders and names properly hidden during presentation
- Russian translation: changed "рамки" to "фреймы" for design frames

### Technical

- Added `PRESENTATION_MODE.md` documentation
- CSS class `excalidraw-presentation-mode` on body for UI hiding
- Helper functions for order prefix management: `extractOrderPrefix()`, `removeOrderPrefix()`, `setOrderPrefix()`
- Frame previews use `exportToCanvas` with `exportingFrame` parameter

## [0.18.0-beta0.4] - 2024-12-18

### Fixed

- Pen toolbar now stays fixed on right edge, Properties panel opens to its left
- Properties panel no longer overlaps with pen toolbar

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
