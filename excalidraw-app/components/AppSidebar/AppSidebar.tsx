import { useState, useCallback } from "react";

import { DefaultSidebar, Sidebar, THEME } from "@excalidraw/excalidraw";
import { t } from "@excalidraw/excalidraw/i18n";
import {
  presentationIcon,
  stickerIcon,
  videoIcon,
} from "@excalidraw/excalidraw/components/icons";
import { useUIAppState } from "@excalidraw/excalidraw/context/ui-appState";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { PresentationPanel } from "../Presentation";
import { StickersPanel } from "../Stickers";
import { TalktrackPanel, TalktrackManager } from "../Talktrack";

import styles from "./AppSidebar.module.scss";

export interface AppSidebarProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  sceneId: string | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  excalidrawAPI,
  sceneId,
}) => {
  const { theme, openSidebar } = useUIAppState();
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  const [recordingsRefreshKey, setRecordingsRefreshKey] = useState(0);

  const handleStartRecording = useCallback(() => {
    setIsRecordingDialogOpen(true);
  }, []);

  const handleCloseRecordingDialog = useCallback(() => {
    setIsRecordingDialogOpen(false);
  }, []);

  // Called when a recording is saved to refresh the panel
  const handleRecordingSaved = useCallback(() => {
    setRecordingsRefreshKey((prev) => prev + 1);
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
          <div className={styles.promoContainer}>
            <div
              className={styles.promoImage}
              style={{
                ["--image-source" as string]: `url(/oss_promo_comments_${
                  theme === THEME.DARK ? "dark" : "light"
                }.jpg)`,
                opacity: 0.7,
              }}
            />
            <div className={styles.promoText}>{t("comments.promoTitle")}</div>
            <div className={styles.promoComingSoon}>
              {t("comments.comingSoon")}
            </div>
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
            key={recordingsRefreshKey}
            excalidrawAPI={excalidrawAPI}
            onStartRecording={handleStartRecording}
            sceneId={sceneId}
          />
        </Sidebar.Tab>
      </DefaultSidebar>

      {/* Talktrack recording manager (handles dialogs and recording toolbar) */}
      <TalktrackManager
        excalidrawAPI={excalidrawAPI}
        isRecordingDialogOpen={isRecordingDialogOpen}
        onCloseRecordingDialog={handleCloseRecordingDialog}
        sceneId={sceneId}
        onRecordingSaved={handleRecordingSaved}
      />
    </>
  );
};
