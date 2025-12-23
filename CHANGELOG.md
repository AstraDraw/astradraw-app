# Changelog

All notable changes to Astradraw App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Version format: `v{upstream}-beta{astradraw}` (e.g., `v0.18.0-beta0.1`)

- `{upstream}` = Excalidraw version this is based on
- `{astradraw}` = Astradraw-specific feature version

## [0.18.0-beta0.64] - 2025-12-23

### Added

- **React Query for Data Fetching** - Added TanStack React Query v5 for server state management
  - Installed `@tanstack/react-query` package
  - Created `lib/queryClient.ts` with centralized QueryClient and type-safe query key factory
  - Added `QueryClientProvider` wrapper in `index.tsx`
  - Automatic caching with 5-minute stale time and 30-minute garbage collection
  - Request deduplication - multiple components using same query share one request
  - Background refetching on window focus for fresh data

### Changed

- **Hooks Migration to React Query**
  - `useScenesCache` - Rewritten to use `useQuery`, same interface maintained
  - `useWorkspaces` - Updated to use `useQuery` for fetching, Jotai for selection
  - `useCollections` - Updated to use `useQuery` for fetching, Jotai for selection
  - `useSceneActions` - Updated to use `queryClient.invalidateQueries()`
  - All CRUD operations now invalidate relevant queries automatically

### Removed

- `useSidebarScenes.ts` - Redundant hook, functionality merged into `useScenesCache`
- Manual cache atoms from `settingsState.ts`:
  - `scenesCacheAtom`, `setScenesCacheAtom`, `invalidateScenesCacheAtom`, `clearScenesCacheAtom`
  - `scenesRefreshAtom`, `triggerScenesRefreshAtom`

## [0.18.0-beta0.63] - 2025-12-23

### Changed

- **State Management Migration** - Migrated workspace/collections data to Jotai atoms
  - Added new atoms: `workspacesAtom`, `currentWorkspaceAtom`, `collectionsAtom`
  - Added derived atoms: `privateCollectionAtom`, `activeCollectionAtom`
  - Updated `useWorkspaces` and `useCollections` hooks to use atoms
  - Removed `useWorkspaceData` hook (functionality merged into other hooks)
  - Updated 7 components to read from atoms directly:
    - `WorkspaceMainContent.tsx`, `DashboardView.tsx`, `CollectionView.tsx`
    - `SearchResultsView.tsx`, `FullModeNav.tsx`, `SidebarHeader.tsx`
  - Eliminated prop drilling for workspace/collections data
  - Single source of truth for shared state across the app

## [0.18.0-beta0.62] - 2025-12-23

### Changed

- **App.tsx Refactoring** - Split monolithic App.tsx (2,473 lines) into focused hooks
  - `useAutoSave.ts` - Save state machine, debounce, retry, offline detection (~230 lines)
  - `useSceneLoader.ts` - Scene loading from workspace URLs, auto-collab (~250 lines)
  - `useUrlRouting.ts` - Popstate handling, URL parsing (~120 lines)
  - `useKeyboardShortcuts.ts` - Ctrl+S, Cmd+P, Cmd+[, Cmd+] (~130 lines)
  - `useWorkspaceData.ts` - Workspace/collections loading (~150 lines)
  - App.tsx now acts as orchestrator wiring hooks together
  - Each hook has single responsibility and is testable in isolation

## [0.18.0-beta0.61] - 2025-12-23

### Changed

- **API Client Refactoring** - Split `workspaceApi.ts` (1,634 lines) into modular structure
  - Created `auth/api/` directory with domain-specific modules
  - `client.ts` - Base fetch wrapper with `ApiError` class and centralized error handling
  - `types.ts` - All TypeScript interfaces (~120 lines)
  - `scenes.ts` - Scene CRUD, collaboration, thumbnails
  - `talktracks.ts` - Talktrack recording management
  - `users.ts` - User profile and avatar
  - `workspaces.ts` - Workspace CRUD and avatar
  - `members.ts` - Workspace member management
  - `invites.ts` - Invite link management
  - `teams.ts` - Team CRUD
  - `collections.ts` - Collection CRUD and team access
  - Full backward compatibility via re-exports from `workspaceApi.ts`

