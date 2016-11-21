/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require.requireActual('../packager/react-packager/src/Resolver/polyfills/babelHelpers.js');
require.requireActual('../packager/react-packager/src/Resolver/polyfills/Object.es7.js');

global.__DEV__ = true;
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

global.Promise = require('promise');
global.regeneratorRuntime = require.requireActual('regenerator-runtime/runtime');

jest
  .mock('ensureComponentIsNative')
  .mock('Image')
  .mock('npmlog')
  .mock('NativeModules')
  .mock('Text')
  .mock('View');

const mockEmptyObject = {};
jest.mock('ReactNativePropRegistry', () => ({
  register: id => id,
  getByID: () => mockEmptyObject,
}));

jest.setMock('ErrorUtils', require('ErrorUtils'));
