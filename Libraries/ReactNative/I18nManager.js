/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

import NativeI18nManager from './NativeI18nManager';

module.exports = {
  getConstants: () => {
    return NativeI18nManager.getConstants();
  },

  allowRTL: (shouldAllow: boolean) => {
    NativeI18nManager.allowRTL(shouldAllow);
  },

  forceRTL: (shouldForce: boolean) => {
    NativeI18nManager.forceRTL(shouldForce);
  },

  swapLeftAndRightInRTL: (flipStyles: boolean) => {
    NativeI18nManager.swapLeftAndRightInRTL(flipStyles);
  },

  isRTL: NativeI18nManager.getConstants().isRTL,
  doLeftAndRightSwapInRTL: NativeI18nManager.getConstants()
    .doLeftAndRightSwapInRTL,
};
