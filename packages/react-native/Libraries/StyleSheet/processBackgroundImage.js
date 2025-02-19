/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ProcessedColorValue} from './processColor';
import type {GradientValue} from './StyleSheetTypes';

const processColor = require('./processColor').default;
const DIRECTION_KEYWORD_REGEX =
  /^to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?/i;
const ANGLE_UNIT_REGEX = /^([+-]?\d*\.?\d+)(deg|grad|rad|turn)$/i;

type LinearGradientDirection =
  | {type: 'angle', value: number}
  | {type: 'keyword', value: string};

// null color indicate that the transition hint syntax is used. e.g. red, 20%, blue
type ColorStopColor = ProcessedColorValue | null;
// percentage or pixel value
type ColorStopPosition = number | string | null;

type ParsedGradientValue = {
  type: 'linearGradient',
  direction: LinearGradientDirection,
  colorStops: $ReadOnlyArray<{
    color: ColorStopColor,
    position: ColorStopPosition,
  }>,
};

const DEFAULT_DIRECTION: LinearGradientDirection = {
  type: 'angle',
  value: 180,
};

export default function processBackgroundImage(
  backgroundImage: ?($ReadOnlyArray<GradientValue> | string),
): $ReadOnlyArray<ParsedGradientValue> {
  let result: $ReadOnlyArray<ParsedGradientValue> = [];
  if (backgroundImage == null) {
    return result;
  }

  if (typeof backgroundImage === 'string') {
    result = parseCSSLinearGradient(backgroundImage.replace(/\n/g, ' '));
  } else if (Array.isArray(backgroundImage)) {
    for (const bgImage of backgroundImage) {
      const processedColorStops: Array<{
        color: ColorStopColor,
        position: ColorStopPosition,
      }> = [];
      for (let index = 0; index < bgImage.colorStops.length; index++) {
        const colorStop = bgImage.colorStops[index];
        const positions = colorStop.positions;
        // Color transition hint syntax (red, 20%, blue)
        if (
          colorStop.color == null &&
          Array.isArray(positions) &&
          positions.length === 1
        ) {
          const position = positions[0];
          if (
            typeof position === 'number' ||
            (typeof position === 'string' && position.endsWith('%'))
          ) {
            processedColorStops.push({
              color: null,
              position,
            });
          } else {
            // If a position is invalid, return an empty array and do not apply gradient. Same as web.
            return [];
          }
        } else {
          const processedColor = processColor(colorStop.color);
          if (processedColor == null) {
            // If a color is invalid, return an empty array and do not apply gradient. Same as web.
            return [];
          }
          if (positions != null && positions.length > 0) {
            for (const position of positions) {
              if (
                typeof position === 'number' ||
                (typeof position === 'string' && position.endsWith('%'))
              ) {
                processedColorStops.push({
                  color: processedColor,
                  position,
                });
              } else {
                // If a position is invalid, return an empty array and do not apply gradient. Same as web.
                return [];
              }
            }
          } else {
            processedColorStops.push({
              color: processedColor,
              position: null,
            });
          }
        }
      }

      let direction: LinearGradientDirection = DEFAULT_DIRECTION;
      const bgDirection =
        bgImage.direction != null ? bgImage.direction.toLowerCase() : null;

      if (bgDirection != null) {
        if (ANGLE_UNIT_REGEX.test(bgDirection)) {
          const parsedAngle = getAngleInDegrees(bgDirection);
          if (parsedAngle != null) {
            direction = {
              type: 'angle',
              value: parsedAngle,
            };
          } else {
            // If an angle is invalid, return an empty array and do not apply any gradient. Same as web.
            return [];
          }
        } else if (DIRECTION_KEYWORD_REGEX.test(bgDirection)) {
          const parsedDirection = getDirectionForKeyword(bgDirection);
          if (parsedDirection != null) {
            direction = parsedDirection;
          } else {
            // If a direction is invalid, return an empty array and do not apply any gradient. Same as web.
            return [];
          }
        } else {
          // If a direction is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
      }

      result = result.concat({
        type: 'linearGradient',
        direction,
        colorStops: processedColorStops,
      });
    }
  }

  return result;
}

function parseCSSLinearGradient(
  cssString: string,
): $ReadOnlyArray<ParsedGradientValue> {
  const gradients = [];
  let match;

  // matches one or more linear-gradient functions in CSS
  const linearGradientRegex = /linear-gradient\s*\(((?:\([^)]*\)|[^())])*)\)/gi;

  while ((match = linearGradientRegex.exec(cssString))) {
    const gradientContent = match[1];
    const parts = gradientContent.split(',');
    let direction: LinearGradientDirection = DEFAULT_DIRECTION;
    const trimmedDirection = parts[0].trim().toLowerCase();

    if (ANGLE_UNIT_REGEX.test(trimmedDirection)) {
      const parsedAngle = getAngleInDegrees(trimmedDirection);
      if (parsedAngle != null) {
        direction = {
          type: 'angle',
          value: parsedAngle,
        };
        parts.shift();
      } else {
        // If an angle is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }
    } else if (DIRECTION_KEYWORD_REGEX.test(trimmedDirection)) {
      const parsedDirection = getDirectionForKeyword(trimmedDirection);
      if (parsedDirection != null) {
        direction = parsedDirection;
        parts.shift();
      } else {
        // If a direction is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }
    }

    const colorStopsString = parts.join(',');
    const colorStops = [];
    // split by comma, but not if it's inside a parentheses. e.g. red, rgba(0, 0, 0, 0.5), green => ["red", "rgba(0, 0, 0, 0.5)", "green"]
    const stops = colorStopsString.split(/,(?![^(]*\))/);
    let prevStop = null;
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const trimmedStop = stop.trim().toLowerCase();
      // Match function like pattern or single words
      const colorStopParts = trimmedStop.match(/\S+\([^)]*\)|\S+/g);
      if (colorStopParts == null) {
        // If a color stop is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }
      // Case 1: [color, position, position]
      if (colorStopParts.length === 3) {
        const color = colorStopParts[0];
        const position1 = getPositionFromCSSValue(colorStopParts[1]);
        const position2 = getPositionFromCSSValue(colorStopParts[2]);
        const processedColor = processColor(color);
        if (processedColor == null) {
          // If a color is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }

        if (position1 == null || position2 == null) {
          // If a position is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }

        colorStops.push({
          color: processedColor,
          position: position1,
        });
        colorStops.push({
          color: processedColor,
          position: position2,
        });
      }
      // Case 2: [color, position]
      else if (colorStopParts.length === 2) {
        const color = colorStopParts[0];
        const position = getPositionFromCSSValue(colorStopParts[1]);
        const processedColor = processColor(color);
        if (processedColor == null) {
          // If a color is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
        if (position == null) {
          // If a position is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
        colorStops.push({
          color: processedColor,
          position,
        });
      }
      // Case 3: [color]
      // Case 4: [position] => transition hint syntax
      else if (colorStopParts.length === 1) {
        const position = getPositionFromCSSValue(colorStopParts[0]);
        if (position != null) {
          // handle invalid transition hint syntax. transition hint syntax must have color before and after the position. e.g. red, 20%, blue
          if (
            (prevStop != null &&
              prevStop.length === 1 &&
              getPositionFromCSSValue(prevStop[0]) != null) ||
            i === stops.length - 1 ||
            i === 0
          ) {
            // If the last stop is a transition hint syntax, return an empty array and do not apply any gradient. Same as web.
            return [];
          }
          colorStops.push({
            color: null,
            position,
          });
        } else {
          const processedColor = processColor(colorStopParts[0]);
          if (processedColor == null) {
            // If a color is invalid, return an empty array and do not apply any gradient. Same as web.
            return [];
          }
          colorStops.push({
            color: processedColor,
            position: null,
          });
        }
      } else {
        // If a color stop is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }
      prevStop = colorStopParts;
    }

    gradients.push({
      type: 'linearGradient',
      direction,
      colorStops,
    });
  }

  return gradients;
}

function getDirectionForKeyword(direction?: string): ?LinearGradientDirection {
  if (direction == null) {
    return null;
  }
  // Remove extra whitespace
  const normalized = direction.replace(/\s+/g, ' ').toLowerCase();

  switch (normalized) {
    case 'to top':
      return {type: 'angle', value: 0};
    case 'to right':
      return {type: 'angle', value: 90};
    case 'to bottom':
      return {type: 'angle', value: 180};
    case 'to left':
      return {type: 'angle', value: 270};
    case 'to top right':
    case 'to right top':
      return {type: 'keyword', value: 'to top right'};
    case 'to bottom right':
    case 'to right bottom':
      return {type: 'keyword', value: 'to bottom right'};
    case 'to top left':
    case 'to left top':
      return {type: 'keyword', value: 'to top left'};
    case 'to bottom left':
    case 'to left bottom':
      return {type: 'keyword', value: 'to bottom left'};
    default:
      return null;
  }
}

function getAngleInDegrees(angle?: string): ?number {
  if (angle == null) {
    return null;
  }
  const match = angle.match(ANGLE_UNIT_REGEX);
  if (!match) {
    return null;
  }

  const [, value, unit] = match;

  const numericValue = parseFloat(value);
  switch (unit) {
    case 'deg':
      return numericValue;
    case 'grad':
      return numericValue * 0.9; // 1 grad = 0.9 degrees
    case 'rad':
      return (numericValue * 180) / Math.PI;
    case 'turn':
      return numericValue * 360; // 1 turn = 360 degrees
    default:
      return null;
  }
}

function getPositionFromCSSValue(position: string) {
  if (position.endsWith('px')) {
    return parseFloat(position);
  }

  if (position.endsWith('%')) {
    return position;
  }
}
