/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {StackFrame} from '../NativeExceptionsManager';

export type ExtendedError = Error & {
  jsEngine?: string,
  preventSymbolication?: boolean,
  componentStack?: string,
};

function parseErrorStack(e: ExtendedError): Array<StackFrame> {
  if (!e || !e.stack) {
    return [];
  }

  const stacktraceParser = require('stacktrace-parser');
  const stack = Array.isArray(e.stack)
    ? e.stack
    : stacktraceParser.parse(e.stack);

  return stack;
}

module.exports = parseErrorStack;
