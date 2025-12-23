/**
 * Shared TypeScript types for the API layer
 */

// ============================================================================
// Workspace Types
// ============================================================================

export type WorkspaceRole = "ADMIN" | "MEMBER" | "VIEWER";
export type WorkspaceType = "PERSONAL" | "SHARED";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  role: WorkspaceRole;
  type?: WorkspaceType;
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

// ============================================================================
// Team Types
// ============================================================================

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

// ============================================================================
// Collection Types
// ============================================================================

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
  // Team access info (populated separately)
  teams?: Array<{
    teamId: string;
    teamName: string;
    teamColor: string;
  }>;
}

export type CollectionAccessLevel = "VIEW" | "EDIT";

export interface CollectionTeamAccess {
  teamId: string;
  teamName: string;
  teamColor: string;
  accessLevel: CollectionAccessLevel;
}

// ============================================================================
// Invite Link Types
// ============================================================================

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

// ============================================================================
// Scene Types
// ============================================================================

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
  collectionId?: string; // Collection to add the scene to
}

export interface UpdateSceneDto {
  title?: string;
  thumbnail?: string;
  data?: string;
}

// ============================================================================
// Talktrack Types
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

// ============================================================================
// User Profile Types
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isSuperAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  avatarUrl?: string | null;
}
