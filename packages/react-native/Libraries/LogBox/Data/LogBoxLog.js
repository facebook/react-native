/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {Stack} from './LogBoxSymbolication';
import type {
  Category,
  CodeFrame,
  ComponentStack,
  ComponentStackType,
  Message,
} from './parseLogBoxLog';

import * as LogBoxSymbolication from './LogBoxSymbolication';

type SymbolicationStatus = 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';

export type LogLevel = 'warn' | 'error' | 'fatal' | 'syntax';

// TODO: once component stacks are fully supported, we can refactor
// ComponentStack to just be Stack and remove these conversions fns.
function convertComponentStateToStack(componentStack: ComponentStack): Stack {
  return componentStack.map(frame => ({
    column: frame?.location?.column,
    file: frame.fileName,
    lineNumber: frame?.location?.row,
    methodName: frame.content,
    collapse: false,
  }));
}

function convertStackToComponentStack(stack: Stack): ComponentStack {
  const componentStack = [];
  for (let i = 0; i < stack.length; i++) {
    const frame = stack[i];
    // NOTE: Skip stack frames missing location.
    if (frame.lineNumber != null && frame.column != null) {
      componentStack.push({
        fileName: frame?.file || '',
        location: {
          row: frame.lineNumber,
          column: frame.column,
        },
        content: frame.methodName,
        collapse: false,
      });
    }
  }
  return componentStack;
}

export type LogBoxLogData = $ReadOnly<{
  level: LogLevel,
  type?: ?string,
  message: Message,
  stack: Stack,
  category: string,
  componentStackType?: ComponentStackType,
  componentStack: ComponentStack,
  codeFrame?: ?CodeFrame,
  isComponentError: boolean,
  extraData?: mixed,
  onNotificationPress?: ?() => void,
}>;

class LogBoxLog {
  message: Message;
  type: ?string;
  category: Category;
  componentStack: ComponentStack;
  componentStackType: ComponentStackType;
  stack: Stack;
  count: number;
  level: LogLevel;
  codeFrame: ?CodeFrame;
  componentCodeFrame: ?CodeFrame;
  isComponentError: boolean;
  extraData: mixed | void;
  symbolicated:
    | $ReadOnly<{error: null, stack: null, status: 'NONE'}>
    | $ReadOnly<{error: null, stack: null, status: 'PENDING'}>
    | $ReadOnly<{error: null, stack: Stack, status: 'COMPLETE'}>
    | $ReadOnly<{error: Error, stack: null, status: 'FAILED'}> = {
    error: null,
    stack: null,
    status: 'NONE',
  };
  symbolicatedComponentStack:
    | $ReadOnly<{error: null, componentStack: null, status: 'NONE'}>
    | $ReadOnly<{error: null, componentStack: null, status: 'PENDING'}>
    | $ReadOnly<{
        error: null,
        componentStack: ComponentStack,
        status: 'COMPLETE',
      }>
    | $ReadOnly<{error: Error, componentStack: null, status: 'FAILED'}> = {
    error: null,
    componentStack: null,
    status: 'NONE',
  };
  onNotificationPress: ?() => void;

  constructor(data: LogBoxLogData) {
    this.level = data.level;
    this.type = data.type;
    this.message = data.message;
    this.stack = data.stack;
    this.category = data.category;
    this.componentStack = data.componentStack;
    this.componentStackType = data.componentStackType || 'legacy';
    this.codeFrame = data.codeFrame;
    this.isComponentError = data.isComponentError;
    this.extraData = data.extraData;
    this.count = 1;
    this.onNotificationPress = data.onNotificationPress;
  }

  incrementCount(): void {
    this.count += 1;
  }

  getAvailableStack(): Stack {
    return this.symbolicated.status === 'COMPLETE'
      ? this.symbolicated.stack
      : this.stack;
  }

