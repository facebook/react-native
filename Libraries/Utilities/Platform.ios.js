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
  OS: 'ios',
  get Version() {
    const constants = require('NativeModules').IOSConstants;
    return constants ? constants.osVersion : '';
  },
  get isTVOS() {
    const constants = require('NativeModules').IOSConstants;
    return constants ? (constants.interfaceIdiom === 'tv') : false;
  },
  select: (obj: Object) => obj.ios,
};

module.exports = Platform;
