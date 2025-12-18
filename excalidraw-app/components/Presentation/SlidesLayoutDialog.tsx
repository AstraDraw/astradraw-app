import clsx from "clsx";
import { useState } from "react";

import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { t } from "@excalidraw/excalidraw/i18n";

import type { ExcalidrawFrameLikeElement } from "@excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import "./SlidesLayoutDialog.scss";

export type LayoutType = "row" | "column" | "grid";

interface SlidesLayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (layout: LayoutType, columnCount: number) => void;
}

export const SlidesLayoutDialog: React.FC<SlidesLayoutDialogProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("row");
  const [columnCount, setColumnCount] = useState(3);

  if (!isOpen) {
    return null;
  }

  const handleApply = () => {
    onApply(selectedLayout, columnCount);
    onClose();
  };

  return (
    <Dialog onCloseRequest={onClose} title={t("slidesLayout.title")} size="wide">
      <div className="slides-layout-dialog">
        <p className="slides-layout-dialog__description">
          {t("slidesLayout.description")}
        </p>

        <p className="slides-layout-dialog__order-note">
          <strong>{t("slidesLayout.orderNote")}</strong>
          <br />
          <span className="slides-layout-dialog__order-note-sub">
            {t("slidesLayout.orderNoteSub")}
          </span>
        </p>

        <div className="slides-layout-dialog__options">
          {/* Row Layout */}
          <button
            className={clsx("slides-layout-dialog__option", {
              "slides-layout-dialog__option--selected": selectedLayout === "row",
            })}
            onClick={() => setSelectedLayout("row")}
          >
            <div className="slides-layout-dialog__option-preview slides-layout-dialog__option-preview--row">
              <div className="slides-layout-dialog__mock-window">
                <div className="slides-layout-dialog__window-dots">
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--red" />
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--yellow" />
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--green" />
                </div>
                <div className="slides-layout-dialog__mock-frames slides-layout-dialog__mock-frames--row">
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--circle" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--square" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--triangle" />
                  </div>
                </div>
              </div>
            </div>
            <div className="slides-layout-dialog__option-label">
              <span className="slides-layout-dialog__option-name">{t("slidesLayout.row")}</span>
              {selectedLayout === "row" && (
                <span className="slides-layout-dialog__option-check">✓</span>
              )}
            </div>
          </button>

          {/* Column Layout */}
          <button
            className={clsx("slides-layout-dialog__option", {
              "slides-layout-dialog__option--selected": selectedLayout === "column",
            })}
            onClick={() => setSelectedLayout("column")}
          >
            <div className="slides-layout-dialog__option-preview slides-layout-dialog__option-preview--column">
              <div className="slides-layout-dialog__mock-window">
                <div className="slides-layout-dialog__window-dots">
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--red" />
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--yellow" />
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--green" />
                </div>
                <div className="slides-layout-dialog__mock-frames slides-layout-dialog__mock-frames--column">
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--circle" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--square" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--triangle" />
                  </div>
                </div>
              </div>
            </div>
            <div className="slides-layout-dialog__option-label">
              <span className="slides-layout-dialog__option-name">{t("slidesLayout.column")}</span>
              {selectedLayout === "column" && (
                <span className="slides-layout-dialog__option-check">✓</span>
              )}
            </div>
          </button>

          {/* Grid Layout */}
          <button
            className={clsx("slides-layout-dialog__option", {
              "slides-layout-dialog__option--selected": selectedLayout === "grid",
            })}
            onClick={() => setSelectedLayout("grid")}
          >
            <div className="slides-layout-dialog__option-preview slides-layout-dialog__option-preview--grid">
              <div className="slides-layout-dialog__mock-window">
                <div className="slides-layout-dialog__window-dots">
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--red" />
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--yellow" />
                  <span className="slides-layout-dialog__dot slides-layout-dialog__dot--green" />
                </div>
                <div className="slides-layout-dialog__mock-frames slides-layout-dialog__mock-frames--grid">
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--circle" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--square" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--triangle" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--star" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--diamond" />
                  </div>
                  <div className="slides-layout-dialog__mock-frame">
                    <span className="slides-layout-dialog__mock-shape slides-layout-dialog__mock-shape--hexagon" />
                  </div>
                </div>
              </div>
            </div>
            <div className="slides-layout-dialog__option-label">
              <span className="slides-layout-dialog__option-name">{t("slidesLayout.grid")}</span>
              {selectedLayout === "grid" && (
                <span className="slides-layout-dialog__option-check">✓</span>
              )}
            </div>
          </button>
        </div>

        {/* Column count selector for grid */}
        <div className="slides-layout-dialog__column-count">
          <label className="slides-layout-dialog__column-label">
            {t("slidesLayout.columnCount")}
            <span className="slides-layout-dialog__column-description">
              {t("slidesLayout.columnCountDescription")}
            </span>
          </label>
          <select
            className="slides-layout-dialog__column-select"
            value={columnCount}
            onChange={(e) => setColumnCount(Number(e.target.value))}
            disabled={selectedLayout !== "grid"}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="slides-layout-dialog__actions">
          <button
            className="slides-layout-dialog__button slides-layout-dialog__button--secondary"
            onClick={onClose}
          >
            {t("slidesLayout.close")}
          </button>
          <button
            className="slides-layout-dialog__button slides-layout-dialog__button--primary"
            onClick={handleApply}
          >
            {t("slidesLayout.apply")}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

// Helper function to apply layout to frames
export const applyLayoutToFrames = (
  excalidrawAPI: ExcalidrawImperativeAPI,
  frames: ExcalidrawFrameLikeElement[],
  layout: LayoutType,
  columnCount: number,
  gap: number = 50,
): void => {
  if (!excalidrawAPI || frames.length === 0) {
    return;
  }

  const elements = excalidrawAPI.getSceneElements();
  
  // Find the maximum frame dimensions to use as reference
  let maxWidth = 0;
  let maxHeight = 0;
  for (const frame of frames) {
    maxWidth = Math.max(maxWidth, frame.width);
    maxHeight = Math.max(maxHeight, frame.height);
  }

  // Calculate starting position (center of current view or origin)
  const appState = excalidrawAPI.getAppState();
  const startX = appState.scrollX * -1 + 100;
  const startY = appState.scrollY * -1 + 100;

  // Calculate new positions for each frame
  const framePositions: Map<string, { x: number; y: number }> = new Map();

  frames.forEach((frame, index) => {
    let x: number;
    let y: number;

    switch (layout) {
      case "row":
        // Horizontal arrangement
        x = startX + index * (maxWidth + gap);
        y = startY;
        break;
      case "column":
        // Vertical arrangement
        x = startX;
        y = startY + index * (maxHeight + gap);
        break;
      case "grid":
        // Grid arrangement
        const col = index % columnCount;
        const row = Math.floor(index / columnCount);
        x = startX + col * (maxWidth + gap);
        y = startY + row * (maxHeight + gap);
        break;
      default:
        x = frame.x;
        y = frame.y;
    }

    framePositions.set(frame.id, { x, y });
  });

  // Update elements with new positions
  // We need to move frames and all their contained elements
  const updatedElements = elements.map((el) => {
    // Check if this is a frame we're moving
    const newPos = framePositions.get(el.id);
    if (newPos) {
      const frame = frames.find((f) => f.id === el.id);
      if (frame) {
        const deltaX = newPos.x - frame.x;
        const deltaY = newPos.y - frame.y;
        return {
          ...el,
          x: newPos.x,
          y: newPos.y,
        };
      }
    }

    // Check if this element is inside a frame we're moving
    if (el.frameId) {
      const frame = frames.find((f) => f.id === el.frameId);
      if (frame) {
        const newPos = framePositions.get(frame.id);
        if (newPos) {
          const deltaX = newPos.x - frame.x;
          const deltaY = newPos.y - frame.y;
          return {
            ...el,
            x: el.x + deltaX,
            y: el.y + deltaY,
          };
        }
      }
    }

    return el;
  });

  excalidrawAPI.updateScene({
    elements: updatedElements,
  });

  // Scroll to show the arranged frames
  setTimeout(() => {
    excalidrawAPI.scrollToContent(frames, {
      fitToContent: true,
      animate: true,
      duration: 500,
    });
  }, 100);
};
