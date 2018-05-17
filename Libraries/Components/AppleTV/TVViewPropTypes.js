/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';
const PropTypes = require('prop-types');

/**
 * Additional View properties for Apple TV
 */
const TVViewPropTypes = {
  /**
   * When set to true, this view will be focusable
   * and navigable using the TV remote.
   */
  isTVSelectable: PropTypes.bool,

  /**
   * May be set to true to force the TV focus engine to move focus to this view.
   */
  hasTVPreferredFocus: PropTypes.bool,

  /**
   * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
   *
   * enabled: If true, parallax effects are enabled.  Defaults to true.
   * shiftDistanceX: Defaults to 2.0.
   * shiftDistanceY: Defaults to 2.0.
   * tiltAngle: Defaults to 0.05.
   * magnification: Defaults to 1.0.
   * pressMagnification: Defaults to 1.0.
   * pressDuration: Defaults to 0.3.
   * pressDelay: Defaults to 0.0.
   *
   * @platform ios
   */
  tvParallaxProperties: PropTypes.object,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceX: PropTypes.number,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceY: PropTypes.number,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 0.05.
   *
   * @platform ios
   */
  tvParallaxTiltAngle: PropTypes.number,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 1.0.
   *
   * @platform ios
   */
  tvParallaxMagnification: PropTypes.number,
};

export type TVViewProps = $ReadOnly<{|
  isTVSelectable?: boolean,
  hasTVPreferredFocus?: boolean,
  tvParallaxProperties?: Object,
  tvParallaxShiftDistanceX?: number,
  tvParallaxShiftDistanceY?: number,
  tvParallaxTiltAngle?: number,
  tvParallaxMagnification?: number,
|}>;

module.exports = TVViewPropTypes;
