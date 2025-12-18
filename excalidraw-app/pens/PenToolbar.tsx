import React, { useCallback } from "react";
import clsx from "clsx";

import type {
  ExcalidrawImperativeAPI,
  PenStyle,
  PenOptions,
  AppState,
} from "@excalidraw/excalidraw/types";

import { PENS } from "./pens";

import "./PenToolbar.scss";

// Simple pen icons using SVG paths
const PenIcon = ({ type, isActive }: { type: string; isActive: boolean }) => {
  const getIconColor = () => {
    switch (type) {
      case "highlighter":
        return "#FFC47C";
      case "finetip":
        return "#3E6F8D";
      case "fountain":
        return "#000000";
      case "marker":
        return "#B83E3E";
      case "thick-thin":
      case "thin-thick-thin":
        return "#CECDCC";
      default:
        return "currentColor";
    }
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={getIconColor()}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === "highlighter" ? (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          <rect x="3" y="17" width="14" height="4" fill={getIconColor()} opacity="0.5" />
        </>
      ) : type === "finetip" ? (
        <path d="M12 19l7-7 3 3-7 7-3-3z M18 12l-1.5-1.5M2 21l3-3m0 0l7-7m3 3l-7 7" />
      ) : type === "fountain" ? (
        <>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          <path d="M15 5l3 3" />
        </>
      ) : type === "marker" ? (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="3" />
        </>
      ) : type === "thick-thin" ? (
        <path d="M4 20Q8 10 12 10T20 4" strokeWidth="3" />
      ) : type === "thin-thick-thin" ? (
        <path d="M4 20Q8 12 12 12T20 4" strokeWidth="2" />
      ) : (
        // Default pen icon
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      )}
    </svg>
  );
};

interface PenToolbarProps {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

export const PenToolbar: React.FC<PenToolbarProps> = ({ excalidrawAPI }) => {
  const appState = excalidrawAPI.getAppState();
  const currentStrokeOptions = appState.currentStrokeOptions;
  const isSidebarOpen = !!appState.openSidebar;

  const setPen = useCallback(
    (pen: PenStyle) => {
      const st = excalidrawAPI.getAppState();

      // Save current state if switching to a freedrawOnly pen
      const resetCustomPen =
        pen.freedrawOnly && !st.resetCustomPen
          ? {
              currentItemStrokeWidth: st.currentItemStrokeWidth,
              currentItemBackgroundColor: st.currentItemBackgroundColor,
              currentItemStrokeColor: st.currentItemStrokeColor,
              currentItemFillStyle: st.currentItemFillStyle as string,
              currentItemRoughness: st.currentItemRoughness,
            }
          : null;

      // Build the appState update object
      const appStateUpdate: Record<string, unknown> = {
        currentStrokeOptions: pen.penOptions,
      };

      if (pen.strokeWidth && pen.strokeWidth > 0) {
        appStateUpdate.currentItemStrokeWidth = pen.strokeWidth;
      }
      if (pen.backgroundColor) {
        appStateUpdate.currentItemBackgroundColor = pen.backgroundColor;
      }
      if (pen.strokeColor) {
        appStateUpdate.currentItemStrokeColor = pen.strokeColor;
      }
      if (pen.fillStyle !== "") {
        appStateUpdate.currentItemFillStyle = pen.fillStyle;
      }
      if (pen.roughness !== null) {
        appStateUpdate.currentItemRoughness = pen.roughness;
      }
      if (resetCustomPen) {
        appStateUpdate.resetCustomPen = resetCustomPen;
      }

      excalidrawAPI.updateScene({
        appState: appStateUpdate as Pick<AppState, keyof AppState>,
      });

      // Set freedraw tool
      excalidrawAPI.setActiveTool({ type: "freedraw" });
    },
    [excalidrawAPI],
  );

  const resetToDefault = useCallback(() => {
    const st = excalidrawAPI.getAppState();

    const appStateUpdate: Record<string, unknown> = {
      resetCustomPen: null,
      currentStrokeOptions: null,
    };

    if (st.resetCustomPen) {
      appStateUpdate.currentItemStrokeWidth =
        st.resetCustomPen.currentItemStrokeWidth;
      appStateUpdate.currentItemBackgroundColor =
        st.resetCustomPen.currentItemBackgroundColor;
      appStateUpdate.currentItemStrokeColor =
        st.resetCustomPen.currentItemStrokeColor;
      appStateUpdate.currentItemFillStyle =
        st.resetCustomPen.currentItemFillStyle;
      appStateUpdate.currentItemRoughness =
        st.resetCustomPen.currentItemRoughness;
    }

    excalidrawAPI.updateScene({
      appState: appStateUpdate as Pick<AppState, keyof AppState>,
    });
  }, [excalidrawAPI]);

  const isPenActive = (pen: PenStyle): boolean => {
    if (!currentStrokeOptions) {
      return false;
    }
    // Compare by pen options reference or values
    return (
      currentStrokeOptions.options?.thinning === pen.penOptions.options.thinning &&
      currentStrokeOptions.options?.smoothing === pen.penOptions.options.smoothing &&
      currentStrokeOptions.options?.streamline === pen.penOptions.options.streamline
    );
  };

  const penTypes = Object.keys(PENS) as Array<keyof typeof PENS>;

  return (
    <div
      className="pen-toolbar"
      style={{ right: isSidebarOpen ? "var(--right-sidebar-width, 302px)" : 0 }}
    >
      <div className="pen-toolbar__pens">
        {penTypes.map((penType) => {
          const pen = PENS[penType];
          const isActive = isPenActive(pen);

          return (
            <button
              key={penType}
              className={clsx("pen-toolbar__button", {
                "pen-toolbar__button--active": isActive,
              })}
              onClick={() => {
                if (isActive) {
                  resetToDefault();
                } else {
                  setPen(pen);
                }
              }}
              title={penType}
              type="button"
            >
              <PenIcon type={penType} isActive={isActive} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PenToolbar;
