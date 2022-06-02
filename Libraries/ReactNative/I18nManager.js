/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeI18nManager from './NativeI18nManager';

const initialI18nConstants: {|
  doLeftAndRightSwapInRTL: boolean,
  isRTL: boolean,
  localeIdentifier?: ?string,
|} = getI18nManagerConstants();

function getI18nManagerConstants(): {|
  doLeftAndRightSwapInRTL: boolean,
  isRTL: boolean,
  localeIdentifier: ?string,
|} {
  if (NativeI18nManager) {
    const {isRTL, doLeftAndRightSwapInRTL, localeIdentifier} =
      NativeI18nManager.getConstants();
    return {isRTL, doLeftAndRightSwapInRTL, localeIdentifier};
  }

  return {
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
    localeIdentifier: undefined,
  };
}

module.exports = {
  getConstants: (): {|
    doLeftAndRightSwapInRTL: boolean,
    isRTL: boolean,
    localeIdentifier: ?string,
  |} => {
    return getI18nManagerConstants();
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

  isRTL: initialI18nConstants.isRTL,
  doLeftAndRightSwapInRTL: initialI18nConstants.doLeftAndRightSwapInRTL,
};
