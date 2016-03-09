/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RCTLog
 * @flow
 */
'use strict';

var BatchedBridge = require('BatchedBridge');

var invariant = require('fbjs/lib/invariant');

var levelsMap = {
  log: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

class RCTLog {
  // level one of log, info, warn, error, mustfix
  static logIfNoNativeHook() {
    var args = Array.prototype.slice.call(arguments);
    var level = args.shift();
    var logFn = levelsMap[level];
    invariant(
      logFn,
      'Level "' + level + '" not one of ' + Object.keys(levelsMap)
    );
    if (typeof global.nativeLoggingHook === 'undefined') {
      // We already printed in xcode, so only log here if using a js debugger
      console[logFn].apply(console, args);
    }
    return true;
  }
}

BatchedBridge.registerCallableModule(
  'RCTLog',
  RCTLog
);

module.exports = RCTLog;
