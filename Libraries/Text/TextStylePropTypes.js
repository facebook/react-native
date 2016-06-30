/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TextStylePropTypes
 * @flow
 */
'use strict';

var ReactPropTypes = require('ReactPropTypes');
var ColorPropType = require('ColorPropType');
var ViewStylePropTypes = require('ViewStylePropTypes');

// TODO: use spread instead of Object.assign/create after #6560135 is fixed
var TextStylePropTypes = Object.assign(Object.create(ViewStylePropTypes), {
  color: ColorPropType,
  fontFamily: ReactPropTypes.string,
  fontSize: ReactPropTypes.number,
  fontStyle: ReactPropTypes.oneOf(['normal', 'italic']),
  /**
   * Specifies font weight. The values 'normal' and 'bold' are supported for
   * most fonts. Not all fonts have a variant for each of the numeric values,
   * in that case the closest one is chosen.
   */
  fontWeight: ReactPropTypes.oneOf(
    ['normal' /*default*/, 'bold',
     '100', '200', '300', '400', '500', '600', '700', '800', '900']
  ),
  textShadowOffset: ReactPropTypes.shape(
    {width: ReactPropTypes.number, height: ReactPropTypes.number}
  ),
  textShadowRadius: ReactPropTypes.number,
  textShadowColor: ColorPropType,
  /**
   * @platform ios
   */
  letterSpacing: ReactPropTypes.number,
  lineHeight: ReactPropTypes.number,
  /**
   * Specifies text alignment. The value 'justify' is only supported on iOS and
   * fallbacks to `left` on Android.
   */
  textAlign: ReactPropTypes.oneOf(
    ['auto' /*default*/, 'left', 'right', 'center', 'justify']
  ),
  /**
   * @platform android
   */
  textAlignVertical: ReactPropTypes.oneOf(
    ['auto' /*default*/, 'top', 'bottom', 'center']
  ),
  textDecorationLine: ReactPropTypes.oneOf(
    ['none' /*default*/, 'underline', 'line-through', 'underline line-through']
  ),
  /**
   * @platform ios
   */
  textDecorationStyle: ReactPropTypes.oneOf(
    ['solid' /*default*/, 'double', 'dotted','dashed']
  ),
  /**
   * @platform ios
   */
  textDecorationColor: ColorPropType,
  /**
   * @platform ios
   */
  writingDirection: ReactPropTypes.oneOf(
    ['auto' /*default*/, 'ltr', 'rtl']
  ),
});

module.exports = TextStylePropTypes;
