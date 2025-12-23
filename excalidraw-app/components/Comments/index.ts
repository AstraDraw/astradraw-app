/**
 * Comments module - Canvas comment threads and discussions
 *
 * This module provides:
 * - Jotai atoms for UI state (commentsState.ts)
 * - Components for comment markers on canvas
 * - Comment creation overlay for click-to-create mode
 */

// State management
export {
  // UI state atoms
  selectedThreadIdAtom,
  isCommentModeAtom,
  commentFiltersAtom,
  pendingCommentPositionAtom,
  // Action atoms
  clearCommentSelectionAtom,
  toggleCommentModeAtom,
  selectThreadAtom,
  startCommentCreationAtom,
  cancelCommentCreationAtom,
  updateCommentFiltersAtom,
  resetCommentFiltersAtom,
} from "./commentsState";

// Canvas overlay components
export { ThreadMarkersLayer } from "./ThreadMarkersLayer";
export type { ThreadMarkersLayerProps } from "./ThreadMarkersLayer";

export { ThreadMarker } from "./ThreadMarker";
export type { ThreadMarkerProps } from "./ThreadMarker";

export { ThreadMarkerTooltip } from "./ThreadMarkerTooltip";
export type { ThreadMarkerTooltipProps } from "./ThreadMarkerTooltip";

export { CommentCreationOverlay } from "./CommentCreationOverlay";
export type { CommentCreationOverlayProps } from "./CommentCreationOverlay";
