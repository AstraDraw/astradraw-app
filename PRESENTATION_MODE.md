# Presentation Mode

Astradraw includes a full-featured presentation mode that transforms your canvas into a slideshow using frames as slides.

## Features

### Frame-Based Slides
- Each frame on the canvas becomes a slide in your presentation
- Frames are sorted by order prefix numbers (e.g., "1. Intro", "2. Content", "3. Conclusion")
- New frames without prefixes are sorted alphabetically after prefixed ones

### Presentation Panel (Sidebar)
Located in the sidebar, the presentation panel provides:

- **Live Previews**: Real-time thumbnail previews of each frame's content
- **Drag Order**: Move slides up/down using arrow buttons
- **Auto-Numbering**: When you reorder slides, frames are automatically renamed with order prefixes (e.g., "1. ", "2. ", etc.)
- **Inline Rename**: Double-click a slide name or click the edit button (✎) to rename
- **Start Presentation**: One-click to enter presentation mode

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
| `excalidraw-app/components/Presentation/PresentationControls.tsx` | Floating control bar during presentation |
| `excalidraw-app/components/Presentation/PresentationMode.tsx` | Portal wrapper for controls |
| `excalidraw-app/index.scss` | CSS for hiding UI in presentation mode |

## Translations

Presentation mode is fully translated:
- English (`en.json`)
- Russian (`ru-RU.json`) - Uses "фреймы" (frames) not "рамки" (borders)

## Future Improvements

Potential enhancements for future versions:
- [ ] Preset frame sizes (16:9, 4:3, mobile, etc.) like Figma
- [ ] Speaker notes
- [ ] Slide transitions/animations
- [ ] Timer/stopwatch
- [ ] Presenter view (dual screen)
- [ ] Export to PDF
