import { useCallback } from "react";
import { t } from "@excalidraw/excalidraw/i18n";
import { useQueryClient } from "@tanstack/react-query";

import { showError } from "../utils/toast";
import { queryKeys } from "../lib/queryClient";
import {
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  type WorkspaceScene,
} from "../auth/workspaceApi";

interface UseSceneActionsOptions {
  /**
   * Function to update the local scenes state.
   * This should update both local state and cache if applicable.
   */
  updateScenes: (updater: (prev: WorkspaceScene[]) => WorkspaceScene[]) => void;

  /**
   * Optional callback when a scene is successfully renamed.
   * Useful for updating the current scene title in the header.
   */
  onSceneRenamed?: (sceneId: string, newTitle: string) => void;
}

interface UseSceneActionsResult {
  /**
   * Delete a scene after confirmation.
   * @returns true if deleted, false if cancelled or failed
   */
  deleteScene: (sceneId: string) => Promise<boolean>;

  /**
   * Rename a scene.
   * @returns true if renamed successfully, false if failed
   */
  renameScene: (sceneId: string, newTitle: string) => Promise<boolean>;

  /**
   * Duplicate a scene.
   * @returns the new scene if successful, null if failed
   */
  duplicateScene: (sceneId: string) => Promise<WorkspaceScene | null>;
}

/**
 * Hook for scene CRUD operations with consistent error handling.
 *
 * Centralizes delete/rename/duplicate logic that was previously duplicated in:
 * - WorkspaceSidebar.tsx
 * - DashboardView.tsx
 * - CollectionView.tsx
 * - SearchResultsView.tsx
 *
 * @example
 * ```typescript
 * const { deleteScene, renameScene, duplicateScene } = useSceneActions({
 *   updateScenes,
 * });
 *
 * // Delete with confirmation
 * await deleteScene(scene.id);
 *
 * // Rename
 * await renameScene(scene.id, "New Title");
 *
 * // Duplicate and get new scene
 * const newScene = await duplicateScene(scene.id);
 * ```
 */
export function useSceneActions({
  updateScenes,
  onSceneRenamed,
}: UseSceneActionsOptions): UseSceneActionsResult {
  const queryClient = useQueryClient();

  // Invalidate all scenes queries to ensure fresh data across all components
  const invalidateScenes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all });
  }, [queryClient]);

  const deleteScene = useCallback(
    async (sceneId: string): Promise<boolean> => {
      if (!confirm(t("workspace.confirmDeleteScene"))) {
        return false;
      }

      try {
        await deleteSceneApi(sceneId);
        updateScenes((prev) => prev.filter((s) => s.id !== sceneId));
        invalidateScenes();
        return true;
      } catch (err) {
        console.error("Failed to delete scene:", err);
        showError(t("workspace.deleteSceneError") || "Failed to delete scene");
        return false;
      }
    },
    [updateScenes, invalidateScenes],
  );

  const renameScene = useCallback(
    async (sceneId: string, newTitle: string): Promise<boolean> => {
      try {
        const updatedScene = await updateSceneApi(sceneId, { title: newTitle });
        updateScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? updatedScene : s)),
        );
        onSceneRenamed?.(sceneId, newTitle);
        invalidateScenes();
        return true;
      } catch (err) {
        console.error("Failed to rename scene:", err);
        showError(t("workspace.renameSceneError") || "Failed to rename scene");
        return false;
      }
    },
    [updateScenes, onSceneRenamed, invalidateScenes],
  );

  const duplicateScene = useCallback(
    async (sceneId: string): Promise<WorkspaceScene | null> => {
      try {
        const newScene = await duplicateSceneApi(sceneId);
        updateScenes((prev) => [newScene, ...prev]);
        invalidateScenes();
        return newScene;
      } catch (err) {
        console.error("Failed to duplicate scene:", err);
        showError(
          t("workspace.duplicateSceneError") || "Failed to duplicate scene",
        );
        return null;
      }
    },
    [updateScenes, invalidateScenes],
  );

  return { deleteScene, renameScene, duplicateScene };
}
