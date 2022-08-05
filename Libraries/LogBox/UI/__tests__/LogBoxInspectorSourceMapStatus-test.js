/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow strict-local
 */

'use strict';

const React = require('react');
const LogBoxInspectorSourceMapStatus =
  require('../LogBoxInspectorSourceMapStatus').default;
const render = require('../../../../jest/renderer');

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
