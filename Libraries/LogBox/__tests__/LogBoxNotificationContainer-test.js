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
const {
  _LogBoxInspectorContainer: LogBoxInspectorContainer,
} = require('../LogBoxInspectorContainer');
const LogBoxLog = require('../Data/LogBoxLog').default;
const render = require('../../../jest/renderer');

describe('LogBoxNotificationContainer', () => {
  it('should render inspector with logs, even when disabled', () => {
    const output = render.shallowRender(
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
