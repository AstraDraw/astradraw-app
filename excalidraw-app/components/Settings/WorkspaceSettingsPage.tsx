import React, { useState, useRef } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import type { Workspace } from "../../auth/workspaceApi";

import "./WorkspaceSettingsPage.scss";

// Stop keyboard events from propagating
const stopPropagation = (e: React.KeyboardEvent) => {
  e.stopPropagation();
};

interface WorkspaceSettingsPageProps {
  workspace: Workspace | null;
  onUpdateWorkspace?: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
}

export const WorkspaceSettingsPage: React.FC<WorkspaceSettingsPageProps> = ({
  workspace,
  onUpdateWorkspace,
}) => {
  const [name, setName] = useState(workspace?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    if (!workspace || !onUpdateWorkspace) return;

    setIsSaving(true);
    setError(null);
    try {
      await onUpdateWorkspace({ name: name.trim() });
      setIsEditingName(false);
      showSuccess(t("settings.workspaceNameUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to update workspace name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateWorkspace) return;

    // For now, we'll convert to base64 - in production you'd upload to storage
    const reader = new FileReader();
    reader.onload = async () => {
      setIsSaving(true);
      setError(null);
      try {
        await onUpdateWorkspace({ avatarUrl: reader.result as string });
        showSuccess(t("settings.workspaceAvatarUpdated"));
      } catch (err: any) {
        setError(err.message || "Failed to update workspace avatar");
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (!workspace) {
    return (
      <div className="workspace-settings-page">
        <div className="workspace-settings-page__empty">
          <p>{t("settings.noWorkspaceSelected")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-settings-page">
      <div className="workspace-settings-page__container">
        <h1 className="workspace-settings-page__title">
          {t("settings.workspaceSettings")}
        </h1>
        <p className="workspace-settings-page__subtitle">
          {t("settings.workspaceSettingsDescription")}
        </p>

        {/* Success/Error messages */}
        {successMessage && (
          <div className="workspace-settings-page__success">{successMessage}</div>
        )}
        {error && (
          <div className="workspace-settings-page__error-inline">{error}</div>
        )}

        {/* Workspace Avatar */}
        <section className="workspace-settings-page__section">
          <h2 className="workspace-settings-page__section-title">
            {t("settings.workspaceIcon")}
          </h2>
          <div className="workspace-settings-page__avatar-section">
            <div
              className="workspace-settings-page__avatar"
              onClick={handleAvatarClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleAvatarClick();
                }
              }}
            >
              {workspace.avatarUrl ? (
                <img src={workspace.avatarUrl} alt={workspace.name} />
              ) : (
                <div className="workspace-settings-page__avatar-initials">
                  {workspace.name[0].toUpperCase()}
                </div>
              )}
              <div className="workspace-settings-page__avatar-overlay">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <div className="workspace-settings-page__avatar-info">
              <p>{t("settings.workspaceIconDescription")}</p>
              <button
                className="workspace-settings-page__button workspace-settings-page__button--secondary"
                onClick={handleAvatarClick}
                disabled={isSaving}
              >
                {t("settings.changeIcon")}
              </button>
            </div>
          </div>
        </section>

        {/* Workspace Name */}
        <section className="workspace-settings-page__section">
          <h2 className="workspace-settings-page__section-title">
            {t("settings.workspaceName")}
          </h2>
          {isEditingName ? (
            <div className="workspace-settings-page__edit-field">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  stopPropagation(e);
                  if (e.key === "Enter") {
                    handleSaveName();
                  } else if (e.key === "Escape") {
                    setIsEditingName(false);
                    setName(workspace.name);
                  }
                }}
                onKeyUp={stopPropagation}
                placeholder={t("settings.workspaceNamePlaceholder")}
                autoFocus
                className="workspace-settings-page__input"
              />
              <div className="workspace-settings-page__edit-actions">
                <button
                  className="workspace-settings-page__button workspace-settings-page__button--primary"
                  onClick={handleSaveName}
                  disabled={isSaving || !name.trim()}
                >
                  {isSaving ? t("settings.saving") : t("settings.save")}
                </button>
                <button
                  className="workspace-settings-page__button workspace-settings-page__button--secondary"
                  onClick={() => {
                    setIsEditingName(false);
                    setName(workspace.name);
                  }}
                  disabled={isSaving}
                >
                  {t("settings.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="workspace-settings-page__field">
              <span className="workspace-settings-page__field-value">
                {workspace.name}
              </span>
              <button
                className="workspace-settings-page__edit-button"
                onClick={() => setIsEditingName(true)}
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
            </div>
          )}
        </section>

        {/* Workspace URL */}
        <section className="workspace-settings-page__section">
          <h2 className="workspace-settings-page__section-title">
            {t("settings.workspaceUrl")}
          </h2>
          <div className="workspace-settings-page__field workspace-settings-page__field--readonly">
            <span className="workspace-settings-page__field-value workspace-settings-page__field-value--mono">
              {workspace.slug}
            </span>
          </div>
          <p className="workspace-settings-page__field-hint">
            {t("settings.workspaceUrlHint")}
          </p>
        </section>

        {/* Danger Zone */}
        <section className="workspace-settings-page__section workspace-settings-page__section--danger">
          <h2 className="workspace-settings-page__section-title">
            {t("settings.dangerZone")}
          </h2>
          <div className="workspace-settings-page__danger-item">
            <div className="workspace-settings-page__danger-info">
              <h3>{t("settings.deleteWorkspace")}</h3>
              <p>{t("settings.deleteWorkspaceDescription")}</p>
            </div>
            <button
              className="workspace-settings-page__button workspace-settings-page__button--danger-outline"
              onClick={() => {
                // TODO: Implement workspace deletion
                alert("Workspace deletion is not yet implemented");
              }}
            >
              {t("settings.deleteWorkspaceButton")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WorkspaceSettingsPage;

