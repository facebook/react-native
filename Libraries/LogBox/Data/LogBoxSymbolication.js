/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import symbolicateStackTrace from '../../Core/Devtools/symbolicateStackTrace';

import type {StackFrame} from '../../Core/NativeExceptionsManager';

export type Stack = Array<StackFrame>;

const cache: Map<Stack, Promise<Stack>> = new Map();

/**
 * Sanitize because sometimes, `symbolicateStackTrace` gives us invalid values.
 */
const sanitize = (maybeStack: mixed): Stack => {
  if (!Array.isArray(maybeStack)) {
    throw new Error('Expected stack to be an array.');
  }
  const stack = [];
  for (const maybeFrame of maybeStack) {
    if (typeof maybeFrame !== 'object' || maybeFrame == null) {
      throw new Error('Expected each stack frame to be an object.');
    }
    if (typeof maybeFrame.column !== 'number' && maybeFrame.column != null) {
      throw new Error('Expected stack frame `column` to be a nullable number.');
    }
    if (typeof maybeFrame.file !== 'string') {
      throw new Error('Expected stack frame `file` to be a string.');
    }
    if (typeof maybeFrame.lineNumber !== 'number') {
      throw new Error('Expected stack frame `lineNumber` to be a number.');
    }
    if (typeof maybeFrame.methodName !== 'string') {
      throw new Error('Expected stack frame `methodName` to be a string.');
    }

    let collapse = false;
    if ('collapse' in maybeFrame) {
      if (typeof maybeFrame.collapse !== 'boolean') {
        throw new Error('Expected stack frame `collapse` to be a boolean.');
      }
      collapse = maybeFrame.collapse;
    }
    stack.push({
      column: maybeFrame.column,
      file: maybeFrame.file,
      lineNumber: maybeFrame.lineNumber,
      methodName: maybeFrame.methodName,
      collapse,
    });
  }
  return stack;
};

export function deleteStack(stack: Stack): void {
  cache.delete(stack);
}

export function symbolicate(stack: Stack): Promise<Stack> {
  let promise = cache.get(stack);
  if (promise == null) {
    promise = symbolicateStackTrace(stack).then(sanitize);
    cache.set(stack, promise);
  }

  return promise;
}
