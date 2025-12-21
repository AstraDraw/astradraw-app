import { atom } from "../../app-jotai";

/**
 * App mode - determines what the main content area shows
 * - "canvas": Drawing board with Excalidraw
 * - "settings": Settings pages (profile, workspace, members, etc.)
 * - "dashboard": Dashboard home or collection view
 */
export type AppMode = "canvas" | "settings" | "dashboard";

/**
 * Sidebar display mode (derived from appMode)
 * - "board": Minimal sidebar (Dashboard + active collection + scene list)
 * - "full": Full navigation (settings, members, all collections)
 */
export type SidebarMode = "board" | "full";

/**
 * Dashboard sub-view (only relevant when appMode === "dashboard")
 * - "home": Dashboard home page with recently modified/visited
 * - "collection": Collection view showing scenes from a specific collection
 */
export type DashboardView = "home" | "collection";

/**
 * Settings page - which settings page is currently active
 */
export type SettingsPage =
  | "profile"
  | "workspace"
  | "members"
  | "teams-collections";

/**
 * Current app mode atom
 */
export const appModeAtom = atom<AppMode>("canvas");

/**
 * Current settings page atom
 */
export const settingsPageAtom = atom<SettingsPage>("profile");

/**
 * Active collection ID - persists across mode switches
 * This is the collection currently being viewed/worked in
 */
export const activeCollectionIdAtom = atom<string | null>(null);

/**
 * Dashboard sub-view atom (only relevant when appMode === "dashboard")
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
 * Combined atom for navigating to settings
 */
export const navigateToSettingsAtom = atom(
  null,
  (get, set, page: SettingsPage) => {
    set(settingsPageAtom, page);
    set(appModeAtom, "settings");
  },
);

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
