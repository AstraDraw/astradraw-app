import React, { useState, useCallback } from "react";

import type {
  ExcalidrawImperativeAPI,
  PenStyle,
  PenType,
  ExtendedFillStyle,
} from "@excalidraw/excalidraw/types";
import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { t } from "@excalidraw/excalidraw/i18n";

import { PENS } from "./pens";
import { EASING_FUNCTIONS } from "./constants";

import "./PenSettingsModal.scss";

interface PenSettingsModalProps {
  excalidrawAPI: ExcalidrawImperativeAPI;
  pen: PenStyle;
  penIndex: number;
  onClose: () => void;
  onSave: (pen: PenStyle) => void;
}

// Helper to get pen type label with translation
const getPenTypeLabel = (type: PenType): string => {
  return t(`pens.types.${type}`);
};

// Export for use in PenToolbar
export { getPenTypeLabel };

// Fill style labels - using t() for translations
const getFillStyleLabel = (style: ExtendedFillStyle): string => {
  switch (style) {
    case "": return t("pens.fillStyles.unset");
    case "hachure": return t("pens.fillStyles.hachure");
    case "cross-hatch": return t("pens.fillStyles.crossHatch");
    case "solid": return t("pens.fillStyles.solid");
    case "dots": return t("pens.fillStyles.dots");
    case "zigzag": return t("pens.fillStyles.zigzag");
    case "zigzag-line": return t("pens.fillStyles.zigzagLine");
    case "dashed": return t("pens.fillStyles.dashed");
    default: return style;
  }
};

