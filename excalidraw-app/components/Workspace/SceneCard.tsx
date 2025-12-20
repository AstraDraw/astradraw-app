import React from "react";
import type { WorkspaceScene } from "../../auth/workspaceApi";
import "./SceneCard.scss";

// Icons
const trashIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const playIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

interface SceneCardProps {
  scene: WorkspaceScene;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  isActive,
  onOpen,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className={`scene-card ${isActive ? "scene-card--active" : ""}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
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
        <h3 className="scene-card__title">{scene.title}</h3>
        <span className="scene-card__date">{formatDate(scene.updatedAt)}</span>
      </div>

      <div className="scene-card__actions">
        <button
          className="scene-card__delete"
          onClick={handleDeleteClick}
          aria-label="Delete scene"
          title="Delete"
        >
          {trashIcon}
        </button>
      </div>
    </div>
  );
};

export default SceneCard;
