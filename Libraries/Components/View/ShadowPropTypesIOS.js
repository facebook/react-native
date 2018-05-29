/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const ColorPropType = require('ColorPropType');
const ReactPropTypes = require('prop-types');

/**
 * These props can be used to dynamically generate shadows on views, images, text, etc.
 *
 * Because they are dynamically generated, they may cause performance regressions. Static
 * shadow image asset may be a better way to go for optimal performance.
 *
 * These properties are iOS only - for similar functionality on Android, use the [`elevation`
 * property](docs/viewstyleproptypes.html#elevation).
 */
const ShadowPropTypesIOS = {
  /**
   * Sets the drop shadow color
   * @platform ios
   */
  shadowColor: ColorPropType,
  /**
   * Sets the drop shadow offset
   * @platform ios
   */
  shadowOffset: ReactPropTypes.shape({
    width: ReactPropTypes.number,
    height: ReactPropTypes.number,
  }),
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
