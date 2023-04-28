/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const ToastAndroid = {
  // These values are arbitrary defaults since Toast is not supported in iOS.
  SHORT: 1,
  LONG: 2,
  TOP: 10,
  BOTTOM: 90,
  CENTER: 50,

  show: function (message: string, duration: number): void {
    console.warn('ToastAndroid is not supported on this platform.');
  },

  showWithGravity: function (
    message: string,
    duration: number,
    gravity: number,
  ): void {
    console.warn('ToastAndroid is not supported on this platform.');
  },

  showWithGravityAndOffset: function (
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ): void {
    console.warn('ToastAndroid is not supported on this platform.');
  },
};

module.exports = ToastAndroid;
