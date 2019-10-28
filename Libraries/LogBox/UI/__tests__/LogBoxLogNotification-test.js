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
const LogBoxLogNotification = require('../LogBoxLogNotification').default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

const log = new LogBoxLog(
  'warn',
  {
    content: 'Some kind of message',
    substitutions: [],
  },
  [],
  'Some kind of message',
  [],
);

describe('LogBoxLogNotification', () => {
  it('should render log', () => {
    const output = render.shallowRender(
      <LogBoxLogNotification
        log={log}
        totalLogCount={1}
        level="warn"
        onPressOpen={() => {}}
        onPressList={() => {}}
        onPressDismiss={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
