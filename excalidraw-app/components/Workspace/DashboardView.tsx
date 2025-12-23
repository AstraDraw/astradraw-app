import React, { useState, useCallback, useMemo } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtomValue, useSetAtom } from "../../app-jotai";
import {
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  type WorkspaceScene,
  type Workspace,
} from "../../auth/workspaceApi";
import {
  navigateToCanvasAtom,
  navigateToSceneAtom,
  currentWorkspaceSlugAtom,
  triggerScenesRefreshAtom,
} from "../Settings/settingsState";
import { useScenesCache } from "../../hooks/useScenesCache";

import { SceneCardGrid } from "./SceneCardGrid";

import "./DashboardView.scss";

// Icons
const dashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const plusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

interface DashboardViewProps {
  workspace: Workspace | null;
  onNewScene: (collectionId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workspace,
  onNewScene,
}) => {
  const navigateToCanvas = useSetAtom(navigateToCanvasAtom);
  const navigateToScene = useSetAtom(navigateToSceneAtom);
  const workspaceSlug = useAtomValue(currentWorkspaceSlugAtom);
  const triggerScenesRefresh = useSetAtom(triggerScenesRefreshAtom);

  // Use shared scenes cache - fetch all scenes for workspace (no collection filter)
  const { scenes: allScenes, isLoading, updateScenes } = useScenesCache({
    workspaceId: workspace?.id,
    collectionId: null, // null = all scenes
    enabled: !!workspace?.id,
  });

  // Derive recently modified and visited from cached scenes
  const { recentlyModified, recentlyVisited } = useMemo(() => {
    // Sort by updatedAt for recently modified
    const sortedByModified = [...allScenes].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return {
      recentlyModified: sortedByModified.slice(0, 8),
      // For recently visited, we'd need a separate API endpoint
      // For now, use the same data but could be different in future
      recentlyVisited: sortedByModified.slice(0, 6),
    };
  }, [allScenes]);

  // Handlers - update shared cache so all components stay in sync
  const handleDeleteScene = useCallback(
    async (sceneId: string) => {
      if (!confirm(t("workspace.confirmDeleteScene"))) {
        return;
      }

      try {
        await deleteSceneApi(sceneId);
        updateScenes((prev) => prev.filter((s) => s.id !== sceneId));
        triggerScenesRefresh(); // Notify other components
      } catch (err) {
        console.error("Failed to delete scene:", err);
        alert("Failed to delete scene");
      }
    },
    [updateScenes, triggerScenesRefresh],
  );

  const handleRenameScene = useCallback(
    async (sceneId: string, newTitle: string) => {
      try {
        const updatedScene = await updateSceneApi(sceneId, { title: newTitle });
        updateScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? updatedScene : s)),
        );
        triggerScenesRefresh(); // Notify other components
      } catch (err) {
        console.error("Failed to rename scene:", err);
        alert("Failed to rename scene");
      }
    },
    [updateScenes, triggerScenesRefresh],
  );

  const handleDuplicateScene = useCallback(
    async (sceneId: string) => {
      try {
        const newScene = await duplicateSceneApi(sceneId);
        updateScenes((prev) => [newScene, ...prev]);
        triggerScenesRefresh(); // Notify other components
      } catch (err) {
        console.error("Failed to duplicate scene:", err);
        alert("Failed to duplicate scene");
      }
    },
    [updateScenes, triggerScenesRefresh],
  );

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

  if (isLoading) {
    return (
      <div className="dashboard-view">
        <div className="dashboard-view__loading">
          <div className="dashboard-view__spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {/* Header */}
      <header className="dashboard-view__header">
        <div className="dashboard-view__title-row">
          <span className="dashboard-view__icon">{dashboardIcon}</span>
          <h1 className="dashboard-view__title">{t("workspace.dashboard")}</h1>
        </div>
        <p className="dashboard-view__tip">
          <strong>{t("workspace.tip")}</strong> {t("workspace.changeHomePage")}{" "}
          <a href="#preferences">{t("workspace.preferences")}</a>
        </p>
        <button
          className="dashboard-view__start-button"
          onClick={() => {
            navigateToCanvas();
            onNewScene();
          }}
        >
          {plusIcon}
          <span>{t("workspace.startDrawing")}</span>
        </button>
      </header>

      {/* Separator after header */}
      <div className="dashboard-view__separator" />

      {/* Recently modified section */}
      <section className="dashboard-view__section">
        <h2 className="dashboard-view__section-title">
          {t("workspace.recentlyModified")}
        </h2>
        <SceneCardGrid
          scenes={recentlyModified}
          onOpenScene={handleOpenScene}
          onDeleteScene={handleDeleteScene}
          onRenameScene={handleRenameScene}
          onDuplicateScene={handleDuplicateScene}
          emptyMessage={t("workspace.noScenes")}
          emptyHint={t("workspace.noScenesHint")}
        />
      </section>

      {/* Recently visited section */}
      <section className="dashboard-view__section">
        <h2 className="dashboard-view__section-title">
          {t("workspace.recentlyVisited")}
        </h2>
        <SceneCardGrid
          scenes={recentlyVisited}
          onOpenScene={handleOpenScene}
          onDeleteScene={handleDeleteScene}
          onRenameScene={handleRenameScene}
          onDuplicateScene={handleDuplicateScene}
          emptyMessage={t("workspace.noRecentlyVisited")}
        />
      </section>

      {/* Team members section (placeholder) */}
      <section className="dashboard-view__section">
        <h2 className="dashboard-view__section-title">
          {t("workspace.teamMembersAt")}
        </h2>
        <div className="dashboard-view__team-empty">
          <div className="dashboard-view__team-empty-illustration">
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
          <p className="dashboard-view__team-empty-text">
            {t("workspace.noOneActive")}
          </p>
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
