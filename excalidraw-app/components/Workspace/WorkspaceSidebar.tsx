import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtom, useAtomValue, useSetAtom } from "../../app-jotai";
import { useAuth } from "../../auth";
import {
  listWorkspaces,
  listCollections,
  listWorkspaceScenes,
  createCollection,
  updateCollection,
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  deleteCollection as deleteCollectionApi,
  type WorkspaceScene,
  type Workspace,
  type Collection,
} from "../../auth/workspaceApi";

import {
  navigateToDashboardAtom,
  navigateToCollectionAtom,
  navigateToCanvasAtom,
  navigateToProfileAtom,
  navigateToWorkspaceSettingsAtom,
  navigateToMembersAtom,
  navigateToTeamsCollectionsAtom,
  activeCollectionIdAtom,
  sidebarModeAtom,
  dashboardViewAtom,
} from "../Settings/settingsState";

import { EmojiPicker } from "../EmojiPicker";

import { BoardModeNav } from "./BoardModeNav";
import { FullModeNav } from "./FullModeNav";
import { LoginDialog } from "./LoginDialog";

import "./WorkspaceSidebar.scss";
import "./BoardModeNav.scss";
import "./FullModeNav.scss";

// Icons
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
  onWorkspaceChange?: (
    workspace: Workspace,
    privateCollectionId: string | null,
  ) => void;
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
    oidcConfigured,
    localAuthEnabled,
  } = useAuth();

  // Global state
  const sidebarMode = useAtomValue(sidebarModeAtom);
  const dashboardView = useAtomValue(dashboardViewAtom);
  const [activeCollectionId, setActiveCollectionId] = useAtom(
    activeCollectionIdAtom,
  );
  const navigateToDashboard = useSetAtom(navigateToDashboardAtom);
  const navigateToCollection = useSetAtom(navigateToCollectionAtom);
  const navigateToCanvas = useSetAtom(navigateToCanvasAtom);
  const navigateToProfile = useSetAtom(navigateToProfileAtom);
  const navigateToWorkspaceSettings = useSetAtom(
    navigateToWorkspaceSettingsAtom,
  );
  const navigateToMembers = useSetAtom(navigateToMembersAtom);
  const navigateToTeamsCollections = useSetAtom(navigateToTeamsCollectionsAtom);

  // Local state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const [scenes, setScenes] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState("");
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const authAvailable = oidcConfigured || localAuthEnabled;
  const isAdmin = currentWorkspace?.role === "ADMIN";

  // Find the private collection
  const privateCollection = useMemo(() => {
    return collections.find((c) => c.isPrivate);
  }, [collections]);

  // Get the active collection object
  const activeCollection = useMemo(() => {
    if (!activeCollectionId) {
      return privateCollection || null;
    }
    return collections.find((c) => c.id === activeCollectionId) || null;
  }, [activeCollectionId, collections, privateCollection]);

  // Load workspaces
  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

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
    if (!currentWorkspace) {
      return;
    }

    try {
      const data = await listCollections(currentWorkspace.id);
      setCollections(data);

      // Set default active collection to Private if not set
      if (!activeCollectionId) {
        const privateCol = data.find((c) => c.isPrivate);
        if (privateCol) {
          setActiveCollectionId(privateCol.id);
        }
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  }, [currentWorkspace, activeCollectionId, setActiveCollectionId]);

  // Load scenes for active collection
  const loadScenes = useCallback(async () => {
    if (!isAuthenticated || !currentWorkspace) {
      return;
    }

    setIsLoading(true);

    try {
      const collectionIdToUse = activeCollectionId || undefined;
      const data = await listWorkspaceScenes(
        currentWorkspace.id,
        collectionIdToUse,
      );
      setScenes(data);
    } catch (err) {
      console.error("Failed to load scenes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentWorkspace, activeCollectionId]);

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
    }
  }, [currentWorkspace, loadCollections]);

  // Notify parent when workspace or private collection changes
  useEffect(() => {
    if (currentWorkspace && onWorkspaceChange) {
      const privateCol = collections.find((c) => c.isPrivate);
      onWorkspaceChange(currentWorkspace, privateCol?.id || null);
    }
  }, [currentWorkspace, collections, onWorkspaceChange]);

  // Load scenes when active collection changes (only in board mode)
  useEffect(() => {
    if (isOpen && isAuthenticated && sidebarMode === "board") {
      loadScenes();
    }
  }, [isOpen, isAuthenticated, sidebarMode, loadScenes]);

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

  const handleCreateCollection = useCallback(async () => {
    if (!currentWorkspace || !newCollectionName.trim()) {
      return;
    }

    try {
      const collection = await createCollection(currentWorkspace.id, {
        name: newCollectionName.trim(),
        icon: newCollectionIcon,
      });
      setCollections((prev) => [...prev, collection]);
      setNewCollectionName("");
      setNewCollectionIcon("");
      setShowCreateCollection(false);
    } catch (err) {
      console.error("Failed to create collection:", err);
      alert("Failed to create collection");
    }
  }, [currentWorkspace, newCollectionName, newCollectionIcon]);

  const handleEditCollection = useCallback((collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionIcon(collection.icon || "");
  }, []);

  const handleSaveEditCollection = useCallback(async () => {
    if (!editingCollection || !newCollectionName.trim()) {
      return;
    }

    try {
      const updated = await updateCollection(editingCollection.id, {
        name: newCollectionName.trim(),
        icon: newCollectionIcon || undefined,
      });
      setCollections((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      setEditingCollection(null);
      setNewCollectionName("");
      setNewCollectionIcon("");
    } catch (err) {
      console.error("Failed to update collection:", err);
      alert("Failed to update collection");
    }
  }, [editingCollection, newCollectionName, newCollectionIcon]);

  const handleDeleteCollection = useCallback(
    async (collectionId: string) => {
      if (!confirm(t("workspace.confirmDeleteCollection"))) {
        return;
      }

      try {
        await deleteCollectionApi(collectionId);
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        if (activeCollectionId === collectionId) {
          // Reset to private collection
          setActiveCollectionId(privateCollection?.id || null);
        }
      } catch (err) {
        console.error("Failed to delete collection:", err);
        alert("Failed to delete collection");
      }
    },
    [activeCollectionId, privateCollection, setActiveCollectionId],
  );

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

  const handleDashboardClick = useCallback(() => {
    navigateToDashboard();
  }, [navigateToDashboard]);

  const handleBackToDashboard = useCallback(() => {
    navigateToDashboard();
  }, [navigateToDashboard]);

  const handleCollectionClick = useCallback(
    (collectionId: string) => {
      navigateToCollection(collectionId);
    },
    [navigateToCollection],
  );

  const handleSceneClick = useCallback(
    (scene: WorkspaceScene) => {
      onOpenScene(scene);
    },
    [onOpenScene],
  );

  // Filter scenes by search query
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) {
      return scenes;
    }
    const query = searchQuery.toLowerCase();
    return scenes.filter((scene) => scene.title.toLowerCase().includes(query));
  }, [scenes, searchQuery]);

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
                  <img
                    src={currentWorkspace.avatarUrl}
                    alt={currentWorkspace.name}
                  />
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
                      ws.id === currentWorkspace.id
                        ? "workspace-sidebar__menu-item--active"
                        : ""
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
          onClick={() => {
            navigateToCanvas();
            onClose();
          }}
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

            {/* Navigation - switches based on sidebar mode */}
            {sidebarMode === "board" ? (
              <BoardModeNav
                activeCollection={activeCollection}
                scenes={filteredScenes}
                currentSceneId={currentSceneId || null}
                isLoading={isLoading}
                onDashboardClick={handleDashboardClick}
                onBackClick={handleBackToDashboard}
                onSceneClick={handleSceneClick}
                onNewScene={onNewScene}
                onDeleteScene={handleDeleteScene}
                onRenameScene={handleRenameScene}
                onDuplicateScene={handleDuplicateScene}
                authorName={user?.name || undefined}
              />
            ) : (
              <FullModeNav
                collections={collections}
                activeCollectionId={activeCollectionId}
                currentView={dashboardView}
                isAdmin={isAdmin}
                onDashboardClick={handleDashboardClick}
                onProfileClick={() => navigateToProfile()}
                onSettingsClick={() => navigateToWorkspaceSettings()}
                onMembersClick={() => navigateToMembers()}
                onTeamsCollectionsClick={() => navigateToTeamsCollections()}
                onCollectionClick={handleCollectionClick}
                onCreateCollection={() => setShowCreateCollection(true)}
                onNewScene={onNewScene}
                onDeleteCollection={handleDeleteCollection}
                onEditCollection={handleEditCollection}
              />
            )}
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
              onClick={() => navigateToProfile()}
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
              <div className="workspace-sidebar__form-row">
                <div className="workspace-sidebar__form-group workspace-sidebar__form-group--icon">
                  <label>{t("workspace.icon")}</label>
                  <EmojiPicker
                    value={newCollectionIcon}
                    onSelect={setNewCollectionIcon}
                  />
                </div>
                <div className="workspace-sidebar__form-group workspace-sidebar__form-group--name">
                  <label>{t("workspace.collectionName")}</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder={t("workspace.collectionNamePlaceholder")}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        handleCreateCollection();
                      }
                    }}
                    onKeyUp={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
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

      {/* Edit Collection Dialog */}
      {editingCollection && (
        <div
          className="workspace-sidebar__dialog-overlay"
          onClick={() => {
            setEditingCollection(null);
            setNewCollectionName("");
            setNewCollectionIcon("");
          }}
        >
          <div
            className="workspace-sidebar__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("workspace.editCollection")}</h3>
            <div className="workspace-sidebar__dialog-content">
              <div className="workspace-sidebar__form-row">
                <div className="workspace-sidebar__form-group workspace-sidebar__form-group--icon">
                  <label>{t("workspace.icon")}</label>
                  <EmojiPicker
                    value={newCollectionIcon}
                    onSelect={setNewCollectionIcon}
                  />
                </div>
                <div className="workspace-sidebar__form-group workspace-sidebar__form-group--name">
                  <label>{t("workspace.collectionName")}</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder={t("workspace.collectionNamePlaceholder")}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        handleSaveEditCollection();
                      }
                    }}
                    onKeyUp={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="workspace-sidebar__dialog-actions">
              <button
                className="workspace-sidebar__dialog-cancel"
                onClick={() => {
                  setEditingCollection(null);
                  setNewCollectionName("");
                  setNewCollectionIcon("");
                }}
              >
                {t("workspace.cancel")}
              </button>
              <button
                className="workspace-sidebar__dialog-confirm"
                onClick={handleSaveEditCollection}
                disabled={!newCollectionName.trim()}
              >
                {t("settings.save")}
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
