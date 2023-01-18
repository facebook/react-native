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
