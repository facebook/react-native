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

jest.mock('../../../Core/Devtools/symbolicateStackTrace');

const YellowBoxSymbolication = require('../YellowBoxSymbolication');

const symbolicateStackTrace: JestMockFn<
  $ReadOnlyArray<Array<StackFrame>>,
  Promise<Array<StackFrame>>,
> = (require('../../../Core/Devtools/symbolicateStackTrace'): any);

const createStack = methodNames =>
  methodNames.map(methodName => ({
    column: null,
    file: 'file://path/to/file.js',
    lineNumber: 1,
    methodName,
  }));

describe('YellowBoxSymbolication', () => {
  beforeEach(() => {
    jest.resetModules();
    symbolicateStackTrace.mockImplementation(async stack => stack);
  });

  it('symbolicates different stacks', () => {
    YellowBoxSymbolication.symbolicate(createStack(['A', 'B', 'C']));
    YellowBoxSymbolication.symbolicate(createStack(['D', 'E', 'F']));

    expect(symbolicateStackTrace.mock.calls.length).toBe(2);
  });

  it('batch symbolicates equivalent stacks', () => {
    YellowBoxSymbolication.symbolicate(createStack(['A', 'B', 'C']));
    YellowBoxSymbolication.symbolicate(createStack(['A', 'B', 'C']));

    expect(symbolicateStackTrace.mock.calls.length).toBe(1);
  });
});
