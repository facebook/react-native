/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import invariant from 'invariant';

const INDEX_X = 0;
const INDEX_Y = 1;
const INDEX_Z = 2;

export default function processTransformOrigin(
  transformOrigin: Array<string | number> | string,
): Array<string | number> {
  if (typeof transformOrigin === 'string') {
    const regExp = /(top|bottom|left|right|center|\d+(?:%|px)|0)/gi;
    const transformOriginArray: Array<string | number> = ['50%', '50%', 0];

    let index = 0;
    let match;
    while ((match = regExp.exec(transformOrigin))) {
      const value = match[0];
      const valueLower = value.toLowerCase();

      switch (valueLower) {
        case 'left':
        case 'right': {
          invariant(
            index === INDEX_X,
            'Transform-origin %s can only be used for x-position',
            value,
          );
          transformOriginArray[INDEX_X] = valueLower === 'left' ? 0 : '100%';
          break;
        }
        case 'top':
        case 'bottom': {
          if (index === INDEX_X) {
            // Handle [[ center | left | right ] && [ center | top | bottom ]] <length>?
            index = _parseHorizontalPosition(
              transformOrigin,
              regExp,
              transformOriginArray,
              index,
            );
          } else {
            invariant(
              index === INDEX_Y,
              'Transform-origin %s can only be used for y-position',
              value,
            );
          }
          transformOriginArray[INDEX_Y] = valueLower === 'top' ? 0 : '100%';
          break;
        }
        case 'center': {
          invariant(
            index !== INDEX_Z,
            'Transform-origin value %s cannot be used for z-position',
            value,
          );
          transformOriginArray[index] = '50%';
          break;
        }
        default: {
          if (value.endsWith('%')) {
            transformOriginArray[index] = value;
          } else {
            transformOriginArray[index] = parseFloat(value); // Remove `px`
          }
          break;
        }
      }

      index += 1;
    }

    transformOrigin = transformOriginArray;
  }

  if (__DEV__) {
    _validateTransformOrigin(transformOrigin);
  }

  return transformOrigin;
}

function _parseHorizontalPosition(
  transformOrigin: string,
  regExp: RegExp,
  transformOriginArray: Array<string | number>,
  index: number,
): number {
  const match = regExp.exec(transformOrigin);
  if (match == null) {
    return index;
  }

  const value = match[0];
  const valueLower = value.toLowerCase();

  switch (valueLower) {
    case 'left':
      transformOriginArray[INDEX_X] = 0;
      break;
    case 'right':
      transformOriginArray[INDEX_X] = '100%';
      break;
    case 'center':
      transformOriginArray[INDEX_X] = '50%';
      break;
    default:
      invariant(false, 'Could not parse transform-origin: %s', transformOrigin);
  }

  return index + 1;
}

function _validateTransformOrigin(transformOrigin: Array<string | number>) {
  invariant(
    transformOrigin.length === 3,
    'Transform origin must have exactly 3 values. Passed transform origin: %s.',
    transformOrigin,
  );
  const [x, y, z] = transformOrigin;
  invariant(
    typeof x === 'number' || (typeof x === 'string' && x.endsWith('%')),
    'Transform origin x-position must be a number. Passed value: %s.',
    x,
  );
  invariant(
    typeof y === 'number' || (typeof y === 'string' && y.endsWith('%')),
    'Transform origin y-position must be a number. Passed value: %s.',
    y,
  );
  invariant(
    typeof z === 'number',
    'Transform origin z-position must be a number. Passed value: %s.',
    z,
  );
}
