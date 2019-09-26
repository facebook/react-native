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

const NativeModules = require('../BatchedBridge/NativeModules');

export type PlatformSelectSpec<D, I> = {
  default?: D,
  ios?: I,
};

const Platform = {
  OS: 'ios',
  get Version() {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.osVersion;
  },
  get isPad() {
    const constants = NativeModules.PlatformConstants;
    return constants ? constants.interfaceIdiom === 'pad' : false;
  },
  /**
   * Deprecated, use `isTV` instead.
   */
  get isTVOS() {
    return Platform.isTV;
  },
  get isTV() {
    const constants = NativeModules.PlatformConstants;
    return constants ? constants.interfaceIdiom === 'tv' : false;
  },
  get isTesting(): boolean {
    if (__DEV__) {
      const constants = NativeModules.PlatformConstants;
      return constants && constants.isTesting;
    }
    return false;
  },
  select: <D, I>(spec: PlatformSelectSpec<D, I>): D | I =>
    'ios' in spec ? spec.ios : spec.default,
};

module.exports = Platform;
