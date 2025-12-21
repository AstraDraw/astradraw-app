import React, { useMemo } from "react";

import { useAtomValue } from "../../app-jotai";

import {
  dashboardViewAtom,
  activeCollectionIdAtom,
} from "../Settings/settingsState";

import { DashboardView } from "./DashboardView";
import { CollectionView } from "./CollectionView";

import "./WorkspaceMainContent.scss";

import type {
  WorkspaceScene,
  Workspace,
  Collection,
} from "../../auth/workspaceApi";

interface WorkspaceMainContentProps {
  workspace: Workspace | null;
  collections: Collection[];
  onOpenScene: (scene: WorkspaceScene) => void;
  onNewScene: (collectionId?: string) => void;
}

export const WorkspaceMainContent: React.FC<WorkspaceMainContentProps> = ({
  workspace,
  collections,
  onOpenScene,
  onNewScene,
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

  return (
    <div className="workspace-main-content">
      {dashboardView === "home" ? (
        <DashboardView
          workspace={workspace}
          onOpenScene={onOpenScene}
          onNewScene={onNewScene}
        />
      ) : (
        <CollectionView
          workspace={workspace}
          collection={activeCollection}
          onOpenScene={onOpenScene}
          onNewScene={onNewScene}
        />
      )}
    </div>
  );
};

export default WorkspaceMainContent;
