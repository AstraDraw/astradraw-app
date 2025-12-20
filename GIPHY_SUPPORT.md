# Stickers & GIFs Sidebar (GIPHY Integration)

This document describes the Stickers & GIFs sidebar feature in AstraDraw, powered by GIPHY API.

## Overview

AstraDraw includes a sidebar tab for browsing and inserting GIFs, stickers, and emojis from GIPHY directly onto your canvas. The feature includes:

- **Search** - Search for GIFs, stickers, and emojis by keyword
- **Trending content** - Browse popular content when not searching
- **Content tabs** - Filter by All, Stickers, Emojis, or GIFs
- **One-click insertion** - Click any item to add it to your canvas
- **Localization** - Available in English and Russian

> **Note:** GIFs are inserted as static images on the canvas. Excalidraw does not currently support animated images. Stickers and emojis work well as static visual elements.

## Setup

### Getting a GIPHY API Key

1. Go to [developers.giphy.com](https://developers.giphy.com/)
2. Create an account or sign in
3. Click "Create an App"
4. Select "API" (not SDK)
5. Copy your API key

### Configuration

Add the GIPHY API key to your `.env` file:

```bash
GIPHY_API_KEY=your_api_key_here
```

The `docker-compose.yml` passes this to the container:

```yaml
- VITE_APP_GIPHY_API_KEY=${GIPHY_API_KEY:-}
```

If no API key is configured, the sidebar will display a message indicating the API key is missing.

## Architecture

```mermaid
flowchart TB
    subgraph SidebarButtons[Sidebar Tab Buttons]
        SearchBtn[Search]
        LibrariesBtn[Libraries]
        StickersBtn[Stickers & GIFs]
        CommentsBtn[Comments]
        PresentationBtn[Presentation]
    end

    subgraph StickersPanel[StickersPanel.tsx]
        SearchInput[Search Input]
        SubTabs[Sub-tabs: All / Stickers / Emojis / GIFs]
        TrendingLabel[Trending Header]
        MasonryGrid[Masonry Grid]
        PoweredBy[Powered by GIPHY]
    end

    subgraph GiphyAPI[GIPHY API]
        TrendingGifs[/v1/gifs/trending]
        SearchGifs[/v1/gifs/search]
        TrendingStickers[/v1/stickers/trending]
        SearchStickers[/v1/stickers/search]
        Emojis[/v2/emoji]
    end

    StickersBtn --> StickersPanel
    StickersPanel --> GiphyAPI
    MasonryGrid -->|onClick| InsertToCanvas[Insert to Canvas]
```

## Files

### New Files

| File | Description |
|------|-------------|
| `excalidraw-app/components/Stickers/StickersPanel.tsx` | Main panel component with search, tabs, and grid |
| `excalidraw-app/components/Stickers/StickersPanel.scss` | Styles for the panel UI |
| `excalidraw-app/components/Stickers/giphyApi.ts` | GIPHY API helper functions |
| `excalidraw-app/components/Stickers/index.ts` | Module exports |

### Modified Files

| File | Changes |
|------|---------|
| `excalidraw-app/components/AppSidebar.tsx` | Added Stickers tab trigger and content |
| `packages/excalidraw/components/icons.tsx` | Added `stickerIcon` |
| `packages/excalidraw/locales/en.json` | Added English translations |
| `packages/excalidraw/locales/ru-RU.json` | Added Russian translations |
| `Dockerfile` | Added `VITE_APP_GIPHY_API_KEY` placeholder |
| `docker-entrypoint.sh` | Added runtime injection for GIPHY API key |

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/gifs/trending` | Fetch trending GIFs |
| `GET /v1/gifs/search` | Search for GIFs |
| `GET /v1/stickers/trending` | Fetch trending stickers |
| `GET /v1/stickers/search` | Search for stickers |
| `GET /v2/emoji` | Fetch emoji collection |

## Translations

### English (en.json)

```json
"stickers": {
  "title": "Stickers & GIFs",
  "search": "Search",
  "all": "All",
  "stickersTab": "Stickers",
  "emojis": "Emojis",
  "gifs": "GIFs",
  "trending": "Trending",
  "noResults": "No results found",
  "loading": "Loading...",
  "error": "Failed to load content",
  "apiKeyMissing": "GIPHY API key is not configured",
  "poweredBy": "Powered by GIPHY",
  "clickToInsert": "Click to add to canvas"
}
```

### Russian (ru-RU.json)

```json
"stickers": {
  "title": "Стикеры и GIF",
  "search": "Поиск",
  "all": "Все",
  "stickersTab": "Стикеры",
  "emojis": "Эмодзи",
  "gifs": "GIF",
  "trending": "Популярное",
  "noResults": "Ничего не найдено",
  "loading": "Загрузка...",
  "error": "Не удалось загрузить контент",
  "apiKeyMissing": "API ключ GIPHY не настроен",
  "poweredBy": "При поддержке GIPHY",
  "clickToInsert": "Нажмите, чтобы добавить на холст"
}
```

## Usage

1. Open the sidebar by clicking the sticker icon (between Libraries and Comments)
2. Browse trending content or use the search bar
3. Switch between tabs: All, Stickers, Emojis, GIFs
4. Click any item to insert it at the center of your canvas
5. The item appears as an image element that you can move, resize, and style

## Known Limitations

- **Static images only**: GIFs are inserted as static images (first frame). Excalidraw does not support animated images.
- **API rate limits**: GIPHY free API has rate limits. For high-traffic deployments, consider upgrading to a paid GIPHY plan.
- **Internet required**: This feature requires internet access to fetch content from GIPHY.

## GIPHY Attribution

Per GIPHY's terms of service, the "Powered by GIPHY" attribution is displayed in the sidebar footer.
