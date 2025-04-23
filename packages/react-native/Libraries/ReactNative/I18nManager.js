/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {I18nManagerConstants} from './NativeI18nManager';

import NativeI18nManager from './NativeI18nManager';

const i18nConstants: I18nManagerConstants = getI18nManagerConstants();

function getI18nManagerConstants(): I18nManagerConstants {
  if (NativeI18nManager) {
    const {isRTL, doLeftAndRightSwapInRTL, localeIdentifier} =
      NativeI18nManager.getConstants();
    return {isRTL, doLeftAndRightSwapInRTL, localeIdentifier};
  }

  return {
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
  };
}

export default {
  getConstants: (): I18nManagerConstants => {
    return i18nConstants;
  },

  allowRTL: (shouldAllow: boolean) => {
    if (!NativeI18nManager) {
      return;
    }

    NativeI18nManager.allowRTL(shouldAllow);
  },

  forceRTL: (shouldForce: boolean) => {
    if (!NativeI18nManager) {
      return;
    }

    NativeI18nManager.forceRTL(shouldForce);
  },

  swapLeftAndRightInRTL: (flipStyles: boolean) => {
    if (!NativeI18nManager) {
      return;
    }

    NativeI18nManager.swapLeftAndRightInRTL(flipStyles);
  },

  isRTL: i18nConstants.isRTL as I18nManagerConstants['isRTL'],
  doLeftAndRightSwapInRTL:
    i18nConstants.doLeftAndRightSwapInRTL as I18nManagerConstants['doLeftAndRightSwapInRTL'],
};
