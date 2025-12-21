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
  listWorkspaces,
  listCollections,
  listWorkspaceScenes,
  createCollection,
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  deleteCollection as deleteCollectionApi,
  updateCollection as updateCollectionApi,
  type WorkspaceScene,
  type Workspace,
  type Collection,
} from "../../auth/workspaceApi";

import { useSetAtom } from "jotai";

import { SceneCard } from "./SceneCard";
import { LoginDialog } from "./LoginDialog";
import { navigateToSettingsAtom } from "../Settings/settingsState";
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

const settingsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const usersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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

const dashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const moreIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const bellIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewScene: (collectionId?: string) => void;
  onOpenScene: (scene: WorkspaceScene) => void;
  currentSceneId?: string | null;
  onWorkspaceChange?: (workspace: Workspace, privateCollectionId: string | null) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  isOpen,
  onClose,
  onNewScene,
  onOpenScene,
  currentSceneId,
  onWorkspaceChange,
}) => {
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    login,
    logout,
    oidcConfigured,
    localAuthEnabled,
  } = useAuth();

  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [scenes, setScenes] = useState<WorkspaceScene[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const navigateToSettings = useSetAtom(navigateToSettingsAtom);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState("📁");
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [collectionMenuOpen, setCollectionMenuOpen] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const authAvailable = oidcConfigured || localAuthEnabled;
  const isAdmin = currentWorkspace?.role === "ADMIN";

  // Load workspaces
  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await listWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data[0]);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    }
  }, [isAuthenticated, currentWorkspace]);

  // Load collections for current workspace
  const loadCollections = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      const data = await listCollections(currentWorkspace.id);
      setCollections(data);
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  }, [currentWorkspace]);

  // Load scenes
  const loadScenes = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      let data: WorkspaceScene[];
      if (currentWorkspace) {
        // Resolve the actual collection ID
        // If selectedCollectionId is null, show all scenes (Dashboard)
        // Otherwise use the actual collection ID
        const collectionIdToUse = selectedCollectionId || undefined;
        
        data = await listWorkspaceScenes(
          currentWorkspace.id,
          collectionIdToUse,
        );
      } else {
        data = await listScenes();
      }
      setScenes(data);
    } catch (err) {
      console.error("Failed to load scenes:", err);
      setError("Failed to load scenes");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentWorkspace, selectedCollectionId]);

  // Initial load
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadWorkspaces();
    }
  }, [isOpen, isAuthenticated, loadWorkspaces]);

  // Load collections when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      loadCollections();
      setSelectedCollectionId(null);
    }
  }, [currentWorkspace, loadCollections]);

  // Notify parent when workspace or private collection changes
  useEffect(() => {
    if (currentWorkspace && onWorkspaceChange) {
      const privateCol = collections.find((c) => c.isPrivate);
      onWorkspaceChange(currentWorkspace, privateCol?.id || null);
    }
  }, [currentWorkspace, collections, onWorkspaceChange]);

  // Load scenes when collection changes
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadScenes();
    }
  }, [isOpen, isAuthenticated, loadScenes, selectedCollectionId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(event.target as Node)
      ) {
        setWorkspaceMenuOpen(false);
      }
    };

    if (workspaceMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [workspaceMenuOpen]);

  // Keyboard shortcut for search
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handlers
  const handleDeleteScene = useCallback(async (sceneId: string) => {
    if (!confirm(t("workspace.confirmDeleteScene"))) return;

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

  const handleCreateCollection = useCallback(async () => {
    if (!currentWorkspace || !newCollectionName.trim()) return;

    try {
      const collection = await createCollection(currentWorkspace.id, {
        name: newCollectionName.trim(),
        icon: newCollectionIcon,
      });
      setCollections((prev) => [...prev, collection]);
      setNewCollectionName("");
      setNewCollectionIcon("📁");
      setShowCreateCollection(false);
    } catch (err) {
      console.error("Failed to create collection:", err);
      alert("Failed to create collection");
    }
  }, [currentWorkspace, newCollectionName, newCollectionIcon]);

  const handleDeleteCollection = useCallback(async (collectionId: string) => {
    if (!confirm(t("workspace.confirmDeleteCollection"))) return;

    try {
      await deleteCollectionApi(collectionId);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      if (selectedCollectionId === collectionId) {
        setSelectedCollectionId(null);
      }
    } catch (err) {
      console.error("Failed to delete collection:", err);
      alert("Failed to delete collection");
    }
  }, [selectedCollectionId]);

  const handleLoginClick = () => {
    if (oidcConfigured && !localAuthEnabled) {
      login(window.location.pathname);
    } else {
      setShowLoginDialog(true);
    }
  };

  const handleLoginSuccess = () => {
    loadWorkspaces();
  };

  // Find the private collection (isPrivate: true)
  const privateCollection = useMemo(() => {
    return collections.find((c) => c.isPrivate);
  }, [collections]);

  // Filter scenes by search query
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) return scenes;
    const query = searchQuery.toLowerCase();
    return scenes.filter((scene) => scene.title.toLowerCase().includes(query));
  }, [scenes, searchQuery]);

  // Group scenes by collection
  const scenesByCollection = useMemo(() => {
    const grouped: Record<string, WorkspaceScene[]> = { uncategorized: [] };
    
    for (const scene of filteredScenes) {
      const key = scene.collectionId || "uncategorized";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(scene);
    }
    
    return grouped;
  }, [filteredScenes]);

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

  // Icon picker options
  const iconOptions = ["📁", "📂", "🗂️", "📋", "📌", "⭐", "💼", "🎯", "🚀", "💡", "🔒", "🌟"];

  return (
    <div
      className={`workspace-sidebar ${isOpen ? "workspace-sidebar--open" : ""}`}
    >
      {/* Workspace Header */}
      <div className="workspace-sidebar__header">
        {isAuthenticated && currentWorkspace ? (
          <div className="workspace-sidebar__workspace" ref={workspaceMenuRef}>
            <button
              className="workspace-sidebar__workspace-trigger"
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              aria-expanded={workspaceMenuOpen}
            >
              <div className="workspace-sidebar__workspace-avatar">
                {currentWorkspace.avatarUrl ? (
                  <img src={currentWorkspace.avatarUrl} alt={currentWorkspace.name} />
                ) : (
                  <span>{currentWorkspace.name[0].toUpperCase()}</span>
                )}
              </div>
              <span className="workspace-sidebar__workspace-name">
                {currentWorkspace.name}
              </span>
              <span
                className={`workspace-sidebar__chevron ${
                  workspaceMenuOpen ? "workspace-sidebar__chevron--open" : ""
                }`}
              >
                {chevronIcon}
              </span>
            </button>

            {workspaceMenuOpen && (
              <div className="workspace-sidebar__workspace-menu">
                <div className="workspace-sidebar__menu-section-title">
                  {t("workspace.switchWorkspace")}
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    className={`workspace-sidebar__menu-item ${
                      ws.id === currentWorkspace.id ? "workspace-sidebar__menu-item--active" : ""
                    }`}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setWorkspaceMenuOpen(false);
                    }}
                  >
                    <div className="workspace-sidebar__workspace-avatar workspace-sidebar__workspace-avatar--small">
                      {ws.avatarUrl ? (
                        <img src={ws.avatarUrl} alt={ws.name} />
                      ) : (
                        <span>{ws.name[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span>{ws.name}</span>
                    {ws.id === currentWorkspace.id && (
                      <span className="workspace-sidebar__check">✓</span>
                    )}
                  </button>
                ))}
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

      {/* Header Divider */}
      <div className="workspace-sidebar__divider" />

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
                placeholder={t("workspace.quickSearch")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              />
              <span className="workspace-sidebar__search-hint">⌘ + p</span>
            </div>

            {/* Navigation items - compact list style */}
            <nav className="workspace-sidebar__nav">
              <button
                className={`workspace-sidebar__nav-item ${
                  selectedCollectionId === null ? "workspace-sidebar__nav-item--active" : ""
                }`}
                onClick={() => setSelectedCollectionId(null)}
              >
                <span className="workspace-sidebar__nav-icon">{dashboardIcon}</span>
                <span className="workspace-sidebar__nav-label">{t("workspace.dashboard")}</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    className="workspace-sidebar__nav-item"
                    onClick={() => navigateToSettings("workspace")}
                  >
                    <span className="workspace-sidebar__nav-icon">{settingsIcon}</span>
                    <span className="workspace-sidebar__nav-label">{t("workspace.workspaceSettings")}</span>
                  </button>
                  <button
                    className="workspace-sidebar__nav-item"
                    onClick={() => navigateToSettings("members")}
                  >
                    <span className="workspace-sidebar__nav-icon">{usersIcon}</span>
                    <span className="workspace-sidebar__nav-label">{t("workspace.teamMembers")}</span>
                  </button>
                </>
              )}
            </nav>

            {/* Collections section */}
            <div className="workspace-sidebar__collections">
              <div className="workspace-sidebar__collections-header">
                <span className="workspace-sidebar__collections-title">
                  {t("workspace.collections")}
                </span>
                <button
                  className="workspace-sidebar__add-collection"
                  onClick={() => setShowCreateCollection(true)}
                  title={t("workspace.createCollection")}
                >
                  {plusIcon}
                </button>
              </div>

              <div className="workspace-sidebar__collections-list">
                {/* Private collection (always first, if exists) */}
                {privateCollection && (
                  <button
                    className={`workspace-sidebar__collection-item ${
                      selectedCollectionId === privateCollection.id ? "workspace-sidebar__collection-item--active" : ""
                    }`}
                    onClick={() => setSelectedCollectionId(privateCollection.id)}
                  >
                    <span className="workspace-sidebar__collection-icon">{lockIcon}</span>
                    <span className="workspace-sidebar__collection-name">
                      {t("workspace.private")}
                    </span>
                  </button>
                )}

                {/* Other collections */}
                {collections
                  .filter((c) => !c.isPrivate)
                  .map((collection) => (
                    <div
                      key={collection.id}
                      className={`workspace-sidebar__collection-row ${
                        selectedCollectionId === collection.id
                          ? "workspace-sidebar__collection-row--active"
                          : ""
                      }`}
                    >
                      <button
                        className="workspace-sidebar__collection-item"
                        onClick={() => setSelectedCollectionId(collection.id)}
                      >
                        <span className="workspace-sidebar__collection-icon">
                          {collection.icon || folderIcon}
                        </span>
                        <span className="workspace-sidebar__collection-name">
                          {collection.name}
                        </span>
                      </button>
                      {collection.canWrite && (
                        <div className="workspace-sidebar__collection-actions">
                          <button
                            className="workspace-sidebar__collection-more"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectionMenuOpen(
                                collectionMenuOpen === collection.id ? null : collection.id,
                              );
                            }}
                          >
                            {moreIcon}
                          </button>
                          {collectionMenuOpen === collection.id && (
                            <div className="workspace-sidebar__collection-menu">
                              <button
                                onClick={() => {
                                  onNewScene(collection.id);
                                  setCollectionMenuOpen(null);
                                }}
                              >
                                {t("workspace.createScene")}
                              </button>
                              <button
                                onClick={() => {
                                  // TODO: Edit collection
                                  setCollectionMenuOpen(null);
                                }}
                              >
                                {t("workspace.edit")}
                              </button>
                              {collection.isOwner && (
                                <button
                                  className="workspace-sidebar__menu-item--danger"
                                  onClick={() => {
                                    handleDeleteCollection(collection.id);
                                    setCollectionMenuOpen(null);
                                  }}
                                >
                                  {t("workspace.delete")}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Start drawing button */}
            <button
              className="workspace-sidebar__new-button"
              onClick={() => {
                // Use selected collection, or fall back to private collection
                const targetCollectionId = selectedCollectionId || privateCollection?.id;
                onNewScene(targetCollectionId);
              }}
            >
              {plusIcon}
              <span>{t("workspace.startDrawing")}</span>
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
                  {filteredScenes.map((scene) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      isActive={scene.id === currentSceneId}
                      onOpen={() => onOpenScene(scene)}
                      onDelete={
                        scene.canEdit !== false
                          ? () => handleDeleteScene(scene.id)
                          : undefined
                      }
                      onRename={
                        scene.canEdit !== false
                          ? (newTitle) => handleRenameScene(scene.id, newTitle)
                          : undefined
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

      {/* User footer - fixed at bottom with divider */}
      {isAuthenticated && user && (
        <>
          <div className="workspace-sidebar__divider" />
          <div className="workspace-sidebar__footer">
            <button
              className="workspace-sidebar__user-button"
              onClick={() => navigateToSettings("profile")}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || user.email}
                  className="workspace-sidebar__user-avatar"
                />
              ) : (
                <div className="workspace-sidebar__user-avatar workspace-sidebar__user-avatar--initials">
                  {getInitials(user.name, user.email)}
                </div>
              )}
              <span className="workspace-sidebar__user-name">
                {user.name || user.email}
              </span>
            </button>
            <button
              className="workspace-sidebar__notification-button"
              title={t("workspace.notifications")}
            >
              {bellIcon}
            </button>
          </div>
        </>
      )}

      {/* Create Collection Dialog */}
      {showCreateCollection && (
        <div
          className="workspace-sidebar__dialog-overlay"
          onClick={() => setShowCreateCollection(false)}
        >
          <div
            className="workspace-sidebar__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("workspace.createCollection")}</h3>
            <div className="workspace-sidebar__dialog-content">
              <div className="workspace-sidebar__form-group">
                <label>{t("workspace.icon")}</label>
                <div className="workspace-sidebar__icon-picker">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      className={`workspace-sidebar__icon-option ${
                        newCollectionIcon === icon
                          ? "workspace-sidebar__icon-option--selected"
                          : ""
                      }`}
                      onClick={() => setNewCollectionIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="workspace-sidebar__form-group">
                <label>{t("workspace.collectionName")}</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder={t("workspace.collectionNamePlaceholder")}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleCreateCollection();
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <div className="workspace-sidebar__dialog-actions">
              <button
                className="workspace-sidebar__dialog-cancel"
                onClick={() => setShowCreateCollection(false)}
              >
                {t("workspace.cancel")}
              </button>
              <button
                className="workspace-sidebar__dialog-confirm"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                {t("workspace.createCollection")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default WorkspaceSidebar;
