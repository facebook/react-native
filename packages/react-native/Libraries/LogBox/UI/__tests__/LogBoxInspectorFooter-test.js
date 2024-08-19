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
const LogBoxInspectorFooter = require('../LogBoxInspectorFooter').default;
const React = require('react');

// Mock `LogBoxInspectorFooterButton` because we are interested in snapshotting
// the behavior of `LogBoxInspectorFooter`, not `LogBoxInspectorFooterButton`.
jest.mock('../LogBoxInspectorFooterButton', () => ({
  __esModule: true,
  default: 'LogBoxInspectorFooterButton',
}));

describe('LogBoxInspectorFooter', () => {
  it('should render two buttons for warning', async () => {
    const output = await render.create(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render two buttons for error', async () => {
    const output = await render.create(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="error"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render two buttons for fatal', async () => {
    const output = await render.create(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="fatal"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render no buttons and a message for syntax error', async () => {
    const output = await render.create(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="syntax"
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
