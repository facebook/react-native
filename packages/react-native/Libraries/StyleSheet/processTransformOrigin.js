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
          const yValue = valueLower === 'top' ? 0 : '100%';

          if (index === INDEX_X) {
            // Handle one-value case
            const noMoreValuesRemaining = regExp.exec(transformOrigin) === null;
            invariant(
              noMoreValuesRemaining,
              'Could not parse transform-origin: %s',
              transformOrigin,
            );
            transformOriginArray[INDEX_Y] = yValue;
          } else {
            invariant(
              index === INDEX_Y,
              'Transform-origin %s can only be used for y-position',
              value,
            );
            transformOriginArray[INDEX_Y] = yValue;
          }

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
            invariant(
              index !== INDEX_Z,
              'Transform-origin value %s cannot be used for z-position',
              value,
            );
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

function _validateTransformOrigin(transformOrigin) {
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
