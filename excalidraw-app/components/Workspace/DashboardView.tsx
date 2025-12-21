import React, { useEffect, useState, useCallback } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useSetAtom } from "../../app-jotai";
import {
  listWorkspaceScenes,
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  type WorkspaceScene,
  type Workspace,
} from "../../auth/workspaceApi";
import { navigateToCanvasAtom } from "../Settings/settingsState";

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
  onOpenScene: (scene: WorkspaceScene) => void;
  onNewScene: (collectionId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workspace,
  onOpenScene,
  onNewScene,
}) => {
  const navigateToCanvas = useSetAtom(navigateToCanvasAtom);

  const [recentlyModified, setRecentlyModified] = useState<WorkspaceScene[]>(
    [],
  );
  const [recentlyVisited, setRecentlyVisited] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load scenes
  // Use workspace ID in dependency array to prevent infinite loops from object reference changes
  const workspaceId = workspace?.id;

  useEffect(() => {
    const loadScenes = async () => {
      if (!workspaceId) {
        setRecentlyModified([]);
        setRecentlyVisited([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Get all scenes for the workspace (no collection filter)
        const allScenes = await listWorkspaceScenes(workspaceId);

        // Sort by updatedAt for recently modified
        const sortedByModified = [...allScenes].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setRecentlyModified(sortedByModified.slice(0, 8));

        // For recently visited, we'd need a separate API endpoint
        // For now, use the same data but could be different in future
        setRecentlyVisited(sortedByModified.slice(0, 6));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load dashboard scenes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadScenes();
  }, [workspaceId]);

  // Handlers
  const handleDeleteScene = useCallback(async (sceneId: string) => {
    if (!confirm(t("workspace.confirmDeleteScene"))) {
      return;
    }

    try {
      await deleteSceneApi(sceneId);
      setRecentlyModified((prev) => prev.filter((s) => s.id !== sceneId));
      setRecentlyVisited((prev) => prev.filter((s) => s.id !== sceneId));
    } catch (err) {
      console.error("Failed to delete scene:", err);
      alert("Failed to delete scene");
    }
  }, []);

  const handleRenameScene = useCallback(
    async (sceneId: string, newTitle: string) => {
      try {
        const updatedScene = await updateSceneApi(sceneId, { title: newTitle });
        const updateList = (prev: WorkspaceScene[]) =>
          prev.map((s) => (s.id === sceneId ? updatedScene : s));
        setRecentlyModified(updateList);
        setRecentlyVisited(updateList);
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
      setRecentlyModified((prev) => [newScene, ...prev.slice(0, 7)]);
    } catch (err) {
      console.error("Failed to duplicate scene:", err);
      alert("Failed to duplicate scene");
    }
  }, []);

  const handleOpenScene = useCallback(
    (scene: WorkspaceScene) => {
      navigateToCanvas();
      onOpenScene(scene);
    },
    [navigateToCanvas, onOpenScene],
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
          onClick={() => onNewScene()}
        >
          {plusIcon}
          <span>{t("workspace.startDrawing")}</span>
        </button>
      </header>

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
