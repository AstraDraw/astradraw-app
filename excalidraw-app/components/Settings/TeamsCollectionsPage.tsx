import React, { useState, useEffect, useCallback, useMemo } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtomValue } from "../../app-jotai";

import {
  listTeams,
  listCollections,
  listWorkspaceMembers,
  listCollectionTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  createCollection,
  updateCollection,
  deleteCollection,
  setCollectionTeamAccess,
  removeCollectionTeamAccess,
  type Team,
  type Collection,
  type WorkspaceMember,
  type CollectionTeamAccess,
} from "../../auth/workspaceApi";
import { EmojiPicker } from "../EmojiPicker";

import { collectionsRefreshAtom } from "./settingsState";

import "./TeamsCollectionsPage.scss";

// Stop keyboard events from propagating
const stopPropagation = (e: React.KeyboardEvent) => {
  e.stopPropagation();
};

interface TeamsCollectionsPageProps {
  workspaceId: string | null;
  isAdmin: boolean;
}

const TEAM_COLORS = [
  "#ef4444",
  "#f97316",
  "#ec4899",
  "#a855f7",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#f59e0b",
  "#fb923c",
];

// Default icon for new collections (empty = user must select)
const DEFAULT_COLLECTION_ICON = "";

// Extended collection with team access info
interface CollectionWithTeams extends Collection {
  teamAccess?: CollectionTeamAccess[];
}

