import React, { useState, useCallback } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtomValue, useSetAtom } from "../../app-jotai";
import {
  type WorkspaceScene,
  type Workspace,
  type Collection,
} from "../../auth/workspaceApi";
import {
  navigateToCanvasAtom,
  navigateToSceneAtom,
  currentWorkspaceSlugAtom,
} from "../Settings/settingsState";
import { useScenesCache } from "../../hooks/useScenesCache";
import { useSceneActions } from "../../hooks/useSceneActions";

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
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.496 5.627A2.25 2.25 0 0 1 22 7.75v10A4.25 4.25 0 0 1 17.75 22h-10a2.25 2.25 0 0 1-2.123-1.504l2.097.004H17.75a2.75 2.75 0 0 0 2.75-2.75v-10l-.004-.051V5.627ZM17.246 2a2.25 2.25 0 0 1 2.25 2.25v12.997a2.25 2.25 0 0 1-2.25 2.25H4.25A2.25 2.25 0 0 1 2 17.247V4.25A2.25 2.25 0 0 1 4.25 2h12.997Zm0 1.5H4.25a.75.75 0 0 0-.75.75v12.997c0 .414.336.75.75.75h12.997a.75.75 0 0 0 .75-.75V4.25a.75.75 0 0 0-.75-.75Z"
      fill="currentColor"
    />
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

  const [sortBy, setSortBy] = useState<"created" | "modified">("created");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Use shared scenes cache for this collection
  const { scenes, isLoading, updateScenes } = useScenesCache({
    workspaceId: workspace?.id,
    collectionId: collection?.id,
    enabled: !!workspace?.id && !!collection?.id,
  });

  // Scene actions hook - centralized delete/rename/duplicate logic
  const { deleteScene, renameScene, duplicateScene } = useSceneActions({
    updateScenes,
  });

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
  const collectionName = collection?.isPrivate
    ? t("workspace.private")
    : collection?.name || t("workspace.untitled");
  const collectionDescription = collection?.isPrivate
    ? t("workspace.privateDescription")
    : null;

  // Render icon with default styling if no emoji icon
  const renderCollectionIcon = () => {
    if (collection?.isPrivate) {
      return <span className="collection-view__icon">{lockIcon}</span>;
    }
    if (collection?.icon) {
      return <span className="collection-view__icon">{collection.icon}</span>;
    }
    // Default SVG icon with circular background
    return (
      <span className="collection-view__icon collection-view__icon--default">
        {folderIcon}
      </span>
    );
  };

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
          {renderCollectionIcon()}
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

      {/* Separator after header */}
      <div className="collection-view__separator" />

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
            onDeleteScene={deleteScene}
            onRenameScene={renameScene}
            onDuplicateScene={duplicateScene}
          />
        )}
      </div>
    </div>
  );
};

export default CollectionView;
