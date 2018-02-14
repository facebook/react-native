/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DeviceInfo
 * @flow
 */
'use strict';

const DeviceInfo = require('NativeModules').DeviceInfo;

const invariant = require('fbjs/lib/invariant');

invariant(DeviceInfo, 'DeviceInfo native module is not installed correctly');

module.exports = DeviceInfo;
