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

var RCTExceptionsManager = require('NativeModules').ExceptionsManager;

var loadSourceMap = require('loadSourceMap');
var parseErrorStack = require('parseErrorStack');
var stringifySafe = require('stringifySafe');

var sourceMapPromise;

type Exception = {
  sourceURL: string;
  line: number;
  message: string;
}

function reportException(e: Exception, isFatal: bool, stack?: any) {
  if (RCTExceptionsManager) {
    if (!stack) {
      stack = parseErrorStack(e);
    }
    if (isFatal) {
      RCTExceptionsManager.reportFatalException(e.message, stack);
    } else {
      RCTExceptionsManager.reportSoftException(e.message, stack);
    }
    if (__DEV__) {
      (sourceMapPromise = sourceMapPromise || loadSourceMap())
        .then(map => {
          var prettyStack = parseErrorStack(e, map);
          RCTExceptionsManager.updateExceptionMessage(e.message, prettyStack);
        })
        .catch(error => {
          // This can happen in a variety of normal situations, such as
          // Network module not being available, or when running locally
          console.warn('Unable to load source map: ' + error.message);
        });
    }
  }
}

function handleException(e: Exception, isFatal: boolean) {
  var stack = parseErrorStack(e);
  var msg =
    'Error: ' + e.message +
    '\n stack: \n' + stackToString(stack) +
    '\n URL: ' + e.sourceURL +
    '\n line: ' + e.line +
    '\n message: ' + e.message;
  if (console.errorOriginal) {
    console.errorOriginal(msg);
  } else {
    console.error(msg);
  }
  reportException(e, isFatal, stack);
}

/**
 * Shows a redbox with stacktrace for all console.error messages.  Disable by
 * setting `console.reportErrorsAsExceptions = false;` in your app.
 */
function installConsoleErrorReporter() {
  if (console.reportException) {
    return; // already installed
  }
  console.reportException = reportException;
  console.errorOriginal = console.error.bind(console);
  console.error = function reactConsoleError() {
    console.errorOriginal.apply(null, arguments);
    if (!console.reportErrorsAsExceptions) {
      return;
    }
    var str = Array.prototype.map.call(arguments, stringifySafe).join(', ');
    var error: any = new Error('console.error: ' + str);
    error.framesToPop = 1;
    reportException(error, /* isFatal */ false);
  };
  if (console.reportErrorsAsExceptions === undefined) {
    console.reportErrorsAsExceptions = true; // Individual apps can disable this
  }
}

function stackToString(stack) {
  var maxLength = Math.max.apply(null, stack.map(frame => frame.methodName.length));
  return stack.map(frame => stackFrameToString(frame, maxLength)).join('\n');
}

function stackFrameToString(stackFrame, maxLength) {
  var fileNameParts = stackFrame.file.split('/');
  var fileName = fileNameParts[fileNameParts.length - 1];

  if (fileName.length > 18) {
    fileName = fileName.substr(0, 17) + '\u2026' /* ... */;
  }

  var spaces = fillSpaces(maxLength - stackFrame.methodName.length);
  return '  ' + stackFrame.methodName + spaces + '  ' + fileName + ':' + stackFrame.lineNumber;
}

function fillSpaces(n) {
  return new Array(n + 1).join(' ');
}

module.exports = { handleException, installConsoleErrorReporter };
