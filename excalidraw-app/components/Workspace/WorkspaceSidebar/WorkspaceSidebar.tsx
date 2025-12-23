import React, { useEffect, useState, useCallback, useMemo } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtom, useAtomValue, useSetAtom } from "../../../app-jotai";
import { useAuth } from "../../../auth";

import { useWorkspaces } from "../../../hooks/useWorkspaces";
import { useCollections } from "../../../hooks/useCollections";
import { useSidebarScenes } from "../../../hooks/useSidebarScenes";
import { useSceneActions } from "../../../hooks/useSceneActions";

import {
  navigateToDashboardAtom,
  navigateToCollectionAtom,
  navigateToCanvasAtom,
  navigateToProfileAtom,
  navigateToPreferencesAtom,
  navigateToWorkspaceSettingsAtom,
  navigateToMembersAtom,
  navigateToTeamsCollectionsAtom,
  navigateToSceneAtom,
  sidebarModeAtom,
  dashboardViewAtom,
  currentWorkspaceSlugAtom,
  searchQueryAtom,
  workspaceSidebarOpenAtom,
  closeWorkspaceSidebarAtom,
} from "../../Settings/settingsState";

import { CopyMoveDialog } from "../CopyMoveDialog";
import { BoardModeNav } from "../BoardModeNav";
import { FullModeNav } from "../FullModeNav";
import { LoginDialog } from "../LoginDialog";

import "../WorkspaceSidebar.scss";
import "../BoardModeNav.scss";
import "../FullModeNav.scss";

import {
  CreateCollectionDialog,
  EditCollectionDialog,
  CreateWorkspaceDialog,
} from "./dialogs";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarHeader } from "./SidebarHeader";
import { loginIcon } from "./icons";

import type {
  Workspace,
  Collection,
  WorkspaceType,
} from "../../../auth/workspaceApi";

