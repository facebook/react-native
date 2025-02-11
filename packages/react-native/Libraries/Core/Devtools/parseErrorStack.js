/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {StackFrame} from '../NativeExceptionsManager';
import type {HermesParsedStack} from './parseHermesStack';

const parseHermesStack = require('./parseHermesStack').default;

function convertHermesStack(stack: HermesParsedStack): Array<StackFrame> {
  const frames: Array<StackFrame> = [];
  for (const entry of stack.entries) {
    if (entry.type !== 'FRAME') {
      continue;
    }
    const {location, functionName} = entry;
    if (location.type === 'NATIVE' || location.type === 'INTERNAL_BYTECODE') {
      continue;
    }
    frames.push({
      methodName: functionName,
      file: location.sourceUrl,
      lineNumber: location.line1Based,
      column:
        location.type === 'SOURCE'
          ? location.column1Based - 1
          : location.virtualOffset0Based,
    });
  }
  return frames;
}

export default function parseErrorStack(
  errorStack?: string,
): Array<StackFrame> {
  if (errorStack == null) {
    return [];
  }

  const stacktraceParser = require('stacktrace-parser');
  const parsedStack = Array.isArray(errorStack)
    ? errorStack
    : global.HermesInternal
      ? convertHermesStack(parseHermesStack(errorStack))
      : stacktraceParser.parse(errorStack).map((frame): StackFrame => ({
          ...frame,
          column: frame.column != null ? frame.column - 1 : null,
        }));

  return parsedStack;
}
