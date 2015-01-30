/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule errorToString
 */
'use strict';

var Platform = require('Platform');

var stacktraceParser = require('stacktrace-parser');

function stackFrameToString(stackFrame) {
  var fileNameParts = stackFrame.file.split('/');
  var fileName = fileNameParts[fileNameParts.length - 1];

  return stackFrame.methodName + '\n  in ' + fileName + ':' + stackFrame.lineNumber + '\n';
}

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

function errorToString(e, sourceMapInstance) {
  var stack = stacktraceParser.parse(e.stack);

  var framesToPop = e.framesToPop || 0;
  while (framesToPop--) {
    stack.shift();
  }

  if (sourceMapInstance) {
    stack.forEach(resolveSourceMaps.bind(null, sourceMapInstance));
  }

  // HACK(frantic) Android currently expects stack trace to be a string #5920439
  if (Platform.OS === 'android') {
    return stack.map(stackFrameToString).join('\n');
  } else {
    return stack;
  }
}

module.exports = errorToString;
