/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

jest.mock('../../../Core/Devtools/symbolicateStackTrace');

const LogBoxSymbolication = require('../LogBoxSymbolication');

const symbolicateStackTrace: JestMockFn<
  $ReadOnlyArray<Array<StackFrame>>,
  Promise<Array<StackFrame>>,
> = (require('../../../Core/Devtools/symbolicateStackTrace'): any);

const createStack = (methodNames: Array<string>) =>
  methodNames.map(methodName => ({
    column: null,
    file: 'file://path/to/file.js',
    lineNumber: 1,
    methodName,
  }));

describe('LogBoxSymbolication', () => {
  beforeEach(() => {
    jest.resetModules();
    symbolicateStackTrace.mockImplementation(async stack => stack);
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
