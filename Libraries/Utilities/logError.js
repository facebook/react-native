/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule logError
 */
'use strict';

/**
 * Small utility that can be used as an error handler. You cannot just pass
 * `console.error` as a failure callback - it's not properly bound.  If passes an
 * `Error` object, it will print the message and stack.
 */
var logError = function() {
  if (arguments.length === 1 && arguments[0] instanceof Error) {
    var err = arguments[0];
    console.error('Error: "' + err.message + '".  Stack:\n' + err.stack);
  } else {
    console.error.apply(console, arguments);
  }
};

module.exports = logError;
