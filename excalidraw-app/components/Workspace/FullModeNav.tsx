import React, { useState, useEffect, useRef } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { CollectionItemSkeletonList } from "../Skeletons";

import type { Collection } from "../../auth/workspaceApi";
import type { DashboardView } from "../Settings/settingsState";

// Icons
const dashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const userIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const settingsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const usersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const teamsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const lockIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
    role="img"
  >
    <path
      d="M12 2a4 4 0 0 1 4 4v2h1.75A2.25 2.25 0 0 1 20 10.25v9.5A2.25 2.25 0 0 1 17.75 22H6.25A2.25 2.25 0 0 1 4 19.75v-9.5A2.25 2.25 0 0 1 6.25 8H8V6a4 4 0 0 1 4-4Zm5.75 7.5H6.25a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h11.5a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75Zm-5.75 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0-10A2.5 2.5 0 0 0 9.5 6v2h5V6A2.5 2.5 0 0 0 12 3.5Z"
      fill="currentColor"
    />
  </svg>
);

const folderIcon = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.496 5.627A2.25 2.25 0 0 1 22 7.75v10A4.25 4.25 0 0 1 17.75 22h-10a2.25 2.25 0 0 1-2.123-1.504l2.097.004H17.75a2.75 2.75 0 0 0 2.75-2.75v-10l-.004-.051V5.627ZM17.246 2a2.25 2.25 0 0 1 2.25 2.25v12.997a2.25 2.25 0 0 1-2.25 2.25H4.25A2.25 2.25 0 0 1 2 17.247V4.25A2.25 2.25 0 0 1 4.25 2h12.997Zm0 1.5H4.25a.75.75 0 0 0-.75.75v12.997c0 .414.336.75.75.75h12.997a.75.75 0 0 0 .75-.75V4.25a.75.75 0 0 0-.75-.75Z"
      fill="currentColor"
    />
  </svg>
);

const plusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const moreIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const preferencesIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
  </svg>
);

interface FullModeNavProps {
  collections: Collection[];
  activeCollectionId: string | null;
  currentView: DashboardView;
  isAdmin: boolean;
  isCollectionsLoading?: boolean;
  onDashboardClick: () => void;
  onProfileClick: () => void;
  onPreferencesClick: () => void;
  onSettingsClick: () => void;
  onMembersClick: () => void;
  onTeamsCollectionsClick: () => void;
  onCollectionClick: (collectionId: string, isPrivate?: boolean) => void;
  onCreateCollection: () => void;
  onNewScene: (collectionId?: string) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onEditCollection?: (collection: Collection) => void;
  onCopyCollection?: (collection: Collection) => void;
  onMoveCollection?: (collection: Collection) => void;
}

