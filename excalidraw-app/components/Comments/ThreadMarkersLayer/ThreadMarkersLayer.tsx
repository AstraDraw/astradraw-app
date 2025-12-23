/**
 * ThreadMarkersLayer - Renders comment thread markers on the canvas
 *
 * This component renders as an absolute positioned overlay inside Excalidraw's children.
 * It uses sceneCoordsToViewportCoords to position markers correctly based on
 * pan/zoom state.
 *
 * Key features:
 * - Subscribes to onScrollChange for real-time pan/zoom updates
 * - Supports drag-to-move markers
 * - Filters out resolved threads from canvas display
 */

import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
} from "@excalidraw/common";

import type {
  AppState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";

import { useAtomValue, useSetAtom } from "../../../app-jotai";
import { queryKeys } from "../../../lib/queryClient";
import { listThreads } from "../../../auth/api/comments";
import { selectThreadAtom, selectedThreadIdAtom } from "../commentsState";
import { useCommentMutations } from "../../../hooks/useCommentThreads";
import { ThreadMarker } from "../ThreadMarker/ThreadMarker";

import styles from "./ThreadMarkersLayer.module.scss";

import type { CommentThread } from "../../../auth/api/types";

export interface ThreadMarkersLayerProps {
  /** Scene ID to fetch threads for */
  sceneId: string;
  /** Excalidraw API for subscribing to scroll changes */
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

/**
 * Calculates viewport position for a thread marker
 */
function getMarkerPosition(
  thread: CommentThread,
  appState: AppState,
): { x: number; y: number } {
  return sceneCoordsToViewportCoords(
    { sceneX: thread.x, sceneY: thread.y },
    appState,
  );
}

export function ThreadMarkersLayer({
  sceneId,
  excalidrawAPI,
}: ThreadMarkersLayerProps) {
  const selectedThreadId = useAtomValue(selectedThreadIdAtom);
  const selectThread = useSetAtom(selectThreadAtom);
  const { updateThreadPosition } = useCommentMutations(sceneId);

  // Local state for appState - updated on scroll/zoom changes
  const [appState, setAppState] = useState<AppState | null>(null);

  // Subscribe to scroll/zoom changes for real-time marker position updates
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    // Get initial state
    setAppState(excalidrawAPI.getAppState());

    // Subscribe to scroll/zoom changes
    const unsubscribe = excalidrawAPI.onScrollChange(() => {
      setAppState(excalidrawAPI.getAppState());
    });

    return unsubscribe;
  }, [excalidrawAPI]);

  // Fetch threads for this scene
  const { data: allThreads = [] } = useQuery({
    queryKey: queryKeys.commentThreads.list(sceneId),
    queryFn: () => listThreads(sceneId),
    enabled: !!sceneId,
  });

  // Filter to only show unresolved threads on canvas
  // (client-side filter for instant optimistic updates)
  const threads = useMemo(
    () => allThreads.filter((t) => !t.resolved),
    [allThreads],
  );

  // Handle marker position change (drag)
  const handlePositionChange = useCallback(
    async (
      threadId: string,
      viewportX: number,
      viewportY: number,
    ): Promise<void> => {
      if (!appState) {
        return;
      }

      // Convert viewport coordinates to scene coordinates
      const sceneCoords = viewportCoordsToSceneCoords(
        { clientX: viewportX, clientY: viewportY },
        appState,
      );

      await updateThreadPosition({
        threadId,
        x: sceneCoords.x,
        y: sceneCoords.y,
      });
    },
    [appState, updateThreadPosition],
  );

  // Calculate marker positions when appState changes
  const markersWithPositions = useMemo(() => {
    if (!appState) {
      return [];
    }

    return threads.map((thread) => ({
      thread,
      position: getMarkerPosition(thread, appState),
    }));
  }, [threads, appState]);

  if (!appState || markersWithPositions.length === 0) {
    return null;
  }

  return (
    <div className={styles.layer}>
      {markersWithPositions.map(({ thread, position }) => (
        <ThreadMarker
          key={thread.id}
          thread={thread}
          x={position.x}
          y={position.y}
          isSelected={thread.id === selectedThreadId}
          onClick={() => selectThread(thread.id)}
          onPositionChange={(viewportX, viewportY) =>
            handlePositionChange(thread.id, viewportX, viewportY)
          }
        />
      ))}
    </div>
  );
}
