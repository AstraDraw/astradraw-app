/**
 * ThreadMarkersLayer - Renders comment thread markers on the canvas
 *
 * This component renders as an absolute positioned overlay inside Excalidraw's children.
 * It uses sceneCoordsToViewportCoords to position markers correctly based on
 * pan/zoom state.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";

import type { AppState } from "@excalidraw/excalidraw/types";

import { useAtomValue, useSetAtom } from "../../../app-jotai";
import { queryKeys } from "../../../lib/queryClient";
import { listThreads } from "../../../auth/api/comments";
import { selectThreadAtom, selectedThreadIdAtom } from "../commentsState";
import { ThreadMarker } from "../ThreadMarker/ThreadMarker";

import styles from "./ThreadMarkersLayer.module.scss";

import type { CommentThread } from "../../../auth/api/types";

export interface ThreadMarkersLayerProps {
  /** Scene ID to fetch threads for */
  sceneId: string;
  /** Excalidraw app state (for coordinate transformation) */
  appState: AppState | undefined;
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
  appState,
}: ThreadMarkersLayerProps) {
  const selectedThreadId = useAtomValue(selectedThreadIdAtom);
  const selectThread = useSetAtom(selectThreadAtom);

  // Fetch threads for this scene (only unresolved ones for canvas markers)
  const { data: threads = [] } = useQuery({
    queryKey: queryKeys.commentThreads.list(sceneId),
    queryFn: () => listThreads(sceneId, { resolved: false }),
    enabled: !!sceneId,
  });

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
        />
      ))}
    </div>
  );
}
