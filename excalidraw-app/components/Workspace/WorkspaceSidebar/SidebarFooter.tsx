import React from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { bellIcon } from "./icons";

import type { User } from "../../../auth";

interface SidebarFooterProps {
  user: User;
  onProfileClick: () => void;
}

const getInitials = (name: string | null, email: string): string => {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
};

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  user,
  onProfileClick,
}) => {
  return (
    <>
      <div className="workspace-sidebar__divider" />
      <div className="workspace-sidebar__footer">
        <button
          className="workspace-sidebar__user-button"
          onClick={onProfileClick}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || user.email}
              className="workspace-sidebar__user-avatar"
            />
          ) : (
            <div className="workspace-sidebar__user-avatar workspace-sidebar__user-avatar--initials">
              {getInitials(user.name, user.email)}
            </div>
          )}
          <span className="workspace-sidebar__user-name">
            {user.name || user.email}
          </span>
        </button>
        <button
          className="workspace-sidebar__notification-button"
          title={t("workspace.notifications")}
        >
          {bellIcon}
        </button>
      </div>
    </>
  );
};

export default SidebarFooter;
