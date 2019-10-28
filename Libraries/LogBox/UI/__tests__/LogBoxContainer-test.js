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
        logs={new Set()}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest warning', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissAll={() => {}}
        logs={
          new Set([
            new LogBoxLog(
              'warn',
              {
                content: 'Some kind of message',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
            new LogBoxLog(
              'warn',
              {
                content: 'Some kind of message (latest)',
                substitutions: [],
              },
              [],
              'Some kind of message (latest)',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest error', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissAll={() => {}}
        logs={
          new Set([
            new LogBoxLog(
              'error',
              {
                content: 'Some kind of message',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
            new LogBoxLog(
              'error',
              {
                content: 'Some kind of message (latest)',
                substitutions: [],
              },
              [],
              'Some kind of message (latest)',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render both an error and warning', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissAll={() => {}}
        logs={
          new Set([
            new LogBoxLog(
              'warn',
              {
                content: 'Some kind of message',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
            new LogBoxLog(
              'error',
              {
                content: 'Some kind of message (latest)',
                substitutions: [],
              },
              [],
              'Some kind of message (latest)',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
