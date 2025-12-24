/**
 * Notifications Module
 *
 * Components for displaying user notifications (bell icon, popup, etc.)
 */

// Main components
export { NotificationBell } from "./NotificationBell";
export { NotificationBadge } from "./NotificationBadge";
export { NotificationPopup, NotificationPopupItem } from "./NotificationPopup";

// Skeletons
export {
  NotificationItemSkeleton,
  NotificationSkeletonList,
} from "./Skeletons";

// State
export {
  isNotificationPopupOpenAtom,
  toggleNotificationPopupAtom,
  closeNotificationPopupAtom,
  openNotificationPopupAtom,
} from "./notificationsState";
