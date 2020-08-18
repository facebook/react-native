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
import * as LogBoxData from '../LogBox/Data/LogBoxData';
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
function reportException(e: ExtendedError, isFatal: boolean) {
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
    const isFromConsoleError = e.name === 'console.error';

    if (!message.startsWith(namePrefix)) {
      message = namePrefix + message;
    }

    // Errors created by `console.error` have already been printed.
    if (!isFromConsoleError) {
      if (console._errorOriginal) {
        console._errorOriginal(message);
      } else {
        console.error(message);
      }
    }

    message =
      e.jsEngine == null ? message : `${message}, js engine: ${e.jsEngine}`;

    const isHandledByLogBox =
      e.forceRedbox !== true && global.__unstable_isLogBoxEnabled === true;

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

    if (isHandledByLogBox) {
      LogBoxData.addException({
        ...data,
        isComponentError: !!e.isComponentError,
      });
    }

    NativeExceptionsManager.reportException(data);

    if (__DEV__) {
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
  }
}

declare var console: typeof console & {
  _errorOriginal: typeof console.error,
  reportErrorsAsExceptions: boolean,
  ...
};

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
  reportException(error, isFatal);
}

function reactConsoleErrorHandler() {
  if (!console.reportErrorsAsExceptions) {
    console._errorOriginal.apply(console, arguments);
    return;
  }

  if (arguments[0] && arguments[0].stack) {
    // reportException will console.error this with high enough fidelity.
    reportException(arguments[0], /* isFatal */ false);
  } else {
    console._errorOriginal.apply(console, arguments);
    const stringifySafe = require('../Utilities/stringifySafe');
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

module.exports = {
  handleException,
  installConsoleErrorReporter,
  SyntheticError,
  unstable_setExceptionDecorator,
};
