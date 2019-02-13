/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const DeviceInfo = require('NativeModules').DeviceInfo;

const invariant = require('invariant');

invariant(DeviceInfo, 'DeviceInfo native module is not installed correctly');

module.exports = DeviceInfo;
