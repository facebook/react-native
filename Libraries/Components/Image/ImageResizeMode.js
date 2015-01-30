/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ImageResizeMode
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
   * view without clipping.  This may change the aspect ratio of the image,
   * distoring it.  Only supported on iOS.
   */
  stretch: null,
});

module.exports = ImageResizeMode;
