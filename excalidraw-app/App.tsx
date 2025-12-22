import {
  Excalidraw,
  LiveCollaborationTrigger,
  TTDDialogTrigger,
  CaptureUpdateAction,
  reconcileElements,
  useEditorInterface,
} from "@excalidraw/excalidraw";
import { trackEvent } from "@excalidraw/excalidraw/analytics";
import { getDefaultAppState } from "@excalidraw/excalidraw/appState";
import {
  CommandPalette,
  DEFAULT_CATEGORIES,
} from "@excalidraw/excalidraw/components/CommandPalette/CommandPalette";
import { ErrorDialog } from "@excalidraw/excalidraw/components/ErrorDialog";
import { OverwriteConfirmDialog } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirm";
import { openConfirmModal } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirmState";
import { ShareableLinkDialog } from "@excalidraw/excalidraw/components/ShareableLinkDialog";
import Trans from "@excalidraw/excalidraw/components/Trans";
import {
  APP_NAME,
  EVENT,
  THEME,
  VERSION_TIMEOUT,
  debounce,
  getVersion,
  getFrame,
  isTestEnv,
  preventUnload,
  resolvablePromise,
  isRunningInIframe,
  isDevEnv,
} from "@excalidraw/common";
import polyfill from "@excalidraw/excalidraw/polyfill";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { useCallbackRefState } from "@excalidraw/excalidraw/hooks/useCallbackRefState";
import { t } from "@excalidraw/excalidraw/i18n";

import {
  GithubIcon,
  usersIcon,
  share,
} from "@excalidraw/excalidraw/components/icons";
import { isElementLink } from "@excalidraw/element";
import { restore, restoreAppState } from "@excalidraw/excalidraw/data/restore";
import { newElementWith } from "@excalidraw/element";
import { isInitializedImageElement } from "@excalidraw/element";
import clsx from "clsx";
import {
  parseLibraryTokensFromUrl,
  useHandleLibrary,
} from "@excalidraw/excalidraw/data/library";

import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { RestoredDataState } from "@excalidraw/excalidraw/data/restore";
import type {
  FileId,
  NonDeletedExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  ExcalidrawImperativeAPI,
  BinaryFiles,
  ExcalidrawInitialDataState,
  UIAppState,
} from "@excalidraw/excalidraw/types";
import type { ResolutionType } from "@excalidraw/common/utility-types";
import type { ResolvablePromise } from "@excalidraw/common/utils";

import CustomStats from "./CustomStats";
import {
  Provider,
  useAtom,
  useAtomValue,
  useSetAtom,
  useAtomWithInitialValue,
  appJotaiStore,
} from "./app-jotai";
import {
  FIREBASE_STORAGE_PREFIXES,
  STORAGE_KEYS,
  SYNC_BROWSER_TABS_TIMEOUT,
  ASTRADRAW_GITHUB_URL,
} from "./app_constants";
import Collab, {
  collabAPIAtom,
  isCollaboratingAtom,
  isOfflineAtom,
} from "./collab/Collab";
import { AppFooter } from "./components/AppFooter";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import { ExportToExcalidrawPlus } from "./components/ExportToExcalidrawPlus";
import { TopErrorBoundary } from "./components/TopErrorBoundary";

import {
  exportToBackend,
  getCollaborationLinkData,
  isCollaborationLink,
  loadScene,
} from "./data";

import { updateStaleImageStatuses } from "./data/FileManager";
import {
  importFromLocalStorage,
  importUsernameFromLocalStorage,
} from "./data/localStorage";

import { getStorageBackend } from "./data/config";
import {
  LibraryIndexedDBAdapter,
  LibraryLocalStorageMigrationAdapter,
  LocalData,
  localStorageQuotaExceededAtom,
} from "./data/LocalData";
import { isBrowserStorageStateNewer } from "./data/tabSync";
import { ShareDialog, shareDialogStateAtom } from "./share/ShareDialog";
import CollabError, { collabErrorIndicatorAtom } from "./collab/CollabError";
import { useHandleAppTheme } from "./useHandleAppTheme";
import { getPreferredLanguage } from "./app-language/language-detector";
import { useAppLangCode } from "./app-language/language-state";
import DebugCanvas, {
  debugRenderer,
  isVisualDebuggerEnabled,
  loadSavedDebugState,
} from "./components/DebugCanvas";
import { AIComponents } from "./components/AI";
import { ExcalidrawPlusIframeExport } from "./ExcalidrawPlusIframeExport";

import "./index.scss";

// AstraDraw: ExcalidrawPlusPromoBanner removed
import { AppSidebar } from "./components/AppSidebar";
import { PresentationMode } from "./components/Presentation";
import { PenToolbar, getDefaultPenPresets } from "./pens";
import { getBundledLibraries } from "./env";
import { AuthProvider, useAuth } from "./auth";
import {
  WorkspaceSidebar,
  WorkspaceSidebarTrigger,
  InviteAcceptPage,
} from "./components/Workspace";

import {
  SaveStatusIndicator,
  type SaveStatus,
} from "./components/SaveStatusIndicator";

import {
  appModeAtom,
  navigateToCanvasAtom,
  navigateToDashboardAtom,
  activeCollectionIdAtom,
  triggerScenesRefreshAtom,
  collectionsRefreshAtom,
  currentWorkspaceSlugAtom,
  currentSceneIdAtom,
  currentSceneTitleAtom,
  dashboardViewAtom,
  isPrivateCollectionAtom,
  isAutoCollabSceneAtom,
} from "./components/Settings";

import { parseUrl, buildSceneUrl, type RouteType } from "./router";

import { WorkspaceMainContent } from "./components/Workspace";

import {
  createScene,
  updateSceneData,
  listWorkspaces,
  listCollections,
} from "./auth/workspaceApi";
import {
  loadWorkspaceScene,
  type SceneAccess,
} from "./data/workspaceSceneLoader";

import type { Workspace, Collection } from "./auth/workspaceApi";

import type { CollabAPI } from "./collab/Collab";

polyfill();

window.EXCALIDRAW_THROTTLE_RENDER = true;

// Autosave timing constants
const AUTOSAVE_DEBOUNCE_MS = 2000; // 2 seconds after last change
const AUTOSAVE_RETRY_DELAY_MS = 5000; // 5 seconds on error (single retry)
const BACKUP_SAVE_INTERVAL_MS = 30000; // 30 seconds safety net

