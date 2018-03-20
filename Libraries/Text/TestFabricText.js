/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule TestFabricText
 * @flow
 * @format
 */
'use strict';

/**
 * This is a switch on the correct Text to use for Fabric testing purposes
 */
let TestFabricText;
const FabricTestModule = require('NativeModules').FabricTestModule;
if (FabricTestModule && FabricTestModule.IS_FABRIC_ENABLED) {
  TestFabricText = require('FabricText');
} else {
  TestFabricText = require('Text');
}

module.exports = TestFabricText;
