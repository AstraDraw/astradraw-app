import { DefaultSidebar, Sidebar, THEME } from "@excalidraw/excalidraw";
import {
  messageCircleIcon,
  presentationIcon,
  stickerIcon,
} from "@excalidraw/excalidraw/components/icons";
import { LinkButton } from "@excalidraw/excalidraw/components/LinkButton";
import { useUIAppState } from "@excalidraw/excalidraw/context/ui-appState";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { PresentationPanel } from "./Presentation";
import { StickersPanel } from "./Stickers";

import "./AppSidebar.scss";

interface AppSidebarProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ excalidrawAPI }) => {
  const { theme, openSidebar } = useUIAppState();

  return (
    <DefaultSidebar>
      <DefaultSidebar.TabTriggers>
        <Sidebar.TabTrigger
          tab="stickers"
          style={{ opacity: openSidebar?.tab === "stickers" ? 1 : 0.4 }}
        >
          {stickerIcon}
        </Sidebar.TabTrigger>
        <Sidebar.TabTrigger
          tab="comments"
          style={{ opacity: openSidebar?.tab === "comments" ? 1 : 0.4 }}
        >
          {messageCircleIcon}
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
    </DefaultSidebar>
  );
};
