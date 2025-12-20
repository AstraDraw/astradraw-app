import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { newEmbeddableElement } from "@excalidraw/element";

import { t } from "@excalidraw/excalidraw/i18n";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import {
  getRecordings,
  deleteRecording,
  renameRecording,
  isKinescopeConfigured,
  getKinescopeEmbedUrl,
  type TalktrackRecording,
} from "./kinescopeApi";

import "./TalktrackPanel.scss";

interface TalktrackPanelProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  onStartRecording: () => void;
}

interface RecordingItemProps {
  recording: TalktrackRecording;
  onAddToBoard: (recording: TalktrackRecording) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (recording: TalktrackRecording) => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs} sec`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const RecordingItem: React.FC<RecordingItemProps> = ({
  recording,
  onAddToBoard,
  onRename,
  onDelete,
  onCopyLink,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(recording.title);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRename = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveRename = () => {
    if (editTitle.trim() && editTitle !== recording.title) {
      onRename(recording.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setEditTitle(recording.title);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete(recording.id);
    setIsMenuOpen(false);
  };

  const handleCopyLink = () => {
    onCopyLink(recording);
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (isMenuOpen) {
      const handleClickOutside = () => setIsMenuOpen(false);
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <div className="talktrack-panel__recording">
      <div className="talktrack-panel__recording-thumbnail">
        {/* Placeholder thumbnail - Kinescope provides thumbnails after processing */}
        <div className="talktrack-panel__recording-thumbnail-placeholder">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>

      <div className="talktrack-panel__recording-info">
        {isEditing ? (
          <input
            type="text"
            className="talktrack-panel__recording-title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <div className="talktrack-panel__recording-title">{recording.title}</div>
        )}
        <div className="talktrack-panel__recording-meta">
          <span className="talktrack-panel__recording-duration">
            {formatDuration(recording.duration)}
          </span>
          <span className="talktrack-panel__recording-date">
            {formatDate(recording.createdAt)}
          </span>
        </div>
      </div>

      <div className="talktrack-panel__recording-actions">
        <button
          className="talktrack-panel__action-button"
          onClick={handleCopyLink}
          title={t("talktrack.copyLink")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        <div className="talktrack-panel__menu-container">
          <button
            className="talktrack-panel__action-button"
            onClick={handleMenuClick}
            title={t("talktrack.moreOptions")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="talktrack-panel__menu">
              <button
                className="talktrack-panel__menu-item"
                onClick={() => {
                  onAddToBoard(recording);
                  setIsMenuOpen(false);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                {t("talktrack.addToBoard")}
              </button>
              <button className="talktrack-panel__menu-item" onClick={handleRename}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {t("talktrack.rename")}
              </button>
              <button
                className="talktrack-panel__menu-item talktrack-panel__menu-item--danger"
                onClick={handleDelete}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {t("talktrack.delete")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ onRecord: () => void }> = ({ onRecord }) => (
  <div className="talktrack-panel__empty">
    <div className="talktrack-panel__empty-icon">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="18" cy="7" r="1" fill="currentColor" />
      </svg>
    </div>
    <h3 className="talktrack-panel__empty-title">{t("talktrack.emptyTitle")}</h3>
    <p className="talktrack-panel__empty-description">
      {t("talktrack.emptyDescription")}
    </p>
    <button className="talktrack-panel__record-button" onClick={onRecord}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
      {t("talktrack.recordTalktrack")}
    </button>
  </div>
);

const NotConfigured: React.FC = () => (
  <div className="talktrack-panel__not-configured">
    <div className="talktrack-panel__not-configured-icon">⚠️</div>
    <h3 className="talktrack-panel__not-configured-title">
      {t("talktrack.notConfiguredTitle")}
    </h3>
    <p className="talktrack-panel__not-configured-description">
      {t("talktrack.notConfiguredDescription")}
    </p>
  </div>
);

export const TalktrackPanel: React.FC<TalktrackPanelProps> = ({
  excalidrawAPI,
  onStartRecording,
}) => {
  const [recordings, setRecordings] = useState<TalktrackRecording[]>([]);

  // Load recordings on mount
  useEffect(() => {
    setRecordings(getRecordings());
  }, []);

  // Refresh recordings when panel becomes visible
  const refreshRecordings = useCallback(() => {
    setRecordings(getRecordings());
  }, []);

  const handleAddToBoard = useCallback(
    (recording: TalktrackRecording) => {
      if (!excalidrawAPI) {
        return;
      }

      const embedUrl = getKinescopeEmbedUrl(recording.kinescopeVideoId);
      const appState = excalidrawAPI.getAppState();
      const elements = excalidrawAPI.getSceneElements();

      // Calculate center of viewport
      const x =
        -appState.scrollX +
        appState.width / (2 * appState.zoom.value) -
        320;
      const y =
        -appState.scrollY +
        appState.height / (2 * appState.zoom.value) -
        180;

      const embeddableElement = newEmbeddableElement({
        type: "embeddable",
        x,
        y,
        width: 640,
        height: 360,
        link: embedUrl,
      });

      excalidrawAPI.updateScene({
        elements: [...elements, embeddableElement],
      });

      excalidrawAPI.setToast({
        message: t("talktrack.addedToBoard"),
        duration: 2000,
        closable: true,
      });
    },
    [excalidrawAPI],
  );

  const handleRename = useCallback((id: string, newTitle: string) => {
    renameRecording(id, newTitle);
    refreshRecordings();
  }, [refreshRecordings]);

  const handleDelete = useCallback(async (id: string) => {
    // Show deleting toast
    excalidrawAPI?.setToast({
      message: t("talktrack.deleting"),
      duration: 0,
      closable: false,
    });

    try {
      await deleteRecording(id, true); // Also delete from Kinescope
      refreshRecordings();
      excalidrawAPI?.setToast({
        message: t("talktrack.deleteSuccess"),
        duration: 2000,
        closable: true,
      });
    } catch (err) {
      console.error("Failed to delete recording:", err);
      excalidrawAPI?.setToast({
        message: t("talktrack.deleteError"),
        duration: 3000,
        closable: true,
      });
    }
  }, [refreshRecordings, excalidrawAPI]);

  const handleCopyLink = useCallback((recording: TalktrackRecording) => {
    const url = getKinescopeEmbedUrl(recording.kinescopeVideoId);
    navigator.clipboard.writeText(url).then(() => {
      excalidrawAPI?.setToast({
        message: t("talktrack.linkCopied"),
        duration: 2000,
        closable: true,
      });
    });
  }, [excalidrawAPI]);

  // Check if Kinescope is configured
  if (!isKinescopeConfigured()) {
    return (
      <div className="talktrack-panel" onWheel={(e) => e.stopPropagation()}>
        <NotConfigured />
      </div>
    );
  }

  const hasRecordings = recordings.length > 0;

  return (
    <div className="talktrack-panel" onWheel={(e) => e.stopPropagation()}>
      {hasRecordings ? (
        <>
          {/* Header */}
          <div className="talktrack-panel__header">
            <span className="talktrack-panel__title">{t("talktrack.title")}</span>
          </div>

          {/* Recordings list */}
          <div className="talktrack-panel__recordings">
            {recordings.map((recording) => (
              <RecordingItem
                key={recording.id}
                recording={recording}
                onAddToBoard={handleAddToBoard}
                onRename={handleRename}
                onDelete={handleDelete}
                onCopyLink={handleCopyLink}
              />
            ))}
          </div>

          {/* Record button at bottom */}
          <div className="talktrack-panel__footer">
            <button
              className="talktrack-panel__record-button"
              onClick={onStartRecording}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              {t("talktrack.recordTalktrack")}
            </button>
          </div>
        </>
      ) : (
        <EmptyState onRecord={onStartRecording} />
      )}
    </div>
  );
};
