/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PixelRatio
 * @flow
 */
'use strict';

var Dimensions = require('Dimensions');

/**
 * PixelRatio class gives access to the device pixel density.
 *
 * There are a few use cases for using PixelRatio:
 *
 * ### Displaying a line that's as thin as the device permits
 *
 * A width of 1 is actually pretty thick on an iPhone 4+, we can do one that's
 * thinner using a width of `1 / PixelRatio.get()`. It's a technique that works
 * on all the devices independent of their pixel density.
 *
 * ```
 * style={{ borderWidth: 1 / PixelRatio.get() }}
 * ```
 *
 * ### Fetching a correctly sized image
 *
 * You should get a higher resolution image if you are on a high pixel density
 * device. A good rule of thumb is to multiply the size of the image you display
 * by the pixel ratio.
 *
 * ```
 * var image = getImage({
 *   width: 200 * PixelRatio.get(),
 *   height: 100 * PixelRatio.get()
 * });
 * <Image source={image} style={{width: 200, height: 100}} />
 * ```
 */
class PixelRatio {
  /**
   * Returns the device pixel density. Some examples:
   *
   *   - PixelRatio.get() === 2
   *     - iPhone 4, 4S
   *     - iPhone 5, 5c, 5s
   *     - iPhone 6
   *   - PixelRatio.get() === 3
   *     - iPhone 6 plus
   */
  static get(): number {
    return Dimensions.get('window').scale;
  }
}

// No-op for iOS, but used on the web. Should not be documented.
PixelRatio.startDetecting = function() {};

module.exports = PixelRatio;
