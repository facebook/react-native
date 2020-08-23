/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const DeprecatedColorPropType = require('./DeprecatedColorPropType');
const DeprecatedLayoutPropTypes = require('./DeprecatedLayoutPropTypes');
const DeprecatedShadowPropTypesIOS = require('./DeprecatedShadowPropTypesIOS');
const DeprecatedTransformPropTypes = require('./DeprecatedTransformPropTypes');
const ReactPropTypes = require('prop-types');

const ImageStylePropTypes = {
  ...DeprecatedLayoutPropTypes,
  ...DeprecatedShadowPropTypesIOS,
  ...DeprecatedTransformPropTypes,
  resizeMode: (ReactPropTypes.oneOf([
    'center',
    'contain',
    'cover',
    'repeat',
    'stretch',
  ]): React$PropType$Primitive<
    'center' | 'contain' | 'cover' | 'repeat' | 'stretch',
  >),
  backfaceVisibility: (ReactPropTypes.oneOf([
    'visible',
    'hidden',
  ]): React$PropType$Primitive<'visible' | 'hidden'>),
  backgroundColor: DeprecatedColorPropType,
  borderColor: DeprecatedColorPropType,
  borderWidth: ReactPropTypes.number,
  borderRadius: ReactPropTypes.number,
  overflow: (ReactPropTypes.oneOf([
    'visible',
    'hidden',
  ]): React$PropType$Primitive<'visible' | 'hidden'>),

  /**
   * Changes the color of all the non-transparent pixels to the tintColor.
   */
  tintColor: DeprecatedColorPropType,
  opacity: ReactPropTypes.number,
  /**
   * When the image has rounded corners, specifying an overlayColor will
   * cause the remaining space in the corners to be filled with a solid color.
   * This is useful in cases which are not supported by the Android
   * implementation of rounded corners:
   *   - Certain resize modes, such as 'contain'
   *   - Animated GIFs
   *
   * A typical way to use this prop is with images displayed on a solid
   * background and setting the `overlayColor` to the same color
   * as the background.
   *
   * For details of how this works under the hood, see
   * http://frescolib.org/docs/rounded-corners-and-circles.html
   *
   * @platform android
   */
  overlayColor: ReactPropTypes.string,

  // Android-Specific styles
  borderTopLeftRadius: ReactPropTypes.number,
  borderTopRightRadius: ReactPropTypes.number,
  borderBottomLeftRadius: ReactPropTypes.number,
  borderBottomRightRadius: ReactPropTypes.number,
};

module.exports = ImageStylePropTypes;
