/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import PixelRatio from '../Utilities/PixelRatio';

let cacheBreaker;
let warnIfCacheBreakerUnset = true;

export function pickScale(scales: Array<number>, deviceScale?: number): number {
  const requiredDeviceScale = deviceScale ?? PixelRatio.get();

  // Packager guarantees that `scales` array is sorted
  for (let i = 0; i < scales.length; i++) {
    if (scales[i] >= requiredDeviceScale) {
      return scales[i];
    }
  }

  // If nothing matches, device scale is larger than any available
  // scales, so we return the biggest one. Unless the array is empty,
  // in which case we default to 1
  return scales[scales.length - 1] || 1;
}

export function setUrlCacheBreaker(appendage: string) {
  cacheBreaker = appendage;
}

export function getUrlCacheBreaker(): string {
  if (cacheBreaker == null) {
    if (__DEV__ && warnIfCacheBreakerUnset) {
      warnIfCacheBreakerUnset = false;
      console.warn(
        'AssetUtils.getUrlCacheBreaker: Cache breaker value is unset',
      );
    }
    return '';
  }
  return cacheBreaker;
}
