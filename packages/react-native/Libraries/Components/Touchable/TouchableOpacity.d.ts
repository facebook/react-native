/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../../types/private/Utilities';
import {TimerMixin} from '../../../types/private/TimerMixin';
import {NativeMethods} from '../../../types/public/ReactNativeTypes';
import {TVParallaxProperties} from '../View/ViewPropTypes';
import {TouchableMixin} from './Touchable';
import {TouchableWithoutFeedbackProps} from './TouchableWithoutFeedback';

export interface TVProps {
  /**
   * *(Apple TV only)* TV preferred focus (see documentation for the View component).
   *
   * @platform ios
   */
  hasTVPreferredFocus?: boolean | undefined;

  /**
   * Designates the next view to receive focus when the user navigates down. See the Android documentation.
   *
   * @platform android
   */
  nextFocusDown?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates forward. See the Android documentation.
   *
   * @platform android
   */
  nextFocusForward?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates left. See the Android documentation.
   *
   * @platform android
   */
  nextFocusLeft?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates right. See the Android documentation.
   *
   * @platform android
   */
  nextFocusRight?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates up. See the Android documentation.
   *
   * @platform android
   */
  nextFocusUp?: number | undefined;
}

/**
 * @see https://reactnative.dev/docs/touchableopacity#props
 */
export interface TouchableOpacityProps
  extends TouchableWithoutFeedbackProps,
    TVProps {
  /**
   * Determines what the opacity of the wrapped view should be when touch is active.
   * Defaults to 0.2
   */
  activeOpacity?: number | undefined;

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
   * @platform android
   */
  tvParallaxProperties?: TVParallaxProperties | undefined;
}

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, dimming it.
 * This is done without actually changing the view hierarchy,
 * and in general is easy to add to an app without weird side-effects.
 *
 * @see https://reactnative.dev/docs/touchableopacity
 */
declare class TouchableOpacityComponent extends React.Component<TouchableOpacityProps> {}
declare const TouchableOpacityBase: Constructor<TimerMixin> &
  Constructor<TouchableMixin> &
  Constructor<NativeMethods> &
  typeof TouchableOpacityComponent;
export class TouchableOpacity extends TouchableOpacityBase {
  /**
   * Animate the touchable to a new opacity.
   */
  setOpacityTo: (value: number) => void;
}
