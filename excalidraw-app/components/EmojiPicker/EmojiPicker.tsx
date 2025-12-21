import React, { useState, useEffect, useCallback, useRef } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import {
  fetchEmojiData,
  searchEmojis,
  getPopularEmojis,
  EMOJI_GROUPS,
  type TwemojiItem,
  type TwemojiGroup,
  type EmojiGroupSlug,
} from "../Stickers/twemojiApi";

import "./EmojiPicker.scss";

interface EmojiPickerProps {
  value: string;
  onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  value,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] =
    useState<EmojiGroupSlug>("smileys_emotion");
  const [emojiGroups, setEmojiGroups] = useState<TwemojiGroup[]>([]);
  const [searchResults, setSearchResults] = useState<TwemojiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularEmojis] = useState<TwemojiItem[]>(getPopularEmojis());

  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load emoji data on mount
  useEffect(() => {
    const loadEmojis = async () => {
      setLoading(true);
      try {
        const data = await fetchEmojiData();
        setEmojiGroups(data);
      } catch (err) {
        console.error("Failed to load emoji data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEmojis();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchEmojis(searchQuery);
        setSearchResults(results.slice(0, 50)); // Limit results
      } catch (err) {
        console.error("Failed to search emojis:", err);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when picker opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onSelect],
  );

  const handleRandom = useCallback(async () => {
    try {
      const data =
        emojiGroups.length > 0 ? emojiGroups : await fetchEmojiData();
      const allEmojis = data.flatMap((g) => g.emojis);
      if (allEmojis.length > 0) {
        const randomEmoji =
          allEmojis[Math.floor(Math.random() * allEmojis.length)];
        onSelect(randomEmoji.emoji);
      }
    } catch (err) {
      console.error("Failed to get random emoji:", err);
    }
  }, [emojiGroups, onSelect]);

  const handleRemove = useCallback(() => {
    onSelect("");
  }, [onSelect]);

  // Get emojis for the selected group
  const currentGroupEmojis =
    emojiGroups.find((g) => g.slug === selectedGroup)?.emojis || [];

  // Determine what to display in the grid
  const displayEmojis = searchQuery.trim() ? searchResults : currentGroupEmojis;

  return (
    <div className="emoji-picker" ref={pickerRef}>
      {/* Trigger button */}
      <button
        type="button"
        className={`emoji-picker__trigger ${
          !value ? "emoji-picker__trigger--empty" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("emojiPicker.selectEmoji")}
      >
        {value && <span className="emoji-picker__selected">{value}</span>}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="emoji-picker__dropdown">
          {/* Header with Random/Remove */}
          <div className="emoji-picker__header">
            <button
              type="button"
              className="emoji-picker__action"
              onClick={handleRandom}
            >
              {t("emojiPicker.random")}
            </button>
            <button
              type="button"
              className="emoji-picker__action"
              onClick={handleRemove}
            >
              {t("emojiPicker.remove")}
            </button>
          </div>

          {/* Category tabs */}
          <div className="emoji-picker__categories">
            {EMOJI_GROUPS.map((group) => (
              <button
                key={group.slug}
                type="button"
                className={`emoji-picker__category ${
                  selectedGroup === group.slug && !searchQuery
                    ? "emoji-picker__category--active"
                    : ""
                }`}
                onClick={() => {
                  setSelectedGroup(group.slug);
                  setSearchQuery("");
                }}
                title={group.name}
              >
                {group.icon}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="emoji-picker__search">
            <input
              ref={searchInputRef}
              type="text"
              className="emoji-picker__search-input"
              placeholder={t("emojiPicker.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            />
          </div>

          {/* Emoji grid */}
          <div className="emoji-picker__content">
            {loading ? (
              <div className="emoji-picker__loading">
                <div className="emoji-picker__spinner" />
              </div>
            ) : (
              <>
                {/* Frequently used (only when not searching) */}
                {!searchQuery && (
                  <div className="emoji-picker__section">
                    <h4 className="emoji-picker__section-title">
                      {t("emojiPicker.frequentlyUsed")}
                    </h4>
                    <div className="emoji-picker__grid">
                      {popularEmojis.map((item) => (
                        <button
                          key={item.slug}
                          type="button"
                          className="emoji-picker__emoji"
                          onClick={() => handleEmojiSelect(item.emoji)}
                          title={item.name}
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main emoji grid */}
                <div className="emoji-picker__section">
                  {!searchQuery && (
                    <h4 className="emoji-picker__section-title">
                      {EMOJI_GROUPS.find((g) => g.slug === selectedGroup)
                        ?.name || ""}
                    </h4>
                  )}
                  {searchQuery && searchResults.length === 0 ? (
                    <div className="emoji-picker__empty">
                      {t("emojiPicker.noResults")}
                    </div>
                  ) : (
                    <div className="emoji-picker__grid">
                      {displayEmojis.map((item) => (
                        <button
                          key={item.slug}
                          type="button"
                          className="emoji-picker__emoji"
                          onClick={() => handleEmojiSelect(item.emoji)}
                          title={item.name}
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
