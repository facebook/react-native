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

export type TVParallaxPropertiesType = $ReadOnly<{|
  /**
   * If true, parallax effects are enabled.  Defaults to true.
   */
  enabled?: boolean,

  /**
   * Defaults to 2.0.
   */
  shiftDistanceX?: number,

  /**
   * Defaults to 2.0.
   */
  shiftDistanceY?: number,

  /**
   * Defaults to 0.05.
   */
  tiltAngle?: number,

  /**
   * Defaults to 1.0
   */
  magnification?: number,

  /**
   * Defaults to 1.0
   */
  pressMagnification?: number,

  /**
   * Defaults to 0.3
   */
  pressDuration?: number,

  /**
   * Defaults to 0.3
   */
  pressDelay?: number,
|}>;

/**
 * Additional View properties for Apple TV
 */
export type TVViewProps = $ReadOnly<{|
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
   * @platform ios
   */
  tvParallaxProperties?: TVParallaxPropertiesType,

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
|}>;
