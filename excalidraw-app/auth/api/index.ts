/**
 * API Module - Re-exports all API functions and types
 *
 * This module provides a unified entry point for all API functionality.
 * Import from here for convenience, or import from specific modules
 * for better tree-shaking.
 */

// Base client utilities
export { getApiBaseUrl, ApiError, apiRequest, apiRequestRaw } from "./client";

// All types
export type {
  // Workspace types
  WorkspaceRole,
  WorkspaceType,
  Workspace,
  WorkspaceMember,
  // Team types
  Team,
  // Collection types
  Collection,
  CollectionAccessLevel,
  CollectionTeamAccess,
  // Invite types
  InviteLink,
  // Scene types
  WorkspaceScene,
  CreateSceneDto,
  UpdateSceneDto,
  // Talktrack types
  TalktrackRecording,
  CreateTalktrackDto,
  UpdateTalktrackDto,
  // User types
  UserProfile,
  UpdateProfileDto,
} from "./types";

// Scene API
export {
  listScenes,
  getScene,
  getSceneData,
  createScene,
  updateScene,
  updateSceneData,
  uploadSceneThumbnail,
  deleteScene,
  startCollaboration,
  duplicateScene,
  listWorkspaceScenes,
  moveScene,
} from "./scenes";

// Talktrack API
export {
  listTalktracks,
  createTalktrack,
  updateTalktrack,
  deleteTalktrack,
  updateTalktrackStatus,
} from "./talktracks";

// User API
export {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  deleteAvatar,
} from "./users";

// Workspace API
export {
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  uploadWorkspaceAvatar,
  deleteWorkspace,
} from "./workspaces";

// Members API
export {
  listWorkspaceMembers,
  inviteToWorkspace,
  updateMemberRole,
  removeMember,
} from "./members";

// Invite Links API
export {
  listInviteLinks,
  createInviteLink,
  deleteInviteLink,
  joinViaInviteLink,
} from "./invites";

// Teams API
export {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
} from "./teams";

// Collections API
export {
  listCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
  copyCollectionToWorkspace,
  moveCollectionToWorkspace,
  listCollectionTeams,
  setCollectionTeamAccess,
  removeCollectionTeamAccess,
} from "./collections";
