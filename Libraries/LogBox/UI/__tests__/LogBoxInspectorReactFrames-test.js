/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow strict-local
 */

'use strict';

const React = require('react');
const LogBoxInspectorReactFrames =
  require('../LogBoxInspectorReactFrames').default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorReactFrames', () => {
  it('should render null for no componentStack frames', () => {
    const output = render.shallowRender(
      <LogBoxInspectorReactFrames
        log={
          new LogBoxLog({
            level: 'warn',
            isComponentError: false,
            message: {
              content: 'Some kind of message',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [],
          })
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render componentStack frames without full path pressable', () => {
    const output = render.shallowRender(
      <LogBoxInspectorReactFrames
        log={
          new LogBoxLog({
            level: 'warn',
            isComponentError: false,
            message: {
              content: 'Some kind of message',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [
              {
                content: 'MyComponent',
                fileName: 'MyComponentFile.js',
                location: {
                  row: 1,
                  column: -1,
                },
              },
            ],
          })
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render componentStack frames with full path pressable', () => {
    const output = render.shallowRender(
      <LogBoxInspectorReactFrames
        log={
          new LogBoxLog({
            level: 'warn',
            isComponentError: false,
            message: {
              content: 'Some kind of message',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [
              {
                content: 'MyComponent',
                fileName: '/path/to/MyComponentFile.js',
                location: {
                  row: 1,
                  column: -1,
                },
              },
            ],
          })
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render componentStack frames with parent folder of index.js', () => {
    const output = render.shallowRender(
      <LogBoxInspectorReactFrames
        log={
          new LogBoxLog({
            level: 'warn',
            isComponentError: false,
            message: {
              content: 'Some kind of message',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [
              {
                content: 'MyComponent',
                fileName: '/path/to/index.js',
                location: {
                  row: 1,
                  column: -1,
                },
              },
            ],
          })
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render componentStack frames with more than 3 stacks', () => {
    const output = render.shallowRender(
      <LogBoxInspectorReactFrames
        log={
          new LogBoxLog({
            level: 'warn',
            isComponentError: false,
            message: {
              content: 'Some kind of message',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [
              {
                content: 'MyComponent',
                fileName: '/path/to/index.js',
                location: {
                  row: 1,
                  column: -1,
                },
              },
              {
                content: 'MyComponent2',
                fileName: '/path/to/index2.js',
                location: {
                  row: 1,
                  column: -1,
                },
              },
              {
                content: 'MyComponent3',
                fileName: '/path/to/index3.js',
                location: {
                  row: 1,
                  column: -1,
                },
              },
              {
                content: 'MyComponent4',
                fileName: '/path/to/index4.js',
                location: {
                  row: 1,
                  column: -1,
                },
              },
            ],
          })
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
