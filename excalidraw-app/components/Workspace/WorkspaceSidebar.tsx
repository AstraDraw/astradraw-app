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
  createWorkspace,
  updateCollection,
  deleteScene as deleteSceneApi,
  updateScene as updateSceneApi,
  duplicateScene as duplicateSceneApi,
  deleteCollection as deleteCollectionApi,
  type WorkspaceScene,
  type Workspace,
  type Collection,
  type WorkspaceType,
} from "../../auth/workspaceApi";

import {
  navigateToDashboardAtom,
  navigateToCollectionAtom,
  navigateToCanvasAtom,
  navigateToProfileAtom,
  navigateToWorkspaceSettingsAtom,
  navigateToMembersAtom,
  navigateToTeamsCollectionsAtom,
  navigateToSceneAtom,
  activeCollectionIdAtom,
  sidebarModeAtom,
  dashboardViewAtom,
  triggerCollectionsRefreshAtom,
  triggerScenesRefreshAtom,
  scenesRefreshAtom,
  currentWorkspaceSlugAtom,
} from "../Settings/settingsState";

import { EmojiPicker } from "../EmojiPicker";

import { CopyMoveDialog } from "./CopyMoveDialog";

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
  const navigateToScene = useSetAtom(navigateToSceneAtom);
  const triggerCollectionsRefresh = useSetAtom(triggerCollectionsRefreshAtom);
  const triggerScenesRefresh = useSetAtom(triggerScenesRefreshAtom);
  // Subscribe to scenes refresh trigger from other components (e.g., App.tsx)
  const scenesRefresh = useAtomValue(scenesRefreshAtom);
  // Sync workspace slug with URL router
  const currentWorkspaceSlug = useAtomValue(currentWorkspaceSlugAtom);
  const setCurrentWorkspaceSlug = useSetAtom(currentWorkspaceSlugAtom);

  // Local state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const [copyMoveDialogOpen, setCopyMoveDialogOpen] = useState(false);
  const [copyMoveMode, setCopyMoveMode] = useState<"copy" | "move">("copy");
  const [copyMoveCollection, setCopyMoveCollection] =
    useState<Collection | null>(null);
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
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] =
    useState<WorkspaceType>("SHARED");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [createWorkspaceError, setCreateWorkspaceError] = useState<
    string | null
  >(null);

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

  // Track if we've set the default collection to prevent infinite loops
  const hasSetDefaultCollectionRef = useRef(false);

  // Track last notified workspace to prevent duplicate onWorkspaceChange calls
  const lastNotifiedWorkspaceRef = useRef<string | null>(null);

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
        // Sync workspace slug with URL router
        setCurrentWorkspaceSlug(data[0].slug);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    }
  }, [isAuthenticated, currentWorkspace, setCurrentWorkspaceSlug]);

  // Load collections for current workspace
  const loadCollections = useCallback(async () => {
    if (!currentWorkspace) {
      return;
    }

    try {
      const data = await listCollections(currentWorkspace.id);
      setCollections(data);
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  }, [currentWorkspace]);

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

  // Set default active collection to Private when collections are loaded
  // This is separate from loadCollections to avoid infinite loop
  useEffect(() => {
    if (
      collections.length > 0 &&
      !activeCollectionId &&
      !hasSetDefaultCollectionRef.current
    ) {
      const privateCol = collections.find((c) => c.isPrivate);
      if (privateCol) {
        hasSetDefaultCollectionRef.current = true;
        setActiveCollectionId(privateCol.id);
      }
    }
  }, [collections, activeCollectionId, setActiveCollectionId]);

  // Reset the default collection flag when workspace changes
  useEffect(() => {
    hasSetDefaultCollectionRef.current = false;
  }, [currentWorkspace]);

  // Notify parent when workspace changes (only once per workspace)
  // This prevents infinite loops when App.tsx reloads collections in response
  useEffect(() => {
    if (
      currentWorkspace &&
      onWorkspaceChange &&
      lastNotifiedWorkspaceRef.current !== currentWorkspace.id
    ) {
      lastNotifiedWorkspaceRef.current = currentWorkspace.id;
      const privateCol = collections.find((c) => c.isPrivate);
      onWorkspaceChange(currentWorkspace, privateCol?.id || null);
    }
  }, [currentWorkspace, collections, onWorkspaceChange]);

  // Load scenes when active collection changes (only in board mode)
  // Also reload when scenesRefresh changes (triggered by other components)
  useEffect(() => {
    if (isOpen && isAuthenticated && sidebarMode === "board") {
      loadScenes();
    }
  }, [isOpen, isAuthenticated, sidebarMode, loadScenes, scenesRefresh]);

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
  const handleDeleteScene = useCallback(
    async (sceneId: string) => {
      if (!confirm(t("workspace.confirmDeleteScene"))) {
        return;
      }

      try {
        await deleteSceneApi(sceneId);
        setScenes((prev) => prev.filter((s) => s.id !== sceneId));
        // Trigger refresh for other components (e.g., DashboardView, CollectionView)
        triggerScenesRefresh();
      } catch (err) {
        console.error("Failed to delete scene:", err);
        alert("Failed to delete scene");
      }
    },
    [triggerScenesRefresh],
  );

  const handleRenameScene = useCallback(
    async (sceneId: string, newTitle: string) => {
      try {
        const updatedScene = await updateSceneApi(sceneId, { title: newTitle });
        setScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? updatedScene : s)),
        );
        // Trigger refresh for other components
        triggerScenesRefresh();
      } catch (err) {
        console.error("Failed to rename scene:", err);
        alert("Failed to rename scene");
      }
    },
    [triggerScenesRefresh],
  );

  const handleDuplicateScene = useCallback(
    async (sceneId: string) => {
      try {
        const newScene = await duplicateSceneApi(sceneId);
        setScenes((prev) => [newScene, ...prev]);
        // Trigger refresh for other components
        triggerScenesRefresh();
      } catch (err) {
        console.error("Failed to duplicate scene:", err);
        alert("Failed to duplicate scene");
      }
    },
    [triggerScenesRefresh],
  );

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
      // Trigger refresh for other components (e.g., TeamsCollectionsPage)
      triggerCollectionsRefresh();
    } catch (err) {
      console.error("Failed to create collection:", err);
      alert("Failed to create collection");
    }
  }, [
    currentWorkspace,
    newCollectionName,
    newCollectionIcon,
    triggerCollectionsRefresh,
  ]);

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
      // Trigger refresh for other components (e.g., TeamsCollectionsPage)
      triggerCollectionsRefresh();
    } catch (err) {
      console.error("Failed to update collection:", err);
      alert("Failed to update collection");
    }
  }, [
    editingCollection,
    newCollectionName,
    newCollectionIcon,
    triggerCollectionsRefresh,
  ]);

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
        // Trigger refresh for other components (e.g., TeamsCollectionsPage)
        triggerCollectionsRefresh();
      } catch (err) {
        console.error("Failed to delete collection:", err);
        alert("Failed to delete collection");
      }
    },
    [
      activeCollectionId,
      privateCollection,
      setActiveCollectionId,
      triggerCollectionsRefresh,
    ],
  );

  const openCopyMoveDialog = useCallback(
    (collection: Collection, mode: "copy" | "move") => {
      setCopyMoveCollection(collection);
      setCopyMoveMode(mode);
      setCopyMoveDialogOpen(true);
    },
    [],
  );

  const handleCopyCollection = useCallback(
    (collection: Collection) => {
      openCopyMoveDialog(collection, "copy");
    },
    [openCopyMoveDialog],
  );

  const handleMoveCollection = useCallback(
    (collection: Collection) => {
      openCopyMoveDialog(collection, "move");
    },
    [openCopyMoveDialog],
  );

  const handleCopyMoveSuccess = useCallback(() => {
    loadCollections();
    loadScenes();
  }, [loadCollections, loadScenes]);

  // Generate slug from workspace name
  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
  }, []);

  // Auto-generate slug when name changes
  const handleWorkspaceNameChange = useCallback(
    (name: string) => {
      setNewWorkspaceName(name);
      setNewWorkspaceSlug(generateSlug(name));
      setCreateWorkspaceError(null);
    },
    [generateSlug],
  );

  // Handle create workspace
  const handleCreateWorkspace = useCallback(async () => {
    if (!newWorkspaceName.trim() || !newWorkspaceSlug.trim()) {
      return;
    }

    setIsCreatingWorkspace(true);
    setCreateWorkspaceError(null);

    try {
      const workspace = await createWorkspace({
        name: newWorkspaceName.trim(),
        slug: newWorkspaceSlug.trim(),
        type: newWorkspaceType,
      });

      // Reset form
      setNewWorkspaceName("");
      setNewWorkspaceSlug("");
      setNewWorkspaceType("SHARED");
      setShowCreateWorkspace(false);

      // Reload workspaces and switch to new one
      await loadWorkspaces();
      setCurrentWorkspace(workspace);
      setCurrentWorkspaceSlug(workspace.slug);
      setWorkspaceMenuOpen(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes("already taken")) {
        setCreateWorkspaceError(t("workspace.workspaceSlugTaken"));
      } else {
        setCreateWorkspaceError(
          err instanceof Error ? err.message : "Failed to create workspace",
        );
      }
    } finally {
      setIsCreatingWorkspace(false);
    }
  }, [
    newWorkspaceName,
    newWorkspaceSlug,
    newWorkspaceType,
    loadWorkspaces,
    setCurrentWorkspaceSlug,
  ]);

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
    (collectionId: string, isPrivate?: boolean) => {
      navigateToCollection({ collectionId, isPrivate });
    },
    [navigateToCollection],
  );

  // Navigate to scene via URL - this triggers the popstate handler which loads the scene
  const handleSceneClick = useCallback(
    (scene: WorkspaceScene) => {
      if (currentWorkspaceSlug) {
        navigateToScene({
          sceneId: scene.id,
          title: scene.title,
          workspaceSlug: currentWorkspaceSlug,
        });
      }
    },
    [currentWorkspaceSlug, navigateToScene],
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
                      setCurrentWorkspaceSlug(ws.slug);
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
                {user?.isSuperAdmin && (
                  <>
                    <div className="workspace-sidebar__menu-divider" />
                    <button
                      className="workspace-sidebar__menu-item workspace-sidebar__menu-item--create"
                      onClick={() => {
                        setShowCreateWorkspace(true);
                        setWorkspaceMenuOpen(false);
                      }}
                    >
                      <span className="workspace-sidebar__menu-item-icon">
                        +
                      </span>
                      <span>{t("workspace.createWorkspace")}</span>
                    </button>
                  </>
                )}
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
                onCopyCollection={handleCopyCollection}
                onMoveCollection={handleMoveCollection}
              />
            )}

            <div className="workspace-sidebar__anonymous">
              <button
                className="workspace-sidebar__anonymous-button"
                onClick={() => {
                  window.location.href = "/?mode=anonymous";
                }}
              >
                {t("workspace.startAnonymousBoard")}
              </button>
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

      {/* Create Workspace Dialog */}
      {showCreateWorkspace && (
        <div
          className="workspace-sidebar__dialog-overlay"
          onClick={() => {
            setShowCreateWorkspace(false);
            setNewWorkspaceName("");
            setNewWorkspaceSlug("");
            setNewWorkspaceType("SHARED");
            setCreateWorkspaceError(null);
          }}
        >
          <div
            className="workspace-sidebar__dialog workspace-sidebar__dialog--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("workspace.createWorkspaceTitle")}</h3>
            <div className="workspace-sidebar__dialog-content">
              <div className="workspace-sidebar__form-group">
                <label>{t("workspace.workspaceNameLabel")}</label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                  placeholder={t("workspace.workspaceNamePlaceholder")}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !isCreatingWorkspace) {
                      handleCreateWorkspace();
                    }
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
              <div className="workspace-sidebar__form-group">
                <label>{t("workspace.workspaceSlugLabel")}</label>
                <input
                  type="text"
                  value={newWorkspaceSlug}
                  onChange={(e) => {
                    setNewWorkspaceSlug(e.target.value);
                    setCreateWorkspaceError(null);
                  }}
                  placeholder="my-workspace"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !isCreatingWorkspace) {
                      handleCreateWorkspace();
                    }
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                />
                <span className="workspace-sidebar__form-hint">
                  {t("workspace.workspaceSlugHint")}
                </span>
              </div>
              <div className="workspace-sidebar__form-group">
                <label>{t("workspace.workspaceTypeLabel")}</label>
                <div className="workspace-sidebar__type-selector">
                  <button
                    type="button"
                    className={`workspace-sidebar__type-option ${
                      newWorkspaceType === "PERSONAL"
                        ? "workspace-sidebar__type-option--active"
                        : ""
                    }`}
                    onClick={() => setNewWorkspaceType("PERSONAL")}
                  >
                    {t("workspace.workspaceTypePersonal")}
                  </button>
                  <button
                    type="button"
                    className={`workspace-sidebar__type-option ${
                      newWorkspaceType === "SHARED"
                        ? "workspace-sidebar__type-option--active"
                        : ""
                    }`}
                    onClick={() => setNewWorkspaceType("SHARED")}
                  >
                    {t("workspace.workspaceTypeShared")}
                  </button>
                </div>
              </div>
              {createWorkspaceError && (
                <div className="workspace-sidebar__form-error">
                  {createWorkspaceError}
                </div>
              )}
            </div>
            <div className="workspace-sidebar__dialog-actions">
              <button
                className="workspace-sidebar__dialog-cancel"
                onClick={() => {
                  setShowCreateWorkspace(false);
                  setNewWorkspaceName("");
                  setNewWorkspaceSlug("");
                  setNewWorkspaceType("SHARED");
                  setCreateWorkspaceError(null);
                }}
              >
                {t("workspace.cancel")}
              </button>
              <button
                className="workspace-sidebar__dialog-confirm"
                onClick={handleCreateWorkspace}
                disabled={
                  !newWorkspaceName.trim() ||
                  !newWorkspaceSlug.trim() ||
                  isCreatingWorkspace
                }
              >
                {isCreatingWorkspace
                  ? t("workspace.creating")
                  : t("workspace.createWorkspace")}
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

      <CopyMoveDialog
        isOpen={copyMoveDialogOpen && !!copyMoveCollection}
        onClose={() => {
          setCopyMoveDialogOpen(false);
          setCopyMoveCollection(null);
        }}
        collectionId={copyMoveCollection?.id || ""}
        collectionName={copyMoveCollection?.name || ""}
        mode={copyMoveMode}
        onSuccess={handleCopyMoveSuccess}
      />
    </div>
  );
};

export default WorkspaceSidebar;
