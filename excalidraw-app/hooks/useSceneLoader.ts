/**
 * useSceneLoader Hook
 *
 * Manages scene loading from workspace URLs, including:
 * - Loading scene data from backend
 * - Updating Excalidraw with scene content
 * - Auto-joining collaboration rooms
 * - Managing scene state (id, title, access)
 */

import { useCallback, useRef, useState } from "react";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { RestoredDataState } from "@excalidraw/excalidraw/data/restore";

import {
  loadWorkspaceScene,
  type SceneAccess,
} from "../data/workspaceSceneLoader";

import type { CollabAPI } from "../collab/Collab";

export interface UseSceneLoaderOptions {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  collabAPI: CollabAPI | null;
  isCollabDisabled: boolean;
  /** Callback to set auto-collab scene state */
  setIsAutoCollabScene: (value: boolean) => void;
  /** Callback to navigate to canvas mode */
  navigateToCanvas: () => void;
  /** Callback when error occurs */
  onError: (message: string) => void;
  /** Callback to initialize autosave with loaded data */
  initializeAutoSave?: (dataJson: string) => void;
}

export interface UseSceneLoaderReturn {
  /** Current scene ID (null if no scene loaded) */
  currentSceneId: string | null;
  /** Current scene title */
  currentSceneTitle: string;
  /** Current scene access permissions */
  currentSceneAccess: SceneAccess | null;
  /** Current workspace slug */
  currentWorkspaceSlug: string | null;
  /** Set current scene ID */
  setCurrentSceneId: (id: string | null) => void;
  /** Set current scene title */
  setCurrentSceneTitle: (title: string) => void;
  /** Set current workspace slug */
  setCurrentWorkspaceSlug: (slug: string | null) => void;
  /**
   * Load a scene from workspace URL
   * @param workspaceSlug - Workspace slug
   * @param sceneId - Scene ID to load
   * @param options - Additional options
   */
  loadScene: (
    workspaceSlug: string,
    sceneId: string,
    options?: {
      isInitialLoad?: boolean;
      roomKeyFromHash?: string | null;
      /** Promise to resolve with initial data (for initial load) */
      initialStatePromise?: {
        resolve: (data: any) => void;
      };
    },
  ) => Promise<void>;
  /** Ref to access loadScene in closures */
  loadSceneRef: React.MutableRefObject<
    ((workspaceSlug: string, sceneId: string) => Promise<void>) | null
  >;
  /** Ref to access currentSceneId in closures */
  currentSceneIdRef: React.MutableRefObject<string | null>;
}

