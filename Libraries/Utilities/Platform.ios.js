/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const NativeModules = require('NativeModules');

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
    const constants = NativeModules.PlatformConstants;
    return constants && constants.isTesting;
  },
  select: (obj: Object) => ('ios' in obj ? obj.ios : obj.default),
};

module.exports = Platform;
