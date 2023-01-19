/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {NativeModules} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const {Recording} = NativeModules;

const TestJSLocaleModule = {
  toUpper: function (s) {
    Recording.record(s.toUpperCase());
  },
  toLower: function (s) {
    Recording.record(s.toLowerCase());
  },
};

BatchedBridge.registerCallableModule('TestJSLocaleModule', TestJSLocaleModule);

module.exports = TestJSLocaleModule;
