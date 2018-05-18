/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('BatchedBridge');

const warning = require('fbjs/lib/warning');
const invariant = require('fbjs/lib/invariant');

const LoggingTestModule = {
  logToConsole: function(str) {
    console.log(str);
  },
  logToConsoleAfterWait: function(str, timeout_ms) {
    setTimeout(function() {
      console.log(str);
    }, timeout_ms);
  },
  warning: function(str) {
    warning(false, str);
  },
  invariant: function(str) {
    invariant(false, str);
  },
  logErrorToConsole: function(str) {
    console.error(str);
  },
  throwError: function(str) {
    throw new Error(str);
  },
};

BatchedBridge.registerCallableModule('LoggingTestModule', LoggingTestModule);

module.exports = LoggingTestModule;
