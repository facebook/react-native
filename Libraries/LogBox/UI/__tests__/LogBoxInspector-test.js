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
const LogBoxInspector = require('../LogBoxInspector').default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

const logs = [
  new LogBoxLog(
    'warn',
    {
      content: 'Some kind of message (first)',
      substitutions: [],
    },
    [],
    'Some kind of message (first)',
    [],
  ),
  new LogBoxLog(
    'warn',
    {
      content: 'Some kind of message (second)',
      substitutions: [],
    },
    [],
    'Some kind of message (second)',
    [],
  ),
];

describe('LogBoxContainer', () => {
  it('should render null with no logs', () => {
    const output = render.shallowRender(
      <LogBoxInspector
        onDismiss={() => {}}
        onMinimize={() => {}}
        onChangeSelectedIndex={() => {}}
        logs={[]}
        selectedIndex={0}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render first log with selectedIndex 0', () => {
    const output = render.shallowRender(
      <LogBoxInspector
        onDismiss={() => {}}
        onMinimize={() => {}}
        onChangeSelectedIndex={() => {}}
        logs={logs}
        selectedIndex={0}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render second log with selectedIndex 1', () => {
    const output = render.shallowRender(
      <LogBoxInspector
        onDismiss={() => {}}
        onMinimize={() => {}}
        onChangeSelectedIndex={() => {}}
        logs={logs}
        selectedIndex={1}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
