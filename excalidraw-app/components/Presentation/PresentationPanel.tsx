import clsx from "clsx";
import { useCallback, useEffect, useState, useRef } from "react";

import { PlusIcon } from "@excalidraw/excalidraw/components/icons";
import { t } from "@excalidraw/excalidraw/i18n";
import { exportToCanvas } from "@excalidraw/utils";

import type { ExcalidrawFrameLikeElement } from "@excalidraw/element/types";
import type {
  ExcalidrawImperativeAPI,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";

import { usePresentationMode } from "./usePresentationMode";

import "./PresentationPanel.scss";

// Helper to extract the order prefix from a frame name (e.g., "3. My Frame" -> 3)
const extractOrderPrefix = (name: string | null): number | null => {
  if (!name) {
    return null;
  }
  const match = name.match(/^(\d+)\.\s*/);
  return match ? parseInt(match[1], 10) : null;
};

// Helper to remove the order prefix from a frame name (e.g., "3. My Frame" -> "My Frame")
const removeOrderPrefix = (name: string | null): string => {
  if (!name) {
    return "";
  }
  return name.replace(/^\d+\.\s*/, "");
};

// Helper to add/update order prefix to a frame name
const setOrderPrefix = (name: string | null, order: number): string => {
  const baseName = removeOrderPrefix(name) || `Frame`;
  return `${order}. ${baseName}`;
};

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
  onRename: (newName: string) => void;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  refreshKey?: number;
}

