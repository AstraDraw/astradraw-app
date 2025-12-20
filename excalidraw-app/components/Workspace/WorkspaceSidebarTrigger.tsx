import React, { useEffect, useCallback } from "react";
import { t } from "@excalidraw/excalidraw/i18n";
import { useAuth } from "../../auth";
import "./WorkspaceSidebarTrigger.scss";

// Folder icon
const folderIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

interface WorkspaceSidebarTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const WorkspaceSidebarTrigger: React.FC<WorkspaceSidebarTriggerProps> = ({
  isOpen,
  onToggle,
}) => {
  const { isAuthenticated } = useAuth();

  // Handle backtick keyboard shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Backtick key to toggle sidebar
      if (e.key === "`" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="workspace-sidebar-trigger">
      <button
        className={`workspace-sidebar-trigger__button ${
          isOpen ? "workspace-sidebar-trigger__button--active" : ""
        } ${isAuthenticated ? "workspace-sidebar-trigger__button--authenticated" : ""}`}
        onClick={onToggle}
        aria-label={t("workspace.title")}
        aria-pressed={isOpen}
        title={`${t("workspace.title")} (\`)`}
      >
        {folderIcon}
      </button>
    </div>
  );
};

export default WorkspaceSidebarTrigger;
