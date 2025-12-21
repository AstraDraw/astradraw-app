import { atom } from "../../app-jotai";

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
 * - "workspace": Workspace settings (admin only)
 * - "members": Team members management (admin only)
 * - "teams-collections": Teams & collections management (admin only)
 */
export type DashboardView =
  | "home"
  | "collection"
  | "profile"
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
 * Derived atom to get the current sidebar mode based on app mode
 */
export const sidebarModeAtom = atom<SidebarMode>((get) => {
  const appMode = get(appModeAtom);
  return appMode === "canvas" ? "board" : "full";
});

/**
 * Atom for navigating to dashboard home
 */
export const navigateToDashboardAtom = atom(null, (get, set) => {
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "home");
});

/**
 * Atom for navigating to a specific collection view
 */
export const navigateToCollectionAtom = atom(
  null,
  (get, set, collectionId: string) => {
    set(activeCollectionIdAtom, collectionId);
    set(appModeAtom, "dashboard");
    set(dashboardViewAtom, "collection");
  },
);

/**
 * Atom for navigating back to canvas mode
 */
export const navigateToCanvasAtom = atom(null, (get, set) => {
  set(appModeAtom, "canvas");
});

/**
 * Atom for navigating to profile settings
 */
export const navigateToProfileAtom = atom(null, (get, set) => {
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "profile");
});

/**
 * Atom for navigating to workspace settings
 */
export const navigateToWorkspaceSettingsAtom = atom(null, (get, set) => {
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "workspace");
});

/**
 * Atom for navigating to members page
 */
export const navigateToMembersAtom = atom(null, (get, set) => {
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "members");
});

/**
 * Atom for navigating to teams & collections page
 */
export const navigateToTeamsCollectionsAtom = atom(null, (get, set) => {
  set(appModeAtom, "dashboard");
  set(dashboardViewAtom, "teams-collections");
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
