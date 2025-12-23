import { useState, useCallback, useRef, useEffect } from "react";

import { useSetAtom } from "../app-jotai";
import { currentWorkspaceSlugAtom } from "../components/Settings/settingsState";
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
  setCurrentWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  generateSlug: (name: string) => string;
}

/**
 * Hook for workspace management - loading, switching, and creating workspaces.
 *
 * Extracted from WorkspaceSidebar.tsx to centralize workspace logic.
 */
export function useWorkspaces({
  isAuthenticated,
  externalWorkspace,
  onWorkspaceChange,
}: UseWorkspacesOptions): UseWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const setCurrentWorkspaceSlug = useSetAtom(currentWorkspaceSlugAtom);

  // Track last notified workspace to prevent duplicate onWorkspaceChange calls
  const lastNotifiedWorkspaceRef = useRef<string | null>(null);

  // Load workspaces
  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await listWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data[0]);
        setCurrentWorkspaceSlug(data[0].slug);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentWorkspace, setCurrentWorkspaceSlug]);

  // Switch workspace
  const switchWorkspace = useCallback(
    (workspace: Workspace) => {
      setCurrentWorkspace(workspace);
      setCurrentWorkspaceSlug(workspace.slug);
    },
    [setCurrentWorkspaceSlug],
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
      setCurrentWorkspaceSlug(workspace.slug);

      return workspace;
    },
    [loadWorkspaces, setCurrentWorkspaceSlug],
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
            ws.id === externalWorkspace.id ? externalWorkspace : ws,
          ),
        );
      }
    }
  }, [externalWorkspace, currentWorkspace]);

  // Notify parent when workspace changes (only once per workspace)
  useEffect(() => {
    if (
      currentWorkspace &&
      onWorkspaceChange &&
      lastNotifiedWorkspaceRef.current !== currentWorkspace.id
    ) {
      lastNotifiedWorkspaceRef.current = currentWorkspace.id;
      // Note: privateCollectionId will be passed by the component using collections hook
      onWorkspaceChange(currentWorkspace, null);
    }
  }, [currentWorkspace, onWorkspaceChange]);

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    loadWorkspaces,
    switchWorkspace,
    createWorkspace,
    setCurrentWorkspace,
    generateSlug,
  };
}
