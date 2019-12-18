/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
const LogBoxInspectorHeader = require('../LogBoxInspectorHeader').default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorHeader', () => {
  it('should render no buttons for one total', () => {
    const output = render.shallowRender(
      <LogBoxInspectorHeader
        onSelectIndex={() => {}}
        selectedIndex={0}
        total={1}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render both buttons for two total', () => {
    const output = render.shallowRender(
      <LogBoxInspectorHeader
        onSelectIndex={() => {}}
        selectedIndex={1}
        total={2}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render two buttons for three or more total', () => {
    const output = render.shallowRender(
      <LogBoxInspectorHeader
        onSelectIndex={() => {}}
        selectedIndex={0}
        total={1}
        level="warn"
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render syntax error header', () => {
    const output = render.shallowRender(
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
