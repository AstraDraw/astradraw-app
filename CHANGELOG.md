# Changelog

All notable changes to Astradraw App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Version format: `v{upstream}-beta{astradraw}` (e.g., `v0.18.0-beta0.1`)

- `{upstream}` = Excalidraw version this is based on
- `{astradraw}` = Astradraw-specific feature version

## [0.18.0-beta0.30] - 2025-12-20

### Changed

- **Backend Service Renamed**
  - Renamed from `excalidraw-storage-backend` to `astradraw-api`
  - Docker service renamed from `storage` to `api`
  - New image: `ghcr.io/astrateam-net/astradraw-api:0.5`

- **Faster Docker Builds**
  - Switched from `bcrypt` to `bcryptjs` (pure JS, no native compilation)
  - Changed base image from `node:20-alpine` to `node:20-slim`
  - Removed python/make/g++ build dependencies
  - Build time reduced from ~10min to ~2min

## [0.18.0-beta0.29] - 2025-12-20

### Added

- **Workspace Left Sidebar (Excalidraw+ Style)**
  - Toggle button next to hamburger menu (backtick ` shortcut)
  - User/team selector dropdown at top
  - Quick search with ⌘P keyboard shortcut
  - "Private" and "Dashboard" section headers
  - Auto-open sidebar when user logs in
  - localStorage persistence for sidebar preference

- **Scene Card Context Menu**
  - Right-click or "..." button on scene cards
  - Rename option with inline editing
  - Duplicate scene functionality
  - Delete option with confirmation
  - Purple accent color for active/hover states

- **User Registration System**
  - New `/api/v2/auth/register` endpoint
  - Sign-up form in login dialog (toggle between sign-in/sign-up)
  - bcrypt password hashing (12 rounds)
  - Enable with `ENABLE_REGISTRATION=true` env var
  - Client-side validation (email format, password match, length)

- **New Backend APIs**
  - `POST /auth/register` - User registration
  - `POST /workspace/scenes/:id/duplicate` - Duplicate scene
  - `GET /auth/status` now includes `registrationEnabled` flag

- **Database Changes**
  - `oidcId` field now optional (supports local-only users)
  - Added `passwordHash` field for bcrypt passwords
  - Migration: `20251220100000_add_password_hash`

### Changed

- Scene cards now show author name ("by {username}")
- Improved relative date formatting (minutes, hours, days)
- Lock icon for private scenes

### Fixed

- TypeScript error in StickersPanel.tsx (TranslationKeys typing)

## [0.18.0-beta0.28] - 2025-12-20

### Added

- **Workspace Feature (MVP)**
  - User authentication via OIDC (Authentik integration)
  - Left sidebar with workspace panel for managing scenes
  - Save scenes to personal workspace
  - Load and open saved scenes
  - Scene list with thumbnails and metadata
  - User menu with login/logout functionality

- **New Backend APIs**
  - `/api/v2/auth/*` - OIDC authentication endpoints
  - `/api/v2/workspace/scenes/*` - Scene CRUD operations
  - PostgreSQL database for user/scene metadata
  - JWT-based session management with HTTP-only cookies

- **New Environment Variables**
  - `OIDC_ISSUER_URL` - Authentik OIDC provider URL
  - `OIDC_CLIENT_ID` - OIDC client ID
  - `OIDC_CLIENT_SECRET` - OIDC client secret
  - `JWT_SECRET` - Secret for signing JWT tokens
  - `DATABASE_URL` - PostgreSQL connection string

- **Translations**
  - Added workspace translations (en, ru-RU)

## [0.18.0-beta0.27] - 2025-12-20

### Fixed

- **Footer Button Layout**
  - Separated Presentation and Talktrack buttons into individual islands
  - Added proper spacing between buttons (0.375rem gap)
  - Added margin before buttons to separate from undo/redo (0.5rem)
  - Each button now has its own background and shadow (matching undo/redo style)

## [0.18.0-beta0.26] - 2025-12-20

### Added

- **Talktrack Quick Access Button**
  - Added Talktrack toggle button in footer toolbar (next to Presentation button)
  - Both buttons share a unified container with consistent styling
  - Tooltips show "Presentation" / "Презентация" and "Talktrack" labels

### Changed

- **Sidebar Tab Triggers**
  - Removed "Comments" tab from sidebar triggers (still "Coming soon")
  - Sidebar now shows: Stickers, Talktrack, Presentation tabs
  - Fixed close button being cut off due to too many tabs

### Fixed

- **Footer Button Styling**
  - Unified Presentation and Talktrack button styles
  - Both buttons now in shared container matching undo/redo styling

## [0.18.0-beta0.25] - 2025-12-20

### Fixed

- **TypeScript Build Errors**
  - Fixed `FileId` branded type import in `StickersPanel.tsx`
  - Fixed `CONTENT_TABS` const type assertions for proper literal type inference
  - All TypeScript checks now pass without errors

- **Talktrack Verification**
  - Confirmed dual canvas capture (static + interactive) working correctly
  - Verified laser pointer capture functionality
  - Validated console logging for canvas detection

## [0.18.0-beta0.24] - 2025-12-20

### Added

- **Talktrack UI Improvements**
  - Recording controls and camera bubble are now independently draggable
  - Recording controls start at bottom-left with offset from hamburger menu (80px)
  - Camera bubble defaults to viewport top-right position
  - Users can reposition both elements to their preferred locations

- **Video Processing Status Tracking**
  - Show "Processing..." indicator on videos being processed by Kinescope
  - Automatic polling every 10 seconds for processing videos
  - Visual spinner and overlay on thumbnails during processing
  - Auto-update when video becomes ready
  - Console logging for debugging status checks

### Fixed

- Corrected Kinescope status mapping: API returns `"done"` not `"ready"`
- Processing indicator now properly disappears when videos are ready
- Improved status check reliability with better error handling

### Changed

- Enhanced drag UX with grab/grabbing cursor feedback
- Button clicks don't trigger toolbar dragging
- Added debug console logging for status checks and canvas detection

## [0.18.0-beta0.23] - 2025-12-20

### Added

- **Laser Pointer Capture in Talktrack**
  - Recordings now capture both static and interactive canvas layers
  - Laser pointer drawings are now visible in recorded videos
  - Selection boxes and other interactive overlays also captured

### Changed

- **Improved Talktrack UI**
  - Recording controls moved from top-right to bottom-left for better visibility
  - Camera bubble now defaults to top-right position (instead of top-left)
  - Controls no longer overlap with common workspace areas

### Fixed

- Interactive canvas elements (laser, selections) now properly recorded in Talktrack videos

### Technical

- `TalktrackRecorder` now finds and composites both `.static` and `.interactive` canvas layers
- Drawing order: static canvas → interactive canvas → camera PIP
- Improved default positioning for better UX during recording

## [0.18.0-beta0.22] - 2025-12-20

### Security

- **Enhanced Talktrack Security**
  - Removed Kinescope API keys from frontend environment variables
  - API keys now only configured in storage backend (proxy-only approach)
  - Prevents API key exposure in browser (Network tab, `window.__ENV__`)
  - Frontend automatically uses storage backend proxy for all Talktrack operations
  
### Changed

- Updated `isKinescopeConfigured()` to check for storage backend URL availability
- Simplified environment variable documentation in `env.example`
- Removed `VITE_APP_KINESCOPE_API_KEY` and `VITE_APP_KINESCOPE_PROJECT_ID` from Docker Compose

### Technical

- Talktrack now requires storage backend to be configured
- Fallback to direct upload still supported if API keys are provided (not recommended)
- Better security posture for production deployments

## [0.18.0-beta0.21] - 2025-12-20

### Added

- **Talktrack Storage Backend Proxy**
  - Automatic proxy usage when `VITE_APP_HTTP_STORAGE_BACKEND_URL` is configured
  - Keeps Kinescope API key secure on server-side
  - Falls back to direct browser upload if proxy not available
  - Backward compatible with existing direct upload approach

### Changed

- Updated `kinescopeApi.ts` to prefer storage backend proxy over direct API calls
- Both upload and delete operations now support secure proxy routing

### Technical

- Frontend automatically detects storage backend URL and routes through proxy
- No breaking changes - direct upload still works if backend URL not set
- Improved security for production deployments

## [0.18.0-beta0.20] - 2025-12-20

### Added

- **Talktrack Board Recordings** (Miro-like feature)
  - Record canvas walkthroughs with camera and microphone
  - Picture-in-picture camera preview during recording (draggable, 120px bubble)
  - Recording controls: pause/resume, restart, delete, stop
  - 3-second countdown before recording starts
  - Upload progress modal with animated progress bar and file size display
  - Recordings stored in Kinescope cloud video platform
  - Add recordings to canvas as embeddable video elements
  - Rename and delete recordings (also removes from Kinescope)
  - Copy embed link to clipboard

- **Kinescope Integration**
  - Direct browser-to-Kinescope video upload
  - Environment variable configuration: `KINESCOPE_API_KEY`, `KINESCOPE_PROJECT_ID`
  - Docker secrets support via `_FILE` suffix for secure deployments
  - Video names prefixed with "AstraDraw" for easy identification

- **New Sidebar Tab**
  - Video camera icon in sidebar for Talktrack panel
  - Recording library showing all previous recordings
  - Empty state with call-to-action when no recordings exist

- **New Translation Keys** (English & Russian)
  - Full i18n support for all Talktrack UI strings
  - Setup dialog, recording toolbar, upload progress, error messages

### Technical

- New components: `TalktrackPanel`, `TalktrackSetupDialog`, `TalktrackToolbar`, `TalktrackManager`
- `TalktrackRecorder` class using MediaRecorder API with canvas capture
- `kinescopeApi.ts` for Kinescope REST API integration
- Runtime environment variable injection via `window.__ENV__`

## [0.18.0-beta0.19] - 2025-12-20

### Changed

- **Improved Emoji Tab UX**
  - Replaced GIPHY animated emojis with Twemoji static emojis (better quality, more complete set)
  - Renamed "Static" tab to "Emojis" for clearer navigation
  - GIPHY emojis tab is commented out (can be re-enabled if needed)

- **Tab Overflow Scrolling**
  - Added horizontal scroll to content tabs when they overflow
  - Tabs no longer get cut off on narrow screens

### Fixed

- **Broken Emoji Images**
  - Filter out emojis with version > 14.0 (Twemoji 14.0.2 only supports Emoji 14.0 and below)
  - Prevents broken image icons for newer Unicode emojis

## [0.18.0-beta0.18] - 2025-12-20

### Added

- **Animated GIF/Sticker Support**
  - GIFs, stickers, and animated emojis from GIPHY are now inserted as embeddable elements
  - Content plays animated on the canvas using iframes
  - Transparent stroke for clean appearance (no border around embedded content)

- **Static Emoji Support (Twemoji)**
  - New "Static" tab in Stickers panel for Twitter Emoji (Twemoji)
  - High-quality SVG format - scales without quality loss
  - Categorized by emoji groups (Smileys, People, Animals, Food, etc.)
  - Category navigation bar with emoji icons
  - Search functionality across all emoji names
  - Emojis are inserted as SVG images on canvas
  - Attribution: Twemoji by Twitter (CC-BY 4.0)

- **New Translation Keys**
  - `stickers.staticEmojis` - "Static" tab label
  - `stickers.popular` - "Popular" section header
  - `stickers.poweredByTwemoji` - Twemoji attribution text

### Changed

- **Sidebar Hover Animation**
  - Fixed hover preview animation for GIPHY content
  - Changed from `pointer-events: none` to `-webkit-user-drag: none` to allow hover while preventing native drag

### Technical

- New `twemojiApi.ts` module for Twemoji integration
  - Fetches emoji data from `unicode-emoji-json` dataset
  - Converts emoji characters to Twemoji CDN URLs
  - Uses jsdelivr CDN: `cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/`

## [0.18.0-beta0.17] - 2025-12-20

### Added

- **Drag and Drop for Stickers & GIFs**
  - Items can now be dragged from sidebar directly onto the canvas
  - Drop position determines where the image is placed
  - Grab cursor indicates draggable items

### Fixed

- **Viewport Centering**
  - Fixed calculation so click-to-insert places images at visible viewport center
  - Previously images were inserted outside the visible area

### Changed

- **Removed Toast Notification**
  - Removed unnecessary "Click to add to canvas" toast after insertion
  - The action is self-evident and the toast was redundant

## [0.18.0-beta0.16] - 2025-12-20

### Added

- **Stickers & GIFs Sidebar (GIPHY Integration)**
  - New sidebar tab for browsing and inserting GIFs, stickers, and emojis from GIPHY
  - Search functionality with debounced queries
  - Content tabs: All, Stickers, Emojis, GIFs
  - Trending content display when not searching
  - One-click insertion to canvas center
  - Masonry grid layout matching GIPHY UI design
  - "Powered by GIPHY" attribution footer
  - Support for runtime API key injection via Docker environment variables
  - English and Russian translations

- **New Icon**
  - Added `stickerIcon` to icons.tsx for the new sidebar tab

### Changed

- **Dockerfile**
  - Added `VITE_APP_GIPHY_API_KEY` environment variable placeholder

- **docker-entrypoint.sh**
  - Added runtime injection for `VITE_APP_GIPHY_API_KEY`
  - API key is read from environment and injected into `window.__ENV__`

- **docker-compose.yml** (parent repo)
  - Added `VITE_APP_GIPHY_API_KEY=${GIPHY_API_KEY:-}` to app service

- **env.example** (parent repo)
  - Documented `GIPHY_API_KEY` configuration

### Notes

- GIFs are inserted as static images (Excalidraw does not support animated images)
- Requires GIPHY API key - get one free at https://developers.giphy.com/

## [0.18.0-beta0.15] - 2025-12-20

### Added

- **Localized Library Names (i18n)**
  - Library section titles now support multiple languages
  - Add `"names"` object in `.excalidrawlib` files with language codes as keys (e.g., `"ru-RU": "Архитектура ПО"`)
  - Automatically displays localized name based on user's UI language
  - Fallback chain: exact match → language prefix → English → `name` field
  - Search works across all localized names

- **Enhanced Library Search**
  - Search now includes text content inside library item elements
  - Search in library names (both default and localized)
  - Example: searching "Menu" finds items containing text element with "Menu"

### Changed

- **LibraryItem Type**
  - Added `libraryNames?: Record<string, string>` field for localized names
  - Added `LibraryLocalizedNames` type alias

- **docker-entrypoint.sh**
  - Now extracts `"names"` object from library JSON for i18n support
  - Passes `libraryNames` to each generated library item

## [0.18.0-beta0.14] - 2025-12-20

### Added

- **Collapsible Library Sections**
  - Published library items are now grouped by library name in the sidebar
  - Each library section is expandable/collapsible with a toggle button
  - Library names extracted from `"name"` field in `.excalidrawlib` files, or auto-generated from filename (e.g., `software-architecture` → "Software Architecture")
  - Item count displayed next to each library name
  - Search continues to work across all items regardless of collapsed state (shows flat results)
  - New `libraryName` field added to `LibraryItem` type for grouping

### Changed

- **docker-entrypoint.sh**
  - Now extracts `"name"` field from library JSON if present
  - Falls back to humanized filename (converts hyphens/underscores to spaces, capitalizes words)
  - Adds `libraryName` field to each generated library item

## [0.18.0-beta0.13] - 2025-12-20

### Added

- **Pre-bundled Libraries Support**
  - Docker volume mount for pre-installed libraries (`/app/libraries/*.excalidrawlib`)
  - Libraries are automatically parsed at container startup and loaded into the app
  - New `getBundledLibraries()` helper in `env.ts` for accessing bundled libraries
  - `docker-entrypoint.sh` generates `bundled-libraries.js` from mounted `.excalidrawlib` files

- **Library URL Whitelist**
  - Custom `validateLibraryUrl` function allowing `#addLibrary` URLs from:
    - `astrateam.net` and all subdomains (e.g., `libraries.astrateam.net`)
    - `excalidraw.com` (upstream compatibility)
    - `raw.githubusercontent.com` (GitHub-hosted libraries)

### Changed

- **Rebranding**
  - Sidebar library section title changed from "Excalidraw Library" to "AstraDraw Library"
  - Updated English (`en.json`) and Russian (`ru-RU.json`) locale files

## [0.18.0-beta0.12] - 2025-12-19

### Changed

- **Large Image Support**
  - Fully resolved the consistent 4MB limit issue by increasing it to 200MB across frontend, storage backend, and WebSocket room server.
  - Updated all frontend components to correctly reference the new 200MB global limit.

## [0.18.0-beta0.11] - 2025-12-19

### Added

- Support for 204 No Content status from storage backend, allowing clean initialization without console error logs.

## [0.18.0-beta0.10] - 2025-12-18

### Changed

- **File Size Limit**
  - Increased `MAX_ALLOWED_FILE_BYTES` from 4MB to 200MB for larger file support in collaboration
  - Self-hosted deployments with fast networks can now share larger images/documents

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
