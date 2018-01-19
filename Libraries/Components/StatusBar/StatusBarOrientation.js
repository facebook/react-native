/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StatusBarOrientation
 * @flow
 */
'use strict';

var keyMirror = require('fbjs/lib/keyMirror');

/**
 * StatusBarOrientation - Enum for different orientations of StatusBar.
 */
var StatusBarOrientation = keyMirror({
  /**
   * portrait - Orientation is portrait.
   */
  portrait: null,
  /**
   * portraitUpsideDown - Orientation is portrait upside down.
   */
  portraitUpsideDown: null,
  /**
   * landscapeLeft - Orientation is landscape left.
   */
  landscapeLeft: null,
  /**
  * landscapeRight - Orientation is landscape right.
  */
  landscapeRight: null,
});

module.exports = StatusBarOrientation;
