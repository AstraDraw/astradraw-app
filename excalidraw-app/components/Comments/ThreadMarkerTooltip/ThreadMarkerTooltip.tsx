/**
 * ThreadMarkerTooltip - Hover preview for comment thread markers
 *
 * Shows author name, first comment preview, and reply count on hover.
 */

import styles from "./ThreadMarkerTooltip.module.scss";

import type { CommentThread } from "../../../auth/api/types";

export interface ThreadMarkerTooltipProps {
  /** Thread data */
  thread: CommentThread;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}…`;
}

export function ThreadMarkerTooltip({ thread }: ThreadMarkerTooltipProps) {
  const firstComment = thread.comments[0];
  const replyCount = thread.commentCount - 1;

  return (
    <div className={styles.tooltip}>
      <div className={styles.header}>
        <span className={styles.author}>{thread.createdBy.name || "User"}</span>
        {replyCount > 0 && (
          <span className={styles.replyCount}>
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>
      {firstComment && (
        <p className={styles.preview}>
          {truncateText(firstComment.content, 100)}
        </p>
      )}
    </div>
  );
}
