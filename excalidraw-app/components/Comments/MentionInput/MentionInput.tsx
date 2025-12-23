/**
 * MentionInput - Textarea with @mention autocomplete
 *
 * Features:
 * - Type @ to trigger user autocomplete
 * - Click @ button to trigger autocomplete
 * - Stores mentions as @[Name](userId) format in text
 * - Returns mentions array of user IDs
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useWorkspaceMembers } from "../../../hooks/useWorkspaceMembers";

import styles from "./MentionInput.module.scss";

import type { MentionableUser } from "../../../hooks/useWorkspaceMembers";

export interface MentionInputProps {
  /** Current input value */
  value: string;
  /** Called when value changes */
  onChange: (value: string, mentions: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Workspace ID for fetching members */
  workspaceId: string | undefined;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Called when Enter is pressed (without shift) */
  onSubmit?: () => void;
}

export interface MentionInputHandle {
  focus: () => void;
  insertMention: (user: MentionableUser) => void;
}

/**
 * Extract mention user IDs from text content
 */
function extractMentions(text: string): string[] {
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionPattern.exec(text)) !== null) {
    mentions.push(match[2]); // User ID
  }

  return [...new Set(mentions)]; // Deduplicate
}

export const MentionInput = forwardRef<MentionInputHandle, MentionInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      workspaceId,
      disabled = false,
      autoFocus = false,
      onSubmit,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(
      null,
    );

    const { members, isLoading } = useWorkspaceMembers({
      workspaceId,
      enabled: !!workspaceId,
    });

    // Filter members based on search query
    const filteredMembers = members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      insertMention: (user: MentionableUser) => {
        insertMentionAtCursor(user);
      },
    }));

    // Insert mention at current cursor position
    const insertMentionAtCursor = useCallback(
      (user: MentionableUser) => {
        const textarea = textareaRef.current;
        if (!textarea) {
          return;
        }

        const start = mentionStartIndex ?? textarea.selectionStart;
        const beforeMention = value.slice(0, start);
        const afterMention = value.slice(textarea.selectionStart);

        // Format: @[Name](userId)
        const mention = `@[${user.name}](${user.id}) `;
        const newValue = beforeMention + mention + afterMention;
        const newCursorPos = beforeMention.length + mention.length;

        onChange(newValue, extractMentions(newValue));

        // Reset dropdown state
        setShowDropdown(false);
        setSearchQuery("");
        setMentionStartIndex(null);
        setSelectedIndex(0);

        // Restore focus and cursor position
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      },
      [value, onChange, mentionStartIndex],
    );

    // Auto-resize textarea based on content
    const autoResize = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight (content height)
      const newHeight = Math.min(textarea.scrollHeight, 120); // max 120px
      textarea.style.height = `${newHeight}px`;
    }, []);

    // Auto-resize when value changes
    useEffect(() => {
      autoResize();
    }, [value, autoResize]);

    // Handle text input
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart;

        // Check if user just typed @
        const lastChar = newValue[cursorPos - 1];
        const charBefore = newValue[cursorPos - 2];

        if (lastChar === "@" && (!charBefore || /\s/.test(charBefore))) {
          // Start mention mode
          setShowDropdown(true);
          setMentionStartIndex(cursorPos - 1);
          setSearchQuery("");
          setSelectedIndex(0);
        } else if (showDropdown && mentionStartIndex !== null) {
          // Update search query while in mention mode
          const query = newValue.slice(mentionStartIndex + 1, cursorPos);

          // Close dropdown if user typed space or deleted the @
          if (
            query.includes(" ") ||
            !newValue.includes("@", mentionStartIndex)
          ) {
            setShowDropdown(false);
            setMentionStartIndex(null);
            setSearchQuery("");
          } else {
            setSearchQuery(query);
            setSelectedIndex(0);
          }
        }

        onChange(newValue, extractMentions(newValue));
      },
      [showDropdown, mentionStartIndex, onChange],
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Always stop propagation to prevent canvas shortcuts
        e.stopPropagation();

        if (showDropdown && filteredMembers.length > 0) {
          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev < filteredMembers.length - 1 ? prev + 1 : 0,
              );
              return;
            case "ArrowUp":
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredMembers.length - 1,
              );
              return;
            case "Enter":
            case "Tab":
              e.preventDefault();
              insertMentionAtCursor(filteredMembers[selectedIndex]);
              return;
            case "Escape":
              e.preventDefault();
              setShowDropdown(false);
              setMentionStartIndex(null);
              return;
          }
        }

        // Submit on Enter (without shift)
        if (e.key === "Enter" && !e.shiftKey && !showDropdown) {
          e.preventDefault();
          onSubmit?.();
        }

        // Close dropdown on Escape
        if (e.key === "Escape" && !showDropdown) {
          // Let parent handle escape
        }
      },
      [
        showDropdown,
        filteredMembers,
        selectedIndex,
        insertMentionAtCursor,
        onSubmit,
      ],
    );

    // Handle clicking a member in dropdown
    const handleMemberClick = useCallback(
      (member: MentionableUser) => {
        insertMentionAtCursor(member);
      },
      [insertMentionAtCursor],
    );

    // Handle @ button click
    const handleAtButtonClick = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      // Insert @ at cursor and trigger dropdown
      const cursorPos = textarea.selectionStart;
      const beforeCursor = value.slice(0, cursorPos);
      const afterCursor = value.slice(cursorPos);

      // Add space before @ if needed
      const needsSpace = beforeCursor.length > 0 && !/\s$/.test(beforeCursor);
      const newValue = beforeCursor + (needsSpace ? " @" : "@") + afterCursor;
      const newCursorPos = cursorPos + (needsSpace ? 2 : 1);

      onChange(newValue, extractMentions(newValue));
      setShowDropdown(true);
      setMentionStartIndex(newCursorPos - 1);
      setSearchQuery("");
      setSelectedIndex(0);

      // Focus and position cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }, [value, onChange]);

    // Close dropdown when clicking outside
    useEffect(() => {
      if (!showDropdown) {
        return;
      }

      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(e.target as Node)
        ) {
          setShowDropdown(false);
          setMentionStartIndex(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showDropdown]);

    // Scroll selected item into view
    useEffect(() => {
      if (!showDropdown || !dropdownRef.current) {
        return;
      }

      const selectedItem = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }, [selectedIndex, showDropdown]);

    return (
      <div className={styles.container}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => e.stopPropagation()}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={1}
        />

        {/* Dropdown */}
        {showDropdown && (
          <div ref={dropdownRef} className={styles.dropdown}>
            {isLoading ? (
              <div className={styles.loading}>
                {t("comments.loadingMembers")}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className={styles.empty}>
                {searchQuery
                  ? t("comments.noMembersFound")
                  : t("comments.typeToSearch")}
              </div>
            ) : (
              filteredMembers.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  className={`${styles.memberItem} ${
                    index === selectedIndex ? styles.selected : ""
                  }`}
                  onClick={() => handleMemberClick(member)}
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className={styles.memberAvatar}
                    />
                  ) : (
                    <div className={styles.memberAvatarFallback}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberEmail}>{member.email}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);
