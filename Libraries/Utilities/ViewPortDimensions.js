/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewPortDimensions
 * @flow
 */
'use strict';

var Dimensions = require('Dimensions');

/**
 * ViewPortDimensions class gives access to the viewport's height and width.
 *
 * This could be used if someone wanted an image which stretched the width of
 * the device
 */
class ViewPortDimensions {
  /**
   * Returns the device width.
   */
  static getWidth(): number {
    return Dimensions.get('window').width;
  }

  /**
   * Returns the device width.
   */
  static getHeight(): number {
    return Dimensions.get('window').height;
  }
}

module.exports = ViewPortDimensons;
