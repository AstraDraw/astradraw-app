import React, { useState, useEffect, useRef } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtomValue } from "../../../app-jotai";
import {
  currentWorkspaceAtom,
  workspacesAtom,
} from "../../Settings/settingsState";

import { chevronIcon, closeIcon } from "./icons";

import type { Workspace } from "../../../auth/workspaceApi";
import type { User } from "../../../auth";

interface SidebarHeaderProps {
  isAuthenticated: boolean;
  user: User | null;
  onSwitchWorkspace: (workspace: Workspace) => void;
  onCreateWorkspaceClick: () => void;
  onClose: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isAuthenticated,
  user,
  onSwitchWorkspace,
  onCreateWorkspaceClick,
  onClose,
}) => {
  // Read workspace data from Jotai atoms
  const currentWorkspace = useAtomValue(currentWorkspaceAtom);
  const workspaces = useAtomValue(workspacesAtom) as Workspace[];

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(event.target as Node)
      ) {
        setWorkspaceMenuOpen(false);
      }
    };

    if (workspaceMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [workspaceMenuOpen]);

  return (
    <div className="workspace-sidebar__header">
      {isAuthenticated && currentWorkspace ? (
        <div className="workspace-sidebar__workspace" ref={workspaceMenuRef}>
          <button
            className="workspace-sidebar__workspace-trigger"
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            aria-expanded={workspaceMenuOpen}
          >
            <div className="workspace-sidebar__workspace-avatar">
              {currentWorkspace.avatarUrl ? (
                <img
                  src={currentWorkspace.avatarUrl}
                  alt={currentWorkspace.name}
                />
              ) : (
                <span>{currentWorkspace.name[0].toUpperCase()}</span>
              )}
            </div>
            <span className="workspace-sidebar__workspace-name">
              {currentWorkspace.name}
            </span>
            <span
              className={`workspace-sidebar__chevron ${
                workspaceMenuOpen ? "workspace-sidebar__chevron--open" : ""
              }`}
            >
              {chevronIcon}
            </span>
          </button>

          {workspaceMenuOpen && (
            <div className="workspace-sidebar__workspace-menu">
              <div className="workspace-sidebar__menu-section-title">
                {t("workspace.switchWorkspace")}
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className={`workspace-sidebar__menu-item ${
                    ws.id === currentWorkspace.id
                      ? "workspace-sidebar__menu-item--active"
                      : ""
                  }`}
                  onClick={() => {
                    onSwitchWorkspace(ws);
                    setWorkspaceMenuOpen(false);
                  }}
                >
                  <div className="workspace-sidebar__workspace-avatar workspace-sidebar__workspace-avatar--small">
                    {ws.avatarUrl ? (
                      <img src={ws.avatarUrl} alt={ws.name} />
                    ) : (
                      <span>{ws.name[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span>{ws.name}</span>
                  {ws.id === currentWorkspace.id && (
                    <span className="workspace-sidebar__check">✓</span>
                  )}
                </button>
              ))}
              {user?.isSuperAdmin && (
                <>
                  <div className="workspace-sidebar__menu-divider" />
                  <button
                    className="workspace-sidebar__menu-item workspace-sidebar__menu-item--create"
                    onClick={() => {
                      onCreateWorkspaceClick();
                      setWorkspaceMenuOpen(false);
                    }}
                  >
                    <span className="workspace-sidebar__menu-item-icon">+</span>
                    <span>{t("workspace.createWorkspace")}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <h2 className="workspace-sidebar__title">
          <span>{t("workspace.title")}</span>
        </h2>
      )}
      <button
        className="workspace-sidebar__close"
        onClick={onClose}
        aria-label="Close"
      >
        {closeIcon}
      </button>
    </div>
  );
};

export default SidebarHeader;
