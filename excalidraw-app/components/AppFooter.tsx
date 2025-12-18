import { Footer, FooterLeftExtra } from "@excalidraw/excalidraw/index";
import { presentationIcon } from "@excalidraw/excalidraw/components/icons";
import { Tooltip } from "@excalidraw/excalidraw/components/Tooltip";
import { t } from "@excalidraw/excalidraw/i18n";
import React from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { isExcalidrawPlusSignedUser } from "../app_constants";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";
import { EncryptedIcon } from "./EncryptedIcon";

import "./AppFooter.scss";

interface AppFooterProps {
  onChange: () => void;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const AppFooter = React.memo(
  ({ onChange, excalidrawAPI }: AppFooterProps) => {
    const handleTogglePresentationSidebar = () => {
      if (!excalidrawAPI) {
        return;
      }

      const appState = excalidrawAPI.getAppState();
      const sidebarIsOpen = appState.openSidebar?.name === "default";

      if (sidebarIsOpen) {
        // Sidebar is open - close it
        excalidrawAPI.updateScene({
          appState: { openSidebar: null },
        });
      } else {
        // Sidebar is closed - open to presentation tab
        excalidrawAPI.updateScene({
          appState: { openSidebar: { name: "default", tab: "presentation" } },
        });
      }
    };

    return (
      <>
        {/* Presentation toggle button - positioned after undo/redo in footer left */}
        <FooterLeftExtra>
          <Tooltip label={t("presentation.toggleSidebar")}>
            <button
              className="app-footer__presentation-button ToolIcon_type_button ToolIcon_size_medium ToolIcon_type_button--show ToolIcon"
              onClick={handleTogglePresentationSidebar}
              type="button"
              aria-label={t("presentation.toggleSidebar")}
            >
              <div className="ToolIcon__icon" aria-hidden="true">
                {presentationIcon}
              </div>
            </button>
          </Tooltip>
        </FooterLeftExtra>

        {/* Center footer content */}
        <Footer>
          <div
            style={{
              display: "flex",
              gap: ".5rem",
              alignItems: "center",
            }}
          >
            {isVisualDebuggerEnabled() && <DebugFooter onChange={onChange} />}
            {!isExcalidrawPlusSignedUser && <EncryptedIcon />}
          </div>
        </Footer>
      </>
    );
  },
);
