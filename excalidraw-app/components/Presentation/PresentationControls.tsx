import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  laserPointerToolIcon,
  MoonIcon,
  SunIcon,
  fullscreenIcon,
} from "@excalidraw/excalidraw/components/icons";
import { useUIAppState } from "@excalidraw/excalidraw/context/ui-appState";
import { t } from "@excalidraw/excalidraw/i18n";

import "./PresentationControls.scss";

interface PresentationControlsProps {
  currentSlide: number;
  totalSlides: number;
  isLaserActive: boolean;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onToggleLaser: () => void;
  onToggleTheme: () => void;
  onToggleFullscreen: () => void;
  onEndPresentation: () => void;
}

const FADE_DELAY = 3000;

export const PresentationControls: React.FC<PresentationControlsProps> = ({
  currentSlide,
  totalSlides,
  isLaserActive,
  onPrevSlide,
  onNextSlide,
  onToggleLaser,
  onToggleTheme,
  onToggleFullscreen,
  onEndPresentation,
}) => {
  const { theme } = useUIAppState();
  const [isVisible, setIsVisible] = useState(true);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetFadeTimer = useCallback(() => {
    setIsVisible(true);

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    fadeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, FADE_DELAY);
  }, []);

  // Reset timer on user interaction
  useEffect(() => {
    const handleMouseMove = () => resetFadeTimer();
    const handleMouseDown = () => resetFadeTimer();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);

    // Initial timer
    resetFadeTimer();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [resetFadeTimer]);

  const handleControlsMouseEnter = () => {
    setIsVisible(true);
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
  };

  const handleControlsMouseLeave = () => {
    resetFadeTimer();
  };

  return (
    <div
      className={clsx("presentation-controls", {
        "presentation-controls--hidden": !isVisible,
      })}
      onMouseEnter={handleControlsMouseEnter}
      onMouseLeave={handleControlsMouseLeave}
    >
      <div className="presentation-controls__bar">
        {/* Navigation */}
        <button
          className="presentation-controls__button"
          onClick={onPrevSlide}
          disabled={currentSlide === 0}
          title={`${t("presentation.previousSlide")} (←)`}
          aria-label={t("presentation.previousSlide")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <span className="presentation-controls__counter">
          {t("presentation.slide")} {currentSlide + 1}/{totalSlides}
        </span>

        <button
          className="presentation-controls__button"
          onClick={onNextSlide}
          disabled={currentSlide === totalSlides - 1}
          title={`${t("presentation.nextSlide")} (→)`}
          aria-label={t("presentation.nextSlide")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div className="presentation-controls__divider" />

        {/* Laser pointer */}
        <button
          className={clsx("presentation-controls__button", {
            "presentation-controls__button--active": isLaserActive,
          })}
          onClick={onToggleLaser}
          title={`${t("presentation.toggleLaser")} (L)`}
          aria-label={t("presentation.toggleLaser")}
        >
          {laserPointerToolIcon}
        </button>

        {/* Theme toggle */}
        <button
          className="presentation-controls__button"
          onClick={onToggleTheme}
          title={t("presentation.toggleTheme")}
          aria-label={t("presentation.toggleTheme")}
        >
          {theme === "dark" ? SunIcon : MoonIcon}
        </button>

        {/* Fullscreen */}
        <button
          className="presentation-controls__button"
          onClick={onToggleFullscreen}
          title={`${t("presentation.toggleFullscreen")} (F)`}
          aria-label={t("presentation.toggleFullscreen")}
        >
          {fullscreenIcon}
        </button>

        <div className="presentation-controls__divider" />

        {/* End presentation */}
        <button
          className="presentation-controls__button presentation-controls__button--end"
          onClick={onEndPresentation}
          title={`${t("presentation.endPresentation")} (Esc)`}
        >
          {t("presentation.endPresentation")}
        </button>
      </div>
    </div>
  );
};
