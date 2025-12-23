/**
 * ThreadMarker - A single comment thread marker (pin with avatar)
 *
 * Displays as a pin shape with the thread creator's avatar.
 * Hover shows tooltip with preview, click opens thread popup.
 */

import { useState, useCallback } from "react";

import { ThreadMarkerTooltip } from "../ThreadMarkerTooltip/ThreadMarkerTooltip";

import styles from "./ThreadMarker.module.scss";

import type { CommentThread } from "../../../auth/api/types";

export interface ThreadMarkerProps {
  /** Thread data */
  thread: CommentThread;
  /** Viewport X position */
  x: number;
  /** Viewport Y position */
  y: number;
  /** Whether this marker is currently selected */
  isSelected: boolean;
  /** Click handler to select this thread */
  onClick: () => void;
}

export function ThreadMarker({
  thread,
  x,
  y,
  isSelected,
  onClick,
}: ThreadMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  // Get first letter of name for fallback avatar
  const avatarFallback = thread.createdBy.name?.charAt(0).toUpperCase() || "?";
  const hasAvatar = !!thread.createdBy.avatar;

  return (
    <div
      className={`${styles.marker} ${isSelected ? styles.selected : ""} ${
        isHovered ? styles.hovered : ""
      }`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className={styles.pin}>
        {hasAvatar ? (
          <img
            src={thread.createdBy.avatar}
            alt={thread.createdBy.name || "User"}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarFallback}>{avatarFallback}</div>
        )}
      </div>

      {/* Tooltip on hover */}
      {isHovered && !isSelected && <ThreadMarkerTooltip thread={thread} />}
    </div>
  );
}
