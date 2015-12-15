/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ImageResizeMode
 * @flow
 */
'use strict';

var keyMirror = require('keyMirror');

/**
 * ImageResizeMode - Enum for different image resizing modes, set via
 * `resizeMode` style property on `<Image>` components.
 */
var ImageResizeMode = keyMirror({
  /**
   * contain - The image will be resized such that it will be completely
   * visible, contained within the frame of the View.
   */
  contain: null,
  /**
   * cover - The image will be resized such that the entire area of the view
   * is covered by the image, potentially clipping parts of the image.
   */
  cover: null,
  /**
   * stretch - The image will be stretched to fill the entire frame of the
   * view without clipping. This may change the aspect ratio of the image,
   * distorting it.
   */
  stretch: null,
});

module.exports = ImageResizeMode;
