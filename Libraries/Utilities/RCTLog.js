/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule RCTLog
 */
 /* globals nativeLoggingHook */
'use strict';

var invariant = require('invariant');

var levelsMap = {
  log: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
  mustfix: 'error',
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
    if (typeof nativeLoggingHook === 'undefined') {
      // We already printed in xcode, so only log here if using a js debugger
      console[logFn].apply(console, args);
    }
    return true;
  }
}

module.exports = RCTLog;
