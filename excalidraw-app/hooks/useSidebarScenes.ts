import { useState, useCallback, useRef, useEffect } from "react";

import { useAtomValue } from "../app-jotai";
import { scenesRefreshAtom } from "../components/Settings/settingsState";
import { listWorkspaceScenes, type WorkspaceScene } from "../auth/workspaceApi";

interface UseSidebarScenesOptions {
  isAuthenticated: boolean;
  workspaceId: string | null;
  activeCollectionId: string | null;
  /** Whether to load scenes (e.g., only in board mode) */
  enabled: boolean;
}

interface UseSidebarScenesResult {
  scenes: WorkspaceScene[];
  isLoading: boolean;
  loadScenes: (forceRefresh?: boolean) => Promise<void>;
  invalidateCache: (collectionId?: string) => void;
  updateScenesWithCache: (
    updater: (prev: WorkspaceScene[]) => WorkspaceScene[],
  ) => void;
}

/**
 * Hook for scene loading with stale-while-revalidate caching.
 *
 * Extracted from WorkspaceSidebar.tsx to centralize scene loading logic.
 *
 * Strategy: Show cached data immediately, refresh in background.
 */
export function useSidebarScenes({
  isAuthenticated,
  workspaceId,
  activeCollectionId,
  enabled,
}: UseSidebarScenesOptions): UseSidebarScenesResult {
  const [scenes, setScenes] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to scenes refresh trigger from other components (e.g., App.tsx)
  const scenesRefresh = useAtomValue(scenesRefreshAtom);
  const prevScenesRefreshRef = useRef<number>(scenesRefresh);

  // In-memory cache for scenes by collection
  // Key: "workspaceId:collectionId" or "workspaceId:all"
  const scenesCacheRef = useRef<Map<string, WorkspaceScene[]>>(new Map());

  // Load scenes with caching
  const loadScenes = useCallback(
    async (forceRefresh = false) => {
      if (!isAuthenticated || !workspaceId) {
        return;
      }

      const collectionKey = `${workspaceId}:${activeCollectionId || "all"}`;
      const cachedScenes = scenesCacheRef.current.get(collectionKey);

      // If we have cached data, show it immediately (no spinner)
      if (cachedScenes && !forceRefresh) {
        setScenes(cachedScenes);
        // Still fetch in background to get fresh data (stale-while-revalidate)
        try {
          const collectionIdToUse = activeCollectionId || undefined;
          const freshData = await listWorkspaceScenes(
            workspaceId,
            collectionIdToUse,
          );
          scenesCacheRef.current.set(collectionKey, freshData);
          setScenes(freshData);
        } catch (err) {
          console.error("Failed to refresh scenes:", err);
          // Keep showing cached data on error
        }
        return;
      }

      // No cache or force refresh - show spinner
      setIsLoading(true);

      try {
        const collectionIdToUse = activeCollectionId || undefined;
        const data = await listWorkspaceScenes(workspaceId, collectionIdToUse);
        scenesCacheRef.current.set(collectionKey, data);
        setScenes(data);
      } catch (err) {
        console.error("Failed to load scenes:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, workspaceId, activeCollectionId],
  );

  // Invalidate cache for a specific collection (call after create/delete/move)
  const invalidateCache = useCallback(
    (collectionId?: string) => {
      if (!workspaceId) {
        return;
      }

      if (collectionId) {
        // Invalidate specific collection
        scenesCacheRef.current.delete(`${workspaceId}:${collectionId}`);
      } else {
        // Invalidate all collections for this workspace
        const keysToDelete: string[] = [];
        scenesCacheRef.current.forEach((_, key) => {
          if (key.startsWith(`${workspaceId}:`)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach((key) => scenesCacheRef.current.delete(key));
      }
    },
    [workspaceId],
  );

  // Helper to update both state and cache
  const updateScenesWithCache = useCallback(
    (updater: (prev: WorkspaceScene[]) => WorkspaceScene[]) => {
      setScenes((prev) => {
        const newScenes = updater(prev);
        // Also update cache
        if (workspaceId) {
          const collectionKey = `${workspaceId}:${activeCollectionId || "all"}`;
          scenesCacheRef.current.set(collectionKey, newScenes);
        }
        return newScenes;
      });
    },
    [workspaceId, activeCollectionId],
  );

  // Load scenes when dependencies change
  // Also reload when scenesRefresh changes (triggered by other components)
  useEffect(() => {
    if (enabled && isAuthenticated) {
      // Force refresh if scenesRefresh changed (scene was created/deleted elsewhere)
      const forceRefresh = prevScenesRefreshRef.current !== scenesRefresh;
      prevScenesRefreshRef.current = scenesRefresh;
      loadScenes(forceRefresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    isAuthenticated,
    activeCollectionId,
    workspaceId,
    scenesRefresh,
  ]);

  return {
    scenes,
    isLoading,
    loadScenes,
    invalidateCache,
    updateScenesWithCache,
  };
}
