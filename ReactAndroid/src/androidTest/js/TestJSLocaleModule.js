/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('BatchedBridge');
const Recording = require('NativeModules').Recording;

const TestJSLocaleModule = {
  toUpper: function(s) {
    Recording.record(s.toUpperCase());
  },
  toLower: function(s) {
    Recording.record(s.toLowerCase());
  },
};

BatchedBridge.registerCallableModule('TestJSLocaleModule', TestJSLocaleModule);

module.exports = TestJSLocaleModule;
