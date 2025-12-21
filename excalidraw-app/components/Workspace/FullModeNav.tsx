import React, { useState, useEffect, useRef } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const folderIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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

interface FullModeNavProps {
  collections: Collection[];
  activeCollectionId: string | null;
  currentView: DashboardView;
  isAdmin: boolean;
  onDashboardClick: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onMembersClick: () => void;
  onTeamsCollectionsClick: () => void;
  onCollectionClick: (collectionId: string) => void;
  onCreateCollection: () => void;
  onNewScene: (collectionId?: string) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onEditCollection?: (collection: Collection) => void;
}

export const FullModeNav: React.FC<FullModeNavProps> = ({
  collections,
  activeCollectionId,
  currentView,
  isAdmin,
  onDashboardClick,
  onProfileClick,
  onSettingsClick,
  onMembersClick,
  onTeamsCollectionsClick,
  onCollectionClick,
  onCreateCollection,
  onNewScene,
  onDeleteCollection,
  onEditCollection,
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
          {/* Private collection (always first, if exists) */}
          {privateCollection && (
            <button
              className={`full-mode-nav__collection-item ${
                activeCollectionId === privateCollection.id &&
                currentView === "collection"
                  ? "full-mode-nav__collection-item--active"
                  : ""
              }`}
              onClick={() => onCollectionClick(privateCollection.id)}
            >
              <span className="full-mode-nav__collection-icon">{lockIcon}</span>
              <span className="full-mode-nav__collection-name">
                {t("workspace.private")}
              </span>
            </button>
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
                onClick={() => onCollectionClick(collection.id)}
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
                  ref={collectionMenuOpen === collection.id ? menuRef : null}
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
        </div>
      </div>
    </div>
  );
};

export default FullModeNav;
