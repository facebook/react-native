/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const DeprecatedColorPropType = require('./DeprecatedColorPropType');
const DeprecatedViewStylePropTypes = require('./DeprecatedViewStylePropTypes');
const ReactPropTypes = require('prop-types');

const DeprecatedTextStylePropTypes = {
  ...DeprecatedViewStylePropTypes,

  color: DeprecatedColorPropType,
  fontFamily: ReactPropTypes.string,
  fontSize: ReactPropTypes.number,
  fontStyle: (ReactPropTypes.oneOf([
    'normal',
    'italic',
  ]): React$PropType$Primitive<'normal' | 'italic'>),
  /**
   * Specifies font weight. The values 'normal' and 'bold' are supported for
   * most fonts. Not all fonts have a variant for each of the numeric values,
   * in that case the closest one is chosen.
   */
  fontWeight: (ReactPropTypes.oneOf([
    'normal' /*default*/,
    'bold',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
  ]): React$PropType$Primitive<
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900',
  >),
  /**
   * @platform ios
   */
  fontVariant: (ReactPropTypes.arrayOf(
    ReactPropTypes.oneOf([
      'small-caps',
      'oldstyle-nums',
      'lining-nums',
      'tabular-nums',
      'proportional-nums',
    ]),
  ): React$PropType$Primitive<
    Array<
      | 'small-caps'
      | 'oldstyle-nums'
      | 'lining-nums'
      | 'tabular-nums'
      | 'proportional-nums',
    >,
  >),
  textShadowOffset: (ReactPropTypes.shape({
    width: ReactPropTypes.number,
    height: ReactPropTypes.number,
  }): React$PropType$Primitive<{height?: number, width?: number}>),
  textShadowRadius: ReactPropTypes.number,
  textShadowColor: DeprecatedColorPropType,
  /**
   * @platform ios
   */
  letterSpacing: ReactPropTypes.number,
  lineHeight: ReactPropTypes.number,
  /**
   * Specifies text alignment. The value 'justify' is only supported on iOS and
   * fallbacks to `left` on Android.
   */
  textAlign: (ReactPropTypes.oneOf([
    'auto' /*default*/,
    'left',
    'right',
    'center',
    'justify',
  ]): React$PropType$Primitive<
    'auto' | 'left' | 'right' | 'center' | 'justify',
  >),
  /**
   * @platform android
   */
  textAlignVertical: (ReactPropTypes.oneOf([
    'auto' /*default*/,
    'top',
    'bottom',
    'center',
  ]): React$PropType$Primitive<'auto' | 'top' | 'bottom' | 'center'>),
  /**
   * Set to `false` to remove extra font padding intended to make space for certain ascenders / descenders.
   * With some fonts, this padding can make text look slightly misaligned when centered vertically.
   * For best results also set `textAlignVertical` to `center`. Default is true.
   * @platform android
   */
  includeFontPadding: ReactPropTypes.bool,
  textDecorationLine: (ReactPropTypes.oneOf([
    'none' /*default*/,
    'underline',
    'line-through',
    'underline line-through',
  ]): React$PropType$Primitive<
    'none' | 'underline' | 'line-through' | 'underline line-through',
  >),
  /**
   * @platform ios
   */
  textDecorationStyle: (ReactPropTypes.oneOf([
    'solid' /*default*/,
    'double',
    'dotted',
    'dashed',
  ]): React$PropType$Primitive<'solid' | 'double' | 'dotted' | 'dashed'>),
  /**
   * @platform ios
   */
  textDecorationColor: DeprecatedColorPropType,
  textTransform: (ReactPropTypes.oneOf([
    'none' /*default*/,
    'capitalize',
    'uppercase',
    'lowercase',
  ]): React$PropType$Primitive<
    'none' | 'capitalize' | 'uppercase' | 'lowercase',
  >),
  /**
   * @platform ios
   */
  writingDirection: (ReactPropTypes.oneOf([
    'auto' /*default*/,
    'ltr',
    'rtl',
  ]): React$PropType$Primitive<'auto' | 'ltr' | 'rtl'>),
};

module.exports = DeprecatedTextStylePropTypes;
