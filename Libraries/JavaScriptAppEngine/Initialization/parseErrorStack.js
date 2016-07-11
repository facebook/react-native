/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule parseErrorStack
 * @flow
 */
'use strict';

export type StackFrame = {
  file: string;
  lineNumber: number;
  column: number;
};

var stacktraceParser = require('stacktrace-parser');

function parseErrorStack(e: Error): Array<StackFrame> {
  if (!e || !e.stack) {
    return [];
  }

  var stack = Array.isArray(e.stack) ? e.stack : stacktraceParser.parse(e.stack);

  var framesToPop = e.framesToPop || 0;
  while (framesToPop--) {
    stack.shift();
  }

  return stack;
}

module.exports = parseErrorStack;