export const FullModeNav: React.FC<FullModeNavProps> = ({
  collections,
  activeCollectionId,
  currentView,
  isAdmin,
  isCollectionsLoading = false,
  onDashboardClick,
  onProfileClick,
  onPreferencesClick,
  onSettingsClick,
  onMembersClick,
  onTeamsCollectionsClick,
  onCollectionClick,
  onCreateCollection,
  onNewScene,
  onDeleteCollection,
  onEditCollection,
  onCopyCollection,
  onMoveCollection,
}) => {
  const [collectionMenuOpen, setCollectionMenuOpen] = useState<string | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setCollectionMenuOpen(null);
      }
    };

    if (collectionMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [collectionMenuOpen]);

  // Separate private collection from others
  const privateCollection = collections.find((c) => c.isPrivate);
  const otherCollections = collections.filter((c) => !c.isPrivate);

  return (
    <div className="full-mode-nav">
      {/* Navigation items */}
      <nav className="full-mode-nav__nav">
        <button
          className={`full-mode-nav__nav-item ${
            currentView === "home" ? "full-mode-nav__nav-item--active" : ""
          }`}
          onClick={onDashboardClick}
        >
          <span className="full-mode-nav__nav-icon">{dashboardIcon}</span>
          <span className="full-mode-nav__nav-label">
            {t("workspace.dashboard")}
          </span>
        </button>

        {/* Profile - visible to all users */}
        <button
          className={`full-mode-nav__nav-item ${
            currentView === "profile" ? "full-mode-nav__nav-item--active" : ""
          }`}
          onClick={onProfileClick}
        >
          <span className="full-mode-nav__nav-icon">{userIcon}</span>
          <span className="full-mode-nav__nav-label">
            {t("settings.profile")}
          </span>
        </button>

        {/* Preferences - visible to all users */}
        <button
          className={`full-mode-nav__nav-item ${
            currentView === "preferences"
              ? "full-mode-nav__nav-item--active"
              : ""
          }`}
          onClick={onPreferencesClick}
        >
          <span className="full-mode-nav__nav-icon">{preferencesIcon}</span>
          <span className="full-mode-nav__nav-label">
            {t("settings.myPreferences")}
          </span>
        </button>

        {/* Admin-only settings */}
        {isAdmin && (
          <>
            <button
              className={`full-mode-nav__nav-item ${
                currentView === "workspace"
                  ? "full-mode-nav__nav-item--active"
                  : ""
              }`}
              onClick={onSettingsClick}
            >
              <span className="full-mode-nav__nav-icon">{settingsIcon}</span>
              <span className="full-mode-nav__nav-label">
                {t("workspace.workspaceSettings")}
              </span>
            </button>
            <button
              className={`full-mode-nav__nav-item ${
                currentView === "members"
                  ? "full-mode-nav__nav-item--active"
                  : ""
              }`}
              onClick={onMembersClick}
            >
              <span className="full-mode-nav__nav-icon">{usersIcon}</span>
              <span className="full-mode-nav__nav-label">
                {t("workspace.teamMembers")}
              </span>
            </button>
            <button
              className={`full-mode-nav__nav-item ${
                currentView === "teams-collections"
                  ? "full-mode-nav__nav-item--active"
                  : ""
              }`}
              onClick={onTeamsCollectionsClick}
            >
              <span className="full-mode-nav__nav-icon">{teamsIcon}</span>
              <span className="full-mode-nav__nav-label">
                {t("settings.teamsCollections")}
              </span>
            </button>
          </>
        )}
      </nav>

      {/* Collections section */}
      <div className="full-mode-nav__collections">
        <div className="full-mode-nav__collections-header">
          <span className="full-mode-nav__collections-title">
            {t("workspace.collections")}
          </span>
          <button
            className="full-mode-nav__add-collection"
            onClick={onCreateCollection}
            title={t("workspace.createCollection")}
          >
            {plusIcon}
          </button>
        </div>

        <div className="full-mode-nav__collections-list">
          {/* Loading skeleton */}
          {isCollectionsLoading && collections.length === 0 ? (
            <CollectionItemSkeletonList count={4} />
          ) : (
            <>
              {/* Private collection (always first, if exists) */}
              {privateCollection && (
                <button
                  className={`full-mode-nav__collection-item ${
                    activeCollectionId === privateCollection.id &&
                    currentView === "collection"
                      ? "full-mode-nav__collection-item--active"
                      : ""
                  }`}
                  onClick={() => onCollectionClick(privateCollection.id, true)}
                >
                  <span className="full-mode-nav__collection-icon">
                    {lockIcon}
                  </span>
                  <span className="full-mode-nav__collection-name">
                    {t("workspace.private")}
                  </span>
                </button>
              )}

              {/* Separator after private collection */}
              {privateCollection && otherCollections.length > 0 && (
                <div className="full-mode-nav__collections-separator" />
              )}

              {/* Other collections */}
              {otherCollections.map((collection) => (
                <div
                  key={collection.id}
                  className={`full-mode-nav__collection-row ${
                    activeCollectionId === collection.id &&
                    currentView === "collection"
                      ? "full-mode-nav__collection-row--active"
                      : ""
                  }`}
                >
                  <button
                    className="full-mode-nav__collection-item"
                    onClick={() => onCollectionClick(collection.id, false)}
                  >
                    <span className="full-mode-nav__collection-icon">
                      {collection.icon || folderIcon}
                    </span>
                    <span className="full-mode-nav__collection-name">
                      {collection.name}
                    </span>
                  </button>
                  {collection.canWrite && (
                    <div
                      className="full-mode-nav__collection-actions"
                      ref={
                        collectionMenuOpen === collection.id ? menuRef : null
                      }
                    >
                      <button
                        className="full-mode-nav__collection-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollectionMenuOpen(
                            collectionMenuOpen === collection.id
                              ? null
                              : collection.id,
                          );
                        }}
                      >
                        {moreIcon}
                      </button>
                      {collectionMenuOpen === collection.id && (
                        <div className="full-mode-nav__collection-menu">
                          <button
                            onClick={() => {
                              onNewScene(collection.id);
                              setCollectionMenuOpen(null);
                            }}
                          >
                            {t("workspace.createScene")}
                          </button>
                          {onCopyCollection && (
                            <button
                              onClick={() => {
                                onCopyCollection(collection);
                                setCollectionMenuOpen(null);
                              }}
                            >
                              {t("workspace.copyToWorkspace")}
                            </button>
                          )}
                          {onMoveCollection && (
                            <button
                              onClick={() => {
                                onMoveCollection(collection);
                                setCollectionMenuOpen(null);
                              }}
                            >
                              {t("workspace.moveToWorkspace")}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (onEditCollection) {
                                onEditCollection(collection);
                              }
                              setCollectionMenuOpen(null);
                            }}
                          >
                            {t("workspace.edit")}
                          </button>
                          {collection.isOwner && onDeleteCollection && (
                            <button
                              className="full-mode-nav__menu-item--danger"
                              onClick={() => {
                                onDeleteCollection(collection.id);
                                setCollectionMenuOpen(null);
                              }}
                            >
                              {t("workspace.delete")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullModeNav;
