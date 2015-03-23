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
      stackFrame.file = orig.source;
      stackFrame.lineNumber = orig.line;
      stackFrame.column = orig.column;
    }
  } catch (innerEx) {
  }
}

function parseErrorStack(e, sourceMapInstance) {
  var stack = stacktraceParser.parse(e.stack);

  var framesToPop = e.framesToPop || 0;
  while (framesToPop--) {
    stack.shift();
  }

  if (sourceMapInstance) {
    stack.forEach(resolveSourceMaps.bind(null, sourceMapInstance));
  }

  return stack;
}

module.exports = parseErrorStack;
