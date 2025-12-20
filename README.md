# AstraDraw App

> **Built on top of [Excalidraw](https://github.com/excalidraw/excalidraw)** - An open source virtual hand-drawn style whiteboard.

Self-hosted Excalidraw frontend with user workspaces, video recordings, presentation mode, custom pens, and real-time collaboration.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/astrateam-net/astradraw-app/pkgs/container/astradraw-app)

## Features

### Core (from Excalidraw)
- 🎨 **Infinite canvas** with hand-drawn style
- 🔒 **End-to-end encryption** for collaboration
- 🤝 **Real-time collaboration** via WebSocket
- 📱 **Responsive design** for desktop and mobile
- 🌙 **Dark mode** support

### AstraDraw Extensions
- 👤 **User Authentication** - Local accounts and OIDC/SSO support
- 📁 **Personal Workspaces** - Save, organize, and sync scenes
- 🎬 **Talktrack** - Record canvas walkthroughs with camera PIP
- 📽️ **Presentation Mode** - Use frames as slides with laser pointer
- 🖊️ **Custom Pens** - Highlighter, fountain, marker presets
- 🎭 **Stickers & GIFs** - GIPHY integration
- 📚 **Pre-bundled Libraries** - Team-wide shape collections

## Architecture

This is the frontend component of the AstraDraw suite:

- **astradraw-app** (this repo): Frontend application
- **[astradraw-api](https://github.com/astrateam-net/astradraw-api)**: Backend API (auth, workspace, storage)
- **[astradraw-room](https://github.com/astrateam-net/astradraw-room)**: WebSocket collaboration server
- **[astradraw](https://github.com/astrateam-net/astradraw)**: Deployment configuration & documentation

## Quick Start

### Using Docker (Production)

```bash
docker run -d \
  -p 80:80 \
  -e VITE_APP_WS_SERVER_URL=wss://your-domain.com \
  -e VITE_APP_STORAGE_BACKEND=http \
  -e VITE_APP_HTTP_STORAGE_BACKEND_URL=https://your-domain.com \
  -e VITE_APP_BACKEND_V2_GET_URL=https://your-domain.com/api/v2/scenes/ \
  -e VITE_APP_BACKEND_V2_POST_URL=https://your-domain.com/api/v2/scenes/ \
  -e VITE_APP_DISABLE_TRACKING=true \
  ghcr.io/astrateam-net/astradraw-app:latest
```

### Local Development

```bash
# Install dependencies
yarn install

# Start dev server
yarn start

# Run checks before committing
yarn test:typecheck    # TypeScript
yarn test:other        # Prettier
yarn test:code         # ESLint
yarn test:all          # All checks + tests
```

### Building from Source

```bash
# Build for Docker (uses placeholder env vars)
yarn build:app:docker

# Build Docker image
docker build -t astradraw-app .
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_WS_SERVER_URL` | WebSocket server for collaboration | `wss://draw.example.com` |
| `VITE_APP_STORAGE_BACKEND` | Storage type | `http` or `firebase` |
| `VITE_APP_HTTP_STORAGE_BACKEND_URL` | Storage API base URL | `https://draw.example.com` |
| `VITE_APP_BACKEND_V2_GET_URL` | Scene GET endpoint | `https://draw.example.com/api/v2/scenes/` |
| `VITE_APP_BACKEND_V2_POST_URL` | Scene POST endpoint | `https://draw.example.com/api/v2/scenes/` |
| `VITE_APP_GIPHY_API_KEY` | GIPHY API key for stickers | `your_giphy_api_key` |
| `VITE_APP_DISABLE_TRACKING` | Disable analytics | `true` |

## Key Modifications from Upstream

### Storage Abstraction Layer

Added `StorageBackend` interface to support HTTP storage:

- `excalidraw-app/data/StorageBackend.ts` - Interface definition
- `excalidraw-app/data/httpStorage.ts` - HTTP REST API implementation
- `excalidraw-app/data/config.ts` - Backend selector

### Runtime Configuration

Environment variables are injected at container startup (not build time):

- `excalidraw-app/env.ts` - Runtime env helper using `window.__ENV__`
- `docker-entrypoint.sh` - Injects configuration into `index.html`

### AstraDraw Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Workspace | `excalidraw-app/components/Workspace/` | Scene management, auth |
| Talktrack | `excalidraw-app/components/Talktrack/` | Video recording |
| Presentation | `excalidraw-app/components/Presentation/` | Slideshow mode |
| Stickers | `excalidraw-app/components/Stickers/` | GIPHY integration |
| Pens | `excalidraw-app/pens/` | Custom pen presets |

## Deployment

For complete deployment with backend API, database, and Traefik proxy, see the [astradraw deployment repo](https://github.com/astrateam-net/astradraw).

## License

MIT License - Based on [Excalidraw](https://github.com/excalidraw/excalidraw)

## Links

- **Main Repo**: [astradraw](https://github.com/astrateam-net/astradraw)
- **Backend API**: [astradraw-api](https://github.com/astrateam-net/astradraw-api)
- **Room Server**: [astradraw-room](https://github.com/astrateam-net/astradraw-room)
- **Upstream**: [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)
- **Docker Image**: [ghcr.io/astrateam-net/astradraw-app](https://github.com/astrateam-net/astradraw-app/pkgs/container/astradraw-app)
