# Presentation Mode

Astradraw includes a full-featured presentation mode that transforms your canvas into a slideshow using frames as slides.

## Features

### Frame-Based Slides
- Each frame on the canvas becomes a slide in your presentation
- Frames are sorted by order prefix numbers (e.g., "1. Intro", "2. Content", "3. Conclusion")
- New frames without prefixes are sorted alphabetically after prefixed ones

### Presentation Panel (Sidebar)
Located in the sidebar, the presentation panel provides:

- **Large Slide Previews**: Real-time thumbnail previews of each frame's content in a vertical card layout
- **Drag & Drop Reordering**: Drag slides to reorder with visual drop indicator line
- **Auto-Scroll on Drag**: When dragging near edges, the list auto-scrolls
- **Hover Actions**: Hover over a slide to reveal rename button and drag handle
- **Auto-Numbering**: When you reorder slides, frames are automatically renamed with order prefixes (e.g., "1. ", "2. ", etc.)
- **Inline Rename**: Double-click a slide name to rename
- **Start Presentation**: One-click to enter presentation mode (button always visible at bottom)
- **Scrollable List**: When many slides exist, the list scrolls while header and footer stay fixed

### Slides Layout Dialog
Accessed via the grid icon in the presentation panel header:

- **Row Layout**: Arranges all frames horizontally from left to right
- **Column Layout**: Arranges all frames vertically from top to bottom  
- **Grid Layout**: Arranges frames in a grid with configurable column count
- **Auto-Arrange**: Physically moves frames on the canvas based on selected layout

### Footer Toggle Button
A presentation toggle button is available in the footer (next to undo/redo):

- **Quick Access**: One-click to open/close the presentation sidebar
- **Tooltip**: Hover shows localized tooltip ("Toggle presentation sidebar" / "Панель презентации")
- **Styled Button**: Matches the styling of undo/redo buttons with background and shadow

### Presentation Controls
During presentation, a floating control bar appears at the bottom:

- **Navigation**: Previous/Next slide buttons with keyboard support (Arrow keys)
- **Slide Counter**: Shows current slide position (e.g., "Slide 2/5")
- **Laser Pointer**: Toggle laser pointer tool for highlighting (activated by default)
- **Theme Toggle**: Switch between light/dark themes
- **Fullscreen**: Enter/exit fullscreen mode
- **End Presentation**: Return to normal editing mode

### Clean Presentation View
In presentation mode, the UI is cleaned up:

- ✅ Frame borders and names hidden (content only)
- ✅ Hamburger menu hidden
- ✅ Zoom controls hidden
- ✅ Zen mode exit button hidden
- ✅ Help button hidden
- ✅ Only presentation controls visible

