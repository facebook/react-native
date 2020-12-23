/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const PixelRatio = require('../Utilities/PixelRatio');
function AssetSourcePickScale(
  scales: Array<number>,
  deviceScale?: number,
): number {
  if (deviceScale == null) {
    deviceScale = PixelRatio.get();
  }
  // Packager guarantees that `scales` array is sorted
  for (let i = 0; i < scales.length; i++) {
    if (scales[i] >= deviceScale) {
      return scales[i];
    }
  }

  // If nothing matches, device scale is larger than any available
  // scales, so we return the biggest one. Unless the array is empty,
  // in which case we default to 1
  return scales[scales.length - 1] || 1;
}
module.exports = AssetSourcePickScale;
