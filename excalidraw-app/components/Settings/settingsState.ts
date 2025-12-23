import { atom } from "../../app-jotai";
import {
  buildDashboardUrl,
  buildCollectionUrl,
  buildPrivateUrl,
  buildSceneUrl,
  buildSettingsUrl,
  buildMembersUrl,
  buildTeamsUrl,
  buildProfileUrl,
  buildPreferencesUrl,
  navigateTo,
} from "../../router";

/**
 * App mode - determines what the main content area shows
 * - "canvas": Drawing board with Excalidraw
 * - "dashboard": Dashboard views (home, collection, settings pages)
 */
export type AppMode = "canvas" | "dashboard";

/**
 * Sidebar display mode (derived from appMode)
 * - "board": Minimal sidebar for canvas mode
 * - "full": Full navigation for dashboard mode
 */
export type SidebarMode = "board" | "full";

/**
 * Dashboard view - what's shown in the main content area when in dashboard mode
 * - "home": Dashboard home page with recently modified/visited
 * - "collection": Collection view showing scenes from a specific collection
 * - "profile": User profile settings
 * - "preferences": User preferences (theme, etc.)
 * - "workspace": Workspace settings (admin only)
 * - "members": Team members management (admin only)
 * - "teams-collections": Teams & collections management (admin only)
 */
export type DashboardView =
  | "home"
  | "collection"
  | "profile"
  | "preferences"
  | "workspace"
  | "members"
  | "teams-collections";

/**
 * Current app mode atom
 */
export const appModeAtom = atom<AppMode>("canvas");

/**
 * Active collection ID - persists across mode switches
 * This is the collection currently being viewed/worked in
 */
export const activeCollectionIdAtom = atom<string | null>(null);

/**
 * Dashboard view atom - which view is shown in dashboard mode
 */
export const dashboardViewAtom = atom<DashboardView>("home");

/**
 * Current workspace slug - tracks the active workspace for URL routing
 */
export const currentWorkspaceSlugAtom = atom<string | null>(null);

/**
 * Current scene ID - tracks the active scene being edited
 */
export const currentSceneIdAtom = atom<string | null>(null);

/**
 * Current scene title - for display purposes
 */
export const currentSceneTitleAtom = atom<string>("Untitled");

/**
 * Flag to indicate if current scene is in auto-collaboration mode
 * (shared collection scene where collaboration can't be stopped)
 */
export const isAutoCollabSceneAtom = atom<boolean>(false);

/**
 * Flag to indicate if a collection is private (for URL routing)
 */
export const isPrivateCollectionAtom = atom<boolean>(false);

/**
 * Derived atom to get the current sidebar mode based on app mode
 */
export const sidebarModeAtom = atom<SidebarMode>((get) => {
  const appMode = get(appModeAtom);
  return appMode === "canvas" ? "board" : "full";
});

/**
 * localStorage key for workspace sidebar preference
 */
const WORKSPACE_SIDEBAR_PREF_KEY = "astradraw_workspace_sidebar_open";

/**
 * Workspace sidebar open state
 * Initialized from localStorage, persists across sessions
 */
export const workspaceSidebarOpenAtom = atom<boolean>(
  typeof window !== "undefined"
    ? localStorage.getItem(WORKSPACE_SIDEBAR_PREF_KEY) === "true"
    : false,
);

/**
 * Action atom to toggle workspace sidebar
 */
export const toggleWorkspaceSidebarAtom = atom(null, (get, set) => {
  const newValue = !get(workspaceSidebarOpenAtom);
  set(workspaceSidebarOpenAtom, newValue);
  // Persist to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(WORKSPACE_SIDEBAR_PREF_KEY, String(newValue));
  }
});

/**
 * Action atom to open workspace sidebar
 */
export const openWorkspaceSidebarAtom = atom(null, (get, set) => {
  set(workspaceSidebarOpenAtom, true);
  if (typeof window !== "undefined") {
    localStorage.setItem(WORKSPACE_SIDEBAR_PREF_KEY, "true");
  }
});

