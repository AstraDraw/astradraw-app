# Astradraw App

> **Built on top of [Excalidraw](https://github.com/excalidraw/excalidraw)** - An open source virtual hand-drawn style whiteboard.

Self-hosted Excalidraw frontend with real-time collaboration and custom HTTP storage backend support.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/astrateam-net/astradraw-app/pkgs/container/astradraw-app)

## Features

- ✅ **HTTP Storage Backend**: Replace Firebase with your own REST API backend
- ✅ **Runtime Environment Injection**: Configure URLs without rebuilding Docker images
- ✅ **Universal Iframe Embeds**: Embed any URL, not just allowlisted domains
- ✅ **Custom Sandbox Permissions**: Configure same-origin access for video players
- ✅ **Docker Secrets Support**: Native support for Docker Swarm and Kubernetes secrets
- ✅ **Real-time Collaboration**: WebSocket-based collaboration with E2E encryption
- ✅ **Self-hosted**: Full control over your data and infrastructure

## Architecture

This is the frontend component of the Astradraw suite:

- **astradraw-app** (this repo): Frontend application
- **[astradraw-storage](https://github.com/astrateam-net/astradraw-storage)**: Storage backend API
- **[astradraw](https://github.com/astrateam-net/astradraw)**: Deployment configuration

## Key Modifications from Upstream

### Storage Abstraction Layer

Added `StorageBackend` interface to support multiple storage providers:

- `excalidraw-app/data/StorageBackend.ts` - Interface definition
- `excalidraw-app/data/httpStorage.ts` - HTTP REST API implementation
- `excalidraw-app/data/config.ts` - Backend selector
- `excalidraw-app/data/firebase.ts` - Original Firebase implementation

### Runtime Configuration

Environment variables are injected at container startup instead of build time:

- `excalidraw-app/env.ts` - Runtime env helper using `window.__ENV__`
- `docker-entrypoint.sh` - Injects configuration into `index.html` at startup

### Universal Iframe Embeds

- Set `validateEmbeddable={true}` in `App.tsx` to allow any URL
- Add domains to `ALLOW_SAME_ORIGIN` in `packages/element/src/embeddable.ts` for same-origin sandbox access

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_WS_SERVER_URL` | WebSocket server for collaboration | `wss://draw.example.com` |
| `VITE_APP_STORAGE_BACKEND` | Storage type | `http` or `firebase` |
| `VITE_APP_HTTP_STORAGE_BACKEND_URL` | Storage API base URL | `https://draw.example.com` |
| `VITE_APP_BACKEND_V2_GET_URL` | Scene GET endpoint | `https://draw.example.com/api/v2/scenes/` |
| `VITE_APP_BACKEND_V2_POST_URL` | Scene POST endpoint | `https://draw.example.com/api/v2/scenes/` |
| `VITE_APP_FIREBASE_CONFIG` | Firebase config (if using firebase) | `{}` |
| `VITE_APP_DISABLE_TRACKING` | Disable analytics | `true` |

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

### Building from Source

```bash
# Install dependencies
yarn install

# Build for Docker (uses placeholder env vars)
yarn build:app:docker

# Build Docker image
docker build -t astradraw-app .
```

### Local Development

```bash
# Install dependencies
yarn install

# Start dev server
yarn start

# Run tests
yarn test
```

## Deployment

For complete deployment with storage backend, database, and Traefik proxy, see the [astradraw deployment repo](https://github.com/astrateam-net/astradraw).

### Docker Compose Example

```yaml
services:
  app:
    image: ghcr.io/astrateam-net/astradraw-app:latest
    environment:
      - VITE_APP_WS_SERVER_URL=wss://${APP_DOMAIN}
      - VITE_APP_STORAGE_BACKEND=http
      - VITE_APP_HTTP_STORAGE_BACKEND_URL=https://${APP_DOMAIN}
      - VITE_APP_BACKEND_V2_GET_URL=https://${APP_DOMAIN}/api/v2/scenes/
      - VITE_APP_BACKEND_V2_POST_URL=https://${APP_DOMAIN}/api/v2/scenes/
    ports:
      - "80:80"
```

## Iframe Embeds

### Allowing Any URL

Set `validateEmbeddable={true}` in `excalidraw-app/App.tsx` (line 819).

### Adding Same-Origin Sandbox Support

Some embeds (video players, interactive tools) need `allow-same-origin` in the iframe sandbox. Edit `packages/element/src/embeddable.ts`:

```typescript
// Line 106-118
const ALLOW_SAME_ORIGIN = new Set([
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "kinescope.io",
  "kinescopecdn.net",
  "your-video-platform.com",  // Add your domain here
]);
```

**When to add:**
- ✅ Video players (Kinescope, Wistia, etc.)
- ✅ Interactive embeds (Figma, Miro, etc.)
- ❌ Static content (doesn't need same-origin)

Rebuild after changes:
```bash
docker build -t astradraw-app . --no-cache
```

## License

MIT License - Based on [Excalidraw](https://github.com/excalidraw/excalidraw)

## Links

- **Upstream**: [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)
- **Storage Backend**: [astradraw-storage](https://github.com/astrateam-net/astradraw-storage)
- **Deployment**: [astradraw](https://github.com/astrateam-net/astradraw)
- **Docker Image**: [ghcr.io/astrateam-net/astradraw-app](https://github.com/astrateam-net/astradraw-app/pkgs/container/astradraw-app)
