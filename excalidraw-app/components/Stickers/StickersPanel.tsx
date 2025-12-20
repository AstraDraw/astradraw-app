import clsx from "clsx";
import { useCallback, useEffect, useState, useRef } from "react";

import { randomId } from "@excalidraw/common";
import { newImageElement } from "@excalidraw/element";
import { t, type TranslationKeys } from "@excalidraw/excalidraw/i18n";
import { searchIcon } from "@excalidraw/excalidraw/components/icons";

import type { ExcalidrawImperativeAPI, DataURL } from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/element/types";

import {
  fetchTrending,
  searchContent,
  imageUrlToDataUrl,
  isApiKeyConfigured,
  type ContentType,
  type GiphyItem,
} from "./giphyApi";

import "./StickersPanel.scss";

interface StickersPanelProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

const CONTENT_TABS: { id: ContentType; labelKey: TranslationKeys }[] = [
  { id: "all", labelKey: "stickers.all" },
  { id: "stickers", labelKey: "stickers.stickersTab" },
  { id: "emojis", labelKey: "stickers.emojis" },
  { id: "gifs", labelKey: "stickers.gifs" },
];

const GiphyLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 164 35"
    height="16"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <g fill="currentColor">
      <path d="M0 3h4v29H0zM8 3h4v29H8z" />
      <path d="M0 3h11v4H0zM0 14h11v4H0zM0 28h11v4H0zM22 0h4v35h-4zM35 3h4v29h-4zM43 3h4v29h-4z" />
      <path d="M35 3h12v4H35zM35 14h12v4H35zM35 28h12v4H35z" />
      <path d="M22 14h9v4h-9zM57 3h4v29h-4z" />
      <path d="M57 3h11v4H57zM64 3h4v29h-4zM78 3h4v29h-4z" />
      <path d="M78 3h11v4H78zM78 28h11v4H78z" />
      <path d="M85 17h4v15h-4zM99 7h4v25h-4z" />
      <path d="M99 7h8v4h-8zM99 17h8v4h-8z" />
      <path d="M104 10h4v11h-4zM117 3h4v29h-4z" />
      <path d="M117 28h11v4h-11z" />
      <path d="M124 17h4v15h-4zM117 3h11v4h-11z" />
      <path d="M124 3h4v11h-4zM138 7h4v25h-4zM152 7h4v25h-4z" />
      <path d="M138 3h18v4h-18zM142 17h10v4h-10z" />
    </g>
  </svg>
);

