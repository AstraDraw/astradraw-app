/**
 * Workspace API client for scene management
 */

const getApiBaseUrl = (): string => {
  // First check runtime env (Docker) - window.__ENV__ is set by env-config.js
  const runtimeEnv = (window as { __ENV__?: Record<string, string> }).__ENV__;
  if (runtimeEnv?.VITE_APP_HTTP_STORAGE_BACKEND_URL) {
    return runtimeEnv.VITE_APP_HTTP_STORAGE_BACKEND_URL;
  }
  // Fallback to build-time env (development)
  const envUrl = import.meta.env.VITE_APP_HTTP_STORAGE_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }
  // Fallback to same origin
  return `${window.location.origin}/api/v2`;
};

export interface WorkspaceScene {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  storageKey: string;
  roomId: string | null;
  isPublic: boolean;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSceneDto {
  title?: string;
  thumbnail?: string;
  data?: string; // Base64 encoded scene data
}

export interface UpdateSceneDto {
  title?: string;
  thumbnail?: string;
  data?: string;
}

/**
 * List all scenes for the current user
 */
export async function listScenes(): Promise<WorkspaceScene[]> {
  const response = await fetch(`${getApiBaseUrl()}/workspace/scenes`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Failed to list scenes");
  }

  return response.json();
}

/**
 * Get a specific scene by ID
 */
export async function getScene(id: string): Promise<WorkspaceScene> {
  const response = await fetch(`${getApiBaseUrl()}/workspace/scenes/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    throw new Error("Failed to get scene");
  }

  return response.json();
}

/**
 * Get scene data (the actual Excalidraw content)
 */
export async function getSceneData(id: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${id}/data`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    throw new Error("Failed to get scene data");
  }

  return response.arrayBuffer();
}

/**
 * Create a new scene
 */
export async function createScene(dto: CreateSceneDto): Promise<WorkspaceScene> {
  const response = await fetch(`${getApiBaseUrl()}/workspace/scenes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Failed to create scene");
  }

  return response.json();
}

/**
 * Update a scene
 */
export async function updateScene(
  id: string,
  dto: UpdateSceneDto,
): Promise<WorkspaceScene> {
  const response = await fetch(`${getApiBaseUrl()}/workspace/scenes/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    throw new Error("Failed to update scene");
  }

  return response.json();
}

/**
 * Update scene data only (for auto-save)
 */
export async function updateSceneData(
  id: string,
  data: Blob | ArrayBuffer,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${id}/data`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: data,
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    throw new Error("Failed to update scene data");
  }

  return response.json();
}

/**
 * Delete a scene
 */
export async function deleteScene(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${getApiBaseUrl()}/workspace/scenes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    throw new Error("Failed to delete scene");
  }

  return response.json();
}

/**
 * Start collaboration on a scene
 */
export async function startCollaboration(
  id: string,
): Promise<{ roomId: string; roomKey: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${id}/collaborate`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    throw new Error("Failed to start collaboration");
  }

  return response.json();
}

/**
 * Duplicate a scene
 */
export async function duplicateScene(id: string): Promise<WorkspaceScene> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${id}/duplicate`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    throw new Error("Failed to duplicate scene");
  }

  return response.json();
}