export const TeamsCollectionsPage: React.FC<TeamsCollectionsPageProps> = ({
  workspaceId,
  isAdmin,
}) => {
  // Subscribe to collections refresh trigger from other components (e.g., sidebar)
  const collectionsRefresh = useAtomValue(collectionsRefreshAtom);

  const [teams, setTeams] = useState<Team[]>([]);
  const [collections, setCollections] = useState<CollectionWithTeams[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Team dialog state
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    [],
  );

  // Collection dialog state
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState(
    DEFAULT_COLLECTION_ICON,
  );
  const [newCollectionPrivate, setNewCollectionPrivate] = useState(false);

  // Collection team access dialog state
  const [showCollectionTeamsDialog, setShowCollectionTeamsDialog] =
    useState(false);
  const [editingCollection, setEditingCollection] =
    useState<CollectionWithTeams | null>(null);

  // Inline edit states
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(
    null,
  );

  // Count admin members (they are automatically part of every team)
  const adminMembers = useMemo(
    () => members.filter((m) => m.role === "ADMIN"),
    [members],
  );

  const loadData = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [teamsData, collectionsData, membersData] = await Promise.all([
        listTeams(workspaceId),
        listCollections(workspaceId),
        listWorkspaceMembers(workspaceId),
      ]);
      setTeams(teamsData);
      setMembers(membersData);

      // Load team access for each non-private collection
      const collectionsWithTeams: CollectionWithTeams[] = await Promise.all(
        collectionsData.map(async (collection) => {
          if (collection.isPrivate) {
            return { ...collection, teamAccess: [] };
          }
          try {
            const teamAccess = await listCollectionTeams(
              workspaceId,
              collection.id,
            );
            return { ...collection, teamAccess };
          } catch {
            return { ...collection, teamAccess: [] };
          }
        }),
      );
      setCollections(collectionsWithTeams);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData, collectionsRefresh]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Calculate effective member count (explicit members + admins)
  const getEffectiveMemberCount = useCallback(
    (team: Team) => {
      // Get explicit non-admin members from team
      const explicitMemberIds = new Set(team.members?.map((m) => m.id) || []);
      // Count admins that are not already explicit members
      const adminCount = adminMembers.filter(
        (admin) => !explicitMemberIds.has(admin.id),
      ).length;
      return (team.memberCount || 0) + adminCount;
    },
    [adminMembers],
  );

  // =========================================================================
  // Team handlers
  // =========================================================================

  const openCreateTeamDialog = () => {
    setEditingTeam(null);
    setTeamName("");
    setTeamColor(TEAM_COLORS[0]);
    setSelectedMemberIds([]);
    setSelectedCollectionIds([]);
    setShowTeamDialog(true);
  };

  const openEditTeamDialog = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamColor(team.color);
    // Extract member IDs from team.members
    setSelectedMemberIds(team.members?.map((m) => m.id) || []);
    // Extract collection IDs from team.collections
    setSelectedCollectionIds(team.collections?.map((c) => c.id) || []);
    setShowTeamDialog(true);
  };

  const closeTeamDialog = () => {
    setShowTeamDialog(false);
    setEditingTeam(null);
  };

  const handleSaveTeam = async () => {
    if (!workspaceId || !teamName.trim()) {
      return;
    }

    try {
      if (editingTeam) {
        // Update existing team
        const updated = await updateTeam(editingTeam.id, {
          name: teamName.trim(),
          color: teamColor,
          memberIds: selectedMemberIds,
          collectionIds: selectedCollectionIds,
        });
        setTeams((prev) =>
          prev.map((t) => (t.id === editingTeam.id ? updated : t)),
        );
        showSuccess(t("settings.teamUpdated"));
      } else {
        // Create new team
        const team = await createTeam(workspaceId, {
          name: teamName.trim(),
          color: teamColor,
          memberIds: selectedMemberIds,
          collectionIds: selectedCollectionIds,
        });
        setTeams((prev) => [...prev, team]);
        showSuccess(t("settings.teamCreated"));
      }
      closeTeamDialog();
      // Reload to get updated collection team access
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save team");
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
      // Reload to update collection team access
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete team");
    }
  };

  const handleInlineTeamNameUpdate = async (
    teamId: string,
    newName: string,
  ) => {
    if (!newName.trim()) {
      setEditingTeamId(null);
      return;
    }
    try {
      const updated = await updateTeam(teamId, { name: newName.trim() });
      setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
      setEditingTeamId(null);
      showSuccess(t("settings.teamUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to update team");
    }
  };

  // =========================================================================
  // Collection handlers
  // =========================================================================

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
      setCollections((prev) => [...prev, { ...collection, teamAccess: [] }]);
      setShowCreateCollection(false);
      setNewCollectionName("");
      setNewCollectionIcon(DEFAULT_COLLECTION_ICON);
      setNewCollectionPrivate(false);
      showSuccess(t("settings.collectionCreated"));
    } catch (err: any) {
      setError(err.message || "Failed to create collection");
    }
  };

  const handleInlineCollectionNameUpdate = async (
    collectionId: string,
    newName: string,
  ) => {
    if (!newName.trim()) {
      setEditingCollectionId(null);
      return;
    }
    try {
      const updated = await updateCollection(collectionId, {
        name: newName.trim(),
      });
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, ...updated } : c)),
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

  // =========================================================================
  // Collection Team Access handlers
  // =========================================================================

  const openCollectionTeamsDialog = (collection: CollectionWithTeams) => {
    setEditingCollection(collection);
    setShowCollectionTeamsDialog(true);
  };

  const closeCollectionTeamsDialog = () => {
    setShowCollectionTeamsDialog(false);
    setEditingCollection(null);
  };

  const handleToggleCollectionTeamAccess = async (
    collectionId: string,
    teamId: string,
    hasAccess: boolean,
  ) => {
    if (!workspaceId) {
      return;
    }

    try {
      if (hasAccess) {
        // Remove access
        await removeCollectionTeamAccess(workspaceId, collectionId, teamId);
      } else {
        // Add access
        await setCollectionTeamAccess(
          workspaceId,
          collectionId,
          teamId,
          "EDIT",
        );
      }

      // Update local state
      const updatedTeamAccess = await listCollectionTeams(
        workspaceId,
        collectionId,
      );
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, teamAccess: updatedTeamAccess } : c,
        ),
      );

      // Update editing collection if open
      if (editingCollection?.id === collectionId) {
        setEditingCollection((prev) =>
          prev ? { ...prev, teamAccess: updatedTeamAccess } : null,
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to update team access");
    }
  };

  // =========================================================================
  // Helper functions
  // =========================================================================

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const toggleCollectionSelection = (collectionId: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId],
    );
  };

  const isAdminMember = (member: WorkspaceMember) => {
    return member.role === "ADMIN";
  };

  // Filter out private collections for team assignment
  const nonPrivateCollections = collections.filter((c) => !c.isPrivate);

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
        <div className="teams-collections-page__header">
          <div>
            <h1 className="teams-collections-page__title">
              {t("settings.teamsAndCollections")}
            </h1>
            <p className="teams-collections-page__subtitle">
              {t("settings.teamsAndCollectionsDescription")}
            </p>
          </div>
          {isAdmin && (
            <button
              className="teams-collections-page__header-button"
              onClick={openCreateTeamDialog}
            >
              {t("settings.createTeam")}
            </button>
          )}
        </div>

        {/* Separator after header */}
        <div className="teams-collections-page__separator" />

        {/* Success/Error messages */}
        {successMessage && (
          <div className="teams-collections-page__success">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="teams-collections-page__error-inline">{error}</div>
        )}

        {isLoading ? (
          <div className="teams-collections-page__loading">
            <div className="teams-collections-page__spinner" />
          </div>
        ) : (
          <>
            {/* Teams Section */}
            <section className="teams-collections-page__section">
              <h2 className="teams-collections-page__section-title">
                {t("settings.teams")}
              </h2>

              {teams.length === 0 ? (
                <div className="teams-collections-page__empty-section">
                  <p>{t("settings.noTeams")}</p>
                  {isAdmin && (
                    <button
                      className="teams-collections-page__add-button"
                      onClick={openCreateTeamDialog}
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
                </div>
              ) : (
                <div className="teams-collections-page__table">
                  <div className="teams-collections-page__table-header">
                    <div className="teams-collections-page__table-cell teams-collections-page__table-cell--team">
                      {t("settings.teams")}
                    </div>
                    <div className="teams-collections-page__table-cell teams-collections-page__table-cell--members">
                      {t("settings.teamMembersLabel")}
                    </div>
                    <div className="teams-collections-page__table-cell teams-collections-page__table-cell--actions" />
                  </div>
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="teams-collections-page__table-row teams-collections-page__table-row--clickable"
                      onClick={() => isAdmin && openEditTeamDialog(team)}
                    >
                      <div className="teams-collections-page__table-cell teams-collections-page__table-cell--team">
                        <div
                          className="teams-collections-page__team-color"
                          style={{ backgroundColor: team.color }}
                        />
                        {editingTeamId === team.id ? (
                          <input
                            type="text"
                            defaultValue={team.name}
                            onKeyDown={(e) => {
                              stopPropagation(e);
                              if (e.key === "Enter") {
                                handleInlineTeamNameUpdate(
                                  team.id,
                                  e.currentTarget.value,
                                );
                              } else if (e.key === "Escape") {
                                setEditingTeamId(null);
                              }
                            }}
                            onKeyUp={stopPropagation}
                            onBlur={(e) => {
                              if (e.target.value !== team.name) {
                                handleInlineTeamNameUpdate(
                                  team.id,
                                  e.target.value,
                                );
                              } else {
                                setEditingTeamId(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="teams-collections-page__inline-input"
                          />
                        ) : (
                          <span className="teams-collections-page__team-name">
                            {team.name}
                          </span>
                        )}
                      </div>
                      <div className="teams-collections-page__table-cell teams-collections-page__table-cell--members">
                        {t("settings.teamMemberCount", {
                          count: getEffectiveMemberCount(team),
                        })}
                      </div>
                      <div className="teams-collections-page__table-cell teams-collections-page__table-cell--actions">
                        {isAdmin && (
                          <>
                            <button
                              className="teams-collections-page__action-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTeamDialog(team);
                              }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team.id, team.name);
                              }}
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
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Collections Section */}
            <section className="teams-collections-page__section">
              <div className="teams-collections-page__section-header">
                <h2 className="teams-collections-page__section-title">
                  {t("settings.collections")}
                </h2>
                {isAdmin && (
                  <button
                    className="teams-collections-page__add-button teams-collections-page__add-button--inline"
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
              </div>

              {collections.length === 0 ? (
                <div className="teams-collections-page__empty-section">
                  <p>{t("settings.noCollections")}</p>
                </div>
              ) : (
                <div className="teams-collections-page__table">
                  <div className="teams-collections-page__table-header">
                    <div className="teams-collections-page__table-cell teams-collections-page__table-cell--collection">
                      {t("settings.collections")}
                    </div>
                    <div className="teams-collections-page__table-cell teams-collections-page__table-cell--access">
                      {t("settings.collectionAccess")}
                    </div>
                    <div className="teams-collections-page__table-cell teams-collections-page__table-cell--actions" />
                  </div>
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="teams-collections-page__table-row"
                    >
                      <div className="teams-collections-page__table-cell teams-collections-page__table-cell--collection">
                        <span className="teams-collections-page__collection-icon">
                          {collection.icon || "📁"}
                        </span>
                        {editingCollectionId === collection.id ? (
                          <input
                            type="text"
                            defaultValue={collection.name}
                            onKeyDown={(e) => {
                              stopPropagation(e);
                              if (e.key === "Enter") {
                                handleInlineCollectionNameUpdate(
                                  collection.id,
                                  e.currentTarget.value,
                                );
                              } else if (e.key === "Escape") {
                                setEditingCollectionId(null);
                              }
                            }}
                            onKeyUp={stopPropagation}
                            onBlur={(e) => {
                              if (e.target.value !== collection.name) {
                                handleInlineCollectionNameUpdate(
                                  collection.id,
                                  e.target.value,
                                );
                              } else {
                                setEditingCollectionId(null);
                              }
                            }}
                            autoFocus
                            className="teams-collections-page__inline-input"
                          />
                        ) : (
                          <span className="teams-collections-page__collection-name">
                            {collection.name}
                          </span>
                        )}
                      </div>
                      <div className="teams-collections-page__table-cell teams-collections-page__table-cell--access">
                        {collection.isPrivate ? (
                          <span className="teams-collections-page__access-badge teams-collections-page__access-badge--private">
                            {t("settings.privateCollection")}
                          </span>
                        ) : collection.teamAccess &&
                          collection.teamAccess.length > 0 ? (
                          <div className="teams-collections-page__team-chips">
                            {collection.teamAccess.map((ta) => (
                              <span
                                key={ta.teamId}
                                className="teams-collections-page__team-chip"
                                style={{ backgroundColor: ta.teamColor }}
                              >
                                {ta.teamName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="teams-collections-page__access-badge teams-collections-page__access-badge--everyone">
                            {t("settings.allMembers")}
                          </span>
                        )}
                      </div>
                      <div className="teams-collections-page__table-cell teams-collections-page__table-cell--actions">
                        {isAdmin && !collection.isPrivate && (
                          <button
                            className="teams-collections-page__action-button"
                            onClick={() =>
                              openCollectionTeamsDialog(collection)
                            }
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
                        )}
                        {isAdmin && (
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Team Create/Edit Dialog */}
      {showTeamDialog && (
        <div
          className="teams-collections-page__dialog-overlay"
          onClick={closeTeamDialog}
        >
          <div
            className="teams-collections-page__dialog teams-collections-page__dialog--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="teams-collections-page__dialog-header">
              <h2>
                {editingTeam
                  ? t("settings.editTeam")
                  : t("settings.createTeam")}
              </h2>
              <button
                className="teams-collections-page__dialog-close"
                onClick={closeTeamDialog}
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
            <div className="teams-collections-page__dialog-content teams-collections-page__dialog-content--two-column">
              {/* Left Column: Name, Color, Collections */}
              <div className="teams-collections-page__dialog-column">
                <div className="teams-collections-page__form-group">
                  <label>{t("settings.teamNameLabel")}</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onKeyDown={(e) => {
                      stopPropagation(e);
                      if (e.key === "Enter") {
                        handleSaveTeam();
                      }
                    }}
                    onKeyUp={stopPropagation}
                    placeholder={t("settings.teamNamePlaceholder")}
                    autoFocus
                    className="teams-collections-page__input"
                  />
                </div>

                <div className="teams-collections-page__form-group">
                  <label>{t("settings.teamColorLabel")}</label>
                  <div className="teams-collections-page__color-picker">
                    {TEAM_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`teams-collections-page__color-option ${
                          teamColor === color
                            ? "teams-collections-page__color-option--selected"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTeamColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="teams-collections-page__form-group teams-collections-page__form-group--grow">
                  <label>{t("settings.teamCollectionsLabel")}</label>
                  <p className="teams-collections-page__form-hint">
                    {t("settings.teamCollectionsDescription")}
                  </p>
                  {nonPrivateCollections.length === 0 ? (
                    <div className="teams-collections-page__empty-list">
                      <p>{t("settings.noCollectionsYet")}</p>
                      <button
                        className="teams-collections-page__add-button"
                        onClick={() => {
                          closeTeamDialog();
                          setShowCreateCollection(true);
                        }}
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
                    </div>
                  ) : (
                    <div className="teams-collections-page__member-list">
                      {nonPrivateCollections.map((collection) => (
                        <div
                          key={collection.id}
                          className="teams-collections-page__member-row"
                          onClick={() =>
                            toggleCollectionSelection(collection.id)
                          }
                        >
                          <span className="teams-collections-page__collection-icon">
                            {collection.icon || "📁"}
                          </span>
                          <span className="teams-collections-page__member-name">
                            {collection.name}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedCollectionIds.includes(
                              collection.id,
                            )}
                            onChange={() =>
                              toggleCollectionSelection(collection.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="teams-collections-page__row-checkbox"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Members */}
              <div className="teams-collections-page__dialog-column">
                <div className="teams-collections-page__form-group teams-collections-page__form-group--grow">
                  <label>{t("settings.teamMembersLabel")}</label>
                  <p className="teams-collections-page__form-hint">
                    {t("settings.teamMembersDialogHint")}
                  </p>

                  <div className="teams-collections-page__member-list">
                    {members.map((member) => {
                      const memberIsAdmin = isAdminMember(member);
                      return (
                        <div
                          key={member.id}
                          className={`teams-collections-page__member-row ${
                            memberIsAdmin
                              ? "teams-collections-page__member-row--disabled"
                              : ""
                          }`}
                          title={
                            memberIsAdmin
                              ? t("settings.adminAlwaysInTeam")
                              : undefined
                          }
                          onClick={() => {
                            if (!memberIsAdmin) {
                              toggleMemberSelection(member.id);
                            }
                          }}
                        >
                          {member.user.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt=""
                              className="teams-collections-page__member-avatar"
                            />
                          ) : (
                            <div className="teams-collections-page__member-avatar teams-collections-page__member-avatar--placeholder">
                              {(member.user.name || member.user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <span className="teams-collections-page__member-name">
                            {member.user.name || member.user.email}
                          </span>
                          {memberIsAdmin && (
                            <span className="teams-collections-page__role-badge">
                              {t("settings.roleAdmin")}
                            </span>
                          )}
                          <input
                            type="checkbox"
                            checked={
                              memberIsAdmin ||
                              selectedMemberIds.includes(member.id)
                            }
                            onChange={() => {
                              if (!memberIsAdmin) {
                                toggleMemberSelection(member.id);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={memberIsAdmin}
                            className="teams-collections-page__row-checkbox"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="teams-collections-page__dialog-footer">
              <button
                className="teams-collections-page__button"
                onClick={closeTeamDialog}
              >
                {t("settings.cancel")}
              </button>
              <button
                className="teams-collections-page__button teams-collections-page__button--primary"
                onClick={handleSaveTeam}
                disabled={!teamName.trim()}
              >
                {editingTeam ? t("settings.save") : t("settings.createTeam")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Team Access Dialog */}
      {showCollectionTeamsDialog && editingCollection && (
        <div
          className="teams-collections-page__dialog-overlay"
          onClick={closeCollectionTeamsDialog}
        >
          <div
            className="teams-collections-page__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="teams-collections-page__dialog-header">
              <h2>
                {t("settings.collectionTitle", {
                  name: editingCollection.name,
                })}
              </h2>
              <button
                className="teams-collections-page__dialog-close"
                onClick={closeCollectionTeamsDialog}
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
                <label>{t("settings.teams")}</label>
                <p className="teams-collections-page__form-hint">
                  {t("settings.collectionTeamsDescription")}
                </p>

                {teams.length === 0 ? (
                  <div className="teams-collections-page__empty-list">
                    <p>{t("settings.noTeamsYet")}</p>
                    <button
                      className="teams-collections-page__add-button"
                      onClick={() => {
                        closeCollectionTeamsDialog();
                        openCreateTeamDialog();
                      }}
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
                  </div>
                ) : (
                  <div className="teams-collections-page__member-list">
                    {teams.map((team) => {
                      const hasAccess = editingCollection.teamAccess?.some(
                        (ta) => ta.teamId === team.id,
                      );
                      return (
                        <label
                          key={team.id}
                          className="teams-collections-page__member-row"
                        >
                          <div
                            className="teams-collections-page__team-color"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="teams-collections-page__member-name">
                            {team.name}
                          </span>
                          <input
                            type="checkbox"
                            checked={hasAccess}
                            onChange={() =>
                              handleToggleCollectionTeamAccess(
                                editingCollection.id,
                                team.id,
                                hasAccess || false,
                              )
                            }
                            className="teams-collections-page__row-checkbox"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="teams-collections-page__dialog-footer">
              <button
                className="teams-collections-page__button teams-collections-page__button--primary"
                onClick={closeCollectionTeamsDialog}
              >
                {t("settings.close")}
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
                className="teams-collections-page__button teams-collections-page__button--primary teams-collections-page__button--full"
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
