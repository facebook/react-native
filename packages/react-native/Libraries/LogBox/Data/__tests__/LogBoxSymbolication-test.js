/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';

import type {SymbolicatedStackTrace} from '../../../Core/Devtools/symbolicateStackTrace';
import type {StackFrame} from '../../../Core/NativeExceptionsManager';

const LogBoxSymbolication = require('../LogBoxSymbolication');

jest.mock('../../../Core/Devtools/symbolicateStackTrace');

const symbolicateStackTrace: JestMockFn<
  $ReadOnlyArray<Array<StackFrame>>,
  Promise<SymbolicatedStackTrace>,
> = (require('../../../Core/Devtools/symbolicateStackTrace'): any);

const createStack = (methodNames: Array<string>) =>
  methodNames.map((methodName): StackFrame => ({
    column: null,
    file: 'file://path/to/file.js',
    lineNumber: 1,
    methodName,
  }));

describe('LogBoxSymbolication', () => {
  beforeEach(() => {
    jest.resetModules();
    symbolicateStackTrace.mockImplementation(async stack => ({
      stack,
      codeFrame: null,
    }));
  });

  it('symbolicates different stacks', () => {
    LogBoxSymbolication.symbolicate(createStack(['A', 'B', 'C']));
    LogBoxSymbolication.symbolicate(createStack(['D', 'E', 'F']));

    expect(symbolicateStackTrace.mock.calls.length).toBe(2);
  });

  it('batch symbolicates equivalent stacks', () => {
    const stack = createStack(['A', 'B', 'C']);
    LogBoxSymbolication.symbolicate(stack);
    LogBoxSymbolication.symbolicate(stack);

    expect(symbolicateStackTrace.mock.calls.length).toBe(1);
  });
});
