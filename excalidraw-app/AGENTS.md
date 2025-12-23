# AstraDraw Frontend - AI Context

> This is the frontend component of [AstraDraw](https://github.com/astrateam-net/astradraw), a self-hosted Excalidraw fork.

## Project Structure

This is a **monorepo** forked from Excalidraw with AstraDraw-specific additions:

- **`excalidraw-app/`** - Main application with AstraDraw features
  - `components/Workspace/` - User auth, scene management, profile
  - `components/Talktrack/` - Video recording feature
  - `components/Presentation/` - Slideshow mode
  - `components/Stickers/` - GIPHY integration
  - `pens/` - Custom pen presets
  - `auth/` - Authentication context and API
- **`packages/excalidraw/`** - Core React component library
- **`packages/`** - Shared packages: `common`, `element`, `math`, `utils`

## Critical Patterns

### Input Fields

Always stop keyboard event propagation to prevent canvas shortcuts from firing:

```typescript
<input
  onKeyDown={(e) => e.stopPropagation()}
  onKeyUp={(e) => e.stopPropagation()}
/>
```

### Translations

Add keys to BOTH locale files:

- `packages/excalidraw/locales/en.json`
- `packages/excalidraw/locales/ru-RU.json`

### State Management

- Use **Jotai** for shared state (see `excalidraw-app/components/Settings/settingsState.ts`)
- Use React hooks for component-local state

### API Calls

Use the modular API client (credentials are automatically included):

```typescript
// Import from specific modules (preferred)
import { listScenes, createScene } from "../auth/api/scenes";
import { listWorkspaces } from "../auth/api/workspaces";

// Or import from workspaceApi (backward compatible)
import { listScenes, getApiBaseUrl } from "../auth/workspaceApi";

// For custom endpoints, use apiRequest helper:
import { apiRequest } from "../auth/api/client";

const data = await apiRequest("/custom-endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... }),
  errorMessage: "Failed to call endpoint",
});
```

### Dark Mode CSS

Use both selectors for dark mode styles:

```scss
.excalidraw.theme--dark,
.excalidraw-app.theme--dark {
  // dark mode styles
}
```

## Development Commands

```bash
yarn install           # Install dependencies
yarn start             # Start dev server (http://localhost:5173)

# Before committing (or use `just check-frontend` from main repo):
yarn test:typecheck    # TypeScript type checking
yarn test:other        # Prettier formatting check
yarn test:code         # ESLint code quality
yarn fix               # Auto-fix formatting and linting
```

## Key Files

| File | Purpose |
| --- | --- |
| `excalidraw-app/App.tsx` | Main app entry point |
| `excalidraw-app/components/Settings/settingsState.ts` | Jotai state atoms |
| `excalidraw-app/router.ts` | URL routing logic |
| `excalidraw-app/auth/api/` | Modular API client (scenes, workspaces, etc.) |
| `excalidraw-app/auth/workspaceApi.ts` | Re-exports from api/ (backward compat) |
| `excalidraw-app/env.ts` | Runtime environment helper |

## Architecture Notes

### Storage Abstraction

- `excalidraw-app/data/StorageBackend.ts` - Interface for storage providers
- `excalidraw-app/data/httpStorage.ts` - HTTP storage implementation (AstraDraw)

### Runtime Environment

Environment variables are injected at container startup (not build time):

- `excalidraw-app/env.ts` - Uses `window.__ENV__` with `import.meta.env` fallback
- `docker-entrypoint.sh` - Generates `/env-config.js` at startup
