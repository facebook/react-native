/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ImageResizeMode
 * @flow
 * @format
 */
'use strict';

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
var keyMirror = require('fbjs/lib/keyMirror');

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
  /**
   * center - The image will be scaled down such that it is completely visible,
   * if bigger than the area of the view.
   * The image will not be scaled up.
   */
  center: null,

  /**
   * repeat - The image will be repeated to cover the frame of the View. The
   * image will keep it's size and aspect ratio.
   */
  repeat: null,
});

module.exports = ImageResizeMode;
