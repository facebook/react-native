/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {____ColorValue_Internal} from './StyleSheetTypes';

const processColor = require('./processColor').default;

const LINEAR_GRADIENT_REGEX = /linear-gradient\s*\(((?:\([^)]*\)|[^())])*)\)/g;
const COLOR_STOP_REGEX =
  /\s*((?:(?:rgba?|hsla?)\s*\([^)]+\))|#[0-9a-fA-F]+|[a-zA-Z]+)(?:\s+([0-9.]+%?))?\s*/g;
const DIRECTION_REGEX =
  /^to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?/;
const ANGLE_UNIT_REGEX = /^.*?(deg|grad|rad|turn)$/;
const TRANSPARENT = 0; // rgba(0, 0, 0, 0)
const TO_BOTTOM_START_END_POINTS = {
  start: {x: 0.5, y: 0},
  end: {x: 0.5, y: 1},
};

export type BackgroundImagePrimitive = {
  type: 'linearGradient',
  start: {x: number, y: number},
  end: {x: number, y: number},
  colorStops: $ReadOnlyArray<{
    color: ____ColorValue_Internal,
    position: number,
  }>,
};

export default function processBackgroundImage(
  backgroundImage: $ReadOnlyArray<BackgroundImagePrimitive> | string,
): $ReadOnlyArray<BackgroundImagePrimitive> {
  if (typeof backgroundImage === 'string') {
    const parsedBackgroundImage = parseCSSLinearGradient(backgroundImage);
    return parsedBackgroundImage;
  } else if (Array.isArray(backgroundImage)) {
    const parsedBackgroundImage = backgroundImage.map(bg => {
      return {
        type: bg.type,
        start: bg.start,
        end: bg.end,
        colorStops: bg.colorStops.map(stop => {
          const processedColor = processColor(stop.color) ?? TRANSPARENT;
          return {
            color: processedColor,
            position: stop.position,
          };
        }),
      };
    });
    return parsedBackgroundImage;
  }

  return [];
}

function parseCSSLinearGradient(
  cssString: string,
): $ReadOnlyArray<BackgroundImagePrimitive> {
  const gradients = [];
  let match;

  while ((match = LINEAR_GRADIENT_REGEX.exec(cssString))) {
    const gradientContent = match[1];
    const parts = gradientContent.split(',');
    let points = TO_BOTTOM_START_END_POINTS;
    const trimmedDirection = parts[0].trim();
    if (ANGLE_UNIT_REGEX.test(trimmedDirection)) {
      points = calculateStartEndPointsFromAngle(parseAngle(trimmedDirection));
      parts.shift();
    } else if (DIRECTION_REGEX.test(trimmedDirection)) {
      points = calculateStartEndPointsFromDirection(trimmedDirection);
      parts.shift();
    }

    const colorStops = [];
    const fullColorStopsStr = parts.join(',');
    let colorStopMatch;
    while ((colorStopMatch = COLOR_STOP_REGEX.exec(fullColorStopsStr))) {
      const [, color, position] = colorStopMatch;
      const processedColor = processColor(color.trim());
      if (processedColor != null) {
        colorStops.push({
          color: processedColor,
          position: position ? parseFloat(position) / 100 : null,
        });
      }
    }

    gradients.push({
      type: 'linearGradient',
      start: points.start,
      end: points.end,
      colorStops: colorStops.map((stop, index, array) => ({
        color: stop.color,
        position:
          stop.position ??
          (array.length === 1 ? 1 : index / (array.length - 1)),
      })),
    });
  }

  return gradients;
}

function calculateStartEndPointsFromDirection(direction: string): {
  start: {x: number, y: number},
  end: {x: number, y: number},
} {
  switch (direction) {
    case 'to right':
      return {
        start: {x: 0, y: 0.5},
        end: {x: 1, y: 0.5},
      };
    case 'to left':
      return {
        start: {x: 1, y: 0.5},
        end: {x: 0, y: 0.5},
      };
    case 'to bottom':
      return TO_BOTTOM_START_END_POINTS;
    case 'to top':
      return {
        start: {x: 0.5, y: 1},
        end: {x: 0.5, y: 0},
      };
    case 'to bottom right':
    case 'to right bottom':
      return {
        start: {x: 0, y: 0},
        end: {x: 1, y: 1},
      };
    case 'to top left':
    case 'to left top':
      return {
        start: {x: 1, y: 1},
        end: {x: 0, y: 0},
      };
    case 'to bottom left':
    case 'to left bottom':
      return {
        start: {x: 1, y: 0},
        end: {x: 0, y: 1},
      };
    case 'to top right':
    case 'to right top':
      return {
        start: {x: 0, y: 1},
        end: {x: 1, y: 0},
      };
    default:
      return TO_BOTTOM_START_END_POINTS;
  }
}

function calculateStartEndPointsFromAngle(angleRadians: number): {
  start: {x: number, y: number},
  end: {x: number, y: number},
} {
  // Normalize angle to be between 0 and 2π
  let angleRadiansNormalized = angleRadians % (2 * Math.PI);
  if (angleRadiansNormalized < 0) {
    angleRadiansNormalized += 2 * Math.PI;
  }

  const endX = 0.5 + 0.5 * Math.sin(angleRadiansNormalized);
  const endY = 0.5 - 0.5 * Math.cos(angleRadiansNormalized);

  const startX = 1 - endX;
  const startY = 1 - endY;

  return {
    start: {x: startX, y: startY},
    end: {x: endX, y: endY},
  };
}

function parseAngle(angle: string): number {
  const match = angle.match(ANGLE_UNIT_REGEX);
  if (!match) {
    throw new Error(`Unsupported angle: ${angle}`);
  }
  const value = match[0];
  const unit = match[1];
  const numericValue = parseFloat(value);
  switch (unit) {
    case 'deg':
      return (numericValue * Math.PI) / 180;
    case 'grad':
      return (numericValue * Math.PI) / 200;
    case 'rad':
      return numericValue;
    case 'turn':
      return numericValue * 2 * Math.PI;
    default:
      throw new Error(`Unsupported angle unit: ${unit}`);
  }
}
