/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');

const SUPPORTED_PLATFORM_EXTS = ['android', 'ios', 'web'];

const re = new RegExp(
  '[^\\.]+\\.(' + SUPPORTED_PLATFORM_EXTS.join('|') + ')\\.\\w+$'
);

// Extract platform extension: index.ios.js -> ios
function getPlatformExtension(file) {
  const match = file.match(re);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

module.exports = getPlatformExtension;
