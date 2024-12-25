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

type ColorStopColor = ProcessedColorValue | null;

type ParsedGradientValue = {
  type: 'linearGradient',
  direction: LinearGradientDirection,
  colorStops: $ReadOnlyArray<{
    color: ColorStopColor,
    position: number,
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
        position: number | null,
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
          if (typeof position === 'string' && position.endsWith('%')) {
            processedColorStops.push({
              color: null,
              position: parseFloat(position) / 100,
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
              if (position.endsWith('%')) {
                processedColorStops.push({
                  color: processedColor,
                  position: parseFloat(position) / 100,
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

      const fixedColorStops = getFixedColorStops(processedColorStops);

      result = result.concat({
        type: 'linearGradient',
        direction,
        colorStops: fixedColorStops,
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

    // matches individual color stops in a gradient function
    // supports various color formats: named colors, hex colors, rgb(a), and hsl(a)
    // e.g. "red 20%", "blue 50%", "rgba(0, 0, 0, 0.5) 30% 50%"
    // TODO: does not support color hint syntax yet. It is WIP.
    const colorStopRegex =
      /\s*((?:(?:rgba?|hsla?)\s*\([^)]+\))|#[0-9a-fA-F]+|[a-zA-Z]+)(?:\s+(-?[0-9.]+%?)(?:\s+(-?[0-9.]+%?))?)?\s*/gi;

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
    } else if (!colorStopRegex.test(trimmedDirection)) {
      // If first part is not an angle/direction or a color stop, return an empty array and do not apply any gradient. Same as web.
      return [];
    }

    const colorStopsString = parts.join(',');
    const colorStops = [];
    // split by comma, but not if it's inside a parentheses. e.g. red, rgba(0, 0, 0, 0.5), green => ["red", "rgba(0, 0, 0, 0.5)", "green"]
    const stops = colorStopsString.split(/,(?![^(]*\))/);
    for (const stop of stops) {
      const trimmedStop = stop.trim().toLowerCase();
      // Match function like pattern or single words
      const parts = trimmedStop.match(/\S+\([^)]*\)|\S+/g);
      if (parts == null) {
        // If a color stop is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }
      // Case 1: [color, position, position]
      if (parts.length === 3) {
        const color = parts[0];
        const position1 = parts[1];
        const position2 = parts[2];
        const processedColor = processColor(color);
        if (processedColor == null) {
          // If a color is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
        if (position1.endsWith('%') && position2.endsWith('%')) {
          colorStops.push({
            color: processedColor,
            position: parseFloat(position1) / 100,
          });
          colorStops.push({
            color: processedColor,
            position: parseFloat(position2) / 100,
          });
        } else {
          // If a position is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
      }
      // Case 2: [color, position]
      else if (parts.length === 2) {
        const color = parts[0];
        const position = parts[1];
        const processedColor = processColor(color);
        if (processedColor == null) {
          // If a color is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
        if (position.endsWith('%')) {
          colorStops.push({
            color: processedColor,
            position: parseFloat(position) / 100,
          });
        } else {
          // If a position is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
      }
      // Case 3: [color]
      // Case 4: [position] => transition hint syntax
      else if (parts.length === 1) {
        if (parts[0].endsWith('%')) {
          colorStops.push({
            color: null,
            position: parseFloat(parts[0]) / 100,
          });
        } else {
          const processedColor = processColor(parts[0]);
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
    }

    const fixedColorStops = getFixedColorStops(colorStops);

    gradients.push({
      type: 'linearGradient',
      direction,
      colorStops: fixedColorStops,
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

// https://drafts.csswg.org/css-images-4/#color-stop-fixup
function getFixedColorStops(
  colorStops: $ReadOnlyArray<{
    color: ColorStopColor,
    position: number | null,
  }>,
): Array<{
  color: ColorStopColor,
  position: number,
}> {
  let fixedColorStops: Array<{
    color: ColorStopColor,
    position: number,
  }> = [];
  let hasNullPositions = false;
  let maxPositionSoFar = colorStops[0].position ?? 0;
  for (let i = 0; i < colorStops.length; i++) {
    const colorStop = colorStops[i];
    let newPosition = colorStop.position;
    if (newPosition === null) {
      // Step 1:
      // If the first color stop does not have a position,
      // set its position to 0%. If the last color stop does not have a position,
      // set its position to 100%.
      if (i === 0) {
        newPosition = 0;
      } else if (i === colorStops.length - 1) {
        newPosition = 1;
      }
    }
    // Step 2:
    // If a color stop or transition hint has a position
    // that is less than the specified position of any color stop or transition hint
    // before it in the list, set its position to be equal to the
    // largest specified position of any color stop or transition hint before it.
    if (newPosition !== null) {
      newPosition = Math.max(newPosition, maxPositionSoFar);
      fixedColorStops[i] = {
        color: colorStop.color,
        position: newPosition,
      };
      maxPositionSoFar = newPosition;
    } else {
      hasNullPositions = true;
    }
  }

  // Step 3:
  // If any color stop still does not have a position,
  // then, for each run of adjacent color stops without positions,
  // set their positions so that they are evenly spaced between the preceding and
  // following color stops with positions.
  if (hasNullPositions) {
    let lastDefinedIndex = 0;
    for (let i = 1; i < fixedColorStops.length; i++) {
      if (fixedColorStops[i] !== undefined) {
        const unpositionedStops = i - lastDefinedIndex - 1;
        if (unpositionedStops > 0) {
          const startPosition = fixedColorStops[lastDefinedIndex].position;
          const endPosition = fixedColorStops[i].position;
          const increment =
            (endPosition - startPosition) / (unpositionedStops + 1);
          for (let j = 1; j <= unpositionedStops; j++) {
            fixedColorStops[lastDefinedIndex + j] = {
              color: colorStops[lastDefinedIndex + j].color,
              position: startPosition + increment * j,
            };
          }
        }
        lastDefinedIndex = i;
      }
    }
  }

  return fixedColorStops;
}
