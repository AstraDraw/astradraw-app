import { useCallback, useState, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "../app-jotai";
import {
  scenesCacheAtom,
  setScenesCacheAtom,
  invalidateScenesCacheAtom,
  scenesRefreshAtom,
} from "../components/Settings/settingsState";
import { listWorkspaceScenes } from "../auth/workspaceApi";
import type { WorkspaceScene } from "../auth/workspaceApi";

interface UseScenesOptions {
  workspaceId: string | undefined;
  collectionId?: string | null;
  enabled?: boolean;
}

interface UseScenesResult {
  scenes: WorkspaceScene[];
  isLoading: boolean;
  error: Error | null;
  refetch: (force?: boolean) => Promise<void>;
  updateScenes: (updater: (prev: WorkspaceScene[]) => WorkspaceScene[]) => void;
}

/**
 * Hook for fetching scenes with shared caching across components.
 * Implements stale-while-revalidate pattern:
 * - Shows cached data immediately (no spinner)
 * - Refreshes in background
 * - Only shows spinner on first load
 */
export function useScenesCache({
  workspaceId,
  collectionId,
  enabled = true,
}: UseScenesOptions): UseScenesResult {
  const [scenes, setScenes] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cache = useAtomValue(scenesCacheAtom);
  const setCacheEntry = useSetAtom(setScenesCacheAtom);
  const scenesRefresh = useAtomValue(scenesRefreshAtom);
  const prevRefreshRef = useRef(scenesRefresh);

  // Build cache key
  const cacheKey = workspaceId
    ? `${workspaceId}:${collectionId || "all"}`
    : null;

  // Fetch scenes with caching
  const fetchScenes = useCallback(
    async (forceRefresh = false) => {
      if (!workspaceId || !enabled) {
        return;
      }

      const key = `${workspaceId}:${collectionId || "all"}`;
      const cached = cache.get(key);

      // If we have cached data and not forcing refresh, show it immediately
      if (cached && !forceRefresh) {
        setScenes(cached.scenes as WorkspaceScene[]);

        // Background refresh (stale-while-revalidate)
        try {
          const freshData = await listWorkspaceScenes(
            workspaceId,
            collectionId || undefined,
          );
          setCacheEntry({ key, scenes: freshData });
          setScenes(freshData);
        } catch (err) {
          console.error("Background refresh failed:", err);
          // Keep showing cached data
        }
        return;
      }

      // No cache or force refresh - show loading
      setIsLoading(true);
      setError(null);

      try {
        const data = await listWorkspaceScenes(
          workspaceId,
          collectionId || undefined,
        );
        setCacheEntry({ key, scenes: data });
        setScenes(data);
      } catch (err) {
        console.error("Failed to load scenes:", err);
        setError(err instanceof Error ? err : new Error("Failed to load"));
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId, collectionId, enabled, cache, setCacheEntry],
  );

  // Update scenes and cache together
  const updateScenes = useCallback(
    (updater: (prev: WorkspaceScene[]) => WorkspaceScene[]) => {
      setScenes((prev) => {
        const newScenes = updater(prev);
        if (cacheKey) {
          setCacheEntry({ key: cacheKey, scenes: newScenes });
        }
        return newScenes;
      });
    },
    [cacheKey, setCacheEntry],
  );

  // Initial fetch and refetch on dependencies change
  useEffect(() => {
    if (enabled && workspaceId) {
      // Check if this is a refresh trigger (scenesRefresh changed)
      const isRefreshTrigger = prevRefreshRef.current !== scenesRefresh;
      prevRefreshRef.current = scenesRefresh;

      fetchScenes(isRefreshTrigger);
    }
  }, [enabled, workspaceId, collectionId, scenesRefresh, fetchScenes]);

  return {
    scenes,
    isLoading,
    error,
    refetch: fetchScenes,
    updateScenes,
  };
}

/**
 * Hook to invalidate scenes cache
 */
export function useInvalidateScenesCache() {
  const invalidate = useSetAtom(invalidateScenesCacheAtom);

  return useCallback(
    (workspaceId: string, collectionId?: string) => {
      invalidate({ workspaceId, collectionId });
    },
    [invalidate],
  );
}

