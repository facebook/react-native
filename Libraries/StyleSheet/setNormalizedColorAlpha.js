/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule setNormalizedColorAlpha
 * @flow
 */
/* eslint no-bitwise: 0 */
'use strict';

/**
 * number should be a color processed by `normalizeColor`
 * alpha should be number between 0 and 1
 */
function setNormalizedColorAlpha(input: number, alpha: number): number {
  let alphaTemp = alpha;
  if (alphaTemp < 0) {
    alphaTemp = 0;
  } else if (alphaTemp > 1) {
    alphaTemp = 1;
  }

  alphaTemp = Math.round(alphaTemp * 255);
  // magic bitshift guarantees we return an unsigned int
  return ((input & 0xffffff00) | alphaTemp) >>> 0;
}

module.exports = setNormalizedColorAlpha;
