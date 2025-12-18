#!/bin/sh
# Docker entrypoint script for Excalidraw
# Creates a runtime environment config file that the app can read
# Supports Docker secrets via _FILE suffix (e.g., VITE_APP_WS_SERVER_URL_FILE)

set -e

# Directory containing the built files
APP_DIR="/usr/share/nginx/html"

# Function to get env var value, supporting _FILE suffix for Docker secrets
# Usage: get_secret "VAR_NAME" "default_value"
get_secret() {
    var_name="$1"
    default_value="${2:-}"
    
    # Check for _FILE variant first
    file_var="${var_name}_FILE"
    eval file_path="\$$file_var"
    
    if [ -n "$file_path" ] && [ -f "$file_path" ]; then
        # Read secret from file
        cat "$file_path"
        return
    fi
    
    # Fall back to regular env var
    eval value="\$$var_name"
    if [ -n "$value" ]; then
        echo "$value"
        return
    fi
    
    # Return default
    echo "$default_value"
}

# Get all environment values (supporting _FILE secrets)
WS_SERVER_URL=$(get_secret "VITE_APP_WS_SERVER_URL" "")
BACKEND_V2_GET_URL=$(get_secret "VITE_APP_BACKEND_V2_GET_URL" "")
BACKEND_V2_POST_URL=$(get_secret "VITE_APP_BACKEND_V2_POST_URL" "")
STORAGE_BACKEND=$(get_secret "VITE_APP_STORAGE_BACKEND" "")
HTTP_STORAGE_BACKEND_URL=$(get_secret "VITE_APP_HTTP_STORAGE_BACKEND_URL" "")
FIREBASE_CONFIG=$(get_secret "VITE_APP_FIREBASE_CONFIG" "{}")
DISABLE_TRACKING=$(get_secret "VITE_APP_DISABLE_TRACKING" "true")

# Create a runtime config file with environment variables
# This is injected as a script in index.html
cat > "$APP_DIR/env-config.js" << ENVEOF
// Runtime environment configuration - generated at container startup
window.__ENV__ = {
  VITE_APP_WS_SERVER_URL: "${WS_SERVER_URL}",
  VITE_APP_BACKEND_V2_GET_URL: "${BACKEND_V2_GET_URL}",
  VITE_APP_BACKEND_V2_POST_URL: "${BACKEND_V2_POST_URL}",
  VITE_APP_STORAGE_BACKEND: "${STORAGE_BACKEND}",
  VITE_APP_HTTP_STORAGE_BACKEND_URL: "${HTTP_STORAGE_BACKEND_URL}",
  VITE_APP_FIREBASE_CONFIG: "${FIREBASE_CONFIG}",
  VITE_APP_DISABLE_TRACKING: "${DISABLE_TRACKING}"
};
ENVEOF

echo "Created runtime environment config at $APP_DIR/env-config.js"

# Inject the env-config.js script into index.html if not already present
if ! grep -q "env-config.js" "$APP_DIR/index.html"; then
    # Insert the script tag right after the opening <head> tag
    sed -i 's|<head>|<head><script src="/env-config.js"></script>|' "$APP_DIR/index.html"
    echo "Injected env-config.js into index.html"
fi

echo "Environment configuration complete."

# Execute the original entrypoint (nginx)
exec "$@"
