/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TestJSLocaleModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var Recording = require('NativeModules').Recording;

var TestJSLocaleModule = {
  toUpper: function(s) {
    Recording.record(s.toUpperCase());
  },
  toLower: function(s) {
    Recording.record(s.toLowerCase());
  },
};

BatchedBridge.registerCallableModule(
  'TestJSLocaleModule',
  TestJSLocaleModule
);

module.exports = TestJSLocaleModule;
