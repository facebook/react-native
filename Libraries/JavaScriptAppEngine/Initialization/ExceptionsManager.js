/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ExceptionsManager
 */
'use strict';

var Platform = require('Platform');
var RCTExceptionsManager = require('NativeModules').ExceptionsManager;

var loadSourceMap = require('loadSourceMap');
var parseErrorStack = require('parseErrorStack');

var sourceMapPromise;

function handleException(e) {
  var stack = parseErrorStack(e);
  console.error(
    'Error: ' +
    '\n stack: \n' + stackToString(stack) +
    '\n URL: ' + e.sourceURL +
    '\n line: ' + e.line +
    '\n message: ' + e.message
  );

  if (RCTExceptionsManager) {
    RCTExceptionsManager.reportUnhandledException(e.message, format(stack));
    if (__DEV__) {
      (sourceMapPromise = sourceMapPromise || loadSourceMap())
        .then(map => {
          var prettyStack = parseErrorStack(e, map);
          RCTExceptionsManager.updateExceptionMessage(e.message, format(prettyStack));
        })
        .then(null, error => {
          console.error('#CLOWNTOWN (error while displaying error): ' + error.message);
        });
    }
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

// HACK(frantic) Android currently expects stack trace to be a string #5920439
function format(stack) {
  if (Platform.OS === 'android') {
    return stackToString(stack);
  } else {
    return stack;
  }
}

module.exports = { handleException };
