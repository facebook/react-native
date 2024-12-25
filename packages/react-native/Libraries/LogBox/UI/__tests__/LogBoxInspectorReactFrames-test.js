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
const LogBoxLog = require('../../Data/LogBoxLog').default;
const LogBoxInspectorReactFrames =
  require('../LogBoxInspectorReactFrames').default;
const React = require('react');

// Mock child components because we are interested in snapshotting the behavior
// of `LogBoxInspectorReactFrames`, not its children.
jest.mock('../LogBoxButton', () => ({
  __esModule: true,
  default: 'LogBoxButton',
}));
jest.mock('../LogBoxInspectorSection', () => ({
  __esModule: true,
  default: 'LogBoxInspectorSection',
}));

describe('LogBoxInspectorReactFrames', () => {
  it('should render null for no componentStack frames', async () => {
    const output = await render.create(
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

  it('should render componentStack frames without full path pressable', async () => {
    const output = await render.create(
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

  it('should render componentStack frames with full path pressable', async () => {
    const output = await render.create(
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

  it('should render componentStack frames with parent folder of index.js', async () => {
    const output = await render.create(
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

  it('should render componentStack frames with more than 3 stacks', async () => {
    const output = await render.create(
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
