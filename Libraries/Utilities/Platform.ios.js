/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Platform
 * @flow
 */

'use strict';

const NativeModules = require('../BatchedBridge/NativeModules');

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
  get isTVOS() {
    const constants = NativeModules.PlatformConstants;
    return constants ? constants.interfaceIdiom === 'tv' : false;
  },
  get isTesting(): boolean {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.isTesting;
  },
  select: (obj: Object) => 'ios' in obj ? obj.ios : obj.default,
};

module.exports = Platform;
