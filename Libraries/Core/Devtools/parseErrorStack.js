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
  column: ?number,
  file: string,
  lineNumber: number,
  methodName: string,
};

export type ExtendedError = Error & {
  framesToPop?: number,
};

function parseErrorStack(e: ExtendedError): Array<StackFrame> {
  if (!e || !e.stack) {
    return [];
  }

  /* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an
   * error found when Flow v0.54 was deployed. To see the error delete this
   * comment and run Flow. */
  const stacktraceParser = require('stacktrace-parser');
  const stack = Array.isArray(e.stack) ? e.stack : stacktraceParser.parse(e.stack);

  let framesToPop = typeof e.framesToPop === 'number' ? e.framesToPop : 0;
  while (framesToPop--) {
    stack.shift();
  }
  return stack;
}

module.exports = parseErrorStack;