## [0.18.0-beta0.60] - 2025-12-23

### Added

- **Error Boundaries** - Granular error handling for key components
  - Reusable `ErrorBoundary` component with reset capability
  - Context-specific fallbacks: `SidebarErrorFallback`, `ContentErrorFallback`, `GenericErrorFallback`
  - Component errors no longer crash the entire app
  - Dark mode support and i18n (English + Russian)
  - Wrapped `WorkspaceSidebar` and `WorkspaceMainContent` with error boundaries

## [0.18.0-beta0.59] - 2025-12-23

### Added

- **Animated Galaxy Background** ✨🌌
  - Welcome screen now features an immersive animated space background
  - Slow-moving nebula clouds with purple→blue brand gradient
  - Twinkling star field with multiple sizes and subtle colored stars
  - Seamless infinite drift animation using CSS pseudo-elements
  - Dark mode only (light mode has clean white background)
  - Disabled on mobile for performance
  - Toggle via `$enable-galaxy-background` SCSS variable

### Changed

- **New Logo Design** - Updated AstraDraw logo with new icon and text styling

  - New triangle/sparkle icon with purple→blue gradient
  - "AstraDraw" text using Alexandria Google Font
  - "Astra" in bold (700), "Draw" in light (300), 5% letter spacing
  - Increased logo size on welcome screen

- **Updated Slogan** - "Space for journeys through galaxies of ideas ✨"

  - New slogan text in both English and Russian
  - Alexandria font (Thin/100 weight) instead of Excalifont
  - Slightly larger and better contrast

- **Dark Mode Default** - App now defaults to dark mode for new users
  - Showcases the animated galaxy background on first visit
  - User preference still saved in localStorage
  - Existing users keep their saved preference

### Fixed

- **Sidebar border visibility** - Fixed thin line visible on left edge when sidebar is closed
  - Border is now transparent when closed, visible only when open

### Technical

- Added Alexandria font (weights 100, 300, 400, 700) to index.html
- Galaxy background uses CSS pseudo-elements (::before, ::after) for layers
- Nebula uses 200% size with transform animation to prevent edge visibility
- Stars use repeating background-image with background-position animation
- Added comprehensive code comments and documentation

## [0.18.0-beta0.58] - 2025-12-22

### Changed

- **Runtime environment config** - Added `<script src="/env-config.js">` to `index.html`
  - Eliminates need for Docker entrypoint to inject script tag
  - Works for both native development (`just dev`) and Docker deployment
  - Docker entrypoint now only generates the file content, no HTML modification

### Technical

- Commented out script injection logic in `docker-entrypoint.sh` (to be removed after testing)
- Added `public/env-config.js` to `.gitignore` (generated at runtime)

## [0.18.0-beta0.57] - 2025-12-22

### Added

- **Scene Thumbnail Previews** 🖼️
  - Canvas thumbnails now appear in scene cards (sidebar, dashboard, collections)
  - Thumbnails generated automatically after each successful save (solo and collab)
  - Lightweight hash check to skip redundant generation
  - 600px PNG format, uploaded to MinIO/S3
  - Non-blocking, best-effort: errors logged but never block saves

### Changed

- **CSS Hide/Show pattern improved** - Dashboard now uses `aria-hidden` attribute for visibility control
  - Fixes conflict with `display: flex` layout requirements
  - Ensures proper scrolling in dashboard content area

### Technical

- New `thumbnailGenerator.ts` utility with `maybeGenerateAndUploadThumbnail()`
- Added `setSceneId()` to `CollabAPI` for thumbnail generation in collab mode
- Added `uploadSceneThumbnail()` API function

## [0.18.0-beta0.56] - 2025-12-22

### Added

- **Auto-Collaboration for Shared Collections** 🎉

  - Scenes in non-private collections of SHARED workspaces automatically enable real-time collaboration
  - No need to click "Share" - collaboration starts immediately when opening the scene
  - Multiple users see each other's cursors and edits in real-time
  - Works like Google Docs - if you have access, you're automatically collaborating

