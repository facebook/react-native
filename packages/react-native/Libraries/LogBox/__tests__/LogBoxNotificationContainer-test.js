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
  _LogBoxInspectorContainer: LogBoxInspectorContainer,
} = require('../LogBoxInspectorContainer');
const React = require('react');

// Mock `LogBoxInspector` because we are interested in snapshotting the behavior
// of `LogBoxNotificationContainer`, not `LogBoxInspector`.
jest.mock('../UI/LogBoxInspector', () => ({
  __esModule: true,
  default: 'LogBoxInspector',
}));

describe('LogBoxNotificationContainer', () => {
  it('should render inspector with logs, even when disabled', async () => {
    const output = await render.create(
      <LogBoxInspectorContainer
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
});
