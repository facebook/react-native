/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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

BatchedBridge.registerCallableModule('TestJSLocaleModule', TestJSLocaleModule);

module.exports = TestJSLocaleModule;
