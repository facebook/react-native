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
const LogBoxNotification = require('../LogBoxNotification').default;
const React = require('react');

// Mock child components because we are interested in snapshotting the behavior
// of `LogBoxNotification`, not its children.
jest.mock('../LogBoxButton', () => ({
  __esModule: true,
  default: 'LogBoxButton',
}));
jest.mock('../LogBoxNotificationCountBadge', () => ({
  __esModule: true,
  default: 'LogBoxNotificationCountBadge',
}));
jest.mock('../LogBoxNotificationDismissButton', () => ({
  __esModule: true,
  default: 'LogBoxNotificationDismissButton',
}));
jest.mock('../LogBoxNotificationMessage', () => ({
  __esModule: true,
  default: 'LogBoxNotificationMessage',
}));

const log = new LogBoxLog({
  level: 'warn',
  isComponentError: false,
  message: {
    content: 'Some kind of message',
    substitutions: [],
  },
  stack: [],
  category: 'Some kind of message',
  componentStack: [],
});

describe('LogBoxNotification', () => {
  it('should render log', async () => {
    const output = await render.create(
      <LogBoxNotification
        log={log}
        totalLogCount={1}
        level="warn"
        onPressOpen={() => {}}
        onPressDismiss={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
