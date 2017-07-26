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

const invariant = require('fbjs/lib/invariant');

const levelsMap = {
  log: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

class RCTLog {
  // level one of log, info, warn, error, mustfix
  static logIfNoNativeHook(...args) {
    if (typeof global.nativeLoggingHook === 'undefined') {
      // We already printed in xcode, so only log here if using a js debugger
      RCTLog.logToConsole(...args);
    }

    return true;
  }

  // Log to console regardless of nativeLoggingHook
  static logToConsole(level, ...args) {
    const logFn = levelsMap[level];
    invariant(
      logFn,
      'Level "' + level + '" not one of ' + Object.keys(levelsMap)
    );

    console[logFn](...args);

    return true;
  }
}

module.exports = RCTLog;
