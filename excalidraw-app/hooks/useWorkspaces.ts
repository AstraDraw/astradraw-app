import { useCallback, useRef, useEffect, useState } from "react";

import { useAtom, useSetAtom } from "../app-jotai";
import {
  currentWorkspaceSlugAtom,
  workspacesAtom,
  currentWorkspaceAtom,
  type WorkspaceData,
} from "../components/Settings/settingsState";
import {
  listWorkspaces,
  createWorkspace as createWorkspaceApi,
  type Workspace,
  type WorkspaceType,
} from "../auth/workspaceApi";

interface CreateWorkspaceData {
  name: string;
  slug: string;
  type: WorkspaceType;
}

interface UseWorkspacesOptions {
  isAuthenticated: boolean;
  /** External workspace passed from parent (e.g., when updated in settings) */
  externalWorkspace?: Workspace | null;
  /** Callback when workspace changes */
  onWorkspaceChange?: (
    workspace: Workspace,
    privateCollectionId: string | null,
  ) => void;
}

interface UseWorkspacesResult {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  loadWorkspaces: () => Promise<void>;
  switchWorkspace: (workspace: Workspace) => void;
  createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  generateSlug: (name: string) => string;
}

/**
 * Hook for workspace management - loading, switching, and creating workspaces.
 *
 * Uses Jotai atoms for shared state:
 * - workspacesAtom: List of all workspaces
 * - currentWorkspaceAtom: Currently active workspace
 * - currentWorkspaceSlugAtom: Slug for URL routing
 */
export function useWorkspaces({
  isAuthenticated,
  externalWorkspace,
  onWorkspaceChange,
}: UseWorkspacesOptions): UseWorkspacesResult {
  // Use Jotai atoms for shared state
  const [workspaces, setWorkspaces] = useAtom(workspacesAtom);
  const [currentWorkspace, setCurrentWorkspaceAtom] =
    useAtom(currentWorkspaceAtom);
  const setCurrentWorkspaceSlug = useSetAtom(currentWorkspaceSlugAtom);

  // Local loading state
  const [isLoading, setIsLoading] = useState(false);

  // Track last notified workspace to prevent duplicate onWorkspaceChange calls
  const lastNotifiedWorkspaceRef = useRef<string | null>(null);

  // Helper to set current workspace (updates both atom and slug)
  const setCurrentWorkspace = useCallback(
    (workspace: Workspace | WorkspaceData | null) => {
      setCurrentWorkspaceAtom(workspace as WorkspaceData | null);
      if (workspace) {
        setCurrentWorkspaceSlug(workspace.slug);
      }
    },
    [setCurrentWorkspaceAtom, setCurrentWorkspaceSlug],
  );

  // Load workspaces
  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await listWorkspaces();
      setWorkspaces(data as WorkspaceData[]);
      if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data[0]);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentWorkspace, setWorkspaces, setCurrentWorkspace]);

  // Switch workspace
  const switchWorkspace = useCallback(
    (workspace: Workspace) => {
      setCurrentWorkspace(workspace);
    },
    [setCurrentWorkspace],
  );

  // Create workspace
  const createWorkspace = useCallback(
    async (data: CreateWorkspaceData): Promise<Workspace> => {
      const workspace = await createWorkspaceApi({
        name: data.name.trim(),
        slug: data.slug.trim(),
        type: data.type,
      });

      // Reload workspaces and switch to new one
      await loadWorkspaces();
      setCurrentWorkspace(workspace);

      return workspace;
    },
    [loadWorkspaces, setCurrentWorkspace],
  );

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

  // Sync with external workspace updates (e.g., when avatar/name is changed in settings)
  useEffect(() => {
    if (externalWorkspace && currentWorkspace) {
      if (
        externalWorkspace.id === currentWorkspace.id &&
        (externalWorkspace.avatarUrl !== currentWorkspace.avatarUrl ||
          externalWorkspace.name !== currentWorkspace.name)
      ) {
        setCurrentWorkspace(externalWorkspace);
        setWorkspaces((prev) =>
          prev.map((ws) =>
            ws.id === externalWorkspace.id
              ? (externalWorkspace as WorkspaceData)
              : ws,
          ),
        );
      }
    }
  }, [externalWorkspace, currentWorkspace, setCurrentWorkspace, setWorkspaces]);

  // Notify parent when workspace changes (only once per workspace)
  useEffect(() => {
    if (
      currentWorkspace &&
      onWorkspaceChange &&
      lastNotifiedWorkspaceRef.current !== currentWorkspace.id
    ) {
      lastNotifiedWorkspaceRef.current = currentWorkspace.id;
      // Note: privateCollectionId will be passed by the component using collections hook
      onWorkspaceChange(currentWorkspace as Workspace, null);
    }
  }, [currentWorkspace, onWorkspaceChange]);

  return {
    workspaces: workspaces as Workspace[],
    currentWorkspace: currentWorkspace as Workspace | null,
    isLoading,
    loadWorkspaces,
    switchWorkspace,
    createWorkspace,
    setCurrentWorkspace,
    generateSlug,
  };
}
