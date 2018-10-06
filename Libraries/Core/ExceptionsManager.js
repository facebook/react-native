/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {ExtendedError} from 'parseErrorStack';

/**
 * Handles the developer-visible aspect of errors and exceptions
 */
let exceptionID = 0;
function reportException(e: ExtendedError, isFatal: boolean) {
  const {ExceptionsManager} = require('NativeModules');
  if (ExceptionsManager) {
    const parseErrorStack = require('parseErrorStack');
    const stack = parseErrorStack(e);
    const currentExceptionID = ++exceptionID;
    const message =
      e.jsEngine == null ? e.message : `${e.message}, js engine: ${e.jsEngine}`;
    if (isFatal) {
      ExceptionsManager.reportFatalException(
        message,
        stack,
        currentExceptionID,
      );
    } else {
      ExceptionsManager.reportSoftException(message, stack, currentExceptionID);
    }
    if (__DEV__) {
      const symbolicateStackTrace = require('symbolicateStackTrace');
      symbolicateStackTrace(stack)
        .then(prettyStack => {
          if (prettyStack) {
            ExceptionsManager.updateExceptionMessage(
              e.message,
              prettyStack,
              currentExceptionID,
            );
          } else {
            throw new Error('The stack is null');
          }
        })
        .catch(error =>
          console.warn('Unable to symbolicate stack trace: ' + error.message),
        );
    }
  }
}

declare var console: typeof console & {
  _errorOriginal: Function,
  reportErrorsAsExceptions: boolean,
};

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
  if (console._errorOriginal) {
    console._errorOriginal(e.message);
  } else {
    console.error(e.message);
  }
  reportException(e, isFatal);
}

function reactConsoleErrorHandler() {
  console._errorOriginal.apply(console, arguments);
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
    const error: ExtendedError = new Error('console.error: ' + str);
    error.framesToPop = 1;
    reportException(error, /* isFatal */ false);
  }
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
  // Flow doesn't like it when you set arbitrary values on a global object
  console._errorOriginal = console.error.bind(console);
  console.error = reactConsoleErrorHandler;
  if (console.reportErrorsAsExceptions === undefined) {
    // Individual apps can disable this
    // Flow doesn't like it when you set arbitrary values on a global object
    console.reportErrorsAsExceptions = true;
  }
}

module.exports = {handleException, installConsoleErrorReporter};