interface WorkspaceSidebarProps {
  onNewScene: (collectionId?: string) => void;
  currentSceneId?: string | null;
  onWorkspaceChange?: (
    workspace: Workspace,
    privateCollectionId: string | null,
  ) => void;
  onCurrentSceneTitleChange?: (newTitle: string) => void;
  workspace?: Workspace | null;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  onNewScene,
  currentSceneId,
  onWorkspaceChange,
  onCurrentSceneTitleChange,
  workspace: externalWorkspace,
}) => {
  // Sidebar open state from Jotai atom
  const isOpen = useAtomValue(workspaceSidebarOpenAtom);
  const closeSidebar = useSetAtom(closeWorkspaceSidebarAtom);
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
  const navigateToDashboard = useSetAtom(navigateToDashboardAtom);
  const navigateToCollection = useSetAtom(navigateToCollectionAtom);
  const navigateToCanvas = useSetAtom(navigateToCanvasAtom);
  const navigateToProfile = useSetAtom(navigateToProfileAtom);
  const navigateToPreferences = useSetAtom(navigateToPreferencesAtom);
  const navigateToWorkspaceSettings = useSetAtom(
    navigateToWorkspaceSettingsAtom,
  );
  const navigateToMembers = useSetAtom(navigateToMembersAtom);
  const navigateToTeamsCollections = useSetAtom(navigateToTeamsCollectionsAtom);
  const navigateToScene = useSetAtom(navigateToSceneAtom);
  const currentWorkspaceSlug = useAtomValue(currentWorkspaceSlugAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);

  const authAvailable = oidcConfigured || localAuthEnabled;

  // Workspaces hook
  const {
    currentWorkspace,
    loadWorkspaces,
    switchWorkspace,
    createWorkspace,
    generateSlug,
  } = useWorkspaces({
    isAuthenticated,
    externalWorkspace,
    onWorkspaceChange,
  });

  // Collections hook
  const {
    isLoading: isCollectionsLoading,
    activeCollectionId,
    privateCollection,
    activeCollection,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  } = useCollections({
    workspaceId: currentWorkspace?.id || null,
  });

  // Scenes hook (only enabled in board mode)
  const {
    scenes,
    isLoading: isScenesLoading,
    loadScenes,
    invalidateCache: invalidateScenesCache,
    updateScenesWithCache,
  } = useSidebarScenes({
    isAuthenticated,
    workspaceId: currentWorkspace?.id || null,
    activeCollectionId,
    enabled: isOpen && sidebarMode === "board",
  });

  // Scene actions hook
  const { deleteScene, renameScene, duplicateScene } = useSceneActions({
    updateScenes: updateScenesWithCache,
    onSceneRenamed: useCallback(
      (sceneId: string, newTitle: string) => {
        if (sceneId === currentSceneId && onCurrentSceneTitleChange) {
          onCurrentSceneTitleChange(newTitle);
        }
      },
      [currentSceneId, onCurrentSceneTitleChange],
    ),
  });

  const isAdmin = currentWorkspace?.role === "ADMIN";

  // Dialog states
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState("");
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] =
    useState<WorkspaceType>("SHARED");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [createWorkspaceError, setCreateWorkspaceError] = useState<
    string | null
  >(null);

  // Copy/Move dialog state
  const [copyMoveDialogOpen, setCopyMoveDialogOpen] = useState(false);
  const [copyMoveMode, setCopyMoveMode] = useState<"copy" | "move">("copy");
  const [copyMoveCollection, setCopyMoveCollection] =
    useState<Collection | null>(null);

  // Initial load
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadWorkspaces();
    }
  }, [isOpen, isAuthenticated, loadWorkspaces]);

  // Notify parent when workspace changes with private collection
  useEffect(() => {
    if (currentWorkspace && onWorkspaceChange && privateCollection) {
      onWorkspaceChange(currentWorkspace, privateCollection.id);
    }
  }, [currentWorkspace, privateCollection, onWorkspaceChange]);

  // Filter scenes by search query
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) {
      return scenes;
    }
    const query = searchQuery.toLowerCase();
    return scenes.filter((scene) => scene.title.toLowerCase().includes(query));
  }, [scenes, searchQuery]);

  // Handlers
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

  const handleClose = useCallback(() => {
    navigateToCanvas();
    closeSidebar();
  }, [navigateToCanvas, closeSidebar]);

  const handleCreateCollection = useCallback(async () => {
    const collection = await createCollection({
      name: newCollectionName,
      icon: newCollectionIcon,
    });
    if (collection) {
      setNewCollectionName("");
      setNewCollectionIcon("");
      setShowCreateCollection(false);
    }
  }, [createCollection, newCollectionName, newCollectionIcon]);

  const handleEditCollection = useCallback((collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionIcon(collection.icon || "");
  }, []);

  const handleSaveEditCollection = useCallback(async () => {
    if (!editingCollection) {
      return;
    }
    const updated = await updateCollection(editingCollection.id, {
      name: newCollectionName,
      icon: newCollectionIcon,
    });
    if (updated) {
      setEditingCollection(null);
      setNewCollectionName("");
      setNewCollectionIcon("");
    }
  }, [
    editingCollection,
    updateCollection,
    newCollectionName,
    newCollectionIcon,
  ]);

  const handleWorkspaceNameChange = useCallback(
    (name: string) => {
      setNewWorkspaceName(name);
      setNewWorkspaceSlug(generateSlug(name));
      setCreateWorkspaceError(null);
    },
    [generateSlug],
  );

  const handleCreateWorkspace = useCallback(async () => {
    if (!newWorkspaceName.trim() || !newWorkspaceSlug.trim()) {
      return;
    }

    setIsCreatingWorkspace(true);
    setCreateWorkspaceError(null);

    try {
      await createWorkspace({
        name: newWorkspaceName,
        slug: newWorkspaceSlug,
        type: newWorkspaceType,
      });
      setNewWorkspaceName("");
      setNewWorkspaceSlug("");
      setNewWorkspaceType("SHARED");
      setShowCreateWorkspace(false);
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
  }, [createWorkspace, newWorkspaceName, newWorkspaceSlug, newWorkspaceType]);

  const openCopyMoveDialog = useCallback(
    (collection: Collection, mode: "copy" | "move") => {
      setCopyMoveCollection(collection);
      setCopyMoveMode(mode);
      setCopyMoveDialogOpen(true);
    },
    [],
  );

  const handleCopyMoveSuccess = useCallback(() => {
    invalidateScenesCache();
    loadCollections();
    loadScenes(true);
  }, [invalidateScenesCache, loadCollections, loadScenes]);

  const handleSceneClick = useCallback(
    (scene: { id: string; title: string }) => {
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

  return (
    <div
      className={`workspace-sidebar ${isOpen ? "workspace-sidebar--open" : ""}`}
    >
      <SidebarHeader
        isAuthenticated={isAuthenticated}
        user={user}
        onSwitchWorkspace={switchWorkspace}
        onCreateWorkspaceClick={() => setShowCreateWorkspace(true)}
        onClose={handleClose}
      />

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
            <SidebarSearch
              value={searchQuery}
              onChange={setSearchQuery}
              isOpen={isOpen}
            />

            {sidebarMode === "board" ? (
              <BoardModeNav
                activeCollection={activeCollection}
                scenes={filteredScenes}
                currentSceneId={currentSceneId || null}
                isLoading={isScenesLoading}
                onDashboardClick={() => navigateToDashboard()}
                onBackClick={() => navigateToDashboard()}
                onSceneClick={handleSceneClick}
                onNewScene={onNewScene}
                onDeleteScene={deleteScene}
                onRenameScene={renameScene}
                onDuplicateScene={duplicateScene}
                authorName={user?.name || undefined}
              />
            ) : (
              <FullModeNav
                currentView={dashboardView}
                isAdmin={isAdmin}
                isCollectionsLoading={isCollectionsLoading}
                onDashboardClick={() => navigateToDashboard()}
                onProfileClick={() => navigateToProfile()}
                onPreferencesClick={() => navigateToPreferences()}
                onSettingsClick={() => navigateToWorkspaceSettings()}
                onMembersClick={() => navigateToMembers()}
                onTeamsCollectionsClick={() => navigateToTeamsCollections()}
                onCollectionClick={(collectionId, isPrivate) =>
                  navigateToCollection({ collectionId, isPrivate })
                }
                onCreateCollection={() => setShowCreateCollection(true)}
                onNewScene={onNewScene}
                onDeleteCollection={deleteCollection}
                onEditCollection={handleEditCollection}
                onCopyCollection={(c) => openCopyMoveDialog(c, "copy")}
                onMoveCollection={(c) => openCopyMoveDialog(c, "move")}
              />
            )}
          </>
        )}
      </div>

      {isAuthenticated && user && (
        <SidebarFooter user={user} onProfileClick={() => navigateToProfile()} />
      )}

      {/* Dialogs */}
      <CreateCollectionDialog
        isOpen={showCreateCollection}
        name={newCollectionName}
        icon={newCollectionIcon}
        onNameChange={setNewCollectionName}
        onIconChange={setNewCollectionIcon}
        onSubmit={handleCreateCollection}
        onClose={() => setShowCreateCollection(false)}
      />

      <EditCollectionDialog
        collection={editingCollection}
        name={newCollectionName}
        icon={newCollectionIcon}
        onNameChange={setNewCollectionName}
        onIconChange={setNewCollectionIcon}
        onSubmit={handleSaveEditCollection}
        onClose={() => {
          setEditingCollection(null);
          setNewCollectionName("");
          setNewCollectionIcon("");
        }}
      />

      <CreateWorkspaceDialog
        isOpen={showCreateWorkspace}
        name={newWorkspaceName}
        slug={newWorkspaceSlug}
        type={newWorkspaceType}
        error={createWorkspaceError}
        isCreating={isCreatingWorkspace}
        onNameChange={handleWorkspaceNameChange}
        onSlugChange={(slug) => {
          setNewWorkspaceSlug(slug);
          setCreateWorkspaceError(null);
        }}
        onTypeChange={setNewWorkspaceType}
        onSubmit={handleCreateWorkspace}
        onClose={() => {
          setShowCreateWorkspace(false);
          setNewWorkspaceName("");
          setNewWorkspaceSlug("");
          setNewWorkspaceType("SHARED");
          setCreateWorkspaceError(null);
        }}
      />

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