- **isAutoCollab flag** - Preserves scene data when auto-joining collaboration

  - Prevents scene reset on first load
  - Ensures initial data is synced to room storage

- **isAutoCollabSceneAtom** - Jotai atom to track auto-collab state

### Changed

- **SaveStatusIndicator hidden during collaboration** - Collab has its own save mechanism
- **"End Session" button hidden for auto-collab scenes** - Collaboration can't be stopped for shared scenes
- **Profile changes now update sidebar immediately** - Added `refreshUser()` call after profile save

### Fixed

- **AES-128-GCM key generation** - Fixed room key to be 22-char base64url (was 40-char nanoid)
- **Scene data loss on collaboration start** - `isAutoCollab: true` prevents `resetScene()` call

## [0.18.0-beta0.55] - 2025-12-22

### Fixed

- **Scene created in wrong collection** - Creating a scene from CollectionView now correctly assigns it to the selected collection instead of defaulting to Private
  - Root cause: App.tsx `collections` state wasn't synced when new collections were created from sidebar
  - Fix: App.tsx now subscribes to `collectionsRefreshAtom` to reload collections when they change

## [0.18.0-beta0.54] - 2025-12-22

### Added

- **Autosave Status Indicator** - Google Docs-style save status in top-right corner
  - Shows save states: saved, saving, pending, error, offline
  - Editable scene title with inline rename
  - Debounced autosave (2s) with backup interval (30s)
  - Offline detection and auto-retry on reconnect
  - beforeunload warning for unsaved changes

### Fixed

- **Layout shift in top menu** - Fixed widths for save status (145px) and scene title (160px)
- **Bidirectional title sync** - Renaming in sidebar now updates top-right indicator
- **False "unsaved" status** - Data comparison prevents false positives from Excalidraw's frequent onChange calls

### Changed

- Shortened Russian save status translations for better fit ("Не сохранено" instead of "Несохранённые изменения")

## [0.18.0-beta0.53] - 2025-12-22

### Fixed

- **CRITICAL: CSS Hide/Show Pattern for Scene Data Preservation**

  This is a **CHECKPOINT RELEASE** - a stable point to revert to if issues arise.

  **Problem Solved:**

  - Scene data was lost when navigating between dashboard and canvas
  - The "Meet Excalidraw" welcome screen appeared instead of saved drawings
  - Auto-save could overwrite scenes with empty data, causing permanent data loss

  **Root Cause:**

  - Conditional rendering (`if (appMode === "dashboard") return <Dashboard />`)
  - Excalidraw unmounted when switching to dashboard, losing all internal state
  - When remounting, Excalidraw showed welcome screen instead of loaded data

  **Solution:**

  - Both Dashboard and Canvas are now **always mounted**
  - CSS `display: none` toggles visibility instead of conditional rendering
  - Excalidraw never unmounts, preserving all state
  - Scene data loaded via `excalidrawAPI.updateScene()`

  **Key Changes:**

  - Removed early return for dashboard mode in App.tsx
  - Added CSS Hide/Show structure with `inert` attribute for accessibility
  - Made `handleKeyboardGlobally` and `autoFocus` conditional on `appMode`
  - Added `body.excalidraw-disabled` class for keyboard blocking
  - Added canvas container styles in index.scss

  **See:** `/docs/CRITICAL_CSS_HIDE_SHOW_FIX.md` for full documentation

### Removed

- Debug navigation tooling (was added for investigation, now removed)
- `debug/navigationLogger.ts` - No longer needed
- Debug instrumentation in App.tsx

## [0.18.0-beta0.49] - 2025-12-21

### Added

- **URL-Based Navigation System** (Major Feature)

  - All application views now have unique, shareable URLs
  - Browser back/forward buttons work correctly throughout the app
  - Page refresh preserves current view and scene data
  - Direct scene links: `/workspace/{slug}/scene/{id}`

  **URL Patterns:**

  - Dashboard: `/workspace/{slug}/dashboard`
  - Private collection: `/workspace/{slug}/private`
  - Named collection: `/workspace/{slug}/collection/{id}`
  - Scene (canvas): `/workspace/{slug}/scene/{id}`
  - Profile: `/profile`
  - Workspace settings: `/workspace/{slug}/settings`
  - Team members: `/workspace/{slug}/members`
  - Teams & collections: `/workspace/{slug}/teams`
  - Invite links: `/invite/{code}`
  - Anonymous mode: `/` (root)

