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

const SUPPORTED_INFIX_EXTS = new Set([]);

// Extract platform extension: index.ios.js -> ios
function getPlatformExtension(file, platforms = SUPPORTED_PLATFORM_EXTS) {
  const fileWithoutPath = file.split('/').pop();
  const platformsArray = [...platforms].filter(platform => platform);
  if (platformsArray.length === 0) {
    return null;
  }
  const platformRegex = new RegExp(`\.(${platformsArray.join('|')})\.`);
  const match = platformRegex.exec(fileWithoutPath);
  return !match ? null : match[1];
}

// Extract the infixExt extension from the file name,
// specified by the list of possible extensions
function getInfixExt(file, infixExts = SUPPORTED_INFIX_EXTS) {
  if ([...infixExts].length === 0) {
    return null;
  }
  const fileWithoutPath = file.split('/').pop();
  const platformRegex = new RegExp(`\.(${[...infixExts].join('|')})\.`);
  const match = platformRegex.exec(fileWithoutPath);
  return !match ? null : match[1];
}

module.exports = {getInfixExt, getPlatformExtension};
