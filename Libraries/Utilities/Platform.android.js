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
  OS: 'android',
  get Version() {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.Version;
  },
  get isTesting(): boolean {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.isTesting;
  },
  get isTV(): boolean {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.uiMode === 'tv';
  },
  select: (obj: Object) => ('android' in obj ? obj.android : obj.default),
};

module.exports = Platform;
