import { createPortal } from "react-dom";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { useAtomValue } from "../../app-jotai";

import { PresentationControls } from "./PresentationControls";
import {
  presentationModeAtom,
  usePresentationMode,
} from "./usePresentationMode";

interface PresentationModeProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  excalidrawAPI,
}) => {
  const isPresentationMode = useAtomValue(presentationModeAtom);

  const {
    currentSlide,
    totalSlides,
    isLaserActive,
    nextSlide,
    prevSlide,
    toggleLaser,
    toggleTheme,
    toggleFullscreen,
    endPresentation,
  } = usePresentationMode({ excalidrawAPI });

  if (!isPresentationMode || totalSlides === 0) {
    return null;
  }

  return createPortal(
    <PresentationControls
      currentSlide={currentSlide}
      totalSlides={totalSlides}
      isLaserActive={isLaserActive}
      onPrevSlide={prevSlide}
      onNextSlide={nextSlide}
      onToggleLaser={toggleLaser}
      onToggleTheme={toggleTheme}
      onToggleFullscreen={toggleFullscreen}
      onEndPresentation={endPresentation}
    />,
    document.body,
  );
};