/**
 * Action atom to close workspace sidebar
 */
export const closeWorkspaceSidebarAtom = atom(null, (get, set) => {
  set(workspaceSidebarOpenAtom, false);
  if (typeof window !== "undefined") {
    localStorage.setItem(WORKSPACE_SIDEBAR_PREF_KEY, "false");
  }
});

/**
 * Atom for navigating to dashboard home
 * Updates URL to /workspace/{slug}/dashboard
 * Auto-opens sidebar when navigating to dashboard
 */
export const navigateToDashboardAtom = atom(null, (get, set) => {
  const workspaceSlug = get(currentWorkspaceSlugAtom);
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "home");
  set(workspaceSidebarOpenAtom, true);

  // Update URL if we have a workspace
  if (workspaceSlug) {
    navigateTo(buildDashboardUrl(workspaceSlug));
  }
});

/**
 * Atom for navigating to a specific collection view
 * Updates URL to /workspace/{slug}/collection/{id} or /workspace/{slug}/private
 * Auto-opens sidebar when navigating to collection
 */
export const navigateToCollectionAtom = atom(
  null,
  (
    get,
    set,
    params: { collectionId: string; isPrivate?: boolean } | string,
  ) => {
    // Support both old string API and new object API
    const collectionId =
      typeof params === "string" ? params : params.collectionId;
    const isPrivate = typeof params === "string" ? false : params.isPrivate;

    const workspaceSlug = get(currentWorkspaceSlugAtom);
    set(activeCollectionIdAtom, collectionId);
    set(isPrivateCollectionAtom, isPrivate || false);
    set(appModeAtom, "dashboard");
    set(dashboardViewAtom, "collection");
    set(workspaceSidebarOpenAtom, true);

    // Update URL if we have a workspace
    if (workspaceSlug) {
      if (isPrivate) {
        navigateTo(buildPrivateUrl(workspaceSlug));
      } else {
        navigateTo(buildCollectionUrl(workspaceSlug, collectionId));
      }
    }
  },
);

/**
 * Atom for navigating back to canvas mode
 * Note: This only changes app mode, URL is set by scene loading
 */
export const navigateToCanvasAtom = atom(null, (get, set) => {
  set(appModeAtom, "canvas");
});

/**
 * Atom for navigating to a specific scene
 * Updates URL to /workspace/{slug}/scene/{id}
 */
export const navigateToSceneAtom = atom(
  null,
  (
    get,
    set,
    params: { sceneId: string; title?: string; workspaceSlug?: string },
  ) => {
    const slug = params.workspaceSlug || get(currentWorkspaceSlugAtom);
    set(currentSceneIdAtom, params.sceneId);
    if (params.title) {
      set(currentSceneTitleAtom, params.title);
    }
    set(appModeAtom, "canvas");

    // Update URL if we have a workspace
    if (slug) {
      navigateTo(buildSceneUrl(slug, params.sceneId));
    }
  },
);

/**
 * Atom for navigating to profile settings
 * Updates URL to /profile
 */
export const navigateToProfileAtom = atom(null, (get, set) => {
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "profile");
  navigateTo(buildProfileUrl());
});

/**
 * Atom for navigating to preferences
 * Updates URL to /preferences
 */
export const navigateToPreferencesAtom = atom(null, (get, set) => {
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "preferences");
  navigateTo(buildPreferencesUrl());
});

/**
 * Atom for navigating to workspace settings
 * Updates URL to /workspace/{slug}/settings
 */
export const navigateToWorkspaceSettingsAtom = atom(null, (get, set) => {
  const workspaceSlug = get(currentWorkspaceSlugAtom);
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "workspace");

  if (workspaceSlug) {
    navigateTo(buildSettingsUrl(workspaceSlug));
  }
});

/**
 * Atom for navigating to members page
 * Updates URL to /workspace/{slug}/members
 */