- **New Router Module** (`excalidraw-app/router.ts`)

  - `parseUrl()` - Extract route information from current URL
  - `buildSceneUrl()`, `buildDashboardUrl()`, `buildCollectionUrl()`, etc.
  - `navigateTo()` and `replaceUrl()` for programmatic navigation
  - Helper functions: `isWorkspaceRoute()`, `isDashboardRoute()`, `isCanvasRoute()`

- **New Jotai Atoms for URL State**
  - `currentWorkspaceSlugAtom` - Current workspace from URL
  - `currentSceneIdAtom` - Current scene ID from URL
  - `currentSceneTitleAtom` - Current scene title
  - `isPrivateCollectionAtom` - Whether viewing private collection
  - `navigateToSceneAtom` - Navigate to a specific scene with URL update

### Changed

- **Navigation Atoms Now Push URLs**

  - `navigateToDashboardAtom` → pushes `/workspace/{slug}/dashboard`
  - `navigateToCollectionAtom` → pushes `/workspace/{slug}/collection/{id}` or `/private`
  - `navigateToCanvasAtom` → pushes scene URL when scene is loaded
  - `navigateToProfileAtom` → pushes `/profile`
  - `navigateToWorkspaceSettingsAtom` → pushes `/workspace/{slug}/settings`
  - `navigateToMembersAtom` → pushes `/workspace/{slug}/members`
  - `navigateToTeamsCollectionsAtom` → pushes `/workspace/{slug}/teams`

- **App.tsx URL Synchronization**
  - Initial URL parsing on mount to restore state
  - `popstate` event listener for browser back/forward
  - URL updates when creating or opening scenes

### Fixed

- **Scene Data Loss on Navigation** (Critical Bug Fix)

  - Added localStorage sync guard: `if (currentSceneIdRef.current) return;`
  - Prevents `syncData` from overwriting workspace scene data with localStorage
  - Scene data now persists correctly when navigating between dashboard and canvas

- **Browser Back/Forward Not Working**

  - All navigation now properly updates browser history
  - `popstate` event handler restores correct view state

- **"Failed to open scene" When Clicking Scene from Dashboard** (Critical Bug Fix - WIP)

  - **Problem:** After creating a scene and returning to dashboard, clicking on it showed "Failed to open scene" error or reset the canvas
  - **Root causes identified:**
    1. Infinite loop: `handleUrlRoute` called navigation atoms that pushed URLs → triggered popstate → loop
    2. Scene not loading: `handlePopState` didn't set `appMode` or call scene loading
    3. Initial URL ignored: Page load with dashboard URL showed canvas instead of dashboard
  - **Solution:**
    - `handleUrlRoute` now sets state directly (`setAppMode`, `setDashboardView`) instead of calling navigation atoms
    - `handlePopState` sets `appMode("canvas")` before loading scenes
    - Initial URL parsing now calls `handleUrlRoute` for dashboard routes
    - Centralized scene loading in `App.tsx` via `loadSceneFromUrl()` function
    - Removed `onOpenScene` prop from child components - they use `navigateToSceneAtom` directly
  - **Key principle:** URL navigation is one-way - popstate handlers set state directly, never push URLs
  - **Status:** Basic navigation working; needs further testing across all scenarios (collections, teams, etc.)

### Technical

- New `router.ts` module with comprehensive URL routing utilities
- Updated `settingsState.ts` with URL-aware navigation atoms
- Updated `Settings/index.ts` to export new atoms
- `WorkspaceSidebar.tsx` syncs workspace slug to Jotai atom
- `FullModeNav.tsx` passes `isPrivate` flag for collection navigation

## [0.18.0-beta0.48] - 2025-12-21

### Added

- **Invite Link Acceptance Page**

  - New `InviteAcceptPage` component with login flow for `/invite/:code` URLs
  - Automatic workspace join after successful authentication
  - Nginx config for SPA client-side routing
  - Translations for invite UI (en, ru-RU)

