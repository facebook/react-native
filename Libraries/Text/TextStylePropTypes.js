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

const ColorPropType = require('ColorPropType');
const ReactPropTypes = require('prop-types');
const ViewStylePropTypes = require('ViewStylePropTypes');

const TextStylePropTypes = {
  ...ViewStylePropTypes,

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
  /**
   * @platform ios
   */
  fontVariant: ReactPropTypes.arrayOf(
    ReactPropTypes.oneOf([
      'small-caps',
      'oldstyle-nums',
      'lining-nums',
      'tabular-nums',
      'proportional-nums',
    ])
  ),
  textShadowOffset: ReactPropTypes.shape(
    {width: ReactPropTypes.number, height: ReactPropTypes.number}
  ),
  textShadowRadius: ReactPropTypes.number,
  textShadowColor: ColorPropType,
  /**
   * Increase or decrease the spacing between characters. The default value is 0, for no extra
   * letter spacing.
   *
   * iOS: The additional space will be rendered after each glyph.
   *  
   * Android: Only supported since Android 5.0 - older versions will ignore this attribute.
   * Please note that additional space will be added *around* the glyphs (half on each side), which
   * differs from the iOS rendering. It is possible to emulate the iOS rendering by using layout
   * attributes, e.g. negative margins, as appropriate for your situation.
   *
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
  /**
   * Set to `false` to remove extra font padding intended to make space for certain ascenders / descenders.
   * With some fonts, this padding can make text look slightly misaligned when centered vertically.
   * For best results also set `textAlignVertical` to `center`. Default is true.
   * @platform android
   */
  includeFontPadding: ReactPropTypes.bool,
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
};

module.exports = TextStylePropTypes;