### Laser Pointer
- Activated automatically when entering presentation mode
- Works correctly with view mode (fixed conflict with canvas panning)
- Toggle on/off via presentation controls

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` or `↑` | Previous slide |
| `→` or `↓` | Next slide |
| `Escape` | End presentation |
| `F` | Toggle fullscreen |

## Technical Implementation

### State Management
- Uses Jotai atoms for presentation state
- `presentationModeAtom` - Boolean for presentation active state
- `currentSlideAtom` - Current slide index
- `slidesAtom` - Ordered array of frame elements
- `isLaserActiveAtom` - Laser pointer state
- `originalThemeAtom` - Saved theme for restoration
- `originalFrameRenderingAtom` - Saved frame rendering config

### Frame Order Persistence
Order is persisted via frame name prefixes:
- Format: `{number}. {name}` (e.g., "1. Introduction")
- `extractOrderPrefix()` - Gets prefix number from name
- `removeOrderPrefix()` - Strips prefix, returns base name
- `setOrderPrefix()` - Adds/updates prefix on name

### CSS Class for UI Hiding
When entering presentation mode:
```javascript
document.body.classList.add("excalidraw-presentation-mode");
```

CSS rules hide unwanted UI elements:
```scss
body.excalidraw-presentation-mode {
  .main-menu-trigger { display: none !important; }
  .layer-ui__wrapper__footer-left { display: none !important; }
  .disable-zen-mode { display: none !important; }
  .layer-ui__wrapper__footer-right { display: none !important; }
}
```

### Key Files

| File | Description |
|------|-------------|
| `excalidraw-app/components/Presentation/usePresentationMode.ts` | Core hook with all presentation logic |
| `excalidraw-app/components/Presentation/PresentationPanel.tsx` | Sidebar panel with slide list and previews |
| `excalidraw-app/components/Presentation/PresentationPanel.scss` | Styles for presentation panel with grid layout |
| `excalidraw-app/components/Presentation/PresentationControls.tsx` | Floating control bar during presentation |
| `excalidraw-app/components/Presentation/PresentationMode.tsx` | Portal wrapper for controls |
| `excalidraw-app/components/Presentation/SlidesLayoutDialog.tsx` | Dialog for arranging frames in row/column/grid |
| `excalidraw-app/components/Presentation/SlidesLayoutDialog.scss` | Styles for layout dialog |
| `excalidraw-app/components/AppFooter.tsx` | Footer with presentation toggle button |
| `excalidraw-app/index.scss` | CSS for hiding UI in presentation mode |
| `packages/excalidraw/components/footer/FooterLeftExtra.tsx` | Tunnel component for footer-left content |

## Translations

Presentation mode is fully translated:
- English (`en.json`)
- Russian (`ru-RU.json`) - Uses "фреймы" (frames) not "рамки" (borders)

## Known Issues

### Scroll on Slide Previews
Mouse wheel scrolling may not work when cursor is directly over slide preview images. 

**Workaround**: Scroll when cursor is between slides or use the scrollbar.

**Root Cause**: The Excalidraw canvas captures wheel events for zooming. When the mouse is over a slide preview element, the wheel event propagates to the canvas instead of scrolling the sidebar.

**Approaches Tried (not working)**:
1. `onWheel={(e) => e.stopPropagation()}` on the slides container - doesn't prevent canvas from capturing
2. `onWheel={(e) => e.stopPropagation()}` on the main presentation-panel div - same issue
3. Changed slide content from `<button>` to `<div role="button">` - no effect on wheel events
4. CSS `overscroll-behavior: contain` on slides container - doesn't help with event capture
5. CSS `overflow: hidden` on main panel - no effect
6. CSS `pointer-events: auto` on all children - no effect

**Potential Solutions to Try**:
- Capture wheel events at the sidebar level in the Excalidraw package
- Prevent canvas wheel handler from firing when mouse is over sidebar
- Use a portal to render slide previews outside the canvas event scope

### Toggle Button Close
The footer toggle button may not properly close the sidebar in some cases.

**Workaround**: Use the X button in the sidebar header to close.

**Root Cause**: The `updateScene({ appState: { openSidebar: null } })` API call doesn't seem to properly update the sidebar state, while the internal `setAppState({ openSidebar: null })` used by the X button works.

**Approaches Tried (not working)**:
1. `excalidrawAPI.toggleSidebar({ name: "default", tab: "presentation" })` - only opens, doesn't close when already open
2. `excalidrawAPI.toggleSidebar({ name: "default", force: false })` - doesn't close
3. Checking `appState.openSidebar?.tab === "presentation"` and conditionally closing - state detection works but close doesn't
4. `excalidrawAPI.updateScene({ appState: { openSidebar: null } })` - doesn't close the sidebar
5. Checking `appState.openSidebar?.name === "default"` and calling updateScene with null - same issue

**Potential Solutions to Try**:
- Access internal `setAppState` function (not exposed in public API)
- Dispatch a custom event that the sidebar listens to
- Modify the Excalidraw package to expose `setAppState` or a dedicated close method
- Use React context to access the internal state setter

## Future Improvements

Potential enhancements for future versions:
- [ ] Fix scroll capture on slide previews
- [ ] Fix toggle button close behavior
- [ ] Preset frame sizes (16:9, 4:3, mobile, etc.) like Figma
- [ ] Speaker notes
- [ ] Slide transitions/animations
- [ ] Timer/stopwatch
- [ ] Presenter view (dual screen)
- [ ] Export to PDF
