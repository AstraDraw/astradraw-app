import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { t } from "@excalidraw/excalidraw/i18n";
import { useAuth } from "../../auth";
import {
  listScenes,
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  type WorkspaceScene,
} from "../../auth/workspaceApi";
import { SceneCard } from "./SceneCard";
import { LoginDialog } from "./LoginDialog";
import { UserProfileDialog } from "./UserProfileDialog";
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

const searchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const chevronIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
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
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    login,
    oidcConfigured,
    localAuthEnabled,
  } = useAuth();
  const [scenes, setScenes] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check if any auth method is available
  const authAvailable = oidcConfigured || localAuthEnabled;

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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  // Keyboard shortcut for search (Cmd/Ctrl + P when sidebar is open)
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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

  const handleLoginClick = () => {
    // If only OIDC is available, redirect directly
    if (oidcConfigured && !localAuthEnabled) {
      login(window.location.pathname);
    } else {
      // Show login dialog for local auth or combined
      setShowLoginDialog(true);
    }
  };

  const handleLoginSuccess = () => {
    loadScenes();
  };

  // Filter scenes by search query
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) {
      return scenes;
    }
    const query = searchQuery.toLowerCase();
    return scenes.filter((scene) => scene.title.toLowerCase().includes(query));
  }, [scenes, searchQuery]);

  // Separate scenes into private and public
  const { privateScenes, publicScenes } = useMemo(() => {
    const privateScenes = filteredScenes.filter((s) => !s.isPublic);
    const publicScenes = filteredScenes.filter((s) => s.isPublic);
    return { privateScenes, publicScenes };
  }, [filteredScenes]);

  const { logout } = useAuth();

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div
      className={`workspace-sidebar ${isOpen ? "workspace-sidebar--open" : ""}`}
    >
      {/* Header with user info */}
      <div className="workspace-sidebar__header">
        {isAuthenticated && user ? (
          <div className="workspace-sidebar__user" ref={userMenuRef}>
            <button
              className="workspace-sidebar__user-trigger"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || user.email}
                  className="workspace-sidebar__avatar"
                />
              ) : (
                <div className="workspace-sidebar__avatar workspace-sidebar__avatar--initials">
                  {getInitials(user.name, user.email)}
                </div>
              )}
              <span className="workspace-sidebar__user-name">
                {user.name || "My Workspace"}
              </span>
              <span
                className={`workspace-sidebar__chevron ${
                  userMenuOpen ? "workspace-sidebar__chevron--open" : ""
                }`}
              >
                {chevronIcon}
              </span>
            </button>

            {userMenuOpen && (
              <div className="workspace-sidebar__user-menu">
                <div className="workspace-sidebar__user-info">
                  <span className="workspace-sidebar__user-email">
                    {user.email}
                  </span>
                </div>
                <div className="workspace-sidebar__menu-divider" />
                <button
                  className="workspace-sidebar__menu-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setShowProfileDialog(true);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{t("workspace.myProfile")}</span>
                </button>
                <button
                  className="workspace-sidebar__menu-item"
                  onClick={logout}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  <span>{t("workspace.logout")}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <h2 className="workspace-sidebar__title">
            <span>{t("workspace.title")}</span>
          </h2>
        )}
        <button
          className="workspace-sidebar__close"
          onClick={onClose}
          aria-label="Close"
        >
          {closeIcon}
        </button>
      </div>

      <div className="workspace-sidebar__content">
        {authLoading ? (
          <div className="workspace-sidebar__loading">
            <div className="workspace-sidebar__spinner" />
          </div>
        ) : !authAvailable ? (
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
              onClick={handleLoginClick}
            >
              {loginIcon}
              <span>{t("workspace.login")}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="workspace-sidebar__search">
              <span className="workspace-sidebar__search-icon">
                {searchIcon}
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="workspace-sidebar__search-input"
                placeholder={`${t("workspace.search")}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="workspace-sidebar__search-hint">⌘P</span>
            </div>

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
              ) : filteredScenes.length === 0 ? (
                <div className="workspace-sidebar__empty">
                  {searchQuery ? (
                    <p>{t("workspace.noResults")}</p>
                  ) : (
                    <>
                      <p>{t("workspace.noScenes")}</p>
                      <span className="workspace-sidebar__empty-hint">
                        {t("workspace.noScenesHint")}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="workspace-sidebar__scene-list">
                  {/* Private scenes section */}
                  {privateScenes.length > 0 && (
                    <div className="workspace-sidebar__section">
                      <h3 className="workspace-sidebar__section-title">
                        {t("workspace.privateScenes")}
                      </h3>
                      {privateScenes.map((scene) => (
                        <SceneCard
                          key={scene.id}
                          scene={scene}
                          isActive={scene.id === currentSceneId}
                          onOpen={() => onOpenScene(scene)}
                          onDelete={() => handleDeleteScene(scene.id)}
                          onRename={(newTitle) =>
                            handleRenameScene(scene.id, newTitle)
                          }
                          onDuplicate={() => handleDuplicateScene(scene.id)}
                          authorName={user?.name || undefined}
                        />
                      ))}
                    </div>
                  )}

                  {/* Public scenes section */}
                  {publicScenes.length > 0 && (
                    <div className="workspace-sidebar__section">
                      <h3 className="workspace-sidebar__section-title">
                        {t("workspace.publicScenes")}
                      </h3>
                      {publicScenes.map((scene) => (
                        <SceneCard
                          key={scene.id}
                          scene={scene}
                          isActive={scene.id === currentSceneId}
                          onOpen={() => onOpenScene(scene)}
                          onDelete={() => handleDeleteScene(scene.id)}
                          onRename={(newTitle) =>
                            handleRenameScene(scene.id, newTitle)
                          }
                          onDuplicate={() => handleDuplicateScene(scene.id)}
                          authorName={user?.name || undefined}
                        />
                      ))}
                    </div>
                  )}

                  {/* If all scenes are in one category, show them without section headers */}
                  {privateScenes.length === 0 &&
                    publicScenes.length === 0 &&
                    filteredScenes.length > 0 &&
                    filteredScenes.map((scene) => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        isActive={scene.id === currentSceneId}
                        onOpen={() => onOpenScene(scene)}
                        onDelete={() => handleDeleteScene(scene.id)}
                        onRename={(newTitle) =>
                          handleRenameScene(scene.id, newTitle)
                        }
                        onDuplicate={() => handleDuplicateScene(scene.id)}
                        authorName={user?.name || undefined}
                      />
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Login Dialog */}
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* User Profile Dialog */}
      <UserProfileDialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      />
    </div>
  );
};

export default WorkspaceSidebar;
