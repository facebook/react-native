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

const render = require('../../../jest/renderer');
const LogBoxLog = require('../Data/LogBoxLog').default;
const {
  _LogBoxNotificationContainer: LogBoxNotificationContainer,
} = require('../LogBoxNotificationContainer');
const React = require('react');

// Mock `LogBoxLogNotification` because we are interested in snapshotting the
// behavior of `LogBoxNotificationContainer`, not `LogBoxLogNotification`.
jest.mock('../UI/LogBoxNotification', () => ({
  __esModule: true,
  default: 'LogBoxLogNotification',
}));

describe('LogBoxNotificationContainer', () => {
  it('should render null with no logs', async () => {
    const output = await render.create(
      <LogBoxNotificationContainer selectedLogIndex={-1} logs={[]} />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render null with no selected log and disabled', async () => {
    const output = await render.create(
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

  it('should render the latest warning notification', async () => {
    const output = await render.create(
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

  it('should render the latest error notification', async () => {
    const output = await render.create(
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

  it('should render both an error and warning notification', async () => {
    const output = await render.create(
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

  it('should render selected fatal error even when disabled', async () => {
    const output = await render.create(
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

  it('should render selected syntax error even when disabled', async () => {
    const output = await render.create(
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
