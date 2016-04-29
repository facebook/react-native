/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIManager
 * @flow
 */
'use strict';

var UIManager = require('NativeModules').UIManager;
var findNodeHandle = require('findNodeHandle');

const _takeSnapshot = UIManager.takeSnapshot;

/**
 * Capture an image of the screen, window or an individual view. The image
 * will be stored in a temporary file that will only exist for as long as the
 * app is running.
 *
 * The `view` argument can be the literal string `window` if you want to
 * capture the entire window, or it can be a reference to a specific
 * React Native component.
 *
 * The `options` argument may include:
 * - width/height (number) - the width and height of the image to capture.
 * - format (string) - either 'png' or 'jpeg'. Defaults to 'png'.
 * - quality (number) - the quality when using jpeg. 0.0 - 1.0 (default).
 *
 * Returns a Promise.
 * @platform ios
 */
UIManager.takeSnapshot = async function(
  view ?: 'window' | ReactElement | number,
  options ?: {
    width ?: number;
    height ?: number;
    format ?: 'png' | 'jpeg';
    quality ?: number;
  },
) {
  if (!_takeSnapshot) {
    console.warn('UIManager.takeSnapshot is not available on this platform');
    return;
  }
  if (typeof view !== 'number' && view !== 'window') {
    view = findNodeHandle(view) || 'window';
  }
  return _takeSnapshot(view, options);
};

module.exports = UIManager;
