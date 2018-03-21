/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule TestFabricView
 * @flow
 * @format
 */
'use strict';

/**
 * This is a switch on the correct View to use for Fabric testing purposes
 */
let TestFabricView;
const FabricTestModule = require('NativeModules').FabricTestModule;
if (FabricTestModule && FabricTestModule.IS_FABRIC_ENABLED) {
  TestFabricView = require('FabricView');
} else {
  TestFabricView = require('View');
}

module.exports = TestFabricView;
