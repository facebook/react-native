/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

/* eslint no-bitwise: 0 */
'use strict';

/**
 * number should be a color processed by `normalizeColor`
 * alpha should be number between 0 and 1
 */
function setNormalizedColorAlpha(input: number, alpha: number): number {
  if (alpha < 0) {
    alpha = 0;
  } else if (alpha > 1) {
    alpha = 1;
  }

  alpha = Math.round(alpha * 255);
  // magic bitshift guarantees we return an unsigned int
  return ((input & 0xffffff00) | alpha) >>> 0;
}

module.exports = setNormalizedColorAlpha;
