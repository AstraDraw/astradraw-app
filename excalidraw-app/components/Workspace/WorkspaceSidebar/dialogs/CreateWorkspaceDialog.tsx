import React from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import type { WorkspaceType } from "../../../../auth/workspaceApi";

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  name: string;
  slug: string;
  type: WorkspaceType;
  error: string | null;
  isCreating: boolean;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onTypeChange: (type: WorkspaceType) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  isOpen,
  name,
  slug,
  type,
  error,
  isCreating,
  onNameChange,
  onSlugChange,
  onTypeChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="workspace-sidebar__dialog-overlay" onClick={onClose}>
      <div
        className="workspace-sidebar__dialog workspace-sidebar__dialog--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{t("workspace.createWorkspaceTitle")}</h3>
        <div className="workspace-sidebar__dialog-content">
          <div className="workspace-sidebar__form-group">
            <label>{t("workspace.workspaceNameLabel")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("workspace.workspaceNamePlaceholder")}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && !isCreating) {
                  onSubmit();
                }
              }}
              onKeyUp={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="workspace-sidebar__form-group">
            <label>{t("workspace.workspaceSlugLabel")}</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="my-workspace"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && !isCreating) {
                  onSubmit();
                }
              }}
              onKeyUp={(e) => e.stopPropagation()}
            />
            <span className="workspace-sidebar__form-hint">
              {t("workspace.workspaceSlugHint")}
            </span>
          </div>
          <div className="workspace-sidebar__form-group">
            <label>{t("workspace.workspaceTypeLabel")}</label>
            <div className="workspace-sidebar__type-selector">
              <button
                type="button"
                className={`workspace-sidebar__type-option ${
                  type === "PERSONAL"
                    ? "workspace-sidebar__type-option--active"
                    : ""
                }`}
                onClick={() => onTypeChange("PERSONAL")}
              >
                {t("workspace.workspaceTypePersonal")}
              </button>
              <button
                type="button"
                className={`workspace-sidebar__type-option ${
                  type === "SHARED"
                    ? "workspace-sidebar__type-option--active"
                    : ""
                }`}
                onClick={() => onTypeChange("SHARED")}
              >
                {t("workspace.workspaceTypeShared")}
              </button>
            </div>
          </div>
          {error && (
            <div className="workspace-sidebar__form-error">{error}</div>
          )}
        </div>
        <div className="workspace-sidebar__dialog-actions">
          <button
            className="workspace-sidebar__dialog-cancel"
            onClick={onClose}
          >
            {t("workspace.cancel")}
          </button>
          <button
            className="workspace-sidebar__dialog-confirm"
            onClick={onSubmit}
            disabled={!name.trim() || !slug.trim() || isCreating}
          >
            {isCreating
              ? t("workspace.creating")
              : t("workspace.createWorkspace")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceDialog;
