FROM --platform=${BUILDPLATFORM} node:18 AS build

WORKDIR /opt/node_app

COPY . .

# do not ignore optional dependencies:
# Error: Cannot find module @rollup/rollup-linux-x64-gnu
RUN --mount=type=cache,target=/root/.cache/yarn \
    npm_config_target_arch=${TARGETARCH} yarn --network-timeout 600000

ARG NODE_ENV=production

# Build with placeholder values that will be replaced at runtime
# This allows environment variables to be injected when the container starts
ENV VITE_APP_WS_SERVER_URL=__VITE_APP_WS_SERVER_URL__ \
    VITE_APP_BACKEND_V2_GET_URL=__VITE_APP_BACKEND_V2_GET_URL__ \
    VITE_APP_BACKEND_V2_POST_URL=__VITE_APP_BACKEND_V2_POST_URL__ \
    VITE_APP_STORAGE_BACKEND=__VITE_APP_STORAGE_BACKEND__ \
    VITE_APP_HTTP_STORAGE_BACKEND_URL=__VITE_APP_HTTP_STORAGE_BACKEND_URL__ \
    VITE_APP_FIREBASE_CONFIG=__VITE_APP_FIREBASE_CONFIG__ \
    VITE_APP_DISABLE_TRACKING=__VITE_APP_DISABLE_TRACKING__ \
    VITE_APP_GIPHY_API_KEY=__VITE_APP_GIPHY_API_KEY__

RUN npm_config_target_arch=${TARGETARCH} yarn build:app:docker

FROM --platform=${TARGETPLATFORM} nginx:1.27-alpine

# Copy the built application
COPY --from=build /opt/node_app/excalidraw-app/build /usr/share/nginx/html

# Create libraries directory for pre-bundled libraries (mounted via Docker volume)
RUN mkdir -p /app/libraries

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Use custom entrypoint to inject environment variables at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
