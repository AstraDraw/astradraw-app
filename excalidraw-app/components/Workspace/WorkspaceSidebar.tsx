import React, { useEffect, useState, useCallback } from "react";
import { t } from "@excalidraw/excalidraw/i18n";
import { useAuth } from "../../auth";
import {
  listScenes,
  deleteScene as deleteSceneApi,
  type WorkspaceScene,
} from "../../auth/workspaceApi";
import { SceneCard } from "./SceneCard";
import { UserMenu } from "./UserMenu";
import "./WorkspaceSidebar.scss";

// Icons
const plusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const loginIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
  </svg>
);

const folderIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewScene: () => void;
  onOpenScene: (scene: WorkspaceScene) => void;
  currentSceneId?: string | null;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  isOpen,
  onClose,
  onNewScene,
  onOpenScene,
  currentSceneId,
}) => {
  const { user, isLoading: authLoading, isAuthenticated, login, oidcConfigured } = useAuth();
  const [scenes, setScenes] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScenes = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await listScenes();
      setScenes(data);
    } catch (err) {
      console.error("Failed to load scenes:", err);
      setError("Failed to load scenes");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadScenes();
    }
  }, [isOpen, isAuthenticated, loadScenes]);

  const handleDeleteScene = useCallback(async (sceneId: string) => {
    if (!confirm("Are you sure you want to delete this scene?")) {
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

  const handleLogin = () => {
    login(window.location.pathname);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="workspace-sidebar">
      <div className="workspace-sidebar__header">
        <h2 className="workspace-sidebar__title">
          {folderIcon}
          <span>{t("workspace.title")}</span>
        </h2>
        <button
          className="workspace-sidebar__close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="workspace-sidebar__content">
        {authLoading ? (
          <div className="workspace-sidebar__loading">
            <div className="workspace-sidebar__spinner" />
          </div>
        ) : !oidcConfigured ? (
          <div className="workspace-sidebar__empty">
            <p>{t("workspace.notConfigured")}</p>
            <span className="workspace-sidebar__empty-hint">
              {t("workspace.notConfiguredHint")}
            </span>
          </div>
        ) : !isAuthenticated ? (
          <div className="workspace-sidebar__login">
            <p>{t("workspace.loginPrompt")}</p>
            <button
              className="workspace-sidebar__login-button"
              onClick={handleLogin}
            >
              {loginIcon}
              <span>{t("workspace.login")}</span>
            </button>
          </div>
        ) : (
          <>
            {/* User menu */}
            {user && <UserMenu user={user} />}

            {/* New scene button */}
            <button
              className="workspace-sidebar__new-button"
              onClick={onNewScene}
            >
              {plusIcon}
              <span>{t("workspace.newScene")}</span>
            </button>

            {/* Scene list */}
            <div className="workspace-sidebar__scenes">
              {isLoading ? (
                <div className="workspace-sidebar__loading">
                  <div className="workspace-sidebar__spinner" />
                </div>
              ) : error ? (
                <div className="workspace-sidebar__error">
                  <p>{error}</p>
                  <button onClick={loadScenes}>Retry</button>
                </div>
              ) : scenes.length === 0 ? (
                <div className="workspace-sidebar__empty">
                  <p>{t("workspace.noScenes")}</p>
                  <span className="workspace-sidebar__empty-hint">
                    {t("workspace.noScenesHint")}
                  </span>
                </div>
              ) : (
                <div className="workspace-sidebar__scene-list">
                  {scenes.map((scene) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      isActive={scene.id === currentSceneId}
                      onOpen={() => onOpenScene(scene)}
                      onDelete={() => handleDeleteScene(scene.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSidebar;
