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

const Platform = {
  OS: 'android',
  get Version() {
    const AndroidConstants = require('NativeModules').AndroidConstants;
    return AndroidConstants && AndroidConstants.Version;
  },
  get isTesting(): boolean {
    const constants = require('NativeModules').AndroidConstants;
    return constants && constants.isTesting;
  },
  select: (obj: Object) => obj.android,
};

module.exports = Platform;