export function useSceneLoader({
  excalidrawAPI,
  collabAPI,
  isCollabDisabled,
  setIsAutoCollabScene,
  navigateToCanvas,
  onError,
  initializeAutoSave,
}: UseSceneLoaderOptions): UseSceneLoaderReturn {
  // Scene state
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [currentSceneTitle, setCurrentSceneTitle] =
    useState<string>("Untitled");
  const [currentSceneAccess, setCurrentSceneAccess] =
    useState<SceneAccess | null>(null);
  const [currentWorkspaceSlug, setCurrentWorkspaceSlug] = useState<
    string | null
  >(null);

  // Refs for closure access
  const currentSceneIdRef = useRef<string | null>(null);
  currentSceneIdRef.current = currentSceneId;

  const loadSceneRef = useRef<
    ((workspaceSlug: string, sceneId: string) => Promise<void>) | null
  >(null);

  // Helper to decode base64 to blob
  const decodeBase64ToBlob = useCallback((base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: "application/json" });
  }, []);

  // Main scene loading function
  const loadScene = useCallback(
    async (
      workspaceSlug: string,
      sceneId: string,
      options: {
        isInitialLoad?: boolean;
        roomKeyFromHash?: string | null;
        initialStatePromise?: {
          resolve: (data: any) => void;
        };
      } = {},
    ) => {
      if (!excalidrawAPI) {
        return;
      }

      const {
        isInitialLoad = false,
        roomKeyFromHash = null,
        initialStatePromise,
      } = options;

      // Leave current collaboration room before switching scenes
      if (!isInitialLoad && collabAPI?.isCollaborating()) {
        collabAPI.stopCollaboration(false); // false = don't keep remote state
      }

      try {
        const loaded = await loadWorkspaceScene(workspaceSlug, sceneId);
        setCurrentWorkspaceSlug(workspaceSlug);
        setCurrentSceneId(loaded.scene.id);
        setCurrentSceneTitle(loaded.scene.title || "Untitled");
        setCurrentSceneAccess(loaded.access);

        let restored: RestoredDataState | null = null;
        if (loaded.data) {
          const blob = decodeBase64ToBlob(loaded.data);
          const sceneData = await loadFromBlob(blob, null, null);
          restored = sceneData;
        }

        if (restored) {
          const sceneWithCollaborators = {
            ...restored,
            appState: {
              ...restored.appState,
              collaborators: new Map(),
            },
          };

          excalidrawAPI.updateScene({
            elements: sceneWithCollaborators.elements || [],
            appState: sceneWithCollaborators.appState,
            captureUpdate: CaptureUpdateAction.IMMEDIATELY,
          });

          // Load files separately
          if (sceneWithCollaborators.files) {
            excalidrawAPI.addFiles(Object.values(sceneWithCollaborators.files));
          }

          // Initialize autosave with loaded data to prevent false "unsaved" status
          if (initializeAutoSave) {
            const loadedSceneData = JSON.stringify({
              type: "excalidraw",
              version: 2,
              source: window.location.href,
              elements: sceneWithCollaborators.elements || [],
              appState: {
                viewBackgroundColor:
                  sceneWithCollaborators.appState?.viewBackgroundColor,
                gridSize: sceneWithCollaborators.appState?.gridSize,
              },
              files: sceneWithCollaborators.files || {},
            });
            initializeAutoSave(loadedSceneData);
          }

          if (isInitialLoad && initialStatePromise) {
            initialStatePromise.resolve({
              elements: sceneWithCollaborators.elements || [],
              appState: sceneWithCollaborators.appState,
              files: sceneWithCollaborators.files || {},
            });
          }
        } else if (isInitialLoad && initialStatePromise) {
          initialStatePromise.resolve(null);
        }

        // Auto-join collaboration for scenes in shared collections
        if (
          collabAPI &&
          !isCollabDisabled &&
          loaded.access.canCollaborate &&
          loaded.roomId &&
          loaded.roomKey
        ) {
          // Use room key from hash if provided (for shared links)
          const roomKey = roomKeyFromHash || loaded.roomKey;

          await collabAPI.startCollaboration({
            roomId: loaded.roomId,
            roomKey,
            isAutoCollab: true,
          });

          // Set scene ID for thumbnail generation during collaboration saves
          collabAPI.setSceneId(sceneId);

          // Mark this scene as auto-collab (collaboration can't be stopped)
          setIsAutoCollabScene(true);
        } else {
          // Not an auto-collab scene - clear any previous scene ID
          if (collabAPI) {
            collabAPI.setSceneId(null);
          }
          setIsAutoCollabScene(false);
        }

        navigateToCanvas();
      } catch (error) {
        console.error("Failed to load workspace scene:", error);
        onError(
          error instanceof Error ? error.message : "Failed to load scene",
        );
        if (isInitialLoad && initialStatePromise) {
          initialStatePromise.resolve(null);
        }
      }
    },
    [
      excalidrawAPI,
      collabAPI,
      isCollabDisabled,
      decodeBase64ToBlob,
      setIsAutoCollabScene,
      navigateToCanvas,
      onError,
      initializeAutoSave,
    ],
  );

  // Update ref when loadScene changes
  loadSceneRef.current = loadScene;

  return {
    currentSceneId,
    currentSceneTitle,
    currentSceneAccess,
    currentWorkspaceSlug,
    setCurrentSceneId,
    setCurrentSceneTitle,
    setCurrentWorkspaceSlug,
    loadScene,
    loadSceneRef,
    currentSceneIdRef,
  };
}
