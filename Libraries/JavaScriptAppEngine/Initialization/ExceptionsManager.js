/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ExceptionsManager
 * @flow
 */
'use strict';

let exceptionID = 0;

/**
 * Handles the developer-visible aspect of errors and exceptions
 */
function reportException(e: Error, isFatal: bool) {
  const parseErrorStack = require('parseErrorStack');
  const symbolicateStackTrace = require('symbolicateStackTrace');
  const RCTExceptionsManager = require('NativeModules').ExceptionsManager;

  const currentExceptionID = ++exceptionID;
  if (RCTExceptionsManager) {
    const stack = parseErrorStack(e);
    if (isFatal) {
      RCTExceptionsManager.reportFatalException(e.message, stack, currentExceptionID);
    } else {
      RCTExceptionsManager.reportSoftException(e.message, stack, currentExceptionID);
    }
    if (__DEV__) {
      symbolicateStackTrace(stack).then(
        (prettyStack) =>
          RCTExceptionsManager.updateExceptionMessage(e.message, prettyStack, currentExceptionID),
        (error) =>
          console.warn('Unable to symbolicate stack trace: ' + error.message)
      );
    }
  }
}

/**
 * Logs exceptions to the (native) console and displays them
 */
function handleException(e: Error, isFatal: boolean) {
  // Workaround for reporting errors caused by `throw 'some string'`
  // Unfortunately there is no way to figure out the stacktrace in this
  // case, so if you ended up here trying to trace an error, look for
  // `throw '<error message>'` somewhere in your codebase.
  if (!e.message) {
    e = new Error(e);
  }

  (console._errorOriginal || console.error)(e.message);
  reportException(e, isFatal);
}

/**
 * Shows a redbox with stacktrace for all console.error messages.  Disable by
 * setting `console.reportErrorsAsExceptions = false;` in your app.
 */
function installConsoleErrorReporter() {
  // Enable reportErrorsAsExceptions
  if (console._errorOriginal) {
    return; // already installed
  }
  console._errorOriginal = console.error.bind(console);
  console.error = function reactConsoleError() {
    console._errorOriginal.apply(null, arguments);
    if (!console.reportErrorsAsExceptions) {
      return;
    }

    if (arguments[0] && arguments[0].stack) {
      reportException(arguments[0], /* isFatal */ false);
    } else {
      const stringifySafe = require('stringifySafe');
      const str = Array.prototype.map.call(arguments, stringifySafe).join(', ');
      if (str.slice(0, 10) === '"Warning: ') {
        // React warnings use console.error so that a stack trace is shown, but
        // we don't (currently) want these to show a redbox
        // (Note: Logic duplicated in polyfills/console.js.)
        return;
      }
      const error : any = new Error('console.error: ' + str);
      error.framesToPop = 1;
      reportException(error, /* isFatal */ false);
    }
  };
  if (console.reportErrorsAsExceptions === undefined) {
    console.reportErrorsAsExceptions = true; // Individual apps can disable this
  }
}

module.exports = { handleException, installConsoleErrorReporter };
