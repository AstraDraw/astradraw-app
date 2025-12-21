import React from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { SceneCard } from "./SceneCard";

import type { WorkspaceScene, Collection } from "../../auth/workspaceApi";

// Icons
const dashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const backIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

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

const sortIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" />
  </svg>
);

const plusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

interface BoardModeNavProps {
  activeCollection: Collection | null;
  scenes: WorkspaceScene[];
  currentSceneId: string | null;
  isLoading: boolean;
  onDashboardClick: () => void;
  onBackClick: () => void;
  onSceneClick: (scene: WorkspaceScene) => void;
  onNewScene: (collectionId?: string) => void;
  onDeleteScene?: (sceneId: string) => void;
  onRenameScene?: (sceneId: string, newTitle: string) => void;
  onDuplicateScene?: (sceneId: string) => void;
  authorName?: string;
}

export const BoardModeNav: React.FC<BoardModeNavProps> = ({
  activeCollection,
  scenes,
  currentSceneId,
  isLoading,
  onDashboardClick,
  onBackClick,
  onSceneClick,
  onNewScene,
  onDeleteScene,
  onRenameScene,
  onDuplicateScene,
  authorName,
}) => {
  const collectionIcon = activeCollection?.isPrivate
    ? lockIcon
    : activeCollection?.icon || folderIcon;

  const collectionName = activeCollection?.isPrivate
    ? t("workspace.private")
    : activeCollection?.name || t("workspace.untitled");

  return (
    <div className="board-mode-nav">
      {/* Dashboard link */}
      <button className="board-mode-nav__dashboard" onClick={onDashboardClick}>
        <span className="board-mode-nav__icon">{dashboardIcon}</span>
        <span className="board-mode-nav__label">
          {t("workspace.dashboard")}
        </span>
      </button>

      {/* Active collection header */}
      <div className="board-mode-nav__collection-header">
        <button
          className="board-mode-nav__back"
          onClick={onBackClick}
          title={t("workspace.backToDashboard")}
        >
          {backIcon}
        </button>
        <span className="board-mode-nav__collection-icon">
          {collectionIcon}
        </span>
        <span className="board-mode-nav__collection-name">
          {collectionName}
        </span>
        <div className="board-mode-nav__collection-actions">
          <button className="board-mode-nav__sort" title={t("workspace.sort")}>
            {sortIcon}
          </button>
          <button
            className="board-mode-nav__add"
            onClick={() => onNewScene(activeCollection?.id)}
            title={t("workspace.createScene")}
          >
            {plusIcon}
          </button>
        </div>
      </div>

      {/* Scene list */}
      <div className="board-mode-nav__scenes">
        {isLoading ? (
          <div className="board-mode-nav__loading">
            <div className="board-mode-nav__spinner" />
          </div>
        ) : scenes.length === 0 ? (
          <div className="board-mode-nav__empty">
            <p>{t("workspace.noScenes")}</p>
            <span className="board-mode-nav__empty-hint">
              {t("workspace.noScenesHint")}
            </span>
          </div>
        ) : (
          <div className="board-mode-nav__scene-list">
            {scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isActive={scene.id === currentSceneId}
                onOpen={() => onSceneClick(scene)}
                onDelete={
                  onDeleteScene && scene.canEdit !== false
                    ? () => onDeleteScene(scene.id)
                    : undefined
                }
                onRename={
                  onRenameScene && scene.canEdit !== false
                    ? (newTitle) => onRenameScene(scene.id, newTitle)
                    : undefined
                }
                onDuplicate={
                  onDuplicateScene ? () => onDuplicateScene(scene.id) : () => {}
                }
                authorName={authorName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardModeNav;
