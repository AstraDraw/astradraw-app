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
export async function createScene(
  dto: CreateSceneDto,
): Promise<WorkspaceScene> {
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

// ============================================================================
// Talktrack Recording API
// ============================================================================

export interface TalktrackRecording {
  id: string;
  title: string;
  kinescopeVideoId: string;
  duration: number;
  processingStatus: "uploading" | "processing" | "ready" | "error";
  sceneId: string;
  userId: string;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTalktrackDto {
  title: string;
  kinescopeVideoId: string;
  duration: number;
  processingStatus?: string;
}

export interface UpdateTalktrackDto {
  title?: string;
  processingStatus?: string;
}

/**
 * List all talktrack recordings for a scene
 */
export async function listTalktracks(
  sceneId: string,
): Promise<TalktrackRecording[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${sceneId}/talktracks`,
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
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to list recordings");
  }

  return response.json();
}

/**
 * Create a new talktrack recording for a scene
 */
export async function createTalktrack(
  sceneId: string,
  dto: CreateTalktrackDto,
): Promise<TalktrackRecording> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${sceneId}/talktracks`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Scene not found");
    }
    if (response.status === 403) {
      throw new Error("Only scene owner can create recordings");
    }
    throw new Error("Failed to create recording");
  }

  return response.json();
}

/**
 * Update a talktrack recording
 */
export async function updateTalktrack(
  sceneId: string,
  recordingId: string,
  dto: UpdateTalktrackDto,
): Promise<TalktrackRecording> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${sceneId}/talktracks/${recordingId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Recording not found");
    }
    if (response.status === 403) {
      throw new Error("Only recording owner can update");
    }
    throw new Error("Failed to update recording");
  }

  return response.json();
}

/**
 * Delete a talktrack recording
 */
export async function deleteTalktrack(
  sceneId: string,
  recordingId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${sceneId}/talktracks/${recordingId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Recording not found");
    }
    if (response.status === 403) {
      throw new Error("Only recording owner can delete");
    }
    throw new Error("Failed to delete recording");
  }

  return response.json();
}

/**
 * Update talktrack processing status
 */
export async function updateTalktrackStatus(
  sceneId: string,
  recordingId: string,
  status: string,
): Promise<TalktrackRecording> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${sceneId}/talktracks/${recordingId}/status`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Recording not found");
    }
    throw new Error("Failed to update status");
  }

  return response.json();
}

// ============================================================================
// User Profile API
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  avatarUrl?: string | null;
}

/**
 * Get current user's profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${getApiBaseUrl()}/users/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Failed to get profile");
  }

  return response.json();
}

/**
 * Update current user's profile
 */
export async function updateUserProfile(
  data: UpdateProfileDto,
): Promise<UserProfile> {
  const response = await fetch(`${getApiBaseUrl()}/users/me`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Failed to update profile");
  }

  return response.json();
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${getApiBaseUrl()}/users/me/avatar`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || "Invalid file");
    }
    throw new Error("Failed to upload avatar");
  }

  return response.json();
}

/**
 * Delete avatar (reset to default)
 */
export async function deleteAvatar(): Promise<UserProfile> {
  const response = await fetch(`${getApiBaseUrl()}/users/me/avatar/delete`, {
    method: "PUT",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Failed to delete avatar");
  }

  return response.json();
}
