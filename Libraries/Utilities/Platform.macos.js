/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Platform
 * @flow
 */

// TODO(macOS ISS#2323203) Copied from Platform.ios.js

'use strict';

const NativeModules = require('NativeModules');

const Platform = {
  OS: 'macos',
  get Version() {
    const constants = NativeModules.MacOSConstants;
    return constants && constants.osVersion;
  },
  get isTesting(): boolean {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.isTesting;
  },
  select: (obj: Object) => 'macos' in obj ? obj.macos : obj.default,
};

module.exports = Platform;
