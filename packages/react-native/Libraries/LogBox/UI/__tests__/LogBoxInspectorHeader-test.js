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
const LogBoxInspectorHeader = require('../LogBoxInspectorHeader').default;
const React = require('react');

// Mock `LogBoxInspectorHeaderButton` because we are interested in snapshotting
// the behavior of `LogBoxInspectorHeader`, not `LogBoxInspectorHeaderButton`.
jest.mock('../LogBoxInspectorHeaderButton', () => ({
  __esModule: true,
  default: 'LogBoxInspectorHeaderButton',
}));

describe('LogBoxInspectorHeader', () => {
  it('should render no buttons for one total', async () => {
    const output = await render.create(
      <LogBoxInspectorHeader
        onSelectIndex={() => {}}
        selectedIndex={0}
        total={1}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render both buttons for two total', async () => {
    const output = await render.create(
      <LogBoxInspectorHeader
        onSelectIndex={() => {}}
        selectedIndex={1}
        total={2}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render two buttons for three or more total', async () => {
    const output = await render.create(
      <LogBoxInspectorHeader
        onSelectIndex={() => {}}
        selectedIndex={0}
        total={1}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render syntax error header', async () => {
    const output = await render.create(
      <LogBoxInspectorHeader
        onSelectIndex={() => {}}
        selectedIndex={0}
        total={1}
        level="syntax"
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
