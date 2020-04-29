/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow
 */

'use strict';

import type {StackFrame} from '../../../Core/NativeExceptionsManager';
import type {SymbolicatedStackTrace} from '../../../Core/Devtools/symbolicateStackTrace';

jest.mock('../LogBoxSymbolication', () => {
  return {__esModule: true, symbolicate: jest.fn(), deleteStack: jest.fn()};
});

function getLogBoxLog() {
  return new (require('../LogBoxLog')).default({
    level: 'warn',
    isComponentError: false,
    message: {content: '...', substitutions: []},
    stack: createStack(['A', 'B', 'C']),
    category: 'Message category...',
    componentStack: [
      {
        content: 'LogBoxLog',
        fileName: 'LogBoxLog.js',
        location: {column: -1, row: 1},
      },
    ],
    codeFrame: {
      fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
      location: {row: 199, column: 0},
      content: '<code frame>',
    },
  });
}

function getLogBoxSymbolication(): {|
  symbolicate: JestMockFn<
    $ReadOnlyArray<Array<StackFrame>>,
    Promise<SymbolicatedStackTrace>,
  >,
|} {
  return (require('../LogBoxSymbolication'): any);
}

const createStack = methodNames =>
  methodNames.map(methodName => ({
    column: null,
    file: 'file://path/to/file.js',
    lineNumber: 1,
    methodName,
  }));

describe('LogBoxLog', () => {
  beforeEach(() => {
    jest.resetModules();

    getLogBoxSymbolication().symbolicate.mockImplementation(async stack => ({
      stack: createStack(stack.map(frame => `S(${frame.methodName})`)),
      codeFrame: null,
    }));
  });

  it('creates a LogBoxLog object', () => {
    const log = getLogBoxLog();

    expect(log.level).toEqual('warn');
    expect(log.message).toEqual({content: '...', substitutions: []});
    expect(log.stack).toEqual(createStack(['A', 'B', 'C']));
    expect(log.category).toEqual('Message category...');
    expect(log.componentStack).toEqual([
      {
        content: 'LogBoxLog',
        fileName: 'LogBoxLog.js',
        location: {column: -1, row: 1},
      },
    ]);
    expect(log.codeFrame).toEqual({
      fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
      location: {row: 199, column: 0},
      content: '<code frame>',
    });
  });

  it('increments LogBoxLog count', () => {
    const log = getLogBoxLog();

    expect(log.count).toEqual(1);

    log.incrementCount();

    expect(log.count).toEqual(2);
  });

  it('starts without a symbolicated stack', () => {
    const log = getLogBoxLog();

    expect(log.symbolicated).toEqual({
      error: null,
      stack: null,
      status: 'NONE',
    });
  });

  it('updates when symbolication is in progress', () => {
    const log = getLogBoxLog();

    const callback = jest.fn();
    log.symbolicate(callback);

    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith('PENDING');
    expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(1);
    expect(log.symbolicated).toEqual({
      error: null,
      stack: null,
      status: 'PENDING',
    });

    // Symbolicating while pending should not make more requests.
    callback.mockClear();
    getLogBoxSymbolication().symbolicate.mockClear();

    log.symbolicate(callback);
    expect(callback).not.toBeCalled();
    expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
  });

  it('updates when symbolication finishes', () => {
    const log = getLogBoxLog();

    const callback = jest.fn();
    log.symbolicate(callback);
    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith('PENDING');
    expect(getLogBoxSymbolication().symbolicate).toBeCalled();

    jest.runAllTicks();

    expect(callback).toBeCalledTimes(2);
    expect(callback).toBeCalledWith('COMPLETE');
    expect(log.symbolicated).toEqual({
      error: null,
      stack: createStack(['S(A)', 'S(B)', 'S(C)']),
      status: 'COMPLETE',
    });

    // Do not symbolicate again.
    callback.mockClear();
    getLogBoxSymbolication().symbolicate.mockClear();

    log.symbolicate(callback);
    jest.runAllTicks();

    expect(callback).toBeCalledTimes(0);
    expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
  });

  it('updates when symbolication fails', () => {
    const error = new Error('...');
    getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
      throw error;
    });

    const log = getLogBoxLog();

    const callback = jest.fn();
    log.symbolicate(callback);
    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith('PENDING');
    expect(getLogBoxSymbolication().symbolicate).toBeCalled();

    jest.runAllTicks();

    expect(callback).toBeCalledTimes(2);
    expect(callback).toBeCalledWith('FAILED');
    expect(log.symbolicated).toEqual({
      error,
      stack: null,
      status: 'FAILED',
    });

    // Do not symbolicate again, retry if needed.
    callback.mockClear();
    getLogBoxSymbolication().symbolicate.mockClear();

    log.symbolicate(callback);
    jest.runAllTicks();

    expect(callback).toBeCalledTimes(0);
    expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
  });

  it('retry updates when symbolication is in progress', () => {
    const log = getLogBoxLog();

    const callback = jest.fn();
    log.retrySymbolicate(callback);

    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith('PENDING');
    expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(1);
    expect(log.symbolicated).toEqual({
      error: null,
      stack: null,
      status: 'PENDING',
    });

    // Symbolicating while pending should not make more requests.
    callback.mockClear();
    getLogBoxSymbolication().symbolicate.mockClear();

    log.symbolicate(callback);
    expect(callback).not.toBeCalled();
    expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
  });

  it('retry updates when symbolication finishes', () => {
    const log = getLogBoxLog();

    const callback = jest.fn();
    log.retrySymbolicate(callback);
    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith('PENDING');
    expect(getLogBoxSymbolication().symbolicate).toBeCalled();

    jest.runAllTicks();

    expect(callback).toBeCalledTimes(2);
    expect(callback).toBeCalledWith('COMPLETE');
    expect(log.symbolicated).toEqual({
      error: null,
      stack: createStack(['S(A)', 'S(B)', 'S(C)']),
      status: 'COMPLETE',
    });

    // Do not symbolicate again
    callback.mockClear();
    getLogBoxSymbolication().symbolicate.mockClear();

    log.retrySymbolicate(callback);
    jest.runAllTicks();

    expect(callback).toBeCalledTimes(0);
    expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
  });

  it('retry updates when symbolication fails', () => {
    const error = new Error('...');
    getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
      throw error;
    });

    const log = getLogBoxLog();

    const callback = jest.fn();
    log.retrySymbolicate(callback);
    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith('PENDING');
    expect(getLogBoxSymbolication().symbolicate).toBeCalled();

    jest.runAllTicks();

    expect(callback).toBeCalledTimes(2);
    expect(callback).toBeCalledWith('FAILED');
    expect(log.symbolicated).toEqual({
      error,
      stack: null,
      status: 'FAILED',
    });

    // Retry to symbolicate again.
    callback.mockClear();
    getLogBoxSymbolication().symbolicate.mockClear();
    getLogBoxSymbolication().symbolicate.mockImplementation(async stack => ({
      stack: createStack(stack.map(frame => `S(${frame.methodName})`)),
      codeFrame: null,
    }));

    log.retrySymbolicate(callback);

    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith('PENDING');
    expect(getLogBoxSymbolication().symbolicate).toBeCalled();

    jest.runAllTicks();

    expect(callback).toBeCalledTimes(2);
    expect(callback).toBeCalledWith('COMPLETE');
    expect(log.symbolicated).toEqual({
      error: null,
      stack: createStack(['S(A)', 'S(B)', 'S(C)']),
      status: 'COMPLETE',
    });
  });
});
