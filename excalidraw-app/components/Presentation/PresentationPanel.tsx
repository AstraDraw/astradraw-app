import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { PlusIcon } from "@excalidraw/excalidraw/components/icons";
import { t } from "@excalidraw/excalidraw/i18n";

import type { ExcalidrawFrameLikeElement } from "@excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { usePresentationMode } from "./usePresentationMode";

import "./PresentationPanel.scss";

interface PresentationPanelProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

interface SlideThumbProps {
  frame: ExcalidrawFrameLikeElement;
  index: number;
  totalSlides: number;
  isActive: boolean;
  onClick: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const SlideThumb: React.FC<SlideThumbProps> = ({
  frame,
  index,
  totalSlides,
  isActive,
  onClick,
  onMoveUp,
  onMoveDown,
}) => {
  const frameName = frame.name || `Frame ${index + 1}`;

  return (
    <div
      className={clsx("presentation-panel__slide", {
        "presentation-panel__slide--active": isActive,
      })}
    >
      <button
        className="presentation-panel__slide-content"
        onClick={onClick}
        title={`${t("presentation.goToSlide")} ${frameName}`}
      >
        <div className="presentation-panel__slide-preview">
          <span className="presentation-panel__slide-number">{index + 1}</span>
        </div>
        <span className="presentation-panel__slide-name">{frameName}</span>
      </button>
      <div className="presentation-panel__slide-actions">
        <button
          className="presentation-panel__slide-action"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={index === 0}
          title={t("presentation.moveUp")}
        >
          ↑
        </button>
        <button
          className="presentation-panel__slide-action"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={index === totalSlides - 1}
          title={t("presentation.moveDown")}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

const PresentationInstructions: React.FC<{
  onCreateSlide: () => void;
}> = ({ onCreateSlide }) => {
  return (
    <div className="presentation-panel__instructions">
      <div className="presentation-panel__instructions-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4l18 0" />
          <path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10" />
          <path d="M12 16l0 4" />
          <path d="M9 20l6 0" />
          <path d="M8 12l3 -3l2 2l3 -3" />
        </svg>
      </div>
      <h3 className="presentation-panel__instructions-title">
        {t("presentation.noFramesTitle")}
      </h3>
      <p className="presentation-panel__instructions-text">
        {t("presentation.noFramesDescription")}
      </p>
      <ol className="presentation-panel__instructions-steps">
        <li>{t("presentation.noFramesStep1")}</li>
        <li>{t("presentation.noFramesStep2")}</li>
        <li>{t("presentation.noFramesStep3")}</li>
        <li>{t("presentation.noFramesStep4")}</li>
      </ol>
      <button
        className="presentation-panel__create-slide-button"
        onClick={onCreateSlide}
      >
        {PlusIcon}
        <span>{t("presentation.createFirstSlide")}</span>
      </button>
    </div>
  );
};

export const PresentationPanel: React.FC<PresentationPanelProps> = ({
  excalidrawAPI,
}) => {
  // Local state for ordered frames (allows reordering)
  const [orderedFrames, setOrderedFrames] = useState<
    ExcalidrawFrameLikeElement[]
  >([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(
    null,
  );

  const { startPresentation, getFrames, isPresentationMode, setSlides } =
    usePresentationMode({
      excalidrawAPI,
    });

  // Refresh frames list
  const refreshFrames = useCallback(() => {
    const currentFrames = getFrames();

    // Preserve custom order if we have one, otherwise use the default order
    setOrderedFrames((prevOrdered) => {
      if (prevOrdered.length === 0) {
        return currentFrames;
      }

      // Keep existing order, add new frames at the end, remove deleted frames
      const existingIds = new Set(currentFrames.map((f) => f.id));
      const orderedIds = new Set(prevOrdered.map((f) => f.id));

      // Keep frames that still exist in their current order
      const kept = prevOrdered.filter((f) => existingIds.has(f.id));

      // Add new frames at the end
      const newFrames = currentFrames.filter((f) => !orderedIds.has(f.id));

      // Update references to current frame objects
      const updatedKept = kept.map(
        (f) => currentFrames.find((cf) => cf.id === f.id) || f,
      );

      return [...updatedKept, ...newFrames];
    });
  }, [getFrames]);

  // Refresh on mount and when elements change
  useEffect(() => {
    refreshFrames();

    if (!excalidrawAPI) {
      return;
    }

    // Subscribe to changes
    const unsubscribe = excalidrawAPI.onChange(() => {
      refreshFrames();
    });

    return () => unsubscribe();
  }, [excalidrawAPI, refreshFrames]);

  // Handle create slide button
  const handleCreateSlide = useCallback(() => {
    if (!excalidrawAPI) {
      return;
    }

    excalidrawAPI.setActiveTool({ type: "frame" });
    excalidrawAPI.setToast({
      message: t("presentation.drawFrameToast"),
      duration: 3000,
      closable: true,
    });
  }, [excalidrawAPI]);

  // Handle slide click - scroll to frame
  const handleSlideClick = useCallback(
    (index: number) => {
      if (!excalidrawAPI || !orderedFrames[index]) {
        return;
      }

      setSelectedFrameIndex(index);
      excalidrawAPI.scrollToContent(orderedFrames[index], {
        fitToContent: true,
        animate: true,
        duration: 300,
      });
    },
    [excalidrawAPI, orderedFrames],
  );

  // Handle move slide up
  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) {
      return;
    }

    setOrderedFrames((prev) => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      return newOrder;
    });
  }, []);

  // Handle move slide down
  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= orderedFrames.length - 1) {
        return;
      }

      setOrderedFrames((prev) => {
        const newOrder = [...prev];
        [newOrder[index], newOrder[index + 1]] = [
          newOrder[index + 1],
          newOrder[index],
        ];
        return newOrder;
      });
    },
    [orderedFrames.length],
  );

  // Handle start presentation - use ordered frames
  const handleStartPresentation = useCallback(() => {
    // Set the ordered slides before starting
    setSlides(orderedFrames);
    startPresentation();
  }, [startPresentation, setSlides, orderedFrames]);

  // Don't render if in presentation mode
  if (isPresentationMode) {
    return null;
  }

  const hasFrames = orderedFrames.length > 0;

  return (
    <div className="presentation-panel">
      {hasFrames ? (
        <>
          {/* Header */}
          <div className="presentation-panel__header">
            <span className="presentation-panel__title">
              {t("presentation.title")}
            </span>
            <button
              className="presentation-panel__add-button"
              onClick={handleCreateSlide}
              title={t("presentation.createSlide")}
            >
              {PlusIcon}
              <span>{t("presentation.createSlide")}</span>
            </button>
          </div>

          {/* Slides list */}
          <div className="presentation-panel__slides">
            {orderedFrames.map((frame, index) => (
              <SlideThumb
                key={frame.id}
                frame={frame}
                index={index}
                totalSlides={orderedFrames.length}
                isActive={selectedFrameIndex === index}
                onClick={() => handleSlideClick(index)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
              />
            ))}
          </div>

          {/* Start button */}
          <div className="presentation-panel__footer">
            <button
              className="presentation-panel__start-button"
              onClick={handleStartPresentation}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>{t("presentation.startPresentation")}</span>
            </button>
          </div>
        </>
      ) : (
        <PresentationInstructions onCreateSlide={handleCreateSlide} />
      )}
    </div>
  );
};
