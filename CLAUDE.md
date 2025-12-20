# CLAUDE.md - AstraDraw App (Frontend)

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

## AstraDraw-Specific Patterns

### Input Fields
Always stop keyboard event propagation to prevent canvas interference:
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
- Use **Jotai** for shared state (see `excalidraw-app/` for examples)
- Use React hooks for component-local state

### API Calls
Use the workspace API client with credentials:
```typescript
import { getApiBaseUrl } from "../auth/workspaceApi";

fetch(`${getApiBaseUrl()}/endpoint`, {
  credentials: "include", // Required for JWT cookies
});
```

## Development Commands

```bash
yarn install           # Install dependencies
yarn start             # Start dev server (http://localhost:5173)

# Before committing:
yarn test:typecheck    # TypeScript type checking
yarn test:other        # Prettier formatting check
yarn test:code         # ESLint code quality
yarn test:all          # All checks + unit tests
yarn fix               # Auto-fix formatting and linting
```

## Related Repositories

| Repo | Purpose |
|------|---------|
| [astradraw](https://github.com/astrateam-net/astradraw) | Main orchestration, Docker deployment |
| [astradraw-api](https://github.com/astrateam-net/astradraw-api) | Backend API (NestJS) |
| [astradraw-room](https://github.com/astrateam-net/astradraw-room) | WebSocket collaboration |

## Architecture Notes

### Storage Abstraction
- `excalidraw-app/data/StorageBackend.ts` - Interface for storage providers
- `excalidraw-app/data/httpStorage.ts` - HTTP storage implementation (AstraDraw)
- `excalidraw-app/data/firebase.ts` - Firebase implementation (upstream)

### Runtime Environment
Environment variables are injected at container startup (not build time):
- `excalidraw-app/env.ts` - Runtime env helper using `window.__ENV__`
- `docker-entrypoint.sh` - Injects config into `index.html`

### Package System
- Uses Yarn workspaces for monorepo management
- Internal packages use path aliases (see `vitest.config.mts`)
- Build system uses esbuild for packages, Vite for the app