- **Cross-Component State Sync**
  - `collectionsRefreshAtom` / `triggerCollectionsRefreshAtom` for collection changes
  - `scenesRefreshAtom` / `triggerScenesRefreshAtom` for scene changes
  - Components now auto-refresh when data is modified elsewhere

### Fixed

- Checkbox click handlers in TeamsCollectionsPage (event propagation)
- CSS specificity for member-row display

## [0.18.0-beta0.47] - 2025-12-21

### Added

- **Teams & Collections UI Redesign**
  - Two-section layout (Teams + Collections on same page)
  - Enhanced team dialog with two-column layout
  - Full-width member/collection rows with right-aligned checkboxes
  - Team access chips in Collections table Access column
  - 'All members' badge for collections without team restrictions
  - Clickable team rows to open edit dialog
  - Empty states with 'Create collection/team' buttons
  - Role badges for admin members
  - Tooltip for disabled admin checkboxes

### Fixed

- Admin member count now includes auto-included admins

## [0.18.0-beta0.46] - 2025-12-21

### Added

- **Create Workspace UI** (Super Admin Only)

  - Create Workspace button in workspace dropdown
  - Workspace creation dialog with name, slug, and type fields
  - Auto-generate slug from workspace name

- **Profile Page Redesign**
  - Two-column layout (Excalidraw+ style)
  - Role indicator showing Super Admin or User badge
  - Updated User interface with `isSuperAdmin` field

### Fixed

- ESLint warning in App.tsx (useAtom → useSetAtom)

## [0.18.0-beta0.45] - 2025-12-21

### Fixed

- **Infinite API Polling Loop** (Critical Performance Bug)
  - Removed `activeCollectionId` from `loadCollections` dependencies
  - Added `hasSetDefaultCollectionRef` to prevent duplicate default setting
  - Added `lastNotifiedWorkspaceRef` to call `onWorkspaceChange` only once per workspace
  - Separated default collection setting into its own effect with ref guard
  - This fixed the bug where the app made hundreds of API requests per second

## [0.18.0-beta0.44] - 2025-12-21

### Added

- **Frontend Collaboration Permissions** (Phase 3-6)
  - URL routing for workspace scenes: `/workspace/{slug}/scene/{id}#key={roomKey}`
  - Workspace scene loader with permission checks
  - Auto-join collaboration when scene has roomId
  - `CopyMoveDialog` for copying/moving collections between workspaces
  - Workspace-aware `ShareDialog` with collaboration controls
  - Collaboration status indicators in `FullModeNav`

### Changed

- Separated legacy anonymous mode from workspace collaboration
- Updated `WorkspaceSidebar` with copy/move collection options

### Technical

- New `excalidraw-app/data/workspaceSceneLoader.ts`
- New `excalidraw-app/components/Workspace/CopyMoveDialog.tsx`

## [0.18.0-beta0.43] - 2025-12-21

### Fixed

- **Talktrack Recording After Collection Switch**

  - Fixed "Compositor canvas not initialized" error when recording Talktrack after switching collections
  - Added `disposeTalktrackRecorder()` function to properly reset the singleton instance on component unmount
  - The recorder singleton is now correctly recreated when navigating between dashboard and canvas modes

- **Black Bars in Talktrack Recordings**

  - Fixed black vertical bars appearing on sides of recordings when workspace sidebar was open
  - Recording now automatically closes the left workspace sidebar before starting
  - Added 300ms delay to allow sidebar animation to complete before capturing canvas dimensions
  - Compositor canvas now fills with white background to prevent transparent areas showing as black
  - Canvas resolution capped at 1080p for reasonable file sizes

## [0.18.0-beta0.42] - 2025-12-21

### Added

- **Emoji Picker for Collection Icons**

  - New `EmojiPicker` component with category tabs, search, and emoji grid
  - Supports "Frequently used" section with popular emojis
  - Random emoji and Remove buttons in header
  - Lazy loading with debounced search
  - Dark mode support
  - Replaces hardcoded emoji array in collection creation/edit dialogs

- **Edit Collection Dialog**

  - New edit functionality in collection context menu
  - Reuses create collection dialog structure
  - Allows changing collection name and icon

