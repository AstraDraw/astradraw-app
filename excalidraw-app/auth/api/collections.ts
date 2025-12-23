/**
 * Collections API - Collection CRUD and team access management
 */

import { apiRequest, jsonBody } from "./client";

import type {
  Collection,
  CollectionAccessLevel,
  CollectionTeamAccess,
} from "./types";

// ============================================================================
// Collection CRUD
// ============================================================================

/**
 * List all accessible collections in a workspace
 */
export async function listCollections(
  workspaceId: string,
): Promise<Collection[]> {
  return apiRequest(`/workspaces/${workspaceId}/collections`, {
    errorMessage: "Failed to list collections",
  });
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
  return apiRequest(`/workspaces/${workspaceId}/collections`, {
    method: "POST",
    ...jsonBody(data),
    errorMessage: "Failed to create collection",
  });
}

/**
 * Get a single collection
 */
export async function getCollection(collectionId: string): Promise<Collection> {
  return apiRequest(`/collections/${collectionId}`, {
    errorMessage: "Failed to get collection",
  });
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
  return apiRequest(`/collections/${collectionId}`, {
    method: "PUT",
    ...jsonBody(data),
    errorMessage: "Failed to update collection",
  });
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  collectionId: string,
): Promise<{ success: boolean }> {
  return apiRequest(`/collections/${collectionId}`, {
    method: "DELETE",
    errorMessage: "Failed to delete collection",
  });
}

/**
 * Copy a collection to another workspace
 */
export async function copyCollectionToWorkspace(
  collectionId: string,
  targetWorkspaceId: string,
): Promise<Collection> {
  return apiRequest(`/collections/${collectionId}/copy-to-workspace`, {
    method: "POST",
    ...jsonBody({ targetWorkspaceId }),
    errorMessage: "Failed to copy collection",
  });
}

/**
 * Move a collection to another workspace
 */
export async function moveCollectionToWorkspace(
  collectionId: string,
  targetWorkspaceId: string,
): Promise<Collection> {
  return apiRequest(`/collections/${collectionId}/move-to-workspace`, {
    method: "POST",
    ...jsonBody({ targetWorkspaceId }),
    errorMessage: "Failed to move collection",
  });
}

// ============================================================================
// Collection Team Access
// ============================================================================

/**
 * List teams with access to a collection
 */
export async function listCollectionTeams(
  workspaceId: string,
  collectionId: string,
): Promise<CollectionTeamAccess[]> {
  return apiRequest(
    `/workspaces/${workspaceId}/collections/${collectionId}/teams`,
    {
      errorMessage: "Failed to list collection teams",
    },
  );
}

/**
 * Set team access level for a collection
 */
export async function setCollectionTeamAccess(
  workspaceId: string,
  collectionId: string,
  teamId: string,
  accessLevel: CollectionAccessLevel = "EDIT",
): Promise<{ success: boolean }> {
  return apiRequest(
    `/workspaces/${workspaceId}/collections/${collectionId}/teams`,
    {
      method: "POST",
      ...jsonBody({ teamId, accessLevel }),
      errorMessage: "Failed to set team access",
    },
  );
}

/**
 * Remove team access from a collection
 */
export async function removeCollectionTeamAccess(
  workspaceId: string,
  collectionId: string,
  teamId: string,
): Promise<{ success: boolean }> {
  return apiRequest(
    `/workspaces/${workspaceId}/collections/${collectionId}/teams/${teamId}`,
    {
      method: "DELETE",
      errorMessage: "Failed to remove team access",
    },
  );
}
