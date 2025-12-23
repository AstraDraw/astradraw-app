/**
 * InlineEmojiPicker - Simple emoji picker popup for comment input
 *
 * Shows a grid of popular emojis that can be inserted into comment text.
 */

import { useEffect, useRef, useCallback } from "react";

import styles from "./InlineEmojiPicker.module.scss";

// Popular emojis for quick access
const POPULAR_EMOJIS = [
  "👍",
  "👎",
  "❤️",
  "😀",
  "😂",
  "🎉",
  "🔥",
  "👀",
  "✅",
  "❌",
  "⭐",
  "💡",
  "🚀",
  "💪",
  "🙏",
  "👏",
  "🤔",
  "😊",
  "😍",
  "🥳",
  "😎",
  "🤝",
  "💯",
  "✨",
];

export interface InlineEmojiPickerProps {
  /** Called when an emoji is selected */
  onSelect: (emoji: string) => void;
  /** Called when picker should close */
  onClose: () => void;
}

export function InlineEmojiPicker({
  onSelect,
  onClose,
}: InlineEmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // Add listener with small delay to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onSelect(emoji);
    },
    [onSelect],
  );

  return (
    <div ref={pickerRef} className={styles.picker}>
      <div className={styles.grid}>
        {POPULAR_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={styles.emoji}
            onClick={() => handleEmojiClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

