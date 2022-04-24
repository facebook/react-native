/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import symbolicateStackTrace from '../../Core/Devtools/symbolicateStackTrace';

import type {StackFrame} from '../../Core/NativeExceptionsManager';
import type {SymbolicatedStackTrace} from '../../Core/Devtools/symbolicateStackTrace';

export type Stack = Array<StackFrame>;

const cache: Map<Stack, Promise<SymbolicatedStackTrace>> = new Map();

/**
 * Sanitize because sometimes, `symbolicateStackTrace` gives us invalid values.
 */
const sanitize = ({
  stack: maybeStack,
  codeFrame,
}: SymbolicatedStackTrace): SymbolicatedStackTrace => {
  if (!Array.isArray(maybeStack)) {
    throw new Error('Expected stack to be an array.');
  }
  const stack = [];
  for (const maybeFrame of maybeStack) {
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
  return {stack, codeFrame};
};

export function deleteStack(stack: Stack): void {
  cache.delete(stack);
}

export function symbolicate(stack: Stack): Promise<SymbolicatedStackTrace> {
  let promise = cache.get(stack);
  if (promise == null) {
    promise = symbolicateStackTrace(stack).then(sanitize);
    cache.set(stack, promise);
  }

  return promise;
}
