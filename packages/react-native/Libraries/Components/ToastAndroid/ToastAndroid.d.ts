/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This exposes the native ToastAndroid module as a JS module. This has a function 'show'
 * which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG
 *
 * There is also a function `showWithGravity` to specify the layout gravity. May be
 * ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER
 */
export interface ToastAndroidStatic {
  /**
   * String message: A string with the text to toast
   * int duration: The duration of the toast.
   * May be ToastAndroid.SHORT or ToastAndroid.LONG
   */
  show(message: string, duration: number): void;
  /** `gravity` may be ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER */
  showWithGravity(message: string, duration: number, gravity: number): void;

  showWithGravityAndOffset(
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ): void;
  // Toast duration constants
  SHORT: number;
  LONG: number;
  // Toast gravity constants
  TOP: number;
  BOTTOM: number;
  CENTER: number;
}

export const ToastAndroid: ToastAndroidStatic;
export type ToastAndroid = ToastAndroidStatic;
