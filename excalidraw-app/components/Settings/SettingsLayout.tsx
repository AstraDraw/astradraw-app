import React from "react";
import { useAtom, useSetAtom } from "jotai";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAuth } from "../../auth";
import {
  settingsPageAtom,
  navigateToCanvasAtom,
  type SettingsPage,
} from "./settingsState";

import "./SettingsLayout.scss";

// Icons
const backIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const userIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const settingsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const usersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const folderIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

interface NavItem {
  id: SettingsPage;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    id: "profile",
    icon: userIcon,
  },
  {
    id: "workspace",
    icon: settingsIcon,
    adminOnly: true,
  },
  {
    id: "members",
    icon: usersIcon,
    adminOnly: true,
  },
  {
    id: "teams-collections",
    icon: folderIcon,
    adminOnly: true,
  },
];

const getNavLabel = (id: SettingsPage): string => {
  switch (id) {
    case "profile":
      return t("settings.profile");
    case "workspace":
      return t("settings.workspace");
    case "members":
      return t("settings.members");
    case "teams-collections":
      return t("settings.teamsCollections");
    default:
      return id;
  }
};

interface SettingsLayoutProps {
  children: React.ReactNode;
  workspaceName?: string;
  workspaceAvatarUrl?: string | null;
  isAdmin?: boolean;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  workspaceName = "Workspace",
  workspaceAvatarUrl,
  isAdmin = false,
}) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useAtom(settingsPageAtom);
  const navigateToCanvas = useSetAtom(navigateToCanvasAtom);

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

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <div className="settings-layout">
      {/* Top App Bar */}
      <header className="settings-layout__header">
        <div className="settings-layout__header-left">
          <button
            className="settings-layout__back-button"
            onClick={() => navigateToCanvas()}
            title={t("settings.backToBoard")}
          >
            {backIcon}
            <span>{t("settings.backToBoard")}</span>
          </button>
        </div>

        <div className="settings-layout__header-center">
          <div className="settings-layout__workspace">
            <div className="settings-layout__workspace-avatar">
              {workspaceAvatarUrl ? (
                <img src={workspaceAvatarUrl} alt={workspaceName} />
              ) : (
                <span>{workspaceName[0].toUpperCase()}</span>
              )}
            </div>
            <span className="settings-layout__workspace-name">
              {workspaceName}
            </span>
          </div>
        </div>

        <div className="settings-layout__header-right">
          {user && (
            <button
              className="settings-layout__user-button"
              onClick={() => setCurrentPage("profile")}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || user.email}
                  className="settings-layout__user-avatar"
                />
              ) : (
                <div className="settings-layout__user-avatar settings-layout__user-avatar--initials">
                  {getInitials(user.name, user.email)}
                </div>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="settings-layout__body">
        {/* Settings Sidebar */}
        <nav className="settings-layout__sidebar">
          <div className="settings-layout__nav">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                className={`settings-layout__nav-item ${
                  currentPage === item.id
                    ? "settings-layout__nav-item--active"
                    : ""
                }`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="settings-layout__nav-icon">{item.icon}</span>
                <span className="settings-layout__nav-label">
                  {getNavLabel(item.id)}
                </span>
              </button>
            ))}
          </div>

          <div className="settings-layout__sidebar-footer">
            <button
              className="settings-layout__board-button"
              onClick={() => navigateToCanvas()}
            >
              {backIcon}
              <span>{t("settings.backToBoard")}</span>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="settings-layout__content">{children}</main>
      </div>
    </div>
  );
};

export default SettingsLayout;

