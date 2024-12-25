/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const render = require('../../../../jest/renderer');
const LogBoxInspectorStackFrame =
  require('../LogBoxInspectorStackFrame').default;
const React = require('react');

// Mock `LogBoxButton` because we are interested in snapshotting the behavior
// of `LogBoxInspectorStackFrame`, not `LogBoxButton`.
jest.mock('../LogBoxButton', () => ({
  __esModule: true,
  default: 'LogBoxButton',
}));

describe('LogBoxInspectorStackFrame', () => {
  it('should render stack frame', async () => {
    const output = await render.create(
      <LogBoxInspectorStackFrame
        onPress={() => {}}
        frame={{
          column: 1,
          file: 'app.js',
          lineNumber: 1,
          methodName: 'foo',
          collapse: false,
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render stack frame without press feedback', async () => {
    const output = await render.create(
      <LogBoxInspectorStackFrame
        frame={{
          column: 1,
          file: 'app.js',
          lineNumber: 1,
          methodName: 'foo',
          collapse: false,
        }}
      />,
    );

    // Both button backgrounds should be transparent
    expect(output).toMatchSnapshot();
  });

  it('should render collapsed stack frame with dimmed text', async () => {
    const output = await render.create(
      <LogBoxInspectorStackFrame
        onPress={() => {}}
        frame={{
          column: 1,
          file: 'app.js',
          lineNumber: 1,
          methodName: 'foo',
          collapse: true,
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
