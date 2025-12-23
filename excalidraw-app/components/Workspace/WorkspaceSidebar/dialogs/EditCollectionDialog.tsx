import React from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { EmojiPicker } from "../../../EmojiPicker";

import type { Collection } from "../../../../auth/workspaceApi";

interface EditCollectionDialogProps {
  collection: Collection | null;
  name: string;
  icon: string;
  onNameChange: (name: string) => void;
  onIconChange: (icon: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const EditCollectionDialog: React.FC<EditCollectionDialogProps> = ({
  collection,
  name,
  icon,
  onNameChange,
  onIconChange,
  onSubmit,
  onClose,
}) => {
  if (!collection) {
    return null;
  }

  return (
    <div className="workspace-sidebar__dialog-overlay" onClick={onClose}>
      <div
        className="workspace-sidebar__dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{t("workspace.editCollection")}</h3>
        <div className="workspace-sidebar__dialog-content">
          <div className="workspace-sidebar__form-row">
            <div className="workspace-sidebar__form-group workspace-sidebar__form-group--icon">
              <label>{t("workspace.icon")}</label>
              <EmojiPicker value={icon} onSelect={onIconChange} />
            </div>
            <div className="workspace-sidebar__form-group workspace-sidebar__form-group--name">
              <label>{t("workspace.collectionName")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={t("workspace.collectionNamePlaceholder")}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    onSubmit();
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
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
            disabled={!name.trim()}
          >
            {t("settings.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCollectionDialog;
