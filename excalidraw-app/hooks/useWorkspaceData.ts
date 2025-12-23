/**
 * useWorkspaceData Hook
 *
 * Manages workspace and collections data loading:
 * - Loads current workspace based on slug
 * - Loads collections for the workspace
 * - Finds and tracks private collection ID
 * - Handles collections refresh trigger
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useAtomValue } from "../app-jotai";
import {
  listWorkspaces,
  listCollections,
  type Workspace,
  type Collection,
} from "../auth/workspaceApi";
import { collectionsRefreshAtom } from "../components/Settings";

export interface UseWorkspaceDataOptions {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current workspace slug (from URL or state) */
  currentWorkspaceSlug: string | null;
  /** Callback to set active collection ID */
  setActiveCollectionId: (id: string | null) => void;
}

export interface UseWorkspaceDataReturn {
  /** Current workspace object */
  currentWorkspace: Workspace | null;
  /** Set current workspace */
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  /** Collections in current workspace */
  collections: Collection[];
  /** Set collections */
  setCollections: (collections: Collection[]) => void;
  /** Private collection ID */
  privateCollectionId: string | null;
  /** Set private collection ID */
  setPrivateCollectionId: (id: string | null) => void;
  /** Reload collections from backend */
  reloadCollections: () => Promise<void>;
}

export function useWorkspaceData({
  isAuthenticated,
  currentWorkspaceSlug,
  setActiveCollectionId,
}: UseWorkspaceDataOptions): UseWorkspaceDataReturn {
  // Workspace state
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const [privateCollectionId, setPrivateCollectionId] = useState<string | null>(
    null,
  );

  // Track if we've already set the default active collection to prevent loops
  const hasSetDefaultActiveCollectionRef = useRef(false);

  // Subscribe to collections refresh trigger
  const collectionsRefresh = useAtomValue(collectionsRefreshAtom);

  // Load current workspace and find private collection when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentWorkspace(null);
      setCollections([]);
      setPrivateCollectionId(null);
      hasSetDefaultActiveCollectionRef.current = false;
      return;
    }

    const loadWorkspaceData = async () => {
      try {
        // Get user's workspaces
        const workspaces = await listWorkspaces();
        if (workspaces.length > 0) {
          const workspace =
            (currentWorkspaceSlug &&
              workspaces.find((ws) => ws.slug === currentWorkspaceSlug)) ||
            workspaces[0]; // Fallback to first workspace as default
          setCurrentWorkspace(workspace);

          // Find the private collection in this workspace
          const workspaceCollections = await listCollections(workspace.id);
          setCollections(workspaceCollections);

          const privateCollection = workspaceCollections.find(
            (c) => c.isPrivate,
          );
          if (privateCollection) {
            setPrivateCollectionId(privateCollection.id);
            // Set as default active collection only once
            if (!hasSetDefaultActiveCollectionRef.current) {
              hasSetDefaultActiveCollectionRef.current = true;
              setActiveCollectionId(privateCollection.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load workspace data:", error);
      }
    };

    loadWorkspaceData();
    // Note: Removed activeCollectionId from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, setActiveCollectionId, currentWorkspaceSlug]);

  // Reload collections when refresh trigger fires
  useEffect(() => {
    if (!currentWorkspace || !isAuthenticated) {
      return;
    }

    const reloadCollections = async () => {
      try {
        const workspaceCollections = await listCollections(currentWorkspace.id);
        setCollections(workspaceCollections);
      } catch (error) {
        console.error("Failed to reload collections:", error);
      }
    };

    // Only reload if collectionsRefresh > 0 (meaning it was triggered, not initial mount)
    if (collectionsRefresh > 0) {
      reloadCollections();
    }
  }, [collectionsRefresh, currentWorkspace, isAuthenticated]);

  // Manual reload function
  const reloadCollections = useCallback(async () => {
    if (!currentWorkspace) {
      return;
    }

    try {
      const workspaceCollections = await listCollections(currentWorkspace.id);
      setCollections(workspaceCollections);
    } catch (error) {
      console.error("Failed to reload collections:", error);
    }
  }, [currentWorkspace]);

  return {
    currentWorkspace,
    setCurrentWorkspace,
    collections,
    setCollections,
    privateCollectionId,
    setPrivateCollectionId,
    reloadCollections,
  };
}
