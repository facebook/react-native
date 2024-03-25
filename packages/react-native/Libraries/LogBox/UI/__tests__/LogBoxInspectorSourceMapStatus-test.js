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

describe('LogBoxInspectorSourceMapStatus', () => {
  it('should render for failed', () => {
    const output = render.shallowRender(
      <LogBoxInspectorSourceMapStatus onPress={() => {}} status="FAILED" />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render for pending', () => {
    const output = render.shallowRender(
      <LogBoxInspectorSourceMapStatus onPress={() => {}} status="PENDING" />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render null for complete', () => {
    const output = render.shallowRender(
      <LogBoxInspectorSourceMapStatus onPress={() => {}} status="COMPLETE" />,
    );

    expect(output).toMatchSnapshot();
  });
});
