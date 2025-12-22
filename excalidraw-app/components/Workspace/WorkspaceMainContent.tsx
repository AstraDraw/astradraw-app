import React, { useMemo } from "react";

import { useAtomValue } from "../../app-jotai";

import {
  dashboardViewAtom,
  activeCollectionIdAtom,
} from "../Settings/settingsState";

import { ProfilePage } from "../Settings/ProfilePage";
import { PreferencesPage } from "../Settings/PreferencesPage";
import { WorkspaceSettingsPage } from "../Settings/WorkspaceSettingsPage";
import { MembersPage } from "../Settings/MembersPage";
import { TeamsCollectionsPage } from "../Settings/TeamsCollectionsPage";

import { DashboardView } from "./DashboardView";
import { CollectionView } from "./CollectionView";

import "./WorkspaceMainContent.scss";

import type { Workspace, Collection } from "../../auth/workspaceApi";
import type { Theme } from "@excalidraw/element/types";

interface WorkspaceMainContentProps {
  workspace: Workspace | null;
  collections: Collection[];
  isAdmin: boolean;
  onNewScene: (collectionId?: string) => void;
  onUpdateWorkspace?: (data: {
    name?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  theme: Theme | "system";
  setTheme: (theme: Theme | "system") => void;
}

export const WorkspaceMainContent: React.FC<WorkspaceMainContentProps> = ({
  workspace,
  collections,
  isAdmin,
  onNewScene,
  onUpdateWorkspace,
  theme,
  setTheme,
}) => {
  const dashboardView = useAtomValue(dashboardViewAtom);
  const activeCollectionId = useAtomValue(activeCollectionIdAtom);

  // Find the active collection
  const activeCollection = useMemo(() => {
    if (!activeCollectionId) {
      return null;
    }
    return collections.find((c) => c.id === activeCollectionId) || null;
  }, [activeCollectionId, collections]);

  const renderContent = () => {
    switch (dashboardView) {
      case "home":
        return <DashboardView workspace={workspace} onNewScene={onNewScene} />;
      case "collection":
        return (
          <CollectionView
            workspace={workspace}
            collection={activeCollection}
            onNewScene={onNewScene}
          />
        );
      case "profile":
        return <ProfilePage />;
      case "preferences":
        return <PreferencesPage theme={theme} setTheme={setTheme} />;
      case "workspace":
        return (
          <WorkspaceSettingsPage
            workspace={workspace}
            onUpdateWorkspace={onUpdateWorkspace}
          />
        );
      case "members":
        return (
          <MembersPage workspaceId={workspace?.id || null} isAdmin={isAdmin} />
        );
      case "teams-collections":
        return (
          <TeamsCollectionsPage
            workspaceId={workspace?.id || null}
            isAdmin={isAdmin}
          />
        );
      default:
        return <DashboardView workspace={workspace} onNewScene={onNewScene} />;
    }
  };

  return <div className="workspace-main-content">{renderContent()}</div>;
};

export default WorkspaceMainContent;
