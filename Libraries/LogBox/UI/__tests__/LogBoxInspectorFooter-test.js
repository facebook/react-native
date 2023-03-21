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

describe('LogBoxInspectorFooter', () => {
  it('should render two buttons for warning', () => {
    const output = render.shallowRender(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render two buttons for error', () => {
    const output = render.shallowRender(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="error"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render two buttons for fatal', () => {
    const output = render.shallowRender(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="fatal"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render no buttons and a message for syntax error', () => {
    const output = render.shallowRender(
      <LogBoxInspectorFooter
        onMinimize={() => {}}
        onDismiss={() => {}}
        level="syntax"
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
