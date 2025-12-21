import React, { useEffect, useState, useCallback } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtomValue, useSetAtom } from "../../app-jotai";
import {
  listWorkspaceScenes,
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  type WorkspaceScene,
  type Workspace,
  type Collection,
} from "../../auth/workspaceApi";
import {
  navigateToCanvasAtom,
  navigateToSceneAtom,
  currentWorkspaceSlugAtom,
} from "../Settings/settingsState";

import { SceneCardGrid } from "./SceneCardGrid";

import "./CollectionView.scss";

// Icons
const lockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const folderIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const importIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

const plusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const sortIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" />
  </svg>
);

interface CollectionViewProps {
  workspace: Workspace | null;
  collection: Collection | null;
  onNewScene: (collectionId?: string) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  workspace,
  collection,
  onNewScene,
}) => {
  const navigateToCanvas = useSetAtom(navigateToCanvasAtom);
  const navigateToScene = useSetAtom(navigateToSceneAtom);
  const workspaceSlug = useAtomValue(currentWorkspaceSlugAtom);

  const [scenes, setScenes] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"created" | "modified">("created");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Load scenes for this collection
  // Use IDs in dependency array to prevent infinite loops from object reference changes
  const workspaceId = workspace?.id;
  const collectionId = collection?.id;

  useEffect(() => {
    const loadScenes = async () => {
      if (!workspaceId || !collectionId) {
        setScenes([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await listWorkspaceScenes(workspaceId, collectionId);
        setScenes(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load collection scenes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadScenes();
  }, [workspaceId, collectionId]);

  // Sort scenes
  const sortedScenes = React.useMemo(() => {
    const sorted = [...scenes];
    if (sortBy === "created") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
    return sorted;
  }, [scenes, sortBy]);

  // Handlers
  const handleDeleteScene = useCallback(async (sceneId: string) => {
    if (!confirm(t("workspace.confirmDeleteScene"))) {
      return;
    }

    try {
      await deleteSceneApi(sceneId);
      setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    } catch (err) {
      console.error("Failed to delete scene:", err);
      alert("Failed to delete scene");
    }
  }, []);

  const handleRenameScene = useCallback(
    async (sceneId: string, newTitle: string) => {
      try {
        const updatedScene = await updateSceneApi(sceneId, { title: newTitle });
        setScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? updatedScene : s)),
        );
      } catch (err) {
        console.error("Failed to rename scene:", err);
        alert("Failed to rename scene");
      }
    },
    [],
  );

  const handleDuplicateScene = useCallback(async (sceneId: string) => {
    try {
      const newScene = await duplicateSceneApi(sceneId);
      setScenes((prev) => [newScene, ...prev]);
    } catch (err) {
      console.error("Failed to duplicate scene:", err);
      alert("Failed to duplicate scene");
    }
  }, []);

  // Navigate to scene via URL - this triggers the popstate handler which loads the scene
  const handleOpenScene = useCallback(
    (scene: WorkspaceScene) => {
      if (workspaceSlug) {
        navigateToScene({
          sceneId: scene.id,
          title: scene.title,
          workspaceSlug,
        });
      }
    },
    [navigateToScene, workspaceSlug],
  );

  const handleImportScenes = useCallback(() => {
    // TODO: Implement import dialog
    // eslint-disable-next-line no-console
    console.log("Import scenes - not yet implemented");
  }, []);

  const handleCreateScene = useCallback(() => {
    navigateToCanvas();
    onNewScene(collection?.id);
  }, [navigateToCanvas, onNewScene, collection]);

  // Get collection display info
  const collectionIcon = collection?.isPrivate
    ? lockIcon
    : collection?.icon || folderIcon;
  const collectionName = collection?.isPrivate
    ? t("workspace.private")
    : collection?.name || t("workspace.untitled");
  const collectionDescription = collection?.isPrivate
    ? t("workspace.privateDescription")
    : null;

  if (isLoading) {
    return (
      <div className="collection-view">
        <div className="collection-view__loading">
          <div className="collection-view__spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="collection-view">
      {/* Header */}
      <header className="collection-view__header">
        <div className="collection-view__title-row">
          <span className="collection-view__icon">{collectionIcon}</span>
          <h1 className="collection-view__title">{collectionName}</h1>

          {/* Sort dropdown */}
          <div className="collection-view__sort">
            <button
              className="collection-view__sort-trigger"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              {sortBy === "created"
                ? t("workspace.lastCreated")
                : t("workspace.lastModified")}
              {sortIcon}
            </button>
            {showSortMenu && (
              <div className="collection-view__sort-menu">
                <button
                  className={sortBy === "created" ? "active" : ""}
                  onClick={() => {
                    setSortBy("created");
                    setShowSortMenu(false);
                  }}
                >
                  {t("workspace.lastCreated")}
                </button>
                <button
                  className={sortBy === "modified" ? "active" : ""}
                  onClick={() => {
                    setSortBy("modified");
                    setShowSortMenu(false);
                  }}
                >
                  {t("workspace.lastModified")}
                </button>
              </div>
            )}
          </div>
        </div>

        {collectionDescription && (
          <p className="collection-view__description">
            {collectionDescription}
          </p>
        )}
      </header>

      {/* Action buttons */}
      <div className="collection-view__actions">
        <button
          className="collection-view__action-button"
          onClick={handleImportScenes}
        >
          {importIcon}
          <span>{t("workspace.importScenes")}</span>
          {plusIcon}
        </button>
        <button
          className="collection-view__action-button"
          onClick={handleCreateScene}
        >
          {plusIcon}
          <span>{t("workspace.createScene")}</span>
          {plusIcon}
        </button>
      </div>

      {/* Scene grid */}
      <div className="collection-view__content">
        {sortedScenes.length === 0 ? (
          <div className="collection-view__empty">
            <div className="collection-view__empty-illustration">
              {/* Paper airplane doodle */}
              <svg
                viewBox="0 0 200 120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 4"
              >
                <path d="M20 80 Q60 40 100 60 Q140 80 180 40" />
                <path d="M170 35 L180 40 L175 50" />
              </svg>
            </div>
            <p className="collection-view__empty-title">
              {t("workspace.emptyCollection")}
            </p>
            <button
              className="collection-view__empty-cta"
              onClick={handleCreateScene}
            >
              {t("workspace.letsChangeThat")}
            </button>
            <p className="collection-view__empty-hint">
              {t("workspace.dragDropHint")}
            </p>
          </div>
        ) : (
          <SceneCardGrid
            scenes={sortedScenes}
            onOpenScene={handleOpenScene}
            onDeleteScene={handleDeleteScene}
            onRenameScene={handleRenameScene}
            onDuplicateScene={handleDuplicateScene}
          />
        )}
      </div>
    </div>
  );
};

export default CollectionView;
