/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LoggingTestModule
 */
'use strict';

var BatchedBridge = require('BatchedBridge');

var warning = require('fbjs/lib/warning');
var invariant = require('fbjs/lib/invariant');

var LoggingTestModule = {
  logToConsole: function(str) {
    console.log(str);
  },
  logToConsoleAfterWait: function(str,timeout_ms) {
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
  }
};

BatchedBridge.registerCallableModule(
  'LoggingTestModule',
  LoggingTestModule
);

module.exports = LoggingTestModule;
