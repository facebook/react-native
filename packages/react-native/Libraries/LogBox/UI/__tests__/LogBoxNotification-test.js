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
const LogBoxNotification = require('../LogBoxNotification').default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

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
  it('should render log', () => {
    const output = render.shallowRender(
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