export const PenSettingsModal: React.FC<PenSettingsModalProps> = ({
  excalidrawAPI,
  pen: initialPen,
  penIndex,
  onClose,
  onSave,
}) => {
  const [pen, setPen] = useState<PenStyle>(() => JSON.parse(JSON.stringify(initialPen)));

  const updatePen = useCallback((updates: Partial<PenStyle>) => {
    setPen((prev) => ({ ...prev, ...updates }));
  }, []);

  const updatePenOptions = useCallback(
    (updates: Partial<PenStyle["penOptions"]>) => {
      setPen((prev) => ({
        ...prev,
        penOptions: { ...prev.penOptions, ...updates },
      }));
    },
    [],
  );

  const updateStrokeOptions = useCallback(
    (updates: Partial<PenStyle["penOptions"]["options"]>) => {
      setPen((prev) => ({
        ...prev,
        penOptions: {
          ...prev.penOptions,
          options: { ...prev.penOptions.options, ...updates },
        },
      }));
    },
    [],
  );

  const updateStartTaper = useCallback(
    (updates: Partial<PenStyle["penOptions"]["options"]["start"]>) => {
      setPen((prev) => ({
        ...prev,
        penOptions: {
          ...prev.penOptions,
          options: {
            ...prev.penOptions.options,
            start: { ...prev.penOptions.options.start, ...updates },
          },
        },
      }));
    },
    [],
  );

  const updateEndTaper = useCallback(
    (updates: Partial<PenStyle["penOptions"]["options"]["end"]>) => {
      setPen((prev) => ({
        ...prev,
        penOptions: {
          ...prev.penOptions,
          options: {
            ...prev.penOptions.options,
            end: { ...prev.penOptions.options.end, ...updates },
          },
        },
      }));
    },
    [],
  );

  const applyPreset = useCallback((type: PenType) => {
    const preset = PENS[type];
    setPen(JSON.parse(JSON.stringify(preset)));
  }, []);

  const handleSave = useCallback(() => {
    onSave(pen);
    onClose();
  }, [pen, onSave, onClose]);

  const getRoughnessLabel = (roughness: number | null) => {
    if (roughness === null) return t("pens.notSet");
    if (roughness <= 0.5) return `${t("pens.architect")} (${roughness})`;
    if (roughness <= 1.5) return `${t("pens.artist")} (${roughness})`;
    return `${t("pens.cartoonist")} (${roughness})`;
  };

  const getTaperLabel = (taper: number | boolean) => {
    return taper === true ? "true" : String(taper);
  };

  const penTypes: PenType[] = ["default", "highlighter", "finetip", "fountain", "marker", "thick-thin", "thin-thick-thin"];
  const fillStyles: ExtendedFillStyle[] = ["", "hachure", "cross-hatch", "solid", "dots", "zigzag", "zigzag-line", "dashed"];

  return (
    <Dialog
      onCloseRequest={handleSave}
      title={t("pens.settings")}
      className="pen-settings-modal"
      size="regular"
    >
      <div className="pen-settings-modal__content">
        <h2 className="pen-settings-modal__section-title">{t("pens.settingsTitle")}</h2>

        {/* Pen Type Selector */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.penType")}
            <span className="pen-settings-modal__desc">{t("pens.selectPenType")}</span>
          </label>
          <div className="pen-settings-modal__row">
            <select
              className="pen-settings-modal__select"
              value={pen.type}
              onChange={(e) => updatePen({ type: e.target.value as PenType })}
            >
              {penTypes.map((type) => (
                <option key={type} value={type}>
                  {getPenTypeLabel(type)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="pen-settings-modal__button"
              onClick={() => applyPreset(pen.type)}
            >
              {t("pens.apply")}
            </button>
          </div>
        </div>

        {/* Stroke & Fill Scope */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.strokeFillAppliesTo")}{" "}
            <strong>{pen.freedrawOnly ? t("pens.freedrawOnly") : t("pens.allShapes")}</strong>
            <span className="pen-settings-modal__desc">
              {pen.freedrawOnly ? t("pens.freedrawOnlyDesc") : t("pens.allShapesDesc")}
            </span>
          </label>
          <input
            type="checkbox"
            className="pen-settings-modal__toggle"
            checked={pen.freedrawOnly}
            onChange={(e) => updatePen({ freedrawOnly: e.target.checked })}
          />
        </div>

        {/* Stroke Color */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.strokeColor")} <strong>{pen.strokeColor || t("labels.canvasColors")}</strong>
          </label>
          <div className="pen-settings-modal__row">
            <input
              type="text"
              className="pen-settings-modal__input"
              value={pen.strokeColor || ""}
              placeholder={t("pens.useCanvasCurrent")}
              onChange={(e) => updatePen({ strokeColor: e.target.value || undefined })}
            />
            <input
              type="color"
              className="pen-settings-modal__color-picker"
              value={pen.strokeColor || "#000000"}
              onChange={(e) => updatePen({ strokeColor: e.target.value })}
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.backgroundColor")} <strong>{pen.backgroundColor || t("labels.canvasColors")}</strong>
          </label>
          <div className="pen-settings-modal__row">
            <input
              type="text"
              className="pen-settings-modal__input"
              value={pen.backgroundColor || ""}
              placeholder={t("pens.useCanvasCurrent")}
              onChange={(e) => updatePen({ backgroundColor: e.target.value || undefined })}
            />
            <input
              type="color"
              className="pen-settings-modal__color-picker"
              value={pen.backgroundColor === "transparent" ? "#ffffff" : pen.backgroundColor || "#ffffff"}
              onChange={(e) => updatePen({ backgroundColor: e.target.value })}
            />
          </div>
        </div>

        {/* Fill Style */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">{t("pens.fillStyle")}</label>
          <select
            className="pen-settings-modal__select"
            value={pen.fillStyle}
            onChange={(e) => updatePen({ fillStyle: e.target.value as ExtendedFillStyle })}
          >
            {fillStyles.map((style) => (
              <option key={style} value={style}>
                {getFillStyleLabel(style)}
              </option>
            ))}
          </select>
        </div>

        {/* Sloppiness (Roughness) */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.sloppiness")} <strong>{getRoughnessLabel(pen.roughness)}</strong>
            <span className="pen-settings-modal__desc">{t("pens.sloppinessDesc")}</span>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="-0.5"
            max="3"
            step="0.5"
            value={pen.roughness ?? -0.5}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              updatePen({ roughness: val === -0.5 ? null : val });
            }}
          />
        </div>

        {/* Stroke Width */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.strokeWidth")} <strong>{pen.strokeWidth === 0 ? t("pens.notSet") : pen.strokeWidth}</strong>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="0"
            max="8"
            step="0.1"
            value={pen.strokeWidth}
            onChange={(e) => updatePen({ strokeWidth: parseFloat(e.target.value) })}
          />
        </div>

        {/* Highlighter Toggle */}
        <div className="pen-settings-modal__field pen-settings-modal__field--row">
          <label className="pen-settings-modal__label">{t("pens.highlighterPen")}</label>
          <input
            type="checkbox"
            className="pen-settings-modal__toggle"
            checked={pen.penOptions.highlighter}
            onChange={(e) => updatePenOptions({ highlighter: e.target.checked })}
          />
        </div>

        {/* Pressure Sensitive Toggle */}
        <div className="pen-settings-modal__field pen-settings-modal__field--row">
          <label className="pen-settings-modal__label">
            {t("pens.pressureSensitive")}
            <span className="pen-settings-modal__desc">{t("pens.pressureSensitiveDesc")}</span>
          </label>
          <input
            type="checkbox"
            className="pen-settings-modal__toggle"
            checked={!pen.penOptions.constantPressure}
            onChange={(e) => updatePenOptions({ constantPressure: !e.target.checked })}
          />
        </div>

        {/* Outline Width */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {pen.penOptions.outlineWidth === 0 ? t("pens.noOutline") : `${t("pens.outlineWidth")} ${pen.penOptions.outlineWidth}`}
            <span className="pen-settings-modal__desc">{t("pens.outlineDesc")}</span>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="0"
            max="8"
            step="0.1"
            value={pen.penOptions.outlineWidth}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              updatePenOptions({ outlineWidth: val, hasOutline: val > 0 });
            }}
          />
        </div>

        {/* Perfect Freehand Settings */}
        <h2 className="pen-settings-modal__section-title">{t("pens.perfectFreehand")}</h2>
        <p className="pen-settings-modal__info">
          {t("pens.perfectFreehandLink")}{" "}
          <a href="https://github.com/steveruizok/perfect-freehand#documentation" target="_blank" rel="noopener noreferrer">
            {t("pens.thisLink")}
          </a>.
        </p>

        {/* Thinning */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.thinning")} <strong>{pen.penOptions.options.thinning}</strong>
            <span className="pen-settings-modal__desc">{t("pens.thinningDesc")}</span>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="-1"
            max="1"
            step="0.05"
            value={pen.penOptions.options.thinning}
            onChange={(e) => updateStrokeOptions({ thinning: parseFloat(e.target.value) })}
          />
        </div>

        {/* Smoothing */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.smoothing")} <strong>{pen.penOptions.options.smoothing}</strong>
            <span className="pen-settings-modal__desc">{t("pens.smoothingDesc")}</span>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="0"
            max="1"
            step="0.05"
            value={pen.penOptions.options.smoothing}
            onChange={(e) => updateStrokeOptions({ smoothing: parseFloat(e.target.value) })}
          />
        </div>

        {/* Streamline */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.streamline")} <strong>{pen.penOptions.options.streamline}</strong>
            <span className="pen-settings-modal__desc">{t("pens.streamlineDesc")}</span>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="0"
            max="1"
            step="0.05"
            value={pen.penOptions.options.streamline}
            onChange={(e) => updateStrokeOptions({ streamline: parseFloat(e.target.value) })}
          />
        </div>

        {/* Easing Function */}
        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.easingFunction")}
            <span className="pen-settings-modal__desc">
              <a href="https://easings.net/" target="_blank" rel="noopener noreferrer">
                {t("pens.reference")}
              </a>
            </span>
          </label>
          <select
            className="pen-settings-modal__select"
            value={pen.penOptions.options.easing}
            onChange={(e) => updateStrokeOptions({ easing: e.target.value })}
          >
            {Object.entries(EASING_FUNCTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Simulate Pressure */}
        {!pen.penOptions.constantPressure && (
          <div className="pen-settings-modal__field">
            <label className="pen-settings-modal__label">{t("pens.simulatePressure")}</label>
            <select
              className="pen-settings-modal__select"
              value={
                pen.penOptions.options.simulatePressure === true
                  ? "true"
                  : pen.penOptions.options.simulatePressure === false
                  ? "false"
                  : ""
              }
              onChange={(e) => {
                const val = e.target.value;
                updateStrokeOptions({
                  simulatePressure: val === "true" ? true : val === "false" ? false : undefined,
                });
              }}
            >
              <option value="">{t("pens.simulatePressureOptions.auto")}</option>
              <option value="true">{t("pens.simulatePressureOptions.always")}</option>
              <option value="false">{t("pens.simulatePressureOptions.never")}</option>
            </select>
          </div>
        )}

        {/* Start Taper */}
        <h3 className="pen-settings-modal__subsection-title">{t("pens.start")}</h3>
        <p className="pen-settings-modal__info">{t("pens.startDesc")}</p>

        <div className="pen-settings-modal__field pen-settings-modal__field--row">
          <label className="pen-settings-modal__label">{t("pens.capStart")}</label>
          <input
            type="checkbox"
            className="pen-settings-modal__toggle"
            checked={pen.penOptions.options.start.cap}
            onChange={(e) => updateStartTaper({ cap: e.target.checked })}
          />
        </div>

        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.taper")} <strong>{getTaperLabel(pen.penOptions.options.start.taper)}</strong>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="0"
            max="151"
            step="1"
            value={pen.penOptions.options.start.taper === true ? 151 : (pen.penOptions.options.start.taper as number)}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              updateStartTaper({ taper: val === 151 ? true : val });
            }}
          />
        </div>

        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">{t("pens.easingFunction")}</label>
          <select
            className="pen-settings-modal__select"
            value={pen.penOptions.options.start.easing}
            onChange={(e) => updateStartTaper({ easing: e.target.value })}
          >
            {Object.entries(EASING_FUNCTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* End Taper */}
        <h3 className="pen-settings-modal__subsection-title">{t("pens.end")}</h3>
        <p className="pen-settings-modal__info">{t("pens.endDesc")}</p>

        <div className="pen-settings-modal__field pen-settings-modal__field--row">
          <label className="pen-settings-modal__label">{t("pens.capEnd")}</label>
          <input
            type="checkbox"
            className="pen-settings-modal__toggle"
            checked={pen.penOptions.options.end.cap}
            onChange={(e) => updateEndTaper({ cap: e.target.checked })}
          />
        </div>

        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">
            {t("pens.taper")} <strong>{getTaperLabel(pen.penOptions.options.end.taper)}</strong>
          </label>
          <input
            type="range"
            className="pen-settings-modal__slider"
            min="0"
            max="151"
            step="1"
            value={pen.penOptions.options.end.taper === true ? 151 : (pen.penOptions.options.end.taper as number)}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              updateEndTaper({ taper: val === 151 ? true : val });
            }}
          />
        </div>

        <div className="pen-settings-modal__field">
          <label className="pen-settings-modal__label">{t("pens.easingFunction")}</label>
          <select
            className="pen-settings-modal__select"
            value={pen.penOptions.options.end.easing}
            onChange={(e) => updateEndTaper({ easing: e.target.value })}
          >
            {Object.entries(EASING_FUNCTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Dialog>
  );
};

export default PenSettingsModal;
