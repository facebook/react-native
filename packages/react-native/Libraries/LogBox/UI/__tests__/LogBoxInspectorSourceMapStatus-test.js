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
const LogBoxInspectorSourceMapStatus =
  require('../LogBoxInspectorSourceMapStatus').default;
const React = require('react');

// Mock `LogBoxButton` because we are interested in snapshotting the behavior
// of `LogBoxInspectorSourceMapStatus`, not `LogBoxButton`.
jest.mock('../LogBoxButton', () => ({
  __esModule: true,
  default: 'LogBoxButton',
}));

describe('LogBoxInspectorSourceMapStatus', () => {
  it('should render for failed', async () => {
    const output = await render.create(
      <LogBoxInspectorSourceMapStatus onPress={() => {}} status="FAILED" />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render for pending', async () => {
    const output = await render.create(
      <LogBoxInspectorSourceMapStatus onPress={() => {}} status="PENDING" />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render null for complete', async () => {
    const output = await render.create(
      <LogBoxInspectorSourceMapStatus onPress={() => {}} status="COMPLETE" />,
    );

    expect(output).toMatchSnapshot();
  });
});
