import { atom } from "jotai";

/**
 * App mode - determines whether we show the canvas or settings pages
 */
export type AppMode = "canvas" | "settings";

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
 * Atom for navigating back to canvas
 */
export const navigateToCanvasAtom = atom(null, (get, set) => {
  set(appModeAtom, "canvas");
});

