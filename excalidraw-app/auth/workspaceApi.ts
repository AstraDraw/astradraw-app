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

// ============================================================================
// Types
// ============================================================================

export type WorkspaceRole = "ADMIN" | "MEMBER" | "VIEWER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  workspaceId: string;
  memberCount: number;
  collectionCount: number;
  members: {
    id: string;
    userId: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }[];
  collections: {
    id: string;
    name: string;
    icon: string | null;
    canWrite: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isPrivate: boolean;
  userId: string;
  workspaceId: string;
  sceneCount: number;
  canWrite: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InviteLink {
  id: string;
  code: string;
  role: WorkspaceRole;
  workspaceId: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  createdAt: string;
}

export interface WorkspaceScene {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  storageKey: string;
  roomId: string | null;
  collectionId: string | null;
  isPublic: boolean;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit?: boolean;
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

// ============================================================================
// Workspace API
// ============================================================================

/**
 * List all workspaces the current user is a member of
 */
export async function listWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${getApiBaseUrl()}/workspaces`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Failed to list workspaces");
  }

  return response.json();
}

/**
 * Get a single workspace
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  const response = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to get workspace");
  }

  return response.json();
}

/**
 * Create a new workspace
 */
export async function createWorkspace(data: {
  name: string;
  slug?: string;
}): Promise<Workspace> {
  const response = await fetch(`${getApiBaseUrl()}/workspaces`, {
    method: "POST",
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
    if (response.status === 409) {
      throw new Error("Workspace URL already taken");
    }
    throw new Error("Failed to create workspace");
  }

  return response.json();
}

/**
 * Update workspace settings
 */
export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; slug?: string; avatarUrl?: string },
): Promise<Workspace> {
  const response = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}`, {
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
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to update workspace");
  }

  return response.json();
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(
  workspaceId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to delete workspace");
  }

  return response.json();
}

// ============================================================================
// Workspace Members API
// ============================================================================

/**
 * List all members of a workspace
 */
export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/members`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to list members");
  }

  return response.json();
}

/**
 * Invite a user to the workspace by email
 */
export async function inviteToWorkspace(
  workspaceId: string,
  email: string,
  role?: WorkspaceRole,
): Promise<WorkspaceMember> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/members/invite`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role }),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    if (response.status === 404) {
      throw new Error("User not found. They must create an account first.");
    }
    if (response.status === 409) {
      throw new Error("User is already a member");
    }
    throw new Error("Failed to invite user");
  }

  return response.json();
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    if (response.status === 400) {
      throw new Error("Cannot demote the last admin");
    }
    throw new Error("Failed to update member role");
  }

  return response.json();
}

/**
 * Remove a member from the workspace
 */
export async function removeMember(
  workspaceId: string,
  memberId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    if (response.status === 400) {
      throw new Error("Cannot remove the last admin");
    }
    throw new Error("Failed to remove member");
  }

  return response.json();
}

// ============================================================================
// Invite Links API
// ============================================================================

/**
 * List invite links for a workspace
 */
export async function listInviteLinks(
  workspaceId: string,
): Promise<InviteLink[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/invite-links`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to list invite links");
  }

  return response.json();
}

/**
 * Create an invite link
 */
export async function createInviteLink(
  workspaceId: string,
  options?: { role?: WorkspaceRole; expiresAt?: string; maxUses?: number },
): Promise<InviteLink> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/invite-links`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options || {}),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to create invite link");
  }

  return response.json();
}

/**
 * Delete an invite link
 */
export async function deleteInviteLink(
  workspaceId: string,
  linkId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/invite-links/${linkId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to delete invite link");
  }

  return response.json();
}

/**
 * Join a workspace via invite link
 */
export async function joinViaInviteLink(code: string): Promise<Workspace> {
  const response = await fetch(`${getApiBaseUrl()}/workspaces/join`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Invalid invite link");
    }
    if (response.status === 400) {
      throw new Error("Invite link expired or reached max uses");
    }
    throw new Error("Failed to join workspace");
  }

  return response.json();
}

// ============================================================================
// Teams API
// ============================================================================

/**
 * List all teams in a workspace
 */
export async function listTeams(workspaceId: string): Promise<Team[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/teams`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to list teams");
  }

  return response.json();
}

/**
 * Create a new team
 */
export async function createTeam(
  workspaceId: string,
  data: {
    name: string;
    color: string;
    memberIds?: string[];
    collectionIds?: string[];
  },
): Promise<Team> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/teams`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to create team");
  }

  return response.json();
}

/**
 * Get a single team
 */
export async function getTeam(teamId: string): Promise<Team> {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 404) {
      throw new Error("Team not found");
    }
    throw new Error("Failed to get team");
  }

  return response.json();
}

/**
 * Update a team
 */
export async function updateTeam(
  teamId: string,
  data: {
    name?: string;
    color?: string;
    memberIds?: string[];
    collectionIds?: string[];
  },
): Promise<Team> {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}`, {
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
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to update team");
  }

  return response.json();
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to delete team");
  }

  return response.json();
}

// ============================================================================
// Collections API
// ============================================================================

/**
 * List all accessible collections in a workspace
 */
export async function listCollections(
  workspaceId: string,
): Promise<Collection[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/collections`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to list collections");
  }

  return response.json();
}

/**
 * Create a new collection
 */
export async function createCollection(
  workspaceId: string,
  data: {
    name: string;
    icon?: string;
    color?: string;
    isPrivate?: boolean;
  },
): Promise<Collection> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspaces/${workspaceId}/collections`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to create collection");
  }

  return response.json();
}

/**
 * Get a single collection
 */
export async function getCollection(collectionId: string): Promise<Collection> {
  const response = await fetch(
    `${getApiBaseUrl()}/collections/${collectionId}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    if (response.status === 404) {
      throw new Error("Collection not found");
    }
    throw new Error("Failed to get collection");
  }

  return response.json();
}

/**
 * Update a collection
 */
export async function updateCollection(
  collectionId: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
    isPrivate?: boolean;
  },
): Promise<Collection> {
  const response = await fetch(
    `${getApiBaseUrl()}/collections/${collectionId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to update collection");
  }

  return response.json();
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  collectionId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${getApiBaseUrl()}/collections/${collectionId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to delete collection");
  }

  return response.json();
}

/**
 * List scenes in a workspace (optionally filtered by collection)
 */
export async function listWorkspaceScenes(
  workspaceId: string,
  collectionId?: string,
): Promise<WorkspaceScene[]> {
  const params = new URLSearchParams({ workspaceId });
  if (collectionId) {
    params.append("collectionId", collectionId);
  }

  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes?${params.toString()}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to list scenes");
  }

  return response.json();
}

/**
 * Move a scene to a different collection
 */
export async function moveScene(
  sceneId: string,
  collectionId: string | null,
): Promise<WorkspaceScene> {
  const response = await fetch(
    `${getApiBaseUrl()}/workspace/scenes/${sceneId}/move`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ collectionId }),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    if (response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to move scene");
  }

  return response.json();
}
