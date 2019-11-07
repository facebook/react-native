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

jest.mock('../LogBoxSymbolication', () => {
  return {__esModule: true, symbolicate: jest.fn(), deleteStack: jest.fn()};
});

function getLogBoxLog() {
  return new (require('../LogBoxLog')).default(
    'warn',
    {content: '...', substitutions: []},
    createStack(['A', 'B', 'C']),
    'Message category...',
    [{component: 'LogBoxLog', location: 'LogBoxLog.js:1'}],
    {
      fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
      location: {row: 199, column: 0},
      content: '<code frame>',
    },
  );
}

function getLogBoxSymbolication(): {|
  symbolicate: JestMockFn<
    $ReadOnlyArray<Array<StackFrame>>,
    Promise<Array<StackFrame>>,
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

    getLogBoxSymbolication().symbolicate.mockImplementation(async stack =>
      createStack(stack.map(frame => `S(${frame.methodName})`)),
    );
  });

  it('creates a LogBoxLog object', () => {
    const log = getLogBoxLog();

    expect(log.level).toEqual('warn');
    expect(log.message).toEqual({content: '...', substitutions: []});
    expect(log.stack).toEqual(createStack(['A', 'B', 'C']));
    expect(log.category).toEqual('Message category...');
    expect(log.componentStack).toEqual([
      {component: 'LogBoxLog', location: 'LogBoxLog.js:1'},
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

    expect(callback.mock.calls.length).toBe(1);
    expect(log.symbolicated).toEqual({
      error: null,
      stack: null,
      status: 'PENDING',
    });
  });

  it('updates when symbolication finishes', () => {
    const log = getLogBoxLog();

    const callback = jest.fn();
    log.symbolicate(callback);

    jest.runAllTicks();

    expect(callback.mock.calls.length).toBe(2);
    expect(log.symbolicated).toEqual({
      error: null,
      stack: createStack(['S(A)', 'S(B)', 'S(C)']),
      status: 'COMPLETE',
    });
  });

  it('updates when symbolication fails', () => {
    const error = new Error('...');
    getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
      throw error;
    });

    const log = getLogBoxLog();

    const callback = jest.fn();
    log.symbolicate(callback);

    jest.runAllTicks();

    expect(callback.mock.calls.length).toBe(2);
    expect(log.symbolicated).toEqual({
      error,
      stack: null,
      status: 'FAILED',
    });
  });

  it('does not update aborted requests', () => {
    const log = getLogBoxLog();

    const callback = jest.fn();
    const request = log.symbolicate(callback);
    request.abort();

    jest.runAllTicks();

    expect(callback.mock.calls.length).toBe(1);
  });
});
