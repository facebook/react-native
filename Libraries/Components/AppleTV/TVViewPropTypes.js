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

/**
 * Additional View properties for Apple TV
 */
export type TVViewProps = {
  /**
   * *(Apple TV only)* When set to true, this view will be focusable
   * and navigable using the Apple TV remote.
   *
   * @platform ios
   */
  isTVSelectable?: boolean,

  /**
   * *(Apple TV only)* May be set to true to force the Apple TV focus engine to move focus to this view.
   *
   * @platform ios
   */
  hasTVPreferredFocus?: boolean,

  /**
   * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
   *
   * enabled: If true, parallax effects are enabled.  Defaults to true.
   * shiftDistanceX: Defaults to 2.0.
   * shiftDistanceY: Defaults to 2.0.
   * tiltAngle: Defaults to 0.05.
   * magnification: Defaults to 1.0.
   *
   * @platform ios
   */
  tvParallaxProperties?: Object,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceX?: number,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceY?: number,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 0.05.
   *
   * @platform ios
   */
  tvParallaxTiltAngle?: number,

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 1.0.
   *
   * @platform ios
   */
  tvParallaxMagnification?: number,
};
