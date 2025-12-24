import {
  COLOR_CHARCOAL_BLACK,
  COLOR_VOICE_CALL,
  COLOR_WHITE,
  THEME,
  UserIdleState,
} from "@excalidraw/common";

import { roundRect } from "./renderer/roundRect";

import type { InteractiveCanvasRenderConfig } from "./scene/types";
import type {
  Collaborator,
  CommentMarker,
  InteractiveCanvasAppState,
  SocketId,
} from "./types";

function hashToInteger(id: string) {
  let hash = 0;
  if (id.length === 0) {
    return hash;
  }
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return hash;
}

export const getClientColor = (
  socketId: SocketId,
  collaborator: Collaborator | undefined,
) => {
  // to get more even distribution in case `id` is not uniformly distributed to
  // begin with, we hash it
  const hash = Math.abs(hashToInteger(collaborator?.id || socketId));
  // we want to get a multiple of 10 number in the range of 0-360 (in other
  // words a hue value of step size 10). There are 37 such values including 0.
  const hue = (hash % 37) * 10;
  const saturation = 100;
  const lightness = 83;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * returns first char, capitalized
 */
export const getNameInitial = (name?: string | null) => {
  // first char can be a surrogate pair, hence using codePointAt
  const firstCodePoint = name?.trim()?.codePointAt(0);
  return (
    firstCodePoint ? String.fromCodePoint(firstCodePoint) : "?"
  ).toUpperCase();
};

export const renderRemoteCursors = ({
  context,
  renderConfig,
  appState,
  normalizedWidth,
  normalizedHeight,
}: {
  context: CanvasRenderingContext2D;
  renderConfig: InteractiveCanvasRenderConfig;
  appState: InteractiveCanvasAppState;
  normalizedWidth: number;
  normalizedHeight: number;
}) => {
  // Paint remote pointers
  for (const [socketId, pointer] of renderConfig.remotePointerViewportCoords) {
    let { x, y } = pointer;

    const collaborator = appState.collaborators.get(socketId);

    x -= appState.offsetLeft;
    y -= appState.offsetTop;

    const width = 11;
    const height = 14;

    const isOutOfBounds =
      x < 0 ||
      x > normalizedWidth - width ||
      y < 0 ||
      y > normalizedHeight - height;

    x = Math.max(x, 0);
    x = Math.min(x, normalizedWidth - width);
    y = Math.max(y, 0);
    y = Math.min(y, normalizedHeight - height);

    const background = getClientColor(socketId, collaborator);

    context.save();
    context.strokeStyle = background;
    context.fillStyle = background;

    const userState = renderConfig.remotePointerUserStates.get(socketId);
    const isInactive =
      isOutOfBounds ||
      userState === UserIdleState.IDLE ||
      userState === UserIdleState.AWAY;

    if (isInactive) {
      context.globalAlpha = 0.3;
    }

    if (renderConfig.remotePointerButton.get(socketId) === "down") {
      context.beginPath();
      context.arc(x, y, 15, 0, 2 * Math.PI, false);
      context.lineWidth = 3;
      context.strokeStyle = "#ffffff88";
      context.stroke();
      context.closePath();

      context.beginPath();
      context.arc(x, y, 15, 0, 2 * Math.PI, false);
      context.lineWidth = 1;
      context.strokeStyle = background;
      context.stroke();
      context.closePath();
    }

    // TODO remove the dark theme color after we stop inverting canvas colors
    const IS_SPEAKING_COLOR =
      appState.theme === THEME.DARK ? "#2f6330" : COLOR_VOICE_CALL;

    const isSpeaking = collaborator?.isSpeaking;

    if (isSpeaking) {
      // cursor outline for currently speaking user
      context.fillStyle = IS_SPEAKING_COLOR;
      context.strokeStyle = IS_SPEAKING_COLOR;
      context.lineWidth = 10;
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 0, y + 14);
      context.lineTo(x + 4, y + 9);
      context.lineTo(x + 11, y + 8);
      context.closePath();
      context.stroke();
      context.fill();
    }

    // Background (white outline) for arrow
    context.fillStyle = COLOR_WHITE;
    context.strokeStyle = COLOR_WHITE;
    context.lineWidth = 6;
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0, y + 14);
    context.lineTo(x + 4, y + 9);
    context.lineTo(x + 11, y + 8);
    context.closePath();
    context.stroke();
    context.fill();

    // Arrow
    context.fillStyle = background;
    context.strokeStyle = background;
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.beginPath();
    if (isInactive) {
      context.moveTo(x - 1, y - 1);
      context.lineTo(x - 1, y + 15);
      context.lineTo(x + 5, y + 10);
      context.lineTo(x + 12, y + 9);
      context.closePath();
      context.fill();
    } else {
      context.moveTo(x, y);
      context.lineTo(x + 0, y + 14);
      context.lineTo(x + 4, y + 9);
      context.lineTo(x + 11, y + 8);
      context.closePath();
      context.fill();
      context.stroke();
    }

    const username = renderConfig.remotePointerUsernames.get(socketId) || "";

    if (!isOutOfBounds && username) {
      context.font = "600 12px sans-serif"; // font has to be set before context.measureText()

      const offsetX = (isSpeaking ? x + 0 : x) + width / 2;
      const offsetY = (isSpeaking ? y + 0 : y) + height + 2;
      const paddingHorizontal = 5;
      const paddingVertical = 3;
      const measure = context.measureText(username);
      const measureHeight =
        measure.actualBoundingBoxDescent + measure.actualBoundingBoxAscent;
      const finalHeight = Math.max(measureHeight, 12);

      const boxX = offsetX - 1;
      const boxY = offsetY - 1;
      const boxWidth = measure.width + 2 + paddingHorizontal * 2 + 2;
      const boxHeight = finalHeight + 2 + paddingVertical * 2 + 2;
      if (context.roundRect) {
        context.beginPath();
        context.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        context.fillStyle = background;
        context.fill();
        context.strokeStyle = COLOR_WHITE;
        context.stroke();

        if (isSpeaking) {
          context.beginPath();
          context.roundRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4, 8);
          context.strokeStyle = IS_SPEAKING_COLOR;
          context.stroke();
        }
      } else {
        roundRect(context, boxX, boxY, boxWidth, boxHeight, 8, COLOR_WHITE);
      }
      context.fillStyle = COLOR_CHARCOAL_BLACK;

      context.fillText(
        username,
        offsetX + paddingHorizontal + 1,
        offsetY +
          paddingVertical +
          measure.actualBoundingBoxAscent +
          Math.floor((finalHeight - measureHeight) / 2) +
          2,
      );

      // draw three vertical bars signalling someone is speaking
      if (isSpeaking) {
        context.fillStyle = IS_SPEAKING_COLOR;
        const barheight = 8;
        const margin = 8;
        const gap = 5;
        context.fillRect(
          boxX + boxWidth + margin,
          boxY + (boxHeight / 2 - barheight / 2),
          2,
          barheight,
        );
        context.fillRect(
          boxX + boxWidth + margin + gap,
          boxY + (boxHeight / 2 - (barheight * 2) / 2),
          2,
          barheight * 2,
        );
        context.fillRect(
          boxX + boxWidth + margin + gap * 2,
          boxY + (boxHeight / 2 - barheight / 2),
          2,
          barheight,
        );
      }
    }

    context.restore();
    context.closePath();
  }
};

