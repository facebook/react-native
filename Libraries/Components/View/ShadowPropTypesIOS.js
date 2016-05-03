/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ShadowPropTypesIOS
 * @flow
 */
'use strict';

var ColorPropType = require('ColorPropType');
var ReactPropTypes = require('ReactPropTypes');

var ShadowPropTypesIOS = {
  /**
   * Sets the drop shadow color
   * @platform ios
   */
  shadowColor: ColorPropType,
  /**
   * Sets the drop shadow offset
   * @platform ios
   */
  shadowOffset: ReactPropTypes.shape(
    {width: ReactPropTypes.number, height: ReactPropTypes.number}
  ),
  /**
   * Sets the drop shadow opacity (multiplied by the color's alpha component)
   * @platform ios
   */
  shadowOpacity: ReactPropTypes.number,
  /**
   * Sets the drop shadow blur radius
   * @platform ios
   */
  shadowRadius: ReactPropTypes.number,
};

module.exports = ShadowPropTypesIOS;
