/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ImageSourcePropType
 * @no-flow
 */
'use strict';

const {PropTypes} = require('React');

const ImageURISourcePropType = PropTypes.shape({
  /**
   * `uri` is a string representing the resource identifier for the image, which
   * could be an http address, a local file path, or the name of a static image
   * resource (which should be wrapped in the `require('./path/to/image.png')`
   * function).
   */
  uri: PropTypes.string,
  /**
   * `bundle` is the iOS asset bundle which the image is included in. This
   * will default to [NSBundle mainBundle] if not set.
   * @platform ios
   */
  bundle: PropTypes.string,
  /**
   * `method` is the HTTP Method to use. Defaults to GET if not specified.
   */
  method: PropTypes.string,
  /**
   * `headers` is an object representing the HTTP headers to send along with the
   * request for a remote image.
   */
  headers: PropTypes.objectOf(PropTypes.string),
  /**
   * `body` is the HTTP body to send with the request. This must be a valid
   * UTF-8 string, and will be sent exactly as specified, with no
   * additional encoding (e.g. URL-escaping or base64) applied.
   */
  body: PropTypes.string,
  /**
   * `width` and `height` can be specified if known at build time, in which case
   * these will be used to set the default `<Image/>` component dimensions.
   */
  width: PropTypes.number,
  height: PropTypes.number,
  /**
   * `scale` is used to indicate the scale factor of the image. Defaults to 1.0 if
   * unspecified, meaning that one image pixel equates to one display point / DIP.
   */
  scale: PropTypes.number,
});

const ImageSourcePropType = PropTypes.oneOfType([
  ImageURISourcePropType,
  // Opaque type returned by require('./image.jpg')
  PropTypes.number,
  // Multiple sources
  PropTypes.arrayOf(ImageURISourcePropType),
]);

module.exports = ImageSourcePropType;
