/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ExtendedError} from './Devtools/parseErrorStack';
import type {ExceptionData} from './NativeExceptionsManager';

class SyntheticError extends Error {
  name: string = '';
}

type ExceptionDecorator = ExceptionData => ExceptionData;

let userExceptionDecorator: ?ExceptionDecorator;
let inUserExceptionDecorator = false;

/**
 * Allows the app to add information to the exception report before it is sent
 * to native. This API is not final.
 */

function unstable_setExceptionDecorator(
  exceptionDecorator: ?ExceptionDecorator,
) {
  userExceptionDecorator = exceptionDecorator;
}

function preprocessException(data: ExceptionData): ExceptionData {
  if (userExceptionDecorator && !inUserExceptionDecorator) {
    inUserExceptionDecorator = true;
    try {
      return userExceptionDecorator(data);
    } catch {
      // Fall through
    } finally {
      inUserExceptionDecorator = false;
    }
  }
  return data;
}

/**
 * Handles the developer-visible aspect of errors and exceptions
 */
let exceptionID = 0;
function reportException(
  e: ExtendedError,
  isFatal: boolean,
  reportToConsole: boolean, // only true when coming from handleException; the error has not yet been logged
) {
  const NativeExceptionsManager = require('./NativeExceptionsManager').default;
  if (NativeExceptionsManager) {
    const parseErrorStack = require('./Devtools/parseErrorStack');
    const stack = parseErrorStack(e);
    const currentExceptionID = ++exceptionID;
    const originalMessage = e.message || '';
    let message = originalMessage;
    if (e.componentStack != null) {
      message += `\n\nThis error is located at:${e.componentStack}`;
    }
    const namePrefix = e.name == null || e.name === '' ? '' : `${e.name}: `;

    if (!message.startsWith(namePrefix)) {
      message = namePrefix + message;
    }

    message =
      e.jsEngine == null ? message : `${message}, js engine: ${e.jsEngine}`;

    const isHandledByLogBox =
      e.forceRedbox !== true && !global.RN$Bridgeless && !global.RN$Express;

    const data = preprocessException({
      message,
      originalMessage: message === originalMessage ? null : originalMessage,
      name: e.name == null || e.name === '' ? null : e.name,
      componentStack:
        typeof e.componentStack === 'string' ? e.componentStack : null,
      stack,
      id: currentExceptionID,
      isFatal,
      extraData: {
        jsEngine: e.jsEngine,
        rawStack: e.stack,

        // Hack to hide native redboxes when in the LogBox experiment.
        // This is intentionally untyped and stuffed here, because it is temporary.
        suppressRedBox: isHandledByLogBox,
      },
    });

    if (reportToConsole) {
      // we feed back into console.error, to make sure any methods that are
      // monkey patched on top of console.error are called when coming from
      // handleException
      console.error(data.message);
    }

    if (__DEV__ && isHandledByLogBox) {
      const LogBoxData = require('../LogBox/Data/LogBoxData');
      LogBoxData.addException({
        ...data,
        isComponentError: !!e.isComponentError,
      });
    }

    NativeExceptionsManager.reportException(data);

    if (__DEV__ && !global.RN$Express) {
      if (e.preventSymbolication === true) {
        return;
      }
      const symbolicateStackTrace = require('./Devtools/symbolicateStackTrace');
      symbolicateStackTrace(stack)
        .then(({stack: prettyStack}) => {
          if (prettyStack) {
            NativeExceptionsManager.updateExceptionMessage(
              data.message,
              prettyStack,
              currentExceptionID,
            );
          } else {
            throw new Error('The stack is null');
          }
        })
        .catch(error => {
          console.log('Unable to symbolicate stack trace: ' + error.message);
        });
    }
  } else if (reportToConsole) {
    // we feed back into console.error, to make sure any methods that are
    // monkey patched on top of console.error are called when coming from
    // handleException
    console.error(e);
  }
}

declare var console: typeof console & {
  _errorOriginal: typeof console.error,
  reportErrorsAsExceptions: boolean,
  ...
};

// If we trigger console.error _from_ handleException,
// we do want to make sure that console.error doesn't trigger error reporting again
let inExceptionHandler = false;

/**
 * Logs exceptions to the (native) console and displays them
 */
function handleException(e: mixed, isFatal: boolean) {
  let error: Error;
  if (e instanceof Error) {
    error = e;
  } else {
    // Workaround for reporting errors caused by `throw 'some string'`
    // Unfortunately there is no way to figure out the stacktrace in this
    // case, so if you ended up here trying to trace an error, look for
    // `throw '<error message>'` somewhere in your codebase.
    error = new SyntheticError(e);
  }
  try {
    inExceptionHandler = true;
    reportException(error, isFatal, /*reportToConsole*/ true);
  } finally {
    inExceptionHandler = false;
  }
}

function reactConsoleErrorHandler() {
  // bubble up to any original handlers
  console._errorOriginal.apply(console, arguments);
  if (!console.reportErrorsAsExceptions) {
    return;
  }
  if (inExceptionHandler) {
    // The fundamental trick here is that are multiple entry point to logging errors:
    // (see D19743075 for more background)
    //
    // 1. An uncaught exception being caught by the global handler
    // 2. An error being logged throw console.error
    //
    // However, console.error is monkey patched multiple times: by this module, and by the
    // DevTools setup that sends messages to Metro.
    // The patching order cannot be relied upon.
    //
    // So, some scenarios that are handled by this flag:
    //
    // Logging an error:
    // 1. console.error called from user code
    // 2. (possibly) arrives _first_ at DevTool handler, send to Metro
    // 3. Bubbles to here
    // 4. goes into report Exception.
    // 5. should not trigger console.error again, to avoid looping / logging twice
    // 6. should still bubble up to original console
    //    (which might either be console.log, or the DevTools handler in case it patched _earlier_ and (2) didn't happen)
    //
    // Throwing an uncaught exception:
    // 1. exception thrown
    // 2. picked up by handleException
    // 3. should be send to console.error (not console._errorOriginal, as DevTools might have patched _later_ and it needs to send it to Metro)
    // 4. that _might_ bubble again to the `reactConsoleErrorHandle` defined here
    //    -> should not handle exception _again_, to avoid looping / showing twice (this code branch)
    // 5. should still bubble up to original console (which might either be console.log, or the DevTools handler in case that one patched _earlier_)
    return;
  }

  if (arguments[0] && arguments[0].stack) {
    // reportException will console.error this with high enough fidelity.
    reportException(
      arguments[0],
      /* isFatal */ false,
      /*reportToConsole*/ false,
    );
  } else {
    const stringifySafe = require('../Utilities/stringifySafe').default;
    const str = Array.prototype.map
      .call(arguments, value =>
        typeof value === 'string' ? value : stringifySafe(value),
      )
      .join(' ');

    if (str.slice(0, 9) === 'Warning: ') {
      // React warnings use console.error so that a stack trace is shown, but
      // we don't (currently) want these to show a redbox
      // (Note: Logic duplicated in polyfills/console.js.)
      return;
    }
    const error: ExtendedError = new SyntheticError(str);
    error.name = 'console.error';
    reportException(error, /* isFatal */ false, /*reportToConsole*/ false);
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

module.exports = {
  handleException,
  installConsoleErrorReporter,
  SyntheticError,
  unstable_setExceptionDecorator,
};
