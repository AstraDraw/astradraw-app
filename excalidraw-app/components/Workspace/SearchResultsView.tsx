import React, { useEffect, useState, useCallback, useMemo } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtom, useAtomValue, useSetAtom } from "../../app-jotai";
import {
  listWorkspaceScenes,
  type WorkspaceScene,
  type Workspace,
} from "../../auth/workspaceApi";
import {
  searchQueryAtom,
  navigateToSceneAtom,
  currentWorkspaceSlugAtom,
  scenesRefreshAtom,
} from "../Settings/settingsState";
import { useSceneActions } from "../../hooks/useSceneActions";

import { SceneCardGrid } from "./SceneCardGrid";

import "./SearchResultsView.scss";

// Icons
const searchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

interface SearchResultsViewProps {
  workspace: Workspace | null;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  workspace,
}) => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const navigateToScene = useSetAtom(navigateToSceneAtom);
  const workspaceSlug = useAtomValue(currentWorkspaceSlugAtom);
  const scenesRefresh = useAtomValue(scenesRefreshAtom);

  const [allScenes, setAllScenes] = useState<WorkspaceScene[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all scenes for the workspace
  const workspaceId = workspace?.id;

  useEffect(() => {
    const loadScenes = async () => {
      if (!workspaceId) {
        setAllScenes([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Get all scenes for the workspace (no collection filter)
        const scenes = await listWorkspaceScenes(workspaceId);
        setAllScenes(scenes);
      } catch (err) {
        console.error("Failed to load scenes for search:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadScenes();
  }, [workspaceId, scenesRefresh]);

  // Create updater function for useSceneActions
  const updateScenes = useCallback(
    (updater: (prev: WorkspaceScene[]) => WorkspaceScene[]) => {
      setAllScenes(updater);
    },
    [],
  );

  // Scene actions hook - centralized delete/rename/duplicate logic
  const { deleteScene, renameScene, duplicateScene } = useSceneActions({
    updateScenes,
  });

  // Filter scenes by search query
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) {
      return allScenes;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return allScenes.filter((scene) =>
      scene.title.toLowerCase().includes(lowerQuery),
    );
  }, [allScenes, searchQuery]);

  // Navigate to scene via URL
  const handleOpenScene = useCallback(
    (scene: WorkspaceScene) => {
      if (workspaceSlug) {
        navigateToScene({
          sceneId: scene.id,
          title: scene.title,
          workspaceSlug,
        });
      }
    },
    [navigateToScene, workspaceSlug],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, [setSearchQuery]);

  if (isLoading) {
    return (
      <div className="search-results-view">
        <div className="search-results-view__loading">
          <div className="search-results-view__spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-view">
      {/* Header */}
      <header className="search-results-view__header">
        <div className="search-results-view__title-row">
          <span className="search-results-view__icon">{searchIcon}</span>
          <h1 className="search-results-view__title">
            {searchQuery.trim()
              ? t("workspace.searchResultsFor", { query: searchQuery })
              : t("workspace.searchResults")}
          </h1>
          <button
            className="search-results-view__clear"
            onClick={handleClearSearch}
            title={t("workspace.clearSearch")}
          >
            {closeIcon}
            <span>{t("workspace.clearSearch")}</span>
          </button>
        </div>
        <p className="search-results-view__count">
          {filteredScenes.length === 1
            ? `1 ${t("workspace.scenes").toLowerCase()}`
            : `${filteredScenes.length} ${t("workspace.scenes").toLowerCase()}`}
        </p>
      </header>

      {/* Separator after header */}
      <div className="search-results-view__separator" />

      {/* Results */}
      <div className="search-results-view__content">
        {filteredScenes.length === 0 ? (
          <div className="search-results-view__empty">
            <div className="search-results-view__empty-icon">{searchIcon}</div>
            <p className="search-results-view__empty-title">
              {t("workspace.noSearchResults")}
            </p>
            <p className="search-results-view__empty-hint">
              {t("workspace.noSearchResultsHint")}
            </p>
            <button
              className="search-results-view__empty-cta"
              onClick={handleClearSearch}
            >
              {t("workspace.clearSearch")}
            </button>
          </div>
        ) : (
          <SceneCardGrid
            scenes={filteredScenes}
            onOpenScene={handleOpenScene}
            onDeleteScene={deleteScene}
            onRenameScene={renameScene}
            onDuplicateScene={duplicateScene}
          />
        )}
      </div>
    </div>
  );
};

export default SearchResultsView;
