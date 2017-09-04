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

let warningHandler: ?(Array<any> => void) = null;

const RCTLog = {
  // level one of log, info, warn, error, mustfix
  logIfNoNativeHook(level: string, ...args: Array<any>): void {
    // We already printed in the native console, so only log here if using a js debugger
    if (typeof global.nativeLoggingHook === 'undefined') {
      RCTLog.logToConsole(level, ...args);
    } else {
      // Report native warnings to YellowBox
      if (warningHandler && level === 'warn') {
        warningHandler(...args);
      }
    }
  },

  // Log to console regardless of nativeLoggingHook
  logToConsole(level: string, ...args: Array<any>): void {
    const logFn = levelsMap[level];
    invariant(
      logFn,
      'Level "' + level + '" not one of ' + Object.keys(levelsMap).toString()
    );

    console[logFn](...args);
  },

  setWarningHandler(handler: typeof warningHandler): void {
    warningHandler = handler;
  }
}

module.exports = RCTLog;
