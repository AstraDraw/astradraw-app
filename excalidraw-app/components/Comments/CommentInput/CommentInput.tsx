/**
 * CommentInput - Reply input area for thread popup
 *
 * Contains:
 * - MentionInput textarea with @mention support
 * - Emoji picker button (placeholder for now)
 * - Send button
 */

import { useState, useCallback, useRef } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { MentionInput } from "../MentionInput";

import styles from "./CommentInput.module.scss";

import type { MentionInputHandle } from "../MentionInput";

export interface CommentInputProps {
  /** Called when user submits a comment */
  onSubmit: (content: string, mentions: string[]) => Promise<void>;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Workspace ID for @mentions */
  workspaceId: string | undefined;
  /** Placeholder text */
  placeholder?: string;
}

export function CommentInput({
  onSubmit,
  isSubmitting = false,
  workspaceId,
  placeholder = "Reply, @mention someone...",
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const inputRef = useRef<MentionInputHandle>(null);

  // Handle content change from MentionInput
  const handleChange = useCallback(
    (newContent: string, newMentions: string[]) => {
      setContent(newContent);
      setMentions(newMentions);
    },
    [],
  );

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) {
      return;
    }

    try {
      await onSubmit(trimmedContent, mentions);
      // Clear input on success
      setContent("");
      setMentions([]);
    } catch (err) {
      // Error handling is done by parent
      console.error("Failed to submit comment:", err);
    }
  }, [content, mentions, isSubmitting, onSubmit]);

  // Check if can submit
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <MentionInput
          ref={inputRef}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          workspaceId={workspaceId}
          disabled={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>

      <div className={styles.toolbar}>
        {/* Left side: Emoji button (placeholder) */}
        <div className={styles.leftTools}>
          <button
            type="button"
            className={styles.toolButton}
            title={t("comments.addEmoji")}
            disabled={isSubmitting}
          >
            <EmojiIcon />
          </button>
        </div>

        {/* Right side: Send button */}
        <button
          type="button"
          className={`${styles.sendButton} ${canSubmit ? styles.active : ""}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
          title={t("comments.send")}
        >
          {isSubmitting ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function EmojiIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={styles.spinner}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