export const navigateToMembersAtom = atom(null, (get, set) => {
  const workspaceSlug = get(currentWorkspaceSlugAtom);
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "members");

  if (workspaceSlug) {
    navigateTo(buildMembersUrl(workspaceSlug));
  }
});

/**
 * Atom for navigating to teams & collections page
 * Updates URL to /workspace/{slug}/teams
 */
export const navigateToTeamsCollectionsAtom = atom(null, (get, set) => {
  const workspaceSlug = get(currentWorkspaceSlugAtom);
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "teams-collections");

  if (workspaceSlug) {
    navigateTo(buildTeamsUrl(workspaceSlug));
  }
});

/**
 * Refresh trigger atoms - increment to trigger re-fetch in subscribed components
 * This allows cross-component communication without prop drilling
 */

/**
 * Collections refresh trigger - increment when collections are created/updated/deleted
 * Components that display collections should subscribe to this and re-fetch when it changes
 */
export const collectionsRefreshAtom = atom(0);

/**
 * Action atom to trigger collections refresh
 */
export const triggerCollectionsRefreshAtom = atom(null, (get, set) => {
  set(collectionsRefreshAtom, get(collectionsRefreshAtom) + 1);
});

/**
 * Scenes refresh trigger - increment when scenes are created/updated/deleted
 * Components that display scenes should subscribe to this and re-fetch when it changes
 */
export const scenesRefreshAtom = atom(0);

/**
 * Action atom to trigger scenes refresh
 */
export const triggerScenesRefreshAtom = atom(null, (get, set) => {
  set(scenesRefreshAtom, get(scenesRefreshAtom) + 1);
});

/**
 * Quick Search modal visibility state
 * Controls whether the Quick Search overlay is shown
 */
export const quickSearchOpenAtom = atom<boolean>(false);

/**
 * Search query for dashboard search
 * When not empty, WorkspaceMainContent shows SearchResultsView instead of normal content
 */
export const searchQueryAtom = atom<string>("");

/**
 * Scenes cache - shared across all components (sidebar, dashboard, collection view)
 * Key format: "workspaceId:collectionId" or "workspaceId:all" for all scenes
 * Value: Array of WorkspaceScene objects
 *
 * This enables instant navigation between collections without re-fetching
 */
export type ScenesCacheEntry = {
  scenes: unknown[]; // WorkspaceScene[] - using unknown to avoid circular imports
  timestamp: number;
};

export const scenesCacheAtom = atom<Map<string, ScenesCacheEntry>>(new Map());

/**
 * Get scenes from cache
 */
export const getScenesCacheAtom = atom((get) => {
  const cache = get(scenesCacheAtom);
  return (key: string) => cache.get(key);
});

/**
 * Set scenes in cache
 */
export const setScenesCacheAtom = atom(
  null,
  (get, set, params: { key: string; scenes: unknown[] }) => {
    const cache = new Map(get(scenesCacheAtom));
    cache.set(params.key, {
      scenes: params.scenes,
      timestamp: Date.now(),
    });
    set(scenesCacheAtom, cache);
  },
);

/**
 * Invalidate scenes cache for a workspace
 * If collectionId is provided, only invalidate that collection
 * Otherwise, invalidate all collections for the workspace
 */
export const invalidateScenesCacheAtom = atom(
  null,
  (get, set, params: { workspaceId: string; collectionId?: string }) => {
    const cache = new Map(get(scenesCacheAtom));

    if (params.collectionId) {
      // Invalidate specific collection
      cache.delete(`${params.workspaceId}:${params.collectionId}`);
    } else {
      // Invalidate all collections for this workspace
      const keysToDelete: string[] = [];
      cache.forEach((_, key) => {
        if (key.startsWith(`${params.workspaceId}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => cache.delete(key));
    }

    set(scenesCacheAtom, cache);
  },
);

/**
 * Clear entire scenes cache (e.g., on logout or workspace switch)
 */
export const clearScenesCacheAtom = atom(null, (get, set) => {
  set(scenesCacheAtom, new Map());
});
