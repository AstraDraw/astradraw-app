/**
 * Comments module - Canvas comment threads and discussions
 *
 * This module provides:
 * - Jotai atoms for UI state (commentsState.ts)
 * - Components for comment markers, popups, and sidebar (future phases)
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
