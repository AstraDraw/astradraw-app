import React, { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";

import { useAuth } from "../../auth";
import { listWorkspaces, type Workspace } from "../../auth/workspaceApi";

import { SettingsLayout } from "./SettingsLayout";
import { ProfilePage } from "./ProfilePage";
import { WorkspaceSettingsPage } from "./WorkspaceSettingsPage";
import { MembersPage } from "./MembersPage";
import { TeamsCollectionsPage } from "./TeamsCollectionsPage";
import { settingsPageAtom } from "./settingsState";

export const SettingsView: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const currentPage = useAtomValue(settingsPageAtom);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );

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

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const isAdmin = currentWorkspace?.role === "ADMIN";

  const renderPage = () => {
    switch (currentPage) {
      case "profile":
        return <ProfilePage />;
      case "workspace":
        return (
          <WorkspaceSettingsPage
            workspace={currentWorkspace}
            onUpdateWorkspace={async (data) => {
              // TODO: Implement workspace update API call
              console.log("Update workspace:", data);
            }}
          />
        );
      case "members":
        return (
          <MembersPage
            workspaceId={currentWorkspace?.id || null}
            isAdmin={isAdmin}
          />
        );
      case "teams-collections":
        return (
          <TeamsCollectionsPage
            workspaceId={currentWorkspace?.id || null}
            isAdmin={isAdmin}
          />
        );
      default:
        return <ProfilePage />;
    }
  };

  return (
    <SettingsLayout
      workspaceName={currentWorkspace?.name}
      workspaceAvatarUrl={currentWorkspace?.avatarUrl}
      isAdmin={isAdmin}
    >
      {renderPage()}
    </SettingsLayout>
  );
};

export default SettingsView;