export const StickersPanel: React.FC<StickersPanelProps> = ({ excalidrawAPI }) => {
  const [activeTab, setActiveTab] = useState<ContentType>("gifs");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<GiphyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertingId, setInsertingId] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if API key is configured
  const apiKeyMissing = !isApiKeyConfigured();

  // Load content when tab changes or search query changes
  const loadContent = useCallback(async (query: string, type: ContentType) => {
    if (apiKeyMissing) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = query.trim()
        ? await searchContent(type, query)
        : await fetchTrending(type);
      setItems(response.data);
    } catch (err) {
      console.error("Failed to load GIPHY content:", err);
      setError(t("stickers.error"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiKeyMissing]);

  // Initial load and tab change
  useEffect(() => {
    loadContent(searchQuery, activeTab);
  }, [activeTab, loadContent, searchQuery]);

  // Debounced search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      loadContent(query, activeTab);
    }, 300);
  }, [activeTab, loadContent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Insert GIF/sticker to canvas
  const handleItemClick = useCallback(async (item: GiphyItem) => {
    if (!excalidrawAPI || insertingId) {
      return;
    }

    setInsertingId(item.id);

    try {
      // Get the fixed_width URL for reasonable file size
      const imageUrl = item.images.fixed_width.url;
      const width = parseInt(item.images.fixed_width.width, 10);
      const height = parseInt(item.images.fixed_width.height, 10);

      // Convert to data URL
      const dataUrl = await imageUrlToDataUrl(imageUrl);
      const fileId = randomId() as FileId;

      // Add file to excalidraw
      excalidrawAPI.addFiles([
        {
          id: fileId,
          dataURL: dataUrl as DataURL,
          mimeType: "image/gif",
          created: Date.now(),
        },
      ]);

      // Get current app state for positioning
      const appState = excalidrawAPI.getAppState();
      const elements = excalidrawAPI.getSceneElements();

      // Calculate center position in canvas coordinates
      const centerX = appState.scrollX + appState.width / 2 / appState.zoom.value - width / 2;
      const centerY = appState.scrollY + appState.height / 2 / appState.zoom.value - height / 2;

      // Create image element
      const imageElement = newImageElement({
        type: "image",
        x: centerX,
        y: centerY,
        width,
        height,
        fileId,
        status: "saved",
      });

      // Update scene with new element
      excalidrawAPI.updateScene({
        elements: [...elements, imageElement],
      });

      // Show success toast
      excalidrawAPI.setToast({
        message: t("stickers.clickToInsert"),
        duration: 1500,
        closable: true,
      });
    } catch (err) {
      console.error("Failed to insert GIF:", err);
      excalidrawAPI.setToast({
        message: t("stickers.error"),
        duration: 3000,
        closable: true,
      });
    } finally {
      setInsertingId(null);
    }
  }, [excalidrawAPI, insertingId]);

  // Render API key missing state
  if (apiKeyMissing) {
    return (
      <div className="stickers-panel">
        <div className="stickers-panel__error">
          <div className="stickers-panel__error-icon">⚠️</div>
          <p>{t("stickers.apiKeyMissing")}</p>
        </div>
        <div className="stickers-panel__footer">
          <span className="stickers-panel__powered-by">
            {t("stickers.poweredBy")} <GiphyLogo />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="stickers-panel" onWheel={(e) => e.stopPropagation()}>
      {/* Search input */}
      <div className="stickers-panel__search">
        <span className="stickers-panel__search-icon">{searchIcon}</span>
        <input
          ref={searchInputRef}
          type="text"
          className="stickers-panel__search-input"
          placeholder={t("stickers.search")}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Content type tabs */}
      <div className="stickers-panel__tabs">
        {CONTENT_TABS.map((tab) => (
          <button
            key={tab.id}
            className={clsx("stickers-panel__tab", {
              "stickers-panel__tab--active": activeTab === tab.id,
            })}
            onClick={() => setActiveTab(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Trending/Search results label */}
      <div className="stickers-panel__section-header">
        {searchQuery.trim() ? searchQuery : t("stickers.trending")}
      </div>

      {/* Content grid */}
      <div 
        className="stickers-panel__grid-container" 
        ref={gridContainerRef}
        onWheel={(e) => e.stopPropagation()}
      >
        {loading && items.length === 0 ? (
          <div className="stickers-panel__loading">
            <div className="stickers-panel__spinner" />
            <span>{t("stickers.loading")}</span>
          </div>
        ) : error ? (
          <div className="stickers-panel__error">
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="stickers-panel__empty">
            <p>{t("stickers.noResults")}</p>
          </div>
        ) : (
          <div className="stickers-panel__grid">
            {items.map((item) => (
              <button
                key={item.id}
                className={clsx("stickers-panel__item", {
                  "stickers-panel__item--inserting": insertingId === item.id,
                })}
                onClick={() => handleItemClick(item)}
                title={item.title || t("stickers.clickToInsert")}
                disabled={insertingId !== null}
              >
                <img
                  src={item.images.fixed_width_still?.url || item.images.fixed_width.url}
                  alt={item.title}
                  loading="lazy"
                  onMouseEnter={(e) => {
                    // Show animated version on hover
                    (e.target as HTMLImageElement).src = item.images.fixed_width.url;
                  }}
                  onMouseLeave={(e) => {
                    // Show still version when not hovering
                    if (item.images.fixed_width_still?.url) {
                      (e.target as HTMLImageElement).src = item.images.fixed_width_still.url;
                    }
                  }}
                />
                {insertingId === item.id && (
                  <div className="stickers-panel__item-loading">
                    <div className="stickers-panel__spinner stickers-panel__spinner--small" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with GIPHY attribution */}
      <div className="stickers-panel__footer">
        <span className="stickers-panel__powered-by">
          {t("stickers.poweredBy")} <GiphyLogo />
        </span>
      </div>
    </div>
  );
};

