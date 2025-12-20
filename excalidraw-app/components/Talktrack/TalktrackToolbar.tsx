import clsx from "clsx";
import { useCallback, useEffect, useState, useRef } from "react";

import { t } from "@excalidraw/excalidraw/i18n";

import { formatDuration, type RecordingState } from "./TalktrackRecorder";

import "./TalktrackToolbar.scss";

interface TalktrackToolbarProps {
  recordingState: RecordingState;
  onDelete: () => void;
  onRestart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  cameraEnabled: boolean;
}

export const TalktrackToolbar: React.FC<TalktrackToolbarProps> = ({
  recordingState,
  onDelete,
  onRestart,
  onPause,
  onResume,
  onStop,
  cameraEnabled,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraBubbleRef = useRef<HTMLDivElement>(null);
  // Initialize camera bubble at top-right position
  const [bubblePosition, setBubblePosition] = useState(() => {
    const viewportWidth = window.innerWidth;
    return {
      x: viewportWidth - 140, // 120px bubble + 20px margin
      y: 20,
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, bubbleX: 0, bubbleY: 0 });

  const isPaused = recordingState.status === "paused";

  // Handle camera preview for toolbar
  useEffect(() => {
    if (!cameraEnabled) {
      return;
    }

    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 320 } },
        });

        cameraStreamRef.current = stream;

        if (cameraPreviewRef.current) {
          cameraPreviewRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to start toolbar camera preview:", err);
      }
    };

    startPreview();

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [cameraEnabled]);

  // Handle drag for camera bubble
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      bubbleX: bubblePosition.x,
      bubbleY: bubblePosition.y,
    };
  }, [bubblePosition]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setBubblePosition({
        x: dragStartRef.current.bubbleX + deltaX,
        y: dragStartRef.current.bubbleY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleDeleteClick = useCallback(() => {
    if (showConfirmDelete) {
      onDelete();
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  }, [showConfirmDelete, onDelete]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  }, [isPaused, onPause, onResume]);

  // Don't render if not recording or paused
  if (recordingState.status !== "recording" && recordingState.status !== "paused") {
    return null;
  }

  return (
    <div className="talktrack-toolbar">
      {/* Camera preview bubble - draggable */}
      {cameraEnabled && (
        <div
          ref={cameraBubbleRef}
          className={clsx("talktrack-toolbar__camera-preview", {
            "talktrack-toolbar__camera-preview--dragging": isDragging,
          })}
          style={{
            transform: `translate(${bubblePosition.x}px, ${bubblePosition.y}px)`,
          }}
          onMouseDown={handleMouseDown}
        >
          <video
            ref={cameraPreviewRef}
            autoPlay
            muted
            playsInline
            className="talktrack-toolbar__camera-video"
          />
        </div>
      )}

      {/* Main toolbar */}
      <div className="talktrack-toolbar__controls">
        {/* Delete button */}
        <button
          className={clsx("talktrack-toolbar__button", {
            "talktrack-toolbar__button--confirm": showConfirmDelete,
          })}
          onClick={handleDeleteClick}
          title={showConfirmDelete ? t("talktrack.confirmDelete") : t("talktrack.delete")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>

        {/* Restart button */}
        <button
          className="talktrack-toolbar__button"
          onClick={onRestart}
          title={t("talktrack.restart")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>

        {/* Pause/Resume button */}
        <button
          className="talktrack-toolbar__button"
          onClick={handlePauseResume}
          title={isPaused ? t("talktrack.resume") : t("talktrack.pause")}
        >
          {isPaused ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </button>

        {/* Timer */}
        <div
          className={clsx("talktrack-toolbar__timer", {
            "talktrack-toolbar__timer--paused": isPaused,
          })}
        >
          {formatDuration(recordingState.duration)}
        </div>

        {/* Stop button */}
        <button
          className="talktrack-toolbar__stop-button"
          onClick={onStop}
        >
          {t("talktrack.stop")}
        </button>
      </div>
    </div>
  );
};
