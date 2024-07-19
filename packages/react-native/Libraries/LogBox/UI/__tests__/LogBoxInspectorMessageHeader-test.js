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
const LogBoxInspectorMessageHeader =
  require('../LogBoxInspectorMessageHeader').default;
const React = require('react');

// Mock `LogBoxMessage` because we are interested in snapshotting the
// behavior of `LogBoxInspectorMessageHeader`, not `LogBoxMessage`.
jest.mock('../LogBoxMessage', () => ({
  __esModule: true,
  default: 'LogBoxMessage',
}));

describe('LogBoxInspectorMessageHeader', () => {
  it('should render error', async () => {
    const output = await render.create(
      <LogBoxInspectorMessageHeader
        title="Error"
        level="error"
        collapsed={false}
        message={{
          content: 'Some error message',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render fatal', async () => {
    const output = await render.create(
      <LogBoxInspectorMessageHeader
        title="Fatal Error"
        level="fatal"
        collapsed={false}
        message={{
          content: 'Some fatal message',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render syntax error', async () => {
    const output = await render.create(
      <LogBoxInspectorMessageHeader
        title="Syntax Error"
        level="syntax"
        collapsed={false}
        message={{
          content: 'Some syntax error message',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should not render See More button for short content', async () => {
    const output = await render.create(
      <LogBoxInspectorMessageHeader
        title="Warning"
        level="warn"
        collapsed={false}
        message={{
          content: 'Short',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should not render "See More" if expanded', async () => {
    const output = await render.create(
      <LogBoxInspectorMessageHeader
        title="Warning"
        level="warn"
        collapsed={false}
        message={{content: '#'.repeat(301), substitutions: []}}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render "See More" if collapsed', async () => {
    const output = await render.create(
      <LogBoxInspectorMessageHeader
        title="Warning"
        level="warn"
        collapsed={true}
        message={{
          content: '#'.repeat(301),
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
