/**
 * ThreadMarkersLayer - Data provider for comment thread markers
 *
 * This component manages comment marker data and writes it to Excalidraw's appState
 * for canvas rendering. The actual marker visuals are rendered by the canvas
 * (via renderCommentMarkers in clients.ts), not by DOM elements.
 *
 * For click/drag interaction, we keep invisible DOM hit targets that overlay
 * the canvas-rendered markers.
 *
 * Key features:
 * - Fetches threads from API and writes to appState.commentMarkers
 * - Provides invisible hit targets for click/drag interaction
 * - Updates canvas markers in real-time during drag for visual feedback
 * - Subscribes to scroll/zoom for hit target positioning
 * - Filters out resolved threads from display
 */

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
} from "@excalidraw/common";

import type {
  AppState,
  CommentMarker,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";

import { useAtomValue, useSetAtom } from "../../../app-jotai";
import { queryKeys } from "../../../lib/queryClient";
import { listThreads } from "../../../auth/api/comments";
import { selectThreadAtom, selectedThreadIdAtom } from "../commentsState";
import { useCommentMutations } from "../../../hooks/useCommentThreads";

import styles from "./ThreadMarkersLayer.module.scss";

import type { CommentThread } from "../../../auth/api/types";

export interface ThreadMarkersLayerProps {
  /** Scene ID to fetch threads for */
  sceneId: string;
  /** Excalidraw API for updating appState and subscribing to changes */
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

/**
 * Calculates position for a hit target relative to the Excalidraw container.
 */
function getHitTargetPosition(
  sceneX: number,
  sceneY: number,
  appState: AppState,
): { x: number; y: number } {
  const viewportCoords = sceneCoordsToViewportCoords(
    { sceneX, sceneY },
    appState,
  );

  // Convert from viewport coords to container-relative coords
  return {
    x: viewportCoords.x - appState.offsetLeft,
    y: viewportCoords.y - appState.offsetTop,
  };
}

/**
 * Converts thread data to CommentMarker format for canvas rendering.
 */
function threadToMarker(
  thread: CommentThread,
  selectedThreadId: string | null,
  dragOverride?: { id: string; x: number; y: number },
): CommentMarker {
  // If this thread is being dragged, use the drag position
  const x = dragOverride?.id === thread.id ? dragOverride.x : thread.x;
  const y = dragOverride?.id === thread.id ? dragOverride.y : thread.y;

  return {
    id: thread.id,
    x,
    y,
    resolved: thread.resolved,
    selected: thread.id === selectedThreadId,
    authorInitial: thread.createdBy.name?.charAt(0).toUpperCase() || "?",
    authorAvatar: thread.createdBy.avatar,
  };
}

export function ThreadMarkersLayer({
  sceneId,
  excalidrawAPI,
}: ThreadMarkersLayerProps) {
  const selectedThreadId = useAtomValue(selectedThreadIdAtom);
  const selectThread = useSetAtom(selectThreadAtom);
  const { updateThreadPosition } = useCommentMutations(sceneId);

  // Local state for hit target positioning (needs scroll/zoom reactivity)
  const [appState, setAppState] = useState<AppState | null>(null);

  // Drag state - lifted up to update canvas markers during drag
  const [dragState, setDragState] = useState<{
    threadId: string;
    sceneX: number;
    sceneY: number;
  } | null>(null);

  // Subscribe to scroll/zoom changes for hit target positioning
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

  // Also subscribe to onChange to catch offsetLeft/offsetTop changes
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    let lastOffsetLeft = excalidrawAPI.getAppState().offsetLeft;
    let lastOffsetTop = excalidrawAPI.getAppState().offsetTop;

    const unsubscribe = excalidrawAPI.onChange(() => {
      const currentState = excalidrawAPI.getAppState();
      if (
        currentState.offsetLeft !== lastOffsetLeft ||
        currentState.offsetTop !== lastOffsetTop
      ) {
        lastOffsetLeft = currentState.offsetLeft;
        lastOffsetTop = currentState.offsetTop;
        setAppState(currentState);
      }
    });

    return unsubscribe;
  }, [excalidrawAPI]);

  // Fetch threads for this scene
  const { data: allThreads = [] } = useQuery({
    queryKey: queryKeys.commentThreads.list(sceneId),
    queryFn: () => listThreads(sceneId),
    enabled: !!sceneId,
  });

  // Filter to only show unresolved threads
  const threads = useMemo(
    () => allThreads.filter((t) => !t.resolved),
    [allThreads],
  );

  // Write markers to appState for canvas rendering
  // Include drag position override for real-time visual feedback
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    const dragOverride = dragState
      ? { id: dragState.threadId, x: dragState.sceneX, y: dragState.sceneY }
      : undefined;

    const markers: CommentMarker[] = threads.map((t) =>
      threadToMarker(t, selectedThreadId, dragOverride),
    );

    excalidrawAPI.updateScene({
      appState: { commentMarkers: markers },
    });

    // Cleanup: clear markers when component unmounts
    return () => {
      excalidrawAPI.updateScene({
        appState: { commentMarkers: [] },
      });
    };
  }, [threads, selectedThreadId, excalidrawAPI, dragState]);

  // Handle drag start
  const handleDragStart = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        setDragState({
          threadId,
          sceneX: thread.x,
          sceneY: thread.y,
        });
      }
    },
    [threads],
  );

  // Handle drag move - update scene coordinates for canvas rendering
  const handleDragMove = useCallback(
    (threadId: string, clientX: number, clientY: number) => {
      if (!appState || dragState?.threadId !== threadId) {
        return;
      }

      // Convert viewport (client) coords directly to scene coords
      // viewportCoordsToSceneCoords expects clientX/clientY (browser window coords)
      const sceneCoords = viewportCoordsToSceneCoords(
        { clientX, clientY },
        appState,
      );

      setDragState({
        threadId,
        sceneX: sceneCoords.x,
        sceneY: sceneCoords.y,
      });
    },
    [appState, dragState?.threadId],
  );

  // Handle drag end - save to server
  const handleDragEnd = useCallback(
    async (threadId: string) => {
      if (!dragState || dragState.threadId !== threadId) {
        setDragState(null);
        return;
      }

      try {
        await updateThreadPosition({
          threadId,
          x: dragState.sceneX,
          y: dragState.sceneY,
        });
      } catch (err) {
        console.error("Failed to update marker position:", err);
      }

      setDragState(null);
    },
    [dragState, updateThreadPosition],
  );

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setDragState(null);
  }, []);

  // Calculate hit target positions
  const hitTargets = useMemo(() => {
    if (!appState) {
      return [];
    }

    return threads.map((thread) => {
      // Use drag position if this thread is being dragged
      const sceneX =
        dragState?.threadId === thread.id ? dragState.sceneX : thread.x;
      const sceneY =
        dragState?.threadId === thread.id ? dragState.sceneY : thread.y;

      return {
        thread,
        position: getHitTargetPosition(sceneX, sceneY, appState),
        isDragging: dragState?.threadId === thread.id,
      };
    });
  }, [threads, appState, dragState]);

  // Hide in presentation mode or when no markers
  if (
    !appState ||
    hitTargets.length === 0 ||
    appState.presentationMode?.active
  ) {
    return null;
  }

  // Render invisible hit targets for click/drag interaction
  return (
    <div className={styles.layer}>
      {hitTargets.map(({ thread, position, isDragging }) => (
        <HitTarget
          key={thread.id}
          threadId={thread.id}
          x={position.x}
          y={position.y}
          isSelected={thread.id === selectedThreadId}
          isDragging={isDragging}
          onClick={() => selectThread(thread.id)}
          onDragStart={() => handleDragStart(thread.id)}
          onDragMove={(containerX, containerY) =>
            handleDragMove(thread.id, containerX, containerY)
          }
          onDragEnd={() => handleDragEnd(thread.id)}
          onDragCancel={handleDragCancel}
        />
      ))}
    </div>
  );
}

