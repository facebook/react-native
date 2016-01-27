/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule parseErrorStack
 */
'use strict';

var stacktraceParser = require('stacktrace-parser');

function resolveSourceMaps(sourceMapInstance, stackFrame) {
  try {
    var orig = sourceMapInstance.originalPositionFor({
      line: stackFrame.lineNumber,
      column: stackFrame.column,
    });
    if (orig) {
      // remove query string if any
      const queryStringStartIndex = orig.source.indexOf('?');
      stackFrame.file = queryStringStartIndex === -1
        ? orig.source
        : orig.source.substring(0, queryStringStartIndex);
      stackFrame.lineNumber = orig.line;
      stackFrame.column = orig.column;
    }
  } catch (innerEx) {
  }
}

function parseErrorStack(e, sourceMaps) {
  if (!e || !e.stack) {
    return [];
  }

  var stack = Array.isArray(e.stack) ? e.stack : stacktraceParser.parse(e.stack);

  var framesToPop = e.framesToPop || 0;
  while (framesToPop--) {
    stack.shift();
  }

  if (sourceMaps) {
    sourceMaps.forEach((sourceMap, index) => {
      stack.forEach(frame => {
        if (frame.file.indexOf(sourceMap.file) !== -1 ||
            frame.file.replace('.map', '.bundle').indexOf(
              sourceMap.file
            ) !== -1) {
          resolveSourceMaps(sourceMap, frame);
        }
      });
    });
  }

  return stack;
}

module.exports = parseErrorStack;
