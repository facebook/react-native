/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow
 */

'use strict';

const React = require('react');
const LogBoxInspectorReactFrames = require('../LogBoxInspectorReactFrames')
  .default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorReactFrames', () => {
  it('should render null for no componentStack frames', () => {
    const output = render.shallowRender(
      <LogBoxInspectorReactFrames
        log={
          new LogBoxLog(
            'warn',
            {
              content: 'Some kind of message',
              substitutions: [],
            },
            [],
            'Some kind of message',
            [],
          )
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render componentStack frames', () => {
    const output = render.shallowRender(
      <LogBoxInspectorReactFrames
        log={
          new LogBoxLog(
            'warn',
            {
              content: 'Some kind of message',
              substitutions: [],
            },
            [],
            'Some kind of message',
            [
              {
                component: 'MyComponent',
                location: 'MyComponentFile.js:1',
              },
            ],
          )
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
