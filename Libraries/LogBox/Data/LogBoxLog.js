/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import * as LogBoxSymbolication from './LogBoxSymbolication';

import type {
  Category,
  Message,
  ComponentStack,
  CodeFrame,
} from './parseLogBoxLog';
import type {Stack} from './LogBoxSymbolication';

export type LogLevel = 'warn' | 'error' | 'fatal' | 'syntax';

export type SymbolicationRequest = $ReadOnly<{|
  abort: () => void,
|}>;

class LogBoxLog {
  message: Message;
  category: Category;
  componentStack: ComponentStack;
  stack: Stack;
  count: number;
  level: LogLevel;
  codeFrame: ?CodeFrame;
  symbolicated:
    | $ReadOnly<{|error: null, stack: null, status: 'NONE'|}>
    | $ReadOnly<{|error: null, stack: null, status: 'PENDING'|}>
    | $ReadOnly<{|error: null, stack: Stack, status: 'COMPLETE'|}>
    | $ReadOnly<{|error: Error, stack: null, status: 'FAILED'|}> = {
    error: null,
    stack: null,
    status: 'NONE',
  };

  constructor(
    level: LogLevel,
    message: Message,
    stack: Stack,
    category: string,
    componentStack: ComponentStack,
    codeFrame?: ?CodeFrame,
  ) {
    this.level = level;
    this.message = message;
    this.stack = stack;
    this.category = category;
    this.componentStack = componentStack;
    this.codeFrame = codeFrame;
    this.count = 1;
  }

  incrementCount(): void {
    this.count += 1;
  }

  getAvailableStack(): Stack {
    return this.symbolicated.status === 'COMPLETE'
      ? this.symbolicated.stack
      : this.stack;
  }

  retrySymbolicate(callback?: () => void): SymbolicationRequest {
    if (this.symbolicated.status !== 'COMPLETE') {
      LogBoxSymbolication.deleteStack(this.stack);
    }
    return this.symbolicate(callback);
  }

  symbolicate(callback?: () => void): SymbolicationRequest {
    let aborted = false;

    if (this.symbolicated.status !== 'COMPLETE') {
      const updateStatus = (error: ?Error, stack: ?Stack): void => {
        if (error != null) {
          this.symbolicated = {error, stack: null, status: 'FAILED'};
        } else if (stack != null) {
          this.symbolicated = {error: null, stack, status: 'COMPLETE'};
        } else {
          this.symbolicated = {error: null, stack: null, status: 'PENDING'};
        }
        if (!aborted) {
          if (callback != null) {
            callback();
          }
        }
      };

      updateStatus(null, null);
      LogBoxSymbolication.symbolicate(this.stack).then(
        stack => {
          updateStatus(null, stack);
        },
        error => {
          updateStatus(error, null);
        },
      );
    }

    return {
      abort(): void {
        aborted = true;
      },
    };
  }
}

export default LogBoxLog;
