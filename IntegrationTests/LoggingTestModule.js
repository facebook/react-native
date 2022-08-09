/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const invariant = require('invariant');

const LoggingTestModule = {
  logToConsole: function (str) {
    console.log(str);
  },
  logToConsoleAfterWait: function (str, timeout_ms) {
    setTimeout(function () {
      console.log(str);
    }, timeout_ms);
  },
  warning: function (str) {
    console.warn(str);
  },
  invariant: function (str) {
    invariant(false, str);
  },
  logErrorToConsole: function (str) {
    console.error(str);
  },
  throwError: function (str) {
    throw new Error(str);
  },
};

BatchedBridge.registerCallableModule('LoggingTestModule', LoggingTestModule);

module.exports = LoggingTestModule;
