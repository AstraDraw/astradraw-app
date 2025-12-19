import React, { memo, useState } from "react";

import clsx from "clsx";

import { collapseDownIcon, collapseUpIcon } from "./icons";
import {
  LibraryMenuSection,
  LibraryMenuSectionGrid,
} from "./LibraryMenuSection";

import type { SvgCache } from "../hooks/useLibraryItemSvg";
import type { LibraryItem } from "../types";

interface CollapsibleLibrarySectionProps {
  libraryName: string;
  items: LibraryItem[];
  onItemSelectToggle: (id: LibraryItem["id"], event: React.MouseEvent) => void;
  onItemDrag: (id: LibraryItem["id"], event: React.DragEvent) => void;
  onItemClick: (id: LibraryItem["id"] | null) => void;
  isItemSelected: (id: LibraryItem["id"] | null) => boolean;
  svgCache: SvgCache;
  itemsRenderedPerBatch: number;
  defaultCollapsed?: boolean;
}

export const CollapsibleLibrarySection = memo(
  ({
    libraryName,
    items,
    onItemSelectToggle,
    onItemDrag,
    onItemClick,
    isItemSelected,
    svgCache,
    itemsRenderedPerBatch,
    defaultCollapsed = false,
  }: CollapsibleLibrarySectionProps) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const toggleCollapsed = () => {
      setIsCollapsed((prev) => !prev);
    };

    return (
      <div className="library-menu-items-container__section">
        <button
          className={clsx("library-menu-items-container__section-header", {
            "library-menu-items-container__section-header--collapsed":
              isCollapsed,
          })}
          onClick={toggleCollapsed}
          type="button"
        >
          <span className="library-menu-items-container__section-header-icon">
            {isCollapsed ? collapseDownIcon : collapseUpIcon}
          </span>
          <span className="library-menu-items-container__section-header-title">
            {libraryName}
          </span>
          <span className="library-menu-items-container__section-header-count">
            ({items.length})
          </span>
        </button>
        {!isCollapsed && (
          <LibraryMenuSectionGrid>
            <LibraryMenuSection
              itemsRenderedPerBatch={itemsRenderedPerBatch}
              items={items}
              onItemSelectToggle={onItemSelectToggle}
              onItemDrag={onItemDrag}
              onClick={onItemClick}
              isItemSelected={isItemSelected}
              svgCache={svgCache}
            />
          </LibraryMenuSectionGrid>
        )}
      </div>
    );
  },
);