const SlideThumb: React.FC<SlideThumbProps> = ({
  frame,
  index,
  totalSlides,
  isActive,
  onClick,
  onMoveUp,
  onMoveDown,
  onRename,
  excalidrawAPI,
  refreshKey,
}) => {
  const frameName = frame.name || `Frame ${index + 1}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(frameName);

  // Update editValue when frame name changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(frame.name || `Frame ${index + 1}`);
    }
  }, [frame.name, index, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(frame.name || "");
  };

  const handleFinishEditing = () => {
    setIsEditing(false);
    const trimmedValue = editValue.trim();
    if (trimmedValue !== frame.name) {
      onRename(trimmedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishEditing();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(frame.name || `Frame ${index + 1}`);
    }
  };

  // Generate preview when frame changes
  useEffect(() => {
    if (!excalidrawAPI || !canvasRef.current) {
      return;
    }

    const generatePreview = async () => {
      try {
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const files = excalidrawAPI.getFiles();

        // Export the frame content to canvas
        const exportedCanvas = await exportToCanvas({
          elements,
          appState: {
            ...appState,
            exportBackground: true,
            viewBackgroundColor: appState.viewBackgroundColor,
          },
          files: files as BinaryFiles,
          exportingFrame: frame,
          maxWidthOrHeight: 200, // Limit preview size for performance
        });

        // Draw the exported canvas onto our preview canvas
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          const previewWidth = canvasRef.current.width;
          const previewHeight = canvasRef.current.height;

          // Clear canvas
          ctx.clearRect(0, 0, previewWidth, previewHeight);

          // Calculate scaling to fit while maintaining aspect ratio
          const scale = Math.min(
            previewWidth / exportedCanvas.width,
            previewHeight / exportedCanvas.height,
          );

          const scaledWidth = exportedCanvas.width * scale;
          const scaledHeight = exportedCanvas.height * scale;

          // Center the preview
          const offsetX = (previewWidth - scaledWidth) / 2;
          const offsetY = (previewHeight - scaledHeight) / 2;

          ctx.drawImage(
            exportedCanvas,
            offsetX,
            offsetY,
            scaledWidth,
            scaledHeight,
          );
          setPreviewError(false);
        }
      } catch (error) {
        console.error("Failed to generate frame preview:", error);
        setPreviewError(true);
      }
    };

    // Debounce preview generation
    const timeoutId = setTimeout(generatePreview, 100);
    return () => clearTimeout(timeoutId);
  }, [frame, excalidrawAPI, refreshKey]);

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
          <canvas
            ref={canvasRef}
            width={160}
            height={90}
            className="presentation-panel__slide-canvas"
          />
          {previewError && (
            <span className="presentation-panel__slide-number">
              {index + 1}
            </span>
          )}
        </div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="presentation-panel__slide-name-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            placeholder={`Frame ${index + 1}`}
          />
        ) : (
          <span
            className="presentation-panel__slide-name"
            onDoubleClick={handleStartEditing}
            title={t("presentation.doubleClickToRename")}
          >
            {frameName}
          </span>
        )}
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
        <button
          className="presentation-panel__slide-action presentation-panel__slide-action--rename"
          onClick={handleStartEditing}
          title={t("presentation.renameFrame")}
        >
          ✎
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
  // Key to trigger preview refresh when scene changes
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  const { startPresentation, getFrames, isPresentationMode, setSlides } =
    usePresentationMode({
      excalidrawAPI,
    });

  // Refresh frames list - sort by order prefix if present
  const refreshFrames = useCallback(() => {
    const currentFrames = getFrames();

    // Sort frames by their order prefix (if any), then by name
    const sortedFrames = [...currentFrames].sort((a, b) => {
      const orderA = extractOrderPrefix(a.name);
      const orderB = extractOrderPrefix(b.name);

      // Both have order prefixes - sort by prefix
      if (orderA !== null && orderB !== null) {
        return orderA - orderB;
      }
      // Only one has prefix - prefixed comes first
      if (orderA !== null) {
        return -1;
      }
      if (orderB !== null) {
        return 1;
      }
      // Neither has prefix - sort by name
      const nameA = a.name || "";
      const nameB = b.name || "";
      return nameA.localeCompare(nameB);
    });

    setOrderedFrames((prevOrdered) => {
      if (prevOrdered.length === 0) {
        return sortedFrames;
      }

      // Keep existing order, add new frames at the end, remove deleted frames
      const existingIds = new Set(currentFrames.map((f) => f.id));
      const orderedIds = new Set(prevOrdered.map((f) => f.id));

      // Keep frames that still exist in their current order
      const kept = prevOrdered.filter((f) => existingIds.has(f.id));

      // Add new frames at the end (sorted by their prefix if they have one)
      const newFrames = sortedFrames.filter((f) => !orderedIds.has(f.id));

      // Update references to current frame objects
      const updatedKept = kept.map(
        (f) => currentFrames.find((cf) => cf.id === f.id) || f,
      );

      return [...updatedKept, ...newFrames];
    });

    // Trigger preview refresh
    setPreviewRefreshKey((prev) => prev + 1);
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

  // Helper to update frame names with order prefixes after reordering
  const updateFrameOrderPrefixes = useCallback(
    (frames: ExcalidrawFrameLikeElement[]) => {
      if (!excalidrawAPI) {
        return;
      }

      const elements = excalidrawAPI.getSceneElements();
      const updatedElements = elements.map((el) => {
        if (el.type === "frame" || el.type === "magicframe") {
          const frameIndex = frames.findIndex((f) => f.id === el.id);
          if (frameIndex !== -1) {
            const newName = setOrderPrefix(el.name, frameIndex + 1);
            if (newName !== el.name) {
              return { ...el, name: newName };
            }
          }
        }
        return el;
      });

      excalidrawAPI.updateScene({
        elements: updatedElements,
      });
    },
    [excalidrawAPI],
  );

  // Handle move slide up
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) {
        return;
      }

      setOrderedFrames((prev) => {
        const newOrder = [...prev];
        [newOrder[index - 1], newOrder[index]] = [
          newOrder[index],
          newOrder[index - 1],
        ];
        // Update frame names with new order prefixes
        updateFrameOrderPrefixes(newOrder);
        return newOrder;
      });
    },
    [updateFrameOrderPrefixes],
  );

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
        // Update frame names with new order prefixes
        updateFrameOrderPrefixes(newOrder);
        return newOrder;
      });
    },
    [orderedFrames.length, updateFrameOrderPrefixes],
  );

  // Handle rename frame
  const handleRenameFrame = useCallback(
    (frameId: string, newName: string) => {
      if (!excalidrawAPI) {
        return;
      }

      const elements = excalidrawAPI.getSceneElements();
      const updatedElements = elements.map((el) => {
        if (el.id === frameId && (el.type === "frame" || el.type === "magicframe")) {
          return {
            ...el,
            name: newName || null,
          };
        }
        return el;
      });

      excalidrawAPI.updateScene({
        elements: updatedElements,
      });
    },
    [excalidrawAPI],
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
                onRename={(newName) => handleRenameFrame(frame.id, newName)}
                excalidrawAPI={excalidrawAPI}
                refreshKey={previewRefreshKey}
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
