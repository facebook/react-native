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
const LogBoxContainer = require('../LogBoxContainer').default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

describe('LogBoxContainer', () => {
  it('should render null with no logs', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissAll={() => {}}
        logs={[]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest log', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissAll={() => {}}
        logs={[
          new LogBoxLog(
            {
              content: 'Some kind of message',
              substitutions: [],
            },
            [],
            'Some kind of message',
            [],
            false,
          ),
          new LogBoxLog(
            {
              content: 'Some kind of message (latest)',
              substitutions: [],
            },
            [],
            'Some kind of message (latest)',
            [],
            false,
          ),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
