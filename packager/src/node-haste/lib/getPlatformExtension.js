/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const SUPPORTED_PLATFORM_EXTS = new Set([
  'android',
  'ios',
  'web',
]);

// Extract platform extension: index.ios.js -> ios
function getPlatformExtension(file, platforms = SUPPORTED_PLATFORM_EXTS) {
  const last = file.lastIndexOf('.');
  const secondToLast = file.lastIndexOf('.', last - 1);
  if (secondToLast === -1) {
    return null;
  }
  const platform = file.substring(secondToLast + 1, last);
  return platforms.has(platform) ? platform : null;
}

module.exports = getPlatformExtension;
