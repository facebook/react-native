/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const {
  _LogBoxNotificationContainer: LogBoxNotificationContainer,
} = require('../LogBoxNotificationContainer');
const LogBoxLog = require('../Data/LogBoxLog').default;
const render = require('../../../jest/renderer');

describe('LogBoxNotificationContainer', () => {
  it('should render null with no logs', () => {
    const output = render.shallowRender(
      <LogBoxNotificationContainer selectedLogIndex={-1} logs={[]} />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render null with no selected log and disabled', () => {
    const output = render.shallowRender(
      <LogBoxNotificationContainer
        isDisabled
        selectedLogIndex={-1}
        logs={[
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
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest warning notification', () => {
    const output = render.shallowRender(
      <LogBoxNotificationContainer
        selectedLogIndex={-1}
        logs={[
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
          }),
          new LogBoxLog({
            level: 'warn',
            isComponentError: false,
            message: {
              content: 'Some kind of message (latest)',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message (latest)',
            componentStack: [],
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest error notification', () => {
    const output = render.shallowRender(
      <LogBoxNotificationContainer
        selectedLogIndex={-1}
        logs={[
          new LogBoxLog({
            level: 'error',
            isComponentError: false,
            message: {
              content: 'Some kind of message',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [],
          }),
          new LogBoxLog({
            level: 'error',
            isComponentError: false,
            message: {
              content: 'Some kind of message (latest)',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message (latest)',
            componentStack: [],
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render both an error and warning notification', () => {
    const output = render.shallowRender(
      <LogBoxNotificationContainer
        selectedLogIndex={-1}
        logs={[
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
          }),
          new LogBoxLog({
            level: 'error',
            isComponentError: false,
            message: {
              content: 'Some kind of message (latest)',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message (latest)',
            componentStack: [],
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render selected fatal error even when disabled', () => {
    const output = render.shallowRender(
      <LogBoxNotificationContainer
        isDisabled
        selectedLogIndex={0}
        logs={[
          new LogBoxLog({
            level: 'fatal',
            isComponentError: false,
            message: {
              content: 'Should be selected',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [],
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render selected syntax error even when disabled', () => {
    const output = render.shallowRender(
      <LogBoxNotificationContainer
        isDisabled
        selectedLogIndex={0}
        logs={[
          new LogBoxLog({
            level: 'syntax',
            isComponentError: false,
            message: {
              content: 'Should be selected',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of syntax error message',
            componentStack: [],
            codeFrame: {
              fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
              location: {row: 199, column: 0},
              content: `  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
            },
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
