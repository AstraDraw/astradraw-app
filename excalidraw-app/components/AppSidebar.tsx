import { useState, useCallback } from "react";

import { DefaultSidebar, Sidebar, THEME } from "@excalidraw/excalidraw";
import {
  messageCircleIcon,
  presentationIcon,
  stickerIcon,
  videoIcon,
} from "@excalidraw/excalidraw/components/icons";
import { LinkButton } from "@excalidraw/excalidraw/components/LinkButton";
import { useUIAppState } from "@excalidraw/excalidraw/context/ui-appState";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { PresentationPanel } from "./Presentation";
import { StickersPanel } from "./Stickers";
import { TalktrackPanel, TalktrackManager } from "./Talktrack";

import "./AppSidebar.scss";

interface AppSidebarProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ excalidrawAPI }) => {
  const { theme, openSidebar } = useUIAppState();
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);

  const handleStartRecording = useCallback(() => {
    setIsRecordingDialogOpen(true);
  }, []);

  const handleCloseRecordingDialog = useCallback(() => {
    setIsRecordingDialogOpen(false);
  }, []);

  return (
    <>
    <DefaultSidebar>
      <DefaultSidebar.TabTriggers>
        <Sidebar.TabTrigger
          tab="stickers"
          style={{ opacity: openSidebar?.tab === "stickers" ? 1 : 0.4 }}
        >
          {stickerIcon}
        </Sidebar.TabTrigger>
        <Sidebar.TabTrigger
          tab="talktrack"
          style={{ opacity: openSidebar?.tab === "talktrack" ? 1 : 0.4 }}
        >
          {videoIcon}
        </Sidebar.TabTrigger>
        <Sidebar.TabTrigger
          tab="presentation"
          style={{ opacity: openSidebar?.tab === "presentation" ? 1 : 0.4 }}
        >
          {presentationIcon}
        </Sidebar.TabTrigger>
      </DefaultSidebar.TabTriggers>
      <Sidebar.Tab tab="comments">
        <div className="app-sidebar-promo-container">
          <div
            className="app-sidebar-promo-image"
            style={{
              ["--image-source" as any]: `url(/oss_promo_comments_${
                theme === THEME.DARK ? "dark" : "light"
              }.jpg)`,
              opacity: 0.7,
            }}
          />
          <div className="app-sidebar-promo-text">
            Make comments with AstraDraw
          </div>
          <div className="app-sidebar-promo-coming-soon">Coming soon</div>
        </div>
      </Sidebar.Tab>
      <Sidebar.Tab tab="presentation">
        <PresentationPanel excalidrawAPI={excalidrawAPI} />
      </Sidebar.Tab>
      <Sidebar.Tab tab="stickers">
        <StickersPanel excalidrawAPI={excalidrawAPI} />
      </Sidebar.Tab>
        <Sidebar.Tab tab="talktrack">
          <TalktrackPanel
            excalidrawAPI={excalidrawAPI}
            onStartRecording={handleStartRecording}
          />
        </Sidebar.Tab>
    </DefaultSidebar>

      {/* Talktrack recording manager (handles dialogs and recording toolbar) */}
      <TalktrackManager
        excalidrawAPI={excalidrawAPI}
        isRecordingDialogOpen={isRecordingDialogOpen}
        onCloseRecordingDialog={handleCloseRecordingDialog}
      />
    </>
  );
};
