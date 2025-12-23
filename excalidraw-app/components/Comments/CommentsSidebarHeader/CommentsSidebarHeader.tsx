import React, { useState, useCallback, useRef, useEffect } from "react";

import { t } from "@excalidraw/excalidraw/i18n";

import styles from "./CommentsSidebarHeader.module.scss";

import type { ThreadFilters } from "../../../auth/api/types";

// ============================================================================
// Types
// ============================================================================

export interface CommentsSidebarHeaderProps {
  filters: ThreadFilters;
  onFiltersChange: (filters: ThreadFilters) => void;
}

// ============================================================================
// Icons
// ============================================================================

const SearchIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const FilterIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="4" y1="21" y2="14" />
    <line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" />
    <line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" />
    <line x1="20" x2="20" y1="12" y2="3" />
    <line x1="2" x2="6" y1="14" y2="14" />
    <line x1="10" x2="14" y1="8" y2="8" />
    <line x1="18" x2="22" y1="16" y2="16" />
  </svg>
);

const ClearIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ============================================================================
// Main Component
// ============================================================================

export const CommentsSidebarHeader: React.FC<CommentsSidebarHeaderProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local search with filters when filters change externally
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounced search update
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalSearch(value);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the filter update
      debounceRef.current = setTimeout(() => {
        onFiltersChange({ ...filters, search: value });
      }, 300);
    },
    [filters, onFiltersChange],
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setLocalSearch("");
    onFiltersChange({ ...filters, search: "" });
  }, [filters, onFiltersChange]);

  // Toggle sort
  const handleSortChange = useCallback(
    (sort: "date" | "unread") => {
      onFiltersChange({ ...filters, sort });
    },
    [filters, onFiltersChange],
  );

  // Toggle show resolved
  const handleShowResolvedToggle = useCallback(() => {
    // Cycle through: undefined (all) -> false (unresolved only) -> true (resolved only) -> undefined
    let newResolved: boolean | undefined;
    if (filters.resolved === undefined) {
      newResolved = false; // Show unresolved only
    } else if (filters.resolved === false) {
      newResolved = true; // Show resolved only
    } else {
      newResolved = undefined; // Show all
    }
    onFiltersChange({ ...filters, resolved: newResolved });
  }, [filters, onFiltersChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasActiveFilters =
    filters.resolved !== undefined || filters.sort !== "date";

  return (
    <div className={styles.header}>
      {/* Search Input */}
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>
          <SearchIcon />
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t("comments.searchPlaceholder")}
          value={localSearch}
          onChange={handleSearchChange}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        />
        {localSearch && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearSearch}
            title={t("buttons.clear")}
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {/* Filter Dropdown */}
      <div className={styles.filterContainer} ref={dropdownRef}>
        <button
          type="button"
          className={`${styles.filterButton} ${
            hasActiveFilters ? styles.filterButtonActive : ""
          }`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title={t("comments.filterComments")}
        >
          <FilterIcon />
        </button>

        {isDropdownOpen && (
          <div className={styles.dropdown}>
            {/* Sort Options */}
            <div className={styles.dropdownSection}>
              <div className={styles.dropdownLabel}>
                {t("comments.sortLabel")}
              </div>
              <button
                type="button"
                className={`${styles.dropdownItem} ${
                  filters.sort === "date" ? styles.dropdownItemActive : ""
                }`}
                onClick={() => handleSortChange("date")}
              >
                {filters.sort === "date" && <CheckIcon />}
                <span>{t("comments.sortByDate")}</span>
              </button>
              <button
                type="button"
                className={`${styles.dropdownItem} ${
                  filters.sort === "unread" ? styles.dropdownItemActive : ""
                }`}
                onClick={() => handleSortChange("unread")}
                disabled
                title="Coming soon"
              >
                {filters.sort === "unread" && <CheckIcon />}
                <span>{t("comments.sortByUnread")}</span>
              </button>
            </div>

            {/* Resolved Filter */}
            <div className={styles.dropdownDivider} />
            <div className={styles.dropdownSection}>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={handleShowResolvedToggle}
              >
                <span className={styles.resolvedIndicator}>
                  {filters.resolved === undefined && "○"}
                  {filters.resolved === false && "◐"}
                  {filters.resolved === true && "●"}
                </span>
                <span>
                  {filters.resolved === undefined && t("comments.showAll")}
                  {filters.resolved === false && t("comments.showUnresolved")}
                  {filters.resolved === true && t("comments.showResolved")}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