/**
 * Invisible hit target for click/drag interaction.
 * The visual marker is rendered on canvas, this is just for interaction.
 */
interface HitTargetProps {
  threadId: string;
  x: number;
  y: number;
  isSelected: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
  onDragCancel: () => void;
}

function HitTarget({
  threadId,
  x,
  y,
  isSelected,
  isDragging,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: HitTargetProps) {
  // Track drag start position to detect actual drags vs clicks
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const hasDragStartedRef = useRef(false);
  const DRAG_THRESHOLD = 5;
  const CLICK_THRESHOLD = 200;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
      hasDragStartedRef.current = false;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Start drag if moved beyond threshold
      if (distance > DRAG_THRESHOLD && !hasDragStartedRef.current) {
        hasDragStartedRef.current = true;
        onDragStart();
      }

      if (hasDragStartedRef.current) {
        // Pass client (viewport) coordinates directly
        // viewportCoordsToSceneCoords will handle the conversion
        onDragMove(e.clientX, e.clientY);
      }
    },
    [onDragStart, onDragMove],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const elapsed = Date.now() - dragStartRef.current.time;

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (hasDragStartedRef.current) {
        // Was a drag - save position
        onDragEnd();
      } else if (elapsed < CLICK_THRESHOLD) {
        // Was a click
        onClick();
      }

      dragStartRef.current = null;
      hasDragStartedRef.current = false;
    },
    [onClick, onDragEnd],
  );

  const handlePointerCancel = useCallback(() => {
    if (hasDragStartedRef.current) {
      onDragCancel();
    }
    dragStartRef.current = null;
    hasDragStartedRef.current = false;
  }, [onDragCancel]);

  // Hit target dimensions matching the canvas-rendered marker
  // The pin is 32x32 rotated -45°, so bounding box is roughly 45x45
  // But we use a smaller hit area centered on the visual marker
  const PIN_SIZE = 32;
  const HIT_SIZE = 40; // Slightly larger than pin for easier clicking

  return (
    <div
      className={`${styles.hitTarget} ${isDragging ? styles.dragging : ""}`}
      style={{
        // Position so the bottom-left of hit area is at marker coords
        // (matching the pin tip position)
        transform: `translate(${x - HIT_SIZE / 4}px, ${y - HIT_SIZE}px)`,
        width: HIT_SIZE,
        height: HIT_SIZE,
      }}
      data-comment-marker
      data-thread-id={threadId}
      data-selected={isSelected}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
}
