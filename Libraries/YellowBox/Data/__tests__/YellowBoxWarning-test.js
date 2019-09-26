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

import type {StackFrame} from '../../../Core/Devtools/parseErrorStack';

jest.mock('../YellowBoxSymbolication');

const YellowBoxSymbolication: {|
  symbolicate: JestMockFn<
    $ReadOnlyArray<Array<StackFrame>>,
    Promise<Array<StackFrame>>,
  >,
|} = (require('../YellowBoxSymbolication'): any);
const YellowBoxWarning = require('../YellowBoxWarning');

const createStack = methodNames =>
  methodNames.map(methodName => ({
    column: null,
    file: 'file://path/to/file.js',
    lineNumber: 1,
    methodName,
  }));

describe('YellowBoxWarning', () => {
  beforeEach(() => {
    jest.resetModules();

    YellowBoxSymbolication.symbolicate.mockImplementation(async stack =>
      createStack(stack.map(frame => `S(${frame.methodName})`)),
    );
  });

  it('starts without a symbolicated stack', () => {
    const warning = new YellowBoxWarning(
      {content: '...', substitutions: []},
      createStack(['A', 'B', 'C']),
    );

    expect(warning.symbolicated).toEqual({
      error: null,
      stack: null,
      status: 'NONE',
    });
  });

  it('updates when symbolication is in progress', () => {
    const warning = new YellowBoxWarning(
      {content: '...', substitutions: []},
      createStack(['A', 'B', 'C']),
    );
    const callback = jest.fn();
    warning.symbolicate(callback);

    expect(callback.mock.calls.length).toBe(1);
    expect(warning.symbolicated).toEqual({
      error: null,
      stack: null,
      status: 'PENDING',
    });
  });

  it('updates when symbolication finishes', () => {
    const warning = new YellowBoxWarning(
      {content: '...', substitutions: []},
      createStack(['A', 'B', 'C']),
    );
    const callback = jest.fn();
    warning.symbolicate(callback);

    jest.runAllTicks();

    expect(callback.mock.calls.length).toBe(2);
    expect(warning.symbolicated).toEqual({
      error: null,
      stack: createStack(['S(A)', 'S(B)', 'S(C)']),
      status: 'COMPLETE',
    });
  });

  it('updates when symbolication fails', () => {
    const error = new Error('...');
    YellowBoxSymbolication.symbolicate.mockImplementation(async stack => {
      throw error;
    });

    const warning = new YellowBoxWarning(
      {content: '...', substitutions: []},
      createStack(['A', 'B', 'C']),
    );
    const callback = jest.fn();
    warning.symbolicate(callback);

    jest.runAllTicks();

    expect(callback.mock.calls.length).toBe(2);
    expect(warning.symbolicated).toEqual({
      error,
      stack: null,
      status: 'FAILED',
    });
  });

  it('does not update aborted requests', () => {
    const warning = new YellowBoxWarning(
      {content: '...', substitutions: []},
      createStack(['A', 'B', 'C']),
    );
    const callback = jest.fn();
    const request = warning.symbolicate(callback);
    request.abort();

    jest.runAllTicks();

    expect(callback.mock.calls.length).toBe(1);
  });
});