declare global {
  interface BeforeInstallPromptEventChoiceResult {
    outcome: "accepted" | "dismissed";
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<BeforeInstallPromptEventChoiceResult>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let pwaEvent: BeforeInstallPromptEvent | null = null;

// Adding a listener outside of the component as it may (?) need to be
// subscribed early to catch the event.
//
// Also note that it will fire only if certain heuristics are met (user has
// used the app for some time, etc.)
window.addEventListener(
  "beforeinstallprompt",
  (event: BeforeInstallPromptEvent) => {
    // prevent Chrome <= 67 from automatically showing the prompt
    event.preventDefault();
    // cache for later use
    pwaEvent = event;
  },
);

let isSelfEmbedding = false;

if (window.self !== window.top) {
  try {
    const parentUrl = new URL(document.referrer);
    const currentUrl = new URL(window.location.href);
    if (parentUrl.origin === currentUrl.origin) {
      isSelfEmbedding = true;
    }
  } catch (error) {
    // ignore
  }
}

const SCENE_URL_PATTERN = /^\/workspace\/([^/]+)\/scene\/([^/#]+)/;
const LEGACY_ROOM_PATTERN = /^#room=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/;
const INVITE_URL_PATTERN = /^\/invite\/([a-zA-Z0-9_-]+)$/;

const shareableLinkConfirmDialog = {
  title: t("overwriteConfirm.modal.shareableLink.title"),
  description: (
    <Trans
      i18nKey="overwriteConfirm.modal.shareableLink.description"
      bold={(text) => <strong>{text}</strong>}
      br={() => <br />}
    />
  ),
  actionLabel: t("overwriteConfirm.modal.shareableLink.button"),
  color: "danger",
} as const;

const initializeScene = async (opts: {
  collabAPI: CollabAPI | null;
  excalidrawAPI: ExcalidrawImperativeAPI;
}): Promise<
  { scene: ExcalidrawInitialDataState | null } & (
    | { isExternalScene: true; id: string; key: string }
    | { isExternalScene: false; id?: null; key?: null }
  )
> => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  const jsonBackendMatch = window.location.hash.match(
    /^#json=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/,
  );
  const externalUrlMatch = window.location.hash.match(/^#url=(.*)$/);

  const localDataState = importFromLocalStorage();

  let scene: RestoredDataState & {
    scrollToContent?: boolean;
  } = await loadScene(null, null, localDataState);

  let roomLinkData = getCollaborationLinkData(window.location.href);
  const isExternalScene = !!(id || jsonBackendMatch || roomLinkData);
  if (isExternalScene) {
    if (
      // don't prompt if scene is empty
      !scene.elements.length ||
      // don't prompt for collab scenes because we don't override local storage
      roomLinkData ||
      // otherwise, prompt whether user wants to override current scene
      (await openConfirmModal(shareableLinkConfirmDialog))
    ) {
      if (jsonBackendMatch) {
        scene = await loadScene(
          jsonBackendMatch[1],
          jsonBackendMatch[2],
          localDataState,
        );
      }
      scene.scrollToContent = true;
      if (!roomLinkData) {
        window.history.replaceState({}, APP_NAME, window.location.origin);
      }
    } else {
      // https://github.com/excalidraw/excalidraw/issues/1919
      if (document.hidden) {
        return new Promise((resolve, reject) => {
          window.addEventListener(
            "focus",
            () => initializeScene(opts).then(resolve).catch(reject),
            {
              once: true,
            },
          );
        });
      }

      roomLinkData = null;
      window.history.replaceState({}, APP_NAME, window.location.origin);
    }
  } else if (externalUrlMatch) {
    window.history.replaceState({}, APP_NAME, window.location.origin);

    const url = externalUrlMatch[1];
    try {
      const request = await fetch(window.decodeURIComponent(url));
      const data = await loadFromBlob(await request.blob(), null, null);
      if (
        !scene.elements.length ||
        (await openConfirmModal(shareableLinkConfirmDialog))
      ) {
        return { scene: data, isExternalScene };
      }
    } catch (error: any) {
      return {
        scene: {
          appState: {
            errorMessage: t("alerts.invalidSceneUrl"),
          },
        },
        isExternalScene,
      };
    }
  }

  // Add default pen presets to scene
  const defaultPenPresets = getDefaultPenPresets();
  const addPenPresets = (sceneData: typeof scene | null) => {
    if (!sceneData) {
      return null;
    }
    return {
      ...sceneData,
      appState: {
        ...sceneData.appState,
        customPens: sceneData.appState?.customPens ?? defaultPenPresets,
      },
    };
  };

  if (roomLinkData && opts.collabAPI) {
    const { excalidrawAPI } = opts;

    const scene = await opts.collabAPI.startCollaboration(roomLinkData);

    return {
      // when collaborating, the state may have already been updated at this
      // point (we may have received updates from other clients), so reconcile
      // elements and appState with existing state
      scene: {
        ...scene,
        appState: {
          ...restoreAppState(
            {
              ...scene?.appState,
              theme: localDataState?.appState?.theme || scene?.appState?.theme,
            },
            excalidrawAPI.getAppState(),
          ),
          // necessary if we're invoking from a hashchange handler which doesn't
          // go through App.initializeScene() that resets this flag
          isLoading: false,
          customPens: defaultPenPresets,
        },
        elements: reconcileElements(
          scene?.elements || [],
          excalidrawAPI.getSceneElementsIncludingDeleted() as RemoteExcalidrawElement[],
          excalidrawAPI.getAppState(),
        ),
      },
      isExternalScene: true,
      id: roomLinkData.roomId,
      key: roomLinkData.roomKey,
    };
  } else if (scene) {
    return isExternalScene && jsonBackendMatch
      ? {
          scene: addPenPresets(scene),
          isExternalScene,
          id: jsonBackendMatch[1],
          key: jsonBackendMatch[2],
        }
      : { scene: addPenPresets(scene), isExternalScene: false };
  }
  return { scene: null, isExternalScene: false };
};

const WORKSPACE_SIDEBAR_PREF_KEY = "astradraw_workspace_sidebar_open";

const ExcalidrawWrapper = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const isCollabDisabled = isRunningInIframe();

  const { editorTheme, appTheme, setAppTheme } = useHandleAppTheme();

  const [langCode, setLangCode] = useAppLangCode();

  const editorInterface = useEditorInterface();

  // App mode state (canvas, settings, or dashboard)
  const appMode = useAtomValue(appModeAtom);
  const setAppMode = useSetAtom(appModeAtom);
  const navigateToCanvas = useSetAtom(navigateToCanvasAtom);
  const navigateToDashboard = useSetAtom(navigateToDashboardAtom);
  const setActiveCollectionId = useSetAtom(activeCollectionIdAtom);
  const triggerScenesRefresh = useSetAtom(triggerScenesRefreshAtom);

  // URL-based navigation atoms
  const setCurrentWorkspaceSlugAtom = useSetAtom(currentWorkspaceSlugAtom);
  const setCurrentSceneIdAtom = useSetAtom(currentSceneIdAtom);
  const setCurrentSceneTitleAtom = useSetAtom(currentSceneTitleAtom);
  const setDashboardView = useSetAtom(dashboardViewAtom);
  const setIsPrivateCollection = useSetAtom(isPrivateCollectionAtom);
  const setIsAutoCollabScene = useSetAtom(isAutoCollabSceneAtom);
  const isAutoCollabScene = useAtomValue(isAutoCollabSceneAtom);

  // Auth state for auto-open on login
  const { isAuthenticated } = useAuth();
  const wasAuthenticated = useRef(false);

  // Workspace state - initialize from localStorage
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem(WORKSPACE_SIDEBAR_PREF_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [currentSceneTitle, setCurrentSceneTitle] =
    useState<string>("Untitled");

  // Ref to access currentSceneId in closures without adding to useEffect deps
  // Used by syncData to skip localStorage sync for workspace scenes
  const currentSceneIdRef = useRef<string | null>(null);
  currentSceneIdRef.current = currentSceneId;

  // Save status state machine for autosave UI
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  // isOnline is set by event handlers and used to trigger save on reconnect
  const [_isOnline, setIsOnline] = useState(navigator.onLine);
  void _isOnline; // Used in offline detection effect
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const retryCountRef = useRef<number>(0);
  const lastSavedDataRef = useRef<string | null>(null);

  // Track current workspace and its collections for default scene creation
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [currentWorkspaceSlug, setCurrentWorkspaceSlug] = useState<
    string | null
  >(null);
  const [currentSceneAccess, setCurrentSceneAccess] =
    useState<SceneAccess | null>(null);
  const [isLegacyMode, setIsLegacyMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("mode") === "anonymous" ||
      !!window.location.hash.match(LEGACY_ROOM_PATTERN)
    );
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [privateCollectionId, setPrivateCollectionId] = useState<string | null>(
    null,
  );

  // Invite link handling - check URL on initial load
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(
    () => {
      const match = window.location.pathname.match(INVITE_URL_PATTERN);
      return match ? match[1] : null;
    },
  );

  // Track if we've already set the default active collection to prevent loops
  const hasSetDefaultActiveCollectionRef = useRef(false);

  // Auto-open sidebar when user logs in
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated.current) {
      // User just logged in, open sidebar
      setWorkspaceSidebarOpen(true);
      // Reset the flag when user logs in
      hasSetDefaultActiveCollectionRef.current = false;
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  // Load current workspace and find private collection when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentWorkspace(null);
      setCollections([]);
      setPrivateCollectionId(null);
      hasSetDefaultActiveCollectionRef.current = false;
      return;
    }

    const loadWorkspaceData = async () => {
      try {
        // Get user's workspaces
        const workspaces = await listWorkspaces();
        if (workspaces.length > 0) {
          const workspace =
            (currentWorkspaceSlug &&
              workspaces.find((ws) => ws.slug === currentWorkspaceSlug)) ||
            workspaces[0]; // Fallback to first workspace as default
          setCurrentWorkspace(workspace);

          // Find the private collection in this workspace
          const workspaceCollections = await listCollections(workspace.id);
          setCollections(workspaceCollections);

          const privateCollection = workspaceCollections.find(
            (c) => c.isPrivate,
          );
          if (privateCollection) {
            setPrivateCollectionId(privateCollection.id);
            // Set as default active collection only once
            if (!hasSetDefaultActiveCollectionRef.current) {
              hasSetDefaultActiveCollectionRef.current = true;
              setActiveCollectionId(privateCollection.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load workspace data:", error);
      }
    };

    loadWorkspaceData();
    // Note: Removed activeCollectionId from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, setActiveCollectionId, currentWorkspaceSlug]);

  // Subscribe to collections refresh trigger to reload collections when they change
  // This ensures App.tsx collections stay in sync with sidebar's collection changes
  const collectionsRefresh = useAtomValue(collectionsRefreshAtom);
  useEffect(() => {
    if (!currentWorkspace || !isAuthenticated) {
      return;
    }

    const reloadCollections = async () => {
      try {
        const workspaceCollections = await listCollections(currentWorkspace.id);
        setCollections(workspaceCollections);
      } catch (error) {
        console.error("Failed to reload collections:", error);
      }
    };

    // Only reload if collectionsRefresh > 0 (meaning it was triggered, not initial mount)
    if (collectionsRefresh > 0) {
      reloadCollections();
    }
  }, [collectionsRefresh, currentWorkspace, isAuthenticated]);

  // Save sidebar preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        WORKSPACE_SIDEBAR_PREF_KEY,
        String(workspaceSidebarOpen),
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [workspaceSidebarOpen]);

  useEffect(() => {
    if (isLegacyMode) {
      setWorkspaceSidebarOpen(false);
    }
  }, [isLegacyMode]);

  // Block Excalidraw keyboard shortcuts when in dashboard mode
  // This prevents canvas shortcuts from firing when user is typing in dashboard
  useEffect(() => {
    if (appMode === "dashboard") {
      document.body.classList.add("excalidraw-disabled");
    } else {
      document.body.classList.remove("excalidraw-disabled");
    }
    return () => {
      document.body.classList.remove("excalidraw-disabled");
    };
  }, [appMode]);

  // initial state
  // ---------------------------------------------------------------------------

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    trackEvent("load", "frame", getFrame());
    // Delayed so that the app has a time to load the latest SW
    setTimeout(() => {
      trackEvent("load", "version", getVersion());
    }, VERSION_TIMEOUT);
  }, []);

  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();

  useEffect(() => {
    const updateLegacyMode = () => {
      const params = new URLSearchParams(window.location.search);
      setIsLegacyMode(
        params.get("mode") === "anonymous" ||
          !!window.location.hash.match(LEGACY_ROOM_PATTERN),
      );
    };

    window.addEventListener("hashchange", updateLegacyMode);
    window.addEventListener("popstate", updateLegacyMode);
    return () => {
      window.removeEventListener("hashchange", updateLegacyMode);
      window.removeEventListener("popstate", updateLegacyMode);
    };
  }, []);

  // URL-based navigation sync
  // This effect handles:
  // 1. Initial URL parsing on mount
  // 2. Browser back/forward navigation via popstate
  // 3. Syncing URL state to Jotai atoms
  const handleUrlRouteRef = useRef<((route: RouteType) => void) | null>(null);

  // Ref to hold scene loading function - populated by initialization effect
  // and called by handlePopState for URL-based navigation
  const loadSceneFromUrlRef = useRef<
    ((workspaceSlug: string, sceneId: string) => Promise<void>) | null
  >(null);

  useEffect(() => {
    // Define the route handler - this is called from popstate, so we should NOT
    // call navigation atoms that push URLs (that would cause infinite loop).
    // Instead, we directly set the state atoms.
    const handleUrlRoute = (route: RouteType) => {
      // Skip if in legacy mode (anonymous or legacy collab)
      if (route.type === "anonymous" || route.type === "legacy-collab") {
        return;
      }

      // Handle workspace routes - set state directly without pushing URLs
      switch (route.type) {
        case "dashboard":
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);
          setDashboardView("home");
          setAppMode("dashboard");
          break;

        case "collection":
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);
          setActiveCollectionId(route.collectionId);
          setIsPrivateCollection(false);
          setDashboardView("collection");
          setAppMode("dashboard");
          break;

        case "private":
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);
          setIsPrivateCollection(true);
          setDashboardView("collection");
          setAppMode("dashboard");
          break;

        case "settings":
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);
          setDashboardView("workspace");
          setAppMode("dashboard");
          break;

        case "members":
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);
          setDashboardView("members");
          setAppMode("dashboard");
          break;

        case "teams":
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);
          setDashboardView("teams-collections");
          setAppMode("dashboard");
          break;

        case "profile":
          setDashboardView("profile");
          setAppMode("dashboard");
          break;

        case "scene":
          // Scene loading is handled separately by loadSceneFromUrlRef
          // This just ensures the app mode is correct
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);
          setAppMode("canvas");
          break;

        case "home":
          // Root URL - check if authenticated and redirect to dashboard or stay on canvas
          // This is handled by the main app logic
          break;

        default:
          break;
      }
    };

    handleUrlRouteRef.current = handleUrlRoute;

    // Handle popstate for browser back/forward navigation
    const handlePopState = async (event: PopStateEvent) => {
      const route = parseUrl();

      // If navigating to a scene URL, we need to load the scene
      if (route.type === "scene") {
        // Check if this is a different scene than currently loaded
        if (currentSceneIdRef.current !== route.sceneId) {
          // First, switch to canvas mode so the UI updates immediately
          setAppMode("canvas");
          setCurrentWorkspaceSlugAtom(route.workspaceSlug);

          // Load the scene using the ref function (populated by initialization effect)
          if (loadSceneFromUrlRef.current) {
            await loadSceneFromUrlRef.current(
              route.workspaceSlug,
              route.sceneId,
            );
          } else {
            // Fallback: just set state if loader not ready yet
            setCurrentWorkspaceSlug(route.workspaceSlug);
          }
        }
      } else {
        handleUrlRoute(route);
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Parse initial URL on mount and set the correct app state
    const initialRoute = parseUrl();
    if (
      initialRoute.type !== "anonymous" &&
      initialRoute.type !== "legacy-collab" &&
      initialRoute.type !== "home"
    ) {
      // For dashboard routes, set state immediately (scene loading is handled separately)
      if (initialRoute.type !== "scene") {
        handleUrlRoute(initialRoute);
      } else {
        // For scene routes, just set the workspace slug - scene loading happens in the other useEffect
        setCurrentWorkspaceSlugAtom(initialRoute.workspaceSlug);
      }
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    setAppMode,
    setActiveCollectionId,
    setCurrentWorkspaceSlugAtom,
    setDashboardView,
    setIsPrivateCollection,
  ]);

  const [, setShareDialogState] = useAtom(shareDialogStateAtom);
  const [collabAPI] = useAtom(collabAPIAtom);
  const [isCollaborating] = useAtomWithInitialValue(isCollaboratingAtom, () => {
    return isCollaborationLink(window.location.href);
  });
  const collabError = useAtomValue(collabErrorIndicatorAtom);

  useHandleLibrary({
    excalidrawAPI,
    adapter: LibraryIndexedDBAdapter,
    // TODO maybe remove this in several months (shipped: 24-03-11)
    migrationAdapter: LibraryLocalStorageMigrationAdapter,
    // AstraDraw: Allow libraries from astrateam.net subdomains and upstream sources
    validateLibraryUrl: (url: string) => {
      try {
        const { hostname } = new URL(url);
        // Allow any subdomain of astrateam.net (e.g., libraries.astrateam.net)
        // Also allow upstream excalidraw sources for compatibility
        const allowedDomains = [
          "astrateam.net",
          "excalidraw.com",
          "raw.githubusercontent.com",
        ];
        return allowedDomains.some((domain) => {
          return hostname === domain || hostname.endsWith(`.${domain}`);
        });
      } catch {
        return false;
      }
    },
  });

  // AstraDraw: Load pre-bundled libraries from Docker volume mount
  // These are .excalidrawlib files placed in /app/libraries/ directory
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const bundledLibraries = getBundledLibraries();
    if (bundledLibraries.length > 0) {
      excalidrawAPI
        .updateLibrary({
          libraryItems: bundledLibraries,
          merge: true,
          defaultStatus: "published",
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error("AstraDraw: Failed to load bundled libraries:", error);
        });
    }
  }, [excalidrawAPI]);

  const [, forceRefresh] = useState(false);

  useEffect(() => {
    if (isDevEnv()) {
      const debugState = loadSavedDebugState();

      if (debugState.enabled && !window.visualDebug) {
        window.visualDebug = {
          data: [],
        };
      } else {
        delete window.visualDebug;
      }
      forceRefresh((prev) => !prev);
    }
  }, [excalidrawAPI]);

  useEffect(() => {
    if (!excalidrawAPI || (!isCollabDisabled && !collabAPI)) {
      return;
    }

    const decodeBase64ToBlob = (base64: string) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: "application/json" });
    };

    const loadImages = (
      data: ResolutionType<typeof initializeScene>,
      isInitialLoad = false,
    ) => {
      if (!data.scene) {
        return;
      }
      if (collabAPI?.isCollaborating()) {
        if (data.scene.elements) {
          collabAPI
            .fetchImageFilesFromStorage({
              elements: data.scene.elements,
              forceFetchFiles: true,
            })
            .then(({ loadedFiles, erroredFiles }) => {
              excalidrawAPI.addFiles(loadedFiles);
              updateStaleImageStatuses({
                excalidrawAPI,
                erroredFiles,
                elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
              });
            });
        }
      } else {
        const fileIds =
          data.scene.elements?.reduce((acc, element) => {
            if (isInitializedImageElement(element)) {
              return acc.concat(element.fileId);
            }
            return acc;
          }, [] as FileId[]) || [];

        if (data.isExternalScene) {
          getStorageBackend().then((storageBackend) =>
            storageBackend
              .loadFilesFromStorageBackend(
                `${FIREBASE_STORAGE_PREFIXES.shareLinkFiles}/${data.id}`,
                data.key,
                fileIds,
              )
              .then(({ loadedFiles, erroredFiles }) => {
                excalidrawAPI.addFiles(loadedFiles);
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              }),
          );
        } else if (isInitialLoad) {
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              });
          }
          // on fresh load, clear unused files from IDB (from previous
          // session)
          LocalData.fileStorage.clearObsoleteFiles({ currentFileIds: fileIds });
        }
      }
    };

    // Reusable scene loading function - can be called from initial load or navigation
    const loadSceneFromUrl = async (
      workspaceSlug: string,
      sceneId: string,
      options: {
        isInitialLoad?: boolean;
        roomKeyFromHash?: string | null;
      } = {},
    ) => {
      const { isInitialLoad = false, roomKeyFromHash = null } = options;

      // Leave current collaboration room before switching scenes
      // This ensures clean room switching when navigating between scenes
      if (!isInitialLoad && collabAPI?.isCollaborating()) {
        collabAPI.stopCollaboration(false); // false = don't keep remote state
      }

      try {
        const loaded = await loadWorkspaceScene(workspaceSlug, sceneId);
        setCurrentWorkspaceSlug(workspaceSlug);
        setCurrentSceneId(loaded.scene.id);
        setCurrentSceneTitle(loaded.scene.title || "Untitled");
        setCurrentSceneAccess(loaded.access);

        // Sync with Jotai atoms for URL-based navigation
        setCurrentWorkspaceSlugAtom(workspaceSlug);
        setCurrentSceneIdAtom(loaded.scene.id);
        setCurrentSceneTitleAtom(loaded.scene.title || "Untitled");

        let restored: RestoredDataState | null = null;
        if (loaded.data) {
          const blob = decodeBase64ToBlob(loaded.data);
          const sceneData = await loadFromBlob(blob, null, null);
          restored = sceneData;
        }

        if (restored) {
          const sceneWithCollaborators = {
            ...restored,
            appState: {
              ...restored.appState,
              collaborators: new Map(),
            },
          };

          excalidrawAPI.updateScene({
            elements: sceneWithCollaborators.elements || [],
            appState: sceneWithCollaborators.appState,
            captureUpdate: CaptureUpdateAction.IMMEDIATELY,
          });

          // Load files separately
          if (sceneWithCollaborators.files) {
            excalidrawAPI.addFiles(Object.values(sceneWithCollaborators.files));
          }

          // Initialize lastSavedDataRef with loaded data to prevent false "unsaved" status
          const loadedSceneData = JSON.stringify({
            type: "excalidraw",
            version: 2,
            source: window.location.href,
            elements: sceneWithCollaborators.elements || [],
            appState: {
              viewBackgroundColor:
                sceneWithCollaborators.appState?.viewBackgroundColor,
              gridSize: sceneWithCollaborators.appState?.gridSize,
            },
            files: sceneWithCollaborators.files || {},
          });
          lastSavedDataRef.current = loadedSceneData;
          setHasUnsavedChanges(false);
          setSaveStatus("saved");

          loadImages(
            {
              scene: sceneWithCollaborators as any,
              isExternalScene: false,
            } as any,
            /* isInitialLoad */ isInitialLoad,
          );

          if (isInitialLoad) {
            initialStatePromiseRef.current.promise.resolve({
              elements: sceneWithCollaborators.elements || [],
              appState: sceneWithCollaborators.appState,
              files: sceneWithCollaborators.files || {},
            });
          }
        } else if (isInitialLoad) {
          initialStatePromiseRef.current.promise.resolve(null);
        }

        // Auto-join collaboration for scenes in shared collections
        // The backend now returns roomId and roomKey directly in the response
        // if the user has canCollaborate access
        if (
          collabAPI &&
          !isCollabDisabled &&
          loaded.access.canCollaborate &&
          loaded.roomId &&
          loaded.roomKey
        ) {
          // Use room key from hash if provided (for shared links), otherwise use the one from backend
          const roomKey = roomKeyFromHash || loaded.roomKey;

          // For auto-collaboration, we pass isAutoCollab: true to indicate that:
          // 1. We already loaded the scene from workspace storage
          // 2. We should keep current elements (not reset scene)
          // 3. We should save them to room storage for other collaborators
          // This handles the case where room storage might be empty (first collaborator)
          await collabAPI.startCollaboration({
            roomId: loaded.roomId,
            roomKey,
            isAutoCollab: true,
          });

          // Mark this scene as auto-collab (collaboration can't be stopped)
          setIsAutoCollabScene(true);
        } else {
          // Not an auto-collab scene
          setIsAutoCollabScene(false);
        }

        navigateToCanvas();
      } catch (error) {
        console.error("Failed to load workspace scene:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load scene",
        );
        if (isInitialLoad) {
          initialStatePromiseRef.current.promise.resolve(null);
        }
      }
    };

    // Expose the scene loader via ref for use by handlePopState
    loadSceneFromUrlRef.current = loadSceneFromUrl;

    const handleWorkspaceUrl = async () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const sceneMatch = pathname.match(SCENE_URL_PATTERN);
      if (!sceneMatch) {
        return false;
      }

      const [, workspaceSlug, sceneId] = sceneMatch;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const roomKeyFromHash = hashParams.get("key");

      await loadSceneFromUrl(workspaceSlug, sceneId, {
        isInitialLoad: true,
        roomKeyFromHash,
      });

      return true;
    };

    const initialize = async () => {
      const handledWorkspace = await handleWorkspaceUrl();
      if (handledWorkspace) {
        return;
      }

      initializeScene({ collabAPI, excalidrawAPI }).then(async (data) => {
        loadImages(data, /* isInitialLoad */ true);
        initialStatePromiseRef.current.promise.resolve(data.scene);
      });
    };

    initialize();

    const onHashChange = async (event: HashChangeEvent) => {
      event.preventDefault();
      const pathname = window.location.pathname;
      if (pathname.match(SCENE_URL_PATTERN)) {
        // Workspace scene URLs handle collaboration key separately; avoid re-init
        return;
      }
      const libraryUrlTokens = parseLibraryTokensFromUrl();
      if (!libraryUrlTokens) {
        if (
          collabAPI?.isCollaborating() &&
          !isCollaborationLink(window.location.href)
        ) {
          collabAPI.stopCollaboration(false);
        }
        excalidrawAPI.updateScene({ appState: { isLoading: true } });

        initializeScene({ collabAPI, excalidrawAPI }).then((data) => {
          loadImages(data);
          if (data.scene) {
            excalidrawAPI.updateScene({
              ...data.scene,
              ...restore(data.scene, null, null, { repairBindings: true }),
              captureUpdate: CaptureUpdateAction.IMMEDIATELY,
            });
          }
        });
      }
    };

    const syncData = debounce(() => {
      if (isTestEnv()) {
        return;
      }

      // Skip localStorage sync when working on a workspace scene
      // This prevents overwriting scene data with stale localStorage data
      // Workspace scenes are loaded/saved only via backend API
      if (currentSceneIdRef.current) {
        return;
      }

      if (
        !document.hidden &&
        ((collabAPI && !collabAPI.isCollaborating()) || isCollabDisabled)
      ) {
        // don't sync if local state is newer or identical to browser state
        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
          const localDataState = importFromLocalStorage();
          const username = importUsernameFromLocalStorage();
          setLangCode(getPreferredLanguage());
          excalidrawAPI.updateScene({
            ...localDataState,
            captureUpdate: CaptureUpdateAction.NEVER,
          });
          LibraryIndexedDBAdapter.load().then((data) => {
            if (data) {
              excalidrawAPI.updateLibrary({
                libraryItems: data.libraryItems,
              });
            }
          });
          collabAPI?.setUsername(username || "");
        }

        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
          const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
          const currFiles = excalidrawAPI.getFiles();
          const fileIds =
            elements?.reduce((acc, element) => {
              if (
                isInitializedImageElement(element) &&
                // only load and update images that aren't already loaded
                !currFiles[element.fileId]
              ) {
                return acc.concat(element.fileId);
              }
              return acc;
            }, [] as FileId[]) || [];
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              });
          }
        }
      }
    }, SYNC_BROWSER_TABS_TIMEOUT);

    const onUnload = () => {
      LocalData.flushSave();
    };

    const visibilityChange = (event: FocusEvent | Event) => {
      if (event.type === EVENT.BLUR || document.hidden) {
        LocalData.flushSave();
      }
      if (
        event.type === EVENT.VISIBILITY_CHANGE ||
        event.type === EVENT.FOCUS
      ) {
        syncData();
      }
    };

    window.addEventListener(EVENT.HASHCHANGE, onHashChange, false);
    window.addEventListener(EVENT.UNLOAD, onUnload, false);
    window.addEventListener(EVENT.BLUR, visibilityChange, false);
    document.addEventListener(EVENT.VISIBILITY_CHANGE, visibilityChange, false);
    window.addEventListener(EVENT.FOCUS, visibilityChange, false);
    return () => {
      window.removeEventListener(EVENT.HASHCHANGE, onHashChange, false);
      window.removeEventListener(EVENT.UNLOAD, onUnload, false);
      window.removeEventListener(EVENT.BLUR, visibilityChange, false);
      window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
      document.removeEventListener(
        EVENT.VISIBILITY_CHANGE,
        visibilityChange,
        false,
      );
    };
  }, [
    isCollabDisabled,
    collabAPI,
    excalidrawAPI,
    setLangCode,
    navigateToCanvas,
    setCurrentWorkspaceSlugAtom,
    setCurrentSceneIdAtom,
    setCurrentSceneTitleAtom,
  ]);

  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      LocalData.flushSave();

      // Check for unsaved workspace scene changes
      if (
        currentSceneId &&
        (saveStatus === "pending" || saveStatus === "saving")
      ) {
        if (import.meta.env.VITE_APP_DISABLE_PREVENT_UNLOAD !== "true") {
          preventUnload(event);
        }
      }

      if (
        excalidrawAPI &&
        LocalData.fileStorage.shouldPreventUnload(
          excalidrawAPI.getSceneElements(),
        )
      ) {
        if (import.meta.env.VITE_APP_DISABLE_PREVENT_UNLOAD !== "true") {
          preventUnload(event);
        } else {
          console.warn(
            "preventing unload disabled (VITE_APP_DISABLE_PREVENT_UNLOAD)",
          );
        }
      }
    };
    window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    return () => {
      window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    };
  }, [excalidrawAPI, currentSceneId, saveStatus]);

  const onChange = (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    if (collabAPI?.isCollaborating()) {
      collabAPI.syncElements(elements);
    }

    // this check is redundant, but since this is a hot path, it's best
    // not to evaludate the nested expression every time
    if (!LocalData.isSavePaused()) {
      LocalData.save(elements, appState, files, () => {
        if (excalidrawAPI) {
          let didChange = false;

          const elements = excalidrawAPI
            .getSceneElementsIncludingDeleted()
            .map((element) => {
              if (
                LocalData.fileStorage.shouldUpdateImageElementStatus(element)
              ) {
                const newElement = newElementWith(element, { status: "saved" });
                if (newElement !== element) {
                  didChange = true;
                }
                return newElement;
              }
              return element;
            });

          if (didChange) {
            excalidrawAPI.updateScene({
              elements,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
          }
        }
      });
    }

    // Mark as having unsaved changes for auto-save
    // Only mark as changed if the actual scene data differs from last saved
    if (currentSceneId && !collabAPI?.isCollaborating()) {
      const files = excalidrawAPI?.getFiles() || {};
      const currentData = JSON.stringify({
        type: "excalidraw",
        version: 2,
        source: window.location.href,
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
      });

      // Only set unsaved if data actually changed from last save
      if (lastSavedDataRef.current !== currentData) {
        setHasUnsavedChanges(true);
      }
    }

    // Render the debug scene if the debug canvas is available
    if (debugCanvasRef.current && excalidrawAPI) {
      debugRenderer(
        debugCanvasRef.current,
        appState,
        elements,
        window.devicePixelRatio,
      );
    }
  };

  const [latestShareableLink, setLatestShareableLink] = useState<string | null>(
    null,
  );

  const onExportToBackend = async (
    exportedElements: readonly NonDeletedExcalidrawElement[],
    appState: Partial<AppState>,
    files: BinaryFiles,
  ) => {
    if (exportedElements.length === 0) {
      throw new Error(t("alerts.cannotExportEmptyCanvas"));
    }
    try {
      const { url, errorMessage } = await exportToBackend(
        exportedElements,
        {
          ...appState,
          viewBackgroundColor: appState.exportBackground
            ? appState.viewBackgroundColor
            : getDefaultAppState().viewBackgroundColor,
        },
        files,
      );

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (url) {
        setLatestShareableLink(url);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        const { width, height } = appState;
        console.error(error, {
          width,
          height,
          devicePixelRatio: window.devicePixelRatio,
        });
        throw new Error(error.message);
      }
    }
  };

  const renderCustomStats = (
    elements: readonly NonDeletedExcalidrawElement[],
    appState: UIAppState,
  ) => {
    return (
      <CustomStats
        setToast={(message) => excalidrawAPI!.setToast({ message })}
        appState={appState}
        elements={elements}
      />
    );
  };

  const isOffline = useAtomValue(isOfflineAtom);

  const localStorageQuotaExceeded = useAtomValue(localStorageQuotaExceededAtom);

  const onCollabDialogOpen = useCallback(
    () => setShareDialogState({ isOpen: true, type: "collaborationOnly" }),
    [setShareDialogState],
  );

  // Workspace handlers
  const handleNewScene = useCallback(
    async (collectionId?: string) => {
      if (!excalidrawAPI) {
        return;
      }

      try {
        // Generate a title with timestamp
        const title = `${t(
          "workspace.untitled",
        )} ${new Date().toLocaleTimeString()}`;

        // Use provided collectionId, or fall back to user's private collection
        const targetCollectionId =
          collectionId || privateCollectionId || undefined;

        // Create scene in backend immediately (with collection if provided)
        const scene = await createScene({
          title,
          collectionId: targetCollectionId,
        });

        // Clear the canvas
        excalidrawAPI.resetScene();

        // Set the new scene as current (so auto-save works)
        setCurrentSceneId(scene.id);
        setCurrentSceneTitle(title);

        // Sync with Jotai atoms
        setCurrentSceneIdAtom(scene.id);
        setCurrentSceneTitleAtom(title);

        // Set the active collection so sidebar shows scenes from this collection
        if (targetCollectionId) {
          setActiveCollectionId(targetCollectionId);
        }

        // Keep sidebar open to show the new scene in the list
        setWorkspaceSidebarOpen(true);

        // Update URL to reflect the new scene
        const workspaceSlug = currentWorkspace?.slug || currentWorkspaceSlug;
        if (workspaceSlug) {
          const newUrl = buildSceneUrl(workspaceSlug, scene.id);
          window.history.pushState({ sceneId: scene.id }, "", newUrl);
        }

        // Switch to canvas mode (important when called from dashboard)
        // Sidebar will automatically switch to "board" mode showing scenes
        navigateToCanvas();

        // Save empty scene data to establish storage
        const emptySceneData = {
          type: "excalidraw",
          version: 2,
          source: window.location.href,
          elements: [],
          appState: {
            viewBackgroundColor: "#ffffff",
          },
          files: {},
        };
        const blob = new Blob([JSON.stringify(emptySceneData)], {
          type: "application/json",
        });
        await updateSceneData(scene.id, blob);

        // Trigger refresh for other components (e.g., sidebar scene list)
        triggerScenesRefresh();

        excalidrawAPI.setToast({
          message: t("workspace.newSceneCreated") || "New scene created",
        });
      } catch (error) {
        console.error("Failed to create new scene:", error);
        // Fallback: just clear canvas without backend save
        excalidrawAPI.resetScene();
        setCurrentSceneId(null);
        setCurrentSceneTitle("Untitled");
        // Still switch to canvas mode on error
        navigateToCanvas();
      }
    },
    [
      excalidrawAPI,
      privateCollectionId,
      navigateToCanvas,
      setActiveCollectionId,
      triggerScenesRefresh,
      currentWorkspace?.slug,
      currentWorkspaceSlug,
      setCurrentSceneIdAtom,
      setCurrentSceneTitleAtom,
    ],
  );

  const handleSaveToWorkspace = useCallback(async () => {
    if (!excalidrawAPI) {
      return;
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      // Create blob from scene data
      const sceneData = {
        type: "excalidraw",
        version: 2,
        source: window.location.href,
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files: files || {},
      };

      const blob = new Blob([JSON.stringify(sceneData)], {
        type: "application/json",
      });

      // Generate thumbnail (simplified - just use a placeholder for now)
      const thumbnail = null; // TODO: Generate actual thumbnail

      if (currentSceneId) {
        // Update existing scene
        await updateSceneData(currentSceneId, blob);
        excalidrawAPI.setToast({ message: `${t("workspace.saveScene")} ✓` });
      } else {
        // Create new scene with auto-generated title
        // Use current title or generate one with timestamp
        const title =
          currentSceneTitle ||
          `${t("workspace.untitled")} ${new Date().toLocaleString()}`;

        // Save to private collection by default
        const scene = await createScene({
          title,
          thumbnail: thumbnail || undefined,
          collectionId: privateCollectionId || undefined,
        });

        // Save the data
        await updateSceneData(scene.id, blob);

        setCurrentSceneId(scene.id);
        setCurrentSceneTitle(title);
        excalidrawAPI.setToast({ message: `${t("workspace.saveScene")} ✓` });
      }
    } catch (error) {
      console.error("Failed to save scene:", error);
      setErrorMessage("Failed to save scene to workspace");
    }
  }, [excalidrawAPI, currentSceneId, currentSceneTitle, privateCollectionId]);

  // Core save function - used by autosave, retry, and immediate save
  const performSave = useCallback(async (): Promise<boolean> => {
    if (!currentSceneId || !excalidrawAPI) {
      return false;
    }

    // Check if offline
    if (!navigator.onLine) {
      setSaveStatus("offline");
      return false;
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      // Create scene data for comparison
      const sceneData = {
        type: "excalidraw",
        version: 2,
        source: window.location.href,
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files: files || {},
      };

      const dataString = JSON.stringify(sceneData);

      // Skip if data hasn't changed
      if (lastSavedDataRef.current === dataString) {
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        return true;
      }

      setSaveStatus("saving");

      const blob = new Blob([dataString], {
        type: "application/json",
      });

      await updateSceneData(currentSceneId, blob);
      lastSavedDataRef.current = dataString;
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      setLastSavedTime(new Date());
      retryCountRef.current = 0; // Reset retry count on success

      return true;
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("error");
      return false;
    }
  }, [currentSceneId, excalidrawAPI]);

  // Immediate save function - bypasses debounce, used before navigation
  // TODO: Expose via context/atom for use in navigation components
  const saveSceneImmediately = useCallback(async (): Promise<boolean> => {
    // Clear any pending debounced save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    return performSave();
  }, [performSave]);
  void saveSceneImmediately; // Reserved for future navigation integration

  // Manual retry function - called when user clicks on error status
  const handleSaveRetry = useCallback(async () => {
    retryCountRef.current = 0; // Reset retry count for manual retry
    await performSave();
  }, [performSave]);

  // Handle scene title change - separate API call from autosave
  const handleSceneTitleChange = useCallback(
    async (newTitle: string) => {
      if (!currentSceneId) {
        return;
      }

      const { updateScene: updateSceneApi } = await import(
        "./auth/workspaceApi"
      );
      await updateSceneApi(currentSceneId, { title: newTitle });
      setCurrentSceneTitle(newTitle);
      setCurrentSceneTitleAtom(newTitle);
      // Refresh sidebar scene list to show updated title
      triggerScenesRefresh();
    },
    [currentSceneId, setCurrentSceneTitleAtom, triggerScenesRefresh],
  );

  // Auto-save effect - triggers after debounce period
  useEffect(() => {
    if (!hasUnsavedChanges || !currentSceneId || !excalidrawAPI) {
      return;
    }

    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set pending status when changes are detected (only if currently saved)
    // Use functional update to avoid stale closure issues
    setSaveStatus((current) => (current === "saved" ? "pending" : current));

    // Schedule auto-save after debounce period
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const success = await performSave();

      // If save failed and we haven't retried yet, schedule a retry
      if (!success && retryCountRef.current < 1) {
        retryCountRef.current++;
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          performSave();
        }, AUTOSAVE_RETRY_DELAY_MS);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, currentSceneId, excalidrawAPI, performSave]);

  // Backup save interval - safety net every 30 seconds
  // Use refs to access current values without adding to dependencies
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  hasUnsavedChangesRef.current = hasUnsavedChanges;
  const saveStatusRef = useRef(saveStatus);
  saveStatusRef.current = saveStatus;

  useEffect(() => {
    if (!currentSceneId || !excalidrawAPI) {
      return;
    }

    backupSaveIntervalRef.current = setInterval(() => {
      if (hasUnsavedChangesRef.current && saveStatusRef.current !== "saving") {
        performSave();
      }
    }, BACKUP_SAVE_INTERVAL_MS);

    return () => {
      if (backupSaveIntervalRef.current) {
        clearInterval(backupSaveIntervalRef.current);
      }
    };
  }, [currentSceneId, excalidrawAPI, performSave]);

  // Offline detection - update save status based on network state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If we were offline with pending changes, trigger save
      if (saveStatus === "offline" && hasUnsavedChanges) {
        performSave();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (saveStatus === "pending" || saveStatus === "saving") {
        setSaveStatus("offline");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveStatus, hasUnsavedChanges, performSave]);

  // Reset save state when scene changes
  useEffect(() => {
    lastSavedDataRef.current = null;
    setHasUnsavedChanges(false);
    setSaveStatus("saved");
    retryCountRef.current = 0;
    // Clear any pending timeouts
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [currentSceneId]);

  // Keyboard shortcut handler for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        // Only intercept if we have a workspace scene open
        if (currentSceneId && excalidrawAPI) {
          e.preventDefault();
          e.stopPropagation();
          handleSaveToWorkspace();
        }
      }
    };

    // Use capture phase to intercept before Excalidraw
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [currentSceneId, excalidrawAPI, handleSaveToWorkspace]);

  // Handle invite link success - navigate to the joined workspace's dashboard
  const handleInviteSuccess = useCallback(
    (workspace: Workspace) => {
      setCurrentWorkspace(workspace);
      setCurrentWorkspaceSlug(workspace.slug);
      setPendingInviteCode(null);
      // Navigate to dashboard to show the new workspace
      navigateToDashboard();
      setWorkspaceSidebarOpen(true);
    },
    [navigateToDashboard],
  );

  const handleInviteCancel = useCallback(() => {
    setPendingInviteCode(null);
    window.history.replaceState({}, document.title, "/");
  }, []);

  // browsers generally prevent infinite self-embedding, there are
  // cases where it still happens, and while we disallow self-embedding
  // by not whitelisting our own origin, this serves as an additional guard
  if (isSelfEmbedding) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <h1>I'm not a pretzel!</h1>
      </div>
    );
  }

  // AstraDraw: Removed Excalidraw+ commands - will be replaced with AstraDraw+ later

  // Render invite acceptance page if we have a pending invite code
  if (pendingInviteCode) {
    return (
      <InviteAcceptPage
        inviteCode={pendingInviteCode}
        onSuccess={handleInviteSuccess}
        onCancel={handleInviteCancel}
      />
    );
  }

  // Determine if current user is admin of the workspace
  const isWorkspaceAdmin = currentWorkspace?.role === "ADMIN";

  // CSS Hide/Show pattern: Both dashboard and canvas are always mounted
  // This prevents Excalidraw from unmounting/remounting and losing state
  return (
    <div
      style={{ height: "100%" }}
      className={clsx("excalidraw-app", {
        "is-collaborating": isCollaborating,
        "workspace-sidebar-open": workspaceSidebarOpen,
      })}
    >
      {/* Workspace Sidebar (Left) - shared between both modes */}
      {!isLegacyMode && (
        <WorkspaceSidebar
          isOpen={workspaceSidebarOpen}
          onClose={() => setWorkspaceSidebarOpen(false)}
          onNewScene={handleNewScene}
          currentSceneId={currentSceneId}
          onWorkspaceChange={(workspace, privateColId) => {
            setCurrentWorkspace(workspace);
            setCurrentWorkspaceSlug(workspace.slug);
            setPrivateCollectionId(privateColId);
            // Note: Don't reload collections here - WorkspaceSidebar already loads them
            // and calling listCollections here causes an infinite loop
          }}
          onCurrentSceneTitleChange={(newTitle) => {
            setCurrentSceneTitle(newTitle);
            setCurrentSceneTitleAtom(newTitle);
          }}
        />
      )}

      {/* Dashboard Content - hidden when in canvas mode */}
      {!isLegacyMode && (
        <div
          className="excalidraw-app__main excalidraw-app__dashboard"
          style={{ display: appMode === "dashboard" ? "block" : "none" }}
          aria-hidden={appMode !== "dashboard"}
        >
          <WorkspaceMainContent
            workspace={currentWorkspace}
            collections={collections}
            isAdmin={isWorkspaceAdmin}
            onNewScene={handleNewScene}
          />
        </div>
      )}

      {/* Canvas Content - hidden when in dashboard mode */}
      {/* Using CSS display:none + inert to keep Excalidraw mounted but inactive */}
      <div
        className="excalidraw-app__main excalidraw-app__canvas"
        style={{
          display: appMode === "canvas" || isLegacyMode ? "block" : "none",
        }}
        aria-hidden={appMode !== "canvas" && !isLegacyMode}
        inert={appMode !== "canvas" && !isLegacyMode ? true : undefined}
      >
        <Excalidraw
          excalidrawAPI={excalidrawRefCallback}
          onChange={onChange}
          initialData={initialStatePromiseRef.current.promise}
          isCollaborating={isCollaborating}
          onPointerUpdate={collabAPI?.onPointerUpdate}
          validateEmbeddable={true}
          UIOptions={{
            canvasActions: {
              toggleTheme: true,
              export: {
                onExportToBackend,
                renderCustomUI: excalidrawAPI
                  ? (elements, appState, files) => {
                      return (
                        <ExportToExcalidrawPlus
                          elements={elements}
                          appState={appState}
                          files={files}
                          name={excalidrawAPI.getName()}
                          onError={(error) => {
                            excalidrawAPI?.updateScene({
                              appState: {
                                errorMessage: error.message,
                              },
                            });
                          }}
                          onSuccess={() => {
                            excalidrawAPI.updateScene({
                              appState: { openDialog: null },
                            });
                          }}
                        />
                      );
                    }
                  : undefined,
              },
            },
          }}
          langCode={langCode}
          renderCustomStats={renderCustomStats}
          detectScroll={false}
          handleKeyboardGlobally={appMode === "canvas"}
          autoFocus={appMode === "canvas"}
          theme={editorTheme}
          renderTopRightUI={(isMobile) => {
            // Show save status indicator when workspace scene is open
            // Hide it during collaboration - collab has its own save mechanism
            const showSaveStatus =
              isAuthenticated &&
              currentSceneId &&
              !isLegacyMode &&
              !isCollaborating;

            // On mobile with no collab, only show save status if applicable
            if (isMobile) {
              if (!showSaveStatus) {
                return null;
              }
              return (
                <div className="excalidraw-ui-top-right">
                  <SaveStatusIndicator
                    status={saveStatus}
                    lastSavedTime={lastSavedTime}
                    sceneTitle={currentSceneTitle}
                    onTitleChange={handleSceneTitleChange}
                    onRetry={handleSaveRetry}
                    isMobile={true}
                  />
                </div>
              );
            }

            // Desktop: show save status + collab
            return (
              <div className="excalidraw-ui-top-right">
                {showSaveStatus && (
                  <SaveStatusIndicator
                    status={saveStatus}
                    lastSavedTime={lastSavedTime}
                    sceneTitle={currentSceneTitle}
                    onTitleChange={handleSceneTitleChange}
                    onRetry={handleSaveRetry}
                    isMobile={false}
                  />
                )}
                {collabError.message && (
                  <CollabError collabError={collabError} />
                )}
                {collabAPI && !isCollabDisabled && (
                  <LiveCollaborationTrigger
                    isCollaborating={isCollaborating}
                    onSelect={() =>
                      setShareDialogState({ isOpen: true, type: "share" })
                    }
                    editorInterface={editorInterface}
                  />
                )}
              </div>
            );
          }}
          onLinkOpen={(element, event) => {
            if (element.link && isElementLink(element.link)) {
              event.preventDefault();
              excalidrawAPI?.scrollToContent(element.link, { animate: true });
            }
          }}
        >
          {/* Workspace Sidebar Toggle Button - rendered via tunnel before hamburger menu */}
          {!isLegacyMode && (
            <WorkspaceSidebarTrigger
              isOpen={workspaceSidebarOpen}
              onToggle={() => setWorkspaceSidebarOpen(!workspaceSidebarOpen)}
            />
          )}
          <AppMainMenu
            onCollabDialogOpen={onCollabDialogOpen}
            isCollaborating={isCollaborating}
            isCollabEnabled={!isCollabDisabled}
            isAutoCollabScene={isAutoCollabScene}
            theme={appTheme}
            setTheme={(theme) => setAppTheme(theme)}
            refresh={() => forceRefresh((prev) => !prev)}
            onWorkspaceOpen={() => setWorkspaceSidebarOpen(true)}
            onSaveToWorkspace={handleSaveToWorkspace}
          />
          <AppWelcomeScreen
            onCollabDialogOpen={onCollabDialogOpen}
            isCollabEnabled={!isCollabDisabled}
            onSignIn={() => setWorkspaceSidebarOpen(true)}
          />
          <OverwriteConfirmDialog>
            <OverwriteConfirmDialog.Actions.ExportToImage />
            <OverwriteConfirmDialog.Actions.SaveToDisk />
            {/* AstraDraw+: Disabled until user functionality is implemented */}
          </OverwriteConfirmDialog>
          <AppFooter
            onChange={() => excalidrawAPI?.refresh()}
            excalidrawAPI={excalidrawAPI}
          />
          {excalidrawAPI && <AIComponents excalidrawAPI={excalidrawAPI} />}

          <TTDDialogTrigger />
          {isCollaborating && isOffline && (
            <div className="alertalert--warning">
              {t("alerts.collabOfflineWarning")}
            </div>
          )}
          {localStorageQuotaExceeded && (
            <div className="alert alert--danger">
              {t("alerts.localStorageQuotaExceeded")}
            </div>
          )}
          {latestShareableLink && (
            <ShareableLinkDialog
              link={latestShareableLink}
              onCloseRequest={() => setLatestShareableLink(null)}
              setErrorMessage={setErrorMessage}
            />
          )}
          {excalidrawAPI && !isCollabDisabled && (
            <Collab excalidrawAPI={excalidrawAPI} />
          )}

          <ShareDialog
            collabAPI={collabAPI}
            onExportToBackend={async () => {
              if (excalidrawAPI) {
                try {
                  await onExportToBackend(
                    excalidrawAPI.getSceneElements(),
                    excalidrawAPI.getAppState(),
                    excalidrawAPI.getFiles(),
                  );
                } catch (error: any) {
                  setErrorMessage(error.message);
                }
              }
            }}
            workspaceSceneContext={
              currentSceneId && currentWorkspace?.slug
                ? {
                    sceneId: currentSceneId,
                    workspaceSlug: currentWorkspace.slug,
                    access: currentSceneAccess || undefined,
                    roomId: null,
                  }
                : undefined
            }
          />

          {!isLegacyMode && (
            <AppSidebar
              excalidrawAPI={excalidrawAPI}
              sceneId={currentSceneId}
              onCloseWorkspaceSidebar={() => setWorkspaceSidebarOpen(false)}
            />
          )}

          {excalidrawAPI && <PenToolbar excalidrawAPI={excalidrawAPI} />}
          {excalidrawAPI && <PresentationMode excalidrawAPI={excalidrawAPI} />}

          {errorMessage && (
            <ErrorDialog onClose={() => setErrorMessage("")}>
              {errorMessage}
            </ErrorDialog>
          )}

          <CommandPalette
            customCommandPaletteItems={[
              {
                label: t("labels.liveCollaboration"),
                category: DEFAULT_CATEGORIES.app,
                keywords: [
                  "team",
                  "multiplayer",
                  "share",
                  "public",
                  "session",
                  "invite",
                ],
                icon: usersIcon,
                perform: () => {
                  setShareDialogState({
                    isOpen: true,
                    type: "collaborationOnly",
                  });
                },
              },
              {
                label: t("roomDialog.button_stopSession"),
                category: DEFAULT_CATEGORIES.app,
                predicate: () => !!collabAPI?.isCollaborating(),
                keywords: [
                  "stop",
                  "session",
                  "end",
                  "leave",
                  "close",
                  "exit",
                  "collaboration",
                ],
                perform: () => {
                  if (collabAPI) {
                    collabAPI.stopCollaboration();
                    if (!collabAPI.isCollaborating()) {
                      setShareDialogState({ isOpen: false });
                    }
                  }
                },
              },
              {
                label: t("labels.share"),
                category: DEFAULT_CATEGORIES.app,
                predicate: true,
                icon: share,
                keywords: [
                  "link",
                  "shareable",
                  "readonly",
                  "export",
                  "publish",
                  "snapshot",
                  "url",
                  "collaborate",
                  "invite",
                ],
                perform: async () => {
                  setShareDialogState({ isOpen: true, type: "share" });
                },
              },
              {
                label: "GitHub",
                icon: GithubIcon,
                category: DEFAULT_CATEGORIES.links,
                predicate: true,
                keywords: [
                  "issues",
                  "bugs",
                  "requests",
                  "report",
                  "features",
                  "social",
                  "community",
                ],
                perform: () => {
                  window.open(
                    ASTRADRAW_GITHUB_URL,
                    "_blank",
                    "noopener noreferrer",
                  );
                },
              },
              {
                ...CommandPalette.defaultItems.toggleTheme,
                perform: () => {
                  setAppTheme(
                    editorTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK,
                  );
                },
              },
              {
                label: t("labels.installPWA"),
                category: DEFAULT_CATEGORIES.app,
                predicate: () => !!pwaEvent,
                perform: () => {
                  if (pwaEvent) {
                    pwaEvent.prompt();
                    pwaEvent.userChoice.then(() => {
                      // event cannot be reused, but we'll hopefully
                      // grab new one as the event should be fired again
                      pwaEvent = null;
                    });
                  }
                },
              },
            ]}
          />
          {isVisualDebuggerEnabled() && excalidrawAPI && (
            <DebugCanvas
              appState={excalidrawAPI.getAppState()}
              scale={window.devicePixelRatio}
              ref={debugCanvasRef}
            />
          )}
        </Excalidraw>
      </div>
    </div>
  );
};

const ExcalidrawApp = () => {
  const isCloudExportWindow =
    window.location.pathname === "/excalidraw-plus-export";
  if (isCloudExportWindow) {
    return <ExcalidrawPlusIframeExport />;
  }

  return (
    <TopErrorBoundary>
      <AuthProvider>
        <Provider store={appJotaiStore}>
          <ExcalidrawWrapper />
        </Provider>
      </AuthProvider>
    </TopErrorBoundary>
  );
};

export default ExcalidrawApp;
