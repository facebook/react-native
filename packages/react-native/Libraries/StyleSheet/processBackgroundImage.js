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
const DIRECTION_REGEX =
  /^to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?/;
const ANGLE_UNIT_REGEX = /^([+-]?\d*\.?\d+)(deg|grad|rad|turn)$/i;
const VALID_DIRECTIONS = new Set([
  'to top',
  'to bottom',
  'to left',
  'to right',
  'to top right',
  'to right top',
  'to top left',
  'to left top',
  'to bottom right',
  'to right bottom',
]);

type LinearGradientOrientation =
  | {type: 'angle', value: number}
  | {type: 'direction', value: string};

type ParsedGradientValue = {
  type: 'linearGradient',
  orientation: LinearGradientOrientation,
  colorStops: $ReadOnlyArray<{
    color: ProcessedColorValue,
    position: number,
  }>,
};

const DEFAULT_ORIENTATION: LinearGradientOrientation = {
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
        color: ProcessedColorValue,
        position: number | null,
      }> = [];
      for (let index = 0; index < bgImage.colorStops.length; index++) {
        const colorStop = bgImage.colorStops[index];
        const processedColor = processColor(colorStop.color);
        if (processedColor == null) {
          // If a color is invalid, return an empty array and do not apply gradient. Same as web.
          return [];
        }
        if (colorStop.positions != null && colorStop.positions.length > 0) {
          for (const position of colorStop.positions) {
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

      let orientation: LinearGradientOrientation = DEFAULT_ORIENTATION;

      if (
        bgImage.direction != null &&
        ANGLE_UNIT_REGEX.test(bgImage.direction)
      ) {
        const parsedAngle = getAngleInDegrees(bgImage.direction);
        if (parsedAngle != null) {
          orientation = {
            type: 'angle',
            value: parsedAngle,
          };
        }
      } else if (
        bgImage.direction != null &&
        DIRECTION_REGEX.test(bgImage.direction)
      ) {
        const parsedDirection = getDirectionString(bgImage.direction);
        if (parsedDirection != null) {
          orientation = {
            type: 'direction',
            value: parsedDirection,
          };
        }
      }

      const fixedColorStops = getFixedColorStops(processedColorStops);

      result = result.concat({
        type: 'linearGradient',
        orientation,
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
    let orientation: LinearGradientOrientation = DEFAULT_ORIENTATION;
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
        orientation = {
          type: 'angle',
          value: parsedAngle,
        };
        parts.shift();
      } else {
        // If an angle is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }
    } else if (DIRECTION_REGEX.test(trimmedDirection)) {
      const parsedDirection = getDirectionString(trimmedDirection);
      if (parsedDirection != null) {
        orientation = {
          type: 'direction',
          value: parsedDirection,
        };
        parts.shift();
      } else {
        // If a direction is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }
    } else if (!colorStopRegex.test(trimmedDirection)) {
      // If first part is not an angle/direction or a color stop, return an empty array and do not apply any gradient. Same as web.
      return [];
    }
    colorStopRegex.lastIndex = 0;

    const colorStops = [];
    const fullColorStopsStr = parts.join(',');
    let colorStopMatch;
    while ((colorStopMatch = colorStopRegex.exec(fullColorStopsStr))) {
      const [, color, position1, position2] = colorStopMatch;
      const processedColor = processColor(color.trim().toLowerCase());
      if (processedColor == null) {
        // If a color is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }

      if (typeof position1 !== 'undefined') {
        if (position1.endsWith('%')) {
          colorStops.push({
            color: processedColor,
            position: parseFloat(position1) / 100,
          });
        } else {
          // If a position is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
      } else {
        colorStops.push({
          color: processedColor,
          position: null,
        });
      }

      if (typeof position2 !== 'undefined') {
        if (position2.endsWith('%')) {
          colorStops.push({
            color: processedColor,
            position: parseFloat(position2) / 100,
          });
        } else {
          // If a position is invalid, return an empty array and do not apply any gradient. Same as web.
          return [];
        }
      }
    }

    const fixedColorStops = getFixedColorStops(colorStops);

    gradients.push({
      type: 'linearGradient',
      orientation,
      colorStops: fixedColorStops,
    });
  }

  return gradients;
}

function getDirectionString(direction?: string): ?string {
  if (direction == null) {
    return null;
  }
  // Remove extra whitespace
  const normalizedDirection = direction.replace(/\s+/g, ' ');
  return VALID_DIRECTIONS.has(normalizedDirection) ? normalizedDirection : null;
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
    color: ProcessedColorValue,
    position: number | null,
  }>,
): Array<{
  color: ProcessedColorValue,
  position: number,
}> {
  let fixedColorStops: Array<{
    color: ProcessedColorValue,
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
