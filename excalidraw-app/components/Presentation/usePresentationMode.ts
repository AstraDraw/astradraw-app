import { useCallback, useEffect, useRef } from "react";

import type { ExcalidrawFrameLikeElement } from "@excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { atom, useAtom } from "../../app-jotai";

// Atoms for presentation state
export const presentationModeAtom = atom(false);
export const currentSlideAtom = atom(0);
export const slidesAtom = atom<ExcalidrawFrameLikeElement[]>([]);
export const isLaserActiveAtom = atom(false);
export const originalThemeAtom = atom<"light" | "dark" | null>(null);

// Atom for custom slide order (frame IDs in presentation order)
export const slideOrderAtom = atom<string[]>([]);

// Type for frame rendering state
type FrameRenderingState = {
  enabled: boolean;
  name: boolean;
  outline: boolean;
  clip: boolean;
};

// Atom for original frame rendering state (to restore after presentation)
export const originalFrameRenderingAtom = atom<FrameRenderingState | null>(
  null,
);

export interface UsePresentationModeOptions {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const usePresentationMode = ({
  excalidrawAPI,
}: UsePresentationModeOptions) => {
  const [isPresentationMode, setIsPresentationMode] = useAtom(
    presentationModeAtom,
  );
  const [currentSlide, setCurrentSlide] = useAtom(currentSlideAtom);
  const [slides, setSlides] = useAtom(slidesAtom);
  const [isLaserActive, setIsLaserActive] = useAtom(isLaserActiveAtom);
  const [originalTheme, setOriginalTheme] = useAtom(originalThemeAtom);
  const [originalFrameRendering, setOriginalFrameRendering] = useAtom(
    originalFrameRenderingAtom,
  );
  const isFullscreenRef = useRef(false);

  // Get frames sorted alphabetically by name
  const getFrames = useCallback((): ExcalidrawFrameLikeElement[] => {
    if (!excalidrawAPI) {
      return [];
    }

    const elements = excalidrawAPI.getSceneElements();
    const frames: ExcalidrawFrameLikeElement[] = [];

    for (const el of elements) {
      if (el.type === "frame" && !el.isDeleted) {
        frames.push(el as ExcalidrawFrameLikeElement);
      }
    }

    // Sort frames alphabetically by name, then by creation order
    return frames.sort((a, b) => {
      const nameA = a.name || `Frame ${a.id}`;
      const nameB = b.name || `Frame ${b.id}`;
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
  }, [excalidrawAPI]);

  // Animation duration for slide transitions (ms)
  const SLIDE_TRANSITION_DURATION = 800;

  // How much of the viewport the frame should fill (1.0 = 100%, edge-to-edge on limiting dimension)
  const PRESENTATION_VIEWPORT_ZOOM_FACTOR = 1.0;

  // Navigate to a specific slide
  const goToSlide = useCallback(
    (slideIndex: number) => {
      if (!excalidrawAPI || slides.length === 0) {
        return;
      }

      const targetIndex = Math.max(0, Math.min(slideIndex, slides.length - 1));
      const frame = slides[targetIndex];

      if (frame) {
        setCurrentSlide(targetIndex);
        excalidrawAPI.scrollToContent(frame, {
          fitToViewport: true,
          viewportZoomFactor: PRESENTATION_VIEWPORT_ZOOM_FACTOR,
          animate: true,
          duration: SLIDE_TRANSITION_DURATION,
        });
      }
    },
    [excalidrawAPI, slides, setCurrentSlide],
  );

  // Navigation functions
  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // Toggle laser pointer
  const toggleLaser = useCallback(() => {
    if (!excalidrawAPI) {
      return;
    }

    if (isLaserActive) {
      excalidrawAPI.setActiveTool({ type: "selection" });
      setIsLaserActive(false);
    } else {
      excalidrawAPI.setActiveTool({ type: "laser" });
      setIsLaserActive(true);
    }
  }, [excalidrawAPI, isLaserActive, setIsLaserActive]);

  // Toggle theme during presentation
  const toggleTheme = useCallback(() => {
    if (!excalidrawAPI) {
      return;
    }

    const appState = excalidrawAPI.getAppState();
    const newTheme = appState.theme === "dark" ? "light" : "dark";

    excalidrawAPI.updateScene({
      appState: { theme: newTheme },
    });
  }, [excalidrawAPI]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        isFullscreenRef.current = true;
      } else {
        await document.exitFullscreen();
        isFullscreenRef.current = false;
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // Start presentation
  const startPresentation = useCallback(() => {
    if (!excalidrawAPI) {
      return;
    }

    // Use existing ordered slides if already set (from PresentationPanel),
    // otherwise fall back to alphabetically sorted frames
    const frames = slides.length > 0 ? slides : getFrames();
    if (frames.length === 0) {
      excalidrawAPI.setToast({
        message: "No frames found. Add frames to create slides.",
        duration: 3000,
        closable: true,
      });
      return;
    }

    // Save current theme and frame rendering state
    const appState = excalidrawAPI.getAppState();
    setOriginalTheme(appState.theme);
    setOriginalFrameRendering(appState.frameRendering);

    // Set up presentation state - only update slides if not already set
    if (slides.length === 0) {
      setSlides(frames);
    }
    setCurrentSlide(0);
    setIsPresentationMode(true);
    setIsLaserActive(false);

    // Add presentation mode class to body for CSS hiding of UI elements
    document.body.classList.add("excalidraw-presentation-mode");

    // Close sidebar before starting presentation
    excalidrawAPI.toggleSidebar({ name: "default", force: false });

    // Enable view mode, hide UI, and hide frame borders/names
    excalidrawAPI.updateScene({
      appState: {
        viewModeEnabled: true,
        zenModeEnabled: true,
        frameRendering: {
          enabled: appState.frameRendering.enabled,
          clip: appState.frameRendering.clip,
          outline: false, // Hide frame borders in presentation
          name: false, // Hide frame names in presentation
        },
      },
    });

    // Set laser tool as the default for presentation
    // Use setTimeout to ensure the scene update is processed first
    setTimeout(() => {
      excalidrawAPI.setActiveTool({ type: "laser" });
      setIsLaserActive(true);
    }, 50);

    // Navigate to first slide with smooth animation
    setTimeout(() => {
      if (frames[0]) {
        excalidrawAPI.scrollToContent(frames[0], {
          fitToViewport: true,
          viewportZoomFactor: PRESENTATION_VIEWPORT_ZOOM_FACTOR,
          animate: true,
          duration: SLIDE_TRANSITION_DURATION,
        });
      }
    }, 150);
  }, [
    excalidrawAPI,
    getFrames,
    slides,
    setSlides,
    setCurrentSlide,
    setIsPresentationMode,
    setIsLaserActive,
    setOriginalTheme,
    setOriginalFrameRendering,
  ]);

  // End presentation
  const endPresentation = useCallback(async () => {
    if (!excalidrawAPI) {
      return;
    }

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error("Exit fullscreen error:", err);
      }
    }

    // Restore original theme and frame rendering state
    // Build appState updates - always include viewModeEnabled and zenModeEnabled
    // Conditionally include theme and frameRendering if they were saved
    const restoredAppState: {
      viewModeEnabled: boolean;
      zenModeEnabled: boolean;
      theme?: "light" | "dark";
      frameRendering?: FrameRenderingState;
    } = {
      viewModeEnabled: false,
      zenModeEnabled: false,
    };

    if (originalTheme) {
      restoredAppState.theme = originalTheme;
    }
    if (originalFrameRendering) {
      restoredAppState.frameRendering = originalFrameRendering;
    }

    excalidrawAPI.updateScene({
      appState: restoredAppState as Parameters<
        typeof excalidrawAPI.updateScene
      >[0]["appState"],
    });

    // Remove presentation mode class from body
    document.body.classList.remove("excalidraw-presentation-mode");

    // Reset presentation state
    setIsPresentationMode(false);
    setIsLaserActive(false);
    setSlides([]);
    setCurrentSlide(0);
    setOriginalTheme(null);
    setOriginalFrameRendering(null);

    // Reset to selection tool
    excalidrawAPI.setActiveTool({ type: "selection" });
  }, [
    excalidrawAPI,
    originalTheme,
    originalFrameRendering,
    setIsPresentationMode,
    setIsLaserActive,
    setSlides,
    setCurrentSlide,
    setOriginalTheme,
    setOriginalFrameRendering,
  ]);

  // Keyboard event handler
  useEffect(() => {
    if (!isPresentationMode) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          nextSlide();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          prevSlide();
          break;
        case "Escape":
          e.preventDefault();
          endPresentation();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "l":
        case "L":
          e.preventDefault();
          toggleLaser();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPresentationMode,
    nextSlide,
    prevSlide,
    endPresentation,
    toggleFullscreen,
    toggleLaser,
  ]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      isFullscreenRef.current = !!document.fullscreenElement;
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return {
    isPresentationMode,
    currentSlide,
    slides,
    setSlides,
    isLaserActive,
    totalSlides: slides.length,
    startPresentation,
    endPresentation,
    nextSlide,
    prevSlide,
    goToSlide,
    toggleLaser,
    toggleTheme,
    toggleFullscreen,
    getFrames,
  };
};
