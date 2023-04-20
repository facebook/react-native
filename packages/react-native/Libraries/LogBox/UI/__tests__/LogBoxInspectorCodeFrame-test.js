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

describe('LogBoxInspectorCodeFrame', () => {
  it('should render null for no code frame', () => {
    const output = render.shallowRender(
      <LogBoxInspectorCodeFrame codeFrame={null} />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render a code frame', () => {
    const output = render.shallowRender(
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

  it('should render a code frame without a location', () => {
    const output = render.shallowRender(
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