/**
 * Renders comment markers on the interactive canvas.
 * Draws a teardrop/pin shape with the tip pointing down-left.
 * Follows the same pattern as renderRemoteCursors for consistency.
 */
export const renderCommentMarkers = ({
  context,
  appState,
  markers,
  normalizedWidth,
  normalizedHeight,
}: {
  context: CanvasRenderingContext2D;
  appState: InteractiveCanvasAppState;
  markers: CommentMarker[];
  normalizedWidth: number;
  normalizedHeight: number;
}) => {
  // Pin dimensions (matches ThreadMarker.module.scss)
  const PIN_SIZE = 32;
  const AVATAR_SIZE = 24;

  for (const marker of markers) {
    // Skip resolved markers
    if (marker.resolved) {
      continue;
    }

    // Convert scene coordinates to container-relative coordinates
    // The canvas is already positioned within the container, so no offset needed
    const x = (marker.x + appState.scrollX) * appState.zoom.value;
    const y = (marker.y + appState.scrollY) * appState.zoom.value;

    // Skip if outside viewport (with padding for marker size)
    if (
      x < -PIN_SIZE * 2 ||
      x > normalizedWidth + PIN_SIZE ||
      y < -PIN_SIZE * 2 ||
      y > normalizedHeight + PIN_SIZE
    ) {
      continue;
    }

    context.save();

    const isSelected = marker.selected;
    const isDark = appState.theme === THEME.DARK;

    // Pin colors (matches CSS variables)
    const pinBgColor = isSelected
      ? "#6965db" // --color-primary when selected
      : isDark
        ? "#3d3d42" // --color-surface-high dark
        : "#f5f5f5"; // --color-surface-low light

    // The marker coordinate (x, y) is where the pin TIP should be
    // The pin is drawn with CSS: transform: rotate(-45deg)
    // and margin-left: -16px, margin-top: -32px
    //
    // To replicate this:
    // 1. Translate to marker position
    // 2. Apply the same offsets as CSS (center horizontally, pin tip at bottom)
    // 3. Rotate -45° around the center of the pin

    const pinCenterX = x;
    const pinCenterY = y - PIN_SIZE * 0.7; // Offset so tip points to marker coords

    context.translate(pinCenterX, pinCenterY);
    context.rotate((-45 * Math.PI) / 180);

    // Draw pin shadow
    context.shadowColor = "rgba(0, 0, 0, 0.15)";
    context.shadowBlur = 4;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 2;

    // Draw pin shape - teardrop with asymmetric border-radius
    // CSS: border-radius: 66px 67px 67px 0
    // This means: top-left, top-right, bottom-right are rounded; bottom-left is sharp
    context.beginPath();
    drawTeardropPin(context, -PIN_SIZE / 2, -PIN_SIZE / 2, PIN_SIZE);
    context.fillStyle = pinBgColor;
    context.fill();

    // Reset shadow for the rest
    context.shadowColor = "transparent";
    context.shadowBlur = 0;

    // Selection ring
    if (isSelected) {
      context.strokeStyle = "#a5b4fc";
      context.lineWidth = 3;
      context.beginPath();
      drawTeardropPin(context, -PIN_SIZE / 2 - 2, -PIN_SIZE / 2 - 2, PIN_SIZE + 4);
      context.stroke();
    }

    // Draw avatar circle
    // Avatar background
    context.beginPath();
    context.arc(0, 0, AVATAR_SIZE / 2, 0, 2 * Math.PI);

    // Avatar border
    context.strokeStyle = isDark ? "#232329" : "#ffffff";
    context.lineWidth = 2;
    context.stroke();

    // Avatar fill
    const avatarBgColor = isSelected
      ? isDark
        ? "#232329"
        : "#ffffff"
      : isDark
        ? "#4a47a3"
        : "#e8e7f8";
    context.fillStyle = avatarBgColor;
    context.fill();

    // Draw initial text (counter-rotated to stay upright)
    context.save();
    context.rotate((45 * Math.PI) / 180); // Counter-rotate

    const textColor = isSelected
      ? isDark
        ? "#e8e7f8"
        : "#6965db"
      : isDark
        ? "#e8e7f8"
        : "#6965db";
    context.fillStyle = textColor;
    context.font = "600 12px -apple-system, BlinkMacSystemFont, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(marker.authorInitial, 0, 0);

    context.restore(); // Restore from text rotation
    context.restore(); // Restore from main transform
  }
};

/**
 * Draws a teardrop pin shape (rounded rectangle with one sharp corner).
 * CSS border-radius: 66px 67px 67px 0 means:
 * - top-left: rounded
 * - top-right: rounded
 * - bottom-right: rounded
 * - bottom-left: SHARP (this is the pin tip)
 */
function drawTeardropPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const radius = size * 0.5; // Large radius for rounded corners (66px on 32px = ~50%)

  // Start at bottom-left (sharp corner / pin tip)
  ctx.moveTo(x, y + size);

  // Left edge up to where top-left curve starts
  ctx.lineTo(x, y + radius);

  // Top-left rounded corner
  ctx.arcTo(x, y, x + radius, y, radius);

  // Top edge
  ctx.lineTo(x + size - radius, y);

  // Top-right rounded corner
  ctx.arcTo(x + size, y, x + size, y + radius, radius);

  // Right edge down to where bottom-right curve starts
  ctx.lineTo(x + size, y + size - radius);

  // Bottom-right rounded corner
  ctx.arcTo(x + size, y + size, x + size - radius, y + size, radius);

  // Bottom edge back to sharp corner
  ctx.lineTo(x, y + size);

  ctx.closePath();
}
