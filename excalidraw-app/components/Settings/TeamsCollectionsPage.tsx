import React, { useState, useEffect, useCallback } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import {
  listTeams,
  listCollections,
  createTeam,
  updateTeam,
  deleteTeam,
  createCollection,
  updateCollection,
  deleteCollection,
  type Team,
  type Collection,
} from "../../auth/workspaceApi";
import { EmojiPicker } from "../EmojiPicker";

import "./TeamsCollectionsPage.scss";

// Stop keyboard events from propagating
const stopPropagation = (e: React.KeyboardEvent) => {
  e.stopPropagation();
};

interface TeamsCollectionsPageProps {
  workspaceId: string | null;
  isAdmin: boolean;
}

type TabType = "teams" | "collections";

const TEAM_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
];

// Default icon for new collections (empty = user must select)
const DEFAULT_COLLECTION_ICON = "";

export const TeamsCollectionsPage: React.FC<TeamsCollectionsPageProps> = ({
  workspaceId,
  isAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("teams");
  const [teams, setTeams] = useState<Team[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create team dialog
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0]);

  // Create collection dialog
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState(
    DEFAULT_COLLECTION_ICON,
  );
  const [newCollectionPrivate, setNewCollectionPrivate] = useState(false);

  // Edit states
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(
    null,
  );

  const loadData = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [teamsData, collectionsData] = await Promise.all([
        listTeams(workspaceId),
        listCollections(workspaceId),
      ]);
      setTeams(teamsData);
      setCollections(collectionsData);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTeam = async () => {
    if (!workspaceId || !newTeamName.trim()) {
      return;
    }

    try {
      const team = await createTeam(workspaceId, {
        name: newTeamName.trim(),
        color: newTeamColor,
      });
      setTeams((prev) => [...prev, team]);
      setShowCreateTeam(false);
      setNewTeamName("");
      setNewTeamColor(TEAM_COLORS[0]);
      showSuccess(t("settings.teamCreated"));
    } catch (err: any) {
      setError(err.message || "Failed to create team");
    }
  };

  const handleUpdateTeam = async (
    teamId: string,
    data: { name?: string; color?: string },
  ) => {
    try {
      const updated = await updateTeam(teamId, data);
      setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
      setEditingTeamId(null);
      showSuccess(t("settings.teamUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to update team");
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(t("settings.confirmDeleteTeam", { name: teamName }))) {
      return;
    }

    try {
      await deleteTeam(teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      showSuccess(t("settings.teamDeleted"));
    } catch (err: any) {
      setError(err.message || "Failed to delete team");
    }
  };

  const handleCreateCollection = async () => {
    if (!workspaceId || !newCollectionName.trim()) {
      return;
    }

    try {
      const collection = await createCollection(workspaceId, {
        name: newCollectionName.trim(),
        icon: newCollectionIcon,
        isPrivate: newCollectionPrivate,
      });
      setCollections((prev) => [...prev, collection]);
      setShowCreateCollection(false);
      setNewCollectionName("");
      setNewCollectionIcon(DEFAULT_COLLECTION_ICON);
      setNewCollectionPrivate(false);
      showSuccess(t("settings.collectionCreated"));
    } catch (err: any) {
      setError(err.message || "Failed to create collection");
    }
  };

  const handleUpdateCollection = async (
    collectionId: string,
    data: { name?: string; icon?: string },
  ) => {
    try {
      const updated = await updateCollection(collectionId, data);
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? updated : c)),
      );
      setEditingCollectionId(null);
      showSuccess(t("settings.collectionUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to update collection");
    }
  };

  const handleDeleteCollection = async (
    collectionId: string,
    collectionName: string,
  ) => {
    if (
      !confirm(t("settings.confirmDeleteCollection", { name: collectionName }))
    ) {
      return;
    }

    try {
      await deleteCollection(collectionId);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      showSuccess(t("settings.collectionDeleted"));
    } catch (err: any) {
      setError(err.message || "Failed to delete collection");
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (!workspaceId) {
    return (
      <div className="teams-collections-page">
        <div className="teams-collections-page__empty">
          <p>{t("settings.noWorkspaceSelected")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teams-collections-page">
      <div className="teams-collections-page__container">
        <h1 className="teams-collections-page__title">
          {t("settings.teamsAndCollections")}
        </h1>
        <p className="teams-collections-page__subtitle">
          {t("settings.teamsAndCollectionsDescription")}
        </p>

        {/* Success/Error messages */}
        {successMessage && (
          <div className="teams-collections-page__success">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="teams-collections-page__error-inline">{error}</div>
        )}

        {/* Tabs */}
        <div className="teams-collections-page__tabs">
          <button
            className={`teams-collections-page__tab ${
              activeTab === "teams" ? "teams-collections-page__tab--active" : ""
            }`}
            onClick={() => setActiveTab("teams")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {t("settings.teams")} ({teams.length})
          </button>
          <button
            className={`teams-collections-page__tab ${
              activeTab === "collections"
                ? "teams-collections-page__tab--active"
                : ""
            }`}
            onClick={() => setActiveTab("collections")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {t("settings.collections")} ({collections.length})
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="teams-collections-page__loading">
            <div className="teams-collections-page__spinner" />
          </div>
        ) : activeTab === "teams" ? (
          <div className="teams-collections-page__content">
            {isAdmin && (
              <button
                className="teams-collections-page__add-button"
                onClick={() => setShowCreateTeam(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t("settings.createTeam")}
              </button>
            )}

            {teams.length === 0 ? (
              <div className="teams-collections-page__empty-list">
                <p>{t("settings.noTeams")}</p>
              </div>
            ) : (
              <div className="teams-collections-page__list">
                {teams.map((team) => (
                  <div key={team.id} className="teams-collections-page__item">
                    <div
                      className="teams-collections-page__item-color"
                      style={{ backgroundColor: team.color }}
                    />
                    <div className="teams-collections-page__item-info">
                      {editingTeamId === team.id ? (
                        <input
                          type="text"
                          defaultValue={team.name}
                          onKeyDown={(e) => {
                            stopPropagation(e);
                            if (e.key === "Enter") {
                              handleUpdateTeam(team.id, {
                                name: e.currentTarget.value,
                              });
                            } else if (e.key === "Escape") {
                              setEditingTeamId(null);
                            }
                          }}
                          onKeyUp={stopPropagation}
                          onBlur={(e) => {
                            if (e.target.value !== team.name) {
                              handleUpdateTeam(team.id, {
                                name: e.target.value,
                              });
                            } else {
                              setEditingTeamId(null);
                            }
                          }}
                          autoFocus
                          className="teams-collections-page__edit-input"
                        />
                      ) : (
                        <span className="teams-collections-page__item-name">
                          {team.name}
                        </span>
                      )}
                      <span className="teams-collections-page__item-meta">
                        {t("settings.teamMembers", {
                          count: team.memberCount || 0,
                        })}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="teams-collections-page__item-actions">
                        <button
                          className="teams-collections-page__action-button"
                          onClick={() => setEditingTeamId(team.id)}
                          title={t("settings.edit")}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="teams-collections-page__action-button teams-collections-page__action-button--danger"
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          title={t("workspace.delete")}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="teams-collections-page__content">
            {isAdmin && (
              <button
                className="teams-collections-page__add-button"
                onClick={() => setShowCreateCollection(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t("settings.createCollection")}
              </button>
            )}

            {collections.length === 0 ? (
              <div className="teams-collections-page__empty-list">
                <p>{t("settings.noCollections")}</p>
              </div>
            ) : (
              <div className="teams-collections-page__list">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="teams-collections-page__item"
                  >
                    <div className="teams-collections-page__item-icon">
                      {collection.icon || "📁"}
                    </div>
                    <div className="teams-collections-page__item-info">
                      {editingCollectionId === collection.id ? (
                        <input
                          type="text"
                          defaultValue={collection.name}
                          onKeyDown={(e) => {
                            stopPropagation(e);
                            if (e.key === "Enter") {
                              handleUpdateCollection(collection.id, {
                                name: e.currentTarget.value,
                              });
                            } else if (e.key === "Escape") {
                              setEditingCollectionId(null);
                            }
                          }}
                          onKeyUp={stopPropagation}
                          onBlur={(e) => {
                            if (e.target.value !== collection.name) {
                              handleUpdateCollection(collection.id, {
                                name: e.target.value,
                              });
                            } else {
                              setEditingCollectionId(null);
                            }
                          }}
                          autoFocus
                          className="teams-collections-page__edit-input"
                        />
                      ) : (
                        <span className="teams-collections-page__item-name">
                          {collection.name}
                        </span>
                      )}
                      <span className="teams-collections-page__item-meta">
                        {collection.isPrivate
                          ? t("settings.privateCollection")
                          : t("settings.sharedCollection")}
                        {collection.sceneCount !== undefined &&
                          ` · ${t("settings.sceneCount", {
                            count: collection.sceneCount,
                          })}`}
                      </span>
                    </div>
                    {isAdmin && !collection.isPrivate && (
                      <div className="teams-collections-page__item-actions">
                        <button
                          className="teams-collections-page__action-button"
                          onClick={() => setEditingCollectionId(collection.id)}
                          title={t("settings.edit")}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="teams-collections-page__action-button teams-collections-page__action-button--danger"
                          onClick={() =>
                            handleDeleteCollection(
                              collection.id,
                              collection.name,
                            )
                          }
                          title={t("workspace.delete")}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Team Dialog */}
      {showCreateTeam && (
        <div
          className="teams-collections-page__dialog-overlay"
          onClick={() => setShowCreateTeam(false)}
        >
          <div
            className="teams-collections-page__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="teams-collections-page__dialog-header">
              <h2>{t("settings.createTeam")}</h2>
              <button
                className="teams-collections-page__dialog-close"
                onClick={() => setShowCreateTeam(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="teams-collections-page__dialog-content">
              <div className="teams-collections-page__form-group">
                <label>{t("settings.teamName")}</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => {
                    stopPropagation(e);
                    if (e.key === "Enter") {
                      handleCreateTeam();
                    }
                  }}
                  onKeyUp={stopPropagation}
                  placeholder={t("settings.teamNamePlaceholder")}
                  autoFocus
                  className="teams-collections-page__input"
                />
              </div>
              <div className="teams-collections-page__form-group">
                <label>{t("settings.teamColor")}</label>
                <div className="teams-collections-page__color-picker">
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`teams-collections-page__color-option ${
                        newTeamColor === color
                          ? "teams-collections-page__color-option--selected"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTeamColor(color)}
                    />
                  ))}
                </div>
              </div>
              <button
                className="teams-collections-page__button teams-collections-page__button--primary"
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
              >
                {t("settings.createTeam")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Dialog */}
      {showCreateCollection && (
        <div
          className="teams-collections-page__dialog-overlay"
          onClick={() => setShowCreateCollection(false)}
        >
          <div
            className="teams-collections-page__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="teams-collections-page__dialog-header">
              <h2>{t("settings.createCollection")}</h2>
              <button
                className="teams-collections-page__dialog-close"
                onClick={() => setShowCreateCollection(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="teams-collections-page__dialog-content">
              <div className="teams-collections-page__form-row">
                <div className="teams-collections-page__form-group teams-collections-page__form-group--icon">
                  <label>{t("settings.collectionIcon")}</label>
                  <EmojiPicker
                    value={newCollectionIcon}
                    onSelect={setNewCollectionIcon}
                  />
                </div>
                <div className="teams-collections-page__form-group teams-collections-page__form-group--name">
                  <label>{t("settings.collectionName")}</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => {
                      stopPropagation(e);
                      if (e.key === "Enter") {
                        handleCreateCollection();
                      }
                    }}
                    onKeyUp={stopPropagation}
                    placeholder={t("settings.collectionNamePlaceholder")}
                    className="teams-collections-page__input"
                  />
                </div>
              </div>
              <div className="teams-collections-page__form-group">
                <label className="teams-collections-page__checkbox-label">
                  <input
                    type="checkbox"
                    checked={newCollectionPrivate}
                    onChange={(e) => setNewCollectionPrivate(e.target.checked)}
                  />
                  <span>{t("settings.privateCollection")}</span>
                </label>
                <p className="teams-collections-page__form-hint">
                  {t("settings.privateCollectionHint")}
                </p>
              </div>
              <button
                className="teams-collections-page__button teams-collections-page__button--primary"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                {t("settings.createCollection")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsCollectionsPage;
