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

const NativeModules = require('NativeModules');

const Platform = {
  OS: 'android',
  get Version() {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.Version;
  },
  get isTesting(): boolean {
    if (__DEV__) {
      const constants = NativeModules.PlatformConstants;
      return constants && constants.isTesting;
    }
    return false;
  },
  get isTV(): boolean {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.uiMode === 'tv';
  },
  select: (obj: Object) => ('android' in obj ? obj.android : obj.default),
};

module.exports = Platform;