- **Russian Localization for Time Formats**
  - Added translation keys: `justNow`, `minuteAgo`, `minutesAgo`, `hourAgo`, `hoursAgo`, `yesterday`, `daysAgo`
  - Added `byYou` and `authorBy` for author display
  - Natural Russian phrasing: "Автор: {name}" instead of literal "by"

### Fixed

- **Font Consistency Across Dashboard & Settings Pages**

  - Added `--ui-font` CSS variable to all pages outside `.excalidraw` container
  - Fixed: `ProfilePage`, `WorkspaceSettingsPage`, `MembersPage`, `TeamsCollectionsPage`
  - Fixed: `DashboardView`, `CollectionView`, `SceneCardGrid`
  - Removed explicit `Virgil, cursive` font declarations that caused Times New Roman fallback

- **Collection Context Menu Click-Outside Handler**

  - Menu now closes when clicking outside (previously required clicking the three-dot button again)

- **Create New Scene from Collection Context Menu**

  - Now properly switches to canvas mode instead of just closing sidebar
  - Sets active collection so sidebar shows scenes from that collection
  - Keeps sidebar open to display the new scene in the list
  - New scene appears selected in the collection's scene list

- **Main Content Area Scrolling**
  - Changed `overflow: hidden` to `overflow-y: auto` in `WorkspaceMainContent.scss`
  - Dashboard and collection views now scroll properly when content exceeds viewport

### Changed

- **Emoji Picker UI Improvements**
  - Dropdown size: 400px width × 360px height
  - Single clean border on search input (removed double-border effect)
  - Empty trigger button shows "+" placeholder instead of folder icon
  - Proper bottom padding in emoji grid

## [0.18.0-beta0.41] - 2025-12-21

### Changed

- **Settings Integrated into Dashboard** (Major Refactor)

  - Settings pages (Profile, Workspace, Members, Teams & Collections) are now views within the dashboard instead of a separate mode
  - Reduced app modes from 3 (canvas/dashboard/settings) to 2 (canvas/dashboard)
  - `DashboardView` type expanded to include: `"home" | "collection" | "profile" | "workspace" | "members" | "teams-collections"`
  - Removed `SettingsLayout` and `SettingsView` components (no longer needed)
  - Settings pages now use consistent styling matching dashboard/collection views

- **Unified Visual Design**

  - All settings pages (ProfilePage, WorkspaceSettingsPage, MembersPage, TeamsCollectionsPage) now use the same layout pattern as DashboardView
  - Removed card-like container styling that made settings look like embedded iframes
  - Consistent padding, typography, and CSS variables across all dashboard views
  - Proper dark mode support using Excalidraw's standard CSS variables

