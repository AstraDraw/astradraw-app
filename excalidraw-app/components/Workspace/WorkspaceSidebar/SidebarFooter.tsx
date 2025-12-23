import React from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { bellIcon } from "./icons";
import styles from "./WorkspaceSidebar.module.scss";

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
      <div className={styles.divider} />
      <div className={styles.footer}>
        <button className={styles.userButton} onClick={onProfileClick}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || user.email}
              className={styles.userAvatar}
            />
          ) : (
            <div
              className={`${styles.userAvatar} ${styles.userAvatarInitials}`}
            >
              {getInitials(user.name, user.email)}
            </div>
          )}
          <span className={styles.userName}>{user.name || user.email}</span>
        </button>
        <button
          className={styles.notificationButton}
          title={t("workspace.notifications")}
        >
          {bellIcon}
        </button>
      </div>
    </>
  );
};

export default SidebarFooter;
