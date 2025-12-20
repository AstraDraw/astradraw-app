import React, { useState, useRef, useEffect } from "react";
import { t } from "@excalidraw/excalidraw/i18n";
import type { WorkspaceScene } from "../../auth/workspaceApi";
import "./SceneCard.scss";

// Icons
const playIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const lockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const moreIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const renameIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const duplicateIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const trashIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface SceneCardProps {
  scene: WorkspaceScene;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onDuplicate: () => void;
  authorName?: string;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  isActive,
  onOpen,
  onDelete,
  onRename,
  onDuplicate,
  authorName,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(scene.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setRenameValue(scene.title);
    setIsRenaming(true);
  };

  const handleRenameSubmit = () => {
    const trimmedValue = renameValue.trim();
    if (trimmedValue && trimmedValue !== scene.title) {
      onRename(trimmedValue);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameValue(scene.title);
    }
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDuplicate();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete();
  };

  return (
    <div
      className={`scene-card ${isActive ? "scene-card--active" : ""}`}
      onClick={onOpen}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !isRenaming && onOpen()}
    >
      <div className="scene-card__thumbnail">
        {scene.thumbnailUrl ? (
          <img src={scene.thumbnailUrl} alt={scene.title} />
        ) : (
          <div className="scene-card__thumbnail-placeholder">
            {playIcon}
          </div>
        )}
      </div>

      <div className="scene-card__info">
        <div className="scene-card__title-row">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              className="scene-card__rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="scene-card__title">{scene.title}</h3>
          )}
          {!scene.isPublic && !isRenaming && (
            <span className="scene-card__private" title="Private">
              {lockIcon}
            </span>
          )}
        </div>
        <div className="scene-card__meta">
          {authorName && (
            <span className="scene-card__author">by {authorName}</span>
          )}
          <span className="scene-card__date">{formatDate(scene.updatedAt)}</span>
        </div>
      </div>

      <div className="scene-card__actions" ref={menuRef}>
        <button
          className="scene-card__menu-trigger"
          onClick={handleMenuClick}
          aria-label="More options"
          title="More options"
        >
          {moreIcon}
        </button>

        {menuOpen && (
          <div className="scene-card__menu">
            <button className="scene-card__menu-item" onClick={handleRenameClick}>
              {renameIcon}
              <span>{t("workspace.rename")}</span>
            </button>
            <button className="scene-card__menu-item" onClick={handleDuplicateClick}>
              {duplicateIcon}
              <span>{t("workspace.duplicate")}</span>
            </button>
            <div className="scene-card__menu-divider" />
            <button className="scene-card__menu-item scene-card__menu-item--danger" onClick={handleDeleteClick}>
              {trashIcon}
              <span>{t("workspace.deleteScene")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneCard;