- **Navigation Updates**
  - Added "Profile" nav item to sidebar (between Dashboard and Workspace Settings)
  - Sidebar now highlights active view correctly for all settings pages
  - Removed "Start Drawing" button from sidebar (use collection's "Create Scene" instead)
  - Removed unused back navigation buttons and translation keys

### Fixed

- **Sidebar X Button Navigation**: Clicking the X button in dashboard mode now properly navigates back to canvas instead of just closing the sidebar and leaving the user stuck

### Removed

- `SettingsLayout.tsx` and `SettingsLayout.scss` - no longer needed
- `SettingsView.tsx` - settings are now rendered via WorkspaceMainContent
- `settingsPageAtom` and `navigateToSettingsAtom` - replaced with individual navigation atoms
- Translation keys: `backToBoard`, `backToDashboard`, `backToCanvas`

## [0.18.0-beta0.40] - 2025-12-21

### Added

- **Dashboard & Collection Views** (Major UI Refactor)

  - New `DashboardView` component showing "Recently modified by you" and "Recently visited by you" scene grids
  - New `CollectionView` component displaying scenes for selected collection with sort options
  - New `WorkspaceMainContent` router component that switches between Dashboard and Collection views
  - New `SceneCardGrid` reusable component for displaying scene cards in a grid layout
  - New `BoardModeNav` minimal sidebar for canvas/drawing mode
  - New `FullModeNav` full navigation sidebar for dashboard/collection browsing

- **New App Modes**

  - `dashboard` mode added to `AppMode` type (alongside `canvas` and `settings`)
  - `sidebarModeAtom` to switch between "board" (minimal) and "full" (navigation) sidebar modes
  - `dashboardViewAtom` to track current view ("home" or "collection")
  - `activeCollectionIdAtom` to track selected collection
  - Navigation atoms: `navigateToDashboardAtom`, `navigateToCollectionAtom`

- **New Translation Keys**
  - Dashboard: `recentlyModified`, `recentlyVisited`, `teamMembersAt`, `noOneActive`
  - Collection: `emptyCollection`, `letsChangeThat`, `dragDropHint`, `importScenes`, `createScene`
  - Sorting: `lastCreated`, `lastModified`, `sort`
  - UI: `tip`, `changeHomePage`, `preferences`, `backToDashboard`, `privateDescription`

### Changed

- **Scenes Display Location**: Scenes are now rendered in the main content area (right side), NOT in the sidebar
- **Sidebar Purpose**: Left sidebar is now purely for navigation (workspace, collections, settings)
- **Clicking Collection**: Opens CollectionView in main content instead of expanding scenes in sidebar
- **Clicking Scene Card**: Opens scene in canvas mode and switches sidebar to minimal BoardModeNav

### Fixed

- **Infinite Re-render Loop**: Fixed flickering issue when viewing collections caused by `useEffect` dependency on object references instead of IDs
  - Changed `CollectionView` to use `workspaceId` and `collectionId` in effect dependencies
  - Changed `DashboardView` to use `workspaceId` in effect dependencies

## [0.18.0-beta0.39] - 2025-12-21

### Added

- **Default Private Collection Behavior**
  - New scenes are automatically saved to user's Private collection when no collection is selected
  - Workspace change tracking to ensure scenes go to correct workspace's private collection
  - `onWorkspaceChange` callback from WorkspaceSidebar to App for workspace state sync

### Changed

- **Workspace Sidebar Layout** (matches reference design)
  - Compact workspace header with circular avatar and dropdown
  - Horizontal dividers separating sections
  - Small navigation items (Dashboard, Workspace settings, Team members) instead of large tiles
  - Collections section with "Collections" label and small "+" button
  - User footer fixed at bottom with avatar, name, and notification bell

### Fixed

- Scene creation now properly passes `collectionId` to backend
- Private collection selection uses actual collection ID instead of literal string "private"

## [0.18.0-beta0.38] - 2025-12-21

### Added

- **Roles, Teams & Collections System**

  - Multi-workspace support with workspace selector dropdown
  - Role-based access control (ADMIN, MEMBER, VIEWER)
  - Teams for organizing users with shared collection access
  - Collections for organizing scenes with configurable visibility
  - Private collections visible only to owner
  - Team-based collection access control

- **Full-Page Settings Views**

  - Replaced modal dialogs with full-page settings layout
  - New settings navigation sidebar
  - Profile page (converted from UserProfileDialog)
  - Workspace settings page
  - Members page with invite links and role management
  - Teams & Collections page with CRUD operations

- **Workspace Sidebar Redesign**

  - Workspace selector at top with dropdown
  - Navigation items (Dashboard, Settings, Members) for admins
  - Collections list with expand/collapse
  - Scene list within selected collection
  - User profile at bottom

- **New Translation Keys**
  - Added settings.\* keys for all settings pages
  - Added workspace.\* keys for sidebar navigation
  - Translations for both English and Russian

### Changed

- App now has two modes: Canvas mode and Settings mode
- Settings accessed via full-page views instead of modals
- SceneCard now has optional onDelete/onRename props

## [0.18.0-beta0.37] - 2025-12-21

### Added

- **Collaboration Profile Integration**
  - Authenticated users now appear with their profile name in collaboration sessions
  - Profile avatars are displayed in the collaborator list (top-right corner)
  - New `authUserAtom` Jotai atom for cross-component user state access
  - WebSocket messages now include `avatarUrl` field for collaborator display
  - Profile data takes priority over localStorage/random names

### Fixed

- **Workspace Sidebar Font**
  - Defined `--ui-font` CSS variable locally in WorkspaceSidebar
  - Fixed section titles (e.g., "PRIVATE") showing in Times New Roman instead of Assistant font

## [0.18.0-beta0.36] - 2025-12-21

### Fixed

- **Font Consistency**
  - Added `font-family: var(--ui-font)` to Workspace components
  - Fixed inconsistent fonts in sidebar, scene cards, login and profile dialogs

### Added

- **Russian Translations for Workspace**
  - Added missing translations: signUp, noResults, search, privateScenes, publicScenes
  - Added: rename, duplicate, email, confirmPassword, name, namePlaceholder
  - Added: registrationError, passwordMismatch, passwordTooShort, invalidEmail
  - Added: signingUp, alreadyHaveAccount, noAccount

## [0.18.0-beta0.35] - 2025-12-20

### Added

- **User Profile Management**

  - New "My Profile" option in workspace user menu
  - Profile dialog with avatar upload, name editing, and sign out
  - Profile picture upload (supports JPEG, PNG, GIF, WebP up to 2MB)
  - Edit display name with inline editing
  - View email (read-only)
  - Dark mode support for profile dialog

- **Profile API Integration**
  - New API functions in `workspaceApi.ts`:
    - `getUserProfile()` - Get current user's profile
    - `updateUserProfile(data)` - Update name/avatar
    - `uploadAvatar(file)` - Upload profile picture
    - `deleteAvatar()` - Remove profile picture

### Changed

- User menu in workspace sidebar now shows "My Profile" option
- Profile pictures stored as base64 data URLs for simplicity

## [0.18.0-beta0.34] - 2025-12-20

### Added

- **Auto-Save for Workspace Scenes**

  - Scenes auto-save after 3 seconds of inactivity (like Miro)
  - Shows "Auto-saved" toast notification after each save
  - Smart save: skips if data hasn't changed

- **Ctrl+S / Cmd+S Keyboard Shortcut**
  - When a workspace scene is open, Ctrl+S saves to workspace
  - No longer prompts to save locally when working on workspace scenes

### Fixed

- **Login Dialog Input Fields**
  - Fixed issue where typing `@` or other special characters in email field affected the canvas
  - All input fields now properly capture keyboard events

## [0.18.0-beta0.33] - 2025-12-20

### Added

- **Scene-Specific Talktrack Storage**

  - Recordings now linked to workspace scenes (stored in PostgreSQL)
  - Recordings sync across devices and browsers
  - Shared viewers can see recordings on public scenes
  - New "Save scene first" message when recording without a saved scene

- **Talktrack API Integration**

  - New API functions in `workspaceApi.ts`:
    - `listTalktracks(sceneId)` - Get recordings for a scene
    - `createTalktrack(sceneId, dto)` - Save recording to scene
    - `updateTalktrack(sceneId, id, dto)` - Update recording
    - `deleteTalktrack(sceneId, id)` - Delete recording
    - `updateTalktrackStatus(sceneId, id, status)` - Update processing status

- **Permission-Based UI**
  - Only recording owners see edit/delete options
  - Viewers can copy links and add to board
  - Loading and error states in TalktrackPanel

### Changed

- `TalktrackPanel` now requires `sceneId` prop
- `TalktrackManager` now requires `sceneId` and `onRecordingSaved` props
- `AppSidebar` passes `sceneId` to Talktrack components
- Removed localStorage-based recording storage (replaced with API)

### Removed

- `getRecordings()`, `saveRecording()`, `deleteRecording()`, `renameRecording()` from `kinescopeApi.ts`
- Local `TalktrackRecording` type (now imported from `workspaceApi.ts`)

## [0.18.0-beta0.32] - 2025-12-20

### Added

- **Auto-save for New Scenes**
  - "New Scene" button now auto-creates scene in backend
  - Scene is immediately saved to workspace (no manual save required)
  - Subsequent edits auto-save to the created scene
  - Toast notification confirms scene creation

### Fixed

- **Workspace Trigger Button Position**
  - Button now renders before hamburger menu (like Excalidraw+)
  - Uses tunnel system to inject into correct DOM position
  - Updated icon to match Excalidraw+ sidebar panel icon

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
