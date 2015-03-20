/**
 * Copyright 2004-present Facebook. All Rights Reserved.
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
