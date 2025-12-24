import React from "react";

import { t } from "@excalidraw/excalidraw/i18n";

import { useAtom } from "../../../app-jotai";

import { useUnreadCount } from "../../../hooks/useNotifications";
import { isNotificationPopupOpenAtom } from "../notificationsState";
import { NotificationBadge } from "../NotificationBadge";
import { NotificationPopup } from "../NotificationPopup";
import { bellIcon } from "../../Workspace/WorkspaceSidebar/icons";

import styles from "./NotificationBell.module.scss";

interface NotificationBellProps {
  /** Current workspace slug for building URLs */
  workspaceSlug?: string;
  /** Whether notifications are enabled (user is authenticated) */
  enabled?: boolean;
  /** Callback when navigating to a notification */
  onNavigate?: (sceneId: string, threadId?: string, commentId?: string) => void;
}

/**
 * Notification bell icon with badge and popup.
 *
 * Features:
 * - Bell icon in sidebar footer
 * - Red badge showing unread count (max "5+")
 * - Click toggles notification popup
 * - Unread count polls every 60 seconds
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  workspaceSlug,
  enabled = true,
  onNavigate,
}) => {
  const [isPopupOpen, setIsPopupOpen] = useAtom(isNotificationPopupOpenAtom);
  const { count } = useUnreadCount({ enabled });

  const handleClick = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={handleClick}
        title={t("workspace.notifications")}
        aria-label={t("workspace.notifications")}
        aria-expanded={isPopupOpen}
        aria-haspopup="true"
      >
        {bellIcon}
        <NotificationBadge count={count} />
      </button>

      {isPopupOpen && (
        <NotificationPopup
          workspaceSlug={workspaceSlug}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

export default NotificationBell;
