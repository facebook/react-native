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
 *   width: PixelRatio.getPixelSizeForLayoutSize(200),
 *   height: PixelRatio.getPixelSizeForLayoutSize(100),
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
   *   - PixelRatio.get() === 3.5
   *     - Nexus 6
   */
  static get(): number {
    return Dimensions.get('window').scale;
  }

  /**
   * Returns the scaling factor for font sizes. This is the ratio that is used to calculate the
   * absolute font size, so any elements that heavily depend on that should use this to do
   * calculations.
   *
   * If a font scale is not set, this returns the device pixel ratio.
   *
   * Currently this is only implemented on Android and reflects the user preference set in
   * Settings > Display > Font size, on iOS it will always return the default pixel ratio.
   */
  static getFontScale(): number {
    return Dimensions.get('window').fontScale || PixelRatio.get();
  }

  /**
   * Converts a layout size (dp) to pixel size (px).
   *
   * Guaranteed to return an integer number.
   */
  static getPixelSizeForLayoutSize(layoutSize: number): number {
    return Math.round(layoutSize * PixelRatio.get());
  }

  // No-op for iOS, but used on the web. Should not be documented.
  static startDetecting() {}
}

module.exports = PixelRatio;
