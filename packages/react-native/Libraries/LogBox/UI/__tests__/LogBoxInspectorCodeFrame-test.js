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
const LogBoxInspectorCodeFrame = require('../LogBoxInspectorCodeFrame').default;
const React = require('react');

// Mock child components because we are interested in snapshotting the behavior
// of `LogBoxInspectorCodeFrame`, not its children.
jest.mock('../../../Components/ScrollView/ScrollView', () => ({
  __esModule: true,
  default: 'ScrollView',
}));
jest.mock('../AnsiHighlight', () => ({
  __esModule: true,
  default: 'Ansi',
}));
jest.mock('../LogBoxButton', () => ({
  __esModule: true,
  default: 'LogBoxButton',
}));
jest.mock('../LogBoxInspectorSection', () => ({
  __esModule: true,
  default: 'LogBoxInspectorSection',
}));

describe('LogBoxInspectorCodeFrame', () => {
  it('should render null for no code frame', async () => {
    const output = await render.create(
      <LogBoxInspectorCodeFrame codeFrame={null} />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render a code frame', async () => {
    const output = await render.create(
      <LogBoxInspectorCodeFrame
        codeFrame={{
          fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
          location: {row: 199, column: 0},
          content: `  197 | });
    198 |
  > 199 | export default CrashReactApp;
        | ^
    200 |`,
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render a code frame without a location', async () => {
    const output = await render.create(
      <LogBoxInspectorCodeFrame
        codeFrame={{
          fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
          location: null,
          content: `  197 | });
    198 |
  > 199 | export default CrashReactApp;
        | ^
    200 |`,
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
