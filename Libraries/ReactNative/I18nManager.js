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

type I18nManagerStatus = {
  isRTL: boolean,
  doLeftAndRightSwapInRTL: boolean,
  allowRTL: (allowRTL: boolean) => {},
  forceRTL: (forceRTL: boolean) => {},
  swapLeftAndRightInRTL: (flipStyles: boolean) => {},
};

const I18nManager: I18nManagerStatus = require('NativeModules').I18nManager || {
  isRTL: false,
  doLeftAndRightSwapInRTL: true,
  allowRTL: () => {},
  forceRTL: () => {},
  swapLeftAndRightInRTL: () => {},
};

module.exports = I18nManager;