  getAvailableComponentStack(): ComponentStack {
    if (this.componentStackType === 'legacy') {
      return this.componentStack;
    }
    return this.symbolicatedComponentStack.status === 'COMPLETE'
      ? this.symbolicatedComponentStack.componentStack
      : this.componentStack;
  }

  retrySymbolicate(callback?: (status: SymbolicationStatus) => void): void {
    let retry = false;
    if (this.symbolicated.status !== 'COMPLETE') {
      LogBoxSymbolication.deleteStack(this.stack);
      retry = true;
    }
    if (this.symbolicatedComponentStack.status !== 'COMPLETE') {
      LogBoxSymbolication.deleteStack(
        convertComponentStateToStack(this.componentStack),
      );
      retry = true;
    }
    if (retry) {
      this.handleSymbolicate(callback);
    }
  }

  symbolicate(callback?: (status: SymbolicationStatus) => void): void {
    if (this.symbolicated.status === 'NONE') {
      this.handleSymbolicate(callback);
    }
  }

  handleSymbolicate(callback?: (status: SymbolicationStatus) => void): void {
    if (
      this.symbolicated.status !== 'PENDING' &&
      this.symbolicated.status !== 'COMPLETE'
    ) {
      this.updateStatus(null, null, null, callback);
      LogBoxSymbolication.symbolicate(this.stack, this.extraData).then(
        data => {
          this.updateStatus(null, data?.stack, data?.codeFrame, callback);
        },
        error => {
          this.updateStatus(error, null, null, callback);
        },
      );
    }
    if (
      this.componentStack != null &&
      this.componentStackType === 'stack' &&
      this.symbolicatedComponentStack.status !== 'PENDING' &&
      this.symbolicatedComponentStack.status !== 'COMPLETE'
    ) {
      this.updateComponentStackStatus(null, null, null, callback);
      const componentStackFrames = convertComponentStateToStack(
        this.componentStack,
      );
      LogBoxSymbolication.symbolicate(componentStackFrames, []).then(
        data => {
          this.updateComponentStackStatus(
            null,
            convertStackToComponentStack(data.stack),
            data?.codeFrame,
            callback,
          );
        },
        error => {
          this.updateComponentStackStatus(error, null, null, callback);
        },
      );
    }
  }

  updateStatus(
    error: ?Error,
    stack: ?Stack,
    codeFrame: ?CodeFrame,
    callback?: (status: SymbolicationStatus) => void,
  ): void {
    const lastStatus = this.symbolicated.status;
    if (error != null) {
      this.symbolicated = {
        error,
        stack: null,
        status: 'FAILED',
      };
    } else if (stack != null) {
      if (codeFrame) {
        this.codeFrame = codeFrame;
      }

      this.symbolicated = {
        error: null,
        stack,
        status: 'COMPLETE',
      };
    } else {
      this.symbolicated = {
        error: null,
        stack: null,
        status: 'PENDING',
      };
    }

    if (callback && lastStatus !== this.symbolicated.status) {
      callback(this.symbolicated.status);
    }
  }

  updateComponentStackStatus(
    error: ?Error,
    componentStack: ?ComponentStack,
    codeFrame: ?CodeFrame,
    callback?: (status: SymbolicationStatus) => void,
  ): void {
    const lastStatus = this.symbolicatedComponentStack.status;
    if (error != null) {
      this.symbolicatedComponentStack = {
        error,
        componentStack: null,
        status: 'FAILED',
      };
    } else if (componentStack != null) {
      if (codeFrame) {
        this.componentCodeFrame = codeFrame;
      }
      this.symbolicatedComponentStack = {
        error: null,
        componentStack,
        status: 'COMPLETE',
      };
    } else {
      this.symbolicatedComponentStack = {
        error: null,
        componentStack: null,
        status: 'PENDING',
      };
    }

    if (callback && lastStatus !== this.symbolicatedComponentStack.status) {
      callback(this.symbolicatedComponentStack.status);
    }
  }
}

export default LogBoxLog;
